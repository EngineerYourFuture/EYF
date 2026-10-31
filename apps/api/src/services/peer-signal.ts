/**
 * Lightweight WebRTC signaling over Redis pub/sub.
 * Two peers connected to the same mock session exchange SDP offers/answers
 * and ICE candidates by writing/reading from a Redis list keyed by mockId.
 *
 * Long-poll consumers wait on BLPOP; producers RPUSH.
 * Replace with WebSocket transport when scaling beyond ~hundreds of peers.
 */
import { redis } from "../lib/redis.js";

export type SignalKind = "offer" | "answer" | "ice" | "bye";
export type SignalEnvelope = {
  from: string; kind: SignalKind; payload: unknown; ts: number;
};

const key = (mockId: string, forUser: string) => `peer:signal:${mockId}:${forUser}`;
const TTL = 60 * 60; // 1h

export async function sendSignal(mockId: string, toUser: string, env: SignalEnvelope): Promise<void> {
  const k = key(mockId, toUser);
  await redis.rpush(k, JSON.stringify(env));
  await redis.expire(k, TTL);
}

/** Long-poll up to `timeoutSec` seconds for the next signal. */
export async function nextSignal(
  mockId: string,
  forUser: string,
  timeoutSec = 25,
): Promise<SignalEnvelope | null> {
  const k = key(mockId, forUser);
  // BLPOP blocks its connection for the whole timeout, and ioredis serializes
  // commands per connection. Running it on the shared `redis` client would freeze
  // every other Redis op (rate limits, sessions, caching, queues) for up to
  // `timeoutSec` — and concurrent long-polls would queue behind each other. Use a
  // dedicated connection per poll so blocking stays isolated. (Fine at the
  // "hundreds of peers" scale this path targets; see the WebSocket note above.)
  const conn = redis.duplicate();
  try {
    const result = await conn.blpop(k, timeoutSec);
    if (!result) return null;
    try { return JSON.parse(result[1]) as SignalEnvelope; } catch { return null; }
  } finally {
    conn.disconnect();
  }
}

export async function drain(mockId: string, forUser: string): Promise<void> {
  await redis.del(key(mockId, forUser));
}
