"use client";
import { useState } from "react";
import { Button, Card, Badge, PageHeader, Skeleton, EmptyState } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { track, Events } from "@/lib/analytics";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { ReadinessNudge } from "@/components/readiness-nudge";

type Question = { category: string; question: string; testing: string; approach: string };
type Prep = {
  id: string; projectTitle: string; summary: string; techStack: string[];
  questions: Question[]; tips: { redFlags: string[]; starHooks: string[] }; createdAt: string;
};
type PrepListItem = { id: string; projectTitle: string; techStack: string[]; createdAt: string };
type StartedProject = {
  id: string; notes: string | null;
  idea: { title: string; description: string; techStack: string[] };
};

export default function Page() {
  const action = useApiAction();
  const { data: started } = useApi<StartedProject[]>("/projects/me/started");
  const { data: history, mutate: refetchHistory } = useApi<PrepListItem[]>("/project-prep");

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [stack, setStack] = useState("");
  const [userProjectId, setUserProjectId] = useState<string>("");
  const [prep, setPrep] = useState<Prep | null>(null);
  const [loading, setLoading] = useState(false);

  function pickStarted(id: string) {
    setUserProjectId(id);
    const sp = started?.find((s) => s.id === id);
    if (sp) {
      setTitle(sp.idea.title);
      setSummary(sp.notes?.trim() || sp.idea.description);
      setStack(sp.idea.techStack.join(", "));
    }
  }

  async function generate() {
    if (!title.trim() || !summary.trim()) return;
    setLoading(true);
    try {
      const data = await action<Prep>("/project-prep/generate", {
        method: "POST",
        body: JSON.stringify({
          userProjectId: userProjectId || undefined,
          title: title.trim(),
          summary: summary.trim(),
          techStack: stack.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      track(Events.ProjectPrepped, { title: data.projectTitle, questions: data.questions.length });
      setPrep(data);
      refetchHistory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setLoading(false); }
  }

  async function openPrep(id: string) {
    setLoading(true);
    try {
      const data = await action<Prep>(`/project-prep/${id}`);
      setPrep(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setLoading(false); }
  }

  /* ─── GUIDE ─────────────────────────────────────────── */
  if (prep) {
    return (
      <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
        <button onClick={() => setPrep(null)} className="text-text-4 text-sm hover:text-text-2 mb-4">← New prep</button>
        <PageHeader eyebrow="Defend your project" title={prep.projectTitle} subtitle={prep.summary} />

        {prep.techStack.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {prep.techStack.map((t) => <Badge key={t}>{t}</Badge>)}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Icons.chat width={18} height={18} className="text-accent" /> Questions you&apos;ll face
          </h2>
          {prep.questions.map((q, i) => (
            <Card key={i}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-text-3 text-xs font-mono">Q{i + 1}</span>
                <Badge tone="accent">{q.category}</Badge>
              </div>
              <p className="mt-3 text-text-1 font-medium">{q.question}</p>
              <div className="mt-3 grid gap-2 text-sm">
                <p className="text-text-3"><span className="text-text-4 uppercase text-xs tracking-wider mr-2">Testing</span>{q.testing}</p>
                <p className="text-text-2"><span className="text-accent uppercase text-xs tracking-wider mr-2">Approach</span>{q.approach}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <Card className="border-hard/30">
            <h3 className="font-medium text-hard flex items-center gap-2"><Icons.gauge width={16} height={16} /> Red flags</h3>
            <ul className="mt-3 space-y-2 text-sm text-text-2 list-disc pl-4">
              {prep.tips.redFlags.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </Card>
          <Card className="border-accent/30">
            <h3 className="font-medium text-accent flex items-center gap-2"><Icons.sparkle width={16} height={16} /> STAR story hooks</h3>
            <ul className="mt-3 space-y-2 text-sm text-text-2 list-disc pl-4">
              {prep.tips.starHooks.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </Card>
        </div>

        <ReadinessNudge label="Prepping projects strengthens your readiness" />

        <div className="mt-8 flex gap-3">
          <Button onClick={() => setPrep(null)}>Prep another project</Button>
          <a href="/communication"><Button variant="ghost">Practice answering aloud →</Button></a>
        </div>
      </PageMotion>
    );
  }

  /* ─── FORM ──────────────────────────────────────────── */
  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Project interview prep"
        title="Get grilled on your project — before they do"
        subtitle="Interviewers spend a third of the round on your resume projects. Feed one in and get the exact questions they'll ask, what each is really testing, and how to answer."
      />

      {started && started.length > 0 && (
        <Card className="mt-8">
          <label className="text-text-3 text-xs uppercase tracking-wider">Use a project you&apos;ve started</label>
          <select value={userProjectId} onChange={(e) => pickStarted(e.target.value)}
            className="mt-2 w-full h-11 px-3 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent">
            <option value="">Custom project (fill in below)</option>
            {started.map((s) => <option key={s.id} value={s.id}>{s.idea.title}</option>)}
          </select>
        </Card>
      )}

      <Card className="mt-4 space-y-4">
        <div>
          <label className="text-text-3 text-xs uppercase tracking-wider">Project title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Real-time chat app with presence"
            className="mt-2 w-full h-11 px-3.5 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent placeholder:text-text-4" />
        </div>
        <div>
          <label className="text-text-3 text-xs uppercase tracking-wider">What it does / your role</label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4}
            placeholder="1–3 sentences: the problem it solves, what you built, and your specific contribution."
            className="mt-2 w-full rounded-lg bg-surface border border-border text-text-1 p-3.5 text-sm leading-relaxed focus:outline-none focus:border-accent placeholder:text-text-4" />
        </div>
        <div>
          <label className="text-text-3 text-xs uppercase tracking-wider">Tech stack <span className="text-text-4 normal-case">(comma-separated)</span></label>
          <input value={stack} onChange={(e) => setStack(e.target.value)} placeholder="React, Node, PostgreSQL, WebSocket, Redis"
            className="mt-2 w-full h-11 px-3.5 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent placeholder:text-text-4" />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <Button onClick={generate} disabled={loading || !title.trim() || !summary.trim()}>
            {loading ? "Generating grilling…" : "Generate interview prep"}
          </Button>
          <span className="text-text-4 text-sm">AI-tailored to your stack</span>
        </div>
      </Card>

      {/* History */}
      {history === undefined ? (
        <div className="mt-10 space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : history.length > 0 ? (
        <div className="mt-10">
          <h2 className="font-display text-lg font-bold">Your prep guides</h2>
          <div className="mt-4 space-y-2">
            {history.map((h) => (
              <button key={h.id} onClick={() => openPrep(h.id)}
                className="w-full text-left rounded-xl border border-border bg-surface hover:border-edge hover:bg-surface-2 transition-colors px-4 py-3.5 flex items-center gap-3">
                <Icons.cube width={16} height={16} className="text-text-4 shrink-0" />
                <span className="text-sm text-text-1 flex-1 truncate">{h.projectTitle}</span>
                <span className="text-text-4 text-xs hidden sm:block">{h.techStack.slice(0, 3).join(" · ")}</span>
                <Icons.arrow width={15} height={15} className="text-text-4" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10"><EmptyState title="No prep guides yet" description="Generate your first one above — it'll be saved here to revisit before the interview." /></div>
      )}
    </PageMotion>
  );
}
