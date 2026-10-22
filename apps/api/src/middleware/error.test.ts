import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validationMessage } from "./error.js";

function issuesOf(schema: z.ZodTypeAny, value: unknown) {
  const r = schema.safeParse(value);
  if (r.success) throw new Error("expected the value to fail validation");
  return r.error;
}

describe("validation error message", () => {
  it("names each failing field in words a learner can act on", () => {
    const err = issuesOf(z.object({ title: z.string().min(5), body: z.string().min(10) }), { title: "", body: "" });
    expect(validationMessage(err)).toBe("Title needs at least 5 characters. Body needs at least 10 characters.");
  });

  it("covers required, email, length caps and number bounds", () => {
    const schema = z.object({
      graduationYear: z.number().min(2000),
      email: z.string().email(),
      name: z.string().max(3),
      college: z.string(),
    });
    expect(validationMessage(issuesOf(schema, { graduationYear: 1990, email: "x", name: "toolong" }))).toBe(
      "Graduation year must be at least 2000. Email must be a valid email address. Name can be at most 3 characters.",
    );
    expect(validationMessage(issuesOf(z.object({ college: z.string() }), {}))).toBe("College is required.");
  });

  // Value: protects=list-item, enum and type errors name the owning field once, in plain words;
  // fails_when=label uses the trailing array index, the Set dedupe is dropped (duplicates eat the
  // 3-sentence cap), or enum/type issues fall through to raw zod text; why_new=rows above cover
  // string/number/email/required only; seam=none; no_claim=route wiring (resume.integration covers it)
  it("names a list field once for repeated item errors, and words enum and type mismatches", () => {
    const schema = z.object({ skills: z.array(z.string().min(2)), plan: z.enum(["free", "pro"]), graduation_year: z.number() });
    expect(validationMessage(issuesOf(schema, { skills: ["a", "b"], plan: "gold", graduation_year: "2026" }))).toBe(
      "Skills needs at least 2 characters. Plan must be one of the listed options. Graduation year has the wrong type.",
    );
  });

  // Value: protects=list caps and minimums, number caps, links and patterned strings each get their own plain sentence;
  // fails_when=a too_big/invalid_string branch falls through to the wrong wording or to raw zod text;
  // why_new=rows above cover string caps, number minimums and email only; seam=none; no_claim=route wiring (unit only)
  it("words list and number caps, links and other string formats", () => {
    const schema = z.object({ tags: z.array(z.string()).max(2), cgpa: z.number().max(10), portfolio: z.string().url() });
    expect(validationMessage(issuesOf(schema, { tags: ["a", "b", "c"], cgpa: 11, portfolio: "not a link" }))).toBe(
      "Tags can have at most 2 items. Cgpa must be at most 10. Portfolio must be a valid link.",
    );
    expect(validationMessage(issuesOf(z.object({ rollNo: z.string().regex(/^\d+$/), skills: z.array(z.string()).min(2) }), { rollNo: "A1", skills: ["a"] }))).toBe(
      "Roll no has an invalid format. Skills needs at least 2 items.",
    );
  });

  // Value: protects=bounds of 1, exclusive bounds and exact lengths read as true sentences;
  // fails_when=a .min(1) field says "1 characters", .positive() says "at least 0" (0 is the rejected value),
  // or .length(n) says "at least n"; why_new=rows above use inclusive bounds above 1 only; seam=none;
  // no_claim=route wiring
  it("words required fields, singular counts, exclusive bounds and exact lengths", () => {
    const schema = z.object({ name: z.string().min(1), tags: z.array(z.string()).min(1), code: z.string().max(1), weeks: z.number().int().positive() });
    expect(validationMessage(issuesOf(schema, { name: "", tags: [], code: "ab", weeks: 0 }))).toBe(
      "Name is required. Tags needs at least 1 item. Code can be at most 1 character.",
    );
    expect(validationMessage(issuesOf(z.object({ weeks: z.number().positive(), pct: z.number().lt(100) }), { weeks: 0, pct: 100 }))).toBe(
      "Weeks must be greater than 0. Pct must be less than 100.",
    );
    expect(validationMessage(issuesOf(z.object({ token: z.string().length(32) }), { token: "x" }))).toBe("Token must be exactly 32 characters.");
  });

  // Value: protects=a schema author's refine sentence reaches the learner as written, with or without a field path;
  // fails_when=the label is prefixed, the sentence is lowercased or double-punctuated, or a pathless refine
  // falls back to the generic text; why_new=no row exercised custom issues, unions or dates; seam=none;
  // no_claim=every refine in the repo (two representative shapes)
  it("keeps author-written refine messages, and words unions, dates and unknown issues", () => {
    const answers = z.object({ answers: z.array(z.string()).refine((a) => new Set(a).size === a.length, "Answer each question only once.") });
    expect(validationMessage(issuesOf(answers, { answers: ["a", "a"] }))).toBe("Answer each question only once.");
    const window = z.object({ s: z.string(), e: z.string() }).refine(() => false, "End date must follow the start date");
    expect(validationMessage(issuesOf(window, { s: "b", e: "a" }))).toBe("End date must follow the start date.");
    expect(validationMessage(issuesOf(z.object({ email: z.string().email().or(z.literal("")) }), { email: 5 }))).toBe("Email has the wrong type.");
    expect(validationMessage(issuesOf(z.object({ startAt: z.coerce.date() }), { startAt: "nope" }))).toBe("Start at must be a valid date.");
    expect(validationMessage(issuesOf(z.object({ rubric: z.object({}).strict() }), { rubric: { evil: 1 } }))).toBe("Rubric is invalid.");
  });

  // Value: protects=a key the client chose in a record never becomes the sentence subject;
  // fails_when=fieldLabel takes the last path string unfiltered; why_new=no row used z.record; seam=none; no_claim=route wiring
  it("names the record field, not the client's key", () => {
    const answers = z.object({ answers: z.record(z.number().max(3)) });
    expect(validationMessage(issuesOf(answers, { answers: { "<b>x</b>": 9 } }))).toBe("Answers must be at most 3.");
  });

  it("falls back to the generic message when no field is named", () => {
    expect(validationMessage(issuesOf(z.string().min(2), "a"))).toBe("Request validation failed.");
  });
});
