import { useState, useCallback, useRef } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

// ─── Types ────────────────────────────────────────────────────────────────────

type Language = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'sql';

interface LangConfig {
  label: string;
  monacoId: string;
  icon: string;
  color: string;
  template: string;
  comment: string;
}

// ─── Language Configs ─────────────────────────────────────────────────────────

const LANG_CONFIGS: Record<Language, LangConfig> = {
  javascript: {
    label: 'JavaScript',
    monacoId: 'javascript',
    icon: 'javascript',
    color: 'text-yellow-400',
    comment: '//',
    template: `// EYF Code Playground — JavaScript
// Write and run code here!

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}

console.log(twoSum([2, 7, 11, 15], 9));  // [0, 1]
console.log(twoSum([3, 2, 4], 6));       // [1, 2]
`,
  },
  typescript: {
    label: 'TypeScript',
    monacoId: 'typescript',
    icon: 'code',
    color: 'text-blue-400',
    comment: '//',
    template: `// EYF Code Playground — TypeScript

interface ListNode {
  val: number;
  next: ListNode | null;
}

function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}

// Build: 1 -> 2 -> 3 -> 4 -> 5
const buildList = (vals: number[]): ListNode | null => {
  if (!vals.length) return null;
  const head: ListNode = { val: vals[0], next: null };
  let curr = head;
  for (let i = 1; i < vals.length; i++) {
    curr.next = { val: vals[i], next: null };
    curr = curr.next;
  }
  return head;
};

const printList = (head: ListNode | null): void => {
  const vals: number[] = [];
  while (head) { vals.push(head.val); head = head.next; }
  console.log(vals.join(' -> '));
};

const list = buildList([1, 2, 3, 4, 5]);
printList(reverseList(list));  // 5 -> 4 -> 3 -> 2 -> 1
`,
  },
  python: {
    label: 'Python',
    monacoId: 'python',
    icon: 'code',
    color: 'text-green-400',
    comment: '#',
    template: `# EYF Code Playground — Python

from collections import defaultdict
from typing import List

def group_anagrams(strs: List[str]) -> List[List[str]]:
    groups = defaultdict(list)
    for s in strs:
        key = tuple(sorted(s))
        groups[key].append(s)
    return list(groups.values())

print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
# [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]

# Dynamic programming: Fibonacci with memoization
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n: int) -> int:
    if n <= 1: return n
    return fib(n - 1) + fib(n - 2)

print([fib(i) for i in range(10)])  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
`,
  },
  java: {
    label: 'Java',
    monacoId: 'java',
    icon: 'code',
    color: 'text-orange-400',
    comment: '//',
    template: `// EYF Code Playground — Java
import java.util.*;

public class Solution {
    // Binary search
    public static int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {-1, 0, 3, 5, 9, 12};
        System.out.println(search(arr, 9));   // 4
        System.out.println(search(arr, 2));   // -1
    }
}
`,
  },
  cpp: {
    label: 'C++',
    monacoId: 'cpp',
    icon: 'code',
    color: 'text-purple-400',
    comment: '//',
    template: `// EYF Code Playground — C++
#include <bits/stdc++.h>
using namespace std;

// Merge sort
void merge(vector<int>& arr, int l, int m, int r) {
    vector<int> left(arr.begin() + l, arr.begin() + m + 1);
    vector<int> right(arr.begin() + m + 1, arr.begin() + r + 1);
    int i = 0, j = 0, k = l;
    while (i < left.size() && j < right.size()) {
        if (left[i] <= right[j]) arr[k++] = left[i++];
        else arr[k++] = right[j++];
    }
    while (i < left.size()) arr[k++] = left[i++];
    while (j < right.size()) arr[k++] = right[j++];
}

void mergeSort(vector<int>& arr, int l, int r) {
    if (l >= r) return;
    int m = l + (r - l) / 2;
    mergeSort(arr, l, m);
    mergeSort(arr, m + 1, r);
    merge(arr, l, m, r);
}

int main() {
    vector<int> arr = {38, 27, 43, 3, 9, 82, 10};
    mergeSort(arr, 0, arr.size() - 1);
    for (int x : arr) cout << x << " ";
    cout << endl;  // 3 9 10 27 38 43 82
    return 0;
}
`,
  },
  sql: {
    label: 'SQL',
    monacoId: 'sql',
    icon: 'storage',
    color: 'text-blue-400',
    comment: '--',
    template: `-- EYF Code Playground — SQL (PostgreSQL)
-- Note: SQL runs against a sandboxed in-memory database

-- Create sample tables
CREATE TABLE employees (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  department TEXT NOT NULL,
  salary     INT NOT NULL,
  manager_id INT REFERENCES employees(id)
);

INSERT INTO employees (name, department, salary, manager_id) VALUES
  ('Alice',   'Engineering', 120000, NULL),
  ('Bob',     'Engineering', 95000,  1),
  ('Charlie', 'Engineering', 88000,  1),
  ('Diana',   'Marketing',   85000,  NULL),
  ('Eve',     'Marketing',   72000,  4),
  ('Frank',   'Engineering', 105000, 1);

-- Find employees earning above department average
SELECT e.name, e.department, e.salary,
       ROUND(AVG(e2.salary) OVER (PARTITION BY e.department)) AS dept_avg
FROM employees e
JOIN employees e2 ON e.department = e2.department
GROUP BY e.id, e.name, e.department, e.salary
HAVING e.salary > AVG(e2.salary)
ORDER BY e.department, e.salary DESC;

-- Top earner per department using window function
SELECT name, department, salary
FROM (
  SELECT name, department, salary,
         RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rnk
  FROM employees
) ranked
WHERE rnk = 1;
`,
  },
};

