import MarqueeLib from 'react-fast-marquee';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Marquee = ((MarqueeLib as any).default ?? MarqueeLib) as typeof MarqueeLib;
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { EYFMark } from '../components/EYFLogo';

/* ── Design tokens ─────────────────────────────────────────────────────── */
const D = {
  bg:     '#09090B',
  surf:   '#111113',
  elev:   '#18181B',
  accent: '#E82127',
  t1:     '#FAFAFA',
  t2:     '#A1A1AA',
  t3:     '#71717A',
  t4:     '#3F3F46',
  border: '#3F3F46',
  muted:  '#27272A',
};

/* ── Film grain ─────────────────────────────────────────────────────────── */
function Grain() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        opacity: 0.03,
        mixBlendMode: 'overlay',
      }}
    />
  );
}

/* ── Structural grid ─────────────────────────────────────────────────────── */
function GridBg() {
  return (
    <div aria-hidden style={{
      position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
      backgroundSize: '80px 80px',
      maskImage: 'linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)',
    }} />
  );
}

/* ── ClipReveal — signature slide-up from hidden mask ──────────────────── */
function ClipReveal({ children, delay = 0, duration = 0.85, style = {}, className = '' }: {
  children: ReactNode; delay?: number; duration?: number; style?: CSSProperties; className?: string;
}) {
  return (
    <div style={{ overflow: 'hidden', display: 'block', ...style }} className={className}>
      <motion.div
        initial={{ y: '105%' }}
        whileInView={{ y: '0%' }}
        viewport={{ once: true, margin: '-20px' }}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ── HeroReveal — uses animate (not whileInView) for above-fold content ── */
function HeroReveal({ children, delay = 0, style = {}, className = '' }: {
  children: ReactNode; delay?: number; style?: CSSProperties; className?: string;
}) {
  return (
    <div style={{ overflow: 'hidden', display: 'block', ...style }} className={className}>
      <motion.div
        initial={{ y: '105%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ── FadeUp ─────────────────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, style = {}, className = '' }: {
  children: ReactNode; delay?: number; style?: CSSProperties; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── EditorialNum ───────────────────────────────────────────────────────── */
function EditorialNum({ n, align = 'right' }: { n: string; align?: 'left' | 'right' }) {
  return (
    <div aria-hidden style={{
      position: 'absolute',
      top: -20,
      ...(align === 'right' ? { right: -16 } : { left: -16 }),
      fontSize: 'clamp(120px, 20vw, 280px)',
      fontWeight: 900,
      fontFamily: 'Space Grotesk, sans-serif',
      color: 'rgba(255,255,255,0.03)',
      letterSpacing: '-0.06em',
      lineHeight: 1,
      pointerEvents: 'none',
      userSelect: 'none',
    }}>
      {n}
    </div>
  );
}

/* ── LandingNav ─────────────────────────────────────────────────────────── */
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 clamp(16px, 4vw, 48px)',
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(9,9,11,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? `1px solid ${D.border}` : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <EYFMark size={24} />
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 15, letterSpacing: '-0.04em', color: D.t1, textTransform: 'uppercase' }}>EYF</span>
      </Link>

      <nav className="hidden md:flex" style={{ gap: 40 }}>
        {[['#showcase', 'Platform'], ['#curriculum', 'Curriculum'], ['#pricing', 'Pricing']].map(([href, label]) => (
          <a key={href} href={href} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.t3, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = D.t1)}
            onMouseLeave={e => (e.currentTarget.style.color = D.t3)}
          >{label}</a>
        ))}
      </nav>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link to="/login" className="md:block" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: D.t3, textDecoration: 'none', padding: '8px 16px', display: 'none' }}>Sign in</Link>
        <Link to="/login?tab=register" style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#000', background: D.accent, padding: '10px 20px', textDecoration: 'none', display: 'inline-block' }}>
          Start free
        </Link>
      </div>
    </header>
  );
}

