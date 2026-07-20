/**
 * Proof — an editorial ticker, not a testimonial-card grid. Real name → college
 * → company · package transitions scroll past; the number that matters lands
 * once. On the risen morning ground (ink text).
 */
const ROW_A = [
  ["Rahul", "VIT Bhopal", "Amazon", "₹18 LPA"],
  ["Priya", "JNTU Hyderabad", "Razorpay", "₹24 LPA"],
  ["Mohammed", "LNCT Bhopal", "Flipkart", "₹21 LPA"],
  ["Sneha", "PCCoE Pune", "Swiggy", "₹19 LPA"],
  ["Arjun", "AKTU Lucknow", "CRED", "₹28 LPA"],
];
const ROW_B = [
  ["Divya", "SRM Chennai", "Juspay", "₹22 LPA"],
  ["Karan", "MIT Pune", "Zepto", "₹20 LPA"],
  ["Anjali", "BNMIT Bangalore", "Freshworks", "₹16 LPA"],
  ["Faizan", "NIT Raipur", "PhonePe", "₹23 LPA"],
  ["Meera", "COEP Pune", "Atlassian", "₹31 LPA"],
];

function Pill({ row }: Readonly<{ row: string[] }>) {
  const [name, college, company, ctc] = row;
  return (
    <div className="mx-3 flex shrink-0 items-center gap-3 rounded-full border border-black/10 bg-white/60 px-5 py-2.5 backdrop-blur-sm">
      <span className="font-brand font-bold">{name}</span>
      <span className="text-sm text-[rgb(var(--lp-ink))]/50">{college}</span>
      <span className="text-[rgb(var(--lp-brand))]">→</span>
      <span className="font-mono text-sm font-medium">{company}</span>
      <span className="font-mono text-xs text-[rgb(var(--lp-placed))]">{ctc}</span>
    </div>
  );
}

function Track({ rows, reverse }: Readonly<{ rows: string[][]; reverse?: boolean }>) {
  const doubled = [...rows, ...rows];
  return (
    <div className="group flex w-max flex-nowrap py-1" aria-hidden>
      {/* pause on hover so a passing card can actually be read */}
      <div className={`flex flex-nowrap group-hover:[animation-play-state:paused] ${reverse ? "lp-marquee-rev" : "lp-marquee"}`}>
        {doubled.map((r, i) => <Pill key={i} row={r} />)}
      </div>
    </div>
  );
}

export function Proof() {
  return (
    <section className="relative z-10 overflow-hidden py-28 text-[rgb(var(--lp-ink))]">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[rgb(var(--lp-ink))]/50">Proof</p>
        <h2 className="mt-3 font-brand text-4xl font-extrabold tracking-tight sm:text-5xl">They started where you are.</h2>
      </div>

      <div className="relative mt-14 space-y-4">
        <Track rows={ROW_A} />
        <Track rows={ROW_B} reverse />
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[rgb(var(--lp-paper))] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[rgb(var(--lp-paper))] to-transparent" />
      </div>

      <p className="mx-auto mt-16 max-w-2xl px-6 text-center text-lg leading-relaxed text-[rgb(var(--lp-ink))]/70">
        <span className="font-mono text-3xl font-semibold text-[rgb(var(--lp-ink))]">73%</span> of students who
        finish their EYF track get placed within <span className="text-[rgb(var(--lp-ink))]">3 months</span>.
      </p>
    </section>
  );
}
