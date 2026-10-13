"use client";
import { countLabel } from "./roles";
import { useState } from "react";
import { Button, Badge, SkeletonRows } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { fieldClass, LoadError } from "./shared";

type FollowUp = { status: string; note: string; dueAt: string | null; overdue: boolean };
type Row = { enrollmentId: string; member: { name: string; email: string }; progressPct: number; stuckFlag: boolean; eligibility: { eligible: boolean; reasons: string[] }; followUp: FollowUp };
type Report = { cohort: { driveTitle: string | null; driveDeadline: string | null; minimumProgress: number }; rows: Row[]; funnel: { enrolled: number; completed: number; stuck: number; eligible: number } };
type Preview = { rows: { row: number; email: string; status: string }[]; previewHash: string; ready: number; enrolled: number };
const statusLabel: Record<string, string> = { ready: "Ready to enroll", enrolled: "Already enrolled", unavailable: "Invite or check access", invalid: "Invalid email or columns", duplicate: "Duplicate in CSV" };
function download(filename: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function localDate(value: string | null) { if (!value) { return ""; } const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }

export function CohortOperations({ orgId, cohortId, canEditDrive, onEnrolled }: Readonly<{ orgId: string; cohortId: string; canEditDrive: boolean; onEnrolled: () => Promise<unknown> }>) {
  const base = `/orgs/${orgId}/cohorts/${cohortId}`;
  const action = useApiAction();
  const report = useApi<Report>(`${base}/funnel`);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  async function run(fn: () => Promise<string>) { setBusy(true); setNotice(""); try { setNotice(await fn()); } catch { /* action displays validation */ } finally { setBusy(false); } }
  return <section className="space-y-7 border-t border-border pt-6" aria-label="Cohort operations">
    {notice && <output  className="block text-text-1 font-medium">{notice}</output>}
    <details className="group">
      <summary className="min-h-11 cursor-pointer font-semibold">Import learners from CSV</summary>
      <div className="mt-3 space-y-4">
        <p className="text-sm text-text-2 max-w-prose">Use an <strong>email</strong> column, with up to 500 learners per file. This enrolls active members you can manage. Invite new members from People first, then import after they join.</p>
        <Button variant="ghost" onClick={() => download("enrollment-template.csv", "email\r\nlearner@example.com\r\n")}>Download CSV template</Button>
        <label className="block">CSV file<input className={`${fieldClass} mt-1`} type="file" accept=".csv,text/csv" disabled={busy} onChange={async (e) => { setPreview(null); setNotice(""); const file = e.target.files?.[0]; if (!file) { return; } if (file.size > 200_000) { setNotice("Choose a CSV smaller than 200 KB."); return; } try { setCsv(await file.text()); } catch { setNotice("Could not read this file. Choose it again."); } }} /></label>
        <label className="block">CSV contents<textarea className={`${fieldClass} mt-1 font-mono text-sm`} rows={4} maxLength={200_000} value={csv} placeholder={"email\nlearner@example.com"} disabled={busy} onChange={(e) => { setCsv(e.target.value); setPreview(null); }} /></label>
        <Button variant="secondary" disabled={busy || !csv.trim()} onClick={() => void run(async () => { setPreview(await action<Preview>(`${base}/import`, { method: "POST", body: JSON.stringify({ csv }) })); return "Preview ready. Only rows marked ready will be enrolled."; })}>Preview import</Button>
        {preview && <div className="space-y-3"><p>{preview.ready} ready to enroll · {preview.rows.length} rows checked</p><div className="max-h-72 overflow-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Enrollment preview</caption><thead><tr><th className="p-2">Row</th><th className="p-2">Email</th><th className="p-2">Result</th></tr></thead><tbody>{preview.rows.map((r) => <tr className="border-t border-border" key={r.row}><td className="p-2 tabular-nums">{r.row}</td><td className="p-2 break-all">{r.email || "Missing email"}</td><td className="p-2">{statusLabel[r.status]}</td></tr>)}</tbody></table></div><Button disabled={busy || !preview.ready} onClick={() => void run(async () => { const result = await action<Preview>(`${base}/import`, { method: "POST", body: JSON.stringify({ csv, commit: true, previewHash: preview.previewHash }) }); setPreview(null); await Promise.all([report.mutate(), onEnrolled()]); return `${countLabel(result.enrolled, "learner")} enrolled.`; })}>Enroll {countLabel(preview.ready, "learner")}</Button></div>}
      </div>
    </details>
    <LoadError error={report.error} retry={report.mutate} />
    {report.isLoading && <SkeletonRows rows={3} />}
    {report.data && <>
      <DriveForm key={JSON.stringify(report.data.cohort)} initial={report.data.cohort} disabled={!canEditDrive} save={(data) => run(async () => { await action(`${base}/drive`, { method: "PATCH", body: JSON.stringify(data) }); await report.mutate(); return "Drive criteria saved."; })} busy={busy} />
      <div className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-semibold">Learner follow-up</h3><p className="mt-1 text-sm text-text-2">{report.data.funnel.enrolled} enrolled · {report.data.funnel.completed} completed · {report.data.funnel.eligible} meet course criteria</p></div><Button variant="secondary" disabled={busy} onClick={() => void run(async () => { const result = await action<{ filename: string; csv: string }>(`${base}/export`); download(result.filename, result.csv); return "Report downloaded."; })}>Download progress CSV</Button></div>
        <label className="block max-w-xs">Show learners<select className={`${fieldClass} mt-1`} value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All learners</option><option value="attention">Need attention or overdue</option><option value="eligible">Meet course criteria</option><option value="ineligible">Below course criteria</option></select></label>
        <ul className="divide-y divide-border">{report.data.rows.filter((r) => matchesFilter(r, filter)).map((r) => <li key={r.enrollmentId} className="py-5 space-y-3"><div className="flex flex-wrap gap-3 items-start"><div className="flex-1 min-w-0"><p className="font-medium">{r.member.name}</p><p className="text-sm text-text-2 break-all">{r.member.email}</p></div><span className="tabular-nums">{r.progressPct}% complete</span>{r.stuckFlag && <Badge tone="medium">Needs attention</Badge>}{r.followUp.overdue && <Badge tone="medium">Follow-up overdue</Badge>}</div><p className="text-sm text-text-2">{r.eligibility.eligible ? "Meets the configured course criteria." : r.eligibility.reasons.join(" ")}</p><FollowUpForm key={JSON.stringify(r.followUp)} row={r} busy={busy} save={(data) => run(async () => { await action(`${base}/follow-ups/${r.enrollmentId}`, { method: "PATCH", body: JSON.stringify(data) }); await report.mutate(); return "Follow-up saved."; })} /></li>)}</ul>
        {report.data.rows.length === 0 && <p className="text-text-2">Enroll learners to see progress and plan follow-ups.</p>}
      </div>
    </>}
  </section>;
}

function DriveForm({ initial, disabled, busy, save }: Readonly<{ initial: Report["cohort"]; disabled: boolean; busy: boolean; save: (data: Report["cohort"]) => Promise<void> }>) {
  const [title, setTitle] = useState(initial.driveTitle ?? ""), [deadline, setDeadline] = useState(localDate(initial.driveDeadline)), [minimum, setMinimum] = useState(initial.minimumProgress);
  return <details><summary className="font-semibold cursor-pointer min-h-11">Placement drive criteria{initial.driveTitle ? ` — ${initial.driveTitle}` : ""}</summary><form className="mt-3 space-y-4" onSubmit={(e) => { e.preventDefault(); void save({ driveTitle: title.trim() || null, driveDeadline: deadline ? new Date(deadline).toISOString() : null, minimumProgress: minimum }); }}><p className="text-sm text-text-2 max-w-prose">Course completion is the only eligibility rule here. Employer requirements and hiring decisions still need staff review. A deadline counts lessons completed on or before that time.</p><fieldset disabled={disabled || busy} className="grid gap-4 sm:grid-cols-2"><label>Drive name (optional)<input className={`${fieldClass} mt-1`} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></label><label>Minimum program completion (%)<input type="number" min={0} max={100} required className={`${fieldClass} mt-1`} value={minimum} onChange={(e) => setMinimum(Number(e.target.value))} /></label><label>Completion deadline (local time, optional)<input type="datetime-local" className={`${fieldClass} mt-1`} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label><Button className="justify-self-start self-end">Save drive criteria</Button></fieldset>{disabled && <p className="text-sm text-text-2">An organization administrator can change these criteria.</p>}</form></details>;
}
function FollowUpForm({ row, busy, save }: Readonly<{ row: Row; busy: boolean; save: (data: { status: string; note: string; dueAt: string | null }) => Promise<void> }>) {
  const [status, setStatus] = useState(row.followUp.status), [note, setNote] = useState(row.followUp.note), [due, setDue] = useState(localDate(row.followUp.dueAt));
  return <details><summary className="text-sm cursor-pointer min-h-11">Follow-up for {row.member.name}{status !== "NONE" ? ` · ${status.toLowerCase()}` : ""}</summary><form className="grid sm:grid-cols-2 gap-3 pt-2" onSubmit={(e) => { e.preventDefault(); void save({ status, note, dueAt: due ? new Date(due).toISOString() : null }); }}><label>Status<select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>{["NONE", "OPEN", "CONTACTED", "RESOLVED"].map((s) => <option key={s} value={s}>{s === "NONE" ? "No follow-up" : s.charAt(0) + s.slice(1).toLowerCase()}</option>)}</select></label><label>Due (local time)<input type="datetime-local" className={`${fieldClass} mt-1`} value={due} onChange={(e) => setDue(e.target.value)} /></label><label className="sm:col-span-2">Staff note<textarea className={`${fieldClass} mt-1`} rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} /></label><p className="text-sm text-text-2 sm:col-span-2">Visible to authorized staff. Saving a follow-up does not send a message to the learner.</p><Button variant="secondary" className="justify-self-start" disabled={busy}>Save follow-up</Button></form></details>;
}

function matchesFilter(row: Row, filter: string) {
  if (filter === "all") return true;
  if (filter === "attention") return row.stuckFlag || row.followUp.overdue;
  return filter === "eligible" ? row.eligibility.eligible : !row.eligibility.eligible;
}
