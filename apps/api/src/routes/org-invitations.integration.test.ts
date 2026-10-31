import "dotenv/config";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const send = vi.hoisted(() => vi.fn());
vi.mock("../services/email.js", async (original) => ({ ...await original<typeof import("../services/email.js")>(), sendEmail: send }));

describe.skipIf(!process.env.DATABASE_URL)("LMS invitation delivery", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"], env: (typeof import("../env.js"))["env"];
  let key: string | undefined, orgId: string, ownerId: string, token: string;
  const stamp = `invitations-${Date.now()}`;
  const create = (email: string) => app.inject({ method: "POST", url: `/v1/orgs/${orgId}/invites`, headers: { authorization: `Bearer ${token}` }, payload: { email } });
  beforeAll(async () => {
    ({ env } = await import("../env.js")); key = env.RESEND_API_KEY;
    ({ prisma } = await import("@eyf/db")); app = await (await import("../app.js")).buildApp(); await app.ready();
    const user = await prisma.user.create({ data: { name: "Owner", email: `${stamp}@test.eyf`, clerkId: stamp } }); ownerId = user.id; token = app.jwt.sign({ id: user.id, email: user.email });
    orgId = (await prisma.organization.create({ data: { name: "<script>Untrusted org</script>", slug: stamp, accessCode: stamp, members: { create: { userId: ownerId, roles: ["OWNER"] } } } })).id;
  });
  beforeEach(() => { send.mockReset(); send.mockResolvedValue({ sent: true, id: "mail-fixture" }); env.RESEND_API_KEY = "re_test_invitations"; });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => { env.RESEND_API_KEY = key; await prisma.organization.delete({ where: { id: orgId } }); await prisma.user.delete({ where: { id: ownerId } }); await app.close(); });

  it("keeps a usable code when email is unconfigured or rejects delivery", async () => {
    env.RESEND_API_KEY = "re_replace";
    const local = await create("local@test.eyf"); expect(local.statusCode).toBe(201); expect(local.json().data.delivery.status).toBe("NOT_CONFIGURED"); expect(local.json().data.token).toHaveLength(32); expect(send).not.toHaveBeenCalled();
    env.RESEND_API_KEY = "re_test_invitations"; send.mockResolvedValue({ sent: false, reason: "private provider error" });
    const failed = await create("failed@test.eyf"); expect(failed.statusCode).toBe(201); expect(failed.json().data.delivery.status).toBe("FAILED"); expect(failed.body).not.toContain("private provider error");
    expect((await prisma.orgInvite.findUniqueOrThrow({ where: { id: failed.json().data.id } })).emailStatus).toBe("FAILED");
  });
  it("emails escaped content and the private LMS address, then throttles duplicate resends", async () => {
    const result = await create("invitee@test.eyf"); expect(result.json().data.delivery.status).toBe("SENT");
    const [message] = send.mock.calls[0]!; expect(message.html).toContain("&lt;script&gt;"); expect(message.html).not.toContain("<script>"); expect(message.html).toContain(`${env.NEXT_PUBLIC_LMS_URL}/orgs`);
    const resend = await app.inject({ method: "POST", url: `/v1/orgs/${orgId}/invites/${result.json().data.id}/resend`, headers: { authorization: `Bearer ${token}` } });
    expect(resend.statusCode).toBe(200); expect(resend.json().data.delivery.status).toBe("SKIPPED"); expect(send).toHaveBeenCalledOnce();
    const list = await app.inject({ method: "GET", url: `/v1/orgs/${orgId}/invites`, headers: { authorization: `Bearer ${token}` } });
    expect(list.json().data.some((i: { emailStatus: string }) => i.emailStatus === "SENT")).toBe(true); expect(list.body).not.toContain(result.json().data.token);
  });
  it("reminds an eligible invitation once and skips accepted, expired or demoted-inviter invitations", async () => {
    const result = await create("reminder@test.eyf"); const id = result.json().data.id;
    await prisma.orgInvite.update({ where: { id }, data: { emailAttemptedAt: new Date(Date.now() - 2 * 86_400_000), emailSentAt: new Date(Date.now() - 2 * 86_400_000), expiresAt: new Date(Date.now() + 86_400_000) } });
    send.mockClear();
    const { remindPendingInvitations, deliverInvitation } = await import("../services/org-invitations.js");
    // Never let this global cron test update real pending invitations in a shared local DB.
    vi.spyOn(prisma.orgInvite, "findMany").mockResolvedValue([await prisma.orgInvite.findUniqueOrThrow({ where: { id } })]);
    expect((await remindPendingInvitations()).sent).toBe(1); expect((await remindPendingInvitations()).sent).toBe(0); expect(send).toHaveBeenCalledOnce();
    await prisma.orgInvite.update({ where: { id }, data: { acceptedAt: new Date() } }); expect((await deliverInvitation(id)).status).toBe("SKIPPED");
    await prisma.orgInvite.update({ where: { id }, data: { acceptedAt: null, expiresAt: new Date(0) } }); expect((await deliverInvitation(id)).status).toBe("SKIPPED");
    await prisma.orgInvite.update({ where: { id }, data: { expiresAt: new Date(Date.now() + 86_400_000) } });
    await prisma.orgMember.updateMany({ where: { orgId, userId: ownerId }, data: { status: "SUSPENDED" } }); expect((await deliverInvitation(id)).status).toBe("SKIPPED"); expect(send).toHaveBeenCalledOnce();
  });
});
