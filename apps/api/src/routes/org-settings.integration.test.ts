import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createHmac } from "node:crypto";

/**
 * Enterprise settings integration (PRD §24/§14): white-label branding gated by
 * plan; API keys shown once then hashed, resolvable, revocable; webhooks
 * signed + delivered on real events (certificate.issued) with HMAC the
 * receiver can verify.
 */
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("org settings — branding, api keys, webhooks (real DB)", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  const stamp = Date.now();
  let owner: { id: string; token: string };
  let member: { id: string; token: string };
  let orgId: string;

  const inject = (token: string, method: "GET" | "POST" | "PATCH", url: string, body?: object) =>
    app.inject({ method, url, headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { payload: JSON.stringify(body) } : {}) });

  beforeAll(async () => {
    ({ prisma } = await import("@eyf/db"));
    app = await (await import("../app.js")).buildApp();
    await app.ready();
    const mkUser = async (tag: string) => {
      const u = await prisma.user.create({ data: { clerkId: `st_${tag}_${stamp}`, email: `st-${tag}-${stamp}@test.eyf`, name: `Set ${tag}` } });
      return { id: u.id, token: app.jwt.sign({ id: u.id, email: u.email, name: u.name, role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" }) };
    };
    owner = await mkUser("owner");
    member = await mkUser("member");
    const org = await prisma.organization.create({
      data: { name: `SetTest ${stamp}`, slug: `set-test-${stamp}`, accessCode: `st-${stamp}`, plan: "BUSINESS", members: { create: [{ userId: owner.id, roles: ["OWNER"] }, { userId: member.id, roles: ["MEMBER"] }] } },
    });
    orgId = org.id;
  });

  afterAll(async () => {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
    for (const u of [owner, member].filter(Boolean)) {
      await prisma.certificate.deleteMany({ where: { userId: u.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
    }
    await app?.close();
  });

  it("white-label branding: owner sets it; public read reflects it on Business+", async () => {
    const set = await inject(owner.token, "PATCH", `/v1/orgs/${orgId}/branding`, { brandColor: "#E8192C", logoUrl: "https://cdn.example.com/logo.png" });
    expect(set.statusCode).toBe(200);
    // Public (no auth) branding read.
    const pub = await app.inject({ method: "GET", url: `/v1/orgs/${orgId}/branding` });
    expect(pub.json().data).toMatchObject({ brandColor: "#E8192C", logoUrl: "https://cdn.example.com/logo.png" });

    // On a non-white-label plan the custom color is withheld.
    await prisma.organization.update({ where: { id: orgId }, data: { plan: "TEAM" } });
    const pub2 = await app.inject({ method: "GET", url: `/v1/orgs/${orgId}/branding` });
    expect(pub2.json().data.brandColor).toBeNull();
    await prisma.organization.update({ where: { id: orgId }, data: { plan: "BUSINESS" } });

    // MEMBER cannot edit branding.
    expect((await inject(member.token, "PATCH", `/v1/orgs/${orgId}/branding`, { brandColor: "#000000" })).statusCode).toBe(403);
  });

  it("API key: returned once, hashed at rest, resolves, revokes", async () => {
    const created = await inject(owner.token, "POST", `/v1/orgs/${orgId}/api-keys`, { name: "CI key", scopes: ["talent:search"] });
    expect(created.statusCode).toBe(201);
    const raw = created.json().data.key;
    expect(raw).toMatch(/^eyf_live_[0-9a-f]+\./);

    // Stored as a hash, never the raw key.
    const row = await prisma.apiKey.findUnique({ where: { prefix: created.json().data.prefix } });
    expect(row?.hashedKey).not.toContain(raw);
    // List never returns the secret.
    const list = await inject(owner.token, "GET", `/v1/orgs/${orgId}/api-keys`);
    expect(JSON.stringify(list.json())).not.toContain(raw.split(".")[1]);

    // resolveApiKey verifies the hash.
    const { resolveApiKey } = await import("../lib/api-keys.js");
    expect(await resolveApiKey(raw)).toMatchObject({ orgId, scopes: ["talent:search"] });
    expect(await resolveApiKey(raw + "tampered")).toBeNull();

    // Revoke → no longer resolves.
    await inject(owner.token, "POST", `/v1/orgs/${orgId}/api-keys/${created.json().data.id}/revoke`);
    expect(await resolveApiKey(raw)).toBeNull();

    // MEMBER can't manage keys.
    expect((await inject(member.token, "GET", `/v1/orgs/${orgId}/api-keys`)).statusCode).toBe(403);
  });

  it("webhook fires on certificate.issued, HMAC-signed and recorded", async () => {
    // Stand up a receiver.
    const received: { sig: string | null; body: string }[] = [];
    const http = await import("node:http");
    const server = http.createServer((r, res) => {
      let body = "";
      r.on("data", (c) => (body += c));
      r.on("end", () => { received.push({ sig: r.headers["x-eyf-signature"] as string, body }); res.writeHead(200).end("ok"); });
    });
    await new Promise<void>((ok) => server.listen(0, ok));
    const port = (server.address() as { port: number }).port;

    const hook = await inject(owner.token, "POST", `/v1/orgs/${orgId}/webhooks`, { url: `http://127.0.0.1:${port}/hook`, events: ["certificate.issued"] });
    expect(hook.statusCode).toBe(201);
    const secret = hook.json().data.secret;
    expect(secret).toMatch(/^whsec_/);

    // Trigger the event.
    const { issueCertificate } = await import("../lib/org-certificates.js");
    await issueCertificate({ userId: member.id, orgId, templateId: "tpl_x", title: "Test Cert", score: 90, skillsAsserted: [] });
    // Let the fire-and-forget delivery land.
    await new Promise((r) => setTimeout(r, 400));

    expect(received.length).toBe(1);
    const rec = received[0]!;
    const payload = JSON.parse(rec.body);
    expect(payload.event).toBe("certificate.issued");
    expect(payload.data.title).toBe("Test Cert");
    // Signature verifies with the secret the receiver was given.
    const expectSig = createHmac("sha256", secret).update(rec.body).digest("hex");
    expect(rec.sig).toBe(expectSig);

    // Delivery recorded as delivered.
    const deliveries = await inject(owner.token, "GET", `/v1/orgs/${orgId}/webhooks/${hook.json().data.id}/deliveries`);
    expect(deliveries.json().data[0]).toMatchObject({ event: "certificate.issued", status: "delivered" });

    await new Promise<void>((ok) => server.close(() => ok()));
  });

  it("outsider is walled off from all settings", async () => {
    const outsider = await prisma.user.create({ data: { clerkId: `st_out_${stamp}`, email: `st-out-${stamp}@test.eyf`, name: "Out" } });
    const token = app.jwt.sign({ id: outsider.id, email: outsider.email, name: "Out", role: "STUDENT_PRO", plan: "pro" }, { expiresIn: "10m" });
    expect((await inject(token, "GET", `/v1/orgs/${orgId}/api-keys`)).statusCode).toBe(404);
    expect((await inject(token, "GET", `/v1/orgs/${orgId}/webhooks`)).statusCode).toBe(404);
    await prisma.user.delete({ where: { id: outsider.id } }).catch(() => {});
  });
});
