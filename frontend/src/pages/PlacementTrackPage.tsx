import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

const TRACK_DATA: Record<string, {
  title: string;
  company: string;
  icon: string;
  color: string;
  bg: string;
  tagline: string;
  timeline: string;
  rounds: { name: string; type: string; duration: string; difficulty: 'Easy' | 'Medium' | 'Hard'; tips: string[]; resources: string[] }[];
  links: { title: string; type: string; icon: string }[];
}> = {
  sde: {
    title: 'SDE Track',
    company: 'FAANG / MAANG',
    icon: 'code',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    tagline: 'Software Development Engineer at top-tier companies',
    timeline: '8–12 weeks',
    rounds: [
      {
        name: 'Online Assessment',
        type: 'Coding',
        duration: '90 min',
        difficulty: 'Medium',
        tips: [
          'Focus on LC Easy/Medium problems — Hard rarely appears in OA',
          'Use built-in libraries freely; don\'t reinvent data structures',
          'Time yourself strictly: aim to solve each problem in <30 min',
          'Read all problems before starting — pick the easier one first',
        ],
        resources: ['LeetCode Explore Cards', 'HackerRank Practice', 'CodeSignal'],
      },
      {
        name: 'DSA Round 1',
        type: 'Coding Interview',
        duration: '60 min',
        difficulty: 'Medium',
        tips: [
          'Clarify requirements before writing a single line of code',
          'Focus: arrays, strings, hashmaps, two-pointer, sliding window',
          'Always state time and space complexity after your solution',
          'Think out loud — interviewers value process over perfect code',
        ],
        resources: ['NeetCode 150', 'Blind 75', 'AlgoExpert'],
      },
      {
        name: 'DSA Round 2',
        type: 'Coding Interview',
        duration: '60 min',
        difficulty: 'Hard',
        tips: [
          'Topics: trees, graphs, dynamic programming, backtracking',
          'Start with brute force, then optimize — never skip straight to optimal',
          'Draw the data structure or recursion tree before coding',
          'Handle edge cases: empty input, single element, negative numbers',
        ],
        resources: ['LeetCode Patterns', 'DP for Beginners (LC post)', 'Graph Theory Primer'],
      },
      {
        name: 'System Design',
        type: 'Design Interview',
        duration: '60 min',
        difficulty: 'Hard',
        tips: [
          'Clarify requirements: scale, consistency requirements, read/write ratio',
          'Estimate: DAU → QPS → storage needed before designing',
          'Use the RESHADED framework: Requirements, Estimation, Storage, High-level design, API, Details, Evaluate, Discuss',
          'Cover trade-offs: SQL vs NoSQL, sync vs async, CDN vs no CDN',
        ],
        resources: ['System Design Primer (GitHub)', 'Grokking the System Design Interview', 'ByteByteGo'],
      },
      {
        name: 'Behavioral / HR',
        type: 'Behavioral',
        duration: '45 min',
        difficulty: 'Medium',
        tips: [
          'Use STAR format: Situation, Task, Action, Result — keep Result quantified',
          'Prepare 6 stories covering: leadership, conflict, failure, ambiguity, impact, collaboration',
          'Know the company\'s leadership principles — Amazon has 16, Google has 7',
          'Have a "greatest weakness" that is real but also improving',
        ],
        resources: ['Amazon LP Guide', 'Grokking Behavioral Interviews', 'Jeff Chiang\'s STAR Examples'],
      },
    ],
    links: [
      { title: 'LeetCode Top Interview 150', type: 'Problem Set', icon: 'code' },
      { title: 'System Design Primer', type: 'Guide', icon: 'architecture' },
      { title: 'Cracking the Coding Interview', type: 'Book', icon: 'menu_book' },
      { title: 'NeetCode 150 Roadmap', type: 'Roadmap', icon: 'route' },
      { title: 'ByteByteGo Newsletter', type: 'Newsletter', icon: 'email' },
    ],
  },
  ds: {
    title: 'Data Science Track',
    company: 'MAANG / Research Labs',
    icon: 'data_object',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    tagline: 'Data Scientist / ML Engineer at top tech companies',
    timeline: '10–14 weeks',
    rounds: [
      {
        name: 'Coding Screen',
        type: 'Coding',
        duration: '90 min',
        difficulty: 'Medium',
        tips: [
          'Python proficiency is non-negotiable — know list/dict comprehensions cold',
          'Pandas: groupby, merge, pivot, apply — practice on Kaggle datasets',
          'SQL: window functions, CTEs, self-joins, aggregations',
          'NumPy: vectorized ops, broadcasting, array manipulations',
        ],
        resources: ['Mode Analytics SQL Tutorial', 'Kaggle Pandas Tutorial', 'W3Schools SQL'],
      },
      {
        name: 'Statistics & ML Theory',
        type: 'Technical',
        duration: '60 min',
        difficulty: 'Hard',
        tips: [
          'Probability: Bayes theorem, conditional probability, distributions',
          'Hypothesis testing: p-values, confidence intervals, A/B test design',
          'ML fundamentals: bias-variance tradeoff, regularization, cross-validation',
          'Know when to use which algorithm: regression, classification, clustering',
        ],
        resources: ['StatQuest YouTube', 'Pattern Recognition & ML (Bishop)', 'Khan Academy Stats'],
      },
      {
        name: 'Case Study',
        type: 'Case Interview',
        duration: '45 min',
        difficulty: 'Hard',
        tips: [
          'Frame the problem before diving in: who are the users, what are success metrics?',
          'Define metrics clearly: engagement, revenue, retention — pick North Star first',
          'Handle data quality: missing values, outliers, sampling bias',
          'Communicate trade-offs: precision vs recall, model complexity vs interpretability',
        ],
        resources: ['Ace the Data Science Interview', 'Datalemur Case Studies'],
      },
      {
        name: 'ML System Design',
        type: 'Design',
        duration: '60 min',
        difficulty: 'Hard',
        tips: [
          'Cover the full ML lifecycle: data collection → features → training → serving',
          'Feature stores, online vs offline features, training-serving skew',
          'Model serving: latency requirements, batching, canary deployments',
          'Monitoring: data drift, model drift, feedback loops',
        ],
        resources: ['Designing ML Systems (Huyen)', 'ML Design Interview (Khang Pham)', 'Chip Huyen\'s Blog'],
      },
      {
        name: 'Behavioral',
        type: 'Behavioral',
        duration: '45 min',
        difficulty: 'Easy',
        tips: [
          'Lead with impact and numbers: "Improved model accuracy by 12%, reducing churn by $2M"',
          'Highlight cross-functional collaboration with engineers, PMs, and stakeholders',
          'Discuss how you handle ambiguous or conflicting data stories',
          'Show curiosity: talk about a recent paper or technique you explored',
        ],
        resources: ['Behavioral Interview Prep Guide', 'Levels.fyi Community'],
      },
    ],
    links: [
      { title: 'Kaggle Learn Courses', type: 'Course', icon: 'school' },
      { title: 'Ace the Data Science Interview', type: 'Book', icon: 'menu_book' },
      { title: 'Designing ML Systems', type: 'Book', icon: 'menu_book' },
      { title: 'Datalemur SQL Questions', type: 'Practice', icon: 'code' },
      { title: 'StatQuest YouTube', type: 'Video', icon: 'play_circle' },
    ],
  },
  sre: {
    title: 'SRE / DevOps Track',
    company: 'Google / Cloudflare / AWS',
    icon: 'cloud',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    tagline: 'Site Reliability Engineer / Platform Engineer at infrastructure companies',
    timeline: '6–10 weeks',
    rounds: [
      {
        name: 'Coding Screen',
        type: 'Coding',
        duration: '60 min',
        difficulty: 'Medium',
        tips: [
          'Python/Bash scripting: file processing, log parsing, system automation',
          'LC Medium-level algorithms: not as hard as SDE but still required',
          'String manipulation, regex, parsing structured logs',
          'Know time complexity of your solutions',
        ],
        resources: ['Python Scripting for SRE', 'Bash Guide', 'Regular Expressions 101'],
      },
      {
        name: 'Systems Knowledge',
        type: 'Technical',
        duration: '60 min',
        difficulty: 'Hard',
        tips: [
          'Linux: processes, signals, file descriptors, /proc filesystem, cgroups',
          'Networking: TCP/IP, DNS resolution, HTTP/1.1 vs HTTP/2, TLS handshake',
          'Storage: IOPS, throughput, RAID, distributed filesystems',
          'Know what happens when you type a URL: full stack top to bottom',
        ],
        resources: ['The Linux Command Line', 'TCP/IP Illustrated', 'Beej\'s Network Programming'],
      },
      {
        name: 'Incident Response',
        type: 'Scenario',
        duration: '45 min',
        difficulty: 'Hard',
        tips: [
          'Structure your approach: identify symptoms → form hypotheses → test → mitigate → root cause',
          'Prioritize blast radius: how many users are affected, what is the severity?',
          'Know your tools: top, htop, netstat, tcpdump, strace, perf',
          'Communicate clearly: who to page, when to escalate, what to communicate to users',
        ],
        resources: ['Google SRE Book Ch. 14 (Incidents)', 'Resilience Engineering Handbook'],
      },
      {
        name: 'Reliability Design',
        type: 'Design',
        duration: '60 min',
        difficulty: 'Hard',
        tips: [
          'Define SLOs, SLAs, error budgets before designing anything',
          'Cover monitoring: four golden signals (latency, traffic, errors, saturation)',
          'Design for failure: circuit breakers, retries with backoff, bulkheads',
          'Know Kubernetes: pods, services, deployments, HPA, PDB',
        ],
        resources: ['Google SRE Book', 'Kubernetes in Action', 'Site Reliability Workbook'],
      },
      {
        name: 'Culture Fit',
        type: 'Behavioral',
        duration: '45 min',
        difficulty: 'Easy',
        tips: [
          'Emphasize blameless post-mortems: what went wrong, not who made a mistake',
          'Show comfort with on-call: how you handle pager fatigue, runbooks, escalation',
          'Collaboration with dev teams: how you push back on reliability anti-patterns',
          'Share a specific incident you owned end-to-end',
        ],
        resources: ['SRE Book Ch. 15 (Postmortem Culture)', 'Increment Magazine'],
      },
    ],
    links: [
      { title: 'Google SRE Book', type: 'Book', icon: 'menu_book' },
      { title: 'Kubernetes Documentation', type: 'Docs', icon: 'description' },
      { title: 'AWS Solutions Architect Guide', type: 'Guide', icon: 'cloud' },
      { title: 'Linux Foundation Courses', type: 'Course', icon: 'school' },
      { title: 'The Phoenix Project', type: 'Book', icon: 'menu_book' },
    ],
  },
  pm: {
    title: 'Product Management Track',
    company: 'Startups / Big Tech',
    icon: 'lightbulb',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    tagline: 'Product Manager at high-growth startups and tech companies',
    timeline: '6–8 weeks',
    rounds: [
      {
        name: 'Product Sense',
        type: 'Product',
        duration: '45 min',
        difficulty: 'Hard',
        tips: [
          'Framework: Define goal → Identify users → Prioritize pain points → Brainstorm solutions → Prioritize → Metrics → Trade-offs',
          'Always clarify scope: which market, which platform, time horizon',
          'Don\'t jump to solutions — spend 30% of your time understanding the user',
          'Name your prioritization framework: RICE, ICE, or MoSCoW',
        ],
        resources: ['Cracking the PM Interview', 'Product Alliance', 'Exponent PM'],
      },
      {
        name: 'Analytical Thinking',
        type: 'Analytical',
        duration: '45 min',
        difficulty: 'Medium',
        tips: [
          'Metrics: always define your North Star metric and guardrail metrics',
          'A/B testing: statistical significance, sample size, p-values, novelty effect',
          'Root cause analysis: if DAU dropped 10%, break down by segment, platform, region',
          'Feature request ROI: development cost vs expected impact',
        ],
        resources: ['Lean Analytics', 'Inspired by Marty Cagan', 'Reforge Growth Series'],
      },
      {
        name: 'Technical Screen',
        type: 'Technical',
        duration: '45 min',
        difficulty: 'Medium',
        tips: [
          'Understand REST APIs: what a request/response looks like, status codes',
          'Database basics: when to use SQL vs NoSQL, indexing, query optimization at a high level',
          'System design concepts at PM depth: load balancers, caching, message queues',
          'Can you write a simple SQL query? Some companies test this',
        ],
        resources: ['The Product Manager\'s Technical Interview', 'SQL for PMs', 'APIs for Beginners'],
      },
      {
        name: 'Leadership & Execution',
        type: 'Behavioral',
        duration: '45 min',
        difficulty: 'Medium',
        tips: [
          'Influence without authority: how you align engineers, designers, data scientists',
          'Handling conflicting stakeholder priorities: be specific with your example',
          'Navigating ambiguity: how you define the problem space when requirements are unclear',
          'Shipping under pressure: how you made scope trade-offs to hit a deadline',
        ],
        resources: ['The Lean Startup', 'Inspired (Cagan)', 'PM Interview Course (Ravi Mehta)'],
      },
      {
        name: 'Final Executive Round',
        type: 'Executive',
        duration: '60 min',
        difficulty: 'Hard',
        tips: [
          'Think 3–5 years out: where is this market going, how does the product fit?',
          'Company vision alignment: know the company\'s strategy, recent launches, competitors',
          'Handle a difficult VP: demonstrate you can push back with data and diplomacy',
          'Ask great questions: about team, current challenges, what success looks like in 90 days',
        ],
        resources: ['Lenny\'s Newsletter', 'Ben Horowitz\'s Blog', 'Hard Thing About Hard Things'],
      },
    ],
    links: [
      { title: 'Cracking the PM Interview', type: 'Book', icon: 'menu_book' },
      { title: 'Lenny\'s Newsletter', type: 'Newsletter', icon: 'email' },
      { title: 'Reforge Growth Series', type: 'Course', icon: 'school' },
      { title: 'Exponent PM Practice', type: 'Practice', icon: 'record_voice_over' },
      { title: 'Inspired by Marty Cagan', type: 'Book', icon: 'menu_book' },
    ],
  },
};

