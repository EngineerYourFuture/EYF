"use client";
import Link from "next/link";
import { Card, Badge, Button, PageHeader, EmptyState, SkeletonRows } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Cert = { id: string; title: string; type: string; score: number | null; verificationCode: string; issuedAt: string };

export default function Page() {
  const { data } = useApi<Cert[]>("/certificates/me");
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <PageHeader eyebrow="Proof of work" title="Certificates" subtitle="Verifiable, shareable on LinkedIn. PDF on demand." />

      <div className="mt-8 space-y-3">
        {!data && <SkeletonRows rows={2} />}
        {data?.map((c) => (
          <Card key={c.id} interactive className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20">
                <Icons.award width={20} height={20} />
              </span>
              <div className="min-w-0">
                <div className="font-display text-lg truncate">{c.title}</div>
                <div className="text-text-3 text-xs mt-0.5 flex items-center gap-2 flex-wrap">
                  <Badge>{c.type}</Badge>
                  <span>Issued {new Date(c.issuedAt).toLocaleDateString()}</span>
                  <span className="font-mono">{c.verificationCode}</span>
                </div>
              </div>
            </div>
            <a href={`${apiBase}/certificates/${c.id}/pdf`} target="_blank" rel="noreferrer" className="shrink-0">
              <Button size="sm" variant="secondary">Download PDF</Button>
            </a>
          </Card>
        ))}
        {data?.length === 0 && (
          <EmptyState
            icon={<Icons.award width={28} height={28} />}
            title="No certificates yet"
            description="Finish a pattern track or ace an assessment to earn a verifiable certificate you can share on LinkedIn."
            action={<Link href="/assessment"><Button>Take the assessment</Button></Link>}
          />
        )}
      </div>
    </PageMotion>
  );
}
