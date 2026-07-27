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
 * Implemented in vanilla three.js (imperative renderer + a managed rAF loop) —
 * NOT react-three-fiber. r3f v8 bundles react-reconciler@0.27, which reaches into
 * React 18's `__SECRET_INTERNALS…ReactCurrentOwner`; Next 15's App Router client
 * React no longer exposes that export, so r3f v8 throws on mount under Next 15.
 * This component is the only r3f consumer, and it only ever needs a single Points
 * object, so we drive three.js directly and sidestep the version coupling entirely.
 *
 * Browser-only (WebGL). Load it with next/dynamic + { ssr: false } — see the
 * usage note at the bottom of this file.
 */

import { useEffect, useRef, useState } from "react";
import { useScroll, useSpring, type MotionValue } from "framer-motion";
import * as THREE from "three";

// Projects the normalised cursor (-1..1) onto the ring plane for the repulsion
// field. This factor is IMPLICITLY COUPLED to the camera distance/FOV (see the
// PerspectiveCamera set up in the effect below): it's tuned so the world-space
// cursor point tracks the on-screen cursor. Changing the camera position or fov
// requires re-tuning this constant to preserve the repulsion feel.
const MOUSE_PROJECTION_SCALE = 1.3;

/**
 * True when the browser can actually create a WebGL context. Some users block
 * WebGL, run locked-down enterprise browsers, or sit on old hardware — there the
 * renderer throws on mount and crashes the subtree into the error boundary. We
 * detect up front and render a static CSS fallback instead of erroring.
 */
function detectWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

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

// Imperative handle the effect publishes for the React layer to poke at without
// tearing the scene down (colour/size/reduced updates, loop start/stop).
type ThreeHandle = {
  uniforms: {
    uColor: THREE.IUniform<THREE.Color>;
    uReduced: THREE.IUniform<number>;
    uRepelRadius: THREE.IUniform<number>;
    uRepelStrength: THREE.IUniform<number>;
    uSize: THREE.IUniform<number>;
  };
  start: () => void;
  stop: () => void;
  renderOnce: () => void;
};

