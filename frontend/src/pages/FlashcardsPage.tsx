import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

type ConfidenceLevel = 'again' | 'hard' | 'good' | 'easy';

interface CardProgress {
  cardId: string;
  bucket: number; // SM-2-style bucket: 0=new, 1-5=review intervals
  nextReview: string; // ISO date
  confidence: ConfidenceLevel;
}

// ─── Deck definitions ─────────────────────────────────────────────────────────

const DECKS: { id: string; title: string; icon: string; color: string; bg: string; count: number }[] = [
  { id: 'os',            title: 'Operating Systems',    icon: 'terminal',           color: 'text-green-400',  bg: 'bg-green-500/10',  count: 12 },
  { id: 'dbms',          title: 'DBMS & SQL',            icon: 'storage',            color: 'text-blue-400',   bg: 'bg-blue-500/10',   count: 10 },
  { id: 'networks',      title: 'Computer Networks',     icon: 'hub',                color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   count: 9  },
  { id: 'dsa',           title: 'DSA Concepts',          icon: 'code',               color: 'text-purple-400', bg: 'bg-purple-500/10', count: 12 },
  { id: 'system-design', title: 'System Design',         icon: 'architecture',       color: 'text-orange-400', bg: 'bg-orange-500/10', count: 8  },
  { id: 'security',      title: 'Cybersecurity',         icon: 'shield',             color: 'text-red-400',    bg: 'bg-red-500/10',    count: 7  },
  { id: 'oop',           title: 'OOP & Design Patterns', icon: 'account_tree',       color: 'text-amber-400',  bg: 'bg-amber-500/10',  count: 7  },
  { id: 'behavioral',    title: 'Behavioral Interview',  icon: 'record_voice_over',  color: 'text-rose-400',   bg: 'bg-rose-500/10',   count: 10 },
  { id: 'patterns',      title: 'Algorithm Patterns',    icon: 'pattern',            color: 'text-indigo-400', bg: 'bg-indigo-500/10', count: 10 },
];

