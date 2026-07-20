"use client";
import Link from "next/link";
import { Card, Badge, Button, SkeletonRows, EmptyState, PageHeader } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { track, Events } from "@/lib/analytics";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";

type Thread = {
  id: string; slug: string; title: string; body: string;
  category: string; pinned: boolean; locked: boolean;
  viewCount: number; postCount: number; lastPostAt: string;
  author: { name: string };
  _count: { reactions: number };
};

const CATS = ["GENERAL","PLACEMENTS","DSA","CORE_SUBJECTS","PROJECTS","RESUME","INTERVIEWS","OFF_TOPIC"];
const catLabel = (c: string) => {
  if (c === "DSA") return "DSA";
  const s = c.replaceAll("_", " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const relTime = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

export default function Page() {
  const [cat, setCat] = useState("");
  const { data, isLoading, mutate } = useApi<Thread[]>(`/forum/threads${cat ? "?category=" + cat : ""}`);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "GENERAL" });
  const action = useApiAction();

  async function create() {
    await action("/forum/threads", { method: "POST", body: JSON.stringify(form) });
    track(Events.ForumPosted, { category: form.category });
    setOpen(false); setForm({ title: "", body: "", category: "GENERAL" });
    await mutate();
  }

  return (
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <PageHeader eyebrow="Learn in public" title="Community" subtitle="Ask a doubt, share a win, debrief an interview. No fluff." />
        <Button onClick={() => setOpen((o) => !o)}>{open ? "Close" : "New thread"}</Button>
      </div>

      {open && (
        <Card className="mt-6 space-y-3">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-bg border border-border rounded-md px-3 py-2.5 focus:border-accent/50 outline-none"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="bg-bg border border-border rounded-md px-3 py-2.5 text-sm focus:border-accent/50 outline-none"
          >
            {CATS.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
          </select>
          <textarea
            rows={5} placeholder="What's on your mind? Markdown OK."
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full bg-bg border border-border rounded-md px-3 py-2.5 font-mono text-sm focus:border-accent/50 outline-none"
          />
          <Button glow onClick={create}>Post</Button>
        </Card>
      )}

      <div className="mt-8 flex gap-1.5 flex-wrap text-sm">
        <Chip active={cat === ""} onClick={() => setCat("")}>All</Chip>
        {CATS.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{catLabel(c)}</Chip>)}
      </div>

      <div className="mt-6 space-y-2">
        {isLoading && <SkeletonRows rows={5} />}
        {data?.map((t) => (
          <Link key={t.id} href={`/forum/${t.slug}`}>
            <Card className="flex items-center gap-4 hover:border-edge transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-surface-2 font-display text-sm font-bold text-accent">
                {t.author.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {t.pinned && <Badge tone="accent">📌 Pinned</Badge>}
                  <Badge>{catLabel(t.category)}</Badge>
                  <span className="font-display text-base font-semibold truncate">{t.title}</span>
                </div>
                <div className="text-text-4 text-xs mt-1">
                  {t.author.name} · {relTime(t.lastPostAt)}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 shrink-0 text-text-4 text-xs">
                <span className="inline-flex items-center gap-1"><Icons.chat width={13} height={13} /> {t.postCount}</span>
                <span className="inline-flex items-center gap-1"><Icons.activity width={13} height={13} /> {t.viewCount}</span>
              </div>
            </Card>
          </Link>
        ))}
        {data?.length === 0 && (
          <EmptyState icon={<Icons.chat width={22} height={22} />} title="No threads here yet"
            description={cat ? "Nothing in this category. Be the first to post." : "Start the conversation — ask a doubt, share a win, debrief an interview."}
            action={<Button onClick={() => setOpen(true)}>Start a thread</Button>} />
        )}
      </div>
    </PageMotion>
  );
}

function Chip({ active, onClick, children }: Readonly<{ active: boolean; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border transition-colors ${
        active ? "border-accent bg-accent-tint text-accent" : "border-border text-text-3 hover:border-edge"
      }`}>{children}</button>
  );
}