const baseTilt = -1.02; // radians — view the ring as an ellipse, not flat-on

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
}: Readonly<AntigravityBackgroundProps>) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });

  // global page scroll → spring-smoothed, drives the per-section morph.
  // NOTE: this is the FIRST of two smoothing layers — the morph targets derived
  // from this value are damped again per-frame in the render loop (the `k` lerp).
  // That double-smoothing is deliberate but can add latency; if the scroll morph
  // ever feels laggy, stiffen this spring (higher stiffness / lower mass) or raise
  // k's rate — do not stack a third layer of smoothing on top.
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 0.6 });

  // Imperative bridge + live control values read inside the rAF loop. Kept in refs
  // so toggling reduced-motion / interactivity / visibility never rebuilds the scene.
  const three = useRef<ThreeHandle | null>(null);
  const reducedRef = useRef(false);
  const animatingRef = useRef(false);
  const interactiveRef = useRef(true);
  const scrollDrivenRef = useRef(scrollDriven);
  const rotationSpeedRef = useRef(rotationSpeed);
  const scrollRef = useRef<MotionValue<number> | null>(scrollDriven ? smoothScroll : null);

  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [inView, setInView] = useState(true);
  const [visible, setVisible] = useState(true);
  const [webglOk, setWebglOk] = useState(true);

  // env detection (post-mount → no SSR mismatch)
  useEffect(() => {
    // Set WebGL support before mounting so the renderer never mounts on a browser
    // that can't create a context (both batch into the same render).
    setWebglOk(detectWebGL());
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
  // Gates the render loop only. Unrelated to any GLSL variable in the shader
  // strings (which has its own `mot`/dispersion state) — don't conflate.
  const isAnimating = inView && visible && !reduced;

  // ── three.js scene: built once per structural change; torn down on unmount ──
  // Deps are only the params that change the actual buffers/topology. Colour,
  // size, rotationSpeed, reduced, interactivity and scroll are pushed in live via
  // refs / the sync effect below, so none of them rebuild the scene.
  useEffect(() => {
    const el = wrapRef.current;
    if (!mounted || !webglOk || !el) return;

    const width = Math.max(el.clientWidth, 1);
    const height = Math.max(el.clientHeight, 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // buffers
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

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute("aColorVar", new THREE.BufferAttribute(colorVars, 1));

    const uniforms = {
      uTime: { value: 0 },
      uSize: { value: particleSize },
      uPixelRatio: { value: dpr },
      uColor: { value: new THREE.Color(particleColor) },
      uOpacity: { value: 1 },
      uMouse: { value: new THREE.Vector3() },
      uRepelRadius: { value: ringRadius * 0.5 },
      uRepelStrength: { value: ringThickness * 0.9 },
      uReduced: { value: reducedRef.current ? 1 : 0 },
      uDisperse: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    // tilt group (parallax / scroll tilt / breath) → spinning Points (whole-ring
    // rotation). Mirrors the old <group ref={tiltRef}><points ref={spinRef}> nesting.
    const tilt = new THREE.Group();
    tilt.rotation.set(baseTilt, 0, 0);
    const points = new THREE.Points(geometry, material);
    tilt.add(points);

    const scene = new THREE.Scene();
    scene.add(tilt);

    // Match r3f's default camera: position set, no lookAt (rotation stays at
    // identity, looking down -Z). MOUSE_PROJECTION_SCALE is tuned to this framing.
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.set(0, ringRadius * 0.72, ringRadius * 1.95);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    el.appendChild(canvas);

    // loop state (closure-local)
    let time = 0;
    let raf = 0;
    let running = false;
    let last = performance.now();
    const mouseWorld = new THREE.Vector3();

    const step = (delta: number) => {
      const d = Math.min(delta, 0.05); // clamp after a tab-pause so nothing jumps
      const k = 1 - Math.pow(0.001, d); // frame-rate-independent damping
      const isReduced = reducedRef.current;
      if (!isReduced) {
        time += d;
        uniforms.uTime.value = time;
        points.rotation.y += rotationSpeedRef.current * d * 60;
      }

      // scroll-driven morph: every section gets its own signature, all eased (no
      // snapping). Two dispersion swells — the ring scatters through the fracture,
      // draws back into a tight halo for the ascent gauge, blooms again under the
      // proof, then settles and recedes so the dense pricing content stays clean.
      let s = 0;
      let disp = 0;
      const scroll = scrollDrivenRef.current ? scrollRef.current : null;
      if (scroll) {
        s = scroll.get();
        const scatter = bumpAt(s, 0.20, 0.14); // fracture: fragments fly apart
        const bloom = bumpAt(s, 0.66, 0.12) * 0.55; // proof: a softer second breath, decays before the meters
        disp = isReduced ? 0 : (scatter + bloom) * ringThickness * 1.7;
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

      const scrollTiltX = scroll ? -s * 0.45 : 0;
      const scrollTiltZ = scroll ? s * 0.4 : 0;
      const interactive = interactiveRef.current;
      const mx = interactive && !isReduced ? mouse.current.x : 0;
      const my = interactive && !isReduced ? mouse.current.y : 0;
      tilt.rotation.x += (baseTilt + scrollTiltX + my * 0.16 - tilt.rotation.x) * k;
      tilt.rotation.y += (mx * 0.22 - tilt.rotation.y) * k;
      tilt.rotation.z += (scrollTiltZ - tilt.rotation.z) * k;
      // subtle breath: the ring swells slightly as it scatters, settles as it coheres
      const targetScale = scroll ? 1 + (disp / (ringThickness * 1.7)) * 0.06 : 1;
      const sc = tilt.scale.x + (targetScale - tilt.scale.x) * k;
      tilt.scale.setScalar(sc);

      if (interactive && !isReduced) {
        // MOUSE_PROJECTION_SCALE is coupled to the camera distance/FOV — see its
        // definition at the top of the file before changing the camera framing.
        mouseWorld.set(
          mouse.current.x * ringRadius * MOUSE_PROJECTION_SCALE,
          0,
          -mouse.current.y * ringRadius * MOUSE_PROJECTION_SCALE,
        );
        uniforms.uMouse.value.lerp(mouseWorld, 0.08);
      }
    };

    const frame = () => {
      if (!running) return;
      const now = performance.now();
      const delta = (now - last) / 1000;
      last = now;
      step(delta);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now(); // reset so the first delta after a pause is ~0, not a jump
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      renderer.render(scene, camera); // hold the last frame (static ring while paused)
    };
    const renderOnce = () => {
      if (!running) renderer.render(scene, camera);
    };

    // render one frame immediately so the ring is visible before the loop is told
    // to start (covers reduced-motion / initially-paused cases).
    renderer.render(scene, camera);
    if (animatingRef.current) start();

    three.current = { uniforms, start, stop, renderOnce };

    const onResize = () => {
      const w = Math.max(el.clientWidth, 1);
      const h = Math.max(el.clientHeight, 1);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(ratio);
      renderer.setSize(w, h);
      uniforms.uPixelRatio.value = ratio;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderOnce();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return () => {
      ro.disconnect();
      stop();
      three.current = null;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, webglOk, count, ringRadius, ringThickness, additive]);

  // Push live prop/state changes into the running scene without rebuilding it.
  useEffect(() => {
    reducedRef.current = reduced;
    interactiveRef.current = !isTouch;
    scrollDrivenRef.current = scrollDriven;
    rotationSpeedRef.current = rotationSpeed;
    scrollRef.current = scrollDriven ? smoothScroll : null;
    const t = three.current;
    if (!t) return;
    t.uniforms.uColor.value.set(particleColor);
    t.uniforms.uReduced.value = reduced ? 1 : 0;
    t.uniforms.uRepelRadius.value = ringRadius * 0.5;
    t.uniforms.uRepelStrength.value = ringThickness * 0.9;
    t.uniforms.uSize.value = particleSize;
    if (!animatingRef.current) t.renderOnce();
  }, [particleColor, reduced, isTouch, scrollDriven, rotationSpeed, ringRadius, ringThickness, particleSize, smoothScroll]);

  // Start/stop the render loop as the ring enters/leaves view, the tab hides, or
  // reduced-motion toggles — keeps the GPU idle when there's nothing to animate.
  useEffect(() => {
    animatingRef.current = isAnimating;
    const t = three.current;
    if (!t) return;
    if (isAnimating) t.start();
    else t.stop();
  }, [isAnimating]);

  return (
    // Decorative-only layer: purely visual, no semantic content, pointer-events
    // disabled. The ref exists for the IntersectionObserver (render-loop pause),
    // the ResizeObserver, and as the canvas mount point — it isn't referenced by
    // any parent for layout or non-visual state — so aria-hidden is correct and
    // it's safe to hide from assistive tech.
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
      {mounted && !webglOk && (
        // Graceful degradation: a static brand-tinted glow that echoes the ring,
        // so WebGL-less browsers get atmosphere instead of an error boundary.
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(60% 50% at 50% 45%, ${particleColor}22 0%, transparent 70%)`,
          }}
        />
      )}
      {/* The three.js canvas is created imperatively and appended to this div in the effect above. */}
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
- The effect disposes the geometry/material/renderer and removes the canvas on unmount.
*/
