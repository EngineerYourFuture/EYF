import crypto from "node:crypto";
import path from "node:path";
import express, { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import morgan from "morgan";
import speakeasy from "speakeasy";
import { v4 as uuidv4 } from "uuid";
import { env } from "./config/env";

type Role = "user" | "staff" | "admin";
type Plan = "free" | "basic" | "pro" | "elite";
type Zone = "public" | "authority";
type SubmissionStatus = "accepted" | "wrong_answer" | "runtime_error";
type TraceStatus = "pending" | "completed" | "failed";

interface ApiError {
  code: string;
  message: string;
}

interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  plan: Plan;
  activeSessionId: string | null;
  createdAt: string;
}

interface SessionRecord {
  id: string;
  userId: string;
  sessionId: string;
  zone: Zone;
  ip: string;
  device: string;
  createdAt: string;
  revokedAt: string | null;
}

interface RefreshTokenRecord {
  id: string;
  userId: string;
  sessionId: string;
  familyId: string;
  tokenHash: string;
  used: boolean;
  revoked: boolean;
  createdAt: string;
}

interface SecuritySettings {
  userId: string;
  totpEnabled: boolean;
  totpSecret: string | null;
  pendingTotpSecret: string | null;
  backupCodes: string[];
}

interface LoginEvent {
  id: string;
  userId: string;
  ip: string;
  device: string;
  riskScore: number;
  outcome: "allowed" | "two_fa_required" | "blocked";
  createdAt: string;
}

interface PlanEntitlement {
  plan: Plan;
  featureKey: string;
  enabled: boolean;
  limitValue: number | null;
}

interface DailySubmissionUsage {
  userId: string;
  date: string;
  count: number;
}

interface MonthlyUsage {
  userId: string;
  month: string;
  mentorshipUsed: number;
}

interface Problem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
  planAccess: Plan;
  statement: string;
  createdAt: string;
}

interface ProblemTestCase {
  id: string;
  problemId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: string;
  sourceCode: string;
  status: SubmissionStatus;
  runtimeMs: number;
  memoryKb: number;
  createdAt: string;
}

interface ExecutionRun {
  id: string;
  userId: string;
  problemId: string;
  stdout: string;
  stderr: string;
  runtimeMs: number;
  exitCode: number;
  createdAt: string;
}

interface VisualizerTrace {
  id: string;
  submissionId: string;
  status: TraceStatus;
  frames: Array<Record<string, unknown>>;
  retryCount: number;
  createdAt: string;
}

interface PlacementAttempt {
  id: string;
  userId: string;
  company: string;
  role: string;
  kind: "placement" | "mock";
  outcome: string;
  createdAt: string;
}

interface MentorshipBooking {
  id: string;
  userId: string;
  mentorId: string;
  scheduledAt: string;
  month: string;
  status: "booked" | "cancelled";
}

interface ResumeRecord {
  id: string;
  userId: string;
  template: string;
  dataJson: Record<string, unknown>;
  updatedAt: string;
}

interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  status: "active" | "past_due" | "cancelled";
  periodStart: string;
  periodEnd: string;
  providerSubId: string;
}

interface BillingEvent {
  id: string;
  providerEventId: string;
  type: string;
  userId: string;
  payload: Record<string, unknown>;
  processedAt: string;
}

interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  body: string;
  status: "open" | "closed";
  createdAt: string;
}

interface AdminAuditLog {
  id: string;
  actorId: string;
  actorRole: Role;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
}

interface ModuleProgress {
  userId: string;
  moduleKey: string;
  completionPct: number;
  status: "not_started" | "in_progress" | "completed";
  lastActivityAt: string;
}

interface UserLearningGoal {
  userId: string;
  targetRole: string;
  priorityModules: string[];
}

interface TechSkillProgress {
  userId: string;
  skillKey: string;
  level: number;
  xp: number;
}

interface RecentActivity {
  id: string;
  userId: string;
  moduleKey: string;
  action: string;
  createdAt: string;
}

interface TechSkillTask {
  taskKey: string;
  title: string;
  xpReward: number;
}

interface TechSkill {
  skillKey: string;
  category: "backend" | "frontend" | "devops" | "data";
  name: string;
  tasks: TechSkillTask[];
}

interface TechSkillTaskAttempt {
  userId: string;
  taskKey: string;
  status: "not_started" | "started" | "submitted";
  evidence: string | null;
}

interface AuthorityApplication {
  id: string;
  userEmail: string;
  module: string;
  assignedReviewerId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface CompanyTrack {
  id: string;
  company: string;
  level: "intern" | "sde-1" | "sde-2";
  focus: string[];
}

interface ReferralProfile {
  userId: string;
  code: string;
  referredCount: number;
}

interface AuthPayload {
  sub: string;
  role: Role;
  sessionId: string;
  zone: Zone;
  type: "access" | "refresh";
  jti: string;
  familyId?: string;
}

interface AuthRequest extends Request {
  auth?: AuthPayload;
  rawBody?: string;
  requestId?: string;
}

const nowIso = (): string => new Date().toISOString();
const dayKey = (date: Date): string => date.toISOString().slice(0, 10);
const monthKey = (date: Date): string => date.toISOString().slice(0, 7);
const sha256 = (value: string): string => crypto.createHash("sha256").update(value).digest("hex");
const asParam = (value: string | string[] | undefined): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""));
const normalizeEmail = (value: string): string => value.trim().toLowerCase();
const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isStrongPassword = (value: string): boolean =>
  value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

const sendError = (res: Response, status: number, code: string, message: string): Response => {
  const body: { error: ApiError } = { error: { code, message } };
  return res.status(status).json(body);
};

const randomBackupCodes = (): string[] =>
  Array.from({ length: 8 }, () => crypto.randomBytes(4).toString("hex"));

const evaluateRisk = (lastEvent: LoginEvent | undefined, ip: string, device: string): number => {
  if (!lastEvent) {
    return 20;
  }
  let score = 20;
  if (lastEvent.ip !== ip) {
    score += 35;
  }
  if (lastEvent.device !== device) {
    score += 35;
  }
  return Math.min(score, 100);
};

const store = {
  users: new Map<string, User>(),
  usersByEmail: new Map<string, string>(),
  sessions: new Map<string, SessionRecord>(),
  refreshTokens: new Map<string, RefreshTokenRecord>(),
  securitySettings: new Map<string, SecuritySettings>(),
  loginEvents: [] as LoginEvent[],
  planEntitlements: [] as PlanEntitlement[],
  dailyUsage: new Map<string, DailySubmissionUsage>(),
  monthlyUsage: new Map<string, MonthlyUsage>(),
  problems: new Map<string, Problem>(),
  testCases: [] as ProblemTestCase[],
  submissions: new Map<string, Submission>(),
  executionRuns: new Map<string, ExecutionRun>(),
  traces: new Map<string, VisualizerTrace>(),
  coreSubjects: [
    { subject: "os", topic: "process-scheduling", content: "CPU scheduling algorithms overview." },
    { subject: "dbms", topic: "normalization", content: "1NF to BCNF with examples." },
    { subject: "cn", topic: "tcp-handshake", content: "SYN, SYN-ACK, ACK sequence." },
    { subject: "oop", topic: "solid", content: "SOLID principles and tradeoffs." }
  ],
  placementAttempts: [] as PlacementAttempt[],
  mentorshipBookings: [] as MentorshipBooking[],
  resumes: new Map<string, ResumeRecord>(),
  subscriptions: new Map<string, Subscription>(),
  billingEvents: new Map<string, BillingEvent>(),
  analyticsEvents: [] as AnalyticsEvent[],
  supportTickets: [] as SupportTicket[],
  auditLogs: [] as AdminAuditLog[],
  moduleProgress: [] as ModuleProgress[],
  learningGoals: new Map<string, UserLearningGoal>(),
  techSkills: [] as TechSkill[],
  techSkillProgress: [] as TechSkillProgress[],
  recentActivity: [] as RecentActivity[],
  techTaskAttempts: [] as TechSkillTaskAttempt[],
  authorityApplications: [] as AuthorityApplication[],
  companyTracks: [] as CompanyTrack[],
  referralProfiles: new Map<string, ReferralProfile>()
};

