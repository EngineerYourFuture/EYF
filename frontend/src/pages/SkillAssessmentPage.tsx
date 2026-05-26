import { useState, useEffect, useCallback, useRef } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { useUser } from '../contexts/UserContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Skill {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  category: string;
  questions: Question[];
  timeLimitSeconds: number;
}

type AssessmentState = 'catalog' | 'intro' | 'quiz' | 'result';

// ─── Question Data ────────────────────────────────────────────────────────────

const SKILLS: Skill[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: 'javascript',
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-amber-500/20',
    category: 'Programming',
    timeLimitSeconds: 600,
    questions: [
      {
        id: 'js-1',
        text: 'What is the output of: console.log(typeof null)?',
        options: ['"null"', '"object"', '"undefined"', '"string"'],
        correct: 1,
        explanation: 'typeof null returns "object" — a historical JavaScript bug that was never fixed for backwards compatibility.',
      },
      {
        id: 'js-2',
        text: 'Which of the following creates a closure?',
        options: [
          'function outer() { let x = 1; return function() { return x; }; }',
          'const x = 1;',
          'class Foo { bar() {} }',
          'const arr = [1, 2, 3].map(n => n * 2);',
        ],
        correct: 0,
        explanation: 'A closure is formed when an inner function retains access to variables from its outer function\'s scope after the outer function has returned.',
      },
      {
        id: 'js-3',
        text: 'What does Array.prototype.flat(Infinity) do?',
        options: [
          'Sorts the array and removes duplicates',
          'Recursively flattens all nested arrays to a single depth',
          'Creates an infinite array',
          'Returns the last element of the array',
        ],
        correct: 1,
        explanation: '.flat(Infinity) recursively flattens any deeply nested array into a single-level array.',
      },
      {
        id: 'js-4',
        text: 'What is the difference between == and === in JavaScript?',
        options: [
          '== compares values and types; === compares only values',
          '== performs type coercion; === performs strict comparison (no coercion)',
          'There is no difference',
          '=== only works for primitives',
        ],
        correct: 1,
        explanation: '== uses abstract equality with type coercion (e.g., "1" == 1 is true). === uses strict equality — both value and type must match.',
      },
      {
        id: 'js-5',
        text: 'What is the output of: Promise.resolve(1).then(v => v + 1).then(v => { throw v; }).catch(v => v + 1)?',
        options: ['1', '2', '3', 'Unhandled rejection'],
        correct: 2,
        explanation: '1 → then: 2 → then throws 2 → catch receives 2, returns 3. Promise chains propagate through catch.',
      },
      {
        id: 'js-6',
        text: 'Which method creates a shallow copy of an object?',
        options: ['JSON.parse(JSON.stringify(obj))', 'Object.assign({}, obj)', 'obj.copy()', 'Object.deepCopy(obj)'],
        correct: 1,
        explanation: 'Object.assign({}, obj) creates a shallow copy. JSON.parse(JSON.stringify()) creates a deep copy but loses non-JSON-serializable values (functions, undefined, Date).',
      },
      {
        id: 'js-7',
        text: 'What is event delegation?',
        options: [
          'Attaching an event listener to each child element',
          'Using setTimeout to delay event handling',
          'Attaching a single listener to a parent and using event.target to determine the source',
          'Removing event listeners when no longer needed',
        ],
        correct: 2,
        explanation: 'Event delegation leverages event bubbling: one listener on a parent handles events from all current and future children, improving performance and memory usage.',
      },
      {
        id: 'js-8',
        text: 'What does the "use strict" directive do?',
        options: [
          'Enables TypeScript type checking',
          'Prevents the use of var',
          'Eliminates some JavaScript silent errors by throwing them, disables bad features',
          'Makes all variables immutable',
        ],
        correct: 2,
        explanation: '"use strict" disables features like with statements, prevents global variable creation from typos, and throws on silent errors like assigning to read-only properties.',
      },
      {
        id: 'js-9',
        text: 'What is the output of: [1, 2, 3].reduce((acc, n) => acc + n, 10)?',
        options: ['6', '16', '10', 'Error'],
        correct: 1,
        explanation: 'reduce starts with the initial value 10, then adds 1 (11), 2 (13), 3 (16). Result is 16.',
      },
      {
        id: 'js-10',
        text: 'What is a WeakMap in JavaScript?',
        options: [
          'A Map with fewer features',
          'A Map where keys are weakly held — no strong references, allowing GC',
          'A Map that allows only string keys',
          'A Map that deletes entries after 60 seconds',
        ],
        correct: 1,
        explanation: 'WeakMap keys must be objects and are weakly referenced — if no other reference to the key exists, the entry is garbage collected. Useful for caches and metadata without memory leaks.',
      },
    ],
  },
  {
    id: 'sql',
    name: 'SQL',
    icon: 'storage',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    category: 'Databases',
    timeLimitSeconds: 600,
    questions: [
      {
        id: 'sql-1',
        text: 'Which SQL clause is used to filter groups created by GROUP BY?',
        options: ['WHERE', 'HAVING', 'FILTER', 'SELECT'],
        correct: 1,
        explanation: 'HAVING filters groups after aggregation. WHERE filters rows before aggregation. You cannot use aggregate functions in WHERE.',
      },
      {
        id: 'sql-2',
        text: 'What is the difference between INNER JOIN and LEFT JOIN?',
        options: [
          'INNER JOIN returns all rows from both tables; LEFT JOIN returns only left table rows',
          'INNER JOIN returns rows with matches in both tables; LEFT JOIN returns all left rows plus matched right rows',
          'There is no difference',
          'LEFT JOIN is deprecated in SQL standard',
        ],
        correct: 1,
        explanation: 'INNER JOIN: only matched rows. LEFT JOIN: all rows from left table + matched right rows (NULL for non-matching right rows).',
      },
      {
        id: 'sql-3',
        text: 'Which window function assigns a unique sequential integer to each row within a partition?',
        options: ['RANK()', 'DENSE_RANK()', 'ROW_NUMBER()', 'NTILE()'],
        correct: 2,
        explanation: 'ROW_NUMBER() assigns unique sequential integers (no gaps, no ties). RANK() has gaps for ties. DENSE_RANK() has no gaps. NTILE() divides rows into N buckets.',
      },
      {
        id: 'sql-4',
        text: 'What does EXPLAIN ANALYZE do?',
        options: [
          'Shows the query plan without running the query',
          'Runs the query and shows actual execution statistics',
          'Optimizes the query automatically',
          'Updates statistics for the query planner',
        ],
        correct: 1,
        explanation: 'EXPLAIN shows the planner\'s estimated plan. EXPLAIN ANALYZE actually runs the query and returns both estimates and actual row counts, timing, and execution details.',
      },
      {
        id: 'sql-5',
        text: 'Which isolation level prevents dirty reads, non-repeatable reads, but allows phantom reads?',
        options: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
        correct: 2,
        explanation: 'REPEATABLE READ prevents dirty reads and non-repeatable reads. Phantom reads (new rows matching a range query) are still possible. SERIALIZABLE prevents all three anomalies.',
      },
      {
        id: 'sql-6',
        text: 'What is a covering index?',
        options: [
          'An index that covers all tables in a JOIN',
          'An index that includes all columns a query needs, so the table is never accessed',
          'A partial index on NULL values',
          'A unique index on a composite key',
        ],
        correct: 1,
        explanation: 'A covering index satisfies a query entirely from the index B-tree without touching the table heap. Dramatically reduces I/O for read-heavy queries.',
      },
      {
        id: 'sql-7',
        text: 'What is the purpose of ON DELETE CASCADE on a foreign key?',
        options: [
          'Prevent deletion of parent row if child rows exist',
          'Automatically delete child rows when parent row is deleted',
          'Set child FK column to NULL on parent delete',
          'Prevent deletion of the child table',
        ],
        correct: 1,
        explanation: 'ON DELETE CASCADE automatically deletes all child rows when the referenced parent row is deleted. Use for ownership relationships (Order → OrderItems).',
      },
      {
        id: 'sql-8',
        text: 'What does COALESCE(a, b, c) return?',
        options: [
          'The sum of a, b, and c',
          'The first non-NULL value among a, b, c',
          'NULL if any of a, b, c is NULL',
          'The concatenation of a, b, and c',
        ],
        correct: 1,
        explanation: 'COALESCE returns the first non-NULL value in its argument list. COALESCE(NULL, NULL, 3) returns 3. Commonly used for default values.',
      },
      {
        id: 'sql-9',
        text: 'Which SQL command is used to create an index on table users for the email column?',
        options: [
          'ADD INDEX users (email);',
          'CREATE INDEX idx_users_email ON users (email);',
          'INDEX ON users.email;',
          'ALTER TABLE users INDEX email;',
        ],
        correct: 1,
        explanation: 'Standard SQL syntax: CREATE INDEX idx_name ON table_name (column). Index name is arbitrary but should be descriptive (idx_tablename_column convention).',
      },
      {
        id: 'sql-10',
        text: 'What is the result of: SELECT 1 WHERE EXISTS (SELECT 1 WHERE 1=0)?',
        options: ['1', '0', 'NULL', 'No rows returned'],
        correct: 3,
        explanation: 'EXISTS returns TRUE/FALSE. The subquery WHERE 1=0 returns no rows, so EXISTS is FALSE. The outer WHERE condition fails and no rows are returned.',
      },
    ],
  },
  {
    id: 'python',
    name: 'Python',
    icon: 'code',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
    category: 'Programming',
    timeLimitSeconds: 600,
    questions: [
      {
        id: 'py-1',
        text: 'What is the output of: list(range(2, 10, 3))?',
        options: ['[2, 5, 8]', '[2, 4, 6, 8]', '[3, 6, 9]', '[2, 5, 8, 11]'],
        correct: 0,
        explanation: 'range(start, stop, step): starts at 2, increments by 3, stops before 10. Values: 2, 5, 8.',
      },
      {
        id: 'py-2',
        text: 'Which of the following creates a generator expression?',
        options: ['[x**2 for x in range(10)]', '(x**2 for x in range(10))', '{x**2 for x in range(10)}', 'set(x**2 for x in range(10))'],
        correct: 1,
        explanation: 'Parentheses () create a generator (lazy, memory efficient). Brackets [] create a list. Curly braces {} create a set. Generators yield values on demand.',
      },
      {
        id: 'py-3',
        text: 'What is the purpose of __slots__ in a Python class?',
        options: [
          'To define abstract methods',
          'To prevent adding new attributes dynamically and reduce memory usage',
          'To make class attributes private',
          'To create class-level constants',
        ],
        correct: 1,
        explanation: '__slots__ restricts instance attributes to a fixed set, eliminating the per-instance __dict__. This reduces memory for large numbers of objects (e.g., 40-50% less memory).',
      },
      {
        id: 'py-4',
        text: 'What does the walrus operator := do?',
        options: [
          'Performs integer division',
          'Assigns a value to a variable as part of an expression',
          'Creates a new namespace',
          'Unpacks a tuple',
        ],
        correct: 1,
        explanation: ':= (walrus) is an assignment expression. while chunk := f.read(8192): processes and reads simultaneously without repeating the read call.',
      },
      {
        id: 'py-5',
        text: 'What is the difference between deepcopy and copy.copy()?',
        options: [
          'There is no difference',
          'copy() creates a shallow copy (nested objects are shared); deepcopy() recursively copies all nested objects',
          'deepcopy() is faster',
          'copy() only works on lists',
        ],
        correct: 1,
        explanation: 'copy.copy() creates a new container but references the same nested objects. copy.deepcopy() recursively creates new copies of all nested objects — fully independent.',
      },
      {
        id: 'py-6',
        text: 'What does @property do?',
        options: [
          'Makes a method a class method',
          'Allows a method to be called like an attribute (getter), enabling controlled access',
          'Makes an attribute read-only permanently',
          'Creates a static variable',
        ],
        correct: 1,
        explanation: '@property turns a method into a getter. Pair with @x.setter and @x.deleter to create full property descriptors with validation, while maintaining attribute-style access syntax.',
      },
      {
        id: 'py-7',
        text: 'What is the GIL in CPython?',
        options: [
          'A garbage collection mechanism',
          'Global Interpreter Lock — a mutex that prevents multiple threads from executing Python bytecode simultaneously',
          'A module for GUI programming',
          'A profiling tool',
        ],
        correct: 1,
        explanation: 'The GIL prevents true multi-core parallelism in CPython for CPU-bound tasks. Use multiprocessing for CPU parallelism. Threads work well for I/O-bound tasks (GIL is released during I/O).',
      },
      {
        id: 'py-8',
        text: 'What does collections.defaultdict(list) do?',
        options: [
          'Creates a list of default dictionaries',
          'A dict where missing keys automatically get an empty list as their default value',
          'Raises KeyError for missing keys with a list traceback',
          'Creates an ordered dictionary',
        ],
        correct: 1,
        explanation: 'defaultdict(list) automatically creates an empty list for any missing key, avoiding KeyError and the need to initialize each key. Perfect for grouping: d[key].append(value).',
      },
      {
        id: 'py-9',
        text: 'What is the output of: sorted(["banana", "apple", "cherry"], key=len)?',
        options: [
          '["apple", "banana", "cherry"]',
          '["apple", "cherry", "banana"]',
          '["banana", "apple", "cherry"]',
          '["cherry", "apple", "banana"]',
        ],
        correct: 1,
        explanation: 'sorted with key=len sorts by string length: apple(5), cherry(6), banana(6). "cherry" before "banana" because they have the same length and Python\'s sort is stable (original order preserved).',
      },
      {
        id: 'py-10',
        text: 'What does functools.lru_cache do?',
        options: [
          'Loads data from a cache file',
          'Caches function return values based on arguments (memoization) using a least-recently-used cache',
          'Creates a lazy evaluation cache',
          'Encrypts function arguments',
        ],
        correct: 1,
        explanation: '@lru_cache memoizes function calls — repeated calls with the same args return cached results in O(1). maxsize=None caches all results (unbounded). Essential for speeding up recursive algorithms.',
      },
    ],
  },
  {
    id: 'react',
    name: 'React',
    icon: 'widgets',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    category: 'Frontend',
    timeLimitSeconds: 600,
    questions: [
      {
        id: 'react-1',
        text: 'When does useEffect run?',
        options: [
          'Before every render',
          'After every render by default; after first render if [] dependency; when dependencies change',
          'Only on component mount, once',
          'Only when the component is unmounted',
        ],
        correct: 1,
        explanation: 'useEffect timing: no deps → after every render; [] → after first render only; [a, b] → after first render and whenever a or b changes. The cleanup function runs before the next effect and on unmount.',
      },
      {
        id: 'react-2',
        text: 'What is the purpose of the key prop in lists?',
        options: [
          'To style list items',
          'To help React identify which items changed, were added, or removed for efficient reconciliation',
          'To sort list items',
          'To prevent re-renders',
        ],
        correct: 1,
        explanation: 'Keys help React\'s reconciliation algorithm match elements across renders. Using index as key is problematic when items can be reordered/deleted — use stable IDs instead.',
      },
      {
        id: 'react-3',
        text: 'What is the difference between useCallback and useMemo?',
        options: [
          'useCallback memoizes a value; useMemo memoizes a function',
          'useCallback memoizes a function reference; useMemo memoizes the result of calling a function',
          'They are identical',
          'useCallback is for async functions; useMemo is for sync',
        ],
        correct: 1,
        explanation: 'useCallback(fn, deps) returns a stable function reference. useMemo(() => expensiveComputation(), deps) returns the computed value. useCallback(fn, deps) ≡ useMemo(() => fn, deps).',
      },
      {
        id: 'react-4',
        text: 'What does React.memo do?',
        options: [
          'Memoizes a hook\'s return value',
          'Creates a memoized version of a component that only re-renders when its props change',
          'Replaces useEffect for data fetching',
          'Enables server-side rendering',
        ],
        correct: 1,
        explanation: 'React.memo is a higher-order component. It does a shallow comparison of props — if props haven\'t changed, the component skips re-rendering. Use for expensive pure components.',
      },
      {
        id: 'react-5',
        text: 'What is a controlled component?',
        options: [
          'A component managed by a parent component\'s ref',
          'A form element whose value is controlled by React state (value + onChange)',
          'A component that uses Context API',
          'A component with strict error boundaries',
        ],
        correct: 1,
        explanation: 'Controlled components have their form element value driven by state: <input value={state} onChange={e => setState(e.target.value)} />. Uncontrolled components use refs to access DOM values directly.',
      },
      {
        id: 'react-6',
        text: 'What is the Concurrent Mode feature of React 18?',
        options: [
          'Running React on multiple threads',
          'Allowing React to interrupt, pause, and resume rendering to keep the UI responsive',
          'A new state management solution',
          'Server-side rendering improvements',
        ],
        correct: 1,
        explanation: 'Concurrent React can interrupt long renders and process urgent updates first (startTransition, Suspense). It enables useTransition for non-blocking state updates and selective hydration.',
      },
      {
        id: 'react-7',
        text: 'When should you use useRef instead of useState?',
        options: [
          'When you need to trigger a re-render',
          'When you need to persist a value without triggering re-renders (e.g., DOM refs, previous values, timers)',
          'When sharing state between components',
          'When storing computed values',
        ],
        correct: 1,
        explanation: 'useRef persists a mutable value across renders without triggering re-renders. Common uses: DOM node references, setTimeout/interval IDs, previous prop/state values.',
      },
      {
        id: 'react-8',
        text: 'What happens if you update state inside useEffect without proper dependencies?',
        options: [
          'Nothing, it\'s safe',
          'React throws an error',
          'Can cause an infinite render loop if the state update triggers the effect again',
          'The update is silently ignored',
        ],
        correct: 2,
        explanation: 'setState in useEffect → re-render → effect runs again → setState → infinite loop. Fix: add a condition, correct dependencies, or use a different hook/approach.',
      },
      {
        id: 'react-9',
        text: 'What is the purpose of React.createPortal?',
        options: [
          'To create a new React app context',
          'To render children into a DOM node outside the component\'s parent hierarchy',
          'To lazy-load remote components',
          'To create a link between two React trees',
        ],
        correct: 1,
        explanation: 'Portals render into a different DOM node (e.g., document.body) while maintaining the React event propagation tree. Used for modals, tooltips, and dropdowns to avoid CSS overflow/z-index issues.',
      },
      {
        id: 'react-10',
        text: 'What does Suspense do in React?',
        options: [
          'Suspends JavaScript execution',
          'Allows components to "wait" for something (data, code) and show a fallback while loading',
          'Creates a loading indicator automatically',
          'Delays component unmounting',
        ],
        correct: 1,
        explanation: 'Suspense catches components that "suspend" (throw a Promise) and shows a fallback. Used with React.lazy for code-splitting and data fetching libraries that integrate with Suspense.',
      },
    ],
  },
  {
    id: 'system-design',
    name: 'System Design',
    icon: 'architecture',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-teal-500/20',
    category: 'Architecture',
    timeLimitSeconds: 600,
    questions: [
      {
        id: 'sd-1',
        text: 'In the CAP theorem, what does "Partition Tolerance" mean?',
        options: [
          'The system can handle high load',
          'The system continues operating even when network messages are dropped between nodes',
          'The system can partition data across nodes',
          'The system recovers from disk failures',
        ],
        correct: 1,
        explanation: 'Partition Tolerance: the system continues functioning even when network partitions occur (some nodes can\'t communicate). In distributed systems, partitions are unavoidable — so the real choice is between C and A.',
      },
      {
        id: 'sd-2',
        text: 'What is the purpose of an API Gateway?',
        options: [
          'A database for storing API responses',
          'A single entry point for clients that handles routing, auth, rate limiting, and aggregation',
          'A load balancer between databases',
          'A caching layer for database queries',
        ],
        correct: 1,
        explanation: 'API Gateway is the single entry point for microservices. It handles: request routing, authentication/authorization, rate limiting, SSL termination, request/response transformation, and monitoring.',
      },
      {
        id: 'sd-3',
        text: 'What problem does consistent hashing solve?',
        options: [
          'Hash collisions',
          'When N changes (add/remove a node), only K/N keys need to be remapped instead of almost all',
          'Secure password hashing',
          'Distributed locking',
        ],
        correct: 1,
        explanation: 'With naive modulo hashing, adding/removing a node requires remapping nearly all keys. Consistent hashing maps keys and nodes to a ring — only neighboring keys need remapping. Used in distributed caches and databases.',
      },
      {
        id: 'sd-4',
        text: 'What is a write-through cache vs a write-back (write-behind) cache?',
        options: [
          'Write-through: data written to cache only; write-back: data written to both',
          'Write-through: data written to both cache and DB synchronously; write-back: data written to cache first, DB asynchronously',
          'Write-through: DB updated first; write-back: cache updated first',
          'They are identical',
        ],
        correct: 1,
        explanation: 'Write-through: write to cache + DB synchronously (consistent, slower writes). Write-back: write to cache only, flush to DB asynchronously (faster writes, risk of data loss on cache crash).',
      },
      {
        id: 'sd-5',
        text: 'What is the difference between horizontal and vertical scaling?',
        options: [
          'Horizontal: upgrade CPU/RAM; Vertical: add more servers',
          'Horizontal: add more servers (scale out); Vertical: upgrade a server\'s CPU/RAM (scale up)',
          'They are the same',
          'Horizontal applies to databases; Vertical to web servers',
        ],
        correct: 1,
        explanation: 'Vertical scaling (scale up): more powerful hardware — fast but has limits and is expensive. Horizontal scaling (scale out): add more servers — complex but unlimited scale. Cloud-native systems favor horizontal.',
      },
      {
        id: 'sd-6',
        text: 'What is database sharding?',
        options: [
          'Replicating data to multiple databases',
          'Horizontally partitioning data across multiple databases, each called a shard',
          'Encrypting database contents',
          'Creating read replicas',
        ],
        correct: 1,
        explanation: 'Sharding splits data across multiple database instances (shards) by a shard key (e.g., user_id % N). Each shard holds a subset of data. Enables horizontal write scaling but adds cross-shard query complexity.',
      },
      {
        id: 'sd-7',
        text: 'What is a message queue, and when should you use one?',
        options: [
          'A database table for storing messages',
          'An async buffer between services for decoupling — use when producers generate faster than consumers process, or for reliability/retry',
          'A synchronous API call aggregator',
          'A logging system',
        ],
        correct: 1,
        explanation: 'Message queues (Kafka, SQS, RabbitMQ) decouple producers from consumers, absorb traffic spikes, enable fan-out (one message → many consumers), and provide reliability via acknowledgment + retry semantics.',
      },
      {
        id: 'sd-8',
        text: 'What is the purpose of a CDN (Content Delivery Network)?',
        options: [
          'To replicate databases globally',
          'To cache and serve static/dynamic content from edge servers close to users, reducing latency',
          'To provide DDoS protection exclusively',
          'To balance load between application servers',
        ],
        correct: 1,
        explanation: 'CDN serves content (JS, CSS, images, video) from PoPs (Points of Presence) near the user. Reduces origin load, improves latency, provides DDoS absorption, and enables global scale for static assets.',
      },
      {
        id: 'sd-9',
        text: 'What is eventual consistency?',
        options: [
          'Data is always consistent across all nodes',
          'Given no new updates, all replicas will eventually return the same data — but reads may be stale during propagation',
          'Transactions are eventually committed',
          'Consistency is achieved by retrying failed writes',
        ],
        correct: 1,
        explanation: 'In eventual consistency, writes propagate asynchronously. During propagation, different nodes may return different values. Once propagation completes, all nodes agree. Used in DynamoDB, Cassandra — trading consistency for availability and performance.',
      },
      {
        id: 'sd-10',
        text: 'What is rate limiting and which algorithm is most common in production?',
        options: [
          'Limiting database connections; mutex-based',
          'Limiting request rate per user/IP; token bucket (allows bursts, smooth average) or sliding window counter',
          'Limiting server CPU usage; process scheduling',
          'Limiting cache size; LRU eviction',
        ],
        correct: 1,
        explanation: 'Rate limiting protects services from abuse. Token bucket: refill at fixed rate, allow bursts up to bucket size (Stripe, Cloudflare). Fixed window: simple but spike at boundaries. Sliding window log: most accurate but memory-intensive.',
      },
    ],
  },
  {
    id: 'os',
    name: 'Operating Systems',
    icon: 'terminal',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-teal-500/20',
    category: 'Core CS',
    timeLimitSeconds: 600,
    questions: [
      {
        id: 'os-1',
        text: 'What is the difference between a process and a thread?',
        options: [
          'Threads are heavier than processes',
          'A process has its own address space; threads share the address space of their parent process',
          'Processes are faster than threads',
          'There is no difference in modern OSes',
        ],
        correct: 1,
        explanation: 'Processes are isolated — separate address spaces, file descriptors. Threads are lightweight — share memory, heap, and file descriptors within a process. Context switching is faster for threads.',
      },
      {
        id: 'os-2',
        text: 'What are the four conditions required for deadlock?',
        options: [
          'Starvation, livelock, preemption, circular wait',
          'Mutual exclusion, hold-and-wait, no preemption, circular wait',
          'Concurrency, scheduling, memory protection, isolation',
          'Mutual exclusion, preemption, fairness, cycle detection',
        ],
        correct: 1,
        explanation: 'Coffman conditions: (1) Mutual exclusion (only one process can use a resource), (2) Hold-and-wait, (3) No preemption (resources not forcibly taken), (4) Circular wait. All four must hold for deadlock.',
      },
      {
        id: 'os-3',
        text: 'What is virtual memory?',
        options: [
          'RAM installed in a virtual machine',
          'A memory management technique that gives each process the illusion of a private, large address space, backed by RAM + disk',
          'Memory shared between processes',
          'CPU cache memory',
        ],
        correct: 1,
        explanation: 'Virtual memory abstracts physical memory. Each process sees a private virtual address space. The OS maps virtual pages to physical frames (or disk). This enables isolation, larger-than-RAM programs, and memory protection.',
      },
      {
        id: 'os-4',
        text: 'What is a system call?',
        options: [
          'A function in a user-space library',
          'A controlled entry point from user space to kernel space to request privileged operations',
          'A network request from one OS to another',
          'A kernel-to-kernel communication mechanism',
        ],
        correct: 1,
        explanation: 'System calls are the interface between user programs and the kernel. Examples: open(), read(), write(), fork(), exit(). They switch the CPU from user mode (ring 3) to kernel mode (ring 0).',
      },
      {
        id: 'os-5',
        text: 'What is thrashing in the context of virtual memory?',
        options: [
          'Rapidly switching between CPU scheduling algorithms',
          'When page fault rate is so high that the CPU spends more time handling faults than useful work',
          'A disk defragmentation process',
          'A type of memory corruption',
        ],
        correct: 1,
        explanation: 'Thrashing occurs when the sum of all processes\' working sets exceeds physical RAM. Every page replacement creates another page fault. CPU utilization collapses. Fix: add RAM or reduce multiprogramming degree.',
      },
      {
        id: 'os-6',
        text: 'What is a semaphore?',
        options: [
          'A type of mutex lock',
          'A synchronization primitive with an integer counter for controlling access to shared resources',
          'A network packet for inter-OS communication',
          'A type of CPU scheduling algorithm',
        ],
        correct: 1,
        explanation: 'Semaphore: integer counter + two atomic operations: wait() (decrement, block if 0) and signal() (increment, wake blocked thread). Binary semaphore (0/1) ≈ mutex. Counting semaphore manages N concurrent accesses.',
      },
      {
        id: 'os-7',
        text: 'What is context switching?',
        options: [
          'Changing programming language contexts',
          'Saving the CPU state of a running process/thread and restoring another\'s state to switch execution',
          'Switching between kernel and user mode',
          'Switching between different I/O devices',
        ],
        correct: 1,
        explanation: 'Context switch: save registers, program counter, and memory mappings of current process into its PCB; load the PCB of the next scheduled process. Overhead ~1-10µs. Threads have lower overhead (shared memory mappings).',
      },
      {
        id: 'os-8',
        text: 'What is the difference between preemptive and non-preemptive scheduling?',
        options: [
          'Preemptive: only for real-time systems; non-preemptive: for general purpose',
          'Preemptive: OS can interrupt a running process; non-preemptive: process runs until it voluntarily yields',
          'There is no difference',
          'Preemptive: uses round robin; non-preemptive: uses FCFS',
        ],
        correct: 1,
        explanation: 'Preemptive (Round Robin, modern OSes): OS can forcibly stop a process after its time slice. Non-preemptive (FCFS, SJF): process keeps CPU until it blocks or exits. Modern OSes are preemptive for fairness and responsiveness.',
      },
      {
        id: 'os-9',
        text: 'What is an inode?',
        options: [
          'The content of a file',
          'A data structure storing file metadata (permissions, size, timestamps, block pointers) — NOT the filename',
          'A directory entry',
          'A file allocation table entry',
        ],
        correct: 1,
        explanation: 'Inode stores all file metadata except the filename. Filename → inode number mapping lives in directory entries. Hard links are multiple directory entries pointing to the same inode. Deleting = decrementing link count.',
      },
      {
        id: 'os-10',
        text: 'What is the purpose of the Translation Lookaside Buffer (TLB)?',
        options: [
          'To store recently translated network addresses',
          'A CPU cache for recent virtual-to-physical page translations, avoiding full page table walks',
          'A buffer for disk I/O translations',
          'A cache for system call parameters',
        ],
        correct: 1,
        explanation: 'Page table walks are expensive (multiple memory accesses). TLB caches recent VA→PA translations. On a TLB hit, translation takes 1 cycle. On a TLB miss, the hardware/OS walks the page table and loads the TLB entry.',
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToGrade(score: number): { label: string; color: string; xp: number } {
  if (score >= 90) return { label: 'Expert',       color: 'text-amber-400',   xp: 150 };
  if (score >= 80) return { label: 'Advanced',     color: 'text-emerald-400', xp: 100 };
  if (score >= 70) return { label: 'Proficient',   color: 'text-blue-400',    xp: 75 };
  if (score >= 60) return { label: 'Intermediate', color: 'text-cyan-400',    xp: 50 };
  return              { label: 'Beginner',     color: 'text-zinc-400',    xp: 25 };
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Components ───────────────────────────────────────────────────────────────

function SkillCard({ skill, onStart, bestScore }: {
  readonly skill: Skill;
  readonly onStart: () => void;
  readonly bestScore?: number;
}) {
  const grade = bestScore == null ? null : scoreToGrade(bestScore);

  return (
    <div className={`bg-gradient-to-br ${skill.gradient} border border-white/10 p-5 flex flex-col gap-4 hover:border-white/20 transition-all`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{skill.category}</div>
          <h3 className={`text-lg font-bold ${skill.color}`}>{skill.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{skill.questions.length} questions · {skill.timeLimitSeconds / 60} min</p>
        </div>
        {grade && (
          <div className="text-right">
            <div className={`text-sm font-bold ${grade.color}`}>{bestScore}%</div>
            <div className={`text-[10px] ${grade.color}`}>{grade.label}</div>
          </div>
        )}
      </div>

      <button
        onClick={onStart}
        className={`w-full py-2.5 text-sm font-semibold transition-all ${
          grade
            ? 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
            : `bg-gradient-to-r ${skill.gradient} border border-white/20 ${skill.color} hover:border-white/30`
        }`}
      >
        {grade ? 'Retake Assessment' : 'Start Assessment'}
      </button>
    </div>
  );
}

function getOptionCls(optIdx: number, chosen: number | null, correct: number): string {
  if (chosen == null) return 'bg-[#1a1a1a] border-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/5 cursor-pointer';
  if (optIdx === correct) return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 cursor-default';
  if (optIdx === chosen) return 'bg-red-500/10 border-red-500/40 text-red-300 cursor-default';
  return 'bg-[#1a1a1a] border-white/5 text-zinc-600 cursor-default';
}

function calcScore(answers: (number | null)[], questions: Question[]): number {
  const correct = answers.filter((a, i) => a === questions[i].correct).length;
  return Math.round((correct / questions.length) * 100);
}

// ─── Sub-views (extracted to keep SkillAssessmentPage complexity low) ─────────

interface QuizViewProps {
  readonly skill: Skill;
  readonly questionIndex: number;
  readonly answers: (number | null)[];
  readonly timeLeft: number;
  readonly showExplanation: boolean;
  readonly onAnswer: (idx: number) => void;
  readonly onNext: () => void;
}

function QuizView({ skill, questionIndex, answers, timeLeft, showExplanation, onAnswer, onNext }: QuizViewProps) {
  const q = skill.questions[questionIndex];
  const chosen = answers[questionIndex];
  const pct = Math.round(((questionIndex + (chosen == null ? 0 : 1)) / skill.questions.length) * 100);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#E82127] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-sm font-mono font-bold tabular-nums shrink-0 ${timeLeft < 60 ? 'text-red-400' : 'text-zinc-400'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="text-xs text-zinc-600 mb-6">
          {questionIndex + 1} / {skill.questions.length} — {skill.name}
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6 mb-4">
          <p className="text-base text-zinc-100 leading-relaxed font-medium">{q.text}</p>
        </div>

        <div className="space-y-3 mb-4">
          {q.options.map((opt, optIdx) => (
            <button
              key={opt}
              onClick={() => chosen == null && onAnswer(optIdx)}
              disabled={chosen != null}
              className={`w-full text-left p-4 border text-sm transition-all ${getOptionCls(optIdx, chosen, q.correct)}`}
            >
              <span className="font-medium text-zinc-500 mr-2">{String.fromCodePoint(65 + optIdx)}.</span>
              {opt}
            </button>
          ))}
        </div>

        {showExplanation && (
          <div className={`p-4 border mb-4 ${chosen === q.correct ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon
                name={chosen === q.correct ? 'check_circle' : 'cancel'}
                className={`text-lg ${chosen === q.correct ? 'text-emerald-400' : 'text-red-400'}`}
              />
              <span className={`text-sm font-semibold ${chosen === q.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                {chosen === q.correct ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{q.explanation}</p>
          </div>
        )}

        {chosen != null && (
          <button
            onClick={onNext}
            className="w-full bg-[#E82127] hover:bg-red-600 text-white font-semibold py-3 rounded-full transition-colors"
          >
            {questionIndex < skill.questions.length - 1 ? 'Next Question →' : 'See Results →'}
          </button>
        )}
      </div>
    </AppShell>
  );
}

interface ResultViewProps {
  readonly skill: Skill;
  readonly answers: (number | null)[];
  readonly score: number;
  readonly grade: ReturnType<typeof scoreToGrade>;
  readonly onRetake: () => void;
  readonly onBack: () => void;
}

function ResultView({ skill, answers, score, grade, onRetake, onBack }: ResultViewProps) {
  const correctCount = answers.filter((a, i) => a === skill.questions[i].correct).length;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className={`bg-gradient-to-br ${skill.gradient} border border-white/10 p-8 text-center`}>
          <div className="text-5xl font-black text-white mb-2">{score}%</div>
          <div className={`text-xl font-bold ${grade.color} mb-1`}>{grade.label}</div>
          <div className="text-sm text-zinc-400">{correctCount} / {skill.questions.length} correct</div>
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 text-sm font-semibold px-4 py-2 rounded-full border border-amber-400/20">
            <Icon name="stars" className="text-lg" />
            +{grade.xp} XP earned
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Review</h2>
          <div className="space-y-3">
            {skill.questions.map((q, i) => {
              const isCorrect = answers[i] === q.correct;
              const userAns = answers[i];
              return (
                <div key={q.id} className={`p-4 border ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex items-start gap-3">
                    <Icon
                      name={isCorrect ? 'check_circle' : 'cancel'}
                      className={`text-lg shrink-0 mt-0.5 ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-200 mb-1">{q.text}</p>
                      {!isCorrect && (
                        <>
                          <p className="text-xs text-red-400 mb-0.5">Your answer: {userAns == null ? 'Unanswered' : q.options[userAns]}</p>
                          <p className="text-xs text-emerald-400 mb-1">Correct: {q.options[q.correct]}</p>
                        </>
                      )}
                      <p className="text-xs text-zinc-500 leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRetake}
            className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 font-semibold py-3 transition-colors text-sm"
          >
            Retake Assessment
          </button>
          <button
            onClick={onBack}
            className="flex-1 bg-[#E82127] hover:bg-red-600 text-white font-semibold py-3 rounded-full transition-colors text-sm"
          >
            All Assessments
          </button>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SkillAssessmentPage() {
  const { fireXP } = useUser();

  const [state, setState] = useState<AssessmentState>('catalog');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const [bestScores, setBestScores] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('eyf.assessment.scores') ?? '{}'); }
    catch { return {}; }
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startAssessment = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    setQuestionIndex(0);
    setAnswers(new Array(skill.questions.length).fill(null));
    setTimeLeft(skill.timeLimitSeconds);
    setShowExplanation(false);
    setState('quiz');
  }, []);

  useEffect(() => {
    if (state !== 'quiz') { stopTimer(); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopTimer(); finishQuiz(); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const finishQuiz = useCallback(() => {
    stopTimer();
    setState('result');
  }, [stopTimer]);

  const handleAnswer = useCallback((optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
    setShowExplanation(true);
  }, [questionIndex]);

  const handleNext = useCallback(() => {
    if (!selectedSkill) return;
    if (questionIndex < selectedSkill.questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  }, [selectedSkill, questionIndex, finishQuiz]);

  // Compute results
  const computeScore = useCallback(() => {
    if (!selectedSkill) return 0;
    return calcScore(answers, selectedSkill.questions);
  }, [selectedSkill, answers]);

  const saveNewBestScore = useCallback((skillId: string, score: number) => {
    const prev = bestScores[skillId] ?? 0;
    if (score <= prev) return;
    const next = { ...bestScores, [skillId]: score };
    setBestScores(next);
    localStorage.setItem('eyf.assessment.scores', JSON.stringify(next));
  }, [bestScores]);

  useEffect(() => {
    if (state !== 'result' || !selectedSkill) return;
    const score = computeScore();
    const grade = scoreToGrade(score);
    saveNewBestScore(selectedSkill.id, score);
    fireXP(grade.xp, `${selectedSkill.name} Assessment: ${grade.label}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ── Catalog ──
  if (state === 'catalog') {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <PageHeader
            eyebrow="Knowledge Check"
            title="Skill Assessments."
            subtitle="10-question timed tests with instant feedback. Earn a grade badge and XP."
            accentColor="#4ade80"
            stats={[{ value: SKILLS.length, label: 'Assessments' }]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILLS.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                bestScore={bestScores[skill.id]}
                onStart={() => startAssessment(skill)}
              />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Quiz ──
  if (state === 'quiz' && selectedSkill) {
    return (
      <QuizView
        skill={selectedSkill}
        questionIndex={questionIndex}
        answers={answers}
        timeLeft={timeLeft}
        showExplanation={showExplanation}
        onAnswer={handleAnswer}
        onNext={handleNext}
      />
    );
  }

  // ── Result ──
  if (state === 'result' && selectedSkill) {
    const score = computeScore();
    const grade = scoreToGrade(score);
    return (
      <ResultView
        skill={selectedSkill}
        answers={answers}
        score={score}
        grade={grade}
        onRetake={() => startAssessment(selectedSkill)}
        onBack={() => setState('catalog')}
      />
    );
  }

  return null;
}
