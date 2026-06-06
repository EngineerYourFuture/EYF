"use client";
import Link from "next/link";
import { Card, Badge, Button, SkeletonCards } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { track as ev, Events } from "@/lib/analytics";
import { toast } from "sonner";
import { PageMotion } from "@/components/page-motion";

type Track = {
  id: string; slug: string; name: string; tagline: string; icon: string;
  salaryMinInr: number; salaryMaxInr: number;
  demand: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  weeks: number; premium: boolean; companies: string[];
};

const demandTone = {
  LOW: "default", MEDIUM: "default", HIGH: "accent", VERY_HIGH: "easy",
} as const;

export default function Page() {
  const { data, isLoading } = useApi<Track[]>("/tracks");
  const { data: primary, mutate } = useApi<{ track: Track } | null>("/tracks/me/primary");
  const action = useApiAction();

  async function choose(slug: string) {
    await action(`/tracks/${slug}/choose`, { method: "POST" });
    ev(Events.TrackChosen, { slug });
    toast.success("Track selected — your roadmap will calibrate to it.");
    await mutate();
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl">
      <h1 className="font-display text-5xl font-bold tracking-tight">Choose your path.</h1>
      <p className="text-text-3 mt-3 max-w-2xl text-lg">
        Pick one. The assessment, roadmap, and problem weighting will all calibrate to your target role.
      </p>

      {primary?.track && (
        <Card className="mt-8 border-accent/40">
          <div className="text-text-3 text-xs uppercase tracking-wider">Your primary track</div>
          <div className="mt-1 font-display text-2xl font-bold">{primary.track.name}</div>
          <p className="text-text-2 mt-1">{primary.track.tagline}</p>
        </Card>
      )}

      {isLoading && <SkeletonCards count={9} className="mt-10" />}

      <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((t) => (
          <Card key={t.id} className="flex flex-col hover:border-accent transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold">{t.name}</h3>
              {t.premium && <Badge tone="accent">Pro</Badge>}
            </div>
            <p className="text-text-2 text-sm mt-2 flex-1">{t.tagline}</p>
            <div className="mt-4 space-y-1.5 text-sm">
              <Row label="Salary"   value={`₹${Math.round(t.salaryMinInr / 100_000)}–${Math.round(t.salaryMaxInr / 100_000)} LPA`} />
              <Row label="Demand"   value={<Badge tone={demandTone[t.demand]}>{t.demand.replace("_", " ")}</Badge>} />
              <Row label="Prep arc" value={`${t.weeks} weeks`} />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {t.companies.slice(0, 4).map((c) => (
                <span key={c} className="text-xs font-mono text-text-3 px-2 py-0.5 border border-border rounded">{c}</span>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <Link href={`/tracks/${t.slug}`} className="flex-1"><Button variant="secondary" className="w-full" size="sm">Details</Button></Link>
              <Button onClick={() => choose(t.slug)} size="sm">Choose</Button>
            </div>
          </Card>
        ))}
      </div>
    </PageMotion>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-3 text-xs uppercase tracking-wider">{label}</span>
      <span>{value}</span>
    </div>
  );
}
