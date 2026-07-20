"use client";
import { useState } from "react";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
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
};
type ProblemFull = ProblemRow & { description: string; timeLimitMs: number; memoryLimitKb: number };

type FormState = {
  slug: string; title: string; description: string; difficulty: Diff;
  topics: string; patterns: string; companies: string; premium: boolean;
  timeLimitMs: number; memoryLimitKb: number;
};
const EMPTY: FormState = {
  slug: "", title: "", description: "", difficulty: "EASY",
  topics: "", patterns: "", companies: "", premium: false,
  timeLimitMs: 2000, memoryLimitKb: 262144,
};

const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function Page() {
  const { data, mutate } = useApi<ProblemRow[]>("/admin/content/problems");
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const p = await action<ProblemFull>(`/admin/content/problems/${id}`);
    setForm({
      slug: p.slug, title: p.title, description: p.description, difficulty: p.difficulty,
      topics: p.topics.join(", "), patterns: p.patterns.join(", "), companies: p.companies.join(", "),
      premium: p.premium, timeLimitMs: p.timeLimitMs, memoryLimitKb: p.memoryLimitKb,
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
  async function remove(id: string, title: string) {
    if (!(await confirm({ title: `Delete "${title}"? Only allowed if it has no student submissions.`, confirmLabel: "Delete", danger: true }))) return;
    try { await action(`/admin/content/problems/${id}`, { method: "DELETE" }); await mutate(); }
    catch { /* toasted (e.g. 409 has dependents) */ }
  }

  // ── Editor ────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to problems</button>
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
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.title || !form.slug}>{saveLabel(saving, editing.id, "Create problem")}</Button>
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
        {!data && <SkeletonRows rows={4} />}
        {data?.map((p) => (
          <Card key={p.id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{p.title}</span>
                <Badge tone={diffTone[p.difficulty]}>{p.difficulty}</Badge>
                {p.premium && <Badge tone="accent">Premium</Badge>}
              </div>
              <div className="text-text-4 text-xs mt-0.5 truncate">
                /{p.slug} · {p.patterns.slice(0, 3).join(", ") || "no patterns"} · {p.totalSubmissions} submissions
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(p.id)}>Edit</Button>
              <button onClick={() => remove(p.id, p.title)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && (
          <EmptyState icon={<Icons.code width={28} height={28} />} title="No problems yet"
            description="Create your first problem — students will see it immediately, no deploy required." />
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";
