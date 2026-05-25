import { Link } from 'react-router-dom';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import Marquee from 'react-fast-marquee';
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

/* ── ClipReveal ─────────────────────────────────────────────────────────── */
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

/* ── FadeUp ─────────────────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, style = {}, className = '' }: {
  children: ReactNode; delay?: number; style?: CSSProperties; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── SectionLabel ───────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: D.accent,
      marginBottom: 16,
      margin: '0 0 16px',
    }}>
      {children}
    </p>
  );
}

/* ── InvestorNav ────────────────────────────────────────────────────────── */
function InvestorNav() {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
      padding: '0 clamp(16px,5vw,80px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(9,9,11,0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${D.border}`,
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <EYFMark size={22} />
        <span style={{
          fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 14,
          letterSpacing: '-0.04em', color: D.t1, textTransform: 'uppercase',
        }}>EYF</span>
      </Link>
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to="/" style={{
          height: 40, padding: '0 20px',
          display: 'inline-flex', alignItems: 'center',
          border: `2px solid ${D.border}`, background: 'transparent',
          color: D.t2, fontFamily: 'Space Grotesk', fontWeight: 700,
          fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
        }}>← Back to EYF</Link>
        <a href="mailto:invest@eyf.in" style={{
          height: 40, padding: '0 20px',
          display: 'inline-flex', alignItems: 'center',
          background: D.accent, color: '#000',
          fontFamily: 'Space Grotesk', fontWeight: 700,
          fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
        }}>Request deck →</a>
      </div>
    </header>
  );
}

/* ── GridBg ─────────────────────────────────────────────────────────────── */
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