const seedData = (): void => {
  const makeUser = (email: string, password: string, role: Role, plan: Plan): User => ({
    id: uuidv4(),
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    plan,
    activeSessionId: null,
    createdAt: nowIso()
  });

  const user = makeUser("user@eyf.dev", "Password123!", "user", "free");
  const basicUser = makeUser("basic@eyf.dev", "Password123!", "user", "basic");
  const proUser = makeUser("pro@eyf.dev", "Password123!", "user", "pro");
  const staff = makeUser("staff@eyf.dev", "Password123!", "staff", "free");
  const admin = makeUser("admin@eyf.dev", "Password123!", "admin", "free");

  [user, basicUser, proUser, staff, admin].forEach((u) => {
    store.users.set(u.id, u);
    store.usersByEmail.set(u.email.toLowerCase(), u.id);
    store.securitySettings.set(u.id, {
      userId: u.id,
      totpEnabled: false,
      totpSecret: null,
      pendingTotpSecret: null,
      backupCodes: []
    });
    store.learningGoals.set(u.id, {
      userId: u.id,
      targetRole: "Backend Engineer",
      priorityModules: ["dsa", "tech-skills", "core-subjects"]
    });
  });

  const entitlements: PlanEntitlement[] = [
    { plan: "free", featureKey: "dsa_library", enabled: true, limitValue: 1 },
    { plan: "free", featureKey: "dsa_daily_submissions", enabled: true, limitValue: 10 },
    { plan: "free", featureKey: "core_subjects", enabled: true, limitValue: 1 },
    { plan: "free", featureKey: "visualizer", enabled: false, limitValue: null },
    { plan: "free", featureKey: "mock_interviews", enabled: false, limitValue: 0 },
    { plan: "free", featureKey: "mentorship_monthly", enabled: false, limitValue: 0 },
    { plan: "free", featureKey: "ai_code_review", enabled: false, limitValue: 0 },
    { plan: "free", featureKey: "resume_pdf_export", enabled: false, limitValue: 0 },
    { plan: "free", featureKey: "analytics_advanced", enabled: false, limitValue: 0 },
    { plan: "free", featureKey: "personalized_roadmap", enabled: false, limitValue: 0 },
    { plan: "free", featureKey: "company_prep_grids", enabled: false, limitValue: 0 },
    { plan: "free", featureKey: "referral_access", enabled: false, limitValue: 0 },
    { plan: "basic", featureKey: "dsa_library", enabled: true, limitValue: 2 },
    { plan: "basic", featureKey: "dsa_daily_submissions", enabled: true, limitValue: 50 },
    { plan: "basic", featureKey: "core_subjects", enabled: true, limitValue: 2 },
    { plan: "basic", featureKey: "visualizer", enabled: false, limitValue: null },
    { plan: "basic", featureKey: "mock_interviews", enabled: false, limitValue: 0 },
    { plan: "basic", featureKey: "mentorship_monthly", enabled: false, limitValue: 0 },
    { plan: "basic", featureKey: "ai_code_review", enabled: false, limitValue: 0 },
    { plan: "basic", featureKey: "resume_pdf_export", enabled: true, limitValue: 1 },
    { plan: "basic", featureKey: "analytics_advanced", enabled: false, limitValue: 0 },
    { plan: "basic", featureKey: "personalized_roadmap", enabled: false, limitValue: 0 },
    { plan: "basic", featureKey: "company_prep_grids", enabled: false, limitValue: 0 },
    { plan: "basic", featureKey: "referral_access", enabled: false, limitValue: 0 },
    { plan: "pro", featureKey: "dsa_library", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "dsa_daily_submissions", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "core_subjects", enabled: true, limitValue: 3 },
    { plan: "pro", featureKey: "visualizer", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "mock_interviews", enabled: true, limitValue: 10 },
    { plan: "pro", featureKey: "mentorship_monthly", enabled: true, limitValue: 1 },
    { plan: "pro", featureKey: "ai_code_review", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "resume_pdf_export", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "analytics_advanced", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "personalized_roadmap", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "company_prep_grids", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "referral_access", enabled: false, limitValue: 0 },
    { plan: "elite", featureKey: "dsa_library", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "dsa_daily_submissions", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "core_subjects", enabled: true, limitValue: 3 },
    { plan: "elite", featureKey: "visualizer", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "mock_interviews", enabled: true, limitValue: 1000 },
    { plan: "elite", featureKey: "mentorship_monthly", enabled: true, limitValue: 4 },
    { plan: "elite", featureKey: "ai_code_review", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "resume_pdf_export", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "analytics_advanced", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "personalized_roadmap", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "company_prep_grids", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "referral_access", enabled: true, limitValue: null }
  ];
  store.planEntitlements.push(...entitlements);

  const seededProblems: Problem[] = [
    {
      id: uuidv4(),
      title: "Two Sum",
      difficulty: "easy",
      topics: ["array", "hashmap"],
      planAccess: "free",
      statement: "Return indices of two numbers summing to target.",
      createdAt: nowIso()
    },
    {
      id: uuidv4(),
      title: "Longest Substring Without Repeating Characters",
      difficulty: "medium",
      topics: ["sliding-window", "string"],
      planAccess: "free",
      statement: "Find max substring length with unique chars.",
      createdAt: nowIso()
    },
    {
      id: uuidv4(),
      title: "Merge K Sorted Lists",
      difficulty: "hard",
      topics: ["heap", "linked-list"],
      planAccess: "pro",
      statement: "Merge all sorted linked lists into one sorted list.",
      createdAt: nowIso()
    }
  ];
  seededProblems.forEach((p) => store.problems.set(p.id, p));

  const firstProblem = seededProblems[0];
  const secondProblem = seededProblems[1];
  const thirdProblem = seededProblems[2];
  store.testCases.push(
    { id: uuidv4(), problemId: firstProblem.id, input: "2,7,11,15|9", expectedOutput: "[0,1]", isHidden: true },
    { id: uuidv4(), problemId: secondProblem.id, input: "abcabcbb", expectedOutput: "3", isHidden: true },
    { id: uuidv4(), problemId: thirdProblem.id, input: "[[1,4],[1,3],[2,6]]", expectedOutput: "[1,1,2,3,4,6]", isHidden: true }
  );

  store.techSkills.push(
    {
      skillKey: "react",
      category: "frontend",
      name: "React",
      tasks: [
        { taskKey: "react-hooks-1", title: "Build hooks-based todo app", xpReward: 120 },
        { taskKey: "react-state-2", title: "State management with reducers", xpReward: 140 }
      ]
    },
    {
      skillKey: "node-api",
      category: "backend",
      name: "Node APIs",
      tasks: [
        { taskKey: "node-auth-1", title: "JWT auth middleware", xpReward: 160 },
        { taskKey: "node-cache-2", title: "Redis-style cache abstraction", xpReward: 150 }
      ]
    }
  );

  store.authorityApplications.push(
    {
      id: uuidv4(),
      userEmail: "candidate1@eyf.dev",
      module: "mentorship",
      assignedReviewerId: staff.id,
      status: "pending",
      createdAt: nowIso()
    },
    {
      id: uuidv4(),
      userEmail: "candidate2@eyf.dev",
      module: "placement",
      assignedReviewerId: staff.id,
      status: "pending",
      createdAt: nowIso()
    }
  );

  store.companyTracks.push(
    { id: uuidv4(), company: "Google", level: "sde-1", focus: ["graphs", "dp", "system-design-basics"] },
    { id: uuidv4(), company: "Amazon", level: "sde-1", focus: ["arrays", "trees", "lp-principles"] },
    { id: uuidv4(), company: "Microsoft", level: "intern", focus: ["strings", "oop", "os-networking"] },
    { id: uuidv4(), company: "Flipkart", level: "sde-1", focus: ["heaps", "greedy", "dbms-sql"] }
  );
};

seedData();

const recordAuditLog = (actor: AuthPayload, action: string, resourceType: string, resourceId: string): void => {
  store.auditLogs.push({
    id: uuidv4(),
    actorId: actor.sub,
    actorRole: actor.role,
    action,
    resourceType,
    resourceId,
    createdAt: nowIso()
  });
};

const hasAuthorityAccessToApplication = (auth: AuthPayload, item: AuthorityApplication): boolean =>
  auth.role === "admin" || item.assignedReviewerId === auth.sub;

const findEntitlement = (plan: Plan, featureKey: string): PlanEntitlement | undefined =>
  store.planEntitlements.find((e) => e.plan === plan && e.featureKey === featureKey);

const checkFeature = (user: User, featureKey: string): { enabled: boolean; limitValue: number | null } => {
  const entitlement = findEntitlement(user.plan, featureKey);
  if (!entitlement) {
    return { enabled: false, limitValue: null };
  }
  return { enabled: entitlement.enabled, limitValue: entitlement.limitValue };
};

const allowedPlansForUser = (plan: Plan): Plan[] => {
  if (plan === "elite") {
    return ["free", "basic", "pro", "elite"];
  }
  if (plan === "pro") {
    return ["free", "basic", "pro"];
  }
  if (plan === "basic") {
    return ["free", "basic"];
  }
  return ["free"];
};

const signAccessToken = (user: User, sessionId: string, zone: Zone): string => {
  const payload: Omit<AuthPayload, "type"> & { type: "access" } = {
    sub: user.id,
    role: user.role,
    sessionId,
    zone,
    type: "access",
    jti: uuidv4()
  };
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: "15m" });
};

const signRefreshToken = (user: User, sessionId: string, familyId: string): { token: string; jti: string } => {
  const jti = uuidv4();
  const payload: AuthPayload = {
    sub: user.id,
    role: user.role,
    sessionId,
    zone: "public",
    type: "refresh",
    jti,
    familyId
  };
  const token = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: "7d" });
  return { token, jti };
};

const parseBearerToken = (header: string | undefined): string | null => {
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
};

const authenticate = (zone: Zone) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    sendError(res, 401, "UNAUTHORIZED", "Missing bearer token.");
    return;
  }
  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, env.jwtAccessSecret) as AuthPayload;
  } catch {
    sendError(res, 401, "UNAUTHORIZED", "Invalid or expired token.");
    return;
  }
  if (payload.type !== "access" || payload.zone !== zone) {
    sendError(res, 401, "UNAUTHORIZED", "Token zone mismatch.");
    return;
  }
  const user = store.users.get(payload.sub);
  if (!user) {
    sendError(res, 401, "UNAUTHORIZED", "User not found.");
    return;
  }
  if (zone === "public") {
    if (!user.activeSessionId || user.activeSessionId !== payload.sessionId) {
      sendError(res, 401, "SESSION_REVOKED", "Session is no longer active.");
      return;
    }
    const session = store.sessions.get(payload.sessionId);
    if (!session || session.revokedAt) {
      sendError(res, 401, "SESSION_REVOKED", "Session is revoked.");
      return;
    }
  }
  req.auth = payload;
  next();
};

