"use client";
import { editorId, editorRow, type EditorRow } from "@/lib/editor-rows";
import { useState } from "react";
import { Card, Badge, Button, EmptyState, SkeletonRows, ErrorState } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { Icons } from "@/components/icons";
import { ContentTabs } from "../_tabs";
import { Field } from "../_field";
import { saveLabel } from "@/lib/ui-helpers";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;
type Diff = (typeof DIFFICULTIES)[number];
const diffTone = { EASY: "easy", MEDIUM: "medium", HARD: "hard", EXPERT: "expert" } as const;

type ProblemRow = {
  id: string; slug: string; title: string; difficulty: Diff; premium: boolean;
  topics: string[]; patterns: string[]; companies: string[]; totalSubmissions: number;
  _count: { testCases: number };
};
type TestCaseInput = { input: string; expected: string; isPublic: boolean };
type ProblemFull = ProblemRow & { description: string; timeLimitMs: number; memoryLimitKb: number; testCases: TestCaseInput[] };

type FormState = {
  slug: string; title: string; description: string; difficulty: Diff;
  topics: string; patterns: string; companies: string; premium: boolean;
  timeLimitMs: number; memoryLimitKb: number;
  testCases: EditorRow<TestCaseInput>[];
};
const EMPTY: Omit<FormState, "testCases"> & { testCases: TestCaseInput[] } = {
  slug: "", title: "", description: "", difficulty: "EASY",
  topics: "", patterns: "", companies: "", premium: false,
  timeLimitMs: 2000, memoryLimitKb: 262144,
  testCases: [{ input: "", expected: "", isPublic: true }, { input: "", expected: "", isPublic: false }],
};