const ALL_CARDS: Flashcard[] = [
  // Operating Systems
  { id: 'os-1', front: 'What is a Process Control Block (PCB)?', back: 'A data structure maintained by the OS for each process. It stores: process ID, state, program counter, CPU registers, memory limits, I/O status, and accounting information. The OS uses the PCB to save/restore process state during context switches.', category: 'os', difficulty: 'easy', tags: ['processes', 'os'] },
  { id: 'os-2', front: 'What is the difference between a process and a thread?', back: 'A process is an independent program with its own memory space, PID, and resources. A thread is a lightweight unit of execution within a process that shares the process\'s memory and resources. Processes have higher isolation but higher overhead; threads are faster to create/switch but share state (requiring synchronization).', category: 'os', difficulty: 'easy', tags: ['processes', 'threads'] },
  { id: 'os-3', front: 'Explain Deadlock and its four necessary conditions.', back: 'Deadlock occurs when processes are permanently blocked waiting for resources held by each other.\n\nFour conditions (Coffman, 1971):\n1. Mutual Exclusion — resource used by one process at a time\n2. Hold and Wait — process holds resources while waiting for more\n3. No Preemption — resources only released voluntarily\n4. Circular Wait — chain of processes each waiting for the next', category: 'os', difficulty: 'medium', tags: ['deadlock', 'concurrency'] },
  { id: 'os-4', front: 'What is virtual memory and how does paging work?', back: 'Virtual memory abstracts physical RAM by using disk as an extension. Each process gets a virtual address space divided into fixed-size pages. The OS maps virtual pages to physical frames via a page table.\n\nPage fault: when a process accesses a page not in RAM, the OS loads it from disk (swap). Replacement algorithms: LRU, FIFO, Optimal.', category: 'os', difficulty: 'medium', tags: ['memory', 'paging'] },
  { id: 'os-5', front: 'What is the difference between mutex and semaphore?', back: 'Mutex (mutual exclusion): binary lock owned by a thread. Only the owner can release it. Used for critical section protection.\n\nSemaphore: counter-based synchronization. Can be > 1 (counting semaphore). Any thread can signal (release). Used for resource counting and producer-consumer problems.\n\nKey: mutex has ownership, semaphore does not.', category: 'os', difficulty: 'medium', tags: ['synchronization', 'concurrency'] },
  { id: 'os-6', front: 'Explain the Round Robin scheduling algorithm.', back: 'Preemptive scheduling where each process gets a fixed time quantum (e.g., 4ms). When the quantum expires, the process is preempted and placed at the back of the ready queue.\n\nPros: fair, good response time\nCons: high context-switch overhead if quantum is too small\nOptimal quantum: typically 10-100ms in practice', category: 'os', difficulty: 'easy', tags: ['scheduling'] },
  { id: 'os-7', front: 'What is thrashing in virtual memory?', back: 'Thrashing occurs when a process spends more time swapping pages in/out than executing. Caused by insufficient physical memory relative to the process\'s working set size.\n\nSolution: working set model — only keep pages that a process has accessed in the last Δ time window. If the sum of working sets exceeds available frames, suspend some processes.', category: 'os', difficulty: 'hard', tags: ['memory', 'virtual memory'] },

  // DBMS
  { id: 'db-1', front: 'What are the ACID properties of transactions?', back: 'Atomicity — transaction executes completely or not at all (rollback on failure)\nConsistency — DB moves from one valid state to another (constraints hold)\nIsolation — concurrent transactions appear to execute serially\nDurability — committed transactions survive crashes (WAL, redo logs)\n\nViolating ACID can cause dirty reads, lost updates, phantom reads.', category: 'dbms', difficulty: 'easy', tags: ['transactions', 'acid'] },
  { id: 'db-2', front: 'Explain database normalization — 1NF, 2NF, 3NF.', back: '1NF: Atomic values, no repeating groups, unique rows\n2NF: 1NF + no partial dependencies (non-key attributes depend on entire PK)\n3NF: 2NF + no transitive dependencies (non-key → non-key)\nBCNF: every determinant X→Y means X is a superkey\n\nDenormalization trades redundancy for read performance.', category: 'dbms', difficulty: 'medium', tags: ['normalization', 'schema'] },
  { id: 'db-3', front: 'What is an index and how does a B-tree index work?', back: 'An index is a data structure that speeds up queries at the cost of storage and write overhead.\n\nB-tree index: balanced tree where each node can have many children (branching factor ~100-1000). Leaf nodes store sorted key-value pairs. All leaves connected in a linked list for range scans.\n\nO(log n) point lookups, O(log n + k) range scans. Used by: PostgreSQL, MySQL for most indexes.', category: 'dbms', difficulty: 'medium', tags: ['indexes', 'btree'] },
  { id: 'db-4', front: 'What is the difference between INNER, LEFT, and FULL OUTER JOIN?', back: 'INNER JOIN — only matching rows from both tables\nLEFT JOIN — all rows from left + matching rows from right (NULLs for unmatched right)\nRIGHT JOIN — all rows from right + matching rows from left\nFULL OUTER JOIN — all rows from both, NULLs where no match\nCROSS JOIN — Cartesian product (every combination)\n\nTip: INNER JOIN is fastest; use LEFT JOIN to find unmatched records.', category: 'dbms', difficulty: 'easy', tags: ['sql', 'joins'] },
  { id: 'db-5', front: 'What is a transaction isolation level? Name the four levels.', back: 'Isolation levels define how/when changes made by one transaction are visible to others:\n\n1. READ UNCOMMITTED — dirty reads possible (fastest, lowest isolation)\n2. READ COMMITTED — no dirty reads, but non-repeatable reads possible\n3. REPEATABLE READ — same row returns same value in a transaction\n4. SERIALIZABLE — complete isolation, transactions appear sequential (slowest)\n\nPostgreSQL default: READ COMMITTED. MySQL (InnoDB): REPEATABLE READ.', category: 'dbms', difficulty: 'hard', tags: ['transactions', 'isolation'] },

  // Networks
  { id: 'net-1', front: 'What happens when you type google.com in a browser?', back: '1. DNS resolution: browser → OS cache → DNS resolver → root → TLD → authoritative NS → IP\n2. TCP handshake: SYN → SYN-ACK → ACK\n3. TLS handshake: ClientHello, ServerHello, certificate, key exchange, Finished\n4. HTTP GET / — server processes, returns HTML\n5. Browser parses HTML, discovers CSS/JS/images, fires more requests\n6. Render tree constructed, layout computed, pixels painted', category: 'networks', difficulty: 'medium', tags: ['http', 'dns', 'tcp'] },
  { id: 'net-2', front: 'Explain the TCP three-way handshake.', back: 'Used to establish a reliable connection:\n1. SYN — client sends segment with SYN flag, random ISN (Initial Sequence Number)\n2. SYN-ACK — server responds with its own ISN, ACKs client\'s SYN\n3. ACK — client acknowledges server\'s SYN\n\nConnection now established. Both sides have agreed on sequence numbers.\nTCP teardown uses 4-way FIN/ACK exchange.', category: 'networks', difficulty: 'easy', tags: ['tcp', 'handshake'] },
  { id: 'net-3', front: 'What is the difference between TCP and UDP?', back: 'TCP (Transmission Control Protocol):\n+ Reliable, ordered delivery with retransmission\n+ Flow control (window size) + congestion control\n- Higher overhead (connection setup, headers, state)\n- Use: HTTP, SSH, databases, file transfer\n\nUDP (User Datagram Protocol):\n+ Low latency, no connection setup\n+ Application controls reliability\n- No guaranteed delivery or ordering\n- Use: DNS, video streaming, gaming, VoIP', category: 'networks', difficulty: 'easy', tags: ['tcp', 'udp'] },
  { id: 'net-4', front: 'What is HTTP/2 and how is it different from HTTP/1.1?', back: 'HTTP/1.1 limitations: head-of-line blocking (one request per TCP connection), plaintext headers (large size).\n\nHTTP/2 improvements:\n• Multiplexing: multiple concurrent requests over one TCP connection\n• Header compression (HPACK): reduces overhead significantly\n• Server push: proactively sends resources before client asks\n• Binary framing: more efficient parsing than text\n\nHTTP/3 uses QUIC (UDP-based) for even lower latency.', category: 'networks', difficulty: 'medium', tags: ['http', 'http2'] },

  // DSA
  { id: 'dsa-1', front: 'What is the time complexity of HashMap operations?', back: 'Average case:\n• Lookup (get): O(1)\n• Insert (put): O(1)\n• Delete: O(1)\n\nWorst case: O(n) — when all keys hash to the same bucket (all collisions).\n\nCollision handling:\n• Chaining: each bucket is a linked list\n• Open addressing: probe for next empty slot (linear, quadratic, double hashing)\n\nLoad factor (Java): resize at 0.75 — rehashing is O(n).', category: 'dsa', difficulty: 'easy', tags: ['hashmap', 'complexity'] },
  { id: 'dsa-2', front: 'What is the difference between BFS and DFS? When to use each?', back: 'BFS (Breadth-First Search):\n• Uses a queue, explores level by level\n• Guaranteed shortest path in unweighted graphs\n• Space: O(w) where w = max width\n• Use: shortest path, level-order traversal, bipartite check\n\nDFS (Depth-First Search):\n• Uses a stack (or recursion), explores deep first\n• Better for topological sort, connected components, cycle detection\n• Space: O(h) where h = max depth\n• Use: detecting cycles, finding paths, island counting', category: 'dsa', difficulty: 'easy', tags: ['bfs', 'dfs', 'graphs'] },
  { id: 'dsa-3', front: 'Explain Dynamic Programming. What are memoization and tabulation?', back: 'DP solves problems by breaking them into overlapping subproblems and storing results.\n\nMemoization (top-down):\n• Recursive approach + cache (usually hash map)\n• Only computes needed subproblems\n• More intuitive, may have call stack overhead\n\nTabulation (bottom-up):\n• Iterative, fills dp array from base cases up\n• No call stack, usually faster in practice\n• Requires knowing the order to fill\n\nRecognize DP: overlapping subproblems + optimal substructure', category: 'dsa', difficulty: 'medium', tags: ['dp', 'memoization'] },
  { id: 'dsa-4', front: 'What is a Binary Search Tree? What are its time complexities?', back: 'BST: each node satisfies left < node ≤ right. Enables O(log n) operations on balanced trees.\n\nOperations (balanced BST):\n• Search: O(log n)\n• Insert: O(log n)\n• Delete: O(log n)\n• In-order traversal: O(n) → produces sorted output\n\nWorst case (unbalanced, e.g., sorted insertion): O(n)\n\nSelf-balancing BSTs: AVL Tree (strict balance), Red-Black Tree (relaxed balance, used in std::map, TreeMap)', category: 'dsa', difficulty: 'medium', tags: ['trees', 'bst'] },
  { id: 'dsa-5', front: 'What is a Heap? How is it different from a BST?', back: 'Heap: complete binary tree where parent is always ≥ (max-heap) or ≤ (min-heap) children.\n\nKey operations:\n• Peek (min/max): O(1)\n• Insert: O(log n) — bubble up\n• Extract min/max: O(log n) — heapify down\n• Build heap: O(n)\n\nVs BST:\n• Heap: fast min/max extraction, no ordered traversal\n• BST: ordered traversal, efficient range queries\n\nUse heaps for: priority queues, scheduling, Dijkstra, top-K problems', category: 'dsa', difficulty: 'medium', tags: ['heap', 'priority-queue'] },
  { id: 'dsa-6', front: 'Explain the Two Pointers pattern with an example.', back: 'Two pointers: use two indices that move through an array, typically from both ends toward the middle (or in same direction).\n\nExample — Valid Palindrome:\n```\nlet left = 0, right = s.length - 1;\nwhile (left < right) {\n  if (s[left] !== s[right]) return false;\n  left++; right--;\n}\nreturn true;\n```\n\nOther uses:\n• Pair with target sum (sorted): O(n)\n• Remove duplicates in-place: O(n)\n• Container with most water: O(n)\n\nKey trigger: "sorted array", "palindrome", "remove in-place"', category: 'dsa', difficulty: 'easy', tags: ['two-pointers', 'pattern'] },

  // System Design
  { id: 'sd-1', front: 'What is the CAP theorem?', back: 'A distributed system can guarantee at most 2 of 3 properties:\n\nC — Consistency: every read receives the most recent write\nA — Availability: every request gets a response (may not be latest)\nP — Partition Tolerance: system works despite network partitions\n\nSince network partitions always happen, you choose CP or AP:\n• CP: HBase, Zookeeper (returns error rather than stale data)\n• AP: Cassandra, DynamoDB (returns possibly stale data)\n\nSQL dbs are often CA (single node) — they don\'t consider partitions.', category: 'system-design', difficulty: 'medium', tags: ['distributed', 'cap'] },
  { id: 'sd-2', front: 'What is consistent hashing and why is it used?', back: 'Consistent hashing maps both servers and keys to a ring (0 to 2^32). A key maps to the first server clockwise on the ring.\n\nBenefit: When a server is added/removed, only K/N keys need to be remapped (where K = total keys, N = nodes) — vs traditional hashing where O(K) keys move.\n\nVirtual nodes: assign each server multiple positions on the ring to balance load.\n\nUsed by: DynamoDB, Cassandra, CDNs, distributed caches.', category: 'system-design', difficulty: 'hard', tags: ['distributed', 'hashing'] },
  { id: 'sd-3', front: 'What are the trade-offs between SQL and NoSQL databases?', back: 'SQL (Relational): PostgreSQL, MySQL\n+ ACID transactions, complex joins, strong schema, mature tooling\n- Harder to scale horizontally, schema changes painful\n+ Use for: financial data, inventory, anything needing joins\n\nNoSQL types:\n• Document (MongoDB): flexible schema, JSON-like, good for catalogs\n• Key-Value (Redis, DynamoDB): O(1) lookups, simple data\n• Column-family (Cassandra): high write throughput, time-series\n• Graph (Neo4j): complex relationships\n\nDefault: start with SQL. Switch to NoSQL when you hit specific scale problems.', category: 'system-design', difficulty: 'medium', tags: ['databases', 'sql', 'nosql'] },

  // Security
  { id: 'sec-1', front: 'What is SQL Injection and how do you prevent it?', back: 'SQL Injection: attacker inserts SQL code into user input that gets executed by the database.\n\nExample vulnerable query:\n```sql\nSELECT * FROM users WHERE username = \'' + input + '\'\n```\nInput: \' OR \'1\'=\'1 → logs in as anyone\n\nPrevention:\n1. Parameterized queries (prepared statements) — MOST IMPORTANT\n2. ORMs (SQLAlchemy, Prisma) use parameterization by default\n3. Input validation (whitelist allowed characters)\n4. Least privilege DB user (no DROP, no admin)\n5. WAF for extra layer', category: 'security', difficulty: 'easy', tags: ['owasp', 'injection'] },
  { id: 'sec-2', front: 'Explain XSS (Cross-Site Scripting). What are the three types?', back: 'XSS: attacker injects malicious JavaScript that runs in a victim\'s browser.\n\nTypes:\n1. Stored XSS: malicious script saved in DB (e.g., blog comment) — affects all viewers\n2. Reflected XSS: script in URL parameter, reflected in response — requires tricking user to click\n3. DOM-based XSS: script injected via client-side JS (document.write, innerHTML)\n\nPrevention:\n• Escape output (HTML entity encoding)\n• Content Security Policy header\n• Use textContent instead of innerHTML\n• HttpOnly cookies (JS can\'t read them)', category: 'security', difficulty: 'medium', tags: ['xss', 'web-security'] },
  { id: 'sec-3', front: 'What is CSRF and how do CSRF tokens prevent it?', back: 'CSRF (Cross-Site Request Forgery): attacker tricks a user\'s browser into making unintended requests to a site where they\'re authenticated.\n\nExample: <img src="bank.com/transfer?to=attacker&amount=1000">\nVictim\'s browser sends cookies automatically → authenticated request!\n\nPrevention:\n1. CSRF token: server includes a unique random token in every form; validates it on submit\n2. SameSite=Strict cookie: browser won\'t send cookies on cross-site requests\n3. Check Origin/Referer headers\n4. Double-submit cookie pattern\n\nDifference from XSS: CSRF uses victim\'s identity. XSS steals victim\'s data.', category: 'security', difficulty: 'medium', tags: ['csrf', 'web-security'] },

  // OOP
  { id: 'oop-1', front: 'What are the four pillars of OOP?', back: 'Encapsulation: bundle data + methods together, hide implementation (private fields, public interface). Prevents external code from depending on internal state.\n\nInheritance: class inherits behavior from parent. Promotes reuse but creates coupling. Prefer composition over inheritance.\n\nPolymorphism: same interface, different implementations. Method overriding (runtime) + overloading (compile-time).\n\nAbstraction: expose only what\'s necessary. Abstract classes and interfaces define contracts without implementations.', category: 'oop', difficulty: 'easy', tags: ['oop', 'fundamentals'] },
  { id: 'oop-2', front: 'What is the SOLID principle? Name all 5.', back: 'S — Single Responsibility: class has one reason to change\nO — Open/Closed: open for extension, closed for modification (use polymorphism)\nL — Liskov Substitution: subclasses can replace parent class without breaking behavior\nI — Interface Segregation: split large interfaces into smaller specific ones\nD — Dependency Inversion: depend on abstractions, not concretions (inject dependencies)\n\nMemory trick: SOLID makes code maintainable, extensible, and testable.', category: 'oop', difficulty: 'medium', tags: ['oop', 'solid'] },
  { id: 'oop-3', front: 'When would you use an Abstract Class vs an Interface?', back: 'Abstract Class:\n• When related classes share code (base implementation)\n• Single inheritance only (Java/C#)\n• Can have state (fields), constructor, concrete methods\n• Use: template method pattern, common base behavior\n\nInterface:\n• Contract that unrelated classes can implement\n• Multiple interfaces per class\n• All methods abstract (before Java 8 / default methods)\n• Use: strategy, observer, dependency injection\n\nRule of thumb: IS-A → abstract class. CAN-DO → interface', category: 'oop', difficulty: 'medium', tags: ['oop', 'abstract', 'interface'] },
  { id: 'oop-4', front: 'What is the Singleton pattern and what are its drawbacks?', back: 'Singleton ensures a class has exactly one instance with global access.\n\nImplementation: private constructor + static getInstance() with lazy initialization + thread-safe double-checked locking.\n\nDrawbacks:\n• Difficult to unit test (hard to mock/replace)\n• Global state hides dependencies\n• Violates Single Responsibility (manages own lifecycle)\n• Problems in multi-threaded environments without synchronization\n• Better alternative: Dependency Injection (inject shared instances)', category: 'oop', difficulty: 'medium', tags: ['patterns', 'singleton'] },
  { id: 'oop-5', front: 'Explain Composition over Inheritance.', back: 'Inheritance creates tight coupling: child depends on parent\'s implementation, changes propagate down, difficult to change hierarchy.\n\nComposition: classes contain instances of other classes (HAS-A vs IS-A).\n\nExample:\n// Bad: TurboEngine extends Engine\n// Good: Car has Engine (injected)\n\nBenefits:\n• More flexible — swap behavior at runtime\n• Easier to test (inject mocks)\n• Avoids fragile base class problem\n• Supports Open/Closed Principle\n\nGoF: "Favor object composition over class inheritance"', category: 'oop', difficulty: 'medium', tags: ['oop', 'design', 'composition'] },
  { id: 'oop-6', front: 'What is method overriding vs method overloading?', back: 'Overriding (Runtime Polymorphism):\n• Subclass provides different implementation of a parent method\n• Same name, same signature\n• Resolved at runtime via virtual dispatch\n• @Override annotation (Java)\n\nOverloading (Compile-time Polymorphism):\n• Same class, same method name, different parameters\n• Resolved at compile time by signature matching\n• Return type alone cannot distinguish overloads\n\nExample overloading: print(int), print(String), print(int, String)\nExample overriding: Animal.speak() → Dog.speak() returns "Woof"', category: 'oop', difficulty: 'easy', tags: ['oop', 'polymorphism'] },
  { id: 'oop-7', front: 'What is the Observer pattern and where is it used?', back: 'Observer defines a one-to-many dependency: when one object (Subject) changes state, all dependents (Observers) are notified automatically.\n\nComponents:\n• Subject: maintains list of observers, notifies on state change\n• Observer: interface with update() method\n• ConcreteObserver: reacts to state change\n\nReal-world usage:\n• EventEmitter in Node.js\n• React state/props propagation\n• Redux store subscription\n• DOM addEventListener\n• WebSocket message handlers\n• RxJS Observable streams', category: 'oop', difficulty: 'medium', tags: ['patterns', 'observer'] },

  // Additional OS cards
  { id: 'os-8', front: 'What is a context switch and what does it involve?', back: 'Context switch: OS saves current process state and restores another process state.\n\nSaved in PCB:\n• Program counter (next instruction)\n• CPU registers\n• Process state (running → ready)\n• Memory mappings (if necessary)\n\nCost: pure overhead — no useful work done\nTypical duration: 1-10 microseconds\n\nReducing context switches:\n• Larger time quantum (round robin)\n• Thread pools (threads lighter than processes)\n• Coroutines / async (no kernel involvement)\n• CPU pinning for cache locality', category: 'os', difficulty: 'medium', tags: ['processes', 'scheduling'] },
  { id: 'os-9', front: 'What is the difference between preemptive and non-preemptive scheduling?', back: 'Non-preemptive (cooperative):\n• Process runs until it voluntarily yields CPU (I/O wait, exits, or calls yield)\n• Simple, no context switch overhead\n• Risk: one greedy process starves others\n• Examples: FCFS, SJF (non-preemptive)\n\nPreemptive:\n• OS can forcibly remove a process from CPU after its time quantum\n• Better responsiveness, fair sharing\n• Risk: race conditions if process interrupted mid-operation (need synchronization)\n• Examples: Round Robin, SRTF, Priority Preemptive\n\nModern OSes are preemptive.', category: 'os', difficulty: 'medium', tags: ['scheduling', 'preemptive'] },
  { id: 'os-10', front: 'What is a race condition? Give an example.', back: 'Race condition: outcome depends on the non-deterministic ordering of concurrent operations.\n\nExample — bank balance:\n```\nThread A reads balance: 100\nThread B reads balance: 100\nThread A: balance = 100 + 50 = 150, writes\nThread B: balance = 100 + 30 = 130, writes (overwrites A!)\n// Balance should be 180, but is 130\n```\n\nSolutions:\n• Mutex / lock around critical section\n• Atomic operations (hardware-level)\n• Immutable data (no shared mutable state)\n• Message passing (Erlang, Go channels)', category: 'os', difficulty: 'medium', tags: ['concurrency', 'race-condition'] },
  { id: 'os-11', front: 'Explain the difference between hard and soft real-time systems.', back: 'Hard real-time:\n• Missing a deadline = catastrophic failure\n• Must guarantee response within bounded time\n• Examples: anti-lock brakes, pacemakers, aircraft control\n• Uses preemptive priority scheduling, no virtual memory, WCET analysis\n\nSoft real-time:\n• Missing a deadline = degraded quality, not catastrophe\n• Best-effort timeliness\n• Examples: video streaming, online gaming, audio playback\n• Uses priority scheduling, may tolerate occasional missed frames\n\nKey: hard requires formal verification; soft requires statistical guarantees', category: 'os', difficulty: 'hard', tags: ['real-time', 'scheduling'] },
  { id: 'os-12', front: 'What is the difference between internal and external fragmentation?', back: 'Internal fragmentation:\n• Wasted space INSIDE an allocated block\n• Occurs when allocated memory > requested (due to fixed block sizes / alignment)\n• Example: requesting 5 bytes, allocated 8 bytes → 3 bytes wasted inside\n• Solution: buddy system, slab allocator\n\nExternal fragmentation:\n• Wasted space OUTSIDE allocated blocks (between them)\n• Total free memory is sufficient but scattered in small non-contiguous chunks\n• Example: 100MB free but no contiguous 50MB block\n• Solutions: compaction (expensive), segmentation, paging (eliminates it)', category: 'os', difficulty: 'medium', tags: ['memory', 'fragmentation'] },

  // Additional DBMS cards
  { id: 'db-6', front: 'What is the difference between WHERE and HAVING?', back: 'WHERE: filters rows BEFORE aggregation. Cannot use aggregate functions.\nHAVING: filters groups AFTER GROUP BY aggregation.\n\nExample:\n```sql\nSELECT department, COUNT(*) as emp_count\nFROM employees\nWHERE salary > 50000          -- filter individual rows first\nGROUP BY department\nHAVING COUNT(*) > 5;           -- then filter groups\n```\n\nMemory trick:\nWHERE filters rows → HAVING filters groups\nHAVING requires GROUP BY (or aggregate in SELECT)', category: 'dbms', difficulty: 'easy', tags: ['sql', 'aggregation'] },
  { id: 'db-7', front: 'What are window functions in SQL?', back: 'Window functions compute a value for each row relative to a "window" (partition) of rows, without collapsing rows like GROUP BY.\n\nSyntax: FUNCTION() OVER (PARTITION BY col ORDER BY col)\n\nCommon functions:\n• ROW_NUMBER(): unique sequential number per window\n• RANK(): rank with gaps for ties\n• DENSE_RANK(): rank without gaps\n• LAG(col, n) / LEAD(col, n): access previous/next row\n• SUM/AVG/COUNT OVER (): running totals\n\nExample — running total:\n```sql\nSELECT name, salary,\n  SUM(salary) OVER (ORDER BY hire_date) as running_total\nFROM employees;\n```', category: 'dbms', difficulty: 'hard', tags: ['sql', 'window-functions'] },
  { id: 'db-8', front: 'What is database sharding and when do you use it?', back: 'Sharding: horizontal partitioning — splitting data across multiple database instances (shards) by a shard key.\n\nStrategies:\n• Range-based: shard by ID range (0-1M → shard 1, 1M-2M → shard 2)\n• Hash-based: shard = hash(key) % num_shards\n• Directory-based: lookup table maps keys to shards\n\nProblems sharding solves:\n• Write throughput beyond single node capacity\n• Storage exceeding single node capacity\n\nSharding challenges:\n• Cross-shard queries (joins, transactions)\n• Rebalancing when adding shards\n• Hot shard problem with uneven distribution\n\nUse sharding only when replication + read replicas are insufficient.', category: 'dbms', difficulty: 'hard', tags: ['scaling', 'sharding'] },
  { id: 'db-9', front: 'Explain the difference between optimistic and pessimistic locking.', back: 'Pessimistic locking:\n• Lock the record before reading/writing\n• Other transactions wait (SELECT ... FOR UPDATE)\n• Good when conflicts are frequent\n• Risk: deadlocks, low concurrency\n\nOptimistic locking:\n• No lock on read. Include a version/timestamp column.\n• On update: check version hasn\'t changed; if it has, retry\n```sql\nUPDATE items SET qty = qty - 1, version = version + 1\nWHERE id = 1 AND version = 42;\n```\n• Good when conflicts are rare (read-heavy workloads)\n• No deadlock risk, higher concurrency\n\nModern ORMs (Hibernate, Prisma) support optimistic locking via @Version fields.', category: 'dbms', difficulty: 'hard', tags: ['transactions', 'concurrency', 'locking'] },
  { id: 'db-10', front: 'What is an execution plan and how do you use EXPLAIN?', back: 'Execution plan: the sequence of operations the query optimizer chose to execute a query.\n\nIn PostgreSQL:\n```sql\nEXPLAIN ANALYZE SELECT * FROM users WHERE email = \'x@y.com\';\n```\n\nKey nodes to understand:\n• Seq Scan: full table scan (O(n)) — bad for large tables\n• Index Scan: uses B-tree index (O(log n))\n• Bitmap Index Scan: for range or IN queries\n• Hash Join / Nested Loop / Merge Join: join strategies\n\nTune by:\n• Adding missing indexes (on WHERE/JOIN/ORDER BY columns)\n• Rewriting queries (avoid SELECT *, avoid functions on indexed cols)\n• Updating statistics (ANALYZE)', category: 'dbms', difficulty: 'hard', tags: ['performance', 'sql', 'indexing'] },

  // Additional Networks cards
  { id: 'net-5', front: 'What is TLS and how does the TLS handshake work?', back: 'TLS (Transport Layer Security) provides encryption, authentication, and integrity over TCP.\n\nTLS 1.3 handshake (simplified):\n1. ClientHello: supported TLS version, cipher suites, random\n2. ServerHello: chosen cipher, certificate, random, key_share\n3. Server sends Certificate + CertificateVerify (signed with private key)\n4. Client validates cert against CA, derives session keys\n5. Finished: both sides send HMAC to confirm handshake integrity\n\nKey concepts:\n• Asymmetric crypto for key exchange (ECDH)\n• Symmetric crypto for data (AES-GCM)\n• Certificate Chain → Root CA trust\n• Forward secrecy: session keys not derivable from long-term keys', category: 'networks', difficulty: 'hard', tags: ['tls', 'security', 'encryption'] },
  { id: 'net-6', front: 'What is a CDN and how does it improve performance?', back: 'CDN (Content Delivery Network): distributed network of edge servers that cache static content closer to users.\n\nHow it works:\n1. User requests cdn.example.com/image.jpg\n2. DNS returns IP of nearest edge server (via anycast/GeoDNS)\n3. Edge serves cached content (if cache hit)\n4. Cache miss: edge fetches from origin, caches with TTL\n\nPerformance gains:\n• Reduced latency (edge server 10ms away vs origin 200ms)\n• Reduced origin load (cache offloads traffic)\n• DDoS absorption at edge\n• HTTP/2 push, Brotli compression\n\nExamples: Cloudflare, AWS CloudFront, Fastly, Akamai', category: 'networks', difficulty: 'medium', tags: ['cdn', 'performance', 'caching'] },
  { id: 'net-7', front: 'What is the OSI model? Name the 7 layers.', back: 'The OSI model organizes network communication into 7 layers:\n\n7. Application — HTTP, FTP, SMTP, DNS\n6. Presentation — TLS/SSL, encryption, compression\n5. Session — session establishment (rarely explicit in TCP/IP)\n4. Transport — TCP, UDP; ports, reliability, flow control\n3. Network — IP; routing, addressing\n2. Data Link — Ethernet, WiFi; MAC addresses, frame delivery\n1. Physical — bits, cables, signals\n\nMemory: "All People Seem To Need Data Processing" (top-down)\nOr: "Please Do Not Throw Sausage Pizza Away" (bottom-up)\n\nTCP/IP model collapses to 4: Application, Transport, Internet, Link', category: 'networks', difficulty: 'easy', tags: ['osi', 'networking-fundamentals'] },
  { id: 'net-8', front: 'What is a load balancer? What are common load balancing algorithms?', back: 'Load balancer: distributes incoming traffic across multiple backend servers.\n\nAlgorithms:\n• Round Robin: requests go to servers in rotation (simple, ignores load)\n• Least Connections: route to server with fewest active connections\n• Weighted Round Robin: servers get proportional traffic by weight\n• IP Hash: client IP determines server (session sticky)\n• Random: random server selection\n• Least Response Time: route to fastest-responding server\n\nLayer 4 LB: routes based on TCP/IP info (fast, no content inspection)\nLayer 7 LB: routes based on HTTP content (URL, headers, cookies) — enables content-based routing\n\nExamples: Nginx, HAProxy, AWS ALB/NLB, Cloudflare', category: 'networks', difficulty: 'medium', tags: ['load-balancer', 'system-design'] },
  { id: 'net-9', front: 'What is the difference between REST and gRPC?', back: 'REST:\n• HTTP/1.1, text-based (JSON/XML)\n• Stateless, resource-oriented\n• Easy browser consumption, great tooling\n• Overhead: verbose JSON, HTTP headers\n• Use: public APIs, browser clients\n\ngRPC:\n• HTTP/2, binary protocol (Protocol Buffers)\n• Strongly typed with .proto schema\n• ~5-7x smaller payload, faster serialization\n• Supports streaming (unary, server-stream, client-stream, bidirectional)\n• Less human-readable, harder to debug\n• Use: internal microservices, latency-sensitive calls, streaming\n\nGraphQL: flexible queries, avoids over/under-fetching, good for complex frontends', category: 'networks', difficulty: 'medium', tags: ['rest', 'grpc', 'api'] },

  // Additional DSA cards
  { id: 'dsa-7', front: 'What is the Sliding Window pattern? Give an example.', back: 'Sliding window: maintain a window of elements, expand/shrink it to find optimal subarray/substring.\n\nFixed window (e.g., max sum subarray of size k):\n```\nInitialize sum with first k elements\nFor each new element: add it, subtract leftmost, track max\nO(n) time, O(1) space\n```\n\nVariable window (e.g., longest substring without repeats):\n```\nUse two pointers left/right + a set\nExpand right; if duplicate, shrink from left\nTrack max window size\n```\n\nKey trigger: "subarray", "substring", "contiguous", "window size k"', category: 'dsa', difficulty: 'medium', tags: ['sliding-window', 'pattern'] },
  { id: 'dsa-8', front: 'Explain the Fast & Slow Pointer (Floyd\'s Cycle) pattern.', back: 'Two pointers at different speeds detect cycles in linked lists or arrays.\n\nCycle detection:\n```\nslow = head; fast = head;\nwhile (fast && fast.next) {\n  slow = slow.next;\n  fast = fast.next.next;\n  if (slow === fast) return true; // cycle!\n}\nreturn false;\n```\n\nFinding cycle start: after detection, move one pointer to head; advance both one step — they meet at cycle start.\n\nFinding middle of linked list: when fast reaches end, slow is at middle.\n\nKey trigger: "linked list cycle", "find middle", "happy number", "palindrome linked list"', category: 'dsa', difficulty: 'medium', tags: ['two-pointers', 'linked-list', 'pattern'] },
  { id: 'dsa-9', front: 'What is a Trie (Prefix Tree)? When do you use it?', back: 'Trie: tree where each node represents a character. Paths from root to leaf spell out strings.\n\nOperations:\n• Insert: O(L) where L = word length\n• Search: O(L)\n• StartsWith (prefix check): O(P) where P = prefix length\n\nVs HashMap:\n• Trie: O(L) lookups, memory-efficient for shared prefixes\n• HashMap: O(1) avg lookups, simpler\n\nUse cases:\n• Autocomplete / search suggestions\n• Spell checker\n• IP routing tables\n• Word games (Boggle, crossword)\n\nLeetCode: Word Search II, Implement Trie, Design Search Autocomplete', category: 'dsa', difficulty: 'medium', tags: ['trie', 'strings', 'data-structures'] },
  { id: 'dsa-10', front: 'What is the Merge Intervals pattern?', back: 'Merge overlapping intervals by sorting then scanning:\n\n```typescript\nfunction merge(intervals: number[][]): number[][] {\n  intervals.sort((a, b) => a[0] - b[0]);\n  const result: number[][] = [intervals[0]];\n  for (const [start, end] of intervals.slice(1)) {\n    const last = result[result.length - 1];\n    if (start <= last[1]) last[1] = Math.max(last[1], end);\n    else result.push([start, end]);\n  }\n  return result;\n}\n```\nTime: O(n log n), Space: O(n)\n\nRelated patterns:\n• Insert interval\n• Meeting rooms (detect overlap)\n• Employee free time\n\nKey trigger: "overlapping intervals", "meeting times", "schedule"', category: 'dsa', difficulty: 'medium', tags: ['intervals', 'sorting', 'pattern'] },
  { id: 'dsa-11', front: 'What is Dijkstra\'s algorithm and when does it fail?', back: 'Dijkstra\'s: finds shortest path from source to all nodes in a weighted graph.\n\nApproach:\n• Priority queue (min-heap) ordered by distance\n• Relax edges: if dist[u] + w(u,v) < dist[v], update dist[v]\n• Time: O((V + E) log V) with binary heap\n\nWhen it FAILS:\n• Negative weight edges (use Bellman-Ford instead)\n• Negative weight cycles (no solution exists)\n\nBellman-Ford: O(VE) — handles negative weights, detects negative cycles\nFloyd-Warshall: O(V³) — all-pairs shortest path\n\nKey trigger: "shortest path", "minimum cost", "cheapest flights"', category: 'dsa', difficulty: 'hard', tags: ['graphs', 'shortest-path', 'dijkstra'] },
  { id: 'dsa-12', front: 'What is topological sort and when do you use it?', back: 'Topological sort: linear ordering of nodes in a DAG such that for every edge u→v, u appears before v.\n\nKahn\'s Algorithm (BFS-based):\n1. Compute in-degree for all nodes\n2. Queue all nodes with in-degree 0\n3. Dequeue, add to result, decrement neighbors\' in-degree\n4. If neighbor\'s in-degree = 0, enqueue\nIf result.length < numNodes → cycle detected!\n\nDFS-based: do DFS, push to stack on finish; stack is topological order.\n\nUse cases:\n• Build systems (compile order)\n• Course prerequisites (LeetCode 207, 210)\n• Task scheduling with dependencies', category: 'dsa', difficulty: 'hard', tags: ['graphs', 'topological-sort', 'dag'] },

  // Additional System Design cards
  { id: 'sd-4', front: 'What is a message queue and why use it?', back: 'Message queue: async communication between services via a persistent queue.\n\nBenefits:\n• Decoupling: producer/consumer don\'t need to be up simultaneously\n• Load leveling: queue absorbs traffic spikes\n• Guaranteed delivery: messages persist until consumed\n• Retry logic: failed processing → re-queue\n\nPatterns:\n• Point-to-point: one producer → one consumer (task queue)\n• Pub/Sub: one producer → multiple consumer groups (event bus)\n\nWhen to use:\n• Email/notification sending (async, retryable)\n• Image processing pipeline\n• Order processing, payment events\n• Microservice event bus\n\nTools: RabbitMQ, Apache Kafka, AWS SQS/SNS, Google Pub/Sub', category: 'system-design', difficulty: 'medium', tags: ['messaging', 'async', 'kafka'] },
  { id: 'sd-5', front: 'What is rate limiting? Name common algorithms.', back: 'Rate limiting: control the rate of requests a client can make to protect services.\n\nAlgorithms:\n• Token Bucket: tokens refill at fixed rate; burst allowed up to bucket size (smooth with burst)\n• Leaky Bucket: requests drain at fixed rate; burst goes into queue; deterministic output\n• Fixed Window Counter: count requests per window (e.g., 100/min). Problem: burst at boundary\n• Sliding Window Log: log timestamps of requests; count in last N seconds. Accurate but memory-heavy\n• Sliding Window Counter: hybrid of fixed+log; balances accuracy and memory\n\nImplementation:\n• Redis INCR + EXPIRE for distributed rate limiting\n• Nginx limit_req_zone\n• API Gateway throttling (AWS, Cloudflare)', category: 'system-design', difficulty: 'hard', tags: ['rate-limiting', 'system-design'] },
  { id: 'sd-6', front: 'What is a cache and what are eviction policies?', back: 'Cache: fast in-memory store holding frequently accessed data to reduce latency and backend load.\n\nEviction policies (when cache is full):\n• LRU (Least Recently Used): evict least recently accessed — most common\n• LFU (Least Frequently Used): evict least-accessed overall\n• FIFO: evict oldest item regardless of access\n• MRU (Most Recently Used): evict most recent (useful for scans)\n• TTL-based: evict when time-to-live expires\n\nCache patterns:\n• Cache-aside: app checks cache, on miss fetches DB + populates cache\n• Write-through: write to cache and DB simultaneously\n• Write-behind (write-back): write to cache, async flush to DB\n\nTools: Redis, Memcached, Caffeine (local)', category: 'system-design', difficulty: 'medium', tags: ['caching', 'redis', 'lru'] },
  { id: 'sd-7', front: 'What is database replication and what are the types?', back: 'Replication: copying data from a primary (leader) to one or more replicas (followers).\n\nTypes:\n• Single-leader (master-slave): all writes to primary, reads from replicas. Simple, most common.\n• Multi-leader: multiple nodes accept writes. Complex conflict resolution. Good for geo-distributed writes.\n• Leaderless (Dynamo-style): any node accepts reads/writes. Uses quorum (R + W > N) for consistency.\n\nReplication methods:\n• Synchronous: primary waits for replica acknowledgment (strong consistency, slower)\n• Asynchronous: primary sends, doesn\'t wait (faster, eventual consistency, risk of data loss on failover)\n\nUse cases:\n• Read scaling (route reads to replicas)\n• High availability (failover to replica)\n• Geo-distribution (replicas in each region)', category: 'system-design', difficulty: 'hard', tags: ['databases', 'replication', 'distributed'] },
  { id: 'sd-8', front: 'How would you design a URL shortener?', back: 'Core components:\n1. Hash function: generate 6-8 char short code (base62 encode auto-increment ID, or MD5 prefix)\n2. Storage: {shortCode → longURL} in database\n3. Redirect: 301 (permanent, cached by browser) vs 302 (temporary, analytics tracked)\n\nScale considerations:\n• Read heavy: cache shortCode→longURL in Redis (LRU)\n• High write: use distributed ID generator (Snowflake)\n• Custom aliases: store in same table, unique constraint\n\nSchema:\n```sql\nCREATE TABLE urls (\n  id BIGINT PRIMARY KEY,\n  short_code VARCHAR(8) UNIQUE,\n  long_url TEXT,\n  user_id INT,\n  created_at TIMESTAMP,\n  expires_at TIMESTAMP\n);\n```\nBack of envelope: 100M URLs/day → ~40B in 10yr → need sharding', category: 'system-design', difficulty: 'medium', tags: ['system-design', 'case-study'] },

  // Additional Security cards
  { id: 'sec-4', front: 'What is JWT and how does it work?', back: 'JWT (JSON Web Token): self-contained token encoding claims, signed by the server.\n\nStructure: header.payload.signature (base64url encoded)\n• Header: {"alg":"HS256","typ":"JWT"}\n• Payload: {"sub":"user123","exp":1700000000,"role":"admin"}\n• Signature: HMAC-SHA256(header + "." + payload, secret)\n\nVerification: server recalculates signature with its secret — if it matches, token is valid and untampered.\n\nSecurity considerations:\n• Never store sensitive data in payload (it\'s base64, not encrypted)\n• Short expiry + refresh token pattern\n• Prefer RS256 (asymmetric) for distributed systems\n• Token revocation is hard — use Redis blocklist for logout', category: 'security', difficulty: 'medium', tags: ['jwt', 'auth', 'tokens'] },
  { id: 'sec-5', front: 'What is OAuth 2.0 and how is it different from OpenID Connect?', back: 'OAuth 2.0: authorization framework. Lets users grant apps access to their data WITHOUT sharing credentials.\n\nFlow (Authorization Code):\n1. User clicks "Login with Google"\n2. Redirect to Google → user authenticates\n3. Google returns authorization code\n4. App exchanges code for access_token (and refresh_token)\n5. App uses access_token to call Google APIs\n\nOAuth 2.0 → answers: "What can this app do?"\n\nOpenID Connect (OIDC): identity layer ON TOP of OAuth 2.0.\nAdds id_token (JWT with user profile: name, email, sub).\nAnswers: "Who is this user?"\n\nRule: OAuth for API authorization, OIDC for authentication (login).', category: 'security', difficulty: 'hard', tags: ['oauth', 'oidc', 'auth'] },
  { id: 'sec-6', front: 'What is a Man-in-the-Middle attack and how do you prevent it?', back: 'MitM attack: attacker intercepts communication between two parties, can read and modify traffic.\n\nExamples:\n• ARP spoofing on local network\n• DNS spoofing (returns attacker\'s IP)\n• Rogue WiFi hotspot\n• SSL stripping (downgrade HTTPS to HTTP)\n\nPrevention:\n1. TLS everywhere (HTTPS): encrypts in transit\n2. HSTS (HTTP Strict Transport Security): forces HTTPS, prevents SSL stripping\n3. Certificate pinning: app only trusts specific certificates\n4. VPN on untrusted networks\n5. DNSSEC: authenticates DNS responses\n6. Mutual TLS (mTLS): both client and server present certificates', category: 'security', difficulty: 'medium', tags: ['mitm', 'network-security'] },
  { id: 'sec-7', front: 'What is the difference between authentication and authorization?', back: 'Authentication (AuthN): verifying identity — "Who are you?"\n• Methods: password, MFA, biometrics, certificates, OAuth\n• Result: confirmed identity (user ID)\n\nAuthorization (AuthZ): verifying permissions — "What are you allowed to do?"\n• Methods: RBAC, ABAC, ACL, JWT claims\n• Result: allow or deny action\n\nOrder: always authenticate FIRST, then authorize.\n\nCommon models:\n• RBAC (Role-Based): user has roles (admin, viewer), roles have permissions\n• ABAC (Attribute-Based): policies based on user attributes, resource attributes, environment\n• ACL (Access Control List): per-resource permissions\n\nExample: login (authN) → can user delete this post? (authZ)', category: 'security', difficulty: 'easy', tags: ['auth', 'rbac', 'security'] },

  // Behavioral Interview
  { id: 'beh-1', front: 'What is the STAR method for behavioral answers?', back: 'STAR = Situation, Task, Action, Result.\n\nS — Situation: set the context (brief, 1-2 sentences)\nT — Task: your specific responsibility\nA — Action: what YOU did (use "I" not "we"; be specific)\nR — Result: quantified outcome + what you learned\n\nExample trigger: "Tell me about a time you..."\n\nTips:\n• Spend 70% of time on A and R\n• Use numbers: "reduced latency by 40%"\n• Prepare 8-10 stories that cover: leadership, conflict, failure, technical achievement, ambiguity, prioritization', category: 'behavioral', difficulty: 'easy', tags: ['star', 'behavioral'] },
  { id: 'beh-2', front: 'How do you answer "Tell me about yourself"?', back: 'Structure: Present → Past → Future (2 minutes max)\n\nPresent: What you\'re doing now and why it matters\n"I\'m a backend engineer at FinTech Co, where I own our payments infrastructure handling ₹50Cr/day."\n\nPast: Relevant experience that led here\n"Before this, I built high-scale APIs at a Series B startup and interned at Walmart Labs."\n\nFuture: Why this role/company specifically\n"I\'m looking to work on distributed systems at Google scale, which is exactly what drew me to this role."\n\nDon\'t: read your CV, be vague, go over 2 min\nDo: rehearse it, make it a compelling story, end with why you\'re here', category: 'behavioral', difficulty: 'easy', tags: ['intro', 'behavioral'] },
  { id: 'beh-3', front: 'How do you answer "What is your greatest weakness"?', back: 'The trap: fake humility ("I work too hard") or real red flags ("I miss deadlines").\n\nFormula: Name a real, non-critical weakness + show active improvement + show awareness\n\nExample:\n"Historically I\'ve struggled with saying no — I\'d take on too much and burn out. I started blocking \"deep work\" time in my calendar and using a task priority matrix. Last quarter I delivered 3 major projects without overtime, compared to the previous quarter where I worked weekends twice."\n\nGood weaknesses:\n• Difficulty delegating (improving by using task lists + check-ins)\n• Public speaking (improving by attending Toastmasters)\n• Over-engineering (improving by asking "what\'s the MVP")\n\nNever: "I have no weaknesses" or weaknesses essential to the job', category: 'behavioral', difficulty: 'medium', tags: ['weakness', 'behavioral'] },
  { id: 'beh-4', front: 'Amazon Leadership Principles — name the most tested ones', back: '14 Leadership Principles at Amazon (frequently asked):\n\n1. Customer Obsession — start with customer, work backwards\n2. Ownership — "That\'s not my job" never said here\n3. Invent and Simplify — find new ways, simplify existing\n4. Are Right, A Lot — good judgment, seek diverse perspectives\n5. Learn and Be Curious — always learning\n6. Hire and Develop the Best — raise the bar\n7. Insist on Highest Standards — never "good enough"\n8. Think Big — bold, audacious goals\n9. Bias for Action — calculated risk > analysis paralysis\n10. Frugality — do more with less\n11. Earn Trust — listen, be honest, speak candidly\n12. Dive Deep — understand the details\n13. Have Backbone; Disagree and Commit — challenge then commit\n14. Deliver Results — the scoreboard matters\n\nPrepare 2 STAR stories per LP. Amazon interviewers explicitly map answers to LPs.', category: 'behavioral', difficulty: 'medium', tags: ['amazon', 'leadership', 'behavioral'] },
  { id: 'beh-5', front: 'How do you prioritize competing tasks/deadlines?', back: 'Framework: ICE or Eisenhower Matrix\n\nICE = Impact × Confidence × Ease (score 1-10 each, multiply)\n\nEisenhower Matrix:\n• Urgent + Important: Do first\n• Important + Not Urgent: Schedule\n• Urgent + Not Important: Delegate\n• Not Urgent + Not Important: Eliminate\n\nSample answer:\n"When I have competing priorities, I first clarify the actual business impact of each — deadlines aren\'t always equal. I use a quick impact/effort matrix. I\'m also transparent with stakeholders early: \'I can deliver A by Thursday or B by Tuesday, which matters more to you?\' This avoids surprises and builds trust."\n\nRedflags: "I just work harder" or "I always hit every deadline" (not credible)', category: 'behavioral', difficulty: 'medium', tags: ['prioritization', 'behavioral'] },
  { id: 'beh-6', front: 'How do you handle a disagreement with a coworker?', back: 'What they\'re really asking: can you navigate conflict professionally without escalating unnecessarily?\n\nFormula:\n1. Try to understand their view first (ask questions, not arguments)\n2. Share your perspective with data, not opinion\n3. Identify the shared goal (you both want the product to succeed)\n4. Propose a structured way to resolve it (test both approaches, timebox, prototype)\n5. If stuck, escalate with options, not a complaint\n\nSample story trigger: "Tell me about a time you disagreed with a peer..."\n\nKey phrases:\n• "I asked them to walk me through their thinking..."\n• "I realized they had context I didn\'t..."\n• "We agreed to run a 1-week experiment..."\n• "Looking back, their approach had merit I hadn\'t appreciated"', category: 'behavioral', difficulty: 'medium', tags: ['conflict', 'behavioral'] },
  { id: 'beh-7', front: 'Tell me about a project you are most proud of', back: 'This is your chance to show scope, impact, and ownership. Choose a project that:\n• Had significant technical depth\n• You can speak to with specific details\n• Had measurable outcomes\n• Shows collaboration AND individual contribution\n\nStructure:\n• Problem: what was the pain and business context?\n• Solution: what did you build and why did you choose this approach?\n• Execution: what was hard? what did you learn?\n• Impact: numbers! (users served, latency improved, revenue unlocked)\n\nDon\'t: choose something too small or something you barely worked on.\nDo: be able to discuss architecture, trade-offs, and "what would you do differently?"', category: 'behavioral', difficulty: 'medium', tags: ['proud', 'impact', 'behavioral'] },
  { id: 'beh-8', front: 'Why do you want to leave your current job?', back: 'This is a trap question — don\'t badmouth your employer.\n\nAlways frame as moving TOWARD something, not running FROM something.\n\nSafe answers:\n• "I\'ve learned a lot here, but I want to work on [larger scale / different domain / more ownership]."\n• "The team here is great, but I\'m looking for a company where I can grow into a senior/lead role in the next 2 years."\n• "I want to work on problems in [specific domain], which is exactly what your team is doing."\n\nNever say:\n• "My manager is terrible"\n• "I\'m bored"\n• "I need more money" (even if true — discuss comp separately)\n• "The company is declining"\n\nResearch the company: your "why" should be specific to THEM.', category: 'behavioral', difficulty: 'medium', tags: ['leaving', 'motivation', 'behavioral'] },
  { id: 'beh-9', front: 'Tell me about a time you had to learn something quickly', back: 'What they\'re testing: learning agility, curiosity, how you operate under pressure.\n\nSTAR structure:\nS: Joined a project using Kafka mid-sprint with no prior Kafka experience.\nT: Own the consumer implementation for our order-event pipeline in 2 weeks.\nA: Spent 3 days on the Confluent learning path + Kafka docs. Built a throwaway prototype to understand consumer groups and offset commits. Paired with a senior engineer for 2 hours on the production patterns. Created a team wiki page on our Kafka conventions as I learned.\nR: Delivered the consumer on time. The wiki page became the onboarding doc for 4 new engineers over the next 6 months.\n\nKey elements: structured learning approach + output that helped others + specific resource/method used.', category: 'behavioral', difficulty: 'easy', tags: ['learning', 'behavioral'] },
  { id: 'beh-10', front: 'What is your 5-year career goal?', back: 'What they\'re really asking: are you ambitious? Are you going to stay or leave in 6 months? Does this role fit your trajectory?\n\nDon\'t say: "I want to be a CEO" or "I have no idea" or "Exactly this job for 5 years."\n\nFormula: Growth direction + skill area + how this role connects\n\nExample (SWE):\n"In 5 years, I want to be a Staff/Senior Engineer who can independently drive technical direction on large-scale distributed systems. I\'m looking to build that expertise through the work this team does — particularly [specific team project]. I also want to grow my mentorship skills by leading a small team over time."\n\nBe honest but strategic: "I want to grow here" > "I want to start my own company" (unless it\'s a startup).', category: 'behavioral', difficulty: 'easy', tags: ['goals', 'career', 'behavioral'] },

  // Algorithm Patterns
  { id: 'pat-1', front: 'What is the Two Pointers pattern? When do you use it?', back: 'Two pointers: maintain two indices that move through a data structure, typically toward each other or in the same direction.\n\nTypes:\n• Opposite ends: sorted array, palindrome checking, pair with target sum\n• Same direction: fast/slow (Floyd\'s cycle), sliding window variant\n• Two arrays: merge two sorted arrays\n\nTime: O(n) instead of O(n²) for naive nested loops\nSpace: O(1)\n\nTriggers:\n• "sorted array"\n• "pair that sums to target"\n• "palindrome"\n• "remove in-place"\n• "container with most water"\n\nExample: 3Sum → sort + two pointers = O(n²) instead of O(n³)', category: 'patterns', difficulty: 'easy', tags: ['two-pointers', 'pattern'] },
  { id: 'pat-2', front: 'What is the Sliding Window pattern? Name the two types.', back: 'Sliding window: expand/shrink a window of contiguous elements to find optimal subarray/substring.\n\nType 1 — Fixed window (size = k):\n• Init first k elements, then slide: add right, remove left\n• Example: max sum subarray of size k → O(n) vs O(n²) brute\n\nType 2 — Variable window:\n• Expand right while condition is met; shrink left when violated\n• Track the answer at each valid state\n• Example: longest substring without repeating chars\n\nTriggers:\n• "subarray/substring of size k"\n• "longest/shortest subarray with property"\n• "contiguous elements"\n\nMost sliding window problems: O(n) time, O(1) or O(charset) space.', category: 'patterns', difficulty: 'easy', tags: ['sliding-window', 'pattern'] },
  { id: 'pat-3', front: 'What is the Fast & Slow Pointer pattern?', back: 'Also called Floyd\'s Tortoise and Hare. Use two pointers at different speeds to detect cycles or find midpoints.\n\nCycle detection in linked list:\n• slow moves 1 step, fast moves 2 steps\n• If they meet → cycle exists\n• Reset slow to head, advance both 1 step → they meet at cycle start\n\nFinding middle of linked list:\n• When fast reaches end, slow is at middle\n\nTriggers:\n• "linked list cycle"\n• "find middle of linked list"\n• "palindrome linked list" (find middle, reverse second half, compare)\n• "happy number" (cycle detection with numbers)\n\nTime: O(n) | Space: O(1)', category: 'patterns', difficulty: 'medium', tags: ['fast-slow', 'linked-list', 'pattern'] },
  { id: 'pat-4', front: 'What is the Merge Intervals pattern?', back: 'Merge overlapping intervals by sorting then comparing adjacent pairs.\n\nAlgorithm:\n1. Sort by start time → O(n log n)\n2. Init result with first interval\n3. For each interval: if start ≤ last.end → merge (extend last.end)\n   else → append as new interval\n\nTime: O(n log n) | Space: O(n)\n\nVariants:\n• Insert interval: find position, merge neighbors\n• Meeting rooms: do any intervals overlap? (sort + check adjacent)\n• Meeting rooms II: min rooms = max overlapping intervals at once (min-heap)\n• Employee free time: find gaps between all intervals\n\nTriggers: "overlapping", "meeting times", "schedule", "time intervals"', category: 'patterns', difficulty: 'medium', tags: ['intervals', 'sorting', 'pattern'] },
  { id: 'pat-5', front: 'What is the Tree BFS (Level Order Traversal) pattern?', back: 'Use a queue to traverse a tree level by level. Enqueue root, then for each node, process it and enqueue its children.\n\nAlgorithm:\n```\nqueue = [root]\nwhile queue:\n  level_size = len(queue)\n  for i in range(level_size):\n    node = queue.dequeue()\n    process(node)\n    if node.left: queue.enqueue(node.left)\n    if node.right: queue.enqueue(node.right)\n```\n\nTime: O(n) | Space: O(w) where w = max width\n\nProblems using this pattern:\n• Level order traversal (return 2D array of levels)\n• Zigzag level order (alternate direction)\n• Right side view (last node of each level)\n• Average of levels\n• Connect next right pointer\n\nTrigger: "level by level", "level order", "right/left side view"', category: 'patterns', difficulty: 'medium', tags: ['bfs', 'trees', 'pattern'] },
  { id: 'pat-6', front: 'What is the Top K Elements pattern?', back: 'Find the K largest/smallest/most frequent elements without full sorting.\n\nApproach 1: Min-heap of size K (for K largest)\n• Build a heap of the first K elements\n• For each remaining element: if > heap.min, pop min and push element\n• Result: K elements in heap (not sorted)\n• Time: O(n log K) | Space: O(K)\n\nApproach 2: QuickSelect (O(n) average)\n• Partition around pivot, recurse on relevant side\n• O(n) average, O(n²) worst case\n\nApproach 3: Bucket sort (for frequencies, O(n))\n• Count frequencies, bucket by frequency, read top-K from highest bucket\n\nTriggers:\n• "K largest/smallest elements"\n• "K most frequent"\n• "K closest points to origin"\n• "median of a stream"', category: 'patterns', difficulty: 'medium', tags: ['heap', 'top-k', 'pattern'] },
  { id: 'pat-7', front: 'What is the Backtracking pattern?', back: 'Backtracking: explore all paths recursively, undo choices when a path is invalid or complete.\n\nTemplate:\n```\nfunction backtrack(start, current):\n  if current is complete: add to results; return\n  for each choice from start to end:\n    make choice (add to current)\n    backtrack(next_start, current)\n    undo choice (remove from current)\n```\n\nDecision tree: each level = one decision, each branch = one choice.\n\nPruning: skip invalid choices early to reduce O(2^n) or O(n!) search space.\n\nProblems:\n• Permutations: start = 0, all elements\n• Subsets: start = index, prevent duplicates\n• Combination sum: start = index, allow reuse\n• N-Queens: check column + diagonals\n• Word Search: mark visited, unmark on backtrack\n\nTrigger: "all combinations/permutations/subsets", "generate all", "N-Queens"', category: 'patterns', difficulty: 'hard', tags: ['backtracking', 'recursion', 'pattern'] },
  { id: 'pat-8', front: 'What is the Modified Binary Search pattern?', back: 'Binary search doesn\'t just find exact values in sorted arrays. It can:\n\n1. Find first/last occurrence of target → O(log n)\n2. Find insertion position (lower_bound)\n3. Find transition point in bitonic (mountain) array\n4. Search in rotated sorted array → identify which half is sorted, apply binary search\n5. Find minimum in rotated sorted array\n6. Minimize/maximize a value (search on answer space)\n7. Kth element in sorted matrix\n\nGeneral template:\n```\nlo, hi = 0, n-1\nwhile lo <= hi:\n  mid = lo + (hi - lo) // 2\n  if condition(mid): lo = mid + 1 (or hi = mid - 1 depending on direction)\n  else: hi = mid - 1\nreturn lo  # insertion point / boundary\n```\n\nTrigger: "sorted", "rotated", "find minimum", "first bad version"', category: 'patterns', difficulty: 'hard', tags: ['binary-search', 'pattern'] },
  { id: 'pat-9', front: 'What is the Dynamic Programming (DP) decision framework?', back: 'How to recognize and solve DP problems:\n\nStep 1 — Is it DP?\n• Overlapping subproblems + optimal substructure\n• "count ways", "minimum/maximum", "can you achieve X?"\n\nStep 2 — Top-down or bottom-up?\n• Both have O(n) time and space (memoized)\n• Top-down: write recursive solution + add memo map\n• Bottom-up: define dp array, fill from base cases\n\nStep 3 — Define the state\n• What changes between subproblems? → dp[i], dp[i][j], dp[i][j][k]\n• What do you store? (min cost, max value, count of ways)\n\nStep 4 — Transition function\n• dp[i] = f(dp[i-1], dp[i-2], ...)\n\nCommon DP templates:\n• 1D: climbing stairs, house robber\n• 2D grid: unique paths, edit distance\n• Interval: matrix chain, burst balloons\n• String: LCS, palindromes\n• Knapsack: 0/1 knapsack, coin change', category: 'patterns', difficulty: 'hard', tags: ['dynamic-programming', 'pattern'] },
  { id: 'pat-10', front: 'What is the Graph BFS/DFS pattern for traversal problems?', back: 'Graph traversal patterns and when to use each:\n\nBFS (Breadth-First Search):\n• Use a queue\n• Explores level by level\n• Finds shortest path in unweighted graph\n• Use for: shortest path, level-order, bipartite check\n• Time: O(V+E) | Space: O(V)\n\nDFS (Depth-First Search):\n• Use stack (or recursion)\n• Explores depth first\n• Use for: topological sort, cycle detection, connected components, islands\n• Time: O(V+E) | Space: O(V) (call stack)\n\nUnion-Find (Disjoint Set):\n• Better for dynamic connectivity and "number of islands in a stream"\n• find() + union() both nearly O(1) with path compression + rank\n\nTrigger patterns:\n• "shortest path unweighted" → BFS\n• "topological order / dependencies" → DFS + Kahn\'s\n• "number of islands / components" → either\n• "detect cycle" → DFS (track state: unvisited/visiting/visited)', category: 'patterns', difficulty: 'medium', tags: ['graphs', 'bfs', 'dfs', 'pattern'] },
];

