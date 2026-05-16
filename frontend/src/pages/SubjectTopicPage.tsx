import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { SUBJECT_DATA, findTopic } from '../data/subjects';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

/* ------------------------------------------------------------------ */
/* Static topic content keyed by topic id                              */
/* ------------------------------------------------------------------ */
interface TopicContent {
  overview: string;
  keyPoints: string[];
  code: string;
  codeLang: string;
  summary: string;
}

const TOPIC_CONTENT: Record<string, TopicContent> = {
  processes: {
    overview: `A process is an instance of a program in execution. Each process has its own memory space, program counter, and a set of resources. The operating system tracks processes using a Process Control Block (PCB), which stores the process state, registers, memory limits, and I/O status.\n\nThreads are the smallest unit of execution within a process. Unlike processes, threads share the same memory space and resources, which makes inter-thread communication faster but requires careful synchronization to avoid race conditions and data corruption.`,
    keyPoints: [
      'PCB (Process Control Block) stores all state for a process',
      'Context switching: saving/restoring CPU state when switching processes',
      'Thread states: New, Ready, Running, Waiting, Terminated',
      'User-level vs kernel-level threads and their trade-offs',
      'fork() creates a child process; exec() replaces the process image',
      'Thread safety requires locks, semaphores, or atomic operations',
    ],
    code: String.raw`// Creating a thread in C (POSIX)
#include <pthread.h>

void* worker(void* arg) {
    printf("Thread running\n");
    return NULL;
}

int main() {
    pthread_t tid;
    pthread_create(&tid, NULL, worker, NULL);
    pthread_join(tid, NULL); // wait for thread
    return 0;
}`,
    codeLang: 'c',
    summary: 'Processes and threads are fundamental OS abstractions. Processes provide isolation while threads enable concurrency within a shared address space. Mastery of process lifecycle and thread synchronization is essential for systems programming.',
  },
  scheduling: {
    overview: `CPU scheduling determines the order in which processes access the CPU. The scheduler selects from the ready queue based on a scheduling algorithm, aiming to maximize CPU utilization, throughput, and minimize turnaround time and waiting time.\n\nScheduling algorithms range from simple FCFS (First Come First Served) to more sophisticated approaches like Multilevel Feedback Queue (MLFQ), which adapts to process behavior dynamically.`,
    keyPoints: [
      'FCFS: simple but suffers from convoy effect',
      'SJF (Shortest Job First): optimal average waiting time, but requires future knowledge',
      'Round Robin: preemptive, fair time-slice allocation, widely used in OS',
      'Priority Scheduling: can lead to starvation without aging',
      'MLFQ: multiple queues with different priorities and time quanta',
      'Metrics: CPU utilization, throughput, turnaround time, waiting time, response time',
    ],
    code: `// Round Robin simulation (pseudocode)
queue = ready_queue
time_quantum = 4ms

while queue not empty:
    process = queue.dequeue()
    run(process, min(time_quantum, process.remaining))
    
    if process.remaining > 0:
        queue.enqueue(process)  // re-add if not done
    else:
        process.finish()`,
    codeLang: 'python',
    summary: 'CPU scheduling is a key OS responsibility. Different algorithms offer trade-offs between fairness, efficiency, and responsiveness. Real operating systems like Linux use CFS (Completely Fair Scheduler) based on virtual runtime.',
  },
  normalization: {
    overview: `Database normalization is the process of organizing a relational database to reduce data redundancy and improve data integrity. Normal forms provide a systematic way to decompose tables while preserving dependencies.\n\nStarting from 1NF (atomic values, no repeating groups) through BCNF (every determinant is a candidate key), each normal form builds on the previous by eliminating specific types of anomalies.`,
    keyPoints: [
      '1NF: atomic values, no repeating groups, unique rows',
      '2NF: no partial dependencies on composite primary key',
      '3NF: no transitive dependencies (non-key → non-key)',
      'BCNF: every functional dependency X→Y, X must be a super key',
      'Decomposition must be lossless-join and dependency-preserving',
      'Over-normalization can hurt read performance (more joins needed)',
    ],
    code: `-- Before normalization (violates 3NF)
-- Orders(order_id, customer_id, customer_city, product_id, qty)
-- customer_city depends on customer_id, not order_id

-- After normalization
CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  customer_city VARCHAR(100)
);

CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  customer_id INT REFERENCES customers,
  product_id INT,
  qty INT
);`,
    codeLang: 'sql',
    summary: 'Normalization reduces anomalies in insert, update, and delete operations by ensuring each fact is stored once. BCNF is the gold standard for most OLTP databases, while denormalization is preferred for read-heavy analytical workloads.',
  },
  sql: {
    overview: `SQL (Structured Query Language) is the standard language for interacting with relational databases. It encompasses DDL (Data Definition Language), DML (Data Manipulation Language), and DCL (Data Control Language).\n\nJOINs are one of the most powerful features of SQL, allowing data from multiple tables to be combined based on related columns. Understanding INNER, LEFT, RIGHT, FULL OUTER, and CROSS JOINs is critical for writing efficient queries.`,
    keyPoints: [
      'INNER JOIN: returns rows matching in both tables',
      'LEFT JOIN: all rows from left table, matched rows from right (NULL if no match)',
      'Window functions: ROW_NUMBER, RANK, LAG, LEAD, SUM OVER PARTITION',
      'Subqueries vs CTEs (Common Table Expressions) for readability',
      'GROUP BY + HAVING for aggregation filtering',
      'Indexes dramatically speed up WHERE and JOIN conditions',
    ],
    code: `-- Find top 3 customers by total order value
WITH ranked AS (
  SELECT 
    c.name,
    SUM(o.amount) AS total,
    RANK() OVER (ORDER BY SUM(o.amount) DESC) AS rnk
  FROM customers c
  JOIN orders o ON c.id = o.customer_id
  GROUP BY c.id, c.name
)
SELECT name, total FROM ranked WHERE rnk <= 3;`,
    codeLang: 'sql',
    summary: 'SQL mastery requires understanding joins, aggregations, window functions, and query optimization. Practice writing complex multi-table queries and learn to read EXPLAIN plans to identify bottlenecks.',
  },
  osi: {
    overview: `The OSI (Open Systems Interconnection) model is a conceptual framework that standardizes network communication into 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application. Each layer has specific responsibilities and communicates with adjacent layers via well-defined interfaces.\n\nThe TCP/IP model is the practical implementation used on the Internet, consolidating the 7 OSI layers into 4: Network Access, Internet, Transport, and Application.`,
    keyPoints: [
      'Layer 7 (Application): HTTP, FTP, SMTP, DNS',
      'Layer 4 (Transport): TCP (reliable) vs UDP (fast, unreliable)',
      'Layer 3 (Network): IP routing, ICMP, ARP',
      'Layer 2 (Data Link): MAC addresses, Ethernet frames, switches',
      'Layer 1 (Physical): bits over wire, radio, fiber',
      'Encapsulation: each layer adds its header as data travels down',
    ],
    code: `# Tracing a simple HTTP request through OSI layers
# App Layer:    GET /index.html HTTP/1.1
# Transport:    TCP segment (src:port, dst:80, seq#)
# Network:      IP packet (src IP, dst IP, TTL)
# Data Link:    Ethernet frame (src MAC, dst MAC, CRC)
# Physical:     Bits transmitted on wire/wireless`,
    codeLang: 'python',
    summary: 'The OSI model is a conceptual tool for understanding network protocols. In practice, TCP/IP dominates. Understanding encapsulation and which layer handles what is essential for debugging network issues and designing distributed systems.',
  },
  solid: {
    overview: `SOLID is an acronym for five design principles that make software designs more understandable, flexible, and maintainable. Introduced by Robert C. Martin, these principles are especially relevant in object-oriented programming and serve as the foundation for clean architecture.\n\nApplying SOLID principles reduces coupling, increases cohesion, and makes codebases easier to test and extend without breaking existing functionality.`,
    keyPoints: [
      'S - Single Responsibility: a class should have one reason to change',
      'O - Open/Closed: open for extension, closed for modification',
      'L - Liskov Substitution: subtypes must be substitutable for base types',
      'I - Interface Segregation: prefer many specific interfaces over one general',
      'D - Dependency Inversion: depend on abstractions, not concretions',
      'These principles guide refactoring legacy code and designing new systems',
    ],
    code: `// Dependency Inversion Principle example
interface Logger {
  log(msg: string): void;
}

class ConsoleLogger implements Logger {
  log(msg: string) { console.log(msg); }
}

// Service depends on abstraction, not concrete class
class OrderService {
  constructor(private logger: Logger) {}
  
  placeOrder(order: Order) {
    // ... business logic
    this.logger.log(\`Order \${order.id} placed\`);
  }
}`,
    codeLang: 'typescript',
    summary: 'SOLID principles are guidelines, not strict rules. Over-engineering in the name of SOLID can be counterproductive. Apply them where they reduce real complexity and improve testability — especially in large, long-lived codebases.',
  },
  scalability: {
    overview: `Scalability is the ability of a system to handle increasing load by adding resources. Vertical scaling (scale up) means adding more power to existing machines, while horizontal scaling (scale out) means adding more machines. Most modern internet-scale systems rely on horizontal scaling.\n\nLoad balancers distribute incoming traffic across multiple servers, providing fault tolerance and enabling horizontal scaling. Common algorithms include round-robin, least connections, and consistent hashing.`,
    keyPoints: [
      'Horizontal vs vertical scaling and their trade-offs',
      'Stateless services scale easily; stateful services require session management',
      'Load balancer algorithms: round-robin, least-connections, IP hash',
      'Health checks ensure traffic only goes to healthy instances',
      'Auto-scaling groups respond to metrics (CPU, request rate)',
      'Database sharding for horizontal data scaling',
    ],
    code: `# Nginx load balancer config
upstream backend {
  least_conn;  # least connections algorithm
  server app1.example.com:8080;
  server app2.example.com:8080;
  server app3.example.com:8080;
}

server {
  listen 80;
  location / {
    proxy_pass http://backend;
    proxy_set_header X-Real-IP $remote_addr;
  }
}`,
    codeLang: 'nginx',
    summary: 'Scalability requires designing systems to be stateless, distributing load intelligently, and choosing the right data store for your access patterns. Always measure before optimizing — premature scalability adds complexity without benefit.',
  },
};

  sync: {
    overview: `Synchronization ensures that concurrent threads/processes access shared resources in a controlled, safe manner. Without synchronization, race conditions can corrupt data or lead to undefined behavior.\n\nA deadlock occurs when two or more processes are permanently blocked, each waiting for a resource held by the other. Coffman (1971) identified four necessary conditions for deadlock: mutual exclusion, hold-and-wait, no preemption, and circular wait.`,
    keyPoints: [
      'Critical section: code that accesses shared resources — must execute atomically',
      'Mutex: binary lock with ownership — only the locking thread can unlock',
      'Semaphore: counter-based — any thread can signal (release)',
      'Deadlock conditions: mutual exclusion, hold-and-wait, no preemption, circular wait',
      'Deadlock prevention: eliminate at least one of the four conditions',
      'Deadlock detection: resource allocation graph + cycle detection',
      'Banker\'s Algorithm: safe-state analysis for deadlock avoidance',
    ],
    code: `// Mutex usage (POSIX)
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
int balance = 100;

void deposit(int amount) {
    pthread_mutex_lock(&lock);   // acquire
    balance += amount;            // critical section
    pthread_mutex_unlock(&lock); // release
}

// Semaphore for producer-consumer
sem_t empty, full;
sem_init(&empty, 0, BUFFER_SIZE);
sem_init(&full, 0, 0);

void producer() {
    sem_wait(&empty);    // wait if buffer full
    // produce item
    sem_post(&full);     // signal item available
}`,
    codeLang: 'c',
    summary: 'Synchronization is the cornerstone of concurrent programming. Use the smallest possible critical sections, prefer higher-level abstractions (channels, actors) when possible, and always use RAII-style locking to prevent forgotten unlocks.',
  },
  paging: {
    overview: `Paging divides virtual memory into fixed-size pages and physical memory into frames of the same size. The OS maintains a page table per process that maps virtual page numbers to physical frame numbers.\n\nWhen a process accesses a page not in physical memory, a page fault occurs and the OS loads the page from disk (swap space). Page replacement algorithms decide which page to evict when memory is full.`,
    keyPoints: [
      'Page size: typically 4KB — trades off internal fragmentation vs TLB coverage',
      'Page table entry: frame number + present bit + dirty bit + reference bit',
      'TLB (Translation Lookaside Buffer): hardware cache for recent page table entries',
      'Multi-level paging: hierarchical page tables save memory for sparse address spaces',
      'LRU (Least Recently Used): near-optimal but expensive — often approximated with clock algorithm',
      'FIFO: simple but suffers from Belady\'s anomaly (more frames → more faults)',
      'Optimal (OPT): evict page used furthest in future — theoretical benchmark',
    ],
    code: `// Page fault rate analysis
// If working set > physical memory → thrashing
// Solution: working set model

// Virtual address breakdown (32-bit, 4KB pages)
// Bits 31-12: Virtual Page Number (20 bits = 1M pages)
// Bits 11-0:  Page Offset (12 bits = 4KB)

// Page table lookup pseudocode
translate(virtual_addr):
  vpn  = virtual_addr >> 12
  off  = virtual_addr & 0xFFF
  if TLB[vpn] exists:
    return (TLB[vpn] << 12) | off
  if page_table[vpn].present:
    frame = page_table[vpn].frame
    TLB.insert(vpn, frame)
    return (frame << 12) | off
  else:
    raise PageFault(vpn)  // OS loads from disk`,
    codeLang: 'python',
    summary: 'Paging eliminates external fragmentation at the cost of internal fragmentation and page table overhead. TLBs are critical for performance — a TLB miss causes one or more memory accesses just to translate an address.',
  },
  acid: {
    overview: `ACID is a set of properties that guarantee database transactions are processed reliably, even in the face of system failures.\n\nAtomicity ensures a transaction either completes entirely or has no effect. Consistency ensures data moves from one valid state to another. Isolation prevents concurrent transactions from seeing each other's intermediate state. Durability ensures committed transactions survive crashes through techniques like Write-Ahead Logging.`,
    keyPoints: [
      'Atomicity: all-or-nothing execution — implemented via undo logs (rollback)',
      'Consistency: application-enforced invariants (FK constraints, CHECK constraints)',
      'Isolation: concurrent transactions appear to run serially — levels trade off performance',
      'Durability: committed data written to disk via WAL (Write-Ahead Log) before acknowledging',
      'WAL: log changes before applying — enables crash recovery by replaying log',
      'MVCC: allows readers and writers to not block each other (PostgreSQL default)',
      'Savepoints: partial rollback within a transaction',
    ],
    code: `-- Classic bank transfer — all-or-nothing
BEGIN;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;

-- Both succeed: COMMIT; both fail: ROLLBACK
COMMIT;

-- Isolation level control (PostgreSQL)
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
SELECT balance FROM accounts WHERE id = 1;
-- ...
COMMIT;`,
    codeLang: 'sql',
    summary: 'ACID properties are the foundation of relational database reliability. Understanding them helps you design schemas and application code that maintain data integrity under concurrent access and partial failures.',
  },
  'tcp-udp': {
    overview: `TCP (Transmission Control Protocol) and UDP (User Datagram Protocol) are the two primary transport layer protocols. They make fundamentally different tradeoffs between reliability and performance.\n\nTCP provides reliable, ordered delivery using sequence numbers, acknowledgments, retransmission, and flow/congestion control. UDP provides best-effort datagram delivery with no guarantees — the application is responsible for reliability if needed.`,
    keyPoints: [
      'TCP: connection-oriented — 3-way handshake before data, 4-way FIN teardown',
      'TCP: sequence numbers + ACKs ensure ordered, reliable delivery',
      'TCP: flow control via sliding window (receiver controls sender rate)',
      'TCP: congestion control: slow start, AIMD, fast retransmit/recovery',
      'UDP: connectionless, no state, header is only 8 bytes (port, length, checksum)',
      'UDP: lower latency, good for real-time (VoIP, gaming, live video)',
      'QUIC: UDP-based protocol with built-in TLS and streams — used in HTTP/3',
    ],
    code: `// TCP socket server (Node.js)
import net from 'net';
const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    socket.write('Echo: ' + data);
  });
});
server.listen(3000);

// UDP socket (Node.js)
import dgram from 'dgram';
const server = dgram.createSocket('udp4');
server.on('message', (msg, rinfo) => {
  console.log(\`\${rinfo.address}:\${rinfo.port}: \${msg}\`);
  server.send('ACK', rinfo.port, rinfo.address);
});
server.bind(3001);`,
    codeLang: 'typescript',
    summary: 'Choose TCP when data integrity and ordering matter (HTTP, SSH, databases). Choose UDP when speed matters more than reliability (DNS lookups, video streaming, online games). QUIC brings TCP reliability to UDP performance.',
  },
  caching: {
    overview: `Caching stores frequently accessed data in a faster tier to reduce latency and backend load. Effective caching can reduce database load by 90%+ for read-heavy workloads.\n\nCache eviction policies determine what to remove when the cache is full. Common policies include LRU (Least Recently Used), LFU (Least Frequently Used), and TTL (Time To Live) expiration.`,
    keyPoints: [
      'Cache hit rate: hits / (hits + misses) — aim for 90%+ in production',
      'Cache-aside (Lazy Loading): check cache → on miss, load from DB → populate cache',
      'Write-through: write to cache and DB simultaneously — consistency, but write latency',
      'Write-behind (write-back): write to cache, async flush to DB — low latency, risk of loss',
      'LRU eviction: O(1) with doubly linked list + hash map (LeetCode 146)',
      'Cache stampede: many requests hit DB simultaneously on expiry — use mutex or probabilistic early expiration',
      'Thundering herd: use Redis SETNX lock or cache warming to mitigate',
    ],
    code: `// LRU Cache implementation (TypeScript)
class LRUCache {
  private map = new Map<number, number>();
  constructor(private capacity: number) {}

  get(key: number): number {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val); // move to end (most recent)
    return val;
  }

  put(key: number, value: number): void {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value); // evict oldest
    }
  }
}`,
    codeLang: 'typescript',
    summary: 'Caching is one of the highest-ROI optimizations in system design. Identify hot data, choose an appropriate eviction policy, and handle cache invalidation carefully — it\'s one of the famously hard problems in CS.',
  },
  cap: {
    overview: `The CAP theorem (Brewer, 2000) states that a distributed system can guarantee at most 2 of 3 properties: Consistency, Availability, and Partition Tolerance.\n\nSince network partitions are inevitable in distributed systems, the real choice is between CP (consistency sacrificed during partition) and AP (availability maintained, possibly with stale data). The PACELC theorem extends this to consider latency trade-offs during normal operation.`,
    keyPoints: [
      'C — Consistency: every read gets the most recent write (linearizability)',
      'A — Availability: every request gets a non-error response (may be stale)',
      'P — Partition Tolerance: system operates despite network partitions',
      'CP systems: HBase, Zookeeper, PAXOS-based (return error on partition)',
      'AP systems: DynamoDB, Cassandra, CouchDB (return potentially stale data)',
      'Most SQL databases are CA (single node, ignores P — not truly distributed)',
      'PACELC: even without partition, choose between latency vs consistency',
    ],
    code: `// Quorum-based consistency (Dynamo-style)
// R = read replicas, W = write replicas, N = total replicas
// Strong consistency: R + W > N
// Availability-first: R = W = 1 (fastest, potentially stale)

// Example: N=3, W=2, R=2
// R + W = 4 > 3 → strong consistency
// Write must hit 2/3 replicas before ack
// Read must query 2/3 replicas and return latest version

// Cassandra tuning
// ANY: lowest consistency, highest availability
// QUORUM: (N/2)+1 replicas — good balance
// ALL: all replicas — strongest, lowest availability`,
    codeLang: 'python',
    summary: 'CAP theorem shapes how you design distributed systems. When designing for high availability (AP), implement conflict resolution and eventual consistency. When requiring strong consistency (CP), accept that the system may reject requests during network partitions.',
  },
};

