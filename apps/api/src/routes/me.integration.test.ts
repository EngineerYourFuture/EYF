import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

/**
 * Mutation coverage for the self-service profile routes (`me.ts`).
 *
 * `me-privacy.integration.test.ts` already covers export + erasure, and referral
 * redemption / self-reported placements have their own suites. The two writes with
 * no coverage were `PATCH /me` and `POST /me/parent-email` — both of which write
 * straight to the user row, so the load-bearing property is that they can only ever
 * touch the CALLER's record and can't be widened by a crafted body.
 *
 * The parent-email route matters beyond CRUD: it is the opt-in for sending a
 * student's progress to a parent, so "clearing it actually clears it" is a privacy
 * behaviour, not a cosmetic one.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("me — profile + parent-email writes (integration)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let meId: string;
  let otherId: string;
  const s = Date.now();

  const auth = (id: string) => ({
    authorization: `Bearer ${app.jwt.sign({ id, email: "me@x", name: "Me", role: "STUDENT_FREE", plan: "free" }, { expiresIn: "5m" })}`,
    "content-type": "application/json",
  });
  const patch = (payload: unknown, id = meId) =>
    app.inject({ method: "PATCH", url: "/v1/me", headers: auth(id), payload: JSON.stringify(payload) });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    const [me, other] = await Promise.all([
      prisma.user.create({ data: { clerkId: `me_${s}`, email: `me-${s}@test.eyf`, name: "Original Name", college: "IIT Testpur", graduationYear: 2026 } }),
      prisma.user.create({ data: { clerkId: `me_other_${s}`, email: `me-other-${s}@test.eyf`, name: "Other Person", college: "NIT Elsewhere" } }),
    ]);
    meId = me.id;
    otherId = other.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [meId, otherId] } } }).catch(() => {});
    await app.close();
  });

  it("requires authentication", async () => {
    const res = await app.inject({ method: "PATCH", url: "/v1/me", headers: { "content-type": "application/json" }, payload: JSON.stringify({ name: "Nope" }) });
    expect(res.statusCode).toBe(401);
  });

  it("updates only the supplied fields and leaves the rest intact", async () => {
    const res = await patch({ name: "Updated Name" });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.user.name).toBe("Updated Name");

    const row = await prisma.user.findUnique({ where: { id: meId }, select: { name: true, college: true, graduationYear: true } });
    expect(row!.name).toBe("Updated Name");
    // A partial patch must not blank the fields it didn't mention.
    expect(row!.college).toBe("IIT Testpur");
    expect(row!.graduationYear).toBe(2026);
  });

  it("coerces a numeric-string graduation year and accepts a valid persona", async () => {
    const res = await patch({ graduationYear: "2027", persona: "SWITCHER" });
    expect(res.statusCode).toBe(200);

    const row = await prisma.user.findUnique({ where: { id: meId }, select: { graduationYear: true, persona: true } });
    expect(row!.graduationYear).toBe(2027);
    expect(row!.persona).toBe("SWITCHER");
  });

  it("rejects out-of-range and malformed values", async () => {
    expect((await patch({ graduationYear: 1900 })).statusCode).toBe(400);
    expect((await patch({ persona: "NOT_A_PERSONA" })).statusCode).toBe(400);
    expect((await patch({ name: "x".repeat(81) })).statusCode).toBe(400);
    expect((await patch({ name: "   " })).statusCode).toBe(400); // trims to empty
  });

  it("writes only to the caller's row — an id in the body cannot retarget it", async () => {
    const before = await prisma.user.findUnique({ where: { id: otherId }, select: { name: true } });

    // `id`/`email` are not in the schema, so Zod strips them; the update is keyed
    // off the session, never the payload.
    const res = await patch({ id: otherId, email: "attacker@evil.test", name: "Rewritten By Me" });
    expect(res.statusCode).toBe(200);

    const [mine, theirs] = await Promise.all([
      prisma.user.findUnique({ where: { id: meId }, select: { name: true, email: true } }),
      prisma.user.findUnique({ where: { id: otherId }, select: { name: true } }),
    ]);
    expect(mine!.name).toBe("Rewritten By Me");
    expect(mine!.email).toBe(`me-${s}@test.eyf`); // email is not patchable
    expect(theirs!.name).toBe(before!.name);      // the other account is untouched
  });

  it("sets a parent email for the digest opt-in", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/me/parent-email", headers: auth(meId), payload: JSON.stringify({ email: "parent@test.eyf" }) });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.parentEmail).toBe("parent@test.eyf");

    const row = await prisma.user.findUnique({ where: { id: meId }, select: { parentEmail: true } });
    expect(row!.parentEmail).toBe("parent@test.eyf");
  });

  it("clears the opt-in when sent an empty string — the digest must actually stop", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/me/parent-email", headers: auth(meId), payload: JSON.stringify({ email: "" }) });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.parentEmail).toBeNull();

    // Persisted as NULL, not "" — parentDigestFor keys off null to decide whether
    // to send, so an empty string here would keep mailing a parent who opted out.
    const row = await prisma.user.findUnique({ where: { id: meId }, select: { parentEmail: true } });
    expect(row!.parentEmail).toBeNull();
  });

  it("rejects a malformed parent email rather than storing it", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/me/parent-email", headers: auth(meId), payload: JSON.stringify({ email: "not-an-email" }) });
    expect(res.statusCode).toBe(400);

    const row = await prisma.user.findUnique({ where: { id: meId }, select: { parentEmail: true } });
    expect(row!.parentEmail).toBeNull();
  });
});
