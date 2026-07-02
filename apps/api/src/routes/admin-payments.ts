/**
 * Admin payments — capability-gated (manage:payments). Read-focused: revenue
 * overview (MRR, total revenue, active subscribers, plan mix) + a transactions
 * (invoice) list. Refunds/mutations are a live-Razorpay concern and are
 * deliberately out of scope for this vertical.
 *
 * amountInr fields are stored in paisa; we convert to whole rupees at the edge.
 */
import type { FastifyInstance } from "fastify";
import { prisma } from "@eyf/db";

import { requirePermission } from "../middleware/permissions.js";

export async function adminPaymentsRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.requireAuth, requirePermission("manage:payments")] };

  app.get("/overview", guard, async () => {
    const [activeSubs, paidAgg, planGroups, invoiceGroups] = await Promise.all([
      prisma.subscription.findMany({
        where: { status: "ACTIVE", plan: { not: "FREE" } },
        select: { amountInr: true, intervalMonths: true },
      }),
      prisma.invoice.aggregate({ _sum: { amountInr: true }, where: { status: "paid" } }),
      prisma.subscription.groupBy({ by: ["plan"], _count: true }),
      prisma.invoice.groupBy({ by: ["status"], _count: true }),
    ]);

    // Monthly-normalised recurring revenue (paisa → rupees).
    const mrrPaisa = activeSubs.reduce(
      (sum, s) => sum + (s.intervalMonths > 0 ? s.amountInr / s.intervalMonths : s.amountInr),
      0,
    );

    return {
      success: true,
      data: {
        activeSubscribers: activeSubs.length,
        mrrInr: Math.round(mrrPaisa / 100),
        totalRevenueInr: Math.round((paidAgg._sum.amountInr ?? 0) / 100),
        planBreakdown: planGroups
          .map((g) => ({ plan: g.plan, count: g._count }))
          .sort((a, b) => b.count - a.count),
        invoiceStats: Object.fromEntries(invoiceGroups.map((g) => [g.status, g._count])) as Record<string, number>,
      },
    };
  });

  app.get("/invoices", guard, async () => {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" }, take: 100,
      select: {
        id: true, amountInr: true, gstInr: true, status: true, paidAt: true, createdAt: true,
        subscription: { select: { plan: true, user: { select: { name: true, email: true } } } },
      },
    });
    return {
      success: true,
      data: invoices.map((i) => ({
        id: i.id,
        amountInr: i.amountInr,
        gstInr: i.gstInr,
        status: i.status,
        paidAt: i.paidAt,
        createdAt: i.createdAt,
        plan: i.subscription.plan,
        userName: i.subscription.user.name,
        userEmail: i.subscription.user.email,
      })),
    };
  });
}