/* ── HeroSection ────────────────────────────────────────────────────────── */
function HeroSection() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 600], [1, 1.08]);
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 200], [1, 0]);

  return (
    <motion.section style={{
      minHeight: '100dvh', background: D.bg, position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      paddingTop: 80, paddingBottom: 0, opacity: heroOpacity,
    }}>
      <GridBg />

      <div aria-hidden style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 400, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(232,33,39,0.07) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
      }} />

      <motion.div style={{ scale: heroScale, position: 'relative', zIndex: 1 }}>
        <div style={{ padding: 'clamp(16px, 5vw, 80px)', maxWidth: '95vw', margin: '0 auto' }}>

          <FadeUp delay={0}>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 16px', border: `1px solid rgba(232,33,39,0.3)`,
                background: 'rgba(232,33,39,0.06)',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent,
              }}>
                <span style={{ width: 5, height: 5, background: D.accent, borderRadius: '50%', display: 'inline-block' }} />
                Open beta · 12,000+ students enrolled
              </span>
            </div>
          </FadeUp>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <HeroReveal delay={0.05}>
              <h1 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(3rem, 12vw, 14rem)',
                fontWeight: 700, lineHeight: 0.88,
                letterSpacing: '-0.05em',
                textTransform: 'uppercase',
                color: D.t1, margin: 0,
              }}>The</h1>
            </HeroReveal>
            <HeroReveal delay={0.12}>
              <h1 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(3rem, 12vw, 14rem)',
                fontWeight: 700, lineHeight: 0.88,
                letterSpacing: '-0.05em',
                textTransform: 'uppercase',
                color: D.t1, margin: 0,
              }}>structured</h1>
            </HeroReveal>
            <HeroReveal delay={0.2}>
              <h1 style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(3rem, 12vw, 14rem)',
                fontWeight: 700, lineHeight: 0.88,
                letterSpacing: '-0.05em',
                textTransform: 'uppercase',
                color: D.accent, margin: 0,
              }}>path.</h1>
            </HeroReveal>
          </div>

          <FadeUp delay={0.5}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
              <div style={{ width: 80, height: 2, background: D.accent }} />
            </div>
          </FadeUp>

          <FadeUp delay={0.65}>
            <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, color: D.t2, lineHeight: 1.7, marginBottom: 40 }}>
                DSA, system design, core CS, and placement prep — one platform, one path to your first tech offer.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
                <Link to="/login?tab=register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  height: 56, padding: '0 36px',
                  background: D.accent, color: '#000',
                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                  textDecoration: 'none', border: `2px solid ${D.accent}`,
                }}>
                  Start free →
                </Link>
                <a href="#showcase" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  height: 56, padding: '0 36px',
                  background: 'transparent', color: D.t1,
                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                  textDecoration: 'none', border: `2px solid ${D.border}`,
                }}>
                  See platform
                </a>
              </div>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['No credit card', 'Free tier forever', '5 min setup'].map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: D.t4 }}>
                    <span style={{ color: '#4ADE80', fontWeight: 700 }}>✓</span> {t}
                  </span>
                ))}
              </div>
            </div>
          </FadeUp>

        </div>
      </motion.div>

      <motion.div
        style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', opacity: scrollIndicatorOpacity }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div style={{ width: 1, height: 48, background: `linear-gradient(to bottom, ${D.accent}, transparent)`, margin: '0 auto' }} />
      </motion.div>
    </motion.section>
  );
}

/* ── StatsMarquee ───────────────────────────────────────────────────────── */
const STATS_ITEMS = [
  { value: '12,400+', label: 'Students' },
  { value: '450+',    label: 'Problems' },
  { value: '94%',     label: 'Placement rate' },
  { value: '60+',     label: 'Companies' },
  { value: '#1',      label: 'Placement platform' },
  { value: '15',      label: 'DSA patterns' },
  { value: '4.9★',    label: 'Rating' },
  { value: '200+',    label: 'Colleges' },
];

function StatsMarquee() {
  return (
    <section style={{ background: D.accent, borderTop: `2px solid ${D.accent}`, borderBottom: `2px solid ${D.accent}`, padding: '24px 0', overflow: 'hidden' }}>
      <Marquee speed={80} gradient={false} autoFill>
        {STATS_ITEMS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 40, marginRight: 80 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{
                fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(24px, 4vw, 40px)',
                letterSpacing: '-0.04em', color: '#000', lineHeight: 1,
              }}>{s.value}</span>
              <span style={{
                fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 11,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.6)',
              }}>{s.label}</span>
            </div>
            {i < STATS_ITEMS.length - 1 && (
              <span style={{ fontSize: 20, color: 'rgba(0,0,0,0.25)', fontWeight: 300 }}>×</span>
            )}
          </div>
        ))}
      </Marquee>
    </section>
  );
}

/* ── TrustBar ───────────────────────────────────────────────────────────── */
function TrustBar() {
  const colleges = ['IIT Delhi','IIT Bombay','NIT Trichy','BITS Pilani','VIT Vellore','IIIT Hyderabad','DTU Delhi','Manipal','Anna University','SRM','PSG Tech','NSUT'];
  return (
    <section style={{ background: D.bg, borderBottom: `1px solid ${D.border}`, padding: '32px 0' }}>
      <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.t4, marginBottom: 20 }}>Students from</p>
      <Marquee speed={40} gradient={false} autoFill>
        {colleges.map(c => (
          <span key={c} style={{ marginRight: 64, fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', color: D.t4 }}>{c}</span>
        ))}
      </Marquee>
    </section>
  );
}

