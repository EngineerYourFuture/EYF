"use client";
import Link from "next/link";
import { Card, MetricTile, PageHeader, ErrorState, Skeleton } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { PageMotion } from "@/components/page-motion";
import { Icons, type IconName } from "@/components/icons";

type Overview = {
  users: number; problems: number; threads: number;
  lockedThreads: number; mentorsPending: number; oaReports: number;
};

export default function Page() {
  const { data, error, mutate } = useApi<Overview>("/admin/mod/overview");

  if (error) {
    return (
      <div className="px-6 lg:px-10 py-12 max-w-3xl mx-auto">
        <PageHeader eyebrow="Admin" title="Moderation" />
        <div className="mt-8"><ErrorState message={error.message} retry={() => mutate()} /></div>
      </div>
    );
  }

  return (
    <PageMotion className="px-6 lg:px-10 py-10 lg:py-12 max-w-5xl mx-auto">
      <PageHeader eyebrow="Admin" title="Moderation" subtitle="Keep the platform clean. Verify, lock, and prune." />

      {!data ? (
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricTile icon={<Icons.users width={16} height={16} />} label="Users" value={data.users} />
          <MetricTile icon={<Icons.code width={16} height={16} />} label="Problems" value={data.problems} />
          <MetricTile icon={<Icons.chat width={16} height={16} />} label="Threads" value={data.threads} sub={`${data.lockedThreads} locked`} />
          <MetricTile icon={<Icons.search width={16} height={16} />} tone={data.mentorsPending > 0 ? "accent" : "default"}
            label="Pending mentors" value={data.mentorsPending} sub={data.mentorsPending > 0 ? "Needs review" : "Clear"} />
          <MetricTile icon={<Icons.target width={16} height={16} />} label="OA reports" value={data.oaReports} />
        </div>
      )}

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <AdminCard href="/admin/mentors" icon="search" title="Mentor verification queue" body="Review pending applications and verify or reject."
          badge={data && data.mentorsPending > 0 ? data.mentorsPending : undefined} />
        <AdminCard href="/admin/forum" icon="chat" title="Forum moderation" body="Pin, lock, or delete threads. Remove abusive posts." />
        <AdminCard href="/admin/oa" icon="target" title="OA reports" body="Curate the community-submitted online-assessment patterns." />
        <AdminCard href="/admin/colleges" icon="building" title="College batch health" body="See which colleges have engaged batches — the TPO-partnership pitch list." />
      </div>
    </PageMotion>
  );
}

function AdminCard({ href, icon, title, body, badge }: Readonly<{ href: string; icon: IconName; title: string; body: string; badge?: number }>) {
  const Icon = Icons[icon];
  return (
    <Link href={href} className="block">
      <Card interactive className="h-full">
        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20">
            <Icon width={20} height={20} />
          </span>
          {badge != null && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent text-accent-ink text-xs font-bold px-1.5">{badge}</span>
          )}
        </div>
        <h2 className="font-display text-lg font-bold mt-3">{title}</h2>
        <p className="text-text-3 text-sm mt-1.5">{body}</p>
      </Card>
    </Link>
  );
}
