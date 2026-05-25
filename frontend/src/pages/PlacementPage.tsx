import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

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
  { id: 'sde', title: 'SDE Track',          company: 'FAANG',    icon: 'code',        color: '#60a5fa', glow: 'rgba(96,165,250,0.15)'  },
  { id: 'ds',  title: 'Data Science',        company: 'MAANG',    icon: 'data_object', color: '#c084fc', glow: 'rgba(192,132,252,0.15)' },
  { id: 'sre', title: 'SRE / DevOps',        company: 'Cloud',    icon: 'cloud',       color: '#4ade80', glow: 'rgba(74,222,128,0.15)'  },
  { id: 'pm',  title: 'Product Management',  company: 'Startups', icon: 'lightbulb',   color: '#facc15', glow: 'rgba(250,204,21,0.15)'  },
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

const DIFF_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  'Medium':    { color: '#facc15', bg: 'rgba(250,204,21,0.08)',   border: 'rgba(250,204,21,0.25)'   },
  'Hard':      { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.25)'   },
  'Very Hard': { color: '#f87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.25)'  },
};

interface CompanyPanelProps {
  readonly guide: CompanyGuide;
  readonly onClose: () => void;
}

function CompanyPanel({ guide, onClose }: CompanyPanelProps) {
  const [tab, setTab] = useState<'process' | 'dsa' | 'culture' | 'tips'>('process');
  const diff = DIFF_COLOR[guide.difficulty] ?? DIFF_COLOR['Medium'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div role="none" style={{ flex: 1, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} />
      <div style={{ width: '100%', maxWidth: 640, background: '#0a0a0a', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${guide.color} flex items-center justify-center text-white font-black text-xl shadow-lg`}>
            {guide.logo}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#fff' }}>{guide.name}</h2>
              <span style={{ fontSize: '0.5625rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 9999, color: diff.color, background: diff.bg, border: `1px solid ${diff.border}` }}>
                {guide.difficulty}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guide.tagline}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 24, padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
          {[
            { label: 'Interview Steps', val: `${guide.process.length} rounds` },
            { label: 'Prep Time', val: `${guide.prepWeeks} weeks` },
            { label: 'DSA Topics', val: `${guide.dsaFocus.length} key areas` },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: '0.5625rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>{s.label}</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 900, color: '#fff', marginTop: 2 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '16px 24px 0', flexShrink: 0 }}>
          {([
            { key: 'process', label: 'Process' },
            { key: 'dsa',     label: 'DSA Focus' },
            { key: 'culture', label: 'Culture' },
            { key: 'tips',    label: 'Insider Tips' },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '8px 16px', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', border: 'none', background: tab === t.key ? 'rgba(255,255,255,0.1)' : 'transparent', color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.3)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tab === 'process' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {guide.process.map((step, i) => (
                <div key={step.step} style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{i + 1}</div>
                    {i < guide.process.length - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)', marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingBottom: 16, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{step.step}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 2, lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'dsa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <p style={{ fontSize: '0.625rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60a5fa', marginBottom: 12 }}>Key DSA Topics</p>
                <div className="grid grid-cols-2 gap-2">
                  {guide.dsaFocus.map((topic) => (
                    <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                      <Icon name="code" size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.625rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22d3ee', marginBottom: 12 }}>System Design Topics</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {guide.sysDes.map((topic) => (
                    <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                      <Icon name="architecture" size={13} style={{ color: '#22d3ee', flexShrink: 0 }} />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'culture' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {guide.cultureTips.map((tip) => (
                <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(192,132,252,0.05)', border: '1px solid rgba(192,132,252,0.1)', borderRadius: 14, padding: '12px 16px' }}>
                  <Icon name="groups" size={14} style={{ color: '#c084fc', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'tips' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {guide.insiderTips.map((tip) => (
                <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)', borderRadius: 14, padding: '12px 16px' }}>
                  <Icon name="tips_and_updates" size={14} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, display: 'flex', gap: 12 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '0.625rem', padding: '12px 0', borderRadius: 9999, cursor: 'pointer', border: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Close
          </button>
          <button onClick={onClose}
            style={{ flex: 1, background: 'linear-gradient(135deg,#E82127,#ff6b35)', color: '#fff', fontWeight: 900, fontSize: '0.625rem', padding: '12px 0', borderRadius: 9999, cursor: 'pointer', border: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}>
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

const APP_STATUS: Record<Application['status'], { label: string; color: string; bg: string; dot: string }> = {
  applied:   { label: 'Applied',   color: '#a1a1aa', bg: 'rgba(161,161,170,0.08)', dot: '#a1a1aa' },
  oa:        { label: 'OA',        color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  dot: '#60a5fa' },
  interview: { label: 'Interview', color: '#facc15', bg: 'rgba(250,204,21,0.08)',  dot: '#facc15' },
  offer:     { label: 'Offer 🎉',  color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  dot: '#4ade80' },
  rejected:  { label: 'Rejected',  color: '#f87171', bg: 'rgba(248,113,113,0.08)', dot: '#f87171' },
};

const DAILY_QUESTION = {
  type: 'Behavioral',
  question: 'Describe a time you had to rapidly adapt to a significant change at work. What was the change, how did you respond, and what did you learn?',
  tip: 'Use the STAR method: Situation → Task → Action → Result. Aim for 2–3 minutes verbally.',
  category: 'Adaptability',
};

function getReadinessBarClass(_readiness: number): string {
  return '';
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
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, fontSize: 14, color: '#e4e4e7', outline: 'none', resize: 'none', marginBottom: 12, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setShowDailyInput(false)} style={{ fontSize: 14, color: '#71717a', padding: '8px 12px', borderRadius: 999, background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={submitDailyAnswer}
            disabled={dailyResponse.length < 20}
            style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '8px 20px', borderRadius: 999, fontSize: 14, border: 'none', cursor: dailyResponse.length < 20 ? 'default' : 'pointer', opacity: dailyResponse.length < 20 ? 0.4 : 1 }}
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
      style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '10px 24px', borderRadius: 999, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 20px rgba(232,33,39,0.25)' }}
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
          <motion.button onClick={() => { setSelectedBQ(null); setBqResponse(''); }}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 24, background: 'transparent', border: 'none', cursor: 'pointer' }}
            whileHover={{ color: '#fff' } as never}>
            <Icon name="arrow_back" size={16} />Back to behavioral questions
          </motion.button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ ...GLASS, borderRadius: 24, padding: '2rem', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 9999, background: 'rgba(232,33,39,0.1)', color: '#E82127' }}>
                {selectedBQ.category}
              </span>
              {selectedBQ.lastPracticed && (
                <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                  Last practiced {new Date(selectedBQ.lastPracticed).toLocaleDateString()}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.6, marginBottom: 24, color: 'rgba(255,255,255,0.9)' }}>{selectedBQ.question}</h2>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, marginBottom: 24 }}>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#facc15', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="tips_and_updates" size={12} />STAR Framework
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'S', name: 'Situation', desc: 'Set the scene' },
                  { label: 'T', name: 'Task',      desc: 'Your responsibility' },
                  { label: 'A', name: 'Action',    desc: 'What you did' },
                  { label: 'R', name: 'Result',    desc: 'Quantified outcome' },
                ].map((s) => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, textAlign: 'center' }}>
                    <p style={{ fontSize: '1.125rem', fontWeight: 900, color: '#E82127' }}>{s.label}</p>
                    <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.75rem' }}>{s.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.625rem' }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedBQ.response && (
              <div style={{ marginBottom: 16, padding: 16, background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 16 }}>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 8 }}>Previous Response</p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{selectedBQ.response}</p>
              </div>
            )}

            <textarea value={bqResponse} onChange={(e) => setBqResponse(e.target.value)}
              placeholder="Write your STAR response here. Try to be specific — use real project names, numbers, and outcomes..."
              rows={8}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, fontSize: '0.875rem', color: '#fff', outline: 'none', resize: 'none', lineHeight: 1.7 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)' }}>{bqResponse.length} characters · ~{Math.ceil(bqResponse.split(' ').length / 130)} min read</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setSelectedBQ(null); setBqResponse(''); }}
                  style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.3)', padding: '8px 16px', borderRadius: 9999, background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <motion.button onClick={saveBehavioral} disabled={savingBQ || bqResponse.length < 10}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{ background: 'linear-gradient(135deg,#E82127,#ff6b35)', color: '#fff', fontWeight: 700, padding: '10px 24px', borderRadius: 9999, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 20px rgba(232,33,39,0.3)', cursor: (savingBQ || bqResponse.length < 10) ? 'default' : 'pointer', opacity: (savingBQ || bqResponse.length < 10) ? 0.4 : 1 }}>
                  {savingBQ ? <Icon name="hourglass_empty" size={14} /> : <Icon name="save" size={14} />}
                  Save Response · +20 XP
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {selectedCompany && <CompanyPanel guide={selectedCompany} onClose={() => setSelectedCompany(null)} />}
      <div className="pt-8 max-w-6xl">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: 8, textTransform: 'uppercase' }}>
            EYF · Career Prep
          </p>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em',
            background: 'linear-gradient(135deg, #fff 20%, #E82127 55%, #fb923c 80%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8,
          }}>
            PLACEMENT PREP.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '1rem' }}>FAANG-level interview preparation, engineered for precision.</p>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: 'send',             label: 'Applications', value: stats.applicationsSubmitted || applications.length, color: '#60a5fa', glow: 'rgba(96,165,250,0.15)'  },
            { icon: 'calendar_month',   label: 'Interviews',   value: stats.interviewsScheduled || applications.filter((a) => a.status === 'interview').length, color: '#facc15', glow: 'rgba(250,204,21,0.15)'  },
            { icon: 'emoji_events',     label: 'Offers',       value: stats.offersReceived || applications.filter((a) => a.status === 'offer').length, color: '#4ade80', glow: 'rgba(74,222,128,0.15)'  },
            { icon: 'record_voice_over',label: 'BQ Practiced', value: `${practiceCount}/${BEHAVIORAL_QUESTIONS.length}`, color: '#c084fc', glow: 'rgba(192,132,252,0.15)' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ ...GLASS, borderRadius: 16, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div style={{ width: 44, height: 44, background: `${s.color}18`, border: `1px solid ${s.color}30`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 16px ${s.glow}` }}>
                <Icon name={s.icon} size={20} style={{ color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{s.value}</p>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAANG Readiness + Daily Question */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Readiness Score */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ ...GLASS, borderRadius: 20, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em', fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginBottom: 16, textTransform: 'uppercase' }}>FAANG Readiness</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, color: '#fff' }}>{readiness}</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>/100</span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                <motion.div
                  style={{ height: '100%', borderRadius: 999, background: readiness >= 70 ? 'linear-gradient(90deg,#4ade80,#34d399)' : readiness >= 40 ? 'linear-gradient(90deg,#facc15,#fb923c)' : 'linear-gradient(90deg,#E82127,#f87171)' }}
                  animate={{ width: `${readiness}%` }}
                  transition={{ duration: 0.7 }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{readinessMsg}</p>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Behavioral prep', done: practiceCount >= 5 },
                { label: 'Applications tracked', done: applications.length > 0 },
                { label: 'Track in progress', done: false },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: item.done ? '#4ade80' : 'rgba(255,255,255,0.06)' }}>
                    {item.done && <Icon name="check" size={10} style={{ color: '#000' }} />}
                  </div>
                  <span style={{ color: item.done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Daily Question */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="md:col-span-2"
            style={{ ...GLASS, borderRadius: 20, padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, background: 'rgba(232,33,39,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="today" size={16} style={{ color: '#E82127' }} />
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.15em', fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Daily Interview Question</p>
              </div>
              <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: 'rgba(232,33,39,0.1)', color: '#E82127' }}>{DAILY_QUESTION.type}</span>
            </div>

            <p style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.6, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>{DAILY_QUESTION.question}</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="tips_and_updates" size={12} style={{ color: '#facc15' }} />
              {DAILY_QUESTION.tip}
            </p>

            {renderDailyQuestionAction(dailyAnswered, showDailyInput, dailyResponse, setDailyResponse, setShowDailyInput, submitDailyAnswer)}
          </motion.div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: 4, borderRadius: 9999, width: 'fit-content', marginBottom: 32, flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9999,
                fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                background: activeTab === tab.id ? '#E82127' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.3)',
                boxShadow: activeTab === tab.id ? '0 0 16px rgba(232,33,39,0.35)' : 'none',
              }}>
              <Icon name={tab.icon} size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Tracks */}
        {activeTab === 'tracks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRACKS.map((t, i) => {
              const tp = tracks.find((tr) => tr.id === t.id);
              const progress = tp?.progress ?? 0;
              const completed = tp?.completedTopics ?? 0;
              const total = tp?.totalTopics ?? 20;
              return (
                <motion.div key={t.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  whileHover={{ boxShadow: `0 0 40px ${t.glow}` }}
                  style={{ ...GLASS, borderRadius: 20, padding: '1.75rem', border: `1px solid ${t.color}20`, transition: 'box-shadow 0.3s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ width: 52, height: 52, background: `${t.color}15`, border: `1px solid ${t.color}30`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 16px ${t.glow}` }}>
                      <Icon name={t.icon} size={24} style={{ color: t.color }} />
                    </div>
                    <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                      {t.company}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>{t.title}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>{completed}/{total} topics covered</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>
                    <span>Progress</span><span style={{ color: t.color }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', marginBottom: 20 }}>
                    <motion.div style={{ height: '100%', borderRadius: 999, background: t.color }} animate={{ width: `${progress}%` }} transition={{ duration: 0.7 }} />
                  </div>

                  <motion.button onClick={() => navigate(`/app/placement/${t.id}`)}
                    whileHover={{ x: 4 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: t.color, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    {progress > 0 ? 'Continue Track' : 'Start Track'}
                    <Icon name="arrow_forward" size={14} />
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Tab: Behavioral */}
        {activeTab === 'behavioral' && (
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <p className="text-sm" style={{ color: '#71717a' }}>{practiceCount} of {BEHAVIORAL_QUESTIONS.length} questions practiced</p>
              <div className="flex gap-2 flex-wrap">
                {bqCategories.map((cat) => (
                  <motion.button
                    key={cat}
                    onClick={() => setFilterBQCat(cat)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={filterBQCat === cat ? {
                      background: 'rgba(232,33,39,0.14)',
                      border: '1px solid rgba(232,33,39,0.4)',
                      boxShadow: '0 0 12px rgba(232,33,39,0.18)',
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#71717a',
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredBQ.map((q, i) => (
                <motion.button
                  key={q.id}
                  type="button"
                  onClick={() => { setSelectedBQ(q); setBqResponse(q.response ?? ''); }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.005 }}
                  style={{ ...GLASS, width: '100%', textAlign: 'left', borderRadius: 16, padding: '20px', display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer' }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: q.lastPracticed ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                    border: q.lastPracticed ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <Icon name={q.lastPracticed ? 'check_circle' : 'record_voice_over'} size={18} style={{ color: q.lastPracticed ? '#4ade80' : '#71717a' }} filled={!!q.lastPracticed} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(232,33,39,0.7)' }}>{q.category}</span>
                      {q.lastPracticed && (
                        <span style={{ fontSize: 10, color: '#52525b' }}>Practiced {new Date(q.lastPracticed).toLocaleDateString()}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#e4e4e7' }}>{q.question}</p>
                    {q.response && (
                      <p style={{ fontSize: 12, color: '#71717a', marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const }}>{q.response}</p>
                    )}
                  </div>
                  <Icon name="chevron_right" size={18} style={{ color: '#52525b', flexShrink: 0, marginTop: 2 }} />
                </motion.button>
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
                  <motion.button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={filterStatus === s ? {
                      background: 'rgba(232,33,39,0.14)',
                      border: '1px solid rgba(232,33,39,0.4)',
                      boxShadow: '0 0 12px rgba(232,33,39,0.18)',
                      color: '#fff',
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#71717a',
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    {s === 'all' ? 'All' : APP_STATUS[s].label}
                  </motion.button>
                ))}
              </div>
              <motion.button
                onClick={() => setShowAddApp(true)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '10px 20px', borderRadius: 999, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}
              >
                <Icon name="add" size={16} />Track Application
              </motion.button>
            </div>

            {showAddApp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ ...GLASS, borderRadius: 20, padding: 24, marginBottom: 24, border: '1px solid rgba(232,33,39,0.2)' }}
              >
                <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#e4e4e7' }}>
                  <Icon name="work" size={16} style={{ color: '#E82127' }} />
                  Add Application
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {[
                    { value: newApp.company, placeholder: 'Company name', onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewApp((p) => ({ ...p, company: e.target.value })) },
                    { value: newApp.role, placeholder: 'Role title', onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewApp((p) => ({ ...p, role: e.target.value })) },
                    { value: newApp.nextStep, placeholder: 'Next step (e.g. OA, Phone Screen)', onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNewApp((p) => ({ ...p, nextStep: e.target.value })) },
                  ].map((field) => (
                    <input
                      key={field.placeholder}
                      type="text"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={field.placeholder}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', fontSize: 14, color: '#e4e4e7', outline: 'none' }}
                    />
                  ))}
                  <select
                    value={newApp.status}
                    onChange={(e) => setNewApp((p) => ({ ...p, status: e.target.value as Application['status'] }))}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', fontSize: 14, color: '#e4e4e7', outline: 'none' }}
                  >
                    {Object.entries(APP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input
                    type="date"
                    value={newApp.nextStepDate}
                    onChange={(e) => setNewApp((p) => ({ ...p, nextStepDate: e.target.value }))}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', fontSize: 14, color: '#e4e4e7', outline: 'none' }}
                    className="md:col-span-2"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button onClick={() => setShowAddApp(false)} style={{ fontSize: 14, color: '#71717a', padding: '8px 16px', borderRadius: 999, background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                  <motion.button
                    onClick={addApplication}
                    disabled={addingApp || !newApp.company || !newApp.role}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '8px 20px', borderRadius: 999, fontSize: 14, cursor: 'pointer', opacity: (addingApp || !newApp.company || !newApp.role) ? 0.4 : 1 }}
                  >
                    {addingApp ? 'Adding...' : 'Add Application'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {filteredApps.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
                <Icon name="work_outline" size={48} style={{ color: '#3f3f46', marginBottom: 16 }} />
                <p style={{ fontWeight: 700, color: '#a1a1aa', marginBottom: 8 }}>No applications tracked yet</p>
                <p style={{ fontSize: 14, color: '#71717a' }}>Track every application to stay organized and never miss a follow-up.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app, i) => {
                  const status = APP_STATUS[app.status];
                  return (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ ...GLASS, borderRadius: 14, padding: '20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontWeight: 700, color: '#e4e4e7' }}>{app.company}</p>
                          <span style={{ color: '#52525b' }}>·</span>
                          <p style={{ fontSize: 14, color: '#a1a1aa' }}>{app.role}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#71717a', flexWrap: 'wrap' as const }}>
                          <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                          {app.nextStep && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="schedule" size={11} />
                              {app.nextStep}{app.nextStepDate ? ` · ${new Date(app.nextStepDate).toLocaleDateString()}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <select
                        value={app.status}
                        onChange={(e) => updateAppStatus(app.id, e.target.value as Application['status'])}
                        style={{ fontSize: 10, fontWeight: 700, padding: '6px 12px', borderRadius: 999, border: `1px solid ${status.color}40`, background: status.bg, color: status.color, cursor: 'pointer', outline: 'none' }}
                      >
                        {Object.entries(APP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Companies */}
        {activeTab === 'companies' && (
          <div>
            <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 24 }}>
              Click any company to see a tailored guide: interview process, key DSA topics, culture tips, and insider prep advice.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {COMPANIES.map((c, i) => {
                const diff = DIFF_COLOR[c.difficulty] ?? DIFF_COLOR['Medium'];
                return (
                  <motion.button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedCompany(c)}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{ ...GLASS, borderRadius: 16, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'center' }}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                      {c.logo}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: '#e4e4e7', fontSize: 14, marginBottom: 2 }}>{c.name}</p>
                      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: diff.color }}>{c.difficulty}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#52525b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                      <Icon name="menu_book" size={11} />
                      {c.process.length} rounds · {c.prepWeeks}w prep
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Quick overview strip */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ ...GLASS, borderRadius: 20, padding: 24, marginTop: 32 }}
            >
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#52525b', marginBottom: 16 }}>Quick Comparison</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Company', 'Difficulty', 'Rounds', 'Prep (weeks)'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', color: '#52525b', fontWeight: 700, paddingBottom: 8, paddingRight: 16 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPANIES.map((c) => {
                      const diff = DIFF_COLOR[c.difficulty] ?? DIFF_COLOR['Medium'];
                      return (
                        <tr
                          key={c.name}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                          onClick={() => setSelectedCompany(c)}
                        >
                          <td style={{ padding: '8px 16px 8px 0', fontWeight: 700, color: '#e4e4e7' }}>{c.name}</td>
                          <td style={{ padding: '8px 16px 8px 0', fontWeight: 700, color: diff.color }}>{c.difficulty}</td>
                          <td style={{ padding: '8px 16px 8px 0', color: '#a1a1aa' }}>{c.process.length}</td>
                          <td style={{ padding: '8px 0', color: '#a1a1aa' }}>{c.prepWeeks}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'india' && (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 24, padding: 20, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>🇮🇳</span>
                <h2 style={{ fontWeight: 900, color: '#fbbf24' }}>India Service Company Placement Prep</h2>
              </div>
              <p style={{ fontSize: 14, color: '#a1a1aa' }}>TCS, Infosys, Wipro, Accenture hire 50,000+ freshers per year. The patterns are predictable — learn them and clear the OA on your first attempt.</p>
            </motion.div>

            {selectedServiceCo ? (
              <div>
                <button
                  onClick={() => setSelectedServiceCo(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#71717a', fontSize: 14, marginBottom: 20, background: 'transparent', cursor: 'pointer' }}
                >
                  <Icon name="arrow_back" size={16} /> Back to all companies
                </button>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gradient-to-r ${selectedServiceCo.color} rounded-2xl`}
                  style={{ padding: 20, marginBottom: 20 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 }}>
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{selectedServiceCo.name}</h2>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 2 }}>{selectedServiceCo.tagline}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Avg CTC (Fresher)</p>
                      <p style={{ color: '#fff', fontWeight: 900 }}>{selectedServiceCo.ctc}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 12, display: 'inline-block' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Test Platform</p>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{selectedServiceCo.testPlatform}</p>
                  </div>
                </motion.div>

                {/* OA sections */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b', marginBottom: 16 }}>Online Assessment Sections</p>
                  <div className="space-y-3">
                    {selectedServiceCo.sections.map((section, i) => (
                      <motion.div
                        key={section.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{ ...GLASS, borderRadius: 14, padding: 16 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap' as const, gap: 8 }}>
                          <h3 style={{ fontWeight: 700, color: '#fff' }}>{section.name}</h3>
                          <div style={{ display: 'flex', gap: 12, fontSize: 10, fontWeight: 700, color: '#71717a', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                            <span>{section.questions} questions</span>
                            <span>·</span>
                            <span>{section.time}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                          {section.topics.map((t) => (
                            <span key={t} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12, color: '#d4d4d8' }}>{t}</span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...GLASS, borderRadius: 14, padding: 20 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fbbf24', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="tips_and_updates" size={12} /> Prep Tips
                    </p>
                    <ul className="space-y-2">
                      {selectedServiceCo.aptitudeTips.map((tip, i) => (
                        <li key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#a1a1aa' }}>
                          <span style={{ color: '#fbbf24', fontWeight: 900, flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ ...GLASS, borderRadius: 14, padding: 20 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60a5fa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="code" size={12} /> Technical Interview Topics
                    </p>
                    <ul className="space-y-2">
                      {selectedServiceCo.technicalTopics.map((t) => (
                        <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#a1a1aa' }}>
                          <Icon name="arrow_right" size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ ...GLASS, borderRadius: 14, padding: 20, marginBottom: 20 }}
                >
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c084fc', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="record_voice_over" size={12} /> Common HR Questions
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                    {selectedServiceCo.hrQuestions.map((q) => (
                      <span key={q} style={{ padding: '6px 12px', background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.2)', borderRadius: 8, fontSize: 12, color: '#c084fc' }}>{q}</span>
                    ))}
                  </div>
                </motion.div>

                {selectedServiceCo.certifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 14, padding: 16 }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="verified" size={12} /> Recommended Certifications
                    </p>
                    <p style={{ fontSize: 14, color: '#a1a1aa' }}>{selectedServiceCo.certifications}</p>
                  </motion.div>
                )}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SERVICE_COMPANIES.map((co, i) => (
                    <motion.button
                      key={co.name}
                      type="button"
                      onClick={() => setSelectedServiceCo(co)}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-20px' }}
                      transition={{ delay: i * 0.07 }}
                      whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                      whileTap={{ scale: 0.97 }}
                      style={{ ...GLASS, borderRadius: 20, padding: 20, textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${co.color} flex items-center justify-center text-white font-black text-xs shadow-lg`}>
                          {co.logo}
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 900, color: '#fff' }}>{co.name}</h3>
                          <p style={{ fontSize: 10, fontWeight: 700, color: '#52525b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Service Company</p>
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: '#71717a', marginBottom: 12, lineHeight: 1.6 }}>{co.tagline}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80' }}>{co.ctc}</span>
                        <span style={{ fontSize: 10, color: '#52525b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {co.sections.length} sections <Icon name="arrow_forward" size={10} />
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  style={{ ...GLASS, borderRadius: 20, padding: 24, marginTop: 32 }}
                >
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#52525b', marginBottom: 16 }}>Universal Service Company Tips</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: 'timer', color: '#60a5fa', tip: 'Time management beats perfection — 60% accuracy with full attempt beats 80% accuracy with 30% skipped' },
                      { icon: 'book', color: '#4ade80', tip: 'Verbal is the most neglected section. 10 min of RC daily = top 20% automatically' },
                      { icon: 'psychology', color: '#c084fc', tip: 'Aptitude patterns repeat year to year — use previous year papers for TCS/Wipro' },
                      { icon: 'verified', color: '#fbbf24', tip: 'Platform certifications (InfyTQ, TCS iON) act as pre-filters — complete them before applying' },
                    ].map((item) => (
                      <div key={item.icon} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 16 }}>
                        <Icon name={item.icon} size={18} style={{ color: item.color, flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6 }}>{item.tip}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
