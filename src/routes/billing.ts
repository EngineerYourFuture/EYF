import { Router, Response, Request } from "express";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { env } from "../config/env";

const router = Router();

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    billing: "forever",
    features: ["10 submissions/day", "Basic DSA library", "Core Subjects (1)", "Community support"],
  },
  {
    key: "basic",
    name: "Basic",
    price: 299,
    billing: "month",
    features: ["50 submissions/day", "Full DSA library", "Core Subjects (2)", "Resume builder", "Email support"],
  },
  {
    key: "pro",
    name: "Pro",
    price: 699,
    billing: "month",
    features: ["Unlimited submissions", "Algorithm Visualizer", "Mock interviews (2/mo)", "Mentorship (1/mo)", "Placement prep", "Priority support"],
  },
  {
    key: "elite",
    name: "Elite",
    price: 1299,
    billing: "month",
    features: ["Everything in Pro", "Mock interviews (5/mo)", "Mentorship (3/mo)", "AI code review", "Personalized roadmap", "Dedicated support"],
  },
];

// GET /billing/plans
router.get("/plans", async (_req: Request, res: Response): Promise<void> => {
  res.json({ plans: PLANS });
});

// GET /billing/subscription
router.get("/subscription", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const sub = await prisma.subscription.findUnique({ where: { userId: req.auth!.sub } });
  res.json({ subscription: sub });
});

// POST /billing/checkout  (MVP: simulates plan upgrade without real Stripe)
router.post("/checkout", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { plan } = req.body;
  const validPlans = ["free", "basic", "pro", "elite"];
  if (!validPlans.includes(plan)) {
    res.status(400).json({ error: { code: "INVALID_PLAN", message: "Invalid plan." } });
    return;
  }

  const userId = req.auth!.sub;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Upsert subscription
  await prisma.subscription.upsert({
    where: { userId },
    update: { plan, status: "active", periodStart: now, periodEnd, providerSubId: `sim_${crypto.randomUUID()}` },
    create: { userId, plan, status: "active", periodStart: now, periodEnd, providerSubId: `sim_${crypto.randomUUID()}` },
  });

  // Update user plan
  await prisma.user.update({ where: { id: userId }, data: { plan } });

  res.json({ ok: true, plan });
});

// POST /billing/webhook  (Stripe webhook endpoint)
router.post("/webhook", async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;
  const rawBody = (req as AuthRequest).rawBody;

  if (!rawBody || !sig) {
    res.status(400).json({ error: { code: "INVALID_WEBHOOK", message: "Missing signature." } });
    return;
  }

  // Verify Stripe signature
  const hmac = crypto.createHmac("sha256", env.billingWebhookSecret);
  hmac.update(rawBody);
  const expected = `sha256=${hmac.digest("hex")}`;

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    res.status(400).json({ error: { code: "INVALID_SIGNATURE", message: "Webhook signature mismatch." } });
    return;
  }

  const event = req.body;

  // Idempotency check
  const existing = await prisma.billingEvent.findUnique({ where: { providerEventId: event.id } });
  if (existing) { res.json({ ok: true }); return; }

  await prisma.billingEvent.create({
    data: { providerEventId: event.id, type: event.type, payload: event },
  });

  res.json({ ok: true });
});

export { router as billingRouter };