// SM-2-style bucket durations (days)
const BUCKET_DAYS = [0, 1, 3, 7, 14, 30];

// ─── Component ────────────────────────────────────────────────────────────────

function getDueCards(cards: Flashcard[], progress: CardProgress[]): Flashcard[] {
  const now = new Date().toISOString().split('T')[0]!;
  return cards.filter((c) => {
    const p = progress.find((pr) => pr.cardId === c.id);
    if (!p) return true; // new card = always due
    return p.nextReview <= now;
  });
}

function getNextReview(confidence: ConfidenceLevel, currentBucket: number): { bucket: number; nextReview: string } {
  let next = currentBucket;
  if (confidence === 'again') next = 0;
  else if (confidence === 'hard') next = Math.max(0, currentBucket - 1);
  else if (confidence === 'good') next = Math.min(5, currentBucket + 1);
  else next = Math.min(5, currentBucket + 2); // easy

  const days = BUCKET_DAYS[next] ?? 0;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + days);
  return { bucket: next, nextReview: nextDate.toISOString().split('T')[0]! };
}

export function FlashcardsPage() {
  const { fireXP } = useUser();
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [progress, setProgress] = useState<CardProgress[]>(() => {
    try { return JSON.parse(localStorage.getItem('eyf.flashcard.progress') ?? '[]'); }
    catch { return []; }
  });
  const [sessionResults, setSessionResults] = useState<ConfidenceLevel[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const saveProgress = useCallback((updated: CardProgress[]) => {
    setProgress(updated);
    localStorage.setItem('eyf.flashcard.progress', JSON.stringify(updated));
  }, []);

  const startDeck = (deckId: string) => {
    const deckCards = ALL_CARDS.filter((c) => c.category === deckId);
    const due = getDueCards(deckCards, progress);
    // Shuffle
    const shuffled = [...due].sort(() => Math.random() - 0.5).slice(0, 20);
    if (shuffled.length === 0) {
      setSelectedDeck(deckId);
      setSessionCards([]);
      setSessionDone(true);
      return;
    }
    setSelectedDeck(deckId);
    setSessionCards(shuffled);
    setCurrentIdx(0);
    setFlipped(false);
    setSessionResults([]);
    setSessionDone(false);
    setXpEarned(0);
  };

  const handleConfidence = (confidence: ConfidenceLevel) => {
    const card = sessionCards[currentIdx];
    if (!card) return;

    const existing = progress.find((p) => p.cardId === card.id);
    const currentBucket = existing?.bucket ?? 0;
    const { bucket, nextReview } = getNextReview(confidence, currentBucket);

    const updated = progress.filter((p) => p.cardId !== card.id);
    updated.push({ cardId: card.id, bucket, nextReview, confidence });
    saveProgress(updated);

    const xp = confidence === 'again' ? 2 : confidence === 'hard' ? 3 : confidence === 'good' ? 5 : 8;
    setXpEarned((prev) => prev + xp);
    setSessionResults((prev) => [...prev, confidence]);

    if (currentIdx + 1 >= sessionCards.length) {
      // Session complete
      const totalXp = sessionResults.reduce((sum, c) => {
        return sum + (c === 'again' ? 2 : c === 'hard' ? 3 : c === 'good' ? 5 : 8);
      }, xp);
      fireXP(totalXp, `Flashcard session completed! (${sessionCards.length} cards)`);
      setSessionDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setFlipped(false);
    }
  };

  const getWeakTopics = () => {
    const deckWeakness: Array<{ deck: typeof DECKS[0]; againCount: number; total: number; pct: number }> = [];
    for (const deck of DECKS) {
      const deckCards = ALL_CARDS.filter((c) => c.category === deck.id);
      const againCount = progress.filter((p) =>
        deckCards.some((c) => c.id === p.cardId) && p.confidence === 'again'
      ).length;
      if (againCount > 0) {
        deckWeakness.push({ deck, againCount, total: deckCards.length, pct: Math.round((againCount / deckCards.length) * 100) });
      }
    }
    return deckWeakness.sort((a, b) => b.pct - a.pct).slice(0, 3);
  };

  const getMistakeHistory = () => {
    return progress
      .filter((p) => p.confidence === 'again')
      .map((p) => ALL_CARDS.find((c) => c.id === p.cardId))
      .filter(Boolean)
      .slice(-5)
      .reverse() as Flashcard[];
  };

  const getDeckStats = (deckId: string) => {
    const deckCards = ALL_CARDS.filter((c) => c.category === deckId);
    const due = getDueCards(deckCards, progress).length;
    const mastered = progress.filter((p) =>
      deckCards.some((c) => c.id === p.cardId) && p.bucket >= 4
    ).length;
    return { total: deckCards.length, due, mastered };
  };

  const currentCard = sessionCards[currentIdx];
  const totalDue = ALL_CARDS.filter((c) =>
    getDueCards(ALL_CARDS.filter((ac) => ac.category === c.category), progress).some((d) => d.id === c.id)
  ).length;

  // Keyboard handler
  useEffect(() => {
    if (!currentCard) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped) {
        if (e.key === '1') handleConfidence('again');
        if (e.key === '2') handleConfidence('hard');
        if (e.key === '3') handleConfidence('good');
        if (e.key === '4') handleConfidence('easy');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard, flipped, currentIdx]);

  // ── Deck selection view ───────────────────────────────────────────────────

  if (!selectedDeck || (!sessionCards.length && !sessionDone)) {
    return (
      <AppShell>
        <div className="pt-6 pb-12 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-[#E82127]/10 rounded-2xl flex items-center justify-center">
                <Icon name="style" size={22} className="text-[#E82127]" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Flashcards</h1>
                <p className="text-zinc-500 text-sm">Spaced repetition review — built for interview prep</p>
              </div>
            </div>

            {totalDue > 0 && (
              <div className="mt-4 bg-[#1a1010] border border-[#E82127]/20 rounded-2xl px-5 py-3 flex items-center gap-3">
                <Icon name="notifications_active" size={18} className="text-[#E82127] flex-shrink-0" />
                <p className="text-zinc-300 text-sm">
                  <span className="text-white font-bold">{totalDue} cards</span> are due for review across all decks.
                </p>
              </div>
            )}
          </div>

          {/* Decks grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DECKS.map((deck) => {
              const stats = getDeckStats(deck.id);
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => startDeck(deck.id)}
                  className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-5 text-left hover:border-white/15 hover:bg-[#1e1e1e] transition-all group active:scale-[0.98]"
                >
                  <div className={`w-10 h-10 ${deck.bg} rounded-xl flex items-center justify-center ${deck.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon name={deck.icon} size={20} />
                  </div>
                  <h3 className="font-black text-white text-sm mb-1">{deck.title}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] text-zinc-600 font-bold">{deck.count} cards</span>
                    {stats.mastered > 0 && (
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {stats.mastered} mastered
                      </span>
                    )}
                  </div>
                  {stats.due > 0 ? (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${deck.bg} ${deck.color}`}>
                      <Icon name="schedule" size={11} />
                      {stats.due} due
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                      <Icon name="check_circle" size={11} />
                      All caught up
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Revision Intelligence */}
          {progress.length > 0 && (() => {
            const weakTopics = getWeakTopics();
            const mistakeHistory = getMistakeHistory();
            const totalMastered = progress.filter((p) => p.bucket >= 4).length;
            if (weakTopics.length === 0 && mistakeHistory.length === 0) return null;
            return (
              <div className="mt-8 bg-[#1a1a1a] border border-amber-500/15 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Icon name="psychology" size={18} className="text-amber-400" />
                  <h3 className="font-black text-white text-sm">Revision Intelligence</h3>
                  <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {totalMastered} mastered
                  </span>
                </div>

                {weakTopics.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Weak Topics (by % of "Again" ratings)</p>
                    <div className="space-y-2">
                      {weakTopics.map(({ deck, againCount, total, pct }) => (
                        <button
                          key={deck.id}
                          type="button"
                          onClick={() => startDeck(deck.id)}
                          className="w-full flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl hover:bg-zinc-900 transition-colors group"
                        >
                          <div className={`w-8 h-8 ${deck.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon name={deck.icon} size={15} className={deck.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-bold text-zinc-300 truncate">{deck.title}</p>
                              <span className="text-xs font-bold text-red-400 ml-2 flex-shrink-0">{againCount}/{total} again</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <Icon name="play_arrow" size={16} className="text-zinc-600 group-hover:text-white transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mistakeHistory.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Recent Mistakes (last "Again" cards)</p>
                    <div className="space-y-2">
                      {mistakeHistory.map((card) => {
                        const deck = DECKS.find((d) => d.id === card.category);
                        return (
                          <div key={card.id} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                            <Icon name="close" size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-xs text-zinc-400 truncate">{card.front}</p>
                              {deck && <p className={`text-[10px] font-bold mt-0.5 ${deck.color}`}>{deck.title}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* How it works */}
          <div className="mt-10 bg-[#1a1a1a] border border-white/8 rounded-2xl p-6">
            <h3 className="font-black text-white text-sm mb-4 flex items-center gap-2">
              <Icon name="info" size={16} className="text-zinc-500" />
              How spaced repetition works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-zinc-400">
              {[
                { label: 'Again', color: 'text-red-400', desc: 'Forgot completely — review tomorrow' },
                { label: 'Hard', color: 'text-orange-400', desc: 'Remembered with difficulty — review in 3 days' },
                { label: 'Good', color: 'text-blue-400', desc: 'Remembered correctly — review in 7 days' },
                { label: 'Easy', color: 'text-green-400', desc: 'Knew it instantly — review in 14 days' },
              ].map((r) => (
                <div key={r.label} className="flex flex-col gap-1">
                  <span className={`font-black text-sm ${r.color}`}>{r.label}</span>
                  <span>{r.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-zinc-600 text-xs mt-4 flex items-center gap-1.5">
              <Icon name="keyboard" size={12} />
              Keyboard: Space = flip, 1/2/3/4 = Again/Hard/Good/Easy
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Session done view ─────────────────────────────────────────────────────

  if (sessionDone) {
    const good = sessionResults.filter((r) => r === 'good' || r === 'easy').length;
    const hard = sessionResults.filter((r) => r === 'hard').length;
    const again = sessionResults.filter((r) => r === 'again').length;

    return (
      <AppShell>
        <div className="pt-8 max-w-lg mx-auto text-center">
          <div className="bg-[#1a1a1a] border border-white/8 rounded-3xl p-10">
            <div className="text-6xl mb-6">{good === sessionCards.length ? '🏆' : good > sessionCards.length / 2 ? '🎯' : '💪'}</div>
            <h2 className="text-3xl font-black text-white mb-2">Session Complete!</h2>
            <p className="text-zinc-400 text-sm mb-8">{sessionCards.length} cards reviewed</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-500/10 rounded-2xl p-4">
                <p className="text-2xl font-black text-green-400">{good}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Good / Easy</p>
              </div>
              <div className="bg-orange-500/10 rounded-2xl p-4">
                <p className="text-2xl font-black text-orange-400">{hard}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Hard</p>
              </div>
              <div className="bg-red-500/10 rounded-2xl p-4">
                <p className="text-2xl font-black text-red-400">{again}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Again</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 bg-[#E82127]/10 border border-[#E82127]/20 rounded-2xl py-3 px-5 mb-8">
              <Icon name="bolt" size={16} className="text-[#E82127]" filled />
              <span className="text-[#E82127] font-black">+{xpEarned} XP earned</span>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => startDeck(selectedDeck)}
                className="w-full bg-[#E82127] text-white font-bold py-3 rounded-xl text-sm hover:brightness-110 transition-all"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={() => { setSelectedDeck(null); setSessionDone(false); }}
                className="w-full bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl text-sm hover:bg-zinc-700 transition-all"
              >
                Choose Another Deck
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Active session view ───────────────────────────────────────────────────

  if (!currentCard) return null;

  const deck = DECKS.find((d) => d.id === selectedDeck);
  const progressPct = Math.round((currentIdx / sessionCards.length) * 100);

  const DIFF_COLOR = { easy: 'text-green-400 bg-green-500/10', medium: 'text-yellow-400 bg-yellow-500/10', hard: 'text-red-400 bg-red-500/10' };

  return (
    <AppShell>
      <div className="pt-6 pb-12 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => { setSelectedDeck(null); setSessionDone(false); }}
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors"
          >
            <Icon name="arrow_back" size={16} />
            Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-zinc-600 text-sm font-bold">{currentIdx + 1} / {sessionCards.length}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[currentCard.difficulty]}`}>
              {currentCard.difficulty}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-zinc-800 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#E82127] to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Card */}
        <div
          className={`relative bg-[#1a1a1a] border rounded-3xl min-h-[280px] p-8 flex flex-col justify-between cursor-pointer transition-all duration-200 ${
            flipped ? 'border-white/20' : 'border-white/8 hover:border-white/15'
          }`}
          onClick={() => setFlipped((f) => !f)}
        >
          {/* Category tag */}
          <div className="flex items-center gap-2 mb-4">
            {deck && (
              <span className={`text-[10px] font-bold uppercase tracking-widest ${deck.color} ${deck.bg} px-2 py-1 rounded-full`}>
                {deck.title}
              </span>
            )}
            {currentCard.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 bg-zinc-800 px-2 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center">
            {!flipped ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Question</p>
                <p className="text-white text-lg font-bold leading-relaxed">{currentCard.front}</p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Answer</p>
                <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-line">{currentCard.back}</p>
              </div>
            )}
          </div>

          {/* Flip hint */}
          <div className="mt-6 flex items-center justify-center gap-2 text-zinc-700 text-xs">
            <Icon name="touch_app" size={14} />
            <span>{flipped ? 'Click to see question' : 'Click to reveal answer'}</span>
            <kbd className="bg-zinc-800/50 text-zinc-600 px-1.5 py-0.5 rounded text-[10px] font-mono ml-1">Space</kbd>
          </div>
        </div>

        {/* Confidence buttons */}
        {flipped && (
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[
              { level: 'again' as ConfidenceLevel, label: 'Again', sub: 'Tomorrow', color: 'bg-red-500/15 text-red-400 border-red-500/30', key: '1' },
              { level: 'hard' as ConfidenceLevel, label: 'Hard', sub: '3 days', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', key: '2' },
              { level: 'good' as ConfidenceLevel, label: 'Good', sub: '7 days', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', key: '3' },
              { level: 'easy' as ConfidenceLevel, label: 'Easy', sub: '14 days', color: 'bg-green-500/15 text-green-400 border-green-500/30', key: '4' },
            ].map((btn) => (
              <button
                key={btn.level}
                type="button"
                onClick={() => handleConfidence(btn.level)}
                className={`flex flex-col items-center gap-1 py-4 rounded-2xl border font-bold text-sm hover:brightness-110 transition-all active:scale-95 ${btn.color}`}
              >
                <span>{btn.label}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">{btn.sub}</span>
                <kbd className="bg-black/20 text-current px-1.5 py-0.5 rounded text-[9px] font-mono mt-1 opacity-50">
                  {btn.key}
                </kbd>
              </button>
            ))}
          </div>
        )}

        {!flipped && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setFlipped(true)}
              className="bg-[#E82127] text-white font-bold py-3 px-8 rounded-2xl text-sm hover:brightness-110 transition-all active:scale-95"
            >
              Reveal Answer
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
