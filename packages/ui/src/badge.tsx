import { type HTMLAttributes } from "react";
import { cn } from "./cn";

type Tone = "default" | "easy" | "medium" | "hard" | "expert" | "accent" | "info";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

const tones: Record<Tone, string> = {
  default: "bg-surface-3 text-text-2 border-edge",
  easy:    "bg-easy/10 text-easy border-easy/40",
  medium:  "bg-medium/10 text-medium border-medium/40",
  hard:    "bg-hard/10 text-hard border-hard/40",
  expert:  "bg-expert/10 text-expert border-expert/40",
  accent:  "bg-accent-tint text-accent border-accent/40",
  info:    "bg-info/10 text-info border-info/40",
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 h-6 rounded-sm text-xs font-mono uppercase tracking-wider border",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
