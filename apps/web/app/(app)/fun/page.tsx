"use client";
import { useState } from "react";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useEyfAuth as useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Resume = { id: string; title: string; isDefault: boolean };
type Roast = {
  oneLiner: string;
  brutal: string[];
  fixable: { issue: string; fix: string }[];
  finalGrade: "F" | "D" | "C" | "B" | "A";
};

export default function Page() {
  const { data: resumes } = useApi<Resume[]>("/resume/me");
  const action = useApiAction();
  const [roast, setRoast] = useState<Roast | null>(null);
  const [roasting, setRoasting] = useState(false);

  async function roastIt(id: string) {
    setRoasting(true);
    try {
      const r = await action<Roast>(`/fun/roast/${id}`, { method: "POST" });
      setRoast(r);
    } catch (e) { toast.error((e as Error).message); }
    finally { setRoasting(false); }
  }

  const defaultId = resumes?.find((r) => r.isDefault)?.id ?? resumes?.[0]?.id;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-bold tracking-tight">Fun + Motivation</h1>
      <p className="text-text-3 mt-2">Get roasted. Visualise the offer. Stay hungry.</p>

      <Card className="mt-10">
        <h2 className="font-display text-xl font-bold">Get Roasted <Badge tone="accent" className="ml-2">Pro+</Badge></h2>
        <p className="text-text-3 text-sm mt-1">Claude reads your resume in 30 seconds. Brutal. No softening.</p>
        {!defaultId
          ? <p className="text-text-3 mt-4 text-sm">Build a resume first → <a href="/resume" className="text-accent hover:underline">resume editor</a></p>
          : <Button className="mt-4" onClick={() => roastIt(defaultId)} disabled={roasting}>
              {roasting ? "Reading…" : "Roast my default resume"}
            </Button>}
        {roast && <RoastView roast={roast} />}
      </Card>

      <OfferLetter />
    </div>
  );
}

function RoastView({ roast }: { roast: Roast }) {
  const gradeColor: Record<Roast["finalGrade"], string> = {
    F: "text-hard", D: "text-hard", C: "text-medium", B: "text-easy", A: "text-easy",
  };
  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-2xl">{roast.oneLiner}</p>
        <span className={`font-display text-5xl font-bold ${gradeColor[roast.finalGrade]}`}>{roast.finalGrade}</span>
      </div>
      <div>
        <h4 className="text-xs text-text-3 uppercase tracking-wider mb-2">Brutal</h4>
        <ul className="space-y-1.5 text-sm">
          {roast.brutal.map((b, i) => <li key={i} className="flex gap-2"><span className="text-hard">→</span>{b}</li>)}
        </ul>
      </div>
      <div>
        <h4 className="text-xs text-text-3 uppercase tracking-wider mb-2">Fixable</h4>
        <ul className="space-y-3 text-sm">
          {roast.fixable.map((f, i) => (
            <li key={i} className="border-l-2 border-accent pl-3">
              <div className="font-medium">{f.issue}</div>
              <div className="text-text-3 mt-1">→ {f.fix}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OfferLetter() {
  const { getToken } = useAuth();
  const [form, setForm] = useState({ company: "Razorpay", role: "Software Engineer", location: "Bangalore", ctcLpa: 28 });
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const token = await getToken();
      const qs = new URLSearchParams({
        company: form.company, role: form.role, location: form.location, ctcLpa: String(form.ctcLpa),
      }).toString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1"}/fun/offer-letter?${qs}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${form.company}-offer-letter.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Tape it to the wall.");
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <Card className="mt-6">
      <h2 className="font-display text-xl font-bold">Mock Offer Letter</h2>
      <p className="text-text-3 text-sm mt-1">A realistic-looking PDF to keep you hungry until the real one shows up.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Input label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <Input label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
        <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        <Input label="CTC (LPA)" type="number" value={String(form.ctcLpa)} onChange={(v) => setForm({ ...form, ctcLpa: Number(v) })} />
      </div>
      <Button onClick={download} disabled={busy} className="mt-4">{busy ? "Generating…" : "↓ Generate PDF"}</Button>
    </Card>
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
