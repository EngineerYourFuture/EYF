"use client";
import { useState } from "react";
import { Card, Button } from "@eyf/ui";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { useApi, useApiAction } from "@/lib/use-api";

/**
 * Parent progress digest opt-in (Innovation Roadmap B3). Lets a student add a
 * parent/guardian email for a warm weekly recap, and previews exactly what will
 * be sent — so it feels like support, not surveillance.
 */
type Digest = {
  firstName: string;
  headline: string;
  metrics: { label: string; value: string }[];
  note: string;
};
type Data = { parentEmail: string | null; digest: Digest | null };

export function ParentDigestCard() {
  const { data, mutate } = useApi<Data>("/me/parent-digest");
  const action = useApiAction();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  if (!data) return null;

  async function save(next: string | null) {
    setBusy(true);
    try {
      await action("/me/parent-email", { method: "POST", body: JSON.stringify({ email: next }) });
      toast.success(next ? "Weekly updates on — your parent gets the first one this Sunday." : "Parent updates turned off.");
      setEmail("");
      await mutate();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-5">
      <div className="flex items-center gap-2">
        <span className="text-accent"><Icons.users width={18} height={18} /></span>
        <h2 className="font-display text-lg font-bold">Keep a parent in the loop</h2>
      </div>
      <p className="mt-1.5 text-sm text-text-3">
        A warm weekly recap of your progress, sent to a parent or guardian. No guarantees, no pressure — just so they can cheer you on.
      </p>

      {data.parentEmail ? (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm">
            <Icons.card width={15} height={15} className="text-text-4" />
            <span className="text-text-1 truncate">{data.parentEmail}</span>
            <span className="ml-auto text-easy text-xs">✓ on</span>
          </div>
          <Button onClick={() => save(null)} disabled={busy} className="shrink-0">Turn off</Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="parent@example.com"
            className="flex-1 h-11 rounded-lg border border-border bg-surface px-3.5 text-sm text-text-1 placeholder:text-text-4 focus:border-edge outline-none"
          />
          <Button onClick={() => save(email)} disabled={busy || !email.includes("@")} className="shrink-0">
            Send weekly updates
          </Button>
        </div>
      )}

      {data.digest && (
        <div className="mt-5 rounded-xl border border-border bg-surface-2/50 p-4">
          <div className="text-text-4 text-[11px] uppercase tracking-widest mb-2">Preview — what your parent sees</div>
          <div className="font-display text-sm font-bold text-text-1">{data.digest.headline}</div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.digest.metrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-surface px-3 py-2">
                <div className="text-text-1 text-sm font-semibold">{m.value}</div>
                <div className="text-text-4 text-[11px]">{m.label}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-text-3 leading-relaxed">{data.digest.note}</p>
        </div>
      )}
    </Card>
  );
}
