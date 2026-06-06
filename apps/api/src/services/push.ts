/**
 * Expo push notifications. No-op when no tokens exist for the user.
 * Uses expo-server-sdk for chunking + receipts.
 */
import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "@eyf/db";

const expo = new Expo();

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; invalid: string[] }> {
  const tokens = await prisma.pushToken.findMany({ where: { userId } });
  const valid: typeof tokens = [];
  const invalid: string[] = [];
  for (const t of tokens) {
    if (Expo.isExpoPushToken(t.token)) valid.push(t);
    else invalid.push(t.token);
  }
  if (valid.length === 0) return { sent: 0, invalid };

  const messages: ExpoPushMessage[] = valid.map((t) => ({
    to: t.token,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    priority: "high",
  }));

  let sent = 0;
  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if (ticket.status === "ok") sent += 1;
        else if (ticket.details?.error === "DeviceNotRegistered") {
          // Drop dead tokens.
          invalid.push((ticket as { details: { expoPushToken?: string } }).details.expoPushToken ?? "");
        }
      }
    } catch {
      // swallow — push is best-effort
    }
  }

  if (invalid.length > 0) {
    await prisma.pushToken.deleteMany({ where: { token: { in: invalid.filter(Boolean) } } });
  }

  return { sent, invalid };
}
