"use client";
/**
 * Scene 4 — THE MAP (spec Doc 03). A 3D roadmap of 9 nodes the camera travels
 * as the user scrolls. Nodes light up in #F5F5F5 as the camera passes them.
 * `progress` (0..1) is driven by the parent's scroll position.
 */
import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

const NODES = [
  "Assessment", "Roadmap", "DSA", "Core Subjects", "Cognitive Games",
  "Mock Interviews", "Resume", "Jobs", "Offer",
];

export function Roadmap3D({ progress }: { progress: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  // Subscribe to the scroll MotionValue; the imperative Three loop reads the ref.
  useEffect(() => {
    progressRef.current = progress.get();
    const unsub = progress.on("change", (v) => { progressRef.current = v; });
    return () => unsub();
  }, [progress]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      if (disposed || !ref.current) return;
      const el = ref.current;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, el.clientWidth / el.clientHeight, 0.1, 200);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(el.clientWidth, el.clientHeight);
      el.appendChild(renderer.domElement);

      // Build a gently winding path through the nodes.
      const pts: InstanceType<typeof THREE.Vector3>[] = NODES.map((_, i) => {
        const t = i / (NODES.length - 1);
        return new THREE.Vector3(
          Math.sin(t * Math.PI * 2) * 6,
          (t - 0.5) * 4,
          -i * 9,
        );
      });
      const curve = new THREE.CatmullRomCurve3(pts);

      // Tube along the path.
      const tubeGeo = new THREE.TubeGeometry(curve, 200, 0.06, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({ color: 0x2a3208 });
      scene.add(new THREE.Mesh(tubeGeo, tubeMat));

      // Node spheres + labels.
      const sphereGeo = new THREE.SphereGeometry(0.5, 24, 24);
      const meshes = pts.map((p) => {
        const m = new THREE.Mesh(
          sphereGeo,
          new THREE.MeshStandardMaterial({ color: 0x1c1c1c, emissive: 0x000000, roughness: 0.4 }),
        );
        m.position.copy(p);
        scene.add(m);
        return m;
      });

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const key = new THREE.PointLight(0xf5f5f5, 1.2, 60);
      scene.add(key);

      const accent = new THREE.Color(0xf5f5f5);
      const dim = new THREE.Color(0x1c1c1c);

      let raf = 0;
      function frame() {
        const prog = Math.max(0, Math.min(1, progressRef.current));
        const at = curve.getPointAt(prog);
        const ahead = curve.getPointAt(Math.min(1, prog + 0.06));
        camera.position.set(at.x + 3, at.y + 2.5, at.z + 11);
        camera.lookAt(ahead);
        key.position.copy(at).add(new THREE.Vector3(0, 2, 4));

        // Light up nodes the camera has passed.
        meshes.forEach((m, i) => {
          const nodeT = i / (NODES.length - 1);
          const passed = prog >= nodeT - 0.02;
          const mat = m.material as InstanceType<typeof THREE.MeshStandardMaterial>;
          mat.color.lerp(passed ? accent : dim, 0.12);
          mat.emissive.lerp(passed ? accent : new THREE.Color(0x000000), 0.12);
          const s = passed ? 1.25 : 1;
          m.scale.lerp(new THREE.Vector3(s, s, s), 0.12);
        });

        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
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
        tubeGeo.dispose(); tubeMat.dispose(); sphereGeo.dispose();
        renderer.dispose();
        el.removeChild(renderer.domElement);
      };
    })();

    return () => { disposed = true; cleanup?.(); };
  }, []);

  return <div ref={ref} className="absolute inset-0" />;
}

export const ROADMAP_NODES = NODES;