// ─── Simple local JS runner ────────────────────────────────────────────────────

function runLocalJS(code: string): { stdout: string; stderr: string; runtime: number } {
  const logs: string[] = [];
  const errors: string[] = [];
  const start = performance.now();

  const origLog   = console.log;
  const origError = console.error;
  const origWarn  = console.warn;

  console.log   = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(' '));
  console.warn  = (...args: unknown[]) => logs.push('[warn] ' + args.map(String).join(' '));

  try {
    // eslint-disable-next-line no-new-func
    new Function(code)(); // NOSONAR — intentional code playground; user runs their own code
  } catch (e) {
    errors.push(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
  } finally {
    console.log   = origLog;
    console.error = origError;
    console.warn  = origWarn;
  }

  return {
    stdout: logs.join('\n'),
    stderr: errors.join('\n'),
    runtime: performance.now() - start,
  };
}

// ─── Example Snippets ─────────────────────────────────────────────────────────

const EXAMPLES: { label: string; lang: Language; code: string }[] = [
  {
    label: 'LRU Cache',
    lang: 'javascript',
    code: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val); // move to end (most recent)
    return val;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value); // delete oldest
    }
  }
}

const cache = new LRUCache(3);
cache.put(1, 'a'); cache.put(2, 'b'); cache.put(3, 'c');
console.log(cache.get(1));  // 'a' (now most recent)
cache.put(4, 'd');          // evicts key 2
console.log(cache.get(2));  // -1 (evicted)
console.log(cache.get(3));  // 'c'
`,
  },
  {
    label: 'Binary Search Tree',
    lang: 'javascript',
    code: `class BST {
  constructor() { this.root = null; }
  insert(val) {
    const node = { val, left: null, right: null };
    if (!this.root) { this.root = node; return; }
    let curr = this.root;
    while (true) {
      if (val < curr.val) {
        if (!curr.left) { curr.left = node; return; }
        curr = curr.left;
      } else {
        if (!curr.right) { curr.right = node; return; }
        curr = curr.right;
      }
    }
  }
  inorder(node = this.root, result = []) {
    if (!node) return result;
    this.inorder(node.left, result);
    result.push(node.val);
    this.inorder(node.right, result);
    return result;
  }
}

