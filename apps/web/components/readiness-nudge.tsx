import Link from "next/link";
import { Icons } from "@/components/icons";

/**
 * The integrated-loop payoff, made visible: after any scored activity we remind
 * the user it just moved their central Readiness + Skill Graph. This is the moat
 * — every action feeds one honest "am I placement-ready?" signal.
 */
export function ReadinessNudge({ label }: { label: string }) {
  return (
    <div className="mt-8 rounded-xl border border-accent/30 bg-accent-tint/40 p-4">
      <div className="flex items-center gap-2">
        <span className="text-accent"><Icons.activity width={18} height={18} /></span>
        <h3 className="font-display text-sm font-bold text-text-1">{label}</h3>
      </div>
      <div className="mt-3 grid sm:grid-cols-2 gap-2">
        <Link href="/readiness"
          className="group flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm hover:border-edge transition-colors">
          <Icons.target width={16} height={16} className="text-accent" />
          <span className="text-text-1 flex-1">Placement Readiness</span>
          <Icons.arrow width={14} height={14} className="text-text-4" />
        </Link>
        <Link href="/skills"
          className="group flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm hover:border-edge transition-colors">
          <Icons.activity width={16} height={16} className="text-accent" />
          <span className="text-text-1 flex-1">Skill Graph</span>
          <Icons.arrow width={14} height={14} className="text-text-4" />
        </Link>
      </div>
    </div>
  );
}