const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function Page() {
  const { data, error, mutate } = useApi<ProblemRow[]>("/admin/content/problems");
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<FormState>(() => ({ ...EMPTY, testCases: EMPTY.testCases.map(editorRow) }));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm({ ...EMPTY, testCases: EMPTY.testCases.map(editorRow) }); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const p = await action<ProblemFull>(`/admin/content/problems/${id}`);
    setForm({
      slug: p.slug, title: p.title, description: p.description, difficulty: p.difficulty,
      topics: p.topics.join(", "), patterns: p.patterns.join(", "), companies: p.companies.join(", "),
      premium: p.premium, timeLimitMs: p.timeLimitMs, memoryLimitKb: p.memoryLimitKb,
      testCases: p.testCases.map(({ input, expected, isPublic }) => editorRow({ input, expected, isPublic })),
    });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    const payload = { ...form, topics: csv(form.topics), patterns: csv(form.patterns), companies: csv(form.companies) };
    try {
      if (editing?.id) await action(`/admin/content/problems/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await action(`/admin/content/problems`, { method: "POST", body: JSON.stringify(payload) });
      await mutate();
      setEditing(null);
    } catch { /* useApiAction already toasts */ } finally { setSaving(false); }
  }
  const testsReady = form.testCases.some((t) => t.isPublic) && form.testCases.some((t) => !t.isPublic)
    && new Set(form.testCases.map((t) => t.input)).size === form.testCases.length;
  const updateTest = (index: number, patch: Partial<TestCaseInput>) =>
    set("testCases", form.testCases.map((test, i) => i === index ? { ...test, ...patch } : test));
  async function remove(id: string, title: string) {
    if (!(await confirm({ title: `Delete "${title}"? Only allowed if it has no student submissions.`, confirmLabel: "Delete", danger: true }))) return;
    try { await action(`/admin/content/problems/${id}`, { method: "DELETE" }); await mutate(); }
    catch { /* toasted (e.g. 409 has dependents) */ }
  }

  // ── Editor ────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button type="button" onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to problems</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit problem" : "New problem"}</h1>
        <Card className="mt-6 space-y-4">
          <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Two Sum" /></Field>
          <Field label="Slug" hint="lowercase, hyphens — used in the URL"><input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="two-sum" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Difficulty">
              <select className={inputCls} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as Diff)}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Premium">
              <label className="flex items-center gap-2 h-11 text-sm text-text-2">
                <input type="checkbox" checked={form.premium} onChange={(e) => set("premium", e.target.checked)} />{" "}
                Requires a paid plan
              </label>
            </Field>
          </div>
          <Field label="Description" hint="markdown">
            <textarea className={`${inputCls} min-h-40 font-mono text-sm`} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Problem statement…" />
          </Field>
          <Field label="Patterns" hint="comma-separated"><input className={inputCls} value={form.patterns} onChange={(e) => set("patterns", e.target.value)} placeholder="hash-map, two-pointers" /></Field>
          <Field label="Topics" hint="comma-separated"><input className={inputCls} value={form.topics} onChange={(e) => set("topics", e.target.value)} placeholder="arrays, hashing" /></Field>
          <Field label="Companies" hint="comma-separated slugs"><input className={inputCls} value={form.companies} onChange={(e) => set("companies", e.target.value)} placeholder="amazon, flipkart" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Time limit (ms)"><input type="number" className={inputCls} value={form.timeLimitMs} onChange={(e) => set("timeLimitMs", Number(e.target.value))} /></Field>
            <Field label="Memory limit (KB)"><input type="number" className={inputCls} value={form.memoryLimitKb} onChange={(e) => set("memoryLimitKb", Number(e.target.value))} /></Field>
          </div>
          <section aria-labelledby="test-cases-title" className="border-t border-border pt-6">
            <h2 id="test-cases-title" className="text-xl font-semibold">Test cases</h2>
            <p className="mt-2 text-text-2 leading-relaxed">
              Add a public example and at least one hidden edge case. Each input must be different.
              Student programs read the input from standard input and print the expected output.
            </p>
            <div className="mt-5 space-y-6">
              {form.testCases.map((test, index) => (
                <fieldset key={test[editorId]} className="min-w-0 border-t border-border pt-4">
                  <legend className="px-1 font-medium">Test {index + 1}</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                      Input {index + 1}
                      <textarea aria-label={`Input ${index + 1}`} value={test.input} onChange={(e) => updateTest(index, { input: e.target.value })} maxLength={50000} rows={4} className={`${inputCls} mt-2 h-auto py-3 font-mono text-base`} />
                    </label>
                    <label className="block text-sm font-medium">
                      Expected output {index + 1}
                      <textarea aria-label={`Expected output ${index + 1}`} value={test.expected} onChange={(e) => updateTest(index, { expected: e.target.value })} maxLength={50000} rows={4} className={`${inputCls} mt-2 h-auto py-3 font-mono text-base`} />
                    </label>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <label className="flex min-h-11 items-center gap-2 text-sm text-text-2">
                      <input type="checkbox" checked={test.isPublic} onChange={(e) => updateTest(index, { isPublic: e.target.checked })} />
                      Show test {index + 1} as a public example
                    </label>
                    <Button variant="ghost" onClick={() => set("testCases", form.testCases.filter((_, i) => i !== index))}>Remove test {index + 1}</Button>
                  </div>
                </fieldset>
              ))}
            </div>
            <Button variant="secondary" className="mt-4" disabled={form.testCases.length >= 50} onClick={() => set("testCases", [...form.testCases, editorRow({ input: "", expected: "", isPublic: false })])}>Add hidden test</Button>
            {!testsReady && <output  className="block mt-3 text-sm text-text-2">Before saving, include a public example and a hidden test with different inputs.</output>}
          </section>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.title || !form.slug || !form.description || !testsReady}>{saveLabel(saving, editing.id, "Create problem")}</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────────
  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Problems</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} problems · edit content without touching code.</p>
        </div>
        <Button onClick={startNew}>+ New problem</Button>
      </div>
      <ContentTabs />

      <div className="mt-6 space-y-2">
        {!data && !error && <SkeletonRows rows={4} />}
        {error && <ErrorState message="We couldn't load the problems." retry={() => mutate()} />}
        {data?.map((p) => (
          <Card key={p.id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{p.title}</span>
                <Badge tone={diffTone[p.difficulty]}>{p.difficulty}</Badge>
                {p.premium && <Badge tone="accent">Premium</Badge>}
                {p._count.testCases === 0 && <Badge tone="hard">Needs tests</Badge>}
              </div>
              <div className="text-text-4 text-xs mt-0.5 truncate">
                /{p.slug} · {p.patterns.slice(0, 3).join(", ") || "no patterns"} · {p.totalSubmissions} submissions
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(p.id)}>Edit</Button>
              <button type="button" onClick={() => remove(p.id, p.title)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && (
          <EmptyState icon={<Icons.Code width={28} height={28} />} title="No problems yet"
            description="Create your first problem — students will see it immediately, no deploy required." />
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";
