import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import { EYFMark } from '../components/EYFLogo';

/* ── Reveal wrapper ───────────────────────────────────────────────────────── */

function Reveal({ children, delay = 0, className = '' }: {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated counter ─────────────────────────────────────────────────────── */

function CountUp({ target, suffix = '' }: { readonly target: number; readonly suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const duration = 1400;
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);
  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

/* ── Code demo card (dark — code always lives on dark bg) ─────────────────── */

function CodeCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#0D1117',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.2)',
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#161B22' }}>
        <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
        <span className="flex-1" />
        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#8B949E' }}>
          two_sum.py
        </span>
        <span className="flex-1" />
        <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(202,138,4,0.15)', color: '#D97706' }}>
          MEDIUM
        </span>
      </div>
      {/* Code */}
      <div className="px-5 py-5 font-mono text-sm leading-7" style={{ color: '#C9D1D9' }}>
        <div>
          <span className="syn-kw">def</span>{' '}
          <span className="syn-fn">two_sum</span>
          <span style={{ color: '#8B949E' }}>(nums: list[int], target: int):</span>
        </div>
        <div className="ml-4 mt-1">
          <span style={{ color: '#8B949E' }}># hash map — O(n) time, O(n) space</span>
        </div>
        <div className="ml-4">
          <span className="syn-var">seen</span>
          <span style={{ color: '#8B949E' }}> = {}</span>
        </div>
        <div className="ml-4 mt-1">
          <span className="syn-kw">for</span>{' '}
          <span className="syn-var">i</span>
          <span style={{ color: '#8B949E' }}>, </span>
          <span className="syn-var">num</span>{' '}
          <span className="syn-kw">in</span>{' '}
          <span className="syn-fn">enumerate</span>
          <span style={{ color: '#8B949E' }}>(nums):</span>
        </div>
        <div className="ml-8">
          <span className="syn-var">diff</span>
          <span style={{ color: '#8B949E' }}> = target - num</span>
        </div>
        <div className="ml-8 mt-0.5">
          <span className="syn-kw">if</span>{' '}
          <span className="syn-var">diff</span>{' '}
          <span className="syn-kw">in</span>{' '}
          <span className="syn-var">seen</span>
          <span style={{ color: '#8B949E' }}>:</span>
        </div>
        <div className="ml-12">
          <span className="syn-kw">return</span>{' '}
          <span style={{ color: '#8B949E' }}>[seen[diff], i]</span>
        </div>
        <div className="ml-8">
          <span style={{ color: '#8B949E' }}>seen[num] = i</span>
        </div>
      </div>
      {/* Result */}
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(22,163,74,0.06)' }}
      >
        <span className="text-xs font-semibold" style={{ color: '#4ADE80' }}>
          ✓ 57/57 test cases passed
        </span>
        <span className="ml-auto text-xs font-mono" style={{ color: '#6B7280' }}>
          Runtime 34ms · Memory 14.9MB
        </span>
      </div>
    </div>
  );
}

/* ── Readiness card (light) ───────────────────────────────────────────────── */

function ReadinessCard() {
  const modules = [
    { label: 'DSA Practice',    pct: 68, color: '#2563EB' },
    { label: 'System Design',   pct: 41, color: '#0891B2' },
    { label: 'OOP & Patterns',  pct: 55, color: '#7C3AED' },
    { label: 'Core CS',         pct: 72, color: '#16A34A' },
    { label: 'Placement Prep',  pct: 33, color: '#EA580C' },
  ];
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E4E4E7',
        boxShadow: '0 20px 48px rgba(0,0,0,0.1), 0 6px 16px rgba(0,0,0,0.06)',
      }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #E4E4E7' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold" style={{ color: '#09090B' }}>Placement Readiness</span>
          <span className="text-sm font-bold" style={{ color: '#E8192C' }}>54%</span>
        </div>
        <p className="text-xs" style={{ color: '#71717A' }}>Across all technical domains</p>
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: '#F4F4F5' }}>
          <div className="h-full rounded-full" style={{ width: '54%', background: '#E8192C' }} />
        </div>
      </div>
      <div className="px-5 py-4 space-y-3.5">
        {modules.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: '#3F3F46' }}>{m.label}</span>
              <span className="text-xs font-mono font-semibold" style={{ color: m.color }}>{m.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F4F4F5' }}>
              <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
      <div
        className="px-5 py-3 flex items-center gap-2"
        style={{ borderTop: '1px solid #E4E4E7', background: '#FAFAFA' }}
      >
        <span className="text-xs" style={{ color: '#71717A' }}>Next:</span>
        <span className="text-xs font-semibold" style={{ color: '#09090B' }}>Complete System Design module</span>
        <span className="ml-auto text-xs font-bold" style={{ color: '#E8192C' }}>+30 XP →</span>
      </div>
    </div>
  );
}

