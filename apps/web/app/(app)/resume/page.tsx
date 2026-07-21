"use client";
import Link from "next/link";
import { Card, Button, Badge, EmptyState, PageHeader, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Resume = { id: string; title: string; template: string; atsScore: number | null; isDefault: boolean; updatedAt: string };

export default function Page() {
  const { data, mutate } = useApi<Resume[]>("/resume/me");
  const action = useApiAction();

  async function create() {
    const blank = {
      title: "My Resume",
      template: "classic",
      json: {
        contact: { name: "", email: "" },
        summary: "",
        skills: [],
        experience: [],
        projects: [],
        education: [],
      },
    };
    const r = await action<Resume>("/resume", { method: "POST", body: JSON.stringify(blank) });
    await mutate();
    window.location.href = `/resume/${r.id}`;
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Career"
        title="Resumes"
        subtitle="Build once. Score continuously. Tailor per JD."
        actions={<Button onClick={create}>New resume</Button>}
      />

      <div className="mt-8 space-y-3">
        {!data && <SkeletonRows rows={3} />}
        {data?.map((r) => (
          <Link key={r.id} href={`/resume/${r.id}`} className="block">
            <Card interactive className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20">
                  <Icons.doc width={20} height={20} />
                </span>
                <div className="min-w-0">
                  <div className="font-display text-lg truncate">{r.title}</div>
                  <div className="text-text-3 text-xs mt-0.5">{r.template} · updated {new Date(r.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {r.isDefault && <Badge tone="accent">Default</Badge>}
                <AtsPill score={r.atsScore} />
              </div>
            </Card>
          </Link>
        ))}
        {data?.length === 0 && (
          <EmptyState
            icon={<Icons.doc width={28} height={28} />}
            title="No resumes yet"
            description="Start from a clean ATS-friendly template, then score it against any job description."
            action={<Button onClick={create}>Create your first resume</Button>}
          />
        )}
      </div>
    </PageMotion>
  );
}

function AtsPill({ score }: Readonly<{ score: number | null }>) {
  if (score == null) return <span className="text-text-3 text-xs">unscored</span>;
  let tone;
  if (score >= 80) tone = "easy";
  else if (score >= 60) tone = "medium";
  else tone = "hard";
  return <Badge tone={tone as "easy" | "medium" | "hard"}>{score}/100 ATS</Badge>;
}
