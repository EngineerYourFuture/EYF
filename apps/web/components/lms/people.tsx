"use client";
import { useState } from "react";
import { Button, Badge, SkeletonRows } from "@eyf/ui";
import { canGrantRoles, canInOrg, ORG_CAPABILITIES, ORG_ROLE_NAMES } from "@eyf/types";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { fieldClass, LoadError } from "./shared";
import { ROLE_DETAILS, ROLE_GROUPS, roleName, CAPABILITY_LABELS, SCOPE_LABELS } from "./roles";

type Member = { id: string; roles: string[]; status: string; user: { name: string; email: string } };
type Invite = { id: string; email: string; roles: string[]; expiresAt: string; emailStatus?: string };
type Delivery = { status: string; message: string };
export function PeopleTab({ orgId, roles }: Readonly<{ orgId: string; roles: string[] }>) {
  const base = `/orgs/${orgId}`;
  const action = useApiAction();
  const confirm = useConfirm();
  const [query, setQuery] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [cursor, setCursor] = useState("");
  const memberQuery = new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) });
  const members = useApi<{ items: Member[]; nextCursor: string | null }>(`${base}/members?${memberQuery}`);
  const invites = useApi<Invite[]>(`${base}/invites`);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [token, setToken] = useState("");
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const availableRoles = ORG_ROLE_NAMES.filter((r) => canGrantRoles(roles, [r]));
  async function save() {
    if (!editing) { return; }
    if (editing.status !== "ACTIVE" && !(await confirm({ title: `Change ${editing.user.name}'s access to ${editing.status.toLowerCase()}?`, confirmLabel: "Change access", danger: true }))) { return; }
    setBusy(true);
    try { await action(`${base}/members/${editing.id}`, { method: "PATCH", body: JSON.stringify({ roles: editing.roles, status: editing.status }) }); setEditing(null); await members.mutate(); setNotice("Member updated."); }
    catch { /* preserve edits; server enforces role hierarchy and last owner */ } finally { setBusy(false); }
  }
  return <div className="space-y-8">
    {notice && <output  className="block text-easy">{notice}</output>}
    <div className="flex flex-wrap justify-between items-start gap-4"><div><h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">People and access</h2><p className="mt-2 text-text-2">Invite learners and give each person the access their work needs.</p></div><Button onClick={() => setShowInvite(!showInvite)} aria-expanded={showInvite} aria-controls="invite-person">{showInvite ? "Cancel invitation" : "Invite a person"}</Button></div>
    {showInvite && <section id="invite-person" className="border-y border-border py-5 space-y-4" aria-labelledby="invite-title"><h3 id="invite-title" className="text-lg font-semibold">Invite a person</h3>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setToken(""); setDelivery(null); try { const result = await action<{ token: string; delivery: Delivery }>(`${base}/invites`, { method: "POST", body: JSON.stringify({ email, roles: [inviteRole] }) }); setToken(result.token); setDelivery(result.delivery); setEmail(""); await invites.mutate(); } catch { /* keep form */ } finally { setBusy(false); } }}>
        <label>Email<input type="email" className={`${fieldClass} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Invitation role<select className={`${fieldClass} mt-1`} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>{availableRoles.map((r) => <option key={r} value={r}>{roleName(r)}</option>)}</select></label>
        <p className="text-sm text-text-2 sm:col-span-2">{ROLE_DETAILS[inviteRole as keyof typeof ROLE_DETAILS]?.description}</p><AccessSummary roles={[inviteRole]} />
        <Button className="justify-self-start" disabled={busy}>Create invitation</Button>
      </form>
      {token && <div className="space-y-2 rounded-lg border border-border p-4"><p>{delivery?.message ?? "Share this invitation code with the person you invited."} They can enter the code in the private LMS after signing in with their invited email. It expires in seven days.</p><label className="block">Invitation code<input readOnly className={`${fieldClass} mt-1`} value={token} onFocus={(e) => e.target.select()} /></label></div>}
      <LoadError error={invites.error} retry={invites.mutate} />
      {invites.data && invites.data.length > 0 && <ul className="divide-y divide-border" aria-label="Pending invitations">{invites.data.map((i) => <li key={i.id} className="py-3 flex flex-wrap items-center gap-3"><span className="flex-1 min-w-0 break-words">{i.email} · {i.roles.map(roleName).join(", ")}<span className="block text-sm text-text-2">Expires {new Date(i.expiresAt).toLocaleDateString()}{i.emailStatus && ` · Email: ${i.emailStatus.toLowerCase().replaceAll("_", " ")}`}</span></span>{canGrantRoles(roles, i.roles) && <Button type="button" variant="secondary" disabled={busy} onClick={async () => { setBusy(true); try { const result = await action<{ token: string; delivery: Delivery }>(`${base}/invites/${i.id}/resend`, { method: "POST" }); setToken(result.token); setDelivery(result.delivery); setNotice(result.delivery.message); await invites.mutate(); } catch { /* keep invitation */ } finally { setBusy(false); } }}>Resend email</Button>}{canGrantRoles(roles, i.roles) && <Button variant="ghost" disabled={busy} onClick={async () => { if (!(await confirm({ title: `Revoke the invitation for ${i.email}?`, confirmLabel: "Revoke invitation", danger: true }))) { return; } setBusy(true); try { await action(`${base}/invites/${i.id}`, { method: "DELETE" }); await invites.mutate(); setNotice("Invitation revoked."); } catch { /* toasted */ } finally { setBusy(false); } }}>Revoke</Button>}</li>)}</ul>}
    </section>}
    <section className="space-y-4" aria-labelledby="members-title"><h3 id="members-title" className="text-lg font-semibold">Workspace members</h3><label className="block text-sm">Filter people on this page<input type="search" className={`${fieldClass} mt-2`} value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      <LoadError error={members.error} retry={members.mutate} />{members.isLoading && <SkeletonRows rows={3} />}
      {members.data?.items.filter((m) => `${m.user.name} ${m.user.email}`.toLowerCase().includes(query.toLowerCase())).map((m) => <div key={m.id} className="border-b border-border py-3 flex flex-wrap items-center gap-3"><div className="flex-1 min-w-0"><p className="font-medium">{m.user.name}</p><p className="text-sm text-text-2 break-all">{m.user.email}</p></div><div className="flex flex-wrap gap-2">{m.roles.map((r) => <Badge key={r}>{roleName(r)}</Badge>)}{m.status !== "ACTIVE" && <Badge tone="medium">{m.status}</Badge>}</div>{canGrantRoles(roles, m.roles) && <Button variant="secondary" onClick={() => setEditing({ ...m, roles: [...m.roles] })}>Edit {m.user.name}</Button>}</div>)}
      {members.data && !members.data.items.some((m) => `${m.user.name} ${m.user.email}`.toLowerCase().includes(query.toLowerCase())) && <output  className="block text-text-2">No matching people on this page. Clear the filter or check another page.</output>}
      <div className="flex gap-3">{cursor && <Button variant="secondary" onClick={() => setCursor("")}>First page</Button>}{members.data?.nextCursor && <Button variant="secondary" onClick={() => setCursor(members.data!.nextCursor!)}>Next people</Button>}</div>
      {editing && <form className="rounded-xl border border-border p-4 space-y-4" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <h3 className="font-semibold">Access for {editing.user.name}</h3>
        <p className="text-sm text-text-2">Choose up to five roles. Their permissions combine; each role applies only inside this organization.</p>
        {ROLE_GROUPS.filter((group) => availableRoles.some((r) => ROLE_DETAILS[r].group === group)).map((group) => <fieldset key={group} className="border-t border-border pt-4"><legend className="font-semibold pr-3">{group}</legend><div className="grid gap-3 sm:grid-cols-2">{availableRoles.filter((r) => ROLE_DETAILS[r].group === group).map((r) => <label key={r} htmlFor={`member-role-${r}`} className="flex gap-3 items-start min-h-11 py-2"><input id={`member-role-${r}`} aria-label={roleName(r)} className="mt-1" type="checkbox" checked={editing.roles.includes(r)} disabled={!editing.roles.includes(r) && editing.roles.length >= 5} onChange={(e) => setEditing({ ...editing, roles: e.target.checked ? [...editing.roles, r] : editing.roles.filter((role) => role !== r) })} /><span><span className="block font-medium">{roleName(r)}</span><span className="block mt-1 text-sm text-text-2">{ROLE_DETAILS[r].description}</span></span></label>)}</div></fieldset>)}
        <AccessSummary roles={editing.roles} suspended={editing.status !== "ACTIVE"} />
        <label className="block">Access status<select aria-label="Access status" className={`${fieldClass} mt-1`} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="OFFBOARDED">Offboarded</option></select></label>
        <div className="flex gap-3"><Button disabled={busy || !editing.roles.length}>Save access</Button><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
      </form>}
    </section>
  </div>;
}

function AccessSummary({ roles, suspended = false }: Readonly<{ roles: string[]; suspended?: boolean }>) {
  const granted = ORG_CAPABILITIES.flatMap((cap) => { const decision = canInOrg(roles, cap); return decision.granted ? [{ cap, scope: decision.scope }] : []; });
  let summary = "Select at least one role before saving.";
  if (suspended) summary = "Workspace access will be blocked while this account is suspended or offboarded.";
  else if (roles.length) summary = `${roles.map(roleName).join(", ")}. Active members can use organization learning. ${granted.length} additional capabilities apply.`;
  return <section aria-label="Resulting access" className="border-t border-border pt-4 sm:col-span-2"><h4 className="font-semibold">Resulting access</h4><p className="mt-2 text-sm text-text-2">{summary}</p>{!suspended && granted.length > 0 && <details className="mt-2"><summary className="min-h-11 flex items-center cursor-pointer text-sm underline underline-offset-4">View permissions and scope</summary><ul className="space-y-2 text-sm">{granted.map(({ cap, scope }) => <li key={cap} className="flex flex-wrap justify-between gap-2"><span>{CAPABILITY_LABELS[cap]}</span><span className="text-text-2">{SCOPE_LABELS[scope]}</span></li>)}</ul></details>}<p className="mt-2 text-xs text-text-2">Role-specific limits still apply. Organization roles do not grant EYF platform administration.</p></section>;
}

export function AcceptInvitation({ onAccepted }: Readonly<{ onAccepted: (orgId: string) => Promise<void> }>) {
  const [token, setToken] = useState(""); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const action = useApiAction();
  return <form className="mt-5 space-y-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { const result = await action<{ orgId: string }>("/orgs/invites/accept", { method: "POST", body: JSON.stringify({ token: token.trim() }) }); await onAccepted(result.orgId); setToken(""); setNotice("You joined the organization."); } catch { /* keep code */ } finally { setBusy(false); } }}>
    <label className="block">Invitation code<input className={`${fieldClass} mt-1`} value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" /></label><Button variant="secondary" disabled={busy || token.trim().length < 10}>Join organization</Button>{notice && <output  className="block text-easy">{notice}</output>}
  </form>;
}
