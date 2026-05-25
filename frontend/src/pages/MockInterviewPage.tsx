import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { shuffle } from '../lib/random';
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

type InterviewType = 'behavioral' | 'dsa' | 'system_design' | 'mixed';
type Phase = 'select' | 'active' | 'done';

interface Question {
  id: string;
  text: string;
  type: InterviewType;
  category: string;
  hint?: string;
  timeSeconds: number;
}

const BEHAVIORAL_QUESTIONS: Question[] = [
  { id: 'b1', text: 'Tell me about a time you had to work with an ambiguous requirement. How did you handle it?', type: 'behavioral', category: 'Ambiguity', hint: 'Situation → Action (clarified, proposed options, aligned with stakeholders) → Result', timeSeconds: 180 },
  { id: 'b2', text: 'Describe a project where you had to push back against a tight deadline. What happened?', type: 'behavioral', category: 'Negotiation', hint: 'Quantify scope, explain trade-offs you surfaced, how you aligned the team', timeSeconds: 180 },
  { id: 'b3', text: 'Tell me about a time you disagreed with your manager or a senior engineer. How did you resolve it?', type: 'behavioral', category: 'Conflict', hint: 'Focus on data-driven argument, respectful communication, outcome', timeSeconds: 180 },
  { id: 'b4', text: 'Describe your most impactful technical contribution in the past 12 months.', type: 'behavioral', category: 'Impact', hint: 'Use metrics: latency improvement %, cost savings, users affected', timeSeconds: 180 },
  { id: 'b5', text: 'Tell me about a time you made a significant technical mistake. What did you learn?', type: 'behavioral', category: 'Failure', hint: 'Own it clearly, focus on the learning and systemic fix, not just personal fix', timeSeconds: 180 },
  { id: 'b6', text: 'How do you prioritize when you have multiple urgent tasks competing for your time?', type: 'behavioral', category: 'Prioritization', hint: 'Mention frameworks: impact vs effort, stakeholder alignment, transparent communication', timeSeconds: 150 },
  { id: 'b7', text: 'Describe a situation where you had to influence a team without formal authority.', type: 'behavioral', category: 'Leadership', hint: 'Focus on building trust, shared vision, and incremental proof points', timeSeconds: 180 },
  { id: 'b8', text: 'Tell me about a time you mentored a junior engineer. What was your approach?', type: 'behavioral', category: 'Mentoring', hint: 'Structured guidance, pair programming, letting them fail safely, feedback loops', timeSeconds: 150 },
  { id: 'b9', text: 'Describe a time when you had to learn a new technology quickly to meet a project deadline. How did you approach it?', type: 'behavioral', category: 'Learning', hint: 'Show deliberate learning strategy: official docs → small project → team knowledge share', timeSeconds: 180 },
  { id: 'b10', text: 'Tell me about a situation where a project you were working on changed significantly mid-way. How did you adapt?', type: 'behavioral', category: 'Adaptability', hint: 'Show reframing, not just tolerance. What opportunities did you see in the pivot?', timeSeconds: 180 },
  { id: 'b11', text: 'Describe a time you improved a process or workflow that was inefficient. What was the impact?', type: 'behavioral', category: 'Process', hint: 'Quantify: hours saved, error rate reduced, throughput increased. Did it spread to others?', timeSeconds: 180 },
  { id: 'b12', text: 'Where do you see yourself in 3-5 years, and how does this role fit into that path?', type: 'behavioral', category: 'Growth', hint: 'Show genuine ambition + specific skills you expect to develop in this role. Research the company.', timeSeconds: 150 },
];

