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
  { id: 'os',       title: 'Operating Systems',     icon: 'terminal',      color: 'text-green-400',  bg: 'bg-green-500/10',  count: 20 },
  { id: 'dbms',     title: 'DBMS & SQL',             icon: 'storage',       color: 'text-blue-400',   bg: 'bg-blue-500/10',   count: 18 },
  { id: 'networks', title: 'Computer Networks',      icon: 'hub',           color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   count: 16 },
  { id: 'dsa',      title: 'DSA Concepts',           icon: 'code',          color: 'text-purple-400', bg: 'bg-purple-500/10', count: 25 },
  { id: 'system-design', title: 'System Design',    icon: 'architecture',  color: 'text-orange-400', bg: 'bg-orange-500/10', count: 15 },
  { id: 'security', title: 'Cybersecurity',          icon: 'shield',        color: 'text-red-400',    bg: 'bg-red-500/10',    count: 14 },
  { id: 'oop',      title: 'OOP & Design Patterns',  icon: 'account_tree',  color: 'text-amber-400',  bg: 'bg-amber-500/10',  count: 23 },
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
