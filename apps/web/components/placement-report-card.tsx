"use client";
import { useState } from "react";
import { Card, Button, TextField } from "@eyf/ui";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { useApi, useApiAction } from "@/lib/use-api";

/**
 * Self-report a placement (Proof Loop, docs/PLAN-proof-loop.md). Lets a student record a
 * placement that happened outside EYF's pipeline so it counts toward their college's proof.
 * Explicit DPDP consent is required before we store employer/package details, and the entry
 * is always UNVERIFIED — it never affects any package statistic until an offer letter
 * verifies it. Honesty over vanity: we say so, in the UI.
 */
type SelfReport = {
  id: string;
  companyName: string;
  role: string;
  ctcInr: number | null;
  status: "OFFERED" | "JOINED";
  verified: boolean;
  placedAt: string;
};

export function PlacementReportCard() {
  const { data, mutate } = useApi<SelfReport[]>("/me/placements");
  const act = useApiAction();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [lpa, setLpa] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (company.trim().length < 2 || role.trim().length < 2) {
      toast.error("Add the company and role.");
      return;
    }
    if (!consent) {
      toast.error("Please tick the consent box so we can store your placement.");
      return;
    }
    const lpaNum = lpa.trim() ? Number(lpa) : null;
    if (lpaNum !== null && (!Number.isFinite(lpaNum) || lpaNum < 0)) {
      toast.error("That package figure doesn't look right.");
      return;
    }
    setSaving(true);
    try {
      await act<SelfReport>("/me/placements", {
        method: "POST",
        body: JSON.stringify({
          companyName: company.trim(),
          role: role.trim(),
          ctcInr: lpaNum !== null ? Math.round(lpaNum * 100_000) : null, // LPA → rupees
          consent,
        }),
      });
      toast.success("Recorded. Congratulations on the placement!");
      setCompany(""); setRole(""); setLpa(""); setConsent(false);
      mutate();
    } catch {
      /* useApiAction already surfaced the error */
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-5">
      <div className="flex items-center gap-2">
        <Icons.trophy width={18} height={18} />
        <h2 className="font-display font-bold">Got placed? Tell us</h2>
      </div>
      <p className="text-text-3 text-sm mt-1">
        Record a placement — even one you landed outside EYF. It adds to your college&apos;s verified
        placement proof and helps your juniors see what&apos;s possible.
      </p>

      {data && data.length > 0 && (
        <div className="mt-4 space-y-1">
          {data.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
              <span className="text-text-1">
                {r.role} <span className="text-text-4">· {r.companyName}</span>
              </span>
              <span className="font-mono text-xs text-text-4">{r.verified ? "verified" : "self-reported"}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <TextField label="Company" value={company} onChange={setCompany} placeholder="e.g. Zoho" />
        <TextField label="Role" value={role} onChange={setRole} placeholder="e.g. SDE-1" />
      </div>
      <div className="mt-3">
        <TextField label="Package (₹ LPA, optional)" value={lpa} onChange={setLpa} type="number" placeholder="e.g. 9" hint="Shown only as a band, never your exact figure." />
      </div>

      <label className="mt-3 flex items-start gap-2 text-sm text-text-2">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-accent" />
        <span>I consent to EYF storing my employer, role, and package to include in anonymized college placement stats (DPDP). I can delete this anytime.</span>
      </label>

      <Button className="mt-4" onClick={submit} disabled={saving}>
        {saving ? "Saving…" : "Record placement"}
      </Button>
    </Card>
  );
}