const DSA_QUESTIONS: Question[] = [
  { id: 'd1', text: 'Two Sum: Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. (You may assume exactly one solution exists, no repeated elements)', type: 'dsa', category: 'Hash Map', hint: 'One-pass hash map: for each element, check if (target - element) exists in map', timeSeconds: 900 },
  { id: 'd2', text: 'LRU Cache: Design a data structure that follows Least Recently Used cache eviction. Implement get(key) and put(key, value), both O(1) time complexity.', type: 'dsa', category: 'Design', hint: 'Doubly linked list + hash map. Head = most recent, tail = oldest', timeSeconds: 1800 },
  { id: 'd3', text: 'Merge K Sorted Lists: You are given an array of k linked-lists, each sorted in ascending order. Merge all the linked-lists into one sorted linked-list.', type: 'dsa', category: 'Heap', hint: 'Min heap of size k. Push first element from each list, pop-and-push as you build result', timeSeconds: 1800 },
  { id: 'd4', text: 'Word Search: Given an m×n grid of characters and a string word, return true if word exists in the grid using adjacent cells (horizontal/vertical, no reuse).', type: 'dsa', category: 'Backtracking', hint: 'DFS with backtracking. Mark visited temporarily. Restore on backtrack.', timeSeconds: 1800 },
  { id: 'd5', text: 'Coin Change: Given coins of different denominations and a total amount, return the fewest number of coins needed to make up that amount. Return -1 if not possible.', type: 'dsa', category: 'Dynamic Programming', hint: 'dp[amount] = min coins. For each coin, dp[i] = min(dp[i], dp[i - coin] + 1)', timeSeconds: 1500 },
  { id: 'd6', text: 'Binary Tree Maximum Path Sum: A path in a binary tree is a sequence of nodes with no node appearing more than once. The path sum is the sum of the nodes values. Return the maximum path sum.', type: 'dsa', category: 'Tree DFS', hint: 'For each node, max path through it = node.val + max(left_gain, 0) + max(right_gain, 0). Track global max.', timeSeconds: 1800 },
  { id: 'd7', text: 'Trapping Rain Water: Given n non-negative integers representing elevation map where the width of each bar is 1, compute how much water it can trap after raining.', type: 'dsa', category: 'Two Pointers', hint: 'Two pointers from both ends. water[i] = min(maxLeft, maxRight) - height[i]. Process whichever side has smaller max.', timeSeconds: 1500 },
  { id: 'd8', text: 'Find Median from Data Stream: Design a data structure that supports: addNum(num) — add a number; findMedian() — return the median of current numbers.', type: 'dsa', category: 'Heap', hint: 'Two heaps: max-heap for lower half, min-heap for upper half. Balance to ensure sizes differ by at most 1.', timeSeconds: 1800 },
  { id: 'd9', text: 'Longest Increasing Subsequence: Given unsorted array, find the length of the longest strictly increasing subsequence. O(n log n) solution expected.', type: 'dsa', category: 'Binary Search', hint: 'Patience sort: maintain a sorted pile using binary search. O(n log n) time, O(n) space.', timeSeconds: 1800 },
  { id: 'd10', text: 'Course Schedule II: Given numCourses and prerequisites, return an ordering to finish all courses. Return empty array if impossible.', type: 'dsa', category: 'Topological Sort', hint: 'Kahn\'s algorithm (BFS): in-degree array, queue of zero-in-degree nodes. Cycle if queue empties before all courses added.', timeSeconds: 1800 },
];

const SD_QUESTIONS: Question[] = [
  { id: 's1', text: 'Design a URL Shortener (like bit.ly)\n\nRequirements: 100M URLs stored, 10B redirects/month, <100ms latency, custom aliases, analytics.', type: 'system_design', category: 'Scalability', hint: 'Cover: hashing strategy (base62), collision handling, DB choice, CDN for redirects, analytics async', timeSeconds: 2700 },
  { id: 's2', text: 'Design a Rate Limiter\n\nRequirements: Limit API requests per user/IP. Support distributed deployment across multiple servers. Multiple algorithms (token bucket, sliding window).', type: 'system_design', category: 'Distributed Systems', hint: 'Redis for distributed counters. Lua scripts for atomicity. Sliding window log vs fixed window trade-offs', timeSeconds: 2700 },
  { id: 's3', text: 'Design Twitter\'s Notification System\n\nRequirements: Push/email/SMS, 500M users, low latency, deduplication, delivery guarantee, user preferences.', type: 'system_design', category: 'Messaging', hint: 'Message queue (Kafka), fanout service, idempotency keys, user preference service, retry with backoff', timeSeconds: 2700 },
  { id: 's4', text: 'Design a Real-Time Chat Application\n\nRequirements: 1:1 and group messaging, 100M DAU, read receipts, message ordering, offline delivery, media sharing.', type: 'system_design', category: 'Real-time', hint: 'WebSockets for online users, push for offline. Message ordering via vector clocks or server-assigned timestamps. Object storage for media.', timeSeconds: 2700 },
  { id: 's5', text: 'Design Instagram / Photo Sharing\n\nRequirements: 500M DAU, photo upload + CDN delivery, feed generation, follow graph, explore page, stories (24hr expiry).', type: 'system_design', category: 'Scalability', hint: 'Separate read/write. Push fanout for feed (push model for celebrities = pull). CDN with image resizing. Stories as TTL-based keys.', timeSeconds: 2700 },
];

