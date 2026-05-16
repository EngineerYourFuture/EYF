import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  hints: string[];
  testCases: Array<{ input: string; output: string }>;
}

interface RunResponse {
  runId: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
}

interface SubmitResponse {
  submissionId: string;
  verdict: string;
  passed: number;
  total: number;
  testResults: Array<{ testCase: number; passed: boolean }>;
  runtimeMs: number;
  memoryKb: number;
}

type Language = 'javascript' | 'python' | 'java' | 'cpp' | 'c';

const LANG_STARTERS: Record<Language, string> = {
  javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function solution(nums) {
  // Your code here

}`,
  python: `class Solution:
    def solution(self, nums: list[int]) -> int:
        # Your code here
        pass`,
  java: `class Solution {
    public int solution(int[] nums) {
        // Your code here
        return 0;
    }
}`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int solution(vector<int>& nums) {
        // Your code here
        return 0;
    }
};`,
  c: `#include <stdio.h>
#include <stdlib.h>

int solution(int* nums, int numsSize) {
    // Your code here
    return 0;
}`,
};

const LANG_MONACO: Record<Language, string> = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
};

const STATIC_PROBLEM_DATA: Record<string, Problem> = {
  'two-sum': {
    id: 'two-sum', slug: 'two-sum', title: 'Two Sum', difficulty: 'easy',
    description: 'Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10^4', '-10^9 ≤ nums[i] ≤ 10^9', '-10^9 ≤ target ≤ 10^9', 'Only one valid answer exists.'],
    hints: ['Use a hash map to store each number and its index as you iterate.', 'For each num, check if (target - num) exists in the map before adding num to the map.'],
    testCases: [{ input: '[2,7,11,15]\n9', output: '[0,1]' }, { input: '[3,2,4]\n6', output: '[1,2]' }],
  },
  'valid-parentheses': {
    id: 'valid-parentheses', slug: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'easy',
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    constraints: ['1 ≤ s.length ≤ 10^4', 's consists of parentheses only: ()[]{}'],
    hints: ['Use a stack.', 'Push open brackets onto the stack. When you see a close bracket, check if the top of the stack is the matching open bracket.'],
    testCases: [{ input: '"()"', output: 'true' }, { input: '"([)]"', output: 'false' }],
  },
  'maximum-subarray': {
    id: 'maximum-subarray', slug: 'maximum-subarray', title: 'Maximum Subarray (Kadane\'s)', difficulty: 'medium',
    description: 'Given an integer array `nums`, find the **subarray** with the largest sum, and return its sum.\n\nA **subarray** is a contiguous non-empty sequence of elements within an array.',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10^5', '-10^4 ≤ nums[i] ≤ 10^4'],
    hints: ['Try a greedy approach. At each position, decide: extend the current subarray or start a new one?', 'currentSum = max(nums[i], currentSum + nums[i])'],
    testCases: [{ input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6' }],
  },
  'climb-stairs': {
    id: 'climb-stairs', slug: 'climb-stairs', title: 'Climbing Stairs', difficulty: 'easy',
    description: 'You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?',
    examples: [
      { input: 'n = 2', output: '2', explanation: 'There are two ways to climb to the top. 1 step + 1 step | 2 steps' },
      { input: 'n = 3', output: '3', explanation: '1+1+1 | 1+2 | 2+1' },
    ],
    constraints: ['1 ≤ n ≤ 45'],
    hints: ['This is a Fibonacci problem.', 'ways(n) = ways(n-1) + ways(n-2). Base cases: ways(1) = 1, ways(2) = 2.'],
    testCases: [{ input: '5', output: '8' }],
  },
  'num-islands': {
    id: 'num-islands', slug: 'num-islands', title: 'Number of Islands', difficulty: 'medium',
    description: 'Given an `m x n` 2D binary grid which represents a map of `\'1\'`s (land) and `\'0\'`s (water), return the number of islands.\n\nAn **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.',
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 ≤ m, n ≤ 300', 'grid[i][j] is \'0\' or \'1\'.'],
    hints: ['Use DFS. When you find a \'1\', increment count and flood-fill all connected \'1\'s to \'0\'.', 'The number of times you start a flood-fill = number of islands.'],
    testCases: [{ input: '[["1","1","0"],["0","1","0"],["0","0","1"]]', output: '2' }],
  },
  'coin-change': {
    id: 'coin-change', slug: 'coin-change', title: 'Coin Change', difficulty: 'medium',
    description: 'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.',
    examples: [
      { input: 'coins = [1,5,11], amount = 15', output: '3', explanation: '5 + 5 + 5 = 3 coins (not 11+1+1+1+1 = 5 coins)' },
      { input: 'coins = [2], amount = 3', output: '-1' },
      { input: 'coins = [1], amount = 0', output: '0' },
    ],
    constraints: ['1 ≤ coins.length ≤ 12', '1 ≤ coins[i] ≤ 2^31 - 1', '0 ≤ amount ≤ 10^4'],
    hints: ['Dynamic programming. dp[i] = minimum coins to make amount i.', 'dp[0] = 0. For each amount, try all coins: dp[i] = min(dp[i], dp[i - coin] + 1).', 'Note: greedy (largest coin first) does NOT always work!'],
    testCases: [{ input: '[1,5,11]\n15', output: '3' }],
  },
  'reverse-linked-list': {
    id: 'reverse-linked-list', slug: 'reverse-linked-list', title: 'Reverse a Linked List', difficulty: 'easy',
    description: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
      { input: 'head = []', output: '[]' },
    ],
    constraints: ['The number of nodes in the list is in the range [0, 5000].', '-5000 ≤ Node.val ≤ 5000'],
    hints: ['Iterative: use three pointers — prev, curr, next. Save next, point curr to prev, advance.', 'Recursive: reverse from the end, then make next.next = current, current.next = null.'],
    testCases: [{ input: '[1,2,3,4,5]', output: '[5,4,3,2,1]' }],
  },
  'binary-search': {
    id: 'binary-search', slug: 'binary-search', title: 'Binary Search', difficulty: 'easy',
    description: 'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4.' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1.' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10^4', '-10^4 < nums[i], target < 10^4', 'All integers in nums are unique.', 'nums is sorted in ascending order.'],
    hints: ['Maintain left and right pointers. Compare target with the middle element.', 'Use left + (right - left) / 2 to avoid integer overflow.'],
    testCases: [{ input: '[-1,0,3,5,9,12]\n9', output: '4' }],
  },
  'longest-substring': {
    id: 'longest-substring', slug: 'longest-substring', title: 'Longest Substring Without Repeating Characters', difficulty: 'medium',
    description: 'Given a string `s`, find the length of the **longest substring** without duplicate characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3.' },
    ],
    constraints: ['0 ≤ s.length ≤ 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    hints: ['Use a sliding window with a Set.', 'Expand the right pointer; when you see a duplicate, shrink from left until no duplicate.'],
    testCases: [{ input: '"abcabcbb"', output: '3' }],
  },
  'invert-tree': {
    id: 'invert-tree', slug: 'invert-tree', title: 'Invert Binary Tree', difficulty: 'easy',
    description: 'Given the `root` of a binary tree, invert the tree, and return its root.',
    examples: [
      { input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' },
      { input: 'root = [2,1,3]', output: '[2,3,1]' },
      { input: 'root = []', output: '[]' },
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 100].', '-100 ≤ Node.val ≤ 100'],
    hints: ['Recursively invert left and right subtrees, then swap them.', 'Base case: null node returns null.'],
    testCases: [{ input: '[4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' }],
  },
};

