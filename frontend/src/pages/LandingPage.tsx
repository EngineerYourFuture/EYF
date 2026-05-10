import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';

const STATS = [
  { value: '2,400+', label: 'Coding Problems' },
  { value: '98%', label: 'Placement Rate' },
  { value: '50+', label: 'Expert Mentors' },
  { value: '12k+', label: 'Engineers Trained' },
];

const FEATURES = [
  {
    icon: 'code',
    title: 'DSA Mastery',
    desc: 'Editorial-grade problems with step-by-step traces, complexity analysis, and spaced-repetition review.',
    tag: 'Practice',
  },
  {
    icon: 'auto_stories',
    title: 'Core CS Subjects',
    desc: 'OS, DBMS, Networks, and System Design — structured like a top-tier university curriculum.',
    tag: 'Learn',
  },
  {
    icon: 'work',
    title: 'Placement Track',
    desc: 'FAANG-level mock interviews, resume ATS scoring, and a live recruiter pipeline.',
    tag: 'Career',
  },
  {
    icon: 'groups',
    title: '1:1 Mentorship',
    desc: 'Bi-weekly sessions with engineers from Google, Meta, and top startups.',
    tag: 'Guidance',
  },
  {
    icon: 'visibility',
    title: 'Algorithm Visualizer',
    desc: 'Watch Dijkstra, Merge Sort, BFS and more execute step-by-step with live state inspection.',
    tag: 'Visual',
  },
  {
    icon: 'psychology',
    title: 'Skill Analytics',
    desc: 'Identify weak spots across 20+ domains. Your personalised growth roadmap updates every session.',
    tag: 'Insights',
  },
];

const MODULES = [
  { num: '01', title: 'Data Structures & Algorithms', desc: 'The bedrock of computational thinking. Arrays to graphs, DP to divide-and-conquer.', color: 'from-red-500/10' },
  { num: '02', title: 'Core CS Fundamentals', desc: 'OS scheduling, ACID transactions, CAP theorem — the concepts behind every system.', color: 'from-blue-500/10' },
  { num: '03', title: 'Placement Prep', desc: 'Cracking the interview with behaviorals, system design, and timed coding rounds.', color: 'from-purple-500/10' },
  { num: '04', title: 'Resume Engineering', desc: 'Impact-driven bullet points, ATS optimisation, and real recruiter feedback.', color: 'from-green-500/10' },
  { num: '05', title: 'Modern Tech Stack', desc: 'React, Node, cloud platforms and DevOps tools used in production today.', color: 'from-yellow-500/10' },
  { num: '06', title: 'Elite Mentorship', desc: 'Structured coaching from engineers who\'ve cracked FAANG and top unicorns.', color: 'from-pink-500/10' },
];

const STEPS = [
  { n: '01', title: 'Assess Your Level', desc: 'A 10-minute diagnostic maps your strengths across every domain.' },
  { n: '02', title: 'Follow Your Roadmap', desc: 'AI-ranked problems and lessons matched to your target company and timeline.' },
  { n: '03', title: 'Get Placed', desc: 'Apply through our recruiter network and arrive at interviews over-prepared.' },
];

