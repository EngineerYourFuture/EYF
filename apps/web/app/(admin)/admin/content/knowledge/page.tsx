"use client";
import { useState } from "react";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { Icons } from "@/components/icons";
import { ContentTabs } from "../_tabs";
import { Field } from "../_field";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unreviewed", label: "Needs review" },
  { id: "reviewed", label: "Reviewed" },
  { id: "retired", label: "Retired" },
] as const;

type Row = { id: string; question: string; topic: string; tags: string[]; source: "AI" | "STAFF"; reviewed: boolean; active: boolean; askCount: number; createdAt: string };
type Full = Row & { answer: string };
type Form = { question: string; answer: string; topic: string; tags: string; reviewed: boolean; active: boolean };
const EMPTY: Form = { question: "", answer: "", topic: "general", tags: "", reviewed: true, active: true };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function Page() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const { data, mutate } = useApi<Row[]>(`/admin/content/knowledge${filter === "all" ? "" : "?status=" + filter}`);
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const x = await action<Full>(`/admin/content/knowledge/${id}`);
    setForm({ question: x.question, answer: x.answer, topic: x.topic, tags: x.tags.join(", "), reviewed: true, active: x.active });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    const payload = { ...form, tags: csv(form.tags) };
    try {
      if (editing?.id) await action(`/admin/content/knowledge/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await action(`/admin/content/knowledge`, { method: "POST", body: JSON.stringify(payload) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function approve(id: string) {
    try { await action(`/admin/content/knowledge/${id}`, { method: "PATCH", body: JSON.stringify({ reviewed: true }) }); await mutate(); } catch { /* toasted */ }
  }
  async function remove(id: string) {
    if (!(await confirm({ title: "Delete this answer permanently? (Retire it instead by unchecking Active.)", confirmLabel: "Delete", danger: true }))) { return; }
    try { await action(`/admin/content/knowledge/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }

  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to knowledge base</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Curate answer" : "New answer"}</h1>
        <p className="text-text-3 text-sm mt-2">Saving marks the entry as reviewed — it shows a &quot;Curated by EYF&quot; badge to students.</p>
        <Card className="mt-6 space-y-4">
          <Field label="Question"><input className={inputCls} value={form.question} onChange={(e) => set("question", e.target.value)} placeholder="What is the event loop in Node.js?" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Topic" hint="one lowercase word"><input className={inputCls} value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="node" /></Field>
            <Field label="Tags" hint="comma-separated"><input className={inputCls} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="async, runtime" /></Field>
          </div>
          <Field label="Answer" hint="plain text · short paragraphs · '- ' bullets"><textarea className={`${inputCls} min-h-72 py-3 h-auto`} value={form.answer} onChange={(e) => set("answer", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Active (served to students)</label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || form.question.trim().length < 8 || !form.answer.trim() || !form.topic.trim()}>{(() => { if (saving) { return "Saving…"; } if (editing.id) { return "Save & mark reviewed"; } return "Publish answer"; })()}</Button>
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Knowledge base</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} answers · EYF-original Q&A from Ask EYF. Review AI drafts; they compound into your owned corpus.</p>
        </div>
        <Button onClick={startNew}>+ New answer</Button>
      </div>
      <ContentTabs />
      <div className="mt-6 flex items-center gap-1">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === f.id ? "bg-surface-3 text-text-1" : "text-text-3 hover:text-text-1"}`}>
            {f.label}
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
                <Badge tone="accent">{x.topic}</Badge>{" "}
                {x.source === "AI" && !x.reviewed ? <Badge tone="medium">Needs review</Badge> : <Badge tone="easy">Reviewed</Badge>}{" "}
                <span className="ml-1">{x.source} · asked {x.askCount}×{x.active ? "" : " · RETIRED"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!x.reviewed && <Button size="sm" onClick={() => void approve(x.id)}>Approve</Button>}
              <Button size="sm" variant="secondary" onClick={() => startEdit(x.id)}>Edit</Button>
              <button onClick={() => remove(x.id)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <EmptyState icon={<Icons.sparkle width={28} height={28} />} title="No answers yet" description="Answers appear here as students use Ask EYF — or write the first one yourself." />}
      </div>
    </div>
  );
}