const diffColor = (d: string) => {
  if (d === 'easy') return 'text-green-400 bg-green-400/10 border border-green-400/20';
  if (d === 'medium') return 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20';
  return 'text-red-400 bg-red-400/10 border border-red-400/20';
};

type PanelTab = 'description' | 'hints' | 'submissions';
type OutputTab = 'output' | 'verdict';

export function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const session = getSession();
  const { fireXP, refresh } = useUser();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState(LANG_STARTERS.javascript);
  const [panelTab, setPanelTab] = useState<PanelTab>('description');
  const [outputTab, setOutputTab] = useState<OutputTab>('output');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    if (!id) return;
    // Try static data first (instant)
    const staticData = STATIC_PROBLEM_DATA[id];
    if (staticData) {
      setProblem(staticData);
      setLoading(false);
    }
    // Also try API for richer data (overwrites static if successful)
    if (!session?.accessToken) return;
    apiRequest<Problem>(`/problems/${id}`, { token: session.accessToken })
      .then(setProblem)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, session?.accessToken]);

  const onLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCode(LANG_STARTERS[lang]);
  };

  const onRun = async () => {
    if (!id || !session?.accessToken) return;
    setRunning(true);
    setRunResult(null);
    setOutputTab('output');
    try {
      const result = await apiRequest<RunResponse>(`/problems/${id}/run`, {
        method: 'POST',
        token: session.accessToken,
        body: { code, language },
      });
      setRunResult(result);
    } catch {
      setRunResult({ runId: '', stdout: '', stderr: 'Run failed. Please try again.', exitCode: 1, runtimeMs: 0 });
    } finally {
      setRunning(false);
    }
  };

  const onSubmit = async () => {
    if (!id || !session?.accessToken) return;
    setSubmitting(true);
    setSubmitResult(null);
    setOutputTab('verdict');
    try {
      const result = await apiRequest<SubmitResponse>(`/problems/${id}/submit`, {
        method: 'POST',
        token: session.accessToken,
        body: { code, language },
      });
      setSubmitResult(result);
      if (result.verdict === 'accepted') {
        const xpEarned = problem?.difficulty === 'hard' ? 100 : problem?.difficulty === 'medium' ? 60 : 30;
        fireXP(xpEarned, `${problem?.title ?? 'Problem'} solved!`);
        refresh();
      }
    } catch {
      setSubmitResult({ submissionId: '', verdict: 'error', passed: 0, total: 0, testResults: [], runtimeMs: 0, memoryKb: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  const verdictColors: Record<string, string> = {
    accepted: 'text-green-400',
    wrong_answer: 'text-red-400',
    error: 'text-yellow-400',
  };

  return (
    <div className="dark min-h-screen bg-[#0e0e0e] text-on-surface flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#111]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/app/problems" className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors shrink-0">
            <Icon name="chevron_left" size={20} />
            <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:block">Problems</span>
          </Link>
          <span className="text-zinc-700 hidden sm:block">/</span>
          {problem && (
            <span className="text-sm font-semibold text-zinc-300 truncate">{problem.title}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-300 focus:outline-none cursor-pointer"
          >
            {(['javascript', 'python', 'java', 'cpp', 'c'] as Language[]).map((l) => (
              <option key={l} value={l}>{l === 'cpp' ? 'C++' : l.toUpperCase()}</option>
            ))}
          </select>

          <button
            onClick={onRun}
            disabled={running || submitting}
            className="flex items-center gap-1.5 bg-[#1a1a1a] border border-white/10 text-zinc-300 hover:text-white font-bold px-4 py-1.5 rounded-lg text-[11px] uppercase tracking-wider transition-all disabled:opacity-40"
          >
            <Icon name="play_arrow" size={16} />
            {running ? 'Running...' : 'Run'}
          </button>

          <button
            onClick={onSubmit}
            disabled={running || submitting}
            className="flex items-center gap-1.5 bg-[#e82127] text-white font-bold px-4 py-1.5 rounded-lg text-[11px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
          >
            <Icon name="send" size={14} />
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </header>

      {/* Main two-panel layout */}
      <div className="flex pt-14 h-screen">
        {/* Left panel: problem */}
        <div className="w-[45%] min-w-[320px] flex flex-col border-r border-white/5 overflow-hidden">
          {/* Panel tabs */}
          <div className="flex gap-0 border-b border-white/5 shrink-0">
            {(['description', 'hints', 'submissions'] as PanelTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setPanelTab(t)}
                className={`px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2 ${panelTab === t ? 'text-white border-[#e82127]' : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 p-6">
            {loading && <div className="text-zinc-600 text-sm mt-8">Loading problem...</div>}
            {!loading && !problem && <div className="text-zinc-600 text-sm mt-8">Problem not found.</div>}
            {!loading && problem && (
              <>
                {panelTab === 'description' && (
                  <div>
                    <div className="flex items-start gap-3 mb-6">
                      <div>
                        <h1 className="text-2xl font-black tracking-tight mb-2">{problem.title}</h1>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${diffColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[#c9c9c9] leading-relaxed text-sm mb-8 whitespace-pre-wrap">
                      {problem.description}
                    </div>

                    {(problem.examples as Array<{ input: string; output: string; explanation?: string }>).length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Examples</h3>
                        <div className="space-y-3">
                          {(problem.examples as Array<{ input: string; output: string; explanation?: string }>).map((ex, i) => (
                            <div key={ex.input.slice(0, 30)} className="bg-[#1a1a1a] rounded-lg p-4 border border-white/5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Example {i + 1}</p>
                              <div className="font-mono text-sm space-y-1">
                                <p><span className="text-zinc-500">Input: </span><span className="text-zinc-300">{ex.input}</span></p>
                                <p><span className="text-zinc-500">Output: </span><span className="text-zinc-300">{ex.output}</span></p>
                                {ex.explanation && <p className="text-zinc-500 text-xs mt-1">{ex.explanation}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {problem.constraints.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Constraints</h3>
                        <ul className="space-y-1">
                          {problem.constraints.map((c) => (
                            <li key={c.slice(0, 40)} className="text-zinc-400 text-sm font-mono flex items-start gap-2">
                              <span className="text-zinc-700 mt-0.5">•</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {panelTab === 'hints' && (
                  <div>
                    <p className="text-zinc-500 text-sm mb-4">Think before revealing hints.</p>
                    {problem.hints.length > 0 ? (
                      <div className="space-y-3">
                        {problem.hints.map((hint, hintIdx) => (
                          <div key={hint.slice(0, 40)}>
                            <button
                              onClick={() => setShowHints(true)}
                              className={`w-full text-left p-4 rounded-lg border border-white/5 text-sm transition-all ${showHints ? 'bg-[#1a1a1a] text-zinc-300' : 'bg-[#1a1a1a] text-transparent blur-sm select-none hover:blur-0 hover:text-zinc-300'}`}
                            >
                              Hint {hintIdx + 1}: {hint}
                            </button>
                          </div>
                        ))}
                        {!showHints && (
                          <button onClick={() => setShowHints(true)} className="text-[#e82127] text-xs font-bold uppercase tracking-widest hover:underline">
                            Reveal hints
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-zinc-600 text-sm">No hints for this problem.</p>
                    )}
                  </div>
                )}

                {panelTab === 'submissions' && (
                  <div className="text-zinc-500 text-sm">
                    <p>View your submission history in the <Link to="/app/submissions" className="text-[#e82127] hover:underline">Submissions</Link> page.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right panel: editor + output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Monaco editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={LANG_MONACO[language]}
              value={code}
              onChange={(val) => setCode(val ?? '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                lineHeight: 1.6,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderLineHighlight: 'line',
                padding: { top: 16, bottom: 16 },
                wordWrap: 'on',
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Output panel */}
          {(runResult || submitResult) && (
            <div className="h-48 border-t border-white/5 bg-[#0e0e0e] flex flex-col shrink-0">
              <div className="flex gap-0 border-b border-white/5 shrink-0">
                {(['output', 'verdict'] as OutputTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOutputTab(t)}
                    className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2 ${outputTab === t ? 'text-white border-[#e82127]' : 'text-zinc-600 border-transparent hover:text-zinc-400'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                {outputTab === 'output' && runResult && (
                  <div>
                    {runResult.stdout && <div className="text-green-400 whitespace-pre-wrap">{runResult.stdout}</div>}
                    {runResult.stderr && <div className="text-red-400 whitespace-pre-wrap">{runResult.stderr}</div>}
                    <div className="text-zinc-600 text-xs mt-2">Runtime: {runResult.runtimeMs}ms</div>
                  </div>
                )}
                {outputTab === 'verdict' && submitResult && (
                  <div>
                    <div className={`text-lg font-black uppercase tracking-wide mb-2 ${verdictColors[submitResult.verdict] ?? 'text-zinc-400'}`}>
                      {submitResult.verdict.replace('_', ' ')}
                    </div>
                    <div className="text-zinc-400 text-xs mb-3">
                      Passed {submitResult.passed}/{submitResult.total} test cases
                      {submitResult.runtimeMs ? ` · ${submitResult.runtimeMs}ms` : ''}
                      {submitResult.memoryKb ? ` · ${Math.round(submitResult.memoryKb / 1024 * 10) / 10}MB` : ''}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {submitResult.testResults.map((tr) => (
                        <span
                          key={tr.testCase}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${tr.passed ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}
                        >
                          #{tr.testCase} {tr.passed ? '✓' : '✗'}
                        </span>
                      ))}
                    </div>
                    {submitResult.verdict === 'accepted' && (
                      <Link to="/app/problems" className="inline-flex items-center gap-1.5 mt-4 text-[#e82127] text-[11px] font-bold uppercase tracking-widest hover:underline">
                        Next Problem <Icon name="arrow_forward" size={14} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
