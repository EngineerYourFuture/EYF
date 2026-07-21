"use client";
import Link from "next/link";
import { Card, Badge, Button, PageHeader, SkeletonCards, EmptyState } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Mentor = {
  id: string; name: string; avatar: string | null;
  company: string; jobTitle: string; yearsExp: number;
  expertise: string[]; hourlyRateInr: number;
  ratingAvg: number; ratingCount: number; verified: boolean;
};

export default function Page() {
  const { data, isLoading } = useApi<Mentor[]>("/mentors");
  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <PageHeader title="Mentors" subtitle="Real engineers from real companies. Verified offer letters. Honest hours." />

      {isLoading && <SkeletonCards count={4} className="mt-10 md:grid-cols-2" />}

      {data?.length === 0 && (
        <EmptyState className="mt-10" icon={<Icons.users width={22} height={22} />} title="No mentors listed yet"
          description="Verified engineers are being onboarded. Are you one? Apply and get listed within 5 business days."
          action={<Link href="/mentors/apply"><Button>Apply to mentor</Button></Link>} />
      )}

      <div className="mt-10 grid md:grid-cols-2 gap-4">
        {data?.map((m) => (
          <Link key={m.id} href={`/mentors/${m.id}`}>
            <Card className="hover:border-accent transition-colors h-full">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface border border-border" />
                <div>
                  <div className="font-display text-lg font-bold flex items-center gap-2">
                    {m.name} {m.verified && <Badge tone="easy">Verified</Badge>}
                  </div>
                  <div className="text-text-3 text-xs">{m.jobTitle} at {m.company} · {m.yearsExp}y</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.expertise.slice(0, 4).map((e) => (
                  <span key={e} className="text-xs font-mono text-text-3 px-2 py-0.5 border border-border rounded">{e}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-text-2">★ {m.ratingAvg.toFixed(1)} <span className="text-text-3 text-xs">({m.ratingCount})</span></span>
                <span className="font-mono text-accent">₹{m.hourlyRateInr}/hr</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Become a mentor</h3>
            <p className="text-text-3 text-sm mt-1">Pro+ engineers can apply. Verified within 5 business days.</p>
          </div>
          <Link href="/mentors/apply"><Button variant="secondary">Apply</Button></Link>
        </div>
      </Card>
    </PageMotion>
  );
}
