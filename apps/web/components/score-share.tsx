"use client";
/**
 * Share my EYF Score — turns the readiness score into a public object.
 *
 * POST /score/share freezes a SERVER-computed snapshot behind a code; this
 * modal then offers the verify link, a native share, and a 1200x630 PNG card
 * (drawn on canvas — no deps) sized for LinkedIn/WhatsApp previews.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";
import { Icons } from "@/components/icons";

type Snapshot = {
  overall: number;
  band: string;
  pillars: { key: string; label: string; score: number; weight: number }[];
  name: string;
  college: string | null;
  graduationYear: number | null;
  targetRole: string | null;
  targetCompany: string | null;
};

type ShareData = { code: string; issuedAt: string; snapshot: Snapshot };

export function ScoreShare() {
  const act = useApiAction();
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState<ShareData | null>(null);

  const create = async () => {
    setBusy(true);
    try {
      setShare(await act<ShareData>("/score/share", { method: "POST" }));
    } catch {
      /* toast handled by useApiAction */
    } finally {
      setBusy(false);
    }
  };

  const url = share ? `${window.location.origin}/score/${share.code}` : "";

  return (
    <>
      <Button variant="secondary" size="sm" onClick={create} disabled={busy} className="mt-5">
        <Icons.sparkle width={14} height={14} />
        {busy ? "Generating…" : "Share my EYF Score"}
      </Button>

      {share && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShare(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card-lg text-left" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold">Your EYF Score is live</h3>
            <p className="text-text-3 text-sm mt-1">
              Anyone with this link sees a <span className="text-text-1">verified, EYF-computed</span> snapshot of your score — recruiters can trust it.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
              <span className="text-sm text-text-2 truncate flex-1 font-mono">{url}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { void navigator.clipboard.writeText(url); toast.success("Link copied"); }}
              >
                Copy
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="primary" onClick={() => downloadCard(share)}>Download card</Button>
              {typeof navigator !== "undefined" && "share" in navigator ? (
                <Button
                  variant="secondary"
                  onClick={() => void navigator.share({ title: `My EYF Score: ${share.snapshot.overall}/100`, url }).catch(() => undefined)}
                >
                  Share…
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setShare(null)}>Done</Button>
              )}
            </div>

            <p className="text-text-4 text-xs mt-4">
              The snapshot is frozen at {share.snapshot.overall}/100 — share a new one as your score climbs.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/** Draw the 1200x630 share card and trigger a download. Monochrome + the one
 *  brand red, per the design system — no gradients, no decoration. */
function downloadCard(share: ShareData) {
  const s = share.snapshot;
  const W = 1200, H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const font = (px: number, weight = 400) => `${weight} ${px}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  const mono = (px: number) => `500 ${px}px ui-monospace, "SF Mono", Menlo, monospace`;

  // Canvas + hairline frame
  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#262626";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // Brand mark (the one red element) + label
  ctx.fillStyle = "#F5F5F5";
  ctx.font = font(34, 700);
  ctx.fillText("EYF", 72, 100);
  ctx.fillStyle = "#E8192C";
  ctx.fillText(".", 138, 100);
  ctx.fillStyle = "#8A8A8A";
  ctx.font = mono(16);
  ctx.fillText("VERIFIED PLACEMENT READINESS", 72, 128);

  // Giant score
  ctx.fillStyle = "#F5F5F5";
  ctx.font = font(190, 700);
  ctx.fillText(String(s.overall), 72, 350);
  const scoreW = ctx.measureText(String(s.overall)).width;
  ctx.fillStyle = "#787878";
  ctx.font = font(40, 500);
  ctx.fillText("/100", 72 + scoreW + 14, 348);

  ctx.fillStyle = "#F5F5F5";
  ctx.font = font(32, 600);
  ctx.fillText(s.band, 72, 416);

  // Who
  ctx.fillStyle = "#A8A8A8";
  ctx.font = font(22);
  const who = [s.name, s.college, s.graduationYear ? `Class of ${s.graduationYear}` : null].filter(Boolean).join("  ·  ");
  ctx.fillText(who, 72, 470);

  // Pillar bars, right column
  const bx = 700, bw = 420;
  s.pillars.slice(0, 6).forEach((p, i) => {
    const y = 120 + i * 62;
    ctx.fillStyle = "#A8A8A8";
    ctx.font = font(18, 500);
    ctx.fillText(p.label, bx, y);
    ctx.fillStyle = "#787878";
    ctx.font = mono(16);
    const num = String(p.score);
    ctx.fillText(num, bx + bw - ctx.measureText(num).width, y);
    ctx.fillStyle = "#222222";
    ctx.fillRect(bx, y + 12, bw, 8);
    ctx.fillStyle = "#F5F5F5";
    ctx.fillRect(bx, y + 12, Math.max(6, (bw * p.score) / 100), 8);
  });

  // Verify line
  ctx.fillStyle = "#787878";
  ctx.font = mono(18);
  ctx.fillText(`Verify: ${window.location.origin.replace(/^https?:\/\//, "")}/score/${share.code}`, 72, 556);

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `eyf-score-${s.overall}.png`;
  a.click();
}
