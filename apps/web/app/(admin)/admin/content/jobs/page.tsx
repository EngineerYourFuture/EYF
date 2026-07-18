"use client";
import { useState } from "react";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { Icons } from "@/components/icons";
import { ContentTabs } from "../_tabs";
import { Field } from "../_field";

const ROLES = ["SDE", "FULLSTACK", "BACKEND", "FRONTEND", "DATA", "ML", "DEVOPS", "ANDROID", "IOS", "QA", "PM", "DESIGN"] as const;
type Role = (typeof ROLES)[number];

type JobRow = { id: string; slug: string; company: string; title: string; role: Role; location: string; remote: boolean; isActive: boolean };
type JobFull = JobRow & { salaryMinInr: number | null; salaryMaxInr: number | null; experienceMin: number; description: string; applyUrl: string };
type Form = {
  slug: string; company: string; title: string; role: Role; location: string; remote: boolean;
  salaryMinInr: string; salaryMaxInr: string; experienceMin: number; description: string; applyUrl: string; isActive: boolean;
};
const EMPTY: Form = { slug: "", company: "", title: "", role: "SDE", location: "", remote: false, salaryMinInr: "", salaryMaxInr: "", experienceMin: 0, description: "", applyUrl: "", isActive: true };
const inputCls = "w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent";

export default function Page() {
  const { data, mutate } = useApi<JobRow[]>("/admin/content/jobs");
  const action = useApiAction();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<null | { id: string | null }>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() { setForm(EMPTY); setEditing({ id: null }); }
  async function startEdit(id: string) {
    const j = await action<JobFull>(`/admin/content/jobs/${id}`);
    setForm({ slug: j.slug, company: j.company, title: j.title, role: j.role, location: j.location, remote: j.remote, salaryMinInr: j.salaryMinInr?.toString() ?? "", salaryMaxInr: j.salaryMaxInr?.toString() ?? "", experienceMin: j.experienceMin, description: j.description, applyUrl: j.applyUrl, isActive: j.isActive });
    setEditing({ id });
  }
  async function save() {
    setSaving(true);
    const payload = {
      ...form,
      salaryMinInr: form.salaryMinInr ? Number(form.salaryMinInr) : null,
      salaryMaxInr: form.salaryMaxInr ? Number(form.salaryMaxInr) : null,
    };
    try {
      if (editing?.id) await action(`/admin/content/jobs/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await action(`/admin/content/jobs`, { method: "POST", body: JSON.stringify(payload) });
      await mutate(); setEditing(null);
    } catch { /* toasted */ } finally { setSaving(false); }
  }
  async function remove(id: string, title: string) {
    if (!(await confirm({ title: `Delete "${title}"? Only if no applications.`, confirmLabel: "Delete", danger: true }))) return;
    try { await action(`/admin/content/jobs/${id}`, { method: "DELETE" }); await mutate(); } catch { /* toasted */ }
  }

  if (editing) {
    return (
      <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-3xl mx-auto">
        <button onClick={() => setEditing(null)} className="text-text-3 hover:text-text-1 text-sm mb-4">← Back to jobs</button>
        <h1 className="font-display text-2xl font-bold tracking-tight">{editing.id ? "Edit job" : "New job"}</h1>
        <Card className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="SDE-1" /></Field>
            <Field label="Company"><input className={inputCls} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Flipkart" /></Field>
          </div>
          <Field label="Slug" hint="lowercase, hyphens"><input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="flipkart-sde-1" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role"><select className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value as Role)}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></Field>
            <Field label="Location"><input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Bengaluru" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Salary min (₹)"><input type="number" className={inputCls} value={form.salaryMinInr} onChange={(e) => set("salaryMinInr", e.target.value)} placeholder="optional" /></Field>
            <Field label="Salary max (₹)"><input type="number" className={inputCls} value={form.salaryMaxInr} onChange={(e) => set("salaryMaxInr", e.target.value)} placeholder="optional" /></Field>
            <Field label="Min experience (yrs)"><input type="number" className={inputCls} value={form.experienceMin} onChange={(e) => set("experienceMin", Number(e.target.value))} /></Field>
          </div>
          <Field label="Apply URL"><input className={inputCls} value={form.applyUrl} onChange={(e) => set("applyUrl", e.target.value)} placeholder="https://…" /></Field>
          <Field label="Description"><textarea className={`${inputCls} min-h-28`} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.remote} onChange={(e) => set("remote", e.target.checked)} /> Remote</label>
            <label className="flex items-center gap-2 text-sm text-text-2"><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active (visible to students)</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving || !form.title || !form.slug || !form.company || !form.applyUrl}>{saving ? "Saving…" : editing.id ? "Save changes" : "Create job"}</Button>
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-text-3 mt-2">{data?.length ?? 0} jobs · manage the job board.</p>
        </div>
        <Button onClick={startNew}>+ New job</Button>
      </div>
      <ContentTabs />
      <div className="mt-6 space-y-2">
        {!data && <SkeletonRows rows={4} />}
        {data?.map((j) => (
          <Card key={j.id} className={`flex items-center gap-4 py-3 ${j.isActive ? "" : "opacity-60"}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{j.title}</span>
                <Badge tone="accent">{j.role}</Badge>
                {j.remote && <Badge>Remote</Badge>}
                {!j.isActive && <Badge tone="hard">Inactive</Badge>}
              </div>
              <div className="text-text-4 text-xs mt-0.5 truncate">{j.company} · {j.location} · /{j.slug}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="secondary" onClick={() => startEdit(j.id)}>Edit</Button>
              <button onClick={() => remove(j.id, j.title)} className="text-text-4 hover:text-hard text-sm px-2 py-1">Delete</button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <EmptyState icon={<Icons.briefcase width={28} height={28} />} title="No jobs yet" description="Post your first job — it shows on the student job board immediately." />}
      </div>
    </div>
  );
}