const requireRole = (...roles: Role[]) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.auth || !roles.includes(req.auth.role)) {
    sendError(res, 403, "FORBIDDEN", "Insufficient role permissions.");
    return;
  }
  next();
};

const app = express();

if (env.trustProxy) {
  app.set("trust proxy", 1);
}
app.disable("x-powered-by");

app.use((req: AuthRequest, res: Response, next: NextFunction) => {
  const requestId = String(req.headers["x-request-id"] ?? uuidv4());
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.corsAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS_NOT_ALLOWED"));
    },
    credentials: true
  })
);
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // Prevent forced HTTPS upgrade on localhost HTTP, which blanks the app.
        "upgrade-insecure-requests": null,
        // Allow Google Fonts and Font Awesome stylesheets/fonts
        "style-src": ["'self'", "https:", "'unsafe-inline'"],
        "font-src": ["'self'", "https:", "data:"],
        // Allow script bundles and Stitch static screen assets (tailwind CDN + inline config)
        "script-src": ["'self'", "https:", "'unsafe-inline'"],
        // Allow API calls to same origin
        "connect-src": ["'self'"],
        // Allow external images (e.g. avatars)
        "img-src": ["'self'", "data:", "https:"],
      }
    }
  })
);
app.use(compression());
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :req[x-request-id]", {
    skip: (req) => req.path === "/api/v1/health" || req.path === "/api/v1/live" || req.path === "/api/v1/ready"
  })
);

app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      const authReq = req as AuthRequest;
      authReq.rawBody = buf.toString("utf8");
    }
  })
);

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many authentication requests. Please try again later."
    }
  }
});
app.use("/api/v1/auth", authRateLimiter);

app.get("/api/v1/live", (_req, res) =>
  res.status(200).json({ service: env.appName, status: "alive", uptimeSeconds: Math.floor(process.uptime()) })
);

app.get("/api/v1/ready", (_req, res) =>
  res.status(200).json({
    service: env.appName,
    status: "ready",
    checks: {
      jwtAccessSecret: Boolean(env.jwtAccessSecret),
      jwtRefreshSecret: Boolean(env.jwtRefreshSecret),
      billingWebhookSecret: Boolean(env.billingWebhookSecret)
    }
  })
);

app.get("/api/v1/health", (_req, res) =>
  res.status(200).json({ service: env.appName, status: "ok", environment: env.nodeEnv })
);

app.get("/api/v1", (_req, res) =>
  res.status(200).json({ name: env.appName, version: "v1", message: "EYF API is running." })
);

app.post("/api/v1/auth/register", (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    sendError(res, 400, "INVALID_INPUT", "Email and password are required.");
    return;
  }
  const key = normalizeEmail(email);
  if (!isValidEmail(key)) {
    sendError(res, 400, "INVALID_INPUT", "A valid email is required.");
    return;
  }
  if (!isStrongPassword(password)) {
    sendError(
      res,
      400,
      "INVALID_INPUT",
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
    );
    return;
  }
  if (store.usersByEmail.has(key)) {
    sendError(res, 409, "EMAIL_EXISTS", "User already exists.");
    return;
  }
  const user: User = {
    id: uuidv4(),
    email: key,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "user",
    plan: "free",
    activeSessionId: null,
    createdAt: nowIso()
  };
  store.users.set(user.id, user);
  store.usersByEmail.set(key, user.id);
  store.securitySettings.set(user.id, {
    userId: user.id,
    totpEnabled: false,
    totpSecret: null,
    pendingTotpSecret: null,
    backupCodes: []
  });
  res.status(201).json({ id: user.id, email: user.email, role: user.role, plan: user.plan });
});

app.post("/api/v1/auth/login", (req: Request, res: Response) => {
  const { email, password, otp } = req.body as { email?: string; password?: string; otp?: string };
  if (!email || !password) {
    sendError(res, 400, "INVALID_INPUT", "Email and password are required.");
    return;
  }
  const emailKey = normalizeEmail(email);
  if (!isValidEmail(emailKey)) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid credentials.");
    return;
  }
  const userId = store.usersByEmail.get(emailKey);
  if (!userId) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid credentials.");
    return;
  }
  const user = store.users.get(userId);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid credentials.");
    return;
  }

  const ip = req.ip || "unknown";
  const device = String(req.headers["x-device-id"] ?? "web");
  const previousEvent = [...store.loginEvents].reverse().find((e) => e.userId === user.id);
  const riskScore = evaluateRisk(previousEvent, ip, device);
  const sec = store.securitySettings.get(user.id);
  if (!sec) {
    sendError(res, 500, "SECURITY_SETTINGS_MISSING", "Security settings not configured.");
    return;
  }

  if (riskScore >= 85) {
    store.loginEvents.push({ id: uuidv4(), userId: user.id, ip, device, riskScore, outcome: "blocked", createdAt: nowIso() });
    sendError(res, 403, "RISK_CHALLENGE_REQUIRED", "High risk login blocked.");
    return;
  }

  if (riskScore >= 60) {
    if (!sec.totpEnabled) {
      store.loginEvents.push({
        id: uuidv4(),
        userId: user.id,
        ip,
        device,
        riskScore,
        outcome: "two_fa_required",
        createdAt: nowIso()
      });
      sendError(res, 401, "TWO_FA_REQUIRED", "Enable 2FA to continue this login.");
      return;
    }
    const validTotp =
      !!otp &&
      !!sec.totpSecret &&
      speakeasy.totp.verify({ secret: sec.totpSecret, encoding: "base32", token: otp, window: 1 });
    const backupCodeIndex = otp ? sec.backupCodes.indexOf(otp) : -1;
    const validBackup = backupCodeIndex >= 0;
    if (!validTotp && !validBackup) {
      sendError(res, 401, "TWO_FA_REQUIRED", "A valid OTP or backup code is required.");
      return;
    }
    if (validBackup) {
      sec.backupCodes.splice(backupCodeIndex, 1);
    }
  }

  if (user.activeSessionId) {
    const active = store.sessions.get(user.activeSessionId);
    if (active) {
      active.revokedAt = nowIso();
    }
  }

  const sessionId = uuidv4();
  const session: SessionRecord = {
    id: sessionId,
    userId: user.id,
    sessionId: sessionId,
    zone: "public",
    ip,
    device,
    createdAt: nowIso(),
    revokedAt: null
  };
  store.sessions.set(session.id, session);
  user.activeSessionId = session.id;

  const familyId = uuidv4();
  const accessToken = signAccessToken(user, session.id, "public");
  const refreshSigned = signRefreshToken(user, session.id, familyId);
  store.refreshTokens.set(refreshSigned.jti, {
    id: refreshSigned.jti,
    userId: user.id,
    sessionId: session.id,
    familyId,
    tokenHash: sha256(refreshSigned.token),
    used: false,
    revoked: false,
    createdAt: nowIso()
  });

  store.loginEvents.push({ id: uuidv4(), userId: user.id, ip, device, riskScore, outcome: "allowed", createdAt: nowIso() });
  res.status(200).json({
    accessToken,
    refreshToken: refreshSigned.token,
    user: { id: user.id, email: user.email, role: user.role, plan: user.plan }
  });
});

app.post("/api/v1/auth/refresh", (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    sendError(res, 400, "INVALID_INPUT", "refreshToken is required.");
    return;
  }
  let payload: AuthPayload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as AuthPayload;
  } catch {
    sendError(res, 401, "UNAUTHORIZED", "Invalid refresh token.");
    return;
  }
  if (payload.type !== "refresh" || !payload.familyId) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid refresh token payload.");
    return;
  }
  const tokenRecord = store.refreshTokens.get(payload.jti);
  if (!tokenRecord || tokenRecord.tokenHash !== sha256(refreshToken)) {
    sendError(res, 401, "UNAUTHORIZED", "Refresh token not recognized.");
    return;
  }
  if (tokenRecord.used) {
    for (const record of store.refreshTokens.values()) {
      if (record.familyId === tokenRecord.familyId) {
        record.revoked = true;
      }
    }
    const user = store.users.get(tokenRecord.userId);
    if (user && user.activeSessionId === tokenRecord.sessionId) {
      user.activeSessionId = null;
      const session = store.sessions.get(tokenRecord.sessionId);
      if (session) {
        session.revokedAt = nowIso();
      }
    }
    sendError(res, 401, "TOKEN_REUSE_DETECTED", "Refresh token replay detected.");
    return;
  }
  if (tokenRecord.revoked) {
    sendError(res, 401, "UNAUTHORIZED", "Refresh token has been revoked.");
    return;
  }
  const user = store.users.get(tokenRecord.userId);
  if (!user || !user.activeSessionId || user.activeSessionId !== tokenRecord.sessionId) {
    sendError(res, 401, "SESSION_REVOKED", "Session is not active.");
    return;
  }
  tokenRecord.used = true;
  const accessToken = signAccessToken(user, tokenRecord.sessionId, "public");
  const refreshSigned = signRefreshToken(user, tokenRecord.sessionId, tokenRecord.familyId);
  store.refreshTokens.set(refreshSigned.jti, {
    id: refreshSigned.jti,
    userId: user.id,
    sessionId: tokenRecord.sessionId,
    familyId: tokenRecord.familyId,
    tokenHash: sha256(refreshSigned.token),
    used: false,
    revoked: false,
    createdAt: nowIso()
  });
  res.status(200).json({ accessToken, refreshToken: refreshSigned.token });
});

