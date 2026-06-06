"use client";
import Link from "next/link";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi } from "@/lib/use-api";

type Today = {
  challenge: {
    date: string;
    problem: { id: string; slug: string; title: string; difficulty: string; patterns: string[] };
    alreadySolvedToday: boolean;
  } | null;
  streak: number;
  xpToday: number;
  problemsSolvedToday: number;
};

const tone = { EASY: "easy", MEDIUM: "medium", HARD: "hard", EXPERT: "expert" } as const;

export function DailyChallenge() {
  const { data } = useApi<Today>("/roadmap/today");
  if (!data?.challenge) return null;
  const c = data.challenge;
  return (
    <Card className="border-accent/40">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-3 text-xs uppercase tracking-wider">Daily challenge</span>
        {c.alreadySolvedToday && <Badge tone="easy">Done today ✓</Badge>}
      </div>
      <Link href={`/problems/${c.problem.slug}`} className="block">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-display text-xl font-bold">{c.problem.title}</span>
          <Badge tone={tone[c.problem.difficulty as keyof typeof tone]}>{c.problem.difficulty}</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {c.problem.patterns.map((p) => <Badge key={p}>{p}</Badge>)}
        </div>
        <Button size="sm">{c.alreadySolvedToday ? "Review" : "Solve now"}</Button>
      </Link>
    </Card>
  );
}