const bst = new BST();
[5, 3, 7, 1, 4, 6, 8].forEach(v => bst.insert(v));
console.log(bst.inorder()); // [1, 3, 4, 5, 6, 7, 8] — sorted!
`,
  },
  {
    label: 'Graph BFS',
    lang: 'javascript',
    code: `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const order = [];

  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const neighbor of (graph[node] ?? [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return order;
}

const graph = {
  A: ['B', 'C'],
  B: ['A', 'D', 'E'],
  C: ['A', 'F'],
  D: ['B'],
  E: ['B', 'F'],
  F: ['C', 'E'],
};

console.log(bfs(graph, 'A').join(' → '));
// A → B → C → D → E → F
`,
  },
  {
    label: 'DP: Coin Change',
    lang: 'javascript',
    code: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

console.log(coinChange([1, 5, 6, 9], 11));  // 2 (6+5 or 9+1+1... → 6+5=2)
console.log(coinChange([2], 3));             // -1
console.log(coinChange([1, 2, 5], 11));      // 3 (5+5+1)
`,
  },
  {
    label: 'Sliding Window',
    lang: 'python',
    code: `# Longest substring without repeating characters
def length_of_longest_substring(s: str) -> int:
    char_index = {}
    max_len = left = 0

    for right, char in enumerate(s):
        if char in char_index and char_index[char] >= left:
            left = char_index[char] + 1
        char_index[char] = right
        max_len = max(max_len, right - left + 1)

    return max_len

test_cases = [
    ("abcabcbb", 3),
    ("bbbbb", 1),
    ("pwwkew", 3),
    ("", 0),
]

for s, expected in test_cases:
    result = length_of_longest_substring(s)
    status = "✓" if result == expected else "✗"
    print(f"{status} '{s}' → {result} (expected {expected})")
`,
  },
];

// ─── Textarea-based editor (no Monaco dependency here) ───────────────────────

