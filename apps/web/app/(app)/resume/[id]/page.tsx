"use client";
import { Card, Button, Badge, TextField, Field } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { ResumeGap } from "@/components/resume-gap";
import { track, Events } from "@/lib/analytics";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { ResumeDocument } from "@eyf/types";

type Resume = {
  id: string; title: string; template: string;
  atsScore: number | null;
  atsBreakdown: { total: number; factors: { name: string; score: number; max: number; note?: string }[] } | null;
  json: ResumeDocument;
};

const draftKey = (id: string) => `eyf:resume:${id}`;

export default function Page({ params }: { params: { id: string } }) {
  const { data, mutate } = useApi<Resume>(`/resume/${params.id}`);
  const action = useApiAction();
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [restored, setRestored] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load once: restore an unsaved local draft if it differs from the server copy,
  // so a refresh never loses edits (the draft is decoupled from Save + rescoring).
  useEffect(() => {
    if (!data || hydrated) return;
    let initial = data.json;
    try {
      const raw = localStorage.getItem(draftKey(params.id));
      if (raw) {
        const draft = JSON.parse(raw) as { json?: ResumeDocument };
        if (draft.json && JSON.stringify(draft.json) !== JSON.stringify(data.json)) {
          initial = draft.json;
          setRestored(true);
        }
      }
    } catch { /* private mode / corrupt draft */ }
    setDoc(initial);
    setHydrated(true);
  }, [data, hydrated, params.id]);

  // Autosave the draft (debounced) on every edit.
  useEffect(() => {
    if (!hydrated || !doc) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey(params.id), JSON.stringify({ json: doc, ts: Date.now() })); } catch { /* quota */ }
    }, 500);
    return () => clearTimeout(t);
  }, [doc, hydrated, params.id]);

  function discardDraft() {
    if (!data) return;
    setDoc(data.json);
    setRestored(false);
    try { localStorage.removeItem(draftKey(params.id)); } catch { /* ignore */ }
  }

  if (!data || !doc) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;

  async function save() {
    setSaving(true);
    try {
      const r = await action<{ atsScore: number | null }>(`/resume/${params.id}`, {
        method: "PATCH", body: JSON.stringify({ json: doc }),
      });
      track(Events.ResumeScored, { score: r.atsScore });
      toast.success(r.atsScore != null ? `Saved · ATS ${r.atsScore}/100` : "Saved");
      await mutate();
      // Server is now the source of truth — clear the local draft.
      try { localStorage.removeItem(draftKey(params.id)); } catch { /* ignore */ }
      setRestored(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 max-w-7xl mx-auto">
      <div className="space-y-5">
        <h1 className="font-display text-3xl font-bold">{data.title}</h1>

        {restored && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent-tint/40 px-4 py-2.5 text-sm" role="status">
            <span className="text-text-2">Restored unsaved changes from your last session.</span>
            <button
              onClick={discardDraft}
              className="shrink-0 text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
            >Discard</button>
          </div>
        )}

        <Card>
          <h3 className="font-display text-lg font-bold mb-3">Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Name"     value={doc.contact.name}     onChange={(v) => setDoc({ ...doc, contact: { ...doc.contact, name: v } })} />
            <TextField label="Email"    value={doc.contact.email}    onChange={(v) => setDoc({ ...doc, contact: { ...doc.contact, email: v } })} />
            <TextField label="Phone"    value={doc.contact.phone ?? ""}   onChange={(v) => setDoc({ ...doc, contact: { ...doc.contact, phone: v } })} />
            <TextField label="Location" value={doc.contact.location ?? ""} onChange={(v) => setDoc({ ...doc, contact: { ...doc.contact, location: v } })} />
            <TextField label="GitHub"   value={doc.contact.github ?? ""}   onChange={(v) => setDoc({ ...doc, contact: { ...doc.contact, github: v } })} />
            <TextField label="LinkedIn" value={doc.contact.linkedin ?? ""} onChange={(v) => setDoc({ ...doc, contact: { ...doc.contact, linkedin: v } })} />
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-bold mb-3">Summary</h3>
          <textarea
            rows={4}
            aria-label="Professional summary"
            className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm"
            value={doc.summary ?? ""}
            onChange={(e) => setDoc({ ...doc, summary: e.target.value })}
            placeholder="2-3 sentences. Lead with the role you're targeting and your strongest signal."
          />
        </Card>

        <Card>
          <h3 className="font-display text-lg font-bold mb-3">Skills</h3>
          <input
            className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm"
            placeholder="comma-separated, e.g. Java, Spring, AWS, SQL"
            value={(doc.skills ?? []).join(", ")}
            onChange={(e) => setDoc({ ...doc, skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          />
        </Card>

        <ListSection
          title="Experience"
          items={doc.experience ?? []}
          onChange={(items) => setDoc({ ...doc, experience: items })}
          render={(e, set) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Company" value={e.company} onChange={(v) => set({ ...e, company: v })} />
              <TextField label="Role"    value={e.role}    onChange={(v) => set({ ...e, role: v })} />
              <TextField label="Start"   value={e.start}   onChange={(v) => set({ ...e, start: v })} />
              <TextField label="End"     value={e.end ?? ""} onChange={(v) => set({ ...e, end: v })} />
              <Field label="Bullets (one per line)" className="col-span-2">
                <textarea
                  rows={4}
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm"
                  value={(e.bullets ?? []).join("\n")}
                  onChange={(ev) => set({ ...e, bullets: ev.target.value.split("\n").filter((s) => s.trim()) })}
                />
              </Field>
            </div>
          )}
          empty={{ company: "", role: "", start: "", bullets: [] }}
        />

        <ListSection
          title="Projects"
          items={doc.projects ?? []}
          onChange={(items) => setDoc({ ...doc, projects: items })}
          render={(p, set) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Name" value={p.name} onChange={(v) => set({ ...p, name: v })} />
              <TextField label="Link" value={p.link ?? ""} onChange={(v) => set({ ...p, link: v })} />
              <Field label="Description" className="col-span-2">
                <textarea
                  rows={3}
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm"
                  value={p.description}
                  onChange={(e) => set({ ...p, description: e.target.value })}
                />
              </Field>
            </div>
          )}
          empty={{ name: "", description: "" }}
        />

        <ListSection
          title="Education"
          items={doc.education ?? []}
          onChange={(items) => setDoc({ ...doc, education: items })}
          render={(ed, set) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Institution" value={ed.institution} onChange={(v) => set({ ...ed, institution: v })} />
              <TextField label="Degree"      value={ed.degree}      onChange={(v) => set({ ...ed, degree: v })} />
              <TextField label="Start"       value={ed.start}       onChange={(v) => set({ ...ed, start: v })} />
              <TextField label="End"         value={ed.end ?? ""}   onChange={(v) => set({ ...ed, end: v })} />
              <TextField label="GPA"         value={ed.gpa ?? ""}   onChange={(v) => set({ ...ed, gpa: v })} />
            </div>
          )}
          empty={{ institution: "", degree: "", start: "" }}
        />

        <div className="sticky bottom-6">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save resume"}</Button>
        </div>
      </div>

      <aside className="space-y-4">
        <Card>
          <h3 className="font-display text-lg font-bold">ATS score</h3>
          <div className="mt-2 font-display text-4xl font-bold">
            {data.atsScore ?? "—"}<span className="text-text-3 text-2xl"> /100</span>
          </div>
          {data.atsBreakdown && (
            <ul className="mt-4 space-y-2 text-sm">
              {data.atsBreakdown.factors.map((f) => (
                <li key={f.name} className="flex items-center justify-between gap-2">
                  <span className="text-text-2">{f.name}</span>
                  <Badge tone={f.score === f.max ? "easy" : f.score === 0 ? "hard" : "medium"}>
                    {f.score}/{f.max}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="text-text-3 text-xs mt-4">Save to rescore.</p>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1"}/resume/${params.id}/pdf`}
            target="_blank" rel="noreferrer"
            className="mt-3 inline-block"
          >
            <Button variant="secondary" className="w-full">Download PDF</Button>
          </a>
        </Card>

        <ResumeGap resumeId={params.id} />
      </aside>
    </div>
  );
}

function ListSection<T extends object>({
  title, items, onChange, render, empty,
}: {
  title: string;
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, set: (next: T) => void) => React.ReactNode;
  empty: T;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <Button size="sm" variant="secondary" onClick={() => onChange([...items, empty])} aria-label={`Add ${title.replace(/s$/, "").toLowerCase()}`}>+ Add</Button>
      </div>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="border border-border rounded-md p-3">
            {render(it, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
            <button
              className="mt-2 text-xs text-hard hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label={`Remove ${title.replace(/s$/, "").toLowerCase()} ${i + 1}`}
            >Remove</button>
          </div>
        ))}
      </div>
    </Card>
  );
}
