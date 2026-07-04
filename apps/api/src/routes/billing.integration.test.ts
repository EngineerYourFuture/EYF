import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";

/**
 * Route-level integration test for the Razorpay webhook — the real money path,
 * through HTTP + signature verification + the DB. Skips cleanly when no
 * DATABASE_URL is available (so the pure-unit `pnpm test` and DB-less CI still
 * pass); runs locally and in CI once a Postgres service is present.
 */
const WEBHOOK_SECRET = "whsec_test_integration_0123456789abcdef";
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET; // set before the app (env.ts) is imported

const hasDb = !!process.env.DATABASE_URL;
const EVENT_IDS = ["evt_int_1", "evt_int_2", "evt_int_3"];

describe.skipIf(!hasDb)("billing webhook integration (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let userId: string;

  const sign = (raw: string) => crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
  const post = (body: object, eventId?: string, sig?: string) => {
    const raw = JSON.stringify(body);
    const headers: Record<string, string> = { "content-type": "application/json", "x-razorpay-signature": sig ?? sign(raw) };
    if (eventId) headers["x-razorpay-event-id"] = eventId;
    return app.inject({ method: "POST", url: "/v1/billing/webhook", payload: raw, headers });
  };
  const captured = (paymentId: string, createdAt: number) => ({
    event: "payment.captured",
    created_at: createdAt,
    payload: { payment: { entity: { id: paymentId, amount: 49900, notes: { userId, plan: "pro", interval: "monthly" } } } },
  });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();
    await prisma.webhookEvent.deleteMany({ where: { id: { in: EVENT_IDS } } }); // idempotent re-runs
    const u = await prisma.user.create({ data: { clerkId: `wh_int_${Date.now()}`, email: `wh-int-${Date.now()}@test.eyf`, name: "Webhook Test" } });
    userId = u.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.subscription.deleteMany({ where: { userId } });
      await prisma.webhookEvent.deleteMany({ where: { id: { in: EVENT_IDS } } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await app?.close();
  });

  it("rejects a bad signature with 400", async () => {
    const res = await post(captured("pay_bad", 1_760_000_000), "evt_bad", "deadbeef");
    expect(res.statusCode).toBe(400);
  });

  it("activates the plan on payment.captured", async () => {
    const res = await post(captured("pay_int_1", 1_760_000_000), EVENT_IDS[0]);
    expect(res.statusCode).toBe(200);
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    expect(sub?.plan).toBe("PRO");
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.endsAt).toBeTruthy();
  });

  it("no-ops a duplicate delivery (same event id) — endsAt not re-applied", async () => {
    const before = await prisma.subscription.findUnique({ where: { userId } });
    const res = await post(captured("pay_int_1", 1_760_000_000), EVENT_IDS[0]); // same event id
    expect(res.statusCode).toBe(200);
    expect(res.json().data.deduped).toBe(true);
    const after = await prisma.subscription.findUnique({ where: { userId } });
    expect(after?.endsAt?.getTime()).toBe(before?.endsAt?.getTime());
  });

  it("ignores a stale out-of-order event (older created_at after a newer one applied)", async () => {
    await post(captured("pay_int_2", 1_770_000_000), EVENT_IDS[1]); // newer, applied
    const after = await prisma.subscription.findUnique({ where: { userId } });
    const res = await post(captured("pay_int_3", 1_750_000_000), EVENT_IDS[2]); // older, stale
    expect(res.json().data.stale).toBe(true);
    const final = await prisma.subscription.findUnique({ where: { userId } });
    expect(final?.endsAt?.getTime()).toBe(after?.endsAt?.getTime());
  });
});
