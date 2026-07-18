"use client";
import { useState } from "react";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { Icons } from "@/components/icons";
import { ContentTabs } from "../_tabs";
import { Field } from "../_field";

const SUBJECTS = ["OS", "DBMS", "CN", "OOP"] as const;
type Subject = (typeof SUBJECTS)[number];

type Row = { id: string; slug: string; subject: Subject; title: string; orderIndex: number; premium: boolean; estMinutes: number; updatedAt: string };
type Full = Row & { content: string };
type Form = { slug: string; subject: Subject; title: string; content: string; orderIndex: number; premium: boolean; estMinutes: number };
const EMPTY: Form = { slug: "", subject: "OS", title: "", content: "", orderIndex: 0, premium: false, estMinutes: 10 };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";

export default function Page() {
  const { data, mutate } = useApi<Row[]>("/admin/content/theory-notes");
  const action = useApiAction();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const x = await action<Full>(`/admin/content/theory-notes/${id}`);
    setForm({ slug: x.slug, subject: x.subject, title: x.title, content: x.content, orderIndex: x.orderIndex, premium: x.premium, estMinutes: x.estMinutes });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    try {
      if (editing?.id) await action(`/admin/content/theory-notes/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      else await action(`/admin/content/theory-notes`, { method: "POST", body: JSON.stringify(form) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await action(`/admin/content/theory-notes/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }

  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to theory notes</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit note" : "New theory note"}</h1>
        <Card className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Process scheduling" /></Field>
            <Field label="Slug" hint="lowercase, hyphens"><input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="os-process-scheduling" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Subject"><select className={inputCls} value={form.subject} onChange={(e) => set("subject", e.target.value as Subject)}>{SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
            <Field label="Order" hint="position in subject"><input type="number" min={0} className={inputCls} value={form.orderIndex} onChange={(e) => set("orderIndex", Number(e.target.value))} /></Field>
            <Field label="Est. minutes"><input type="number" min={1} max={240} className={inputCls} value={form.estMinutes} onChange={(e) => set("estMinutes", Number(e.target.value))} /></Field>
          </div>
          <Field label="Content" hint="markdown"><textarea className={`${inputCls} min-h-80 py-3 h-auto font-mono text-sm`} value={form.content} onChange={(e) => set("content", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.premium} onChange={(e) => set("premium", e.target.checked)} /> Premium (paid plans only)</label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.title || !form.slug || !form.content}>{saving ? "Saving…" : editing.id ? "Save changes" : "Publish note"}</Button>
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Theory notes</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} notes · the Core Subjects curriculum (OS / DBMS / CN / OOP).</p>
        </div>
        <Button onClick={startNew}>+ New note</Button>
      </div>
      <ContentTabs />
      <div className="mt-6 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((x) => (
          <Card key={x.id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{x.title}</span>
                <Badge tone="accent">{x.subject}</Badge>
                <Badge>#{x.orderIndex}</Badge>
                {x.premium && <Badge>Premium</Badge>}
              </div>
              <div className="text-text-4 text-xs mt-0.5 truncate">/{x.slug} · ~{x.estMinutes} min read</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(x.id)}>Edit</Button>
              <button onClick={() => remove(x.id, x.title)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <EmptyState icon={<Icons.doc width={28} height={28} />} title="No notes yet" description="Write the first theory note — it lands on the student subject page immediately." />}
      </div>
    </div>
  );
}
