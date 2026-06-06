"use client";
import Link from "next/link";
import { Card, Badge, Button, EmptyState } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useState } from "react";
import { Icons } from "@/components/icons";

type Report = {
  id: string; company: string; role: string; driveDate: string;
  durationMin: number; sections: string[]; difficulty: string;
  patterns: string[]; helpfulCount: number;
  author: { name: string };
};

const SECTIONS = ["DSA","APTITUDE","CORE_CS","DEBUG","ENGLISH","PSYCHOMETRIC","SYSTEM_DESIGN"];

export default function Page() {
  const [company, setCompany] = useState("");
  const { data, mutate } = useApi<Report[]>(`/oa${company ? `?company=${encodeURIComponent(company)}` : ""}`);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company: "", role: "", driveDate: new Date().toISOString().slice(0, 10),
    durationMin: 90, sections: ["DSA","APTITUDE"], difficulty: "MEDIUM",
    notes: "", patterns: "",
  });
  const action = useApiAction();

  async function submit() {
    await action("/oa", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        driveDate: new Date(form.driveDate).toISOString(),
        patterns: form.patterns.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setOpen(false);
    setForm({ ...form, notes: "", patterns: "" });
    await mutate();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">OA Fingerprint</h1>
          <p className="text-text-3 mt-2">Community-sourced patterns of recent online assessments. Add yours after every drive.</p>
        </div>
        <Button onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Submit report"}</Button>
      </div>

      {open && (
        <Card className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company"  value={form.company}  onChange={(v) => setForm({ ...form, company: v })} />
            <Input label="Role"     value={form.role}     onChange={(v) => setForm({ ...form, role: v })} />
            <Input label="Date"     type="date" value={form.driveDate} onChange={(v) => setForm({ ...form, driveDate: v })} />
            <Input label="Duration (min)" type="number" value={String(form.durationMin)} onChange={(v) => setForm({ ...form, durationMin: Number(v) })} />
            <div>
              <label className="text-xs text-text-3 uppercase tracking-wider">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full mt-1 bg-bg border border-border rounded-md px-3 py-2 text-sm">
                {["EASY","MEDIUM","HARD","EXPERT"].map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-3 uppercase tracking-wider">Sections</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {SECTIONS.map((s) => {
                const on = form.sections.includes(s);
                return (
                  <button key={s} onClick={() => setForm({ ...form,
                    sections: on ? form.sections.filter((x) => x !== s) : [...form.sections, s],
                  })} className={`px-2 py-1 text-xs border rounded ${on ? "border-accent text-text-1" : "border-border text-text-3"}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
          <Input label="Patterns seen (comma-separated)" value={form.patterns} onChange={(v) => setForm({ ...form, patterns: v })} />
          <div>
            <label className="text-xs text-text-3 uppercase tracking-wider">Notes (markdown)</label>
            <textarea rows={5} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full mt-1 bg-bg border border-border rounded-md px-3 py-2 font-mono text-sm" />
          </div>
          <Button onClick={submit}>Post report</Button>
        </Card>
      )}

      <div className="mt-6 flex items-center gap-2 text-sm">
        <input placeholder="Filter by company…" value={company} onChange={(e) => setCompany(e.target.value)}
          className="flex-1 bg-bg border border-border rounded-md px-3 py-2" />
      </div>

      <div className="mt-6 space-y-2">
        {data?.map((r) => (
          <Link key={r.id} href={`/oa/${r.id}`}>
            <Card className="hover:border-accent transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-semibold">{r.company}</span>
                    <Badge>{r.role}</Badge>
                    <Badge tone={r.difficulty === "HARD" ? "hard" : r.difficulty === "EASY" ? "easy" : "medium"}>{r.difficulty}</Badge>
                  </div>
                  <div className="text-text-3 text-xs mt-1">
                    {new Date(r.driveDate).toLocaleDateString()} · {r.durationMin}m · by {r.author.name} · 👍 {r.helpfulCount}
                  </div>
                  {r.patterns.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.patterns.slice(0, 6).map((p) => <span key={p} className="text-xs font-mono text-text-3 px-2 py-0.5 border border-border rounded">{p}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {data && data.length === 0 && (
          <EmptyState
            icon={<Icons.target width={28} height={28} />}
            title={company ? `No reports for “${company}” yet` : "No reports yet"}
            description="OA patterns are crowd-sourced. Just finished a drive? Post what you saw and help the next batch."
            action={<Button onClick={() => setOpen(true)}>Submit a report</Button>}
          />
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-text-3 uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 bg-bg border border-border rounded-md px-3 py-2 text-sm" />
    </div>
  );
}
