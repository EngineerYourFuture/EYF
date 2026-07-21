import Link from "next/link";
import { MagneticLink } from "./magnetic-link";

const PLANS = [
  { id: "basic", name: "Basic", price: "249", items: ["20 submissions/day", "All core subjects", "Peer mock interviews"], featured: false },
  { id: "pro", name: "Pro", price: "499", items: ["Unlimited submissions", "AI mock interviews", "Resume ATS + all problems"], featured: true },
  { id: "elite", name: "Elite", price: "899", items: ["Everything in Pro", "2 expert mocks / month", "Mentor priority"], featured: false },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative z-10 px-6 py-28 text-[rgb(var(--lp-ink))]">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[rgb(var(--lp-ink))]/50">Pricing</p>
          <h2 className="mt-3 font-brand text-4xl font-extrabold tracking-tight sm:text-5xl">Pay what a textbook costs.</h2>
          <p className="mt-4 text-lg leading-relaxed text-[rgb(var(--lp-ink))]/65">
            Free forever to start. Upgrade when you&rsquo;re serious — UPI, cards, wallets.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col rounded-2xl border p-7 transition-transform duration-300 ease-out hover:-translate-y-1.5 ${
                p.featured
                  ? "border-[rgb(var(--lp-ink))] bg-[rgb(var(--lp-ink))] text-[rgb(var(--lp-paper))] shadow-[0_24px_60px_-24px_rgba(11,13,19,0.4)]"
                  : "border-black/12 bg-white/60 hover:border-black/25"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-brand text-lg font-bold">{p.name}</span>
                {p.featured && <span className="font-mono text-[10px] uppercase tracking-widest text-[rgb(var(--lp-brand))]">Most chosen</span>}
              </div>
              <div className="mt-4 font-mono">
                <span className="text-3xl font-semibold tabular-nums">₹{p.price}</span>
                <span className={`text-sm ${p.featured ? "opacity-50" : "text-[rgb(var(--lp-ink))]/40"}`}> /mo</span>
              </div>
              <ul className={`mt-6 flex-1 space-y-2.5 text-sm ${p.featured ? "text-[rgb(var(--lp-paper))]/80" : "text-[rgb(var(--lp-ink))]/70"}`}>
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2.5">
                    <span className="text-[rgb(var(--lp-brand))]">✦</span>{it}
                  </li>
                ))}
              </ul>
              <Link
                href="/billing"
                className={`mt-7 rounded-full px-5 py-2.5 text-center text-sm font-semibold transition-transform hover:scale-[1.02] ${
                  p.featured
                    ? "bg-[rgb(var(--lp-paper))] text-[rgb(var(--lp-ink))]"
                    : "border border-black/15 hover:border-black/30"
                }`}
              >
                Choose {p.name}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center font-mono text-xs tracking-wide text-[rgb(var(--lp-ink))]/50">
          Offline coaching ₹1,20,000 · LeetCode ₹35,000/yr ·{" "}
          <span className="text-[rgb(var(--lp-placed))]">EYF Pro ₹3,999/yr</span>
        </p>
      </div>

      {/* closing */}
      <div className="mx-auto mt-32 max-w-3xl text-center">
        <h2 className="font-brand text-4xl font-extrabold tracking-tight sm:text-6xl text-balance">
          Your first offer starts with your first problem.
        </h2>
        <div className="mt-9 flex justify-center">
          <MagneticLink
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-full bg-[rgb(var(--lp-brand))] px-8 py-4 text-base font-semibold text-white transition-[filter] hover:brightness-95"
          >
            Start your path{" "}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </MagneticLink>
        </div>
      </div>
    </section>
  );
}