/* ── Nav ──────────────────────────────────────────────────────────────────── */

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-200"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0)',
        borderBottom: scrolled ? '1px solid #E4E4E7' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px) saturate(180%)' : 'none',
      }}
    >
      <div className="land-container h-full flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label="EYF home">
          <EYFMark size={20} />
          <span className="font-black tracking-tight text-sm" style={{ color: '#09090B' }}>EYF</span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {[
            { label: 'Curriculum', href: '#curriculum' },
            { label: 'Practice',   href: '#dsa' },
            { label: 'Placement',  href: '#placement' },
            { label: 'Pricing',    href: '#pricing' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#71717A' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#09090B'; (e.currentTarget as HTMLElement).style.background = '#F4F4F5'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#71717A'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 ml-auto">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/login?tab=register" className="btn btn-primary btn-sm">Get started free</Link>
        </div>

        <button
          className="md:hidden ml-auto p-1.5 rounded-lg transition-colors"
          style={{ color: '#3F3F46' }}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-rounded text-xl">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ background: '#FFFFFF', borderColor: '#E4E4E7' }}
        >
          <div className="land-container py-4 flex flex-col gap-1">
            {['Curriculum', 'Practice', 'Placement', 'Pricing'].map((label) => (
              <a
                key={label}
                href="#curriculum"
                className="px-3 py-2.5 rounded-lg text-sm font-medium"
                style={{ color: '#3F3F46' }}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
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
    <section className="pt-32 pb-0 text-center overflow-hidden">
      <div className="land-container">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <span
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(232,25,44,0.07)', color: '#E8192C', border: '1px solid rgba(232,25,44,0.15)' }}
          >
            <span className="anim-pulse w-1.5 h-1.5 rounded-full" style={{ background: '#E8192C' }} />
            Open beta · 12,000+ students enrolled
          </span>
        </motion.div>

        <motion.h1
          className="hero-display mb-6 mx-auto"
          style={{ maxWidth: 900 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          The structured path<br />
          to your first{' '}
          <span style={{ color: '#E8192C' }}>tech offer.</span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl mx-auto mb-10 leading-relaxed"
          style={{ color: '#71717A', maxWidth: 540 }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14, ease: 'easeOut' }}
        >
          DSA, system design, OOP, core CS, and placement prep —
          built specifically for engineering students preparing for campus placements.
        </motion.p>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link to="/login?tab=register" className="btn btn-primary btn-xl">
            Start for free
            <span className="material-symbols-rounded text-base">arrow_forward</span>
          </Link>
          <a href="#curriculum" className="btn btn-secondary btn-xl">View curriculum</a>
        </motion.div>

        <motion.div
          className="flex flex-wrap items-center justify-center gap-5 text-xs mb-16"
          style={{ color: '#A1A1AA' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.28 }}
        >
          {['No credit card', 'Free tier forever', 'Start in 5 minutes'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
              {t}
            </span>
          ))}
        </motion.div>

        {/* Hero product screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto"
          style={{ maxWidth: 900 }}
        >
          {/* Browser chrome wrapper */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              boxShadow: '0 40px 80px rgba(0,0,0,0.14), 0 12px 24px rgba(0,0,0,0.08)',
              border: '1px solid #E4E4E7',
            }}
          >
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ background: '#F9FAFB', borderBottom: '1px solid #E4E4E7' }}>
              <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
              <div className="flex-1 mx-3">
                <div className="mx-auto px-3 py-1 rounded-md text-xs text-center font-mono" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', color: '#71717A', maxWidth: 240 }}>
                  app.eyf.in/dashboard
                </div>
              </div>
            </div>

            {/* App chrome — simulated dashboard */}
            <div className="flex" style={{ background: '#F9FAFB', minHeight: 420 }}>
              {/* Sidebar */}
              <div className="hidden sm:block w-48 shrink-0" style={{ background: '#FFFFFF', borderRight: '1px solid #E4E4E7', padding: '12px 8px' }}>
                <div className="flex items-center gap-2 px-2 py-2 mb-4">
                  <div className="w-5 h-5 rounded" style={{ background: '#E8192C' }} />
                  <span className="text-xs font-black" style={{ color: '#09090B' }}>EYF</span>
                </div>
                {[
                  { label: 'Dashboard', active: true },
                  { label: 'DSA Problems', active: false },
                  { label: 'System Design', active: false },
                  { label: 'Placement', active: false },
                  { label: 'Community', active: false },
                ].map(({ label, active }) => (
                  <div
                    key={label}
                    className="px-2 py-1.5 rounded-lg text-xs font-medium mb-0.5"
                    style={{
                      background: active ? 'rgba(232,25,44,0.07)' : 'transparent',
                      color: active ? '#E8192C' : '#71717A',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="flex-1 p-5">
                <p className="text-xs font-medium mb-1" style={{ color: '#A1A1AA' }}>Good morning,</p>
                <p className="text-sm font-bold mb-4" style={{ color: '#09090B' }}>Praneeth</p>
                {/* Stat tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                  {[
                    { label: 'Total XP',   value: '2,840',  color: '#E8192C' },
                    { label: 'This Week',  value: '+340',   color: '#16A34A' },
                    { label: 'Streak',     value: '14d',    color: '#EA580C' },
                    { label: 'Badges',     value: '12',     color: '#CA8A04' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7' }}>
                      <p className="text-[9px] font-semibold mb-1" style={{ color: '#A1A1AA' }}>{label}</p>
                      <p className="text-sm font-bold" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
                {/* XP bar */}
                <div className="rounded-xl p-3 mb-4" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7' }}>
                  <div className="flex justify-between text-[10px] mb-1.5" style={{ color: '#A1A1AA' }}>
                    <span>Builder · Lv.5</span><span>660 XP to Engineer</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F4F4F5' }}>
                    <div className="h-full rounded-full" style={{ width: '62%', background: '#E8192C' }} />
                  </div>
                </div>
                {/* Module mini-cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'DSA',     pct: 68, color: '#2563EB' },
                    { label: 'Design',  pct: 41, color: '#0891B2' },
                    { label: 'OOP',     pct: 55, color: '#7C3AED' },
                  ].map(({ label, pct, color }) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7' }}>
                      <p className="text-[9px] font-semibold mb-1" style={{ color: '#A1A1AA' }}>{label}</p>
                      <p className="text-xs font-bold mb-1.5" style={{ color }}>{pct}%</p>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F4F4F5' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fade-out bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #FFFFFF)' }}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ── Trust bar ────────────────────────────────────────────────────────────── */

function TrustBar() {
  const colleges = ['IIT Delhi','IIT Bombay','NIT Trichy','BITS Pilani','VIT Vellore','IIIT Hyderabad','DTU Delhi','Manipal','Anna University','SRM','PSG Tech','NSUT'];
  return (
    <section className="py-12" style={{ borderTop: '1px solid #E4E4E7', borderBottom: '1px solid #E4E4E7' }}>
      <div className="land-container">
        <p className="text-xs font-semibold text-center uppercase tracking-widest mb-5" style={{ color: '#A1A1AA' }}>
          Students preparing from
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {colleges.map((c) => (
            <span
              key={c}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: '#F9FAFB', border: '1px solid #E4E4E7', color: '#71717A' }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── DSA section ──────────────────────────────────────────────────────────── */

function DSASection() {
  const points = [
    '450+ problems organized by pattern — not just by topic',
    'Company filter: Google, Amazon, Flipkart, TCS, Infosys',
    'In-browser editor with auto test execution',
    'Time & space complexity analysis with every solution',
    'Spaced-repetition review queue for long-term retention',
  ];
  return (
    <section className="py-24" id="dsa">
      <div className="land-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <Reveal>
            <p className="section-eyebrow">DSA Practice</p>
            <h2 className="text-4xl font-bold mb-5" style={{ color: '#09090B', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Stop grinding randomly.<br />Think in patterns.
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#71717A' }}>
              Most students solve 200+ problems and still freeze in interviews. EYF structures practice around the 15 fundamental patterns that cover 80% of real interview questions.
            </p>
            <ul className="space-y-3 mb-8">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm" style={{ color: '#3F3F46' }}>
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A' }}>✓</span>
                  {p}
                </li>
              ))}
            </ul>
            <Link to="/login?tab=register" className="btn btn-primary">Start practicing free</Link>
          </Reveal>
          <Reveal delay={0.1}>
            <CodeCard />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Placement section ────────────────────────────────────────────────────── */

function PlacementSection() {
  const points = [
    'Placement readiness score across all technical domains',
    'Company-wise interview question banks with recent OA patterns',
    'Behavioral prep with STAR-format guidance',
    'ATS resume analyzer with actionable tips',
    'Role-specific prep plans for SDE, Data Analyst, DevOps',
  ];
  return (
    <section className="py-24" id="placement" style={{ background: '#F9FAFB' }}>
      <div className="land-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <Reveal delay={0.05}>
            <ReadinessCard />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="section-eyebrow">Placement Intelligence</p>
            <h2 className="text-4xl font-bold mb-5" style={{ color: '#09090B', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Know your readiness<br />before the call.
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#71717A' }}>
              EYF's Placement Score aggregates your DSA depth, system design fluency, and company-specific coverage into one honest metric. No surprises on interview day.
            </p>
            <ul className="space-y-3 mb-8">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm" style={{ color: '#3F3F46' }}>
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'rgba(234,88,12,0.1)', color: '#EA580C' }}>✓</span>
                  {p}
                </li>
              ))}
            </ul>
            <Link to="/login?tab=register" className="btn btn-primary">Check my readiness</Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Stats ────────────────────────────────────────────────────────────────── */

function StatsSection() {
  const stats = [
    { value: 12400, suffix: '+', label: 'Students enrolled', detail: 'from 200+ colleges' },
    { value: 450,   suffix: '+', label: 'Problems & solutions', detail: 'with pattern tags' },
    { value: 94,    suffix: '%', label: 'Placement success rate', detail: 'among Pro users' },
    { value: 60,    suffix: '+', label: 'Company resources', detail: 'Google · Amazon · more' },
  ];
  return (
    <section className="py-20" style={{ borderTop: '1px solid #E4E4E7' }}>
      <div className="land-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <div>
                <div
                  className="text-5xl font-black mb-2"
                  style={{ color: '#09090B', letterSpacing: '-0.04em', lineHeight: 1 }}
                >
                  <CountUp target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: '#3F3F46' }}>{s.label}</div>
                <div className="text-xs" style={{ color: '#A1A1AA' }}>{s.detail}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Curriculum ───────────────────────────────────────────────────────────── */

function CurriculumSection() {
  const modules = [
    { icon: 'code',              label: 'DSA Practice',       desc: '450+ problems · 15 patterns',      color: '#2563EB' },
    { icon: 'architecture',      label: 'System Design',      desc: 'HLD · LLD · Real systems',          color: '#0891B2' },
    { icon: 'account_tree',      label: 'OOP & Design Patterns', desc: 'SOLID · GoF · UML',             color: '#7C3AED' },
    { icon: 'terminal',          label: 'Core CS Subjects',   desc: 'OS · DBMS · Networks',              color: '#16A34A' },
    { icon: 'shield',            label: 'Cybersecurity',      desc: 'OWASP · CTF · Web security',        color: '#E8192C' },
    { icon: 'work_history',      label: 'Placement Prep',     desc: 'Companies · Resume · Mock',         color: '#EA580C' },
    { icon: 'fact_check',        label: 'Skill Assessments',  desc: 'Timed tests · Certificates',        color: '#CA8A04' },
    { icon: 'style',             label: 'Flashcards & Notes', desc: 'Spaced repetition · Quick review',  color: '#A855F7' },
    { icon: 'forum',             label: 'Community',          desc: 'Squads · Discussion · Mentors',     color: '#6366F1' },
  ];
  return (
    <section className="py-24" id="curriculum" style={{ background: '#F9FAFB' }}>
      <div className="land-container">
        <Reveal className="mb-12">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="section-eyebrow">Full Curriculum</p>
              <h2 className="text-4xl font-bold" style={{ color: '#09090B', letterSpacing: '-0.03em' }}>
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
            <Reveal key={m.label} delay={i * 0.04}>
              <div
                className="flex items-start gap-4 p-4 rounded-xl group cursor-pointer"
                style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#D4D4D8'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E4E4E7'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${m.color}12` }}>
                  <span className="material-symbols-rounded text-lg" style={{ color: m.color }}>{m.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#09090B' }}>{m.label}</p>
                  <p className="text-xs" style={{ color: '#A1A1AA' }}>{m.desc}</p>
                </div>
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
      quote: "I'd been grinding LeetCode randomly for months with no improvement. EYF's pattern-based approach gave me a structure that actually stuck. Cracked Juspay in 3 weeks.",
      name: 'Arjun Mehta', role: 'SDE-1 at Juspay', college: 'NIT Warangal · 2024', initials: 'AM',
    },
    {
      quote: "The readiness score was honestly humbling — I thought I was ready but it showed massive gaps in system design. That honesty saved me from failing my first interview round.",
      name: 'Priya Venkataraman', role: 'Software Engineer at Freshworks', college: 'Anna University · 2024', initials: 'PV',
    },
    {
      quote: "Finally a platform that treats DSA and placement prep as connected things. The company-specific question banks are gold — I had 3 exact questions from Zoho's OA.",
      name: 'Rohit Sharma', role: 'Associate Engineer at Zoho', college: 'VIT Vellore · 2023', initials: 'RS',
    },
  ];
  return (
    <section className="py-24" style={{ borderTop: '1px solid #E4E4E7' }}>
      <div className="land-container">
        <Reveal className="mb-12 text-center">
          <p className="section-eyebrow">Student Outcomes</p>
          <h2 className="text-4xl font-bold" style={{ color: '#09090B', letterSpacing: '-0.03em' }}>
            From preparation to placement.
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div className="testimonial-card h-full flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[0,1,2,3,4].map((s) => (
                    <span key={s} style={{ color: '#CA8A04' }}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: '#3F3F46' }}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="avatar avatar-sm">{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#09090B' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#71717A' }}>{t.role}</p>
                    <p className="text-xs" style={{ color: '#A1A1AA' }}>{t.college}</p>
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
      desc: 'Everything to start your placement journey.',
      features: ['100 DSA problems with explanations', 'Core CS subjects (full access)', 'Daily coding challenge', 'Basic progress tracking', 'Community access'],
      cta: 'Get started free',
      featured: false,
    },
    {
      name: 'Pro',
      price: '₹499',
      period: 'per month',
      desc: 'The full EYF experience for serious aspirants.',
      features: ['All 450+ DSA problems & solutions', 'Complete placement module', 'Company-wise question banks (60+)', 'ATS resume analyzer', 'Mock interview access', 'Unlimited skill assessments'],
      cta: 'Start Pro trial',
      featured: true,
      tag: 'Most popular',
    },
    {
      name: 'Pro+',
      price: '₹999',
      period: 'per month',
      desc: 'Mentorship and personalized guidance.',
      features: ['Everything in Pro', '1-on-1 mentor sessions', 'Resume review by experts', 'LinkedIn optimization', 'Referral network access', 'Placement guarantee support'],
      cta: 'Contact us',
      featured: false,
    },
  ];
  return (
    <section className="py-24" id="pricing" style={{ background: '#F9FAFB', borderTop: '1px solid #E4E4E7' }}>
      <div className="land-container">
        <Reveal className="mb-12 text-center land-container-sm mx-auto">
          <p className="section-eyebrow">Pricing</p>
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#09090B', letterSpacing: '-0.03em' }}>
            Honest pricing. No surprises.
          </h2>
          <p className="text-base" style={{ color: '#71717A' }}>
            Start free, upgrade when you need more. Most students get placed on the Pro plan.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.07}>
              <div className={`pricing-card relative ${plan.featured ? 'pricing-card-featured' : ''}`}>
                {plan.featured && plan.tag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: '#E8192C', color: '#fff' }}
                    >
                      {plan.tag}
                    </span>
                  </div>
                )}
                <p
                  className="text-sm font-bold mb-1"
                  style={{ color: plan.featured ? '#F4F4F5' : '#09090B' }}
                >
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span
                    className="text-4xl font-black"
                    style={{ color: plan.featured ? '#FFFFFF' : '#09090B', letterSpacing: '-0.04em', lineHeight: 1 }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-xs" style={{ color: plan.featured ? '#71717A' : '#A1A1AA' }}>/{plan.period}</span>
                </div>
                <p className="text-xs mb-6" style={{ color: plan.featured ? '#71717A' : '#71717A' }}>{plan.desc}</p>
                <div className="h-px mb-6" style={{ background: plan.featured ? 'rgba(255,255,255,0.08)' : '#E4E4E7' }} />
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs">
                      <span className="shrink-0 mt-0.5 font-bold" style={{ color: plan.featured ? '#4ADE80' : '#16A34A' }}>✓</span>
                      <span style={{ color: plan.featured ? '#A1A1AA' : '#3F3F46' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login?tab=register"
                  className={`btn w-full justify-center ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}
                >
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

/* ── CTA (dark contrast) ──────────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="py-24 section-dark">
      <div className="land-container text-center">
        <Reveal>
          <p className="section-eyebrow" style={{ color: '#52525B' }}>Ready to start?</p>
          <h2
            className="text-5xl font-black mb-5 mx-auto"
            style={{ color: '#FFFFFF', letterSpacing: '-0.04em', lineHeight: 1.05, maxWidth: 600 }}
          >
            Join 12,000+ students preparing on EYF.
          </h2>
          <p className="text-base mb-10 mx-auto" style={{ color: '#71717A', maxWidth: 400 }}>
            Free forever. No credit card. Start solving and tracking your placement readiness in under 5 minutes.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/login?tab=register" className="btn btn-primary btn-xl">
              Create free account
              <span className="material-symbols-rounded text-base">arrow_forward</span>
            </Link>
            <Link
              to="/login"
              className="btn btn-xl"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#F4F4F5', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              Sign in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────────── */

function Footer() {
  const cols = [
    { label: 'Product', links: ['DSA Practice','System Design','OOP & Patterns','Core CS','Cybersecurity','Placement Prep'] },
    { label: 'Resources', links: ['Daily Challenge','Flashcards','Cheat Sheets','Notes','Visualizer','Pattern Quiz'] },
    { label: 'Community', links: ['Discussion Forum','Study Squads','Leaderboard','Weekly Contests','Expert Network'] },
    { label: 'Company', links: ['About','Careers','Blog','Contact','Privacy Policy','Terms of Service'] },
  ];
  return (
    <footer style={{ background: '#FFFFFF', borderTop: '1px solid #E4E4E7' }}>
      <div className="land-container py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <EYFMark size={18} />
              <span className="font-black tracking-tight text-sm" style={{ color: '#09090B' }}>EYF</span>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: '#A1A1AA' }}>
              Engineer Your Future. The structured placement preparation platform for India's engineering students.
            </p>
            <div className="flex items-center gap-2">
              <span className="anim-pulse w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#16A34A' }} />
              <span className="text-xs" style={{ color: '#A1A1AA' }}>All systems operational</span>
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.label}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4D4D8' }}>{col.label}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="/login"
                      className="text-xs transition-colors"
                      style={{ color: '#A1A1AA' }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#09090B')}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#A1A1AA')}
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
          <p className="text-xs" style={{ color: '#D4D4D8' }}>© 2026 EYF — Engineer Your Future. All rights reserved.</p>
          <p className="text-xs" style={{ color: '#D4D4D8' }}>Made with intent for Indian engineering students.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Export ───────────────────────────────────────────────────────────────── */

export function LandingPage() {
  return (
    <div style={{ background: '#FFFFFF', color: '#09090B', minHeight: '100vh' }}>
      <LandingNav />
      <main>
        <HeroSection />
        <TrustBar />
        <DSASection />
        <PlacementSection />
        <StatsSection />
        <CurriculumSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