const TYPE_COLOR: Record<string, string> = {
  'Coding':           'text-blue-400 bg-blue-400/10',
  'Coding Interview': 'text-blue-400 bg-blue-400/10',
  'Technical':        'text-cyan-400 bg-cyan-400/10',
  'Design':           'text-orange-400 bg-orange-400/10',
  'Design Interview': 'text-orange-400 bg-orange-400/10',
  'Behavioral':       'text-green-400 bg-green-400/10',
  'Case Interview':   'text-purple-400 bg-purple-400/10',
  'Scenario':         'text-yellow-400 bg-yellow-400/10',
  'Product':          'text-pink-400 bg-pink-400/10',
  'Analytical':       'text-teal-400 bg-teal-400/10',
  'Executive':        'text-amber-400 bg-amber-400/10',
};

const DIFF_COLOR: Record<string, string> = {
  Easy:   'text-emerald-400 bg-emerald-400/10',
  Medium: 'text-amber-400 bg-amber-400/10',
  Hard:   'text-red-400 bg-red-400/10',
};

const RESOURCE_ICON: Record<string, string> = {
  'Book': 'menu_book', 'Guide': 'description', 'Roadmap': 'route',
  'Course': 'school', 'Newsletter': 'email', 'Video': 'play_circle',
  'Practice': 'code', 'Docs': 'article', 'Problem Set': 'code',
};

