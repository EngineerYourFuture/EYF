"use client";
import { toast } from "sonner";
import Link from "next/link";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { track, Events } from "@/lib/analytics";
import { useState } from "react";

type Mock = {
  id: string; type: "AI" | "PEER" | "EXPERT"; status: string;
  company: string | null; problemFocus: string | null;
  scheduledFor: string; startedAt: string | null; endedAt: string | null;
  feedback: { overallScore: number } | null;
};

const COMPANIES = ["Amazon","Google","Flipkart","Razorpay","Swiggy","Microsoft","Meta","Generic"];

export default function Page() {
  const { data, mutate } = useApi<Mock[]>("/mocks/me");
  const action = useApiAction();
  const [company, setCompany] = useState("Amazon");
  const [focus, setFocus]     = useState("two-pointers");
  const [starting, setStarting] = useState(false);

  async function start() {
    setStarting(true);
    try {
      const m = await action<{ id: string }>("/mocks/ai/start", {
        method: "POST",
        body: JSON.stringify({ company, problemFocus: focus }),
      }, { silent: true });
      track(Events.MockStarted, { type: "AI", company, focus });
      await mutate();
      window.location.href = `/mocks/${m.id}`;
    } catch (e) {
      toast.error("Couldn't start: " + (e as Error).message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl">
      <h1 className="font-display text-4xl font-bold tracking-tight">Mock Interviews</h1>
      <p className="text-text-3 mt-2">AI 24/7. Peer daily. Expert weekly.</p>

      <Card className="mt-10">
        <h2 className="font-display text-xl font-bold">Start an AI mock <Badge tone="accent" className="ml-2">Pro+</Badge></h2>
        <p className="text-text-3 text-sm mt-1">Claude-powered. 45 min default. Real interviewer behavior — pushback, edge cases, follow-ups.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="Company">
            <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm">
              {COMPANIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Problem focus">
            <input value={focus} onChange={(e) => setFocus(e.target.value)} className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm" />
          </Field>
        </div>
        <div className="mt-5">
          <Button onClick={start} disabled={starting}>{starting ? "Starting…" : "Start AI mock"}</Button>
        </div>
      </Card>

      <h2 className="font-display text-xl font-bold mt-12 mb-3">Past mocks</h2>
      <div className="space-y-2">
        {data?.map((m) => (
          <Link key={m.id} href={`/mocks/${m.id}`}>
            <Card className="hover:border-accent transition-colors flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge>{m.type}</Badge>
                  <span className="font-display text-base">{m.company ?? "—"} · {m.problemFocus ?? "general"}</span>
                </div>
                <div className="text-text-3 text-xs mt-1">{new Date(m.scheduledFor).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-3">
                {m.feedback && <Badge tone={m.feedback.overallScore >= 70 ? "easy" : m.feedback.overallScore >= 50 ? "medium" : "hard"}>{m.feedback.overallScore}/100</Badge>}
                <Badge tone={m.status === "COMPLETED" ? "default" : "accent"}>{m.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
        {data && data.length === 0 && <Card><p className="text-text-3">No mocks yet.</p></Card>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-text-3 uppercase tracking-wider">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
