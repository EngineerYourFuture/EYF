"use client";
import { useState } from "react";
import { Card, Badge, Button, PageHeader, SkeletonRows, EmptyState } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { toast } from "sonner";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { companyLabel } from "@/lib/company";

type Exp = {
  id: string; company: string; role: string;
  outcome: "OFFER" | "REJECTED" | "PENDING" | "WITHDRAWN";
  difficulty: number; rounds: number; body: string; tips: string | null;
  upvotes: number; createdAt: string;
  author: { name: string; college: string | null };
};

const OUTCOME_TONE = { OFFER: "easy", REJECTED: "hard", PENDING: "medium", WITHDRAWN: "default" } as const;
const OUTCOME_LABEL = { OFFER: "Offer", REJECTED: "Rejected", PENDING: "In process", WITHDRAWN: "Withdrew" } as const;
const OUTCOMES = ["OFFER", "REJECTED", "PENDING", "WITHDRAWN"] as const;

export default function Page() {
  // Pre-filter when arrived from a company's prep page (?company=amazon).
  const [company, setCompany] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("company") ?? "" : "");
  const { data, isLoading, mutate } = useApi<Exp[]>(`/experiences${company ? "?company=" + company : ""}`);
  const { data: companies } = useApi<{ slug: string }[]>("/companies");
  const [open, setOpen] = useState(false);

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow="Learn from people who sat the loop"
          title="Interview Experiences"
          subtitle="Real, round-by-round writeups from candidates — what was asked, what got them in, what tripped them up."
        />
        <Button onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Share yours"}</Button>
      </div>

      {open && <SubmitForm companies={companies ?? []} onDone={async () => { setOpen(false); await mutate(); }} />}

      <label className="mt-8 flex items-center gap-2 text-sm">
        <span className="text-text-3 uppercase text-xs tracking-wider">Company</span>
        <select value={company} onChange={(e) => setCompany(e.target.value)}
          className="bg-surface border border-border rounded-md px-2.5 py-1.5 focus:border-accent/50 outline-none">
          <option value="">All companies</option>
          {(companies ?? []).map((c) => <option key={c.slug} value={c.slug}>{companyLabel(c.slug)}</option>)}
        </select>
      </label>

      <div className="mt-6 space-y-3">
        {isLoading && <SkeletonRows rows={4} />}
        {data?.map((e) => <ExpCard key={e.id} e={e} onUpvote={mutate} />)}
        {data?.length === 0 && (
          <EmptyState icon={<Icons.mic width={28} height={28} />} title="No experiences yet"
            description={company ? "None for this company. Be the first to share." : "Be the first to debrief your interview and help the next batch."}
            action={<Button onClick={() => setOpen(true)}>Share your experience</Button>} />
        )}
      </div>
    </PageMotion>
  );
}

function ExpCard({ e, onUpvote }: Readonly<{ e: Exp; onUpvote: () => void }>) {
  const action = useApiAction();
  const [expanded, setExpanded] = useState(false);
  const [votes, setVotes] = useState(e.upvotes);
  const [voted, setVoted] = useState(false);

  async function upvote() {
    if (voted) return;
    setVotes((v) => v + 1); setVoted(true);
    try { await action(`/experiences/${e.id}/upvote`, { method: "POST" }, { silent: true }); onUpvote(); }
    catch { setVotes((v) => v - 1); setVoted(false); }
  }

  const long = e.body.length > 180;
  return (
    <Card className="flex gap-4">
      {/* upvote rail */}
      <button onClick={upvote} disabled={voted}
        className={`flex flex-col items-center gap-0.5 shrink-0 rounded-lg border px-2.5 py-1.5 h-fit transition-colors ${
          voted ? "border-accent bg-accent-tint text-accent" : "border-border text-text-3 hover:border-edge"}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
        <span className="font-mono text-xs font-bold tabular-nums">{votes}</span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-accent/20 bg-accent-tint font-display text-xs font-bold text-accent">{companyLabel(e.company)[0]}</span>
          <span className="font-display font-bold">{companyLabel(e.company)}</span>
          <span className="text-text-3 text-sm">· {e.role}</span>
          <Badge tone={OUTCOME_TONE[e.outcome]}>{OUTCOME_LABEL[e.outcome]}</Badge>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-text-4"><Icons.gauge width={13} height={13} /> Difficulty {e.difficulty}/5</span>
          <span className="inline-flex items-center gap-1 text-text-4"><Icons.activity width={13} height={13} /> {e.rounds} rounds</span>
        </div>

        <p className={`mt-3 text-text-2 text-sm leading-relaxed whitespace-pre-wrap ${!expanded && long ? "line-clamp-3" : ""}`}>{e.body}</p>
        {long && (
          <button onClick={() => setExpanded((x) => !x)} className="text-accent text-xs mt-1 hover:underline">
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {e.tips && expanded && (
          <div className="mt-3 rounded-lg border border-accent/20 bg-accent-tint px-3 py-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-accent mb-0.5">Tip</div>
            <p className="text-text-2 text-sm">{e.tips}</p>
          </div>
        )}

        <div className="mt-3 text-text-4 text-xs">— {e.author.name}{e.author.college ? `, ${e.author.college}` : ""}</div>
      </div>
    </Card>
  );
}

function SubmitForm({ companies, onDone }: Readonly<{ companies: { slug: string }[]; onDone: () => void }>) {
  const action = useApiAction();
  const [f, setF] = useState({ company: "", role: "", outcome: "OFFER", difficulty: 3, rounds: 3, body: "", tips: "" });
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!f.company || !f.role || f.body.trim().length < 20) { toast.error("Add company, role, and a writeup (20+ chars)."); return; }
    setBusy(true);
    try {
      await action("/experiences", { method: "POST", body: JSON.stringify({ ...f, tips: f.tips || null }) }, { silent: true });
      toast.success("Thanks — shared with the next batch.");
      onDone();
    } catch { toast.error("Couldn't post — try again."); }
    finally { setBusy(false); }
  }

  return (
    <Card variant="glow" className="mt-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Company</span>
          <select value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })}
            className="mt-1.5 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none">
            <option value="">Select…</option>
            {companies.map((c) => <option key={c.slug} value={c.slug}>{companyLabel(c.slug)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Role</span>
          <input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="e.g. SDE-1"
            className="mt-1.5 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none" />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Outcome</span>
          <select value={f.outcome} onChange={(e) => setF({ ...f, outcome: e.target.value })}
            className="mt-1.5 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none">
            {OUTCOMES.map((o) => <option key={o} value={o}>{OUTCOME_LABEL[o]}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Difficulty</span>
          <select value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: Number(e.target.value) })}
            className="mt-1.5 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none">
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Rounds</span>
          <input type="number" min={1} max={15} value={f.rounds} onChange={(e) => setF({ ...f, rounds: Number(e.target.value) })}
            className="mt-1.5 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none" />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Round-by-round writeup</span>
        <textarea rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })}
          placeholder="OA: 2 DP problems. R1: graphs + sliding window. R2: system design. R3: behavioral / bar-raiser…"
          className="mt-1.5 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">One tip <span className="text-text-4 font-normal">(optional)</span></span>
        <input value={f.tips} onChange={(e) => setF({ ...f, tips: e.target.value })} placeholder="The one thing you'd tell the next candidate"
          className="mt-1.5 w-full bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none" />
      </label>
      <Button glow onClick={submit} disabled={busy}>{busy ? "Posting…" : "Post experience"}</Button>
    </Card>
  );
}
