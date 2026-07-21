"use client";
import Link from "next/link";
import { Card, Badge, Button } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useState } from "react";

type Note = { id: string; slug: string; title: string; premium: boolean; estMinutes: number };
type Flash = { id: string; topic: string; front: string; back: string; srs: null | { interval: number; dueAt: string } };

const SUBJECTS: Record<string, string> = { os: "OS", dbms: "DBMS", cn: "CN", oop: "OOP" };
const TITLES: Record<string, string> = { OS: "Operating Systems", DBMS: "Database Management", CN: "Computer Networks", OOP: "Object-Oriented Programming" };

export default function Page({ params }: Readonly<{ params: { subject: string } }>) {
  const subj = SUBJECTS[params.subject];
  const { data: notes } = useApi<Note[]>(subj ? `/subjects/${subj}/notes` : null);
  const { data: cards, mutate } = useApi<Flash[]>(subj ? `/subjects/${subj}/flashcards/due` : null);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      <h1 className="font-display text-4xl font-bold tracking-tight">{TITLES[subj ?? ""] ?? "Subject"}</h1>
      <p className="text-text-3 mt-2">Theory first. Flashcards keep it sticky.</p>

      <div className="mt-10 grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="font-display text-xl font-bold mb-4">Notes</h2>
          <div className="space-y-2">
            {notes?.map((n) => (
              <Link key={n.id} href={`/subjects/notes/${n.slug}`}>
                <Card className="hover:border-accent transition-colors flex items-center justify-between">
                  <div>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-text-3 text-xs mt-1">{n.estMinutes} min read</div>
                  </div>
                  {n.premium && <Badge tone="accent">Pro</Badge>}
                </Card>
              </Link>
            ))}
            {notes?.length === 0 && <p className="text-text-3 text-sm">No notes yet — they&apos;re being authored.</p>}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold mb-4">Due flashcards <span className="text-text-3 text-sm">({cards?.length ?? 0})</span></h2>
          {cards && cards.length > 0
            ? <FlashcardDeck cards={cards} onReviewed={() => mutate()} />
            : <Card><p className="text-text-3 text-sm">No cards due. Come back tomorrow.</p></Card>}
        </section>
      </div>
    </div>
  );
}

function FlashcardDeck({ cards, onReviewed }: Readonly<{ cards: Flash[]; onReviewed: () => void }>) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const action = useApiAction();
  const card = cards[idx];

  if (!card) return <Card><p className="text-text-3 text-sm">All caught up.</p></Card>;

  async function grade(q: 0 | 3 | 4 | 5) {
    if (!card) return;
    await action(`/subjects/flashcards/${card.id}/review`, {
      method: "POST",
      body: JSON.stringify({ quality: q }),
    });
    if (idx + 1 >= cards.length) onReviewed();
    setIdx((i) => i + 1);
    setRevealed(false);
  }

  return (
    <Card>
      <div className="text-text-3 text-xs uppercase tracking-wider">{card.topic} · {idx + 1}/{cards.length}</div>
      <p className="mt-3 font-display text-xl">{card.front}</p>
      {revealed
        ? <p className="mt-4 text-text-2 border-t border-border pt-4">{card.back}</p>
        : <Button className="mt-4" variant="secondary" size="sm" onClick={() => setRevealed(true)}>Reveal</Button>}
      {revealed && (
        <div className="mt-6 flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => grade(0)}>Again</Button>
          <Button size="sm" variant="ghost" onClick={() => grade(3)}>Hard</Button>
          <Button size="sm" variant="ghost" onClick={() => grade(4)}>Good</Button>
          <Button size="sm" onClick={() => grade(5)}>Easy</Button>
        </div>
      )}
    </Card>
  );
}