const DEFAULT_CONTENT: TopicContent = {
  overview: `This topic covers fundamental concepts that are essential for mastering the subject. Understanding the core principles will help you build more complex knowledge and apply these concepts in real-world engineering scenarios.\n\nAs you work through this material, focus on understanding the underlying mechanisms rather than memorizing facts. The ability to reason from first principles will serve you better in interviews and on the job.`,
  keyPoints: [
    'Understand the core definition and purpose of this concept',
    'Identify common use cases and when to apply this knowledge',
    'Recognize trade-offs and limitations in real-world scenarios',
    'Practice applying concepts through coding exercises and problems',
    'Connect this topic to related concepts you have already studied',
  ],
  code: `// Example implementation (pseudocode)
function solve(input) {
  // 1. Understand the problem
  // 2. Identify constraints
  // 3. Choose the right data structure
  // 4. Implement and verify
  return output;
}`,
  codeLang: 'typescript',
  summary: 'Mastery of this topic requires practice and application. Review the key points, implement examples from scratch, and attempt related practice problems to solidify your understanding.',
};

/* ------------------------------------------------------------------ */

export function SubjectTopicPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const navigate = useNavigate();
  const { fireXP } = useUser();
  const session = getSession();
  const [completed, setCompleted] = useState(false);

  const result = subjectId && topicId ? findTopic(subjectId, topicId) : null;
  const subject = subjectId ? SUBJECT_DATA[subjectId] : null;
  const content = topicId ? (TOPIC_CONTENT[topicId] ?? DEFAULT_CONTENT) : DEFAULT_CONTENT;

  if (!result || !subject) {
    return (
      <AppShell>
        <div className="pt-8 text-center">
          <p className="text-zinc-500 text-lg">Topic not found.</p>
          <button
            onClick={() => navigate(`/app/subjects/${subjectId}`)}
            className="mt-6 text-primary-container font-bold text-[11px] uppercase tracking-widest"
          >
            ← Back
          </button>
        </div>
      </AppShell>
    );
  }

  const { topic, allTopics } = result;
  const currentIdx = allTopics.findIndex((t) => t.id === topicId);
  const prevTopic = currentIdx > 0 ? allTopics[currentIdx - 1] : null;
  const nextTopic = currentIdx < allTopics.length - 1 ? allTopics[currentIdx + 1] : null;
  const progress = ((currentIdx + 1) / allTopics.length) * 100;

  const handleMarkComplete = () => {
    setCompleted(true);
    fireXP(15, `"${topic.title}" completed!`);
    if (session?.accessToken && subjectId && topicId) {
      apiRequest(`/subjects/${subjectId}/topics/${topicId}/complete`, {
        method: 'POST',
        token: session.accessToken,
        body: {},
      }).catch(() => {});
    }
    if (nextTopic) {
      setTimeout(() => navigate(`/app/subjects/${subjectId}/${nextTopic.id}`), 500);
    }
  };

  return (
    <AppShell>
      <div className="pt-8 max-w-3xl">
        {/* Progress bar */}
        <div className="h-1 bg-surface-container rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-primary-container rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Back + breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(`/app/subjects/${subjectId}`)}
            className="flex items-center gap-2 text-zinc-500 hover:text-on-surface transition-colors font-bold text-[11px] uppercase tracking-widest"
          >
            <Icon name="arrow_back" size={16} />
            {subject.title}
          </button>
          <span className="text-zinc-700">›</span>
          <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">
            {currentIdx + 1} / {allTopics.length}
          </span>
        </div>

        {/* Title */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tighter mb-2">{topic.title}</h1>
          <div className="flex items-center gap-3">
            <span className={`font-['Inter'] uppercase tracking-widest text-[10px] font-bold ${subject.color}`}>
              {subject.title}
            </span>
            <span className="text-zinc-700">·</span>
            <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">
              {topic.duration}
            </span>
            {(topic.done || completed) && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-green-400">
                  Completed
                </span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Overview */}
          <div className="bg-surface-container rounded-xl p-8">
            <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-4">Overview</p>
            {content.overview.split('\n\n').map((para) => (
              <p key={para.slice(0, 40)} className="text-on-surface-variant leading-relaxed mb-4 last:mb-0">{para}</p>
            ))}
          </div>

          {/* Key Points */}
          <div className="bg-surface-container rounded-xl p-8">
            <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-4">Key Concepts</p>
            <ul className="space-y-3">
              {content.keyPoints.map((point) => (
                <li key={point.slice(0, 40)} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                  </div>
                  <span className="text-on-surface-variant text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Code Block */}
          <div className="bg-surface-container rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
              <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Example</p>
              <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-600">{content.codeLang}</span>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm text-green-300 font-mono leading-relaxed whitespace-pre">{content.code}</code>
            </pre>
          </div>

          {/* Summary */}
          <div className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="lightbulb" size={18} className="text-primary-container" />
              <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-primary-container">Summary</p>
            </div>
            <p className="text-on-surface-variant leading-relaxed text-sm">{content.summary}</p>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
          <button
            onClick={() => prevTopic && navigate(`/app/subjects/${subjectId}/${prevTopic.id}`)}
            disabled={!prevTopic}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-surface-container hover:bg-surface-container-high text-on-surface"
          >
            <Icon name="arrow_back" size={16} />
            Previous
          </button>

          <button
            onClick={handleMarkComplete}
            disabled={topic.done || completed}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 ${
              topic.done || completed
                ? 'bg-green-500/20 text-green-400 cursor-default'
                : 'bg-primary-container text-white hover:brightness-110'
            }`}
          >
            {topic.done || completed ? (
              <>
                <Icon name="check_circle" size={16} />
                Completed
              </>
            ) : (
              <>
                Mark Complete {nextTopic ? '& Next' : ''}
                <Icon name="arrow_forward" size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
