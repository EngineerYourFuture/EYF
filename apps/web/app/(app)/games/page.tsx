"use client";
import Link from "next/link";
import { PageHeader } from "@eyf/ui";
import { PageMotion } from "@/components/page-motion";
import { CognitiveRank } from "@/components/cognitive-rank";
import { Icons, type IconName } from "@/components/icons";

const GAMES: { slug: string; name: string; blurb: string; icon: IconName; tag: string }[] = [
  { slug: "reaction",       name: "Reaction Time",   blurb: "Click when the square turns green. Five rounds.",                   icon: "bolt",    tag: "Speed" },
  { slug: "n-back",         name: "N-Back",          blurb: "Press SPACE when the current letter matches the one N steps ago.", icon: "brain",   tag: "Memory" },
  { slug: "pattern-recall", name: "Pattern Recall",  blurb: "Memorize a 5×5 grid pattern. Recreate it. Six escalating rounds.", icon: "cube",    tag: "Memory" },
  { slug: "spatial",        name: "Mental Rotation", blurb: "Is the right shape the left one rotated? Or mirrored? 10 trials.", icon: "compass", tag: "Spatial" },
  { slug: "stroop",         name: "Stroop",          blurb: "Tap the INK color. Ignore what the word says. 20 trials.",         icon: "sparkle", tag: "Attention" },
];

export default function Page() {
  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Train the interview muscle"
        title="Cognitive Games"
        subtitle="Pattern recognition, working memory, reaction, spatial reasoning, and attention — the raw aptitudes companies actually screen for."
      />

      <div className="mt-8"><CognitiveRank /></div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {GAMES.map((g) => {
          const Icon = Icons[g.icon];
          return (
            <Link key={g.slug} href={`/games/${g.slug}`}
              className="group rounded-xl border border-border bg-surface p-5 shadow-card card-interactive flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20 group-hover:bg-accent group-hover:text-accent-ink transition-colors">
                <Icon width={24} height={24} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold">{g.name}</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-4 border border-border rounded px-1.5 py-0.5">{g.tag}</span>
                </div>
                <p className="text-text-3 text-sm mt-1 leading-relaxed">{g.blurb}</p>
                <span className="inline-flex items-center gap-1 text-sm text-accent mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Play <Icons.arrow width={14} height={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </PageMotion>
  );
}
