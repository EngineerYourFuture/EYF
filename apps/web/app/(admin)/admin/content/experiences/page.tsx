"use client";
import { useState } from "react";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { Icons } from "@/components/icons";
import { ContentTabs } from "../_tabs";

const OUTCOMES = ["OFFER", "REJECTED", "PENDING", "WITHDRAWN"] as const;
type Outcome = (typeof OUTCOMES)[number];

type ExpRow = { id: string; company: string; role: string; outcome: Outcome; difficulty: number; rounds: number; upvotes: number; createdAt: string; author: { name: string } };
type ExpFull = Omit<ExpRow, "author"> & { body: string; tips: string | null };
type Form = { company: string; role: string; outcome: Outcome; difficulty: number; rounds: number; body: string; tips: string };
const EMPTY: Form = { company: "", role: "", outcome: "OFFER", difficulty: 3, rounds: 3, body: "", tips: "" };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";

const outcomeTone: Record<Outcome, "easy" | "hard" | "medium" | "accent"> = {
  OFFER: "easy", REJECTED: "hard", PENDING: "medium", WITHDRAWN: "accent",
};

export default function Page() {
  const { data, mutate } = useApi<ExpRow[]>("/admin/content/experiences");
  const action = useApiAction();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const x = await action<ExpFull>(`/admin/content/experiences/${id}`);
    setForm({ company: x.company, role: x.role, outcome: x.outcome, difficulty: x.difficulty, rounds: x.rounds, body: x.body, tips: x.tips ?? "" });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    const payload = { ...form, tips: form.tips.trim() ? form.tips : null };
    try {
      if (editing?.id) await action(`/admin/content/experiences/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await action(`/admin/content/experiences`, { method: "POST", body: JSON.stringify(payload) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function remove(id: string, company: string) {
    if (!confirm(`Delete this ${company} experience?`)) return;
    try { await action(`/admin/content/experiences/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }

  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to experiences</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit experience" : "New interview experience"}</h1>
        <p className="text-text-3 text-sm mt-2">Publishes to the student /experiences feed immediately. Write it round-by-round, in the candidate&apos;s voice.</p>
        <Card className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company"><input className={inputCls} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Amazon" /></Field>
            <Field label="Role"><input className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="SDE-1 (campus)" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Outcome"><select className={inputCls} value={form.outcome} onChange={(e) => set("outcome", e.target.value as Outcome)}>{OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
            <Field label="Difficulty (1–5)"><input type="number" min={1} max={5} className={inputCls} value={form.difficulty} onChange={(e) => set("difficulty", Number(e.target.value))} /></Field>
            <Field label="Rounds"><input type="number" min={1} max={15} className={inputCls} value={form.rounds} onChange={(e) => set("rounds", Number(e.target.value))} /></Field>
          </div>
          <Field label="Writeup" hint="markdown, round-by-round"><textarea className={`${inputCls} min-h-64 py-3 h-auto`} value={form.body} onChange={(e) => set("body", e.target.value)} placeholder={"**Round 1 — Online Assessment**\nTwo mediums (arrays + DP)…\n\n**Round 2 — Technical**\n…"} /></Field>
          <Field label="Top tip" hint="optional, one takeaway"><textarea className={`${inputCls} min-h-20 py-3 h-auto`} value={form.tips} onChange={(e) => set("tips", e.target.value)} /></Field>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.company || !form.role || !form.body}>{saving ? "Saving…" : editing.id ? "Save changes" : "Publish experience"}</Button>
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Interview experiences</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} writeups · curate the round-by-round feed students prep from.</p>
        </div>
        <Button onClick={startNew}>+ New experience</Button>
      </div>
      <ContentTabs />
      <div className="mt-6 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((x) => (
          <Card key={x.id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{x.company} · {x.role}</span>
                <Badge tone={outcomeTone[x.outcome]}>{x.outcome}</Badge>
                <Badge>{x.rounds} rounds</Badge>
                <Badge>diff {x.difficulty}/5</Badge>
              </div>
              <div className="text-text-4 text-xs mt-0.5 truncate">by {x.author.name} · ▲ {x.upvotes} · {new Date(x.createdAt).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(x.id)}>Edit</Button>
              <button onClick={() => remove(x.id, x.company)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <EmptyState icon={<Icons.mic width={28} height={28} />} title="No experiences yet" description="Add the first round-by-round writeup — it shows on the student feed immediately." />}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-text-3 text-xs uppercase tracking-wider">{label}{hint && <span className="text-text-4 normal-case tracking-normal"> · {hint}</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
