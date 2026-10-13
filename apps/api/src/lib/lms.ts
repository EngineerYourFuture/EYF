import { prisma, type Prisma } from "@eyf/db";
import { lessonUrl, EVIDENCE_WEIGHT, type LessonBlock } from "@eyf/types";
import { recordEvidence } from "./skill-ledger.js";
import { z } from "zod";
import { withOrgContext } from "./org-scoped.js";
import { accountError } from "./org-accounts.js";

/** Every LMS course is tenant-private, including content created by legacy tools. */
export function visibleCourse(userId: string): Prisma.CourseWhereInput {
  return { published: true, org: { members: { some: { userId, status: "ACTIVE" } } } };
}

function validMediaSource(block: LessonBlock): boolean {
  if (block.data.assetId === undefined) return lessonUrl(block.data.url) !== null;
  return block.type !== "embed" && z.string().uuid().safeParse(block.data.assetId).success && !block.data.url;
}

export const lessonBlocksInput = z.array(z.object({
  type: z.enum(["heading", "rich_text", "callout", "image", "video", "code", "judged_code", "quiz", "file", "embed", "divider", "toggle"]),
  data: z.record(z.unknown()).default({}),
})).max(200).superRefine((blocks, ctx) => {
  blocks.forEach((b, i) => {
    const error = (message: string) => ctx.addIssue({ code: "custom", path: [i, "data"], message });
    if (["image", "video", "file", "embed"].includes(b.type) && !validMediaSource(b)) error("Choose one private upload or a valid HTTPS URL.");
    if (b.data.captionsAssetId !== undefined && !z.string().uuid().safeParse(b.data.captionsAssetId).success) error("Choose a valid captions upload.");
    if (b.type === "image" && (typeof b.data.alt !== "string" || !b.data.alt.trim())) error("Add image alternative text.");
    if (b.type === "quiz") {
      const { question, choices, correctIndex } = b.data;
      if (typeof question !== "string" || !question.trim() || !Array.isArray(choices) || choices.length < 2 || choices.length > 6
        || choices.some((c) => typeof c !== "string" || !c.trim()) || !Number.isInteger(correctIndex)
        || Number(correctIndex) < 0 || Number(correctIndex) >= choices.length) error("A quiz needs a question, 2–6 choices, and a valid correct answer.");
    }
    if (b.type === "judged_code" && (typeof b.data.problemSlug !== "string" || !/^[a-z0-9-]+$/.test(b.data.problemSlug))) error("Choose a valid problem slug.");
  });
});

/** References must resolve inside this tenant, including copied draft lessons. */
export async function assertLessonMedia(orgId: string, blocks: LessonBlock[], tx?: Prisma.TransactionClient) {
  const ids = [...new Set(blocks.flatMap((b) => [b.data.assetId, b.data.captionsAssetId]).filter((id): id is string => typeof id === "string"))];
  if (!ids.length) return;
  const find = (client: Prisma.TransactionClient) => client.mediaAsset.findMany({ where: { orgId, id: { in: ids } }, select: { id: true, contentType: true } });
  const assets = await (tx ? find(tx) : withOrgContext(orgId, find));
  if (assets.length !== ids.length) throw accountError(400, "MEDIA_UNAVAILABLE", "Choose uploads belonging to this workspace.");
  for (const block of blocks) {
    const type = assets.find((a) => a.id === block.data.assetId)?.contentType;
    if ((block.type === "image" && type && !type.startsWith("image/")) || (block.type === "video" && type && !type.startsWith("video/"))) throw accountError(400, "MEDIA_TYPE", "The upload must match the lesson content type.");
    if (block.data.captionsAssetId && assets.find((a) => a.id === block.data.captionsAssetId)?.contentType !== "text/vtt") throw accountError(400, "MEDIA_TYPE", "Captions must be a WebVTT file.");
  }
}

export function readBlocks(value: unknown): LessonBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter((b): b is LessonBlock => !!b && typeof b === "object" && typeof b.type === "string" && !!b.data && typeof b.data === "object");
}

export function learnerBlocks(value: unknown): LessonBlock[] {
  return readBlocks(value).map((b) => b.type === "quiz"
    ? { type: b.type, data: { question: b.data.question, choices: b.data.choices } }
    : b);
}

export const completionInput = z.object({ answers: z.record(z.number().int().min(0).max(5)).default({}) });

export async function completionError(userId: string, value: unknown, answers: Record<string, number>): Promise<string | null> {
  const blocks = readBlocks(value);
  for (const [i, block] of blocks.entries()) {
    if (block.type === "quiz" && (typeof block.data.correctIndex !== "number" || answers[String(i)] !== block.data.correctIndex)) {
      return `Answer question ${blocks.slice(0, i + 1).filter((b) => b.type === "quiz").length} correctly before completing this lesson.`;
    }
    if (block.type === "judged_code") {
      const slug = typeof block.data.problemSlug === "string" ? block.data.problemSlug : "";
      if (!slug) return "This coding exercise is missing its problem. Contact the course author.";
      const accepted = await prisma.problemSolution.findFirst({
        where: { userId, verdict: "ACCEPTED", problem: { slug: slug } }, select: { id: true },
      });
      if (!accepted) return `Pass the coding exercise “${slug}” before completing this lesson.`;
    }
  }
  return null;
}

/** Keep progress and skill evidence atomic, including completion through legacy URLs. */
export async function completeLesson(userId: string, lesson: { id: string; skillId: string | null; skillLevel: number }, orgId: string) {
  await prisma.$transaction(async (tx) => {
    const inserted = await tx.lessonProgress.createMany({ data: [{ lessonId: lesson.id, userId }], skipDuplicates: true });
    if (inserted.count && lesson.skillId) {
      await recordEvidence({ userId, orgId, skillId: lesson.skillId, level: lesson.skillLevel, weight: EVIDENCE_WEIGHT.LESSON ?? 0.5, sourceType: "LESSON", sourceId: lesson.id }, tx);
    }
  });
}
