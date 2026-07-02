"use client";
/**
 * 3D force-directed graph + BFS traversal highlight.
 * Tiny custom force simulation (no d3-force dep), Three.js for render.
 */
import type * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { Button } from "@eyf/ui";

type Edge = [number, number];
const SAMPLE: { nodes: number; edges: Edge[] } = {
  nodes: 12,
  edges: [
    [0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 6],
    [3, 7], [3, 8], [4, 9], [5, 9], [6, 10], [7, 10], [8, 11], [9, 11],
  ],
};

function bfsOrder(n: number, edges: Edge[], start: number): number[] {
  const adj = new Map<number, number[]>();
  for (const [a, b] of edges) {
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  }
  const visited = new Set<number>([start]);
  const queue = [start];
  const order: number[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    for (const v of adj.get(u) ?? []) {
      if (!visited.has(v)) { visited.add(v); queue.push(v); }
    }
  }
  void n; return order;
}

export function Graph3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(-1);
  const order = bfsOrder(SAMPLE.nodes, SAMPLE.edges, 0);

  useEffect(() => {
    let dispose: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      const THREE = await import("three");
      if (cancelled || !containerRef.current) return;
      const container = containerRef.current;
      const W = container.clientWidth, H = container.clientHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);
      const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
      camera.position.set(0, 0, 18);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(W, H);
      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      // Initial random positions in a sphere.
      const pos: THREE.Vector3[] = [];
      for (let i = 0; i < SAMPLE.nodes; i++) {
        pos.push(new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
        ));
      }

      // Force simulation: repulsion between all pairs + spring on edges.
      function tick() {
        const REPULSE = 6;
        const SPRING = 0.05;
        const REST = 3;
        const force = pos.map(() => new THREE.Vector3());
        for (let i = 0; i < pos.length; i++) {
          for (let j = i + 1; j < pos.length; j++) {
            const d = new THREE.Vector3().subVectors(pos[i]!, pos[j]!);
            const r = Math.max(0.5, d.length());
            d.normalize().multiplyScalar(REPULSE / (r * r));
            force[i]!.add(d);
            force[j]!.sub(d);
          }
        }
        for (const [a, b] of SAMPLE.edges) {
          const d = new THREE.Vector3().subVectors(pos[b]!, pos[a]!);
          const len = d.length();
          d.normalize().multiplyScalar((len - REST) * SPRING);
          force[a]!.add(d);
          force[b]!.sub(d);
        }
        for (let i = 0; i < pos.length; i++) pos[i]!.add(force[i]!.multiplyScalar(0.2));
      }
      for (let i = 0; i < 200; i++) tick();

      const group = new THREE.Group();
      scene.add(group);
      const sphere = new THREE.SphereGeometry(0.45, 24, 24);
      const off = new THREE.MeshStandardMaterial({ color: 0xfafaf9, emissive: 0x111111 });
      const on  = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, emissive: 0xf5f5f5, emissiveIntensity: 0.7 });
      const meshes: THREE.Mesh[] = [];
      for (let i = 0; i < SAMPLE.nodes; i++) {
        const m = new THREE.Mesh(sphere, off);
        m.position.copy(pos[i]!);
        meshes.push(m);
        group.add(m);
      }
      const edgeGroup = new THREE.Group();
      group.add(edgeGroup);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x3b4a0f });
      for (const [a, b] of SAMPLE.edges) {
        const geo = new THREE.BufferGeometry().setFromPoints([pos[a]!, pos[b]!]);
        edgeGroup.add(new THREE.Line(geo, lineMat));
      }

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const key = new THREE.DirectionalLight(0xf5f5f5, 0.7);
      key.position.set(5, 5, 8);
      scene.add(key);

      // Highlight visited nodes up to `step`.
      let activeStep = -1;
      function applyHighlight(s: number) {
        if (s === activeStep) return;
        activeStep = s;
        meshes.forEach((m, i) => {
          m.material = order.slice(0, s + 1).includes(i) ? on : off;
        });
      }

      const stepRef = { current: step };
      // Expose via closure — outer effect updates via dependency.
      function update() { applyHighlight(stepRef.current); }

      let raf = 0;
      function frame() {
        group.rotation.y += 0.002;
        update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      }
      frame();

      // Watch step changes via a MutationObserver-free trick: poll via container dataset.
      const obs = new MutationObserver(() => {
        const s = Number(container.dataset.step ?? -1);
        if (!Number.isNaN(s)) stepRef.current = s;
      });
      obs.observe(container, { attributes: true, attributeFilter: ["data-step"] });

      dispose = () => {
        cancelAnimationFrame(raf);
        obs.disconnect();
        renderer.dispose();
        sphere.dispose(); off.dispose(); on.dispose(); lineMat.dispose();
        container.innerHTML = "";
      };
    })();

    return () => { cancelled = true; dispose?.(); };
    // Scene is keyed on `order` only — rebuilding it on every `step` would be wrong and costly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  // Push step into the canvas via data attribute (avoids re-init of Three scene).
  useEffect(() => {
    if (containerRef.current) containerRef.current.dataset.step = String(step);
  }, [step]);

  async function play() {
    for (let i = 0; i < order.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm">
        <Button size="sm" onClick={() => { setStep(-1); play(); }}>Play BFS from node 0</Button>
        <Button size="sm" variant="ghost" onClick={() => setStep(-1)}>Reset</Button>
        <span className="text-text-3 text-xs ml-auto font-mono">{step >= 0 ? `step ${step + 1}/${order.length}` : "idle"}</span>
      </div>
      <div ref={containerRef} className="w-full bg-bg border border-border rounded-md" style={{ height: 420 }} />
      <p className="text-text-3 text-xs mt-2 font-mono">Visit order: {order.join(" → ")}</p>
    </div>
  );
}
