"use client";
/**
 * Org console seed (Enterprise Phase 1) — the first visible surface of the
 * membership platform: switcher, people, and the course lifecycle end-to-end
 * (draft → submit → publish → learn). Buttons are gated client-side by the
 * SAME shared capability map the API enforces (canInOrg from @eyf/types);
 * the API remains the authority. Grows into the full /org console per PRD §10.
 */
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, Badge, Button, EmptyState, SkeletonRows } from "@eyf/ui";
import { PageMotion } from "@/components/page-motion";
import { Icons } from "@/components/icons";
import { LearnerAssessments } from "@/components/lms/assessments";
import { CertificatesTab } from "@/components/lms/certificates";
import { SprintReviewsTab } from "@/components/sprint-continuation";
import { ProgramsTab } from "@/components/lms/programs";
import { PeopleTab, AcceptInvitation } from "@/components/lms/people";
import { AccessPanel } from "@/components/lms/access";
import { LoadError, fieldClass } from "@/components/lms/shared";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { canInOrg } from "@eyf/types";
import { WorkspaceNav, workspaceSections } from "@/components/lms/workspace-nav";
import { countLabel, roleName, workspaceHref } from "@/components/lms/roles";

type Membership = { roles: string[]; org: { id: string; name: string; slug: string; plan: string } };
type CourseRow = { id: string; title: string; status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED"; version: number; _count: { lessons: number; enrollments: number } };
type WorkCourse = { id: string; title: string; description: string; lessonCount: number; completedCount: number };

const statusTone = { DRAFT: "default", IN_REVIEW: "medium", PUBLISHED: "easy", ARCHIVED: "hard" } as const;

export default function Page() {
  return <Suspense fallback={<div className="p-6"><SkeletonRows rows={3} /></div>}><WorkspacePage /></Suspense>;
}

function WorkspacePage() {
  const { data: memberships, error: membershipsError, mutate: refreshOrgs } = useApi<Membership[]>("/orgs/mine");
  const search = useSearchParams();
  const router = useRouter();
  const active = memberships?.find((m) => m.org.id === search.get("org")) ?? memberships?.[0] ?? null;
  const roles = active?.roles ?? [];
  const sections = workspaceSections(roles);
  const fallback = ["programs", "cohorts"].find((id) => sections.some((s) => s.id === id)) ?? "learning";
  const tab = sections.some((s) => s.id === search.get("tab")) ? search.get("tab")! : fallback;
  const navigate = (org: string, nextTab = tab) => router.replace(workspaceHref(org, nextTab), { scroll: false });
  return <PageMotion><div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-7xl mx-auto">
    <h1 className="sr-only">Your learning workspace</h1>
    <LoadError error={membershipsError} retry={refreshOrgs} />
    {!memberships && !membershipsError && <SkeletonRows rows={3} />}
    <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-10 items-start">
      <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
        {active && <div><label className="text-sm font-medium">Organization<select aria-label="Organization" className={`${fieldClass} mt-2`} value={active.org.id} onChange={(e) => navigate(e.target.value)}>{memberships?.map((m) => <option key={m.org.id} value={m.org.id}>{m.org.name}</option>)}</select></label><p className="mt-2 text-xs text-text-2">{roles.map(roleName).join(" · ")}</p></div>}
        {active ? <details className="text-sm"><summary className="min-h-11 flex items-center cursor-pointer text-text-2 underline underline-offset-4">Join another organization</summary><AcceptInvitation onAccepted={async (id) => { await refreshOrgs(); navigate(id, "learning"); }} /></details> : <AcceptInvitation onAccepted={async (id) => { await refreshOrgs(); navigate(id, "learning"); }} />}
        {active && <WorkspaceNav sections={sections} value={tab} onChange={(id) => navigate(active.org.id, id)} />}
      </aside>
      {!active ? memberships && !membershipsError && <EmptyState icon={<Icons.Building width={28} height={28} />} title="An invitation gets you started" description="Sign in with the email your organization invited, then enter your invitation code. An EYF account alone does not grant workspace access." /> : <OrgConsole key={`${active.org.id}:${tab}`} orgId={active.org.id} roles={roles} tab={tab} />}
    </div>
  </div></PageMotion>;
}

function OrgConsole({ orgId, roles, tab }: Readonly<{ orgId: string; roles: string[]; tab: string }>) {
  const canMembers = canInOrg(roles, "org:members").granted;
  const canAuthor = canInOrg(roles, "learn:author").granted;
  const canPublish = canInOrg(roles, "learn:publish").granted;
  const enrollmentAccess = canInOrg(roles, "learn:enroll");
  const canEnroll = enrollmentAccess.granted;
  const canAssess = canInOrg(roles, "assess:author").granted;
  return (
    <div className="min-w-0" id="org-panel" role="tabpanel" aria-label={workspaceSections(roles).find((s) => s.id === tab)?.label} tabIndex={0}>
      {(() => {
  if (tab === "access") return <AccessPanel orgId={orgId} roles={roles} />;
  if (tab === "reviews") return <SprintReviewsTab orgId={orgId} />;
  if (tab === "people") { return (
        canMembers ? <PeopleTab orgId={orgId} roles={roles} /> : <p className="text-text-3 text-sm mt-6">Your role doesn&apos;t include people management.</p>
      ); }
  if (tab === "courses") { return (
        <CoursesTab orgId={orgId} canAuthor={canAuthor} canPublish={canPublish} />
      ); }
  if (tab === "skills") { return (
        <SkillsTab orgId={orgId} />
      ); }
  if (tab === "assessments") { return <>{canAssess && <AssessTab orgId={orgId} canAdminister={canInOrg(roles, "assess:administer").granted} />}<LearnerAssessments orgId={orgId} /></>; }
  if (tab === "certificates") { return <CertificatesTab orgId={orgId} canManage={canAuthor} />; }
  if (tab === "hire") { return (
        <HireTab orgId={orgId} />
      ); }
  if (tab === "settings") { return (
        <SettingsTab orgId={orgId} />
      ); }
  return (
        <ProgramsTab mode={tab === "cohorts" || tab === "programs" ? tab : "learning"} orgId={orgId} canAuthor={canAuthor} canPublish={canPublish} canEnroll={canEnroll} canEditDrive={enrollmentAccess.granted && enrollmentAccess.scope === "org"} />
      );
})()}
    </div>
  );
}

type ApiKey = { id: string; name: string; prefix: string; scopes: string[]; lastUsedAt: string | null };
type Hook = { id: string; url: string; events: string[]; active: boolean; failCount: number };

function SettingsTab({ orgId }: Readonly<{ orgId: string }>) {
  const action = useApiAction();
  const confirm = useConfirm();
  const brand = useApi<{ logoUrl: string | null; brandColor: string | null }>(`/orgs/${orgId}/branding`);
  const keys = useApi<ApiKey[]>(`/orgs/${orgId}/api-keys`);
  const hooks = useApi<{ endpoints: Hook[]; availableEvents: string[] }>(`/orgs/${orgId}/webhooks`);
  const [color, setColor] = useState("");
  const [logo, setLogo] = useState("");
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [hookUrl, setHookUrl] = useState("");
  const [newSecret, setNewSecret] = useState<string | null>(null);

  async function saveBrand() {
    try { await action(`/orgs/${orgId}/branding`, { method: "PATCH", body: JSON.stringify({ ...(color ? { brandColor: color } : {}), ...(logo ? { logoUrl: logo } : {}) }) }); await brand.mutate(); toast.success("Branding saved"); }
    catch { /* toasted */ }
  }
  async function createKey() {
    if (keyName.trim().length < 1) { return; }
    try { const k = await action<{ key: string }>(`/orgs/${orgId}/api-keys`, { method: "POST", body: JSON.stringify({ name: keyName.trim(), scopes: ["talent:search"] }) }); setNewKey(k.key); setKeyName(""); await keys.mutate(); }
    catch { /* toasted */ }
  }
  async function createHook() {
    if (!hookUrl.trim()) { return; }
    try { const h = await action<{ secret: string }>(`/orgs/${orgId}/webhooks`, { method: "POST", body: JSON.stringify({ url: hookUrl.trim(), events: ["certificate.issued", "offer.accepted"] }) }); setNewSecret(h.secret); setHookUrl(""); await hooks.mutate(); }
    catch { /* toasted */ }
  }

  return (
    <div className="mt-6 space-y-8 max-w-2xl">
      <section>
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">White-label branding</div>
        <div className="flex flex-wrap gap-2 items-center">
          <input aria-label="Brand color (hex)" className="h-10 px-3 rounded-lg bg-surface border border-border text-sm w-32" placeholder="#E8192C" value={color} onChange={(e) => setColor(e.target.value)} />
          <input aria-label="Logo URL" type="url" className="flex-1 min-w-[200px] h-10 px-3 rounded-lg bg-surface border border-border text-sm" placeholder="Logo URL" value={logo} onChange={(e) => setLogo(e.target.value)} />
          <Button size="sm" onClick={saveBrand}>Save</Button>
        </div>
        {brand.data?.brandColor && <div className="text-text-4 text-xs mt-2">Active accent: <span className="inline-block w-3 h-3 rounded-sm align-middle" style={{ background: brand.data.brandColor }} /> {brand.data.brandColor}</div>}
      </section>

      <section>
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">API keys</div>
        {newKey && (
          <div className="rounded-lg border border-accent/40 bg-accent-tint/30 p-3 mb-3">
            <div className="text-xs text-text-3 mb-1">Copy this now — it won&apos;t be shown again.</div>
            <div className="flex items-center gap-2">
              <code className="text-sm break-all flex-1">{newKey}</code>
              <CopyButton value={newKey} label="Copy API key" />
            </div>
          </div>
        )}
        <div className="flex gap-2 mb-3">
          <input aria-label="API key name" className="flex-1 h-10 px-3 rounded-lg bg-surface border border-border text-sm" placeholder="Key name (e.g. ATS integration)" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
          <Button size="sm" onClick={createKey}>Create key</Button>
        </div>
        <div className="space-y-1.5">
          {keys.data?.map((k) => (
            <Card key={k.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1"><span className="font-medium text-sm">{k.name}</span> <code className="text-text-4 text-xs ml-2">{k.prefix}…</code></div>
              <button type="button"
                aria-label={`Revoke API key ${k.name}`}
                onClick={async () => {
                  const ok = await confirm({
                    title: `Revoke API key "${k.name}"?`,
                    message: "Any integration using it will stop working immediately.",
                    confirmLabel: "Revoke",
                    danger: true,
                  });
                  if (!ok) { return; }
                  await action(`/orgs/${orgId}/api-keys/${k.id}/revoke`, { method: "POST" });
                  await keys.mutate();
                }}
                className="text-text-4 hover:text-hard text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
              >revoke</button>
            </Card>
          ))}
          {keys.data?.length === 0 && <p className="text-text-4 text-sm">No API keys yet.</p>}
        </div>
      </section>

      <section>
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-2">Webhooks</div>
        {newSecret && (
          <div className="rounded-lg border border-accent/40 bg-accent-tint/30 p-3 mb-3">
            <div className="text-xs text-text-3 mb-1">Signing secret — verify the x-eyf-signature header with it.</div>
            <div className="flex items-center gap-2">
              <code className="text-sm break-all flex-1">{newSecret}</code>
              <CopyButton value={newSecret} label="Copy signing secret" />
            </div>
          </div>
        )}
        <div className="flex gap-2 mb-3">
          <input aria-label="Webhook endpoint URL" type="url" className="flex-1 h-10 px-3 rounded-lg bg-surface border border-border text-sm" placeholder="https://your-app.com/eyf-webhook" value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} />
          <Button size="sm" onClick={createHook}>Add endpoint</Button>
        </div>
        <div className="space-y-1.5">
          {hooks.data?.endpoints.map((h) => (
            <Card key={h.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1"><div className="text-sm truncate">{h.url}</div><div className="text-text-4 text-xs">{h.events.join(", ")}{h.failCount > 0 ? ` · ${h.failCount} fails` : ""}</div></div>
              <Badge tone={h.active ? "easy" : "default"}>{h.active ? "active" : "off"}</Badge>
            </Card>
          ))}
          {hooks.data?.endpoints.length === 0 && <p className="text-text-4 text-sm">No webhook endpoints. Add one to receive events like certificate.issued.</p>}
        </div>
      </section>
    </div>
  );
}

/** One-click copy for a secret shown only once (API key, webhook signing secret). */
function CopyButton({ value, label }: Readonly<{ value: string; label: string }>) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Couldn't copy — select the text and copy manually.");
        }
      }}
      className="shrink-0 text-xs rounded-md border border-border px-2 py-1 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {done ? "Copied ✓" : "Copy"}
    </button>
  );
}

