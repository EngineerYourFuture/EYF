import crypto from "node:crypto";
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {
  issueAccessToken,
  issueRefreshToken,
  verifyRefresh,
  sha256,
  Zone,
  Role,
} from "../lib/tokens";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const normalizeEmail = (e: string) => e.trim().toLowerCase();

const SALT_ROUNDS = 12;
const ACCESS_COOKIE = "eyf_access";
const REFRESH_COOKIE = "eyf_refresh";

const cookieOpts = (maxAgeSec: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: maxAgeSec * 1000,
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "needs uppercase")
    .regex(/[a-z]/, "needs lowercase")
    .regex(/\d/, "needs digit")
    .regex(/[^A-Za-z0-9]/, "needs special char"),
  zone: z.enum(["public", "authority"]).default("public"),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  zone: z.enum(["public", "authority"]).default("public"),
  totpCode: z.string().optional(),
});

const getIp = (req: Request): string =>
  (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
  req.socket.remoteAddress ??
  "unknown";

const getDevice = (req: Request): string =>
  (req.headers["user-agent"] ?? "unknown").slice(0, 200);

async function createSession(
  userId: string,
  zone: Zone,
  role: Role,
  plan: string,
  ip: string,
  device: string,
  res: Response
) {
  const session = await prisma.session.create({
    data: { userId, zone, ip, device },
  });

  const familyId = crypto.randomUUID();
  const { token: refreshToken, hash: refreshHash } = issueRefreshToken(
    userId,
    session.id,
    familyId
  );

  await prisma.refreshToken.create({
    data: {
      userId,
      sessionId: session.id,
      familyId,
      tokenHash: refreshHash,
    },
  });

  const accessToken = issueAccessToken(userId, role, plan, session.id, zone);

  res.cookie(ACCESS_COOKIE, accessToken, cookieOpts(15 * 60));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts(30 * 24 * 60 * 60));

  return { accessToken, refreshToken, sessionId: session.id };
}

// POST /auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }
  const { email, password, zone } = parse.data;
  const normalized = normalizeEmail(email);

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    res.status(409).json({ error: { code: "EMAIL_TAKEN", message: "Email already registered." } });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      security: { create: {} },
      xp: { create: {} },
      learningGoal: { create: { priorityModules: ["dsa", "core-subjects", "placement"] } },
    },
  });

  const ip = getIp(req);
  const device = getDevice(req);
  const { accessToken } = await createSession(
    user.id,
    zone as Zone,
    user.role as Role,
    user.plan,
    ip,
    device,
    res
  );

  res.status(201).json({
    user: { id: user.id, email: user.email, role: user.role, plan: user.plan },
    accessToken,
  });
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }
  const { email, password, zone, totpCode } = parse.data;
  const normalized = normalizeEmail(email);

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    include: { security: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } });
    return;
  }

  if (zone === "authority" && user.role === "user") {
    res.status(403).json({ error: { code: "FORBIDDEN", message: "Not authorized for authority zone." } });
    return;
  }

  // 2FA check
  if (user.security?.totpEnabled && user.security.totpSecret) {
    if (!totpCode) {
      res.status(200).json({ require2FA: true });
      return;
    }
    const valid = speakeasy.totp.verify({
      secret: user.security.totpSecret,
      encoding: "base32",
      token: totpCode,
      window: 1,
    });
    if (!valid) {
      // Check backup codes
      const normalizedCode = totpCode.replace(/-/g, "").toLowerCase();
      const codeHash = sha256(normalizedCode);
      const backupValid = user.security.backupCodes.includes(codeHash);
      if (!backupValid) {
        res.status(401).json({ error: { code: "INVALID_2FA", message: "Invalid 2FA code." } });
        return;
      }
      // Burn the backup code
      await prisma.securitySettings.update({
        where: { userId: user.id },
        data: {
          backupCodes: user.security.backupCodes.filter((c) => c !== codeHash),
        },
      });
    }
  }

  const ip = getIp(req);
  const device = getDevice(req);
  const { accessToken } = await createSession(
    user.id,
    zone as Zone,
    user.role as Role,
    user.plan,
    ip,
    device,
    res
  );

  await prisma.loginEvent.create({
    data: { userId: user.id, ip, device, riskScore: 20, outcome: "allowed" },
  });

  res.json({
    user: { id: user.id, email: user.email, role: user.role, plan: user.plan },
    accessToken,
  });
});