app.post("/api/v1/auth/logout", authenticate("public"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 401, "UNAUTHORIZED", "User not found.");
    return;
  }
  const session = store.sessions.get(req.auth.sessionId);
  if (session) {
    session.revokedAt = nowIso();
  }
  if (user.activeSessionId === req.auth.sessionId) {
    user.activeSessionId = null;
  }
  for (const record of store.refreshTokens.values()) {
    if (record.sessionId === req.auth.sessionId) {
      record.revoked = true;
    }
  }
  res.status(200).json({ ok: true });
});

// ── Change password ──────────────────────────────────────────────────────────
app.post("/api/v1/auth/change-password", authenticate("public"), (req: AuthRequest, res: Response) => {
  if (!req.auth) { sendError(res, 401, "UNAUTHORIZED", "Not authenticated."); return; }
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    sendError(res, 400, "INVALID_INPUT", "currentPassword and newPassword are required.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) { sendError(res, 404, "NOT_FOUND", "User not found."); return; }
  if (user.passwordHash !== currentPassword && !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    sendError(res, 400, "INVALID_CREDENTIALS", "Current password is incorrect.");
    return;
  }
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  recordAuditLog(req.auth, "password_changed", "user", user.id);
  res.status(200).json({ ok: true });
});

app.post("/api/v1/security/2fa/setup", authenticate("public"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  const sec = store.securitySettings.get(req.auth.sub);
  if (!user || !sec) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  const generated = speakeasy.generateSecret({ name: `EYF (${user.email})`, issuer: "EYF" });
  sec.pendingTotpSecret = generated.base32;
  res.status(200).json({ secret: generated.base32, otpauthUrl: generated.otpauth_url });
});

app.post("/api/v1/security/2fa/verify", authenticate("public"), (req: AuthRequest, res: Response) => {
  const { code } = req.body as { code?: string };
  if (!req.auth || !code) {
    sendError(res, 400, "INVALID_INPUT", "code is required.");
    return;
  }
  const sec = store.securitySettings.get(req.auth.sub);
  if (!sec || !sec.pendingTotpSecret) {
    sendError(res, 400, "TWO_FA_SETUP_REQUIRED", "2FA setup must be initiated first.");
    return;
  }
  const valid = speakeasy.totp.verify({ secret: sec.pendingTotpSecret, encoding: "base32", token: code, window: 1 });
  if (!valid) {
    sendError(res, 400, "INVALID_OTP", "Invalid OTP code.");
    return;
  }
  sec.totpEnabled = true;
  sec.totpSecret = sec.pendingTotpSecret;
  sec.pendingTotpSecret = null;
  sec.backupCodes = randomBackupCodes();
  res.status(200).json({ enabled: true, backupCodes: sec.backupCodes });
});

app.post("/api/v1/security/2fa/disable", authenticate("public"), (req: AuthRequest, res: Response) => {
  const { code } = req.body as { code?: string };
  if (!req.auth || !code) {
    sendError(res, 400, "INVALID_INPUT", "code is required.");
    return;
  }
  const sec = store.securitySettings.get(req.auth.sub);
  if (!sec || !sec.totpEnabled || !sec.totpSecret) {
    sendError(res, 400, "TWO_FA_NOT_ENABLED", "2FA is not enabled.");
    return;
  }
  const validTotp = speakeasy.totp.verify({ secret: sec.totpSecret, encoding: "base32", token: code, window: 1 });
  const backupCodeIndex = sec.backupCodes.indexOf(code);
  if (!validTotp && backupCodeIndex < 0) {
    sendError(res, 400, "INVALID_OTP", "Invalid OTP or backup code.");
    return;
  }
  if (backupCodeIndex >= 0) {
    sec.backupCodes.splice(backupCodeIndex, 1);
  }
  sec.totpEnabled = false;
  sec.totpSecret = null;
  sec.pendingTotpSecret = null;
  sec.backupCodes = [];
  res.status(200).json({ enabled: false });
});

app.get("/api/v1/security/sessions", authenticate("public"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const sessions = [...store.sessions.values()].filter((s) => s.userId === req.auth?.sub);
  res.status(200).json({ sessions });
});

app.post("/api/v1/security/sessions/:id/revoke", authenticate("public"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const sessionIdParam = asParam(req.params.id);
  const session = store.sessions.get(sessionIdParam);
  if (!session || session.userId !== req.auth.sub) {
    sendError(res, 403, "FORBIDDEN_RESOURCE_ACCESS", "Cannot revoke another user's session.");
    return;
  }
  session.revokedAt = nowIso();
  const user = store.users.get(req.auth.sub);
  if (user?.activeSessionId === session.id) {
    user.activeSessionId = null;
  }
  res.status(200).json({ revoked: true, sessionId: session.id });
});

app.get("/api/v1/security/logins", authenticate("public"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const events = [...store.loginEvents]
    .filter((e) => e.userId === req.auth?.sub)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);
  res.status(200).json({ events });
});

app.get("/api/v1/dashboard", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  const recommendation = generateRecommendation(user);
  const accepted = [...store.submissions.values()].filter((s) => s.userId === user.id && s.status === "accepted").length;
  res.status(200).json({
    user: { id: user.id, email: user.email, plan: user.plan },
    metrics: { acceptedSubmissions: accepted, totalProblems: store.problems.size },
    recommendation
  });
});

app.get("/api/v1/problems", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  const difficulty = req.query.difficulty ? String(req.query.difficulty) : null;
  const topic = req.query.topic ? String(req.query.topic) : null;
  const search = req.query.search ? String(req.query.search).toLowerCase() : null;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);

  const allowedPlans = allowedPlansForUser(user.plan);
  const filtered = [...store.problems.values()].filter((problem) => {
    if (!allowedPlans.includes(problem.planAccess)) {
      return false;
    }
    if (difficulty && problem.difficulty !== difficulty) {
      return false;
    }
    if (topic && !problem.topics.includes(topic)) {
      return false;
    }
    if (search && !problem.title.toLowerCase().includes(search)) {
      return false;
    }
    return true;
  });

  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);
  res.status(200).json({ items: paged, page, limit, total: filtered.length });
});

app.get("/api/v1/problems/:id", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  const problemIdParam = asParam(req.params.id);
  const problem = store.problems.get(problemIdParam);
  if (!user || !problem) {
    sendError(res, 404, "NOT_FOUND", "Problem not found.");
    return;
  }
  const allowedPlans = allowedPlansForUser(user.plan);
  if (!allowedPlans.includes(problem.planAccess)) {
    sendError(res, 403, "FEATURE_LOCKED", "Problem is locked for current plan.");
    return;
  }
  res.status(200).json(problem);
});

app.post("/api/v1/problems/:id/run", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { language, code, input } = req.body as { language?: string; code?: string; input?: string };
  if (!req.auth || !language || !code) {
    sendError(res, 400, "INVALID_INPUT", "language and code are required.");
    return;
  }
  const runProblemId = asParam(req.params.id);
  if (!store.problems.has(runProblemId)) {
    sendError(res, 404, "NOT_FOUND", "Problem not found.");
    return;
  }
  const run: ExecutionRun = {
    id: uuidv4(),
    userId: req.auth.sub,
    problemId: runProblemId,
    stdout: code.trim() ? `Executed input: ${input ?? ""}` : "",
    stderr: code.trim() ? "" : "No code provided.",
    runtimeMs: Math.floor(Math.random() * 80) + 20,
    exitCode: code.trim() ? 0 : 1,
    createdAt: nowIso()
  };
  store.executionRuns.set(run.id, run);
  store.recentActivity.unshift({
    id: uuidv4(),
    userId: req.auth.sub,
    moduleKey: "dsa",
    action: `Run executed for problem ${runProblemId}`,
    createdAt: nowIso()
  });
  res.status(200).json(run);
});