type Candidate = { userId: string; name: string; college: string | null; gradYear: number | null; anon: boolean; readiness: number; band: string };
type Profile = { identity: { name?: string; email?: string; college?: string | null; anon?: boolean }; readiness: { overall: number; band: string; pillars: { key: string; label: string; score: number }[] }; certificates: { title: string; score: number | null; verifyCode: string }[]; skills: { slug: string; level: number }[] };

function HireTab({ orgId }: Readonly<{ orgId: string }>) {
  const action = useApiAction();
  const [minR, setMinR] = useState(0);
  // Debounce so dragging/typing the readiness filter doesn't fire a search per keystroke.
  const [debouncedMinR, setDebouncedMinR] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedMinR(minR), 300);
    return () => clearTimeout(t);
  }, [minR]);
  const search = useApi<{ total: number; candidates: Candidate[] }>(`/orgs/${orgId}/talent/search?minReadiness=${debouncedMinR}`);
  const [openUser, setOpenUser] = useState<string | null>(null);
  const profile = useApi<Profile>(openUser ? `/orgs/${orgId}/talent/${openUser}/profile` : null);
  const reqs = useApi<{ id: string; title: string; status: string; _count: { candidates: number } }[]>(`/orgs/${orgId}/requisitions`);
  const [reqTitle, setReqTitle] = useState("");

  async function createReq() {
    if (reqTitle.trim().length < 2) { return; }
    try { await action(`/orgs/${orgId}/requisitions`, { method: "POST", body: JSON.stringify({ title: reqTitle.trim() }) }); setReqTitle(""); await reqs.mutate(); }
    catch { /* toasted */ }
  }
  async function shortlist(userId: string) {
    const req = reqs.data?.[0];
    if (!req) { return; }
    try { await action(`/orgs/${orgId}/requisitions/${req.id}/candidates`, { method: "POST", body: JSON.stringify({ userId }) }); await reqs.mutate(); }
    catch { /* toasted */ }
  }
  const band = (n: number) => { if (n >= 80) { return "text-easy"; } if (n >= 50) { return "text-text-1"; } return "text-medium"; };

  return (
    <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[11px] uppercase tracking-widest text-text-3">Talent pool · evidence-ranked</div>
          <label className="text-xs text-text-3 flex items-center gap-2">min readiness{" "}
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
              <span className={`font-display text-xl font-bold tabular-nums ${band(c.readiness)}`} aria-label={`Readiness ${c.readiness} of 100`}>{c.readiness}</span>
              <Button size="sm" variant="secondary" onClick={() => setOpenUser(c.userId)} aria-label={`View ${c.anon ? "candidate" : c.name}'s profile`}>Profile</Button>
              <Button size="sm" onClick={() => shortlist(c.userId)} disabled={!reqs.data?.length} aria-label={`Shortlist ${c.anon ? "candidate" : c.name}`}>Shortlist</Button>
            </Card>
          ))}
          {search.data?.candidates.length === 0 && <p className="text-text-4 text-sm">No consented candidates match yet.</p>}
        </div>

        {openUser && !profile.data && <Card className="mt-4"><SkeletonRows rows={3} /></Card>}
        {openUser && profile.data && (
          <Card className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{profile.data.identity.name}{profile.data.identity.anon && <span className="text-text-4 text-xs ml-2">identity hidden until shortlisted</span>}</h3>
              <button type="button" onClick={() => setOpenUser(null)} className="text-text-4 hover:text-text-1 text-sm">close</button>
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
  if (!data || data.length === 0) { return null; }
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
type Results = { run: { name: string; passingScore: number }; stats: { attempts: number; submitted: number; passed: number; avgScore: number | null }; rows: { id: string; name: string; score: number | null; passed: boolean; integrityScore: number; status: string }[] };
const CATS = ["TECHNICAL", "APTITUDE", "LOGICAL", "VERBAL"] as const;

function AssessTab({ orgId, canAdminister }: Readonly<{ orgId: string; canAdminister: boolean }>) {
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
    if (name.trim().length < 2) { return; }
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
      <LoadError error={bps.error || runs.error} retry={() => { void bps.mutate(); return runs.mutate(); }} />
      <div>
        <h2 className="text-xl font-semibold mb-3">Assessment blueprints</h2>
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
              {canAdminister && <Button size="sm" variant="secondary" onClick={() => run(b.id)}>Open assessment</Button>}
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
                      {results.data.rows.map((row) => (
                        <div key={row.id} className="flex items-center gap-2 text-sm">
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

function SkillsTab({ orgId }: Readonly<{ orgId: string }>) {
  const { data } = useApi<Matrix>(`/orgs/${orgId}/skills/matrix`);
  const heat = (level: number | null) => {
    if (level == null) { return "bg-surface-2 text-text-4"; }
    if (level >= 75) { return "bg-easy/20 text-easy"; }
    if (level >= 50) { return "bg-accent/15 text-text-1"; }
    if (level >= 25) { return "bg-medium/15 text-medium"; }
    return "bg-hard/15 text-hard";
  };

  return (
    <div className="mt-6">
      <div className="font-mono text-[11px] uppercase tracking-widest text-text-3 mb-1">Skill matrix</div>
      <p className="text-text-4 text-xs mb-3">Average level per department × skill — every number traces to real completed work.</p>
      {!data && <SkeletonRows rows={3} />}
      {data?.skills.length === 0 && (
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


function CoursesTab({ orgId, canAuthor, canPublish }: Readonly<{ orgId: string; canAuthor: boolean; canPublish: boolean }>) {
  const action = useApiAction();
  const builder = useApi<CourseRow[]>(canAuthor ? `/orgs/${orgId}/courses` : null);
  const work = useApi<WorkCourse[]>(`/orgs/${orgId}/work/courses`);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, verb: "submit" | "publish" | "archive") {
    setBusy(id);
    try { await action(`/orgs/${orgId}/courses/${id}/${verb}`, { method: "POST" }); await builder.mutate(); await work.mutate(); }
    catch { /* toasted */ } finally { setBusy(null); }
  }
  async function draft() {
    if (title.trim().length < 2) { return; }
    setBusy("new");
    try {
      const c = await action<{ id: string }>(`/orgs/${orgId}/courses`, { method: "POST", body: JSON.stringify({ title: title.trim() }) });
      // Seed one lesson so the course is submittable immediately — authors
      // flesh it out in the builder (next phase surface).
      await action(`/orgs/${orgId}/courses/${c.id}/lessons`, {
        method: "POST",
        body: JSON.stringify({ title: "Lesson 1", blocks: [{ type: "rich_text", data: { text: "Start writing…" } }] }),
      });
      setTitle(""); setCreating(false);
      await builder.mutate();
    } catch { /* toasted */ } finally { setBusy(null); }
  }
  async function pilotDraft() {
    setBusy("pilot");
    try { await action(`/orgs/${orgId}/courses/templates/sql-backend`, { method: "POST" }); await builder.mutate(); setCreating(false); toast.success("SQL pilot drafted: five lessons and two practical labs. Review before publishing."); }
    catch { /* toasted */ } finally { setBusy(null); }
  }
  async function aiDraft() {
    if (title.trim().length < 2) { return; }
    setBusy("ai");
    try {
      const r = await action<{ source: string; lessons: number }>(`/orgs/${orgId}/ai/course-draft`, { method: "POST", body: JSON.stringify({ topic: title.trim(), audience: "fresher", lessonCount: 5 }) });
      setTitle(""); setCreating(false);
      await builder.mutate();
      toast.success(`${r.source === "ai" ? "AI-drafted" : "Drafted"} ${r.lessons} lessons — edit and publish.`);
    } catch { /* toasted */ } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{canAuthor ? "Courses" : "My courses"}</h2><p className="mt-2 text-text-2">{canAuthor ? "Prepare lessons, preview the experience and publish when ready." : "Continue learning from your organization’s published courses."}</p></div>{canAuthor && <Button onClick={() => setCreating(!creating)} aria-expanded={creating} aria-controls="new-course">{creating ? "Cancel new course" : "New course"}</Button>}</div>
      <label className="block text-sm">Search courses<input className={`${fieldClass} mt-2`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      <LoadError error={builder.error || work.error} retry={() => { void builder.mutate(); return work.mutate(); }} />
      {canAuthor && (
        <div>
          {creating && <section id="new-course" className="border-y border-border py-5 mb-6 space-y-3"><label className="block text-sm">New course title<input className={`${fieldClass} mt-2`} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void draft(); }} /></label><div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={draft} disabled={!!busy || title.trim().length < 2}>Create blank course</Button><Button onClick={aiDraft} disabled={!!busy || title.trim().length < 2}>{busy === "ai" ? "Drafting…" : "Draft with AI"}</Button><Button variant="secondary" onClick={pilotDraft} disabled={!!busy}>{busy === "pilot" ? "Preparing…" : "Use SQL pilot course"}</Button></div><p className="text-text-2 text-sm">Start with a blank lesson or request an outline to review and edit. AI availability depends on your workspace configuration.</p></section>}
          <div className="space-y-2">
            {builder.isLoading && <SkeletonRows rows={3} />}
            {builder.data?.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())).map((c) => (
              <Card key={c.id} className="flex items-center gap-3 py-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{c.title}</div>
                  <div className="text-text-4 text-xs">{countLabel(c._count.lessons, "lesson")} · {c._count.enrollments} enrolled · v{c.version}</div>
                </div>
                <Badge tone={statusTone[c.status]}>{c.status.replace("_", " ")}</Badge>
                <div className="flex gap-1.5 shrink-0">
                  <Link href={`/orgs/${orgId}/build/${c.id}`} className="inline-flex min-h-11 items-center px-3 underline underline-offset-4">Edit</Link>
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
            {!!query && builder.data && !builder.data.some((c) => c.title.toLowerCase().includes(query.toLowerCase())) && <output  className="block text-text-2">No courses match this search.</output>}
            {builder.data?.length === 0 && <p className="text-text-4 text-sm">No courses yet. Choose New course to prepare your first lesson.</p>}
          </div>
        </div>
      )}

      {!canAuthor && <div>
        <div className="space-y-2">
          {!work.data && <SkeletonRows rows={2} />}
          {work.data?.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())).map((c) => (
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
          {!!query && work.data && !work.data.some((c) => c.title.toLowerCase().includes(query.toLowerCase())) && <output  className="block text-text-2">No courses match this search.</output>}
          {work.data?.length === 0 && <p className="text-text-4 text-sm">Nothing assigned yet — published courses appear here.</p>}
        </div>
      </div>}
    </div>
  );
}
