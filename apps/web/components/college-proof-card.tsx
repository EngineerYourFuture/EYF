"use client";
import { Card } from "@eyf/ui";
import { Icons } from "@/components/icons";
import { useApi } from "@/lib/use-api";

/**
 * Student-facing placement proof (Proof Loop, docs/PLAN-proof-loop.md). Shows what verified
 * alumni from the student's OWN college achieved — proof the training pays off, aimed at the
 * ~95% who won't crack the internship top-N and need a reason to stay.
 *
 * Deliberately constrained: strictly DESCRIPTIVE and past-tense (never "you will be placed"),
 * aggregate-only, k-anonymity floored server-side, packages as bands. Proof as hope, not a
 * promise and not pressure. Renders nothing until a cohort clears the privacy floor.
 */
type ProofData = {
  college: string | null;
  proof: { placed: number; companies: string[]; medianPackageBand: string | null } | null;
};

export function CollegeProofCard() {
  const { data } = useApi<ProofData>("/me/placement-proof");
  if (!data?.college) return null; // no college on file → nothing to show
  const { proof, college } = data;

  return (
    <Card className="mt-5">
      <div className="flex items-center gap-2">
        <Icons.trophy width={18} height={18} />
        <h2 className="font-display font-bold">From {college}</h2>
      </div>

      {!proof ? (
        <p className="text-text-3 text-sm mt-1">
          We&apos;re gathering verified placement results for your college. As alumni report where they
          landed, you&apos;ll see the companies and packages your batch reached here.
        </p>
      ) : (
        <div className="mt-2">
          <p className="text-text-2 text-sm">
            <span className="font-semibold text-text-1">{proof.placed}</span> verified alumni from your
            college have been placed
            {proof.medianPackageBand && (
              <> — median package <span className="font-semibold text-text-1">{proof.medianPackageBand}</span></>
            )}.
          </p>
          {proof.companies.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-text-4 mb-1">Where they went</p>
              <div className="flex flex-wrap gap-2">
                {proof.companies.map((c) => (
                  <span key={c} className="rounded-full border border-accent/30 bg-accent-tint px-3 py-1 text-xs text-text-1">{c}</span>
                ))}
              </div>
            </div>
          )}
          <p className="text-text-4 text-xs mt-3">
            Past results from verified alumni, shown in anonymized bands. Not a prediction or a guarantee.
          </p>
        </div>
      )}
    </Card>
  );
}
