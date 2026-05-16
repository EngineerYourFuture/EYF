import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface Problem {
  id: string;
  number?: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
  acceptanceRate?: number;
  solved?: boolean;
  xpReward?: number;
}

interface ProblemsResponse {
  problems: Problem[];
  total?: number;
  stats?: {
    totalSolved: number;
    easySolved: number; easyTotal: number;
    mediumSolved: number; mediumTotal: number;
    hardSolved: number; hardTotal: number;
  };
}

const DIFF_STYLE: Record<string, string> = {
  easy:   'text-green-400 bg-green-400/10 border-green-500/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20',
  hard:   'text-red-400 bg-red-400/10 border-red-500/20',
};

const TOPIC_TAGS = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue',
  'Trees', 'Graphs', 'Dynamic Programming', 'Recursion', 'Backtracking',
  'Binary Search', 'Sorting', 'Hashing', 'Greedy', 'Math',
  'Two Pointers', 'Sliding Window', 'Heap', 'Trie', 'Segment Tree',
];

const STATIC_PROBLEMS: Problem[] = [
  // Arrays
  { id: 'two-sum', number: 1, title: 'Two Sum', difficulty: 'easy', category: 'Arrays', tags: ['Arrays', 'Hashing'], acceptanceRate: 49, xpReward: 30 },
  { id: 'best-time-stock', number: 121, title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', category: 'Arrays', tags: ['Arrays', 'Greedy'], acceptanceRate: 54, xpReward: 30 },
  { id: 'contains-duplicate', number: 217, title: 'Contains Duplicate', difficulty: 'easy', category: 'Arrays', tags: ['Arrays', 'Hashing'], acceptanceRate: 61, xpReward: 30 },
  { id: 'product-except-self', number: 238, title: 'Product of Array Except Self', difficulty: 'medium', category: 'Arrays', tags: ['Arrays'], acceptanceRate: 64, xpReward: 60 },
  { id: 'maximum-subarray', number: 53, title: 'Maximum Subarray (Kadane\'s)', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Dynamic Programming'], acceptanceRate: 50, xpReward: 60 },
  { id: 'max-product-subarray', number: 152, title: 'Maximum Product Subarray', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Dynamic Programming'], acceptanceRate: 35, xpReward: 60 },
  { id: 'find-min-rotated', number: 153, title: 'Find Minimum in Rotated Sorted Array', difficulty: 'medium', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], acceptanceRate: 48, xpReward: 60 },
  { id: 'search-rotated', number: 33, title: 'Search in Rotated Sorted Array', difficulty: 'medium', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], acceptanceRate: 39, xpReward: 60 },
  { id: 'three-sum', number: 15, title: '3Sum', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Two Pointers'], acceptanceRate: 32, xpReward: 60 },
  { id: 'container-water', number: 11, title: 'Container With Most Water', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Two Pointers', 'Greedy'], acceptanceRate: 54, xpReward: 60 },
  { id: 'trapping-rain', number: 42, title: 'Trapping Rain Water', difficulty: 'hard', category: 'Arrays', tags: ['Arrays', 'Two Pointers', 'Stack'], acceptanceRate: 60, xpReward: 100 },
  // Strings
  { id: 'valid-anagram', number: 242, title: 'Valid Anagram', difficulty: 'easy', category: 'Strings', tags: ['Strings', 'Hashing'], acceptanceRate: 63, xpReward: 30 },
  { id: 'valid-palindrome', number: 125, title: 'Valid Palindrome', difficulty: 'easy', category: 'Strings', tags: ['Strings', 'Two Pointers'], acceptanceRate: 47, xpReward: 30 },
  { id: 'group-anagrams', number: 49, title: 'Group Anagrams', difficulty: 'medium', category: 'Strings', tags: ['Strings', 'Hashing'], acceptanceRate: 67, xpReward: 60 },
  { id: 'longest-substring', number: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', category: 'Sliding Window', tags: ['Strings', 'Sliding Window', 'Hashing'], acceptanceRate: 34, xpReward: 60 },
  { id: 'longest-repeating', number: 424, title: 'Longest Repeating Character Replacement', difficulty: 'medium', category: 'Sliding Window', tags: ['Strings', 'Sliding Window'], acceptanceRate: 53, xpReward: 60 },
  { id: 'min-window-substring', number: 76, title: 'Minimum Window Substring', difficulty: 'hard', category: 'Sliding Window', tags: ['Strings', 'Sliding Window', 'Hashing'], acceptanceRate: 41, xpReward: 100 },
  { id: 'valid-parentheses', number: 20, title: 'Valid Parentheses', difficulty: 'easy', category: 'Stack', tags: ['Stack', 'Strings'], acceptanceRate: 40, xpReward: 30 },
  { id: 'encode-decode', number: 271, title: 'Encode and Decode Strings', difficulty: 'medium', category: 'Strings', tags: ['Strings'], acceptanceRate: 39, xpReward: 60 },
  // Linked List
  { id: 'reverse-linked-list', number: 206, title: 'Reverse a Linked List', difficulty: 'easy', category: 'Linked List', tags: ['Linked List', 'Recursion'], acceptanceRate: 74, xpReward: 30 },
  { id: 'merge-two-lists', number: 21, title: 'Merge Two Sorted Lists', difficulty: 'easy', category: 'Linked List', tags: ['Linked List', 'Recursion'], acceptanceRate: 64, xpReward: 30 },
  { id: 'linked-list-cycle', number: 141, title: 'Linked List Cycle', difficulty: 'easy', category: 'Linked List', tags: ['Linked List', 'Two Pointers'], acceptanceRate: 48, xpReward: 30 },
  { id: 'reorder-list', number: 143, title: 'Reorder List', difficulty: 'medium', category: 'Linked List', tags: ['Linked List', 'Two Pointers', 'Recursion'], acceptanceRate: 57, xpReward: 60 },
  { id: 'remove-nth-node', number: 19, title: 'Remove Nth Node From End of List', difficulty: 'medium', category: 'Linked List', tags: ['Linked List', 'Two Pointers'], acceptanceRate: 40, xpReward: 60 },
  { id: 'merge-k-lists', number: 23, title: 'Merge K Sorted Lists', difficulty: 'hard', category: 'Linked List', tags: ['Linked List', 'Heap', 'Merge Sort'], acceptanceRate: 50, xpReward: 100 },
  // Trees
  { id: 'invert-tree', number: 226, title: 'Invert Binary Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion', 'Binary Search'], acceptanceRate: 76, xpReward: 30 },
  { id: 'max-depth-tree', number: 104, title: 'Maximum Depth of Binary Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion'], acceptanceRate: 74, xpReward: 30 },
  { id: 'same-tree', number: 100, title: 'Same Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion'], acceptanceRate: 60, xpReward: 30 },
  { id: 'subtree-of-tree', number: 572, title: 'Subtree of Another Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion'], acceptanceRate: 46, xpReward: 30 },
  { id: 'lca-bst', number: 235, title: 'Lowest Common Ancestor of BST', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Binary Search'], acceptanceRate: 64, xpReward: 60 },
  { id: 'level-order', number: 102, title: 'Binary Tree Level Order Traversal', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Graphs'], acceptanceRate: 66, xpReward: 60 },
  { id: 'right-side-view', number: 199, title: 'Binary Tree Right Side View', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Graphs'], acceptanceRate: 62, xpReward: 60 },
  { id: 'count-good-nodes', number: 1448, title: 'Count Good Nodes in Binary Tree', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Recursion'], acceptanceRate: 73, xpReward: 60 },
  { id: 'validate-bst', number: 98, title: 'Validate Binary Search Tree', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Recursion'], acceptanceRate: 32, xpReward: 60 },
  { id: 'kth-smallest-bst', number: 230, title: 'Kth Smallest Element in BST', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Binary Search'], acceptanceRate: 71, xpReward: 60 },
  { id: 'binary-tree-diam', number: 543, title: 'Diameter of Binary Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion'], acceptanceRate: 58, xpReward: 30 },
  { id: 'max-path-sum', number: 124, title: 'Binary Tree Maximum Path Sum', difficulty: 'hard', category: 'Trees', tags: ['Trees', 'Dynamic Programming'], acceptanceRate: 39, xpReward: 100 },
  { id: 'serialize-tree', number: 297, title: 'Serialize and Deserialize Binary Tree', difficulty: 'hard', category: 'Trees', tags: ['Trees', 'Recursion'], acceptanceRate: 56, xpReward: 100 },
  // Graphs
  { id: 'num-islands', number: 200, title: 'Number of Islands', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Recursion'], acceptanceRate: 57, xpReward: 60 },
  { id: 'max-area-island', number: 695, title: 'Max Area of Island', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Recursion'], acceptanceRate: 71, xpReward: 60 },
  { id: 'clone-graph', number: 133, title: 'Clone Graph', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Recursion'], acceptanceRate: 53, xpReward: 60 },
  { id: 'walls-gates', number: 286, title: 'Walls and Gates', difficulty: 'medium', category: 'Graphs', tags: ['Graphs'], acceptanceRate: 59, xpReward: 60 },
  { id: 'rotting-oranges', number: 994, title: 'Rotting Oranges', difficulty: 'medium', category: 'Graphs', tags: ['Graphs'], acceptanceRate: 53, xpReward: 60 },
  { id: 'pacific-atlantic', number: 417, title: 'Pacific Atlantic Water Flow', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Recursion'], acceptanceRate: 54, xpReward: 60 },
  { id: 'course-schedule', number: 207, title: 'Course Schedule', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Sorting'], acceptanceRate: 45, xpReward: 60 },
  { id: 'course-schedule-ii', number: 210, title: 'Course Schedule II', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Sorting'], acceptanceRate: 48, xpReward: 60 },
  { id: 'word-ladder', number: 127, title: 'Word Ladder', difficulty: 'hard', category: 'Graphs', tags: ['Graphs'], acceptanceRate: 38, xpReward: 100 },
  { id: 'alien-dict', number: 269, title: 'Alien Dictionary', difficulty: 'hard', category: 'Graphs', tags: ['Graphs', 'Sorting'], acceptanceRate: 33, xpReward: 100 },
  // Dynamic Programming
  { id: 'climb-stairs', number: 70, title: 'Climbing Stairs', difficulty: 'easy', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], acceptanceRate: 52, xpReward: 30 },
  { id: 'coin-change', number: 322, title: 'Coin Change', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], acceptanceRate: 42, xpReward: 60 },
  { id: 'longest-inc-subseq', number: 300, title: 'Longest Increasing Subsequence', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Binary Search'], acceptanceRate: 54, xpReward: 60 },
  { id: 'unique-paths', number: 62, title: 'Unique Paths', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Math'], acceptanceRate: 64, xpReward: 60 },
  { id: 'jump-game', number: 55, title: 'Jump Game', difficulty: 'medium', category: 'Greedy', tags: ['Arrays', 'Greedy', 'Dynamic Programming'], acceptanceRate: 38, xpReward: 60 },
  { id: 'word-break', number: 139, title: 'Word Break', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Trie'], acceptanceRate: 45, xpReward: 60 },
  { id: 'combination-sum', number: 39, title: 'Combination Sum', difficulty: 'medium', category: 'Recursion', tags: ['Recursion'], acceptanceRate: 70, xpReward: 60 },
  { id: 'house-robber', number: 198, title: 'House Robber', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], acceptanceRate: 50, xpReward: 60 },
  { id: 'house-robber-ii', number: 213, title: 'House Robber II', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], acceptanceRate: 41, xpReward: 60 },
  { id: 'decode-ways', number: 91, title: 'Decode Ways', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], acceptanceRate: 33, xpReward: 60 },
  { id: 'edit-distance', number: 72, title: 'Edit Distance', difficulty: 'hard', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Strings'], acceptanceRate: 55, xpReward: 100 },
  { id: 'burst-balloons', number: 312, title: 'Burst Balloons', difficulty: 'hard', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], acceptanceRate: 58, xpReward: 100 },
  // Heap
  { id: 'kth-largest', number: 215, title: 'Kth Largest Element in Array', difficulty: 'medium', category: 'Sorting', tags: ['Arrays', 'Sorting', 'Heap'], acceptanceRate: 65, xpReward: 60 },
  { id: 'top-k-frequent', number: 347, title: 'Top K Frequent Elements', difficulty: 'medium', category: 'Hashing', tags: ['Arrays', 'Hashing', 'Heap', 'Sorting'], acceptanceRate: 65, xpReward: 60 },
  { id: 'find-median-stream', number: 295, title: 'Find Median from Data Stream', difficulty: 'hard', category: 'Heap', tags: ['Heap', 'Sorting'], acceptanceRate: 51, xpReward: 100 },
  // Trie
  { id: 'implement-trie', number: 208, title: 'Implement Trie (Prefix Tree)', difficulty: 'medium', category: 'Trie', tags: ['Trie', 'Strings'], acceptanceRate: 63, xpReward: 60 },
  { id: 'word-search-ii', number: 212, title: 'Word Search II', difficulty: 'hard', category: 'Trie', tags: ['Trie', 'Recursion', 'Graphs'], acceptanceRate: 37, xpReward: 100 },
  // Stack/Queue
  { id: 'min-stack', number: 155, title: 'Min Stack', difficulty: 'medium', category: 'Stack', tags: ['Stack'], acceptanceRate: 53, xpReward: 30 },
  { id: 'daily-temperatures', number: 739, title: 'Daily Temperatures', difficulty: 'medium', category: 'Stack', tags: ['Stack', 'Arrays', 'Greedy'], acceptanceRate: 67, xpReward: 60 },
  { id: 'car-fleet', number: 853, title: 'Car Fleet', difficulty: 'medium', category: 'Stack', tags: ['Stack', 'Arrays', 'Sorting', 'Greedy'], acceptanceRate: 49, xpReward: 60 },
  { id: 'largest-rect-hist', number: 84, title: 'Largest Rectangle in Histogram', difficulty: 'hard', category: 'Stack', tags: ['Stack', 'Arrays'], acceptanceRate: 44, xpReward: 100 },
  // Binary Search
  { id: 'binary-search', number: 704, title: 'Binary Search', difficulty: 'easy', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], acceptanceRate: 55, xpReward: 30 },
  { id: 'search-2d-matrix', number: 74, title: 'Search a 2D Matrix', difficulty: 'medium', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], acceptanceRate: 49, xpReward: 60 },
  { id: 'time-based-kv', number: 981, title: 'Time Based Key-Value Store', difficulty: 'medium', category: 'Binary Search', tags: ['Binary Search', 'Hashing'], acceptanceRate: 53, xpReward: 60 },
  { id: 'median-two-arrays', number: 4, title: 'Median of Two Sorted Arrays', difficulty: 'hard', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], acceptanceRate: 36, xpReward: 100 },
  // Backtracking
  { id: 'permutations', number: 46, title: 'Permutations', difficulty: 'medium', category: 'Recursion', tags: ['Recursion'], acceptanceRate: 75, xpReward: 60 },
  { id: 'subsets', number: 78, title: 'Subsets', difficulty: 'medium', category: 'Recursion', tags: ['Recursion', 'Sorting'], acceptanceRate: 76, xpReward: 60 },
  { id: 'letter-combinations', number: 17, title: 'Letter Combinations of Phone Number', difficulty: 'medium', category: 'Recursion', tags: ['Recursion', 'Strings'], acceptanceRate: 57, xpReward: 60 },
  { id: 'word-search', number: 79, title: 'Word Search', difficulty: 'medium', category: 'Recursion', tags: ['Recursion', 'Graphs'], acceptanceRate: 41, xpReward: 60 },
  { id: 'n-queens', number: 51, title: 'N-Queens', difficulty: 'hard', category: 'Recursion', tags: ['Recursion'], acceptanceRate: 66, xpReward: 100 },
  // Greedy / Intervals
  { id: 'meeting-rooms', number: 252, title: 'Meeting Rooms', difficulty: 'easy', category: 'Sorting', tags: ['Arrays', 'Sorting'], acceptanceRate: 57, xpReward: 30 },
  { id: 'merge-intervals', number: 56, title: 'Merge Intervals', difficulty: 'medium', category: 'Sorting', tags: ['Arrays', 'Sorting'], acceptanceRate: 46, xpReward: 60 },
  { id: 'non-overlapping-intervals', number: 435, title: 'Non-overlapping Intervals', difficulty: 'medium', category: 'Greedy', tags: ['Arrays', 'Sorting', 'Greedy'], acceptanceRate: 51, xpReward: 60 },
  { id: 'min-intervals', number: 1851, title: 'Minimum Interval to Include Each Query', difficulty: 'hard', category: 'Heap', tags: ['Arrays', 'Sorting', 'Heap', 'Binary Search'], acceptanceRate: 55, xpReward: 100 },
];

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  'Arrays':            { icon: 'grid_on',          color: 'text-blue-400' },
  'Strings':           { icon: 'text_fields',       color: 'text-purple-400' },
  'Linked List':       { icon: 'link',              color: 'text-cyan-400' },
  'Stack':             { icon: 'layers',            color: 'text-orange-400' },
  'Queue':             { icon: 'queue',             color: 'text-yellow-400' },
  'Trees':             { icon: 'account_tree',      color: 'text-green-400' },
  'Graphs':            { icon: 'share',             color: 'text-pink-400' },
  'Dynamic Programming': { icon: 'table_chart',    color: 'text-red-400' },
  'Recursion':         { icon: 'repeat',            color: 'text-violet-400' },
  'Binary Search':     { icon: 'manage_search',     color: 'text-sky-400' },
  'Sorting':           { icon: 'sort',              color: 'text-lime-400' },
  'Hashing':           { icon: 'tag',               color: 'text-amber-400' },
  'Greedy':            { icon: 'bolt',              color: 'text-yellow-400' },
};

export function ProblemsPage() {
  const session = getSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [status, setStatus] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') ?? 'all');
  const [stats, setStats] = useState<ProblemsResponse['stats'] | null>(null);

  const fetchProblems = useCallback(async () => {
    if (!session?.accessToken) {
      setProblems(STATIC_PROBLEMS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficulty !== 'all') params.set('difficulty', difficulty);
      if (selectedTag !== 'all') params.set('tag', selectedTag);
      const url = `/problems${params.toString() ? `?${params}` : ''}`;
      const d = await apiRequest<ProblemsResponse>(url, { token: session.accessToken });
      setProblems(d.problems ?? []);
      if (d.stats) setStats(d.stats);
    } catch {
      setProblems(STATIC_PROBLEMS);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, difficulty, selectedTag]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  useEffect(() => {
    const tag = searchParams.get('tag');
    if (tag) setSelectedTag(tag);
  }, [searchParams]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    if (tag !== 'all') {
      setSearchParams({ tag });
    } else {
      setSearchParams({});
    }
  };

  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchDiff   = difficulty === 'all' || p.difficulty === difficulty;
    const matchStatus = status === 'all' || (status === 'solved' ? p.solved : !p.solved);
    return matchSearch && matchDiff && matchStatus;
  });

  const solvedCount = problems.filter((p) => p.solved).length;
  const easyTotal   = (stats?.easyTotal   ?? problems.filter((p) => p.difficulty === 'easy').length);
  const mediumTotal = (stats?.mediumTotal ?? problems.filter((p) => p.difficulty === 'medium').length);
  const hardTotal   = (stats?.hardTotal   ?? problems.filter((p) => p.difficulty === 'hard').length);
  const easySolved  = stats?.easySolved   ?? problems.filter((p) => p.difficulty === 'easy' && p.solved).length;
  const mediumSolved = stats?.mediumSolved ?? problems.filter((p) => p.difficulty === 'medium' && p.solved).length;
  const hardSolved  = stats?.hardSolved   ?? problems.filter((p) => p.difficulty === 'hard' && p.solved).length;

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl">
        {/* Hero */}
        <div className="mb-10 flex items-end justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-white mb-2 leading-none">
              MASTER THE<br /><span className="text-primary-container">ALGORITHMS.</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-lg">
              Curated problems engineered to take you from beginner to FAANG-ready.
            </p>
          </div>

          {/* Progress card */}
          <div className="bg-surface-container rounded-2xl p-6 w-full md:w-auto md:min-w-[280px] border border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container mb-4">Your Progress</p>
            <div className="space-y-3">
              {[
                { label: 'Easy', solved: easySolved, total: easyTotal, color: 'bg-green-400' },
                { label: 'Medium', solved: mediumSolved, total: mediumTotal, color: 'bg-yellow-400' },
                { label: 'Hard', solved: hardSolved, total: hardTotal, color: 'bg-red-400' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                    <span className="text-zinc-500">{row.label}</span>
                    <span className="text-on-surface">{row.solved}/{row.total}</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${row.color}`}
                      style={{ width: row.total ? `${(row.solved / row.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Solved</span>
              <span className="text-xl font-black text-on-surface">{solvedCount}/{problems.length}</span>
            </div>
          </div>
        </div>

        {/* Topic Tags */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-3">Filter by Topic</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleTagClick('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                selectedTag === 'all'
                  ? 'bg-primary-container text-white border-transparent'
                  : 'text-zinc-500 border-zinc-800 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              All Topics
            </button>
            {TOPIC_TAGS.map((tag) => {
              const meta = CATEGORY_META[tag] ?? { icon: 'code', color: 'text-zinc-400' };
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    selectedTag === tag
                      ? `bg-surface-container-high ${meta.color} border-current/20`
                      : 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  <Icon name={meta.icon} size={11} />
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Difficulty */}
          <div className="flex items-center bg-surface-container p-1 rounded-full">
            {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-full font-['Inter'] uppercase tracking-widest text-[10px] font-black transition-all ${
                  difficulty === d ? 'bg-surface-container-highest text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {d === 'all' ? 'All' : d}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center bg-surface-container p-1 rounded-full">
            {(['all', 'solved', 'unsolved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-full font-['Inter'] uppercase tracking-widest text-[10px] font-black transition-all ${
                  status === s ? 'bg-surface-container-highest text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="w-full bg-surface-container rounded-full pl-10 pr-5 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-0 text-on-surface"
            />
          </div>

          <span className="text-xs text-zinc-500 font-bold ml-auto">
            {filtered.length} problem{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 font-['Inter'] uppercase tracking-widest text-[10px] font-black text-zinc-600 mb-1">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-2 text-center">Difficulty</div>
          <div className="col-span-2 text-center">Tags</div>
          <div className="col-span-1 text-center">Acc %</div>
          <div className="col-span-1 text-center">XP</div>
        </div>

        {/* Problems list */}
        <div className="space-y-1.5">
          {loading && (
            <div className="space-y-1.5">
              {[...Array(10)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <div key={i} className="h-14 bg-surface-container rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <Icon name="search_off" size={40} className="text-zinc-700 mb-3" />
              <p className="text-zinc-500 font-bold">No problems found.</p>
              <p className="text-xs text-zinc-600 mt-1">Try adjusting your filters.</p>
            </div>
          )}

          {!loading && filtered.map((p, i) => (
            <Link key={p.id} to={`/app/problems/${p.id}`} className="block">
              <div className={`grid grid-cols-12 gap-4 rounded-xl px-6 py-4 hover:bg-surface-container-high transition-all cursor-pointer group items-center border ${
                p.solved ? 'bg-surface-container border-green-500/10' : 'bg-surface-container border-transparent'
              }`}>
                <div className="col-span-1 text-center">
                  {p.solved ? (
                    <Icon name="check_circle" size={18} className="text-green-400 mx-auto" filled />
                  ) : (
                    <span className="text-zinc-600 text-xs font-bold">{p.number ?? i + 1}</span>
                  )}
                </div>

                <div className="col-span-5">
                  <span className="font-semibold text-sm text-on-surface group-hover:text-primary-container transition-colors">
                    {p.title}
                  </span>
                  {p.category && (
                    <span className="ml-2 text-[10px] text-zinc-600 font-bold">{p.category}</span>
                  )}
                </div>

                <div className="col-span-2 flex justify-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${DIFF_STYLE[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                </div>

                <div className="col-span-2 flex justify-center gap-1 flex-wrap">
                  {(p.tags ?? []).slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-surface-container-highest rounded-full text-[9px] font-bold text-zinc-500 truncate max-w-[80px]">{tag}</span>
                  ))}
                </div>

                <div className="col-span-1 text-center">
                  <span className="text-xs font-bold text-zinc-500">
                    {p.acceptanceRate != null ? `${Math.round(p.acceptanceRate)}%` : '—'}
                  </span>
                </div>

                <div className="col-span-1 flex justify-center items-center gap-0.5">
                  <span className="text-xs font-black text-primary-container">{p.xpReward ?? (p.difficulty === 'hard' ? 100 : p.difficulty === 'medium' ? 60 : 30)}</span>
                  <Icon name="bolt" size={12} className="text-primary-container" filled />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
