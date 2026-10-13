import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import type { Readable } from "node:stream";
import { z } from "zod";
import { env } from "../env.js";

export const mediaId = z.string().uuid();
export const MEDIA_TYPES = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "video/mp4", "video/webm", "audio/mpeg", "audio/mp4", "audio/ogg",
  "application/pdf", "text/plain", "text/csv", "text/vtt", "application/zip",
]);

export function mediaPath(id: string): string {
  // Storage keys are server-generated UUIDs; filenames never become paths.
  return resolve(env.PRIVATE_MEDIA_DIR, mediaId.parse(id));
}

export async function storeMedia(id: string, stream: Readable): Promise<number> {
  await mkdir(env.PRIVATE_MEDIA_DIR, { recursive: true, mode: 0o700 });
  await pipeline(stream, createWriteStream(mediaPath(id), { flags: "wx", mode: 0o600 }));
  return (await stat(mediaPath(id))).size;
}

export async function removeMedia(id: string): Promise<void> {
  await rm(mediaPath(id), { force: true });
}

/** Single byte ranges let browsers seek video without buffering an entire upload. */
export function mediaRange(header: string | undefined, size: number): { start: number; end: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) throw new Error("Invalid byte range");
  const suffix = !match[1];
  const start = suffix ? Math.max(0, size - Number(match[2])) : Number(match[1]);
  const end = suffix || !match[2] ? size - 1 : Math.min(Number(match[2]), size - 1);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) throw new Error("Unsatisfiable byte range");
  return { start, end };
}

export function readMedia(id: string, range: { start: number; end: number } | null) {
  return createReadStream(mediaPath(id), range ?? undefined);
}
