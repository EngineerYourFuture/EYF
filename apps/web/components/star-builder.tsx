"use client";
import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";

type Story = { id: string; title: string; s: string; t: string; a: string; r: string };
const KEY = "eyf-star-stories";
const blank: Story = { id: "", title: "", s: "", t: "", a: "", r: "" };

const FIELDS: { k: "s" | "t" | "a" | "r"; label: string; hint: string }[] = [
  { k: "s", label: "Situation", hint: "Set the scene — where, when, your role." },
  { k: "t", label: "Task", hint: "What were you responsible for? The challenge or goal." },
  { k: "a", label: "Action", hint: "What did YOU do? Specific steps — say 'I', not 'we'." },
  { k: "r", label: "Result", hint: "The outcome, quantified. What did you learn?" },
];

/**
 * STAR-method builder — the Communication differentiator. Guides students to
 * write structured behavioural answers, stores a personal story bank locally, and
 * shows a live assembled answer they can rehearse. No backend needed.
 */
export function StarBuilder() {
  const [stories, setStories] = useState<Story[]>([]);
  const [draft, setDraft] = useState<Story>(blank);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { setStories(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
  }, []);
  const persist = (next: Story[]) => {
    setStories(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const filled = [draft.s, draft.t, draft.a, draft.r].filter((x) => x.trim()).length;

  function save() {
    if (!draft.title.trim()) return;
    const id = draft.id || `${Date.now()}`;
    persist(draft.id ? stories.map((x) => (x.id === id ? { ...draft, id } : x)) : [...stories, { ...draft, id }]);
    setDraft(blank); setOpen(false);
  }

  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Icons.doc width={18} height={18} className="text-brand" /> STAR story bank
          </h2>
          <p className="text-text-4 text-sm mt-1">Build structured behavioural answers once, rehearse them before every interview.</p>
        </div>
        {!open && (
          <button onClick={() => { setDraft(blank); setOpen(true); }}
            className="text-sm font-medium text-brand hover:underline shrink-0">+ New story</button>
        )}
      </div>

      {open && (
        <div className="mt-5 rounded-xl border border-border p-4 space-y-3">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Story title — e.g. 'Led the payments migration under deadline'"
            className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none" />
          {FIELDS.map((f) => (
            <div key={f.k}>
              <label className="text-xs font-mono uppercase tracking-wider text-text-3">{f.label}</label>
              <textarea rows={2} value={draft[f.k]} onChange={(e) => setDraft({ ...draft, [f.k]: e.target.value })}
                placeholder={f.hint}
                className="mt-1 w-full bg-bg border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none" />
            </div>
          ))}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={save} disabled={!draft.title.trim()}
              className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium disabled:opacity-40">Save story</button>
            <button onClick={() => { setDraft(blank); setOpen(false); }} className="text-text-3 text-sm hover:text-text-1">Cancel</button>
            <span className="ml-auto text-text-4 text-xs font-mono">{filled}/4 sections</span>
          </div>
        </div>
      )}

      {stories.length > 0 && (
        <div className="mt-5 space-y-3">
          {stories.map((st) => (
            <details key={st.id} className="rounded-xl border border-border bg-bg group">
              <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none">
                <span className="font-medium text-sm text-text-1 flex-1">{st.title}</span>
                <button onClick={(e) => { e.preventDefault(); setDraft(st); setOpen(true); }} className="text-text-4 text-xs hover:text-text-2">Edit</button>
                <button onClick={(e) => { e.preventDefault(); persist(stories.filter((x) => x.id !== st.id)); }} className="text-hard text-xs hover:underline">Delete</button>
                <Icons.arrow width={13} height={13} className="text-text-4 rotate-90 group-open:rotate-[270deg] transition-transform" />
              </summary>
              <div className="px-4 pb-4 space-y-2">
                {FIELDS.map((f) => st[f.k].trim() && (
                  <p key={f.k} className="text-sm leading-relaxed">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-brand mr-2">{f.label}</span>
                    <span className="text-text-2">{st[f.k]}</span>
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {stories.length === 0 && !open && (
        <p className="mt-5 text-text-4 text-sm">No stories yet. Most interviews ask 3–5 behavioural questions — build a bank of 5 and you&apos;re covered.</p>
      )}
    </div>
  );
}
