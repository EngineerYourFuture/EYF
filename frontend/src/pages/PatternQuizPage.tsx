import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

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

const DIFF_STYLE: Record<string, string> = {
  easy:   'text-green-400 bg-green-500/10 border-green-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  hard:   'text-red-400 bg-red-500/10 border-red-500/20',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0]! % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
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
    const pool = difficulty === 'all' ? ALL_QUESTIONS : ALL_QUESTIONS.filter(q => q.difficulty === difficulty);
    const picked = shuffle(pool).slice(0, Math.min(questionCount, pool.length));
    setQuestions(picked);
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setAnswers([]);
    setTimer(0);
    setMode('quiz');
  }, [difficulty, questionCount]);

  // Timer
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
  const progressPct = questions.length > 0 ? Math.round(((current + (answered ? 1 : 0)) / questions.length) * 100) : 0;
  const accuracy = answers.length > 0 ? Math.round((score / answers.length) * 100) : 0;

  return (
    <AppShell>
      <div className="pt-8 max-w-3xl mx-auto">

        {/* ── Home ── */}
        {mode === 'home' && (
          <>
            {/* Hero */}
            <div className="bg-surface-container rounded-2xl p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />
              <div className="flex items-center gap-4 mb-6 relative">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                  <Icon name="quiz" size={28} className="text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tighter">Pattern Recognition Quiz</h1>
                  <p className="text-on-surface-variant text-sm">Train your instinct for choosing the right algorithm.</p>
                </div>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed mb-6 relative max-w-xl">
                The hardest part of coding interviews isn't implementing the algorithm — it's recognizing
                <em> which</em> pattern to use. This quiz trains your pattern-matching instinct with 20 real
                interview scenarios and explains the <em>why</em> behind each answer.
              </p>

              {/* Config */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 relative">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Difficulty</label>
                  <div className="flex gap-1 bg-zinc-900 rounded-xl p-1">
                    {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                          difficulty === d ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-600 hover:text-zinc-300'
                        }`}
                      >
                        {d === 'all' ? 'All' : d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Questions</label>
                  <div className="flex gap-1 bg-zinc-900 rounded-xl p-1">
                    {[5, 10, 20].map((n) => (
                      <button
                        key={n}
                        onClick={() => setQuestionCount(n)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                          questionCount === n ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-600 hover:text-zinc-300'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Timer</label>
                  <button
                    onClick={() => setTimedMode(!timedMode)}
                    className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                      timedMode ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'border-zinc-800 text-zinc-600 hover:text-zinc-300'
                    }`}
                  >
                    {timedMode ? '⏱ Timed On' : 'No Timer'}
                  </button>
                </div>
              </div>

              <button
                onClick={startQuiz}
                className="bg-[#E82127] text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-full hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-red-900/30 flex items-center gap-2 relative"
              >
                <Icon name="play_arrow" size={16} />
                Start Quiz
              </button>
            </div>

            {/* Preview of patterns covered */}
            <div className="bg-surface-container rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Patterns Covered</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(ALL_QUESTIONS.flatMap(q => q.tags))).sort((a, b) => a.localeCompare(b)).map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Quiz ── */}
        {mode === 'quiz' && q && (
          <>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-zinc-600">{current + 1} / {questions.length}</span>
                <div className="flex items-center gap-3">
                  {timedMode && (
                    <span className="text-[10px] font-bold text-zinc-500">
                      <Icon name="timer" size={11} className="inline mr-1" />
                      {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-green-400">{score} correct</span>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="bg-surface-container rounded-2xl overflow-hidden mb-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${DIFF_STYLE[q.difficulty]}`}>
                  {q.difficulty}
                </span>
                <div className="flex gap-2">
                  {q.tags.map((tag) => (
                    <span key={tag} className="text-[9px] font-bold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">Which pattern / approach solves this problem?</p>
                <p className="text-on-surface text-base leading-relaxed font-medium">{q.problem}</p>
              </div>

              {/* Options */}
              <div className="px-6 pb-6 space-y-2">
                {q.options.map((option) => {
                  let style = 'bg-surface-container-high border-white/5 hover:border-indigo-500/30 hover:text-white';
                  if (answered) {
                    if (option === q.correct) style = 'bg-green-500/10 border-green-500/30 text-green-400';
                    else if (option === selected) style = 'bg-red-500/10 border-red-500/30 text-red-400';
                    else style = 'bg-surface-container-high border-white/5 opacity-40';
                  }
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelect(option)}
                      disabled={answered}
                      className={`w-full text-left px-5 py-4 rounded-xl border text-sm font-bold transition-all ${style} ${!answered ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span className={answered && option === q.correct ? 'text-green-400' : ''}>
                        {answered && option === q.correct && '✓ '}
                        {answered && option === selected && option !== q.correct && '✗ '}
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (revealed after answering) */}
              {answered && (
                <div className="mx-6 mb-6 p-4 bg-zinc-900 border border-white/5 rounded-xl">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${selected === q.correct ? 'text-green-400' : 'text-red-400'}`}>
                    {selected === q.correct ? '✓ Correct!' : `✗ Correct answer: ${q.correct}`}
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed mb-3">{q.explanation}</p>
                  <div className="flex items-start gap-2 text-xs text-zinc-500 border-t border-white/5 pt-3 mt-3">
                    <Icon name="lightbulb" size={13} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p>{q.followUp}</p>
                  </div>
                </div>
              )}
            </div>

            {answered && (
              <button
                onClick={handleNext}
                className="w-full bg-[#E82127] text-white font-black uppercase tracking-widest text-xs py-4 rounded-full hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {current + 1 >= questions.length ? (
                  <><Icon name="emoji_events" size={16} /> View Results</>
                ) : (
                  <><Icon name="arrow_forward" size={16} /> Next Question</>
                )}
              </button>
            )}
          </>
        )}

        {/* ── Results ── */}
        {mode === 'results' && (
          <>
            <div className="bg-surface-container rounded-2xl p-8 mb-6 text-center">
              <div className="text-6xl mb-4">
                {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎯' : '💪'}
              </div>
              <h2 className="text-3xl font-black tracking-tighter mb-1">
                {score} / {questions.length}
              </h2>
              <p className="text-on-surface-variant mb-6">
                {accuracy}% accuracy
                {timedMode && <span className="ml-2">· {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>}
              </p>

              <div className="flex gap-3 justify-center flex-wrap mb-6">
                <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Correct</p>
                  <p className="text-xl font-black text-green-400">{score}</p>
                </div>
                <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Wrong</p>
                  <p className="text-xl font-black text-red-400">{questions.length - score}</p>
                </div>
                <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">XP Earned</p>
                  <p className="text-xl font-black text-indigo-400">+{score * 10}</p>
                </div>
              </div>

              <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
                {accuracy >= 80 ? 'Excellent! Your pattern recognition is interview-ready. 🔥' :
                 accuracy >= 60 ? 'Good progress! Review the patterns you missed below.' :
                 'Keep practicing! Pattern recognition builds with repetition.'}
              </p>
            </div>

            {/* Detailed review */}
            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Review</p>
              {answers.map((a, i) => (
                <div
                  key={a.question.id}
                  className={`rounded-xl border p-4 ${a.correct ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-black ${a.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface font-medium leading-relaxed mb-2">{a.question.problem}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold ${a.correct ? 'text-green-400' : 'text-red-400'}`}>
                          {a.correct ? '✓' : '✗'} Your answer: {a.selected}
                        </span>
                        {!a.correct && (
                          <span className="text-[10px] text-green-400 font-bold">→ Correct: {a.question.correct}</span>
                        )}
                      </div>
                      {!a.correct && (
                        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{a.question.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={startQuiz}
                className="flex-1 bg-[#E82127] text-white font-black uppercase tracking-widest text-xs py-4 rounded-full hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Icon name="refresh" size={16} />
                Try Again
              </button>
              <button
                onClick={() => setMode('home')}
                className="flex-1 bg-surface-container text-on-surface font-black uppercase tracking-widest text-xs py-4 rounded-full hover:bg-surface-container-high transition-all"
              >
                New Quiz
              </button>
              <Link to="/app/flashcards" className="flex-1">
                <button
                  type="button"
                  className="w-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black uppercase tracking-widest text-xs py-4 rounded-full hover:bg-indigo-500/20 transition-all"
                >
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
