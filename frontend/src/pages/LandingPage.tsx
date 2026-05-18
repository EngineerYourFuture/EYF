import { Link } from 'react-router-dom';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { EYFMark } from '../components/EYFLogo';
import { Icon } from '../components/Icon';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return { value, ref };
}

function Reveal({ children, delay = 0, className = '' }: { readonly children: ReactNode; readonly delay?: number; readonly className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Data ─────────────────────────────────────────────────────────────────── */

const STATS = [
  { target: 2400,  suffix: '+', label: 'Coding Problems' },
  { target: 98,    suffix: '%', label: 'Placement Rate' },
  { target: 50,    suffix: '+', label: 'Expert Mentors' },
  { target: 12000, suffix: '+', label: 'Engineers Trained' },
];

const FEATURES = [
  { icon: 'code', title: 'DSA Mastery',       color: '#3B82F6', desc: '2400+ problems with algorithmic visualizer, complexity analysis, and spaced-repetition reviews.' },
  { icon: 'account_tree', title: 'OOP & Patterns', color: '#8B5CF6', desc: '23 design patterns with real TypeScript code, interactive quizzes, and refactoring challenges.' },
  { icon: 'shield', title: 'Cybersecurity',    color: '#E8192C', desc: 'CTF challenges, OWASP labs, live exploit demos, and a curated cert roadmap.' },
  { icon: 'architecture', title: 'System Design', color: '#06B6D4', desc: 'Scale Instagram, design Uber — deep dives with trade-off analysis and expert review.' },
  { icon: 'psychology', title: 'AI-Powered Coach', color: '#F59E0B', desc: 'Your personal study plan adapts daily based on your weak spots and placement deadline.' },
  { icon: 'groups', title: 'Expert Network',   color: '#10B981', desc: 'Live sessions, 1-on-1 mentorship, and mock interviews with engineers at FAANG.' },
];

const MODULES = [
  { icon: 'auto_stories', label: 'Core CS',       color: '#22C55E' },
  { icon: 'leaderboard',  label: 'Leaderboard',   color: '#EAB308' },
  { icon: 'work_history', label: 'Placement Prep', color: '#F97316' },
  { icon: 'description',  label: 'Resume Builder', color: '#EC4899' },
  { icon: 'style',        label: 'Flashcards',    color: '#A78BFA' },
  { icon: 'map',          label: 'Roadmaps',      color: '#38BDF8' },
  { icon: 'emoji_events', label: 'Contests',      color: '#FBBF24' },
  { icon: 'forum',        label: 'Community',     color: '#34D399' },
];

const TESTIMONIALS = [
  { name: 'Arjun Mehta',  role: 'L5 Software Engineer @ Google',   init: 'A', color: '#3B82F6',
    quote: 'The system design depth is unreal. I used EYF exclusively for 3 months and cracked Google L5 on my first attempt.' },
  { name: 'Priya Sharma', role: 'Senior SDE @ Microsoft',          init: 'P', color: '#8B5CF6',
    quote: 'OOP patterns explained with actual production TypeScript — nothing else online even comes close to this quality.' },
  { name: 'Rahul Gupta',  role: 'Security Engineer @ Zerodha',     init: 'R', color: '#E8192C',
    quote: 'The CTF challenges are genuinely hard and the OWASP content is gold. Got my CEH cert 2 weeks after finishing the security track.' },
  { name: 'Ananya Iyer',  role: 'Full Stack Dev @ Razorpay',       init: 'A', color: '#10B981',
    quote: 'Daily challenges + streak system made studying addictive. 90-day streak, landed Razorpay. Need I say more?' },
  { name: 'Kiran Reddy',  role: 'Platform Engineer @ Flipkart',    init: 'K', color: '#F59E0B',
    quote: 'The placement tracker and company-specific prep saved me 40+ hours of research. Every CS student needs this.' },
  { name: 'Sneha Patel',  role: 'SDE II @ Amazon',                 init: 'S', color: '#06B6D4',
    quote: 'Expert mock interviews were brutally honest and incredibly helpful. Prepared me for the actual pressure of FAANG rounds.' },
];

const MARQUEE_ITEMS = ['DSA', 'System Design', 'OOP', 'Cybersecurity', 'Career Prep', 'Mock Interviews', 'AI Coach', 'Expert Mentors', 'Daily Challenges', 'Leaderboard'];

/* ── Nav ──────────────────────────────────────────────────────────────────── */

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass-heavy border-b border-white/5' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <EYFMark size={26} className="text-[#080808] group-hover:scale-110 transition-transform duration-300" />
          <span className="text-lg font-black tracking-tight text-white">EYF</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {['Features', 'Curriculum', 'Community', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-full hover:bg-white/5 transition-all duration-200"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:block px-4 py-2 text-sm text-white/70 hover:text-white transition-colors duration-200"
          >
            Sign in
          </Link>
          <Link
            to="/login?tab=register"
            className="px-5 py-2.5 bg-[#E8192C] hover:bg-[#c0151f] text-white text-sm font-semibold rounded-full transition-all duration-200 glow-red-sm hover:scale-105"
          >
            Get started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-40" />

      {/* Gradient orbs */}
      <div className="orb orb-red w-[600px] h-[600px] top-[-100px] left-[-100px] opacity-20" />
      <div className="orb orb-orange w-[400px] h-[400px] top-[20%] right-[-50px] opacity-15" />
      <div className="orb orb-purple w-[500px] h-[500px] bottom-[-100px] left-[30%] opacity-12" />

      {/* Radial fade from center */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, #080808 100%)' }} />

      <motion.div style={{ y, opacity }} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 text-xs text-white/60 mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8192C] animate-pulse" />
          Now with AI-powered adaptive learning
          <span className="text-white/30">→</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(52px,9vw,104px)] font-black leading-none tracking-tighter text-white mb-6"
        >
          Engineer
          <br />
          <span className="gradient-text">Your Future.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-[clamp(16px,2vw,22px)] text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          The only platform that takes you from CS fundamentals to FAANG offer —
          DSA, system design, OOP, cybersecurity, and expert mentorship in one place.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/login?tab=register"
            className="group relative px-8 py-4 bg-[#E8192C] text-white font-bold text-lg rounded-2xl glow-red transition-all duration-300 hover:scale-105 hover:bg-[#c0151f] overflow-hidden"
          >
            <span className="relative z-10">Start for free</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 px-8 py-4 glass rounded-2xl text-white/70 hover:text-white font-medium text-lg transition-all duration-300 hover:bg-white/5 border border-white/10 hover:border-white/20"
          >
            Explore platform
            <Icon name="arrow_downward" className="text-base group-hover:translate-y-1 transition-transform" />
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/30"
        >
          <div className="flex -space-x-2">
            {['#3B82F6', '#8B5CF6', '#E8192C', '#10B981', '#F59E0B'].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#080808] flex items-center justify-center text-xs font-bold text-white" style={{ background: c }}>
                {['A', 'P', 'R', 'K', 'S'][i]}
              </div>
            ))}
          </div>
          <span>12,000+ engineers trained · 98% placement rate</span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <Icon name="keyboard_arrow_down" className="text-xl" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ── Marquee strip ────────────────────────────────────────────────────────── */

function MarqueeStrip() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="py-6 border-y border-white/5 overflow-hidden bg-white/[0.015]">
      <div className="marquee-track">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-6 px-8 whitespace-nowrap">
            <span className="text-sm font-medium text-white/30 uppercase tracking-widest">{item}</span>
            <span className="text-[#E8192C] opacity-50">·</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Stat cell ────────────────────────────────────────────────────────────── */

function StatCell({ target, suffix, label, delay }: { readonly target: number; readonly suffix: string; readonly label: string; readonly delay: number }) {
  const { value, ref } = useCountUp(target);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
      className="bg-[#080808] p-10 text-center group hover:bg-white/[0.02] transition-colors duration-300"
    >
      <span ref={ref} className="block text-[clamp(40px,6vw,72px)] font-black tracking-tight gradient-text tabular-nums">
        {value.toLocaleString()}{suffix}
      </span>
      <span className="text-white/40 text-sm font-medium mt-2 block group-hover:text-white/60 transition-colors">{label}</span>
    </motion.div>
  );
}

