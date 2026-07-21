"use client";
import { useState } from "react";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { Icons } from "@/components/icons";
import { ContentTabs } from "../_tabs";
import { Field } from "../_field";
import { saveLabel } from "@/lib/ui-helpers";

const DEMAND = ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"] as const;
type Demand = (typeof DEMAND)[number];

type TrackRow = { id: string; slug: string; name: string; tagline: string; demand: Demand; weeks: number; premium: boolean };
type TrackFull = TrackRow & { description: string; icon: string; salaryMinInr: number; salaryMaxInr: number; patterns: string[]; topics: string[]; companies: string[]; curriculum: unknown };
type Form = {
  slug: string; name: string; tagline: string; description: string; icon: string;
  salaryMinInr: number; salaryMaxInr: number; demand: Demand; weeks: number;
  patterns: string; topics: string; companies: string; curriculum: string; premium: boolean;
};
const EMPTY: Form = { slug: "", name: "", tagline: "", description: "", icon: "rocket", salaryMinInr: 0, salaryMaxInr: 0, demand: "HIGH", weeks: 12, patterns: "", topics: "", companies: "", curriculum: "[]", premium: false };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function Page() {
  const { data, mutate } = useApi<TrackRow[]>("/admin/content/career-tracks");
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const t = await action<TrackFull>(`/admin/content/career-tracks/${id}`);
    setForm({ slug: t.slug, name: t.name, tagline: t.tagline, description: t.description, icon: t.icon, salaryMinInr: t.salaryMinInr, salaryMaxInr: t.salaryMaxInr, demand: t.demand, weeks: t.weeks, patterns: t.patterns.join(", "), topics: t.topics.join(", "), companies: t.companies.join(", "), curriculum: JSON.stringify(t.curriculum ?? [], null, 2), premium: t.premium });
    setEditing({ id });
  }
  async function save() {
    let curriculum: unknown = [];
    try { curriculum = form.curriculum.trim() ? JSON.parse(form.curriculum) : []; }
    catch { alert("Curriculum must be valid JSON."); return; }
    setSaving(true);
    const payload = { ...form, patterns: csv(form.patterns), topics: csv(form.topics), companies: csv(form.companies), curriculum };
    try {
      if (editing?.id) await action(`/admin/content/career-tracks/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await action(`/admin/content/career-tracks`, { method: "POST", body: JSON.stringify(payload) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function remove(id: string, name: string) {
    if (!(await confirm({ title: `Delete track "${name}"?`, confirmLabel: "Delete", danger: true }))) return;
    try { await action(`/admin/content/career-tracks/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }

  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to tracks</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit track" : "New career track"}</h1>
        <Card className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Backend Engineer" /></Field>
            <Field label="Slug" hint="lowercase, hyphens"><input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="backend-engineer" /></Field>
          </div>
          <Field label="Tagline"><input className={inputCls} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="Build the systems everything runs on" /></Field>
          <Field label="Description"><textarea className={`${inputCls} min-h-24`} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Demand"><select className={inputCls} value={form.demand} onChange={(e) => set("demand", e.target.value as Demand)}>{DEMAND.map((d) => <option key={d} value={d}>{d}</option>)}</select></Field>
            <Field label="Weeks"><input type="number" className={inputCls} value={form.weeks} onChange={(e) => set("weeks", Number(e.target.value))} /></Field>
            <Field label="Icon"><input className={inputCls} value={form.icon} onChange={(e) => set("icon", e.target.value)} placeholder="rocket" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Salary min (₹)"><input type="number" className={inputCls} value={form.salaryMinInr} onChange={(e) => set("salaryMinInr", Number(e.target.value))} /></Field>
            <Field label="Salary max (₹)"><input type="number" className={inputCls} value={form.salaryMaxInr} onChange={(e) => set("salaryMaxInr", Number(e.target.value))} /></Field>
          </div>
          <Field label="Patterns" hint="comma-separated"><input className={inputCls} value={form.patterns} onChange={(e) => set("patterns", e.target.value)} /></Field>
          <Field label="Topics" hint="comma-separated"><input className={inputCls} value={form.topics} onChange={(e) => set("topics", e.target.value)} /></Field>
          <Field label="Companies" hint="comma-separated slugs"><input className={inputCls} value={form.companies} onChange={(e) => set("companies", e.target.value)} /></Field>
          <Field label="Curriculum" hint="JSON (advanced)"><textarea className={`${inputCls} min-h-32 font-mono text-xs`} value={form.curriculum} onChange={(e) => set("curriculum", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.premium} onChange={(e) => set("premium", e.target.checked)} /> Premium track</label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.name || !form.slug || !form.tagline}>{saveLabel(saving, editing.id, "Create track")}</Button>
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Career tracks</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} tracks · the &ldquo;Choose Your Path&rdquo; catalog.</p>
        </div>
        <Button onClick={startNew}>+ New track</Button>
      </div>
      <ContentTabs />
      <div className="mt-6 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((t) => (
          <Card key={t.id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{t.name}</span>
                <Badge tone="accent">{t.demand}</Badge>
                {t.premium && <Badge>Premium</Badge>}
              </div>
              <div className="text-text-4 text-xs mt-0.5 truncate">{t.tagline} · {t.weeks}w · /{t.slug}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(t.id)}>Edit</Button>
              <button onClick={() => remove(t.id, t.name)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <EmptyState icon={<Icons.compass width={28} height={28} />} title="No tracks yet" description="Create a career track for the Choose Your Path catalog." />}
      </div>
    </div>
  );
}
