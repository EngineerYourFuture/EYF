/**
 * Audio transcription via OpenAI Whisper.
 * Voice mock interviews (spec Phase 2 Week 11–12) call this from the browser
 * via the POST /mocks/:id/transcribe endpoint with a WebM blob.
 */
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { env } from "../env.js";
import { recordProviderUsage } from "../lib/provider-usage.js";

import { credentialStatus } from "../lib/configuration-status.js";

export const openai = credentialStatus(env.OPENAI_API_KEY) === "configured"
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

export async function transcribeAudio(input: {
  audio: Buffer;
  filename?: string;
  mimeType?: string;
  language?: string; // "en" by default, "hi"/"te"/etc. for Indian languages
}): Promise<{ text: string; durationSeconds?: number }> {
  if (!openai) throw new Error("OPENAI_API_KEY not set");
  const file = await toFile(
    input.audio,
    input.filename ?? "audio.webm",
    { type: input.mimeType ?? "audio/webm" },
  );
  const started = Date.now();
  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: input.language ?? "en",
    response_format: "verbose_json",
  }).catch(async (error: unknown) => { await recordProviderUsage({ provider: "openai", model: "whisper-1", outcome: "ERROR", latencyMs: Date.now() - started }); throw error; });
  // verbose_json shape: { text: string; duration?: number; ... }
  const r = response as unknown as { text: string; duration?: number };
  if (r.duration !== undefined) await recordProviderUsage({ provider: "openai", model: "whisper-1", outcome: "OK", latencyMs: Date.now() - started, durationSeconds: r.duration });
  return { text: r.text, durationSeconds: r.duration };
}
