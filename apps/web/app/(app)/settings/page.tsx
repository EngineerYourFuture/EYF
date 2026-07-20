"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, Button, PageHeader } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { ThemeToggle } from "@/components/theme";
import { ReferralCard } from "@/components/referral-card";
import { Icons } from "@/components/icons";
import { PERSONA_LIST, type PersonaId } from "@/lib/persona";

type User = {
  email: string; name: string;
  college?: string | null; targetRole?: string | null; graduationYear?: number | null;
  persona?: PersonaId | null;
  subscription?: { plan: string } | null;
};
type Me = { user: User | null };

export default function Page() {
  const { data, mutate } = useApi<Me>("/me");
  const action = useApiAction();
  const u = data?.user;

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPersona, setSavingPersona] = useState(false);

  async function setPersona(persona: PersonaId) {
    if (savingPersona || u?.persona === persona) return;
    setSavingPersona(true);
    try {
      await action("/me", { method: "PATCH", body: JSON.stringify({ persona }) }, { silent: true });
      await mutate();
      toast.success("Journey updated");
    } catch {
      toast.error("Couldn't save — try again");
    }
    setSavingPersona(false);
  }

  useEffect(() => {
    if (!u) return;
    setName(u.name ?? "");
    setCollege(u.college ?? "");
    setTargetRole(u.targetRole ?? "");
    setGraduationYear(u.graduationYear ? String(u.graduationYear) : "");
  }, [u]);

  const dirty = u && (
    name !== (u.name ?? "") ||
    college !== (u.college ?? "") ||
    targetRole !== (u.targetRole ?? "") ||
    graduationYear !== (u.graduationYear ? String(u.graduationYear) : "")
  );

  async function save() {
    setSaving(true);
    try {
      await action("/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim() || undefined,
          college: college.trim() || null,
          targetRole: targetRole.trim() || null,
          graduationYear: graduationYear ? Number(graduationYear) : null,
        }),
      }, { silent: true });
      await mutate();
      toast.success("Profile updated");
    } catch {
      toast.error("Couldn't save — try again");
    }
    setSaving(false);
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-2xl mx-auto">
      <PageHeader eyebrow="Account" title="Settings" subtitle="Manage your profile and how EYF looks." />

      <div className="mt-8"><ReferralCard /></div>

      <Card className="mt-5">
        <h2 className="font-display text-lg font-bold mb-4">Profile</h2>
        <div className="space-y-4">
          <Field label="Email" hint="Managed by your sign-in provider">
            <div className="h-11 flex items-center px-3.5 rounded-lg bg-surface-2 border border-border text-text-3 text-sm">
              {u?.email ?? "…"}
            </div>
          </Field>
          <Field label="Name">
            <Input value={name} onChange={setName} placeholder="Your name" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Target role">
              <Input value={targetRole} onChange={setTargetRole} placeholder="e.g. SDE" />
            </Field>
            <Field label="Graduation year">
              <Input value={graduationYear} onChange={setGraduationYear} placeholder="e.g. 2027" inputMode="numeric" />
            </Field>
          </div>
          <Field label="College">
            <Input value={college} onChange={setCollege} placeholder="e.g. NIT Trichy" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={save} disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </Card>

      <Card className="mt-5">
        <h2 className="font-display text-lg font-bold">How you use EYF</h2>
        <p className="text-text-3 text-sm mt-1">Tailors your home screen and your journey.</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          {PERSONA_LIST.map((p) => {
            const Icon = Icons[p.icon];
            const active = u?.persona === p.id;
            return (
              <button key={p.id} onClick={() => setPersona(p.id)} disabled={savingPersona}
                className={`text-left rounded-xl border p-4 transition-colors ${active ? "border-accent bg-accent-tint" : "border-border bg-surface hover:border-edge"}`}>
                <span className={active ? "text-accent" : "text-text-3"}><Icon width={20} height={20} /></span>
                <div className="font-medium mt-2 text-text-1">{p.label}</div>
                <div className="text-text-4 text-xs mt-0.5 leading-snug">{p.who}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Appearance</h2>
            <p className="text-text-3 text-sm mt-1">Switch between light and dark themes.</p>
          </div>
          <ThemeToggle />
        </div>
      </Card>
    </PageMotion>
  );
}

function Field({ label, hint, children }: Readonly<{ label: string; hint?: string; children: React.ReactNode }>) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-mono uppercase tracking-wider text-text-3">{label}</span>
        {hint && <span className="text-text-4 text-[11px]">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder, inputMode }: Readonly<{
  value: string; onChange: (v: string) => void; placeholder?: string; inputMode?: "numeric" | "text";
}>) {
  return (
    <input
      value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
      className="w-full h-11 px-3.5 rounded-lg bg-surface border border-border text-text-1 placeholder:text-text-4 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors"
    />
  );
}
