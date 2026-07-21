"use client";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useState } from "react";

type Post = { id: string; body: string; createdAt: string; author: { name: string }; _count: { reactions: number } };
type Thread = {
  id: string; slug: string; title: string; body: string; category: string;
  pinned: boolean; locked: boolean; viewCount: number;
  author: { name: string };
  posts: Post[];
  _count: { reactions: number };
};

export default function Page({ params }: Readonly<{ params: { slug: string } }>) {
  const { data, mutate } = useApi<Thread>(`/forum/threads/${params.slug}`);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const action = useApiAction();

  async function post() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await action(`/forum/threads/${params.slug}/posts`, { method: "POST", body: JSON.stringify({ body: reply }) });
      setReply("");
      await mutate();
    } finally { setSending(false); }
  }

  async function react(kind: "LIKE" | "HELPFUL" | "FIRE", postId?: string) {
    await action("/forum/react", { method: "POST", body: JSON.stringify({ kind, threadId: postId ? undefined : data?.id, postId }) });
    await mutate();
  }

  if (!data) return <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 text-text-3">Loading…</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-3xl">
      <div className="flex items-center gap-2">
        <Badge>{data.category}</Badge>
        {data.pinned && <Badge tone="accent">📌</Badge>}
        {data.locked && <Badge tone="hard">🔒</Badge>}
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight mt-3">{data.title}</h1>
      <div className="text-text-3 text-xs mt-1">by {data.author.name} · {data.viewCount} views</div>

      <Card className="mt-6 whitespace-pre-wrap text-text-2 leading-relaxed">{data.body}</Card>

      <div className="mt-3 flex gap-2 text-xs">
        <button onClick={() => react("LIKE")}    className="px-2 py-1 border border-border rounded hover:border-accent">👍 Like</button>
        <button onClick={() => react("HELPFUL")} className="px-2 py-1 border border-border rounded hover:border-accent">✓ Helpful</button>
        <button onClick={() => react("FIRE")}    className="px-2 py-1 border border-border rounded hover:border-accent">🔥 Fire</button>
        <span className="text-text-3 self-center ml-2">{data._count.reactions} reactions</span>
      </div>

      <h2 className="font-display text-xl font-bold mt-12 mb-4">Replies</h2>
      <div className="space-y-3">
        {data.posts.map((p) => (
          <Card key={p.id}>
            <div className="text-text-3 text-xs mb-2">{p.author.name} · {new Date(p.createdAt).toLocaleString()}</div>
            <div className="whitespace-pre-wrap text-text-1">{p.body}</div>
            <div className="mt-3 flex gap-2 text-xs">
              <button onClick={() => react("LIKE", p.id)}    className="px-2 py-1 border border-border rounded hover:border-accent">👍</button>
              <button onClick={() => react("HELPFUL", p.id)} className="px-2 py-1 border border-border rounded hover:border-accent">✓</button>
              <button onClick={() => react("FIRE", p.id)}    className="px-2 py-1 border border-border rounded hover:border-accent">🔥</button>
              <span className="text-text-3 self-center ml-2">{p._count.reactions}</span>
            </div>
          </Card>
        ))}
        {data.posts.length === 0 && <p className="text-text-3 text-sm">Be the first to reply.</p>}
      </div>

      {!data.locked && (
        <Card className="mt-6">
          <textarea
            rows={4}
            placeholder="Add a reply…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="w-full bg-bg border border-border rounded-md px-3 py-2 font-mono text-sm"
          />
          <Button onClick={post} disabled={sending} className="mt-3">{sending ? "Posting…" : "Reply"}</Button>
        </Card>
      )}
    </div>
  );
}
