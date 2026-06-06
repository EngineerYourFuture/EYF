import { type ReactNode } from "react";
import { cn } from "./cn";

type Tone = "default" | "accent" | "easy" | "medium" | "hard" | "info";

const toneText: Record<Tone, string> = {
  default: "text-text-1",
  accent:  "text-accent",
  easy:    "text-easy",
  medium:  "text-medium",
  hard:    "text-hard",
  info:    "text-info",
};

/** Compact metric tile — the dense, icon-led stat used across dashboards. */
export function MetricTile({ label, value, unit, sub, icon, tone = "default" }: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-3 truncate">{label}</span>
        {icon && <span className={cn("shrink-0", tone === "default" ? "text-text-3" : toneText[tone])}>{icon}</span>}
      </div>
      <div className={cn("mt-2 font-display text-3xl font-bold leading-none truncate", toneText[tone])}>
        {value}{unit && <span className="text-text-3 text-lg font-semibold"> {unit}</span>}
      </div>
      {sub && <div className="text-text-4 text-xs mt-1.5 truncate">{sub}</div>}
    </div>
  );
}

/** Labelled horizontal meter — language / difficulty distributions. */
export function Meter({ label, value, pct, tone = "accent" }: {
  label: ReactNode;
  value?: ReactNode;
  pct: number; // 0..1
  tone?: "accent" | "easy" | "medium" | "hard";
}) {
  const fill = { accent: "bg-accent", easy: "bg-easy", medium: "bg-medium", hard: "bg-hard" }[tone];
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text-2">{label}</span>
        {value != null && <span className="font-mono text-text-3 text-xs">{value}</span>}
      </div>
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", fill)}
          style={{ width: `${Math.max(2, Math.min(100, pct * 100))}%` }} />
      </div>
    </div>
  );
}
