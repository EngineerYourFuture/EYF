"use client";
import { toast } from "sonner";
import { Card, Button } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";
import { useState } from "react";

export default function Page() {
  const [form, setForm] = useState({ company: "", jobTitle: "", yearsExp: 3, expertise: "", hourlyRateInr: 1500, bio: "" });
  const [submitting, setSubmitting] = useState(false);
  const action = useApiAction();

  async function submit() {
    if (form.bio.trim().length < 50) {
      toast.error("Bio must be at least 50 characters — tell students who you are.");
      return;
    }
    if (form.expertise.split(",").map((s) => s.trim()).filter(Boolean).length === 0) {
      toast.error("Add at least one area of expertise.");
      return;
    }
    setSubmitting(true);
    try {
      await action("/mentors/apply", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          expertise: form.expertise.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      }, { silent: true });
      toast.success("Application submitted. Verification within 5 business days.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-2xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Become a mentor</h1>
      <p className="text-text-3 mt-2">Pro+ engineers only. Verified within 5 business days via LinkedIn + offer letter.</p>

      <Card className="mt-8 space-y-4">
        <Field label="Company"  value={form.company}  onChange={(v) => setForm({ ...form, company: v })} />
        <Field label="Job title" value={form.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} />
        <Field label="Years experience" type="number" value={String(form.yearsExp)} onChange={(v) => setForm({ ...form, yearsExp: Number(v) })} />
        <Field label="Expertise (comma-separated)" value={form.expertise} onChange={(v) => setForm({ ...form, expertise: v })} />
        <Field label="Hourly rate (₹)" type="number" value={String(form.hourlyRateInr)} onChange={(v) => setForm({ ...form, hourlyRateInr: Number(v) })} />
        <div>
          <label className="text-xs text-text-3 uppercase tracking-wider">Bio <span className="text-text-4">(min 50 chars)</span></label>
          <textarea rows={5} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full mt-1 bg-bg border border-border rounded-md px-3 py-2 text-sm" />
          <div className={`text-xs mt-1 ${form.bio.trim().length < 50 ? "text-text-4" : "text-easy"}`}>{form.bio.trim().length}/50</div>
        </div>
        <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Apply"}</Button>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-text-3 uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 bg-bg border border-border rounded-md px-3 py-2 text-sm" />
    </div>
  );
}
