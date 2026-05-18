import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

interface TrackProgress {
  id: string;
  title: string;
  company: string;
  icon: string;
  progress: number;
  totalTopics: number;
  completedTopics: number;
}

interface Application {
  id: string;
  company: string;
  role: string;
  status: 'applied' | 'oa' | 'interview' | 'offer' | 'rejected';
  appliedAt: string;
  nextStep?: string;
  nextStepDate?: string;
}

interface BehavioralQ {
  id: string;
  question: string;
  category: string;
  response?: string;
  lastPracticed?: string;
}

interface PlacementStats {
  applicationsSubmitted: number;
  interviewsScheduled: number;
  offersReceived: number;
  readinessScore: number;
}

const TRACKS = [
  { id: 'sde', title: 'SDE Track', company: 'FAANG', icon: 'code', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'ds', title: 'Data Science', company: 'MAANG', icon: 'data_object', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'sre', title: 'SRE / DevOps', company: 'Cloud', icon: 'cloud', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { id: 'pm', title: 'Product Management', company: 'Startups', icon: 'lightbulb', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
];

interface CompanyGuide {
  name: string;
  logo: string;
  color: string;
  tagline: string;
  difficulty: 'Medium' | 'Hard' | 'Very Hard';
  prepWeeks: number;
  process: Array<{ step: string; desc: string }>;
  dsaFocus: string[];
  sysDes: string[];
  cultureTips: string[];
  insiderTips: string[];
}

const COMPANIES: CompanyGuide[] = [
  {
    name: 'Google',
    logo: 'G',
    color: 'from-blue-500 to-green-400',
    tagline: 'Algorithms-first. Coding quality matters as much as correctness.',
    difficulty: 'Very Hard',
    prepWeeks: 16,
    process: [
      { step: 'Recruiter Screen', desc: '15-min call — background, motivation, timeline' },
      { step: 'Online Assessment', desc: '90 min — 2 LeetCode-style problems, code quality graded' },
      { step: 'Phone Technical', desc: '45 min — 1-2 coding problems with Google engineer' },
      { step: 'On-site (4-5 rounds)', desc: '2× coding, 1× system design, 1× Googleyness behavioral' },
      { step: 'Team Match', desc: 'Matched to team after hire — may involve additional calls' },
    ],
    dsaFocus: ['Graph BFS/DFS', 'Dynamic Programming', 'Trees & Tries', 'Sliding Window', 'Bit Manipulation', 'Heap / Priority Queue'],
    sysDes: ['Google Search indexing', 'YouTube video pipeline', 'Distributed key-value store', 'URL shortener at scale'],
    cultureTips: ['Googleyness = collaboration, growth mindset, bias to action', 'Show how you handle ambiguity', 'Demonstrate intellectual curiosity', 'Leadership through influence, not authority'],
    insiderTips: ['Interviewers score code quality separately — write clean, readable code', 'Think out loud — silence is a red flag', 'Ask clarifying questions before coding', 'Google loves O(n log n) — always analyze complexity'],
  },
  {
    name: 'Amazon',
    logo: 'A',
    color: 'from-orange-400 to-yellow-500',
    tagline: '14 Leadership Principles dominate every round. Bar Raiser is the key gatekeeper.',
    difficulty: 'Very Hard',
    prepWeeks: 12,
    process: [
      { step: 'OA + Work Simulation', desc: '2-part: coding (90 min) + Work Style Assessment (~20 min)' },
      { step: 'Phone Screen', desc: '1 DSA problem + 2 LP behavioral questions' },
      { step: 'On-site (5-6 loops)', desc: '2× coding, 1× system design, 2-3× LP behavioral' },
      { step: 'Bar Raiser', desc: 'Senior employee who can veto. Focuses on culture bar and LP depth' },
      { step: 'Hiring Committee', desc: 'Loop debrief and offer decision' },
    ],
    dsaFocus: ['Arrays & Strings', 'Trees & Graphs', 'Two Pointers', 'Sliding Window', 'Recursion / Backtracking', 'Hash Maps'],
    sysDes: ['Amazon Prime Video streaming', 'S3 object storage', 'Amazon Warehouse OMS', 'Notification service at scale'],
    cultureTips: ['Memorize all 14 Leadership Principles — know them cold', 'Every answer should map to ≥1 LP', 'STAR format: 2 min max per story', 'Have 6-8 unique STAR stories covering different LPs'],
    insiderTips: ['Never say "we" — always "I". Interviewers want YOUR contribution', 'Prepare a story for every LP, especially Customer Obsession and Ownership', 'Bar Raiser asks the hardest LP questions — go deep', 'Medium difficulty DSA — clean solution + explain trade-offs'],
  },
  {
    name: 'Microsoft',
    logo: 'M',
    color: 'from-blue-600 to-cyan-400',
    tagline: 'Growth mindset culture. Code quality and communication style both matter.',
    difficulty: 'Hard',
    prepWeeks: 10,
    process: [
      { step: 'Recruiter Call', desc: '20 min — background check and role alignment' },
      { step: 'Technical Screen', desc: '60 min — 1-2 coding problems, may include OOD' },
      { step: 'On-site (4 rounds)', desc: '2× coding, 1× system design, 1× behavioral + As Appropriate (AA)' },
      { step: 'As Appropriate (AA)', desc: 'Senior person checks if you raise the bar for the team' },
      { step: 'Offer & Negotiation', desc: 'Total comp includes base, RSUs (4-year vest), annual bonus' },
    ],
    dsaFocus: ['Linked Lists', 'Trees & BST', 'String Manipulation', 'DP (basic)', 'Graphs BFS/DFS', 'OOP Design'],
    sysDes: ['OneDrive sync service', 'Microsoft Teams real-time messaging', 'Azure blob storage', 'Outlook calendar system'],
    cultureTips: ['Growth mindset is the core value — show how you learn from failure', 'Demonstrate collaboration and empathy', 'Be honest about what you don\'t know', 'Ask thoughtful questions about the team\'s tech challenges'],
    insiderTips: ['Code correctness > cleverness at Microsoft', 'Interviewers look for how you handle feedback mid-interview', 'OOD questions: interfaces, SOLID, extensibility', 'The AA round is culture + soft skills — prepare behavioral stories'],
  },
  {
    name: 'Meta',
    logo: 'M',
    color: 'from-blue-500 to-indigo-500',
    tagline: 'Move fast. Coding bar is high — 45 min per problem, no hints.',
    difficulty: 'Very Hard',
    prepWeeks: 14,
    process: [
      { step: 'Initial Screen', desc: 'Recruiter + 45 min technical phone screen — 2 problems' },
      { step: 'On-site (5 rounds)', desc: '2× coding, 1× system design, 1× behavioral, 1× leadership/culture' },
      { step: 'Behavioral (Jedi)', desc: 'Values-based interview on impact, collaboration, and drive' },
      { step: 'Team Matching', desc: 'Match to team after offer; some teams have additional screens' },
      { step: 'Offer', desc: 'Heavy RSU component — Meta RSUs vest quarterly after 1-year cliff' },
    ],
    dsaFocus: ['Graphs (BFS/DFS/Topological)', 'Dynamic Programming', 'Recursion & Backtracking', 'Intervals', 'String Algorithms', 'Trees'],
    sysDes: ['Facebook News Feed ranking', 'Instagram Reels pipeline', 'WhatsApp messaging system', 'Distributed rate limiter'],
    cultureTips: ['Core values: Move Fast, Be Bold, Focus on Impact, Be Open', 'Show measurable impact in every story — use numbers', 'Bias toward action and shipping', 'Collaboration over hierarchy'],
    insiderTips: ['Meta expects optimal solutions — brute force is not enough', 'Explain your time/space complexity for every solution', 'System Design: deep-dive on one component they ask about', 'Behavioral stories must have clear, quantified outcomes'],
  },
  {
    name: 'Apple',
    logo: '🍎',
    color: 'from-zinc-400 to-zinc-600',
    tagline: 'Role-specific and team-specific. Deep technical expertise over breadth.',
    difficulty: 'Hard',
    prepWeeks: 10,
    process: [
      { step: 'Recruiter Screen', desc: 'Role and team alignment — Apple hires for specific teams' },
      { step: 'Technical Screen', desc: '60 min — specific to team (iOS, infra, ML, etc.)' },
      { step: 'On-site (5-6 rounds)', desc: 'Mix of role-specific tech + behavioral + collaboration rounds' },
      { step: 'Team Interviews', desc: 'Cross-functional interviewers; Apple values cross-team collaboration' },
      { step: 'Offer', desc: 'RSU-heavy comp; "think differently" culture emphasis' },
    ],
    dsaFocus: ['Data Structures fundamentals', 'System programming', 'Concurrency & threading', 'Algorithms (role-dependent)', 'iOS-specific (if applicable)', 'Memory management'],
    sysDes: ['iCloud sync protocol', 'App Store review pipeline', 'Apple Maps routing engine', 'Siri NLP pipeline'],
    cultureTips: ['Craft and attention to detail matter deeply', 'Show passion for the product you\'d be working on', 'Humility and cross-team collaboration valued', 'Privacy and security mindset is a plus'],
    insiderTips: ['Research the specific team before interviewing — Apple teams are very distinct', 'Interview process varies widely by team and role', 'Focus on depth in your specialty area, not just breadth', 'Ask about the product — show you\'ve used it and care'],
  },
  {
    name: 'Netflix',
    logo: 'N',
    color: 'from-red-500 to-red-700',
    tagline: 'Dream Team culture. Exceptional talent, radical transparency, no hand-holding.',
    difficulty: 'Very Hard',
    prepWeeks: 12,
    process: [
      { step: 'Recruiter + HM Screen', desc: 'Culture + role fit — Netflix culture values assessed early' },
      { step: 'Technical Screens (2x)', desc: 'System design + coding — often separated by 1 week' },
      { step: 'On-site (5-6 rounds)', desc: 'Heavy on system design and culture; fewer pure coding rounds' },
      { step: 'Culture Interview', desc: 'Dedicated round on Netflix culture: judgment, curiosity, courage' },
      { step: 'Offer', desc: 'Top-of-market cash compensation; RSU-light compared to FAANG' },
    ],
    dsaFocus: ['Distributed systems', 'Streaming algorithms', 'Caching strategies', 'API design', 'Concurrency', 'Chaos engineering principles'],
    sysDes: ['Netflix CDN (Open Connect)', 'Recommendation engine', 'Video encoding pipeline', 'Global load balancing'],
    cultureTips: ['Read the Netflix Culture Deck — it\'s part of the interview', 'Highly Aligned, Loosely Coupled: autonomy + accountability', 'Candor: give and receive direct feedback', 'Act in Netflix\'s best interest — not just your team\'s'],
    insiderTips: ['System Design > coding at Netflix — invest heavily here', 'Netflix hires for senior roles primarily; junior bars are still very high', 'Culture fit is a genuine knockout criterion — know the values', 'Compensation is top of market cash — negotiate confidently'],
  },
  {
    name: 'Uber',
    logo: 'U',
    color: 'from-zinc-800 to-zinc-600',
    tagline: 'Real-time systems and geospatial scale. Strong systems focus.',
    difficulty: 'Hard',
    prepWeeks: 10,
    process: [
      { step: 'Recruiter Screen', desc: 'Motivation, background, timeline discussion' },
      { step: 'Technical Phone Screen', desc: '45-60 min — DSA + light system design discussion' },
      { step: 'On-site (4-5 rounds)', desc: '2× coding, 1× system design, 1× behavioral + values' },
      { step: 'Hiring Manager Round', desc: 'Final check on team fit and impact potential' },
      { step: 'Offer', desc: 'Competitive RSU package, performance-based bonuses' },
    ],
    dsaFocus: ['Graph algorithms', 'Geospatial data structures', 'Queues & priority queues', 'Hash maps', 'Real-time data processing', 'Dynamic programming'],
    sysDes: ['Uber dispatch system', 'Surge pricing engine', 'Driver-rider matching', 'Real-time location tracking at scale'],
    cultureTips: ['Go for impact at scale — Uber operates in 70+ countries', 'Show ownership: you ship, you monitor, you fix', 'Uber values "big bold bets" — show willingness to tackle hard problems', 'Speed matters — fast iteration is in the culture'],
    insiderTips: ['Geospatial and real-time systems questions are common', 'System design depth on consistency vs availability trade-offs', 'Behavioral: Uber values impact through data — quantify everything', 'Prepare one system design on a real-time location service'],
  },
  {
    name: 'Airbnb',
    logo: 'A',
    color: 'from-pink-400 to-rose-500',
    tagline: 'Belong anywhere. Strong culture fit emphasis with a creative + empathetic lens.',
    difficulty: 'Hard',
    prepWeeks: 10,
    process: [
      { step: 'Recruiter Screen', desc: 'Culture and motivation check — Airbnb cares about values early' },
      { step: 'Technical Screen', desc: '60 min — 1-2 coding problems, discuss approach and complexity' },
      { step: 'On-site (5 rounds)', desc: '2× coding, 1× system design, 1× cross-functional, 1× core values' },
      { step: 'Cross-functional Round', desc: 'Work style, collaboration, non-eng stakeholder scenarios' },
      { step: 'Offer', desc: 'Competitive comp with RSUs; culture carries equal weight to tech' },
    ],
    dsaFocus: ['Arrays & strings', 'Trees & graphs', 'Search algorithms', 'Sorting', 'OOD / API design', 'Database design'],
    sysDes: ['Airbnb booking system', 'Search ranking & personalization', 'Payment & split payment', 'Real-time availability calendar'],
    cultureTips: ['Core values: Be a Host, Champion the Mission, Be a Cereal Entrepreneur', 'Show genuine empathy — Airbnb is a hospitality company at heart', 'Collaboration with non-engineering stakeholders is tested', 'Curiosity about the product and users is valued highly'],
    insiderTips: ['Cross-functional round is unique — prepare scenarios with PMs, designers, data', 'Airbnb values product sense — opinions on how to improve the product', 'API design round: REST best practices, versioning, idempotency', 'Show you care about the mission, not just the tech'],
  },
  {
    name: 'Stripe',
    logo: 'S',
    color: 'from-indigo-500 to-purple-500',
    tagline: 'Payments infrastructure for the internet. High bar for API craft and reliability.',
    difficulty: 'Very Hard',
    prepWeeks: 14,
    process: [
      { step: 'Recruiter Screen', desc: 'Background + motivation; Stripe looks for mission alignment' },
      { step: 'Technical Screen', desc: '60 min — system or coding focus depending on role' },
      { step: 'On-site (5-6 rounds)', desc: '2× coding, 1× system design, 1× debugging, 1-2× behavioral' },
      { step: 'Debugging Round', desc: 'Fix a broken codebase — unique to Stripe; tests diagnosis skills' },
      { step: 'Offer', desc: 'Premium cash + equity; strong eng culture with high autonomy' },
    ],
    dsaFocus: ['API design patterns', 'Idempotency & retries', 'Distributed transactions', 'Queue-based systems', 'Rate limiting', 'Caching strategies'],
    sysDes: ['Payment processing pipeline', 'Stripe Radar fraud detection', 'Idempotent API design', 'Multi-currency ledger system'],
    cultureTips: ['User obsession: Stripe\'s users are developers — show developer empathy', 'Rigorous thinking: Stripe values depth over speed', 'Low ego, high output — collaboration over credit', 'Integrity: financial systems require total reliability mindset'],
    insiderTips: ['Debugging round: approach systematically — add logging, isolate, hypothesis-test', 'API design: idempotency keys, pagination, error codes — know these cold', 'Financial systems: atomicity, consistency, double-entry bookkeeping', 'Stripe culture interview is substantial — prepare specific stories about craft'],
  },
  {
    name: 'Flipkart',
    logo: 'F',
    color: 'from-blue-400 to-sky-500',
    tagline: 'India\'s e-commerce leader. Strong DSA focus, large-scale systems.',
    difficulty: 'Hard',
    prepWeeks: 8,
    process: [
      { step: 'Online Assessment', desc: '3 DSA problems (90 min) on HackerEarth/HackerRank' },
      { step: 'Technical Round 1', desc: 'DSA — trees, graphs, DP; expect 2 problems' },
      { step: 'Technical Round 2', desc: 'System design + LLD (Low-Level Design / OOD)' },
      { step: 'Hiring Manager Round', desc: 'Past experience, projects, impact, team fit' },
      { step: 'HR Round', desc: 'Compensation, notice period, expectations' },
    ],
    dsaFocus: ['Arrays & strings', 'Trees & Binary Search', 'Graphs', 'Dynamic Programming', 'Sorting algorithms', 'Tries & segment trees'],
    sysDes: ['Flipkart catalog search', 'Cart & checkout system', 'Flash sale / Big Billion Day traffic spike handling', 'Delivery tracking system'],
    cultureTips: ['Flipkart values ownership and scale-thinking', 'Show how you handle high-traffic scenarios', 'Growth mindset and adaptability in a fast-moving org', 'Demonstrate experience with large data volumes'],
    insiderTips: ['LLD (Low-Level Design / OOD) is tested heavily — practice design patterns', 'DSA bar is LC medium-hard; expect DP and graph questions', 'Prepare a system design around e-commerce scale', 'Highlight measurable impact from past roles'],
  },
  {
    name: 'Swiggy',
    logo: 'S',
    color: 'from-orange-500 to-amber-500',
    tagline: 'Food delivery at India scale. Real-time systems and last-mile logistics focus.',
    difficulty: 'Medium',
    prepWeeks: 6,
    process: [
      { step: 'Online Assessment', desc: '2-3 DSA problems + MCQ section' },
      { step: 'Technical Round 1', desc: 'DSA + code walkthrough of your past projects' },
      { step: 'Technical Round 2', desc: 'System design and LLD — focus on real-time systems' },
      { step: 'Hiring Manager', desc: 'Past experience, problem-solving approach, team fit' },
      { step: 'HR Round', desc: 'Compensation and joining timeline' },
    ],
    dsaFocus: ['Arrays & strings', 'Hash maps', 'Graph BFS/DFS', 'Priority queues', 'Sliding window', 'Recursion'],
    sysDes: ['Swiggy delivery partner assignment', 'Real-time order tracking', 'Restaurant recommendation engine', 'Inventory & menu management'],
    cultureTips: ['Fast-moving startup culture — show you can iterate quickly', 'Ownership and accountability valued highly', 'Comfort with ambiguity and rapid change', 'Consumer empathy — Swiggy is solving logistics at scale for everyday users'],
    insiderTips: ['LLD questions focus on food delivery scenarios — practice OOD for ride/delivery apps', 'System design: geospatial querying, real-time state updates, ETA calculation', 'Past projects matter — have 2-3 strong project stories ready', 'DSA bar is LC easy-medium; speed matters'],
  },
  {
    name: 'Zomato',
    logo: 'Z',
    color: 'from-red-400 to-rose-600',
    tagline: 'Food + hyperpure + blinkit. Fast-paced product engineering culture.',
    difficulty: 'Medium',
    prepWeeks: 6,
    process: [
      { step: 'Online Assessment', desc: '2 coding problems + aptitude section' },
      { step: 'Technical Round 1', desc: 'DSA + brief discussion of projects' },
      { step: 'Technical Round 2', desc: 'LLD / OOD or system design (role-dependent)' },
      { step: 'Managerial Round', desc: 'Leadership scenarios, decision-making, past experience' },
      { step: 'HR + Culture Fit', desc: 'Values alignment, expectations, comp negotiation' },
    ],
    dsaFocus: ['Arrays & strings', 'Stack & queue', 'Trees', 'Recursion & backtracking', 'Hash maps', 'Basic graphs'],
    sysDes: ['Zomato search & discovery', 'Hyperpure B2B supply chain', 'Restaurant onboarding system', 'Rating & review pipeline'],
    cultureTips: ['Zomato values customer-first thinking', 'Fast execution with ownership mindset', 'Be comfortable with ambiguity and rapid iteration', 'Show understanding of food-tech and consumer product space'],
    insiderTips: ['DSA bar is LC easy-medium; focus on correctness and clean code', 'LLD: practice food delivery OOD (restaurants, orders, delivery partners)', 'Product sense questions may come up — think about Zomato as a user', 'Managerial round: prepare STAR stories on ownership and impact'],
  },
];

const DIFF_COLOR: Record<string, string> = {
  'Medium':    'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Hard':      'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Very Hard': 'text-red-400 bg-red-500/10 border-red-500/20',
};

interface CompanyPanelProps {
  readonly guide: CompanyGuide;
  readonly onClose: () => void;
}

function CompanyPanel({ guide, onClose }: CompanyPanelProps) {
  const [tab, setTab] = useState<'process' | 'dsa' | 'culture' | 'tips'>('process');

  return (
    <div className="fixed inset-0 z-50 flex">
      <div role="none" className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} />
      <div className="w-full max-w-2xl bg-[#111] border-l border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-white/8 flex-shrink-0">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${guide.color} flex items-center justify-center text-white font-black text-xl shadow-lg`}>
            {guide.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-black text-white">{guide.name}</h2>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${DIFF_COLOR[guide.difficulty]}`}>
                {guide.difficulty}
              </span>
            </div>
            <p className="text-zinc-500 text-xs truncate">{guide.tagline}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors flex-shrink-0">
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Stats strip */}
        <div className="flex gap-6 px-6 py-3 border-b border-white/8 bg-zinc-900/50 flex-shrink-0">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Interview Steps</p>
            <p className="text-sm font-black text-white mt-0.5">{guide.process.length} rounds</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Prep Time</p>
            <p className="text-sm font-black text-white mt-0.5">{guide.prepWeeks} weeks</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">DSA Topics</p>
            <p className="text-sm font-black text-white mt-0.5">{guide.dsaFocus.length} key areas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          {([
            { key: 'process', label: 'Process' },
            { key: 'dsa',     label: 'DSA Focus' },
            { key: 'culture', label: 'Culture' },
            { key: 'tips',    label: 'Insider Tips' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                tab === t.key ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {tab === 'process' && (
            <div className="space-y-3">
              {guide.process.map((step, i) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-400 flex-shrink-0">
                      {i + 1}
                    </div>
                    {i < guide.process.length - 1 && <div className="w-px flex-1 bg-zinc-800 mt-1" />}
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className="text-sm font-bold text-white">{step.step}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'dsa' && (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">Key DSA Topics</p>
                <div className="grid grid-cols-2 gap-2">
                  {guide.dsaFocus.map((topic) => (
                    <div key={topic} className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2.5 text-sm text-zinc-300">
                      <Icon name="code" size={13} className="text-blue-400 flex-shrink-0" />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">System Design Topics</p>
                <div className="space-y-2">
                  {guide.sysDes.map((topic) => (
                    <div key={topic} className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2.5 text-sm text-zinc-300">
                      <Icon name="architecture" size={13} className="text-cyan-400 flex-shrink-0" />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'culture' && (
            <div className="space-y-3">
              {guide.cultureTips.map((tip) => (
                <div key={tip} className="flex items-start gap-3 bg-zinc-900 rounded-xl px-4 py-3">
                  <Icon name="groups" size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'tips' && (
            <div className="space-y-3">
              {guide.insiderTips.map((tip) => (
                <div key={tip} className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                  <Icon name="tips_and_updates" size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex-shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-zinc-800 text-zinc-300 font-bold text-xs py-3 rounded-full hover:bg-zinc-700 transition-all uppercase tracking-widest"
          >
            Close
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[#E82127] text-white font-black text-xs py-3 rounded-full hover:brightness-110 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Icon name="play_arrow" size={14} />
            Start Prep
          </button>
        </div>
      </div>
    </div>
  );
}

interface ServiceCompany {
  name: string;
  logo: string;
  color: string;
  ctc: string;
  tagline: string;
  testPlatform: string;
  sections: Array<{ name: string; questions: number; time: string; topics: string[] }>;
  aptitudeTips: string[];
  technicalTopics: string[];
  hrQuestions: string[];
  certifications?: string;
}

const SERVICE_COMPANIES: ServiceCompany[] = [
  {
    name: 'TCS',
    logo: 'TCS',
    color: 'from-blue-700 to-blue-500',
    ctc: '₹3.5–4.5 LPA (freshers)',
    tagline: 'Largest IT employer in India. iON platform. Mass hiring every year.',
    testPlatform: 'TCS iON (National Qualifier Test)',
    sections: [
      { name: 'Verbal Ability', questions: 24, time: '30 min', topics: ['Reading comprehension', 'Sentence correction', 'Para jumbles', 'Fill in the blanks', 'Synonyms/Antonyms'] },
      { name: 'Quantitative Aptitude', questions: 26, time: '40 min', topics: ['Number system', 'Percentages', 'Time & work', 'Profit & loss', 'Ratios', 'Age problems'] },
      { name: 'Reasoning Ability', questions: 30, time: '50 min', topics: ['Logical deduction', 'Seating arrangement', 'Blood relations', 'Coding-decoding', 'Series completion'] },
      { name: 'Programming Logic', questions: 10, time: '20 min', topics: ['Output prediction', 'Fill in blanks in code', 'Time complexity (basic)', 'Data structures (basic)', 'C/C++ syntax'] },
      { name: 'Coding', questions: 1, time: '30 min', topics: ['Easy DSA (arrays, strings, basic math)', 'C / C++ / Java / Python allowed'] },
    ],
    aptitudeTips: [
      'Accuracy over speed — TCS NQT has negative marking (-1/3 for wrong answers)',
      'Verbal section: practice RC daily, 10 min — most candidates skip this and lose marks',
      'Quant: master percentages, profit & loss, time & work — these are 50%+ of questions',
      'Programming Logic: know output of basic C programs with pointers and arrays',
      'Coding: one easy problem — solve it fully for max marks, partial scoring available',
    ],
    technicalTopics: ['C basics: pointers, arrays, structs', 'DBMS: SQL queries, normalization', 'OS: processes, scheduling', 'OOP concepts', 'Networking basics'],
    hrQuestions: ['Why TCS?', 'Are you willing to relocate?', 'Tell me about yourself', 'What is your strength/weakness?', 'Where do you see yourself in 5 years?'],
    certifications: 'TCS iON Digital Certification (Digital Assurance) boosts profile — free online',
  },
  {
    name: 'Infosys',
    logo: 'INFY',
    color: 'from-indigo-600 to-purple-500',
    ctc: '₹3.6–4.5 LPA (freshers) · ₹9–11 LPA (digital roles)',
    tagline: 'InfyTQ certification is mandatory. Digital roles pay 2× more.',
    testPlatform: 'InfyTQ + HackerEarth',
    sections: [
      { name: 'Quantitative Reasoning', questions: 10, time: '25 min', topics: ['Number theory', 'Ratio & proportion', 'Clocks & calendars', 'Probability', 'Data interpretation'] },
      { name: 'Logical Reasoning', questions: 15, time: '25 min', topics: ['Critical reasoning', 'Visual puzzles', 'Statement-conclusion', 'Direction sense', 'Arrangements'] },
      { name: 'Verbal Ability', questions: 20, time: '20 min', topics: ['Error identification', 'Sentence completion', 'Vocabulary', 'Reading comprehension'] },
      { name: 'Pseudocode', questions: 5, time: '10 min', topics: ['Trace pseudocode output', 'Identify errors', 'Predict variable values after loops'] },
      { name: 'Coding', questions: 2, time: '3 hours', topics: ['Easy-Medium DSA', 'Python/Java/C++ preferred', 'InfyTQ platform'] },
    ],
    aptitudeTips: [
      'InfyTQ certification (free) is prioritized by Infosys — complete it before applying',
      'Digital/Power Programmer roles require 2 coding problems solved at 100% — prepare harder',
      'Pseudocode section: understand flowchart → code translation, not just syntax',
      'Verbal is easy if you read English daily — do 1 RC comprehension passage per day',
      'No negative marking in most Infosys tests — attempt all questions',
    ],
    technicalTopics: ['OOP in Java/Python', 'SQL: complex joins, subqueries', 'Data structures: arrays, linked lists, trees', 'DBMS: ER diagrams, normalization', 'Algorithms: sorting, searching'],
    hrQuestions: ['Why Infosys?', 'Tell me about InfyTQ certification', 'Describe a project using OOP', 'Are you flexible with service agreements?', 'What do you know about Infosys?'],
    certifications: 'InfyTQ Certification — complete all 3 modules (Programming Fundamentals, OOP, Web Dev). Mandatory for System Engineer role.',
  },
  {
    name: 'Wipro',
    logo: 'WIP',
    color: 'from-purple-600 to-pink-500',
    ctc: '₹3.5–4 LPA (freshers) · ₹6.5 LPA (NLTH)',
    tagline: 'NLTH (National Level Talent Hunt) for higher package. Separate test.',
    testPlatform: 'AMCAT / Mettl',
    sections: [
      { name: 'Quantitative Aptitude', questions: 16, time: '16 min', topics: ['LCM/GCD', 'Arithmetic progressions', 'Permutations & combinations', 'Probability', 'Mensuration'] },
      { name: 'Verbal Ability', questions: 22, time: '18 min', topics: ['Grammar correction', 'Antonyms/Synonyms', 'Ordering sentences', 'Comprehension'] },
      { name: 'Logical Reasoning', questions: 14, time: '14 min', topics: ['Syllogisms', 'Input-output', 'Coding patterns', 'Number series'] },
      { name: 'Written Communication', questions: 1, time: '20 min', topics: ['Essay writing (150–200 words)', 'Grammar and clarity graded by AI'] },
      { name: 'Coding', questions: 2, time: '60 min', topics: ['Easy-medium problems', 'Array manipulation, string operations', 'Time complexity matters'] },
    ],
    aptitudeTips: [
      'Wipro uses AMCAT — practice previous AMCAT papers, patterns are repetitive',
      'Time management is critical: 1 min/quant, 50s/verbal, 1 min/reasoning',
      'Written Communication: structure matters — intro, body, conclusion. Check grammar.',
      'NLTH (₹6.5 LPA): requires 2 medium coding problems + tougher aptitude cutoff',
      'Technical Interview: core CS subjects (OS, DBMS, OOP) + one project explanation',
    ],
    technicalTopics: ['C/C++/Java fundamentals', 'DBMS: SQL, normalization', 'OS: memory management, scheduling', 'Computer networks basics', 'OOP concepts'],
    hrQuestions: ['Tell me about yourself', 'Why software engineering?', 'Strengths and weaknesses', 'Comfortable with bond period?', 'Preferred location?'],
  },
  {
    name: 'Accenture',
    logo: 'ACC',
    color: 'from-violet-600 to-indigo-500',
    ctc: '₹4.5 LPA (ASE) · ₹8 LPA (Packaged App Dev)',
    tagline: 'Cognitive Assessment is the differentiator. Soft skills matter as much as tech.',
    testPlatform: 'Accenture Hiring Assessment (iMocha / Mettl)',
    sections: [
      { name: 'Cognitive & Technical Assessment', questions: 50, time: '60 min', topics: ['Quant aptitude', 'Logical reasoning', 'Abstract reasoning patterns', 'Attention to detail', 'Basic programming concepts'] },
      { name: 'Communication Assessment', questions: 1, time: '30 min', topics: ['Spoken English (recorded)', 'Reading aloud passage', 'Describe a picture', 'Open-ended questions'] },
      { name: 'Coding Test', questions: 2, time: '90 min', topics: ['Easy coding problems', 'Any language', 'Logic over optimization'] },
    ],
    aptitudeTips: [
      'Cognitive Assessment: abstract reasoning (pattern matrices) is hard — practice online',
      'Communication test: speak clearly, structured sentences. Fluency > accent.',
      'Accenture values "learning agility" — show you pick up new tools fast in interviews',
      'No bond period at Accenture (unlike TCS/Wipro) — good selling point',
      'Packaged App Dev (PAD) role: higher package, requires SAP/Salesforce interest',
    ],
    technicalTopics: ['Programming basics: loops, arrays, functions', 'SQL: SELECT, JOIN, GROUP BY', 'OOP concepts', 'Cloud basics (Azure, AWS)', 'Agile methodology basics'],
    hrQuestions: ['Why Accenture?', 'Tell me about your final year project', 'How do you handle ambiguity?', 'Describe a team leadership experience', 'What technologies excite you?'],
  },
  {
    name: 'Deloitte',
    logo: 'DEL',
    color: 'from-green-600 to-teal-500',
    ctc: '₹7–9 LPA (Analyst) · ₹12–18 LPA (Consultant/specialist)',
    tagline: 'Big 4 consulting. Case interviews + tech for UST. Strong analytical focus.',
    testPlatform: 'Deloitte Online Assessment (Aspiring Minds / proprietary)',
    sections: [
      { name: 'Aptitude Test', questions: 30, time: '45 min', topics: ['Data interpretation', 'Business math (percentages, ratios)', 'Logical deduction', 'Critical reasoning', 'Number series'] },
      { name: 'Technical Assessment', questions: 20, time: '30 min', topics: ['SQL queries', 'Excel / data analysis concepts', 'Consulting frameworks (for BTA roles)', 'Cloud and digital transformation basics'] },
      { name: 'Communication Test', questions: 1, time: '15 min', topics: ['Written English proficiency', 'Email writing scenario'] },
    ],
    aptitudeTips: [
      'Data interpretation is 40%+ of Deloitte aptitude — master DI with bar graphs, pie charts',
      'Business context math: interpret revenues, growth rates, market share — not just pure math',
      'For UST (US Technology) roles: prepare SQL + Python basics + a cloud certification',
      'Case interview (for consulting track): practice MECE frameworks, hypothesis-driven thinking',
      'Deloitte highly values communication — answer HR questions in structured, concise English',
    ],
    technicalTopics: ['SQL: advanced queries, window functions', 'Python: pandas basics, data manipulation', 'Cloud: AWS/Azure fundamentals', 'Data analytics concepts', 'Consulting: MECE, issue trees'],
    hrQuestions: ['Why Deloitte vs Big 4 competitors?', 'Tell me about a time you solved a business problem', 'How do you handle ambiguity?', 'Where do you want to specialize?', 'Describe your analytical approach'],
    certifications: 'AWS Cloud Practitioner or Azure Fundamentals strongly recommended for UST roles.',
  },
  {
    name: 'Cognizant',
    logo: 'COG',
    color: 'from-blue-500 to-cyan-500',
    ctc: '₹4–4.5 LPA (Programmer Analyst Trainee)',
    tagline: 'GenC & GenC Pro tracks. Coding test differentiates Pro (higher package).',
    testPlatform: 'AMCAT / Cognizant proprietary',
    sections: [
      { name: 'Quantitative Aptitude', questions: 25, time: '35 min', topics: ['Arithmetic', 'Algebra', 'Geometry basics', 'Probability', 'Data sufficiency'] },
      { name: 'Verbal Ability', questions: 25, time: '35 min', topics: ['Reading comprehension', 'Error spotting', 'Fill in the blanks', 'Sentence ordering'] },
      { name: 'Logical Reasoning', questions: 25, time: '35 min', topics: ['Seating arrangement', 'Blood relations', 'Direction problems', 'Coding-decoding'] },
      { name: 'Coding (GenC Pro)', questions: 2, time: '75 min', topics: ['Medium DSA', 'Data structures: trees, graphs', 'Sorting, searching algorithms', 'String manipulation'] },
    ],
    aptitudeTips: [
      'GenC (standard) vs GenC Pro (higher salary) — the coding round decides which track',
      'GenC Pro requires 2 complete working solutions — aim for both in 75 minutes',
      'Sectional cutoffs exist — do not skip any section even if you\'re strong in coding',
      'AMCAT scores are reusable across companies — keep your score above 450+',
      'Technical interview: projects + 2-3 core CS questions (DBMS/OS/OOP)',
    ],
    technicalTopics: ['OOP: inheritance, polymorphism, encapsulation', 'Data structures: arrays, linked lists, stacks', 'SQL: joins, group by, having', 'DBMS: normalization', 'OS: process management'],
    hrQuestions: ['Tell me about yourself', 'Why Cognizant?', 'Strengths and weaknesses', 'Describe your best project', 'Team experience and conflict resolution'],
  },
];

const BEHAVIORAL_QUESTIONS: BehavioralQ[] = [
  { id: 'b1', question: 'Tell me about a time you dealt with a difficult team member.', category: 'Conflict Resolution' },
  { id: 'b2', question: 'Describe a project where you had to learn a new technology quickly.', category: 'Learning Agility' },
  { id: 'b3', question: 'Give an example of when you failed and what you learned.', category: 'Growth Mindset' },
  { id: 'b4', question: 'Tell me about a time you had to make a decision with incomplete information.', category: 'Decision Making' },
  { id: 'b5', question: 'Describe a time you influenced others without direct authority.', category: 'Leadership' },
  { id: 'b6', question: 'Tell me about the most complex technical problem you\'ve solved.', category: 'Technical Depth' },
  { id: 'b7', question: 'Give an example of when you prioritized speed over quality, or vice versa.', category: 'Tradeoffs' },
  { id: 'b8', question: 'Describe a time you disagreed with your manager and how you handled it.', category: 'Conflict Resolution' },
  { id: 'b9', question: 'Tell me about a project you\'re most proud of and why.', category: 'Achievement' },
  { id: 'b10', question: 'How do you handle multiple competing priorities with the same deadline?', category: 'Time Management' },
  { id: 'b11', question: 'Describe a time you went above and beyond for a customer or user.', category: 'Customer Obsession' },
  { id: 'b12', question: 'Tell me about a time you improved a process or system proactively.', category: 'Ownership' },
];

const APP_STATUS: Record<Application['status'], { label: string; color: string; dot: string }> = {
  applied:   { label: 'Applied',    color: 'text-zinc-400 bg-zinc-500/10',   dot: 'bg-zinc-500' },
  oa:        { label: 'OA',         color: 'text-blue-400 bg-blue-500/10',   dot: 'bg-blue-400' },
  interview: { label: 'Interview',  color: 'text-yellow-400 bg-yellow-500/10', dot: 'bg-yellow-400' },
  offer:     { label: 'Offer 🎉',   color: 'text-green-400 bg-green-500/10', dot: 'bg-green-400' },
  rejected:  { label: 'Rejected',   color: 'text-red-400 bg-red-500/10',     dot: 'bg-red-400' },
};

const DAILY_QUESTION = {
  type: 'Behavioral',
  question: 'Describe a time you had to rapidly adapt to a significant change at work. What was the change, how did you respond, and what did you learn?',
  tip: 'Use the STAR method: Situation → Task → Action → Result. Aim for 2–3 minutes verbally.',
  category: 'Adaptability',
};

function getReadinessBarClass(readiness: number): string {
  if (readiness >= 70) return 'bg-gradient-to-r from-green-500 to-emerald-400';
  if (readiness >= 40) return 'bg-gradient-to-r from-yellow-500 to-amber-400';
  return 'bg-gradient-to-r from-primary-container to-red-400';
}

function getReadinessMsg(readiness: number): string {
  if (readiness < 40) return "Keep practicing — you're building momentum!";
  if (readiness < 70) return 'Good progress — focus on weak areas.';
  return 'Interview-ready! Start applying confidently.';
}

function renderDailyQuestionAction(
  dailyAnswered: boolean,
  showDailyInput: boolean,
  dailyResponse: string,
  setDailyResponse: (v: string) => void,
  setShowDailyInput: (v: boolean) => void,
  submitDailyAnswer: () => void,
) {
  if (dailyAnswered) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
        <Icon name="check_circle" size={18} filled />
        Answered today · +25 XP earned
      </div>
    );
  }
  if (showDailyInput) {
    return (
      <div>
        <textarea
          value={dailyResponse}
          onChange={(e) => setDailyResponse(e.target.value)}
          placeholder="Write your answer using STAR format..."
          rows={4}
          className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/40 resize-none mb-3"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setShowDailyInput(false)} className="text-sm text-zinc-500 hover:text-zinc-300 px-3 py-2 rounded-full">Cancel</button>
          <button
            onClick={submitDailyAnswer}
            disabled={dailyResponse.length < 20}
            className="bg-primary-container text-white font-bold py-2 px-5 rounded-full text-sm hover:brightness-110 disabled:opacity-40"
          >
            Submit · +25 XP
          </button>
        </div>
      </div>
    );
  }
  return (
    <button
      onClick={() => setShowDailyInput(true)}
      className="bg-primary-container text-white font-bold py-2.5 px-6 rounded-full text-sm hover:brightness-110 transition-all flex items-center gap-2"
    >
      <Icon name="edit" size={14} />
      Answer Today's Question
    </button>
  );
}

export function PlacementPage() {
  const navigate = useNavigate();
  const session = getSession();
  const { fireXP } = useUser();

  const [tracks, setTracks] = useState<TrackProgress[]>([]);
  const [stats, setStats] = useState<PlacementStats>({ applicationsSubmitted: 0, interviewsScheduled: 0, offersReceived: 0, readinessScore: 0 });
  const [applications, setApplications] = useState<Application[]>([]);
  const [behaviorals, setBehaviorals] = useState<BehavioralQ[]>(BEHAVIORAL_QUESTIONS);
  const [activeTab, setActiveTab] = useState<'tracks' | 'behavioral' | 'applications' | 'companies' | 'india'>('tracks');
  const [selectedServiceCo, setSelectedServiceCo] = useState<ServiceCompany | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyGuide | null>(null);
  const [selectedBQ, setSelectedBQ] = useState<BehavioralQ | null>(null);
  const [bqResponse, setBqResponse] = useState('');
  const [savingBQ, setSavingBQ] = useState(false);
  const [showAddApp, setShowAddApp] = useState(false);
  const [newApp, setNewApp] = useState({ company: '', role: '', status: 'applied' as Application['status'], nextStep: '', nextStepDate: '' });
  const [addingApp, setAddingApp] = useState(false);
  const [filterBQCat, setFilterBQCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState<Application['status'] | 'all'>('all');
  const [dailyAnswered, setDailyAnswered] = useState(false);
  const [dailyResponse, setDailyResponse] = useState('');
  const [showDailyInput, setShowDailyInput] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;

    apiRequest<{ tracks: TrackProgress[]; stats: PlacementStats }>('/placement/overview', { token: session.accessToken })
      .then((d) => {
        if (d.tracks?.length) setTracks(d.tracks);
        if (d.stats) setStats(d.stats);
      })
      .catch(() => {
        // fallback to local static
        setTracks(TRACKS.map((t) => ({ id: t.id, title: t.title, company: t.company, icon: t.icon, progress: 0, totalTopics: 20, completedTopics: 0 })));
      });

    apiRequest<{ applications: Application[] }>('/placement/applications', { token: session.accessToken })
      .then((d) => { if (d.applications?.length) setApplications(d.applications); })
      .catch(() => {});

    apiRequest<{ questions: BehavioralQ[] }>('/placement/behavioral', { token: session.accessToken })
      .then((d) => { if (d.questions?.length) setBehaviorals(d.questions); })
      .catch(() => {});
  }, [session?.accessToken]);


  const saveBehavioral = async () => {
    if (!selectedBQ || !session?.accessToken || bqResponse.length < 10) return;
    setSavingBQ(true);
    try {
      await apiRequest(`/placement/behavioral/${selectedBQ.id}`, {
        token: session.accessToken,
        method: 'POST',
        body: { response: bqResponse },
      });
      setBehaviorals((prev) => prev.map((q) => q.id === selectedBQ.id
        ? { ...q, response: bqResponse, lastPracticed: new Date().toISOString() }
        : q
      ));
      fireXP(20, 'Behavioral question practiced!');
      setSelectedBQ(null);
      setBqResponse('');
    } catch {
      // ignore
    } finally {
      setSavingBQ(false);
    }
  };

  const addApplication = async () => {
    if (!session?.accessToken || !newApp.company || !newApp.role) return;
    setAddingApp(true);
    try {
      const created = await apiRequest<Application>('/placement/applications', {
        token: session.accessToken,
        method: 'POST',
        body: newApp,
      });
      setApplications((prev) => [created, ...prev]);
      setStats((s) => ({ ...s, applicationsSubmitted: s.applicationsSubmitted + 1 }));
      setNewApp({ company: '', role: '', status: 'applied', nextStep: '', nextStepDate: '' });
      setShowAddApp(false);
      fireXP(10, 'Application tracked!');
    } catch {
      // fallback: add locally
      const local: Application = { id: Date.now().toString(), company: newApp.company, role: newApp.role, status: newApp.status, appliedAt: new Date().toISOString(), nextStep: newApp.nextStep || undefined, nextStepDate: newApp.nextStepDate || undefined };
      setApplications((prev) => [local, ...prev]);
      setStats((s) => ({ ...s, applicationsSubmitted: s.applicationsSubmitted + 1 }));
      setNewApp({ company: '', role: '', status: 'applied', nextStep: '', nextStepDate: '' });
      setShowAddApp(false);
    } finally {
      setAddingApp(false);
    }
  };

  const updateAppStatus = async (id: string, status: Application['status']) => {
    if (!session?.accessToken) return;
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    try {
      await apiRequest(`/placement/applications/${id}`, {
        token: session.accessToken,
        method: 'PATCH',
        body: { status },
      });
      if (status === 'offer') fireXP(100, '🎉 Offer received!');
      if (status === 'interview') fireXP(30, 'Interview scheduled!');
    } catch {
      // ignore, local state already updated
    }
  };

  const submitDailyAnswer = async () => {
    if (!dailyResponse || dailyResponse.length < 20) return;
    setDailyAnswered(true);
    setShowDailyInput(false);
    fireXP(25, 'Daily question answered!');
    try {
      if (session?.accessToken) {
        await apiRequest('/placement/daily-answer', {
          token: session.accessToken,
          method: 'POST',
          body: { question: DAILY_QUESTION.question, response: dailyResponse },
        });
      }
    } catch {
      // ignore
    }
  };

  const bqCategories = ['all', ...Array.from(new Set(BEHAVIORAL_QUESTIONS.map((q) => q.category)))];
  const filteredBQ = filterBQCat === 'all' ? behaviorals : behaviorals.filter((q) => q.category === filterBQCat);
  const filteredApps = filterStatus === 'all' ? applications : applications.filter((a) => a.status === filterStatus);
  const practiceCount = behaviorals.filter((q) => q.lastPracticed).length;

  const readiness = Math.min(100, Math.round(
    (practiceCount / BEHAVIORAL_QUESTIONS.length) * 30 +
    (applications.length > 0 ? 20 : 0) +
    (applications.some((a) => a.status === 'interview') ? 25 : 0) +
    (stats.readinessScore || 25)
  ));

  const readinessBarClass = getReadinessBarClass(readiness);
  const readinessMsg = getReadinessMsg(readiness);

  const TABS = [
    { id: 'tracks' as const, label: 'Interview Tracks', icon: 'route' },
    { id: 'behavioral' as const, label: 'Behavioral', icon: 'record_voice_over' },
    { id: 'applications' as const, label: 'Applications', icon: 'work' },
    { id: 'companies' as const, label: 'Companies', icon: 'business' },
    { id: 'india' as const, label: '🇮🇳 Service Co.', icon: 'flag' },
  ];

  if (selectedBQ) {
    return (
      <AppShell>
        <div className="pt-8 max-w-3xl">
          <button onClick={() => { setSelectedBQ(null); setBqResponse(''); }}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
            <Icon name="arrow_back" size={16} />Back to behavioral questions
          </button>

          <div className="bg-surface-container rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-primary-container/10 text-primary-container">
                {selectedBQ.category}
              </span>
              {selectedBQ.lastPracticed && (
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  Last practiced {new Date(selectedBQ.lastPracticed).toLocaleDateString()}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold leading-relaxed mb-6">{selectedBQ.question}</h2>

            <div className="bg-surface-container-highest rounded-xl p-4 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-2 flex items-center gap-1">
                <Icon name="tips_and_updates" size={12} />STAR Framework
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-on-surface-variant">
                {[
                  { label: 'S', name: 'Situation', desc: 'Set the scene' },
                  { label: 'T', name: 'Task', desc: 'Your responsibility' },
                  { label: 'A', name: 'Action', desc: 'What you did' },
                  { label: 'R', name: 'Result', desc: 'Quantified outcome' },
                ].map((s) => (
                  <div key={s.label} className="bg-surface-container rounded-lg p-2.5 text-center">
                    <p className="text-base font-black text-primary-container">{s.label}</p>
                    <p className="font-bold text-on-surface">{s.name}</p>
                    <p className="text-zinc-500">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedBQ.response && (
              <div className="mb-4 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-2">Previous Response</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{selectedBQ.response}</p>
              </div>
            )}

            <textarea
              value={bqResponse}
              onChange={(e) => setBqResponse(e.target.value)}
              placeholder="Write your STAR response here. Try to be specific — use real project names, numbers, and outcomes..."
              rows={8}
              className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:border-primary-container/40 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-zinc-600">{bqResponse.length} characters · ~{Math.ceil(bqResponse.split(' ').length / 130)} min read</p>
              <div className="flex gap-3">
                <button onClick={() => { setSelectedBQ(null); setBqResponse(''); }} className="text-sm text-zinc-500 hover:text-zinc-300 px-4 py-2 rounded-full transition-colors">Cancel</button>
                <button
                  onClick={saveBehavioral}
                  disabled={savingBQ || bqResponse.length < 10}
                  className="bg-primary-container text-white font-bold py-2.5 px-6 rounded-full text-sm hover:brightness-110 transition-all disabled:opacity-40 flex items-center gap-2"
                >
                  {savingBQ ? <Icon name="hourglass_empty" size={14} /> : <Icon name="save" size={14} />}
                  Save Response · +20 XP
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {selectedCompany && <CompanyPanel guide={selectedCompany} onClose={() => setSelectedCompany(null)} />}
      <div className="pt-8 max-w-6xl">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-5xl font-black tracking-tighter mb-2">
            Placement <span className="text-primary-container">Prep.</span>
          </h1>
          <p className="text-on-surface-variant text-lg">FAANG-level interview preparation, engineered for precision.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: 'send', label: 'Applications', value: stats.applicationsSubmitted || applications.length, color: 'text-blue-400' },
            { icon: 'calendar_month', label: 'Interviews', value: stats.interviewsScheduled || applications.filter((a) => a.status === 'interview').length, color: 'text-yellow-400' },
            { icon: 'emoji_events', label: 'Offers', value: stats.offersReceived || applications.filter((a) => a.status === 'offer').length, color: 'text-green-400' },
            { icon: 'record_voice_over', label: 'BQ Practiced', value: `${practiceCount}/${BEHAVIORAL_QUESTIONS.length}`, color: 'text-purple-400' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name={s.icon} className={s.color} size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-on-surface">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAANG Readiness + Daily Question */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Readiness Score */}
          <div className="bg-surface-container rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <p className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500 mb-4">FAANG Readiness</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-5xl font-black text-on-surface">{readiness}</span>
                <span className="text-2xl font-black text-zinc-500 mb-1">/100</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${readinessBarClass}`}
                  style={{ width: `${readiness}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">{readinessMsg}</p>
            </div>
            <div className="mt-4 space-y-1">
              {[
                { label: 'Behavioral prep', done: practiceCount >= 5 },
                { label: 'Applications tracked', done: applications.length > 0 },
                { label: 'Track in progress', done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500' : 'bg-surface-container-highest'}`}>
                    {item.done && <Icon name="check" size={10} className="text-white" />}
                  </div>
                  <span className={item.done ? 'text-on-surface' : 'text-zinc-500'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Question */}
          <div className="md:col-span-2 bg-surface-container rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary-container/10 rounded-lg flex items-center justify-center">
                  <Icon name="today" className="text-primary-container" size={16} />
                </div>
                <p className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Daily Interview Question</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-container/10 text-primary-container">{DAILY_QUESTION.type}</span>
            </div>

            <p className="text-base font-bold leading-relaxed mb-3">{DAILY_QUESTION.question}</p>
            <p className="text-xs text-zinc-500 mb-5 flex items-center gap-1">
              <Icon name="tips_and_updates" size={12} className="text-yellow-400" />
              {DAILY_QUESTION.tip}
            </p>

            {renderDailyQuestionAction(dailyAnswered, showDailyInput, dailyResponse, setDailyResponse, setShowDailyInput, submitDailyAnswer)}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container p-1 rounded-full mb-8 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-container text-white shadow-lg shadow-red-900/20'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Icon name={tab.icon} size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Tracks */}
        {activeTab === 'tracks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRACKS.map((t) => {
              const tp = tracks.find((tr) => tr.id === t.id);
              const progress = tp?.progress ?? 0;
              const completed = tp?.completedTopics ?? 0;
              const total = tp?.totalTopics ?? 20;
              let trackBarColor = 'bg-yellow-400';
              if (t.id === 'sde') trackBarColor = 'bg-blue-400';
              else if (t.id === 'ds') trackBarColor = 'bg-purple-400';
              else if (t.id === 'sre') trackBarColor = 'bg-green-400';
              return (
                <div key={t.id} className={`bg-surface-container rounded-2xl p-7 border ${t.border} hover:bg-surface-container-high transition-all group`}>
                  <div className="flex justify-between items-start mb-5">
                    <div className={`w-12 h-12 ${t.bg} rounded-xl flex items-center justify-center ${t.color}`}>
                      <Icon name={t.icon} size={24} />
                    </div>
                    <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {t.company}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{t.title}</h3>
                  <p className="text-xs text-zinc-500 mb-5">{completed}/{total} topics covered</p>

                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    <span>Progress</span><span className={t.color}>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-5">
                    <div className={`h-full rounded-full transition-all duration-700 ${trackBarColor}`} style={{ width: `${progress}%` }} />
                  </div>

                  <button
                    onClick={() => navigate(`/app/placement/${t.id}`)}
                    className={`flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest ${t.color} group-hover:underline`}
                  >
                    {progress > 0 ? 'Continue Track' : 'Start Track'}
                    <Icon name="arrow_forward" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Behavioral */}
        {activeTab === 'behavioral' && (
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <p className="text-sm text-zinc-500">{practiceCount} of {BEHAVIORAL_QUESTIONS.length} questions practiced</p>
              <div className="flex gap-2 flex-wrap">
                {bqCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterBQCat(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      filterBQCat === cat
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredBQ.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => { setSelectedBQ(q); setBqResponse(q.response ?? ''); }}
                  className="w-full text-left bg-surface-container rounded-xl p-5 hover:bg-surface-container-high transition-all group flex items-start gap-4"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${q.lastPracticed ? 'bg-green-500/10' : 'bg-surface-container-highest'}`}>
                    <Icon name={q.lastPracticed ? 'check_circle' : 'record_voice_over'} size={18} className={q.lastPracticed ? 'text-green-400' : 'text-zinc-500'} filled={!!q.lastPracticed} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary-container/70">{q.category}</span>
                      {q.lastPracticed && (
                        <span className="text-[10px] text-zinc-600">Practiced {new Date(q.lastPracticed).toLocaleDateString()}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-on-surface group-hover:text-primary-container transition-colors">{q.question}</p>
                    {q.response && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{q.response}</p>
                    )}
                  </div>
                  <Icon name="chevron_right" size={18} className="text-zinc-600 group-hover:text-zinc-300 flex-shrink-0 mt-0.5 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Applications */}
        {activeTab === 'applications' && (
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'applied', 'oa', 'interview', 'offer', 'rejected'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      filterStatus === s
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {s === 'all' ? 'All' : APP_STATUS[s].label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAddApp(true)}
                className="bg-primary-container text-white font-bold py-2.5 px-5 rounded-full text-sm hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Icon name="add" size={16} />Track Application
              </button>
            </div>

            {showAddApp && (
              <div className="bg-surface-container rounded-2xl p-6 mb-6 border border-primary-container/20">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Icon name="work" size={16} className="text-primary-container" />
                  Add Application
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={newApp.company}
                    onChange={(e) => setNewApp((p) => ({ ...p, company: e.target.value }))}
                    placeholder="Company name"
                    className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-container/40"
                  />
                  <input
                    type="text"
                    value={newApp.role}
                    onChange={(e) => setNewApp((p) => ({ ...p, role: e.target.value }))}
                    placeholder="Role title"
                    className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-container/40"
                  />
                  <select
                    value={newApp.status}
                    onChange={(e) => setNewApp((p) => ({ ...p, status: e.target.value as Application['status'] }))}
                    className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                  >
                    {Object.entries(APP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input
                    type="text"
                    value={newApp.nextStep}
                    onChange={(e) => setNewApp((p) => ({ ...p, nextStep: e.target.value }))}
                    placeholder="Next step (e.g. OA, Phone Screen)"
                    className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <input
                    type="date"
                    value={newApp.nextStepDate}
                    onChange={(e) => setNewApp((p) => ({ ...p, nextStepDate: e.target.value }))}
                    className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none md:col-span-2"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowAddApp(false)} className="text-sm text-zinc-500 hover:text-zinc-300 px-4 py-2 rounded-full">Cancel</button>
                  <button
                    onClick={addApplication}
                    disabled={addingApp || !newApp.company || !newApp.role}
                    className="bg-primary-container text-white font-bold py-2 px-5 rounded-full text-sm hover:brightness-110 disabled:opacity-40"
                  >
                    {addingApp ? 'Adding...' : 'Add Application'}
                  </button>
                </div>
              </div>
            )}

            {filteredApps.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="work_outline" size={48} className="text-zinc-700 mb-4" />
                <p className="text-on-surface-variant font-bold mb-2">No applications tracked yet</p>
                <p className="text-sm text-zinc-500">Track every application to stay organized and never miss a follow-up.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app) => {
                  const status = APP_STATUS[app.status];
                  return (
                    <div key={app.id} className="bg-surface-container rounded-xl p-5 flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-on-surface">{app.company}</p>
                          <span className="text-zinc-500">·</span>
                          <p className="text-sm text-on-surface-variant">{app.role}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                          <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                          {app.nextStep && (
                            <span className="flex items-center gap-1">
                              <Icon name="schedule" size={11} />
                              {app.nextStep}{app.nextStepDate ? ` · ${new Date(app.nextStepDate).toLocaleDateString()}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <select
                        value={app.status}
                        onChange={(e) => updateAppStatus(app.id, e.target.value as Application['status'])}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full border-0 focus:outline-none cursor-pointer ${status.color}`}
                      >
                        {Object.entries(APP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Companies */}
        {activeTab === 'companies' && (
          <div>
            <p className="text-sm text-on-surface-variant mb-6">
              Click any company to see a tailored guide: interview process, key DSA topics, culture tips, and insider prep advice.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {COMPANIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedCompany(c)}
                  className="bg-surface-container rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-surface-container-high transition-all cursor-pointer group text-left"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                    {c.logo}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-on-surface text-sm group-hover:text-white transition-colors">{c.name}</p>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${DIFF_COLOR[c.difficulty].split(' ')[0]}`}>
                      {c.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-zinc-600 font-bold uppercase tracking-widest group-hover:text-zinc-400 transition-colors">
                    <Icon name="menu_book" size={11} />
                    {c.process.length} rounds · {c.prepWeeks}w prep
                  </div>
                </button>
              ))}
            </div>

            {/* Quick overview strip */}
            <div className="mt-8 bg-surface-container rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Quick Comparison</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left text-zinc-600 font-bold pb-2 pr-4">Company</th>
                      <th className="text-left text-zinc-600 font-bold pb-2 pr-4">Difficulty</th>
                      <th className="text-left text-zinc-600 font-bold pb-2 pr-4">Rounds</th>
                      <th className="text-left text-zinc-600 font-bold pb-2">Prep (weeks)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPANIES.map((c) => (
                      <tr key={c.name} className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors" onClick={() => setSelectedCompany(c)}>
                        <td className="py-2 pr-4 font-bold text-on-surface">{c.name}</td>
                        <td className={`py-2 pr-4 font-bold ${DIFF_COLOR[c.difficulty].split(' ')[0]}`}>{c.difficulty}</td>
                        <td className="py-2 pr-4 text-zinc-400">{c.process.length}</td>
                        <td className="py-2 text-zinc-400">{c.prepWeeks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'india' && (
          <div>
            <div className="mb-6 p-5 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🇮🇳</span>
                <h2 className="font-black text-amber-400">India Service Company Placement Prep</h2>
              </div>
              <p className="text-sm text-zinc-400">TCS, Infosys, Wipro, Accenture hire 50,000+ freshers per year. The patterns are predictable — learn them and clear the OA on your first attempt.</p>
            </div>

            {selectedServiceCo ? (
              <div>
                <button onClick={() => setSelectedServiceCo(null)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-5 transition-colors">
                  <Icon name="arrow_back" size={16} /> Back to all companies
                </button>
                <div className={`p-5 bg-gradient-to-r ${selectedServiceCo.color} rounded-2xl mb-5`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-2xl font-black text-white">{selectedServiceCo.name}</h2>
                      <p className="text-white/70 text-sm mt-0.5">{selectedServiceCo.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Avg CTC (Fresher)</p>
                      <p className="text-white font-black">{selectedServiceCo.ctc}</p>
                    </div>
                  </div>
                  <div className="mt-3 px-3 py-2 bg-black/20 rounded-xl inline-block">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Test Platform</p>
                    <p className="text-white font-bold text-sm">{selectedServiceCo.testPlatform}</p>
                  </div>
                </div>

                {/* OA sections */}
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Online Assessment Sections</p>
                  <div className="space-y-3">
                    {selectedServiceCo.sections.map((section) => (
                      <div key={section.name} className="bg-[#1a1a1a] rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <h3 className="font-bold text-white">{section.name}</h3>
                          <div className="flex gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <span>{section.questions} questions</span>
                            <span>·</span>
                            <span>{section.time}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {section.topics.map((t) => (
                            <span key={t} className="px-2.5 py-1 bg-zinc-800 rounded-lg text-xs text-zinc-300">{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  {/* Aptitude tips */}
                  <div className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-1.5">
                      <Icon name="tips_and_updates" size={12} /> Prep Tips
                    </p>
                    <ul className="space-y-2">
                      {selectedServiceCo.aptitudeTips.map((tip, i) => (
                        <li key={tip} className="flex items-start gap-2 text-sm text-zinc-400">
                          <span className="text-amber-400 font-black flex-shrink-0 mt-0.5">{i + 1}.</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technical topics */}
                  <div className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3 flex items-center gap-1.5">
                      <Icon name="code" size={12} /> Technical Interview Topics
                    </p>
                    <ul className="space-y-2">
                      {selectedServiceCo.technicalTopics.map((t) => (
                        <li key={t} className="flex items-center gap-2 text-sm text-zinc-400">
                          <Icon name="arrow_right" size={13} className="text-blue-400 flex-shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* HR Questions */}
                <div className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5 mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-1.5">
                    <Icon name="record_voice_over" size={12} /> Common HR Questions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedServiceCo.hrQuestions.map((q) => (
                      <span key={q} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-300">{q}</span>
                    ))}
                  </div>
                </div>

                {selectedServiceCo.certifications && (
                  <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-1 flex items-center gap-1.5">
                      <Icon name="verified" size={12} /> Recommended Certifications
                    </p>
                    <p className="text-sm text-zinc-400">{selectedServiceCo.certifications}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SERVICE_COMPANIES.map((co) => (
                    <button
                      key={co.name}
                      type="button"
                      onClick={() => setSelectedServiceCo(co)}
                      className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 text-left hover:border-white/15 hover:bg-[#222] transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${co.color} flex items-center justify-center text-white font-black text-xs shadow-lg`}>
                          {co.logo}
                        </div>
                        <div>
                          <h3 className="font-black text-white">{co.name}</h3>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Service Company</p>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 mb-3 leading-relaxed">{co.tagline}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-green-400">{co.ctc}</span>
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1 group-hover:text-zinc-400 transition-colors">
                          {co.sections.length} sections <Icon name="arrow_forward" size={10} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Aptitude quick tips */}
                <div className="mt-8 p-6 bg-[#1a1a1a] border border-white/5 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Universal Service Company Tips</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: 'timer', color: 'text-blue-400', tip: 'Time management beats perfection — 60% accuracy with full attempt beats 80% accuracy with 30% skipped' },
                      { icon: 'book', color: 'text-green-400', tip: 'Verbal is the most neglected section. 10 min of RC daily = top 20% automatically' },
                      { icon: 'psychology', color: 'text-purple-400', tip: 'Aptitude patterns repeat year to year — use previous year papers for TCS/Wipro' },
                      { icon: 'verified', color: 'text-amber-400', tip: 'Platform certifications (InfyTQ, TCS iON) act as pre-filters — complete them before applying' },
                    ].map((item) => (
                      <div key={item.icon} className="flex items-start gap-3 bg-zinc-900/50 rounded-xl p-4">
                        <Icon name={item.icon} size={18} className={`${item.color} flex-shrink-0 mt-0.5`} />
                        <p className="text-sm text-zinc-400 leading-relaxed">{item.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
