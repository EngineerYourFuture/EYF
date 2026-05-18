import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { EYFMark } from '../components/EYFLogo';

/* ── Reveal animation wrapper ─────────────────────────────────────────────── */

function Reveal({ children, delay = 0, className = '' }: {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Counter animation ────────────────────────────────────────────────────── */

function CountUp({ target, suffix = '' }: { readonly target: number; readonly suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const duration = 1600;
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);
  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

/* ── Product demo card ────────────────────────────────────────────────────── */

function DemoCard() {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl"
      style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <span className="ml-3 text-xs font-mono" style={{ color: '#52525B' }}>two-sum.py</span>
        <span className="ml-auto tag tag-medium">Medium</span>
      </div>

      {/* Code */}
      <div className="px-5 py-4 font-mono text-sm leading-loose">
        <div><span className="syn-kw">def</span>{' '}<span className="syn-fn">twoSum</span><span style={{ color: '#A1A1AA' }}>(nums: list, target: int):</span></div>
        <div className="ml-5"><span className="syn-var">seen</span> = {'{}'}</div>
        <div className="ml-5"><span className="syn-kw">for</span> <span className="syn-var">i</span>, <span className="syn-var">num</span> <span className="syn-kw">in</span> <span className="syn-fn">enumerate</span>(nums):</div>
        <div className="ml-10"><span className="syn-var">diff</span> = target <span className="syn-op">-</span> num</div>
        <div className="ml-10"><span className="syn-kw">if</span> diff <span className="syn-kw">in</span> <span className="syn-var">seen</span>:</div>
        <div className="ml-14"><span className="syn-kw">return</span> [seen[diff], i]</div>
        <div className="ml-10">seen[num] = i</div>
      </div>

      {/* Result bar */}
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(34,197,94,0.04)' }}
      >
        <span className="text-xs font-semibold" style={{ color: '#4ADE80' }}>✓ All 57 test cases passed</span>
        <span className="text-xs ml-auto" style={{ color: '#3F3F46' }}>Runtime: 48ms · O(n) space</span>
      </div>
    </div>
  );
}

/* ── Placement readiness card ─────────────────────────────────────────────── */

function ReadinessCard() {
  const modules = [
    { label: 'DSA',           pct: 68, color: '#3B82F6' },
    { label: 'System Design', pct: 41, color: '#06B6D4' },
    { label: 'OOP & Patterns', pct: 55, color: '#8B5CF6' },
    { label: 'Core CS',       pct: 72, color: '#22C55E' },
    { label: 'Placement Prep', pct: 33, color: '#F97316' },
  ];
  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl"
      style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold" style={{ color: '#F4F4F5' }}>Placement Readiness</span>
          <span className="text-xs font-mono font-bold" style={{ color: '#E8192C' }}>54%</span>
        </div>
        <p className="text-xs" style={{ color: '#71717A' }}>Based on your progress across all modules</p>
      </div>
      <div className="px-5 py-4 space-y-4">
        {modules.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: '#A1A1AA' }}>{m.label}</span>
              <span className="text-xs font-mono" style={{ color: m.color }}>{m.pct}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${m.pct}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(232,25,44,0.03)' }}
      >
        <span className="text-xs" style={{ color: '#71717A' }}>Next priority:</span>
        <span className="text-xs font-semibold" style={{ color: '#F4F4F5' }}>Complete System Design module</span>
      </div>
    </div>
  );
}

