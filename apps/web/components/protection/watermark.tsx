"use client";
/**
 * Forensic watermark — tiles the signed-in user's email faintly across the
 * viewport (fixed, pointer-events-none, non-selectable). It does NOT prevent a
 * screenshot (nothing on the web can), but any leaked screenshot/recording is
 * traceable to the exact account — the real deterrent against content leaks.
 */
import { useApi } from "@/lib/use-api";

type Me = { user?: { email?: string; id?: string } };

export function Watermark() {
  const { data } = useApi<Me>("/me");
  const label = data?.user?.email ?? data?.user?.id;
  if (!label) return null;

  const tile = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='340' height='210'>` +
      `<text x='0' y='120' fill='rgba(140,140,140,0.10)' font-family='ui-monospace,monospace' font-size='13' ` +
      `transform='rotate(-28 170 105)'>${label} · EYF</text></svg>`,
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[45] select-none"
      style={{ backgroundImage: `url("data:image/svg+xml,${tile}")`, backgroundRepeat: "repeat" }}
    />
  );
}
