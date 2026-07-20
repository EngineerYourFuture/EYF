"use client";
import { useState } from "react";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { Icons } from "@/components/icons";
import { ContentTabs } from "../_tabs";
import { Field } from "../_field";
import { saveLabel } from "@/lib/ui-helpers";

const DURATIONS = ["MONTHS_2", "MONTHS_3", "MONTHS_6", "SEMESTER", "FULL_YEAR"] as const;
type Duration = (typeof DURATIONS)[number];
const durationLabel: Record<Duration, string> = { MONTHS_2: "2 months", MONTHS_3: "3 months", MONTHS_6: "6 months", SEMESTER: "Semester", FULL_YEAR: "Full year" };

type Row = { id: string; slug: string; company: string; role: string; duration: Duration; stipendInr: number; location: string; remote: boolean; isActive: boolean; deadlineAt: string | null; _count: { applications: number } };
type Full = Omit<Row, "_count"> & { description: string; applyUrl: string; eligibility: string | null; ppoConversion: number | null };
type Form = { slug: string; company: string; role: string; duration: Duration; stipendInr: string; location: string; remote: boolean; description: string; applyUrl: string; eligibility: string; ppoConversion: string; deadlineAt: string; isActive: boolean };
const EMPTY: Form = { slug: "", company: "", role: "", duration: "MONTHS_3", stipendInr: "", location: "", remote: false, description: "", applyUrl: "", eligibility: "", ppoConversion: "", deadlineAt: "", isActive: true };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";

export default function Page() {
  const { data, mutate } = useApi<Row[]>("/admin/content/internships");
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const x = await action<Full>(`/admin/content/internships/${id}`);
    setForm({
      slug: x.slug, company: x.company, role: x.role, duration: x.duration, stipendInr: String(x.stipendInr),
      location: x.location, remote: x.remote, description: x.description, applyUrl: x.applyUrl,
      eligibility: x.eligibility ?? "", ppoConversion: x.ppoConversion?.toString() ?? "",
      deadlineAt: x.deadlineAt ? x.deadlineAt.slice(0, 10) : "", isActive: x.isActive,
    });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    const payload = {
      ...form,
      stipendInr: Number(form.stipendInr || 0),
      eligibility: form.eligibility.trim() ? form.eligibility : null,
      ppoConversion: form.ppoConversion ? Number(form.ppoConversion) : null,
      deadlineAt: form.deadlineAt ? new Date(form.deadlineAt).toISOString() : null,
    };
    try {
      if (editing?.id) await action(`/admin/content/internships/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await action(`/admin/content/internships`, { method: "POST", body: JSON.stringify(payload) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function remove(id: string, role: string) {
    if (!(await confirm({ title: `Delete "${role}"? Only if no applications.`, confirmLabel: "Delete", danger: true }))) return;
    try { await action(`/admin/content/internships/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }

  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to internships</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit internship" : "New internship"}</h1>
        <Card className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role"><input className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="SDE Intern" /></Field>
            <Field label="Company"><input className={inputCls} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Zerodha" /></Field>
          </div>
          <Field label="Slug" hint="lowercase, hyphens"><input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="zerodha-sde-intern" /></Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Duration"><select className={inputCls} value={form.duration} onChange={(e) => set("duration", e.target.value as Duration)}>{DURATIONS.map((d) => <option key={d} value={d}>{durationLabel[d]}</option>)}</select></Field>
            <Field label="Stipend (₹/mo)"><input type="number" className={inputCls} value={form.stipendInr} onChange={(e) => set("stipendInr", e.target.value)} /></Field>
            <Field label="Location"><input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Bengaluru" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="PPO conversion %" hint="optional"><input type="number" className={inputCls} value={form.ppoConversion} onChange={(e) => set("ppoConversion", e.target.value)} /></Field>
            <Field label="Deadline" hint="optional"><input type="date" className={inputCls} value={form.deadlineAt} onChange={(e) => set("deadlineAt", e.target.value)} /></Field>
            <Field label="Apply URL"><input className={inputCls} value={form.applyUrl} onChange={(e) => set("applyUrl", e.target.value)} placeholder="https://…" /></Field>
          </div>
          <Field label="Eligibility" hint="optional"><input className={inputCls} value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} placeholder="3rd/4th year, any branch" /></Field>
          <Field label="Description"><textarea className={`${inputCls} min-h-28 py-3 h-auto`} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.remote} onChange={(e) => set("remote", e.target.checked)} /> Remote</label>
            <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active (visible to students)</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.role || !form.slug || !form.company || !form.applyUrl || !form.description}>{saveLabel(saving, editing.id, "Create internship")}</Button>
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Internships</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} listings · the supply side of the LMS ↔ internship flywheel.</p>
        </div>
        <Button onClick={startNew}>+ New internship</Button>
      </div>
      <ContentTabs />
      <div className="mt-6 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((x) => (
          <Card key={x.id} className={`flex items-center gap-4 py-3 ${x.isActive ? "" : "opacity-60"}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{x.role}</span>
                <Badge tone="accent">{durationLabel[x.duration]}</Badge>
                {x.remote && <Badge>Remote</Badge>}
                {!x.isActive && <Badge tone="hard">Inactive</Badge>}
              </div>
              <div className="text-text-4 text-xs mt-0.5 truncate">{x.company} · ₹{x.stipendInr.toLocaleString("en-IN")}/mo · {x.location} · {x._count.applications} application{x._count.applications === 1 ? "" : "s"}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(x.id)}>Edit</Button>
              <button onClick={() => remove(x.id, x.role)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <EmptyState icon={<Icons.briefcase width={28} height={28} />} title="No internships yet" description="Post the first slot — Elite students see it on the internship board immediately." />}
      </div>
    </div>
  );
}
