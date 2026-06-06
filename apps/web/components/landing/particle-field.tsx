"use client";
/**
 * Scene 1 / Scene 9 particle field (spec Doc 03).
 * ~200 slow-drifting particles, #1C1C1C → brightening toward the accent as the
 * page scrolls (urgency). Fixed behind everything. Three.js, no R3F dependency.
 *
 * Honors prefers-reduced-motion (renders a single static frame).
 */
import type * as THREE from "three";
import { useEffect, useRef } from "react";

const COUNT = 220;

export function ParticleField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      if (disposed || !ref.current) return;
      const el = ref.current;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(70, el.clientWidth / el.clientHeight, 0.1, 100);
      camera.position.z = 22;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(el.clientWidth, el.clientHeight);
      el.appendChild(renderer.domElement);

      const positions = new Float32Array(COUNT * 3);
      const speeds = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        speeds[i] = 0.2 + Math.random() * 0.6;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        color: new THREE.Color(0x2a2a28),
        size: 0.14,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);

      const accent = new THREE.Color(0xe8ff47);
      const base = new THREE.Color(0x2a2a28);
      const tmp = new THREE.Color();

      let raf = 0;
      let last = performance.now();
      function frame(now: number) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        // Scroll progress 0..1 → particles drift faster + brighten toward accent.
        const sp = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
        const pos = geo.attributes.position as THREE.BufferAttribute;
        const arr = pos.array as Float32Array;
        for (let i = 0; i < COUNT; i++) {
          const k = i * 3 + 1;
          arr[k] = (arr[k] ?? 0) + (speeds[i] ?? 0.4) * dt * (0.6 + sp * 2.2);
          if ((arr[k] ?? 0) > 20) arr[k] = -20;
        }
        pos.needsUpdate = true;
        tmp.copy(base).lerp(accent, sp * 0.5);
        mat.color.copy(tmp);
        mat.opacity = 0.5 + sp * 0.35;
        points.rotation.y += dt * 0.02;
        renderer.render(scene, camera);
        if (!reduced) raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);

      function onResize() {
        if (!ref.current) return;
        camera.aspect = el.clientWidth / el.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(el.clientWidth, el.clientHeight);
      }
      window.addEventListener("resize", onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        geo.dispose();
        mat.dispose();
        renderer.dispose();
        el.removeChild(renderer.domElement);
      };
    })();

    return () => { disposed = true; cleanup?.(); };
  }, []);

  return <div ref={ref} aria-hidden className="fixed inset-0 -z-10 pointer-events-none" />;
}
