"use client";

/**
 * AntigravityBackground — a tilted, slowly-rotating ring of thousands of glowing
 * particle points, meant to sit behind hero content.
 *
 * - One THREE.Points + a custom ShaderMaterial (no per-particle meshes).
 * - Gaussian radial density → dense at the ring radius, fading to the centre
 *   and outer edge (no hard boundary).
 * - Per-particle organic drift (layered sines) + slow whole-ring rotation.
 * - Soft mouse parallax on tilt + a gentle repulsion field near the cursor.
 * - Freezes under prefers-reduced-motion; pauses the render loop when scrolled
 *   out of view or when the tab is hidden.
 *
 * Browser-only (WebGL). Load it with next/dynamic + { ssr: false } — see the
 * usage note at the bottom of this file.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useScroll, useSpring, type MotionValue } from "framer-motion";
import * as THREE from "three";

// Projects the normalised cursor (-1..1) onto the ring plane for the repulsion
// field. This factor is IMPLICITLY COUPLED to the Canvas camera distance/FOV
// (see the `camera` prop below): it's tuned so the world-space cursor point
// tracks the on-screen cursor. Changing the camera position or fov requires
// re-tuning this constant to preserve the repulsion feel.
const MOUSE_PROJECTION_SCALE = 1.3;

// ── Shaders ──────────────────────────────────────────────────────────
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3  uMouse;        // world-space point on the ring plane
  uniform float uRepelRadius;
  uniform float uRepelStrength;
  uniform float uReduced;      // 1.0 → freeze drift + repulsion
  uniform float uDisperse;     // scroll-driven radial scatter (0 = cohered)

  attribute float aSize;
  attribute float aPhase;
  attribute float aOpacity;
  attribute float aColorVar;

  varying float vOpacity;
  varying float vColorVar;

  void main() {
    vec3 pos = position;

    // organic per-particle drift — layered sines keyed to a random phase so the
    // cloud breathes instead of rotating like a rigid disc
    float mot = 1.0 - uReduced;
    vec3 drift = vec3(
      sin(uTime * 0.30 + aPhase),
      sin(uTime * 0.42 + aPhase * 1.7),
      cos(uTime * 0.37 + aPhase * 0.9)
    ) * 0.6 * mot;
    pos += drift;

    // scroll-driven radial dispersion — scatter the ring outward (fracture) and
    // let it re-cohere; per-particle variance keeps it organic, not a uniform scale
    pos += normalize(pos + vec3(0.0, 0.0, 1e-4)) * uDisperse * (0.5 + aColorVar);

    // soft repulsion in the ring plane near the projected cursor
    vec2 toMouse = pos.xz - uMouse.xz;
    float d = length(toMouse);
    float push = smoothstep(uRepelRadius, 0.0, d) * uRepelStrength * mot;
    pos.xz += normalize(toMouse + 1e-4) * push;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // size attenuation by distance from the camera
    gl_PointSize = aSize * uSize * uPixelRatio * (30.0 / max(-mv.z, 0.1));

    vOpacity  = aOpacity;
    vColorVar = aColorVar;
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3  uColor;
  uniform float uOpacity;

  varying float vOpacity;
  varying float vColorVar;

  void main() {
    // soft circular point: radial alpha falloff, not a square dot
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.0, d);
    if (alpha <= 0.001) discard;

    // slight brightness variance within the one accent hue
    vec3 color = uColor * (0.75 + 0.5 * vColorVar);
    gl_FragColor = vec4(color, alpha * vOpacity * uOpacity);
  }
`;

// standard-normal sample (Box–Muller) — used for the radial density falloff
function gaussian(): number {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

// gaussian bump centred at `c` with half-width `w` — a smooth 0→1→0 swell used to
// key the scroll-driven dispersion to specific points down the page.
function bumpAt(x: number, c: number, w: number): number {
  const t = (x - c) / w;
  return Math.exp(-t * t);
}

// NB: named smoothstepJS (not smoothstep) to stay disambiguated from GLSL's
// built-in smoothstep() used inside the shader template strings above — so this
// helper can't be conflated with the shader function if those strings are ever
// extracted to .glsl files, and it stays safe to import elsewhere.
function smoothstepJS(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// ── The ring (inside the R3F canvas) ─────────────────────────────────
type RingProps = {
  count: number;
  color: string;
  ringRadius: number;
  ringThickness: number;
  rotationSpeed: number;
  reduced: boolean;
  interactive: boolean;
  additive: boolean;
  particleSize: number;
  scroll: MotionValue<number> | null;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
};

function ParticleRing({
  count,
  color,
  ringRadius,
  ringThickness,
  rotationSpeed,
  reduced,
  interactive,
  additive,
  particleSize,
  scroll,
  mouse,
}: RingProps) {
  const tiltRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);
  const mouseWorld = useRef(new THREE.Vector3());
  const baseTilt = -1.02; // radians — view the ring as an ellipse, not flat-on

  // buffers — regenerated only when the shape params change
  const { positions, sizes, phases, opacities, colorVars } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const opacities = new Float32Array(count);
    const colorVars = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = ringRadius + gaussian() * ringThickness; // dense at radius, fading
      const y = gaussian() * ringThickness * 0.35; // thin vertical spread
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
      sizes[i] = 0.5 + Math.random() * 1.6;
      phases[i] = Math.random() * Math.PI * 2;
      opacities[i] = 0.28 + Math.random() * 0.72;
      colorVars[i] = Math.random();
    }
    return { positions, sizes, phases, opacities, colorVars };
  }, [count, ringRadius, ringThickness]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: particleSize },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uMouse: { value: new THREE.Vector3() },
      uRepelRadius: { value: ringRadius * 0.5 },
      uRepelStrength: { value: ringThickness * 0.9 },
      uReduced: { value: reduced ? 1 : 0 },
      uDisperse: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // keep colour / reduced / repel in sync if props change
  useEffect(() => {
    uniforms.uColor.value.set(color);
    uniforms.uReduced.value = reduced ? 1 : 0;
    uniforms.uRepelRadius.value = ringRadius * 0.5;
    uniforms.uRepelStrength.value = ringThickness * 0.9;
    uniforms.uSize.value = particleSize;
  }, [color, reduced, ringRadius, ringThickness, particleSize, uniforms]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05); // clamp after a tab-pause so nothing jumps
    const k = 1 - Math.pow(0.001, d); // frame-rate-independent damping
    if (!reduced) {
      time.current += d;
      uniforms.uTime.value = time.current;
      if (spinRef.current) spinRef.current.rotation.y += rotationSpeed * d * 60;
    }

    // scroll-driven morph: every section gets its own signature, all eased (no
    // snapping). Two dispersion swells — the ring scatters through the fracture,
    // draws back into a tight halo for the ascent gauge, blooms again under the
    // proof, then settles and recedes so the dense pricing content stays clean.
    let s = 0;
    let disp = 0;
    if (scroll) {
      s = scroll.get();
      const scatter = bumpAt(s, 0.20, 0.14); // fracture: fragments fly apart
      const bloom = bumpAt(s, 0.66, 0.12) * 0.55; // proof: a softer second breath, decays before the meters
      disp = reduced ? 0 : (scatter + bloom) * ringThickness * 1.7;
      // vivid through hero + gauge, then recede hard behind the dense lower content
      // (pillars meters, pricing cards); dip while dispersed so dust never fights copy
      const fade = smoothstepJS(0.5, 0.92, s) * 0.62;
      const targetOp = 0.92 - fade - Math.min(disp / (ringThickness * 1.7), 1) * 0.12;
      // Both lines below are a standard damped-lerp toward a target, NOT an
      // accumulator: value += (target - value) * k. Don't "fix" the `+=` away.
      // NB: this damps a second time on top of the smoothScroll spring (see its
      // declaration) — intentional double-smoothing. If the morph ever feels
      // laggy, stiffen the useSpring config or raise k's rate; do not add more.
      uniforms.uDisperse.value += (disp - uniforms.uDisperse.value) * k;
      uniforms.uOpacity.value += (targetOp - uniforms.uOpacity.value) * k;
    }

    if (tiltRef.current) {
      const scrollTiltX = scroll ? -s * 0.45 : 0;
      const scrollTiltZ = scroll ? s * 0.4 : 0;
      const mx = interactive && !reduced ? mouse.current.x : 0;
      const my = interactive && !reduced ? mouse.current.y : 0;
      tiltRef.current.rotation.x += (baseTilt + scrollTiltX + my * 0.16 - tiltRef.current.rotation.x) * k;
      tiltRef.current.rotation.y += (mx * 0.22 - tiltRef.current.rotation.y) * k;
      tiltRef.current.rotation.z += (scrollTiltZ - tiltRef.current.rotation.z) * k;
      // subtle breath: the ring swells slightly as it scatters, settles as it coheres
      const targetScale = scroll ? 1 + disp / (ringThickness * 1.7) * 0.06 : 1;
      const sc = tiltRef.current.scale.x + (targetScale - tiltRef.current.scale.x) * k;
      tiltRef.current.scale.setScalar(sc);
    }

    if (interactive && !reduced) {
      // MOUSE_PROJECTION_SCALE is coupled to the camera distance/FOV — see its
      // definition at the top of the file before changing the camera framing.
      mouseWorld.current.set(
        mouse.current.x * ringRadius * MOUSE_PROJECTION_SCALE,
        0,
        -mouse.current.y * ringRadius * MOUSE_PROJECTION_SCALE,
      );
      uniforms.uMouse.value.lerp(mouseWorld.current, 0.08);
    }
  });

  return (
    <group ref={tiltRef} rotation={[baseTilt, 0, 0]}>
      <points ref={spinRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
          <bufferAttribute attach="attributes-aOpacity" args={[opacities, 1]} />
          <bufferAttribute attach="attributes-aColorVar" args={[colorVars, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        />
      </points>
    </group>
  );
}

// ── Public component ─────────────────────────────────────────────────
export type AntigravityBackgroundProps = {
  particleColor?: string;
  particleCount?: number;
  ringRadius?: number;
  ringThickness?: number;
  rotationSpeed?: number;
  backgroundTransparent?: boolean;
  /** Additive glow (default, for dark grounds) vs normal blending (for light grounds). */
  additive?: boolean;
  /** position: fixed full-viewport (default) vs absolute (scoped to a relative parent). */
  fixed?: boolean;
  /** base point size in px (before distance attenuation). */
  particleSize?: number;
  /** morph the ring (dispersion / tilt / opacity) from the page's scroll progress. */
  scrollDriven?: boolean;
  className?: string;
};

