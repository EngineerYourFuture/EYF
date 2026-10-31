import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError, type ZodIssue } from "zod";

const GENERIC_VALIDATION = "Request validation failed.";
const MAX_VALIDATION_SENTENCES = 3;

/**
 * "graduationYear" → "Graduation year". Only identifier-shaped keys are labelled, so
 * markup or long client-chosen record keys fall back to the field name. An
 * identifier-shaped record key can still name the sentence; it only ever goes back
 * to the requester, escaped.
 */
function fieldLabel(path: ZodIssue["path"]): string | null {
  const key = [...path].reverse().find((p): p is string => typeof p === "string" && /^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(p));
  if (!key) return null;
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const count = (n: number | bigint, noun: string) => `${n} ${noun}${Number(n) === 1 ? "" : "s"}`;

function issueText(issue: ZodIssue): string {
  switch (issue.code) {
    case "too_small":
      if (issue.type === "string" || issue.type === "array") {
        const noun = issue.type === "string" ? "character" : "item";
        if (issue.exact) return `must be exactly ${count(issue.minimum, noun)}`;
        if (issue.type === "string" && Number(issue.minimum) === 1) return "is required";
        return `needs at least ${count(issue.minimum, noun)}`;
      }
      return issue.inclusive ? `must be at least ${issue.minimum}` : `must be greater than ${issue.minimum}`;
    case "too_big":
      if (issue.type === "string" || issue.type === "array") {
        const noun = issue.type === "string" ? "character" : "item";
        if (issue.exact) return `must be exactly ${count(issue.maximum, noun)}`;
        return issue.type === "string" ? `can be at most ${count(issue.maximum, noun)}` : `can have at most ${count(issue.maximum, noun)}`;
      }
      return issue.inclusive ? `must be at most ${issue.maximum}` : `must be less than ${issue.maximum}`;
    case "invalid_string":
      if (issue.validation === "email") return "must be a valid email address";
      if (issue.validation === "url") return "must be a valid link";
      return "has an invalid format";
    case "invalid_type":
      return issue.received === "undefined" ? "is required" : "has the wrong type";
    case "invalid_union":
      return "has the wrong type";
    case "invalid_enum_value":
      return "must be one of the listed options";
    case "invalid_date":
      return "must be a valid date";
    default:
      // Never echo zod's raw text: it can carry keys the client chose.
      return "is invalid";
  }
}

/**
 * The learner-facing message for a failed `z.parse`: one sentence per named
 * field ("Title needs at least 5 characters."), so a toast says what to fix.
 * A refinement's own message is already a sentence the schema author wrote,
 * so it is used as written, even when it names no field.
 * `details` still carries the raw flatten() for clients that render inline.
 */
export function validationMessage(err: ZodError): string {
  const sentences = err.issues.flatMap((issue) => {
    if (issue.code === "custom" && issue.message !== "Invalid input") {
      return [/[.!?]$/.test(issue.message) ? issue.message : `${issue.message}.`];
    }
    const label = fieldLabel(issue.path);
    return label ? [`${label} ${issueText(issue)}.`] : [];
  });
  return sentences.length ? [...new Set(sentences)].slice(0, MAX_VALIDATION_SENTENCES).join(" ") : GENERIC_VALIDATION;
}

export function errorHandler(
  err: FastifyError,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  // Pre-shaped API errors (e.g. the rate limiter, which throws its response
  // body) — pass through untouched so the rich payload + status survive.
  const shaped = err as unknown as { success?: boolean; error?: unknown; statusCode?: number };
  if (shaped && typeof shaped === "object" && shaped.success === false && shaped.error) {
    return reply.code(shaped.statusCode ?? 400).send({ success: false, error: shaped.error });
  }

  if (err instanceof ZodError) {
    // Handlers validate the body, path params, AND the query string with the same
    // `z.parse(...)` call shape, so this handler cannot tell which one failed. It
    // used to answer "Invalid request body." unconditionally, which sent anyone
    // with a bad path param or query value off debugging a body they never sent.
    // `details.fieldErrors` already names the offending field, so stay accurate
    // about what we actually know.
    return reply.code(400).send({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validationMessage(err),
        details: err.flatten(),
      },
    });
  }

  const status = err.statusCode ?? 500;
  req.log.error({ err }, "request failed");

  return reply.code(status).send({
    success: false,
    error: {
      code: err.code ?? (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"),
      message:
        status >= 500 && process.env.NODE_ENV === "production"
          ? "Something went wrong on our end."
          : err.message,
    },
  });
}
