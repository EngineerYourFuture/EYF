import { Router, Response } from "express";
import { z } from "zod";
import { Plan } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const MENTORS = [
  { id: "mentor-1", name: "Aditya Kumar", title: "Staff SWE @ Google", expertise: ["system-design", "algorithms"], available: true },
  { id: "mentor-2", name: "Priya Singh", title: "Senior SWE @ Microsoft", expertise: ["backend", "distributed-systems"], available: true },
  { id: "mentor-3", name: "Rahul Sharma", title: "Engineering Manager @ Flipkart", expertise: ["leadership", "system-design"], available: true },
  { id: "mentor-4", name: "Sneha Patel", title: "SWE @ Amazon", expertise: ["algorithms", "frontend"], available: false },
];

// GET /mentorship/mentors
router.get("/mentors", requireAuth("public"), async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ mentors: MENTORS });
});

// GET /mentorship/bookings
router.get("/bookings", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const bookings = await prisma.mentorshipBooking.findMany({
    where: { userId: req.auth!.sub },
    orderBy: { scheduledAt: "desc" },
  });
  res.json({ bookings });
});

const BookingSchema = z.object({
  mentorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
});

// POST /mentorship/bookings
router.post("/bookings", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = BookingSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const entitlement = await prisma.planEntitlement.findUnique({
    where: { plan_featureKey: { plan: req.auth!.plan as Plan, featureKey: "mentorship_monthly" } },
  });
  if (!entitlement?.enabled || entitlement.limitValue === 0) {
    res.status(403).json({ error: { code: "PLAN_REQUIRED", message: "Mentorship requires Pro plan or above." } });
    return;
  }

  const month = parse.data.scheduledAt.slice(0, 7);
  const monthUsage = await prisma.monthlyUsage.findUnique({
    where: { userId_month: { userId: req.auth!.sub, month } },
  });

  if ((monthUsage?.mentorshipUsed ?? 0) >= (entitlement.limitValue ?? 0)) {
    res.status(429).json({ error: { code: "MONTHLY_LIMIT", message: "Monthly mentorship booking limit reached." } });
    return;
  }

  const mentor = MENTORS.find((m) => m.id === parse.data.mentorId);
  if (!mentor) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Mentor not found." } });
    return;
  }

  const booking = await prisma.mentorshipBooking.create({
    data: {
      userId: req.auth!.sub,
      mentorId: parse.data.mentorId,
      scheduledAt: new Date(parse.data.scheduledAt),
      month,
    },
  });

  await prisma.monthlyUsage.upsert({
    where: { userId_month: { userId: req.auth!.sub, month } },
    update: { mentorshipUsed: { increment: 1 } },
    create: { userId: req.auth!.sub, month, mentorshipUsed: 1 },
  });

  res.status(201).json({ booking });
});

// DELETE /mentorship/bookings/:id
router.delete("/bookings/:id", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const booking = await prisma.mentorshipBooking.findUnique({ where: { id: String(req.params.id) } });
  if (booking?.userId !== req.auth!.sub) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Booking not found." } });
    return;
  }

  await prisma.mentorshipBooking.update({ where: { id: booking.id }, data: { status: "cancelled" } });

  // Refund usage
  await prisma.monthlyUsage.updateMany({
    where: { userId: req.auth!.sub, month: booking.month },
    data: { mentorshipUsed: { decrement: 1 } },
  });

  res.json({ ok: true });
});

export { router as mentorshipRouter };
