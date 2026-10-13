import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

describe.skipIf(!process.env.DATABASE_URL)("private lesson media", () => {
  let app: Awaited<ReturnType<(typeof import("../app.js"))["buildApp"]>>;
  let prisma: (typeof import("@eyf/db"))["prisma"];
  let env: (typeof import("../env.js"))["env"];
  let folder: string, oldFolder: string, oldMax: number, orgId: string, otherOrg: string, lessonId: string, assetId: string, accessPath: string;
  const users: { id: string; token: string }[] = [];
  const stamp = `media-${Date.now()}`;
  const call = (who: number, method: "GET" | "POST" | "PATCH" | "DELETE", path: string, payload?: object) => app.inject({ method, url: `/v1${path}`, headers: { authorization: `Bearer ${users[who]!.token}` }, payload });
  const upload = (who: number, org: string, mime = "text/plain", content = "private course resource") => app.inject({ method: "POST", url: `/v1/orgs/${org}/media`, headers: { authorization: `Bearer ${users[who]!.token}`, "content-type": "multipart/form-data; boundary=eyf" }, payload: Buffer.from(`--eyf\r\nContent-Disposition: form-data; name="file"; filename="lesson.txt"\r\nContent-Type: ${mime}\r\n\r\n${content}\r\n--eyf--\r\n`) });
  beforeAll(async () => {
    ({ env } = await import("../env.js")); oldFolder = env.PRIVATE_MEDIA_DIR; folder = await mkdtemp(join(tmpdir(), "eyf-media-test-")); env.PRIVATE_MEDIA_DIR = folder;
    oldMax = env.PRIVATE_MEDIA_MAX_MB; env.PRIVATE_MEDIA_MAX_MB = 1;
    ({ prisma } = await import("@eyf/db")); app = await (await import("../app.js")).buildApp(); await app.ready();
    for (const name of ["author", "member", "outsider"]) {
      const user = await prisma.user.create({ data: { name, email: `${stamp}-${name}@test.eyf`, clerkId: `${stamp}-${name}` } });
      users.push({ id: user.id, token: app.jwt.sign({ id: user.id, email: user.email }) });
    }
    const org = await prisma.organization.create({ data: { name: stamp, slug: stamp, accessCode: stamp, members: { create: [{ userId: users[0]!.id, roles: ["OWNER"] }, { userId: users[1]!.id, roles: ["MEMBER"] }] } } }); orgId = org.id;
    otherOrg = (await prisma.organization.create({ data: { name: `${stamp}-other`, slug: `${stamp}-other`, accessCode: `${stamp}-other`, members: { create: { userId: users[2]!.id, roles: ["OWNER"] } } } })).id;
    const course = await prisma.course.create({ data: { orgId, title: "Private course", status: "DRAFT", lessons: { create: { title: "Resource", content: "", blocks: [] } } }, include: { lessons: true } }); lessonId = course.lessons[0]!.id;
  });
  afterAll(async () => {
    await prisma.organization.deleteMany({ where: { id: { in: [orgId, otherOrg] } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    await app.close(); env.PRIVATE_MEDIA_DIR = oldFolder; env.PRIVATE_MEDIA_MAX_MB = oldMax; await rm(folder, { recursive: true, force: true });
  });

  it("requires author permission and rejects active-content uploads", async () => {
    expect((await upload(1, orgId)).statusCode).toBe(403);
    expect((await upload(2, orgId)).statusCode).toBe(404);
    expect((await upload(0, orgId, "text/html", "<script>bad</script>")).statusCode).toBe(415);
    const result = await upload(0, orgId); expect(result.statusCode).toBe(201); assetId = result.json().data.id;
    expect(await readdir(folder)).toEqual([assetId]);
  });
  it("validates tenant ownership and media type before saving a lesson", async () => {
    expect((await call(0, "PATCH", `/orgs/${orgId}/lessons/${lessonId}`, { blocks: [{ type: "file", data: { assetId: randomUUID() } }] })).statusCode).toBe(400);
    const foreign = (await upload(2, otherOrg)).json().data.id;
    expect((await call(0, "PATCH", `/orgs/${orgId}/lessons/${lessonId}`, { blocks: [{ type: "file", data: { assetId: foreign } }] })).statusCode).toBe(400);
    expect((await call(0, "PATCH", `/orgs/${orgId}/lessons/${lessonId}`, { blocks: [{ type: "image", data: { assetId, alt: "A diagram" } }] })).statusCode).toBe(400);
    expect((await call(0, "PATCH", `/orgs/${orgId}/lessons/${lessonId}`, { blocks: [{ type: "file", data: { assetId } }] })).statusCode).toBe(200);
  });
  it("rejects empty and oversized uploads without retaining partial files", async () => {
    const before = (await readdir(folder)).sort();
    expect((await upload(0, orgId, "text/plain", "")).statusCode).toBe(400);
    expect((await upload(0, orgId, "text/plain", "x".repeat(1024 * 1024 + 1))).statusCode).toBe(413);
    expect((await readdir(folder)).sort()).toEqual(before);
    const cap = env.PRIVATE_MEDIA_ORG_LIMIT_MB;
    env.PRIVATE_MEDIA_ORG_LIMIT_MB = 0;
    try { expect((await upload(0, orgId)).statusCode).toBe(409); expect((await readdir(folder)).sort()).toEqual(before); }
    finally { env.PRIVATE_MEDIA_ORG_LIMIT_MB = cap; }
  });
  it("hides draft attachments from learners and permits author previews", async () => {
    expect((await call(1, "POST", `/orgs/${orgId}/media/${assetId}/access`, { lessonId })).statusCode).toBe(404);
    expect((await call(0, "POST", `/orgs/${orgId}/media/${assetId}/access`)).statusCode).toBe(200);
    const lesson = await prisma.lesson.findUniqueOrThrow({ where: { id: lessonId } });
    await prisma.course.update({ where: { id: lesson.courseId }, data: { status: "PUBLISHED", published: true } });
    const access = await call(1, "POST", `/orgs/${orgId}/media/${assetId}/access`, { lessonId }); expect(access.statusCode).toBe(200); accessPath = `/v1${access.json().data.path}`;
    expect((await call(2, "POST", `/orgs/${otherOrg}/media/${assetId}/access`, { lessonId })).statusCode).toBe(404);
    expect((await call(1, "POST", `/orgs/${orgId}/media/${assetId}/access`, { lessonId: "different" })).statusCode).toBe(404);
  });
  it("streams private bytes with seeking and no-store headers", async () => {
    const full = await app.inject({ method: "GET", url: accessPath }); expect(full.statusCode).toBe(200); expect(full.body).toBe("private course resource");
    expect(full.headers["cache-control"]).toBe("private, no-store"); expect(full.headers["content-disposition"]).toContain("attachment");
    const partial = await app.inject({ method: "GET", url: accessPath, headers: { range: "bytes=0-6" } }); expect(partial.statusCode).toBe(206); expect(partial.body).toBe("private");
    expect((await app.inject({ method: "GET", url: accessPath, headers: { range: "bytes=9000-" } })).statusCode).toBe(416);
    const ticket = new URL(accessPath, "http://localhost").searchParams.get("ticket")!;
    expect((await app.inject({ method: "GET", url: "/v1/me", headers: { authorization: `Bearer ${ticket}` } })).statusCode).toBe(401);
    const expired = app.jwt.sign({ purpose: "lesson-media", sub: users[1]!.id, orgId, assetId, lessonId }, { expiresIn: -1 });
    expect((await app.inject({ method: "GET", url: `/v1/orgs/${orgId}/media/${assetId}/content?ticket=${expired}` })).statusCode).toBe(401);
    expect((await app.inject({ method: "GET", url: `/v1/orgs/${otherOrg}/media/${assetId}/content?ticket=${ticket}` })).statusCode).toBe(404);
  });
  it("revokes outstanding links when membership or publication changes", async () => {
    await prisma.orgMember.updateMany({ where: { orgId, userId: users[1]!.id }, data: { status: "SUSPENDED" } });
    expect((await app.inject({ method: "GET", url: accessPath })).statusCode).toBe(404);
    await prisma.orgMember.updateMany({ where: { orgId, userId: users[1]!.id }, data: { status: "ACTIVE" } });
    await prisma.course.updateMany({ where: { orgId }, data: { status: "ARCHIVED", published: false } });
    expect((await app.inject({ method: "GET", url: accessPath })).statusCode).toBe(404);
  });
  it("protects in-use uploads and lets authors remove unused ones", async () => {
    expect((await call(0, "DELETE", `/orgs/${orgId}/media/${assetId}`)).statusCode).toBe(409);
    const unused = (await upload(0, orgId)).json().data.id;
    expect((await call(2, "DELETE", `/orgs/${otherOrg}/media/${unused}`)).statusCode).toBe(404);
    expect((await call(0, "DELETE", `/orgs/${orgId}/media/${unused}`)).statusCode).toBe(200);
    expect(await readdir(folder)).not.toContain(unused);
  });
  it("serializes attachment saves with deletion so lessons never retain missing uploads", async () => {
    const unused = (await upload(0, orgId)).json().data.id;
    const course = await prisma.course.create({ data: { orgId, title: "Concurrent attachment", lessons: { create: { title: "Draft", content: "", blocks: [] } } }, include: { lessons: true } });
    const [save, deletion] = await Promise.all([
      call(0, "PATCH", `/orgs/${orgId}/lessons/${course.lessons[0]!.id}`, { blocks: [{ type: "file", data: { assetId: unused } }] }),
      call(0, "DELETE", `/orgs/${orgId}/media/${unused}`),
    ]);
    expect([[200, 409], [400, 200]]).toContainEqual([save.statusCode, deletion.statusCode]);
  });
  it("lets authors create a pilot draft while denying ordinary members", async () => {
    expect((await call(1, "POST", `/orgs/${orgId}/courses/templates/sql-backend`)).statusCode).toBe(403);
    const result = await call(0, "POST", `/orgs/${orgId}/courses/templates/sql-backend`); expect(result.statusCode).toBe(201); expect(result.json().data.status).toBe("DRAFT");
    const lessons = await prisma.lesson.findMany({ where: { courseId: result.json().data.id } }); expect(lessons).toHaveLength(5);
  });
});
