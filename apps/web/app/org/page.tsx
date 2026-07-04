"use client";
import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
const TOKEN_KEY = "eyf-org-token";

type Org = { id: string; name: string; slug: string; counts: { courses: number; internships: number } };
type Course = { id: string; title: string; description: string; audience: string; published: boolean; lessons: { id: string; title: string }[]; _count?: { enrollments: number } };
type Slot = { id: string; role: string; location: string | null; stipend: string | null; seats: number; eliteOnly: boolean };

export default function OrgPortal() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [org, setOrg] = useState<Org | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [codeInput, setCodeInput] = useState("");
  const [err, setErr] = useState("");
  // forms
  const [course, setCourse] = useState({ title: "", description: "", audience: "BOTH" });
  const [slot, setSlot] = useState({ role: "", location: "", stipend: "", seats: 1, eliteOnly: true });

  useEffect(() => { try { setToken(localStorage.getItem(TOKEN_KEY)); } catch { /* */ } setReady(true); }, []);

  const api = useCallback(async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`${API}/org${path}`, {
      ...opts,
      headers: { "content-type": "application/json", authorization: token ? `Bearer ${token}` : "", ...(opts.headers ?? {}) },
    });
    const j = await res.json();
    if (!j.success) throw new Error(j.error?.message ?? "Request failed");
    return j.data;
  }, [token]);

  const load = useCallback(async () => {
    try {
      const [o, c, s] = await Promise.all([api("/me"), api("/courses"), api("/internships")]);
      setOrg(o); setCourses(c); setSlots(s);
    } catch { logout(); }
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (token) load(); }, [token, load]);

  function logout() { try { localStorage.removeItem(TOKEN_KEY); } catch { /* */ } setToken(null); setOrg(null); }
  async function login(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    try {
      const res = await fetch(`${API}/org/verify`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: codeInput.trim() }) });
      const j = await res.json();
      if (!j.success || !j.data?.token) { setErr("That code doesn't match any organisation."); return; }
      try { localStorage.setItem(TOKEN_KEY, j.data.token); } catch { /* */ }
      setToken(j.data.token);
    } catch { setErr("Couldn't reach the server."); }
  }

  async function addCourse() {
    if (!course.title.trim()) return;
    await api("/courses", { method: "POST", body: JSON.stringify(course) });
    setCourse({ title: "", description: "", audience: "BOTH" }); load();
  }
  async function togglePublish(c: Course) { await api(`/courses/${c.id}`, { method: "PATCH", body: JSON.stringify({ published: !c.published }) }); load(); }
  async function delCourse(id: string) { await api(`/courses/${id}`, { method: "DELETE" }); load(); }
  async function addSlot() {
    if (!slot.role.trim()) return;
    await api("/internships", { method: "POST", body: JSON.stringify({ ...slot, seats: Number(slot.seats) }) });
    setSlot({ role: "", location: "", stipend: "", seats: 1, eliteOnly: true }); load();
  }
  async function delSlot(id: string) { await api(`/internships/${id}`, { method: "DELETE" }); load(); }

  if (!ready) return null;

  /* ── Login ── */
  if (!token) {
    return (
      <main className="min-h-screen bg-bg text-text-1 flex items-center justify-center px-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-card-lg">
          <div className="font-display text-2xl font-bold">EYF for Business</div>
          <div className="text-xs font-mono uppercase tracking-widest text-text-3 mt-1">Employer portal</div>
          <p className="text-text-3 text-sm mt-4">Enter your organisation access code to manage your LMS courses and post internship slots.</p>
          <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="ACME-2026"
            className="mt-4 w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm focus:border-accent outline-none" />
          {err && <p className="text-hard text-xs mt-2">{err}</p>}
          <button className="mt-4 w-full py-2.5 rounded-lg bg-brand text-white text-sm font-medium">Enter portal →</button>
        </form>
      </main>
    );
  }

  /* ── Dashboard ── */
  return (
    <main className="min-h-screen bg-bg text-text-1">
      <header className="border-b border-border glass sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div>
            <span className="font-display text-lg font-bold">{org?.name ?? "…"}</span>
            <span className="text-text-4 text-xs ml-3">EYF for Business</span>
          </div>
          <button onClick={logout} className="text-text-3 text-sm hover:text-text-1">Sign out</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Courses */}
        <section>
          <h2 className="font-display text-xl font-bold">Courses <span className="text-text-4 text-sm font-normal">· {courses.length}</span></h2>
          <p className="text-text-3 text-sm mt-1">Train your staff or screen EYF candidates. Audience: staff, candidates, or both.</p>
          <div className="mt-4 rounded-xl border border-border p-4 grid sm:grid-cols-[1fr_1fr_140px_auto] gap-3 items-end bg-surface">
            <Field label="Title"><input value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} placeholder="Backend Fundamentals" className="inp" /></Field>
            <Field label="Description"><input value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} placeholder="Short summary" className="inp" /></Field>
            <Field label="Audience"><select value={course.audience} onChange={(e) => setCourse({ ...course, audience: e.target.value })} className="inp"><option value="BOTH">Both</option><option value="STAFF">Staff</option><option value="CANDIDATE">Candidates</option></select></Field>
            <button onClick={addCourse} className="h-10 px-4 rounded-lg bg-brand text-white text-sm font-medium">Add</button>
          </div>
          <div className="mt-3 space-y-2">
            {courses.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{c.title} <span className="text-text-4 text-xs ml-1">{c.audience.toLowerCase()} · {c.lessons.length} lessons · {c._count?.enrollments ?? 0} enrolled</span></div>
                  {c.description && <div className="text-text-4 text-xs truncate">{c.description}</div>}
                </div>
                <button onClick={() => togglePublish(c)} className={`text-xs px-2 py-1 rounded border ${c.published ? "border-easy/40 text-easy" : "border-border text-text-3"}`}>{c.published ? "Published" : "Draft"}</button>
                <button onClick={() => delCourse(c.id)} className="text-hard text-xs hover:underline">Delete</button>
              </div>
            ))}
            {courses.length === 0 && <p className="text-text-4 text-sm">No courses yet.</p>}
          </div>
        </section>

        {/* Internship slots */}
        <section>
          <h2 className="font-display text-xl font-bold">Internship slots <span className="text-text-4 text-sm font-normal">· {slots.length}</span></h2>
          <p className="text-text-3 text-sm mt-1">Post internships — Elite EYF students get access. This is the value you trade for the LMS.</p>
          <div className="mt-4 rounded-xl border border-border p-4 grid sm:grid-cols-[1fr_1fr_1fr_90px_auto] gap-3 items-end bg-surface">
            <Field label="Role"><input value={slot.role} onChange={(e) => setSlot({ ...slot, role: e.target.value })} placeholder="Backend Intern" className="inp" /></Field>
            <Field label="Location"><input value={slot.location} onChange={(e) => setSlot({ ...slot, location: e.target.value })} placeholder="Bangalore / Remote" className="inp" /></Field>
            <Field label="Stipend"><input value={slot.stipend} onChange={(e) => setSlot({ ...slot, stipend: e.target.value })} placeholder="₹40k/mo" className="inp" /></Field>
            <Field label="Seats"><input type="number" min={1} value={slot.seats} onChange={(e) => setSlot({ ...slot, seats: Number(e.target.value) })} className="inp" /></Field>
            <button onClick={addSlot} className="h-10 px-4 rounded-lg bg-brand text-white text-sm font-medium">Post</button>
          </div>
          <div className="mt-3 space-y-2">
            {slots.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{s.role}</span>
                  <span className="text-text-4 text-xs ml-2">{[s.location, s.stipend, `${s.seats} seat${s.seats === 1 ? "" : "s"}`].filter(Boolean).join(" · ")}</span>
                </div>
                {s.eliteOnly && <span className="text-[10px] font-mono uppercase tracking-wider text-brand border border-brand/30 rounded px-1.5 py-0.5">Elite</span>}
                <button onClick={() => delSlot(s.id)} className="text-hard text-xs hover:underline">Remove</button>
              </div>
            ))}
            {slots.length === 0 && <p className="text-text-4 text-sm">No slots yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] font-mono uppercase tracking-wider text-text-4">{label}</span><div className="mt-1">{children}</div></label>;
}