export function LandingPage() {
  return (
    <div className="dark min-h-screen bg-[#0e0e0e] text-[#e2e2e2] overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-50">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/[0.06] rounded-full px-6 py-3 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <span className="text-xl font-black tracking-tighter text-white">EYF</span>
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#modules" className="hover:text-white transition-colors">Curriculum</a>
            <a href="#how" className="hover:text-white transition-colors">How It Works</a>
            <Link to="/plans" className="hover:text-white transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link to="/login">
              <button className="bg-[#E82127] hover:brightness-110 text-white px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(232,33,39,0.3)]">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden">
          {/* Background orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#E82127]/8 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/[0.03] to-transparent" />
          </div>

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '80px 80px' }}
          />

          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E82127]/10 border border-[#E82127]/20 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E82127] animate-pulse" />
              <span className="text-[#E82127] text-[11px] font-bold uppercase tracking-widest">The Complete Engineering Career Platform</span>
            </div>

            <h1 className="text-[clamp(3rem,10vw,7rem)] font-black tracking-[-0.04em] leading-[0.88] mb-8 text-white">
              Engineer Your<br />
              <span className="text-[#E82127]">Future.</span>
            </h1>

            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              One platform to master DSA, ace interviews, build your resume,
              and land roles at top companies — guided by engineers who've done it.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <Link to="/login">
                <button className="bg-[#E82127] hover:brightness-110 text-white px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_40px_rgba(232,33,39,0.25)]">
                  Start for Free
                </button>
              </Link>
              <a href="#modules">
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all active:scale-95">
                  Explore Curriculum
                </button>
              </a>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {STATS.map((s) => (
                <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-6 py-5 backdrop-blur-sm">
                  <p className="text-2xl font-black text-white tracking-tight">{s.value}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-28">
          <div className="mb-16">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#E82127] mb-3">Everything You Need</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              One platform.<br />Every edge.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative bg-[#161616] border border-white/[0.06] rounded-2xl p-8 hover:border-white/10 hover:bg-[#1a1a1a] transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#E82127]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-[#E82127]/10 flex items-center justify-center text-[#E82127] group-hover:bg-[#E82127] group-hover:text-white transition-all duration-300">
                      <Icon name={f.icon} size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 bg-white/5 px-3 py-1 rounded-full">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how" className="py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#E82127]/3 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="mb-16 text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#E82127] mb-3">Simple Process</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">How it works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#E82127]/40 via-[#E82127]/20 to-[#E82127]/40" />

              {STEPS.map((s) => (
                <div key={s.n} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#E82127]/10 border border-[#E82127]/20 flex items-center justify-center mx-auto mb-6 relative">
                    <span className="text-[#E82127] text-xl font-black">{s.n}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Curriculum ── */}
        <section id="modules" className="max-w-7xl mx-auto px-6 py-28">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#E82127] mb-3">Full Curriculum</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">6 Modules.<br />1 Career.</h2>
            </div>
            <Link to="/login">
              <button className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 px-6 py-3 rounded-full transition-all">
                View All Modules →
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((m) => (
              <div
                key={m.num}
                className={`relative bg-gradient-to-br ${m.color} to-transparent bg-[#161616] border border-white/[0.06] rounded-2xl p-8 hover:border-white/10 transition-all duration-300 group overflow-hidden`}
              >
                <div className="absolute top-0 right-0 text-[120px] font-black text-white/[0.025] leading-none select-none pr-4 -mt-4">{m.num}</div>
                <div className="relative">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#E82127] bg-[#E82127]/10 px-3 py-1 rounded-full inline-block mb-5">
                    Module {m.num}
                  </span>
                  <h3 className="text-lg font-bold text-white mb-3 leading-snug">{m.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="max-w-7xl mx-auto px-6 py-16 mb-16">
          <div className="relative rounded-3xl overflow-hidden bg-[#161616] border border-white/[0.06]">
            {/* Red gradient glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#E82127]/10 blur-[80px] rounded-full" />
            </div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E82127]/40 to-transparent" />

            <div className="relative z-10 text-center px-8 py-20">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#E82127] mb-4">Limited Spots Available</p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
                Ready to engineer<br />your future?
              </h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
                Join 12,000+ engineers who accelerated their careers with EYF. Start free, upgrade when you're ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login">
                  <button className="bg-[#E82127] hover:brightness-110 text-white px-12 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_40px_rgba(232,33,39,0.3)]">
                    Start for Free
                  </button>
                </Link>
                <Link to="/plans">
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-12 py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all active:scale-95">
                    View Pricing
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] bg-[#0e0e0e]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-2 md:col-span-1">
              <span className="text-2xl font-black tracking-tighter text-white block mb-4">EYF</span>
              <p className="text-zinc-500 text-sm leading-relaxed">Engineer Your Future — the complete platform for technical career growth.</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-4">Platform</p>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#modules" className="hover:text-white transition-colors">Curriculum</a></li>
                <li><Link to="/plans" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-4">Account</p>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link to="/app/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-4">System</p>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link to="/authority/login" className="hover:text-white transition-colors">Authority Portal</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.05] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600 uppercase tracking-widest font-bold">© 2026 Engineer Your Future</p>
            <p className="text-xs text-zinc-700 uppercase tracking-widest font-bold">V1.0 Kinetic Noir</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
