"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Badge, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { useConfirm } from "@/components/confirm";
import { fieldClass, LoadError } from "./shared";

type Certificate = { id: string; title: string; verificationCode: string; revokedAt: string | null; user?: { name: string } };
export function CertificatesTab({ orgId, canManage }: Readonly<{ orgId: string; canManage: boolean }>) {
  const base = `/orgs/${orgId}`;
  const mine = useApi<Certificate[]>(`${base}/work/certificates`);
  const issued = useApi<Certificate[]>(canManage ? `${base}/certificates` : null);
  const templates = useApi<{ id: string; name: string }[]>(canManage ? `${base}/cert-templates` : null);
  const blueprints = useApi<{ id: string; name: string }[]>(canManage ? `${base}/blueprints` : null);
  const action = useApiAction(); const confirm = useConfirm();
  const [name, setName] = useState(""); const [blueprint, setBlueprint] = useState(""); const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  return <div className="mt-6 space-y-8">
    <section className="space-y-4" aria-labelledby="my-certificates"><h2 id="my-certificates" className="text-xl font-semibold">My certificates</h2><LoadError error={mine.error} retry={mine.mutate} />{mine.isLoading && <SkeletonRows rows={2} />}{mine.data?.length === 0 && <p className="text-text-2">Your earned certificates will appear here.</p>}{mine.data?.map((c) => <CertificateRow key={c.id} certificate={c} />)}</section>
    {canManage && <section className="space-y-4" aria-labelledby="certificate-management"><h2 id="certificate-management" className="text-xl font-semibold">Certificate management</h2><p className="text-text-2">Choose an assessment. Learners who pass a new attempt receive its certificate automatically.</p>
      <form className="grid sm:grid-cols-2 gap-3" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await action(`${base}/cert-templates`, { method: "POST", body: JSON.stringify({ name, criteria: "ASSESSMENT_PASS", blueprintId: blueprint }) }); await templates.mutate(); setName(""); setNotice("Certificate template created."); } catch { /* preserve form */ } finally { setBusy(false); } }}>
        <label>Certificate title<input className={`${fieldClass} mt-1`} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} /></label><label>Qualifying assessment<select className={`${fieldClass} mt-1`} required value={blueprint} onChange={(e) => setBlueprint(e.target.value)}><option value="">Choose an assessment</option>{blueprints.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><Button className="justify-self-start" disabled={busy || !blueprint || name.trim().length < 2}>Create certificate template</Button>
      </form>
      {notice && <output  className="block text-easy">{notice}</output>}<LoadError error={templates.error || issued.error || blueprints.error} retry={() => { void templates.mutate(); void blueprints.mutate(); return issued.mutate(); }} />
      <ul className="space-y-2" aria-label="Certificate templates">{templates.data?.map((t) => <li key={t.id}>{t.name}</li>)}</ul>
      <h3 className="font-semibold">Issued certificates</h3>{issued.data?.length === 0 && <p className="text-text-2">No certificates have been issued yet.</p>}{issued.data?.map((c) => <div key={c.id} className="flex flex-wrap items-center gap-3 border-b border-border py-3"><div className="flex-1 min-w-0"><CertificateRow certificate={c} /></div>{!c.revokedAt && <Button variant="ghost" disabled={busy} onClick={async () => { if (!(await confirm({ title: `Revoke ${c.title} for ${c.user?.name ?? "this learner"}?`, confirmLabel: "Revoke certificate", danger: true }))) { return; } setBusy(true); try { await action(`${base}/certificates/${c.id}/revoke`, { method: "POST" }); await issued.mutate(); await mine.mutate(); } catch { /* toasted */ } finally { setBusy(false); } }}>Revoke certificate</Button>}</div>)}
    </section>}
  </div>;
}
function CertificateRow({ certificate: c }: Readonly<{ certificate: Certificate }>) {
  return <div className="py-2"><p className="font-medium">{c.title}{c.user && ` — ${c.user.name}`}</p>{c.revokedAt ? <Badge tone="hard">Revoked</Badge> : <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href={`/verify/${c.verificationCode}`}>View and verify certificate</Link>}</div>;
}
