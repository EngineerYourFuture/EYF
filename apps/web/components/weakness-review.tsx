"use client";
import Link from "next/link";
import { useApi } from "@/lib/use-api";

type Review = {
  overall: number;
  counts: { due: number; new: number; reviewed: number };
  weakTopics: { subject: string; topic: string; mastery: number; reviewed: number; due: number }[];
};

/**
 * Weakness-targeted review — the Core Subjects differentiator. Standard SRS
 * (Anki, everyone) schedules by due date only. EYF surfaces your WEAKEST topics
 * across all subjects first, so limited review time goes where it moves the
 * needle. No competitor shows topic-level weakness.
 */
export function WeaknessReview() {
  const { data } = useApi<Review>("/subjects/review");
  if (!data) return null;
  const { counts, weakTopics } = data;
  const reviewHref = `/subjects/${(weakTopics[0]?.subject ?? "OS").toLowerCase()}`;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-text-3">Weakness-targeted review</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums">{data.overall}%</span>
            <span className="text-text-3 text-sm">recall across your reviewed topics</span>
          </div>
        </div>
        {counts.due > 0 && (
          <Link
            href={reviewHref}
            className="group flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/[0.06] px-4 py-3 hover:bg-brand/[0.1] transition-colors"
          >
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-brand">Due now</div>
              <div className="font-medium text-text-1 mt-0.5">Review {counts.due} weak-first card{counts.due === 1 ? "" : "s"}</div>
            </div>
            <span className="text-brand shrink-0 transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        )}
      </div>

      {weakTopics.length > 0 ? (
        <>
          <div className="mt-5 text-sm text-text-3">Your weakest topics — EYF resurfaces these first:</div>
          <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {weakTopics.map((t) => (
              <Link href={`/subjects/${t.subject.toLowerCase()}`} key={`${t.subject}:${t.topic}`} className="group block">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-2 truncate group-hover:text-text-1">
                    <span className="text-text-4 font-mono text-xs mr-1.5">{t.subject}</span>{t.topic}
                  </span>
                  <span className="text-text-4 font-mono text-xs shrink-0 ml-2 tabular-nums">{t.mastery}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${t.mastery >= 70 ? "bg-easy" : t.mastery >= 40 ? "bg-medium" : "bg-brand"}`}
                    style={{ width: `${Math.max(3, t.mastery)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-4 text-text-3 text-sm">
          Review a few flashcards and EYF will pinpoint your weak topics — then resurface them at exactly the right time.
        </p>
      )}
    </div>
  );
}
