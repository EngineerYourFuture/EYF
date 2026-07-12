"use client";
import { motion } from "framer-motion";
import { useIsReduced } from "@/lib/use-is-reduced";

/**
 * The pillars as one instrument panel — the single score decomposed into the
 * parts that feed it — rather than three identical feature cards. Each meter
 * fills on scroll-into-view; data reads in mono. On the morning ground.
 */
const PILLARS = [
  { name: "Problem Solving", detail: "DSA · patterns first", weight: 38, value: 62 },
  { name: "Interviews", detail: "AI + peer mocks, scored", weight: 20, value: 55 },
  { name: "Aptitude & Reasoning", detail: "quant · verbal · logical", weight: 18, value: 71 },
  { name: "Core CS", detail: "OS · DBMS · CN · OOP", weight: 14, value: 68 },
  { name: "Resume & ATS", detail: "recruiter-ready, scored", weight: 6, value: 61 },
  { name: "Projects", detail: "defensible in an interview", weight: 4, value: 49 },
];

export function Pillars() {
  const reduce = useIsReduced();
  return (
    <section className="relative z-10 px-6 py-28 text-[rgb(var(--lp-ink))]">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[rgb(var(--lp-ink))]/50">The instrument</p>
          <h2 className="mt-3 font-brand text-4xl font-extrabold tracking-tight sm:text-5xl text-balance">
            One score. Every part of you, measured.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[rgb(var(--lp-ink))]/65">
            Not a dashboard of vanity metrics — a single readiness number, and the exact levers that move it.
            Weighted the way recruiters actually weigh you.
          </p>
        </div>

        <div className="mt-14 divide-y divide-black/10 border-y border-black/10">
          {PILLARS.map((p, i) => (
            <div key={p.name} className="grid grid-cols-[1fr_auto] items-center gap-x-8 gap-y-3 py-6 sm:grid-cols-[minmax(0,20rem)_1fr_auto]">
              <div>
                <div className="font-brand text-lg font-bold leading-none">{p.name}</div>
                <div className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-[rgb(var(--lp-ink))]/45">{p.detail}</div>
              </div>
              <div className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-black/[0.07] sm:order-none sm:col-span-1">
                <motion.div
                  className="h-full rounded-full bg-[rgb(var(--lp-brand))]"
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${p.value}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.9, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                  style={reduce ? { width: `${p.value}%` } : undefined}
                />
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-lg font-semibold">{p.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--lp-ink))]/40">{p.weight}% of score</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