// POST /auth/refresh
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const token =
    req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
  if (!token) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "No refresh token." } });
    return;
  }

  let payload;
  try {
    payload = verifyRefresh(token);
  } catch {
    res.status(401).json({ error: { code: "TOKEN_EXPIRED", message: "Refresh token expired." } });
    return;
  }

  const hash = sha256(token);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });

  if (!stored || stored.revoked) {
    // Possible token reuse — revoke entire family
    await prisma.refreshToken.updateMany({
      where: { familyId: payload.familyId },
      data: { revoked: true },
    });
    res.status(401).json({ error: { code: "TOKEN_REUSE", message: "Token reuse detected." } });
    return;
  }

  if (stored.used) {
    await prisma.refreshToken.updateMany({
      where: { familyId: payload.familyId },
      data: { revoked: true },
    });
    res.status(401).json({ error: { code: "TOKEN_REUSE", message: "Token already used." } });
    return;
  }

  // Mark old token as used
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { used: true } });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "User not found." } });
    return;
  }

  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.revokedAt) {
    res.status(401).json({ error: { code: "SESSION_REVOKED", message: "Session revoked." } });
    return;
  }

  // Issue new refresh token in same family
  const { token: newRefresh, hash: newHash } = issueRefreshToken(
    user.id,
    session.id,
    payload.familyId
  );
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      sessionId: session.id,
      familyId: payload.familyId,
      tokenHash: newHash,
    },
  });

  const newAccess = issueAccessToken(
    user.id,
    user.role as Role,
    user.plan,
    session.id,
    session.zone as Zone
  );

  res.cookie(ACCESS_COOKIE, newAccess, cookieOpts(15 * 60));
  res.cookie(REFRESH_COOKIE, newRefresh, cookieOpts(30 * 24 * 60 * 60));

  res.json({ accessToken: newAccess });
});

// POST /auth/logout
router.post("/logout", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const sessionId = req.auth!.sessionId;
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
  await prisma.refreshToken.updateMany({
    where: { sessionId },
    data: { revoked: true },
  });
  res.clearCookie(ACCESS_COOKIE);
  res.clearCookie(REFRESH_COOKIE);
  res.json({ ok: true });
});

// GET /auth/me
router.get("/me", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.sub },
    select: { id: true, email: true, role: true, plan: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found." } });
    return;
  }
  res.json({ user });
});

// GET /auth/sessions
router.get("/sessions", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const sessions = await prisma.session.findMany({
    where: { userId: req.auth!.sub, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, zone: true, ip: true, device: true, createdAt: true },
  });
  res.json({ sessions, currentSessionId: req.auth!.sessionId });
});

// DELETE /auth/sessions/:id
router.delete("/sessions/:id", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session || session.userId !== req.auth!.sub) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Session not found." } });
    return;
  }
  await prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
  await prisma.refreshToken.updateMany({ where: { sessionId: id }, data: { revoked: true } });
  res.json({ ok: true });
});

// --- 2FA Routes ---

// POST /auth/2fa/setup
router.post("/2fa/setup", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.auth!.sub;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) { res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found." } }); return; }

  const secret = speakeasy.generateSecret({ name: `EYF (${user.email})`, length: 20 });
  await prisma.securitySettings.upsert({
    where: { userId },
    update: { pendingTotpSecret: secret.base32 },
    create: { userId, pendingTotpSecret: secret.base32 },
  });

  res.json({ secret: secret.base32, otpauthUrl: secret.otpauth_url });
});

// POST /auth/2fa/confirm
router.post("/2fa/confirm", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { code } = req.body;
  const userId = req.auth!.sub;
  const settings = await prisma.securitySettings.findUnique({ where: { userId } });

  if (!settings?.pendingTotpSecret) {
    res.status(400).json({ error: { code: "NO_PENDING_SECRET", message: "Start 2FA setup first." } });
    return;
  }

  const valid = speakeasy.totp.verify({
    secret: settings.pendingTotpSecret,
    encoding: "base32",
    token: String(code),
    window: 1,
  });

  if (!valid) {
    res.status(400).json({ error: { code: "INVALID_CODE", message: "Invalid TOTP code." } });
    return;
  }

  const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString("hex"));
  const backupHashes = backupCodes.map(sha256);

  await prisma.securitySettings.update({
    where: { userId },
    data: {
      totpEnabled: true,
      totpSecret: settings.pendingTotpSecret,
      pendingTotpSecret: null,
      backupCodes: backupHashes,
    },
  });

  res.json({ ok: true, backupCodes });
});

// DELETE /auth/2fa
router.delete("/2fa", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { password } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Wrong password." } });
    return;
  }
  await prisma.securitySettings.update({
    where: { userId: user.id },
    data: { totpEnabled: false, totpSecret: null, backupCodes: [] },
  });
  res.json({ ok: true });
});

// GET /auth/security
router.get("/security", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const settings = await prisma.securitySettings.findUnique({
    where: { userId: req.auth!.sub },
    select: { totpEnabled: true },
  });
  const loginEvents = await prisma.loginEvent.findMany({
    where: { userId: req.auth!.sub },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, ip: true, device: true, outcome: true, createdAt: true },
  });
  res.json({ totpEnabled: settings?.totpEnabled ?? false, loginEvents });
});

// PATCH /auth/password
router.patch("/password", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Wrong current password." } });
    return;
  }

  const isStrong = newPassword?.length >= 8 &&
    /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) &&
    /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
  if (!isStrong) {
    res.status(400).json({ error: { code: "WEAK_PASSWORD", message: "Password doesn't meet requirements." } });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ ok: true });
});

export { router as authRouter };
