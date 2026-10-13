"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Skeleton } from "@eyf/ui";
import { useApi } from "@/lib/use-api";

type Track = { slug: string; name: string; salaryMinInr: number; salaryMaxInr: number };
export default function Page() {
  const { data: tracks, error, mutate } = useApi<Track[]>("/tracks");
  const [trackSlug, setTrackSlug] = useState("");
  const [annual, setAnnual] = useState("600000");
  const track = tracks?.find((t) => t.slug === trackSlug);
  const amount = Number(annual);
  const valid = Number.isFinite(amount) && amount > 0 && amount <= 100_000_000;
  const trackPicker = !tracks ? <Skeleton className="mt-8 h-24" /> : <label className="mt-8 block"><span className="text-sm font-medium">Explore a role from the catalog</span><select className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm" value={trackSlug} onChange={(e) => setTrackSlug(e.target.value)}><option value="">Choose a role</option>{tracks.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select></label>;
  return <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Salary scenarios</h1>
    <p className="mt-3 leading-relaxed text-text-2">Explore compensation assumptions while you plan your next role. These illustrations do not predict an offer or what you are worth.</p>
    {error ? <div role="alert" className="mt-8"><p>Role information couldn&apos;t load.</p><Button className="mt-3" variant="secondary" onClick={() => void mutate()}>Retry</Button></div> : trackPicker}
    {track && <section className="mt-6 rounded-xl border border-border bg-surface p-6"><h2 className="text-xl font-semibold">{track.name}</h2><p className="mt-3 text-2xl font-semibold tabular-nums">₹{(track.salaryMinInr / 100000).toLocaleString("en-IN")}–{(track.salaryMaxInr / 100000).toLocaleString("en-IN")} lakh per year</p><p className="mt-3 text-sm leading-relaxed text-text-2">This is a planning range stored in EYF&apos;s role catalog. It has not been independently validated against current offers. Location, experience, employer and compensation structure can change actual figures.</p></section>}
    <section className="mt-9 border-t border-border pt-7"><h2 className="text-xl font-semibold">Try your own annual amount</h2><label className="mt-4 block"><span className="text-sm font-medium">Hypothetical annual compensation, in rupees</span><input type="number" min={1} max={100000000} inputMode="numeric" value={annual} onChange={(e) => setAnnual(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-3" /></label><p className="mt-4 text-lg font-medium" aria-live="polite">{valid ? `₹${Math.round(amount / 12).toLocaleString("en-IN")} per month if divided equally` : "Enter a positive annual amount to explore the scenario."}</p><p className="mt-2 text-sm leading-relaxed text-text-2">Simple division before tax and deductions. CTC may include variable pay, benefits and equity, so this is not monthly take-home pay. Your readiness score is not used to calculate compensation.</p></section>
    <Link href="/sprint" className="mt-8 inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4">Build evidence of your backend skills →</Link>
  </main>;
}
