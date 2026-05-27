import MarqueeLib from 'react-fast-marquee';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Marquee = ((MarqueeLib as any).default ?? MarqueeLib) as typeof MarqueeLib;
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useInView, animate } from 'framer-motion';
import { EYFMark } from '../components/EYFLogo';

/* ── Design tokens ─────────────────────────────────────────────────────── */
const D = {
  bg:     '#000000',
  surf:   '#0a0a0a',
  elev:   '#141414',
  card:   '#1c1c1e',
  accent: '#E82127',
  t1:     '#F5F5F7',
  t2:     '#86868B',
  t3:     '#515154',
  t4:     '#2d2d2f',
  border: '#232325',
  muted:  '#1d1d1f',
};

/* ── TiltCard ─────────────────────────────────────────────────────────── */
function TiltCard({ children, style, className, maxTilt = 10 }: {
  children: ReactNode; style?: CSSProperties; className?: string; maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [maxTilt, -maxTilt]), { stiffness: 400, damping: 30 });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-maxTilt, maxTilt]), { stiffness: 400, damping: 30 });

  function onMove(e: React.MouseEvent) {
    const rect = ref.current!.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onLeave() { rawX.set(0); rawY.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 900, rotateX, rotateY, transformStyle: 'preserve-3d', ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── TextScramble ─────────────────────────────────────────────────────── */
const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#@&$%';

function useTextScramble(text: string, active: boolean, delayS = 0) {
  const [out, setOut] = useState(active ? '' : text);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let rafId = 0;
    const total = text.length * 5;
    const tick = () => {
      setOut(
        text.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          if (frame / 5 >= i + 1) return ch;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join(''),
      );
      frame++;
      if (frame <= total) rafId = requestAnimationFrame(tick);
    };
    const t = setTimeout(() => { rafId = requestAnimationFrame(tick); }, delayS * 1000);
    return () => { clearTimeout(t); cancelAnimationFrame(rafId); };
  }, [active, text, delayS]);
  return out;
}

/* ── CountUp ──────────────────────────────────────────────────────────── */
function CountUp({ to, duration = 1.8, suffix = '' }: { to: number; duration?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const val = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(val, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setDisplay(Math.round(v).toLocaleString()),
    });
    return ctrl.stop;
  }, [inView, to, duration, val]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ── Magnetic ─────────────────────────────────────────────────────────── */
function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 14 });
  const sy = useSpring(y, { stiffness: 180, damping: 14 });

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={e => {
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * strength);
        y.set((e.clientY - r.top - r.height / 2) * strength);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}

/* ── CursorGlow ───────────────────────────────────────────────────────── */
function CursorGlow() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 80, damping: 22 });
  const sy = useSpring(y, { stiffness: 80, damping: 22 });

  useEffect(() => {
    const fn = (e: MouseEvent) => { x.set(e.clientX - 250); y.set(e.clientY - 250); };
    window.addEventListener('mousemove', fn, { passive: true });
    return () => window.removeEventListener('mousemove', fn);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 1, pointerEvents: 'none',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,33,39,0.045) 0%, transparent 60%)',
        filter: 'blur(40px)', x: sx, y: sy, willChange: 'transform',
      }}
    />
  );
}

/* ── Grain ────────────────────────────────────────────────────────────── */
function Grain() {
  return (
    <div aria-hidden="true" style={{
      position: 'fixed', inset: 0, zIndex: 50, pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      opacity: 0.025, mixBlendMode: 'overlay',
    }} />
  );
}

/* ── ClipReveal ───────────────────────────────────────────────────────── */
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

