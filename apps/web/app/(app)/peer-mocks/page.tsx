"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Button } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const FOCUSES = ["two-pointers", "sliding-window", "graph", "dp", "system-design"];

export default function Page() {
  const action = useApiAction();
  const router = useRouter();
  const [focus, setFocus] = useState("two-pointers");
  const [inQueue, setInQueue] = useState(false);
  const [position, setPosition] = useState<number | null>(null);

  // Poll for match while in queue.
  useEffect(() => {
    if (!inQueue) return;
    const id = setInterval(async () => {
      try {
        const r = await action<{ matched: boolean; mockSessionId: string | null }>("/peer/queue/status", {}, { silent: true });
        if (r.matched && r.mockSessionId) {
          clearInterval(id);
          setInQueue(false);
          router.push(`/peer-mocks/${r.mockSessionId}`);
        }
      } catch { /* swallow */ }
    }, 3000);
    return () => clearInterval(id);
  }, [inQueue, action, router]);

  async function join() {
    try {
      const r = await action<
        | { matched: true; mockSessionId: string }
        | { matched: false; queuePosition: number }
      >("/peer/queue/join", { method: "POST", body: JSON.stringify({ problemFocus: focus }) }, { silent: true });
      if (r.matched) {
        router.push(`/peer-mocks/${r.mockSessionId}`);
      } else {
        setInQueue(true);
        setPosition(r.queuePosition);
        toast.success("In the queue. We'll match you with a peer.");
      }
    } catch (e) { toast.error((e as Error).message); }
  }

  async function leave() {
    await action("/peer/queue/leave", { method: "POST" });
    setInQueue(false); setPosition(null);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-bold tracking-tight">Peer Mocks</h1>
      <p className="text-text-3 mt-2">Random pair, real time, 30 min. Take turns being interviewer.</p>

      <Card className="mt-10">
        <h2 className="font-display text-xl font-bold mb-3">Find a partner</h2>
        <div role="group" aria-labelledby="peer-focus-label">
        <span id="peer-focus-label" className="text-xs text-text-3 uppercase tracking-wider">Problem focus</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {FOCUSES.map((f) => (
            <button key={f} onClick={() => setFocus(f)} aria-pressed={focus === f}
              className={`px-3 py-1 text-sm border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${focus === f ? "border-accent text-text-1 bg-accent-tint" : "border-border text-text-3"}`}>
              {f}
            </button>
          ))}
        </div>
        </div>

        {!inQueue
          ? <Button onClick={join} className="mt-6">Find a partner</Button>
          : (
            <div className="mt-6">
              <Badge tone="accent">In queue · {position != null ? `${position} ahead` : "looking"}</Badge>
              <p className="text-text-3 text-sm mt-3">Hold tight. We&apos;ll page you the second a peer joins.</p>
              <Button variant="ghost" onClick={leave} className="mt-3">Leave queue</Button>
            </div>
          )}
      </Card>

      <Card className="mt-4 text-sm text-text-3">
        <p>Peer mocks are video calls between two students. The browser handles audio + video; we just match you and relay signaling.</p>
      </Card>
    </div>
  );
}
