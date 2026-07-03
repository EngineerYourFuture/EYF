"use client";
import Link from "next/link";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { PressureResilience } from "@/components/pressure-resilience";
import { toast } from "sonner";
import { useEffect, useState } from "react";

type Session = {
  id: string; level: string; targetSeconds: number; actualSeconds: number | null;
  completed: boolean; anxietyBefore: number | null; anxietyAfter: number | null;
  confidence: number | null; startedAt: string; endedAt: string | null;
  problem: { slug: string; title: string; difficulty: string } | null;
};
type Trend = { sessions: number; avgDelta: number; completionRate: number };

const LEVELS = [
  { id: "LOW",     label: "Low",     blurb: "1.5× normal time. Easy on the nerves." },
  { id: "NORMAL",  label: "Normal",  blurb: "Realistic. Matches typical OA." },
  { id: "HIGH",    label: "High",    blurb: "0.7× time. Forces shortcuts." },
  { id: "EXTREME", label: "Extreme", blurb: "0.5× time. Production-grade panic training." },
];

export default function Page() {
  const { data: sessions, mutate } = useApi<Session[]>("/pressure/me");
  const { data: trend } = useApi<Trend>("/pressure/me/anxiety");
  const action = useApiAction();
  const [active, setActive] = useState<{ id: string; targetSeconds: number; startedAt: number } | null>(null);
  const [problemSlug, setProblemSlug] = useState("");
  const [level, setLevel] = useState("NORMAL");
  const [anxietyBefore, setAnxietyBefore] = useState(5);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(i);
  }, [active]);

  async function start() {
    const s = await action<{ id: string; targetSeconds: number }>(
      "/pressure/start",
      { method: "POST", body: JSON.stringify({ problemSlug: problemSlug || undefined, level, anxietyBefore }) },
    );
    setActive({ id: s.id, targetSeconds: s.targetSeconds, startedAt: Date.now() });
  }

  async function end(completed: boolean) {
    if (!active) return;
    const actualSeconds = Math.round((Date.now() - active.startedAt) / 1000);
    const anxietyAfter = Number(prompt("Anxiety AFTER (1-10):", "5") ?? "5");
    const confidence = Number(prompt("Confidence in your solution (1-10):", "5") ?? "5");
    await action(`/pressure/${active.id}/end`, {
      method: "POST",
      body: JSON.stringify({ completed, actualSeconds, anxietyAfter, confidence }),
    });
    toast.success(completed ? "Session complete. Logged." : "Stopped. Try again.");
    setActive(null);
    await mutate();
  }

  if (active) {
    const elapsed = Math.round((now - active.startedAt) / 1000);
    const remaining = active.targetSeconds - elapsed;
    const pct = Math.min(100, (elapsed / active.targetSeconds) * 100);
    const tone = remaining < 60 ? "text-hard" : remaining < 300 ? "text-medium" : "text-text-1";
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
        <h1 className="font-display text-3xl font-bold">Pressure session live</h1>
        <Card className="mt-8">
          <div className="text-text-3 uppercase text-xs tracking-wider">Time remaining</div>
          <div className={`mt-2 font-display text-6xl font-bold font-mono ${tone}`}>
            {Math.max(0, Math.floor(remaining / 60))}:{String(Math.max(0, remaining % 60)).padStart(2, "0")}
          </div>
          <div className="mt-4 h-1.5 bg-border rounded-full overflow-hidden">
            <div className={`h-full ${pct > 80 ? "bg-hard" : pct > 50 ? "bg-medium" : "bg-accent"}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => end(true)}>Done — submit</Button>
            <Button variant="ghost" onClick={() => end(false)}>Give up</Button>
          </div>
          {problemSlug && <Link href={`/problems/${problemSlug}`} className="text-accent text-sm mt-4 inline-block">Open problem in new tab →</Link>}
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl">
      <h1 className="font-display text-4xl font-bold tracking-tight">Pressure Training</h1>
      <p className="text-text-3 mt-2">Inoculate against interview anxiety. Solve under a ticking clock.</p>

      {trend && trend.sessions > 0 && (
        <Card className="mt-8">
          <h2 className="font-display text-lg font-bold mb-3">Your anxiety trend</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><div className="text-text-3 uppercase text-xs">Sessions</div><div className="font-display text-2xl font-bold">{trend.sessions}</div></div>
            <div>
              <div className="text-text-3 uppercase text-xs">Avg Δ (after − before)</div>
              <div className={`font-display text-2xl font-bold ${trend.avgDelta < 0 ? "text-easy" : trend.avgDelta > 0 ? "text-hard" : ""}`}>
                {trend.avgDelta > 0 ? "+" : ""}{trend.avgDelta}
              </div>
            </div>
            <div><div className="text-text-3 uppercase text-xs">Completion</div><div className="font-display text-2xl font-bold">{Math.round(trend.completionRate * 100)}%</div></div>
          </div>
          {trend.avgDelta < 0 && <p className="text-easy text-sm mt-3">Anxiety dropping over time — inoculation working.</p>}
        </Card>
      )}

      {sessions && sessions.length >= 2 && (
        <div className="mt-5"><PressureResilience sessions={sessions} /></div>
      )}

      <Card className="mt-8">
        <h2 className="font-display text-xl font-bold mb-3">Start a session</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-3 uppercase tracking-wider">Problem (optional, slug)</label>
            <input value={problemSlug} onChange={(e) => setProblemSlug(e.target.value)}
              placeholder="e.g. two-sum"
              className="w-full mt-1 bg-bg border border-border rounded-md px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="text-xs text-text-3 uppercase tracking-wider">Pressure level</label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              {LEVELS.map((l) => (
                <button key={l.id} onClick={() => setLevel(l.id)}
                  className={`text-left p-3 border rounded-md ${level === l.id ? "border-accent bg-accent-tint" : "border-border hover:border-text-3"}`}>
                  <div className="font-semibold text-sm">{l.label}</div>
                  <div className="text-text-3 text-xs mt-1">{l.blurb}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-text-3 uppercase tracking-wider">Anxiety BEFORE (1 calm — 10 panicked)</label>
            <div className="flex items-center gap-3 mt-2">
              <input type="range" min={1} max={10} value={anxietyBefore} onChange={(e) => setAnxietyBefore(Number(e.target.value))}
                className="accent-accent flex-1" />
              <span className="font-mono">{anxietyBefore}</span>
            </div>
          </div>
          <Button onClick={start}>Start</Button>
        </div>
      </Card>

      <h2 className="font-display text-xl font-bold mt-12 mb-3">Recent sessions</h2>
      <div className="space-y-2">
        {sessions?.map((s) => (
          <Card key={s.id} className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone={s.completed ? "easy" : "hard"}>{s.completed ? "Done" : "Stopped"}</Badge>
                <Badge>{s.level}</Badge>
                {s.problem && <span className="font-display text-sm">{s.problem.title}</span>}
              </div>
              <div className="text-text-3 text-xs mt-1">
                {s.actualSeconds ?? "?"}s / {s.targetSeconds}s · {new Date(s.startedAt).toLocaleString()}
                {s.anxietyBefore != null && s.anxietyAfter != null && (
                  <span className="ml-2">· anxiety {s.anxietyBefore} → {s.anxietyAfter}</span>
                )}
              </div>
            </div>
          </Card>
        ))}
        {sessions?.length === 0 && <Card><p className="text-text-3 text-sm">No sessions yet. Start one above.</p></Card>}
      </div>
    </div>
  );
}
