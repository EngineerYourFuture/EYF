"use client";
import Link from "next/link";
import { Card } from "@eyf/ui";
import { useApi } from "@/lib/use-api";

type Overview = {
  users: number; problems: number; threads: number;
  lockedThreads: number; mentorsPending: number; oaReports: number;
};

export default function Page() {
  const { data, error } = useApi<Overview>("/admin/mod/overview");

  if (error) {
    return (
      <div className="px-10 py-12 max-w-3xl">
        <h1 className="font-display text-3xl font-bold">Admin</h1>
        <p className="text-hard mt-4">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="px-10 py-12 max-w-5xl">
      <h1 className="font-display text-4xl font-bold tracking-tight">Admin · Moderation</h1>
      <p className="text-text-3 mt-2">Keep the platform clean. Verify, lock, and prune.</p>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        <Tile label="Users"          value={data?.users} />
        <Tile label="Problems"       value={data?.problems} />
        <Tile label="Forum threads"  value={data?.threads} note={data ? `${data.lockedThreads} locked` : undefined} />
        <Tile label="Pending mentors" value={data?.mentorsPending} highlight={(data?.mentorsPending ?? 0) > 0} />
        <Tile label="OA reports"     value={data?.oaReports} />
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        <Link href="/admin/mentors"><AdminCard title="Mentor verification queue" body="Review pending applications and verify or reject." /></Link>
        <Link href="/admin/forum"><AdminCard title="Forum moderation" body="Pin, lock, or delete threads. Remove abusive posts." /></Link>
        <Link href="/admin/oa"><AdminCard title="OA Reports" body="Curate the community-submitted online-assessment patterns." /></Link>
      </div>
    </div>
  );
}

function Tile({ label, value, note, highlight }: { label: string; value?: number; note?: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-accent" : undefined}>
      <div className="text-xs text-text-3 uppercase tracking-wider">{label}</div>
      <div className="mt-2 font-display text-4xl font-bold">{value ?? "—"}</div>
      {note && <div className="text-text-3 text-xs mt-1">{note}</div>}
    </Card>
  );
}

function AdminCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="hover:border-accent transition-colors">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="text-text-3 text-sm mt-2">{body}</p>
    </Card>
  );
}
