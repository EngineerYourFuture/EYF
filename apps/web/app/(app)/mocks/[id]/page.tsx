"use client";
import { toast } from "sonner";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { track, Events } from "@/lib/analytics";
import { useEyfAuth as useAuth } from "@/lib/auth";
import { useRecorder } from "@/lib/use-recorder";
import { useState, useRef, useEffect } from "react";

type Turn = { role: "user" | "assistant"; content: string; ts: number };
type Mock = {
  id: string; type: string; status: string;
  company: string | null; problemFocus: string | null;
  transcript: Turn[] | null;
  feedback: {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    rubric: { problemUnderstanding: number; approachClarity: number; codeQuality: number; edgeCases: number; communication: number };
    summary: string;
  } | null;
};

export default function Page({ params }: { params: { id: string } }) {
  const { data, mutate } = useApi<Mock>(`/mocks/${params.id}`);
  const action = useApiAction();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [data?.transcript?.length]);

  if (!data) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;

  async function send() {
    if (!msg.trim() || sending) return;
    setSending(true);
    const m = msg;
    setMsg("");
    try {
      await action(`/mocks/${params.id}/turn`, { method: "POST", body: JSON.stringify({ message: m }) });
      await mutate();
    } finally {
      setSending(false);
    }
  }

  async function end() {
    setEnding(true);
    try {
      await action(`/mocks/${params.id}/end`, { method: "POST" });
      track(Events.MockEnded, { mockId: params.id });
      await mutate();
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] lg:h-screen lg:divide-x divide-border">
      <div className="flex flex-col min-h-[60vh]">
        <header className="border-b border-border h-14 px-6 flex items-center gap-3">
          <Badge>{data.type}</Badge>
          <span className="font-display">{data.company} · {data.problemFocus}</span>
          <Badge tone={data.status === "COMPLETED" ? "default" : "accent"} className="ml-auto">{data.status}</Badge>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-auto px-6 py-8 space-y-4 max-w-3xl">
          {(data.transcript ?? []).map((t, i) => (
            <div key={i} className={t.role === "assistant" ? "" : "ml-12"}>
              <div className="text-text-3 text-xs uppercase tracking-wider mb-1">
                {t.role === "assistant" ? "Interviewer" : "You"}
              </div>
              <div className={`px-4 py-3 rounded-md whitespace-pre-wrap leading-relaxed ${
                t.role === "assistant" ? "bg-surface border border-border" : "bg-accent-tint border border-accent/30"
              }`}>{t.content}</div>
            </div>
          ))}
          {sending && <div className="text-text-3 text-sm">Interviewer is thinking…</div>}
        </div>

        {data.status !== "COMPLETED" && (
          <Composer onSend={async (m) => { setMsg(m); await action(`/mocks/${params.id}/turn`, { method: "POST", body: JSON.stringify({ message: m }) }); await mutate(); }}
                    onEnd={end} mockId={params.id} />
        )}
      </div>

      <aside className="overflow-auto p-6">
        <h2 className="font-display text-xl font-bold mb-4">Feedback</h2>
        {data.feedback ? (
          <>
            <Card>
              <div className="text-xs text-text-3 uppercase">Overall</div>
              <div className="mt-1 font-display text-4xl font-bold">{data.feedback.overallScore}<span className="text-text-3 text-xl"> /100</span></div>
              <p className="mt-3 text-text-2 text-sm leading-relaxed">{data.feedback.summary}</p>
            </Card>

            <Card className="mt-4">
              <h3 className="font-display text-sm uppercase tracking-wider text-text-3 mb-2">Rubric</h3>
              {Object.entries(data.feedback.rubric).map(([k, v]) => (
                <RubricRow key={k} label={k} value={v} />
              ))}
            </Card>

            <Card className="mt-4">
              <h3 className="font-display text-sm uppercase tracking-wider text-text-3 mb-2">Strengths</h3>
              <ul className="text-sm space-y-1.5">{data.feedback.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-easy">✓</span>{s}</li>)}</ul>
            </Card>

            <Card className="mt-4">
              <h3 className="font-display text-sm uppercase tracking-wider text-text-3 mb-2">Improve</h3>
              <ul className="text-sm space-y-1.5">{data.feedback.improvements.map((s, i) => <li key={i} className="flex gap-2"><span className="text-hard">→</span>{s}</li>)}</ul>
            </Card>
          </>
        ) : (
          <p className="text-text-3 text-sm">Feedback appears when you end the mock.</p>
        )}
      </aside>
    </div>
  );
}

const WHISPER_LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "kn", label: "Kannada" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" },
];

function Composer({ onSend, onEnd, mockId }: { onSend: (m: string) => Promise<void>; onEnd: () => void; mockId: string }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [lang, setLang] = useState("en");
  const { state: recState, blob, start, stop, reset, error } = useRecorder();
  const { getToken } = useAuth();

  async function send(msg: string) {
    if (!msg.trim() || sending) return;
    setSending(true);
    try { await onSend(msg); setText(""); reset(); } finally { setSending(false); }
  }

  async function transcribeAndSend() {
    if (!blob) return;
    setTranscribing(true);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1"}/mocks/${mockId}/transcribe?lang=${lang}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": blob.type || "audio/webm",
        },
        body: blob,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Transcription failed");
      setText(json.data.text);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setTranscribing(false); }
  }

  return (
    <div className="border-t border-border p-4 flex gap-2">
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(text); }}
        placeholder="Type or hold the mic… (⌘+Enter to send)"
        className="flex-1 bg-bg border border-border rounded-md px-3 py-2 text-sm font-mono"
      />
      <div className="flex flex-col gap-2">
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="bg-surface border border-border rounded-md px-2 py-1 text-xs">
          {WHISPER_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        {recState === "recording"
          ? <Button size="sm" variant="ghost" onClick={stop}>⏹ Stop</Button>
          : <Button size="sm" variant="ghost" onClick={start} disabled={recState === "requesting"}>
              {recState === "requesting" ? "…" : "🎤 Record"}
            </Button>}
        {blob && (
          <Button size="sm" variant="secondary" onClick={transcribeAndSend} disabled={transcribing}>
            {transcribing ? "Transcribing…" : "Transcribe"}
          </Button>
        )}
        <Button size="sm" onClick={() => send(text)} disabled={sending}>Send</Button>
        <Button size="sm" variant="ghost" onClick={onEnd}>End</Button>
      </div>
      {error && <div className="absolute bottom-20 text-xs text-hard">{error}</div>}
    </div>
  );
}

function RubricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
      <span className="text-text-2 capitalize text-sm">{label.replace(/([A-Z])/g, " $1")}</span>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${value}%` }} />
        </div>
        <span className="font-mono text-xs w-8 text-right">{value}</span>
      </div>
    </div>
  );
}
