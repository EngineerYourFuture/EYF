import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

function useCountUp(target: number, duration = 2000, startOnMount = true) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!startOnMount || started.current) return;
    started.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, startOnMount]);
  return value;
}

const STATS = [
  { target: 18427, suffix: '+', label: 'Engineers Upskilled' },
  { target: 23,    suffix: '',  label: 'GoF Design Patterns' },
  { target: 3000,  suffix: '+', label: 'Practice Problems' },
  { target: 50,    suffix: '+', label: 'Industry Experts' },
];

const TESTIMONIALS = [
  { name: 'Arjun Mehta', role: 'Software Engineer @ Google', avatar: 'AM', color: 'bg-blue-600',
    quote: 'EYF\'s system design module and expert sessions gave me the edge I needed. Cracked Google L5 in 3 months of focused prep.' },
  { name: 'Priya Sharma', role: 'Senior SDE @ Microsoft', avatar: 'PS', color: 'bg-purple-600',
    quote: 'The OOP design patterns with real TypeScript code examples are exceptional. Nothing else I found came close to this depth.' },
  { name: 'Rahul Gupta', role: 'Security Engineer @ Zerodha', avatar: 'RG', color: 'bg-red-600',
    quote: 'The CTF challenges and OWASP lessons are hands-on in a way textbooks never are. Got my CEH cert 2 weeks after finishing the security track.' },
  { name: 'Ananya Iyer', role: 'Full Stack Dev @ Razorpay', avatar: 'AI', color: 'bg-green-600',
    quote: 'I was a college student with no industry exposure. EYF\'s structured career track and resume builder got me placed in 6 months. Life changing.' },
  { name: 'Vikram Singh', role: 'Tech Lead @ Flipkart', avatar: 'VS', color: 'bg-orange-600',
    quote: 'Even as a senior engineer, the architecture deep-dives and community discussions keep me sharp. The expert network is genuinely world-class.' },
  { name: 'Deepa Nair', role: 'Backend Engineer @ Swiggy', avatar: 'DN', color: 'bg-teal-600',
    quote: '30-day streak, GoF master badge, and 3 system design offers. EYF\'s gamification made me actually enjoy grinding interview prep.' },
];

const MODULES = [
  { icon: 'code',             color: 'from-blue-600/20 to-blue-600/5',    border: 'border-blue-500/20',   accent: 'text-blue-400',   title: 'DSA Mastery',         desc: '3,000+ problems from arrays to graphs. Step-by-step traces, test runner, editorial hints.' },
  { icon: 'account_tree',     color: 'from-purple-600/20 to-purple-600/5', border: 'border-purple-500/20', accent: 'text-purple-400', title: 'OOP & Design Patterns', desc: 'All 23 GoF patterns with TypeScript, intent, structure diagrams, and real-world use cases.' },
  { icon: 'shield',           color: 'from-red-600/20 to-red-600/5',       border: 'border-red-500/20',    accent: 'text-red-400',    title: 'Cybersecurity',       desc: 'OWASP Top 10, cryptography, network security, CTF challenges, and certification roadmaps.' },
  { icon: 'architecture',     color: 'from-cyan-600/20 to-cyan-600/5',     border: 'border-cyan-500/20',   accent: 'text-cyan-400',   title: 'System Design',       desc: 'Design URL shorteners, Twitter feeds, distributed caches. Structured approach + tradeoffs.' },
  { icon: 'terminal',         color: 'from-green-600/20 to-green-600/5',   border: 'border-green-500/20',  accent: 'text-green-400',  title: 'Core CS Subjects',    desc: 'OS, DBMS, Computer Networks — structured like a top-tier university curriculum.' },
  { icon: 'workspace_premium',color: 'from-amber-600/20 to-amber-600/5',   border: 'border-amber-500/20',  accent: 'text-amber-400',  title: 'Expert Network',      desc: '1:1 sessions with FAANG engineers. Honest feedback, real interview simulations.' },
  { icon: 'route',            color: 'from-pink-600/20 to-pink-600/5',     border: 'border-pink-500/20',   accent: 'text-pink-400',   title: 'Career Tracks',       desc: 'Structured paths from Student → First Job → Senior → Lead. No guesswork.' },
  { icon: 'emoji_events',     color: 'from-yellow-600/20 to-yellow-600/5', border: 'border-yellow-500/20', accent: 'text-yellow-400', title: 'Achievements & XP',   desc: '25+ badges, weekly leaderboard, streaks, and levels. Make learning addictive.' },
  { icon: 'forum',            color: 'from-indigo-600/20 to-indigo-600/5', border: 'border-indigo-500/20', accent: 'text-indigo-400', title: 'Community',           desc: 'Threaded discussions, curated answers, and peer code reviews across all modules.' },
  { icon: 'description',      color: 'from-lime-600/20 to-lime-600/5',     border: 'border-lime-500/20',   accent: 'text-lime-400',   title: 'Resume Builder',      desc: 'ATS-optimised templates, live preview, PDF export, and AI-assisted bullet points.' },
];

