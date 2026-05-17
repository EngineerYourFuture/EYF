import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { shuffle } from '../lib/random';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

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

const TYPE_META: Record<InterviewType, { label: string; icon: string; color: string; bg: string; desc: string; duration: string }> = {
  behavioral:    { label: 'Behavioral',    icon: 'psychology',    color: 'text-green-400',  bg: 'bg-green-500/10',  desc: 'STAR-format questions on leadership, conflict, impact, and growth.', duration: '30 min' },
  dsa:           { label: 'DSA Coding',    icon: 'code',          color: 'text-blue-400',   bg: 'bg-blue-500/10',   desc: 'Algorithm and data structure questions at FAANG interview level.', duration: '45 min' },
  system_design: { label: 'System Design', icon: 'architecture',  color: 'text-purple-400', bg: 'bg-purple-500/10', desc: 'Design scalable distributed systems under realistic constraints.', duration: '45 min' },
  mixed:         { label: 'Full Loop',     icon: 'shuffle',       color: 'text-orange-400', bg: 'bg-orange-500/10', desc: 'Mixed interview: behavioral, DSA, and system design — like a real FAANG loop.', duration: '60 min' },
};

const DIFF_COLOR: Record<string, string> = {
  'Hash Map':            'text-blue-400 bg-blue-400/10',
  'Design':              'text-purple-400 bg-purple-400/10',
  'Heap':                'text-yellow-400 bg-yellow-400/10',
  'Backtracking':        'text-orange-400 bg-orange-400/10',
  'Dynamic Programming': 'text-pink-400 bg-pink-400/10',
  'Tree DFS':            'text-green-400 bg-green-400/10',
  'Scalability':         'text-cyan-400 bg-cyan-400/10',
  'Distributed Systems': 'text-violet-400 bg-violet-400/10',
  'Messaging':           'text-amber-400 bg-amber-400/10',
  'Ambiguity':           'text-green-400 bg-green-400/10',
  'Negotiation':         'text-blue-400 bg-blue-400/10',
  'Conflict':            'text-red-400 bg-red-400/10',
  'Impact':              'text-primary-container bg-primary-container/10',
  'Failure':             'text-orange-400 bg-orange-400/10',
  'Prioritization':      'text-yellow-400 bg-yellow-400/10',
  'Leadership':          'text-purple-400 bg-purple-400/10',
  'Mentoring':           'text-pink-400 bg-pink-400/10',
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
    if (!timerActive) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); setTimerActive(false); return 0; }
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
          body: {
            sessionId,
            type: selectedType,
            answers: Object.entries(answers).map(([qId, text]) => ({ questionId: qId, answer: text })),
            selfRating: feedback,
          },
        }).catch(() => {});
      }
      const answered = Object.values(answers).filter((a) => a.trim().length > 20).length;
      const xp = Math.round(answered * (selectedType === 'system_design' ? 20 : selectedType === 'dsa' ? 15 : 10));
      fireXP(xp, `Mock ${TYPE_META[selectedType].label} interview complete!`);
    } finally {
      setSubmitting(false);
    }
  }

  const currentQ = questions[qIdx];
  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 20).length;
  const timerPct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const timerColor = timerPct > 50 ? 'text-green-400' : timerPct > 25 ? 'text-yellow-400' : 'text-red-400';

  if (phase === 'select') {
    return (
      <AppShell>
        <div className="pt-8 max-w-5xl">
          {/* Hero */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-container/10 rounded-xl flex items-center justify-center">
                <Icon name="record_voice_over" size={22} className="text-primary-container" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-container">Mock Interview</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-2">
              Interview <span className="text-primary-container">Simulator.</span>
            </h1>
            <p className="text-on-surface-variant max-w-xl">
              Practice FAANG-level interviews with timed questions, hints, and structured response tracking. Get comfortable under pressure before the real thing.
            </p>
          </div>

          {/* Tips banner */}
          <div className="bg-surface-container rounded-xl p-5 mb-8 flex items-start gap-4">
            <Icon name="tips_and_updates" size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" filled />
            <div>
              <p className="text-sm font-bold text-on-surface mb-1">How to get the most out of mock interviews</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Speak your answers out loud (or type them in full). Use the timer — it forces the pace of a real interview. Review hints only after attempting. After each session, reflect on what you'd improve.
              </p>
            </div>
          </div>

          {/* Type selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {(Object.entries(TYPE_META) as [InterviewType, typeof TYPE_META[InterviewType]][]).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedType(key)}
                className={`text-left p-6 rounded-2xl border-2 transition-all ${
                  selectedType === key
                    ? `${meta.bg} border-current/50 ${meta.color}`
                    : 'bg-surface-container border-transparent hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${meta.bg} rounded-xl flex items-center justify-center`}>
                    <Icon name={meta.icon} size={24} className={meta.color} />
                  </div>
                  {selectedType === key && (
                    <Icon name="check_circle" size={20} className={meta.color} filled />
                  )}
                </div>
                <h3 className="text-lg font-bold mb-1">{meta.label}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">{meta.desc}</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                    <Icon name="schedule" size={12} /> {meta.duration}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                    <Icon name="quiz" size={12} /> {ALL_QUESTIONS[key].length} questions
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* What to expect */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">What to Expect</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: 'timer', title: 'Timed Responses', desc: 'Each question has a recommended time limit, just like real interviews.' },
                { icon: 'lightbulb', title: 'Structured Hints', desc: 'Optional hints guide your thinking without giving away the answer.' },
                { icon: 'bolt', title: 'XP Rewards', desc: 'Earn XP based on how many questions you answer thoughtfully.' },
              ].map((item) => (
                <div key={item.title} className="bg-surface-container rounded-xl p-5 flex gap-3">
                  <div className="w-9 h-9 bg-primary-container/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name={item.icon} size={18} className="text-primary-container" />
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1">{item.title}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={startInterview}
            className="bg-primary-container text-white font-bold px-10 py-4 rounded-full text-sm hover:brightness-110 transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-red-900/20"
          >
            <Icon name="play_arrow" size={20} filled />
            Start {TYPE_META[selectedType].label} Interview
          </button>
        </div>
      </AppShell>
    );
  }

  if (phase === 'done') {
    return (
      <AppShell>
        <div className="pt-8 max-w-3xl mx-auto">
          {/* Completion header */}
          <div className="bg-surface-container rounded-2xl p-8 mb-6 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="celebration" size={32} className="text-green-400" filled />
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Interview Complete!</h1>
            <p className="text-on-surface-variant mb-6">
              You completed {questions.length} {TYPE_META[selectedType].label} questions. {answeredCount} answered in depth.
            </p>
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-2xl font-black text-on-surface">{questions.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Questions</p>
              </div>
              <div className="border-l border-zinc-800 pl-8">
                <p className="text-2xl font-black text-green-400">{answeredCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Answered</p>
              </div>
              <div className="border-l border-zinc-800 pl-8">
                <p className="text-2xl font-black text-primary-container">
                  +{Math.round(answeredCount * (selectedType === 'system_design' ? 20 : selectedType === 'dsa' ? 15 : 10))}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">XP Earned</p>
              </div>
            </div>
          </div>

          {/* Review answers */}
          <div className="space-y-4 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Your Responses</p>
            {questions.map((q, i) => (
              <div key={q.id} className="bg-surface-container rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-zinc-500">Q{i + 1}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[q.category] ?? 'text-zinc-400 bg-zinc-400/10'}`}>{q.category}</span>
                </div>
                <p className="text-sm font-bold text-on-surface mb-3 whitespace-pre-line">{q.text}</p>
                <div className="bg-surface-container-highest rounded-lg p-3">
                  <p className="text-xs text-zinc-400 whitespace-pre-wrap">
                    {answers[q.id]?.trim() || <span className="text-zinc-600 italic">No response recorded</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Self-assessment */}
          <div className="bg-surface-container rounded-xl p-5 mb-6">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Icon name="rate_review" size={16} className="text-primary-container" />
              Self-Assessment
            </h3>
            <p className="text-xs text-zinc-400 mb-3">How did the interview feel? What would you do differently? (Optional)</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Struggled with time management on the DSA question. Need to practice more DP problems. Behavioral answers felt structured."
              rows={4}
              className="w-full bg-surface-container-highest rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/40 border border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={submitSession}
              disabled={submitting}
              className="bg-primary-container text-white font-bold px-8 py-3 rounded-full text-sm hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Icon name="hourglass_empty" size={16} /> : <Icon name="save" size={16} />}
              {submitting ? 'Saving…' : 'Save & Claim XP'}
            </button>
            <button
              type="button"
              onClick={() => { setPhase('select'); setFeedback(''); }}
              className="bg-surface-container text-zinc-300 font-bold px-8 py-3 rounded-full text-sm hover:bg-surface-container-high transition-all"
            >
              New Interview
            </button>
            <Link to="/app/placement">
              <button type="button" className="bg-surface-container text-zinc-300 font-bold px-8 py-3 rounded-full text-sm hover:bg-surface-container-high transition-all flex items-center gap-2">
                <Icon name="work" size={16} />
                Placement Prep
              </button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  // Active interview
  if (!currentQ) return null;

  return (
    <AppShell>
      <div className="pt-8 max-w-4xl mx-auto">
        {/* Progress header */}
        <div className="bg-surface-container rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {TYPE_META[selectedType].label} Interview
              </span>
              <span className="text-[10px] font-bold text-zinc-600">
                Question {qIdx + 1} of {questions.length}
              </span>
            </div>
            <div className={`font-mono text-2xl font-black ${timerColor} flex items-center gap-2`}>
              <Icon name="timer" size={20} className={timerColor} />
              {formatTime(timeLeft)}
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-300"
              style={{ width: `${((qIdx) / questions.length) * 100}%` }}
            />
          </div>
          {/* Timer bar */}
          <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timerPct > 50 ? 'bg-green-400' : timerPct > 25 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-surface-container rounded-2xl p-8 mb-5">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-9 h-9 ${TYPE_META[currentQ.type].bg} rounded-xl flex items-center justify-center`}>
              <Icon name={TYPE_META[currentQ.type].icon} size={18} className={TYPE_META[currentQ.type].color} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${DIFF_COLOR[currentQ.category] ?? 'text-zinc-400 bg-zinc-400/10'}`}>
              {currentQ.category}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                <Icon name="schedule" size={12} /> {Math.round(currentQ.timeSeconds / 60)} min suggested
              </span>
            </div>
          </div>
          <p className="text-lg font-bold text-on-surface leading-relaxed whitespace-pre-line mb-6">{currentQ.text}</p>

          {/* Hint toggle */}
          {currentQ.hint && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-yellow-400 transition-colors"
              >
                <Icon name="lightbulb" size={14} className={showHint ? 'text-yellow-400' : ''} />
                {showHint ? 'Hide Hint' : 'Show Hint (think first!)'}
              </button>
              {showHint && (
                <div className="mt-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4">
                  <p className="text-xs text-yellow-300 leading-relaxed">{currentQ.hint}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Response area */}
        <div className="bg-surface-container rounded-2xl overflow-hidden mb-5">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {currentQ.type === 'behavioral' ? 'Your Answer (STAR format)' : currentQ.type === 'dsa' ? 'Your Approach & Solution' : 'Your Design'}
            </p>
            <span className="text-[10px] text-zinc-600">{(answers[currentQ.id] ?? '').length} chars</span>
          </div>
          <textarea
            value={answers[currentQ.id] ?? ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
            placeholder={
              currentQ.type === 'behavioral'
                ? 'Situation: ...\n\nTask: ...\n\nAction: ...\n\nResult: ...'
                : currentQ.type === 'dsa'
                ? 'Approach:\n1. ...\n\nTime complexity: O(?)\nSpace complexity: O(?)\n\nCode:\n```\n\n```'
                : 'Requirements:\n- Functional: ...\n- Non-functional: ...\n\nCapacity estimation: ...\n\nHigh-level design: ...\n\nDatabase: ...\n\nAPI design: ...\n\nScalability: ...'
            }
            rows={14}
            className="w-full bg-transparent p-5 text-sm text-on-surface focus:outline-none resize-none font-mono leading-relaxed"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => { setTimerActive(false); setPhase('done'); }}
            className="text-zinc-500 hover:text-zinc-300 text-sm font-bold flex items-center gap-1 transition-colors"
          >
            <Icon name="stop" size={16} /> End Interview
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTimerActive((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-surface-container text-zinc-400 hover:text-zinc-200 transition-all"
            >
              <Icon name={timerActive ? 'pause' : 'play_arrow'} size={16} />
              {timerActive ? 'Pause' : 'Resume'}
            </button>
            <button
              type="button"
              onClick={nextQuestion}
              className="bg-primary-container text-white font-bold px-8 py-3 rounded-full text-sm hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
            >
              {qIdx < questions.length - 1 ? (
                <><Icon name="arrow_forward" size={16} />Next Question</>
              ) : (
                <><Icon name="check" size={16} />Finish Interview</>
              )}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
