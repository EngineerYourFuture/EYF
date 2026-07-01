"use client";
import { useMemo } from "react";
import { useApi } from "./use-api";
import { computeReadiness, type Readiness, type ReadinessInput } from "./readiness";

type Gam = { streak: number; longestStreak: number; totalSolved: number };
type Dna = { acceptanceRate: number; difficultyMix: { difficulty: string; count: number }[] };
type Mock = { feedback: { overallScore: number } | null };
type Resume = { atsScore: number | null };
type Proj = { status: string };
type McqHistory = { bestByCategory: Partial<Record<"APTITUDE" | "LOGICAL" | "VERBAL" | "TECHNICAL", number>> };
type CommHistory = { drills: { score: number }[] };

/** Fetches the cross-module signals and computes Placement Readiness. */
export function useReadiness(): { readiness: Readiness | null; loading: boolean } {
  const { data: gam }      = useApi<Gam>("/gamification/me");
  const { data: dna }      = useApi<Dna>("/code-dna/me");
  const { data: mocks }    = useApi<Mock[]>("/mocks/me");
  const { data: resumes }  = useApi<Resume[]>("/resume/me");
  const { data: projects } = useApi<Proj[]>("/projects/me/started");
  const { data: mcq }      = useApi<McqHistory>("/mcq/history");
  const { data: comm }     = useApi<CommHistory>("/communication/history");

  const loaded = !!(gam && dna && mocks && resumes && projects && mcq && comm);

  const readiness = useMemo(() => {
    if (!loaded) return null;
    const input: ReadinessInput = {
      totalSolved: gam!.totalSolved,
      acceptanceRate: dna!.acceptanceRate ?? 0,
      difficultyMix: dna!.difficultyMix ?? [],
      mocks: mocks!, resumes: resumes!, projects: projects!,
      streak: gam!.streak, longestStreak: gam!.longestStreak,
      mcqBest: mcq!.bestByCategory ?? {},
      commDrills: comm!.drills ?? [],
    };
    return computeReadiness(input);
  }, [loaded, gam, dna, mocks, resumes, projects, mcq, comm]);

  return { readiness, loading: !loaded };
}
