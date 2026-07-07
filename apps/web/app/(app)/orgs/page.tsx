"use client";
/**
 * Org console seed (Enterprise Phase 1) — the first visible surface of the
 * membership platform: switcher, people, and the course lifecycle end-to-end
 * (draft → submit → publish → learn). Buttons are gated client-side by the
 * SAME shared capability map the API enforces (canInOrg from @eyf/types);
 * the API remains the authority. Grows into the full /org console per PRD §10.
 */
import Link from "next/link";
import { useState } from "react";
import { Card, Badge, Button, PageHeader, EmptyState, SkeletonRows } from "@eyf/ui";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { useApi, useApiAction } from "@/lib/use-api";
import { canInOrg } from "@eyf/types";

type Membership = { roles: string[]; org: { id: string; name: string; slug: string; plan: string } };
type Member = { id: string; roles: string[]; title: string | null; status: string; user: { name: string; email: string } };
type CourseRow = { id: string; title: string; status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED"; version: number; _count: { lessons: number; enrollments: number } };
type WorkCourse = { id: string; title: string; description: string; lessonCount: number; completedCount: number };

const statusTone = { DRAFT: "default", IN_REVIEW: "medium", PUBLISHED: "easy", ARCHIVED: "hard" } as const;

export default function Page() {
  const { data: memberships, mutate: refreshOrgs } = useApi<Membership[]>("/orgs/mine");
  const action = useApiAction();
  const [selected, setSelected] = useState<string | null>(null);
  const [newOrg, setNewOrg] = useState("");
  const [busy, setBusy] = useState(false);

  const active = memberships?.find((m) => m.org.id === selected) ?? memberships?.[0] ?? null;
  const roles = active?.roles ?? [];
  const orgId = active?.org.id ?? null;

  async function createOrg() {
    if (newOrg.trim().length < 2) return;
    setBusy(true);
    try {
      const org = await action<{ id: string }>("/orgs", { method: "POST", body: JSON.stringify({ name: newOrg.trim() }) });
      setNewOrg("");
      await refreshOrgs();
      setSelected(org.id);
    } catch { /* toasted */ } finally { setBusy(false); }
  }

  return (
    <PageMotion>
      <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
        <PageHeader
          eyebrow="Enterprise"
          title="Organizations"
          subtitle="Your companies and colleges on EYF — onboard, train, and grow your people from one console."
        />

        <TalentConsentCard />


        <div className="mt-8 grid lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Switcher */}
          <div className="space-y-2 min-w-0">
            {!memberships && <SkeletonRows rows={3} />}
            {memberships?.map((m) => (
              <button key={m.org.id} onClick={() => setSelected(m.org.id)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${active?.org.id === m.org.id ? "border-accent/50 bg-surface" : "border-border bg-surface-2/40 hover:border-edge"}`}>
                <div className="font-medium truncate">{m.org.name}</div>
                <div className="text-text-4 text-xs mt-0.5">{m.roles.join(" · ")} · {m.org.plan}</div>
              </button>
            ))}
            <div className="rounded-xl border border-dashed border-border p-3">
              <input
                className="w-full h-10 px-3 rounded-lg bg-surface border border-border text-sm text-text-1 focus:outline-none focus:border-accent"
                placeholder="New organization name"
                value={newOrg} onChange={(e) => setNewOrg(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void createOrg(); }}
              />
              <Button size="sm" className="w-full mt-2" onClick={createOrg} disabled={busy || newOrg.trim().length < 2}>
                {busy ? "Creating…" : "Create org"}
              </Button>
            </div>
          </div>

          {/* Console */}
          {!active ? (
            <EmptyState
              icon={<Icons.building width={28} height={28} />}
              title="No organizations yet"
              description="Create one to start onboarding and training your team — or ask your admin for an invite."
            />
          ) : (
            <OrgConsole key={orgId} orgId={orgId!} roles={roles} />
          )}
        </div>
      </div>
    </PageMotion>
  );
}

function TalentConsentCard() {
  const action = useApiAction();
  const { data, mutate } = useApi<{ inPool: boolean; scope: string | null }>("/talent/consent");
  const [busy, setBusy] = useState(false);
  async function set(op: "POOL_FULL" | "POOL_ANON" | "revoke") {
    setBusy(true);
    try {
      if (op === "revoke") await action("/talent/consent/revoke", { method: "POST" });
      else await action("/talent/consent", { method: "POST", body: JSON.stringify({ scope: op }) });
      await mutate();
    } catch { /* toasted */ } finally { setBusy(false); }
  }
  if (!data) return null;
  return (
    <div className="mt-6 rounded-xl border border-border bg-surface-2/40 px-5 py-4 flex items-center gap-4 flex-wrap">
      <div className="min-w-0 flex-1">
        <div className="font-medium">Talent pool {data.inPool && <Badge tone="easy" className="ml-1">in · {data.scope === "POOL_FULL" ? "visible" : "anonymous"}</Badge>}</div>
        <div className="text-text-3 text-sm">Let companies hiring on EYF discover you by your evidence — readiness, skills, certificates. Revoke any time.</div>
      </div>
      <div className="flex gap-2 shrink-0">
        {!data.inPool ? (
          <>
            <Button size="sm" variant="secondary" onClick={() => set("POOL_ANON")} disabled={busy}>Join (anonymous)</Button>
            <Button size="sm" onClick={() => set("POOL_FULL")} disabled={busy}>Join (visible)</Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => set("revoke")} disabled={busy}>Leave pool</Button>
        )}
      </div>
    </div>
  );
}

function OrgConsole({ orgId, roles }: { orgId: string; roles: string[] }) {
  const canMembers = canInOrg(roles, "org:members").granted;
  const canAuthor = canInOrg(roles, "learn:author").granted;
  const canPublish = canInOrg(roles, "learn:publish").granted;
  const canEnroll = canInOrg(roles, "learn:enroll").granted;
  const skillsDecision = canInOrg(roles, "people:skills-read");
  const canSkills = skillsDecision.granted && skillsDecision.scope !== "own";
  const canAssess = canInOrg(roles, "assess:author").granted;
  const canHire = canInOrg(roles, "talent:search").granted || canInOrg(roles, "hire:pipeline").granted;
  const tabs = ["programs", "courses", ...(canAssess ? ["assess"] : []), ...(canSkills ? ["skills"] : []), ...(canHire ? ["hire"] : []), "people"] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]>("programs");

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm border-b-2 -mb-px capitalize transition-colors ${tab === t ? "border-accent text-text-1" : "border-transparent text-text-3 hover:text-text-1"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "people" ? (
        canMembers ? <PeopleTab orgId={orgId} /> : <p className="text-text-3 text-sm mt-6">Your role doesn&apos;t include people management.</p>
      ) : tab === "courses" ? (
        <CoursesTab orgId={orgId} canAuthor={canAuthor} canPublish={canPublish} />
      ) : tab === "skills" ? (
        <SkillsTab orgId={orgId} />
      ) : tab === "assess" ? (
        <AssessTab orgId={orgId} />
      ) : tab === "hire" ? (
        <HireTab orgId={orgId} />
      ) : (
        <ProgramsTab orgId={orgId} canAuthor={canAuthor} canPublish={canPublish} canEnroll={canEnroll} />
      )}
    </div>
  );
}

type Candidate = { userId: string; name: string; college: string | null; gradYear: number | null; anon: boolean; readiness: number; band: string };
type Profile = { identity: { name?: string; email?: string; college?: string | null; anon?: boolean }; readiness: { overall: number; band: string; pillars: { key: string; label: string; score: number }[] }; certificates: { title: string; score: number | null; verifyCode: string }[]; skills: { slug: string; level: number }[] };

function HireTab({ orgId }: { orgId: string }) {
  const action = useApiAction();
  const [minR, setMinR] = useState(0);
  const search = useApi<{ total: number; candidates: Candidate[] }>(`/orgs/${orgId}/talent/search?minReadiness=${minR}`);
  const [openUser, setOpenUser] = useState<string | null>(null);
  const profile = useApi<Profile>(openUser ? `/orgs/${orgId}/talent/${openUser}/profile` : null);
  const reqs = useApi<{ id: string; title: string; status: string; _count: { candidates: number } }[]>(`/orgs/${orgId}/requisitions`);
  const [reqTitle, setReqTitle] = useState("");

  async function createReq() {
    if (reqTitle.trim().length < 2) return;
    try { await action(`/orgs/${orgId}/requisitions`, { method: "POST", body: JSON.stringify({ title: reqTitle.trim() }) }); setReqTitle(""); await reqs.mutate(); }
    catch { /* toasted */ }
  }
  async function shortlist(userId: string) {
    const req = reqs.data?.[0];
    if (!req) return;
    try { await action(`/orgs/${orgId}/requisitions/${req.id}/candidates`, { method: "POST", body: JSON.stringify({ userId }) }); await reqs.mutate(); }
    catch { /* toasted */ }
  }
  const band = (n: number) => n >= 80 ? "text-easy" : n >= 50 ? "text-text-1" : "text-medium";

  return (
    <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[11px] uppercase tracking-widest text-text-3">Talent pool · evidence-ranked</div>
          <label className="text-xs text-text-3 flex items-center gap-2">min readiness
            <input type="number" min={0} max={100} value={minR} onChange={(e) => setMinR(Number(e.target.value))} className="w-16 h-8 px-2 rounded bg-surface border border-border text-text-1" />
          </label>
        </div>
        <div className="space-y-2">
          {!search.data && <SkeletonRows rows={3} />}
          {search.data?.candidates.map((c) => (
            <Card key={c.userId} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{c.name}{c.anon && <span className="text-text-4 text-xs ml-2">anon</span>}</div>
                <div className="text-text-4 text-xs truncate">{c.college ?? "—"}{c.gradYear ? ` · ${c.gradYear}` : ""} · {c.band}</div>
              </div>
              <span className={`font-display text-xl font-bold tabular-nums ${band(c.readiness)}`}>{c.readiness}</span>
              <Button size="sm" variant="secondary" onClick={() => setOpenUser(c.userId)}>Profile</Button>
              <Button size="sm" onClick={() => shortlist(c.userId)} disabled={!reqs.data?.length}>Shortlist</Button>
            </Card>
          ))}
          {search.data?.candidates.length === 0 && <p className="text-text-4 text-sm">No consented candidates match yet.</p>}
        </div>

        {openUser && profile.data && (
          <Card className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{profile.data.identity.name}{profile.data.identity.anon && <span className="text-text-4 text-xs ml-2">identity hidden until shortlisted</span>}</h3>
              <button onClick={() => setOpenUser(null)} className="text-text-4 hover:text-text-1 text-sm">close</button>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`font-display text-3xl font-bold ${band(profile.data.readiness.overall)}`}>{profile.data.readiness.overall}</span>
              <span className="text-text-3 text-sm">/100 · {profile.data.readiness.band}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {profile.data.readiness.pillars.map((p) => (
                <div key={p.key} className="rounded-lg bg-surface-2 px-3 py-2">
                  <div className="text-text-4 text-[10px] uppercase font-mono truncate">{p.label}</div>
                  <div className="font-mono text-sm">{p.score}</div>
                </div>
              ))}
            </div>
            {profile.data.certificates.length > 0 && (
              <div className="mt-4">
                <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-1">Verified certificates</div>
                {profile.data.certificates.map((c) => (
                  <a key={c.verifyCode} href={`/verify/${c.verifyCode}`} target="_blank" className="block text-sm text-accent hover:underline">✓ {c.title}{c.score != null ? ` · ${c.score}` : ""}</a>
                ))}
              </div>
            )}
            {profile.data.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {profile.data.skills.map((s) => <Badge key={s.slug} tone="accent">{s.slug} · {s.level}</Badge>)}
              </div>
            )}
          </Card>
        )}
      </div>

      <aside className="min-w-0 space-y-6">
        <MyOffers />
        <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">Requisitions</div>
        <div className="flex gap-2 mb-3">
          <input className="flex-1 h-9 px-3 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:border-accent" placeholder="New role" value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void createReq(); }} />
          <Button size="sm" onClick={createReq} disabled={reqTitle.trim().length < 2}>+</Button>
        </div>
        <div className="space-y-2">
          {reqs.data?.map((r) => (
            <Card key={r.id} className="py-2.5">
              <div className="font-medium text-sm truncate">{r.title}</div>
              <div className="text-text-4 text-xs">{r._count.candidates} in pipeline · {r.status}</div>
            </Card>
          ))}
          {reqs.data?.length === 0 && <p className="text-text-4 text-xs">Create a role to start shortlisting.</p>}
        </div>
        </div>
      </aside>
    </div>
  );
}

type MyOffer = { id: string; title: string; ctcInr: number; company: string; status: string };
function MyOffers() {
  const action = useApiAction();
  const { data, mutate } = useApi<MyOffer[]>("/talent/offers");
  const [busy, setBusy] = useState<string | null>(null);
  async function respond(id: string, accept: boolean) {
    setBusy(id);
    try { await action(`/talent/offers/${id}/respond`, { method: "POST", body: JSON.stringify({ accept }) }); await mutate(); }
    catch { /* toasted */ } finally { setBusy(null); }
  }
  if (!data || data.length === 0) return null;
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-widest text-accent mb-2">Your offers</div>
      <div className="space-y-2">
        {data.map((o) => (
          <Card key={o.id} variant="glow" className="py-3">
            <div className="font-medium text-sm">{o.title}</div>
            <div className="text-text-3 text-xs">{o.company} · ₹{(o.ctcInr / 100000).toFixed(1)}L</div>
            {o.status === "SENT" ? (
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => respond(o.id, true)} disabled={busy === o.id}>Accept</Button>
                <Button size="sm" variant="ghost" onClick={() => respond(o.id, false)} disabled={busy === o.id}>Decline</Button>
              </div>
            ) : <Badge tone={o.status === "ACCEPTED" ? "easy" : "default"} className="mt-2">{o.status}</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
}

type Blueprint = { id: string; name: string; category: string; questionCount: number; passingScore: number; skillId: string | null; _count: { runs: number } };
type Run = { id: string; purpose: string; blueprint: { name: string; passingScore: number }; _count: { attempts: number } };
type Results = { run: { name: string; passingScore: number }; stats: { attempts: number; submitted: number; passed: number; avgScore: number | null }; rows: { name: string; score: number | null; passed: boolean; integrityScore: number; status: string }[] };
const CATS = ["TECHNICAL", "APTITUDE", "LOGICAL", "VERBAL"] as const;

function AssessTab({ orgId }: { orgId: string }) {
  const action = useApiAction();
  const bps = useApi<Blueprint[]>(`/orgs/${orgId}/blueprints`);
  const runs = useApi<Run[]>(`/orgs/${orgId}/runs`);
  const [name, setName] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("TECHNICAL");
  const [skill, setSkill] = useState("");
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const results = useApi<Results>(resultsFor ? `/orgs/${orgId}/runs/${resultsFor}/results` : null);
  const [busy, setBusy] = useState(false);

  async function create() {
    if (name.trim().length < 2) return;
    setBusy(true);
    try {
      await action(`/orgs/${orgId}/blueprints`, { method: "POST", body: JSON.stringify({ name: name.trim(), category: cat, questionCount: 5, skillSlug: skill.trim() || null }) });
      setName(""); setSkill(""); await bps.mutate();
    } catch { /* toasted */ } finally { setBusy(false); }
  }
  async function run(blueprintId: string) {
    try { await action(`/orgs/${orgId}/runs`, { method: "POST", body: JSON.stringify({ blueprintId }) }); await runs.mutate(); }
    catch { /* toasted */ }
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">Assessment blueprints</div>
        <div className="flex flex-wrap gap-2 mb-3">
          <input className="flex-1 min-w-[160px] h-10 px-3 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:border-accent" placeholder="Name (e.g. Kafka Check)" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="h-10 px-3 rounded-lg bg-surface border border-border text-sm" value={cat} onChange={(e) => setCat(e.target.value as typeof cat)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <input className="w-36 h-10 px-3 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:border-accent" placeholder="skill tag" value={skill} onChange={(e) => setSkill(e.target.value)} />
          <Button size="sm" onClick={create} disabled={busy || name.trim().length < 2}>New (5Q)</Button>
        </div>
        <div className="space-y-2">
          {bps.data?.map((b) => (
            <Card key={b.id} className="flex items-center gap-3 py-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{b.name}</div>
                <div className="text-text-4 text-xs">{b.category} · {b.questionCount}Q · pass {b.passingScore}% · {b._count.runs} runs</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => run(b.id)}>Run it</Button>
            </Card>
          ))}
          {bps.data?.length === 0 && <p className="text-text-4 text-sm">No blueprints yet. Tag one with a skill so scores feed the matrix.</p>}
        </div>
      </div>

      {runs.data && runs.data.length > 0 && (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">Runs</div>
          <div className="space-y-2">
            {runs.data.map((r) => (
              <Card key={r.id} className="py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{r.blueprint.name}</div>
                    <div className="text-text-4 text-xs">{r.purpose} · {r._count.attempts} attempts</div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setResultsFor(resultsFor === r.id ? null : r.id)}>{resultsFor === r.id ? "Hide" : "Results"}</Button>
                </div>
                {resultsFor === r.id && results.data && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="text-text-3 text-xs mb-2">{results.data.stats.submitted} submitted · {results.data.stats.passed} passed · avg {results.data.stats.avgScore ?? "—"}%</div>
                    <div className="space-y-1">
                      {results.data.rows.map((row, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 truncate">{row.name}</span>
                          {row.integrityScore < 100 && <Badge tone="medium">⚑ {row.integrityScore}</Badge>}
                          <Badge tone={row.passed ? "easy" : "hard"}>{row.score ?? "—"}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Matrix = { skills: { id: string; slug: string; name: string }[]; matrix: { department: string; cells: { skillId: string; level: number | null; coverage: number }[] }[]; memberCount: number };

function SkillsTab({ orgId }: { orgId: string }) {
  const { data } = useApi<Matrix>(`/orgs/${orgId}/skills/matrix`);
  const heat = (level: number | null) =>
    level == null ? "bg-surface-2 text-text-4"
      : level >= 75 ? "bg-easy/20 text-easy"
      : level >= 50 ? "bg-accent/15 text-text-1"
      : level >= 25 ? "bg-medium/15 text-medium"
      : "bg-hard/15 text-hard";

  return (
    <div className="mt-6">
      <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-1">Skill matrix</div>
      <p className="text-text-4 text-xs mb-3">Average level per department × skill — every number traces to real completed work.</p>
      {!data && <SkeletonRows rows={3} />}
      {data && data.skills.length === 0 && (
        <p className="text-text-4 text-sm">No skill evidence yet. Tag lessons with a skill; completions build the matrix.</p>
      )}
      {data && data.skills.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <table className="border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="text-left text-text-3 text-xs font-mono uppercase px-2">Department</th>
                {data.skills.map((s) => (
                  <th key={s.id} className="text-text-3 text-xs font-mono px-2 whitespace-nowrap">{s.slug}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((row) => (
                <tr key={row.department}>
                  <td className="text-sm font-medium pr-3 whitespace-nowrap">{row.department}</td>
                  {data.skills.map((s) => {
                    const cell = row.cells.find((c) => c.skillId === s.id);
                    return (
                      <td key={s.id} className={`text-center text-sm font-mono tabular-nums rounded-md w-14 h-9 ${heat(cell?.level ?? null)}`}>
                        {cell?.level ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type PathRow = { id: string; title: string; published: boolean; _count: { items: number; cohorts: number } };
type CohortRow = { id: string; name: string; startsAt: string; path: { title: string }; _count: { enrollments: number } };
type WorkPath = { cohortId: string; cohortName: string; pathTitle: string; progressPct: number; courses: { id: string; title: string; lessonCount: number; completedCount: number }[] };
type Funnel = { cohort: { name: string; path: string }; funnel: { enrolled: number; started: number; halfway: number; completed: number; stuck: number }; rows: { member: { name: string }; progressPct: number; stuckFlag: boolean }[] };

function ProgramsTab({ orgId, canAuthor, canPublish, canEnroll }: { orgId: string; canAuthor: boolean; canPublish: boolean; canEnroll: boolean }) {
  const action = useApiAction();
  const paths = useApi<PathRow[]>(canAuthor ? `/orgs/${orgId}/paths` : null);
  const cohorts = useApi<CohortRow[]>(canEnroll ? `/orgs/${orgId}/cohorts` : null);
  const work = useApi<WorkPath[]>(`/orgs/${orgId}/work/paths`);
  const [title, setTitle] = useState("");
  const [funnelFor, setFunnelFor] = useState<string | null>(null);
  const funnel = useApi<Funnel>(funnelFor ? `/orgs/${orgId}/cohorts/${funnelFor}/funnel` : null);
  const [busy, setBusy] = useState<string | null>(null);

  async function draftPath() {
    if (title.trim().length < 2) return;
    setBusy("new");
    try { await action(`/orgs/${orgId}/paths`, { method: "POST", body: JSON.stringify({ title: title.trim() }) }); setTitle(""); await paths.mutate(); }
    catch { /* toasted */ } finally { setBusy(null); }
  }

  return (
    <div className="mt-6 space-y-6">
      {canAuthor && (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">Learning programs</div>
          <div className="flex gap-2 mb-3">
            <input className="flex-1 h-10 px-3 rounded-lg bg-surface border border-border text-sm text-text-1 focus:outline-none focus:border-accent"
              placeholder="New program title (e.g. Fresher Onboarding)" value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void draftPath(); }} />
            <Button size="sm" onClick={draftPath} disabled={busy === "new" || title.trim().length < 2}>New program</Button>
          </div>
          <div className="space-y-2">
            {paths.data?.map((p) => (
              <Card key={p.id} className="flex items-center gap-3 py-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-text-4 text-xs">{p._count.items} courses · {p._count.cohorts} cohorts</div>
                </div>
                <Badge tone={p.published ? "easy" : "default"}>{p.published ? "PUBLISHED" : "DRAFT"}</Badge>
              </Card>
            ))}
            {paths.data?.length === 0 && <p className="text-text-4 text-sm">No programs yet. Create one, then add published courses to it.</p>}
          </div>
        </div>
      )}

      {canEnroll && cohorts.data && cohorts.data.length > 0 && (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">Cohorts</div>
          <div className="space-y-2">
            {cohorts.data.map((c) => (
              <Card key={c.id} className="py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-text-4 text-xs truncate">{c.path.title} · {c._count.enrollments} enrolled</div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setFunnelFor(funnelFor === c.id ? null : c.id)}>
                    {funnelFor === c.id ? "Hide funnel" : "View funnel"}
                  </Button>
                </div>
                {funnelFor === c.id && funnel.data && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {([["Enrolled", funnel.data.funnel.enrolled, "default"], ["Started", funnel.data.funnel.started, "accent"], ["Halfway", funnel.data.funnel.halfway, "accent"], ["Done", funnel.data.funnel.completed, "easy"], ["Stuck", funnel.data.funnel.stuck, "hard"]] as const).map(([l, v, tone]) => (
                        <div key={l} className="rounded-lg bg-surface-2 py-2">
                          <div className={`font-display text-lg font-bold ${tone === "easy" ? "text-easy" : tone === "hard" && v > 0 ? "text-hard" : ""}`}>{v}</div>
                          <div className="text-text-4 text-[10px] font-mono uppercase">{l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 space-y-1">
                      {funnel.data.rows.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 truncate">{r.member.name}</span>
                          {r.stuckFlag && <Badge tone="hard">stuck</Badge>}
                          <span className="font-mono text-xs text-text-3 tabular-nums w-10 text-right">{r.progressPct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">My programs</div>
        <div className="space-y-2">
          {!work.data && <SkeletonRows rows={2} />}
          {work.data?.map((p) => (
            <Card key={p.cohortId} className="py-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.pathTitle}</div>
                  <div className="text-text-4 text-xs truncate">{p.cohortName} · {p.courses.length} courses</div>
                </div>
                <span className="font-mono text-xs text-text-3 shrink-0 tabular-nums">{p.progressPct}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${p.progressPct}%` }} />
              </div>
            </Card>
          ))}
          {work.data?.length === 0 && <p className="text-text-4 text-sm">No programs assigned yet.</p>}
        </div>
      </div>
    </div>
  );
}

