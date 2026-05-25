import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

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
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(74,222,128,0.2))',
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
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(249,115,22,0.2))',
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
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(99,102,241,0.2))',
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
    color: '#22d3ee',
    gradient: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))',
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
    color: 'var(--t1)',
    gradient: 'linear-gradient(135deg, rgba(113,113,122,0.2), rgba(63,63,70,0.2))',
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
    color: '#facc15',
    gradient: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(245,158,11,0.2))',
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
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(249,115,22,0.2))',
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
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(20,184,166,0.2))',
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
  'very-high': { label: 'Very High',  dot: '#ef4444',  color: '#f87171' },
  'high':      { label: 'High',       dot: '#fbbf24',  color: '#fbbf24' },
  'medium':    { label: 'Medium',     dot: '#60a5fa',  color: '#60a5fa' },
};

const DIFF_META = {
  easy:   { label: 'Easy',   color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)' },
  medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' },
  hard:   { label: 'Hard',   color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)' },
};

function DifficultyStars({ n }: { readonly n: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 12, color: i <= n ? '#fbbf24' : '#3f3f46' }}>★</span>
      ))}
    </div>
  );
}

// ─── Company Card ────────────────────────────────────────────────────────────

function CompanyCard({ company, selected, onSelect }: {
  readonly company: CompanyData;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={selected ? {
        width: '100%', textAlign: 'left', padding: 16, borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', cursor: 'pointer',
      } : {
        width: '100%', textAlign: 'left', padding: 16, borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: company.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: company.color, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          {company.logo}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{company.name}</div>
          <DifficultyStars n={company.difficulty} />
        </div>
        {selected && <Icon name="check_circle" style={{ color: '#34d399', fontSize: 20, flexShrink: 0 }} />}
      </div>
    </motion.button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function CompanyDetail({ company }: { readonly company: CompanyData }) {
  const [tab, setTab] = useState<'overview' | 'problems' | 'tips'>('overview');
  const TAB_LABELS: Record<string, string> = { overview: 'Focus Topics', problems: 'Top Problems', tips: 'Tips' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        key={company.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: company.gradient, borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: company.color, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                {company.logo}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{company.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <DifficultyStars n={company.difficulty} />
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>Interview difficulty</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
              {company.roles.map((r) => (
                <span key={r} style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', color: '#d4d4d8', padding: '2px 8px', borderRadius: 999 }}>{r}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Typical CTC</div>
            <div style={{ fontSize: 12, color: 'var(--t2)' }}>SDE I: <span style={{ color: '#fff', fontWeight: 600 }}>{company.ctc.sde1}</span></div>
            <div style={{ fontSize: 12, color: 'var(--t2)' }}>SDE II: <span style={{ color: '#fff', fontWeight: 600 }}>{company.ctc.sde2}</span></div>
            <div style={{ fontSize: 12, color: 'var(--t2)' }}>Intern: <span style={{ color: '#fff', fontWeight: 600 }}>{company.ctc.intern}</span></div>
          </div>
        </div>

        {/* Rounds */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Interview Rounds</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {company.interviewRounds.map((r) => (
              <span key={r} style={{ fontSize: 12, background: 'rgba(0,0,0,0.3)', color: '#d4d4d8', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)' }}>{r}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['overview', 'problems', 'tips'] as const).map((t) => (
          <motion.button
            key={t}
            onClick={() => setTab(t)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={tab === t ? {
              flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer',
            } : {
              flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'transparent', color: 'var(--t3)', cursor: 'pointer',
            }}
          >
            {TAB_LABELS[t]}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {company.focusTopics.map((section) => (
              <div key={section.category} style={{ ...GLASS, borderRadius: 20, padding: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{section.category}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                  {section.items.map((item) => (
                    <span key={item} style={{ fontSize: 12, background: 'rgba(255,255,255,0.05)', color: '#d4d4d8', padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)' }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'problems' && (
          <motion.div key="problems" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#E82127', background: 'rgba(232,33,39,0.1)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(232,33,39,0.2)' }}>
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
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none' }}
                >
                  <span style={{ color: 'var(--t4)', fontSize: 12, width: 20, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ flex: 1, fontSize: 14, color: 'var(--t1)' }}>{prob.title}</span>
                  <span style={{ fontSize: 10, color: 'var(--t3)' }}>{prob.pattern}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, border: `1px solid ${dm.border}`, background: dm.bg, color: dm.color }}>{dm.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 80, justifyContent: 'flex-end' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: fm.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: fm.color }}>{fm.label}</span>
                  </div>
                </Link>
              );
            })}
            <Link
              to="/app/problems"
              style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'var(--t3)', paddingTop: 8, textDecoration: 'none' }}
            >
              View all problems with {company.name} filter →
            </Link>
          </motion.div>
        )}

        {tab === 'tips' && (
          <motion.div key="tips" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {company.tips.map((tip, i) => (
              <motion.div
                key={tip}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', gap: 12, padding: 16, ...GLASS, borderRadius: 14 }}
              >
                <Icon name="lightbulb" style={{ color: '#fbbf24', fontSize: 20, flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.6 }}>{tip}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1 }}>
            <span style={{ background: 'linear-gradient(135deg, #fff 40%, #E82127)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>COMPANY PREP.</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            Tailored prep for top companies — focus topics, most-asked problems, interview rounds, tips, and CTC data.
            <span style={{ fontSize: 10, fontWeight: 700, color: '#E82127', background: 'rgba(232,33,39,0.1)', padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(232,33,39,0.2)' }}>
              FREE · Company-filtered problems are ₹2500/mo on LeetCode
            </span>
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar: company list */}
          <div className="lg:w-52 shrink-0">
            <div style={{ fontSize: 10, color: 'var(--t4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 }}>Select Company</div>
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
