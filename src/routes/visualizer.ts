import { Router, Response } from "express";
import { z } from "zod";
import { Plan } from "@prisma/client";
import Groq from "groq-sdk";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

const GUIDE_SYSTEM_PROMPT = String.raw`You are a Socratic DSA tutor inside "Engineer Your Future". Your only job is to guide students to discover solutions themselves — never give the answer.

ALWAYS respond with valid JSON in this exact shape:
{
  "stage": "<one of: understand | constraints | brute_force | pattern | approach | code>",
  "question": "<your single guiding question — max 3 sentences>",
  "insight": "<one short sentence summarising what the student has understood so far, or empty string on first turn>",
  "codeHint": "<only when stage is 'code': a function signature + comment skeleton with NO logic filled in, e.g. 'function twoSum(nums, target) {\\n  // your logic here\\n}'. Empty string for all other stages.>"
}

STRICT RULES:
1. "question" must contain EXACTLY ONE question. Never multiple.
2. Never name the algorithm or data structure directly. Guide with "what if…" questions.
3. Never write logic or pseudocode in "question". Only in "codeHint" and only the skeleton.
4. "question" must be under 3 sentences.
5. Acknowledge what the student got right before pushing further.
6. After 3 stuck attempts on same stage, give a slightly more direct nudge — still a question.
7. Be warm. Struggle is the point.

STAGE PROGRESSION (advance naturally, don't rush):
- understand: confirm the problem, ask about inputs and outputs
- constraints: ask about input size and what time complexity is needed
- brute_force: ask how they'd solve it with unlimited time
- pattern: ask what structure or property they notice, what problems it reminds them of
- approach: guide toward the right data structure/strategy without naming it
- code: give a blank function skeleton, ask them to fill in one part at a time

On the FIRST message, always start at stage "understand".`;


const GuideSchema = z.object({
  problem: z.string().min(10).max(5000),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(40),
});

interface Frame {
  array: number[];
  highlights: number[];
  phase: string;
  description: string;
  low?: number;
  high?: number;
  mid?: number;
  target?: number;
}

const router = Router();

// GET /visualizer/algorithms
router.get("/algorithms", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const entitlement = await prisma.planEntitlement.findUnique({
    where: { plan_featureKey: { plan: req.auth!.plan as Plan, featureKey: "visualizer" } },
  });

  const algorithms = [
    { key: "bubble-sort", name: "Bubble Sort", category: "sorting", description: "Compare adjacent elements and swap if needed. O(n²) time.", locked: !entitlement?.enabled },
    { key: "selection-sort", name: "Selection Sort", category: "sorting", description: "Find minimum, place at start. O(n²) time.", locked: !entitlement?.enabled },
    { key: "insertion-sort", name: "Insertion Sort", category: "sorting", description: "Build sorted array one element at a time. O(n²) average.", locked: !entitlement?.enabled },
    { key: "merge-sort", name: "Merge Sort", category: "sorting", description: "Divide and conquer. O(n log n) guaranteed.", locked: !entitlement?.enabled },
    { key: "quick-sort", name: "Quick Sort", category: "sorting", description: "Partition around pivot. O(n log n) average.", locked: !entitlement?.enabled },
    { key: "binary-search", name: "Binary Search", category: "searching", description: "Search sorted array. O(log n) time.", locked: !entitlement?.enabled },
  ];

  res.json({ algorithms, unlocked: entitlement?.enabled ?? false });
});

const TraceSchema = z.object({
  algorithm: z.enum(["bubble-sort", "selection-sort", "insertion-sort", "merge-sort", "quick-sort", "binary-search"]),
  input: z.array(z.number()).min(2).max(20),
  target: z.number().optional(),
});

