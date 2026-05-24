import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  motion, useScroll, useTransform, useInView,
  useMotionValue, useSpring,
} from 'framer-motion';
import { EYFMark } from '../components/EYFLogo';

/* ── Tokens ────────────────────────────────────────────────────────────── */
const D = {
  bg:      '#030303',
  surf:    '#0A0A0A',
  elev:    '#111111',
  border:  'rgba(255,255,255,0.07)',
  t1:      '#F8F8F8',
  t2:      '#C0C0C0',
  t3:      '#888',
  t4:      '#444',
  red:     '#E8192C',
};

/* ── Cursor glow ───────────────────────────────────────────────────────── */
function CursorGlow() {
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const sx = useSpring(x, { stiffness: 90, damping: 22 });
  const sy = useSpring(y, { stiffness: 90, damping: 22 });
  useEffect(() => {
    const fn = (e: MouseEvent) => { x.set(e.clientX - 350); y.set(e.clientY - 350); };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, [x, y]);
  return (
    <motion.div
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed z-0"
      aria-hidden="true"
    >
      <div style={{
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,25,44,0.07) 0%, transparent 65%)',
      }} />
    </motion.div>
  );
}

/* ── Film grain overlay ────────────────────────────────────────────────── */
function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        opacity: 0.03,
        mixBlendMode: 'overlay',
      }}
    />
  );
}

/* ── Grid overlay ──────────────────────────────────────────────────────── */
function GridBg({ opacity = 0.025 }: { readonly opacity?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" style={{
      backgroundImage: `linear-gradient(rgba(255,255,255,${opacity}) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,${opacity}) 1px, transparent 1px)`,
      backgroundSize: '72px 72px',
      maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
    }} />
  );
}

/* ── Scroll-reveal with 3D ─────────────────────────────────────────────── */
function Reveal({
  children, delay = 0, className = '', style = {},
}: {
  readonly children: ReactNode; readonly delay?: number;
  readonly className?: string; readonly style?: CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, rotateX: 18, transformPerspective: 1000 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ── Mouse-tracked 3D tilt ─────────────────────────────────────────────── */
function Tilt({
  children, strength = 14, style = {}, className = '',
}: {
  readonly children: ReactNode; readonly strength?: number;
  readonly style?: CSSProperties; readonly className?: string;
}) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 260, damping: 26 });
  const sry = useSpring(ry, { stiffness: 260, damping: 26 });
  return (
    <motion.div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        rx.set(((e.clientY - r.top) / r.height - 0.5) * -strength);
        ry.set(((e.clientX - r.left) / r.width - 0.5) * strength);
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0); }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000, ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated counter ──────────────────────────────────────────────────── */
function CountUp({ target, suffix = '' }: { readonly target: number; readonly suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  useEffect(() => {
    if (!inView) return;
    const t0 = Date.now(), dur = 1600;
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Floating notification chip ────────────────────────────────────────── */
function FloatingChip({
  label, sub, color, delay, style = {},
}: {
  readonly label: string; readonly sub: string; readonly color: string;
  readonly delay: number; readonly style?: CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: { duration: 3.5, delay: delay + 0.5, repeat: Infinity, ease: 'easeInOut' },
      }}
      style={{
        position: 'absolute',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 14px', borderRadius: 14,
        background: 'rgba(12,12,12,0.88)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
        zIndex: 10,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color, flexShrink: 0,
        boxShadow: `0 0 8px ${color}`,
      }} />
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: D.t1, lineHeight: 1.2 }}>{label}</p>
        <p style={{ fontSize: 10, color: D.t3, lineHeight: 1.2 }}>{sub}</p>
      </div>
    </motion.div>
  );
}

