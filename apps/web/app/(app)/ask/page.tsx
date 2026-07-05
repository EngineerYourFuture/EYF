"use client";
/**
 * Ask EYF — tech-stack Q&A answered by EYF's own knowledge base + EYF
 * Intelligence. Every answer is EYF-authored (AI drafted, staff curated) —
 * the corpus compounds as students ask.
 */
import { useState } from "react";
import { Card, Badge, Button, PageHeader, Skeleton } from "@eyf/ui";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { useApi, useApiAction } from "@/lib/use-api";

type Entry = { id: string; question: string; answer: string; topic: string; tags: string[]; curated: boolean };
type AskResult = { entry: Entry | null; related: Entry[]; answeredBy: "knowledge-base" | "ai" | "unavailable" };
type Trending = { id: string; question: string; topic: string; askCount: number };

export default function Page() {
  const action = useApiAction();
  const { data: trending } = useApi<Trending[]>("/ask/trending");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [offline, setOffline] = useState<Entry[] | null>(null); // AI down → related only

  async function ask(q: string) {
    const text = q.trim();
    if (text.length < 8 || busy) return;
    setBusy(true); setResult(null); setOffline(null);
    try {
      const r = await action<AskResult>("/ask", { method: "POST", body: JSON.stringify({ question: text }) });
      if (r.answeredBy === "unavailable" || !r.entry) setOffline(r.related);
      else setResult(r);
    } catch { /* toasted */ } finally { setBusy(false); }
  }

  async function open(id: string) {
    setBusy(true); setResult(null); setOffline(null);
    try {
      const entry = await action<Entry>(`/ask/entry/${id}`);
      setResult({ entry, related: [], answeredBy: "knowledge-base" });
    } catch { /* toasted */ } finally { setBusy(false); }
  }

  return (
    <PageMotion>
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl mx-auto">
        <PageHeader
          eyebrow="EYF Intelligence"
          title="Ask EYF"
          subtitle="Any tech-stack or CS question — answered in EYF's voice with the interview angle: what it is, why interviewers ask, and what they'll ask next."
        />

        <Card className="mt-8">
          <div className="flex gap-2">
            <input
              className="w-full h-12 px-4 rounded-lg bg-surface border border-border text-text-1 focus:outline-none focus:border-accent"
              placeholder="e.g. What is event loop in Node.js? Why use indexes in Postgres?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void ask(question); }}
              maxLength={300}
            />
            <Button size="lg" onClick={() => void ask(question)} disabled={busy || question.trim().length < 8}>
              {busy ? "Thinking…" : "Ask"}
            </Button>
          </div>
          <p className="text-text-4 text-xs mt-2">Answers are EYF-original — drafted by EYF Intelligence and curated by our team. They join the knowledge base for every student after you.</p>
        </Card>

        {busy && (
          <Card className="mt-6"><Skeleton className="h-4 w-2/3 mb-3" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-1/2" /></Card>
        )}

        {result?.entry && (
          <Card className="mt-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="accent">{result.entry.topic}</Badge>
              {result.entry.curated
                ? <Badge tone="easy">Curated by EYF</Badge>
                : <Badge>EYF Intelligence</Badge>}
              {result.answeredBy === "knowledge-base" && <span className="text-text-4 text-xs">from the EYF knowledge base</span>}
            </div>
            <h2 className="font-display text-xl font-bold mt-3">{result.entry.question}</h2>
            <div className="mt-4 whitespace-pre-wrap text-text-2 leading-relaxed">{result.entry.answer}</div>
            {result.entry.tags.length > 0 && (
              <div className="flex gap-2 mt-5">{result.entry.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
            )}
            {result.related.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">Related answers</div>
                <div className="space-y-1">
                  {result.related.map((r) => (
                    <button key={r.id} onClick={() => void open(r.id)} className="block text-left text-sm text-text-2 hover:text-text-1">→ {r.question}</button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {offline && (
          <Card className="mt-6">
            <div className="flex items-start gap-3">
              <span className="text-text-3 mt-0.5"><Icons.sparkle width={18} height={18} /></span>
              <div>
                <p className="text-text-1 font-medium">EYF Intelligence is warming up.</p>
                <p className="text-text-3 text-sm mt-1">Live answering isn&apos;t configured on this environment yet{offline.length ? " — here are the closest answers from the knowledge base:" : "."}</p>
                {offline.length > 0 && (
                  <div className="space-y-1 mt-3">
                    {offline.map((r) => (
                      <button key={r.id} onClick={() => void open(r.id)} className="block text-left text-sm text-text-2 hover:text-text-1">→ {r.question}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {!result && !offline && !busy && trending && trending.length > 0 && (
          <div className="mt-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-3">Most asked</div>
            <div className="space-y-2">
              {trending.map((t) => (
                <Card key={t.id} className="py-3 cursor-pointer hover:border-edge transition-colors" onClick={() => void open(t.id)}>
                  <div className="flex items-center gap-3">
                    <span className="text-text-2 text-sm flex-1">{t.question}</span>
                    <Badge tone="accent">{t.topic}</Badge>
                    <span className="text-text-4 text-xs shrink-0">{t.askCount}×</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageMotion>
  );
}
