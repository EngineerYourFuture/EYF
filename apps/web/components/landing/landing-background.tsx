"use client";
/**
 * Atmospheric monochrome depth behind the landing so the black reads deep and
 * immersive instead of flat/empty. NO neon, NO colored gradients — just a faint
 * white light drifting through fog, a fine grid, film grain, and a vignette.
 * This is the premium-dark technique (Apple/Tesla), not the cheap-AI aurora.
 */
import { motion, useReducedMotion } from "framer-motion";

// Tiny tiled fractal-noise grain (keeps the black from looking flat/plasticky).
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  );

export function LandingBackground() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-bg pointer-events-none">
      {/* Faint drifting light — monochrome, barely there (depth, not decoration). */}
      <motion.div
        className="absolute left-1/2 top-[-15%] h-[85vh] w-[85vh] -translate-x-1/2 rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.055), transparent 62%)" }}
        animate={reduce ? {} : { x: ["-8%", "10%", "-4%"], y: ["0%", "7%", "0%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-12%] top-[45%] h-[60vh] w-[60vh] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03), transparent 60%)" }}
        animate={reduce ? {} : { x: ["0%", "-9%", "3%"], y: ["0%", "-7%", "0%"] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Fine grid — structure + depth. */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 30%, transparent 80%)",
        }}
      />
      {/* Film grain. */}
      <div className="absolute inset-0 opacity-[0.06] mix-blend-soft-light" style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "180px 180px" }} />
      {/* Vignette — pulls focus to the center, deepens the edges. */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 42%, rgba(0,0,0,0.72))" }} />
    </div>
  );
}
