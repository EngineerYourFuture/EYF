"use client";
import dynamic from "next/dynamic";

// WebGL is browser-only — load client-side. One persistent ring behind the whole
// page; it morphs from the page's scroll so every section sees a distinct state.
const AntigravityBackground = dynamic(() => import("@/components/AntigravityBackground"), { ssr: false });

export function RingBackdrop() {
  return (
    <AntigravityBackground
      scrollDriven
      fixed
      additive={false}
      particleColor="#EB2637"
      particleCount={2600}
      ringRadius={7}
      ringThickness={1.4}
      particleSize={4.2}
    />
  );
}