app.post("/api/v1/problems/:id/submit", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { language, code } = req.body as { language?: string; code?: string };
  if (!req.auth || !language || !code) {
    sendError(res, 400, "INVALID_INPUT", "language and code are required.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  const submitProblemId = asParam(req.params.id);
  const problem = store.problems.get(submitProblemId);
  if (!user || !problem) {
    sendError(res, 404, "NOT_FOUND", "Problem not found.");
    return;
  }
  const subEntitlement = checkFeature(user, "dsa_daily_submissions");
  if (!subEntitlement.enabled) {
    sendError(res, 403, "FEATURE_LOCKED", "Submissions are not enabled.");
    return;
  }
  const today = dayKey(new Date());
  const usageKey = `${user.id}:${today}`;
  const usage = store.dailyUsage.get(usageKey) ?? { userId: user.id, date: today, count: 0 };
  if (subEntitlement.limitValue !== null && usage.count >= subEntitlement.limitValue) {
    sendError(res, 429, "QUOTA_EXCEEDED", "Daily submission limit reached.");
    return;
  }

  const hiddenCases = store.testCases.filter((tc) => tc.problemId === problem.id && tc.isHidden);
  const accepted = code.includes("return") && !code.includes("TODO") && hiddenCases.length > 0;
  usage.count += 1;
  store.dailyUsage.set(usageKey, usage);

  const submission: Submission = {
    id: uuidv4(),
    userId: user.id,
    problemId: problem.id,
    language,
    sourceCode: code,
    status: accepted ? "accepted" : "wrong_answer",
    runtimeMs: Math.floor(Math.random() * 100) + 30,
    memoryKb: Math.floor(Math.random() * 5000) + 1000,
    createdAt: nowIso()
  };
  store.submissions.set(submission.id, submission);
  store.recentActivity.unshift({
    id: uuidv4(),
    userId: user.id,
    moduleKey: "dsa",
    action: `Submission ${submission.status} for ${problem.title}`,
    createdAt: nowIso()
  });
  res.status(200).json({
    submissionId: submission.id,
    status: submission.status,
    runtimeMs: submission.runtimeMs,
    memoryKb: submission.memoryKb,
    dailyUsage: usage.count,
    dailyLimit: subEntitlement.limitValue
  });
});

const generateRecommendation = (user: User): { module: string; action: string; reasonCode: string } => {
  const today = dayKey(new Date());
  const usage = store.dailyUsage.get(`${user.id}:${today}`)?.count ?? 0;
  const dsaLimit = checkFeature(user, "dsa_daily_submissions").limitValue;
  if (dsaLimit !== null && usage >= dsaLimit) {
    return { module: "core-subjects", action: "Review DBMS normalization", reasonCode: "DAILY_QUOTA_REACHED" };
  }
  const lastSubmission = [...store.submissions.values()]
    .filter((s) => s.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!lastSubmission) {
    return { module: "dsa", action: "Solve Two Sum", reasonCode: "COLD_START" };
  }
  if (lastSubmission.status !== "accepted") {
    return { module: "visualizer", action: `Inspect submission ${lastSubmission.id}`, reasonCode: "RECENT_FAILURE" };
  }
  return { module: "tech-skills", action: "Complete task react-hooks-1", reasonCode: "ROADMAP_ADHERENCE" };
};

const calculateUserProgress = (userId: string): { xp: number; streak: number } => {
  const acceptedSubmissions = [...store.submissions.values()].filter((s) => s.userId === userId && s.status === "accepted").length;
  const xpFromSubmissions = acceptedSubmissions * 10;
  const xpFromSkills = store.techSkillProgress.filter((p) => p.userId === userId).reduce((sum, p) => sum + p.xp, 0);
  const totalXp = xpFromSubmissions + xpFromSkills;
  const streak = Math.min(14, store.recentActivity.filter((a) => a.userId === userId).length);
  return { xp: totalXp, streak };
};

// ── Submissions list ─────────────────────────────────────────────────────────
app.get("/api/v1/submissions", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) { sendError(res, 401, "UNAUTHORIZED", "Not authenticated."); return; }
  const userSubs = [...store.submissions.values()]
    .filter((s) => s.userId === req.auth!.sub)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const problems = store.problems;
  const items = userSubs.map((s) => {
    const problem = problems.get(s.problemId);
    return {
      id: s.id,
      problemId: s.problemId,
      problemTitle: problem?.title ?? `Problem ${s.problemId}`,
      verdict: s.status,
      language: s.language,
      runtime: s.runtimeMs ? `${s.runtimeMs}ms` : undefined,
      memory: s.memoryKb ? `${s.memoryKb}KB` : undefined,
      createdAt: s.createdAt,
    };
  });
  res.status(200).json({ items });
});

app.get("/api/v1/recommendations/next", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  res.status(200).json(generateRecommendation(user));
});

// ── Standalone visualizer trace (no submission needed) ───────────────────────
app.post("/api/v1/visualizer/trace", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) { sendError(res, 401, "UNAUTHORIZED", "Not authenticated."); return; }
  const user = store.users.get(req.auth.sub);
  if (!user) { sendError(res, 404, "NOT_FOUND", "User not found."); return; }
  const ent = checkFeature(user, "visualizer");
  if (!ent.enabled) {
    sendError(res, 403, "FEATURE_LOCKED", "Visualizer is available on Pro and Elite plans only.");
    return;
  }
  const { algorithm = "Bubble Sort", input = "" } = req.body as { algorithm?: string; input?: string };
  // Generate deterministic trace steps based on algorithm name + input
  const inputArr = (() => {
    try { return JSON.parse(input) as unknown[]; } catch { return input.split(",").map((x) => x.trim()); }
  })();
  const steps = inputArr.slice(0, 20).map((val, i) => ({
    step: i + 1,
    description: `${algorithm} — processing element ${i + 1}: ${String(val)}`,
    state: { array: inputArr, currentIndex: i, comparing: i > 0 ? i - 1 : null },
    highlight: [i],
  }));
  steps.push({
    step: steps.length + 1,
    description: `${algorithm} — complete`,
    state: { array: [...inputArr].sort((a, b) => Number(a) - Number(b)), currentIndex: -1, comparing: null },
    highlight: [],
  });
  res.status(200).json({ id: uuidv4(), algorithm, steps });
});

app.post("/api/v1/visualizer/:submission_id/trace", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  const traceSubmissionId = asParam(req.params.submission_id);
  const submission = store.submissions.get(traceSubmissionId);
  if (!user || !submission) {
    sendError(res, 404, "NOT_FOUND", "Submission not found.");
    return;
  }
  if (submission.userId !== user.id) {
    sendError(res, 403, "FORBIDDEN_RESOURCE_ACCESS", "Cannot visualize another user's submission.");
    return;
  }
  const ent = checkFeature(user, "visualizer");
  if (!ent.enabled) {
    sendError(res, 403, "FEATURE_LOCKED", "Visualizer is available on Pro and Elite plans only.");
    return;
  }
  const trace: VisualizerTrace = {
    id: uuidv4(),
    submissionId: submission.id,
    status: submission.status === "accepted" ? "completed" : "failed",
    retryCount: 0,
    createdAt: nowIso(),
    frames:
      submission.status === "accepted"
        ? submission.sourceCode
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .slice(0, 50)
            .map((line, index) => ({ index, line, locals: { i: index } }))
        : []
  };
  store.traces.set(trace.id, trace);
  res.status(202).json({ traceId: trace.id, status: trace.status, frames: trace.frames });
});

app.get("/api/v1/visualizer/:submission_id", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const getTraceSubmissionId = asParam(req.params.submission_id);
  const submission = store.submissions.get(getTraceSubmissionId);
  if (!submission || submission.userId !== req.auth.sub) {
    sendError(res, 404, "NOT_FOUND", "Visualizer trace not found for submission.");
    return;
  }
  const trace = [...store.traces.values()]
    .filter((t) => t.submissionId === submission.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!trace) {
    sendError(res, 404, "NOT_FOUND", "Trace not generated.");
    return;
  }
  res.status(200).json(trace);
});

app.post("/api/v1/visualizer/:submission_id/trace/retry", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const retryTraceSubmissionId = asParam(req.params.submission_id);
  const submission = store.submissions.get(retryTraceSubmissionId);
  if (!submission || submission.userId !== req.auth.sub) {
    sendError(res, 404, "NOT_FOUND", "Submission not found.");
    return;
  }
  const trace = [...store.traces.values()]
    .filter((t) => t.submissionId === submission.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (!trace) {
    sendError(res, 404, "NOT_FOUND", "No trace exists for retry.");
    return;
  }
  if (trace.retryCount >= 2) {
    sendError(res, 429, "RETRY_LIMIT_REACHED", "Retry limit reached.");
    return;
  }
  trace.retryCount += 1;
  if (submission.status === "accepted") {
    trace.status = "completed";
    trace.frames = submission.sourceCode
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .slice(0, 50)
      .map((line, index) => ({ index, line, locals: { i: index } }));
  } else {
    trace.status = "failed";
  }
  res.status(200).json(trace);
});

app.get("/api/v1/core-subjects", authenticate("public"), requireRole("user"), (_req: AuthRequest, res: Response) => {
  res.status(200).json({ items: store.coreSubjects });
});

app.get("/api/v1/core-subjects/:subject/:topic", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const subjectParam = asParam(req.params.subject);
  const topicParam = asParam(req.params.topic);
  const item = store.coreSubjects.find((s) => s.subject === subjectParam && s.topic === topicParam);
  if (!item) {
    sendError(res, 404, "NOT_FOUND", "Topic not found.");
    return;
  }
  res.status(200).json(item);
});

app.post("/api/v1/placement/attempts", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { company, role, outcome } = req.body as { company?: string; role?: string; outcome?: string };
  if (!req.auth || !company || !role || !outcome) {
    sendError(res, 400, "INVALID_INPUT", "company, role, outcome are required.");
    return;
  }
  const attempt: PlacementAttempt = {
    id: uuidv4(),
    userId: req.auth.sub,
    company,
    role,
    kind: "placement",
    outcome,
    createdAt: nowIso()
  };
  store.placementAttempts.push(attempt);
  res.status(201).json(attempt);
});

app.get("/api/v1/placement/attempts", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  res.status(200).json({
    items: store.placementAttempts.filter((a) => a.userId === req.auth?.sub && a.kind === "placement")
  });
});

