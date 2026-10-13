"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Badge, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { LoadError } from "@/components/lms/shared";

type Lab = { slug: string; title: string; summary: string; tests: number; language: string; completed: boolean };
export default function LabsPage() {
  const labs = useApi<Lab[]>("/labs"), execution = useApi<{ ready: boolean }>("/submissions/status", { refreshInterval: 15_000 });
  const action = useApiAction(), router = useRouter(), [opening, setOpening] = useState("");
  async function open(slug: string) { setOpening(slug); try { await action("/labs/prepare", { method: "POST" }); router.push(`/problems/${slug}?lang=SQL`); } catch { setOpening(""); } }
  return <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 lg:py-14"><h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Practical labs</h1><p className="mt-4 max-w-2xl text-text-2 leading-relaxed">Work with the problems behind everyday software: private data, reliable queries and accurate totals. Submit a solution and check it against published examples and hidden cases.</p>
    {(execution.data?.ready === false || execution.error) && <output  className="block my-6 border-y border-border py-4 text-sm text-text-2">Code execution is currently unavailable. You can open a lab and save your draft; automated results will be available when the judge is connected.</output>}
    <LoadError error={labs.error} retry={labs.mutate} />{labs.isLoading && <SkeletonRows rows={3} />}
    <section className="mt-10" aria-labelledby="sql-labs"><h2 id="sql-labs" className="text-xl font-semibold">SQL in a real schema</h2><p className="mt-2 text-sm text-text-2">SQLite · fresh isolated database for each test · exact result checks</p><ul className="mt-5 divide-y divide-border border-y border-border">{labs.data?.map((lab) => <li key={lab.slug} className="py-6 flex flex-col sm:flex-row gap-5 sm:items-center"><div className="flex-1 min-w-0"><h3 className="font-semibold text-lg">{lab.title}</h3><p className="mt-2 text-sm text-text-2 max-w-prose">{lab.summary}</p><p className="mt-3 text-sm text-text-3">{lab.tests} versioned tests{lab.completed && <Badge tone="easy" className="ml-3">Passed</Badge>}</p></div><Button variant={lab.completed ? "secondary" : "primary"} className="self-start sm:self-center" disabled={!!opening} onClick={() => void open(lab.slug)}>{labAction(opening === lab.slug, lab.completed)}</Button></li>)}</ul></section>
    <section className="mt-10 border-b border-border pb-7"><h2 className="text-xl font-semibold">Backend engineering sprint</h2><p className="mt-2 max-w-2xl text-sm text-text-2">Repair a ticket-list handler, pass 24 tests, explain your engineering decisions and request feedback from your college.</p><Link href="/sprint" className="mt-4 inline-flex min-h-11 items-center underline underline-offset-4 font-medium">Continue the placement sprint</Link></section>
  </div>;
}

function labAction(opening: boolean, completed: boolean) {
  if (opening) return "Opening…";
  return completed ? "Revisit lab" : "Open SQL lab";
}