/* ── HeroReveal ───────────────────────────────────────────────────────── */
function HeroReveal({ children, delay = 0, style = {}, className = '' }: {
  children: ReactNode; delay?: number; style?: CSSProperties; className?: string;
}) {
  return (
    <div style={{ overflow: 'hidden', display: 'block', ...style }} className={className}>
      <motion.div
        initial={{ y: '105%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ── FadeUp ───────────────────────────────────────────────────────────── */
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

/* ── EditorialNum ─────────────────────────────────────────────────────── */
function EditorialNum({ n, align = 'right' }: { n: string; align?: 'left' | 'right' }) {
  return (
    <div aria-hidden style={{
      position: 'absolute', top: -20,
      ...(align === 'right' ? { right: -16 } : { left: -16 }),
      fontSize: 'clamp(120px, 20vw, 280px)',
      fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif',
      color: 'rgba(255,255,255,0.025)', letterSpacing: '-0.06em',
      lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
    }}>
      {n}
    </div>
  );
}

/* ── AppWindow — hero product screenshot ──────────────────────────────── */
function AppWindow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80, rotateX: 16 }}
      animate={{ opacity: 1, y: 0, rotateX: 6 }}
      transition={{ duration: 1.6, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1600, transformStyle: 'preserve-3d', width: '100%' }}
    >
      <div style={{
        background: '#090909',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 80px 160px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
        {/* Browser chrome */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
          background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {(['#FF5F57','#FEBC2E','#28C840'] as const).map(c => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
          ))}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <span style={{ padding: '3px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 5, fontSize: 10.5, color: 'rgba(255,255,255,0.22)', fontFamily: 'Inter, monospace', letterSpacing: '0.02em' }}>eyf.app/problems/two-sum</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#FCD34D', background: 'rgba(252,211,77,0.1)', padding: '3px 10px', borderRadius: 100, fontFamily: 'Space Grotesk' }}>2,400 XP</span>
        </div>

        {/* App layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1fr' }}>
          {/* Sidebar */}
          <div style={{ padding: '18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, borderRight: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.25)' }}>
            <EYFMark size={18} />
            {(['code','architecture','work_history','analytics','person'] as const).map((icon, i) => (
              <span key={icon} className="material-symbols-rounded" style={{ fontSize: 17, color: i === 0 ? D.accent : D.t3 }}>{icon}</span>
            ))}
          </div>

          {/* Problem description */}
          <div style={{ padding: '20px 20px', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#FCC93A', background: 'rgba(252,201,58,0.1)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Medium</span>
              <span style={{ fontSize: 9.5, color: D.t3, padding: '2px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>Array · HashMap</span>
            </div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: 17, fontWeight: 700, color: D.t1, marginBottom: 10, letterSpacing: '-0.02em' }}>Two Sum</h3>
            <p style={{ fontSize: 11, color: D.t2, lineHeight: 1.7, marginBottom: 14 }}>
              Given an array of integers <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3, fontFamily: 'JetBrains Mono', fontSize: 10 }}>nums</code> and integer <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 3, fontFamily: 'JetBrains Mono', fontSize: 10 }}>target</code>, return indices that add up to target.
            </p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
              {['Google', 'Amazon', 'Meta', 'Apple'].map(c => (
                <span key={c} style={{ fontSize: 9.5, padding: '2px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: D.t3, borderRadius: 4 }}>{c}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', background: 'rgba(74,222,128,0.08)', color: '#4ADE80', borderRadius: 4 }}>✓ SOLVED</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', background: 'rgba(232,33,39,0.08)', color: D.accent, borderRadius: 4 }}>+50 XP</span>
            </div>
          </div>

          {/* Code editor */}
          <div style={{ background: '#07090e', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: D.t3, padding: '2px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>two_sum.py</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '2px 8px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', borderRadius: 4 }}>Python</span>
            </div>
            <div style={{ padding: '14px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 2, flex: 1 }}>
              <div><span style={{ color: '#FF7B72' }}>def </span><span style={{ color: '#79C0FF' }}>two_sum</span><span style={{ color: '#3a3f4b' }}>(nums, target):</span></div>
              <div style={{ marginLeft: 16 }}><span style={{ color: '#FFA657' }}>seen</span><span style={{ color: '#3a3f4b' }}> = {'{}'}</span></div>
              <div style={{ marginLeft: 16 }}><span style={{ color: '#FF7B72' }}>for </span><span style={{ color: '#FFA657' }}>i, n </span><span style={{ color: '#FF7B72' }}>in </span><span style={{ color: '#79C0FF' }}>enumerate</span><span style={{ color: '#3a3f4b' }}>(nums):</span></div>
              <div style={{ marginLeft: 32 }}><span style={{ color: '#FFA657' }}>diff</span><span style={{ color: '#3a3f4b' }}> = target - n</span></div>
              <div style={{ marginLeft: 32 }}><span style={{ color: '#FF7B72' }}>if </span><span style={{ color: '#FFA657' }}>diff </span><span style={{ color: '#FF7B72' }}>in </span><span style={{ color: '#FFA657' }}>seen</span><span style={{ color: '#3a3f4b' }}>:</span></div>
              <div style={{ marginLeft: 48 }}><span style={{ color: '#FF7B72' }}>return </span><span style={{ color: '#3a3f4b' }}>[seen[diff], i]</span></div>
              <div style={{ marginLeft: 32 }}><span style={{ color: '#FFA657' }}>seen</span><span style={{ color: '#3a3f4b' }}>[n] = i</span></div>
            </div>
            <div style={{ padding: '9px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(74,222,128,0.03)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: '#4ADE80' }}>All 57 tests passed · 34ms</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'JetBrains Mono', color: D.t4 }}>O(n)</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── LandingNav ───────────────────────────────────────────────────────── */
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
      padding: '0 clamp(16px, 4vw, 48px)', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(0,0,0,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
      borderBottom: scrolled ? `1px solid ${D.border}` : '1px solid transparent',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <EYFMark size={22} />
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13, letterSpacing: '-0.03em', color: D.t1, textTransform: 'uppercase' }}>EYF</span>
      </Link>

      <nav className="hidden md:flex" style={{ gap: 40 }}>
        {[['#platform', 'Platform'], ['#how-it-works', 'Process'], ['#pricing', 'Pricing']].map(([href, label]) => (
          <a key={href} href={href} style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: D.t3, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = D.t1)}
            onMouseLeave={e => (e.currentTarget.style.color = D.t3)}
          >{label}</a>
        ))}
      </nav>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link to="/login" className="hidden md:block" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: D.t3, textDecoration: 'none', padding: '8px 16px' }}>Sign in</Link>
        <Magnetic strength={0.3}>
          <Link to="/login?tab=register" style={{
            fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#fff', background: D.accent, padding: '9px 20px', borderRadius: 100,
            textDecoration: 'none', display: 'inline-block',
            boxShadow: '0 0 0 1px rgba(232,33,39,0.4), 0 4px 20px rgba(232,33,39,0.25)',
          }}>
            Start free
          </Link>
        </Magnetic>
      </div>
    </header>
  );
}

/* ── HeroSection ──────────────────────────────────────────────────────── */
function HeroSection() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 480], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 480], [0, -60]);
  const heroScale   = useTransform(scrollY, [0, 480], [1, 0.96]);
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 160], [1, 0]);

  const [scrambleActive, setScrambleActive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setScrambleActive(true), 900); return () => clearTimeout(t); }, []);
  const scrambled = useTextScramble('Future.', scrambleActive, 0);

  return (
    <section style={{
      minHeight: '100dvh', background: D.bg, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflow: 'hidden', paddingTop: 80, paddingBottom: 0,
    }}>
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 600, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(232,33,39,0.07) 0%, transparent 60%)',
        filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0,
      }} />

      <motion.div style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center', width: '100%',
        opacity: heroOpacity, y: heroY, scale: heroScale,
        padding: '40px clamp(16px, 5vw, 80px) 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Eyebrow */}
        <HeroReveal delay={0}>
          <div style={{ marginBottom: 44 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 18px', border: `1px solid rgba(232,33,39,0.25)`,
              background: 'rgba(232,33,39,0.06)', borderRadius: 100,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D.accent,
            }}>
              <span style={{ width: 5, height: 5, background: D.accent, borderRadius: '50%', flexShrink: 0, animation: 'pulse-dot 2s ease-in-out infinite' }} />
              Open beta · <CountUp to={12000} duration={2} suffix="+" /> enrolled
            </span>
          </div>
        </HeroReveal>

        {/* Headline */}
        <div style={{ marginBottom: 28 }}>
          <HeroReveal delay={0.1}>
            <h1 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(3.8rem, 11vw, 10rem)',
              fontWeight: 700, lineHeight: 0.9,
              letterSpacing: '-0.055em',
              color: D.t1, margin: 0,
            }}>Engineer Your</h1>
          </HeroReveal>
          <HeroReveal delay={0.18}>
            <h1 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(3.8rem, 11vw, 10rem)',
              fontWeight: 700, lineHeight: 0.9,
              letterSpacing: '-0.055em',
              color: D.accent, margin: 0,
            }}>{scrambled || 'Future.'}</h1>
          </HeroReveal>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: 'clamp(15px, 2vw, 18px)', color: D.t2, lineHeight: 1.65,
            maxWidth: 480, margin: '0 0 44px',
          }}
        >
          The all-in-one platform for campus placement prep. DSA, system design, core CS — structured, not scattered.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.56, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72 }}
        >
          <Magnetic strength={0.28}>
            <Link to="/login?tab=register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 52, padding: '0 32px',
              background: D.accent, color: '#fff',
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em',
              textDecoration: 'none', borderRadius: 100,
              boxShadow: '0 0 0 1px rgba(232,33,39,0.4), 0 8px 32px rgba(232,33,39,0.28)',
            }}>
              Get started free →
            </Link>
          </Magnetic>
          <Magnetic strength={0.2}>
            <a href="#platform" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 52, padding: '0 32px',
              background: 'rgba(255,255,255,0.06)', color: D.t1,
              fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 12, letterSpacing: '0.03em',
              textDecoration: 'none', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 100,
              backdropFilter: 'blur(12px)',
            }}>
              See the platform
            </a>
          </Magnetic>
        </motion.div>

        {/* Product window — peeks below fold */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 920, paddingBottom: 0 }}
        >
          <AppWindow />
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', opacity: scrollIndicatorOpacity }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${D.accent}, transparent)`, margin: '0 auto' }} />
      </motion.div>
    </section>
  );
}