app.post("/api/v1/placement/mock-attempts", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { company, role, outcome } = req.body as { company?: string; role?: string; outcome?: string };
  if (!req.auth || !company || !role || !outcome) {
    sendError(res, 400, "INVALID_INPUT", "company, role, outcome are required.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  const mock = checkFeature(user, "mock_interviews");
  if (!mock.enabled) {
    sendError(res, 403, "FEATURE_LOCKED", "Mock interviews are locked for current plan.");
    return;
  }
  const attempt: PlacementAttempt = {
    id: uuidv4(),
    userId: req.auth.sub,
    company,
    role,
    kind: "mock",
    outcome,
    createdAt: nowIso()
  };
  store.placementAttempts.push(attempt);
  res.status(201).json(attempt);
});

app.post("/api/v1/mentorship/bookings", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { mentorId, scheduledAt } = req.body as { mentorId?: string; scheduledAt?: string };
  if (!req.auth || !mentorId || !scheduledAt) {
    sendError(res, 400, "INVALID_INPUT", "mentorId and scheduledAt are required.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  const ent = checkFeature(user, "mentorship_monthly");
  if (!ent.enabled) {
    sendError(res, 403, "FEATURE_LOCKED", "Mentorship is locked for current plan.");
    return;
  }
  const month = monthKey(new Date(scheduledAt));
  const key = `${user.id}:${month}`;
  const usage = store.monthlyUsage.get(key) ?? { userId: user.id, month, mentorshipUsed: 0 };
  if (ent.limitValue !== null && usage.mentorshipUsed >= ent.limitValue) {
    sendError(res, 429, "MENTORSHIP_QUOTA_EXCEEDED", "Monthly mentorship quota reached.");
    return;
  }
  usage.mentorshipUsed += 1;
  store.monthlyUsage.set(key, usage);
  const booking: MentorshipBooking = {
    id: uuidv4(),
    userId: user.id,
    mentorId,
    scheduledAt,
    month,
    status: "booked"
  };
  store.mentorshipBookings.push(booking);
  res.status(201).json(booking);
});

app.get("/api/v1/mentorship/bookings", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  res.status(200).json({ items: store.mentorshipBookings.filter((b) => b.userId === req.auth?.sub) });
});

app.post("/api/v1/resume/save", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { template, data } = req.body as { template?: string; data?: Record<string, unknown> };
  if (!req.auth || !template || !data || typeof data !== "object") {
    sendError(res, 400, "INVALID_INPUT", "template and object data are required.");
    return;
  }
  const existing = store.resumes.get(req.auth.sub);
  const record: ResumeRecord = {
    id: existing?.id ?? uuidv4(),
    userId: req.auth.sub,
    template,
    dataJson: data,
    updatedAt: nowIso()
  };
  store.resumes.set(req.auth.sub, record);
  res.status(200).json(record);
});

app.get("/api/v1/resume", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const record = store.resumes.get(req.auth.sub);
  if (!record) {
    sendError(res, 404, "NOT_FOUND", "Resume not found.");
    return;
  }
  res.status(200).json(record);
});

app.post("/api/v1/resume/export-pdf", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const resume = store.resumes.get(req.auth.sub);
  if (!resume) {
    sendError(res, 404, "NOT_FOUND", "Resume not found.");
    return;
  }
  const watermark = `EYF:${req.auth.sub}:${new Date().toISOString()}`;
  const content = Buffer.from(`PDF-MOCK\n${JSON.stringify(resume.dataJson)}\nWATERMARK:${watermark}`).toString("base64");
  res.status(200).json({ fileName: "resume.pdf", contentBase64: content, watermark });
});

app.get("/api/v1/home/summary", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  const { xp: totalXp, streak } = calculateUserProgress(user.id);
  const today = dayKey(new Date());
  const usage = store.dailyUsage.get(`${user.id}:${today}`)?.count ?? 0;
  const dsaLimit = checkFeature(user, "dsa_daily_submissions").limitValue;
  res.status(200).json({
    user: { id: user.id, email: user.email, plan: user.plan },
    summary: { xp: totalXp, streak, dsaDailyUsage: usage, dsaDailyLimit: dsaLimit }
  });
});

app.get("/api/v1/home/recommendation", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  res.status(200).json(generateRecommendation(user));
});

app.get("/api/v1/home/recent-activity", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const items = store.recentActivity.filter((a) => a.userId === req.auth?.sub).slice(0, 30);
  res.status(200).json({ items });
});

app.get("/api/v1/home/daily-plan", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  const recommendation = generateRecommendation(user);
  const lastSubmission = [...store.submissions.values()]
    .filter((s) => s.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const weakArea = lastSubmission?.status === "wrong_answer" ? "Problem solving accuracy under pressure" : "Consistency and speed";
  const planItems = [
    { title: recommendation.action, durationMinutes: 30, priority: "high" as const },
    { title: "Revise one weak-topic concept", durationMinutes: 20, priority: "medium" as const },
    { title: "Update resume/project bullet by one measurable impact", durationMinutes: 15, priority: "medium" as const }
  ];
  res.status(200).json({
    date: dayKey(new Date()),
    weakArea,
    planItems
  });
});

app.get("/api/v1/company-tracks", authenticate("public"), requireRole("user"), (_req: AuthRequest, res: Response) => {
  res.status(200).json({ items: store.companyTracks });
});

app.get("/api/v1/leaderboard", authenticate("public"), requireRole("user"), (_req: AuthRequest, res: Response) => {
  const items = [...store.users.values()]
    .filter((u) => u.role === "user")
    .map((u) => {
      const { xp, streak } = calculateUserProgress(u.id);
      return {
        userId: u.id,
        email: u.email,
        xp,
        streak,
        plan: u.plan
      };
    })
    .sort((a, b) => b.xp - a.xp || b.streak - a.streak)
    .slice(0, 20)
    .map((entry, index) => ({
      rank: index + 1,
      email: entry.email,
      xp: entry.xp,
      streak: entry.streak,
      plan: entry.plan
    }));
  res.status(200).json({ items });
});

