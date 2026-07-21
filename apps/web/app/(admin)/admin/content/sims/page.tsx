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

const CATEGORIES = ["APTITUDE", "LOGICAL", "VERBAL", "TECHNICAL"] as const;
type Category = (typeof CATEGORIES)[number];

type Section = { name: string; category: Category; questions: number; minutes: number };
type Row = { id: string; slug: string; company: string; label: string; usedBy: string; sections: Section[]; active: boolean };
type Full = Row & { blurb: string };
type Form = { slug: string; company: string; label: string; blurb: string; usedBy: string; sections: Section[]; active: boolean };
const EMPTY_SECTION: Section = { name: "", category: "APTITUDE", questions: 15, minutes: 20 };
const EMPTY: Form = { slug: "", company: "", label: "", blurb: "", usedBy: "", sections: [{ ...EMPTY_SECTION }], active: true };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";

export default function Page() {
  const { data, mutate } = useApi<Row[]>("/admin/content/sims");
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setSection = (i: number, patch: Partial<Section>) =>
    setForm((f) => ({ ...f, sections: f.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  function startNew() { setForm({ ...EMPTY, sections: [{ ...EMPTY_SECTION }] }); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const x = await action<Full>(`/admin/content/sims/${id}`);
    setForm({ slug: x.slug, company: x.company, label: x.label, blurb: x.blurb, usedBy: x.usedBy, sections: x.sections, active: x.active });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    try {
      if (editing?.id) await action(`/admin/content/sims/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      else await action(`/admin/content/sims`, { method: "POST", body: JSON.stringify(form) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function remove(id: string, label: string) {
    if (!(await confirm({ title: `Delete "${label}"?`, confirmLabel: "Delete", danger: true }))) return;
    try { await action(`/admin/content/sims/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }
  async function importDefaults() {
    try {
      const r = await action<{ imported: number; total: number }>(`/admin/content/sims/import-defaults`, { method: "POST" });
      toast.success(`Imported ${r.imported} new sims (defaults have ${r.total}).`);
      await mutate();
    } catch { /* toasted */ }
  }

  if (editing) {
    const sectionsValid = form.sections.length > 0 && form.sections.every((s) => s.name.trim() && s.questions > 0 && s.minutes > 0);
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to sims</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit sim blueprint" : "New sim blueprint"}</h1>
        <p className="text-text-3 text-sm mt-2">Mirror the real test exactly — sections, question counts, per-section minutes.</p>
        <Card className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Label"><input className={inputCls} value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="TCS NQT" /></Field>
            <Field label="Company"><input className={inputCls} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="TCS" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug" hint="lowercase, hyphens"><input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="tcs-nqt" /></Field>
            <Field label="Used by" hint="companies that hire via this test"><input className={inputCls} value={form.usedBy} onChange={(e) => set("usedBy", e.target.value)} placeholder="TCS, Cognizant" /></Field>
          </div>
          <Field label="Blurb"><textarea className={`${inputCls} min-h-16 py-3 h-auto`} value={form.blurb} onChange={(e) => set("blurb", e.target.value)} /></Field>
          <Field label="Sections">
            <div className="space-y-2">
              {form.sections.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_150px_90px_90px_36px] gap-2 items-center">
                  <input className={inputCls} value={s.name} onChange={(e) => setSection(i, { name: e.target.value })} placeholder="Numerical Ability" />
                  <select className={inputCls} value={s.category} onChange={(e) => setSection(i, { category: e.target.value as Category })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                  <input type="number" min={1} max={60} className={inputCls} value={s.questions} onChange={(e) => setSection(i, { questions: Number(e.target.value) })} title="Questions" />
                  <input type="number" min={1} max={120} className={inputCls} value={s.minutes} onChange={(e) => setSection(i, { minutes: Number(e.target.value) })} title="Minutes" />
                  <button onClick={() => set("sections", form.sections.filter((_, j) => j !== i))} className="text-text-4 hover:text-hard text-lg" title="Remove section">×</button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => set("sections", [...form.sections, { ...EMPTY_SECTION }])}>+ Add section</Button>
              <p className="text-text-4 text-xs">Columns: section name · question pool · count · minutes.</p>
            </div>
          </Field>
          <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Active (visible to students)</label>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.label || !form.slug || !form.company || !form.blurb || !form.usedBy || !sectionsValid}>{saveLabel(saving, editing.id, "Create sim")}</Button>
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Company sims</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} blueprints · the exact section layout + timing of real recruiter tests.</p>
        </div>
        <div className="flex gap-2">
          {data?.length === 0 && <Button variant="secondary" onClick={importDefaults}>Import defaults</Button>}
          <Button onClick={startNew}>+ New sim</Button>
        </div>
      </div>
      <ContentTabs />
      <div className="mt-6 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((x) => {
          const totalQ = x.sections.reduce((a, s) => a + s.questions, 0);
          const totalM = x.sections.reduce((a, s) => a + s.minutes, 0);
          return (
            <Card key={x.id} className={`flex items-center gap-4 py-3 ${x.active ? "" : "opacity-60"}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{x.label}</span>
                  <Badge tone="accent">{x.sections.length} sections</Badge>
                  <Badge>{totalQ}Q · {totalM}min</Badge>
                  {!x.active && <Badge tone="hard">Inactive</Badge>}
                </div>
                <div className="text-text-4 text-xs mt-0.5 truncate">used by {x.usedBy} · /{x.slug}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="secondary" onClick={() => startEdit(x.id)}>Edit</Button>
                <button onClick={() => remove(x.id, x.label)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
              </div>
            </Card>
          );
        })}
        {data?.length === 0 && <EmptyState icon={<Icons.clipboard width={28} height={28} />} title="No sim blueprints in the DB yet" description="Students currently get the built-in defaults (TCS NQT, AMCAT, InfyTQ, CoCubes). Import them to take over editing." />}
      </div>
    </div>
  );
}
