"use client";
import { useState } from "react";
import { Card, Button } from "@eyf/ui";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { useApi } from "@/lib/use-api";

/**
 * "Bring a friend, both get Pro" — the referral share surface. Shows the user's
 * code, a one-tap copy of their invite link, the reward, and how many friends
 * they've brought. Growth loop: EYF's college-batch audience refers densely.
 */
type Referral = {
  code: string;
  path: string;
  rewardDays: number;
  qualifyXp: number;
  stats: { invited: number; qualified: number; daysEarned: number };
};

export function ReferralCard() {
  const { data } = useApi<Referral>("/me/referral");
  const [copied, setCopied] = useState(false);
  if (!data) return null;

  const link = typeof window !== "undefined" ? `${window.location.origin}${data.path}` : data.path;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Invite link copied — share it with a friend.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy it.");
    }
  }

  return (
    <Card className="mt-5">
      <div className="flex items-center gap-2">
        <span className="text-accent"><Icons.gift width={18} height={18} /></span>
        <h2 className="font-display text-lg font-bold">Bring a friend, both get Pro</h2>
      </div>
      <p className="mt-1.5 text-sm text-text-3">
        When a friend joins with your link and gets going, you <span className="text-text-1 font-medium">both</span> get{" "}
        {data.rewardDays} days of Pro — free.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3.5 py-2.5">
          <span className="font-mono text-sm tracking-widest text-text-1">{data.code}</span>
          <span className="text-text-4 text-xs">your code</span>
        </div>
        <Button onClick={copy} className="shrink-0">
          {copied ? "Copied!" : "Copy invite link"}
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Invited" value={data.stats.invited} />
        <Stat label="Joined & active" value={data.stats.qualified} />
        <Stat label="Pro days earned" value={data.stats.daysEarned} />
      </div>
    </Card>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5 text-center">
      <div className="font-display text-2xl font-bold text-text-1">{value}</div>
      <div className="text-text-4 text-xs mt-0.5 leading-snug">{label}</div>
    </div>
  );
}
