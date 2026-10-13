"use client";
import { useState } from "react";
import { Button, PageHeader, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useRole } from "@/lib/use-role";
import { fieldClass, LoadError } from "@/components/lms/shared";

type Organization = { id: string; name: string; slug: string; plan: string; seatsLicensed: number; _count: { members: number } };
export default function Page() {
  const { can, loading } = useRole();
  const allowed = can("manage:users");
  const [search, setSearch] = useState("");
  const orgs = useApi<Organization[]>(allowed ? `/admin/organizations?q=${encodeURIComponent(search)}` : null);
  const action = useApiAction();
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [seats, setSeats] = useState(10);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  if (loading) return <SkeletonRows rows={3} />;
  if (!allowed) return <p className="p-8">Only platform administrators can provision LMS organizations.</p>;
  return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
    <PageHeader title="LMS organizations" subtitle="Provision a private workspace, assign its first owner and set the licensed seat limit." />
    <section aria-labelledby="provision-title"><h2 id="provision-title" className="text-xl font-semibold">Create a workspace</h2><p className="mt-2 text-text-2 max-w-prose">The owner needs an existing EYF account. Platform administration does not automatically give you access to a customer’s courses or learner records.</p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setError(""); setNotice("");
        try { await action("/orgs", { method: "POST", body: JSON.stringify({ name, ownerEmail, seatsLicensed: seats }) }, { silent: true }); setNotice(`Workspace created for ${ownerEmail}. No payment was collected.`); setName(""); setOwnerEmail(""); await orgs.mutate(); }
        catch (e) { setError(e instanceof Error ? e.message : "Could not create the workspace. Try again."); } finally { setBusy(false); }
      }}>
        <label>Organization name<input className={`${fieldClass} mt-1`} value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required /></label>
        <label>Owner email<input type="email" className={`${fieldClass} mt-1`} value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required /></label>
        <label>Licensed seats<input type="number" min={1} max={100000} className={`${fieldClass} mt-1`} value={seats} onChange={(e) => setSeats(Number(e.target.value))} required /></label>
        <div className="sm:col-span-2 lg:col-span-3"><Button disabled={busy}>{busy ? "Creating workspace…" : "Create workspace"}</Button></div>
      </form>
      {error && <p role="alert" className="mt-3 text-hard">{error}</p>}{notice && <output  className="block mt-3 text-easy">{notice}</output>}
    </section>
    <section aria-labelledby="licenses-title" className="space-y-4"><h2 id="licenses-title" className="text-xl font-semibold">Workspaces and licenses</h2><label className="block max-w-md">Search organizations<input type="search" className={`${fieldClass} mt-1`} value={search} onChange={(e) => setSearch(e.target.value)} maxLength={120} /></label>
      <LoadError error={orgs.error} retry={orgs.mutate} />{orgs.isLoading && <SkeletonRows rows={3} />}
      {orgs.data?.length === 0 && <p className="text-text-2">No organizations found.</p>}
      {orgs.data?.map((org) => <LicenseRow key={org.id} org={org} refresh={() => orgs.mutate()} />)}
      <p className="text-sm text-text-2">Showing up to 100 matching workspaces. Seat changes are recorded in the audit log. Payment integration is pending.</p>
    </section>
  </div>;
}

function LicenseRow({ org, refresh }: Readonly<{ org: Organization; refresh: () => Promise<unknown> }>) {
  const action = useApiAction();
  const [seats, setSeats] = useState(org.seatsLicensed);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  return <form className="border-b border-border py-5 flex flex-wrap items-end gap-4" onSubmit={async (e) => {
    e.preventDefault(); setBusy(true); setNotice("");
    try { await action(`/admin/organizations/${org.id}/seats`, { method: "PATCH", body: JSON.stringify({ seatsLicensed: seats }) }); await refresh(); setNotice("Seat limit updated."); } catch { /* API error is surfaced by useApiAction. */ } finally { setBusy(false); }
  }}>
    <div className="flex-1 min-w-0 basis-full sm:basis-0"><h3 className="font-semibold break-words">{org.name}</h3><p className="text-sm text-text-2 mt-1">{org._count.members} active members · {org.seatsLicensed} licensed seats · {org.plan.toLowerCase()}</p></div>
    <label className="w-32 text-sm">Seats for {org.name}<input className={`${fieldClass} mt-1`} type="number" min={Math.max(1, org._count.members)} max={100000} value={seats} onChange={(e) => setSeats(Number(e.target.value))} required /></label>
    <Button variant="secondary" disabled={busy || seats === org.seatsLicensed}>Save seats</Button>{notice && <output  className="block w-full text-sm text-easy">{notice}</output>}
  </form>;
}