export default function AntigravityBackground({
  particleColor = "#4A7CFF",
  particleCount = 2000,
  ringRadius = 6,
  ringThickness = 1.6,
  rotationSpeed = 0.0005,
  backgroundTransparent = true,
  additive = true,
  fixed = true,
  particleSize = 7,
  scrollDriven = false,
  className,
}: AntigravityBackgroundProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });

  // global page scroll → spring-smoothed, drives the per-section morph.
  // NOTE: this is the FIRST of two smoothing layers — the morph targets derived
  // from this value are damped again per-frame in useFrame (the `k` lerp). That
  // double-smoothing is deliberate but can add latency; if the scroll morph ever
  // feels laggy, stiffen this spring (higher stiffness / lower mass) or raise k's
  // rate — do not stack a third layer of smoothing on top.
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 0.6 });

  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [inView, setInView] = useState(true);
  const [visible, setVisible] = useState(true);

  // env detection (post-mount → no SSR mismatch)
  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const applyReduced = () => setReduced(mq.matches);
    const applyTouch = () => setIsTouch(coarse.matches);
    applyReduced();
    applyTouch();
    mq.addEventListener("change", applyReduced);
    coarse.addEventListener("change", applyTouch);
    return () => {
      mq.removeEventListener("change", applyReduced);
      coarse.removeEventListener("change", applyTouch);
    };
  }, []);

  // pause when scrolled out of view
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setInView(entries[0]?.isIntersecting ?? true), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // pause when the tab is hidden
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // cursor tracking (desktop only)
  useEffect(() => {
    if (isTouch || reduced) return;
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [isTouch, reduced]);

  const count = isTouch ? Math.floor(particleCount * 0.5) : particleCount;
  // Drives the Canvas frameloop only. Unrelated to any GLSL variable in the
  // shader strings (which has its own `mot`/dispersion state) — don't conflate.
  const isAnimating = inView && visible && !reduced;

  return (
    // Decorative-only layer: purely visual, no semantic content, pointer-events
    // disabled. The ref exists solely for the IntersectionObserver (render-loop
    // pause) — it isn't referenced by any parent for layout or non-visual state —
    // so aria-hidden is correct and it's safe to hide from assistive tech.
    <div
      ref={wrapRef}
      aria-hidden
      className={className}
      style={{
        position: fixed ? "fixed" : "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: backgroundTransparent ? "transparent" : "#05060a",
      }}
    >
      {mounted && (
        <Canvas
          // 'always' animates; 'demand' renders once (static ring for reduced /
          // holds the last frame while paused) — keeps the GPU idle when hidden
          frameloop={isAnimating ? "always" : "demand"}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          camera={{ position: [0, ringRadius * 0.72, ringRadius * 1.95], fov: 55 }}
        >
          <ParticleRing
            count={count}
            color={particleColor}
            ringRadius={ringRadius}
            ringThickness={ringThickness}
            rotationSpeed={rotationSpeed}
            reduced={reduced}
            interactive={!isTouch}
            additive={additive}
            particleSize={particleSize}
            scroll={scrollDriven ? smoothScroll : null}
            mouse={mouse}
          />
        </Canvas>
      )}
    </div>
  );
}

/*
USAGE — drop behind hero content (Three.js needs the browser, so load client-only):

  // app/page.tsx  (or any page/section)
  import dynamic from "next/dynamic";

  const AntigravityBackground = dynamic(
    () => import("@/components/AntigravityBackground"),
    { ssr: false },
  );

  export default function Page() {
    return (
      <section className="relative min-h-screen overflow-hidden bg-[#05060a] text-white">
        <AntigravityBackground particleColor="#4A7CFF" particleCount={2000} />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <h1 className="text-6xl font-bold">Your hero content</h1>
        </div>
      </section>
    );
  }

Notes:
- The canvas layer is fixed + pointer-events:none, so it never captures scroll/clicks.
- Keep hero content at a higher stacking level (relative z-10) so it sits above it.
- Pass backgroundTransparent={false} to let it paint its own dark backdrop instead
  of layering over an existing dark section.
- R3F disposes the geometry/material/renderer automatically on unmount.
*/
