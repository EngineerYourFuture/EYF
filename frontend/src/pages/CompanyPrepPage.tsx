import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CompanyTopic {
  category: string;
  items: string[];
}

interface CompanyProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;
  frequency: 'very-high' | 'high' | 'medium';
}

interface CompanyData {
  id: string;
  name: string;
  logo: string;
  color: string;
  gradient: string;
  roles: string[];
  interviewRounds: string[];
  focusTopics: CompanyTopic[];
  topProblems: CompanyProblem[];
  tips: string[];
  ctc: { intern: string; sde1: string; sde2: string };
  difficulty: 1 | 2 | 3 | 4 | 5;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const COMPANIES: CompanyData[] = [
  {
    id: 'google',
    name: 'Google',
    logo: 'G',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-green-500/20',
    roles: ['SWE', 'SWE II', 'Senior SWE', 'Staff SWE', 'L3–L7'],
    interviewRounds: ['Online Assessment', 'Phone Screen', '5× Onsite (DSA + System Design + Behavioral)'],
    difficulty: 5,
    ctc: { intern: '₹1.5L/mo', sde1: '₹40–55 LPA', sde2: '₹70–100 LPA' },
    focusTopics: [
      {
        category: 'DSA',
        items: ['Graphs (BFS/DFS/Dijkstra)', 'Dynamic Programming', 'Trees & BST', 'Sliding Window', 'Intervals', 'Backtracking'],
      },
      {
        category: 'System Design',
        items: ['Google Search', 'YouTube (scale)', 'Maps / Routing', 'Distributed Storage (GFS, Bigtable)', 'Rate Limiting'],
      },
      {
        category: 'Concepts',
        items: ['Scalability & CAP theorem', 'Consistent hashing', 'MapReduce', 'Spanner / TrueTime', 'Borg / Kubernetes'],
      },
    ],
    topProblems: [
      { id: 'word-ladder',           title: 'Word Ladder',                    difficulty: 'hard',   pattern: 'BFS',              frequency: 'very-high' },
      { id: 'alien-dictionary',      title: 'Alien Dictionary',               difficulty: 'hard',   pattern: 'Topological Sort',  frequency: 'very-high' },
      { id: 'lru-cache',             title: 'LRU Cache',                      difficulty: 'medium', pattern: 'Design',            frequency: 'very-high' },
      { id: 'minimum-window',        title: 'Minimum Window Substring',       difficulty: 'hard',   pattern: 'Sliding Window',    frequency: 'high' },
      { id: 'meeting-rooms-ii',      title: 'Meeting Rooms II',               difficulty: 'medium', pattern: 'Intervals/Heap',    frequency: 'high' },
      { id: 'decode-ways',           title: 'Decode Ways',                    difficulty: 'medium', pattern: 'Dynamic Programming', frequency: 'high' },
    ],
    tips: [
      'Google values algorithmic elegance — avoid brute force even if asked to start there',
      'Always analyze time and space complexity unprompted',
      'System design: think at Google scale (billions of users), mention Bigtable/Spanner',
      'Behavioral: use STAR format, relate to Google\'s principles (user focus, think big)',
      'Expect follow-ups on every solution — optimize, handle edge cases, scale it',
    ],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'A',
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-orange-500/20',
    roles: ['SDE I', 'SDE II', 'SDE III', 'Principal SDE'],
    interviewRounds: ['Online Assessment (2 DSA + Work Simulation)', '4–5× Interviews (DSA + System Design + LP×2)'],
    difficulty: 4,
    ctc: { intern: '₹1L/mo', sde1: '₹30–50 LPA', sde2: '₹55–80 LPA' },
    focusTopics: [
      {
        category: 'DSA',
        items: ['Arrays & Strings', 'Linked Lists', 'Trees', 'Heap / Priority Queue', 'Graphs', 'Two Pointers'],
      },
      {
        category: 'System Design',
        items: ['Amazon S3 (object storage)', 'Order Management System', 'Recommendation Engine', 'Notification Service', 'API Gateway'],
      },
      {
        category: 'Leadership Principles',
        items: ['Customer Obsession', 'Ownership', 'Bias for Action', 'Dive Deep', 'Deliver Results', 'Think Big'],
      },
    ],
    topProblems: [
      { id: 'top-k-frequent',        title: 'Top K Frequent Elements',        difficulty: 'medium', pattern: 'Heap',              frequency: 'very-high' },
      { id: 'lru-cache',             title: 'LRU Cache',                      difficulty: 'medium', pattern: 'Design',            frequency: 'very-high' },
      { id: 'course-schedule',       title: 'Course Schedule',                difficulty: 'medium', pattern: 'Topological Sort',  frequency: 'high' },
      { id: 'word-search',           title: 'Word Search II',                 difficulty: 'hard',   pattern: 'Backtracking/Trie', frequency: 'high' },
      { id: 'max-profit',            title: 'Best Time to Buy and Sell Stock',difficulty: 'easy',   pattern: 'Greedy/DP',         frequency: 'very-high' },
      { id: 'merge-intervals',       title: 'Merge Intervals',                difficulty: 'medium', pattern: 'Intervals',         frequency: 'high' },
    ],
    tips: [
      'Amazon weights LP (Leadership Principles) heavily — prepare 2+ stories per principle',
      'OA: solve both problems fast; work simulation tests judgment not code',
      'Mention AWS services naturally in system design (SQS, S3, DynamoDB, Lambda)',
      'Dive Deep: be ready to defend every decision with data or reasoning',
      'Ownership: describe times you fixed something beyond your scope',
    ],
  },
  {
    id: 'meta',
    name: 'Meta',
    logo: 'M',
    color: 'text-blue-500',
    gradient: 'from-blue-600/20 to-indigo-500/20',
    roles: ['E3', 'E4', 'E5', 'E6', 'E7 (Staff)'],
    interviewRounds: ['Technical Screen (45 min DSA)', '2× Coding + 1× System Design + 1× Behavioral'],
    difficulty: 5,
    ctc: { intern: '₹1.8L/mo', sde1: '₹50–70 LPA', sde2: '₹80–120 LPA' },
    focusTopics: [
      {
        category: 'DSA',
        items: ['Graphs (social graph)', 'Trees', 'Dynamic Programming', 'String manipulation', 'BFS/DFS', 'Recursion'],
      },
      {
        category: 'System Design',
        items: ['News Feed', 'Instagram Stories', 'WhatsApp Messaging', 'Facebook Search', 'Ad Targeting System'],
      },
      {
        category: 'Concepts',
        items: ['Graph databases', 'Distributed caching', 'TAO (FB social graph store)', 'Real-time streaming', 'ML pipelines'],
      },
    ],
    topProblems: [
      { id: 'clone-graph',           title: 'Clone Graph',                    difficulty: 'medium', pattern: 'Graph/BFS',         frequency: 'very-high' },
      { id: 'number-of-islands',     title: 'Number of Islands',              difficulty: 'medium', pattern: 'DFS/BFS',           frequency: 'very-high' },
      { id: 'flatten-nested-list',   title: 'Flatten Nested List Iterator',   difficulty: 'medium', pattern: 'Design/Stack',       frequency: 'high' },
      { id: 'binary-tree-zigzag',    title: 'Binary Tree Zigzag Level Order', difficulty: 'medium', pattern: 'BFS',               frequency: 'high' },
      { id: 'next-permutation',      title: 'Next Permutation',               difficulty: 'medium', pattern: 'Array',             frequency: 'high' },
      { id: 'serialize-tree',        title: 'Serialize and Deserialize Binary Tree', difficulty: 'hard', pattern: 'Tree/DFS',   frequency: 'very-high' },
    ],
    tips: [
      'Meta cares about communication — narrate your thought process clearly throughout',
      'Code cleanly and handle edge cases without being asked',
      'System design: think about the social graph — TAO, distributed caching (Memcached), news feed fanout',
      'Behavioral: Meta values "Move Fast" — show you shipped things quickly and learned from failures',
      'Practice: Meta interviewers often push for the most optimal solution — prepare O(n log n) and O(n) variants',
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: '⊞',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    roles: ['SWE', 'SDE 59/60/61/62/63', 'Principal SDE', 'Partner'],
    interviewRounds: ['Phone Screen (DSA)', '4× Loop (DSA + System Design + Behavioral + PM-style)'],
    difficulty: 3,
    ctc: { intern: '₹90K/mo', sde1: '₹25–40 LPA', sde2: '₹45–70 LPA' },
    focusTopics: [
      {
        category: 'DSA',
        items: ['Arrays', 'Linked Lists', 'Trees & BST', 'Dynamic Programming', 'Strings', 'Hash Maps'],
      },
      {
        category: 'System Design',
        items: ['OneDrive (cloud storage)', 'Teams (video/chat)', 'Azure Service Bus', 'Search (Bing)', 'Xbox Live'],
      },
      {
        category: 'Concepts',
        items: ['OOP & Design Patterns', 'Agile/Scrum', 'Azure cloud services', '.NET / C# ecosystem', 'CI/CD pipelines'],
      },
    ],
    topProblems: [
      { id: 'reverse-linked-list',   title: 'Reverse Linked List',            difficulty: 'easy',   pattern: 'Linked List',       frequency: 'very-high' },
      { id: 'valid-parentheses',     title: 'Valid Parentheses',              difficulty: 'easy',   pattern: 'Stack',             frequency: 'very-high' },
      { id: 'level-order-traversal', title: 'Binary Tree Level Order',        difficulty: 'medium', pattern: 'BFS',               frequency: 'high' },
      { id: 'longest-substring',     title: 'Longest Substring Without Repeating', difficulty: 'medium', pattern: 'Sliding Window', frequency: 'high' },
      { id: 'lca-bst',               title: 'Lowest Common Ancestor of BST',  difficulty: 'medium', pattern: 'Tree',              frequency: 'high' },
      { id: 'spiral-matrix',         title: 'Spiral Matrix',                  difficulty: 'medium', pattern: 'Array',             frequency: 'medium' },
    ],
    tips: [
      'Microsoft values collaboration — show that you work well in teams',
      'DSA is medium difficulty — breadth over depth; cover fundamentals thoroughly',
      'OOP is important — be ready to design class hierarchies and apply SOLID',
      'Growth mindset: Microsoft loves "learn from failure" stories',
      'Azure knowledge is a differentiator but not required for most SDE roles',
    ],
  },
  {
    id: 'uber',
    name: 'Uber',
    logo: 'U',
    color: 'text-white',
    gradient: 'from-zinc-500/20 to-zinc-700/20',
    roles: ['SWE I', 'SWE II', 'Senior SWE', 'Staff SWE'],
    interviewRounds: ['HackerRank OA', 'Technical Phone Screen', '4–5× Onsite (DSA + System Design + Behavioral)'],
    difficulty: 4,
    ctc: { intern: '₹1.2L/mo', sde1: '₹35–55 LPA', sde2: '₹60–90 LPA' },
    focusTopics: [
      {
        category: 'DSA',
        items: ['Graphs (maps/routing)', 'Heap/Priority Queue', 'Sliding Window', 'Intervals', 'Sorting', 'Hash Maps'],
      },
      {
        category: 'System Design',
        items: ['Ride Sharing (Uber core)', 'Real-time GPS tracking', 'Surge Pricing', 'Payment System', 'Notification at Scale'],
      },
      {
        category: 'Concepts',
        items: ['Geospatial indexing (geohash, QuadTree)', 'Real-time streaming', 'Event-driven architecture', 'Redis + Kafka'],
      },
    ],
    topProblems: [
      { id: 'meeting-rooms-ii',      title: 'Meeting Rooms II',               difficulty: 'medium', pattern: 'Intervals/Heap',    frequency: 'very-high' },
      { id: 'top-k-frequent',        title: 'Top K Frequent Words',           difficulty: 'medium', pattern: 'Heap',              frequency: 'high' },
      { id: 'skyline-problem',       title: 'The Skyline Problem',            difficulty: 'hard',   pattern: 'Divide & Conquer',  frequency: 'high' },
      { id: 'network-delay',         title: 'Network Delay Time (Dijkstra)',  difficulty: 'medium', pattern: 'Shortest Path',     frequency: 'high' },
      { id: 'max-profit',            title: 'Stock Buy & Sell (K transactions)', difficulty: 'hard', pattern: 'DP',               frequency: 'medium' },
      { id: 'sliding-window-max',    title: 'Sliding Window Maximum',         difficulty: 'hard',   pattern: 'Deque',             frequency: 'high' },
    ],
    tips: [
      'Uber heavily tests geo/location problems — practice Dijkstra, geohash, nearest-neighbor',
      'System design: design Uber itself — show you understand geospatial matching and surge',
      'Real-time systems: know WebSockets, Redis Pub/Sub, Kafka for location tracking',
      'Cultural fit: show you can move fast without breaking things (safety-critical context)',
      'Know Redis GEORADIUS command — it\'s central to Uber\'s architecture',
    ],
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    logo: 'F',
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-amber-500/20',
    roles: ['SDE I', 'SDE II', 'SDE III', 'Senior SDE'],
    interviewRounds: ['Online Test (DSA + MCQ)', '2–3× Technical (DSA)', '1× System Design', '1× Managerial'],
    difficulty: 3,
    ctc: { intern: '₹80K/mo', sde1: '₹20–35 LPA', sde2: '₹35–60 LPA' },
    focusTopics: [
      {
        category: 'DSA',
        items: ['Arrays & Strings', 'Sorting & Searching', 'Trees', 'Dynamic Programming', 'Greedy', 'Recursion'],
      },
      {
        category: 'System Design',
        items: ['E-commerce Cart & Checkout', 'Product Catalog Search', 'Inventory Management', 'Flash Sale System', 'Recommendation Engine'],
      },
      {
        category: 'Concepts',
        items: ['OOP & design patterns', 'SQL & NoSQL trade-offs', 'Microservices', 'Event-driven (Kafka)', 'Redis caching patterns'],
      },
    ],
    topProblems: [
      { id: 'two-sum',               title: 'Two Sum (and variants)',          difficulty: 'easy',   pattern: 'Hash Map',          frequency: 'very-high' },
      { id: 'trapping-rain-water',   title: 'Trapping Rain Water',            difficulty: 'hard',   pattern: 'Two Pointers/DP',   frequency: 'high' },
      { id: 'kth-largest',           title: 'Kth Largest Element',            difficulty: 'medium', pattern: 'Heap/Quickselect',  frequency: 'high' },
      { id: 'max-product-subarray',  title: 'Maximum Product Subarray',       difficulty: 'medium', pattern: 'Dynamic Programming', frequency: 'high' },
      { id: 'rotated-array',         title: 'Search in Rotated Sorted Array', difficulty: 'medium', pattern: 'Binary Search',     frequency: 'very-high' },
      { id: 'word-break',            title: 'Word Break',                     difficulty: 'medium', pattern: 'DP/BFS',            frequency: 'medium' },
    ],
    tips: [
      'Flipkart focuses on clean, working code — test your solution with examples before submitting',
      'E-commerce domain knowledge helps — think inventory, cart, flash sales in system design',
      'Managerial round: show leadership, conflict resolution, ownership of past projects',
      'OOP design (shopping cart, library management) is frequently asked',
      'Difficulty is moderate — solid fundamentals beat clever tricks here',
    ],
  },
  {
    id: 'adobe',
    name: 'Adobe',
    logo: 'Ai',
    color: 'text-red-500',
    gradient: 'from-red-500/20 to-orange-500/20',
    roles: ['MTS I/II', 'Computer Scientist I/II/III', 'Senior'],
    interviewRounds: ['Online Coding', '3–4× Technical (DSA + Design)', '1× Managerial/HR'],
    difficulty: 3,
    ctc: { intern: '₹85K/mo', sde1: '₹22–38 LPA', sde2: '₹40–65 LPA' },
    focusTopics: [
      {
        category: 'DSA',
        items: ['Arrays & Strings', 'Trees', 'Graphs', 'Sorting', 'Backtracking', 'Dynamic Programming'],
      },
      {
        category: 'System Design',
        items: ['Adobe Creative Cloud Sync', 'PDF rendering engine', 'Collaborative editing (Google Docs-style)', 'CDN for assets', 'Analytics pipeline'],
      },
      {
        category: 'Concepts',
        items: ['OOP & Design Patterns', 'Multithreading/Concurrency', 'REST API design', 'Cloud storage (S3)', 'Image processing pipelines'],
      },
    ],
    topProblems: [
      { id: 'find-peak-element',     title: 'Find Peak Element',              difficulty: 'medium', pattern: 'Binary Search',     frequency: 'high' },
      { id: 'subsets',               title: 'Subsets',                        difficulty: 'medium', pattern: 'Backtracking',      frequency: 'high' },
      { id: 'matrix-zeroes',         title: 'Set Matrix Zeroes',              difficulty: 'medium', pattern: 'Array',             frequency: 'high' },
      { id: 'clone-graph',           title: 'Clone Graph',                    difficulty: 'medium', pattern: 'Graph',             frequency: 'high' },
      { id: 'decode-string',         title: 'Decode String',                  difficulty: 'medium', pattern: 'Stack',             frequency: 'high' },
      { id: 'lca-binary-tree',       title: 'LCA of Binary Tree',             difficulty: 'medium', pattern: 'Tree/DFS',          frequency: 'very-high' },
    ],
    tips: [
      'Adobe values clean, well-structured code — OOP skills matter a lot',
      'Design patterns are frequently tested (Factory, Observer, Strategy, Singleton)',
      'Concurrency questions appear often — producer-consumer, thread pools',
      'Creative Cloud context: think about file sync, conflict resolution, version history',
      'Interviews are friendly; communicate clearly and ask clarifying questions',
    ],
  },
  {
    id: 'atlassian',
    name: 'Atlassian',
    logo: 'At',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-teal-500/20',
    roles: ['SWE I/II', 'Senior SWE', 'Principal SWE', 'Staff SWE'],
    interviewRounds: ['HackerRank OA', 'Karat Interview (automated)', '3× Technical + 1× Values'],
    difficulty: 3,
    ctc: { intern: '₹80K/mo', sde1: '₹22–40 LPA', sde2: '₹45–70 LPA' },
    focusTopics: [
      {
        category: 'DSA',
        items: ['Graph traversal', 'Dynamic Programming', 'Trees', 'Strings', 'Recursion', 'Hash Maps'],
      },
      {
        category: 'System Design',
        items: ['Jira (issue tracker at scale)', 'Confluence (wiki)', 'Bitbucket (Git hosting)', 'Real-time collaboration', 'Plugin/extension marketplace'],
      },
      {
        category: 'Concepts',
        items: ['REST APIs & webhooks', 'Distributed systems', 'Microservices', 'Event sourcing', 'Developer tooling culture'],
      },
    ],
    topProblems: [
      { id: 'course-schedule',       title: 'Course Schedule (Topo Sort)',    difficulty: 'medium', pattern: 'Topological Sort',  frequency: 'high' },
      { id: 'clone-graph',           title: 'Clone Graph',                    difficulty: 'medium', pattern: 'Graph',             frequency: 'high' },
      { id: 'word-search',           title: 'Word Search',                    difficulty: 'medium', pattern: 'Backtracking',      frequency: 'medium' },
      { id: 'find-all-anagrams',     title: 'Find All Anagrams in a String',  difficulty: 'medium', pattern: 'Sliding Window',    frequency: 'high' },
      { id: 'jump-game-ii',          title: 'Jump Game II',                   difficulty: 'medium', pattern: 'Greedy',            frequency: 'medium' },
      { id: 'pacific-atlantic',      title: 'Pacific Atlantic Water Flow',    difficulty: 'medium', pattern: 'DFS/BFS',           frequency: 'high' },
    ],
    tips: [
      'Atlassian values open company culture — show genuine enthusiasm for dev tools',
      'The Karat interview is automated but human-reviewed — speak your thinking aloud clearly',
      'Values interview: Atlassian cares about "Teamwork", "Open company", "Build with heart and balance"',
      'System design: Jira at scale is a great prep problem — multi-tenant, plugin architecture',
      'OA: read instructions carefully — Atlassian OA includes non-DSA problem-solving questions',
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FREQ_META = {
  'very-high': { label: 'Very High',  dot: 'bg-red-500',    text: 'text-red-400' },
  'high':      { label: 'High',       dot: 'bg-amber-400',  text: 'text-amber-400' },
  'medium':    { label: 'Medium',     dot: 'bg-blue-400',   text: 'text-blue-400' },
};

const DIFF_META = {
  easy:   { label: 'Easy',   cls: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' },
  medium: { label: 'Medium', cls: 'text-amber-400   border-amber-400/20   bg-amber-400/10' },
  hard:   { label: 'Hard',   cls: 'text-red-400     border-red-400/20     bg-red-400/10' },
};

function DifficultyStars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-xs ${i <= n ? 'text-amber-400' : 'text-zinc-700'}`}>★</span>
      ))}
    </div>
  );
}

// ─── Company Card ────────────────────────────────────────────────────────────

function CompanyCard({ company, selected, onSelect }: {
  company: CompanyData;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border transition-all ${
        selected
          ? 'bg-[#1f1f1f] border-white/20 shadow-lg'
          : 'bg-[#181818] border-white/5 hover:border-white/10 hover:bg-[#1a1a1a]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${company.gradient} flex items-center justify-center font-bold text-sm ${company.color} border border-white/10`}>
          {company.logo}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{company.name}</div>
          <DifficultyStars n={company.difficulty} />
        </div>
        {selected && <Icon name="check_circle" className="text-emerald-400 text-lg shrink-0" />}
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function CompanyDetail({ company }: { company: CompanyData }) {
  const [tab, setTab] = useState<'overview' | 'problems' | 'tips'>('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${company.gradient} rounded-2xl border border-white/10 p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-2xl bg-[#121212]/60 flex items-center justify-center font-bold text-lg ${company.color} border border-white/10`}>
                {company.logo}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{company.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <DifficultyStars n={company.difficulty} />
                  <span className="text-xs text-zinc-500">Interview difficulty</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {company.roles.map((r) => (
                <span key={r} className="text-[11px] bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full">{r}</span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Typical CTC</div>
            <div className="text-xs text-zinc-400">SDE I: <span className="text-white font-semibold">{company.ctc.sde1}</span></div>
            <div className="text-xs text-zinc-400">SDE II: <span className="text-white font-semibold">{company.ctc.sde2}</span></div>
            <div className="text-xs text-zinc-400">Intern: <span className="text-white font-semibold">{company.ctc.intern}</span></div>
          </div>
        </div>

        {/* Rounds */}
        <div className="mt-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Interview Rounds</div>
          <div className="flex flex-wrap gap-2">
            {company.interviewRounds.map((r) => (
              <span key={r} className="text-xs bg-black/30 text-zinc-300 px-3 py-1 rounded-full border border-white/10">{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#181818] rounded-xl p-1 border border-white/5">
        {(['overview', 'problems', 'tips'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
              tab === t ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'overview' ? 'Focus Topics' : t === 'problems' ? 'Top Problems' : 'Tips'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {company.focusTopics.map((section) => (
            <div key={section.category} className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-4">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">{section.category}</div>
              <div className="flex flex-wrap gap-2">
                {section.items.map((item) => (
                  <span key={item} className="text-xs bg-white/5 text-zinc-300 px-3 py-1.5 rounded-full border border-white/10">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'problems' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-[#E82127] bg-[#E82127]/10 px-2 py-0.5 rounded-full border border-[#E82127]/20">
              FREE on EYF · Company-filtered problems are paywalled on LeetCode
            </span>
          </div>
          {company.topProblems.map((prob, i) => {
            const dm = DIFF_META[prob.difficulty];
            const fm = FREQ_META[prob.frequency];
            return (
              <Link
                key={prob.id}
                to="/app/problems"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1a] border border-white/5 hover:border-white/10 hover:bg-[#202020] transition-all group"
              >
                <span className="text-zinc-600 text-xs w-5 shrink-0">{i + 1}.</span>
                <span className="flex-1 text-sm text-zinc-200 group-hover:text-white transition-colors">{prob.title}</span>
                <span className="text-[10px] text-zinc-500">{prob.pattern}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${dm.cls}`}>{dm.label}</span>
                <div className="flex items-center gap-1.5 w-20 justify-end">
                  <span className={`w-1.5 h-1.5 rounded-full ${fm.dot}`} />
                  <span className={`text-[10px] ${fm.text}`}>{fm.label}</span>
                </div>
              </Link>
            );
          })}
          <Link
            to="/app/problems"
            className="block text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors pt-2"
          >
            View all problems with {company.name} filter →
          </Link>
        </div>
      )}

      {tab === 'tips' && (
        <div className="space-y-3">
          {company.tips.map((tip, i) => (
            <div key={i} className="flex gap-3 p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
              <Icon name="lightbulb" className="text-amber-400 text-lg shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-300 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function CompanyPrepPage() {
  const [selectedId, setSelectedId] = useState<string>('google');
  const selected = COMPANIES.find((c) => c.id === selectedId) ?? COMPANIES[0];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Company-Specific Prep</h1>
          <p className="text-sm text-zinc-500">
            Tailored prep for top companies — focus topics, most-asked problems, interview rounds, tips, and CTC data.
            <span className="ml-2 text-[10px] font-bold text-[#E82127] bg-[#E82127]/10 px-2 py-0.5 rounded-full border border-[#E82127]/20">
              FREE · Company-filtered problems are ₹2500/mo on LeetCode
            </span>
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar: company list */}
          <div className="lg:w-52 shrink-0">
            <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-3 px-1">Select Company</div>
            <div className="space-y-2">
              {COMPANIES.map((c) => (
                <CompanyCard
                  key={c.id}
                  company={c}
                  selected={c.id === selectedId}
                  onSelect={() => setSelectedId(c.id)}
                />
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className="flex-1 min-w-0">
            <CompanyDetail company={selected} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
