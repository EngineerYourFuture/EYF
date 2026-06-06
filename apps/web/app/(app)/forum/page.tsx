"use client";
import Link from "next/link";
import { Card, Badge, Button, SkeletonRows, EmptyState } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { track, Events } from "@/lib/analytics";
import { useState } from "react";
import { PageMotion } from "@/components/page-motion";

type Thread = {
  id: string; slug: string; title: string; body: string;
  category: string; pinned: boolean; locked: boolean;
  viewCount: number; postCount: number; lastPostAt: string;
  author: { name: string };
  _count: { reactions: number };
};

const CATS = ["GENERAL","PLACEMENTS","DSA","CORE_SUBJECTS","PROJECTS","RESUME","INTERVIEWS","OFF_TOPIC"];

export default function Page() {
  const [cat, setCat] = useState("");
  const { data, isLoading, mutate } = useApi<Thread[]>(`/forum/threads${cat ? `?category=${cat}` : ""}`);
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
    <PageMotion className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Community</h1>
          <p className="text-text-3 mt-2">Ask. Answer. No fluff.</p>
        </div>
        <Button onClick={() => setOpen((o) => !o)}>{open ? "Close" : "New thread"}</Button>
      </div>

      {open && (
        <Card className="mt-6 space-y-3">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-bg border border-border rounded-md px-3 py-2"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="bg-bg border border-border rounded-md px-3 py-2 text-sm"
          >
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <textarea
            rows={5} placeholder="What's on your mind? Markdown OK."
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full bg-bg border border-border rounded-md px-3 py-2 font-mono text-sm"
          />
          <Button onClick={create}>Post</Button>
        </Card>
      )}

      <div className="mt-6 flex gap-2 flex-wrap text-sm">
        <button onClick={() => setCat("")} className={`px-3 py-1 rounded-md border ${cat === "" ? "border-accent text-text-1" : "border-border text-text-3"}`}>All</button>
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1 rounded-md border ${cat === c ? "border-accent text-text-1" : "border-border text-text-3"}`}>{c}</button>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {data?.map((t) => (
          <Link key={t.id} href={`/forum/${t.slug}`}>
            <Card className="flex items-center justify-between hover:border-accent transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  {t.pinned && <Badge tone="accent">📌</Badge>}
                  <Badge>{t.category}</Badge>
                  <span className="font-display text-base">{t.title}</span>
                </div>
                <div className="text-text-3 text-xs mt-1">
                  by {t.author.name} · {t.postCount} posts · {t.viewCount} views · last activity {new Date(t.lastPostAt).toLocaleString()}
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {isLoading && <SkeletonRows rows={5} />}
        {data && data.length === 0 && (
          <EmptyState icon="💬" title="No threads here yet"
            description={cat ? "Nothing in this category. Be the first to post." : "Start the conversation — ask a doubt, share a win, debrief an interview."}
            action={<Button onClick={() => setOpen(true)}>Start a thread</Button>} />
        )}
      </div>
    </PageMotion>
  );
}