/* ── StatsSection ─────────────────────────────────────────────────────── */
const STATS_DATA = [
  { value: 12000, suffix: '+', label: 'Students enrolled' },
  { value: 94,    suffix: '%', label: 'Placement rate' },
  { value: 450,   suffix: '+', label: 'Practice problems' },
  { value: 60,    suffix: '+', label: 'Companies covered' },
];

function StatsSection() {
  return (
    <section style={{ background: D.bg, borderTop: `1px solid ${D.border}`, padding: '120px clamp(16px, 5vw, 80px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <FadeUp>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: D.t3, marginBottom: 80, textAlign: 'center' }}>By the numbers</p>
        </FadeUp>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '72px 40px' }}>
          {STATS_DATA.map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.08}>
              <div>
                <div style={{
                  fontFamily: 'Space Grotesk', fontWeight: 700,
                  fontSize: 'clamp(52px, 8vw, 92px)',
                  letterSpacing: '-0.04em', lineHeight: 1,
                  color: D.t1, marginBottom: 14,
                }}>
                  <CountUp to={s.value} duration={2.2} suffix={s.suffix} />
                </div>
                <p style={{ fontSize: 15, color: D.t2, letterSpacing: '0.01em' }}>{s.label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── BentoSection ─────────────────────────────────────────────────────── */
function BentoSection() {
  const bentoTile: CSSProperties = {
    borderRadius: 20,
    border: `1px solid ${D.border}`,
    overflow: 'hidden',
    background: D.elev,
  };

  return (
    <section id="platform" style={{ background: D.surf, borderTop: `1px solid ${D.border}`, padding: '100px clamp(16px, 5vw, 80px)' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <FadeUp>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent, marginBottom: 18 }}>The Platform</p>
          </FadeUp>
          <ClipReveal>
            <h2 style={{
              fontFamily: 'Space Grotesk', fontWeight: 700,
              fontSize: 'clamp(2.6rem, 6vw, 6rem)',
              letterSpacing: '-0.05em', lineHeight: 0.92,
              color: D.t1, margin: 0,
            }}>Everything you need.<br />Nothing you don't.</h2>
          </ClipReveal>
        </div>

        {/* Bento grid — row 1 */}
        <FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>

            {/* DSA Practice — large */}
            <TiltCard maxTilt={4} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ ...bentoTile, padding: '36px 36px 0', display: 'flex', flexDirection: 'column', minHeight: 340 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3B82F6', marginBottom: 10 }}>DSA Practice</p>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.04em', color: D.t1, marginBottom: 8, lineHeight: 1.15 }}>Pattern-based<br />problem solving.</h3>
                <p style={{ fontSize: 13, color: D.t2, marginBottom: 24, maxWidth: 340, lineHeight: 1.6 }}>450+ problems organized by 15 core patterns. Each problem teaches something transferable.</p>
                <div style={{ marginTop: 'auto', background: '#06080e', borderRadius: '12px 12px 0 0', border: '1px solid rgba(255,255,255,0.06)', borderBottom: 'none', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#090c13', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {(['#FF5F57','#FEBC2E','#28C840'] as const).map(c => <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
                    <span style={{ marginLeft: 4, fontSize: 9.5, color: '#2a2a2a', fontFamily: 'monospace' }}>two_sum.py</span>
                    <span style={{ marginLeft: 'auto', fontSize: 8.5, fontWeight: 700, color: '#FCC93A', background: 'rgba(252,201,58,0.08)', padding: '1px 7px', borderRadius: 3 }}>MEDIUM</span>
                  </div>
                  <div style={{ padding: '12px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, lineHeight: 1.9 }}>
                    <div><span style={{ color: '#FF7B72' }}>def </span><span style={{ color: '#79C0FF' }}>two_sum</span><span style={{ color: '#2e3340' }}>(nums, target):</span></div>
                    <div style={{ marginLeft: 14 }}><span style={{ color: '#FFA657' }}>seen</span><span style={{ color: '#2e3340' }}> = {'{}'}</span></div>
                    <div style={{ marginLeft: 14 }}><span style={{ color: '#FF7B72' }}>for </span><span style={{ color: '#FFA657' }}>i, n </span><span style={{ color: '#FF7B72' }}>in </span><span style={{ color: '#79C0FF' }}>enumerate</span><span style={{ color: '#2e3340' }}>(nums):</span></div>
                    <div style={{ marginLeft: 28 }}><span style={{ color: '#FFA657' }}>diff</span><span style={{ color: '#2e3340' }}> = target - n</span></div>
                    <div style={{ marginLeft: 28 }}><span style={{ color: '#FF7B72' }}>if </span><span style={{ color: '#FFA657' }}>diff </span><span style={{ color: '#FF7B72' }}>in </span><span style={{ color: '#FFA657' }}>seen</span><span style={{ color: '#2e3340' }}>: </span><span style={{ color: '#FF7B72' }}>return </span><span style={{ color: '#2e3340' }}>[seen[diff], i]</span></div>
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Streak & XP */}
            <TiltCard maxTilt={5} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ ...bentoTile, padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 340, position: 'relative' }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#F97316', marginBottom: 10 }}>Streak & XP</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 80, letterSpacing: '-0.06em', lineHeight: 1, color: D.t1 }}>12</span>
                    <span style={{ fontSize: 18, fontWeight: 600, color: D.t2, marginBottom: 6 }}>days</span>
                  </div>
                  <p style={{ fontSize: 11, color: D.t3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Active streak</p>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, color: D.t2 }}>XP this week</span>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: '#FBBF24' }}>2,400</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '80%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #F97316, #FBBF24)', borderRadius: 100 }}
                    />
                  </div>
                </div>
                <div aria-hidden style={{ position: 'absolute', bottom: -28, right: -12, fontSize: 130, opacity: 0.05, lineHeight: 1, pointerEvents: 'none', userSelect: 'none', filter: 'saturate(0)' }}>🔥</div>
              </div>
            </TiltCard>
          </div>
        </FadeUp>

        {/* Bento grid — row 2 */}
        <FadeUp delay={0.1}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>

            {/* System Design */}
            <TiltCard maxTilt={5} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ ...bentoTile, padding: 28, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#22D3EE', marginBottom: 8 }}>System Design</p>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, letterSpacing: '-0.04em', color: D.t1, marginBottom: 'auto', lineHeight: 1.2 }}>HLD, LLD &<br />real systems.</h3>
                <div style={{ position: 'relative', height: 96, marginTop: 16 }}>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
                    <line x1="20%" y1="16%" x2="48%" y2="42%" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" strokeDasharray="4 3" />
                    <line x1="50%" y1="48%" x2="28%" y2="78%" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" strokeDasharray="4 3" />
                    <line x1="50%" y1="48%" x2="72%" y2="78%" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" strokeDasharray="4 3" />
                  </svg>
                  {[
                    { label: 'Client',  x: 12, y: 8,  color: '#3B82F6' },
                    { label: 'API',     x: 42, y: 40, color: '#A78BFA' },
                    { label: 'DB',      x: 18, y: 74, color: '#FB923C' },
                    { label: 'Cache',   x: 62, y: 74, color: '#22D3EE' },
                  ].map(n => (
                    <div key={n.label} style={{ position: 'absolute', left: `${n.x}%`, top: `${n.y}%` }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', background: `${n.color}14`, border: `1px solid ${n.color}30`, color: n.color, borderRadius: 4, whiteSpace: 'nowrap' }}>{n.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>

            {/* Readiness Score */}
            <TiltCard maxTilt={5} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ ...bentoTile, padding: 28, display: 'flex', flexDirection: 'column', minHeight: 240 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4ADE80', marginBottom: 8 }}>Readiness Score</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 18 }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 52, letterSpacing: '-0.05em', lineHeight: 1, color: D.t1 }}>54</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: D.t3 }}>%</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {([
                    { label: 'DSA',           pct: 68, color: '#3B82F6' },
                    { label: 'System Design', pct: 41, color: '#22D3EE' },
                    { label: 'Core CS',       pct: 72, color: '#4ADE80' },
                  ] as const).map(m => (
                    <div key={m.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10.5, color: D.t3 }}>{m.label}</span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: m.color, fontFamily: 'Space Grotesk' }}>{m.pct}%</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${m.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                          style={{ height: '100%', background: m.color, borderRadius: 100 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>

            {/* Placement Prep — accent tile */}
            <TiltCard maxTilt={5} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                borderRadius: 20, overflow: 'hidden',
                background: D.accent, padding: 28,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 240,
                position: 'relative',
              }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 8 }}>Placement Prep</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 52, letterSpacing: '-0.05em', lineHeight: 1, color: '#000' }}>60</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: 'rgba(0,0,0,0.55)' }}>+</span>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Companies</p>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {['Google', 'Amazon', 'Zoho', 'Swiggy', 'Razorpay'].map(c => (
                    <span key={c} style={{ fontSize: 9.5, fontWeight: 700, padding: '3px 10px', background: 'rgba(0,0,0,0.15)', color: '#000', borderRadius: 100 }}>{c}</span>
                  ))}
                </div>
              </div>
            </TiltCard>

          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── HowItWorksSection ────────────────────────────────────────────────── */
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

  const STEP_RANGES = STEPS.map((_, i) => ({ start: i / STEPS.length, end: (i + 1) / STEPS.length }));

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
    <section id="how-it-works" ref={containerRef} style={{ height: '250vh', position: 'relative', background: D.bg, borderTop: `1px solid ${D.border}` }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 72, left: 'clamp(16px, 5vw, 80px)', zIndex: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent, marginBottom: 8 }}>How it works</p>
        </div>

        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: D.muted, zIndex: 10 }}>
          <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: progressHeight, background: D.accent }} />
        </div>

        {STEPS.map((step, i) => (
          <motion.div key={step.num} style={{
            position: 'absolute', inset: 0, opacity: opacities[i], y: ys[i],
            display: 'flex', alignItems: 'center',
            padding: 'clamp(16px, 5vw, 80px)', paddingTop: 120,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40, width: '100%', maxWidth: '90vw', margin: '0 auto' }} className="lg:grid-two-col">
              <div style={{ position: 'relative' }}>
                <div aria-hidden style={{
                  position: 'absolute', top: -20, left: -16,
                  fontSize: 'clamp(120px, 20vw, 280px)', fontWeight: 900,
                  fontFamily: 'Space Grotesk', color: 'rgba(255,255,255,0.02)',
                  letterSpacing: '-0.06em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
                }}>{step.num}</div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: step.color, marginBottom: 16, position: 'relative', zIndex: 1 }}>{step.label}</p>
                <h2 style={{
                  fontFamily: 'Space Grotesk', fontWeight: 700,
                  fontSize: 'clamp(2.5rem, 7vw, 6rem)',
                  letterSpacing: '-0.04em', lineHeight: 0.95,
                  textTransform: 'uppercase', color: D.t1,
                  marginBottom: 24, position: 'relative', zIndex: 1, whiteSpace: 'pre-line',
                }}>{step.title}</h2>
                <p style={{ fontSize: 15, color: D.t2, lineHeight: 1.7, maxWidth: 420, position: 'relative', zIndex: 1 }}>{step.body}</p>
              </div>
              <div className="hidden lg:flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <TiltCard maxTilt={8} style={{ width: '100%', maxWidth: 340 }}>
                  <div style={{
                    border: `1px solid rgba(255,255,255,0.08)`, padding: '48px 40px',
                    background: D.elev, borderRadius: 20, width: '100%',
                    position: 'relative', overflow: 'hidden', cursor: 'default',
                    transition: 'background 0.3s, border-color 0.3s', backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.background = D.accent;
                    el.style.borderColor = D.accent;
                    el.querySelectorAll('[data-invert]').forEach(c => { (c as HTMLElement).style.color = '#000'; });
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.background = D.elev;
                    el.style.borderColor = 'rgba(255,255,255,0.08)';
                    el.querySelectorAll('[data-invert]').forEach(c => { (c as HTMLElement).style.color = ''; });
                  }}
                  >
                    <span className="material-symbols-rounded" data-invert style={{ fontSize: 48, color: step.color, display: 'block', marginBottom: 20, transition: 'color 0.3s' }}>{step.icon}</span>
                    <p data-invert style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.05em', lineHeight: 1, color: D.t1, marginBottom: 8, transition: 'color 0.3s' }}>{step.metric}</p>
                    <p data-invert style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: D.t3, transition: 'color 0.3s' }}>{step.label}</p>
                  </div>
                </TiltCard>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── PricingSection ───────────────────────────────────────────────────── */
