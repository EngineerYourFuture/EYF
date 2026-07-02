"use client";
/**
 * Immersive monochrome 3D background — a perspective grid corridor (floor +
 * ceiling) that recedes to a horizon and drifts toward the viewer, plus a faint
 * drifting light, film grain, and a vignette. Built with CSS 3D transforms (no
 * WebGL) so it renders everywhere and stays crisp. NO neon, NO colored gradients.
 */
import { motion, useReducedMotion } from "framer-motion";

const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  );

const GRID =
  "linear-gradient(rgba(255,255,255,0.85) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.85) 1px, transparent 1px)";

export function LandingBackground() {
  const reduce = useReducedMotion();
  const drift = reduce ? {} : { backgroundPositionY: ["0px", "80px"] };
  const driftT = { duration: 3.2, repeat: Infinity, ease: "linear" as const };

  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* 3D perspective corridor — floor + ceiling grids receding to a horizon. */}
      <div className="absolute inset-0" style={{ perspective: "600px", perspectiveOrigin: "50% 50%" }}>
        <motion.div
          className="absolute left-[-50%] right-[-50%] bottom-[-30%] h-[130%] opacity-[0.32]"
          style={{
            transformOrigin: "50% 100%",
            transform: "rotateX(76deg)",
            backgroundImage: GRID,
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to top, black 0%, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 70%)",
          }}
          animate={drift}
          transition={driftT}
        />
        <motion.div
          className="absolute left-[-50%] right-[-50%] top-[-30%] h-[130%] opacity-[0.18]"
          style={{
            transformOrigin: "50% 0%",
            transform: "rotateX(-76deg)",
            backgroundImage: GRID,
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
          }}
          animate={drift}
          transition={driftT}
        />
      </div>

      {/* Horizon glow where the grids meet — sense of infinite distance. */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[50vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.06), transparent 65%)" }}
        animate={reduce ? {} : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Film grain + vignette. */}
      <div className="absolute inset-0 opacity-[0.06] mix-blend-soft-light" style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "180px 180px" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55))" }} />
    </div>
  );
}
