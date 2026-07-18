/** Labelled form field wrapper shared across the content-management pages. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-text-3 text-xs uppercase tracking-wider">{label}{hint && <span className="text-text-4 normal-case tracking-normal"> · {hint}</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
