"use client";
import { toast } from "sonner";
import Link from "next/link";
import { Card, Badge, Button, PageHeader } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { track, Events } from "@/lib/analytics";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";
import { ComposureTrend } from "@/components/composure-trend";
import { Icons, type IconName } from "@/components/icons";

type Mock = {
  id: string; type: "AI" | "PEER" | "EXPERT"; status: string;
  company: string | null; problemFocus: string | null;
  scheduledFor: string; startedAt: string | null; endedAt: string | null;
  feedback: { overallScore: number } | null;
};

const COMPANIES = ["Amazon","Google","Flipkart","Razorpay","Swiggy","Microsoft","Meta","Generic"];

const MODES: { icon: IconName; title: string; cadence: string; desc: string; href: string; cta: string }[] = [
  { icon: "mic", title: "AI mock", cadence: "24/7", desc: "Claude plays a real interviewer — pushback, edge cases, follow-ups.", href: "#ai", cta: "Start below" },
  { icon: "users", title: "Peer mock", cadence: "Daily", desc: "Pair with another candidate and interview each other live.", href: "/peer-mocks", cta: "Find a peer" },
  { icon: "award", title: "Expert mock", cadence: "Weekly", desc: "Book a senior engineer from a top company for a graded loop.", href: "/mentors", cta: "Book a mentor" },
];

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
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Practice until the pressure disappears"
        title="Mock Interviews"
        subtitle="Three ways to rehearse the real thing — on demand with AI, daily with peers, weekly with experts."
      />

      {/* Three ways to practice */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        {MODES.map((m) => {
          const Icon = Icons[m.icon];
          return (
            <Link key={m.title} href={m.href} className="group rounded-xl border border-border bg-surface p-5 shadow-card card-interactive flex flex-col">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20"><Icon width={20} height={20} /></span>
                <Badge>{m.cadence}</Badge>
              </div>
              <div className="mt-3 font-display text-lg font-bold">{m.title}</div>
              <p className="text-text-3 text-sm mt-1 flex-1 leading-snug">{m.desc}</p>
              <span className="mt-3 text-accent text-sm inline-flex items-center gap-1">{m.cta} <Icons.arrow width={14} height={14} /></span>
            </Link>
          );
        })}
      </div>

      <div className="mt-8"><ComposureTrend /></div>

      {/* AI mock starter */}
      <Card id="ai" variant="glow" className="mt-8 scroll-mt-24">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">Start an AI mock <Badge tone="accent">Pro+</Badge></h2>
        <p className="text-text-3 text-sm mt-1">Claude-powered. 45 min default. Real interviewer behavior — pushback, edge cases, follow-ups.</p>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <Field label="Company">
            <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none">
              {COMPANIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Problem focus">
            <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. two-pointers" className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none" />
          </Field>
        </div>
        <div className="mt-5">
          <Button glow onClick={start} disabled={starting}>{starting ? "Starting…" : "Start AI mock"}</Button>
        </div>
      </Card>

      <h2 className="font-display text-xl font-bold mt-10 mb-3">Past mocks</h2>
      <div className="space-y-2">
        {data?.map((m) => (
          <Link key={m.id} href={`/mocks/${m.id}`}>
            <Card className="hover:border-edge transition-colors flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge>{m.type}</Badge>
                  <span className="font-display text-base">{m.company ?? "—"} · {m.problemFocus ?? "general"}</span>
                </div>
                <div className="text-text-4 text-xs mt-1">{new Date(m.scheduledFor).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-3">
                {m.feedback && <Badge tone={(() => { const sc = m.feedback.overallScore; if (sc >= 70) { return "easy" as const; } if (sc >= 50) { return "medium" as const; } return "hard" as const; })()}>{m.feedback.overallScore}/100</Badge>}
                <Badge tone={m.status === "COMPLETED" ? "default" : "accent"}>{m.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
        {data?.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <div className="text-text-4 flex justify-center mb-3"><Icons.mic width={26} height={26} /></div>
            <p className="text-text-2 font-medium">No mocks yet</p>
            <p className="text-text-4 text-sm mt-1">Your first AI mock is one click away — start one above to baseline your readiness.</p>
          </div>
        )}
      </div>
    </PageMotion>
  );
}

function Field({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <label className="text-xs text-text-3 uppercase tracking-wider">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
