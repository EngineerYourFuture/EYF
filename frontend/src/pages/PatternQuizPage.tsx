import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

// ─── Design tokens ────────────────────────────────────────────────────────────

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  problem: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correct: string;
  explanation: string;
  followUp: string;
  tags: string[];
}

// ─── Questions ────────────────────────────────────────────────────────────────

const ALL_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q01',
    problem: 'Given a sorted array and a target, return the index where the target should be inserted.',
    difficulty: 'easy',
    options: ['Two Pointers', 'Sliding Window', 'Binary Search', 'BFS'],
    correct: 'Binary Search',
    explanation: '"Sorted array + find/insert position" is the classic binary search trigger. Use left + (right-left)/2 as mid. Return left after the loop — it represents the insertion point.',
    followUp: 'What if the array were unsorted? Binary search no longer applies — you\'d need O(n) linear scan or sort first (O(n log n)).',
    tags: ['Binary Search', 'Arrays'],
  },
  {
    id: 'q02',
    problem: 'Find the longest substring with at most K distinct characters.',
    difficulty: 'medium',
    options: ['Two Pointers', 'Sliding Window', 'Binary Search', 'Dynamic Programming'],
    correct: 'Sliding Window',
    explanation: '"Longest/shortest subarray/substring with a condition" = sliding window. Expand right; shrink left when distinct chars > K. Track max window size.',
    followUp: 'If K = 0, the answer is 0. If K ≥ charset size, it\'s the full string length. Handle edge cases before looping.',
    tags: ['Sliding Window', 'Strings'],
  },
  {
    id: 'q03',
    problem: 'Given a list of meeting times [start, end], find the minimum number of conference rooms needed.',
    difficulty: 'medium',
    options: ['Merge Intervals', 'Greedy + Heap', 'Dynamic Programming', 'BFS'],
    correct: 'Greedy + Heap',
    explanation: 'Sort meetings by start time. Use a min-heap of end times. For each meeting: if its start ≥ heap.min, reuse that room (pop + push new end). Otherwise, open a new room (push). Heap size = rooms needed.',
    followUp: 'Related: "do any two meetings overlap?" → sort + check adjacent. "merge all overlapping" → sort + scan.',
    tags: ['Heap', 'Greedy', 'Intervals'],
  },
  {
    id: 'q04',
    problem: 'Given a singly linked list, determine if it has a cycle.',
    difficulty: 'easy',
    options: ['Hash Set', 'Fast & Slow Pointers', 'Two Pointers from ends', 'BFS'],
    correct: 'Fast & Slow Pointers',
    explanation: 'Floyd\'s cycle detection: slow moves 1 step, fast moves 2. If they meet → cycle exists. O(1) space vs O(n) space for hash set approach.',
    followUp: 'To find the cycle start: after detection, reset slow to head. Advance both 1 step at a time — they meet at the cycle start. Why? Mathematical proof: distance from head to cycle start = distance from meeting point to cycle start.',
    tags: ['Linked List', 'Fast & Slow Pointers'],
  },
  {
    id: 'q05',
    problem: 'Given an unsorted array, find the K largest elements.',
    difficulty: 'medium',
    options: ['Sort + Take Last K', 'Min-Heap of size K', 'QuickSelect', 'Binary Search'],
    correct: 'Min-Heap of size K',
    explanation: 'Maintain a min-heap of size K. For each element: if > heap.min, pop min and push element. Final heap contains K largest. O(n log K) vs O(n log n) for full sort.',
    followUp: 'If you need the Kth largest specifically (not all K), QuickSelect is O(n) average. For the K most frequent, use a frequency map + bucket sort or heap.',
    tags: ['Heap', 'Top-K'],
  },
  {
    id: 'q06',
    problem: 'Count the number of distinct islands in a grid.',
    difficulty: 'medium',
    options: ['BFS', 'DFS + Flood Fill', 'Union-Find', 'Dynamic Programming'],
    correct: 'DFS + Flood Fill',
    explanation: 'Classic flood fill: when you find a \'1\', increment count and DFS to mark all connected \'1\'s as visited (set to \'0\'). The number of DFS starts = number of islands.',
    followUp: 'BFS also works. Union-Find is better when you get incremental island additions (e.g., "how many islands form after adding each cell?").',
    tags: ['Graphs', 'DFS'],
  },
  {
    id: 'q07',
    problem: 'Given an array of non-negative integers, find the maximum sum of a subarray of size K.',
    difficulty: 'easy',
    options: ['Brute Force O(n×K)', 'Sliding Window', 'Prefix Sum', 'Binary Search'],
    correct: 'Sliding Window',
    explanation: 'Fixed-size sliding window: init sum of first K elements, then slide — add nums[right], subtract nums[right-K]. Track max sum. O(n) time, O(1) space.',
    followUp: 'Prefix sum is O(n) space but also solves this. When K is variable (e.g., "max sum subarray of length ≥ K"), prefix sum becomes cleaner.',
    tags: ['Sliding Window', 'Arrays'],
  },
  {
    id: 'q08',
    problem: 'Given a string s, return all permutations of s.',
    difficulty: 'medium',
    options: ['Backtracking', 'BFS level-by-level', 'Dynamic Programming', 'Two Pointers'],
    correct: 'Backtracking',
    explanation: 'Backtracking: at each step, choose an unused character, add to current path, recurse, then remove (backtrack). Decision tree has n! leaf nodes for n-char string.',
    followUp: '"All combinations" → backtracking with start index to avoid reuse. "All subsets" → include/exclude at each step. "Permutations with duplicates" → sort + skip duplicate choices at same level.',
    tags: ['Backtracking', 'Recursion'],
  },
  {
    id: 'q09',
    problem: 'You can reach a new item in a sequence only if the previous item was accessible. In how many ways can you reach item N?',
    difficulty: 'medium',
    options: ['BFS', 'Greedy', 'Dynamic Programming', 'Binary Search'],
    correct: 'Dynamic Programming',
    explanation: '"How many ways to reach X" + "overlapping subproblems" = DP. Define dp[i] = ways to reach position i. Transition: dp[i] = sum of dp[j] for all valid j that can reach i.',
    followUp: 'Memoization (top-down) is often easier to write. Tabulation (bottom-up) avoids call stack and is slightly faster. If you only need the current and previous row, you can optimize to O(1) space.',
    tags: ['Dynamic Programming'],
  },
  {
    id: 'q10',
    problem: 'Given a list of tasks with dependencies, find a valid execution order.',
    difficulty: 'medium',
    options: ['BFS', 'Topological Sort (Kahn\'s)', 'DFS', 'Greedy'],
    correct: 'Topological Sort (Kahn\'s)',
    explanation: 'Directed acyclic graph (DAG) with dependencies = topological sort. Kahn\'s: compute in-degrees, queue nodes with in-degree 0, dequeue + decrement neighbors. If result length < n → cycle detected (impossible order).',
    followUp: 'DFS-based topo sort also works: push to stack on finish, then reverse. Kahn\'s is better for cycle detection and parallel task scheduling (can process all 0-in-degree nodes simultaneously).',
    tags: ['Graphs', 'Topological Sort'],
  },
  {
    id: 'q11',
    problem: 'Merge two sorted linked lists into one sorted list.',
    difficulty: 'easy',
    options: ['Two Pointers', 'Merge Sort', 'Recursion', 'Stack'],
    correct: 'Two Pointers',
    explanation: 'Classic merge: maintain a pointer to each list. Compare heads, take the smaller, advance that pointer. When one list is exhausted, append the other.',
    followUp: 'Merging K sorted lists: use a min-heap of K elements. O(n log K) total. Alternative: pair-wise merge like merge sort: O(n log K) but simpler implementation.',
    tags: ['Linked List', 'Two Pointers'],
  },
  {
    id: 'q12',
    problem: 'Find the shortest path from source to all other nodes in a weighted graph (all weights positive).',
    difficulty: 'hard',
    options: ['BFS', 'DFS', 'Dijkstra\'s Algorithm', 'Floyd-Warshall'],
    correct: 'Dijkstra\'s Algorithm',
    explanation: 'BFS finds shortest path by hop count (unweighted). Dijkstra finds shortest path by total weight (weighted, non-negative). Priority queue: always process the node with smallest current distance.',
    followUp: 'Negative weights? Use Bellman-Ford O(VE). All-pairs shortest paths? Floyd-Warshall O(V³). Unweighted? BFS O(V+E).',
    tags: ['Graphs', 'Dijkstra', 'Shortest Path'],
  },
  {
    id: 'q13',
    problem: 'Given a list of words and a target word, find the minimum number of transformations from start to target, changing one letter at a time, each intermediate word must be in the word list.',
    difficulty: 'hard',
    options: ['DFS', 'BFS', 'Dynamic Programming', 'Backtracking'],
    correct: 'BFS',
    explanation: 'Word Ladder: BFS finds the shortest transformation sequence. Each word is a node; edges exist between words differing by 1 letter. BFS level = transformation count.',
    followUp: 'Bidirectional BFS cuts the search space significantly. Start BFS from both ends and stop when they meet. Can reduce O(b^d) to O(b^(d/2)).',
    tags: ['BFS', 'Strings', 'Graphs'],
  },
  {
    id: 'q14',
    problem: 'Implement an autocomplete system — given a prefix, return the top 3 most frequent matching sentences.',
    difficulty: 'hard',
    options: ['Binary Search', 'Trie + Priority Queue', 'Hash Map', 'Sliding Window'],
    correct: 'Trie + Priority Queue',
    explanation: 'Trie stores all sentences character by character. Each node stores frequency of sentences passing through it. On query: traverse trie to prefix end, then BFS/DFS to find top-K by frequency (min-heap of size K).',
    followUp: 'Pure hash map: O(n) per query to filter matching sentences. Trie: O(m) to reach prefix + O(results) to gather. Trie wins when prefix queries are frequent.',
    tags: ['Trie', 'Heap', 'Strings'],
  },
  {
    id: 'q15',
    problem: 'Given a 2D grid with 0s (empty) and 1s (blocked), find the shortest path from top-left to bottom-right.',
    difficulty: 'medium',
    options: ['DFS', 'BFS', 'Dynamic Programming', 'Dijkstra'],
    correct: 'BFS',
    explanation: 'Unweighted grid shortest path = BFS. BFS explores level by level, so the first time you reach the destination, that\'s the shortest path. DFS would find A path, not necessarily the shortest.',
    followUp: 'If cells have weights (different terrain costs), use Dijkstra with a priority queue. If moves have negative costs (unusual), use Bellman-Ford or SPFA.',
    tags: ['BFS', 'Graphs', 'Grid'],
  },
  {
    id: 'q16',
    problem: 'Given a sorted array, remove duplicates in-place and return the new length.',
    difficulty: 'easy',
    options: ['Two Pointers (same direction)', 'Two Pointers (opposite ends)', 'Sliding Window', 'Hash Set'],
    correct: 'Two Pointers (same direction)',
    explanation: 'Slow pointer tracks the position to write the next unique element. Fast pointer scans ahead. When nums[fast] ≠ nums[slow], increment slow and copy: nums[slow] = nums[fast]. O(n) time, O(1) space.',
    followUp: 'Remove all occurrences of a specific value: same pattern. Allow at most 2 duplicates (LC 80): compare nums[fast] to nums[slow-2] instead of nums[slow].',
    tags: ['Two Pointers', 'Arrays'],
  },
  {
    id: 'q17',
    problem: 'Find the maximum profit you can achieve by buying and selling a stock (can hold at most 1 share at a time, unlimited transactions).',
    difficulty: 'medium',
    options: ['Dynamic Programming', 'Greedy', 'Sliding Window', 'Divide and Conquer'],
    correct: 'Greedy',
    explanation: 'If prices[i+1] > prices[i], buy at i and sell at i+1. Sum all profitable day-to-day differences. This greedy "buy/sell every rising day" gives the same result as the optimal multi-transaction strategy.',
    followUp: 'With at most K transactions: DP with state dp[k][day] = max profit using at most k transactions up to day. With a cooldown: DP with states (held, sold, cooldown).',
    tags: ['Greedy', 'Arrays'],
  },
  {
    id: 'q18',
    problem: 'Given a string, determine if it can be segmented into words from a given dictionary.',
    difficulty: 'medium',
    options: ['Backtracking', 'Dynamic Programming', 'Greedy', 'Trie'],
    correct: 'Dynamic Programming',
    explanation: 'dp[i] = can the first i characters be segmented? dp[0] = true. For each i, check all j < i: if dp[j] is true AND s[j..i] is in the dictionary, then dp[i] = true. O(n²) time.',
    followUp: 'Backtracking (with memoization) also works but is essentially top-down DP. Trie can speed up the dictionary lookup from O(word_len) to O(n) per position.',
    tags: ['Dynamic Programming', 'Strings'],
  },
  {
    id: 'q19',
    problem: 'Given an array, return the number of pairs (i, j) where i < j and nums[i] + nums[j] equals a target.',
    difficulty: 'easy',
    options: ['Brute Force O(n²)', 'Two Pointers (sorted array)', 'Hash Map O(n)', 'Binary Search per element'],
    correct: 'Hash Map O(n)',
    explanation: 'Hash map stores count of each number seen so far. For each nums[i], pairs += map.get(target - nums[i]) ?? 0. Then map[nums[i]]++. O(n) time, O(n) space. Two pointers requires sorting first (O(n log n)).',
    followUp: 'If you need actual pairs, store indices. If counting distinct pairs (not ordered), divide by 2 at the end. If k-Sum (k > 2), fix k-2 elements with nested loops, then use two pointers for the last 2.',
    tags: ['Hashing', 'Two Pointers', 'Arrays'],
  },
  {
    id: 'q20',
    problem: 'Serialize and deserialize a binary tree.',
    difficulty: 'hard',
    options: ['Inorder + Preorder', 'BFS Level Order', 'DFS Preorder', 'Both BFS and DFS work'],
    correct: 'Both BFS and DFS work',
    explanation: 'DFS preorder: serialize as "root,left,right" with "#" for null. Deserialize using a queue of tokens. BFS: serialize level by level with nulls for missing children. Both reconstruct the unique tree. Preorder is slightly simpler to implement.',
    followUp: 'Inorder alone cannot uniquely reconstruct a tree — many trees have the same inorder traversal. You need at least 2 traversals (inorder + preorder/postorder) without null markers.',
    tags: ['Trees', 'BFS', 'DFS'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFF_META: Record<string, { color: string; bg: string; border: string }> = {
  easy:   { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.2)'   },
  medium: { color: '#facc15', bg: 'rgba(250,204,21,0.08)',   border: 'rgba(250,204,21,0.2)'   },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.2)'  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuizQuestions(difficulty: 'all' | 'easy' | 'medium' | 'hard', count: number): QuizQuestion[] {
  const pool = difficulty === 'all' ? ALL_QUESTIONS : ALL_QUESTIONS.filter(q => q.difficulty === difficulty);
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PatternQuizPage() {
  const { fireXP } = useUser();
  const [mode, setMode] = useState<'home' | 'quiz' | 'results'>('home');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Array<{ question: QuizQuestion; selected: string; correct: boolean }>>([]);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [questionCount, setQuestionCount] = useState(10);
  const [timer, setTimer] = useState(0);
  const [timedMode, setTimedMode] = useState(false);

  const startQuiz = useCallback(() => {
    const picked = pickQuizQuestions(difficulty, questionCount);
    setQuestions(picked);
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setAnswers([]);
    setTimer(0);
    setMode('quiz');
  }, [difficulty, questionCount]);

  useEffect(() => {
    if (mode !== 'quiz' || !timedMode) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [mode, timedMode]);

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
    const q = questions[current]!;
    const correct = option === q.correct;
    if (correct) setScore(s => s + 1);
    setAnswers(prev => [...prev, { question: q, selected: option, correct }]);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      const xpEarned = score * 10;
      fireXP(xpEarned, `Pattern Quiz: ${score}/${questions.length} correct!`);
      setMode('results');
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const q = questions[current];
  const answeredOffset = answered ? 1 : 0;
  const progressPct = questions.length > 0 ? Math.round(((current + answeredOffset) / questions.length) * 100) : 0;
  const accuracy = answers.length > 0 ? Math.round((score / answers.length) * 100) : 0;
  let resultEmoji = '💪';
  if (accuracy >= 80) resultEmoji = '🏆';
  else if (accuracy >= 60) resultEmoji = '🎯';
  let resultMsg = 'Keep practicing! Pattern recognition builds with repetition.';
  if (accuracy >= 80) resultMsg = 'Excellent! Your pattern recognition is interview-ready. 🔥';
  else if (accuracy >= 60) resultMsg = 'Good progress! Review the patterns you missed below.';
  let scoreGradient: string;
  if (accuracy >= 80) { scoreGradient = 'linear-gradient(135deg,#4ade80,#22d3ee)'; }
  else if (accuracy >= 60) { scoreGradient = 'linear-gradient(135deg,#facc15,#fb923c)'; }
  else { scoreGradient = 'linear-gradient(135deg,#f87171,#fb923c)'; }

  return (
    <AppShell>
      <div className="pt-8 max-w-3xl mx-auto">

        {/* ── Home ── */}
        {mode === 'home' && (
          <>
            {/* Hero card */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              style={{ ...GLASS, borderRadius: 24, padding: '2.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
              {/* ambient glow */}
              <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, background: 'rgba(99,102,241,0.08)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

              <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase', position: 'relative' }}>
                EYF · Pattern Recognition
              </p>
              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em',
                background: 'linear-gradient(135deg, #fff 30%, #818cf8 60%, #c084fc)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 12, position: 'relative',
              }}>
                PATTERN QUIZ.
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 480, marginBottom: 24, position: 'relative' }}>
                The hardest part of coding interviews isn't implementing the algorithm — it's recognizing{' '}
                <em style={{ color: 'rgba(255,255,255,0.7)' }}>which</em> pattern to use. Train your pattern-matching instinct with{' '}
                20 real interview scenarios and the <em style={{ color: 'rgba(255,255,255,0.7)' }}>why</em> behind each answer.
              </p>

              {/* Config */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" style={{ position: 'relative' }}>
                <div>
                  <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 8, textTransform: 'uppercase' }}>Difficulty</p>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, gap: 2 }}>
                    {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                      <button key={d} onClick={() => setDifficulty(d)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: '0.5625rem', fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                          background: difficulty === d ? 'rgba(99,102,241,0.2)' : 'transparent',
                          color: difficulty === d ? '#818cf8' : 'rgba(255,255,255,0.25)',
                        }}>
                        {d === 'all' ? 'All' : d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 8, textTransform: 'uppercase' }}>Questions</p>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, gap: 2 }}>
                    {[5, 10, 20].map((n) => (
                      <button key={n} onClick={() => setQuestionCount(n)}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: '0.5625rem', fontWeight: 700,
                          letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                          background: questionCount === n ? 'rgba(99,102,241,0.2)' : 'transparent',
                          color: questionCount === n ? '#818cf8' : 'rgba(255,255,255,0.25)',
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 8, textTransform: 'uppercase' }}>Timer</p>
                  <button onClick={() => setTimedMode(!timedMode)}
                    style={{
                      width: '100%', padding: '10px 0', borderRadius: 12, fontSize: '0.5625rem', fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
                      background: timedMode ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: timedMode ? '#818cf8' : 'rgba(255,255,255,0.25)',
                      border: timedMode ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    {timedMode ? '⏱ Timed On' : 'No Timer'}
                  </button>
                </div>
              </div>

              <motion.button onClick={startQuiz}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 900,
                  fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '14px 32px', borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 0 32px rgba(99,102,241,0.4)', cursor: 'pointer', position: 'relative',
                }}>
                <Icon name="play_arrow" size={16} />
                Start Quiz
              </motion.button>
            </motion.div>

            {/* Patterns covered */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ ...GLASS, borderRadius: 20, padding: '1.5rem' }}>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 16 }}>Patterns Covered</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(ALL_QUESTIONS.flatMap(q => q.tags))).sort((a, b) => a.localeCompare(b)).map((tag) => (
                  <span key={tag} style={{ padding: '6px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 700, color: 'rgba(129,140,248,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* ── Quiz ── */}
        {mode === 'quiz' && q && (
          <>
            {/* Progress header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.1em' }}>
                  {current + 1} / {questions.length}
                </span>
                <div className="flex items-center gap-4">
                  {timedMode && (
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="timer" size={11} />
                      {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                    </span>
                  )}
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#4ade80' }}>{score} correct</span>
                </div>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 999 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>

            {/* Question card */}
            <AnimatePresence mode="wait">
              <motion.div key={q.id}
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -16 }}
                style={{ ...GLASS, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{
                    fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '4px 12px', borderRadius: 9999,
                    color: DIFF_META[q.difficulty].color, background: DIFF_META[q.difficulty].bg, border: `1px solid ${DIFF_META[q.difficulty].border}`,
                  }}>
                    {q.difficulty}
                  </span>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {q.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '24px 24px 16px' }}>
                  <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#818cf8', marginBottom: 12 }}>
                    Which pattern / approach solves this problem?
                  </p>
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, fontWeight: 500 }}>{q.problem}</p>
                </div>

                {/* Options */}
                <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((option) => {
                    let optBg = 'rgba(255,255,255,0.03)';
                    let optBorder = 'rgba(255,255,255,0.07)';
                    let optColor = 'rgba(255,255,255,0.7)';
                    let optOpacity = 1;
                    let optShadow = 'none';
                    if (answered) {
                      if (option === q.correct) {
                        optBg = 'rgba(74,222,128,0.1)';
                        optBorder = 'rgba(74,222,128,0.3)';
                        optColor = '#4ade80';
                        optShadow = '0 0 16px rgba(74,222,128,0.12)';
                      } else if (option === selected) {
                        optBg = 'rgba(248,113,113,0.1)';
                        optBorder = 'rgba(248,113,113,0.3)';
                        optColor = '#f87171';
                      } else {
                        optOpacity = 0.35;
                      }
                    }
                    return (
                      <motion.button key={option} type="button"
                        onClick={() => handleSelect(option)}
                        disabled={answered}
                        whileHover={answered ? {} : { scale: 1.01, borderColor: 'rgba(99,102,241,0.4)' }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '16px 20px', borderRadius: 14,
                          fontSize: '0.875rem', fontWeight: 700, transition: 'all 0.2s', cursor: answered ? 'default' : 'pointer',
                          background: optBg, border: `1px solid ${optBorder}`, color: optColor,
                          opacity: optOpacity, boxShadow: optShadow,
                        }}>
                        {answered && option === q.correct && '✓ '}
                        {answered && option === selected && option !== q.correct && '✗ '}
                        {option}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {answered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ margin: '0 24px 24px', padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}
                    >
                      <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, color: selected === q.correct ? '#4ade80' : '#f87171' }}>
                        {selected === q.correct ? '✓ Correct!' : `✗ Correct answer: ${q.correct}`}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 12 }}>{q.explanation}</p>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.75rem', color: 'var(--t2)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                        <Icon name="lightbulb" size={13} style={{ color: '#facc15', flexShrink: 0, marginTop: 2 }} />
                        <p style={{ lineHeight: 1.6 }}>{q.followUp}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>

            {answered && (
              <motion.button onClick={handleNext}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', background: 'linear-gradient(135deg,#E82127,#ff6b35)', color: '#fff',
                  fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: 16, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, boxShadow: '0 0 28px rgba(232,33,39,0.35)', cursor: 'pointer',
                }}>
                {current + 1 >= questions.length ? (
                  <><Icon name="emoji_events" size={16} /> View Results</>
                ) : (
                  <><Icon name="arrow_forward" size={16} /> Next Question</>
                )}
              </motion.button>
            )}
          </>
        )}

        {/* ── Results ── */}
        {mode === 'results' && (
          <>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              style={{ ...GLASS, borderRadius: 24, padding: '2.5rem', marginBottom: 24, textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>{resultEmoji}</div>
              <h2 style={{
                fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: 4,
                background: scoreGradient,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {score} / {questions.length}
              </h2>
              <p style={{ color: 'var(--t2)', marginBottom: 24 }}>
                {accuracy}% accuracy
                {timedMode && <span style={{ marginLeft: 8 }}>· {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>}
              </p>

              <div className="flex gap-3 justify-center flex-wrap mb-6">
                {[
                  { label: 'Correct',  value: score,                color: '#4ade80', bg: 'rgba(74,222,128,0.08)',   border: 'rgba(74,222,128,0.2)'   },
                  { label: 'Wrong',    value: questions.length - score, color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)'  },
                  { label: 'XP Earned',value: `+${score * 10}`,    color: '#818cf8', bg: 'rgba(99,102,241,0.08)',   border: 'rgba(99,102,241,0.2)'   },
                ].map((s) => (
                  <div key={s.label} style={{ padding: '12px 20px', borderRadius: 16, background: s.bg, border: `1px solid ${s.border}` }}>
                    <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--t2)', maxWidth: 380, margin: '0 auto' }}>{resultMsg}</p>
            </motion.div>

            {/* Review */}
            <div className="space-y-3 mb-6">
              <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>Review</p>
              {answers.map((a, i) => (
                <motion.div key={a.question.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  style={{
                    borderRadius: 16, border: `1px solid ${a.correct ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'}`,
                    background: a.correct ? 'rgba(74,222,128,0.04)' : 'rgba(248,113,113,0.04)', padding: 16,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, background: a.correct ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', color: a.correct ? '#4ade80' : '#f87171' }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500, lineHeight: 1.6, marginBottom: 8 }}>{a.question.problem}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: a.correct ? '#4ade80' : '#f87171' }}>
                          {a.correct ? '✓' : '✗'} Your answer: {a.selected}
                        </span>
                        {!a.correct && (
                          <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#4ade80' }}>→ Correct: {a.question.correct}</span>
                        )}
                      </div>
                      {!a.correct && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--t3)', marginTop: 8, lineHeight: 1.6 }}>{a.question.explanation}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <motion.button onClick={startQuiz}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, background: 'linear-gradient(135deg,#E82127,#ff6b35)', color: '#fff', fontWeight: 900,
                  fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: 16,
                  borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 0 24px rgba(232,33,39,0.3)', cursor: 'pointer',
                }}>
                <Icon name="refresh" size={16} /> Try Again
              </motion.button>
              <motion.button onClick={() => setMode('home')}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, ...GLASS, color: 'rgba(255,255,255,0.6)', fontWeight: 900,
                  fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: 16,
                  borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                New Quiz
              </motion.button>
              <Link to="/app/flashcards" style={{ flex: 1 }}>
                <button type="button" style={{
                  width: '100%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                  color: '#818cf8', fontWeight: 900, fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: 16, borderRadius: 9999, cursor: 'pointer',
                }}>
                  Review Flashcards
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