const ALL_QUESTIONS: Record<InterviewType, Question[]> = {
  behavioral: BEHAVIORAL_QUESTIONS,
  dsa: DSA_QUESTIONS,
  system_design: SD_QUESTIONS,
  mixed: [...BEHAVIORAL_QUESTIONS.slice(0, 2), ...DSA_QUESTIONS.slice(0, 2), ...SD_QUESTIONS.slice(0, 1)],
};

const TYPE_META: Record<InterviewType, { label: string; icon: string; color: string; glow: string; desc: string; duration: string }> = {
  behavioral:    { label: 'Behavioral',    icon: 'psychology',   color: '#4ade80', glow: 'rgba(74,222,128,0.15)',   desc: 'STAR-format questions on leadership, conflict, impact, and growth.', duration: '30 min' },
  dsa:           { label: 'DSA Coding',    icon: 'code',         color: '#60a5fa', glow: 'rgba(96,165,250,0.15)',   desc: 'Algorithm and data structure questions at FAANG interview level.', duration: '45 min' },
  system_design: { label: 'System Design', icon: 'architecture', color: '#c084fc', glow: 'rgba(192,132,252,0.15)', desc: 'Design scalable distributed systems under realistic constraints.', duration: '45 min' },
  mixed:         { label: 'Full Loop',     icon: 'shuffle',      color: '#fb923c', glow: 'rgba(251,146,60,0.15)',   desc: 'Mixed interview: behavioral, DSA, and system design — like a real FAANG loop.', duration: '60 min' },
};

