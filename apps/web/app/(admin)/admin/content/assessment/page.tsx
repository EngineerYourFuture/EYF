"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { Icons } from "@/components/icons";
import { ContentTabs } from "../_tabs";
import { Field } from "../_field";
import { saveLabel } from "@/lib/ui-helpers";

const AREAS = ["ALL", "dsa", "cs", "aptitude"] as const;
type Area = "dsa" | "cs" | "aptitude";
const DIFFS = ["easy", "medium", "hard"] as const;
type Diff = (typeof DIFFS)[number];

type Row = { id: string; area: Area; topic: string; difficulty: Diff; prompt: string; active: boolean };
type Full = Row & { choices: string[]; correctIndex: number; explanation: string | null };
type Form = { area: Area; topic: string; difficulty: Diff; prompt: string; choices: string[]; correctIndex: number; explanation: string; active: boolean };
const EMPTY: Form = { area: "dsa", topic: "", difficulty: "medium", prompt: "", choices: ["", "", "", ""], correctIndex: 0, explanation: "", active: true };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";

export default function Page() {
  const [filter, setFilter] = useState<(typeof AREAS)[number]>("ALL");
  const { data, mutate } = useApi<Row[]>(`/admin/content/assessment${filter === "ALL" ? "" : "?area=" + filter}`);
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setChoice = (i: number, v: string) => setForm((f) => ({ ...f, choices: f.choices.map((c, j) => (j === i ? v : c)) }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const x = await action<Full>(`/admin/content/assessment/${id}`);
    setForm({ area: x.area, topic: x.topic, difficulty: x.difficulty, prompt: x.prompt, choices: x.choices, correctIndex: x.correctIndex, explanation: x.explanation ?? "", active: x.active });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    const payload = { ...form, choices: form.choices.filter((c) => c.trim()), explanation: form.explanation.trim() ? form.explanation : null };
    try {
      if (editing?.id) await action(`/admin/content/assessment/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await action(`/admin/content/assessment`, { method: "POST", body: JSON.stringify(payload) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (!(await confirm({ title: "Delete this question? Past sessions keep their scores.", confirmLabel: "Delete", danger: true }))) return;
    try { await action(`/admin/content/assessment/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }
  async function importBank() {
    try {
      const r = await action<{ imported: number; total: number }>(`/admin/content/assessment/import-bank`, { method: "POST" });
      toast.success(`Imported ${r.imported} new questions (bank has ${r.total}).`);
      await mutate();
    } catch { /* toasted */ }
  }

  if (editing) {
    const filled = form.choices.filter((c) => c.trim());
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to assessment bank</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit question" : "New question"}</h1>
        <Card className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Area"><select className={inputCls} value={form.area} onChange={(e) => set("area", e.target.value as Area)}>{AREAS.filter((a) => a !== "ALL").map((a) => <option key={a} value={a}>{a.toUpperCase()}</option>)}</select></Field>
            <Field label="Topic"><input className={inputCls} value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="arrays / os / quant" /></Field>
            <Field label="Difficulty"><select className={inputCls} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as Diff)}>{DIFFS.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
          </div>
          <Field label="Prompt"><textarea className={`${inputCls} min-h-24 py-3 h-auto`} value={form.prompt} onChange={(e) => set("prompt", e.target.value)} /></Field>
          <Field label="Choices" hint="tick the correct one">
            <div className="space-y-2">
              {form.choices.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" name="correct" checked={form.correctIndex === i} onChange={() => set("correctIndex", i)} />
                  <input className={inputCls} value={c} onChange={(e) => setChoice(i, e.target.value)} placeholder={`Choice ${i + 1}`} />
                </div>
              ))}
            </div>
          </Field>
          <Field label="Explanation" hint="optional"><textarea className={`${inputCls} min-h-20 py-3 h-auto`} value={form.explanation} onChange={(e) => set("explanation", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Active (served to students)</label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.prompt || !form.topic || filled.length < 2 || !form.choices[form.correctIndex]?.trim()}>{saveLabel(saving, editing.id, "Add question")}</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Assessment bank</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} questions · powers the skill assessment + adaptive diagnostic.</p>
        </div>
        <div className="flex gap-2">
          {data?.length === 0 && <Button variant="secondary" onClick={importBank}>Import starter bank</Button>}
          <Button onClick={startNew}>+ New question</Button>
        </div>
      </div>
      <ContentTabs />
      <div className="mt-6 flex items-center gap-1">
        {AREAS.map((a) => (
          <button key={a} onClick={() => setFilter(a)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === a ? "bg-surface-3 text-text-1" : "text-text-3 hover:text-text-1"}`}>
            {a === "ALL" ? "All" : a.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((x) => (
          <Card key={x.id} className={`flex items-center gap-4 py-3 ${x.active ? "" : "opacity-60"}`}>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{x.prompt}</div>
              <div className="text-text-4 text-xs mt-0.5 truncate">
                <Badge tone="accent">{x.area.toUpperCase()}</Badge> <span className="ml-1">{x.topic} · {x.difficulty}{x.active ? "" : " · INACTIVE"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(x.id)}>Edit</Button>
              <button onClick={() => remove(x.id)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <EmptyState icon={<Icons.clipboard width={28} height={28} />} title="No questions in the DB yet" description="Students currently get the built-in starter bank. Import it to take over editing, or add questions from scratch." />}
      </div>
    </div>
  );
}
