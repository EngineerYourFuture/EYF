import { type ReactNode } from "react";
import { cn } from "./cn";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
};

/** Consistent page heading block across the app. */
export function PageHeader({ title, subtitle, actions, eyebrow, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 flex-wrap", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">{eyebrow}</div>
        )}
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-text-3 mt-2 max-w-xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

type StatTone = "default" | "accent" | "easy" | "hard" | "medium" | "info";

const toneText: Record<StatTone, string> = {
  default: "text-text-1",
  accent:  "text-accent",
  easy:    "text-easy",
  hard:    "text-hard",
  medium:  "text-medium",
  info:    "text-info",
};

const toneBar: Record<StatTone, string> = {
  default: "bg-border",
  accent:  "bg-accent",
  easy:    "bg-easy",
  hard:    "bg-hard",
  medium:  "bg-medium",
  info:    "bg-info",
};

/** A labelled stat tile with optional icon + trend. */
export function Stat({ label, value, sub, tone = "default", icon, trend }: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: StatTone;
  icon?: ReactNode;
  trend?: { dir: "up" | "down" | "flat"; label: string };
}) {
  const accenty = tone !== "default";
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border p-5 shadow-card transition-colors",
      accenty ? "bg-surface border-border" : "bg-surface border-border",
    )}>
      {accenty && (
        <div className={cn("absolute inset-x-0 top-0 h-0.5", toneBar[tone])} />
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[11px] text-text-3 uppercase tracking-wider">{label}</div>
        {icon && <div className={cn("opacity-80", toneText[tone])}>{icon}</div>}
      </div>
      <div className={cn("mt-2.5 font-display text-3xl sm:text-4xl font-bold leading-none", toneText[tone])}>{value}</div>
      <div className="mt-2 flex items-center gap-2">
        {trend && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            trend.dir === "up" ? "text-easy" : trend.dir === "down" ? "text-hard" : "text-text-3",
          )}>
            {trend.dir === "up" ? "↑" : trend.dir === "down" ? "↓" : "→"} {trend.label}
          </span>
        )}
        {sub && <div className="text-text-3 text-xs">{sub}</div>}
      </div>
    </div>
  );
}
