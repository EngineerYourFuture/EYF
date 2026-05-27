import path from "node:path";
import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { authLimiter } from "./middleware/rateLimiter";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { homeRouter } from "./routes/home";
import { problemsRouter } from "./routes/problems";
import { subjectsRouter } from "./routes/subjects";
import { submissionsRouter } from "./routes/submissions";
import { billingRouter } from "./routes/billing";
import { placementRouter } from "./routes/placement";
import { mentorshipRouter } from "./routes/mentorship";
import { resumeRouter } from "./routes/resume";
import { skillsRouter } from "./routes/skills";
import { visualizerRouter } from "./routes/visualizer";
import { supportRouter } from "./routes/support";
import { authorityRouter } from "./routes/authority";
import { analyticsRouter } from "./routes/analytics";
import { achievementsRouter } from "./routes/achievements";
import { leaderboardRouter } from "./routes/leaderboard";
import { oopRouter } from "./routes/oop";
import { securityLearnRouter } from "./routes/security-learn";
import { systemDesignRouter } from "./routes/system-design";
import { careerRouter } from "./routes/career";
import { communityRouter } from "./routes/community";
import { expertsRouter } from "./routes/experts";
import { systemRouter } from "./routes/system";

export const app = express();

if (env.trustProxy) app.set("trust proxy", 1);

// Capture raw body for webhook signature verification
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/api/billing/webhook") {
    let data = Buffer.alloc(0);
    req.on("data", (chunk: Buffer) => { data = Buffer.concat([data, chunk]); });
    req.on("end", () => {
      (req as Request & { rawBody?: Buffer }).rawBody = data;
      next();
    });
  } else {
    next();
  }
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: env.serveFrontend ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        workerSrc: ["'self'", "blob:"],
        connectSrc: ["'self'"],
      },
    } : false,
  })
);

app.use(
  cors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || env.corsAllowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Global rate limit
app.use(
  "/api/",
  rateLimit({ windowMs: 60_000, max: 300, standardHeaders: true, legacyHeaders: false })
);

// Stricter limit on auth endpoints (20 per 15 min per IP)
app.use("/api/auth/", authLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/home", homeRouter);
app.use("/api/modules", homeRouter);
app.use("/api/problems", problemsRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/billing", billingRouter);
app.use("/api/placement", placementRouter);
app.use("/api/mentorship", mentorshipRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/visualizer", visualizerRouter);
app.use("/api/support", supportRouter);
app.use("/api/authority", authorityRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/achievements", achievementsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/oop", oopRouter);
app.use("/api/security-learn", securityLearnRouter);
app.use("/api/system-design", systemDesignRouter);
app.use("/api/career", careerRouter);
app.use("/api/community", communityRouter);
app.use("/api/experts", expertsRouter);
app.use("/api/system", systemRouter);

// Serve frontend in production
if (env.serveFrontend) {
  const distPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(distPath));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use(errorHandler);
