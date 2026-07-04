"use client";
import Link from "next/link";
import { Card, Badge } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { WeaknessReview } from "@/components/weakness-review";
import { ConceptMap } from "@/components/concept-map";

type Subject = { id: "OS" | "DBMS" | "CN" | "OOP"; name: string; free: boolean };

export default function Page() {
  const { data } = useApi<Subject[]>("/subjects");
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl">
      <h1 className="font-display text-4xl font-bold tracking-tight">Core Subjects</h1>
      <p className="text-text-3 mt-2">Theory notes + spaced-repetition flashcards. The CS interview round.</p>

      <div className="mt-8"><WeaknessReview /></div>

      <ConceptMap />

      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.map((s) => (
          <Link key={s.id} href={`/subjects/${s.id.toLowerCase()}`}>
            <Card className="hover:border-accent transition-colors h-full">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">{s.name}</h2>
                {s.free
                  ? <Badge tone="easy">Free</Badge>
                  : <Badge tone="accent">Basic+</Badge>}
              </div>
              <p className="text-text-3 mt-2 text-sm">Notes · Flashcards · Daily review</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