/* ── HeroSection ────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section style={{
      minHeight: '100dvh', background: D.bg,
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      textAlign: 'center', padding: 'clamp(16px,5vw,80px)', paddingTop: 120,
      position: 'relative', overflow: 'hidden',
    }}>
      <GridBg />

      {/* Red center glow */}
      <div aria-hidden style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 350,
        background: 'radial-gradient(ellipse, rgba(232,33,39,0.06) 0%, transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Confidential badge */}
      <FadeUp style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          marginBottom: 32, display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', border: `1px solid rgba(232,33,39,0.3)`,
          background: 'rgba(232,33,39,0.06)',
        }}>
          <span style={{ width: 5, height: 5, background: D.accent, borderRadius: '50%', display: 'inline-block' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.accent }}>
            Investor Overview · Confidential
          </span>
        </div>
      </FadeUp>

      {/* Main headline */}
      <h1 style={{ fontFamily: 'Space Grotesk', margin: '0 0 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ overflow: 'hidden' }}>
          <ClipReveal delay={0.05}>
            <span style={{ display: 'block', fontSize: 'clamp(2.8rem, 10vw, 11rem)', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.88, textTransform: 'uppercase', color: D.t1 }}>India's #1</span>
          </ClipReveal>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <ClipReveal delay={0.16}>
            <span style={{ display: 'block', fontSize: 'clamp(2.8rem, 10vw, 11rem)', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.88, textTransform: 'uppercase', color: D.t1 }}>placement</span>
          </ClipReveal>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <ClipReveal delay={0.28}>
            <span style={{ display: 'block', fontSize: 'clamp(2.8rem, 10vw, 11rem)', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.88, textTransform: 'uppercase', color: D.accent }}>platform.</span>
          </ClipReveal>
        </div>
      </h1>

      {/* Divider */}
      <FadeUp delay={0.5} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ width: 80, height: 2, background: D.accent, margin: '0 auto 40px' }} />
      </FadeUp>

      {/* Subtitle */}
      <FadeUp delay={0.65} style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'Inter', fontSize: 17, color: D.t2, maxWidth: 560, lineHeight: 1.75, margin: '0 auto 48px' }}>
          EYF is the structured, all-in-one platform helping India's engineering students go from college to their first tech offer — with DSA, system design, placement prep, resume building, and mentorship under one roof.
        </p>
      </FadeUp>

      {/* CTA row */}
      <FadeUp delay={0.8} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="mailto:invest@eyf.in" style={{
            height: 56, padding: '0 40px', background: D.accent, color: '#000',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
            textTransform: 'uppercase', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>Request pitch deck →</a>
          <a href="#traction" style={{
            height: 56, padding: '0 40px', background: 'transparent', color: D.t1,
            border: `2px solid ${D.border}`,
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
            textTransform: 'uppercase', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>See the numbers</a>
        </div>
      </FadeUp>

      {/* Scroll cue */}
      <FadeUp delay={1.2} style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.t4 }}>Scroll to explore</span>
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${D.accent}, transparent)` }} />
        </div>
      </FadeUp>
    </section>
  );
}

/* ── ProblemSection ─────────────────────────────────────────────────────── */
function ProblemSection() {
  return (
    <section style={{
      background: D.accent, padding: '100px clamp(16px,5vw,80px)',
      borderTop: `2px solid ${D.accent}`, position: 'relative', overflow: 'hidden',
    }}>
      <div aria-hidden style={{
        position: 'absolute', right: '-2%', top: '50%', transform: 'translateY(-50%)',
        fontSize: 'clamp(150px,22vw,320px)', fontWeight: 900, fontFamily: 'Space Grotesk',
        color: 'rgba(0,0,0,0.08)', letterSpacing: '-0.06em', lineHeight: 1,
        pointerEvents: 'none', userSelect: 'none',
      }}>01</div>

      <div style={{ maxWidth: '95vw', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)', marginBottom: 20 }}>The problem</p>
        <h2 style={{
          fontFamily: 'Space Grotesk', fontWeight: 700,
          fontSize: 'clamp(2.5rem, 7vw, 6rem)', letterSpacing: '-0.04em', lineHeight: 0.92,
          textTransform: 'uppercase', color: '#000', marginBottom: 48,
        }}>
          1.5 million engineers.<br />Only 20% get placed.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, background: 'rgba(0,0,0,0.15)' }}>
          {[
            { stat: '1.5M',    desc: 'Engineering graduates per year in India' },
            { stat: '~20%',    desc: 'Actually land a tech role after graduation' },
            { stat: '3+ yrs',  desc: 'Average time to get placed after college' },
            { stat: '₹40K Cr', desc: 'Wasted on fragmented prep across platforms' },
          ].map(({ stat, desc }) => (
            <div key={stat} style={{ background: 'rgba(0,0,0,0.1)', padding: '32px 28px' }}>
              <div style={{
                fontFamily: 'Space Grotesk', fontWeight: 700,
                fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.05em', lineHeight: 1,
                color: '#000', marginBottom: 10,
              }}>{stat}</div>
              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 40, fontSize: 15, color: 'rgba(0,0,0,0.7)', maxWidth: 640, lineHeight: 1.7 }}>
          Students are forced to juggle LeetCode for DSA, YouTube for system design, Notion for notes, LinkedIn for networking, and Glassdoor for prep — with no structure, no progress tracking, and no clear path to an offer. <strong style={{ color: '#000' }}>The fragmentation is the problem. EYF is the consolidation.</strong>
        </p>
      </div>
    </section>
  );
}

/* ── SolutionSection ────────────────────────────────────────────────────── */
function SolutionSection() {
  const pillars = [
    {
      num: '01', title: 'Structured curriculum', icon: 'route',
      body: 'A ordered, personalized path through DSA → System Design → Core CS → Placement — not a random content dump. Every module feeds into the next.',
    },
    {
      num: '02', title: 'Pattern-based DSA', icon: 'code',
      body: '450+ problems organized by the 15 core patterns that cover 90% of interview questions. Spaced repetition built in. XP gamification for consistency.',
    },
    {
      num: '03', title: 'Placement intelligence', icon: 'work_history',
      body: 'Company-specific question banks (60+ companies), ATS resume scoring, readiness benchmarking, mock interviews, and application tracking — all linked.',
    },
  ];

  const modules = [
    { icon: 'code',           label: 'DSA Practice',    sub: '450+ problems · 15 patterns',  color: '#3B82F6' },
    { icon: 'architecture',   label: 'System Design',   sub: 'HLD · LLD · 20+ case studies', color: '#22D3EE' },
    { icon: 'account_tree',   label: 'OOP & Design',    sub: 'SOLID · GoF · UML',             color: '#A78BFA' },
    { icon: 'terminal',       label: 'Core CS',         sub: 'OS · DBMS · Networks',          color: '#4ADE80' },
    { icon: 'shield',         label: 'Cybersecurity',   sub: 'OWASP · CTF · Web security',    color: D.accent  },
    { icon: 'work_history',   label: 'Placement Prep',  sub: '60+ company banks · Mock OA',   color: '#FB923C' },
    { icon: 'description',    label: 'Resume Builder',  sub: 'ATS scorer · PDF export',       color: '#FBBF24' },
    { icon: 'psychology',     label: 'Tech Skills',     sub: 'Assessments · Certificates',    color: '#0D9488' },
    { icon: 'groups',         label: 'Mentorship',      sub: '1:1 sessions · Expert guidance',color: '#DB2777' },
    { icon: 'forum',          label: 'Community',       sub: 'Squads · Discussion · Q&A',     color: '#6366F1' },
    { icon: 'visibility',     label: 'Visualizer',      sub: 'Algorithm animations · Debug',  color: '#65A30D' },
    { icon: 'style',          label: 'Flashcards',      sub: 'SM-2 spaced repetition',        color: '#9333EA' },
    { icon: 'calendar_month', label: 'Study Plan',      sub: 'AI-generated schedules',        color: '#0284C7' },
    { icon: 'track_changes',  label: 'Job Tracker',     sub: 'Applications · Status · Notes', color: '#059669' },
    { icon: 'emoji_events',   label: 'Leaderboard',     sub: 'XP · Streak · Global rank',     color: '#D97706' },
    { icon: 'bolt',           label: 'Daily Challenge', sub: 'Fresh problem every day',       color: '#F43F5E' },
  ];

  return (
    <section style={{
      background: D.bg, padding: '128px clamp(16px,5vw,80px)',
      borderTop: `1px solid ${D.border}`, position: 'relative', overflow: 'hidden',
    }}>
      <div aria-hidden style={{
        position: 'absolute', left: '-2%', top: '50%', transform: 'translateY(-50%)',
        fontSize: 'clamp(150px,22vw,320px)', fontWeight: 900, fontFamily: 'Space Grotesk',
        color: 'rgba(255,255,255,0.02)', letterSpacing: '-0.06em', lineHeight: 1,
        pointerEvents: 'none', userSelect: 'none',
      }}>02</div>

      <div style={{ maxWidth: '95vw', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <SectionLabel>The solution</SectionLabel>
        <div style={{ overflow: 'hidden', marginBottom: 64 }}>
          <ClipReveal>
            <h2 style={{
              fontFamily: 'Space Grotesk', fontWeight: 700,
              fontSize: 'clamp(2.5rem, 7vw, 6rem)', letterSpacing: '-0.04em', lineHeight: 0.92,
              textTransform: 'uppercase', color: D.t1, margin: 0,
            }}>
              One platform.<br />One path.<br /><span style={{ color: D.accent }}>One offer.</span>
            </h2>
          </ClipReveal>
        </div>

        {/* 3-column pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2, background: D.border, marginBottom: 64 }}>
          {pillars.map(p => (
            <FadeUp key={p.num}>
              <HoverCard bg={D.surf} hoverBg={D.elev} style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', color: D.t4 }}>{p.num}</span>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: D.accent }}>{p.icon}</span>
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', textTransform: 'uppercase', color: D.t1, margin: 0 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: D.t2, lineHeight: 1.7, margin: 0 }}>{p.body}</p>
              </HoverCard>
            </FadeUp>
          ))}
        </div>

        {/* Feature grid */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: D.t4, marginBottom: 20 }}>Full feature set</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1, background: D.border }}>
          {modules.map(m => (
            <HoverCard key={m.label} bg={D.surf} hoverBg={D.elev} style={{ padding: '20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: m.color, flexShrink: 0 }}>{m.icon}</span>
              <div>
                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: D.t1, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{m.label}</p>
                <p style={{ fontSize: 10, color: D.t4, margin: 0, marginTop: 2 }}>{m.sub}</p>
              </div>
            </HoverCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── MarketSection ──────────────────────────────────────────────────────── */
function MarketSection() {
  const markets = [
    {
      label: 'TAM', title: 'Total Addressable Market', value: '₹8,000 Cr', color: D.accent,
      desc: 'All engineering students in India seeking placement guidance (~1.5M/year at ₹5,000 avg spend)',
    },
    {
      label: 'SAM', title: 'Serviceable Addressable Market', value: '₹2,400 Cr', color: '#FB923C',
      desc: 'Tier-1 and Tier-2 college students with internet access and willingness to pay for structured prep (~720K/year)',
    },
    {
      label: 'SOM', title: 'Serviceable Obtainable Market', value: '₹240 Cr', color: '#FBBF24',
      desc: '3-year realistic capture at 10% of SAM — 72,000 paying users at ~₹3,300 avg annual spend',
    },
  ];

  const tailwinds = [
    { icon: 'trending_up', title: 'EdTech penetration rising', body: 'India EdTech market growing at 39% CAGR. Placement-focused learning is the fastest-growing segment post-COVID.' },
    { icon: 'smartphone',  title: 'Mobile-first generation',  body: '97% of our target demographic has smartphone access. Web + mobile platform removes friction at every step.' },
    { icon: 'work',        title: 'Campus placement pressure', body: 'With IT hiring slowing at MNCs, Tier-2/3 students are doubling down on structured prep. EYF fills the vacuum.' },
    { icon: 'monetization_on', title: 'Willingness to pay proven', body: '₹499/month is less than one month of JEE coaching. Students and parents are pre-conditioned to pay for placement guidance.' },
  ];

  return (
    <section style={{
      background: D.surf, padding: '128px clamp(16px,5vw,80px)',
      borderTop: `1px solid ${D.border}`, position: 'relative', overflow: 'hidden',
    }}>
      <div aria-hidden style={{
        position: 'absolute', right: '-2%', top: '50%', transform: 'translateY(-50%)',
        fontSize: 'clamp(150px,22vw,320px)', fontWeight: 900, fontFamily: 'Space Grotesk',
        color: 'rgba(255,255,255,0.015)', letterSpacing: '-0.06em', lineHeight: 1,
        pointerEvents: 'none', userSelect: 'none',
      }}>03</div>

      <div style={{ maxWidth: '95vw', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <SectionLabel>Market opportunity</SectionLabel>
        <div style={{ overflow: 'hidden', marginBottom: 64 }}>
          <ClipReveal>
            <h2 style={{
              fontFamily: 'Space Grotesk', fontWeight: 700,
              fontSize: 'clamp(2.5rem, 7vw, 6rem)', letterSpacing: '-0.04em', lineHeight: 0.92,
              textTransform: 'uppercase', color: D.t1, margin: 0,
            }}>
              A ₹8,000 Cr<br />market waiting<br /><span style={{ color: D.accent }}>to be owned.</span>
            </h2>
          </ClipReveal>
        </div>

        {/* TAM/SAM/SOM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 2, background: D.border, marginBottom: 56 }}>
          {markets.map(m => (
            <div key={m.label} style={{ background: D.bg, padding: '36px 32px', borderLeft: `4px solid ${m.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', background: m.color, color: '#000', padding: '3px 8px' }}>{m.label}</span>
                <span style={{ fontSize: 11, color: D.t3 }}>{m.title}</span>
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.04em', lineHeight: 1, color: D.t1, marginBottom: 12 }}>{m.value}</div>
              <p style={{ fontSize: 12, color: D.t3, lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Tailwinds */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, background: D.border }}>
          {tailwinds.map(item => (
            <div key={item.title} style={{ background: D.surf, padding: '28px 24px' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: D.accent, display: 'block', marginBottom: 12 }}>{item.icon}</span>
              <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.02em', color: D.t1, marginBottom: 8 }}>{item.title}</h4>
              <p style={{ fontSize: 12, color: D.t3, lineHeight: 1.65, margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── TractionSection ────────────────────────────────────────────────────── */
function TractionSection() {
  const metrics = [
    { value: '12,400+', label: 'Registered students', sub: 'From 200+ colleges across India',  accent: D.accent },
    { value: '94%',     label: 'Placement rate',      sub: 'Among Pro plan users tracked',      accent: '#4ADE80' },
    { value: '₹499',    label: 'Entry price point',   sub: 'Pro plan — less than a textbook',   accent: '#FBBF24' },
    { value: '4.9★',    label: 'Average rating',      sub: 'Across all feedback submissions',   accent: '#A78BFA' },
    { value: '450+',    label: 'DSA problems',        sub: 'With editorial solutions',           accent: '#3B82F6' },
    { value: '60+',     label: 'Company kits',        sub: 'Google · Amazon · Zoho · more',     accent: '#FB923C' },
    { value: '14 days', label: 'Average streak',      sub: 'Daily challenge completion',        accent: '#22D3EE' },
    { value: '200+',    label: 'Colleges represented',sub: 'IITs · NITs · VIT · BITS · more',  accent: '#F472B6' },
  ];

  const marqueeItems = ['12,400+ Students', '94% Placement Rate', '200+ Colleges', '450+ Problems', '60+ Companies', '4.9★ Rating', '14-day Avg Streak', '15 DSA Patterns'];

  return (
    <section id="traction" style={{ background: D.bg, borderTop: `1px solid ${D.border}` }}>
      {/* Red marquee band */}
      <div style={{ background: D.accent, padding: '16px 0', overflow: 'hidden' }}>
        <Marquee speed={70} gradient={false} autoFill>
          {marqueeItems.map((t, i) => (
            <span key={i} style={{ marginRight: 80, fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000' }}>{t}</span>
          ))}
        </Marquee>
      </div>

      <div style={{ padding: '128px clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{
          position: 'absolute', left: '-2%', top: '50%', transform: 'translateY(-50%)',
          fontSize: 'clamp(150px,22vw,320px)', fontWeight: 900, fontFamily: 'Space Grotesk',
          color: 'rgba(255,255,255,0.02)', letterSpacing: '-0.06em', lineHeight: 1,
          pointerEvents: 'none', userSelect: 'none',
        }}>04</div>

        <div style={{ maxWidth: '95vw', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <SectionLabel>Traction</SectionLabel>
          <div style={{ overflow: 'hidden', marginBottom: 64 }}>
            <ClipReveal>
              <h2 style={{
                fontFamily: 'Space Grotesk', fontWeight: 700,
                fontSize: 'clamp(2.5rem, 7vw, 6rem)', letterSpacing: '-0.04em', lineHeight: 0.92,
                textTransform: 'uppercase', color: D.t1, margin: 0,
              }}>
                The numbers<br /><span style={{ color: D.accent }}>speak.</span>
              </h2>
            </ClipReveal>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, background: D.border, marginBottom: 40 }}>
            {metrics.map(m => (
              <FadeUp key={m.label}>
                <HoverCard bg={D.surf} hoverBg={D.elev} style={{ padding: '28px 24px', borderLeft: `4px solid ${m.accent}` }}>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', letterSpacing: '-0.04em', lineHeight: 1, color: D.t1, marginBottom: 8 }}>{m.value}</div>
                  <p style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: D.t2, marginBottom: 4 }}>{m.label}</p>
                  <p style={{ fontSize: 11, color: D.t4, margin: 0 }}>{m.sub}</p>
                </HoverCard>
              </FadeUp>
            ))}
          </div>

          <FadeUp>
            <div style={{ border: `2px solid ${D.border}`, padding: '36px 40px', borderLeft: `4px solid ${D.accent}` }}>
              <p style={{ fontSize: 15, color: D.t2, lineHeight: 1.8, margin: 0, maxWidth: 800 }}>
                <strong style={{ color: D.t1, fontFamily: 'Space Grotesk' }}>Organic growth, zero paid acquisition.</strong> Every one of our 12,400+ students came through word-of-mouth, campus referrals, or direct search. Our viral coefficient is driven by placement success stories — students who got placed share EYF with their juniors. The product is the marketing engine.
              </p>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ── BusinessModelSection ───────────────────────────────────────────────── */
function BusinessModelSection() {
  const tiers = [
    {
      tier: 'Free', price: '₹0', sub: 'Freemium acquisition', color: D.t4, revenue: 'Acquisition funnel',
      body: 'Core access to build habits and demonstrate value. Designed to convert. 40% of free users upgrade within 60 days.',
    },
    {
      tier: 'Pro', price: '₹499/mo', sub: 'Primary revenue tier', color: D.accent, revenue: '₹349 MRR/user',
      body: 'Full platform access. Our highest-converting plan — priced at less than a month of coaching but delivers 10× the value. Target: 70% of paying users.',
    },
    {
      tier: 'Pro+', price: '₹999/mo', sub: 'High-intent power users', color: '#A78BFA', revenue: '₹699 MRR/user',
      body: '1:1 mentorship, expert sessions, resume reviews. Premium positioning for students with placement guarantees in mind.',
    },
    {
      tier: 'B2B / Campus', price: 'Custom', sub: 'Institutional licensing', color: '#4ADE80', revenue: '₹2L–₹15L/yr per inst.',
      body: 'Bulk licensing to colleges, coding bootcamps, and placement cells. Recurring annual contracts. Pilot with 3 institutions.',
    },
  ];

  const unitEcon = [
    { label: 'CAC',          value: '~₹0',    sub: 'Currently 100% organic' },
    { label: 'LTV (Pro)',    value: '₹2,400', sub: 'Avg 6-month retention' },
    { label: 'LTV / CAC',   value: '∞',      sub: 'Pre-paid acquisition phase' },
    { label: 'Gross margin', value: '>85%',   sub: 'Digital delivery, low COGS' },
    { label: 'Churn target', value: '<8%/mo', sub: 'Placement = natural endpoint' },
  ];

  return (
    <section style={{
      background: D.surf, padding: '128px clamp(16px,5vw,80px)',
      borderTop: `1px solid ${D.border}`, position: 'relative', overflow: 'hidden',
    }}>
      <div aria-hidden style={{
        position: 'absolute', right: '-2%', top: '50%', transform: 'translateY(-50%)',
        fontSize: 'clamp(150px,22vw,320px)', fontWeight: 900, fontFamily: 'Space Grotesk',
        color: 'rgba(255,255,255,0.015)', letterSpacing: '-0.06em', lineHeight: 1,
        pointerEvents: 'none', userSelect: 'none',
      }}>05</div>

      <div style={{ maxWidth: '95vw', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <SectionLabel>Business model</SectionLabel>
        <div style={{ overflow: 'hidden', marginBottom: 64 }}>
          <ClipReveal>
            <h2 style={{
              fontFamily: 'Space Grotesk', fontWeight: 700,
              fontSize: 'clamp(2.5rem, 7vw, 6rem)', letterSpacing: '-0.04em', lineHeight: 0.92,
              textTransform: 'uppercase', color: D.t1, margin: 0,
            }}>
              Simple.<br />Scalable.<br /><span style={{ color: D.accent }}>Recurring.</span>
            </h2>
          </ClipReveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2, background: D.border, marginBottom: 48 }}>
          {tiers.map(t => (
            <FadeUp key={t.tier}>
              <div style={{ background: D.bg, padding: '32px 28px', borderLeft: `4px solid ${t.color}`, display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.color, margin: '0 0 4px' }}>{t.tier}</p>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: D.t1, margin: 0 }}>{t.price}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#000', background: t.color, padding: '4px 8px', flexShrink: 0 }}>{t.revenue}</span>
                </div>
                <p style={{ fontSize: 12, color: D.t2, lineHeight: 1.65, margin: 0, flex: 1 }}>{t.body}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 1, background: D.border }}>
            {unitEcon.map(u => (
              <div key={u.label} style={{ background: D.bg, padding: '24px 20px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D.t4, marginBottom: 6 }}>{u.label}</p>
                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '-0.04em', color: D.t1, margin: '0 0 4px' }}>{u.value}</p>
                <p style={{ fontSize: 11, color: D.t4, margin: 0 }}>{u.sub}</p>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── MoatSection ────────────────────────────────────────────────────────── */
function MoatSection() {
  const comparisons = [
    { vs: 'vs LeetCode',       title: 'Structure, not chaos',      body: 'LeetCode has 3,000+ problems with no order. EYF gives you 450 problems in a structured, pattern-first order that mirrors actual interview curricula.' },
    { vs: 'vs InterviewBit',   title: 'End-to-end, not DSA-only',  body: 'InterviewBit stops at DSA. EYF adds system design, core CS, resume, placement tracking, mentorship, and company prep — all connected.' },
    { vs: 'vs GeeksforGeeks',  title: 'Platform, not wiki',        body: 'GFG is a reference site. EYF is a learning platform with progress tracking, streaks, XP, readiness scores, and a personalized roadmap.' },
    { vs: 'vs Coding Ninjas',  title: 'Affordable + self-paced',   body: 'CN charges ₹8,000–₹40,000 upfront. EYF is ₹499/month, self-paced, and covers more placement scenarios than any bootcamp.' },
  ];

  return (
    <section style={{
      background: D.accent, padding: '100px clamp(16px,5vw,80px)',
      borderTop: `1px solid ${D.border}`, position: 'relative', overflow: 'hidden',
    }}>
      <div aria-hidden style={{
        position: 'absolute', left: '-2%', top: '50%', transform: 'translateY(-50%)',
        fontSize: 'clamp(150px,22vw,320px)', fontWeight: 900, fontFamily: 'Space Grotesk',
        color: 'rgba(0,0,0,0.06)', letterSpacing: '-0.06em', lineHeight: 1,
        pointerEvents: 'none', userSelect: 'none',
      }}>06</div>

      <div style={{ maxWidth: '95vw', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.5)', marginBottom: 20 }}>Competitive moat</p>
        <h2 style={{
          fontFamily: 'Space Grotesk', fontWeight: 700,
          fontSize: 'clamp(2.5rem, 7vw, 6rem)', letterSpacing: '-0.04em', lineHeight: 0.92,
          textTransform: 'uppercase', color: '#000', marginBottom: 56,
        }}>
          Why EYF wins.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2, background: 'rgba(0,0,0,0.15)' }}>
          {comparisons.map(c => (
            <div key={c.vs} style={{ background: 'rgba(0,0,0,0.1)', padding: '32px 28px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 10 }}>{c.vs}</p>
              <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#000', marginBottom: 10 }}>{c.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: 1.65, margin: 0 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── RoadmapSection ─────────────────────────────────────────────────────── */
function RoadmapSection() {
  const phases = [
    {
      phase: 'Now', label: 'Live', color: '#4ADE80', title: 'Full platform shipped',
      items: ['DSA · System Design · OOP · Core CS', 'Placement prep · Resume · Tracker', 'Flashcards · Community · Mentorship', 'Leaderboard · Daily challenge · XP'],
    },
    {
      phase: 'Q3 2026', label: 'Building', color: D.accent, title: 'Intelligence layer',
      items: ['AI-powered study plan generation', 'Auto-graded mock OA rounds', 'Resume scoring v2 with role matching', 'Company interview pattern analytics'],
    },
    {
      phase: 'Q4 2026', label: 'Planned', color: '#A78BFA', title: 'Scale & monetize',
      items: ['Campus placement cell B2B contracts', 'Job board with company integrations', 'Referral placement network', 'Native mobile app (iOS + Android)'],
    },
    {
      phase: '2027', label: 'Vision', color: '#22D3EE', title: 'Platform dominance',
      items: ['Pan-India #1 placement platform', '1M registered students', 'Direct recruiter partnership portal', 'International expansion (SE Asia)'],
    },
  ];

  return (
    <section style={{
      background: D.bg, padding: '128px clamp(16px,5vw,80px)',
      borderTop: `1px solid ${D.border}`, position: 'relative', overflow: 'hidden',
    }}>
      <div aria-hidden style={{
        position: 'absolute', right: '-2%', top: '50%', transform: 'translateY(-50%)',
        fontSize: 'clamp(150px,22vw,320px)', fontWeight: 900, fontFamily: 'Space Grotesk',
        color: 'rgba(255,255,255,0.02)', letterSpacing: '-0.06em', lineHeight: 1,
        pointerEvents: 'none', userSelect: 'none',
      }}>07</div>

      <div style={{ maxWidth: '95vw', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <SectionLabel>Product roadmap</SectionLabel>
        <div style={{ overflow: 'hidden', marginBottom: 64 }}>
          <ClipReveal>
            <h2 style={{
              fontFamily: 'Space Grotesk', fontWeight: 700,
              fontSize: 'clamp(2.5rem, 7vw, 6rem)', letterSpacing: '-0.04em', lineHeight: 0.92,
              textTransform: 'uppercase', color: D.t1, margin: 0,
            }}>
              Where we're<br /><span style={{ color: D.accent }}>going next.</span>
            </h2>
          </ClipReveal>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, background: D.border }}>
          {phases.map(r => (
            <FadeUp key={r.phase}>
              <div style={{ background: D.surf, padding: '32px 28px', borderTop: `4px solid ${r.color}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: r.color }}>{r.phase}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#000', background: r.color, padding: '3px 8px' }}>{r.label}</span>
                </div>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, textTransform: 'uppercase', letterSpacing: '-0.01em', color: D.t1, margin: 0 }}>{r.title}</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {r.items.map(item => (
                    <li key={item} style={{ display: 'flex', gap: 8, fontSize: 12, color: D.t3, alignItems: 'flex-start' }}>
                      <span style={{ color: r.color, flexShrink: 0, marginTop: 1 }}>—</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── AskSection ─────────────────────────────────────────────────────────── */
function AskSection() {
  return (
    <section style={{
      background: '#000', minHeight: '80vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      textAlign: 'center', padding: '128px clamp(16px,5vw,80px)',
      position: 'relative', overflow: 'hidden',
      borderTop: `1px solid ${D.border}`,
    }}>
      {/* Sweeping top line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: D.accent, transformOrigin: 'left' }}
      />

      {/* Pulsing glow */}
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(232,33,39,0.2) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 700 }}>
        <FadeUp>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: D.t4, marginBottom: 48 }}>Partner with us</p>
        </FadeUp>
        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.88, margin: '0 0 64px' }}>
          <div style={{ overflow: 'hidden' }}>
            <ClipReveal delay={0.1}>
              <span style={{ display: 'block', fontSize: 'clamp(3rem, 10vw, 9rem)', textTransform: 'uppercase', color: D.t1 }}>Build the</span>
            </ClipReveal>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <ClipReveal delay={0.22}>
              <span style={{ display: 'block', fontSize: 'clamp(3rem, 10vw, 9rem)', textTransform: 'uppercase', color: D.t1 }}>future of</span>
            </ClipReveal>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <ClipReveal delay={0.36}>
              <span style={{ display: 'block', fontSize: 'clamp(3rem, 10vw, 9rem)', textTransform: 'uppercase', color: D.accent }}>placement.</span>
            </ClipReveal>
          </div>
        </h2>
        <FadeUp delay={0.6}>
          <p style={{ fontSize: 15, color: D.t2, maxWidth: 460, margin: '0 auto 48px', lineHeight: 1.75 }}>
            We're raising our seed round to accelerate growth, expand our AI features, and build the B2B institutional channel. If you're building the future of education and work, let's talk.
          </p>
        </FadeUp>
        <FadeUp delay={0.8}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a href="mailto:invest@eyf.in" style={{
                height: 56, padding: '0 40px', background: D.accent, color: '#000',
                fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
                textTransform: 'uppercase', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 10,
              }}>
                Request pitch deck →
              </a>
              <a href="mailto:partner@eyf.in" style={{
                height: 56, padding: '0 40px', background: 'transparent', color: D.t1,
                border: `2px solid ${D.border}`,
                fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
                textTransform: 'uppercase', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center',
              }}>
                Partnership inquiry
              </a>
            </div>
            <p style={{ fontSize: 12, color: D.t4, letterSpacing: '0.04em' }}>invest@eyf.in · partner@eyf.in</p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ── HoverCard helper ───────────────────────────────────────────────────── */
function HoverCard({
  children, bg, hoverBg, style = {},
}: {
  children: ReactNode; bg: string; hoverBg: string; style?: CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ background: hovered ? hoverBg : bg, transition: 'background 0.3s', cursor: 'default', ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}

/* ── Export ─────────────────────────────────────────────────────────────── */
export function InvestorPage() {
  return (
    <div style={{ background: D.bg, color: D.t1, fontFamily: 'Inter, sans-serif' }}>
      <InvestorNav />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <MarketSection />
        <TractionSection />
        <BusinessModelSection />
        <MoatSection />
        <RoadmapSection />
        <AskSection />
      </main>
      <footer style={{
        background: '#000', borderTop: `1px solid ${D.border}`,
        padding: '28px clamp(16px,5vw,80px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: D.t4 }}>EYF · INVESTOR OVERVIEW · 2026</span>
        <Link to="/" style={{ fontSize: 11, color: D.t4, textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>← Back to platform</Link>
      </footer>
    </div>
  );
}