const PLANS = [
  {
    name: 'Free', price: '₹0', period: '', cta: 'Start Free',  highlight: false, badge: '',
    features: ['10 DSA problems/day', 'Core Subjects access', 'Community access', 'Basic career tracks', 'Achievement system'],
    missing: ['Unlimited DSA', 'OOP deep-dives', 'CTF challenges', 'System Design workspace', 'Expert sessions', 'Resume export'],
  },
  {
    name: 'Pro', price: '₹499', period: '/month', cta: 'Start 7-Day Free Trial', highlight: true, badge: 'Most Popular',
    features: ['Unlimited DSA problems', 'All OOP patterns + SOLID', 'Full Cybersecurity + CTF', 'System Design workspace', 'Resume Builder + PDF', 'Weekly leaderboard', 'Community full access', 'Priority support'],
    missing: ['Expert 1:1 sessions', 'Mock interviews'],
  },
  {
    name: 'Elite', price: '₹999', period: '/month', cta: 'Get Elite Access', highlight: false, badge: 'Best Value',
    features: ['Everything in Pro', '3 Expert 1:1 sessions/month', '5 Mock interviews/month', 'AI code review', 'Private community channels', 'Career roadmap review', 'Certification study groups', 'Early feature access'],
    missing: [],
  },
];

const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Swiggy', 'Razorpay', 'Zerodha', 'Atlassian'];

const FAQS = [
  { q: 'Is EYF suitable for complete beginners?', a: 'Yes. EYF starts from fundamentals — the Student track begins with core CS subjects, basic DSA, and OOP concepts before ramping up to interview-level content.' },
  { q: 'How is this different from LeetCode or YouTube tutorials?', a: 'EYF is structured end-to-end — not just problems but also design patterns, cybersecurity, system design, career guidance, and a real expert network. It\'s an engineering growth platform, not a problem bank.' },
  { q: 'What makes the OOP and Security content special?', a: 'All 23 GoF patterns include TypeScript code, intent, structure diagrams, and real-world use cases — not textbook definitions. Security includes hands-on CTF challenges with real flag-submission scoring.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Monthly plans can be cancelled anytime. You keep access until the end of the billing period.' },
  { q: 'Are there refunds?', a: 'We offer a full refund within 7 days of purchase if you\'re not satisfied — no questions asked.' },
];

