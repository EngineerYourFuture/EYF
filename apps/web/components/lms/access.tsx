"use client";
import { canInOrg, ORG_CAPABILITIES } from "@eyf/types";
import { useApi } from "@/lib/use-api";
import { LoadError } from "./shared";

import { CAPABILITY_LABELS, roleName } from "./roles";

type Access = { roles: string[]; departmentId: string | null; plan: string; seats: { used: number; licensed: number } };
export function AccessPanel({ orgId, roles }: Readonly<{ orgId: string; roles: string[] }>) {
  const access = useApi<Access>(`/orgs/${orgId}/access`);
  return <section className="mt-6 space-y-6" aria-labelledby="access-title">
    <div><h2 id="access-title" className="text-xl font-semibold">Your access and limits</h2><p className="mt-2 text-text-2">Your roles: {(access.data?.roles ?? roles).map(roleName).join(", ")}. Permissions apply only within this workspace.</p></div>
    <LoadError error={access.error} retry={access.mutate} />
    {access.data && <p className="text-text-2">{access.data.seats.used} of {access.data.seats.licensed} licensed seats in use. {access.data.plan.toLowerCase()} plan. Seat changes are arranged through EYF; payments are not enabled yet.</p>}
    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><caption className="sr-only">Permissions for your current roles</caption><thead><tr className="border-b border-border"><th scope="col" className="py-3 pr-4">Action</th><th scope="col" className="py-3">Access</th></tr></thead><tbody>{ORG_CAPABILITIES.map((cap) => {
      const decision = canInOrg(access.data?.roles ?? roles, cap);
      return <tr key={cap} className="border-b border-border"><th scope="row" className="font-normal py-3 pr-4">{CAPABILITY_LABELS[cap]}</th><td className="py-3 text-text-2">{decision.granted ? ({ org: "This organization", department: "Your department", team: "Your team", mentees: "Your mentees", own: "Your records" })[decision.scope] : "No access"}</td></tr>;
    })}</tbody></table></div>
    <p className="text-sm text-text-2">Only an owner can appoint owners or administrators. HR can manage learner and intern accounts. Organization roles do not grant EYF platform administration. Suspended accounts lose workspace access immediately.</p>
  </section>;
}
