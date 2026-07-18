"use client";
import { useState } from "react";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { Icons } from "@/components/icons";
import { ContentTabs } from "../_tabs";
import { Field } from "../_field";

const SUBJECTS = ["ALL", "OS", "DBMS", "CN", "OOP"] as const;
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;
type Subject = "OS" | "DBMS" | "CN" | "OOP";
type Diff = (typeof DIFFICULTIES)[number];

type Row = { id: string; subject: Subject; topic: string; front: string; difficulty: Diff; _count: { reviews: number } };
type Full = { id: string; subject: Subject; topic: string; front: string; back: string; difficulty: Diff };
type Form = { subject: Subject; topic: string; front: string; back: string; difficulty: Diff };
const EMPTY: Form = { subject: "OS", topic: "", front: "", back: "", difficulty: "MEDIUM" };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";

export default function Page() {
  const [filter, setFilter] = useState<(typeof SUBJECTS)[number]>("ALL");
  const { data, mutate } = useApi<Row[]>(`/admin/content/flashcards${filter === "ALL" ? "" : `?subject=${filter}`}`);
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const x = await action<Full>(`/admin/content/flashcards/${id}`);
    setForm({ subject: x.subject, topic: x.topic, front: x.front, back: x.back, difficulty: x.difficulty });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    try {
      if (editing?.id) await action(`/admin/content/flashcards/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      else await action(`/admin/content/flashcards`, { method: "POST", body: JSON.stringify(form) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function remove(id: string) {
    if (!(await confirm({ title: "Delete this card? Only allowed when no student has reviewed it.", confirmLabel: "Delete", danger: true }))) return;
    try { await action(`/admin/content/flashcards/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }

  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to flashcards</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit flashcard" : "New flashcard"}</h1>
        <Card className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Subject"><select className={inputCls} value={form.subject} onChange={(e) => set("subject", e.target.value as Subject)}>{SUBJECTS.filter((s) => s !== "ALL").map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
            <Field label="Topic"><input className={inputCls} value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="deadlocks" /></Field>
            <Field label="Difficulty"><select className={inputCls} value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as Diff)}>{DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
          </div>
          <Field label="Front" hint="the question"><textarea className={`${inputCls} min-h-24 py-3 h-auto`} value={form.front} onChange={(e) => set("front", e.target.value)} placeholder="What are the four Coffman conditions for deadlock?" /></Field>
          <Field label="Back" hint="the answer"><textarea className={`${inputCls} min-h-32 py-3 h-auto`} value={form.back} onChange={(e) => set("back", e.target.value)} /></Field>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.topic || !form.front || !form.back}>{saving ? "Saving…" : editing.id ? "Save changes" : "Create card"}</Button>
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} cards · the SRS deck behind Core Subjects revision.</p>
        </div>
        <Button onClick={startNew}>+ New card</Button>
      </div>
      <ContentTabs />
      <div className="mt-6 flex items-center gap-1">
        {SUBJECTS.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === s ? "bg-surface-3 text-text-1" : "text-text-3 hover:text-text-1"}`}>
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((x) => (
          <Card key={x.id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{x.front}</span>
              </div>
              <div className="text-text-4 text-xs mt-0.5 truncate">
                <Badge tone="accent">{x.subject}</Badge> <span className="ml-1">{x.topic} · {x.difficulty.toLowerCase()} · {x._count.reviews} review{x._count.reviews === 1 ? "" : "s"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(x.id)}>Edit</Button>
              <button onClick={() => remove(x.id)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <EmptyState icon={<Icons.clipboard width={28} height={28} />} title="No flashcards yet" description="Add the first card — it enters students' SRS rotation immediately." />}
      </div>
    </div>
  );
}
