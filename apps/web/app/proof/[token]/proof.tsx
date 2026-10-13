"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Button, Skeleton } from "@eyf/ui";
import type { SprintReport } from "@eyf/types";
import { fetchApi, ApiClientError } from "@/lib/api";
import { EvidenceReport } from "@/components/placement-sprint";
export function PublicProof() {
  const { token } = useParams<{ token: string }>();
  const { data, error, mutate } = useSWR(`/placement-sprint/proof/${token}`, (path) => fetchApi<{ report: SprintReport; issuedAt: string; expiresAt: string }>(path), { shouldRetryOnError: false });
  const reportContent = data ? <><EvidenceReport report={data.report} /><p className="border-t border-border pt-5 text-sm text-text-3">Shared {new Date(data.issuedAt).toLocaleDateString()}. This link expires {new Date(data.expiresAt).toLocaleDateString()}.</p><Button variant="secondary" className="mt-5 print:hidden" onClick={() => window.print()}>Print or save as PDF</Button></> : <Skeleton className="h-96 w-full" />;
  return <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12"><Link href="/" className="font-display text-xl font-bold text-text-1">EYF</Link><h1 className="mt-8 text-3xl font-semibold tracking-tight">Practice evidence</h1><p className="mt-3 text-sm leading-relaxed text-text-2">A learner-shared snapshot of a completed EYF backend sprint.</p><div className="mt-8">{error ? <section role="alert"><h2 className="text-xl font-semibold">Report unavailable</h2><p className="mt-3 text-text-2">{error instanceof ApiClientError && error.status === 404 ? error.message : "We couldn't load this report. Check your connection and try again."}</p><Button className="mt-4" variant="secondary" onClick={() => void mutate()}>Try again</Button></section> : reportContent}</div></main>;
}