function StatCounter({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const value = useCountUp(target);
  return (
    <div className="text-center">
      <p className="text-4xl md:text-5xl font-black tabular-nums text-white">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="text-zinc-400 text-sm mt-1 font-medium">{label}</p>
    </div>
  );
}

export function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setActiveTestimonial((i) => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white dark selection:bg-red-600/30">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-white">EYF</span>
            <span className="text-zinc-600 mx-2 hidden md:inline">|</span>
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-widest hidden md:inline">Engineer Your Future</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-zinc-400 hover:text-white text-sm font-medium transition-colors hidden md:inline">Sign in</Link>
            <Link to="/login?tab=register" className="bg-[#E82127] hover:bg-[#c71d22] text-white rounded-full px-5 py-2 text-sm font-bold transition-all active:scale-95 shadow-lg shadow-red-900/20">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-semibold text-zinc-300 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            18,427 engineers actively learning today
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6">
            <span className="text-white">Master</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600">Engineering.</span>
            <br />
            <span className="text-white">Get Hired.</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Lead Teams.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The only platform that takes you from DSA fundamentals to system architecture, cybersecurity, OOP mastery, and industry expert mentorship — in one structured journey.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/login?tab=register"
              className="w-full sm:w-auto bg-[#E82127] hover:bg-[#c71d22] text-white rounded-full px-8 py-4 text-base font-black tracking-wider uppercase transition-all active:scale-95 shadow-xl shadow-red-900/30 hover:shadow-red-900/50"
            >
              Start for Free — No Card Needed
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto border border-white/10 hover:border-white/20 text-zinc-300 rounded-full px-8 py-4 text-base font-medium transition-all hover:bg-white/5"
            >
              Sign in to continue
            </Link>
          </div>

          {/* Live trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-600 text-xs font-medium">
            {['🔒 Secure & Private', '🇮🇳 Built for Indian Engineers', '⚡ Cancel Anytime', '🎯 7-Day Money-Back'].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => <StatCounter key={s.label} {...s} />)}
        </div>
      </section>

      {/* Companies */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-8">Where EYF engineers work</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {COMPANIES.map((c) => (
              <span key={c} className="text-zinc-500 font-black text-sm md:text-base tracking-tight hover:text-zinc-300 transition-colors">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
              10 Modules. One Platform.
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">Every skill you need to go from student to senior engineer — structured, sequenced, and expert-reviewed.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MODULES.map((m) => (
              <div key={m.title} className={`bg-gradient-to-br ${m.color} border ${m.border} rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300 cursor-default`}>
                <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center mb-4 ${m.accent}`}>
                  <span className="material-icons text-xl">{m.icon}</span>
                </div>
                <h3 className="font-black text-sm tracking-tight mb-2 text-white">{m.title}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OOP + Security Spotlight */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* OOP */}
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/5 border border-purple-500/20 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center">
                <span className="material-icons text-purple-400 text-2xl">account_tree</span>
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">OOP & Design Patterns</h3>
                <p className="text-purple-400 text-xs font-bold uppercase tracking-widest">Industry Depth</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              {['All 23 GoF patterns in TypeScript', 'SOLID principles with bad/good examples', 'Intent, structure & real-world use cases', 'Progress tracking per pattern', 'Creational → Structural → Behavioral'].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                  <span className="material-icons text-purple-400 text-base flex-shrink-0">check_circle</span>
                  {f}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Singleton', 'Observer', 'Factory', 'Decorator', 'Strategy', 'Builder'].map((p) => (
                <div key={p} className="bg-purple-600/10 border border-purple-500/20 rounded-lg px-2 py-1.5 text-center">
                  <span className="text-purple-300 text-[10px] font-bold">{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-gradient-to-br from-red-900/30 to-red-900/5 border border-red-500/20 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center">
                <span className="material-icons text-red-400 text-2xl">shield</span>
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">Cybersecurity</h3>
                <p className="text-red-400 text-xs font-bold uppercase tracking-widest">Hands-On Labs</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              {['OWASP Top 10 with exploit demos', 'CTF challenges with real flag submission', 'Cryptography, network & cloud security', 'Bcrypt-verified challenge answers', 'Cert roadmaps: Security+, CEH, OSCP'].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                  <span className="material-icons text-red-400 text-base flex-shrink-0">check_circle</span>
                  {f}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['SQL Injection', 'XSS', 'CSRF', 'Cryptography', 'Network Sec', 'Cloud IAM'].map((p) => (
                <div key={p} className="bg-red-600/10 border border-red-500/20 rounded-lg px-2 py-1.5 text-center">
                  <span className="text-red-300 text-[10px] font-bold">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gamification */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-yellow-400 mb-6 uppercase tracking-widest">
              Gamification Engine
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
              Learning should feel like levelling up.
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
              XP rewards, daily streaks, 25+ achievement badges, weekly leaderboards, and 10 engineer levels from Newcomer to Legend. We made self-discipline unnecessary.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: 'local_fire_department', label: 'Daily Streaks', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { icon: 'emoji_events', label: '25+ Badges', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                { icon: 'leaderboard', label: 'Leaderboards', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                { icon: 'stars', label: '10 XP Levels', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              ].map((f) => (
                <div key={f.label} className={`${f.bg} border border-white/5 rounded-2xl p-4 flex items-center gap-3`}>
                  <span className={`material-icons ${f.color} text-xl`}>{f.icon}</span>
                  <span className="text-sm font-bold text-white">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mock achievement board */}
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Your Achievements</p>
            {[
              { icon: '🩸', name: 'First Blood', rarity: 'common', desc: 'Solved first DSA problem', earned: true },
              { icon: '🚩', name: 'Flag Hunter', rarity: 'common', desc: 'Solved first CTF challenge', earned: true },
              { icon: '📐', name: 'GoF Master', rarity: 'epic', desc: 'All 23 design patterns complete', earned: false },
              { icon: '🌟', name: 'Monthly Master', rarity: 'epic', desc: '30-day learning streak', earned: false },
              { icon: '💯', name: 'Century Club', rarity: 'legendary', desc: '100-day learning streak', earned: false },
            ].map((a) => (
              <div key={a.name} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${a.earned ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'}`}>
                <span className={`text-2xl ${!a.earned ? 'grayscale' : ''}`}>{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{a.name}</p>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      a.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                      a.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-500/20 text-zinc-400'
                    }`}>{a.rarity}</span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{a.desc}</p>
                </div>
                {a.earned && <span className="material-icons text-green-400 text-base flex-shrink-0">check_circle</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black tracking-tighter mb-3">Engineers who made the leap</h2>
            <p className="text-zinc-400">Real people. Real outcomes.</p>
          </div>

          <div className="relative">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-10 min-h-[180px] transition-all duration-500">
              <div className="flex items-start gap-6">
                <div className={`w-14 h-14 rounded-2xl ${TESTIMONIALS[activeTestimonial].color} flex-shrink-0 flex items-center justify-center font-black text-white text-lg`}>
                  {TESTIMONIALS[activeTestimonial].avatar}
                </div>
                <div>
                  <p className="text-zinc-200 text-lg leading-relaxed mb-4 italic">"{TESTIMONIALS[activeTestimonial].quote}"</p>
                  <p className="font-black text-white">{TESTIMONIALS[activeTestimonial].name}</p>
                  <p className="text-zinc-500 text-sm">{TESTIMONIALS[activeTestimonial].role}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-1.5 rounded-full transition-all ${i === activeTestimonial ? 'w-8 bg-red-500' : 'w-1.5 bg-zinc-700'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Simple, honest pricing</h2>
            <p className="text-zinc-400 text-lg">Start free. Upgrade when you're ready.</p>
          </div>
          <p className="text-center text-green-400 text-sm font-bold mb-12">🎉 Pro trial is free for 7 days — no credit card required</p>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`relative rounded-3xl p-8 border transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-b from-red-950/40 to-[#111] border-red-500/40 shadow-2xl shadow-red-900/20 scale-[1.02]'
                  : 'bg-[#111] border-white/10'
              }`}>
                {plan.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest ${
                    plan.highlight ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
                  }`}>{plan.badge}</div>
                )}
                <h3 className="font-black text-xl mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">{plan.period}</span>
                </div>
                <Link
                  to="/login?tab=register"
                  className={`block w-full rounded-full py-3 text-sm font-black uppercase tracking-widest text-center mb-6 transition-all active:scale-95 ${
                    plan.highlight
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
                <div className="space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <span className="material-icons text-green-400 text-base flex-shrink-0">check</span>
                      {f}
                    </div>
                  ))}
                  {plan.missing.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-zinc-600">
                      <span className="material-icons text-zinc-700 text-base flex-shrink-0">remove</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black tracking-tighter text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-bold text-sm text-white pr-4">{faq.q}</span>
                  <span className="material-icons text-zinc-400 flex-shrink-0 transition-transform" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-zinc-400 text-sm leading-relaxed border-t border-white/5 pt-4">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6">
            Your future self<br />is waiting.
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
            18,427 engineers started their EYF journey this year. Every day you wait is a day they get ahead.
          </p>
          <Link
            to="/login?tab=register"
            className="inline-block bg-[#E82127] hover:bg-[#c71d22] text-white rounded-full px-10 py-5 text-base font-black tracking-widest uppercase transition-all active:scale-95 shadow-2xl shadow-red-900/40"
          >
            Start Free Today
          </Link>
          <p className="text-zinc-600 text-xs mt-4">No credit card. Cancel anytime. 7-day Pro trial included.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-lg">EYF</span>
            <span className="text-zinc-600 text-xs uppercase tracking-widest">Engineer Your Future</span>
          </div>
          <div className="flex items-center gap-6 text-zinc-600 text-xs">
            <Link to="/#pricing" className="hover:text-zinc-400 transition-colors">Pricing</Link>
            <Link to="/login" className="hover:text-zinc-400 transition-colors">Sign In</Link>
            <span>© {new Date().getFullYear()} EYF Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
