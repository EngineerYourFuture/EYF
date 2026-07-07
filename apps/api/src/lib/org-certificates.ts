/**
 * Org certificates (PRD §15.9) — skill-anchored, revocable, on the existing
 * public /verify rail. Auto-issue compiles from a template's criteria; the
 * assessment engine calls maybeIssueForAssessment on a passing submit.
 */
import { prisma, CertificateType } from "@eyf/db";
import { randomBytes } from "node:crypto";
import { fireWebhook } from "./webhooks.js";

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/O/1/l

function newCode(len = 12): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  return out;
}

/** Idempotent per (user, template): a re-pass doesn't mint duplicates. */
export async function issueCertificate(input: {
  userId: string;
  orgId: string;
  templateId: string;
  title: string;
  score: number | null;
  skillsAsserted: { slug: string; level: number }[];
}): Promise<{ id: string; verificationCode: string } | null> {
  const already = await prisma.certificate.findFirst({
    where: { userId: input.userId, orgId: input.orgId, templateId: input.templateId, revokedAt: null },
    select: { id: true, verificationCode: true },
  });
  if (already) return already;
  const cert = await prisma.certificate.create({
    data: {
      userId: input.userId,
      orgId: input.orgId,
      templateId: input.templateId,
      type: CertificateType.ASSESSMENT,
      title: input.title,
      score: input.score,
      skillsAsserted: input.skillsAsserted,
      verificationCode: newCode(),
    },
    select: { id: true, verificationCode: true },
  });
  void fireWebhook(input.orgId, "certificate.issued", { certificateId: cert.id, userId: input.userId, title: input.title, verificationCode: cert.verificationCode });
  return cert;
}

/** Called from the assessment submit path: if a template auto-issues on this
 *  blueprint and the score cleared its bar, mint the certificate. */
export async function maybeIssueForAssessment(input: {
  userId: string;
  orgId: string;
  blueprintId: string;
  score: number;
  passingScore: number;
  skillId: string | null;
}): Promise<void> {
  if (input.score < input.passingScore) return;
  const template = await prisma.certificateTemplate.findFirst({
    where: { orgId: input.orgId, blueprintId: input.blueprintId, criteria: "ASSESSMENT_PASS", active: true },
  });
  if (!template) return;
  await issueCertificate({
    userId: input.userId,
    orgId: input.orgId,
    templateId: template.id,
    title: template.name,
    score: input.score,
    skillsAsserted: (template.skills as { slug: string; level: number }[]) ?? [],
  });
}