/* ── Dashboard mockup ──────────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div style={{
      background: '#090D13',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 22,
      overflow: 'hidden',
      boxShadow: '0 80px 160px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.1)',
    }}>
      <div style={{ background: '#0F1520', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c) => (
          <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, display: 'inline-block' }} />
        ))}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '3px 16px', fontSize: 11, color: '#555', fontFamily: 'monospace' }}>
            app.eyf.in/dashboard
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', minHeight: 340 }}>
        <div style={{ width: 168, background: '#080D12', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '14px 10px', flexShrink: 0 }} className="hidden sm:block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', marginBottom: 20 }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: '#E8192C' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: D.t1 }}>EYF</span>
          </div>
          {[['Dashboard',true],['DSA Problems',false],['System Design',false],['Placement',false],['Community',false]].map(([l,a]) => (
            <div key={String(l)} style={{
              padding: '6px 8px', borderRadius: 6, fontSize: 11,
              fontWeight: a ? 600 : 400,
              color: a ? D.t1 : '#3A3A3A',
              background: a ? 'rgba(232,25,44,0.14)' : 'transparent',
              marginBottom: 2,
            }}>{String(l)}</div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 18 }}>
          <p style={{ fontSize: 10, color: '#333', marginBottom: 2 }}>Good morning,</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: D.t1, marginBottom: 14 }}>Praneeth</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7, marginBottom: 10 }}>
            {[['XP','2,840','#E8192C'],['Week','+340','#4ADE80'],['Streak','14d','#FB923C'],['Badges','12','#FBBF24']].map(([l,v,c]) => (
              <div key={String(l)} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '9px 10px' }}>
                <p style={{ fontSize: 9, color: '#333', marginBottom: 3 }}>{String(l)}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: String(c), lineHeight: 1 }}>{String(v)}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#333', marginBottom: 5 }}>
              <span>Builder · Lv.5</span><span>660 XP to Engineer</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ width: '62%', height: '100%', background: '#E8192C', borderRadius: 100 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
            {[['DSA',68,'#3B82F6'],['Design',41,'#22D3EE'],['OOP',55,'#A78BFA']].map(([l,p,c]) => (
              <div key={String(l)} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '9px 10px' }}>
                <p style={{ fontSize: 9, color: '#333', marginBottom: 3 }}>{String(l)}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: String(c), marginBottom: 5 }}>{Number(p)}%</p>
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ width: `${Number(p)}%`, height: '100%', background: String(c), borderRadius: 100 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */
function HeroSection() {
  const { scrollY } = useScroll();
  const rotateX  = useTransform(scrollY, [0, 560], [38, 0]);
  const rotateY  = useTransform(scrollY, [0, 560], [-6, 0]);
  const scale    = useTransform(scrollY, [0, 560], [0.82, 1]);
  const mockY    = useTransform(scrollY, [0, 560], [0, 40]);

  // Mouse parallax for blobs
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const bx1 = useSpring(useTransform(mx, v => v * 40), { stiffness: 50, damping: 20 });
  const by1 = useSpring(useTransform(my, v => v * 30), { stiffness: 50, damping: 20 });
  const bx2 = useSpring(useTransform(mx, v => v * -28), { stiffness: 40, damping: 18 });
  const by2 = useSpring(useTransform(my, v => v * -20), { stiffness: 40, damping: 18 });

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5));
      my.set((e.clientY / window.innerHeight - 0.5));
    };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, [mx, my]);

  return (
    <section style={{
      background: D.bg, minHeight: '100dvh', position: 'relative',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', paddingTop: 80, paddingBottom: 0,
    }}>
      <GridBg />

      {/* Vignette */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
      }} />

      {/* Aurora blobs with parallax */}
      <motion.div aria-hidden="true" style={{ x: bx1, y: by1, position: 'absolute', top: '-22%', left: '-6%', zIndex: 0, pointerEvents: 'none' }}>
        <div className="aurora-blob-a" style={{
          width: 900, height: 700,
          background: 'radial-gradient(ellipse, rgba(232,25,44,0.18) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }} />
      </motion.div>
      <motion.div aria-hidden="true" style={{ x: bx2, y: by2, position: 'absolute', top: '-10%', right: '-14%', zIndex: 0, pointerEvents: 'none' }}>
        <div className="aurora-blob-b" style={{
          width: 800, height: 700,
          background: 'radial-gradient(ellipse, rgba(100,50,240,0.12) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }} />
      </motion.div>

      <div className="land-container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Headline block */}
        <div className="text-center" style={{ maxWidth: 860, margin: '0 auto 56px' }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} style={{ marginBottom: 28 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              padding: '6px 18px', borderRadius: 100,
              background: 'rgba(232,25,44,0.07)',
              border: '1px solid rgba(232,25,44,0.22)',
              color: '#FF4D5E', fontSize: 12, fontWeight: 600, letterSpacing: '0.01em',
            }}>
              <span className="anim-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8192C', display: 'inline-block' }} />
              Open beta · 12,000+ students enrolled
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(44px, 8vw, 88px)',
              fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.96,
              color: D.t1, marginBottom: 22,
            }}
          >
            The structured path<br />
            to your first{' '}
            <span style={{
              color: '#E8192C',
              textShadow: '0 0 60px rgba(232,25,44,0.6), 0 0 120px rgba(232,25,44,0.3)',
            }}>
              tech offer.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            style={{ fontSize: 17, color: D.t3, maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.7 }}
          >
            DSA, system design, OOP, core CS, and placement prep — one platform, one path to your first tech offer.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.24 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
            <Link to="/login?tab=register" className="btn btn-primary btn-xl">
              Start for free
              <span className="material-symbols-rounded text-base">arrow_forward</span>
            </Link>
            <a href="#showcase" className="btn btn-xl"
              style={{ background: 'rgba(255,255,255,0.05)', color: D.t1, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
              See how it works
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, delay: 0.32 }}
            style={{ display: 'flex', gap: 22, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['No credit card', 'Free tier forever', 'Start in 5 minutes'].map((t) => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: D.t4 }}>
                <span style={{ color: '#4ADE80', fontWeight: 700 }}>✓</span> {t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* 3D Mockup with floating chips */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.38 }}
          style={{ maxWidth: 960, margin: '0 auto', position: 'relative' }}>

          {/* Light cone behind mockup */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
            width: 400, height: 600,
            background: 'conic-gradient(from 180deg at 50% 0%, transparent 60deg, rgba(232,25,44,0.22) 90deg, transparent 120deg)',
            filter: 'blur(30px)',
            zIndex: 0, pointerEvents: 'none',
          }} />

          {/* Bottom glow */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: '25%', left: '10%', right: '10%', bottom: '-5%',
            background: 'radial-gradient(ellipse, rgba(232,25,44,0.22) 0%, transparent 65%)',
            filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none',
          }} />

          {/* Floating chips */}
          <FloatingChip label="+120 XP" sub="Two Sum · Pattern solved" color="#E8192C" delay={0.9}
            style={{ top: '12%', left: '-8%' }} />
          <FloatingChip label="🔥 14-day streak" sub="Keep it up" color="#FB923C" delay={1.3}
            style={{ top: '6%', right: '-4%' }} />
          <FloatingChip label="Google Round 2 ✓" sub="Prep complete" color="#4ADE80" delay={1.7}
            style={{ bottom: '35%', right: '-10%' }} />
          <FloatingChip label="Lv.6 Unlocked" sub="Builder → Engineer" color="#A78BFA" delay={1.1}
            style={{ bottom: '28%', left: '-8%' }} />

          {/* Actual 3D mockup */}
          <motion.div style={{
            transformPerspective: 1600,
            rotateX, rotateY, scale, y: mockY,
            position: 'relative', zIndex: 1,
          }}>
            <DashboardMockup />
          </motion.div>

          {/* Fade to bg */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
            background: `linear-gradient(to bottom, transparent, ${D.bg})`,
            zIndex: 2, pointerEvents: 'none',
          }} />
        </motion.div>
      </div>
    </section>
  );
}

