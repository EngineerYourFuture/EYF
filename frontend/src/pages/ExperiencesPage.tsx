import { useState, useMemo } from 'react';
import { AppShell } from '../components/AppShell';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Experience {
  id: string;
  company: string;
  role: string;
  level: 'intern' | 'junior' | 'mid' | 'senior' | 'staff';
  outcome: 'offer' | 'rejected' | 'withdrew' | 'oa-only';
  ctc?: string;
  location: string;
  date: string; // YYYY-MM
  rounds: Round[];
  tips: string[];
  author: string;
  upvotes: number;
  tags: string[];
}

interface Round {
  type: 'online-assessment' | 'technical' | 'system-design' | 'behavioral' | 'hr' | 'take-home';
  label: string;
  questions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  notes?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const EXPERIENCES: Experience[] = [
  {
    id: 'exp1',
    company: 'Google',
    role: 'Software Engineer L4',
    level: 'mid',
    outcome: 'offer',
    ctc: '₹45 LPA',
    location: 'Bengaluru',
    date: '2025-11',
    upvotes: 342,
    author: 'Arjun K.',
    tags: ['DSA', 'System Design', 'Behavioral'],
    rounds: [
      {
        type: 'online-assessment',
        label: 'OA — Kick Start Round',
        questions: [
          'Minimum number of operations to make array sorted',
          'Count subarrays with product < k',
        ],
        difficulty: 'medium',
        notes: '90-minute timed contest format. Two algorithmic problems, scoring partial points for passing test cases.',
      },
      {
        type: 'technical',
        label: 'Technical Round 1 — DSA',
        questions: [
          'Given a string, find all palindromic substrings. Return count.',
          'Follow-up: What if the string is a billion characters? How do you handle streaming input?',
        ],
        difficulty: 'medium',
        notes: 'Interviewer wanted a clean O(n²) DP solution first, then asked about Manacher\'s Algorithm. Talked through space-time tradeoffs extensively.',
      },
      {
        type: 'technical',
        label: 'Technical Round 2 — DSA',
        questions: [
          'Design a data structure that supports: insert(val), delete(val), getRandom() — all O(1)',
          'Word Search II — find all words from a dictionary that can be formed in a board',
        ],
        difficulty: 'hard',
        notes: 'First question: HashSet + ArrayList combo. Second: Trie + backtracking. Had 10 minutes left — used it to optimize.',
      },
      {
        type: 'system-design',
        label: 'System Design — Design Google Docs',
        questions: ['Design a collaborative real-time document editing system (Google Docs)'],
        difficulty: 'hard',
        notes: 'Covered: OT (Operational Transformation) vs CRDT for conflict resolution, WebSocket for real-time sync, document versioning, sharding by document ID, permission model.',
      },
      {
        type: 'behavioral',
        label: 'Googliness + Leadership',
        questions: [
          'Tell me about a time you had a significant disagreement with a colleague. How was it resolved?',
          'Describe a project where you had to influence without authority.',
        ],
        difficulty: 'medium',
        notes: 'Very conversational. They probe for specific examples — don\'t give generic answers.',
      },
    ],
    tips: [
      'Google cares deeply about code quality — clean variable names, edge cases, and complexity analysis',
      'Practice writing code on a whiteboard / plain doc editor — no autocomplete',
      'For System Design, drive the conversation — don\'t wait for prompts. Show structured thinking: requirements → capacity → high-level design → deep dive',
      'Googliness questions are real — they look for intellectual humility and collaborative mindset',
      'LeetCode hard is the bar for R2. Do 30+ hards before interviewing',
    ],
  },
  {
    id: 'exp2',
    company: 'Amazon',
    role: 'SDE-2',
    level: 'mid',
    outcome: 'offer',
    ctc: '₹38 LPA',
    location: 'Hyderabad',
    date: '2025-10',
    upvotes: 289,
    author: 'Priya S.',
    tags: ['DSA', 'Behavioral', 'Leadership Principles'],
    rounds: [
      {
        type: 'online-assessment',
        label: 'OA — HackerRank',
        questions: [
          'Number of ways to fill a grid with specific constraints (DP)',
          'Find the minimum cost path in a graph with obstacles',
          'Work simulation: debug faulty code, prioritize tasks',
        ],
        difficulty: 'medium',
        notes: '105 minutes total. The work simulation section surprises people — it\'s about prioritization decisions, not coding.',
      },
      {
        type: 'technical',
        label: 'Technical Round 1',
        questions: [
          'Design a function to flatten a nested dictionary (any depth)',
          'Given a matrix of 0s and 1s, find the largest rectangle of 1s',
        ],
        difficulty: 'hard',
        notes: 'Second question is LeetCode 85. Had to recall the histogram stack approach. Interviewer was patient.',
      },
      {
        type: 'technical',
        label: 'Technical Round 2',
        questions: [
          'Rate Limiter: implement a sliding window rate limiter',
          'LRU Cache implementation',
        ],
        difficulty: 'medium',
        notes: 'Focused on scalable implementations. For rate limiter: asked about distributed scenario → Redis with Lua script.',
      },
      {
        type: 'behavioral',
        label: 'Bar Raiser',
        questions: [
          'Tell me about a time you disagreed with leadership\'s decision (Disagree and Commit)',
          'Describe a time when you took ownership of a failing project (Ownership)',
          'Tell me about the most complex technical problem you\'ve solved (Dive Deep)',
        ],
        difficulty: 'hard',
        notes: 'Bar Raiser asks only LP questions. Have 10+ stories ready with clear metrics. They dig 3 levels deep — be honest about your role vs the team\'s.',
      },
    ],
    tips: [
      'All 14 Leadership Principles are tested — prepare 2-3 stories for each',
      'STAR format is essential but not sufficient — your "Result" must have measurable impact',
      'Amazon loves ownership and bias for action — show you act independently',
      'For DSA: medium LeetCode is the baseline, but they can go hard in Bar Raiser',
      'Disagree and Commit LP comes up EVERY time — have a strong, specific story ready',
    ],
  },
  {
    id: 'exp3',
    company: 'Meta',
    role: 'Software Engineer E4',
    level: 'mid',
    outcome: 'offer',
    ctc: '$180k USD',
    location: 'Menlo Park (Remote)',
    date: '2025-09',
    upvotes: 215,
    author: 'Rahul M.',
    tags: ['DSA', 'System Design', 'Behavioral'],
    rounds: [
      {
        type: 'technical',
        label: 'Coding Round 1',
        questions: [
          'Implement a basic calculator (with +, -, *, /, parentheses)',
          'Follow-up: handle unary negation',
        ],
        difficulty: 'hard',
        notes: 'Meta coding rounds are 45 min — 2 problems. Faster pace than Google. They expect clean optimal solutions.',
      },
      {
        type: 'technical',
        label: 'Coding Round 2',
        questions: [
          'Serialize and deserialize an N-ary tree',
          'Given a list of accounts (each is [name, email1, email2...]), merge accounts that share emails',
        ],
        difficulty: 'hard',
        notes: 'Account merge is Union-Find. Serialization: BFS with level markers. Both in one 45-min round is intense.',
      },
      {
        type: 'system-design',
        label: 'System Design — Design Instagram',
        questions: ['Design Instagram — photo sharing, feeds, stories, explore'],
        difficulty: 'hard',
        notes: 'Push vs pull fanout for feeds was the key discussion. Covered: CDN for photos, feed ranking ML pipeline, stories TTL, explore recommendation.',
      },
      {
        type: 'behavioral',
        label: 'Behavioral — Meta Values',
        questions: [
          'Tell me about a time you moved fast and broke something. What did you learn?',
          'Describe how you\'ve built a culture of collaboration on your team.',
        ],
        difficulty: 'medium',
        notes: 'Meta values: Move Fast, Be Direct, Build Social Value. Frame stories through these lenses.',
      },
    ],
    tips: [
      'Meta coding bar is high — they expect optimal solutions quickly. Practice speed, not just correctness.',
      'For System Design, know Facebook-scale patterns: feed ranking, news feed generation, photo storage at exabyte scale',
      'Behavioral interviews emphasize "move fast" — show you\'re comfortable with shipping with imperfect info',
      'LeetCode 200-300 problems minimum before interviewing for E4/E5',
      'They care about impact — every story should have measurable team/product impact',
    ],
  },
  {
    id: 'exp4',
    company: 'Microsoft',
    role: 'SDE-2',
    level: 'mid',
    outcome: 'offer',
    ctc: '₹35 LPA',
    location: 'Bengaluru',
    date: '2025-08',
    upvotes: 178,
    author: 'Kavya R.',
    tags: ['DSA', 'System Design', 'Behavioral'],
    rounds: [
      {
        type: 'online-assessment',
        label: 'OA — Codility',
        questions: [
          'String transformation problem (BFS)',
          'Schedule tasks with dependencies (Topological Sort)',
        ],
        difficulty: 'medium',
        notes: '60 minutes, 2 problems. Codility platform shows partial scores per test case.',
      },
      {
        type: 'technical',
        label: 'Technical Round 1',
        questions: [
          'Design a stack that returns min/max in O(1)',
          'Find all paths from root to leaves in a binary tree that sum to a target',
        ],
        difficulty: 'medium',
      },
      {
        type: 'technical',
        label: 'Technical Round 2',
        questions: [
          'Clone a graph with random pointers',
          'Implement a file system (mkdir, ls, addContentToFile, readContentFromFile)',
        ],
        difficulty: 'medium',
        notes: 'File system is LeetCode 588. Trie or HashMap approach. Microsoft loves design-flavored coding questions.',
      },
      {
        type: 'behavioral',
        label: 'As Appropriate (AA) Interview',
        questions: [
          'Why Microsoft?',
          'Describe a time you led a project that failed. What did you do?',
          'How do you handle disagreements with your team?',
        ],
        difficulty: 'easy',
        notes: 'Very culture-focused. Growth mindset is the key value at Microsoft — show you embrace learning from failure.',
      },
    ],
    tips: [
      'Microsoft values growth mindset — show genuine curiosity about learning',
      'DSA bar is medium — focus on clean code and good variable naming',
      '"Why Microsoft?" will be asked — have a genuine, researched answer',
      'They love OOP design questions — practice designing systems OOP-first',
      'Be warm and collaborative — Microsoft culture interview is real',
    ],
  },
  {
    id: 'exp5',
    company: 'Uber',
    role: 'Software Engineer II',
    level: 'mid',
    outcome: 'offer',
    ctc: '₹42 LPA',
    location: 'Bengaluru / Hyderabad',
    date: '2025-07',
    upvotes: 156,
    author: 'Vikram N.',
    tags: ['DSA', 'System Design'],
    rounds: [
      {
        type: 'online-assessment',
        label: 'OA',
        questions: [
          'Minimum time for driver to reach all passengers (BFS multi-source)',
          'Group passengers with same destination',
        ],
        difficulty: 'medium',
      },
      {
        type: 'technical',
        label: 'Technical Round 1 — DSA',
        questions: [
          'Design a ride matching algorithm (bipartite matching simplified)',
          'Find shortest path avoiding surge-priced areas (Dijkstra with weights)',
        ],
        difficulty: 'hard',
        notes: 'Questions are domain-relevant. They want you to map abstract DS concepts to ride-sharing context.',
      },
      {
        type: 'system-design',
        label: 'System Design — Design Uber',
        questions: ['Design the Uber backend — matching, real-time location, surge pricing, payments'],
        difficulty: 'hard',
        notes: 'WebSocket for real-time driver location, geohashing for proximity search, surge pricing algorithm (supply/demand ratio), payment idempotency.',
      },
      {
        type: 'behavioral',
        label: 'Behavioral',
        questions: [
          'Describe a high-impact engineering decision you made with limited data.',
          'Tell me about a time you improved a slow process.',
        ],
        difficulty: 'medium',
      },
    ],
    tips: [
      'Uber asks domain-relevant questions — understand ride-sharing systems before interviewing',
      'Geohashing and real-time location are almost guaranteed in system design',
      'They value "getting stuff done" — show velocity and pragmatism in your answers',
      'Study: geohashing, WebSocket, surge pricing as demand/supply ratio',
    ],
  },
  {
    id: 'exp6',
    company: 'Flipkart',
    role: 'SDE-2',
    level: 'mid',
    outcome: 'offer',
    ctc: '₹28 LPA',
    location: 'Bengaluru',
    date: '2025-06',
    upvotes: 134,
    author: 'Ananya P.',
    tags: ['DSA', 'System Design', 'Behavioral'],
    rounds: [
      {
        type: 'online-assessment',
        label: 'OA — Machine Coding',
        questions: [
          'Design and implement a Splitwise-like expense sharing system in 90 minutes',
        ],
        difficulty: 'medium',
        notes: 'Machine coding round is Flipkart\'s specialty. Clean OOP design, no frameworks. Focus: separation of concerns, SOLID principles, extensibility.',
      },
      {
        type: 'technical',
        label: 'Technical Round — DSA',
        questions: [
          'Maximum profit from buying and selling stocks with at most k transactions',
          'Design a data structure to support range minimum query in O(1)',
        ],
        difficulty: 'hard',
      },
      {
        type: 'system-design',
        label: 'System Design — Design Flipkart Search',
        questions: ['Design Flipkart\'s product search — relevance ranking, filters, autocomplete'],
        difficulty: 'hard',
        notes: 'Covered: Elasticsearch for full-text search, Redis for autocomplete trie, ML-based ranking, CDN for product images.',
      },
      {
        type: 'behavioral',
        label: 'Managerial Round',
        questions: [
          'Describe your most complex project end-to-end.',
          'How do you balance quality and speed?',
        ],
        difficulty: 'easy',
      },
    ],
    tips: [
      'Machine coding round is unique to Flipkart — practice building mini-systems in 90 min',
      'OOP design is heavily tested — know all SOLID principles with examples',
      'DSA bar is medium-to-hard — focus on DP and graphs',
      'Research Flipkart\'s tech blog before interviewing — they appreciate candidates who know their systems',
    ],
  },
  {
    id: 'exp7',
    company: 'Adobe',
    role: 'Computer Scientist',
    level: 'mid',
    outcome: 'offer',
    ctc: '₹32 LPA',
    location: 'Noida / Bengaluru',
    date: '2025-05',
    upvotes: 98,
    author: 'Siddharth G.',
    tags: ['DSA', 'System Design', 'OOP'],
    rounds: [
      {
        type: 'online-assessment',
        label: 'OA',
        questions: [
          'Two questions: interval scheduling + tree path problems',
        ],
        difficulty: 'medium',
      },
      {
        type: 'technical',
        label: 'Technical Round 1 — OOP Design',
        questions: [
          'Design a Chess game — classes, interfaces, move validation',
          'Implement a task scheduler with dependencies',
        ],
        difficulty: 'medium',
        notes: 'Adobe strongly emphasizes OOP design. They want abstract classes, interfaces, design patterns.',
      },
      {
        type: 'technical',
        label: 'Technical Round 2 — DSA',
        questions: [
          'Meeting rooms II (minimum conference rooms)',
          'Implement an iterator for a nested list',
        ],
        difficulty: 'medium',
      },
      {
        type: 'behavioral',
        label: 'HR Round',
        questions: [
          'Why Adobe?',
          'Where do you see yourself in 5 years?',
          'Salary expectations',
        ],
        difficulty: 'easy',
      },
    ],
    tips: [
      'Adobe focuses on OOP and design patterns — know GoF patterns deeply',
      'DSA is medium difficulty — same as typical FAANG round 1',
      'Adobe uses Creative Cloud internally — knowing their product suite helps in "Why Adobe?"',
      'OOP design round always comes — practice designing systems with clean class hierarchies',
    ],
  },
  {
    id: 'exp8',
    company: 'Atlassian',
    role: 'Software Engineer L2',
    level: 'mid',
    outcome: 'offer',
    ctc: 'AUD 140k',
    location: 'Sydney / Remote',
    date: '2025-04',
    upvotes: 87,
    author: 'Rohan B.',
    tags: ['DSA', 'System Design', 'Values'],
    rounds: [
      {
        type: 'technical',
        label: 'Coding Challenge (Take-Home)',
        questions: [
          'Build a command-line kanban board with specific requirements (4 hours)',
        ],
        difficulty: 'medium',
        notes: 'Focus on code quality, tests, and documentation. They review the PR diff carefully.',
      },
      {
        type: 'technical',
        label: 'Technical Interview — Review + DSA',
        questions: [
          'Walk through your take-home solution and explain design decisions',
          'LRU Cache implementation',
          'Design a distributed queue (simplified Jira queue)',
        ],
        difficulty: 'medium',
      },
      {
        type: 'behavioral',
        label: 'Values Interview',
        questions: [
          'Describe a time you challenged the status quo to improve a process',
          'Tell me about a time you collaborated across teams to achieve a goal',
          'How do you approach open communication when delivering bad news?',
        ],
        difficulty: 'medium',
        notes: 'Atlassian Values: Open Company No Bullshit, Build with Heart and Balance, Don\'t #@!% the Customer, Play as a Team, Be the Change You Seek.',
      },
    ],
    tips: [
      'Take-home code quality matters as much as correctness — write tests, clean code, good README',
      'Know Atlassian\'s 5 values — they\'re asked explicitly in behavioral',
      'Open Company No Bullshit means honesty > polish — don\'t oversell yourself',
      'Atlassian emphasizes collaboration and open source — contribute to OSS if possible',
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANIES = [...new Set(EXPERIENCES.map(e => e.company))].sort((a, b) => a.localeCompare(b));
const OUTCOMES: Record<Experience['outcome'], { label: string; color: string; icon: string }> = {
  offer:     { label: 'Offer',    color: 'text-green-400 bg-green-500/10 border-green-500/20',   icon: 'check_circle' },
  rejected:  { label: 'Rejected', color: 'text-red-400 bg-red-500/10 border-red-500/20',          icon: 'cancel' },
  withdrew:  { label: 'Withdrew', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',       icon: 'remove_circle' },
  'oa-only': { label: 'OA Only',  color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: 'pending' },
};
const ROUND_ICONS: Record<Round['type'], string> = {
  'online-assessment': 'computer',
  'technical':         'code',
  'system-design':     'architecture',
  'behavioral':        'psychology',
  'hr':                'groups',
  'take-home':         'home',
};
const DIFF_COLOR: Record<string, string> = {
  easy:   'text-green-400',
  medium: 'text-yellow-400',
  hard:   'text-red-400',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ExperiencesPage() {
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return EXPERIENCES.filter(e => {
      const matchCompany = selectedCompany === 'all' || e.company === selectedCompany;
      const matchOutcome = selectedOutcome === 'all' || e.outcome === selectedOutcome;
      const matchSearch  = search === '' ||
        e.company.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase()) ||
        e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      return matchCompany && matchOutcome && matchSearch;
    });
  }, [selectedCompany, selectedOutcome, search]);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Interview Experiences</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Real interview reports from engineers who got offers. Learn what to expect, what was asked, and how to prepare.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Reports', value: EXPERIENCES.length, icon: 'article', color: 'text-blue-400' },
            { label: 'Offers Documented', value: EXPERIENCES.filter(e => e.outcome === 'offer').length, icon: 'check_circle', color: 'text-green-400' },
            { label: 'Companies', value: COMPANIES.length, icon: 'business', color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
              <p className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company, role, tags…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Company */}
          <select
            value={selectedCompany}
            onChange={e => setSelectedCompany(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Companies</option>
            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Outcome */}
          <select
            value={selectedOutcome}
            onChange={e => setSelectedOutcome(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Outcomes</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <p className="text-xs text-zinc-600">{filtered.length} experience{filtered.length !== 1 ? 's' : ''} found</p>

        {/* Experience cards */}
        <div className="space-y-3">
          {filtered.map(exp => {
            const outcome = OUTCOMES[exp.outcome];
            const isOpen = expanded === exp.id;

            return (
              <div key={exp.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                {/* Card header */}
                <button
                  className="w-full flex items-start gap-4 p-5 hover:bg-zinc-800/30 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : exp.id)}
                >
                  {/* Company initial */}
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 font-black text-zinc-300 text-sm">
                    {exp.company[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-zinc-100">{exp.company}</span>
                      <span className="text-zinc-500 text-sm">·</span>
                      <span className="text-sm text-zinc-300">{exp.role}</span>
                      {exp.ctc && (
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">{exp.ctc}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${outcome.color}`}>
                        {outcome.label}
                      </span>
                      <span className="text-xs text-zinc-600">{exp.location} · {exp.date}</span>
                      <span className="text-xs text-zinc-600">by {exp.author}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {exp.tags.map(t => (
                        <span key={t} className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{t}</span>
                      ))}
                      <span className="text-xs text-zinc-600 ml-auto">{exp.rounds.length} rounds</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <span className="material-symbols-outlined text-sm">thumb_up</span>
                      {exp.upvotes}
                    </div>
                    <span className="material-symbols-outlined text-zinc-600 text-lg">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-zinc-800 p-5 space-y-6">

                    {/* Rounds */}
                    <div className="space-y-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Interview Rounds</p>
                      {exp.rounds.map((round, ri) => (
                        <div key={ri} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-lg text-zinc-400">{ROUND_ICONS[round.type]}</span>
                            <span className="font-semibold text-zinc-200 text-sm">{round.label}</span>
                            <span className={`ml-auto text-xs font-bold ${DIFF_COLOR[round.difficulty]}`}>
                              {round.difficulty}
                            </span>
                          </div>

                          <div className="space-y-2 mb-3">
                            {round.questions.map((q, qi) => (
                              <div key={qi} className="flex items-start gap-2">
                                <span className="text-zinc-600 text-xs mt-0.5 flex-shrink-0">Q{qi + 1}.</span>
                                <p className="text-sm text-zinc-300">{q}</p>
                              </div>
                            ))}
                          </div>

                          {round.notes && (
                            <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-700/30">
                              <p className="text-xs text-zinc-400 leading-relaxed">{round.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Tips from this candidate</p>
                      <ul className="space-y-2">
                        {exp.tips.map((tip, ti) => (
                          <li key={ti} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-yellow-400 text-base flex-shrink-0 mt-0.5">star</span>
                            <p className="text-sm text-zinc-300">{tip}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA to contribute */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 rounded-xl border border-zinc-700 p-6 text-center">
          <p className="text-zinc-300 font-semibold mb-1">Got an interview experience to share?</p>
          <p className="text-zinc-500 text-sm mb-4">Help the community — submit your experience and earn XP.</p>
          <button className="inline-flex items-center gap-2 bg-[#E82127] hover:bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-base">add</span>
            Share Your Experience
          </button>
        </div>
      </div>
    </AppShell>
  );
}