function PeopleTab({ orgId }: { orgId: string }) {
  const { data } = useApi<{ items: Member[] }>(`/orgs/${orgId}/members`);
  return (
    <div className="mt-6 space-y-2">
      {!data && <SkeletonRows rows={3} />}
      {data?.items.map((m) => (
        <Card key={m.id} className="flex items-center gap-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{m.user.name}</div>
            <div className="text-text-4 text-xs truncate">{m.user.email}{m.title ? ` · ${m.title}` : ""}</div>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {m.roles.map((r) => <Badge key={r} tone={r === "OWNER" ? "accent" : "default"}>{r}</Badge>)}
          </div>
        </Card>
      ))}
    </div>
  );
}

function CoursesTab({ orgId, canAuthor, canPublish }: { orgId: string; canAuthor: boolean; canPublish: boolean }) {
  const action = useApiAction();
  const builder = useApi<CourseRow[]>(canAuthor ? `/orgs/${orgId}/courses` : null);
  const work = useApi<WorkCourse[]>(`/orgs/${orgId}/work/courses`);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, verb: "submit" | "publish" | "archive") {
    setBusy(id);
    try { await action(`/orgs/${orgId}/courses/${id}/${verb}`, { method: "POST" }); await builder.mutate(); await work.mutate(); }
    catch { /* toasted */ } finally { setBusy(null); }
  }
  async function draft() {
    if (title.trim().length < 2) return;
    setBusy("new");
    try {
      const c = await action<{ id: string }>(`/orgs/${orgId}/courses`, { method: "POST", body: JSON.stringify({ title: title.trim() }) });
      // Seed one lesson so the course is submittable immediately — authors
      // flesh it out in the builder (next phase surface).
      await action(`/orgs/${orgId}/courses/${c.id}/lessons`, {
        method: "POST",
        body: JSON.stringify({ title: "Lesson 1", blocks: [{ type: "rich_text", data: { text: "Start writing…" } }] }),
      });
      setTitle("");
      await builder.mutate();
    } catch { /* toasted */ } finally { setBusy(null); }
  }

  return (
    <div className="mt-6 space-y-6">
      {canAuthor && (
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">Builder</div>
          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 h-10 px-3 rounded-lg bg-surface border border-border text-sm text-text-1 focus:outline-none focus:border-accent"
              placeholder="New course title" value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void draft(); }}
            />
            <Button size="sm" onClick={draft} disabled={busy === "new" || title.trim().length < 2}>Draft course</Button>
          </div>
          <div className="space-y-2">
            {builder.data?.map((c) => (
              <Card key={c.id} className="flex items-center gap-3 py-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{c.title}</div>
                  <div className="text-text-4 text-xs">{c._count.lessons} lessons · {c._count.enrollments} enrolled · v{c.version}</div>
                </div>
                <Badge tone={statusTone[c.status]}>{c.status.replace("_", " ")}</Badge>
                <div className="flex gap-1.5 shrink-0">
                  <Link href={`/orgs/${orgId}/build/${c.id}`}><Button size="sm" variant="secondary">Edit</Button></Link>
                  {c.status === "DRAFT" && <Button size="sm" variant="secondary" disabled={busy === c.id} onClick={() => run(c.id, "submit")}>Submit</Button>}
                  {(c.status === "IN_REVIEW" || c.status === "DRAFT") && canPublish && (
                    <Button size="sm" disabled={busy === c.id} onClick={() => run(c.id, "publish")}>Publish</Button>
                  )}
                  {c.status === "PUBLISHED" && canPublish && (
                    <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={() => run(c.id, "archive")}>Archive</Button>
                  )}
                </div>
              </Card>
            ))}
            {builder.data?.length === 0 && <p className="text-text-4 text-sm">No courses yet — draft the first one above.</p>}
          </div>
        </div>
      )}

      <div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">My learning</div>
        <div className="space-y-2">
          {!work.data && <SkeletonRows rows={2} />}
          {work.data?.map((c) => (
            <Link key={c.id} href={`/orgs/${orgId}/course/${c.id}`}>
              <Card interactive className="py-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{c.title}</div>
                    <div className="text-text-4 text-xs truncate">{c.description || "—"}</div>
                  </div>
                  <span className="font-mono text-xs text-text-3 shrink-0 tabular-nums">{c.completedCount}/{c.lessonCount}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${c.lessonCount ? (c.completedCount / c.lessonCount) * 100 : 0}%` }} />
                </div>
              </Card>
            </Link>
          ))}
          {work.data?.length === 0 && <p className="text-text-4 text-sm">Nothing assigned yet — published courses appear here.</p>}
        </div>
      </div>
    </div>
  );
}
