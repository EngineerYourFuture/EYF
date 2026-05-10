import path from "node:path";
import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
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
    origin: (origin, cb) => {
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

// Stricter limit on auth endpoints
app.use(
  "/api/auth/",
  rateLimit({ windowMs: 15 * 60_000, max: 30, standardHeaders: true, legacyHeaders: false })
);

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

// Serve frontend in production
if (env.serveFrontend) {
  const distPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(distPath));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use(errorHandler);