function SimpleEditor({
  code, onChange,
}: { readonly code: string; readonly onChange: (code: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = textareaRef.current!;
      const { selectionStart, selectionEnd } = el;
      const next = code.substring(0, selectionStart) + '  ' + code.substring(selectionEnd);
      onChange(next);
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = selectionStart + 2;
      }, 0);
    }
  }, [code, onChange]);

  return (
    <textarea
      ref={textareaRef}
      value={code}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      spellCheck={false}
      className="w-full h-full bg-transparent text-zinc-200 font-mono text-sm resize-none outline-none p-4 leading-6"
      style={{ tabSize: 2 }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PlaygroundPage() {
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState(LANG_CONFIGS.javascript.template);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [runTime, setRunTime] = useState<number | null>(null);

  const handleLangChange = useCallback((lang: Language) => {
    setLanguage(lang);
    setCode(LANG_CONFIGS[lang].template);
    setOutput('');
    setRunTime(null);
  }, []);

  const handleExample = useCallback((ex: typeof EXAMPLES[0]) => {
    setLanguage(ex.lang);
    setCode(ex.code);
    setOutput('');
    setRunTime(null);
  }, []);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setOutput('');
    setHasError(false);

    if (language === 'javascript' || language === 'typescript') {
      const { stdout, stderr, runtime } = runLocalJS(code);
      setOutput(stdout || stderr || '(no output)');
      setHasError(!!stderr && !stdout);
      setRunTime(runtime);
      setIsRunning(false);
      return;
    }

    // For other languages, try server
    const session = getSession();
    if (!session) {
      setOutput(`⚠ Sign in to run ${LANG_CONFIGS[language].label} on our servers.\n\nJavaScript and TypeScript run locally in your browser.`);
      setHasError(true);
      setIsRunning(false);
      return;
    }

    try {
      const start = performance.now();
      const res = await apiRequest<{ stdout: string; stderr: string }>('/code/run', {
        method: 'POST',
        body: { language, code },
      });
      setRunTime(performance.now() - start);
      setOutput(res.stdout || res.stderr || '(no output)');
      setHasError(!!res.stderr && !res.stdout);
    } catch {
      setOutput(`Could not reach execution server.\n\nFor JavaScript/TypeScript, all execution runs locally in your browser — no server needed.`);
      setHasError(true);
    } finally {
      setIsRunning(false);
    }
  }, [language, code]);

  const handleClear = useCallback(() => {
    setCode(LANG_CONFIGS[language].template);
    setOutput('');
    setRunTime(null);
  }, [language]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).catch(() => {});
  }, [code]);

  const config = LANG_CONFIGS[language];

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#141414] shrink-0 flex-wrap gap-y-2">
          {/* Language selector */}
          <div className="flex items-center gap-1 bg-[#1e1e1e] rounded-xl p-1 border border-white/5">
            {(Object.keys(LANG_CONFIGS) as Language[]).map((lang) => {
              const c = LANG_CONFIGS[lang];
              return (
                <button
                  key={lang}
                  onClick={() => handleLangChange(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    language === lang
                      ? `bg-white/10 ${c.color}`
                      : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Examples */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                <Icon name="auto_stories" className="text-sm" />
                Examples
              </button>
              <div className="absolute right-0 top-full mt-1 w-56 bg-[#1e1e1e] border border-white/10 rounded-xl overflow-hidden shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => handleExample(ex)}
                    className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>{ex.label}</span>
                    <span className={`text-[10px] ${LANG_CONFIGS[ex.lang].color}`}>{LANG_CONFIGS[ex.lang].label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
            >
              <Icon name="content_copy" className="text-sm" />
              Copy
            </button>

            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
            >
              <Icon name="restart_alt" className="text-sm" />
              Reset
            </button>

            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-sm px-5 py-2 rounded-xl transition-colors"
            >
              {isRunning
                ? <><Icon name="hourglass_empty" className="text-base animate-spin" /> Running…</>
                : <><Icon name="play_arrow" className="text-base" /> Run</>
              }
            </button>
          </div>
        </div>

        {/* Editor + Output */}
        <div className="flex flex-1 min-h-0">
          {/* Editor */}
          <div className="flex-1 min-w-0 flex flex-col border-r border-white/5">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-[#161616] shrink-0">
              <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
              <span className="text-[10px] text-zinc-700">
                {language === 'javascript' || language === 'typescript'
                  ? '· runs locally in browser'
                  : '· runs on EYF servers'}
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-auto bg-[#141414]">
              <SimpleEditor code={code} onChange={setCode} />
            </div>
          </div>

          {/* Output */}
          <div className="w-80 shrink-0 flex flex-col bg-[#0e0e0e]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#111] shrink-0">
              <div className="flex items-center gap-2">
                <Icon name="terminal" className="text-sm text-zinc-600" />
                <span className="text-xs font-semibold text-zinc-500">Output</span>
              </div>
              {runTime != null && (
                <span className="text-[10px] text-zinc-700 tabular-nums">{runTime.toFixed(1)}ms</span>
              )}
            </div>
            <div className="flex-1 overflow-auto p-4">
              {output ? (
                <pre className={`text-xs font-mono leading-relaxed whitespace-pre-wrap ${hasError ? 'text-red-400' : 'text-emerald-300'}`}>
                  {output}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Icon name="play_circle" className="text-3xl text-zinc-800 mb-2" />
                  <p className="text-xs text-zinc-700">Click Run to execute</p>
                  <p className="text-[10px] text-zinc-800 mt-1">JS/TS runs in your browser</p>
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="border-t border-white/5 p-3 bg-[#111] shrink-0">
              <div className="text-[10px] text-zinc-700 leading-relaxed">
                {language === 'javascript' || language === 'typescript'
                  ? '⚡ Executes locally — no server round trip. Captures console.log output.'
                  : '☁ Server execution. Sign in for Python, Java, C++, and SQL.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