export function PlacementTrackPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();
  const { fireXP } = useUser();
  const [expandedRound, setExpandedRound] = useState<number | null>(0);
  const [practiced, setPracticed] = useState<Record<number, boolean>>({});

  const track = trackId ? TRACK_DATA[trackId] : null;

  // Persist practiced state per track
  useEffect(() => {
    if (!trackId) return;
    const stored = localStorage.getItem(`placement_practiced_${trackId}`);
    if (stored) setPracticed(JSON.parse(stored));
  }, [trackId]);

  const togglePracticed = (idx: number) => {
    if (!trackId || !track) return;
    const wasOff = !practiced[idx];
    const next = { ...practiced, [idx]: wasOff };
    setPracticed(next);
    localStorage.setItem(`placement_practiced_${trackId}`, JSON.stringify(next));
    if (wasOff) {
      fireXP(20, `${track.rounds[idx].name} round practiced!`);
    }
  };

  const practicedCount = Object.values(practiced).filter(Boolean).length;
  const totalRounds = track?.rounds.length ?? 0;
  const completionPct = totalRounds > 0 ? Math.round((practicedCount / totalRounds) * 100) : 0;

  if (!track) {
    return (
      <AppShell>
        <div className="pt-8 text-center">
          <p className="text-zinc-500 text-lg">Track not found.</p>
          <button
            onClick={() => navigate('/app/placement')}
            className="mt-6 text-[#E82127] font-bold text-[11px] uppercase tracking-widest"
          >
            ← Back to Placement
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-6 pb-12 max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate('/app/placement')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-bold text-[11px] uppercase tracking-widest mb-8"
        >
          <Icon name="arrow_back" size={16} />
          Placement Prep
        </button>

        {/* Header */}
        <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-7 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className={`w-16 h-16 ${track.bg} rounded-2xl flex items-center justify-center ${track.color} flex-shrink-0`}>
            <Icon name={track.icon} size={32} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-1">Interview Track</p>
            <h1 className="text-2xl font-black tracking-tight mb-1">{track.title}</h1>
            <p className="text-zinc-400 text-sm mb-3">{track.tagline}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {track.company}
              </span>
              <span className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Icon name="schedule" size={11} />
                {track.timeline}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-3xl font-black text-white">{completionPct}%</p>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">prepared</p>
            <p className="text-zinc-600 text-xs mt-1">{practicedCount}/{totalRounds} rounds</p>
          </div>
        </div>

        {/* Progress bar */}
        {completionPct > 0 && (
          <div className="mb-6">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E82127] to-orange-400 rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            {completionPct === 100 && (
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-2 text-center">
                All rounds practiced — you're interview-ready!
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Interview Rounds */}
          <div className="lg:col-span-2">
            <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-4">
              Interview Rounds
            </p>
            <div className="space-y-3">
              {track.rounds.map((round, idx) => (
                <div
                  key={round.name}
                  className={`bg-[#1a1a1a] border rounded-2xl overflow-hidden transition-all duration-200 ${
                    practiced[idx] ? 'border-emerald-500/30' : 'border-white/8'
                  }`}
                >
                  {/* Round header — always visible */}
                  <button
                    type="button"
                    onClick={() => setExpandedRound(expandedRound === idx ? null : idx)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors text-left"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      practiced[idx] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {practiced[idx] ? <Icon name="check" size={14} /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white text-sm">{round.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${TYPE_COLOR[round.type] ?? 'text-zinc-400 bg-zinc-400/10'}`}>
                          {round.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${DIFF_COLOR[round.difficulty]}`}>
                          {round.difficulty}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
                        <Icon name="schedule" size={11} />
                        {round.duration}
                      </p>
                    </div>
                    <Icon
                      name={expandedRound === idx ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                      size={18}
                      className="text-zinc-500 flex-shrink-0"
                    />
                  </button>

                  {/* Expanded content */}
                  {expandedRound === idx && (
                    <div className="px-5 pb-5 border-t border-white/5">
                      <div className="pt-4 space-y-4">
                        {/* Tips */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Prep Tips</p>
                          <ul className="space-y-2">
                            {round.tips.map((tip) => (
                              <li key={tip} className="flex items-start gap-3">
                                <Icon name="check_circle" size={14} className="text-[#E82127] mt-0.5 flex-shrink-0" />
                                <span className="text-zinc-300 text-sm leading-relaxed">{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Suggested resources */}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Suggested Resources</p>
                          <div className="flex flex-wrap gap-2">
                            {round.resources.map((r) => (
                              <span key={r} className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400 font-medium">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Mark practiced */}
                        <button
                          type="button"
                          onClick={() => togglePracticed(idx)}
                          className={`flex items-center gap-2 w-full justify-center py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 ${
                            practiced[idx]
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-white/5 text-zinc-400 border border-white/8 hover:bg-white/8'
                          }`}
                        >
                          <Icon name={practiced[idx] ? 'check_circle' : 'radio_button_unchecked'} size={15} />
                          {practiced[idx] ? 'Practiced ✓' : 'Mark as Practiced (+20 XP)'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-5">
            {/* Quick actions */}
            <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5">
              <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-4">Quick Actions</p>
              <div className="space-y-3">
                <Link
                  to="/app/mock-interview"
                  className="flex items-center gap-3 w-full bg-[#E82127]/10 border border-[#E82127]/20 text-[#E82127] rounded-xl px-4 py-3 font-bold text-sm hover:bg-[#E82127]/15 transition-colors"
                >
                  <Icon name="record_voice_over" size={18} />
                  Practice Mock Interview
                </Link>
                <Link
                  to={`/app/problems?tag=${trackId}`}
                  className="flex items-center gap-3 w-full bg-zinc-800 text-zinc-300 rounded-xl px-4 py-3 font-bold text-sm hover:bg-zinc-700 transition-colors"
                >
                  <Icon name="code" size={18} />
                  Track Problem Set
                </Link>
                <Link
                  to="/app/system-design"
                  className="flex items-center gap-3 w-full bg-zinc-800 text-zinc-300 rounded-xl px-4 py-3 font-bold text-sm hover:bg-zinc-700 transition-colors"
                >
                  <Icon name="architecture" size={18} />
                  System Design Practice
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5">
              <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-4">Curated Resources</p>
              <div className="space-y-2">
                {track.links.map((r) => (
                  <div key={r.title} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name={RESOURCE_ICON[r.type] ?? 'link'} size={15} className="text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-300 text-xs font-semibold truncate">{r.title}</p>
                      <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">{r.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Study timeline */}
            <div className="bg-[#1a1010] border border-[#E82127]/15 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="calendar_month" size={16} className="text-[#E82127]" />
                <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Study Plan</p>
              </div>
              <p className="text-zinc-400 text-sm mb-3">
                Recommended timeline: <span className="text-white font-bold">{track.timeline}</span>
              </p>
              <div className="space-y-2 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E82127]" />
                  <span>Weeks 1–2: Fundamentals & theory</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span>Weeks 3–6: Practice problems daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Weeks 7+: Mock interviews & review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
