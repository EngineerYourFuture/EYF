/**
 * WhatsApp bot — Twilio-compatible webhook (spec §44 tech stack).
 *
 * Commands:
 *   /daily        → today's daily challenge link
 *   /streak       → current streak + total solved
 *   /due          → number of flashcards due
 *   /help         → list commands
 *
 * Twilio sends application/x-www-form-urlencoded with fields like:
 *   From=whatsapp:+919876543210, Body="/daily"
 * We respond with TwiML XML containing the reply message.
 */
import { prisma } from "@eyf/db";

export type WaCommand =
  | { kind: "daily" }
  | { kind: "streak" }
  | { kind: "due" }
  | { kind: "help" }
  | { kind: "unknown"; raw: string };

export function parseCommand(body: string): WaCommand {
  const text = (body ?? "").trim().toLowerCase();
  if (text === "/daily" || text === "daily")         return { kind: "daily" };
  if (text === "/streak" || text === "streak")       return { kind: "streak" };
  if (text === "/due" || text === "due")             return { kind: "due" };
  if (text === "/help" || text === "help" || !text)  return { kind: "help" };
  return { kind: "unknown", raw: text };
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eyf.in";

export async function handleCommand(
  phone: string,
  cmd: WaCommand,
): Promise<string> {
  // Look up user by phone — normalize Twilio's "whatsapp:+91…" prefix.
  const normalized = phone.replace(/^whatsapp:/, "");
  const user = await prisma.user.findUnique({
    where: { phone: normalized },
    include: { profile: true },
  });

  if (cmd.kind === "help") {
    return [
      "EYF on WhatsApp 🟡",
      "",
      "/daily   today's challenge",
      "/streak  your current streak",
      "/due     flashcards due now",
      "",
      `Sign in: ${APP_URL}/sign-in`,
    ].join("\n");
  }

  if (!user) {
    return `Hi! I couldn't find an EYF account for ${normalized}. Add this number to your profile at ${APP_URL}/settings then try again.`;
  }

  switch (cmd.kind) {
    case "daily":
      return `Today's challenge → ${APP_URL}/dashboard\nOpen the app, the daily card is on top.`;
    case "streak": {
      const days = user.profile?.streakDays ?? 0;
      const solved = user.profile?.totalSolved ?? 0;
      return `🔥 ${days}-day streak · ${solved} problems solved.\nKeep it alive — one problem tonight.`;
    }
    case "due": {
      const due = await prisma.flashcardReview.count({
        where: { userId: user.id, dueAt: { lte: new Date() } },
      });
      const newCards = await prisma.flashcard.count({
        where: { reviews: { none: { userId: user.id } } },
      });
      return `📚 ${due} cards due · ${newCards} new\nReview at ${APP_URL}/subjects`;
    }
    case "unknown":
      return `Didn't catch that. Type /help for commands.`;
  }
}

export function twiml(message: string): string {
  // Minimal TwiML response — Twilio expects this exact shape.
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response><Message>${escaped}</Message></Response>`;
}
