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

const KINDS = ["ALL", "INTRO", "HR", "BEHAVIORAL", "SITUATIONAL"] as const;
type Kind = "INTRO" | "HR" | "BEHAVIORAL" | "SITUATIONAL";

type Row = { id: string; kind: Kind; question: string; tip: string; active: boolean };
type Full = Row & { covers: string[] };
type Form = { kind: Kind; question: string; tip: string; covers: string; active: boolean };
const EMPTY: Form = { kind: "HR", question: "", tip: "", covers: "", active: true };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function Page() {
  const [filter, setFilter] = useState<(typeof KINDS)[number]>("ALL");
  const { data, mutate } = useApi<Row[]>(`/admin/content/communication${filter === "ALL" ? "" : "?kind=" + filter}`);
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const x = await action<Full>(`/admin/content/communication/${id}`);
    setForm({ kind: x.kind, question: x.question, tip: x.tip, covers: x.covers.join(", "), active: x.active });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    const payload = { ...form, covers: csv(form.covers) };
    try {
      if (editing?.id) await action(`/admin/content/communication/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await action(`/admin/content/communication`, { method: "POST", body: JSON.stringify(payload) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (!(await confirm({ title: "Delete this prompt? Past drill attempts keep their feedback.", confirmLabel: "Delete", danger: true }))) return;
    try { await action(`/admin/content/communication/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }
  async function importBank() {
    try {
      const r = await action<{ imported: number; total: number }>(`/admin/content/communication/import-bank`, { method: "POST" });
      toast.success(`Imported ${r.imported} new prompts (bank has ${r.total}).`);
      await mutate();
    } catch { /* toasted */ }
  }

  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to drill prompts</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit prompt" : "New drill prompt"}</h1>
        <p className="text-text-3 text-sm mt-2">The covers checklist anchors the AI grader — list what a strong answer must hit.</p>
        <Card className="mt-6 space-y-4">
          <Field label="Kind"><select className={inputCls} value={form.kind} onChange={(e) => set("kind", e.target.value as Kind)}>{KINDS.filter((k) => k !== "ALL").map((k) => <option key={k} value={k}>{k}</option>)}</select></Field>
          <Field label="Question"><textarea className={`${inputCls} min-h-20 py-3 h-auto`} value={form.question} onChange={(e) => set("question", e.target.value)} placeholder="Tell me about a time you…" /></Field>
          <Field label="Coaching tip"><textarea className={`${inputCls} min-h-20 py-3 h-auto`} value={form.tip} onChange={(e) => set("tip", e.target.value)} placeholder="Use STAR. Focus on YOUR actions…" /></Field>
          <Field label="Covers" hint="comma-separated rubric points"><textarea className={`${inputCls} min-h-20 py-3 h-auto`} value={form.covers} onChange={(e) => set("covers", e.target.value)} placeholder="clear situation, specific actions, concrete result" /></Field>
          <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Active (served to students)</label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.question || !form.tip || csv(form.covers).length === 0}>{saveLabel(saving, editing.id, "Add prompt")}</Button>
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Drill prompts</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} prompts · HR / behavioural / situational practice with AI-graded rubrics.</p>
        </div>
        <div className="flex gap-2">
          {data?.length === 0 && <Button variant="secondary" onClick={importBank}>Import starter bank</Button>}
          <Button onClick={startNew}>+ New prompt</Button>
        </div>
      </div>
      <ContentTabs />
      <div className="mt-6 flex items-center gap-1">
        {KINDS.map((k) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === k ? "bg-surface-3 text-text-1" : "text-text-3 hover:text-text-1"}`}>
            {k === "ALL" ? "All" : k}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((x) => (
          <Card key={x.id} className={`flex items-center gap-4 py-3 ${x.active ? "" : "opacity-60"}`}>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{x.question}</div>
              <div className="text-text-4 text-xs mt-0.5 truncate">
                <Badge tone="accent">{x.kind}</Badge> <span className="ml-1">{x.tip}{x.active ? "" : " · INACTIVE"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(x.id)}>Edit</Button>
              <button onClick={() => remove(x.id)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <EmptyState icon={<Icons.mic width={28} height={28} />} title="No prompts in the DB yet" description="Students currently get the built-in starter bank. Import it to take over editing, or add prompts from scratch." />}
      </div>
    </div>
  );
}