/* ── Navigation ───────────────────────────────────────────────────────────── */

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-200"
      style={{
        background: scrolled ? 'rgba(9,9,11,0.9)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
      }}
    >
      <div className="land-container h-full flex items-center gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <EYFMark size={22} className="text-[#09090B]" />
          <span className="font-black tracking-tight text-base" style={{ color: '#F4F4F5' }}>EYF</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {[
            { label: 'Curriculum',  href: '#features' },
            { label: 'Practice',    href: '/login' },
            { label: 'Placement',   href: '#placement' },
            { label: 'Pricing',     href: '#pricing' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#71717A' }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#F4F4F5'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#71717A'; (e.target as HTMLElement).style.background = 'transparent'; }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/login?tab=register" className="btn btn-primary btn-sm">Get started free</Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden ml-auto p-2 rounded-lg transition-colors"
          style={{ color: '#A1A1AA' }}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-rounded text-xl">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ background: 'rgba(9,9,11,0.97)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="land-container py-4 flex flex-col gap-1">
            {['Curriculum', 'Practice', 'Placement', 'Pricing'].map((label) => (
              <a key={label} href="#features" className="px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: '#A1A1AA' }}>{label}</a>
            ))}
            <div className="divider my-2" />
            <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
            <Link to="/login?tab=register" className="btn btn-primary btn-sm mt-1">Get started free</Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="pt-28 pb-20">
      <div className="land-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <span className="badge badge-green">
                <span className="anim-pulse w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Open beta · 12,000+ students enrolled
              </span>
            </motion.div>

            <motion.h1
              className="hero-text mb-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.07 }}
            >
              The structured path<br />
              to your first<br />
              <span style={{ color: '#E8192C' }}>tech offer.</span>
            </motion.h1>

            <motion.p
              className="text-base leading-relaxed mb-8 max-w-lg"
              style={{ color: '#A1A1AA' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.14 }}
            >
              EYF brings together 450+ DSA problems, real system design cases, OOP mastery,
              and placement intelligence — in one platform built for engineering students
              preparing for campus and off-campus placements.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-3 mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Link to="/login?tab=register" className="btn btn-primary btn-lg">
                Create free account
                <span className="material-symbols-rounded text-base">arrow_forward</span>
              </Link>
              <a href="#features" className="btn btn-secondary btn-lg">Explore curriculum</a>
            </motion.div>

            <motion.div
              className="flex flex-wrap items-center gap-4 text-xs"
              style={{ color: '#52525B' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.28 }}
            >
              {['No credit card required', 'Free tier forever', '10 min to start'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span style={{ color: '#4ADE80' }}>✓</span> {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Product mockup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            <DemoCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── Trust bar ────────────────────────────────────────────────────────────── */

function TrustBar() {
  const colleges = ['IIT Delhi','IIT Bombay','NIT Trichy','BITS Pilani','VIT Vellore','IIIT Hyderabad','DTU Delhi','Manipal','Anna University','SRM','PSG Tech','NSUT'];
  return (
    <section className="py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="land-container">
        <p className="text-xs font-medium uppercase tracking-widest mb-5 text-center" style={{ color: '#3F3F46' }}>
          Students preparing from
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {colleges.map((c) => (
            <span key={c} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#71717A' }}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Three value props ────────────────────────────────────────────────────── */

function ValueProps() {
  const items = [
    {
      num: '01',
      title: 'Structured, not scattered',
      body: 'A full learning path from arrays to system design, not a random problem dump. Every topic has a clear sequence, explanations, and review checkpoints.',
    },
    {
      num: '02',
      title: 'Track what actually matters',
      body: "See your placement readiness score, DSA progress, and knowledge gaps — not just problem count. Know where you are before the recruiter calls.",
    },
    {
      num: '03',
      title: 'Get placed, not just prepared',
      body: 'Company-specific question banks, behavioral prep, ATS resume review, and mock interviews in one place. The full pipeline, not fragments.',
    },
  ];

  return (
    <section className="py-20" id="features">
      <div className="land-container">
        <Reveal className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#71717A' }}>Why EYF</p>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#F4F4F5', letterSpacing: '-0.025em' }}>
            Everything placement season demands.
          </h2>
        </Reveal>

        <div className="feature-grid-3">
          {items.map((item, i) => (
            <Reveal key={item.num} delay={i * 0.07} className="feature-cell">
              <p className="text-sm font-mono font-bold mb-4" style={{ color: '#E8192C' }}>{item.num}</p>
              <h3 className="text-base font-semibold mb-3" style={{ color: '#F4F4F5', letterSpacing: '-0.01em' }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── DSA feature section ──────────────────────────────────────────────────── */

function DSASection() {
  const features = [
    '450+ problems organized by pattern, not just topic',
    'Company-tag filter — Google, Amazon, Flipkart, TCS, Infosys',
    'In-browser code editor with auto test execution',
    'Time & space complexity analysis with each solution',
    'Spaced-repetition review queue for retention',
    'Progress tracking per pattern (DP, Graphs, Trees…)',
  ];

  return (
    <section className="py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="land-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <DemoCard />
          </Reveal>
          <Reveal delay={0.1}>
            <span className="badge badge-blue mb-5">DSA Practice</span>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#F4F4F5', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              Stop grinding randomly.<br />Start thinking in patterns.
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#71717A' }}>
              Most students solve 200 problems and still freeze in interviews. EYF structures
              your practice around the 15 fundamental patterns that cover 80% of real interview questions.
            </p>
            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="check-row">
                  <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80' }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link to="/login?tab=register" className="btn btn-primary">Start practicing free</Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Placement feature section ────────────────────────────────────────────── */

function PlacementSection() {
  const features = [
    'Placement readiness score across all technical domains',
    'Company-wise interview question banks with recent OA patterns',
    'Behavioral question bank with STAR-format guidance',
    'ATS resume analyzer with actionable improvement tips',
    'Interview experience log from real students at target companies',
    'Role-specific prep plans for SDE, Data Analyst, DevOps, and more',
  ];

  return (
    <section className="py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} id="placement">
      <div className="land-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal delay={0.05}>
            <span className="badge badge-orange mb-5">Placement Intelligence</span>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#F4F4F5', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              Know your readiness<br />before interview season.
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#71717A' }}>
              EYF's Placement Score aggregates your DSA depth, system design fluency, behavioral
              prep, and company-specific coverage into a single honest metric. No surprises on the actual day.
            </p>
            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="check-row">
                  <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5" style={{ background: 'rgba(249,115,22,0.1)', color: '#FB923C' }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link to="/login?tab=register" className="btn btn-primary">Check my readiness</Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ReadinessCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Curriculum overview ──────────────────────────────────────────────────── */

function CurriculumSection() {
  const modules = [
    { icon: 'code',           label: 'DSA Practice',      desc: '450+ problems · 15 patterns', color: '#3B82F6' },
    { icon: 'architecture',   label: 'System Design',     desc: 'HLD · LLD · Real systems',    color: '#06B6D4' },
    { icon: 'account_tree',   label: 'OOP & Design Patterns', desc: 'SOLID · GoF patterns · UML', color: '#8B5CF6' },
    { icon: 'terminal',       label: 'Core CS Subjects',  desc: 'OS · DBMS · Networks · CN',   color: '#22C55E' },
    { icon: 'shield',         label: 'Cybersecurity',     desc: 'OWASP · CTF · Web security',  color: '#E8192C' },
    { icon: 'work_history',   label: 'Placement Prep',    desc: 'Companies · Resume · Mock',   color: '#F97316' },
    { icon: 'fact_check',     label: 'Skill Assessments', desc: 'Timed tests · Certificates',  color: '#EAB308' },
    { icon: 'style',          label: 'Flashcards & Notes', desc: 'Spaced repetition · Quick review', color: '#A855F7' },
    { icon: 'forum',          label: 'Community',         desc: 'Squads · Discussion · Mentors', color: '#6366F1' },
  ];

  return (
    <section className="py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="land-container">
        <Reveal className="mb-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#71717A' }}>Full Curriculum</p>
              <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#F4F4F5', letterSpacing: '-0.025em' }}>
                Everything in one place.
              </h2>
            </div>
            <Link to="/login?tab=register" className="btn btn-secondary hidden md:flex">
              View all modules
              <span className="material-symbols-rounded text-sm">arrow_forward</span>
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.05}>
              <div
                className="flex items-start gap-4 p-4 rounded-xl cursor-pointer group"
                style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#111113', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#18181B'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#111113'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${m.color}12` }}>
                  <span className="material-symbols-rounded text-lg" style={{ color: m.color }}>{m.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#F4F4F5' }}>{m.label}</p>
                  <p className="text-xs" style={{ color: '#52525B' }}>{m.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Stats ────────────────────────────────────────────────────────────────── */

function StatsSection() {
  const stats = [
    { value: 12400, suffix: '+', label: 'Students enrolled',     sub: 'from 200+ colleges' },
    { value: 450,   suffix: '+', label: 'Problems & solutions',  sub: 'with pattern tags' },
    { value: 94,    suffix: '%', label: 'Placement success rate', sub: 'among active users' },
    { value: 60,    suffix: '+', label: 'Company resources',     sub: 'Google · Amazon · more' },
  ];

  return (
    <section className="py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="land-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div>
                <div className="text-4xl font-extrabold mb-1" style={{ color: '#F4F4F5', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  <CountUp target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: '#A1A1AA' }}>{s.label}</div>
                <div className="text-xs" style={{ color: '#3F3F46' }}>{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────────────────────────────── */

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "I'd been grinding LeetCode randomly for 4 months with no improvement. EYF's pattern-based approach gave me a structure that actually stuck. Cracked Juspay in 3 weeks.",
      name: 'Arjun Mehta',
      role: 'SDE-1 at Juspay',
      college: 'NIT Warangal · 2024',
      initials: 'AM',
    },
    {
      quote: "The placement readiness score was honestly humbling — I thought I was ready but it showed I had massive gaps in system design. That honesty saved me from failing my first interview round.",
      name: 'Priya Venkataraman',
      role: 'Software Engineer at Freshworks',
      college: 'Anna University · 2024',
      initials: 'PV',
    },
    {
      quote: "Finally a platform that treats DSA and placement prep as connected things. The company-specific question banks are gold — I had 3 of the exact questions I saw on Zoho's OA.",
      name: 'Rohit Sharma',
      role: 'Associate Engineer at Zoho',
      college: 'VIT Vellore · 2023',
      initials: 'RS',
    },
  ];

  return (
    <section className="py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="land-container">
        <Reveal className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#71717A' }}>Student Outcomes</p>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#F4F4F5', letterSpacing: '-0.025em' }}>
            From preparation to placement.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div className="testimonial-card flex flex-col h-full">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[0,1,2,3,4].map((s) => (
                    <span key={s} className="text-sm" style={{ color: '#EAB308' }}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: '#A1A1AA' }}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="avatar avatar-sm">{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F4F4F5' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#52525B' }}>{t.role}</p>
                    <p className="text-xs" style={{ color: '#3F3F46' }}>{t.college}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ──────────────────────────────────────────────────────────────── */

function PricingSection() {
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      desc: 'Everything you need to start your placement journey.',
      features: ['100 DSA problems with explanations', 'Core CS subjects (full access)', 'Daily coding challenge', 'Basic progress tracking', 'Community access', 'Skill assessments (3/month)'],
      cta: 'Get started free',
      ctaVariant: 'btn-secondary',
      featured: false,
    },
    {
      name: 'Pro',
      price: '₹499',
      period: 'per month',
      desc: 'The full EYF experience for serious placement aspirants.',
      features: ['All 450+ DSA problems & solutions', 'Complete placement module', 'Company-wise question banks (60+)', 'ATS resume analyzer', 'Mock interview access', 'Unlimited skill assessments', 'Priority support'],
      cta: 'Start Pro trial',
      ctaVariant: 'btn-primary',
      featured: true,
      tag: 'Most popular',
    },
    {
      name: 'Pro+',
      price: '₹999',
      period: 'per month',
      desc: 'For students who want mentorship and personalized guidance.',
      features: ['Everything in Pro', '1-on-1 mentor sessions', 'Resume review by industry experts', 'LinkedIn profile optimization', 'Referral network access', 'Interview coaching calls', 'Placement guarantee support'],
      cta: 'Contact us',
      ctaVariant: 'btn-secondary',
      featured: false,
    },
  ];

  return (
    <section className="py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} id="pricing">
      <div className="land-container">
        <Reveal className="mb-12 text-center land-container-sm mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#71717A' }}>Pricing</p>
          <h2 className="text-3xl font-bold tracking-tight mb-4" style={{ color: '#F4F4F5', letterSpacing: '-0.025em' }}>
            Honest pricing. No surprises.
          </h2>
          <p className="text-sm" style={{ color: '#71717A' }}>
            Start free, upgrade when you need more. Most students get placed on the Pro plan.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.07}>
              <div className={`pricing-card relative ${plan.featured ? 'pricing-card-featured' : ''}`}>
                {plan.featured && plan.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge badge-red">{plan.tag}</span>
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-2" style={{ color: '#F4F4F5' }}>{plan.name}</p>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-extrabold" style={{ color: '#F4F4F5', letterSpacing: '-0.04em' }}>{plan.price}</span>
                    <span className="text-xs" style={{ color: '#52525B' }}>/{plan.period}</span>
                  </div>
                  <p className="text-xs" style={{ color: '#71717A' }}>{plan.desc}</p>
                </div>
                <div className="divider mb-6" />
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="check-row text-xs">
                      <span className="shrink-0 text-green-400 font-bold">✓</span>
                      <span style={{ color: '#A1A1AA' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login?tab=register" className={`btn ${plan.ctaVariant} w-full justify-center`}>
                  {plan.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ──────────────────────────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="py-20" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="land-container">
        <Reveal>
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#71717A' }}>Ready to start?</p>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#F4F4F5', letterSpacing: '-0.03em' }}>
              Join 12,000+ students already<br />preparing on EYF.
            </h2>
            <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: '#71717A' }}>
              Free forever. No credit card. Start solving problems and tracking your placement readiness in under 10 minutes.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/login?tab=register" className="btn btn-primary btn-xl">
                Create free account
                <span className="material-symbols-rounded text-lg">arrow_forward</span>
              </Link>
              <Link to="/login" className="btn btn-secondary btn-xl">Sign in</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────────── */

function Footer() {
  const cols = [
    {
      label: 'Product',
      links: ['DSA Practice','System Design','OOP & Patterns','Core CS','Cybersecurity','Placement Prep','Skill Assessments'],
    },
    {
      label: 'Resources',
      links: ['Daily Challenge','Flashcards','Cheat Sheets','Notes','Visualizer','Pattern Quiz','Roadmap'],
    },
    {
      label: 'Community',
      links: ['Discussion Forum','Study Squads','Leaderboard','Weekly Contests','Interview Experiences','Expert Network'],
    },
    {
      label: 'Company',
      links: ['About','Careers','Blog','Contact','Privacy Policy','Terms of Service'],
    },
  ];

  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="land-container py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <EYFMark size={20} className="text-[#09090B]" />
              <span className="font-black tracking-tight" style={{ color: '#F4F4F5' }}>EYF</span>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: '#52525B' }}>
              Engineer Your Future. The structured placement preparation platform for India's engineering students.
            </p>
            <div className="flex items-center gap-2">
              <span className="anim-pulse w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              <span className="text-xs" style={{ color: '#52525B' }}>All systems operational</span>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.label}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#3F3F46' }}>{col.label}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="/login"
                      className="text-xs transition-colors"
                      style={{ color: '#52525B' }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#A1A1AA')}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#52525B')}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: '#3F3F46' }}>© 2026 EYF — Engineer Your Future. All rights reserved.</p>
          <p className="text-xs" style={{ color: '#3F3F46' }}>Made with intent for Indian engineering students.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Landing page ─────────────────────────────────────────────────────────── */

export function LandingPage() {
  return (
    <div style={{ background: '#09090B', color: '#F4F4F5', minHeight: '100vh' }}>
      <LandingNav />
      <main>
        <HeroSection />
        <TrustBar />
        <ValueProps />
        <DSASection />
        <PlacementSection />
        <CurriculumSection />
        <StatsSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
