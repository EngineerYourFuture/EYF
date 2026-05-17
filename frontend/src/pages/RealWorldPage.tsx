import { useState, useCallback } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type ChallengeType = 'debug' | 'api' | 'frontend' | 'database' | 'system-thinking';
type Difficulty = 'easy' | 'medium' | 'hard';

interface TestCase {
  description: string;
  check: (code: string) => boolean;
  hint: string;
}

interface Challenge {
  id: string;
  title: string;
  type: ChallengeType;
  difficulty: Difficulty;
  xp: number;
  company: string;
  scenario: string;          // the "story" context
  brokenCode: string;        // the buggy/incomplete code
  taskDescription: string;   // what to fix/build
  expectedBehavior: string;  // what success looks like
  hints: string[];
  testCases: TestCase[];
  solution: string;          // shown after submit
  skills: string[];          // skills this tests
}

// ─── Challenge Data ───────────────────────────────────────────────────────────

const CHALLENGES: Challenge[] = [
  // ── Debugging ──────────────────────────────────────────────────────────────
  {
    id: 'debug-001',
    title: 'Fix the Rate Limiter',
    type: 'debug',
    difficulty: 'easy',
    xp: 75,
    company: 'Startup',
    scenario: 'You just joined a fintech startup. The backend engineer left last week. Users are complaining that the API keeps returning 429 errors even when they haven\'t hit the rate limit. The rate limiter is broken.',
    brokenCode: `// Rate limiter middleware — has 3 bugs, find and fix them all
const requests = {};

function rateLimiter(userId, limit = 10, windowMs = 60000) {
  const now = Date.now();

  if (!requests[userId]) {
    requests[userId] = { count: 0, windowStart: now };
  }

  const user = requests[userId];

  // Bug 1: window reset condition is wrong
  if (now - user.windowStart > windowMs) {
    user.count = 0;
    // BUG: forgot to reset windowStart!
  }

  user.count++;

  // Bug 2: comparison is wrong (should reject when >= limit, not > limit)
  if (user.count > limit + 1) {
    return { allowed: false, remaining: 0 };
  }

  // Bug 3: remaining calculation is wrong
  return {
    allowed: true,
    remaining: limit - user.count + 1  // off-by-one
  };
}

// Test it:
const userId = 'user_123';
for (let i = 1; i <= 12; i++) {
  const result = rateLimiter(userId, 10, 60000);
  console.log(\`Request \${i}: allowed=\${result.allowed}, remaining=\${result.remaining}\`);
}`,
    taskDescription: 'Fix all 3 bugs in the rate limiter:\n1. Window reset should also reset `windowStart`\n2. Rejection should happen when count >= limit (not > limit + 1)\n3. Remaining should be `limit - user.count` (not +1)',
    expectedBehavior: 'Request 10 should be the last allowed. Request 11 should be rejected with remaining=0.',
    hints: [
      'Look at what happens when the time window resets — is the timestamp updated?',
      'If limit is 10, should request #10 be allowed or blocked?',
      'If 5 requests used and limit is 10, remaining should be 5, not 6',
    ],
    testCases: [
      {
        description: 'windowStart is reset when window expires',
        check: (code) => code.includes('windowStart') && code.includes('= now') && (code.match(/windowStart/g) ?? []).length >= 2,
        hint: 'Make sure to reset user.windowStart = now when the window expires',
      },
      {
        description: 'Rejection at >= limit (not > limit + 1)',
        check: (code) => code.includes('>= limit') || (code.includes('> limit') && !code.includes('> limit + 1')),
        hint: 'Change the condition to reject when count >= limit',
      },
      {
        description: 'Remaining count is correct (limit - count)',
        check: (code) => code.includes('limit - user.count') && !code.includes('+ 1'),
        hint: 'Change remaining to: limit - user.count',
      },
    ],
    solution: `function rateLimiter(userId, limit = 10, windowMs = 60000) {
  const now = Date.now();

  if (!requests[userId]) {
    requests[userId] = { count: 0, windowStart: now };
  }

  const user = requests[userId];

  if (now - user.windowStart > windowMs) {
    user.count = 0;
    user.windowStart = now;  // FIX 1: reset the window timestamp
  }

  user.count++;

  if (user.count >= limit) {  // FIX 2: >= not > limit + 1
    return { allowed: false, remaining: 0 };
  }

  return {
    allowed: true,
    remaining: limit - user.count  // FIX 3: removed + 1
  };
}`,
    skills: ['JavaScript', 'API Design', 'Debugging', 'Rate Limiting'],
  },

  {
    id: 'debug-002',
    title: 'Fix the Async Race Condition',
    type: 'debug',
    difficulty: 'medium',
    xp: 150,
    company: 'E-commerce',
    scenario: 'The checkout service occasionally charges users twice for the same order. Happens during high traffic. A senior engineer suspects a race condition in the payment processing code.',
    brokenCode: `// Payment processor — has a race condition that causes double charges
class PaymentProcessor {
  constructor() {
    this.processing = new Set();
  }

  async processPayment(orderId, amount, userId) {
    // Bug: check and add are not atomic — race condition window here
    if (this.processing.has(orderId)) {
      throw new Error('Payment already in progress');
    }

    // Another request can slip in between these two lines!
    this.processing.add(orderId);

    try {
      // Simulate payment gateway call (150ms latency)
      const result = await this.chargeCard(userId, amount);

      // Bug 2: cleanup happens before return, not in finally
      this.processing.delete(orderId);
      return { success: true, chargeId: result.id };
    } catch (err) {
      // Bug 3: cleanup missing on error path — orderId stuck forever
      throw new Error(\`Payment failed: \${err.message}\`);
    }
  }

  async chargeCard(userId, amount) {
    // Simulated external API
    await new Promise(r => setTimeout(r, 150));
    return { id: \`charge_\${Date.now()}\` };
  }
}

// This demonstrates the problem:
async function demo() {
  const pp = new PaymentProcessor();
  // Two simultaneous requests for same order (both should error or one should succeed)
  const [r1, r2] = await Promise.allSettled([
    pp.processPayment('order_123', 99.99, 'user_1'),
    pp.processPayment('order_123', 99.99, 'user_1'),
  ]);
  console.log('Result 1:', r1.status, r1.value?.chargeId ?? r1.reason?.message);
  console.log('Result 2:', r2.status, r2.value?.chargeId ?? r2.reason?.message);
}

demo();`,
    taskDescription: 'Fix 3 issues:\n1. Make the idempotency check atomic (check+add in one operation)\n2. Move cleanup to `finally` block so it always runs\n3. Ensure cleanup happens even on errors',
    expectedBehavior: 'Exactly one of the two simultaneous requests should succeed. The failed one should throw "Payment already in progress". The orderId should always be cleaned up.',
    hints: [
      'The Set.has() + Set.add() is two operations — what can happen between them?',
      'JavaScript is single-threaded but async/await creates interleaving points at `await`',
      'Use a `finally` block to ensure cleanup always runs, even on error',
    ],
    testCases: [
      {
        description: 'Cleanup in finally block (not just success path)',
        check: (code) => code.includes('finally') && code.includes('processing.delete'),
        hint: 'Move the cleanup to a finally block: try { ... } finally { this.processing.delete(orderId); }',
      },
      {
        description: 'Error path also cleans up orderId',
        check: (code) => {
          const finallyBlock = code.split('finally')[1] ?? '';
          return finallyBlock.includes('processing.delete');
        },
        hint: 'The finally block should contain processing.delete(orderId)',
      },
      {
        description: 'No double cleanup (delete only in finally, not in try)',
        check: (code) => (code.match(/processing\.delete/g) ?? []).length === 1,
        hint: 'Remove the processing.delete from the try block — finally handles it',
      },
    ],
    solution: `async processPayment(orderId, amount, userId) {
  if (this.processing.has(orderId)) {
    throw new Error('Payment already in progress');
  }
  this.processing.add(orderId);

  try {
    const result = await this.chargeCard(userId, amount);
    return { success: true, chargeId: result.id };
  } catch (err) {
    throw new Error(\`Payment failed: \${err.message}\`);
  } finally {
    // FIX: always clean up, whether success or failure
    this.processing.delete(orderId);
  }
}`,
    skills: ['JavaScript', 'Async/Await', 'Race Conditions', 'Error Handling'],
  },

  // ── API Building ──────────────────────────────────────────────────────────

  {
    id: 'api-001',
    title: 'Design a Pagination API',
    type: 'api',
    difficulty: 'easy',
    xp: 100,
    company: 'Product Company',
    scenario: 'Your team is building a feed API for a social app. The frontend needs to paginate through 10,000+ posts efficiently. Cursor-based pagination is required (offset pagination has O(n) scan cost).',
    brokenCode: `// INCOMPLETE: Cursor-based pagination
// Complete the getPosts function

const POSTS = Array.from({ length: 100 }, (_, i) => ({
  id: \`post_\${100 - i}\`,
  content: \`Post #\${100 - i}\`,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  likes: Math.floor(Math.random() * 1000),
}));

// TODO: Implement cursor-based pagination
// cursor = base64(last item's id from previous page)
// Returns: { data: Post[], nextCursor: string | null, hasMore: boolean }

function getPosts(cursor = null, limit = 10) {
  // YOUR CODE HERE
  // 1. Decode cursor if provided (use Buffer.from(cursor, 'base64').toString())
  // 2. Find the starting position based on cursor
  // 3. Return the next 'limit' posts
  // 4. Encode next cursor: Buffer.from(lastPost.id).toString('base64')
  // 5. Return hasMore based on whether there are more posts after this page

  return { data: [], nextCursor: null, hasMore: false }; // placeholder
}

// Test it:
let cursor = null;
for (let page = 1; page <= 3; page++) {
  const result = getPosts(cursor, 5);
  console.log(\`Page \${page}:\`, result.data.map(p => p.id));
  console.log('hasMore:', result.hasMore, 'nextCursor:', result.nextCursor?.slice(0, 10) + '...');
  cursor = result.nextCursor;
  if (!result.hasMore) break;
}`,
    taskDescription: 'Implement cursor-based pagination:\n1. Decode base64 cursor to find starting position\n2. Slice posts from that position to position+limit\n3. Encode the last returned post\'s ID as the next cursor\n4. Set hasMore = true if there are posts beyond this page',
    expectedBehavior: 'Page 1: posts 1-5 (no cursor). Page 2: posts 6-10 (with cursor from page 1). Each page returns correct hasMore boolean.',
    hints: [
      'Decode: `atob(cursor)` in browser, or `Buffer.from(cursor, "base64").toString()` in Node',
      'Find start index: `POSTS.findIndex(p => p.id === decodedCursor) + 1`',
      'If no cursor, start from index 0',
    ],
    testCases: [
      {
        description: 'Returns correct number of items per page',
        check: (code) => code.includes('slice') || code.includes('limit'),
        hint: 'Use POSTS.slice(startIdx, startIdx + limit)',
      },
      {
        description: 'Encodes next cursor as base64',
        check: (code) => code.includes('base64') || code.includes('btoa') || code.includes('Buffer.from'),
        hint: 'Use btoa(lastPost.id) to encode the cursor',
      },
      {
        description: 'Sets hasMore correctly',
        check: (code) => code.includes('hasMore') && (code.includes('length > limit') || code.includes('startIdx + limit') || code.includes('< POSTS')),
        hint: 'hasMore = endIdx < POSTS.length',
      },
    ],
    solution: `function getPosts(cursor = null, limit = 10) {
  let startIdx = 0;

  if (cursor) {
    const decodedId = atob(cursor);
    const cursorIdx = POSTS.findIndex(p => p.id === decodedId);
    startIdx = cursorIdx + 1;
  }

  const page = POSTS.slice(startIdx, startIdx + limit);
  const hasMore = startIdx + limit < POSTS.length;
  const lastPost = page[page.length - 1];
  const nextCursor = hasMore && lastPost ? btoa(lastPost.id) : null;

  return { data: page, nextCursor, hasMore };
}`,
    skills: ['API Design', 'Pagination', 'Performance', 'JavaScript'],
  },

  // ── Database ──────────────────────────────────────────────────────────────

  {
    id: 'db-001',
    title: 'Fix the N+1 Query Problem',
    type: 'database',
    difficulty: 'medium',
    xp: 150,
    company: 'Startup',
    scenario: 'Your app\'s order list page is loading in 8 seconds. The backend is making 101 database queries to render 100 orders. Classic N+1 problem. Fix it to use 2 queries maximum.',
    brokenCode: `// This code makes 1 query for orders + 1 per order for user = N+1 queries
// Fix it to use eager loading (2 queries total)

// Simulated DB
const ordersTable = Array.from({ length: 100 }, (_, i) => ({
  id: \`order_\${i + 1\}\`,
  userId: \`user_\${(i % 10) + 1}\`,
  total: (Math.random() * 500).toFixed(2),
  status: ['pending', 'shipped', 'delivered'][i % 3],
}));

const usersTable = Array.from({ length: 10 }, (_, i) => ({
  id: \`user_\${i + 1}\`,
  name: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'][i],
  email: \`user\${i + 1}@example.com\`,
}));

// Simulated DB functions
let queryCount = 0;
const db = {
  query: (label) => { queryCount++; return label; },
  getOrders: () => { db.query('SELECT * FROM orders'); return ordersTable; },
  getUserById: (id) => { db.query(\`SELECT * FROM users WHERE id = '\${id}'\`); return usersTable.find(u => u.id === id); },
  getUsersByIds: (ids) => { db.query(\`SELECT * FROM users WHERE id IN (...)\`); return usersTable.filter(u => ids.includes(u.id)); },
};

// ❌ BAD: N+1 queries
function getOrdersWithUsersBad() {
  queryCount = 0;
  const orders = db.getOrders();  // 1 query
  return orders.map(order => ({
    ...order,
    user: db.getUserById(order.userId),  // N queries!
  }));
}

// TODO: Fix this function to use only 2 queries
function getOrdersWithUsersGood() {
  queryCount = 0;
  // YOUR CODE HERE
  // Step 1: fetch all orders (1 query)
  // Step 2: collect unique userIds
  // Step 3: fetch all users in ONE query
  // Step 4: create a userId → user lookup map
  // Step 5: map orders with their users
}

const bad = getOrdersWithUsersBad();
console.log('Bad approach — queries:', queryCount);

getOrdersWithUsersGood();
console.log('Good approach — queries:', queryCount);`,
    taskDescription: 'Rewrite `getOrdersWithUsersGood()` to use exactly 2 database queries:\n1. One query to get all orders\n2. One query to get all unique users at once\n\nUse a Map for O(1) user lookup instead of nested loop.',
    expectedBehavior: 'queryCount should be 2 after calling getOrdersWithUsersGood(). Each order should still have the correct user object attached.',
    hints: [
      'Collect unique userIds with: `[...new Set(orders.map(o => o.userId))]`',
      'Fetch all users at once: `db.getUsersByIds(uniqueIds)`',
      'Build a lookup map: `const userMap = new Map(users.map(u => [u.id, u]))`',
    ],
    testCases: [
      {
        description: 'Collects unique user IDs before fetching',
        check: (code) => code.includes('Set') || code.includes('userIds') || code.includes('unique'),
        hint: 'Collect unique userIds first: [...new Set(orders.map(o => o.userId))]',
      },
      {
        description: 'Uses getUsersByIds (batch query, not getUserById in loop)',
        check: (code) => code.includes('getUsersByIds') && !code.includes('getUserById'),
        hint: 'Use db.getUsersByIds(uniqueIds) instead of db.getUserById inside a loop',
      },
      {
        description: 'Uses a Map or object for O(1) user lookup',
        check: (code) => code.includes('Map(') || code.includes('userMap') || code.includes('usersById'),
        hint: 'Create: const userMap = new Map(users.map(u => [u.id, u]))',
      },
    ],
    solution: `function getOrdersWithUsersGood() {
  queryCount = 0;
  const orders = db.getOrders();                                    // query 1
  const uniqueIds = [...new Set(orders.map(o => o.userId))];
  const users = db.getUsersByIds(uniqueIds);                        // query 2
  const userMap = new Map(users.map(u => [u.id, u]));
  return orders.map(order => ({
    ...order,
    user: userMap.get(order.userId),
  }));
}`,
    skills: ['SQL', 'Performance', 'N+1 Problem', 'Database Optimization'],
  },

  // ── System Thinking ──────────────────────────────────────────────────────

  {
    id: 'sys-001',
    title: 'Design the Data Model: E-Commerce',
    type: 'system-thinking',
    difficulty: 'medium',
    xp: 125,
    company: 'Flipkart-style',
    scenario: 'You are joining a new e-commerce startup. Day 1. You need to design the core database schema before any code is written. Get the data model wrong now and you\'ll be rewriting migrations for the next 2 years.',
    brokenCode: `-- INCOMPLETE: E-commerce database schema
-- Requirements:
-- • Users can place multiple orders
-- • Each order can contain multiple products (with quantity and price at time of order)
-- • Products have categories (one product, one category)
-- • Track order status history (pending → processing → shipped → delivered)
-- • Products can have multiple images
-- • Users have exactly one shipping address per order (address may differ per order)

-- TODO: Complete the schema. Some tables are started, others are missing entirely.

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categories (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL CHECK (price_cents > 0),
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id INT REFERENCES categories(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- TODO: Add tables for:
-- 1. product_images (product can have multiple images with sort_order)
-- 2. orders (with shipping address embedded, status, user reference)
-- 3. order_items (the M:N junction — product + quantity + price_at_order_time)
-- 4. order_status_history (log every status change with timestamp)`,
    taskDescription: 'Complete the schema with 4 missing tables:\n1. `product_images` — multiple images per product with ordering\n2. `orders` — with user FK, shipping address fields, and current status\n3. `order_items` — junction table with quantity and price snapshot\n4. `order_status_history` — audit trail of status changes',
    expectedBehavior: 'A valid SQL schema with proper foreign keys, constraints, and normalized structure. Price in order_items must be copied from product at order time (snapshot), not a live reference.',
    hints: [
      'Store shipping address as columns on orders (not a separate table) — it\'s a snapshot, not a living record',
      'order_items must store price_cents as it was at order time — products\' prices change!',
      'order_status_history: (order_id, status, changed_at) — one row per status transition',
    ],
    testCases: [
      {
        description: 'product_images table with sort_order column',
        check: (code) => code.toLowerCase().includes('product_images') && code.toLowerCase().includes('sort_order'),
        hint: 'CREATE TABLE product_images (id, product_id FK, url, sort_order, alt_text)',
      },
      {
        description: 'order_items has price_cents (price snapshot, not just FK)',
        check: (code) => code.toLowerCase().includes('order_items') && code.toLowerCase().includes('price_cents'),
        hint: 'Include price_cents in order_items to capture price at time of purchase',
      },
      {
        description: 'order_status_history table exists',
        check: (code) => code.toLowerCase().includes('order_status_history') || code.toLowerCase().includes('status_history'),
        hint: 'CREATE TABLE order_status_history (order_id, status, changed_at)',
      },
      {
        description: 'orders has shipping address fields',
        check: (code) => code.toLowerCase().includes('shipping') && code.toLowerCase().includes('orders'),
        hint: 'Include shipping_address, shipping_city, shipping_pincode on the orders table',
      },
    ],
    solution: `CREATE TABLE product_images (
  id         SERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt_text   TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id),
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  total_cents       INT NOT NULL CHECK (total_cents >= 0),
  -- Shipping address is a snapshot (user may change address later)
  shipping_name     TEXT NOT NULL,
  shipping_address  TEXT NOT NULL,
  shipping_city     TEXT NOT NULL,
  shipping_pincode  TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id          SERIAL PRIMARY KEY,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  quantity    INT NOT NULL CHECK (quantity > 0),
  -- Price snapshot: capture what the customer paid, independent of current product price
  price_cents INT NOT NULL CHECK (price_cents > 0)
);

CREATE TABLE order_status_history (
  id         SERIAL PRIMARY KEY,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  note       TEXT
);`,
    skills: ['SQL', 'Database Design', 'ER Modeling', 'Normalization'],
  },

  // ── Frontend ──────────────────────────────────────────────────────────────

  {
    id: 'fe-001',
    title: 'Fix the React Memory Leak',
    type: 'frontend',
    difficulty: 'medium',
    xp: 125,
    company: 'Product Company',
    scenario: 'QA flagged a warning: "Can\'t perform a React state update on an unmounted component." This happens on the UserProfile page — the component fetches data, but users navigate away before the fetch completes. Memory leak!',
    brokenCode: `// UserProfile component — has a memory leak + missing cleanup
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Bug 1: No cleanup — if component unmounts before fetch completes,
    // setUser/setLoading/setError will be called on unmounted component

    setLoading(true);
    setError(null);

    fetch(\`/api/users/\${userId}\`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(data => {
        setUser(data);      // ← called after unmount!
        setLoading(false);  // ← called after unmount!
      })
      .catch(err => {
        setError(err.message);  // ← called after unmount!
        setLoading(false);
      });

    // Bug 2: No cleanup function returned!
    // useEffect should return a cleanup function

  }, [userId]); // Bug 3: userId in deps is correct, but cleanup is missing

  if (loading) return <div>Loading...</div>;
  if (error)   return <div>Error: {error}</div>;
  if (!user)   return null;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`,
    taskDescription: 'Fix the memory leak using AbortController:\n1. Create an AbortController at the start of the effect\n2. Pass `signal` to fetch()\n3. Return a cleanup function that calls `controller.abort()`\n4. Handle the AbortError case (don\'t set error state for intentional aborts)',
    expectedBehavior: 'When navigating away before fetch completes, no "state update on unmounted component" warning. AbortController cancels the inflight request.',
    hints: [
      'Create: `const controller = new AbortController()`',
      'Pass to fetch: `fetch(url, { signal: controller.signal })`',
      'In catch: `if (err.name === "AbortError") return;` — don\'t treat aborts as errors',
      'Return cleanup: `return () => controller.abort()`',
    ],
    testCases: [
      {
        description: 'Creates AbortController',
        check: (code) => code.includes('AbortController'),
        hint: 'Add: const controller = new AbortController()',
      },
      {
        description: 'Passes signal to fetch',
        check: (code) => code.includes('signal') && code.includes('controller'),
        hint: 'Pass { signal: controller.signal } as second arg to fetch()',
      },
      {
        description: 'Returns cleanup that calls controller.abort()',
        check: (code) => code.includes('controller.abort') && code.includes('return'),
        hint: 'Return () => controller.abort() from the useEffect',
      },
      {
        description: 'Handles AbortError without setting error state',
        check: (code) => code.includes('AbortError'),
        hint: 'In catch: if (err.name === "AbortError") return;',
      },
    ],
    solution: `useEffect(() => {
  const controller = new AbortController();

  setLoading(true);
  setError(null);

  fetch(\`/api/users/\${userId}\`, { signal: controller.signal })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    })
    .then(data => {
      setUser(data);
      setLoading(false);
    })
    .catch(err => {
      if (err.name === 'AbortError') return; // intentional abort — do nothing
      setError(err.message);
      setLoading(false);
    });

  return () => controller.abort(); // cleanup: cancel fetch on unmount
}, [userId]);`,
    skills: ['React', 'useEffect', 'Memory Leaks', 'AbortController'],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_META: Record<ChallengeType, { label: string; icon: string; color: string; bg: string; border: string }> = {
  'debug':          { label: 'Debugging',         icon: 'bug_report',      color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
  'api':            { label: 'API Design',         icon: 'api',             color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  'frontend':       { label: 'Frontend',           icon: 'web',             color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
  'database':       { label: 'Database',           icon: 'storage',         color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  'system-thinking':{ label: 'System Thinking',   icon: 'architecture',    color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
};

const DIFF_META: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: 'text-emerald-400' },
  medium: { label: 'Medium', color: 'text-amber-400' },
  hard:   { label: 'Hard',   color: 'text-red-400' },
};

// ─── Challenge Card ──────────────────────────────────────────────────────────

function ChallengeCard({ c, onStart, solved }: { c: Challenge; onStart: () => void; solved: boolean }) {
  const t = TYPE_META[c.type];
  const d = DIFF_META[c.difficulty];
  return (
    <div className={`bg-[#1a1a1a] rounded-2xl border ${t.border} p-5 flex flex-col gap-3 hover:border-white/20 transition-all`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl ${t.bg} flex items-center justify-center shrink-0`}>
          <Icon name={t.icon} className={`text-base ${t.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-zinc-600 mb-0.5">{t.label} · {c.company}</div>
          <h3 className="text-sm font-semibold text-white leading-tight">{c.title}</h3>
        </div>
        {solved && <Icon name="check_circle" className="text-emerald-400 text-lg shrink-0" />}
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{c.scenario}</p>
      <div className="flex flex-wrap gap-1.5">
        {c.skills.slice(0, 3).map(s => (
          <span key={s} className="text-[10px] bg-white/5 text-zinc-500 px-2 py-0.5 rounded-full">{s}</span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold ${d.color}`}>{d.label}</span>
          <span className="text-xs text-amber-400 font-semibold">+{c.xp} XP</span>
        </div>
        <button
          onClick={onStart}
          className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${
            solved
              ? 'bg-white/5 text-zinc-500 hover:bg-white/10'
              : `${t.bg} ${t.color} border ${t.border} hover:border-white/20`
          }`}
        >
          {solved ? 'Review' : 'Solve'}
        </button>
      </div>
    </div>
  );
}

// ─── Solver View ──────────────────────────────────────────────────────────────

function ChallengeSolver({ challenge, onBack, onSubmit }: {
  challenge: Challenge;
  onBack: () => void;
  onSubmit: (code: string) => void;
}) {
  const [code,         setCode]         = useState(challenge.brokenCode);
  const [activeTab,    setActiveTab]    = useState<'code' | 'hints' | 'solution'>('code');
  const [results,      setResults]      = useState<{ pass: boolean; desc: string; hint: string }[] | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const handleCheck = useCallback(() => {
    const res = challenge.testCases.map(tc => ({
      pass: tc.check(code),
      desc: tc.description,
      hint: tc.hint,
    }));
    setResults(res);
    if (res.every(r => r.pass)) onSubmit(code);
  }, [code, challenge, onSubmit]);

  const t = TYPE_META[challenge.type];
  const allPass = results?.every(r => r.pass) ?? false;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-[#141414] shrink-0 flex-wrap gap-y-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
          <Icon name="arrow_back" className="text-base" /> Back
        </button>
        <div className={`${t.bg} border ${t.border} px-3 py-1 rounded-lg text-xs font-semibold ${t.color}`}>
          {t.label}
        </div>
        <h2 className="text-sm font-semibold text-white">{challenge.title}</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-amber-400 font-bold">+{challenge.xp} XP</span>
          <button
            onClick={handleCheck}
            className="bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold px-5 py-2 rounded-xl transition-colors"
          >
            Check Solution
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {/* Left: scenario + task */}
        <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col">
          <div className="flex gap-1 bg-[#111] p-1 border-b border-white/5">
            {(['code', 'hints', 'solution'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); if (tab === 'solution') setShowSolution(true); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4 text-xs leading-relaxed">
            {activeTab === 'code' && (
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Scenario</div>
                  <p className="text-zinc-400">{challenge.scenario}</p>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Your Task</div>
                  <pre className="text-zinc-300 whitespace-pre-wrap font-sans">{challenge.taskDescription}</pre>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Expected Behavior</div>
                  <p className="text-zinc-500">{challenge.expectedBehavior}</p>
                </div>
              </div>
            )}
            {activeTab === 'hints' && (
              <div className="space-y-3">
                {challenge.hints.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-amber-400 font-bold shrink-0">#{i + 1}</span>
                    <span className="text-zinc-400">{h}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'solution' && (
              <div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-3">
                  <p className="text-amber-400 font-semibold mb-1">Official Solution</p>
                  <p className="text-zinc-500">Try to solve it yourself first — the real learning happens in the struggle.</p>
                </div>
                <pre className="text-emerald-300 text-xs font-mono whitespace-pre-wrap bg-black/20 p-3 rounded-xl">
                  {challenge.solution}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right: code editor + results */}
        <div className="flex-1 min-w-0 flex flex-col">
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 min-h-[300px] bg-[#0e0e0e] text-zinc-200 font-mono text-xs leading-6 resize-none outline-none p-4"
          />

          {/* Test results */}
          {results && (
            <div className={`border-t ${allPass ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/10 bg-red-500/5'} p-4 shrink-0`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon name={allPass ? 'check_circle' : 'cancel'} className={`text-lg ${allPass ? 'text-emerald-400' : 'text-red-400'}`} />
                <span className={`text-sm font-semibold ${allPass ? 'text-emerald-400' : 'text-red-400'}`}>
                  {allPass ? `All checks passed! +${challenge.xp} XP earned` : `${results.filter(r => r.pass).length}/${results.length} checks passing`}
                </span>
              </div>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Icon name={r.pass ? 'check' : 'close'} className={`text-sm shrink-0 mt-0.5 ${r.pass ? 'text-emerald-400' : 'text-red-400'}`} />
                    <div>
                      <span className={r.pass ? 'text-zinc-400' : 'text-zinc-300'}>{r.desc}</span>
                      {!r.pass && <div className="text-zinc-600 mt-0.5">{r.hint}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTER_TYPES: (ChallengeType | 'all')[] = ['all', 'debug', 'api', 'frontend', 'database', 'system-thinking'];

export function RealWorldPage() {
  const { fireXP } = useUser();
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [filter, setFilter] = useState<ChallengeType | 'all'>('all');
  const [solved, setSolved] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('eyf.realworld.solved') ?? '[]')); }
    catch { return new Set(); }
  });

  const handleSubmit = useCallback((challenge: Challenge) => {
    setSolved(prev => {
      const next = new Set(prev).add(challenge.id);
      localStorage.setItem('eyf.realworld.solved', JSON.stringify([...next]));
      return next;
    });
    fireXP(challenge.xp, `Real-World: ${challenge.title}`);
  }, [fireXP]);

  if (activeChallenge) {
    return (
      <AppShell>
        <ChallengeSolver
          challenge={activeChallenge}
          onBack={() => setActiveChallenge(null)}
          onSubmit={(code) => { handleSubmit(activeChallenge); }}
        />
      </AppShell>
    );
  }

  const filtered = filter === 'all' ? CHALLENGES : CHALLENGES.filter(c => c.type === filter);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">Real-World Challenges</h1>
            <span className="text-[10px] font-bold text-[#E82127] bg-[#E82127]/10 px-2 py-1 rounded-full border border-[#E82127]/20">
              EYF EXCLUSIVE
            </span>
          </div>
          <p className="text-sm text-zinc-500 max-w-2xl">
            Debug broken production code, design APIs, fix database anti-patterns, and solve real engineering scenarios.
            Not just DSA — the skills that actually matter in your first job.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Challenges',   value: CHALLENGES.length,                     icon: 'code' },
            { label: 'Solved',       value: solved.size,                           icon: 'check_circle' },
            { label: 'XP Available', value: CHALLENGES.reduce((s,c)=>s+c.xp,0),   icon: 'stars' },
            { label: 'Skill Types',  value: Object.keys(TYPE_META).length,         icon: 'category' },
          ].map(s => (
            <div key={s.label} className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <Icon name={s.icon} className="text-xl text-zinc-600" />
              <div>
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-xs text-zinc-600">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_TYPES.map(type => {
            const meta = type === 'all' ? null : TYPE_META[type];
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                  filter === type
                    ? (meta ? `${meta.bg} ${meta.border} ${meta.color}` : 'bg-white/10 border-white/20 text-white')
                    : 'border-white/5 text-zinc-600 hover:text-zinc-400 hover:border-white/10'
                }`}
              >
                {meta && <Icon name={meta.icon} className="text-sm" />}
                {type === 'all' ? 'All Types' : TYPE_META[type].label}
              </button>
            );
          })}
        </div>

        {/* Challenge grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <ChallengeCard
              key={c.id}
              c={c}
              solved={solved.has(c.id)}
              onStart={() => setActiveChallenge(c)}
            />
          ))}
        </div>

        {/* Differentiation note */}
        <div className="mt-10 bg-[#141414] border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-2">Why Real-World Challenges?</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            LeetCode teaches you to reverse a linked list. Your first job will ask you to fix a race condition,
            design a database schema, or optimize a slow API. EYF trains both — because both matter for placement
            <em> and</em> for performing well once you're hired.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