/* ── Trust bar ─────────────────────────────────────────────────────────── */
function TrustBar() {
  const colleges = ['IIT Delhi','IIT Bombay','NIT Trichy','BITS Pilani','VIT Vellore','IIIT Hyderabad','DTU Delhi','Manipal','Anna University','SRM','PSG Tech','NSUT'];
  return (
    <section style={{ background: D.bg, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '44px 0' }}>
      <div className="land-container">
        <p style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', letterSpacing: '0.14em', textTransform: 'uppercase', color: D.t4, marginBottom: 18 }}>
          Students preparing from
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {colleges.map((c) => (
            <span key={c} style={{ padding: '5px 13px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', color: '#3A3A3A' }}>{c}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Code card ─────────────────────────────────────────────────────────── */
function CodeCard() {
  return (
    <div style={{ background: '#0B0F18', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 60px 120px rgba(0,0,0,0.7)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', background: '#0F1520', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c) => <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />)}
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', color: '#555' }}>two_sum.py</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(202,138,4,0.12)', color: '#D97706', letterSpacing: '0.04em' }}>MEDIUM</span>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 22px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(74,222,128,0.03)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#4ADE80' }}>✓ 57/57 test cases passed</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'monospace', color: '#333' }}>Runtime 34ms · 14.9MB</span>
      </div>
    </div>
  );
}

/* ── Readiness card ────────────────────────────────────────────────────── */
function ReadinessCard() {
  const mods = [
    { label: 'DSA Practice',  pct: 68, color: '#3B82F6' },
    { label: 'System Design', pct: 41, color: '#22D3EE' },
    { label: 'OOP & Patterns',pct: 55, color: '#A78BFA' },
    { label: 'Core CS',       pct: 72, color: '#4ADE80' },
    { label: 'Placement Prep',pct: 33, color: '#FB923C' },
  ];
  return (
    <div style={{ background: D.elev, border: `1px solid ${D.border}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 60px 120px rgba(0,0,0,0.7)' }}>
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${D.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: D.t1 }}>Placement Readiness</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: D.red }}>54%</span>
        </div>
        <p style={{ fontSize: 11, color: D.t4, marginBottom: 12 }}>Across all technical domains</p>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ width: '54%', height: '100%', background: D.red, borderRadius: 100 }} />
        </div>
      </div>
      <div style={{ padding: '18px 22px' }}>
        {mods.map((m) => (
          <div key={m.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: D.t3 }}>{m.label}</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: m.color }}>{m.pct}%</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRadius: 100 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '13px 22px', borderTop: `1px solid ${D.border}`, background: 'rgba(255,255,255,0.015)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: D.t4 }}>Next:</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: D.t2 }}>Complete System Design module</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: D.red }}>+30 XP →</span>
      </div>
    </div>
  );
}

/* ── System design card ────────────────────────────────────────────────── */
function SystemDesignCard() {
  const nodes = [
    { label: 'Client', x: 50, y: 10, color: '#3B82F6' },
    { label: 'CDN', x: 20, y: 35, color: '#22D3EE' },
    { label: 'API Gateway', x: 50, y: 40, color: '#A78BFA' },
    { label: 'Auth Service', x: 20, y: 65, color: '#4ADE80' },
    { label: 'DB (Primary)', x: 50, y: 70, color: '#FB923C' },
    { label: 'Cache (Redis)', x: 78, y: 55, color: '#FBBF24' },
  ];
  const edges: [number, number][] = [[0,1],[0,2],[2,3],[2,4],[2,5]];
  return (
    <div style={{ background: '#0B0F18', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 60px 120px rgba(0,0,0,0.7)', padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: D.t1 }}>URL Shortener — System Design</p>
          <p style={{ fontSize: 11, color: D.t3 }}>HLD · Scalability · 100M requests/day</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>HARD</span>
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
          <div key={n.label} style={{
            position: 'absolute',
            left: `${n.x}%`, top: `${n.y}%`,
            transform: 'translate(-50%, -50%)',
          }}>
            <div style={{
              padding: '5px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600,
              background: `${n.color}14`, border: `1px solid ${n.color}30`,
              color: n.color, whiteSpace: 'nowrap',
              boxShadow: `0 0 12px ${n.color}20`,
            }}>{n.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
        {['Horizontal scaling','Load balancing','Cache layer','DB sharding'].map((t) => (
          <span key={t} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: D.t3 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Cinematic feature showcase (pinned scroll) ────────────────────────── */
const FEATURES = [
  {
    eyebrow: 'DSA Practice',
    eyebrowColor: '#3B82F6',
    heading: <>Stop grinding randomly.<br />Think in patterns.</>,
    body: 'Most students solve 200+ problems and still freeze in interviews. EYF structures practice around the 15 fundamental patterns that cover 80% of real interview questions.',
    points: ['450+ problems by pattern — not just by topic','Company filter: Google, Amazon, TCS, Infosys','In-browser editor with auto test execution','Spaced-repetition review queue'],
    accentColor: '#4ADE80',
    card: <CodeCard />,
  },
  {
    eyebrow: 'Placement Intelligence',
    eyebrowColor: '#A78BFA',
    heading: <>Know your readiness<br />before the call.</>,
    body: "EYF's Placement Score aggregates your DSA depth, system design fluency, and company-specific coverage into one honest metric — no surprises on interview day.",
    points: ['Readiness score across all technical domains','Company-wise question banks with recent OA patterns','ATS resume analyzer with actionable tips','Role-specific prep plans: SDE, Data Analyst, DevOps'],
    accentColor: '#A78BFA',
    card: <ReadinessCard />,
  },
  {
    eyebrow: 'System Design',
    eyebrowColor: '#22D3EE',
    heading: <>Design systems that<br />scale to millions.</>,
    body: 'From URL shorteners to distributed databases — EYF teaches system design through real-world architectures, trade-off analysis, and hands-on diagramming exercises.',
    points: ['High-level & low-level design for 30+ systems','Trade-off analysis and capacity estimation','Worked solutions with annotated diagrams','Interview-format walkthroughs'],
    accentColor: '#22D3EE',
    card: <SystemDesignCard />,
  },
] as const;

function FeatureShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  // Feature 1: visible 0 → 0.36
  const f1o = useTransform(scrollYProgress, [0, 0.04, 0.30, 0.38], [0, 1, 1, 0]);
  const f1y = useTransform(scrollYProgress, [0, 0.04, 0.30, 0.38], [50, 0, 0, -60]);
  const f1s = useTransform(scrollYProgress, [0.30, 0.38], [1, 0.93]);
  const f1ry = useTransform(scrollYProgress, [0, 0.04], [-6, 0]);

  // Feature 2: visible 0.33 → 0.70
  const f2o = useTransform(scrollYProgress, [0.32, 0.40, 0.64, 0.72], [0, 1, 1, 0]);
  const f2y = useTransform(scrollYProgress, [0.32, 0.40, 0.64, 0.72], [60, 0, 0, -60]);
  const f2s = useTransform(scrollYProgress, [0.64, 0.72], [1, 0.93]);
  const f2ry = useTransform(scrollYProgress, [0.32, 0.40], [-6, 0]);

  // Feature 3: visible 0.67 → 1.0
  const f3o = useTransform(scrollYProgress, [0.66, 0.74, 1, 1], [0, 1, 1, 1]);
  const f3y = useTransform(scrollYProgress, [0.66, 0.74], [60, 0]);
  const f3ry = useTransform(scrollYProgress, [0.66, 0.74], [-6, 0]);

  // Dot progress indicator
  const dot0 = useTransform(scrollYProgress, [0, 0.33], [1, 0]);
  const dot1mid = useTransform(scrollYProgress, [0.33, 0.66], [0, 1]);
  const dot2 = useTransform(scrollYProgress, [0.66, 1], [0, 1]);

  const motions = [
    { opacity: f1o, y: f1y, scale: f1s, rotateY: f1ry },
    { opacity: f2o, y: f2y, scale: f2s, rotateY: f2ry },
    { opacity: f3o, y: f3y, scale: useMotionValue(1), rotateY: f3ry },
  ] as const;

  const dots = [dot0, dot1mid, dot2] as const;

  return (
    <div ref={containerRef} id="showcase" style={{ height: '360vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: D.bg }}>
        <GridBg opacity={0.018} />

        {/* Ambient glow */}
        <div aria-hidden="true" className="aurora-blob-c" style={{
          position: 'absolute', top: '-20%', left: '30%',
          width: 700, height: 700,
          background: 'radial-gradient(ellipse, rgba(232,25,44,0.08) 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Progress dots */}
        <div style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 10 }}>
          {dots.map((dot, i) => (
            <motion.div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#E8192C',
              opacity: dot,
              boxShadow: '0 0 8px #E8192C',
            }} />
          ))}
        </div>

        {/* All 3 feature panels stacked, each absolutely positioned */}
        {FEATURES.map((feat, i) => (
          <motion.div
            key={i}
            style={{
              opacity: motions[i].opacity,
              y: motions[i].y,
              scale: motions[i].scale,
              rotateY: motions[i].rotateY,
              transformPerspective: 1200,
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center',
              paddingTop: 72, // clear fixed navbar
            }}
          >
            <div className="land-container w-full">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, alignItems: 'center' }}
                className="lg:grid-two-col">
                {/* Text */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: feat.eyebrowColor, marginBottom: 16 }}>
                    {feat.eyebrow}
                  </p>
                  <h2 style={{ fontSize: 'clamp(26px, 4vw, 50px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: D.t1, marginBottom: 16 }}>
                    {feat.heading}
                  </h2>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: D.t3, marginBottom: 22 }}>{feat.body}</p>
                  <ul style={{ marginBottom: 28 }}>
                    {feat.points.map((p) => (
                      <li key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: D.t3, marginBottom: 9 }}>
                        <span style={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: `${feat.accentColor}18`, color: feat.accentColor,
                          fontSize: 9, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 3,
                        }}>✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link to="/login?tab=register" className="btn btn-primary">Get started free</Link>
                </div>
                {/* Card — hidden on mobile to prevent overflow in pinned section */}
                <div className="hidden lg:block" style={{ minWidth: 0 }}>
                  <Tilt strength={10}>
                    {feat.card}
                  </Tilt>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Stats ─────────────────────────────────────────────────────────────── */
function StatsSection() {
  const stats = [
    { value: 12400, suffix: '+', label: 'Students enrolled',      detail: 'from 200+ colleges' },
    { value: 450,   suffix: '+', label: 'Problems & solutions',   detail: 'with pattern tags' },
    { value: 94,    suffix: '%', label: 'Placement success rate', detail: 'among Pro users' },
    { value: 60,    suffix: '+', label: 'Company resources',      detail: 'Google · Amazon · more' },
  ];
  return (
    <section style={{ background: D.surf, padding: '100px 0', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,25,44,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="land-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <Tilt strength={8} style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: `1px solid ${D.border}` }}>
                <div style={{
                  fontSize: 'clamp(38px, 5vw, 62px)', fontWeight: 900, letterSpacing: '-0.05em',
                  lineHeight: 1, color: D.t1, marginBottom: 8,
                  textShadow: '0 0 50px rgba(232,25,44,0.4)',
                }}>
                  <CountUp target={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: D.t3, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: D.t4 }}>{s.detail}</div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Curriculum ────────────────────────────────────────────────────────── */
function CurriculumSection() {
  const modules = [
    { icon: 'code',         label: 'DSA Practice',      desc: '450+ problems · 15 patterns',   color: '#3B82F6' },
    { icon: 'architecture', label: 'System Design',     desc: 'HLD · LLD · Real systems',      color: '#22D3EE' },
    { icon: 'account_tree', label: 'OOP & Design',      desc: 'SOLID · GoF · UML',             color: '#A78BFA' },
    { icon: 'terminal',     label: 'Core CS Subjects',  desc: 'OS · DBMS · Networks',          color: '#4ADE80' },
    { icon: 'shield',       label: 'Cybersecurity',     desc: 'OWASP · CTF · Web security',    color: D.red },
    { icon: 'work_history', label: 'Placement Prep',    desc: 'Companies · Resume · Mock',     color: '#FB923C' },
    { icon: 'fact_check',   label: 'Skill Assessments', desc: 'Timed tests · Certificates',   color: '#FBBF24' },
    { icon: 'style',        label: 'Flashcards',        desc: 'Spaced repetition · Review',    color: '#F472B6' },
    { icon: 'forum',        label: 'Community',         desc: 'Squads · Discussion · Mentors', color: '#818CF8' },
  ];
  return (
    <section id="curriculum" style={{ background: D.bg, padding: '120px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="land-container">
        <Reveal style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D.red, marginBottom: 14 }}>Full Curriculum</p>
              <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, letterSpacing: '-0.045em', color: D.t1, margin: 0, lineHeight: 1.05 }}>
                Everything in one place.
              </h2>
            </div>
            <Link to="/login?tab=register" className="btn btn-sm hidden md:flex"
              style={{ background: 'rgba(255,255,255,0.04)', color: D.t2, border: `1px solid ${D.border}` }}>
              View all modules
              <span className="material-symbols-rounded text-sm">arrow_forward</span>
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.04}>
              <Tilt strength={12} style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                padding: 20, borderRadius: 14,
                background: 'rgba(255,255,255,0.018)',
                border: `1px solid ${D.border}`,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 20px ${m.color}18` }}>
                  <span className="material-symbols-rounded" style={{ color: m.color, fontSize: 20 }}>{m.icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: D.t1, marginBottom: 3 }}>{m.label}</p>
                  <p style={{ fontSize: 11, color: D.t4 }}>{m.desc}</p>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ──────────────────────────────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [
    { quote: "I'd been grinding LeetCode randomly for months. EYF's pattern-based approach gave me a structure that actually stuck. Cracked Juspay in 3 weeks.", name: 'Arjun Mehta', role: 'SDE-1 at Juspay', college: 'NIT Warangal · 2024', initials: 'AM' },
    { quote: "The readiness score was honestly humbling — showed massive gaps in system design. That honesty saved me from failing my first interview round.", name: 'Priya Venkataraman', role: 'Software Engineer at Freshworks', college: 'Anna University · 2024', initials: 'PV' },
    { quote: "Finally a platform that treats DSA and placement prep as connected. The company-specific question banks are gold — I had 3 exact questions from Zoho's OA.", name: 'Rohit Sharma', role: 'Associate Engineer at Zoho', college: 'VIT Vellore · 2023', initials: 'RS' },
  ];
  return (
    <section style={{ background: D.surf, padding: '120px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="land-container">
        <Reveal style={{ marginBottom: 56, textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D.red, marginBottom: 14 }}>Student Outcomes</p>
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, letterSpacing: '-0.045em', color: D.t1, margin: 0, lineHeight: 1.05 }}>
            From preparation to placement.
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.09}>
              <Tilt strength={10} style={{
                padding: 26, borderRadius: 18,
                background: D.elev, border: `1px solid ${D.border}`,
                display: 'flex', flexDirection: 'column', height: '100%',
              }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 18 }}>
                  {[0,1,2,3,4].map((s) => <span key={s} style={{ color: '#FBBF24', fontSize: 14 }}>★</span>)}
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.75, color: D.t3, marginBottom: 22, flex: 1 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: D.red, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, boxShadow: '0 0 16px rgba(232,25,44,0.4)' }}>{t.initials}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: D.t1 }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: D.t3 }}>{t.role}</p>
                    <p style={{ fontSize: 10, color: D.t4 }}>{t.college}</p>
                  </div>
                </div>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ───────────────────────────────────────────────────────────── */
function PricingSection() {
  const plans = [
    { name: 'Free',  price: '₹0',   period: 'forever',    desc: 'Everything to start your journey.',
      features: ['100 DSA problems with explanations','Core CS subjects (full access)','Daily coding challenge','Community access'],
      cta: 'Get started free', featured: false },
    { name: 'Pro',   price: '₹499', period: 'per month',  desc: 'The full EYF experience.',
      features: ['All 450+ DSA problems & solutions','Complete placement module','Company-wise question banks (60+)','ATS resume analyzer','Mock interview access'],
      cta: 'Start Pro trial', featured: true, tag: 'Most popular' },
    { name: 'Pro+',  price: '₹999', period: 'per month',  desc: 'Mentorship and expert guidance.',
      features: ['Everything in Pro','1-on-1 mentor sessions','Resume review by experts','LinkedIn optimization','Placement guarantee support'],
      cta: 'Contact us', featured: false },
  ];
  return (
    <section id="pricing" style={{ background: D.bg, padding: '120px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="land-container">
        <Reveal style={{ marginBottom: 56, textAlign: 'center', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D.red, marginBottom: 14 }}>Pricing</p>
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 54px)', fontWeight: 900, letterSpacing: '-0.045em', color: D.t1, marginBottom: 14, lineHeight: 1.05 }}>Honest pricing. No surprises.</h2>
          <p style={{ fontSize: 14, color: D.t3, margin: 0 }}>Start free, upgrade when you need more. Most students get placed on the Pro plan.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.08}>
              <Tilt strength={plan.featured ? 6 : 10} style={{
                position: 'relative', padding: 28, borderRadius: 20,
                background: plan.featured ? 'rgba(232,25,44,0.05)' : D.elev,
                border: plan.featured ? '1px solid rgba(232,25,44,0.3)' : `1px solid ${D.border}`,
                boxShadow: plan.featured ? '0 0 80px rgba(232,25,44,0.12), 0 0 1px rgba(232,25,44,0.2)' : 'none',
              }}>
                {'tag' in plan && plan.tag && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{ display: 'inline-flex', padding: '4px 14px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: D.red, color: '#fff', boxShadow: '0 4px 16px rgba(232,25,44,0.4)' }}>{plan.tag}</span>
                  </div>
                )}
                <p style={{ fontSize: 13, fontWeight: 700, color: D.t2, marginBottom: 6 }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 5 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, color: D.t1 }}>{plan.price}</span>
                  <span style={{ fontSize: 12, color: D.t4 }}>/{plan.period}</span>
                </div>
                <p style={{ fontSize: 12, color: D.t4, marginBottom: 22 }}>{plan.desc}</p>
                <div style={{ height: 1, background: D.border, marginBottom: 22 }} />
                <ul style={{ marginBottom: 28 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, marginBottom: 11 }}>
                      <span style={{ color: '#4ADE80', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span style={{ color: D.t3 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login?tab=register" className="btn w-full justify-center"
                  style={plan.featured
                    ? { background: D.red, color: '#fff', border: `1px solid ${D.red}`, boxShadow: '0 4px 20px rgba(232,25,44,0.35)' }
                    : { background: 'rgba(255,255,255,0.04)', color: D.t2, border: `1px solid ${D.border}` }}>
                  {plan.cta}
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ───────────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section style={{ background: D.surf, padding: '140px 0', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-50%', left: '10%', right: '10%', height: '200%',
        background: 'radial-gradient(ellipse, rgba(232,25,44,0.13) 0%, transparent 65%)',
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <GridBg opacity={0.018} />
      <div className="land-container text-center" style={{ position: 'relative', zIndex: 1 }}>
        <Reveal>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.t4, marginBottom: 22 }}>Ready to start?</p>
          <h2 style={{
            fontSize: 'clamp(38px, 7vw, 80px)', fontWeight: 900,
            letterSpacing: '-0.05em', lineHeight: 0.96, color: D.t1,
            maxWidth: 720, margin: '0 auto 22px',
            textShadow: '0 0 80px rgba(232,25,44,0.2)',
          }}>
            Join 12,000+ students<br />preparing on EYF.
          </h2>
          <p style={{ fontSize: 16, color: D.t4, maxWidth: 420, margin: '0 auto 44px' }}>
            Free forever. No credit card. Start tracking your placement readiness in under 5 minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login?tab=register" className="btn btn-primary btn-xl"
              style={{ boxShadow: '0 8px 32px rgba(232,25,44,0.4)' }}>
              Create free account
              <span className="material-symbols-rounded text-base">arrow_forward</span>
            </Link>
            <Link to="/login" className="btn btn-xl"
              style={{ background: 'rgba(255,255,255,0.04)', color: D.t2, border: `1px solid ${D.border}`, backdropFilter: 'blur(12px)' }}>
              Sign in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Nav ───────────────────────────────────────────────────────────────── */
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const links = [
    { label: 'Features',   href: '#showcase' },
    { label: 'Curriculum', href: '#curriculum' },
    { label: 'Pricing',    href: '#pricing' },
  ];
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14" style={{
      background: scrolled ? 'rgba(3,3,3,0.9)' : 'transparent',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
      transition: 'background 0.35s, border-color 0.35s',
    }}>
      <div className="land-container h-full flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <EYFMark size={22} />
          <span style={{ fontWeight: 900, letterSpacing: '-0.045em', fontSize: 15, color: D.t1 }}>EYF</span>
        </Link>
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {links.map((item) => (
            <a key={item.label} href={item.href} className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ color: D.t4, transition: 'color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = D.t1; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = D.t4; }}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <Link to="/login" className="btn btn-sm" style={{ background: 'transparent', color: D.t3, border: '1px solid rgba(255,255,255,0.09)' }}>Sign in</Link>
          <Link to="/login?tab=register" className="btn btn-primary btn-sm">Get started free</Link>
        </div>
        <button className="md:hidden ml-auto p-1.5 rounded-lg" style={{ color: D.t3 }} onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          <span className="material-symbols-rounded text-xl">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>
      {menuOpen && (
        <div style={{ background: '#060606', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="land-container py-4 flex flex-col gap-1">
            {links.map((item) => (
              <a key={item.label} href={item.href} className="px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: D.t3 }} onClick={() => setMenuOpen(false)}>{item.label}</a>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
            <Link to="/login" className="btn btn-sm justify-center" style={{ background: 'rgba(255,255,255,0.04)', color: D.t2, border: '1px solid rgba(255,255,255,0.08)' }}>Sign in</Link>
            <Link to="/login?tab=register" className="btn btn-primary btn-sm mt-1 justify-center">Get started free</Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────── */
function Footer() {
  const cols = [
    { label: 'Product',   links: ['DSA Practice','System Design','OOP & Patterns','Core CS','Cybersecurity','Placement Prep'] },
    { label: 'Resources', links: ['Daily Challenge','Flashcards','Cheat Sheets','Notes','Visualizer','Pattern Quiz'] },
    { label: 'Community', links: ['Discussion Forum','Study Squads','Leaderboard','Weekly Contests','Expert Network'] },
    { label: 'Company',   links: ['About','Careers','Blog','Contact','Privacy Policy','Terms of Service'] },
  ];
  return (
    <footer style={{ background: D.bg, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="land-container" style={{ padding: '64px 0 32px' }}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8" style={{ marginBottom: 48 }}>
          <div className="col-span-2 md:col-span-1">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <EYFMark size={18} />
              <span style={{ fontWeight: 900, letterSpacing: '-0.04em', fontSize: 14, color: D.t1 }}>EYF</span>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.7, color: D.t4, marginBottom: 16 }}>
              Engineer Your Future. The structured placement preparation platform for India's engineering students.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="anim-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: D.t4 }}>All systems operational</span>
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.label}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.t4, marginBottom: 16 }}>{col.label}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {col.links.map((link) => (
                  <li key={link} style={{ marginBottom: 10 }}>
                    <a href="/login" style={{ fontSize: 12, color: D.t4, textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.color = D.t2; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.color = D.t4; }}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 24 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 11, color: D.t4 }}>© 2026 EYF — Engineer Your Future. All rights reserved.</p>
          <p style={{ fontSize: 11, color: D.t4 }}>Made with intent for Indian engineering students.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Export ────────────────────────────────────────────────────────────── */
export function LandingPage() {
  return (
    <div style={{ background: D.bg, color: D.t1, minHeight: '100vh' }}>
      <CursorGlow />
      <Grain />
      <LandingNav />
      <main>
        <HeroSection />
        <TrustBar />
        <FeatureShowcase />
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
