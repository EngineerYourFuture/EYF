"use client";
/**
 * 3D recursion-tree visualizer. Canonical Fibonacci(n) call tree, rendered
 * with Three.js in a rotating scene. Desktop-only per spec (Phase 4 Week 30).
 *
 * Lazy-imports three so the bundle stays small for users who never open it.
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@eyf/ui";

type Node = { id: number; value: number; children: Node[]; depth: number };

let counter = 0;
function buildFib(n: number, depth = 0): Node {
  const id = counter++;
  if (n <= 1) return { id, value: n, children: [], depth };
  return {
    id, value: n, depth,
    children: [buildFib(n - 1, depth + 1), buildFib(n - 2, depth + 1)],
  };
}

// Tidy-tree layout — assigns x/y to each node in 2D, we lift y → depth in 3D.
function layoutTidy(root: Node): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>();
  let next = 0;
  function visit(n: Node) {
    if (n.children.length === 0) {
      positions.set(n.id, { x: next++, y: n.depth });
      return;
    }
    n.children.forEach(visit);
    const c0 = positions.get(n.children[0]!.id)!;
    const c1 = positions.get(n.children[n.children.length - 1]!.id)!;
    positions.set(n.id, { x: (c0.x + c1.x) / 2, y: n.depth });
  }
  visit(root);
  return positions;
}

export function Recursion3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(6);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let dispose: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const THREE = await import("three");
        if (cancelled || !containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.set(0, 8, 18);
        camera.lookAt(0, 4, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // Build tree.
        counter = 0;
        const tree = buildFib(n);
        const positions = layoutTidy(tree);
        const xs = [...positions.values()].map((p) => p.x);
        const xMin = Math.min(...xs), xMax = Math.max(...xs);
        const xSpan = Math.max(1, xMax - xMin);
        const SCALE_X = 18 / xSpan;
        const SCALE_Y = 2.4;

        const group = new THREE.Group();
        scene.add(group);

        const sphereGeo = new THREE.SphereGeometry(0.35, 24, 24);
        const accentMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, emissive: 0xf5f5f5, emissiveIntensity: 0.4 });
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xfafaf9, emissive: 0x111111 });
        const lineMat = new THREE.LineBasicMaterial({ color: 0x3b4a0f });

        function place(node: Node) {
          const p = positions.get(node.id)!;
          return new THREE.Vector3((p.x - (xMax + xMin) / 2) * SCALE_X, -p.y * SCALE_Y + 6, 0);
        }

        function visit(node: Node) {
          const pos = place(node);
          const mesh = new THREE.Mesh(sphereGeo, node.value <= 1 ? accentMat : baseMat);
          mesh.position.copy(pos);
          group.add(mesh);
          for (const c of node.children) {
            const cp = place(c);
            const geo = new THREE.BufferGeometry().setFromPoints([pos, cp]);
            group.add(new THREE.Line(geo, lineMat));
            visit(c);
          }
        }
        visit(tree);

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const key = new THREE.DirectionalLight(0xf5f5f5, 0.8);
        key.position.set(5, 10, 7);
        scene.add(key);

        let rafId = 0;
        function frame() {
          group.rotation.y += 0.003;
          renderer.render(scene, camera);
          rafId = requestAnimationFrame(frame);
        }
        frame();

        function onResize() {
          const w = container.clientWidth;
          const h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
        window.addEventListener("resize", onResize);

        dispose = () => {
          cancelAnimationFrame(rafId);
          window.removeEventListener("resize", onResize);
          renderer.dispose();
          sphereGeo.dispose();
          accentMat.dispose(); baseMat.dispose(); lineMat.dispose();
          container.innerHTML = "";
        };
      } catch (e) {
        setError((e as Error).message);
      }
    })();

    return () => { cancelled = true; dispose?.(); };
  }, [n]);

  return (
    <div>
      <label className="flex items-center gap-3 mb-3 text-sm">
        <span className="text-text-3 uppercase text-xs tracking-wider">Fibonacci n =</span>
        <input
          type="range" min={1} max={10} value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="accent-accent"
        />
        <span className="font-mono">{n}</span>
        <span className="text-text-3 text-xs ml-auto">{n >= 8 ? "⚠ many duplicate subproblems" : null}</span>
      </label>
      <div ref={containerRef} className="w-full bg-bg border border-border rounded-md" style={{ height: 420 }}>
        {error && <div className="p-4 text-hard text-sm">3D failed: {error}</div>}
      </div>
      <p className="text-text-3 text-xs mt-2 font-mono">Yellow = base case. Drag-rotate the canvas on the parent page.</p>
      <Button size="sm" variant="ghost" className="mt-2" onClick={() => setN((v) => v)}>Re-render</Button>
    </div>
  );
}
