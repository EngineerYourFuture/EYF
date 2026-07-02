"use client";
/**
 * Immersive light 3D background — a perspective grid corridor (floor + ceiling)
 * in soft grey lines on white, receding to a horizon and drifting toward the
 * viewer. Clean, Apple/Google-light. CSS 3D transforms (no WebGL).
 */
import { motion, useReducedMotion } from "framer-motion";

// Soft grey grid lines (dark on white — the Apple-light grid look).
const GRID =
  "linear-gradient(rgba(20,22,30,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,22,30,0.5) 1px, transparent 1px)";

export function LandingBackground() {
  const reduce = useReducedMotion();
  const drift = reduce ? {} : { backgroundPositionY: ["0px", "80px"] };
  const driftT = { duration: 3.2, repeat: Infinity, ease: "linear" as const };

  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-bg">
      {/* 3D perspective corridor — floor + ceiling grids receding to a horizon. */}
      <div className="absolute inset-0" style={{ perspective: "600px", perspectiveOrigin: "50% 50%" }}>
        <motion.div
          className="absolute left-[-50%] right-[-50%] bottom-[-30%] h-[130%] opacity-[0.22]"
          style={{
            transformOrigin: "50% 100%",
            transform: "rotateX(76deg)",
            backgroundImage: GRID,
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to top, black 0%, transparent 72%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 72%)",
          }}
          animate={drift}
          transition={driftT}
        />
        <motion.div
          className="absolute left-[-50%] right-[-50%] top-[-30%] h-[130%] opacity-[0.12]"
          style={{
            transformOrigin: "50% 0%",
            transform: "rotateX(-76deg)",
            backgroundImage: GRID,
            backgroundSize: "80px 80px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 72%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 72%)",
          }}
          animate={drift}
          transition={driftT}
        />
      </div>

      {/* Soft cool horizon wash — a whisper of colour so the white isn't clinical. */}
      <div
        className="absolute left-1/2 top-1/2 h-[55vh] w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
        style={{ background: "radial-gradient(ellipse, rgba(120,140,200,0.10), transparent 68%)" }}
      />
      {/* Gentle edge vignette (light). */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 42%, transparent 55%, rgba(20,22,30,0.05))" }} />
    </div>
  );
}