/* ── Stats ────────────────────────────────────────────────────────────────── */

function StatsSection() {
  return (
    <section id="stats" className="py-32 relative overflow-hidden">
      <div className="orb orb-red w-[600px] h-[300px] top-0 left-1/2 -translate-x-1/2 opacity-10" />
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center mb-20">
          <p className="text-[#E8192C] font-semibold text-sm uppercase tracking-widest mb-4">By the numbers</p>
          <h2 className="text-[clamp(36px,5vw,64px)] font-black tracking-tight text-white">
            Results that speak<br /><span className="gradient-text">for themselves.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-3xl overflow-hidden">
          {STATS.map(({ target, suffix, label }, i) => (
            <StatCell key={label} target={target} suffix={suffix} label={label} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Features ─────────────────────────────────────────────────────────────── */

function FeaturesSection() {
  return (
    <section id="features" className="py-32 relative overflow-hidden">
      <div className="orb orb-purple w-[500px] h-[500px] top-1/2 right-[-100px] opacity-10" />
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center mb-20">
          <p className="text-[#E8192C] font-semibold text-sm uppercase tracking-widest mb-4">Everything you need</p>
          <h2 className="text-[clamp(36px,5vw,64px)] font-black tracking-tight text-white">
            One platform,<br /><span className="gradient-text">infinite growth.</span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto mt-6 text-lg">
            Six disciplines. Expert-designed curriculum. Built for engineers who want the real thing.
          </p>
        </Reveal>

        <div id="curriculum" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon, title, color, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
              className="glass rounded-2xl p-8 group cursor-pointer border border-white/5 hover:border-white/12 transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${color}18`, border: `1px solid ${color}25` }}
              >
                <Icon name={icon} className="text-xl" style={{ color }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-white transition-colors">{title}</h3>
              <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/55 transition-colors">{desc}</p>

              <div className="mt-6 flex items-center gap-2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0" style={{ color }}>
                Explore module <Icon name="arrow_forward" className="text-sm" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Showcase section ─────────────────────────────────────────────────────── */

function ShowcaseSection() {
  const items = [
    {
      badge: 'Visualizer',
      title: 'Watch algorithms think.',
      desc: 'Step through sorting, graph traversal, and tree operations frame by frame. Understand the why, not just the how.',
      color: '#3B82F6',
      visual: (
        <div className="rounded-xl overflow-hidden glass border border-white/8 p-6 font-mono text-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#E8192C]/70" />
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]/70" />
            <div className="w-3 h-3 rounded-full bg-[#22C55E]/70" />
            <span className="ml-2 text-white/20 text-[10px]">visualizer.tsx</span>
          </div>
          <div className="space-y-1 text-white/50">
            <div><span className="text-[#8B5CF6]">function</span> <span className="text-[#3B82F6]">quickSort</span>(<span className="text-[#F59E0B]">arr</span>) {'{'}</div>
            <div className="pl-4"><span className="text-[#8B5CF6]">if</span> (arr.length &lt;= 1) <span className="text-[#8B5CF6]">return</span> arr;</div>
            <div className="pl-4 text-[#22C55E]">// ← pivot selected</div>
            <div className="pl-4"><span className="text-[#F59E0B]">const</span> pivot = arr[arr.length - 1];</div>
            <div className="pl-4"><span className="text-[#F59E0B]">const</span> left = [], right = [];</div>
            <div className="pl-4"><span className="text-[#8B5CF6]">for</span> (<span className="text-[#F59E0B]">const</span> el <span className="text-[#8B5CF6]">of</span> arr.slice(0, -1)) {'{'}</div>
            <div className="pl-8">el &lt;= pivot ? left.push(el) : right.push(el);</div>
            <div className="pl-4">{'}'}</div>
            <div className="pl-4"><span className="text-[#8B5CF6]">return</span> [...quickSort(left), pivot, ...quickSort(right)];</div>
            <div>{'}'}</div>
          </div>
          <div className="mt-4 flex gap-2">
            {[3, 7, 1, 9, 2, 5].map((n, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded transition-all duration-500"
                  style={{ height: `${n * 8}px`, background: n === 5 ? '#E8192C' : 'rgba(59,130,246,0.4)' }}
                />
                <span className="text-[9px] text-white/30">{n}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      badge: 'CTF Challenges',
      title: 'Hack to learn. Learn to defend.',
      desc: 'Real capture-the-flag challenges across web, crypto, forensics, and binary exploitation. No simulations — real vulnerabilities.',
      color: '#E8192C',
      visual: (
        <div className="rounded-xl overflow-hidden glass border border-white/8 p-6 font-mono text-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-[#E8192C]/70" />
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]/70" />
            <div className="w-3 h-3 rounded-full bg-[#22C55E]/70" />
            <span className="ml-2 text-white/20 text-[10px]">terminal</span>
          </div>
          <div className="space-y-2">
            <div className="text-[#22C55E]">$ curl -i https://ctf.eyf.dev/challenge/xss-1</div>
            <div className="text-white/40">HTTP/2 200 OK</div>
            <div className="text-white/40">content-type: text/html</div>
            <div className="text-white/20">...</div>
            <div className="text-[#F59E0B]">{"<script>alert(document.cookie)</script>"}</div>
            <div className="text-[#22C55E] mt-3">{"[+] XSS triggered — cookie exfiltrated"}</div>
            <div className="text-[#3B82F6]">{"[*] Flag: EYF{xss_stored_v1ct0ry}"}</div>
            <div className="text-white/20 animate-pulse">█</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="orb orb-blue w-[400px] h-[400px] top-1/4 left-[-100px] opacity-10" />
      <div className="max-w-7xl mx-auto px-6 space-y-32">
        {items.map(({ badge, title, desc, color, visual }, i) => (
          <Reveal key={badge} delay={0.1}>
            <div className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-16`}>
              <div className="flex-1 space-y-6">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest" style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}>
                  {badge}
                </span>
                <h2 className="text-[clamp(32px,4vw,52px)] font-black tracking-tight text-white leading-tight">{title}</h2>
                <p className="text-white/40 text-lg leading-relaxed max-w-md">{desc}</p>
                <Link
                  to="/login?tab=register"
                  className="inline-flex items-center gap-2 font-semibold transition-colors duration-200"
                  style={{ color }}
                >
                  Try it free <Icon name="arrow_forward" className="text-base" />
                </Link>
              </div>
              <div className="flex-1 w-full max-w-lg">{visual}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Module grid ──────────────────────────────────────────────────────────── */

function ModuleGrid() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center mb-12">
          <p className="text-white/30 text-sm uppercase tracking-widest">And much more</p>
        </Reveal>
        <div className="flex flex-wrap justify-center gap-3">
          {MODULES.map(({ icon, label, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
              className="flex items-center gap-2.5 px-5 py-3 glass rounded-full border border-white/7 cursor-default"
            >
              <Icon name={icon} className="text-base" style={{ color }} />
              <span className="text-sm text-white/60 font-medium">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────────────────────────────── */

function TestimonialsSection() {
  return (
    <section id="community" className="py-32 relative overflow-hidden">
      <div className="orb orb-orange w-[400px] h-[400px] bottom-0 right-0 opacity-10" />
      <div className="max-w-7xl mx-auto px-6">
        <Reveal className="text-center mb-20">
          <p className="text-[#E8192C] font-semibold text-sm uppercase tracking-widest mb-4">Real engineers, real results</p>
          <h2 className="text-[clamp(36px,5vw,64px)] font-black tracking-tight text-white">
            Loved by <span className="gradient-text">12,000+</span><br />engineers.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ name, role, init, color, quote }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="glass rounded-2xl p-7 border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col gap-5"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Icon key={j} name="star" className="text-sm icon-fill" style={{ color: '#FBBF24' }} />
                ))}
              </div>
              <p className="text-white/60 text-sm leading-relaxed flex-1">"{quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: color }}>
                  {init}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{name}</div>
                  <div className="text-xs text-white/35 mt-0.5">{role}</div>
                </div>
              </div>
            </motion.div>
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
      name: 'Free', price: '₹0', period: 'forever',
      color: '#6B7280',
      features: ['200+ DSA problems', 'Core CS subjects', 'Community access', 'Daily challenge', 'Basic roadmap'],
    },
    {
      name: 'Pro', price: '₹499', period: '/month',
      color: '#E8192C', popular: true,
      features: ['All 2400+ problems', 'OOP & design patterns', 'CTF challenges', 'System design library', 'AI study planner', 'Resume builder', 'Mock interviews (3/mo)'],
    },
    {
      name: 'Elite', price: '₹999', period: '/month',
      color: '#F59E0B',
      features: ['Everything in Pro', 'Unlimited mock interviews', '1-on-1 expert sessions', 'Priority code review', 'Placement guarantee*', 'LinkedIn profile audit'],
    },
  ];

  return (
    <section id="pricing" className="py-32 relative overflow-hidden">
      <div className="orb orb-purple w-[600px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-8" />
      <div className="max-w-5xl mx-auto px-6">
        <Reveal className="text-center mb-20">
          <p className="text-[#E8192C] font-semibold text-sm uppercase tracking-widest mb-4">Pricing</p>
          <h2 className="text-[clamp(36px,5vw,64px)] font-black tracking-tight text-white">
            Invest in yourself.<br /><span className="gradient-text">The ROI is real.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map(({ name, price, period, color, popular, features }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-2xl p-7 flex flex-col ${popular ? 'border-2' : 'glass border border-white/7'}`}
              style={popular ? { background: `${color}10`, borderColor: color, boxShadow: `0 0 60px ${color}20` } : {}}
            >
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: color }}>
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <span className="text-sm font-semibold uppercase tracking-widest" style={{ color }}>{name}</span>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-5xl font-black text-white tracking-tight">{price}</span>
                  <span className="text-white/30 mb-2 text-sm">{period}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/60">
                    <Icon name="check_circle" className="text-base mt-0.5 flex-shrink-0 icon-fill" style={{ color }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/login?tab=register"
                className="mt-8 block w-full py-3.5 rounded-xl text-center font-bold text-sm transition-all duration-200 hover:scale-105"
                style={popular
                  ? { background: color, color: '#fff' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {name === 'Free' ? 'Start free' : `Get ${name}`}
              </Link>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-white/20 text-xs mt-8">*Placement guarantee terms apply. 30-day refund policy.</p>
      </div>
    </section>
  );
}

/* ── Final CTA ────────────────────────────────────────────────────────────── */

function CTASection() {
  return (
    <section className="py-40 relative overflow-hidden">
      <div className="orb orb-red w-[800px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" />
      <div className="grid-bg absolute inset-0 opacity-20" />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <Reveal>
          <h2 className="text-[clamp(40px,7vw,88px)] font-black tracking-tight text-white mb-8 leading-none">
            Your offer letter<br /><span className="gradient-text">starts here.</span>
          </h2>
          <p className="text-white/40 text-xl mb-12 max-w-xl mx-auto">
            Join 12,000+ engineers who chose EYF over grinding LeetCode alone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login?tab=register"
              className="group px-10 py-5 bg-[#E8192C] text-white font-bold text-xl rounded-2xl glow-red transition-all duration-300 hover:scale-105 hover:bg-[#c0151f] relative overflow-hidden"
            >
              <span className="relative z-10">Start for free — no card needed</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-600" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <EYFMark size={24} className="text-[#080808]" />
              <span className="font-black text-white tracking-tight">EYF</span>
            </div>
            <p className="text-white/25 text-sm max-w-xs leading-relaxed">
              Engineer Your Future — the all-in-one platform for software engineering excellence.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            {[
              { title: 'Platform', links: ['DSA Problems', 'Core Subjects', 'System Design', 'OOP Patterns', 'Cybersecurity'] },
              { title: 'Career', links: ['Company Prep', 'Mock Interviews', 'Resume Builder', 'Expert Network', 'Mentorship'] },
              { title: 'Community', links: ['Leaderboard', 'Weekly Contests', 'Experiences', 'Forum', 'Discord'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Privacy', 'Terms'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="font-semibold text-white/60 mb-3 text-xs uppercase tracking-widest">{title}</h4>
                <ul className="space-y-2">
                  {links.map((l) => <li key={l}><a href="#" className="text-white/25 hover:text-white/60 transition-colors duration-200">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/20">
          <span>© 2026 EYF. All rights reserved.</span>
          <span>Built with ❤️ for engineers, by engineers.</span>
        </div>
      </div>
    </footer>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export function LandingPage() {
  return (
    <div className="bg-[#080808] min-h-screen text-white overflow-x-hidden">
      <LandingNav />
      <HeroSection />
      <MarqueeStrip />
      <StatsSection />
      <FeaturesSection />
      <ShowcaseSection />
      <ModuleGrid />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