const DIFF_COLOR: Record<string, { color: string; bg: string }> = {
  'Hash Map':            { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'   },
  'Design':              { color: '#c084fc', bg: 'rgba(192,132,252,0.1)'  },
  'Heap':                { color: '#facc15', bg: 'rgba(250,204,21,0.1)'   },
  'Backtracking':        { color: '#fb923c', bg: 'rgba(251,146,60,0.1)'   },
  'Dynamic Programming': { color: '#f472b6', bg: 'rgba(244,114,182,0.1)'  },
  'Tree DFS':            { color: '#4ade80', bg: 'rgba(74,222,128,0.1)'   },
  'Scalability':         { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)'   },
  'Distributed Systems': { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'  },
  'Messaging':           { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'   },
  'Ambiguity':           { color: '#4ade80', bg: 'rgba(74,222,128,0.1)'   },
  'Negotiation':         { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'   },
  'Conflict':            { color: '#f87171', bg: 'rgba(248,113,113,0.1)'  },
  'Impact':              { color: '#ff4d5a', bg: 'rgba(232,33,39,0.1)'    },
  'Failure':             { color: '#fb923c', bg: 'rgba(251,146,60,0.1)'   },
  'Prioritization':      { color: '#facc15', bg: 'rgba(250,204,21,0.1)'   },
  'Leadership':          { color: '#c084fc', bg: 'rgba(192,132,252,0.1)'  },
  'Mentoring':           { color: '#f472b6', bg: 'rgba(244,114,182,0.1)'  },
  'Two Pointers':        { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)'   },
  'Binary Search':       { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'   },
  'Topological Sort':    { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)'  },
  'Real-time':           { color: '#4ade80', bg: 'rgba(74,222,128,0.1)'   },
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildSubmitPayload(sessionId: string, selectedType: InterviewType, answers: Record<string, string>) {
  return {
    sessionId,
    type: selectedType,
    answers: Object.entries(answers).map(([qId, text]) => ({ questionId: qId, answer: text })),
  };
}

function calcInterviewXP(selectedType: InterviewType, answers: Record<string, string>): number {
  const answered = Object.values(answers).filter((a) => a.trim().length > 20).length;
  const XP_PER_ANSWER: Record<string, number> = { system_design: 20, dsa: 15 };
  return Math.round(answered * (XP_PER_ANSWER[selectedType] ?? 10));
}

export function MockInterviewPage() {
  const session = getSession();
  const { fireXP } = useUser();

  const [phase, setPhase] = useState<Phase>('select');
  const [selectedType, setSelectedType] = useState<InterviewType>('behavioral');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timerActive) { if (timerRef.current) { clearInterval(timerRef.current); } return; }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { if (timerRef.current) { clearInterval(timerRef.current); } setTimerActive(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  function startInterview() {
    const qs = shuffle(ALL_QUESTIONS[selectedType]).slice(0, selectedType === 'mixed' ? 5 : 4);
    setQuestions(qs);
    setQIdx(0);
    setAnswers({});
    setShowHint(false);
    const t = qs[0]?.timeSeconds ?? 180;
    setTimeLeft(t);
    setTotalTime(t);
    setTimerActive(true);
    setPhase('active');
    setSessionId(crypto.randomUUID());
  }

  function nextQuestion() {
    const next = qIdx + 1;
    if (next >= questions.length) {
      setTimerActive(false);
      setPhase('done');
    } else {
      setQIdx(next);
      const t = questions[next]?.timeSeconds ?? 180;
      setTimeLeft(t);
      setTotalTime(t);
      setTimerActive(true);
      setShowHint(false);
    }
  }

  async function submitSession() {
    setSubmitting(true);
    try {
      if (session?.accessToken && sessionId) {
        await apiRequest('/mock-interview/sessions', {
          method: 'POST',
          token: session.accessToken,
          body: { ...buildSubmitPayload(sessionId, selectedType, answers), selfRating: feedback },
        }).catch(() => {});
      }
      const xp = calcInterviewXP(selectedType, answers);
      fireXP(xp, `Mock ${TYPE_META[selectedType].label} interview complete!`);
    } finally {
      setSubmitting(false);
    }
  }

  const currentQ = questions[qIdx];
  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 20).length;
  const timerPct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  let timerHex: string;
  if (timerPct > 50) { timerHex = '#4ade80'; }
  else if (timerPct > 25) { timerHex = '#facc15'; }
  else { timerHex = '#f87171'; }
  const XP_PER_ANS: Record<string, number> = { system_design: 20, dsa: 15 };

  const categoryChip = (cat: string) => {
    const c = DIFF_COLOR[cat] ?? { color: 'var(--t2)', bg: 'rgba(255,255,255,0.06)' };
    return (
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '3px 10px', borderRadius: 999, color: c.color, background: c.bg }}>
        {cat}
      </span>
    );
  };

  if (phase === 'select') {
    return (
      <AppShell>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ paddingTop: 56, paddingBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>
              Interview Prep
            </p>
            <h1 style={{
              fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
              background: 'linear-gradient(135deg, #ff4d5a 0%, #fb923c 60%, #facc15 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12,
            }}>
              MOCK INTERVIEW.
            </h1>
            <p style={{ fontSize: 15, color: 'var(--t2)', maxWidth: 520, lineHeight: 1.65 }}>
              Practice FAANG-level interviews with timed questions, hints, and structured response tracking.
            </p>
          </motion.div>

          {/* Tips banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ ...GLASS, borderRadius: 16, padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 14 }}
          >
            <Icon name="tips_and_updates" size={18} style={{ color: '#facc15', flexShrink: 0, marginTop: 2 }} filled />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>How to get the most out of mock interviews</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                Speak your answers out loud (or type them in full). Use the timer — it forces the pace of a real interview. Review hints only after attempting. Reflect on what you'd improve after each session.
              </p>
            </div>
          </motion.div>

          {/* Type selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 36 }}>
            {(Object.entries(TYPE_META) as [InterviewType, typeof TYPE_META[InterviewType]][]).map(([key, meta], i) => {
              const isActive = selectedType === key;
              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => setSelectedType(key)}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  whileHover={{ boxShadow: `0 8px 28px ${meta.glow}` }}
                  style={{
                    textAlign: 'left', padding: 24, borderRadius: 20,
                    background: isActive ? meta.glow.replace('0.15', '0.1') : 'rgba(10,10,10,0.7)',
                    border: isActive ? `1px solid ${meta.color}40` : '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(16px)', cursor: 'pointer',
                    boxShadow: isActive ? `0 0 32px ${meta.glow}` : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.25s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: meta.glow, border: `1px solid ${meta.color}25` }}>
                      <Icon name={meta.icon} size={22} style={{ color: meta.color }} />
                    </div>
                    {isActive && <Icon name="check_circle" size={20} style={{ color: meta.color }} filled />}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{meta.label}</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 14 }}>{meta.desc}</p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="schedule" size={11} /> {meta.duration}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="quiz" size={11} /> {ALL_QUESTIONS[key].length} questions
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* What to expect */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 16 }}>What to Expect</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {[
                { icon: 'timer',    title: 'Timed Responses', desc: 'Each question has a recommended time limit, just like real interviews.', color: '#f87171' },
                { icon: 'lightbulb', title: 'Structured Hints', desc: 'Optional hints guide your thinking without giving away the answer.', color: '#facc15' },
                { icon: 'bolt',     title: 'XP Rewards',       desc: 'Earn XP based on how many questions you answer thoughtfully.', color: '#ff4d5a' },
              ].map((item) => (
                <div key={item.title} style={{ ...GLASS, borderRadius: 16, padding: 18, display: 'flex', gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: `${item.color}15`, border: `1px solid ${item.color}25`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={item.icon} size={17} style={{ color: item.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{item.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--t2)', lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            type="button"
            onClick={startInterview}
            whileHover={{ scale: 1.03, boxShadow: '0 0 32px rgba(232,33,39,0.4)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: 'linear-gradient(135deg, #e82127, #c41a1f)',
              border: 'none', borderRadius: 999, padding: '14px 36px',
              color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <Icon name="play_arrow" size={20} filled />
            Start {TYPE_META[selectedType].label} Interview
          </motion.button>
        </div>
      </AppShell>
    );
  }

  if (phase === 'done') {
    return (
      <AppShell>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 80px' }}>
          {/* Completion header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ ...GLASS, borderRadius: 22, padding: 40, marginBottom: 24, textAlign: 'center' }}
          >
            <div style={{ width: 64, height: 64, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Icon name="celebration" size={30} style={{ color: '#4ade80' }} filled />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>Interview Complete!</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
              You completed {questions.length} {TYPE_META[selectedType].label} questions. {answeredCount} answered in depth.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 0, ...GLASS, borderRadius: 16, overflow: 'hidden', width: 'fit-content', margin: '0 auto' }}>
              {[
                { label: 'Questions', value: String(questions.length), color: '#fff' },
                { label: 'Answered',  value: String(answeredCount),    color: '#4ade80' },
                { label: 'XP Earned', value: `+${Math.round(answeredCount * (XP_PER_ANS[selectedType] ?? 10))}`, color: '#ff4d5a' },
              ].map((s, i) => (
                <div key={s.label} style={{ padding: '18px 32px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <p style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--t3)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Review answers */}
          <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 14 }}>Your Responses</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                style={{ ...GLASS, borderRadius: 16, padding: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)' }}>Q{i + 1}</span>
                  {categoryChip(q.category)}
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12, lineHeight: 1.65, whiteSpace: 'pre-line' }}>{q.text}</p>
                <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.65 }}>
                    {answers[q.id]?.trim() || <em style={{ color: 'rgba(255,255,255,0.2)' }}>No response recorded</em>}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Self-assessment */}
          <div style={{ ...GLASS, borderRadius: 18, padding: 22, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="rate_review" size={16} style={{ color: '#ff4d5a' }} />
              Self-Assessment
            </h3>
            <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>How did the interview feel? What would you do differently? (Optional)</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Struggled with time management on the DSA question. Need to practice more DP problems. Behavioral answers felt structured."
              rows={4}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#fff', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <motion.button
              type="button"
              onClick={submitSession}
              disabled={submitting}
              whileHover={submitting ? {} : { scale: 1.03, boxShadow: '0 0 24px rgba(232,33,39,0.35)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: 'linear-gradient(135deg, #e82127, #c41a1f)', border: 'none', borderRadius: 999, padding: '12px 28px',
                color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', opacity: submitting ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {submitting ? <Icon name="hourglass_empty" size={15} /> : <Icon name="save" size={15} />}
              {submitting ? 'Saving…' : 'Save & Claim XP'}
            </motion.button>
            <motion.button
              type="button"
              onClick={() => { setPhase('select'); setFeedback(''); }}
              whileHover={{ background: 'rgba(255,255,255,0.08)' }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '12px 24px', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              New Interview
            </motion.button>
            <Link to="/app/placement" style={{ textDecoration: 'none' }}>
              <motion.button
                type="button"
                whileHover={{ background: 'rgba(255,255,255,0.08)' }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '12px 24px', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Icon name="work" size={14} />
                Placement Prep
              </motion.button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Active interview
  if (!currentQ) return null;

  const ANSWER_LABEL: Record<string, string> = { behavioral: 'Your Answer (STAR format)', dsa: 'Your Approach & Solution' };
  const answerLabel = ANSWER_LABEL[currentQ.type] ?? 'Your Design';
  const DSA_PLACEHOLDER = 'Approach:\n1. ...\n\nTime complexity: O(?)\nSpace complexity: O(?)\n\nCode:\n```\n\n```';
  const SD_PLACEHOLDER = 'Requirements:\n- Functional: ...\n- Non-functional: ...\n\nCapacity estimation: ...\n\nHigh-level design: ...\n\nDatabase: ...\n\nAPI design: ...\n\nScalability: ...';
  const BEHAV_PLACEHOLDER = 'Situation: ...\n\nTask: ...\n\nAction: ...\n\nResult: ...';
  const PLACEHOLDER_MAP: Record<string, string> = { behavioral: BEHAV_PLACEHOLDER, dsa: DSA_PLACEHOLDER };
  const answerPlaceholder = PLACEHOLDER_MAP[currentQ.type] ?? SD_PLACEHOLDER;

  return (
    <AppShell>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Progress header */}
        <div style={{ ...GLASS, borderRadius: 18, padding: '18px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: TYPE_META[selectedType].color }}>
                {TYPE_META[selectedType].label}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)' }}>
                Q{qIdx + 1} of {questions.length}
              </span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, color: timerHex, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="timer" size={19} style={{ color: timerHex }} />
              {formatTime(timeLeft)}
            </div>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', background: 'rgba(232,33,39,0.7)', borderRadius: 3, width: `${(qIdx / questions.length) * 100}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: timerHex, borderRadius: 2, width: `${timerPct}%`, transition: 'width 1s linear' }} />
          </div>
        </div>

        {/* Question card */}
        <div style={{ ...GLASS, borderRadius: 20, padding: '28px 32px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, background: TYPE_META[currentQ.type].glow, border: `1px solid ${TYPE_META[currentQ.type].color}25`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={TYPE_META[currentQ.type].icon} size={17} style={{ color: TYPE_META[currentQ.type].color }} />
            </div>
            {categoryChip(currentQ.category)}
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="schedule" size={11} /> {Math.round(currentQ.timeSeconds / 60)} min suggested
            </span>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 22 }}>{currentQ.text}</p>

          {currentQ.hint && (
            <div>
              <motion.button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                whileHover={{ color: '#facc15' }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: showHint ? '#facc15' : 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
              >
                <Icon name="lightbulb" size={13} style={{ color: showHint ? '#facc15' : 'rgba(255,255,255,0.3)' }} />
                {showHint ? 'Hide Hint' : 'Show Hint (think first!)'}
              </motion.button>
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginTop: 12 }}
                  >
                    <div style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                      <p style={{ fontSize: 12, color: 'rgba(250,204,21,0.8)', lineHeight: 1.65 }}>{currentQ.hint}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Response area */}
        <div style={{ ...GLASS, borderRadius: 18, overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--t3)' }}>
              {answerLabel}
            </p>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{(answers[currentQ.id] ?? '').length} chars</span>
          </div>
          <textarea
            value={answers[currentQ.id] ?? ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
            placeholder={answerPlaceholder}
            rows={13}
            style={{ width: '100%', background: 'transparent', border: 'none', padding: '18px 20px', fontSize: 13, color: '#fff', outline: 'none', resize: 'none', fontFamily: 'monospace', lineHeight: 1.7, boxSizing: 'border-box' }}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <motion.button
            type="button"
            onClick={() => { setTimerActive(false); setPhase('done'); }}
            whileHover={{ color: '#fff' }}
            style={{ background: 'none', border: 'none', color: 'var(--t3)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
          >
            <Icon name="stop" size={15} /> End Interview
          </motion.button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.button
              type="button"
              onClick={() => setTimerActive((v) => !v)}
              whileHover={{ background: 'rgba(255,255,255,0.08)' }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}
            >
              <Icon name={timerActive ? 'pause' : 'play_arrow'} size={15} />
              {timerActive ? 'Pause' : 'Resume'}
            </motion.button>
            <motion.button
              type="button"
              onClick={nextQuestion}
              whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(232,33,39,0.35)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: 'linear-gradient(135deg, #e82127, #c41a1f)', border: 'none', borderRadius: 999, padding: '12px 28px',
                color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {qIdx < questions.length - 1 ? (
                <><Icon name="arrow_forward" size={15} />Next Question</>
              ) : (
                <><Icon name="check" size={15} />Finish Interview</>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