// POST /visualizer/trace
router.post("/trace", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  const entitlement = await prisma.planEntitlement.findUnique({
    where: { plan_featureKey: { plan: req.auth!.plan as Plan, featureKey: "visualizer" } },
  });
  if (!entitlement?.enabled) {
    res.status(403).json({ error: { code: "PLAN_REQUIRED", message: "Visualizer requires Pro plan or above." } });
    return;
  }

  const parse = TraceSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const { algorithm, input, target } = parse.data;
  const frames = generateTrace(algorithm, [...input], target);

  res.json({ algorithm, frames });
});

function generateTrace(algorithm: string, arr: number[], target?: number) {
  switch (algorithm) {
    case "bubble-sort": return bubbleSortTrace(arr);
    case "selection-sort": return selectionSortTrace(arr);
    case "insertion-sort": return insertionSortTrace(arr);
    case "merge-sort": return mergeSortTrace(arr);
    case "quick-sort": return quickSortTrace(arr);
    case "binary-search": {
      const sorted = [...arr].sort((a, b) => a - b);
      return binarySearchTrace(sorted, target ?? sorted[0]);
    }
    default: return [];
  }
}

function bubbleSortTrace(arr: number[]) {
  const frames: Frame[] = [];
  const a = [...arr];
  frames.push({ array: [...a], highlights: [], phase: "start", description: "Initial array" });

  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      frames.push({ array: [...a], highlights: [j, j + 1], phase: "compare", description: `Comparing ${a[j]} and ${a[j+1]}` });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        frames.push({ array: [...a], highlights: [j, j + 1], phase: "swap", description: `Swapped → [${a[j]}, ${a[j+1]}]` });
      }
    }
    frames.push({ array: [...a], highlights: [a.length - 1 - i], phase: "sorted", description: `Position ${a.length - 1 - i} is sorted` });
  }

  frames.push({ array: [...a], highlights: [], phase: "done", description: "Array sorted!" });
  return frames;
}

function selectionSortTrace(arr: number[]) {
  const frames: Frame[] = [];
  const a = [...arr];
  frames.push({ array: [...a], highlights: [], phase: "start", description: "Initial array" });

  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      frames.push({ array: [...a], highlights: [minIdx, j], phase: "compare", description: `Comparing min(${a[minIdx]}) with ${a[j]}` });
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      frames.push({ array: [...a], highlights: [i, minIdx], phase: "swap", description: `Placed ${a[i]} at position ${i}` });
    }
  }

  frames.push({ array: [...a], highlights: [], phase: "done", description: "Array sorted!" });
  return frames;
}

function insertionSortTrace(arr: number[]) {
  const frames: Frame[] = [];
  const a = [...arr];
  frames.push({ array: [...a], highlights: [0], phase: "start", description: "Initial array" });

  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    frames.push({ array: [...a], highlights: [i], phase: "pick", description: `Inserting ${key}` });
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j];
      frames.push({ array: [...a], highlights: [j, j + 1], phase: "shift", description: `Shifting ${a[j]}` });
      j--;
    }
    a[j + 1] = key;
    frames.push({ array: [...a], highlights: [j + 1], phase: "place", description: `Placed ${key} at position ${j + 1}` });
  }

  frames.push({ array: [...a], highlights: [], phase: "done", description: "Array sorted!" });
  return frames;
}

function mergeSortTrace(arr: number[]) {
  const frames: Frame[] = [];
  frames.push({ array: [...arr], highlights: [], phase: "start", description: "Starting merge sort" });

  const sorted = mergeSort([...arr], frames, 0);
  frames.push({ array: sorted, highlights: [], phase: "done", description: "Array sorted!" });
  return frames;
}

function mergeSort(arr: number[], frames: Frame[], left: number): number[] {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const leftArr = mergeSort(arr.slice(0, mid), frames, left);
  const rightArr = mergeSort(arr.slice(mid), frames, left + mid);
  return mergeParts(leftArr, rightArr, frames, left);
}

function mergeParts(left: number[], right: number[], frames: Frame[], offset: number): number[] {
  const result: number[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) { result.push(left[i++]); }
    else { result.push(right[j++]); }
  }
  const merged = [...result, ...left.slice(i), ...right.slice(j)];
  frames.push({ array: merged, highlights: Array.from({ length: merged.length }, (_, k) => offset + k), phase: "merge", description: `Merged segment` });
  return merged;
}