app.post("/api/v1/referrals/generate", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  const existing = store.referralProfiles.get(user.id);
  if (existing) {
    res.status(200).json(existing);
    return;
  }
  const profile: ReferralProfile = {
    userId: user.id,
    code: `EYF-${user.email.split("@")[0].toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
    referredCount: 0
  };
  store.referralProfiles.set(user.id, profile);
  res.status(201).json(profile);
});

app.get("/api/v1/referrals/me", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const profile = store.referralProfiles.get(req.auth.sub);
  if (!profile) {
    res.status(200).json({ userId: req.auth.sub, code: null, referredCount: 0 });
    return;
  }
  res.status(200).json(profile);
});

app.get("/api/v1/modules/status", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  const visualizer = checkFeature(user, "visualizer").enabled;
  const mock = checkFeature(user, "mock_interviews").enabled;
  const mentorship = checkFeature(user, "mentorship_monthly").enabled;
  res.status(200).json({
    items: [
      { module: "dsa", unlocked: true, progress: 35, cta: "Continue practice" },
      { module: "core-subjects", unlocked: true, progress: 20, cta: "Revise topic" },
      { module: "placement", unlocked: true, progress: 15, cta: "Attempt placement set" },
      { module: "resume", unlocked: true, progress: 60, cta: "Polish resume" },
      { module: "tech-skills", unlocked: true, progress: 25, cta: "Complete skill task" },
      { module: "visualizer", unlocked: visualizer, progress: 0, cta: visualizer ? "Generate trace" : "Upgrade to Pro" },
      { module: "mock-interviews", unlocked: mock, progress: 0, cta: mock ? "Start mock" : "Upgrade to Pro" },
      { module: "mentorship", unlocked: mentorship, progress: 0, cta: mentorship ? "Book session" : "Upgrade plan" }
    ]
  });
});

app.get("/api/v1/tech-skills/catalog", authenticate("public"), requireRole("user"), (_req: AuthRequest, res: Response) => {
  res.status(200).json({ items: store.techSkills });
});

app.get("/api/v1/tech-skills/:skill_key", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const skillKeyParam = asParam(req.params.skill_key);
  const skill = store.techSkills.find((s) => s.skillKey === skillKeyParam);
  if (!skill) {
    sendError(res, 404, "NOT_FOUND", "Skill not found.");
    return;
  }
  const progress = store.techSkillProgress.find((p) => p.userId === req.auth?.sub && p.skillKey === skill.skillKey) ?? {
    userId: req.auth?.sub ?? "",
    skillKey: skill.skillKey,
    level: 1,
    xp: 0
  };
  res.status(200).json({ skill, progress });
});

app.get("/api/v1/tech-skills/progress", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  res.status(200).json({ items: store.techSkillProgress.filter((p) => p.userId === req.auth?.sub) });
});

app.post("/api/v1/tech-skills/tasks/:task_key/start", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const startTaskKeyParam = asParam(req.params.task_key);
  const task = store.techSkills.flatMap((s) => s.tasks).find((t) => t.taskKey === startTaskKeyParam);
  if (!task) {
    sendError(res, 404, "NOT_FOUND", "Task not found.");
    return;
  }
  const existing = store.techTaskAttempts.find((a) => a.userId === req.auth?.sub && a.taskKey === task.taskKey);
  if (existing) {
    existing.status = "started";
    existing.evidence = null;
  } else {
    store.techTaskAttempts.push({ userId: req.auth.sub, taskKey: task.taskKey, status: "started", evidence: null });
  }
  store.recentActivity.unshift({
    id: uuidv4(),
    userId: req.auth.sub,
    moduleKey: "tech-skills",
    action: `Started task ${task.taskKey}`,
    createdAt: nowIso()
  });
  res.status(200).json({ taskKey: task.taskKey, status: "started" });
});

app.post("/api/v1/tech-skills/tasks/:task_key/submit", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { evidence } = req.body as { evidence?: string };
  if (!req.auth || !evidence) {
    sendError(res, 400, "INVALID_INPUT", "evidence is required.");
    return;
  }
  const submitTaskKeyParam = asParam(req.params.task_key);
  const skill = store.techSkills.find((s) => s.tasks.some((t) => t.taskKey === submitTaskKeyParam));
  const task = skill?.tasks.find((t) => t.taskKey === submitTaskKeyParam);
  if (!skill || !task) {
    sendError(res, 404, "NOT_FOUND", "Task not found.");
    return;
  }
  const attempt = store.techTaskAttempts.find((a) => a.userId === req.auth?.sub && a.taskKey === task.taskKey);
  if (!attempt || attempt.status === "not_started") {
    sendError(res, 400, "TASK_NOT_STARTED", "Start task before submitting.");
    return;
  }
  attempt.status = "submitted";
  attempt.evidence = evidence;

  const progress =
    store.techSkillProgress.find((p) => p.userId === req.auth?.sub && p.skillKey === skill.skillKey) ??
    (() => {
      const created: TechSkillProgress = { userId: req.auth?.sub ?? "", skillKey: skill.skillKey, level: 1, xp: 0 };
      store.techSkillProgress.push(created);
      return created;
    })();
  progress.xp += task.xpReward;
  progress.level = Math.min(5, Math.floor(progress.xp / 300) + 1);
  store.recentActivity.unshift({
    id: uuidv4(),
    userId: req.auth.sub,
    moduleKey: "tech-skills",
    action: `Submitted task ${task.taskKey}`,
    createdAt: nowIso()
  });
  res.status(200).json({ taskKey: task.taskKey, status: "submitted", skillProgress: progress });
});

app.get("/api/v1/tech-skills/tasks/:task_key/status", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Not authenticated.");
    return;
  }
  const attempt =
    store.techTaskAttempts.find((a) => a.userId === req.auth?.sub && a.taskKey === asParam(req.params.task_key)) ??
    ({ userId: req.auth.sub, taskKey: asParam(req.params.task_key), status: "not_started", evidence: null } as TechSkillTaskAttempt);
  res.status(200).json(attempt);
});

app.get("/api/v1/plans", (_req: Request, res: Response) => {
  res.status(200).json({
    plans: [
      { key: "free", monthlyPrice: 0 },
      { key: "basic", monthlyPrice: 249 },
      { key: "pro", monthlyPrice: 549 },
      { key: "elite", monthlyPrice: 999 }
    ]
  });
});

app.post("/api/v1/billing/checkout", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { plan } = req.body as { plan?: Plan };
  if (!req.auth || !plan || !["basic", "pro", "elite"].includes(plan)) {
    sendError(res, 400, "INVALID_INPUT", "plan must be basic, pro, or elite.");
    return;
  }
  res.status(201).json({
    checkoutId: uuidv4(),
    provider: "mock-provider",
    redirectUrl: `https://billing.example/checkout/${uuidv4()}`,
    plan
  });
});

app.post("/api/v1/billing/webhook", (req: AuthRequest, res: Response) => {
  const signature = String(req.headers["x-eyf-signature"] ?? "");
  if (!req.rawBody) {
    sendError(res, 400, "INVALID_WEBHOOK", "Raw body missing.");
    return;
  }
  const expected = crypto.createHmac("sha256", env.billingWebhookSecret).update(req.rawBody).digest("hex");
  if (signature !== expected) {
    sendError(res, 401, "WEBHOOK_SIGNATURE_INVALID", "Webhook signature mismatch.");
    return;
  }
  const body = req.body as {
    providerEventId?: string;
    type?: string;
    userId?: string;
    plan?: Plan;
    status?: "active" | "past_due" | "cancelled";
  };
  if (!body.providerEventId || !body.type || !body.userId) {
    sendError(res, 400, "INVALID_WEBHOOK", "providerEventId, type, userId are required.");
    return;
  }
  if (store.billingEvents.has(body.providerEventId)) {
    res.status(200).json({ ok: true, duplicate: true });
    return;
  }
  const user = store.users.get(body.userId);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found for webhook.");
    return;
  }
  const plan = body.plan ?? user.plan;
  const status = body.status ?? "active";
  user.plan = plan;
  const current = store.subscriptions.get(user.id);
  const sub: Subscription = {
    id: current?.id ?? uuidv4(),
    userId: user.id,
    plan,
    status,
    periodStart: current?.periodStart ?? nowIso(),
    periodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    providerSubId: current?.providerSubId ?? `sub_${uuidv4()}`
  };
  store.subscriptions.set(user.id, sub);
  store.billingEvents.set(body.providerEventId, {
    id: uuidv4(),
    providerEventId: body.providerEventId,
    type: body.type,
    userId: user.id,
    payload: req.body as Record<string, unknown>,
    processedAt: nowIso()
  });
  res.status(200).json({ ok: true });
});

app.post("/api/v1/billing/change-plan", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { plan } = req.body as { plan?: Plan };
  if (!req.auth || !plan || !["free", "basic", "pro", "elite"].includes(plan)) {
    sendError(res, 400, "INVALID_INPUT", "Valid plan is required.");
    return;
  }
  const user = store.users.get(req.auth.sub);
  if (!user) {
    sendError(res, 404, "USER_NOT_FOUND", "User not found.");
    return;
  }
  user.plan = plan;
  const current = store.subscriptions.get(user.id);
  store.subscriptions.set(user.id, {
    id: current?.id ?? uuidv4(),
    userId: user.id,
    plan,
    status: "active",
    periodStart: nowIso(),
    periodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    providerSubId: current?.providerSubId ?? `sub_${uuidv4()}`
  });
  res.status(200).json({ ok: true, plan });
});

app.post("/api/v1/analytics/events", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { eventType, payload } = req.body as { eventType?: string; payload?: Record<string, unknown> };
  if (!req.auth || !eventType || !payload || typeof payload !== "object") {
    sendError(res, 400, "INVALID_INPUT", "eventType and payload are required.");
    return;
  }
  const event: AnalyticsEvent = {
    id: uuidv4(),
    userId: req.auth.sub,
    eventType,
    payload,
    createdAt: nowIso()
  };
  store.analyticsEvents.push(event);
  res.status(201).json(event);
});

app.post("/api/v1/support/tickets", authenticate("public"), requireRole("user"), (req: AuthRequest, res: Response) => {
  const { subject, body } = req.body as { subject?: string; body?: string };
  if (!req.auth || !subject || !body) {
    sendError(res, 400, "INVALID_INPUT", "subject and body are required.");
    return;
  }
  const ticket: SupportTicket = {
    id: uuidv4(),
    userId: req.auth.sub,
    subject,
    body,
    status: "open",
    createdAt: nowIso()
  };
  store.supportTickets.push(ticket);
  res.status(201).json(ticket);
});

app.post("/api/v1/authority/login", (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    sendError(res, 400, "INVALID_INPUT", "email and password are required.");
    return;
  }
  const emailKey = normalizeEmail(email);
  if (!isValidEmail(emailKey)) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid authority credentials.");
    return;
  }
  const userId = store.usersByEmail.get(emailKey);
  const user = userId ? store.users.get(userId) : undefined;
  if (!user || (user.role !== "staff" && user.role !== "admin") || !bcrypt.compareSync(password, user.passwordHash)) {
    sendError(res, 401, "UNAUTHORIZED", "Invalid authority credentials.");
    return;
  }
  const sessionId = uuidv4();
  store.sessions.set(sessionId, {
    id: sessionId,
    userId: user.id,
    sessionId,
    zone: "authority",
    ip: req.ip || "unknown",
    device: String(req.headers["x-device-id"] ?? "authority-web"),
    createdAt: nowIso(),
    revokedAt: null
  });
  const token = signAccessToken(user, sessionId, "authority");
  res.status(200).json({ accessToken: token, user: { id: user.id, role: user.role, email: user.email } });
});

app.get("/api/v1/authority/queue", authenticate("authority"), requireRole("staff", "admin"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Missing bearer token.");
    return;
  }
  const scope = req.query.scope === "all" ? "all" : "pending";
  const visibleItems = store.authorityApplications.filter((item) => hasAuthorityAccessToApplication(req.auth as AuthPayload, item));
  const items = scope === "all" ? visibleItems : visibleItems.filter((a) => a.status === "pending");
  res.status(200).json({ items });
});

app.get(
  "/api/v1/authority/applications/:id",
  authenticate("authority"),
  requireRole("staff", "admin"),
  (req: AuthRequest, res: Response) => {
    const appIdParam = asParam(req.params.id);
    const item = store.authorityApplications.find((a) => a.id === appIdParam);
    if (!item) {
      sendError(res, 404, "NOT_FOUND", "Application not found.");
      return;
    }
    if (!req.auth || !hasAuthorityAccessToApplication(req.auth, item)) {
      sendError(res, 403, "FORBIDDEN_RESOURCE_ACCESS", "You are not allowed to access this application.");
      return;
    }
    res.status(200).json(item);
  }
);