const PLANS = [
  { name: 'Free',  price: '₹0',   period: 'forever', features: ['100 DSA problems','Core CS (full)','Daily challenge','Community access'], cta: 'Start free', featured: false },
  { name: 'Pro',   price: '₹499', period: '/month',   features: ['All 450+ problems','Placement module','60+ company banks','ATS resume analyzer','Mock interviews'], cta: 'Start Pro', featured: true, tag: 'Most popular' },
  { name: 'Pro+',  price: '₹999', period: '/month',   features: ['Everything in Pro','1-on-1 mentorship','Resume review','LinkedIn review','Placement guarantee'], cta: 'Contact us', featured: false },
];

function PricingSection() {
  return (
    <section id="pricing" style={{ background: D.bg, padding: '120px 0', borderTop: `1px solid ${D.border}`, position: 'relative' }}>
      <EditorialNum n="₹" align="right" />
      <div style={{ padding: '0 clamp(16px, 5vw, 80px)', maxWidth: '95vw', margin: '0 auto' }}>
        <div style={{ marginBottom: 72 }}>
          <FadeUp>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent, marginBottom: 16 }}>Pricing</p>
          </FadeUp>
          <ClipReveal>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', letterSpacing: '-0.05em', lineHeight: 0.92, color: D.t1, margin: 0 }}>
              Honest pricing.<br />No surprises.
            </h2>
          </ClipReveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {PLANS.map((plan, i) => (
            <FadeUp key={plan.name} delay={i * 0.1}>
              <TiltCard maxTilt={5} style={{ height: '100%' }}>
                <div style={{
                  background: plan.featured ? D.elev : D.surf,
                  padding: '40px 32px', borderRadius: 20,
                  border: plan.featured ? `1px solid rgba(232,33,39,0.3)` : `1px solid ${D.border}`,
                  boxShadow: plan.featured ? '0 0 60px rgba(232,33,39,0.1), 0 24px 64px rgba(0,0,0,0.5)' : 'none',
                  height: '100%', display: 'flex', flexDirection: 'column',
                }}>
                  {'tag' in plan && plan.tag && (
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent, marginBottom: 12 }}>{plan.tag}</p>
                  )}
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.t2, marginBottom: 8 }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 32 }}>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 52, letterSpacing: '-0.06em', lineHeight: 1, color: D.t1 }}>{plan.price}</span>
                    <span style={{ fontSize: 12, color: D.t3 }}>{plan.period}</span>
                  </div>
                  <div style={{ height: 1, background: D.border, marginBottom: 28 }} />
                  <ul style={{ flex: 1, marginBottom: 32, padding: 0, listStyle: 'none' }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', gap: 10, fontSize: 13, color: D.t2, marginBottom: 10, alignItems: 'flex-start' }}>
                        <span style={{ color: '#4ADE80', flexShrink: 0, marginTop: 1, fontWeight: 700 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/login?tab=register" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: 48, borderRadius: 100,
                    background: plan.featured ? D.accent : 'rgba(255,255,255,0.06)',
                    color: plan.featured ? '#fff' : D.t1,
                    border: plan.featured ? `1px solid ${D.accent}` : `1px solid ${D.border}`,
                    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
                    textDecoration: 'none',
                    boxShadow: plan.featured ? '0 4px 20px rgba(232,33,39,0.3)' : 'none',
                  }}>{plan.cta}</Link>
                </div>
              </TiltCard>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTASection ───────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section style={{
      background: '#000', padding: '120px clamp(16px,5vw,80px) 80px',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      textAlign: 'center', position: 'relative', overflow: 'hidden', borderTop: `1px solid ${D.border}`,
    }}>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: D.accent, transformOrigin: 'left' }}
      />
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(232,33,39,0.16) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}
      />

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
            <Magnetic strength={0.25}>
              <Link to="/login?tab=register" style={{
                display: 'inline-flex', alignItems: 'center', height: 56, padding: '0 40px',
                background: D.accent, color: '#fff', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
                textDecoration: 'none', borderRadius: 100, boxShadow: '0 8px 40px rgba(232,33,39,0.35)',
              }}>Create free account</Link>
            </Magnetic>
            <Magnetic strength={0.2}>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', height: 56, padding: '0 40px',
                background: 'rgba(255,255,255,0.05)', color: D.t1, fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
                textDecoration: 'none', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 100, backdropFilter: 'blur(12px)',
              }}>Sign in</Link>
            </Magnetic>
          </div>
        </FadeUp>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <Marquee speed={50} gradient={false} autoFill style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, padding: '14px 0' }}>
          {['Get placed', 'Crack every interview', 'Engineer your future', 'DSA · System Design · Placement'].map((t, i) => (
            <span key={i} style={{ marginRight: 64, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D.t4 }}>{t}</span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: '#000', borderTop: `1px solid ${D.border}`, padding: '28px clamp(16px, 5vw, 80px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: D.t4 }}>EYF · 2026</span>
        <div style={{ display: 'flex', gap: 32 }}>
          {[['#platform','Platform'],['#how-it-works','Process'],['#pricing','Pricing'],['/login','Sign in']].map(([href, label]) => (
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

/* ── Export ───────────────────────────────────────────────────────────── */
export function LandingPage() {
  return (
    <div style={{ background: D.bg, color: D.t1 }}>
      <CursorGlow />
      <Grain />
      <LandingNav />
      <main>
        <HeroSection />
        <StatsSection />
        <BentoSection />
        <HowItWorksSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