function quickSortTrace(arr: number[]) {
  const frames: Frame[] = [];
  const a = [...arr];
  frames.push({ array: [...a], highlights: [], phase: "start", description: "Starting quick sort" });
  quickSort(a, 0, a.length - 1, frames);
  frames.push({ array: [...a], highlights: [], phase: "done", description: "Array sorted!" });
  return frames;
}

function quickSort(arr: number[], low: number, high: number, frames: Frame[]) {
  if (low < high) {
    const pi = partition(arr, low, high, frames);
    quickSort(arr, low, pi - 1, frames);
    quickSort(arr, pi + 1, high, frames);
  }
}

function partition(arr: number[], low: number, high: number, frames: Frame[]): number {
  const pivot = arr[high];
  frames.push({ array: [...arr], highlights: [high], phase: "pivot", description: `Pivot: ${pivot}` });
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      frames.push({ array: [...arr], highlights: [i, j], phase: "swap", description: `Swapped ${arr[i]} and ${arr[j]}` });
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  frames.push({ array: [...arr], highlights: [i + 1], phase: "place-pivot", description: `Pivot ${pivot} in final position ${i + 1}` });
  return i + 1;
}

function binarySearchTrace(arr: number[], target: number) {
  const frames: Frame[] = [];
  let low = 0, high = arr.length - 1;
  frames.push({ array: [...arr], highlights: [], low, high, target, phase: "start", description: `Searching for ${target}` });

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    frames.push({ array: [...arr], highlights: [mid], low, high, mid, target, phase: "check", description: `Check mid=${arr[mid]}` });

    if (arr[mid] === target) {
      frames.push({ array: [...arr], highlights: [mid], low, high, mid, target, phase: "found", description: `Found ${target} at index ${mid}!` });
      return frames;
    } else if (arr[mid] < target) {
      low = mid + 1;
      frames.push({ array: [...arr], highlights: [], low, high, mid, target, phase: "move-right", description: `${arr[mid]} < ${target}, search right` });
    } else {
      high = mid - 1;
      frames.push({ array: [...arr], highlights: [], low, high, mid, target, phase: "move-left", description: `${arr[mid]} > ${target}, search left` });
    }
  }

  frames.push({ array: [...arr], highlights: [], target, phase: "not-found", description: `${target} not found` });
  return frames;
}

// POST /visualizer/guide
router.post("/guide", requireAuth("public"), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!process.env.GROQ_API_KEY) {
    res.status(503).json({ error: { code: "AI_UNAVAILABLE", message: "AI guide is not configured." } });
    return;
  }

  const parse = GuideSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: { code: "VALIDATION", message: parse.error.issues[0]?.message } });
    return;
  }

  const { problem, messages } = parse.data;

  // Build full message history for Groq (OpenAI-compatible format)
  const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: GUIDE_SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  // Prime with the problem on the first turn
  if (messages.length === 0) {
    chatMessages.push({ role: "user", content: `Here is the problem I'm working on:\n\n${problem}` });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: chatMessages,
      max_tokens: 400,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { stage?: string; question?: string; insight?: string; codeHint?: string };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch (_err) {
      parsed = { stage: "understand", question: raw, insight: "", codeHint: "" };
    }
    res.json({
      stage: parsed.stage ?? "understand",
      question: parsed.question ?? "",
      insight: parsed.insight ?? "",
      codeHint: parsed.codeHint ?? "",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[guide] Groq error:", msg.slice(0, 500));
    if (msg.includes("429") || msg.includes("rate_limit")) {
      res.status(429).json({ error: { code: "QUOTA_EXCEEDED", message: "AI rate limit hit. Please wait a moment and try again." } });
    } else {
      res.status(502).json({ error: { code: "AI_ERROR", message: msg.slice(0, 200) } });
    }
  }
});

export { router as visualizerRouter };