/* ── HowItWorksSection ──────────────────────────────────────────────────── */
const STEPS = [
  { num: '01', label: 'Assess', title: 'KNOW WHERE\nYOU STAND.', body: 'Take the readiness test. Get a precise gap analysis across DSA, system design, and placement skills.', icon: 'analytics', color: '#3B82F6', metric: '94% accuracy' },
  { num: '02', label: 'Plan', title: 'FOLLOW THE\nPATH.', body: 'A personalized curriculum for campus placements. Modules unlock in sequence — always know what to do next.', icon: 'route', color: '#A78BFA', metric: '3× faster prep' },
  { num: '03', label: 'Practice', title: 'SOLVE WITH\nPURPOSE.', body: '450+ problems tagged by pattern. Track streaks, earn XP, move through tiers without hitting walls.', icon: 'code', color: '#22D3EE', metric: '450+ problems' },
  { num: '04', label: 'Simulate', title: 'REHEARSE\nTHE REAL.', body: 'Mock interviews, company prep kits, ATS resume scoring. Know your weak spots before the recruiter does.', icon: 'work_history', color: '#4ADE80', metric: '60+ companies' },
  { num: '05', label: 'Offer', title: 'GET THE\nOFFER.', body: "Track every application. Prep per company. Walk in knowing you're ready. The offer is the expected outcome.", icon: 'emoji_events', color: D.accent, metric: '94% placed' },
];

function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const progressHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const STEP_RANGES = STEPS.map((_, i) => ({
    start: i / STEPS.length,
    end: (i + 1) / STEPS.length,
  }));

  const o0 = useTransform(scrollYProgress, [STEP_RANGES[0].start, STEP_RANGES[0].start + 0.06, STEP_RANGES[0].end - 0.06, STEP_RANGES[0].end], [0,1,1,0]);
  const o1 = useTransform(scrollYProgress, [STEP_RANGES[1].start, STEP_RANGES[1].start + 0.06, STEP_RANGES[1].end - 0.06, STEP_RANGES[1].end], [0,1,1,0]);
  const o2 = useTransform(scrollYProgress, [STEP_RANGES[2].start, STEP_RANGES[2].start + 0.06, STEP_RANGES[2].end - 0.06, STEP_RANGES[2].end], [0,1,1,0]);
  const o3 = useTransform(scrollYProgress, [STEP_RANGES[3].start, STEP_RANGES[3].start + 0.06, STEP_RANGES[3].end - 0.06, STEP_RANGES[3].end], [0,1,1,0]);
  const o4 = useTransform(scrollYProgress, [STEP_RANGES[4].start, STEP_RANGES[4].start + 0.06, STEP_RANGES[4].end - 0.06, STEP_RANGES[4].end], [0,1,1,0]);

  const y0 = useTransform(scrollYProgress, [STEP_RANGES[0].start, STEP_RANGES[0].start + 0.08], [60, 0]);
  const y1 = useTransform(scrollYProgress, [STEP_RANGES[1].start, STEP_RANGES[1].start + 0.08], [60, 0]);
  const y2 = useTransform(scrollYProgress, [STEP_RANGES[2].start, STEP_RANGES[2].start + 0.08], [60, 0]);
  const y3 = useTransform(scrollYProgress, [STEP_RANGES[3].start, STEP_RANGES[3].start + 0.08], [60, 0]);
  const y4 = useTransform(scrollYProgress, [STEP_RANGES[4].start, STEP_RANGES[4].start + 0.08], [60, 0]);

  const opacities = [o0, o1, o2, o3, o4];
  const ys = [y0, y1, y2, y3, y4];

  return (
    <section ref={containerRef} style={{ height: '250vh', position: 'relative', background: D.bg }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 80, left: 'clamp(16px, 5vw, 80px)', zIndex: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent, marginBottom: 8 }}>How it works</p>
        </div>

        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: D.muted, zIndex: 10 }}>
          <motion.div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: progressHeight,
            background: D.accent,
          }} />
        </div>

        {STEPS.map((step, i) => (
          <motion.div key={step.num} style={{
            position: 'absolute', inset: 0, opacity: opacities[i], y: ys[i],
            display: 'flex', alignItems: 'center',
            padding: 'clamp(16px, 5vw, 80px)',
            paddingTop: 120,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40, width: '100%', maxWidth: '90vw', margin: '0 auto' }} className="lg:grid-two-col">
              <div style={{ position: 'relative' }}>
                <EditorialNum n={step.num} align="left" />
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: step.color, marginBottom: 16, position: 'relative', zIndex: 1 }}>{step.label}</p>
                <h2 style={{
                  fontFamily: 'Space Grotesk', fontWeight: 700,
                  fontSize: 'clamp(2.5rem, 7vw, 6rem)',
                  letterSpacing: '-0.04em', lineHeight: 0.95,
                  textTransform: 'uppercase', color: D.t1,
                  marginBottom: 24, position: 'relative', zIndex: 1,
                  whiteSpace: 'pre-line',
                }}>{step.title}</h2>
                <p style={{ fontSize: 15, color: D.t2, lineHeight: 1.7, maxWidth: 420, position: 'relative', zIndex: 1 }}>{step.body}</p>
              </div>
              <div className="hidden lg:flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  border: `2px solid ${D.border}`, padding: '48px 40px',
                  background: D.elev, width: '100%', maxWidth: 340,
                  position: 'relative', overflow: 'hidden',
                  cursor: 'default',
                  transition: 'background 0.3s, border-color 0.3s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = D.accent;
                  el.style.borderColor = D.accent;
                  el.querySelectorAll('[data-invert]').forEach(c => { (c as HTMLElement).style.color = '#000'; });
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = D.elev;
                  el.style.borderColor = D.border;
                  el.querySelectorAll('[data-invert]').forEach(c => { (c as HTMLElement).style.color = ''; });
                }}
                >
                  <span className="material-symbols-rounded" data-invert style={{ fontSize: 48, color: step.color, display: 'block', marginBottom: 20, transition: 'color 0.3s' }}>{step.icon}</span>
                  <p data-invert style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.05em', lineHeight: 1, color: D.t1, marginBottom: 8, transition: 'color 0.3s' }}>{step.metric}</p>
                  <p data-invert style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: D.t3, transition: 'color 0.3s' }}>{step.label}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── CodeCard ───────────────────────────────────────────────────────────── */