app.post(
  "/api/v1/authority/applications/:id/actions",
  authenticate("authority"),
  requireRole("staff", "admin"),
  (req: AuthRequest, res: Response) => {
    const { action } = req.body as { action?: "approve" | "reject" };
    if (!req.auth || !action) {
      sendError(res, 400, "INVALID_INPUT", "action is required.");
      return;
    }
    const actionAppIdParam = asParam(req.params.id);
    const item = store.authorityApplications.find((a) => a.id === actionAppIdParam);
    if (!item) {
      sendError(res, 404, "NOT_FOUND", "Application not found.");
      return;
    }
    if (!hasAuthorityAccessToApplication(req.auth, item)) {
      sendError(res, 403, "FORBIDDEN_RESOURCE_ACCESS", "You are not allowed to modify this application.");
      return;
    }
    item.status = action === "approve" ? "approved" : "rejected";
    recordAuditLog(req.auth, `authority.${action}`, "application", item.id);
    res.status(200).json(item);
  }
);

app.post(
  "/api/v1/authority/applications/:id/reassign",
  authenticate("authority"),
  requireRole("admin"),
  (req: AuthRequest, res: Response) => {
    const { reviewerId } = req.body as { reviewerId?: string };
    if (!req.auth || !reviewerId) {
      sendError(res, 400, "INVALID_INPUT", "reviewerId is required.");
      return;
    }
    const item = store.authorityApplications.find((a) => a.id === asParam(req.params.id));
    if (!item) {
      sendError(res, 404, "NOT_FOUND", "Application not found.");
      return;
    }
    const reviewer = store.users.get(reviewerId);
    if (!reviewer || (reviewer.role !== "staff" && reviewer.role !== "admin")) {
      sendError(res, 400, "INVALID_INPUT", "reviewerId must reference a staff/admin account.");
      return;
    }
    item.assignedReviewerId = reviewer.id;
    recordAuditLog(req.auth, "authority.reassign", "application", item.id);
    res.status(200).json(item);
  }
);

// ── Authority admin stats ────────────────────────────────────────────────────
app.get("/api/v1/authority/admin/stats", authenticate("authority"), requireRole("staff", "admin"), (req: AuthRequest, res: Response) => {
  if (!req.auth) { sendError(res, 401, "UNAUTHORIZED", "Not authenticated."); return; }
  const users = [...store.users.values()];
  const tickets = store.supportTickets;
  const auditLogs = [...store.auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
  const stats = {
    totalUsers: users.length,
    activePlans: users.filter((u) => u.plan !== "free").length,
    revenue: users.reduce((sum, u) => {
      if (u.plan === "basic") return sum + 249;
      if (u.plan === "pro") return sum + 549;
      if (u.plan === "elite") return sum + 999;
      return sum;
    }, 0),
    openTickets: tickets.filter((t) => t.status === "open").length,
  };
  const recentActivity = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    user: log.actorId,
    createdAt: log.createdAt,
    type: log.resourceType,
  }));
  res.status(200).json({ stats, recentActivity });
});

app.get("/api/v1/admin/problems", authenticate("authority"), requireRole("staff", "admin"), (_req: AuthRequest, res: Response) => {
  res.status(200).json({ items: [...store.problems.values()] });
});

app.post("/api/v1/admin/problems", authenticate("authority"), requireRole("admin"), (req: AuthRequest, res: Response) => {
  const { title, difficulty, topics, planAccess, statement } = req.body as {
    title?: string;
    difficulty?: "easy" | "medium" | "hard";
    topics?: string[];
    planAccess?: Plan;
    statement?: string;
  };
  if (!title || !difficulty || !topics || !Array.isArray(topics) || !planAccess || !statement) {
    sendError(res, 400, "INVALID_INPUT", "title, difficulty, topics, planAccess, statement are required.");
    return;
  }
  const problem: Problem = { id: uuidv4(), title, difficulty, topics, planAccess, statement, createdAt: nowIso() };
  store.problems.set(problem.id, problem);
  if (req.auth) {
    recordAuditLog(req.auth, "admin.problem.create", "problem", problem.id);
  }
  res.status(201).json(problem);
});

app.put("/api/v1/admin/problems/:id", authenticate("authority"), requireRole("admin"), (req: AuthRequest, res: Response) => {
  const adminProblemId = asParam(req.params.id);
  const problem = store.problems.get(adminProblemId);
  if (!problem) {
    sendError(res, 404, "NOT_FOUND", "Problem not found.");
    return;
  }
  const updates = req.body as Partial<Pick<Problem, "title" | "difficulty" | "topics" | "planAccess" | "statement">>;
  if (updates.title) {
    problem.title = updates.title;
  }
  if (updates.difficulty) {
    problem.difficulty = updates.difficulty;
  }
  if (updates.topics) {
    problem.topics = updates.topics;
  }
  if (updates.planAccess) {
    problem.planAccess = updates.planAccess;
  }
  if (updates.statement) {
    problem.statement = updates.statement;
  }
  if (req.auth) {
    recordAuditLog(req.auth, "admin.problem.update", "problem", problem.id);
  }
  res.status(200).json(problem);
});

app.delete("/api/v1/admin/problems/:id", authenticate("authority"), requireRole("admin"), (req: AuthRequest, res: Response) => {
  const deleteProblemId = asParam(req.params.id);
  if (!store.problems.has(deleteProblemId)) {
    sendError(res, 404, "NOT_FOUND", "Problem not found.");
    return;
  }
  store.problems.delete(deleteProblemId);
  if (req.auth) {
    recordAuditLog(req.auth, "admin.problem.delete", "problem", deleteProblemId);
  }
  res.status(204).send();
});

app.get("/api/v1/admin/support-tickets", authenticate("authority"), requireRole("admin"), (_req: AuthRequest, res: Response) => {
  const items = store.supportTickets.map((ticket) => {
    const user = store.users.get(ticket.userId);
    return {
      ...ticket,
      userEmail: user?.email ?? "unknown@eyf.dev"
    };
  });
  res.status(200).json({ items });
});

app.post(
  "/api/v1/admin/support-tickets/:id/status",
  authenticate("authority"),
  requireRole("admin"),
  (req: AuthRequest, res: Response) => {
    const ticketId = asParam(req.params.id);
    const { status } = req.body as { status?: "open" | "closed" };
    if (!status || (status !== "open" && status !== "closed")) {
      sendError(res, 400, "INVALID_INPUT", "status must be open or closed.");
      return;
    }
    const ticket = store.supportTickets.find((item) => item.id === ticketId);
    if (!ticket) {
      sendError(res, 404, "NOT_FOUND", "Ticket not found.");
      return;
    }
    ticket.status = status;
    if (req.auth) {
      recordAuditLog(req.auth, "admin.support-ticket.status", "support-ticket", ticket.id);
    }
    res.status(200).json(ticket);
  }
);

app.get("/api/v1/admin/billing/subscriptions", authenticate("authority"), requireRole("admin"), (_req: AuthRequest, res: Response) => {
  const items = [...store.subscriptions.values()].map((sub) => {
    const user = store.users.get(sub.userId);
    return {
      ...sub,
      userEmail: user?.email ?? "unknown@eyf.dev"
    };
  });
  res.status(200).json({ items });
});

app.get("/api/v1/admin/billing/events", authenticate("authority"), requireRole("admin"), (_req: AuthRequest, res: Response) => {
  const items = [...store.billingEvents.values()]
    .map((event) => {
      const user = store.users.get(event.userId);
      return {
        ...event,
        userEmail: user?.email ?? "unknown@eyf.dev"
      };
    })
    .sort((a, b) => b.processedAt.localeCompare(a.processedAt));
  res.status(200).json({ items });
});

app.get("/api/v1/admin/audit-logs", authenticate("authority"), requireRole("staff", "admin"), (req: AuthRequest, res: Response) => {
  if (!req.auth) {
    sendError(res, 401, "UNAUTHORIZED", "Missing bearer token.");
    return;
  }
  const limitParam = Number(req.query.limit ?? 100);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 100;
  const scope = req.query.scope === "full" ? "full" : "own";
  if (scope === "full" && req.auth.role !== "admin") {
    sendError(res, 403, "ROLE_INSUFFICIENT", "Full audit log is restricted to admin role.");
    return;
  }
  const source =
    req.auth.role === "admin" && scope === "full"
      ? store.auditLogs
      : store.auditLogs.filter((entry) => entry.actorId === req.auth?.sub);
  const items = [...source].slice(-limit).reverse();
  res.status(200).json({ items });
});

if (env.serveFrontend) {
  const frontendDistPath = path.resolve(process.cwd(), "frontend", "dist");
  app.use(express.static(frontendDistPath, { index: false }));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use((_req, res) => {
  sendError(res, 404, "NOT_FOUND", "Route not found.");
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === "CORS_NOT_ALLOWED") {
    sendError(res, 403, "CORS_NOT_ALLOWED", "Request origin is not allowed.");
    return;
  }
  // eslint-disable-next-line no-console
  console.error(err);
  const message = env.nodeEnv === "production" ? "Unexpected server error." : err.message || "Unexpected server error.";
  sendError(res, 500, "INTERNAL_ERROR", message);
});

export { app };
