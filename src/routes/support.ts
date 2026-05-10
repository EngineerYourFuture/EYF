import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /support/tickets
router.get("/tickets", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const where = req.auth!.role === "user"
    ? { userId: req.auth!.sub }
    : {};

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });
  res.json({ tickets });
});

const TicketSchema = z.object({
  subject: z.string().min(5).max(200),
  body: z.string().min(10).max(5000),
});

// POST /support/tickets
router.post("/tickets", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parse = TicketSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const ticket = await prisma.supportTicket.create({
    data: { userId: req.auth!.sub, ...parse.data },
  });

  res.status(201).json({ ticket });
});

// PATCH /support/tickets/:id  (staff/admin only — close a ticket)
router.patch("/tickets/:id", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.auth!.role === "user") {
    res.status(403).json({ error: { code: "FORBIDDEN", message: "Only staff can update tickets." } });
    return;
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: String(req.params.id) } });
  if (!ticket) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    return;
  }

  const { status } = req.body;
  const updated = await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status },
  });

  res.json({ ticket: updated });
});

export { router as supportRouter };