function CodeCard() {
  return (
    <div style={{ background: '#0B0F18', border: `1px solid ${D.border}`, borderRadius: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', background: '#0F1520', borderBottom: `1px solid ${D.border}` }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c) => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />)}
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 10px', background: 'rgba(255,255,255,0.04)', color: '#555' }}>two_sum.py</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', background: 'rgba(202,138,4,0.12)', color: '#D97706', letterSpacing: '0.04em' }}>MEDIUM</span>
      </div>
      <div style={{ padding: '20px 22px', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.9, color: '#C9D1D9' }}>
        <div><span style={{ color: '#FF7B72' }}>def </span><span style={{ color: '#79C0FF' }}>two_sum</span><span style={{ color: '#555' }}>(nums: list[int], target: int):</span></div>
        <div style={{ marginLeft: 20 }}><span style={{ color: '#555' }}># O(n) hash map approach</span></div>
        <div style={{ marginLeft: 20 }}><span style={{ color: '#FFA657' }}>seen</span><span style={{ color: '#555' }}> = {'{}'}</span></div>
        <div style={{ marginLeft: 20, marginTop: 4 }}><span style={{ color: '#FF7B72' }}>for </span><span style={{ color: '#FFA657' }}>i</span><span style={{ color: '#555' }}>, </span><span style={{ color: '#FFA657' }}>num</span><span style={{ color: '#FF7B72' }}> in </span><span style={{ color: '#79C0FF' }}>enumerate</span><span style={{ color: '#555' }}>(nums):</span></div>
        <div style={{ marginLeft: 40 }}><span style={{ color: '#FFA657' }}>diff</span><span style={{ color: '#555' }}> = target - num</span></div>
        <div style={{ marginLeft: 40 }}><span style={{ color: '#FF7B72' }}>if </span><span style={{ color: '#FFA657' }}>diff</span><span style={{ color: '#FF7B72' }}> in </span><span style={{ color: '#FFA657' }}>seen</span><span style={{ color: '#555' }}>:</span></div>
        <div style={{ marginLeft: 60 }}><span style={{ color: '#FF7B72' }}>return </span><span style={{ color: '#555' }}>[seen[diff], i]</span></div>
        <div style={{ marginLeft: 40 }}><span style={{ color: '#555' }}>seen[num] = i</span></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderTop: `1px solid ${D.border}`, background: 'rgba(74,222,128,0.03)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#4ADE80' }}>✓ 57/57 test cases passed</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'monospace', color: '#333' }}>Runtime 34ms · 14.9MB</span>
      </div>
    </div>
  );
}

/* ── ReadinessCard ──────────────────────────────────────────────────────── */
function ReadinessCard() {
  const mods = [
    { label: 'DSA Practice',   pct: 68, color: '#3B82F6' },
    { label: 'System Design',  pct: 41, color: '#22D3EE' },
    { label: 'OOP & Patterns', pct: 55, color: '#A78BFA' },
    { label: 'Core CS',        pct: 72, color: '#4ADE80' },
    { label: 'Placement Prep', pct: 33, color: '#FB923C' },
  ];
  return (
    <div style={{ background: D.elev, border: `1px solid ${D.border}`, borderRadius: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${D.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: D.t1 }}>Placement Readiness</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: D.accent }}>54%</span>
        </div>
        <p style={{ fontSize: 11, color: D.t4, marginBottom: 12 }}>Across all technical domains</p>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ width: '54%', height: '100%', background: D.accent }} />
        </div>
      </div>
      <div style={{ padding: '18px 22px' }}>
        {mods.map((m) => (
          <div key={m.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: D.t3 }}>{m.label}</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: m.color }}>{m.pct}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ width: `${m.pct}%`, height: '100%', background: m.color }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '13px 22px', borderTop: `1px solid ${D.border}`, background: 'rgba(255,255,255,0.015)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: D.t4 }}>Next:</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: D.t2 }}>Complete System Design module</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: D.accent }}>+30 XP →</span>
      </div>
    </div>
  );
}

/* ── SystemDesignCard ───────────────────────────────────────────────────── */
function SystemDesignCard() {
  const nodes = [
    { label: 'Client',       x: 50, y: 10, color: '#3B82F6' },
    { label: 'CDN',          x: 20, y: 35, color: '#22D3EE' },
    { label: 'API Gateway',  x: 50, y: 40, color: '#A78BFA' },
    { label: 'Auth Service', x: 20, y: 65, color: '#4ADE80' },
    { label: 'DB (Primary)', x: 50, y: 70, color: '#FB923C' },
    { label: 'Cache (Redis)',x: 78, y: 55, color: '#FBBF24' },
  ];
  const edges: [number, number][] = [[0,1],[0,2],[2,3],[2,4],[2,5]];
  return (
    <div style={{ background: '#0B0F18', border: `1px solid ${D.border}`, borderRadius: 0, overflow: 'hidden', padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: D.t1 }}>URL Shortener — System Design</p>
          <p style={{ fontSize: 11, color: D.t3 }}>HLD · Scalability · 100M requests/day</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>HARD</span>
      </div>
      <div style={{ position: 'relative', height: 200 }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {edges.map(([a,b]) => {
            const na = nodes[a], nb = nodes[b];
            return (
              <line key={`${a}-${b}`}
                x1={`${na.x}%`} y1={`${na.y + 5}%`}
                x2={`${nb.x}%`} y2={`${nb.y + 5}%`}
                stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 3"
              />
            );
          })}
        </svg>
        {nodes.map((n) => (
          <div key={n.label} style={{ position: 'absolute', left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)' }}>
            <div style={{ padding: '5px 10px', fontSize: 10, fontWeight: 600, background: `${n.color}14`, border: `1px solid ${n.color}30`, color: n.color, whiteSpace: 'nowrap' }}>{n.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
        {['Horizontal scaling','Load balancing','Cache layer','DB sharding'].map((t) => (
          <span key={t} style={{ fontSize: 10, padding: '3px 9px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`, color: D.t3 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── FeatureShowcase ────────────────────────────────────────────────────── */
const FEATURES = [
  {
    eyebrow: 'DSA Practice',
    accentColor: '#3B82F6',
    heading: 'PATTERN-BASED\nDSA.',
    body: 'Stop grinding randomly. 450+ problems organized by pattern — Two Pointers, Dynamic Programming, Graphs — so each problem teaches you something transferable.',
    points: ['15 core patterns with cross-problem links', 'Difficulty tiers: warm-up → interview-ready', 'XP and streak system that keeps you consistent'],
    card: <CodeCard />,
  },
  {
    eyebrow: 'Placement Readiness',
    accentColor: '#4ADE80',
    heading: 'KNOW YOUR\nGAPS.',
    body: 'The readiness score shows exactly where you stand versus what recruiters actually test. Not a percentage — a real breakdown by skill area.',
    points: ['Gap analysis across 6 skill dimensions', 'Tracks improvement over time', 'Benchmarked against successful placements'],
    card: <ReadinessCard />,
  },
  {
    eyebrow: 'System Design',
    accentColor: '#A78BFA',
    heading: 'DESIGN AT\nSCALE.',
    body: 'HLD, LLD, real system deep-dives. Study how Netflix handles 200M users, how WhatsApp delivers 100B messages, and how to explain it all in 45 minutes.',
    points: ['HLD + LLD frameworks', '20+ real system case studies', 'Interview-format guided walkthroughs'],
    card: <SystemDesignCard />,
  },
];

function FeatureShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  return (
    <div id="showcase" ref={containerRef} style={{ height: '360vh', position: 'relative', background: D.bg, borderTop: `1px solid ${D.border}` }}>
      <div style={{ position: 'sticky', top: 0, height: 0, zIndex: 20 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 4, height: '100vh', background: D.muted }}>
          <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: D.accent, height: useTransform(scrollYProgress, [0,1], ['0%','100%']) }} />
        </div>
      </div>

      {FEATURES.map((feat, i) => (
        <div key={feat.eyebrow} style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: D.bg, borderTop: i > 0 ? `1px solid ${D.border}` : 'none' }}>
          <div style={{ padding: 'clamp(16px, 5vw, 80px)', paddingTop: 100, width: '100%', maxWidth: '95vw', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 48, alignItems: 'center' }} className="lg:grid-two-col">
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: feat.accentColor, marginBottom: 20 }}>{feat.eyebrow}</p>
                <h2 style={{
                  fontFamily: 'Space Grotesk', fontWeight: 700,
                  fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                  letterSpacing: '-0.04em', lineHeight: 0.95,
                  textTransform: 'uppercase',
                  color: D.t1, marginBottom: 20,
                  whiteSpace: 'pre-line',
                }}>{feat.heading}</h2>
                <p style={{ fontSize: 15, color: D.t2, lineHeight: 1.75, marginBottom: 24, maxWidth: 440 }}>{feat.body}</p>
                <ul style={{ marginBottom: 36, padding: 0, listStyle: 'none' }}>
                  {feat.points.map(p => (
                    <li key={p} style={{ display: 'flex', gap: 12, fontSize: 13, color: D.t2, marginBottom: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: feat.accentColor, flexShrink: 0, marginTop: 2 }}>—</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <Link to="/login?tab=register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  height: 48, padding: '0 28px',
                  background: 'transparent', color: D.t1,
                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                  textDecoration: 'none', border: `2px solid ${D.border}`,
                }}>Get started free</Link>
              </div>
              <div className="hidden lg:block" style={{ border: `1px solid ${D.border}` }}>
                {feat.card}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── CurriculumSection ──────────────────────────────────────────────────── */
const MODULES = [
  { icon: 'code',         label: 'DSA Practice',      desc: '450+ problems · 15 patterns',   color: '#3B82F6', num: '01' },
  { icon: 'architecture', label: 'System Design',     desc: 'HLD · LLD · Real systems',      color: '#22D3EE', num: '02' },
  { icon: 'account_tree', label: 'OOP & Design',      desc: 'SOLID · GoF · UML',             color: '#A78BFA', num: '03' },
  { icon: 'terminal',     label: 'Core CS',           desc: 'OS · DBMS · Networks',          color: '#4ADE80', num: '04' },
  { icon: 'shield',       label: 'Cybersecurity',     desc: 'OWASP · CTF · Web security',    color: D.accent,  num: '05' },
  { icon: 'work_history', label: 'Placement Prep',    desc: 'Companies · Resume · Mock',     color: '#FB923C', num: '06' },
  { icon: 'fact_check',   label: 'Skill Assessments', desc: 'Timed tests · Certificates',    color: '#FBBF24', num: '07' },
  { icon: 'style',        label: 'Flashcards',        desc: 'Spaced repetition · Review',    color: '#F472B6', num: '08' },
  { icon: 'forum',        label: 'Community',         desc: 'Squads · Discussion · Mentors', color: '#818CF8', num: '09' },
];

function CurriculumSection() {
  return (
    <section id="curriculum" style={{ background: D.bg, padding: '128px 0', borderTop: `1px solid ${D.border}` }}>
      <div style={{ padding: '0 clamp(16px, 5vw, 80px)', maxWidth: '95vw', margin: '0 auto' }}>
        <div style={{ marginBottom: 72 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent, marginBottom: 16 }}>Full curriculum</p>
          <ClipReveal>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', letterSpacing: '-0.04em', lineHeight: 0.95, textTransform: 'uppercase', color: D.t1, margin: 0 }}>
              Everything in<br />one place.
            </h2>
          </ClipReveal>
        </div>

        <div>
          {MODULES.map((m, i) => (
            <FadeUp key={m.label} delay={i * 0.04}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 0', borderBottom: `1px solid ${D.border}`,
                cursor: 'default', transition: 'background 0.25s, padding 0.25s',
                gap: 16,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.background = D.accent;
                el.style.padding = '20px 16px';
                el.querySelectorAll('[data-mi]').forEach(c => { (c as HTMLElement).style.color = '#000'; });
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.background = 'transparent';
                el.style.padding = '20px 0';
                el.querySelectorAll('[data-mi]').forEach(c => { (c as HTMLElement).style.color = ''; });
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <span data-mi style={{ fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700, color: D.t4, letterSpacing: '0.06em', minWidth: 28, transition: 'color 0.25s' }}>{m.num}</span>
                  <span className="material-symbols-rounded" data-mi style={{ fontSize: 20, color: m.color, transition: 'color 0.25s' }}>{m.icon}</span>
                  <span data-mi style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(15px, 2.5vw, 20px)', fontWeight: 700, letterSpacing: '-0.01em', textTransform: 'uppercase', color: D.t1, transition: 'color 0.25s' }}>{m.label}</span>
                </div>
                <span data-mi style={{ fontSize: 12, color: D.t3, letterSpacing: '0.04em', transition: 'color 0.25s', flexShrink: 0 }}>{m.desc}</span>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── TestimonialsSection ────────────────────────────────────────────────── */
const TESTIMONIALS = [
  { quote: "I'd been grinding LeetCode randomly for months. EYF's pattern-based approach gave me a structure that actually stuck. Cracked Juspay in 3 weeks.", name: 'Arjun Mehta', role: 'SDE-1 at Juspay', college: 'NIT Warangal · 2024' },
  { quote: "The readiness score was honestly humbling — showed massive gaps in system design. That honesty saved me from failing my first interview round.", name: 'Priya Venkataraman', role: 'Software Engineer at Freshworks', college: 'Anna University · 2024' },
  { quote: "Finally a platform that treats DSA and placement prep as connected. The company-specific question banks are gold — I had 3 exact questions from Zoho's OA.", name: 'Rohit Sharma', role: 'Associate Engineer at Zoho', college: 'VIT Vellore · 2023' },
  { quote: "EYF's system design module is leagues ahead of anything else I tried. The structured walkthroughs actually helped me answer HLD questions in interviews.", name: 'Keerthana Nair', role: 'Backend Engineer at Razorpay', college: 'BITS Pilani · 2024' },
  { quote: "The OOP module with design patterns was a game-changer. I went from barely understanding SOLID to confidently explaining it in interviews.", name: 'Vikram Iyer', role: 'SDE at Swiggy', college: 'IIT Delhi · 2023' },
  { quote: "Loved how the roadmap adapts. When I finished the DSA track, EYF immediately suggested core subjects gaps I had no idea about.", name: 'Sneha Reddy', role: 'Engineer at Dunzo', college: 'IIIT Hyderabad · 2024' },
];

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div style={{
      width: 340, flexShrink: 0, marginRight: 16,
      border: `2px solid ${D.border}`,
      background: D.surf, padding: 28,
      transition: 'background 0.3s, border-color 0.3s',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      const el = e.currentTarget;
      el.style.background = D.accent;
      el.style.borderColor = D.accent;
      el.querySelectorAll('[data-tc]').forEach(c => { (c as HTMLElement).style.color = '#000'; });
    }}
    onMouseLeave={e => {
      const el = e.currentTarget;
      el.style.background = D.surf;
      el.style.borderColor = D.border;
      el.querySelectorAll('[data-tc]').forEach(c => { (c as HTMLElement).style.color = ''; });
    }}
    >
      <p data-tc style={{ fontSize: 13, lineHeight: 1.7, color: D.t2, marginBottom: 20, transition: 'color 0.3s' }}>"{t.quote}"</p>
      <p data-tc style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, color: D.t1, marginBottom: 2, transition: 'color 0.3s' }}>{t.name}</p>
      <p data-tc style={{ fontSize: 11, color: D.t3, letterSpacing: '0.04em', transition: 'color 0.3s' }}>{t.role}</p>
      <p data-tc style={{ fontSize: 10, color: D.t4, marginTop: 2, letterSpacing: '0.04em', transition: 'color 0.3s' }}>{t.college}</p>
    </div>
  );
}

function TestimonialsSection() {
  const row1 = TESTIMONIALS.slice(0, 3);
  const row2 = TESTIMONIALS.slice(3);

  return (
    <section style={{ background: D.surf, padding: '128px 0', borderTop: `1px solid ${D.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '0 clamp(16px, 5vw, 80px)', marginBottom: 64 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent, marginBottom: 16 }}>Student outcomes</p>
        <ClipReveal>
          <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(2.5rem, 6vw, 5rem)', letterSpacing: '-0.04em', lineHeight: 0.95, textTransform: 'uppercase', color: D.t1, margin: 0 }}>
            From prep<br />to placement.
          </h2>
        </ClipReveal>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Marquee speed={40} gradient={false} autoFill direction="left">
          {[...row1, ...row1].map((t, i) => <TestimonialCard key={i} t={t} />)}
        </Marquee>
      </div>
      <Marquee speed={35} gradient={false} autoFill direction="right">
        {[...row2, ...row2].map((t, i) => <TestimonialCard key={i} t={t} />)}
      </Marquee>
    </section>
  );
}

/* ── PricingSection ─────────────────────────────────────────────────────── */
const PLANS = [
  { name: 'Free',  price: '₹0',   period: 'forever',  features: ['100 DSA problems','Core CS (full)','Daily challenge','Community access'], cta: 'Start free', featured: false },
  { name: 'Pro',   price: '₹499', period: '/month',    features: ['All 450+ problems','Placement module','60+ company banks','ATS resume analyzer','Mock interviews'], cta: 'Start Pro', featured: true, tag: 'Most popular' },
  { name: 'Pro+',  price: '₹999', period: '/month',    features: ['Everything in Pro','1-on-1 mentorship','Resume review','LinkedIn review','Placement guarantee support'], cta: 'Contact us', featured: false },
];

function PricingSection() {
  return (
    <section id="pricing" style={{ background: D.bg, padding: '128px 0', borderTop: `1px solid ${D.border}`, position: 'relative' }}>
      <EditorialNum n="₹" align="right" />
      <div style={{ padding: '0 clamp(16px, 5vw, 80px)', maxWidth: '95vw', margin: '0 auto' }}>
        <div style={{ marginBottom: 72 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent, marginBottom: 16 }}>Pricing</p>
          <ClipReveal>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', letterSpacing: '-0.04em', lineHeight: 0.95, textTransform: 'uppercase', color: D.t1, margin: 0 }}>
              Honest pricing.<br />No surprises.
            </h2>
          </ClipReveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2, background: D.border }}>
          {PLANS.map((plan, i) => (
            <FadeUp key={plan.name} delay={i * 0.1}>
              <div style={{
                background: plan.featured ? D.elev : D.surf,
                padding: '40px 32px',
                borderLeft: plan.featured ? `4px solid ${D.accent}` : '4px solid transparent',
                height: '100%',
                display: 'flex', flexDirection: 'column',
              }}>
                {'tag' in plan && plan.tag && (
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent, marginBottom: 12 }}>{plan.tag}</p>
                )}
                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: D.t2, marginBottom: 8 }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 32 }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 52, letterSpacing: '-0.06em', lineHeight: 1, color: D.t1 }}>{plan.price}</span>
                  <span style={{ fontSize: 12, color: D.t4 }}>{plan.period}</span>
                </div>
                <div style={{ height: 1, background: D.border, marginBottom: 28 }} />
                <ul style={{ flex: 1, marginBottom: 32, padding: 0, listStyle: 'none' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 10, fontSize: 13, color: D.t2, marginBottom: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: '#4ADE80', flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link to="/login?tab=register" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 48,
                  background: plan.featured ? D.accent : 'transparent',
                  color: plan.featured ? '#000' : D.t1,
                  border: plan.featured ? `2px solid ${D.accent}` : `2px solid ${D.border}`,
                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                  textDecoration: 'none',
                }}>{plan.cta}</Link>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTASection ─────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section style={{ background: '#000', padding: '120px clamp(16px,5vw,80px) 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden', borderTop: `1px solid ${D.border}` }}>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: D.accent, transformOrigin: 'left' }}
      />

      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(232,33,39,0.18) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}
      />

      <GridBg />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, padding: '0 clamp(16px, 5vw, 48px)' }}>
        <FadeUp>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: D.t4, marginBottom: 48 }}>Ready?</p>
        </FadeUp>
        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.88, margin: '0 0 64px' }}>
          <ClipReveal delay={0.1}><span style={{ display: 'block', fontSize: 'clamp(3rem, 10vw, 9rem)', textTransform: 'uppercase', color: D.t1 }}>Join</span></ClipReveal>
          <ClipReveal delay={0.22}><span style={{ display: 'block', fontSize: 'clamp(3rem, 10vw, 9rem)', textTransform: 'uppercase', color: D.t1 }}>12,000+</span></ClipReveal>
          <ClipReveal delay={0.36}><span style={{ display: 'block', fontSize: 'clamp(3rem, 10vw, 9rem)', textTransform: 'uppercase', color: D.accent }}>on EYF.</span></ClipReveal>
        </h2>
        <FadeUp delay={0.6}>
          <p style={{ fontSize: 15, color: D.t2, maxWidth: 360, margin: '0 auto 48px', lineHeight: 1.7 }}>Free forever. No credit card. Start in under 5 minutes.</p>
        </FadeUp>
        <FadeUp delay={0.8}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login?tab=register" style={{ display: 'inline-flex', alignItems: 'center', height: 56, padding: '0 40px', background: D.accent, color: '#000', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', border: `2px solid ${D.accent}` }}>
              Create free account
            </Link>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', height: 56, padding: '0 40px', background: 'transparent', color: D.t1, fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', border: `2px solid ${D.border}` }}>
              Sign in
            </Link>
          </div>
        </FadeUp>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <Marquee speed={50} gradient={false} autoFill style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, padding: '14px 0' }}>
          {['Get placed', 'Crack every interview', 'Engineer your future', 'DSA · System Design · Placement'].map((t, i) => (
            <span key={i} style={{ marginRight: 64, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D.t4 }}>{t}</span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: '#000', borderTop: `1px solid ${D.border}`, padding: '32px clamp(16px, 5vw, 80px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: D.t4 }}>EYF · 2026</span>
        <div style={{ display: 'flex', gap: 32 }}>
          {[['#showcase','Platform'],['#curriculum','Curriculum'],['#pricing','Pricing'],['/login','Sign in']].map(([href, label]) => (
            href.startsWith('#')
              ? <a key={href} href={href} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: D.t4, textDecoration: 'none' }}>{label}</a>
              : <Link key={href} to={href} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: D.t4, textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: D.t4 }}>Built for placement.</span>
      </div>
    </footer>
  );
}

/* ── Export ─────────────────────────────────────────────────────────────── */
export function LandingPage() {
  return (
    <div style={{ background: D.bg, color: D.t1 }}>
      <Grain />
      <LandingNav />
      <main>
        <HeroSection />
        <StatsMarquee />
        <TrustBar />
        <HowItWorksSection />
        <FeatureShowcase />
        <CurriculumSection />
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
