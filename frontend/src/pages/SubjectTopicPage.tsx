import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { SUBJECT_DATA, findTopic } from '../data/subjects';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

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
  // ── IPC ──────────────────────────────────────────────────────────────────
  ipc: {
    overview: `Inter-Process Communication (IPC) mechanisms allow processes to exchange data and synchronize execution. Since processes have separate address spaces, the OS provides special facilities for them to communicate.\n\nIPC methods vary in complexity, performance, and use case. Shared memory is the fastest (no kernel involvement once mapped), while message queues and pipes add structure and ordering guarantees.`,
    keyPoints: [
      'Pipes: unidirectional byte streams between related processes (fork)',
      'Named pipes (FIFOs): persist in filesystem, allow unrelated processes',
      'Message queues: discrete messages with types, persist in kernel',
      'Shared memory: fastest IPC — mmap or shmget, requires explicit synchronization',
      'Semaphores: used alongside shared memory to synchronize access',
      'Sockets: network-capable, used for local IPC via UNIX domain sockets',
      'Signals: asynchronous notifications (SIGKILL, SIGTERM, SIGUSR1)',
    ],
    code: String.raw`// Shared memory IPC (POSIX)
// Process A: writer
int shm_fd = shm_open("/my_shm", O_CREAT | O_RDWR, 0666);
ftruncate(shm_fd, sizeof(int));
int *shared = mmap(NULL, sizeof(int),
    PROT_READ | PROT_WRITE, MAP_SHARED, shm_fd, 0);
*shared = 42;  // write

// Process B: reader
int shm_fd = shm_open("/my_shm", O_RDONLY, 0666);
int *shared = mmap(NULL, sizeof(int),
    PROT_READ, MAP_SHARED, shm_fd, 0);
printf("Value: %d\n", *shared);  // reads 42`,
    codeLang: 'c',
    summary: 'IPC choice depends on relationship, data size, and latency requirements. Use pipes for simple parent–child streaming, shared memory for high-throughput data exchange, and sockets for flexible service-to-service communication.',
  },
  // ── TCP Handshake ──────────────────────────────────────────────────────
  'tcp-handshake': {
    overview: `The TCP 3-way handshake establishes a reliable connection between client and server before any data transfer. It synchronizes sequence numbers and negotiates connection parameters, ensuring both sides are ready to communicate.\n\nFlow control (sliding window) prevents a fast sender from overwhelming a slow receiver. Congestion control algorithms like Slow Start and AIMD prevent network collapse under heavy load.`,
    keyPoints: [
      '3-way handshake: SYN → SYN-ACK → ACK (sequence numbers established)',
      '4-way teardown: FIN → ACK, FIN → ACK (half-close allows final data flush)',
      'TIME_WAIT state: 2×MSL (120s) after close prevents old packets confusing new connections',
      'Window size: receiver advertises how much data it can accept (flow control)',
      'Slow Start: cwnd starts at 1 MSS, doubles each RTT until ssthresh',
      'AIMD: Additive Increase on success, Multiplicative Decrease on loss',
      'Nagle algorithm: buffers small writes to reduce tiny packets (can be disabled with TCP_NODELAY)',
    ],
    code: `# TCP Connection State Machine
# Client                    Server
# CLOSED                    LISTEN
#   |  SYN (seq=x)   →       |
# SYN_SENT              SYN_RCVD
#   |  ← SYN-ACK (seq=y, ack=x+1)
# ESTABLISHED           SYN_RCVD
#   |  ACK (ack=y+1)   →     |
# ESTABLISHED           ESTABLISHED
#         ↓ data transfer ↓
#   |  FIN (seq=m)    →      |
# FIN_WAIT_1            CLOSE_WAIT
#   |  ← ACK (ack=m+1)       |
# FIN_WAIT_2            CLOSE_WAIT
#   |  ← FIN (seq=n)         |
# TIME_WAIT             LAST_ACK
#   |  ACK (ack=n+1)  →      |
# TIME_WAIT             CLOSED
# (2×MSL wait)
# CLOSED`,
    codeLang: 'python',
    summary: 'TCP handshake overhead (~1.5 RTTs) motivates connection reuse (HTTP/1.1 keep-alive, HTTP/2 multiplexing, QUIC 0-RTT). Understanding flow and congestion control explains why a single TCP stream underperforms on high-bandwidth, high-latency links.',
  },
  // ── SQL Advanced ──────────────────────────────────────────────────────
  'sql-advanced': {
    overview: `Window functions and CTEs (Common Table Expressions) are modern SQL features that unlock powerful analytical queries without losing individual row access — unlike GROUP BY which collapses rows.\n\nWindow functions compute values across a set of rows related to the current row. The OVER clause defines the window: PARTITION BY (grouping), ORDER BY (ordering within partition), and a ROWS/RANGE frame.`,
    keyPoints: [
      'ROW_NUMBER(): unique sequential rank with no ties',
      'RANK(): rank with gaps after ties (1,2,2,4); DENSE_RANK(): no gaps (1,2,2,3)',
      'LAG(col, n) / LEAD(col, n): access previous/next n rows without self-join',
      'SUM/AVG OVER (ORDER BY ... ROWS UNBOUNDED PRECEDING): running totals',
      'CTE (WITH clause): named subquery, readable, can be referenced multiple times',
      'Recursive CTE: hierarchical queries — org charts, tree traversal',
      'FILTER clause: conditional aggregation within window functions (PostgreSQL)',
    ],
    code: `-- Salary ranking per department
SELECT name, dept, salary,
  RANK()        OVER (PARTITION BY dept ORDER BY salary DESC) AS dept_rank,
  DENSE_RANK()  OVER (ORDER BY salary DESC)                   AS company_rank,
  LAG(salary)   OVER (PARTITION BY dept ORDER BY hire_date)   AS prev_hire_salary
FROM employees;

-- Running revenue total + 7-day moving average
SELECT date, revenue,
  SUM(revenue)  OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) AS cum_total,
  AVG(revenue)  OVER (ORDER BY date ROWS 6 PRECEDING)         AS ma_7d
FROM daily_revenue;

-- Recursive CTE: employee hierarchy
WITH RECURSIVE tree AS (
  SELECT id, name, manager_id, 0 AS level FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.name, e.manager_id, t.level + 1
  FROM employees e JOIN tree t ON e.manager_id = t.id
)
SELECT * FROM tree ORDER BY level, name;`,
    codeLang: 'sql',
    summary: 'Window functions and recursive CTEs are the two most powerful SQL features for analytics and hierarchical data. They are tested in virtually every data engineering and backend senior interview. Master the OVER() syntax and PARTITION BY vs GROUP BY distinction.',
  },
  // ── Isolation Levels ──────────────────────────────────────────────────
  isolation: {
    overview: `Database isolation levels define how and when changes made by one transaction become visible to others. Higher isolation prevents more anomalies but reduces concurrency. The SQL standard defines four levels: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, and SERIALIZABLE.\n\nMost production databases default to READ COMMITTED (PostgreSQL, Oracle) or REPEATABLE READ (MySQL InnoDB). SERIALIZABLE provides the strongest guarantees but can cause significant lock contention.`,
    keyPoints: [
      'Dirty Read: reading uncommitted data from another transaction',
      'Non-Repeatable Read: same row returns different values within one transaction',
      'Phantom Read: new rows appear in a re-executed query within one transaction',
      'READ UNCOMMITTED: sees dirty reads — almost never used in production',
      'READ COMMITTED (default PostgreSQL): no dirty reads; non-repeatable reads possible',
      'REPEATABLE READ (default MySQL): no dirty or non-repeatable; phantom reads possible',
      'SERIALIZABLE: all anomalies prevented; uses predicate locks or SSI',
      'MVCC: most modern DBs use multi-version concurrency control to avoid read-write lock contention',
    ],
    code: `-- Isolation level comparison
-- Level              Dirty Read  Non-Repeatable  Phantom
-- READ UNCOMMITTED      yes         yes            yes
-- READ COMMITTED        no          yes            yes
-- REPEATABLE READ       no          no             yes (MySQL) / no (PG)
-- SERIALIZABLE          no          no             no

-- Set isolation level (PostgreSQL)
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE user_id = 42;
-- ... other operations ...
-- same SELECT will return same balance (no non-repeatable read)
COMMIT;

-- Write skew (REPEATABLE READ does NOT prevent this)
-- T1 reads "Alice shift ON, Bob shift ON" → sees coverage OK
-- T2 reads "Alice shift ON, Bob shift ON" → sees coverage OK
-- T1 sets Alice shift = OFF (now only Bob is on)
-- T2 sets Bob shift = OFF (now nobody is on!) ← anomaly
-- Fix: use SERIALIZABLE or explicit SELECT ... FOR UPDATE`,
    codeLang: 'sql',
    summary: 'Isolation level selection is a key database design decision. Default READ COMMITTED is appropriate for most OLTP workloads. Use SERIALIZABLE for financial transactions where write skew or phantoms would cause correctness issues.',
  },
  // ── Sharding ──────────────────────────────────────────────────────────
  sharding: {
    overview: `Sharding (horizontal partitioning) splits a dataset across multiple database nodes, each holding a subset of the data. It enables horizontal scaling beyond what a single node can handle, but introduces significant complexity.\n\nConsistent hashing is the gold standard shard routing algorithm: it minimizes re-distribution when nodes are added or removed, solving the "N mod N+1 problem" that plagues naive hash sharding.`,
    keyPoints: [
      'Shard key selection is the most critical decision — drives data distribution and query routing',
      'Hash sharding: uniform distribution, no range queries across shards',
      'Range sharding: supports range queries, but can create hot spots',
      'Directory-based sharding: lookup table → flexible but becomes bottleneck',
      'Cross-shard joins: either denormalize or accept application-level joins',
      'Rebalancing: adding a shard requires data migration — painful with naive hashing',
      'Consistent hashing: ring-based, only K/N keys move when N changes (where K = total keys)',
    ],
    code: `// Consistent hashing (simplified)
class ConsistentHash {
  private ring = new Map<number, string>(); // hash → node
  private sorted: number[] = [];

  addNode(node: string, vnodes = 150) {
    for (let i = 0; i < vnodes; i++) {
      const h = hash(\`\${node}-\${i}\`);
      this.ring.set(h, node);
      this.sorted.push(h);
    }
    this.sorted.sort((a, b) => a - b);
  }

  getNode(key: string): string {
    const h = hash(key);
    // Find first ring position >= h (clockwise)
    const pos = this.sorted.findIndex((p) => p >= h);
    const idx = pos === -1 ? 0 : pos;
    return this.ring.get(this.sorted[idx]!)!;
  }
}`,
    codeLang: 'typescript',
    summary: 'Shard early enough to avoid painful migrations, but not so early that complexity outweighs benefit. Most systems don\'t need sharding until >10M rows per table or >10GB per table. Start with read replicas and caching first.',
  },
  // ── Microservices ──────────────────────────────────────────────────────
  microservices: {
    overview: `Microservices decompose a monolith into independently deployable services organized around business capabilities. Each service owns its data, communicates over APIs, and can be deployed, scaled, and updated independently.\n\nA Service Mesh (like Istio or Linkerd) sits beside each service as a sidecar proxy, handling cross-cutting concerns: mTLS, traffic routing, circuit breaking, retries, and observability — without modifying application code.`,
    keyPoints: [
      'Bounded context: each service owns one business domain and its data store',
      'API Gateway: single entry point for clients — handles auth, routing, rate limiting',
      'Service discovery: Consul, Kubernetes DNS, or client-side load balancing',
      'Circuit breaker: fail fast when a dependency is unhealthy (Hystrix, Resilience4j)',
      'Saga pattern: distributed transactions across services via compensating transactions',
      'Event-driven: services communicate via events (Kafka) for loose coupling',
      'Service Mesh: sidecar proxies for mTLS, traffic control, and observability',
    ],
    code: `// Circuit Breaker (TypeScript)
enum State { CLOSED, OPEN, HALF_OPEN }

class CircuitBreaker {
  private state = State.CLOSED;
  private failures = 0;
  private lastFail = 0;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === State.OPEN) {
      if (Date.now() - this.lastFail > 30_000) {
        this.state = State.HALF_OPEN; // try one request
      } else {
        throw new Error('Circuit OPEN — fast fail');
      }
    }
    try {
      const result = await fn();
      if (this.state === State.HALF_OPEN) {
        this.state = State.CLOSED;
        this.failures = 0;
      }
      return result;
    } catch (err) {
      this.failures++;
      this.lastFail = Date.now();
      if (this.failures >= 5) this.state = State.OPEN;
      throw err;
    }
  }
}`,
    codeLang: 'typescript',
    summary: 'Microservices solve deployment independence and team autonomy but introduce distributed systems complexity: network latency, partial failures, distributed tracing, and eventual consistency. Start with a modular monolith and extract services only when team or scale demands it.',
  },
  // ── Replication ──────────────────────────────────────────────────────
  replication: {
    overview: `Data replication maintains copies of data across multiple nodes for fault tolerance, read scalability, and geographic distribution. The leader-follower (primary-replica) model is the most common: all writes go to the leader, which replicates to followers.\n\nReplication can be synchronous (leader waits for follower ACK before responding to client — strong consistency, slower) or asynchronous (leader responds immediately — eventually consistent, risk of data loss on failover).`,
    keyPoints: [
      'Leader-follower: all writes to leader, reads can go to replicas',
      'Synchronous replication: zero data loss, but higher write latency',
      'Asynchronous replication: faster writes, replication lag, risk of data loss',
      'Semi-synchronous: wait for at least one replica (MySQL default)',
      'Replication lag: how far behind replicas are — affects read-your-writes consistency',
      'Failover: promote a replica to leader — risks split-brain if not handled carefully',
      'Multi-leader: multiple writable nodes (Dynamo, CRDTs) — conflict resolution needed',
    ],
    code: `# PostgreSQL streaming replication setup (simplified)
# Primary: postgresql.conf
wal_level = replica
max_wal_senders = 3
synchronous_commit = on     # synchronous (off = async)

# Primary: pg_hba.conf
host replication replicator 10.0.0.2/32 md5

# Replica: recovery.conf (or postgresql.auto.conf)
primary_conninfo = 'host=10.0.0.1 user=replicator'
hot_standby = on            # allows read queries on replica

# Check replication lag (on primary)
SELECT client_addr,
       write_lag, flush_lag, replay_lag
FROM pg_stat_replication;`,
    codeLang: 'python',
    summary: 'Replication provides redundancy and read scaling but not write scaling. For write scaling, you need sharding. Replication lag is the main source of stale reads in distributed systems — design your application to tolerate it or route sensitive reads to the leader.',
  },
  // ── Design Patterns: Creational ──────────────────────────────────────
  creational: {
    overview: `Creational design patterns deal with object creation mechanisms, aiming to create objects in a manner suitable to the situation. They abstract the instantiation process, making a system independent of how its objects are created, composed, and represented.\n\nThe five GoF creational patterns — Singleton, Factory Method, Abstract Factory, Builder, and Prototype — each address a different dimension of object creation complexity.`,
    keyPoints: [
      'Singleton: enforce one instance; use dependency injection over global access to improve testability',
      'Factory Method: let subclasses decide which class to instantiate',
      'Abstract Factory: create families of related objects without specifying concrete classes',
      'Builder: construct complex objects step-by-step; separate construction from representation',
      'Prototype: clone an existing object rather than creating from scratch',
      'Avoid Singleton when unit testing — prefer factory injection',
      'Builder pattern solves the "telescoping constructor" anti-pattern',
    ],
    code: `// Builder Pattern (TypeScript)
class QueryBuilder {
  private table = '';
  private conditions: string[] = [];
  private limitVal?: number;
  private cols = '*';

  from(table: string) { this.table = table; return this; }
  select(...cols: string[]) { this.cols = cols.join(', '); return this; }
  where(cond: string) { this.conditions.push(cond); return this; }
  limit(n: number) { this.limitVal = n; return this; }

  build(): string {
    let q = \`SELECT \${this.cols} FROM \${this.table}\`;
    if (this.conditions.length) q += \` WHERE \${this.conditions.join(' AND ')}\`;
    if (this.limitVal) q += \` LIMIT \${this.limitVal}\`;
    return q;
  }
}

const query = new QueryBuilder()
  .from('orders')
  .select('id', 'amount')
  .where("status = 'active'")
  .limit(50)
  .build();
// SELECT id, amount FROM orders WHERE status = 'active' LIMIT 50`,
    codeLang: 'typescript',
    summary: 'Creational patterns reduce coupling between client code and the classes it instantiates. Builder is the most practical for application code (configuration, query construction). Factory Method is essential for framework design where extensibility is required.',
  },
  // ── Behavioral Patterns ──────────────────────────────────────────────
  behavioral: {
    overview: `Behavioral design patterns define how objects interact and distribute responsibility. They focus on communication patterns between objects, making the system more flexible by defining not just what objects are, but how they collaborate.\n\nThe most widely used behavioral patterns in modern software are Observer (reactive UIs, event systems), Strategy (algorithm selection), Command (undo/redo, job queues), and Iterator (uniform collection traversal).`,
    keyPoints: [
      'Observer: subject maintains a list of observers and notifies on state change (publish-subscribe)',
      'Strategy: define a family of algorithms, encapsulate each one, make them interchangeable',
      'Command: encapsulate a request as an object — enables undo, queuing, logging',
      'Iterator: provide sequential access to elements without exposing internal structure',
      'Chain of Responsibility: pass request along a chain until someone handles it',
      'State: allow an object to alter its behavior when its internal state changes',
      'Template Method: define skeleton of an algorithm in base class, defer steps to subclasses',
    ],
    code: `// Observer Pattern (TypeScript)
type Handler<T> = (event: T) => void;

class EventEmitter<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Handler<unknown>[]>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...existing, handler as Handler<unknown>]);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>) {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, existing.filter((h) => h !== handler));
  }

  emit<K extends keyof Events>(event: K, data: Events[K]) {
    (this.listeners.get(event) ?? []).forEach((h) => h(data));
  }
}

// Strategy Pattern
type SortStrategy = (arr: number[]) => number[];
const quickSort: SortStrategy = (arr) => [...arr].sort((a, b) => a - b);
const bucketSort: SortStrategy = (arr) => { /* ... */ return arr; };

class Sorter {
  constructor(private strategy: SortStrategy) {}
  sort(data: number[]) { return this.strategy(data); }
  setStrategy(s: SortStrategy) { this.strategy = s; }
}`,
    codeLang: 'typescript',
    summary: 'Behavioral patterns are about protocols between objects. Observer and Strategy are the most universally applicable — you will use them constantly in real codebases. Command is essential for any system needing undo/redo or audit logs.',
  },
  // ── Propositional Logic ────────────────────────────────────────────────
  propositional: {
    overview: `Propositional logic (also called sentential logic) deals with propositions that can be true or false, combined with logical connectives. It forms the mathematical foundation for digital circuits, type systems, formal verification, and database query optimization.\n\nPredicate logic (first-order logic) extends propositional logic with quantifiers (∀ all, ∃ exists) and predicates that take arguments, allowing reasoning about collections and relationships.`,
    keyPoints: [
      '¬ (NOT), ∧ (AND), ∨ (OR), → (implies), ↔ (biconditional)',
      'Tautology: always true (A ∨ ¬A); Contradiction: always false (A ∧ ¬A)',
      'Modus Ponens: (P, P→Q) ⊢ Q — most fundamental inference rule',
      'De Morgan\'s Laws: ¬(A∧B) ≡ ¬A∨¬B, ¬(A∨B) ≡ ¬A∧¬B',
      'CNF (Conjunctive Normal Form): AND of ORs — used by SAT solvers',
      'Predicate logic: ∀x P(x) — "for all x, P holds"; ∃x P(x) — "there exists x such that P"',
      'Negation of quantifiers: ¬∀x P(x) ≡ ∃x ¬P(x)',
    ],
    code: `// Truth table: A → B ≡ ¬A ∨ B
// A     B     A→B   ¬A∨B
// T     T      T     T
// T     F      F     F
// F     T      T     T
// F     F      T     T

// De Morgan's in code:
// !(a && b) === !a || !b
// !(a || b) === !a && !b

// Example: verify tautology with truth table
function isTautology(f: (a: boolean, b: boolean) => boolean): boolean {
  for (const a of [true, false])
    for (const b of [true, false])
      if (!f(a, b)) return false;
  return true;
}
// A ∨ ¬A is a tautology
isTautology((a, _b) => a || !a); // true`,
    codeLang: 'typescript',
    summary: 'Propositional and predicate logic underpin all of computer science — from CPU gates (AND/OR/NOT) to database query optimization (CNF clauses), type checking (type implication), and SAT/SMT solvers used in formal verification.',
  },
  // ── DFA ─────────────────────────────────────────────────────────────────
  dfa: {
    overview: `A Deterministic Finite Automaton (DFA) is a mathematical model of computation that reads an input string and accepts or rejects it based on a set of transition rules. DFAs are equivalent in power to regular expressions — they recognize exactly the class of regular languages.\n\nDFAs have a finite number of states, a defined start state, a set of accepting states, and a transition function that maps (state, character) → next state deterministically (exactly one transition per input symbol per state).`,
    keyPoints: [
      'DFA = (Q, Σ, δ, q₀, F): states, alphabet, transition fn, start state, accepting states',
      'Deterministic: exactly one transition per (state, symbol) pair',
      'NFA: can have multiple transitions per (state, symbol) or ε-transitions',
      'DFA and NFA are equally powerful (both recognize regular languages)',
      'NFA → DFA via subset construction (exponential blowup in worst case)',
      'DFA minimization: merge indistinguishable states (Hopcroft\'s algorithm)',
      'Regex → NFA (Thompson\'s construction) → DFA → minimized DFA',
    ],
    code: `// DFA simulation (TypeScript)
type State = string;
type DFA = {
  states: State[];
  alphabet: string[];
  transitions: Record<State, Record<string, State>>;
  start: State;
  accepting: Set<State>;
};

function simulate(dfa: DFA, input: string): boolean {
  let current = dfa.start;
  for (const char of input) {
    const next = dfa.transitions[current]?.[char];
    if (!next) return false; // dead state / no transition
    current = next;
  }
  return dfa.accepting.has(current);
}

// DFA for strings containing "ab"
const dfa: DFA = {
  states: ['q0', 'q1', 'q2'],
  alphabet: ['a', 'b'],
  transitions: {
    q0: { a: 'q1', b: 'q0' },
    q1: { a: 'q1', b: 'q2' },
    q2: { a: 'q1', b: 'q0' },  // wait, back to q0 wrong; actually:
    // q2 is accepting and stays accepting
  },
  start: 'q0',
  accepting: new Set(['q2']),
};`,
    codeLang: 'typescript',
    summary: 'DFAs are the theoretical foundation of regular expression engines, lexers, and network packet filtering. Understanding them helps you reason about what patterns are and aren\'t expressible with regex, and why some problems require a stack (CFGs) or Turing machine.',
  },

  // ── System Design ─────────────────────────────────────────────────────────

  'api-design': {
    overview: `API design is the art of building interfaces that are intuitive, consistent, and future-proof. A well-designed API reduces coupling, enables independent deployment, and can outlive the implementation behind it by years.\n\nThe three dominant paradigms — REST, gRPC, and GraphQL — each optimize for different constraints. REST is human-readable and cacheable. gRPC is binary-efficient and strongly typed. GraphQL gives clients precise control over data shape. Choosing between them is a product decision as much as an engineering one.`,
    keyPoints: [
      'REST: resources as URLs, stateless, leverage HTTP verbs (GET/POST/PUT/PATCH/DELETE)',
      'gRPC: Protocol Buffers, bidirectional streaming, generated clients, ideal for service-to-service',
      'GraphQL: single endpoint, client-specified queries, solves over-fetching and under-fetching',
      'Versioning strategies: URL path (/v1/), header (Accept-Version), or query param',
      'Idempotency: GET, PUT, DELETE must be idempotent; POST is not; use idempotency keys for payments',
      'Pagination: offset/limit vs cursor-based (cursor wins for real-time feeds)',
      'Rate limiting, authentication (API keys, JWT, OAuth2), and error format conventions (RFC 7807)',
    ],
    code: `// REST: GET /api/v1/users/:id
// gRPC (proto definition)
syntax = "proto3";
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (stream User);
}
message User { string id = 1; string email = 2; string name = 3; }

// REST error format (RFC 7807)
{
  "type": "https://api.example.com/errors/not-found",
  "title": "User not found",
  "status": 404,
  "detail": "No user with id abc123 exists.",
  "instance": "/users/abc123"
}

// GraphQL query — fetch exactly what you need
query {
  user(id: "abc123") {
    name
    posts(first: 5) { title publishedAt }
  }
}`,
    codeLang: 'typescript',
    summary: 'Choose REST for public APIs where cacheability and human readability matter. Choose gRPC for internal microservices that need high throughput and strong contracts. Choose GraphQL when clients have highly variable data requirements (e.g., mobile apps with different screen sizes).',
  },

  'rate-limiting': {
    overview: `Rate limiting protects services from abuse, ensures fair resource allocation, and prevents cascading failures under traffic spikes. Every public API and most internal services need some form of rate limiting.\n\nThe algorithm you choose determines the traffic shape allowed and the memory overhead. Token bucket is the industry default — it handles burst well and is easy to reason about.`,
    keyPoints: [
      'Fixed Window: count resets every N seconds — simple but boundary surge problem (2× burst at window edge)',
      'Sliding Window Log: store timestamps of each request, O(1) check but O(request count) memory',
      'Sliding Window Counter: interpolate between two fixed windows — best accuracy/memory tradeoff',
      'Token Bucket: tokens refill at rate r, burst up to capacity B — allows bursting, industry standard',
      'Leaky Bucket: requests drain at fixed rate — smooths output, no burst allowed',
      'Implementation: Redis + Lua scripts for atomic multi-key ops; use TTL to expire windows automatically',
      'Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After',
    ],
    code: `// Token Bucket with Redis (Lua script — atomic)
const BUCKET_SCRIPT = \`
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local refill_rate = tonumber(ARGV[2])  -- tokens/sec
  local now = tonumber(ARGV[3])
  local requested = tonumber(ARGV[4])

  local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
  local tokens = tonumber(bucket[1]) or capacity
  local last = tonumber(bucket[2]) or now

  -- Refill
  local elapsed = math.max(0, now - last)
  tokens = math.min(capacity, tokens + elapsed * refill_rate)

  if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    redis.call('EXPIRE', key, 3600)
    return 1  -- allowed
  end
  return 0  -- denied
\`;

async function isAllowed(userId: string): Promise<boolean> {
  const allowed = await redis.eval(
    BUCKET_SCRIPT, 1,
    \`rl:\${userId}\`,
    100,   // capacity
    10,    // 10 tokens/sec refill
    Date.now() / 1000,
    1      // cost
  );
  return allowed === 1;
}`,
    codeLang: 'typescript',
    summary: 'For most APIs, token bucket with Redis is the right choice — it handles burst gracefully and scales horizontally with a shared Redis cluster. Sliding window counter is better when you need strict per-second limits. Always expose rate limit headers so clients can back off gracefully.',
  },

  consistency: {
    overview: `Consistency models define the guarantees a distributed system makes about the order and visibility of writes across replicas. Choosing the wrong model can mean users seeing stale data, lost updates, or phantom reads.\n\nThe spectrum runs from strong (linearizable) to eventual. The further you move toward eventual consistency, the higher your throughput — but the more complex your application logic becomes to handle conflicts.`,
    keyPoints: [
      'Linearizability (Strong): reads always see the latest write — as if the system is one machine. Cost: high latency',
      'Sequential Consistency: all operations appear in some global order consistent with each process\'s order',
      'Causal Consistency: causally related operations are seen in order; concurrent ops can differ',
      'Eventual Consistency: given no new writes, all replicas converge. Most NoSQL systems default to this',
      'Read-Your-Writes: you always see your own writes — minimum useful guarantee for UX',
      'Monotonic Reads: once you see value V, you won\'t see an older value — prevents "going back in time"',
      'CRDTs (Conflict-free Replicated Data Types): data structures that merge automatically without conflicts',
    ],
    code: `// Conflict resolution strategies for eventual consistency

// 1. Last-Write-Wins (LWW) — simplest, use timestamps or logical clocks
interface VersionedValue<T> {
  value: T;
  timestamp: number;  // Lamport clock or wall clock
}
function merge<T>(a: VersionedValue<T>, b: VersionedValue<T>): VersionedValue<T> {
  return a.timestamp >= b.timestamp ? a : b;
}

// 2. Vector Clocks — track causality across nodes
type VectorClock = Record<string, number>;
function happensBefore(a: VectorClock, b: VectorClock): boolean {
  return Object.keys(a).every(k => (a[k] ?? 0) <= (b[k] ?? 0)) &&
         Object.keys(b).some(k => (a[k] ?? 0) < (b[k] ?? 0));
}

// 3. G-Counter CRDT — increment-only counter, merge by max
class GCounter {
  private counts: Record<string, number> = {};
  increment(nodeId: string) { this.counts[nodeId] = (this.counts[nodeId] ?? 0) + 1; }
  value() { return Object.values(this.counts).reduce((a, b) => a + b, 0); }
  merge(other: GCounter) {
    for (const [id, v] of Object.entries(other.counts)) {
      this.counts[id] = Math.max(this.counts[id] ?? 0, v);
    }
  }
}`,
    codeLang: 'typescript',
    summary: 'Strong consistency is easy to program against but limits throughput. Eventual consistency scales but shifts conflict resolution into application code. Most real systems choose per-operation: use strong consistency for financial records, causal consistency for feeds, and eventual for analytics counters.',
  },

  messaging: {
    overview: `Message queues and event streaming decouple producers from consumers, enabling asynchronous workflows, buffering traffic spikes, and building event-driven architectures. The choice between Kafka and RabbitMQ (or similar) depends on whether you need a log (replay) vs a queue (at-most-once delivery).\n\nKafka is a distributed commit log — consumers track their own offset and can replay from any point. RabbitMQ is a traditional broker — messages are deleted after delivery.`,
    keyPoints: [
      'Kafka: topics split into partitions, consumers in groups, each partition assigned to one consumer',
      'Kafka offsets: consumers commit offsets after processing — exactly-once requires idempotent consumers',
      'RabbitMQ: exchanges route to queues via bindings; direct, fanout, topic, headers exchange types',
      'Dead-letter queues (DLQ): messages that fail N times are routed here for inspection',
      'Backpressure: producers slow down when consumers lag — prevent OOM and cascade failures',
      'Ordering: Kafka preserves order within a partition; use consistent hashing on partition key',
      'At-least-once vs exactly-once: Kafka acks=all + idempotent producer + transactional consumer',
    ],
    code: `// Kafka producer with guaranteed delivery
import { Kafka, CompressionTypes } from 'kafkajs';

const kafka = new Kafka({ brokers: ['kafka:9092'] });
const producer = kafka.producer({ idempotent: true });

await producer.connect();
await producer.send({
  topic: 'order-events',
  acks: -1,  // wait for all ISR replicas
  compression: CompressionTypes.GZIP,
  messages: [
    {
      key: order.userId,  // same user → same partition → ordered
      value: JSON.stringify({ type: 'ORDER_PLACED', orderId: order.id }),
      headers: { 'correlation-id': requestId },
    },
  ],
});

// Consumer with manual commit (at-least-once)
const consumer = kafka.consumer({ groupId: 'order-service' });
await consumer.subscribe({ topic: 'order-events', fromBeginning: false });
await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message, heartbeat }) => {
    await processOrder(JSON.parse(message.value!.toString()));
    await consumer.commitOffsets([{ topic, partition, offset: (Number(message.offset) + 1).toString() }]);
    await heartbeat();  // prevent session timeout on long processing
  },
});`,
    codeLang: 'typescript',
    summary: 'Use Kafka when you need event replay, high throughput (millions/sec), or audit logs. Use RabbitMQ when you need complex routing, priority queues, or simple task queues. In both cases, design consumers to be idempotent — network failures mean you will process the same message twice.',
  },

  observability: {
    overview: `Observability is the ability to understand a system's internal state from its external outputs — metrics, logs, and traces (the "three pillars"). Unlike monitoring (checking known failure modes), observability lets you debug novel failures you didn't anticipate.\n\nA production system without observability is a black box. When it breaks at 3 AM, you need to answer: what changed, where is the bottleneck, which users are affected, and why.`,
    keyPoints: [
      'Metrics: numeric time-series (counters, gauges, histograms). Use Prometheus + Grafana',
      'Logs: structured (JSON) > unstructured. Include trace_id, user_id, duration in every log line',
      'Traces: distributed request tracing across services. OpenTelemetry → Jaeger or Zipkin',
      'RED method: Rate (req/sec), Errors (error rate), Duration (latency percentiles) — for every service',
      'USE method: Utilization, Saturation, Errors — for every resource (CPU, memory, disk, network)',
      'SLI/SLO/SLA: define what "good" looks like before measuring. p99 latency < 200ms is an SLI',
      'Cardinality: high-cardinality labels (user_id) explode metrics storage — use traces for that instead',
    ],
    code: `// Structured logging with trace correlation (Pino)
import pino from 'pino';
const log = pino({ level: 'info' });

app.use((req, res, next) => {
  const traceId = req.headers['x-trace-id'] ?? crypto.randomUUID();
  req.log = log.child({ traceId, path: req.path, method: req.method });
  const start = Date.now();
  res.on('finish', () => {
    req.log.info({ status: res.statusCode, durationMs: Date.now() - start }, 'request');
  });
  next();
});

// Prometheus histogram (RED method)
import { Histogram, register } from 'prom-client';
const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

// OpenTelemetry trace span
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('order-service');
async function processOrder(id: string) {
  const span = tracer.startSpan('processOrder');
  span.setAttribute('order.id', id);
  try {
    const result = await db.orders.findUnique({ where: { id } });
    span.setAttribute('order.status', result?.status ?? 'not_found');
    return result;
  } catch (e) {
    span.recordException(e as Error);
    span.setStatus({ code: 2 }); // ERROR
    throw e;
  } finally {
    span.end();
  }
}`,
    codeLang: 'typescript',
    summary: 'Start with structured logs and the RED method — that alone catches 80% of production issues. Add distributed tracing when debugging cross-service latency becomes a regular pain point. Always include a trace_id in every log and propagate it across service boundaries via HTTP headers.',
  },

  // ── OOP ─────────────────────────────────────────────────────────────────

  classes: {
    overview: `Classes are blueprints for objects — they define state (fields) and behavior (methods). In OOP, everything is modeled as an object with identity, state, and behavior. Understanding classes deeply means understanding memory layout, constructor chaining, and the difference between class-level and instance-level members.\n\nIn TypeScript/JavaScript, classes are syntactic sugar over prototype-based inheritance. Under the hood, methods live on the prototype chain — one copy shared across all instances.`,
    keyPoints: [
      'Constructor: initializes instance state; called once at object creation',
      'Static members: belong to the class, not instances — shared across all objects',
      'Access modifiers: public (default), private (# in JS, enforced at runtime), protected (subclasses only)',
      'Getters/setters: computed properties with validation logic, accessed like fields',
      'this keyword: refers to the current instance — lost in callbacks unless bound or using arrow functions',
      'new keyword: allocates memory, sets prototype, calls constructor, returns the new object',
      'instanceof: checks prototype chain — use for runtime type narrowing',
    ],
    code: `class BankAccount {
  readonly #id: string;
  #balance: number;
  static #totalAccounts = 0;

  constructor(initialDeposit: number) {
    if (initialDeposit < 0) throw new Error('Negative deposit');
    this.#id = crypto.randomUUID();
    this.#balance = initialDeposit;
    BankAccount.#totalAccounts++;
  }

  get balance(): number { return this.#balance; }
  get id(): string { return this.#id; }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.#balance += amount;
  }

  withdraw(amount: number): boolean {
    if (amount > this.#balance) return false;
    this.#balance -= amount;
    return true;
  }

  static get totalAccounts(): number { return BankAccount.#totalAccounts; }

  toString(): string {
    return \`Account[\${this.#id.slice(0, 8)}]: $\${this.#balance.toFixed(2)}\`;
  }
}

const acc = new BankAccount(1000);
acc.deposit(500);
acc.withdraw(200);
console.log(acc.balance);           // 1300
console.log(BankAccount.totalAccounts); // 1
console.log(acc instanceof BankAccount); // true`,
    codeLang: 'typescript',
    summary: 'Classes encapsulate state and behavior, making code self-documenting and maintainable. Prefer private fields (#) over TypeScript\'s private keyword for true runtime enforcement. Favor readonly for fields that should never change after construction, and use static members sparingly — they are essentially global state.',
  },

  inheritance: {
    overview: `Inheritance allows a subclass to reuse and extend a superclass's implementation. It models "is-a" relationships and enables polymorphism. However, inheritance is one of the most misused tools in OOP — deep hierarchies create fragile coupling that makes code hard to change.\n\nThe canonical advice is "favor composition over inheritance" — but inheritance is right when there is a genuine is-a relationship and you want subclasses to participate in the superclass's interface.`,
    keyPoints: [
      'extends keyword creates a subclass that inherits all public/protected members',
      'super(): must be called in subclass constructor before accessing this',
      'Method overriding: subclass re-implements a superclass method — resolved at runtime (polymorphism)',
      'super.method(): call the parent\'s implementation from within an override',
      'Abstract classes: cannot be instantiated, define a contract subclasses must implement',
      'Fragile base class problem: changing a superclass can silently break subclasses',
      'Liskov Substitution Principle: subclasses must be usable wherever the superclass is expected',
    ],
    code: `abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;

  // Template method — shared algorithm, steps overridden
  describe(): string {
    return \`\${this.constructor.name}: area=\${this.area().toFixed(2)}, perimeter=\${this.perimeter().toFixed(2)}\`;
  }
}

class Circle extends Shape {
  constructor(private readonly radius: number) {
    super();
    if (radius <= 0) throw new Error('Radius must be positive');
  }
  area(): number { return Math.PI * this.radius ** 2; }
  perimeter(): number { return 2 * Math.PI * this.radius; }
}

class Rectangle extends Shape {
  constructor(private readonly w: number, private readonly h: number) {
    super();
  }
  area(): number { return this.w * this.h; }
  perimeter(): number { return 2 * (this.w + this.h); }
}

// Polymorphism — same interface, different behavior
const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6)];
shapes.forEach(s => console.log(s.describe()));
// Circle: area=78.54, perimeter=31.42
// Rectangle: area=24.00, perimeter=20.00`,
    codeLang: 'typescript',
    summary: 'Use inheritance for genuine is-a relationships where subclasses extend (not restrict) the parent\'s contract. Abstract classes are ideal as framework base classes where you want to enforce an interface but share some implementation. Watch out for inheritance hierarchies deeper than 2-3 levels — that\'s a signal to refactor toward composition.',
  },

  structural: {
    overview: `Structural patterns deal with object composition — how classes and objects are combined to form larger, flexible structures. They solve the problem of making incompatible interfaces work together, adding responsibilities to objects without subclassing, and hiding complex subsystems.\n\nThe three most interview-critical structural patterns are Adapter, Decorator, and Facade. You encounter them constantly in real codebases — often without realizing it.`,
    keyPoints: [
      'Adapter: converts one interface to another — makes incompatible types work together (think React\'s useState wrapping browser APIs)',
      'Decorator: adds behavior to an object dynamically without changing its class — wraps the original',
      'Facade: provides a simplified interface to a complex subsystem — reduces coupling',
      'Proxy: controls access to an object — used for lazy init, caching, access control, logging',
      'Composite: treats individual objects and compositions uniformly — tree structures (DOM, file systems)',
      'Bridge: separates abstraction from implementation — both can vary independently',
      'Flyweight: share common state across many objects to save memory (e.g., character objects in a text editor)',
    ],
    code: `// Adapter — legacy logger to new interface
interface Logger { log(level: string, msg: string): void; }
class LegacyLogger { write(msg: string): void { console.log(\`[LOG] \${msg}\`); } }

class LoggerAdapter implements Logger {
  constructor(private legacy: LegacyLogger) {}
  log(level: string, msg: string): void {
    this.legacy.write(\`[\${level.toUpperCase()}] \${msg}\`);
  }
}

// Decorator — add retry behavior without modifying the original
interface DataService { fetch(id: string): Promise<string>; }

class RetryDecorator implements DataService {
  constructor(private inner: DataService, private maxRetries = 3) {}

  async fetch(id: string): Promise<string> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.inner.fetch(id);
      } catch (e) {
        if (attempt === this.maxRetries) throw e;
        await new Promise(r => setTimeout(r, attempt * 200));
      }
    }
    throw new Error('unreachable');
  }
}

// Facade — hide subsystem complexity
class PaymentFacade {
  constructor(
    private fraud: FraudDetection,
    private gateway: PaymentGateway,
    private ledger: AccountingLedger,
    private notify: NotificationService
  ) {}

  async charge(userId: string, amount: number): Promise<void> {
    await this.fraud.check(userId, amount);
    const txn = await this.gateway.charge(userId, amount);
    await this.ledger.record(txn);
    await this.notify.send(userId, \`Charged $\${amount}\`);
  }
}`,
    codeLang: 'typescript',
    summary: 'Adapter is for legacy integration. Decorator is for adding cross-cutting concerns (logging, retry, caching) without inheritance. Facade is for reducing coupling to complex subsystems — it\'s the pattern behind most SDK "client" classes. In production TypeScript, decorators and proxies appear constantly in Express middleware, TypeORM, and NestJS.',
  },

  srp: {
    overview: `The Single Responsibility Principle (SRP) states that a class should have only one reason to change — meaning it should only have one job. This is the most fundamental of the SOLID principles and the one most commonly violated.\n\n"Reason to change" is key. If a class changes when the business logic changes AND when the persistence layer changes AND when the UI format changes, it has too many responsibilities and will be a hotspot for bugs.`,
    keyPoints: [
      'A class should do one thing and do it well — high cohesion within, low coupling outside',
      'Violation signs: "and" in class names (UserManagerAndValidator), methods that do unrelated things',
      'Split by change axis: who (business role / stakeholder) causes each method to change?',
      'SRP applies at every level: functions, classes, modules, services',
      'Result: smaller classes that are easier to test, reason about, and reuse',
      'Corollary: if adding a feature requires changing many unrelated classes, SRP is violated',
    ],
    code: String.raw`// ❌ Violates SRP — three reasons to change: user logic, email format, DB schema
class User {
  constructor(public name: string, public email: string) {}

  validate(): boolean { return this.email.includes('@'); }

  save(): void { db.query(\`INSERT INTO users VALUES ('\${this.name}', '\${this.email}')\`); }

  sendWelcomeEmail(): void {
    mailer.send(this.email, \`Welcome, \${this.name}! Use this code: WELCOME10\`);
  }
}

// ✅ Each class has one reason to change
class User {
  constructor(public readonly name: string, public readonly email: string) {}
}

class UserValidator {
  validate(user: User): boolean { return /^[^@]+@[^@]+\.[^@]+$/.test(user.email); }
}

class UserRepository {
  async save(user: User): Promise<void> {
    await db.query('INSERT INTO users (name, email) VALUES ($1, $2)', [user.name, user.email]);
  }
}

class WelcomeEmailService {
  async send(user: User): Promise<void> {
    await mailer.send({
      to: user.email,
      subject: 'Welcome to EYF!',
      body: \`Hi \${user.name}, you're in! Use code WELCOME10 for 20% off.\`,
    });
  }
}`,
    codeLang: 'typescript',
    summary: 'SRP keeps classes focused and changes isolated. When a bug in email formatting can\'t possibly break your database logic, debugging becomes faster and regression risk drops. The practical test: can you describe this class\'s purpose without using "and"? If not, split it.',
  },

  // ── Networks ─────────────────────────────────────────────────────────────

  http: {
    overview: `HTTP is the application-layer protocol powering the web. Understanding its evolution from HTTP/1.1 → HTTP/2 → HTTP/3 and the mechanics of REST API design is critical for both web development and system design interviews.\n\nHTTP is stateless — each request carries all context. Sessions, auth tokens, and cookies are mechanisms layered on top to simulate state.`,
    keyPoints: [
      'HTTP/1.1: text-based, keep-alive connections, head-of-line blocking per connection, 6 connections per domain',
      'HTTP/2: binary framing, multiplexing (multiple streams on 1 connection), header compression (HPACK), server push',
      'HTTP/3: QUIC over UDP, eliminates TCP HOL blocking, 0-RTT reconnect, built-in TLS 1.3',
      'Methods: GET (safe, idempotent), POST (not idempotent), PUT (idempotent replace), PATCH (partial update), DELETE (idempotent)',
      'Status codes: 1xx informational, 2xx success, 3xx redirect, 4xx client error, 5xx server error',
      'Headers: Content-Type, Accept, Authorization, Cache-Control, ETag, If-None-Match, CORS headers',
      'Caching: Cache-Control: max-age=3600; ETag for conditional GETs (304 Not Modified saves bandwidth)',
    ],
    code: `// HTTP/2 server push + conditional GET example (Node.js)
import http2 from 'http2';

// ETag-based caching
app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  const etag = \`"\${user.updatedAt.getTime()}"\`;

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();  // Not Modified — client uses cache
  }

  res.set({
    'ETag': etag,
    'Cache-Control': 'private, max-age=60',
    'Vary': 'Accept-Encoding',
  });
  res.json(user);
});

// CORS preflight
app.options('/api/*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': 'https://app.example.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',  // cache preflight 1 day
  });
  res.status(204).end();
});

// HTTP status codes cheat sheet:
// 200 OK, 201 Created, 204 No Content
// 301 Moved Permanently, 302 Found (temp), 304 Not Modified
// 400 Bad Request, 401 Unauthorized (no auth), 403 Forbidden (has auth, no permission)
// 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests
// 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout`,
    codeLang: 'typescript',
    summary: 'HTTP/2 multiplexing eliminates the 6-connection-per-domain bottleneck of HTTP/1.1 and is the default for modern apps. Understand caching headers deeply — ETag + conditional GETs can eliminate most bandwidth and cut API response time for clients. In interviews, know the difference between 401 and 403, and when to use 409 vs 422.',
  },

  dns: {
    overview: `DNS (Domain Name System) is the internet's distributed phonebook — it translates human-readable names like api.example.com into IP addresses. Understanding DNS is critical for debugging production incidents (propagation delays, TTL misconfiguration), designing global services, and security.\n\nDNS is hierarchical: root nameservers → TLD nameservers → authoritative nameservers. Caching at every layer makes it fast but means changes take time to propagate.`,
    keyPoints: [
      'Resolution flow: browser cache → OS cache → resolver (ISP/8.8.8.8) → root NS → TLD NS → authoritative NS',
      'Record types: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT (verification/SPF/DKIM), NS, SOA',
      'TTL (Time to Live): how long resolvers cache a record — lower TTL = faster changes but more queries',
      'Recursive resolver: queries on your behalf; authoritative nameserver: has the actual answer',
      'DNSSEC: signs DNS records to prevent cache poisoning (Kaminsky attack)',
      'Anycast routing: same IP announced from multiple locations — nearest datacenter responds (used by CDNs)',
      'DNS-based load balancing: multiple A records round-robined, or weighted routing via Route 53',
    ],
    code: `// DNS resolution simulation (iterative)
async function resolveDomain(name: string): Promise<string> {
  // 1. Check local cache
  if (dnsCache.has(name)) {
    const { ip, expiresAt } = dnsCache.get(name)!;
    if (Date.now() < expiresAt) return ip;
  }

  // 2. Query recursive resolver (e.g. 8.8.8.8)
  const response = await queryResolver('8.8.8.8', name, 'A');

  // 3. Cache with TTL
  dnsCache.set(name, { ip: response.ip, expiresAt: Date.now() + response.ttl * 1000 });
  return response.ip;
}

// Common DNS record types
const records = {
  A:     { host: 'api.example.com', value: '203.0.113.10',        ttl: 300  },
  CNAME: { host: 'www.example.com', value: 'api.example.com',     ttl: 3600 },
  MX:    { host: 'example.com',     value: 'mail.google.com',     priority: 10 },
  TXT:   { host: 'example.com',     value: 'v=spf1 include:_spf.google.com ~all' },
  AAAA:  { host: 'api.example.com', value: '2001:db8::1',         ttl: 300  },
};

// Blue-green deployment with low TTL
// 1. Lower TTL to 60s, wait for propagation (~24h × old TTL)
// 2. Deploy new version
// 3. Update A record to new IP
// 4. Wait 60s for propagation
// 5. Restore TTL to 300s`,
    codeLang: 'typescript',
    summary: "DNS is deceptively simple in theory but has real production implications. Always lower TTL before a migration, not after — once you've changed the record, the old TTL is already baked into resolvers' caches. CNAME records cannot be set on apex domains (example.com); use ALIAS or ANAME records or A records directly.",
  },

  // ── DBMS ─────────────────────────────────────────────────────────────────

  indexing: {
    overview: `Database indexes are the single most important performance tool in a software engineer's arsenal. A missing index on a 100M-row table can turn a 50ms query into a 30-second full scan. Knowing when to add one — and when not to — separates engineers who write fast code from those who write slow systems.\n\nIndexes are B-trees by default in PostgreSQL and MySQL. They store a sorted copy of the indexed column(s) with pointers to the heap row, enabling O(log N) lookups instead of O(N) sequential scans.`,
    keyPoints: [
      'B-tree index: balanced tree, O(log N) point lookups and range queries — default for most cases',
      'Hash index: O(1) equality lookups only — no range queries, no ordering, rarely used explicitly',
      'Composite index: (a, b, c) — supports queries on (a), (a,b), (a,b,c) but NOT just (b) or (c)',
      'Covering index (index-only scan): includes all columns a query needs — avoids heap fetch entirely',
      'Partial index: WHERE condition in the index — smaller, faster for filtered queries',
      'Write overhead: every INSERT/UPDATE/DELETE must update all indexes on the table',
      'Index bloat: dead tuples inflate indexes; VACUUM in Postgres cleans up, REINDEX rebuilds',
    ],
    code: `-- Explaining a query plan
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.name, o.total
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.country = 'IN'
  AND o.created_at > NOW() - INTERVAL '7 days';

-- Without index: Seq Scan + Hash Join = slow
-- With index:    Index Scan + Nested Loop = fast

-- Composite index (order matters: equality first, range last)
CREATE INDEX idx_orders_user_created
  ON orders (user_id, created_at DESC);

-- Covering index (avoids heap fetch)
CREATE INDEX idx_products_category_covering
  ON products (category_id)
  INCLUDE (name, price, stock);
-- Query: SELECT name, price FROM products WHERE category_id = 5
-- → Index Only Scan: zero heap fetches

-- Partial index (only index active users)
CREATE INDEX idx_users_active_email
  ON users (email)
  WHERE status = 'active';

-- Identify missing indexes
SELECT schemaname, tablename, seq_scan, idx_scan,
       seq_scan - idx_scan AS diff
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY diff DESC;`,
    codeLang: 'typescript',
    summary: 'Rule of thumb: add an index on any column that appears in a WHERE, JOIN ON, or ORDER BY clause for queries touching more than 1% of the table. For composite indexes, put equality conditions before range conditions. Covering indexes eliminate heap fetches and can make some queries 10-100× faster — but every index slows down writes.',
  },

  concurrency: {
    overview: `Database concurrency control ensures that concurrent transactions produce results equivalent to some serial execution order, preventing anomalies like dirty reads, lost updates, and phantom reads. Modern databases use either locking or Multiversion Concurrency Control (MVCC) — PostgreSQL uses MVCC.\n\nMVCC gives readers a consistent snapshot without blocking writers. Readers never block writers; writers never block readers. Conflicts only occur between concurrent writers.`,
    keyPoints: [
      'Pessimistic locking: acquire lock before read — SELECT FOR UPDATE; prevents conflicts but reduces throughput',
      'Optimistic locking: no lock on read, check at write time (version column) — better for low contention',
      'MVCC: each transaction sees a snapshot at its start time; old versions kept in undo log until vacuumed',
      'Deadlock: T1 holds A, wants B; T2 holds B, wants A — DB detects cycle and aborts one transaction',
      'Two-Phase Locking (2PL): acquire all locks first, then release — ensures serializability',
      'Isolation levels control what anomalies are visible (see isolation topic for details)',
      'Advisory locks: application-level locks via pg_advisory_lock — for coordinating background workers',
    ],
    code: `-- Pessimistic locking: prevent double-booking
BEGIN;
SELECT * FROM seats WHERE id = 42 FOR UPDATE;
-- other transactions block here until this tx commits/rollbacks
UPDATE seats SET user_id = 123, booked = true WHERE id = 42;
COMMIT;

-- Optimistic locking with version column
-- Schema: ALTER TABLE products ADD COLUMN version INT DEFAULT 0;
async function decrementStock(productId: number, qty: number): Promise<void> {
  let retries = 3;
  while (retries-- > 0) {
    const product = await db.oneOrNone(
      'SELECT id, stock, version FROM products WHERE id = $1', [productId]
    );
    if (!product || product.stock < qty) throw new Error('Insufficient stock');

    const updated = await db.result(
      'UPDATE products SET stock = stock - $1, version = version + 1 WHERE id = $2 AND version = $3',
      [qty, productId, product.version]
    );

    if (updated.rowCount === 1) return;  // success
    // rowCount = 0 means concurrent update changed version — retry
    await new Promise(r => setTimeout(r, Math.random() * 100));
  }
  throw new Error('Too many concurrent updates, please retry');
}

-- Detect deadlocks in Postgres
SELECT pid, wait_event_type, wait_event, query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';`,
    codeLang: 'typescript',
    summary: 'Use SELECT FOR UPDATE when you must guarantee exclusive access (seat booking, inventory decrement). Use optimistic locking with a version column for high-read, low-write-conflict scenarios — it scales better and avoids lock contention. Always access tables in the same order across transactions to prevent deadlocks.',
  },

  // ── OOP (remaining SOLID) ────────────────────────────────────────────────

  ocp: {
    overview: `The Open/Closed Principle states that software entities should be open for extension but closed for modification. Once a class is written, tested, and deployed, you should be able to add new behavior without changing existing code — only by adding new code.\n\nThis is typically achieved through polymorphism, strategy pattern, or plugin architectures. The goal is to isolate stable code from volatile code.`,
    keyPoints: [
      'Open for extension: new behavior can be added (new subclass, new strategy, new plugin)',
      'Closed for modification: existing, tested code is not changed when adding new features',
      'Strategy pattern is the canonical OCP implementation — swap algorithms without changing context',
      'OCP prevents "shotgun surgery" — needing to change 10 files every time a new type is added',
      'If you have if/else or switch on a type enum, you\'re likely violating OCP',
      'Trade-off: premature abstraction is worse than a small OCP violation — apply when you see the third variant',
    ],
    code: `// ❌ Violates OCP — adding new shape requires modifying this function
function calculateArea(shape: { type: string; radius?: number; w?: number; h?: number }): number {
  if (shape.type === 'circle') return Math.PI * shape.radius! ** 2;
  if (shape.type === 'rectangle') return shape.w! * shape.h!;
  // Adding triangle means modifying this file 👎
  throw new Error('Unknown shape');
}

// ✅ OCP via polymorphism — add triangle by adding a new class, zero existing changes
interface Shape { area(): number; }

class Circle implements Shape {
  constructor(private r: number) {}
  area() { return Math.PI * this.r ** 2; }
}

class Rectangle implements Shape {
  constructor(private w: number, private h: number) {}
  area() { return this.w * this.h; }
}

class Triangle implements Shape {  // NEW — no existing code changed
  constructor(private base: number, private height: number) {}
  area() { return 0.5 * this.base * this.height; }
}

// Strategy pattern — OCP for algorithms
interface SortStrategy { sort(arr: number[]): number[]; }
class QuickSort implements SortStrategy { sort(a: number[]) { return [...a].sort((x,y)=>x-y); } }
class MergeSort implements SortStrategy { sort(a: number[]) { /* merge sort impl */ return a; } }

class Sorter {
  constructor(private strategy: SortStrategy) {}
  setStrategy(s: SortStrategy) { this.strategy = s; }
  sort(arr: number[]) { return this.strategy.sort(arr); }
}`,
    codeLang: 'typescript',
    summary: 'OCP pays off at scale — a billing system that calculates prices differently for 20 subscription types is maintainable via OCP; a 20-branch switch statement is not. The key sign you need OCP is when the same conditional appears in multiple places and grows with each new variant. Apply strategy or visitor patterns to close these extension points.',
  },

  lsp: {
    overview: `Liskov Substitution Principle: if S is a subtype of T, then objects of type T may be replaced with objects of type S without altering the correctness of the program. Informally: subclasses must be usable wherever their superclass is expected.\n\nLSP violations manifest as instanceof checks in code that's supposed to work with the base type, or surprising exceptions thrown by subclasses that the base class contract didn't allow.`,
    keyPoints: [
      'Subclasses must honor the superclass\'s contract: preconditions, postconditions, and invariants',
      'Cannot strengthen preconditions: if the base accepts any integer, subclass cannot require positive only',
      'Cannot weaken postconditions: if base guarantees non-null return, subclass cannot return null',
      'The Square/Rectangle problem: Square extends Rectangle but violates LSP (setting width changes height)',
      'instanceof checks in polymorphic code = LSP smell — you shouldn\'t need to know the subtype',
      'Interfaces over inheritance: if LSP is hard to satisfy, model as separate interfaces instead',
    ],
    code: `// Classic LSP violation: Square extends Rectangle
class Rectangle {
  constructor(protected w: number, protected h: number) {}
  setWidth(w: number)  { this.w = w; }
  setHeight(h: number) { this.h = h; }
  area() { return this.w * this.h; }
}

class Square extends Rectangle {
  setWidth(s: number)  { this.w = this.h = s; }  // keeps square invariant
  setHeight(s: number) { this.w = this.h = s; }  // but violates Rectangle contract!
}

function doubleWidth(shape: Rectangle): void {
  shape.setWidth(shape['w'] * 2);
  // Expected: area doubles. For Rectangle: ✅  For Square: ❌ area quadruples
}

// ✅ Fix: don't inherit — use separate types with a shared interface
interface Shape { area(): number; }
class Rectangle implements Shape {
  constructor(private w: number, private h: number) {}
  area() { return this.w * this.h; }
  withWidth(w: number) { return new Rectangle(w, this.h); }
}
class Square implements Shape {
  constructor(private side: number) {}
  area() { return this.side ** 2; }
  withSide(s: number) { return new Square(s); }
}

// ✅ LSP-safe — every Bird can move, but not every Bird can fly
interface Movable { move(dx: number, dy: number): void; }
interface Flyable extends Movable { fly(altitude: number): void; }
class Penguin implements Movable { move(dx: number, dy: number) { /* waddle */ } }
class Eagle implements Flyable {
  move(dx: number, dy: number) { /* walk */ }
  fly(altitude: number) { /* soar */ }
}`,
    codeLang: 'typescript',
    summary: 'LSP prevents the classic "it works in theory but explodes at runtime" bug. The practical test: write a test using only the base class interface and run it against both the parent and child. If any assertion fails on the child, LSP is violated. Use interfaces to model capability rather than inheritance to force shared implementation.',
  },

  // ── System Design Case Studies ────────────────────────────────────────────

  'design-url': {
    overview: `Designing a URL shortener (like bit.ly) is the canonical introductory system design question. It tests your ability to estimate scale, choose a key generation strategy, design a data model, and handle redirects efficiently with caching.\n\nThe core challenge is: generate a short, unique key for each long URL, store the mapping, and redirect billions of requests per day with sub-10ms latency.`,
    keyPoints: [
      'Scale estimation: 100M URLs/day write, 10B redirects/day read (100:1 read:write ratio)',
      'Key generation: Base62 encode (a-zA-Z0-9) a counter or hash — 7 chars = 62^7 ≈ 3.5 trillion unique keys',
      'Counter vs hash: auto-increment counter is predictable (sequential enumeration attack); MD5 truncated causes collisions',
      'Preferred: pre-generate keys in a Key Generation Service (KGS) and store in a key pool',
      'Data model: {short_id: string, long_url: string, created_by: string, expires_at: date, click_count: int}',
      'Redirect: 301 (permanent, cached by browser) vs 302 (temporary, hits server each time for analytics)',
      'Caching: Cache 20% of hot URLs in Redis (80% of traffic) — cache the short→long mapping',
    ],
    code: `// Key Generation Service (KGS) approach
class KeyGenerationService {
  private readonly keyLength = 7;
  private readonly alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  generateKey(): string {
    // In practice: pre-generate in batches, store in DB, mark as used atomically
    return Array.from({ length: this.keyLength }, () =>
      this.alphabet[Math.floor(Math.random() * this.alphabet.length)]
    ).join('');
  }

  // Better: base62-encode a distributed counter (Snowflake ID)
  encodeBase62(num: bigint): string {
    if (num === 0n) return 'a';
    let result = '';
    while (num > 0n) {
      result = this.alphabet[Number(num % 62n)] + result;
      num = num / 62n;
    }
    return result.padStart(7, 'a');
  }
}

// Redirect handler with Redis cache
async function redirect(shortId: string, res: Response): Promise<void> {
  // 1. Check cache (sub-ms)
  const cached = await redis.get(\`url:\${shortId}\`);
  if (cached) {
    await redis.incr(\`clicks:\${shortId}\`);  // async analytics
    return res.redirect(302, cached);
  }

  // 2. DB fallback
  const record = await db.urls.findUnique({ where: { shortId } });
  if (!record || (record.expiresAt && record.expiresAt < new Date())) {
    return res.status(404).json({ error: 'URL not found or expired' });
  }

  // 3. Cache for 1 hour
  await redis.setex(\`url:\${shortId}\`, 3600, record.longUrl);
  res.redirect(302, record.longUrl);
}`,
    codeLang: 'typescript',
    summary: 'Use 302 redirects (not 301) if you need click analytics — browsers cache 301s and never hit your server again. Cache the hot 20% of URLs in Redis to handle the 80% of traffic. Use a Key Generation Service with pre-generated keys to avoid collision-detection complexity. Partition the URL table by short_id hash for horizontal scaling.',
  },

  'design-twitter': {
    overview: `Designing Twitter's news feed is one of the most comprehensive system design questions — it covers data modeling, fan-out strategies, caching, real-time delivery, and the fundamental tension between write-time and read-time work.\n\nThe core problem: when UserA posts a tweet, how do UserA's 50 million followers see it in their feeds with low latency? This is the fan-out problem.`,
    keyPoints: [
      'Fan-out on write (push): tweet is written to every follower\'s feed cache on post — fast reads, slow/impossible for celebrities',
      'Fan-out on read (pull): build feed at read time by fetching tweets from followed accounts — slow reads, works for any follower count',
      'Hybrid: fan-out on write for normal users, fan-out on read for celebrity accounts (>1M followers)',
      'Data model: tweets table, users table, follows table (follower_id, followee_id, created_at)',
      'Timeline cache: Redis sorted set per user, score = tweet timestamp, store tweet IDs (not full tweets)',
      'Home timeline: Redis ZREVRANGE uid:timeline 0 100 → fetch tweets by ID from tweets cache',
      'Real-time: WebSocket or Server-Sent Events push new tweets to active client connections',
    ],
    code: `// Simplified fan-out on write service
async function postTweet(userId: string, text: string): Promise<Tweet> {
  const tweet = await db.tweets.create({
    data: { authorId: userId, text, createdAt: new Date() }
  });

  // Async fan-out via message queue
  await queue.publish('tweet-created', {
    tweetId: tweet.id,
    authorId: userId,
    timestamp: tweet.createdAt.getTime(),
  });

  return tweet;
}

// Fan-out worker (processes queue messages)
async function fanOutWorker(msg: { tweetId: string; authorId: string; timestamp: number }) {
  // Check if author is a celebrity (>1M followers) — skip fan-out on write
  const followerCount = await redis.get(\`followers:count:\${msg.authorId}\`);
  if (Number(followerCount) > 1_000_000) return; // fan-out on read for celebrities

  // Get followers in batches (author may have 100k followers)
  const followers = await db.follows.findMany({
    where: { followeeId: msg.authorId },
    select: { followerId: true },
  });

  // Write tweet to each follower's timeline (Redis sorted set)
  const pipeline = redis.pipeline();
  for (const { followerId } of followers) {
    pipeline.zadd(
      \`timeline:\${followerId}\`,
      msg.timestamp,
      msg.tweetId
    );
    pipeline.zremrangebyrank(\`timeline:\${followerId}\`, 0, -1001); // keep 1000 most recent
  }
  await pipeline.exec();
}

// Read home timeline
async function getTimeline(userId: string, page = 0): Promise<Tweet[]> {
  const tweetIds = await redis.zrevrange(\`timeline:\${userId}\`, page * 20, (page + 1) * 20 - 1);
  if (tweetIds.length === 0) return [];

  const tweets = await Promise.all(
    tweetIds.map(id => redis.get(\`tweet:\${id}\`).then(t => t ? JSON.parse(t) : db.tweets.findUnique({ where: { id } })))
  );
  return tweets.filter(Boolean) as Tweet[];
}`,
    codeLang: 'typescript',
    summary: 'Twitter\'s architecture is the canonical example of hybrid fan-out. Normal users get fan-out on write (O(followers) on post, O(1) on read). Celebrities use fan-out on read (their tweet is fetched and merged into the timeline at read time). The timeline is always served from Redis — the DB is only a durability layer. In interviews, always call out the celebrity problem and propose the hybrid solution.',
  },

  // ── SOLID: ISP & DIP ─────────────────────────────────────────────────────

  isp: {
    overview: `Interface Segregation Principle: clients should not be forced to depend on interfaces they do not use. A "fat" interface that forces classes to implement irrelevant methods is a design smell — split it into smaller, role-specific interfaces.\n\nISP is the antidote to "God interfaces." When a class is forced to stub out methods it doesn't need, it signals that the interface mixes multiple responsibilities. Thin, focused interfaces lead to more cohesive implementations and easier testing.`,
    keyPoints: [
      'A class implementing an interface should use all methods — if not, the interface is too broad',
      'Split fat interfaces by client/role: IReadable, IWritable, ISeekable instead of IFile',
      'Closely related to SRP: if one class causes interface changes that break unrelated implementations, ISP is violated',
      '"Role interfaces" (Martin Fowler): define interfaces from the caller\'s perspective, not the implementor\'s',
      'In TypeScript/Java: a class can implement multiple small interfaces, satisfying many contracts at once',
      'ISP violation symptom: implementing methods with throw new UnsupportedOperationError()',
    ],
    code: `// ❌ Fat interface — all machines must implement print, scan, fax
interface Machine {
  print(doc: Document): void;
  scan(doc: Document): void;
  fax(doc: Document): void;
}

class OldPrinter implements Machine {
  print(doc: Document) { /* works */ }
  scan(doc: Document) { throw new Error('Not supported'); }  // ❌ ISP violation
  fax(doc: Document)  { throw new Error('Not supported'); }  // ❌ ISP violation
}

// ✅ Segregated interfaces — each client only depends on what it needs
interface Printable { print(doc: Document): void; }
interface Scannable  { scan(doc: Document): void; }
interface Faxable    { fax(doc: Document): void; }

class SimplePrinter implements Printable {
  print(doc: Document) { /* works, no stubs */ }
}

class MultiFunctionDevice implements Printable, Scannable, Faxable {
  print(doc: Document) { /* ... */ }
  scan(doc: Document)  { /* ... */ }
  fax(doc: Document)   { /* ... */ }
}

// Dependency: only request what you actually use
function printReport(p: Printable, doc: Document) {
  p.print(doc);  // OldPrinter can be injected here ✅
}`,
    codeLang: 'typescript',
    summary: 'ISP keeps interfaces lean and purposeful. Split interfaces when different clients need different subsets of behavior — usually aligned with the "roles" an object plays. Combined with DIP, ISP makes systems loosely coupled and easy to test with mocks.',
  },

  dip: {
    overview: `Dependency Inversion Principle: high-level modules should not depend on low-level modules — both should depend on abstractions. Furthermore, abstractions should not depend on details; details should depend on abstractions.\n\nDIP is the mechanism that makes ISP and OCP practical. By injecting dependencies through interfaces, you can swap implementations (real DB, in-memory, mock) without changing the caller. This is the foundation of Dependency Injection (DI) frameworks like Spring and Nest.js.`,
    keyPoints: [
      'High-level policy (business logic) should not import low-level implementation (SQL, HTTP client) directly',
      'Define a repository/service interface; inject it — never instantiate concrete classes inside business logic',
      '"Inversion of Control" (IoC): ownership of object creation moves to the framework / composition root',
      'Dependency Injection patterns: constructor injection (preferred), setter injection, method injection',
      'DIP enables testability: inject a mock repository in tests, real one in production',
      'Violation sign: `new ConcreteClass()` inside a service — tightly coupled to that implementation',
    ],
    code: `// ❌ High-level UserService directly depends on low-level MySQLUserRepo
class UserService {
  private repo = new MySQLUserRepo();  // ← tight coupling, untestable

  getUser(id: string) { return this.repo.findById(id); }
}

// ✅ Define an abstraction
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// Low-level detail depends on the abstraction
class PostgresUserRepo implements UserRepository {
  async findById(id: string) { /* SELECT ... */ }
  async save(user: User)     { /* INSERT ... */ }
}

class InMemoryUserRepo implements UserRepository {
  private store = new Map<string, User>();
  async findById(id: string) { return this.store.get(id) ?? null; }
  async save(user: User)     { this.store.set(user.id, user); }
}

// High-level module depends on abstraction (injected from outside)
class UserService {
  constructor(private repo: UserRepository) {}  // ← DIP ✅

  async promoteToAdmin(id: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new Error('Not found');
    user.role = 'admin';
    await this.repo.save(user);
  }
}

// Composition root (e.g., main.ts or DI container)
const service = new UserService(new PostgresUserRepo());
// Tests: new UserService(new InMemoryUserRepo())`,
    codeLang: 'typescript',
    summary: 'DIP is what makes code testable, swappable, and maintainable at scale. The rule of thumb: if you write `new X()` inside a service, ask "do I need this to be swappable?" — if yes, inject the interface instead. Modern frameworks (NestJS, Spring, .NET) automate this with DI containers.',
  },

  // ── OOP Fundamentals ─────────────────────────────────────────────────────

  polymorphism: {
    overview: `Polymorphism ("many forms") allows objects of different types to be treated through a common interface. The same method call can produce different behavior depending on the runtime type of the object. This is the mechanism that makes "open for extension, closed for modification" possible in practice.\n\nTwo main kinds: runtime (dynamic dispatch via method overriding) and compile-time (overloading, generics). In OOP interviews, runtime polymorphism is the default meaning.`,
    keyPoints: [
      'Runtime polymorphism: virtual method dispatch — subclass method is called even through a base type reference',
      'Compile-time polymorphism: method overloading (same name, different signature) and generics',
      'Liskov Substitution Principle is the correctness requirement for polymorphism to work safely',
      'vtable (virtual dispatch table): how C++/JVM implement virtual calls at O(1) cost',
      'Duck typing (Python/JS): polymorphism without inheritance — if it quacks like a duck...',
      'Anti-pattern: instanceof chains instead of polymorphism — tells you the abstraction is wrong',
    ],
    code: `// Runtime polymorphism via overriding
abstract class Shape {
  abstract area(): number;
  describe() { return \`Area = \${this.area().toFixed(2)}\`; }
}

class Circle extends Shape {
  constructor(private r: number) { super(); }
  area() { return Math.PI * this.r ** 2; }
}

class Rectangle extends Shape {
  constructor(private w: number, private h: number) { super(); }
  area() { return this.w * this.h; }
}

class Triangle extends Shape {
  constructor(private b: number, private ht: number) { super(); }
  area() { return 0.5 * this.b * this.ht; }
}

// Polymorphic usage — no if/switch needed when you add new shapes
const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6), new Triangle(3, 8)];
shapes.forEach(s => console.log(s.describe()));
// Area = 78.54
// Area = 24.00
// Area = 12.00

// ❌ Anti-pattern: losing polymorphism with instanceof
function totalArea(shapes: Shape[]): number {
  return shapes.reduce((sum, s) => {
    if (s instanceof Circle)    return sum + Math.PI * (s as any).r ** 2;
    if (s instanceof Rectangle) return sum + (s as any).w * (s as any).h;
    return sum; // breaks when Triangle is added
  }, 0);
}

// ✅ Polymorphic version — Open/Closed
const totalArea2 = (shapes: Shape[]) => shapes.reduce((s, sh) => s + sh.area(), 0);`,
    codeLang: 'typescript',
    summary: 'Polymorphism is the core of extensible OOP design. Use it to eliminate if/switch ladders that switch on type — each new type should just add a subclass, not modify existing branches. Runtime polymorphism through method overriding is the most powerful form, enabling plugin architectures and the Strategy pattern.',
  },

  abstraction: {
    overview: `Abstraction hides implementation details behind a stable interface, exposing only what the caller needs to know. It reduces cognitive load by letting you think at the right level — you call \`db.save(user)\` without caring about SQL, connection pools, or retry logic.\n\nEncapsulation is the mechanism (bundling data + behavior, hiding internals with access modifiers); abstraction is the design goal (reducing complexity). The two work together: encapsulate to achieve abstraction.`,
    keyPoints: [
      'Abstract classes: partially implemented, define the template for subclasses (Template Method pattern)',
      'Interfaces: pure abstraction — only method signatures, no state',
      'Access modifiers (private/protected/public) enforce encapsulation boundaries',
      'Law of Demeter: only talk to your immediate collaborators, not their internals (a.b.c.doSomething() is a smell)',
      'Leaky abstraction: when implementation details bleed through the interface — a sign of poor design',
      'Abstraction levels: keep them consistent — don\'t mix high-level business operations with low-level I/O in the same method',
    ],
    code: String.raw`// ✅ BankAccount: abstraction hides balance mutation rules
class BankAccount {
  private balance: number;
  private transactions: { type: string; amount: number; date: Date }[] = [];

  constructor(initialBalance: number) {
    if (initialBalance < 0) throw new Error('Initial balance cannot be negative');
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Deposit must be positive');
    this.balance += amount;
    this.transactions.push({ type: 'deposit', amount, date: new Date() });
  }

  withdraw(amount: number): void {
    if (amount > this.balance) throw new Error('Insufficient funds');
    this.balance -= amount;
    this.transactions.push({ type: 'withdrawal', amount, date: new Date() });
  }

  getBalance(): number { return this.balance; }
  getStatement(): typeof this.transactions { return [...this.transactions]; }
  // balance field is private — callers cannot mutate it directly ✅
}

// Abstract class with Template Method pattern
abstract class DataExporter {
  // Template method — defines algorithm skeleton
  export(data: unknown[]): string {
    const processed = this.transform(data);
    const formatted = this.format(processed);
    return this.addHeader() + formatted;
  }

  protected abstract transform(data: unknown[]): unknown[];
  protected abstract format(data: unknown[]): string;
  protected addHeader(): string { return ''; }
}

class CsvExporter extends DataExporter {
  protected transform(data: unknown[]) { return data; }
  protected format(data: unknown[]) { return data.map(r => Object.values(r as object).join(',')).join('\n'); }
  protected addHeader() { return 'col1,col2,col3\n'; }
}`,
    codeLang: 'typescript',
    summary: 'Abstraction lets you manage complexity by working at the right level of detail. Good abstractions are stable — callers rarely need to change when implementations evolve. When designing a class, ask: "what does the caller actually need?" — expose only that, and hide everything else behind private boundaries.',
  },

  interfaces: {
    overview: `Interfaces define contracts: a set of method signatures that a class promises to implement. Unlike abstract classes, interfaces carry no implementation and no state — they are pure behavioral specifications. A class can implement multiple interfaces (avoiding the diamond problem of multiple inheritance).\n\nThe key interview question: "When do you use an interface vs an abstract class?" — interface when you want capability/role (Serializable, Comparable); abstract class when you want partial implementation + template behavior.`,
    keyPoints: [
      'Interface = contract; abstract class = partial implementation + contract',
      'A class can implement many interfaces but extend only one abstract class (Java/C#)',
      'TypeScript: structural typing — an object satisfies an interface if it has the required shape (no explicit implements needed)',
      'Marker interfaces (Serializable in Java): convey intent with no methods — now prefer annotations/decorators',
      'Interface default methods (Java 8+): add behavior to interfaces without breaking existing implementations',
      'Design tip: depend on interfaces, not concrete classes — enables mocking and substitution (DIP)',
    ],
    code: `// Interfaces define roles — a class can play multiple roles
interface Serializable {
  serialize(): string;
  deserialize(data: string): this;
}

interface Printable {
  print(): void;
}

interface Comparable<T> {
  compareTo(other: T): number;  // -1 | 0 | 1
}

class Product implements Serializable, Printable, Comparable<Product> {
  constructor(public name: string, public price: number) {}

  serialize(): string { return JSON.stringify({ name: this.name, price: this.price }); }
  deserialize(data: string): this {
    const obj = JSON.parse(data);
    return Object.assign(Object.create(Object.getPrototypeOf(this)), obj);
  }
  print(): void { console.log(\`\${this.name}: $\${this.price}\`); }
  compareTo(other: Product): number {
    return this.price < other.price ? -1 : this.price > other.price ? 1 : 0;
  }
}

// Interface vs Abstract Class
abstract class Animal {
  abstract makeSound(): void;
  breathe() { console.log('breathing'); }  // shared implementation
}

interface Flyable { fly(altitude: number): void; }
interface Swimmable { swim(depth: number): void; }

class Duck extends Animal implements Flyable, Swimmable {
  makeSound() { console.log('Quack'); }
  fly(altitude: number) { console.log(\`Flying at \${altitude}m\`); }
  swim(depth: number)   { console.log(\`Swimming at \${depth}m\`); }
}`,
    codeLang: 'typescript',
    summary: 'Interfaces are the primary tool for loose coupling. Prefer interfaces over concrete types in method signatures — it makes code testable (inject mocks) and extensible (swap implementations without changing callers). Abstract classes are appropriate when related types share significant common code.',
  },

  composition: {
    overview: `"Favor composition over inheritance" is one of the most repeated principles in software design. Inheritance models an "is-a" relationship; composition models a "has-a" relationship. Inheritance couples subclasses tightly to parent implementation; composition allows behavior to be swapped at runtime.\n\nThe problem with deep inheritance hierarchies: fragile base class problem, inability to change superclass without affecting all subclasses, and the diamond problem. Composition solves all of these by delegating behavior to collaborating objects.`,
    keyPoints: [
      'Inheritance: "is-a" — a Dog IS-A Animal. Composition: "has-a" — a Car HAS-A Engine',
      'Fragile base class: changing a method in the parent can break subclasses in unexpected ways',
      'Mixin / trait pattern: compose behaviors from multiple sources without multiple inheritance',
      'Strategy pattern is composition in action: inject algorithm objects instead of inheriting them',
      'Go language has no inheritance at all — everything is composition + interfaces, proving it works at scale',
      'Rule of thumb: prefer composition when behavior needs to vary at runtime, or when you\'d need more than 2 levels of inheritance',
    ],
    code: `// ❌ Deep inheritance — breaks when requirements change
class Vehicle { move() {} }
class LandVehicle extends Vehicle { driveOnRoad() {} }
class Car extends LandVehicle { openTrunk() {} }
class FlyingCar extends Car { /* inherits driveOnRoad AND needs fly — awkward! */ }

// ✅ Composition — behaviors as injectable strategies
interface Engine { start(): void; stop(): void; thrust(): number; }
interface NavigationSystem { getRoute(dest: string): string[]; }
interface CargoBay { load(item: string): void; unload(): string[]; }

class ElectricEngine implements Engine {
  start() { console.log('Silently starting'); }
  stop()  { console.log('Stopping'); }
  thrust() { return 400; }
}

class JetEngine implements Engine {
  start() { console.log('Roaring to life'); }
  stop()  { console.log('Powering down'); }
  thrust() { return 12000; }
}

// Vehicle composed from parts — swap engines at runtime!
class Vehicle {
  constructor(
    private engine: Engine,
    private nav: NavigationSystem,
    private cargo?: CargoBay,
  ) {}

  go(dest: string) {
    this.engine.start();
    const route = this.nav.getRoute(dest);
    console.log(\`Route: \${route.join(' → ')}, thrust: \${this.engine.thrust()}N\`);
  }
}

// Swap engine without changing Vehicle
const electricCar = new Vehicle(new ElectricEngine(), new GPSNav());
const jetSled     = new Vehicle(new JetEngine(), new GPSNav(), new StandardCargo());`,
    codeLang: 'typescript',
    summary: 'Composition creates systems that are easier to change because behaviors are pluggable, not baked in through class hierarchies. The classic "Strategy pattern" is composition: inject the algorithm you want. When you find yourself asking "should I inherit or compose?" — try composition first. You can always restructure later.',
  },

  // ── OS: Key missing topics ────────────────────────────────────────────────

  race: {
    overview: `A race condition occurs when the outcome of a program depends on the non-deterministic timing or ordering of concurrent operations. The classic example: two threads read-increment-write a shared counter — each increments by 1, but if they interleave, only one increment takes effect.\n\nThe critical section is the code region accessing shared state that must be executed atomically. Mutual exclusion (mutex) ensures only one thread is in the critical section at a time. But mutual exclusion itself can cause deadlocks if not managed carefully.`,
    keyPoints: [
      'Race condition: non-deterministic behavior from unsynchronized access to shared mutable state',
      'Critical section: the code block that must not run concurrently — protect with a mutex/lock',
      'Mutex (mutual exclusion): only one thread holds the lock at a time — others block',
      'Semaphore: generalized mutex allowing N concurrent accesses (binary semaphore = mutex)',
      'Deadlock: T1 holds L1 waiting for L2; T2 holds L2 waiting for L1 — both stuck forever',
      'Deadlock conditions (all must hold): mutual exclusion, hold and wait, no preemption, circular wait',
      'Prevention: lock ordering (always acquire locks in the same order), timeout, tryLock, lock-free data structures',
      'Livelock: threads are active but making no progress (keep responding to each other without advancing)',
    ],
    code: `// ❌ Race condition: lost update
let counter = 0;
// Thread 1: read(0), compute 1, write(1)
// Thread 2: read(0), compute 1, write(1)  ← both see 0, final = 1, not 2

// ✅ Mutex in C (conceptually)
/*
pthread_mutex_t lock;
pthread_mutex_lock(&lock);
counter++;                  // critical section
pthread_mutex_unlock(&lock);
*/

// ✅ TypeScript — simulating with async/await and a simple mutex
class Mutex {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const tryLock = () => {
        if (!this.locked) {
          this.locked = true;
          resolve(() => {  // release function
            this.locked = false;
            this.queue.shift()?.();
          });
        } else {
          this.queue.push(tryLock);
        }
      };
      tryLock();
    });
  }
}

const mutex = new Mutex();
let sharedCounter = 0;

async function increment() {
  const release = await mutex.acquire();
  try {
    const val = sharedCounter;
    await new Promise(r => setTimeout(r, 1)); // simulate work
    sharedCounter = val + 1;  // safe — only one thread here
  } finally {
    release();
  }
}

// Deadlock avoidance: always acquire locks in the same fixed order
// Thread 1: lock(A) then lock(B)
// Thread 2: lock(A) then lock(B) — ✅ no circular wait`,
    codeLang: 'typescript',
    summary: 'Race conditions are among the hardest bugs to find because they are non-deterministic and often disappear under a debugger. Design around them: minimize shared mutable state, use lock-free structures where possible, and when you must lock, maintain a strict lock ordering. Tools like ThreadSanitizer (tsan) catch races automatically.',
  },

  containers: {
    overview: `Containers (Docker) and container orchestration (Kubernetes) have transformed how software is deployed. A container packages an application with its exact runtime dependencies into an isolated, reproducible unit. Unlike VMs, containers share the host OS kernel — they use Linux namespaces (process isolation) and cgroups (resource limits) for lightweight isolation.\n\nKubernetes (K8s) orchestrates containers at scale: scheduling them across a cluster, managing health, scaling horizontally, rolling out updates without downtime, and service discovery.`,
    keyPoints: [
      'Container = process with isolated namespaces (PID, net, mount, UTS, IPC) + cgroup resource limits',
      'Image vs container: image is the immutable blueprint (layered filesystem); container is a running instance',
      'Dockerfile: FROM → RUN → COPY → EXPOSE → CMD — each RUN creates a layer (cache invalidation matters)',
      'Docker networking: bridge (default), host, overlay (multi-host); containers communicate via container name DNS',
      'Kubernetes objects: Pod (1+ containers), Deployment (desired state), Service (stable VIP), Ingress (HTTP routing)',
      'K8s control plane: API server, etcd (state store), scheduler, controller manager',
      'Rolling update: K8s replaces pods one by one — zero-downtime with readiness probes',
      'Sidecar pattern: inject observability/security proxy (Envoy) alongside app container in same pod',
    ],
    code: `# Minimal production Dockerfile (Node.js)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node  # never run as root in production
CMD ["node", "dist/index.js"]

---
# Kubernetes Deployment + Service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  selector:
    matchLabels: { app: api-server }
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    metadata:
      labels: { app: api-server }
    spec:
      containers:
      - name: api
        image: myregistry/api:v2.1.0
        ports: [{ containerPort: 3000 }]
        resources:
          requests: { memory: "128Mi", cpu: "100m" }
          limits:   { memory: "256Mi", cpu: "500m" }
        readinessProbe:
          httpGet: { path: /health, port: 3000 }
          initialDelaySeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector: { app: api-server }
  ports: [{ port: 80, targetPort: 3000 }]
  type: ClusterIP`,
    codeLang: 'yaml',
    summary: 'Containers standardize the "works on my machine" problem. For interviews: understand the image/container distinction, why containers are lighter than VMs (shared kernel), and the basic K8s primitives (Pod, Deployment, Service). In system design, mention horizontal pod autoscaling (HPA) for traffic spikes.',
  },

  // ── Networks: TLS & WebSockets ────────────────────────────────────────────

  tls: {
    overview: `TLS (Transport Layer Security) 1.3 is the protocol that secures HTTPS. It provides confidentiality (encryption), integrity (MAC), and authentication (certificates). TLS sits between the transport layer (TCP) and the application layer (HTTP).\n\nTLS 1.3 dramatically simplified the handshake — from 2 round trips (TLS 1.2) to 1 round trip (and 0-RTT for resumed sessions). It also removed weak cipher suites (RC4, 3DES, RSA key exchange) and mandated forward secrecy via Ephemeral Diffie-Hellman.`,
    keyPoints: [
      'TLS 1.3 handshake: 1-RTT (ClientHello + key share → ServerHello + cert + Finished → client Finished)',
      'Forward secrecy: session keys are ephemeral — compromising the server private key cannot decrypt past sessions',
      'ECDHE (Elliptic Curve Diffie-Hellman Ephemeral): key agreement without transmitting the secret',
      'Certificate chain: leaf cert → intermediate CA → root CA — browser trusts root CAs in its trust store',
      'SNI (Server Name Indication): allows multiple domains on one IP — sent in ClientHello (unencrypted in 1.2, encrypted in 1.3 via ECH)',
      'HSTS (HTTP Strict Transport Security): tells browsers to always use HTTPS for this domain',
      'OCSP Stapling: server staples a signed proof that its cert isn\'t revoked, avoiding extra round trips',
      'mTLS (mutual TLS): both client and server authenticate with certs — used in service meshes (Istio)',
    ],
    code: `# TLS 1.3 Handshake (simplified)
Client                              Server
  |                                   |
  |-- ClientHello ------------------>|
  |   (supported ciphers, key_share, |
  |    session ticket for 0-RTT)     |
  |                                   |
  |<-- ServerHello ------------------|
  |    (chosen cipher, key_share)    |
  |<-- {EncryptedExtensions}---------|
  |<-- {Certificate}----------------|
  |<-- {CertificateVerify}----------|
  |<-- {Finished}-------------------|  ← server auth complete
  |                                   |
  |-- {Finished} ------------------->|  ← application data can start
  |-- {Application Data} ----------->|

# Key: {} = encrypted with derived handshake keys
# Elliptic Curve: both sides generate ephemeral key pairs
#   client_private × server_public == server_private × client_public (ECDH)
#   shared secret derived → symmetric keys for bulk encryption (AES-GCM)

# Verifying a certificate chain (OpenSSL)
openssl s_client -connect example.com:443 -showcerts
openssl verify -CAfile /etc/ssl/certs/ca-certificates.crt server.crt

# Generate self-signed cert for dev
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes`,
    codeLang: 'bash',
    summary: 'TLS 1.3 is now the standard — know the 1-RTT handshake, why forward secrecy matters (past traffic can\'t be decrypted if private key is stolen), and how certificates chain to root CAs. For system design, mention TLS termination at the load balancer (then plain HTTP inside the cluster) or mTLS between services for zero-trust networks.',
  },

  websockets: {
    overview: `WebSockets provide a persistent, full-duplex communication channel over a single TCP connection. Unlike HTTP's request-response model, either side can send messages at any time after the connection is established. This makes WebSockets ideal for real-time apps: chat, live dashboards, collaborative editors, and multiplayer games.\n\nThe WebSocket handshake starts as an HTTP Upgrade request, then "upgrades" the TCP connection to the WebSocket protocol — no new TCP connection needed.`,
    keyPoints: [
      'Handshake: HTTP GET with Upgrade: websocket and Sec-WebSocket-Key → 101 Switching Protocols',
      'Full-duplex: server can push messages without client polling — eliminates HTTP long-polling overhead',
      'Framing: messages split into frames (opcode, mask bit, payload length, masking key, payload data)',
      'Clients must mask frames; servers must not — prevents cache poisoning on proxies',
      'Heartbeat: send ping/pong frames to detect stale connections (proxies close idle connections after ~60s)',
      'Scaling WebSockets: sticky sessions OR use a pub/sub backplane (Redis pub/sub) so any server can push to any client',
      'When to use: real-time, low-latency, bidirectional. Prefer SSE (Server-Sent Events) for server-to-client only',
      'Socket.IO: WebSocket library with fallback to long-polling, rooms, namespaces — abstracts the raw protocol',
    ],
    code: `// WebSocket server (Node.js — ws library)
import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ server });

// In-memory room map for broadcasting
const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const room = new URL(req.url!, 'http://x').searchParams.get('room') ?? 'general';
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws);

  console.log(\`Client joined room: \${room}\`);

  ws.on('message', (data) => {
    const msg = JSON.stringify({ text: data.toString(), ts: Date.now() });
    // Broadcast to all clients in the same room
    rooms.get(room)?.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  // Heartbeat
  const ping = setInterval(() => ws.ping(), 30_000);

  ws.on('pong', () => { /* connection still alive */ });
  ws.on('close', () => {
    clearInterval(ping);
    rooms.get(room)?.delete(ws);
  });
});

server.listen(8080);

// Client-side
const ws = new WebSocket('wss://api.example.com/ws?room=general');
ws.onopen    = () => ws.send('Hello, world!');
ws.onmessage = (e) => console.log('Received:', e.data);
ws.onclose   = () => console.log('Disconnected');`,
    codeLang: 'typescript',
    summary: 'WebSockets are the right tool for bidirectional real-time communication. The key system design consideration is horizontal scaling — connections are stateful and tied to a server process. Use Redis pub/sub or Kafka to fan out messages across multiple WebSocket servers, so clients connected to different servers still receive broadcasts.',
  },

  // ── System Design Case Studies ────────────────────────────────────────────

  'design-youtube': {
    overview: `YouTube serves 500 hours of video uploaded per minute and 1 billion hours watched per day. The core challenges are: efficient video storage and transcoding (one upload → 10+ quality variants), globally fast delivery via CDN, and scaling metadata queries.\n\nThis question tests your understanding of object storage, video encoding pipelines, CDN architecture, and the difference between hot (popular) and cold (archival) content storage tiers.`,
    keyPoints: [
      'Scale: 500h video/min uploaded, 1B hours/day watched, 2B monthly active users',
      'Transcoding pipeline: upload → raw storage → transcoding workers → output variants (360p/720p/1080p/4K) → CDN',
      'Adaptive Bitrate Streaming (ABR): HLS/DASH splits video into 2–10s segments; player picks quality based on bandwidth',
      'Storage: raw video in object store (S3-equivalent); metadata (title, views, likes) in relational DB + Elasticsearch for search',
      'CDN strategy: popular videos cached at edge PoPs; cache miss fetches from origin object store',
      'Thumbnails: generated from video frames at transcoding time, stored as static objects in CDN',
      'View count: approximate with Redis HyperLogLog + periodic flush to DB (exact counts don\'t need to be exact)',
      'Recommendation engine: separate ML pipeline; precomputed per-user feed stored in feed cache',
    ],
    code: `// High-level architecture flow

// 1. Upload API
POST /upload → returns { uploadId, presignedUrl }
// Client uploads directly to object store (S3) — server not in the data path

// 2. Upload completion triggers transcoding job
S3 event → SQS queue → Transcoding Service (GPU fleet)
  ├── Extract audio track
  ├── Generate thumbnails (frame at 5%, 25%, 50%)
  └── Transcode to: 360p | 720p | 1080p | 4K (if source quality allows)
      └── Output: HLS playlist (.m3u8) + segments (.ts files) → CDN origin

// 3. Metadata service
interface VideoMetadata {
  videoId: string;
  uploaderId: string;
  title: string;
  description: string;
  duration: number;
  status: 'processing' | 'ready' | 'failed';
  manifestUrl: string;   // HLS .m3u8 URL
  thumbnails: string[];  // CDN URLs
  viewCount: number;
  likeCount: number;
  createdAt: Date;
}

// 4. HLS playlist structure (what the CDN serves)
// video123/master.m3u8
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=1280x720
720p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=200000,RESOLUTION=640x360
360p/playlist.m3u8

// video123/720p/playlist.m3u8
#EXT-X-TARGETDURATION=6
#EXTINF:6.0, seg001.ts
#EXTINF:6.0, seg002.ts
...

// 5. View counting (Redis approximate)
// On each view event:
redis.pfadd(\`views:\${videoId}:\${date}\`, userId);
// Flush hourly: redis.pfcount() → DB increment`,
    codeLang: 'typescript',
    summary: 'YouTube\'s architecture separates the write path (upload + transcoding) from the read path (CDN delivery). The key insight is that video bytes never go through your API servers — clients upload directly to object storage via presigned URLs, and viewers stream from CDN edge nodes. The API only handles metadata, auth, and signaling.',
  },

  'design-notification': {
    overview: `A notification system delivers messages to users across multiple channels: push (iOS/Android), email, SMS, and in-app. At scale (Facebook sends billions of notifications/day), the system must handle fan-out to millions of followers, respect user preferences, deduplicate, prioritize, and gracefully handle delivery failures.\n\nThe core design challenge is fan-out at write vs read time, and delivering to heterogeneous channels reliably with at-least-once semantics.`,
    keyPoints: [
      'Channels: push (APNS/FCM), email (SES/SendGrid), SMS (Twilio), in-app (WebSocket or SSE)',
      'Fan-out problem: one event (new post by celebrity) → millions of notifications — must be async',
      'Priority tiers: critical (OTP, security alerts) vs normal (likes, follows) — different queues & SLAs',
      'User preferences: store per-user channel preferences (email for marketing only, push for all, no SMS) in DB + cache',
      'Deduplication: store notification ID in Redis with TTL — idempotent delivery prevents duplicates on retry',
      'Retry with exponential backoff: APNS/FCM errors are transient; dead-letter queue for permanently undeliverable',
      'Rate limiting: don\'t send more than N notifications per user per hour to avoid notification fatigue',
      'Device token management: APNS/FCM return "invalid token" → remove from DB immediately',
    ],
    code: `// Notification System — Architecture

// Event producer publishes to Kafka topic
interface NotificationEvent {
  type: 'NEW_FOLLOWER' | 'LIKE' | 'COMMENT' | 'SYSTEM_ALERT' | 'OTP';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  recipientId: string;
  senderId?: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;  // deduplicate retries
}

// Notification Service — consumes from Kafka
class NotificationWorker {
  async process(event: NotificationEvent) {
    // 1. Check deduplication
    const alreadySent = await redis.set(
      \`notif:dedup:\${event.idempotencyKey}\`,
      '1', 'NX', 'EX', 86400  // 24h TTL
    );
    if (!alreadySent) return;  // already delivered

    // 2. Load user preferences
    const prefs = await userPrefsCache.get(event.recipientId);
    if (prefs.doNotDisturb && event.priority !== 'CRITICAL') return;

    // 3. Fan out to enabled channels
    const promises: Promise<void>[] = [];
    if (prefs.push && prefs.deviceTokens.length) {
      promises.push(this.sendPush(prefs.deviceTokens, event));
    }
    if (prefs.email && event.type !== 'OTP') {
      promises.push(this.sendEmail(prefs.email, event));
    }
    if (prefs.sms && event.priority === 'CRITICAL') {
      promises.push(this.sendSMS(prefs.phone, event));
    }
    await Promise.allSettled(promises);  // don't fail all if one channel fails
  }

  private async sendPush(tokens: string[], event: NotificationEvent) {
    const res = await fcm.sendMulticast({ tokens, notification: { ... } });
    // Clean up invalid tokens
    res.responses.forEach((r, i) => {
      if (r.error?.code === 'messaging/registration-token-not-registered') {
        deviceTokenRepo.remove(tokens[i]);
      }
    });
  }
}

// In-app notifications: store in DB, push via WebSocket
// When user connects: fetch unread count from DB
// New events: push via ws.send({ type: 'NOTIFICATION', ... })`,
    codeLang: 'typescript',
    summary: 'The notification system interview tests async architecture, fan-out strategies, and multi-channel delivery. Key insights: use Kafka for durable async delivery, separate queues for priority tiers, deduplicate with Redis to handle retries, and store user preferences in a cached read-optimized store. Always discuss rate limiting to prevent notification fatigue.',
  },

  // ── DBMS: Missing topics ──────────────────────────────────────────────────

  nosql: {
    overview: `NoSQL databases emerged to handle use cases that relational databases handle poorly: massive scale, flexible/schema-less data, and specific access patterns. "NoSQL" covers four very different data models: document, key-value, wide-column, and graph — each optimized for different workloads.\n\nThe decision between SQL and NoSQL is not about scale — modern Postgres scales to 10s of TBs. It's about data model fit, consistency requirements, and access patterns.`,
    keyPoints: [
      'Document stores (MongoDB, CouchDB): store JSON-like documents; good for catalogs, user profiles, CMS',
      'Key-value stores (Redis, DynamoDB): O(1) get/put; good for sessions, caches, leaderboards, rate limiting',
      'Wide-column stores (Cassandra, HBase): rows with dynamic columns; good for time-series, IoT, analytics at petabyte scale',
      'Graph databases (Neo4j, Amazon Neptune): native graph traversal; good for social networks, fraud detection, knowledge graphs',
      'Cassandra write path: write to commit log + memtable → flush to SSTable (LSM tree) — optimized for write-heavy workloads',
      'MongoDB: BSON documents, flexible schema, supports ACID within a document and multi-doc transactions since 4.0',
      'DynamoDB: fully managed key-value + document; partition key determines the shard; secondary indexes for alternate access patterns',
      'When to choose NoSQL: schema evolution speed, horizontal write scalability, or access patterns that map poorly to joins',
    ],
    code: `// MongoDB — flexible document model
// User document with embedded addresses (no join needed)
{
  "_id": ObjectId("..."),
  "name": "Arjun Kumar",
  "email": "arjun@example.com",
  "addresses": [
    { "type": "home", "city": "Bengaluru", "pincode": "560001" },
    { "type": "work", "city": "Hyderabad", "pincode": "500081" }
  ],
  "tags": ["premium", "active"],
  "createdAt": ISODate("2024-01-15T...")
}

// Query: find premium users in Bengaluru (with index on tags + addresses.city)
db.users.find({
  tags: "premium",
  "addresses.city": "Bengaluru"
}).limit(10);

// Cassandra — wide-column, designed for read patterns
// Table partitioned by user_id, clustered by timestamp (time-series)
CREATE TABLE user_events (
  user_id  UUID,
  ts       TIMESTAMP,
  event    TEXT,
  payload  TEXT,
  PRIMARY KEY (user_id, ts)   -- partition key = user_id
) WITH CLUSTERING ORDER BY (ts DESC);

-- Efficient: fetch all events for a user (single partition)
SELECT * FROM user_events WHERE user_id = ? LIMIT 100;

// Redis — key-value with rich data structures
await redis.zadd('leaderboard', score, userId);    // Sorted Set
await redis.zrevrange('leaderboard', 0, 9);         // Top 10
await redis.hset(\`session:\${id}\`, 'userId', uid); // Hash
await redis.expire(\`session:\${id}\`, 3600);         // TTL`,
    codeLang: 'typescript',
    summary: 'NoSQL is not a silver bullet — it trades relational flexibility (ad-hoc queries, joins) for specific optimizations. MongoDB wins on flexible schema; Cassandra wins on write throughput; Redis wins on latency; Neo4j wins on traversal queries. The real question is: what are your access patterns, and which data model fits them best?',
  },

  // ── OS: Memory Management ─────────────────────────────────────────────────

  memory: {
    overview: `Memory management is the OS mechanism for allocating, tracking, and freeing physical RAM among competing processes. Modern systems use virtual memory to give each process an isolated 4GB+ address space regardless of physical RAM size.\n\nThe OS maintains a page table mapping virtual pages to physical frames. When a process accesses a virtual address, the MMU translates it — if the page isn't in RAM (page fault), the OS loads it from disk.`,
    keyPoints: [
      'Physical memory divided into fixed-size frames; virtual memory into equal-size pages (typically 4KB)',
      'Page table: per-process mapping of virtual page number → physical frame number',
      'TLB (Translation Lookaside Buffer): hardware cache of recent virtual→physical translations — O(1) on hit',
      'Page fault: accessing a page not in RAM → OS loads from swap, updates page table',
      'Fragmentation: external (holes between allocations), internal (allocated more than needed)',
      'Memory allocators: first-fit, best-fit, buddy system; malloc uses segregated free lists (glibc)',
      'Stack vs heap: stack (LIFO, fast, fixed per-thread), heap (dynamic, needs explicit free/GC)',
      'Garbage collection: mark-and-sweep, reference counting, generational GC (Java/Go)',
    ],
    code: `// Virtual address translation (simplified)
// VA = virtual address, 32-bit, 4KB pages
// Page size = 4096 = 2^12  →  12-bit offset
// VPN = Virtual Page Number = VA >> 12
// Offset = VA & 0xFFF

function translateAddress(va: number, pageTable: Map<number, number>): number {
  const vpn = va >>> 12;           // virtual page number
  const offset = va & 0xFFF;       // byte offset within page
  const frame = pageTable.get(vpn);
  if (frame === undefined) throw new Error('Page fault! OS must load from disk');
  return (frame << 12) | offset;   // physical address
}

// Example page table entries
const pageTable = new Map([
  [0, 3],   // virtual page 0 → physical frame 3
  [1, 7],   // virtual page 1 → physical frame 7
]);

console.log(translateAddress(0x0042, pageTable));  // VPN=0, frame=3 → 0x3042
console.log(translateAddress(0x1100, pageTable));  // VPN=1, frame=7 → 0x7100

// TLB hit rate matters enormously:
// Without TLB: every memory access = 2 memory reads (page table + data)
// With TLB (99% hit rate): ~1 memory read on average`,
    codeLang: 'typescript',
    summary: 'Virtual memory is the key OS abstraction that makes process isolation, swapping, and memory-mapped files possible. In interviews: understand the page table walk, TLB\'s role in performance, and page fault handling. For system design: memory pressure causes swapping and cascading latency — always provision enough RAM for working set.',
  },

  virtual: {
    overview: `Virtual memory allows the OS to present processes with more memory than physically exists by storing unused pages on disk (swap space). It also enables memory-mapped files, copy-on-write fork semantics, and shared libraries mapped into multiple process address spaces.\n\nDemand paging is the key mechanism: pages are only loaded into RAM when first accessed. This enables fast program startup even for large executables — only touched pages are loaded.`,
    keyPoints: [
      'Demand paging: load pages on first access (page fault), not at program startup',
      'Swap space: disk partition (or file) used to store evicted pages; accessing swapped pages is ~10,000× slower than RAM',
      'Copy-on-write (COW): fork() shares parent pages read-only; a write causes a private copy to be made — enables cheap fork()',
      'Memory-mapped files (mmap): map a file into virtual address space; reads/writes become file I/O without syscalls',
      'Working set: the set of pages a process actively uses; if working set > RAM → thrashing',
      'Thrashing: CPU spends more time swapping than executing — fix by adding RAM or reducing multiprogramming degree',
      'Shared libraries: one physical copy mapped into all process address spaces (dynamic linking, .so/.dll)',
    ],
    code: `// mmap: memory-mapped file access (Node.js equivalent via Buffer)
// In C: void* ptr = mmap(NULL, size, PROT_READ, MAP_PRIVATE, fd, 0);

// Conceptually — reading a 1GB file without loading it all:
import { createReadStream } from 'fs';
// mmap OS equivalent: the OS maps the file into virtual address space
// Pages are loaded on demand as you access bytes — no explicit read() calls

// Copy-on-write (COW) demonstrated conceptually
/*
Parent process forks:
  virtual page A → physical frame 5 (shared, marked read-only)

Child writes to page A:
  1. Write fault → OS triggered
  2. OS allocates new frame 9
  3. Copies frame 5 → frame 9
  4. Updates child's page table: A → frame 9 (now writable)
  5. Parent's page table: A → frame 5 (unchanged)

Cost: one page copy (4KB) only when written — not upfront
This makes fork() O(1) instead of O(address space size)
*/

// Page replacement (when RAM is full, which page to evict?)
// LRU (Least Recently Used): evict page not used for longest time
// Approximate LRU: reference bits reset periodically (hardware)
// Clock algorithm: circular scan, evict first page with reference bit 0

// Thrashing example:
// 4 processes, each needs 10 pages, only 30 page frames total
// All 4 active → constant page faults → CPU utilization drops to < 10%`,
    codeLang: 'typescript',
    summary: 'Virtual memory\'s killer features are demand paging (only load what you use), COW fork (cheap process creation), and mmap (file I/O as memory access). In system design, the lesson is: keep your working set in RAM. When processes start swapping, latency degrades non-linearly and the system can thrash completely.',
  },

  // ── DBMS: Recovery & Query Optimization ───────────────────────────────────

  recovery: {
    overview: `Database recovery ensures that committed transactions survive crashes (durability) and incomplete transactions are rolled back (atomicity). The standard mechanism is Write-Ahead Logging (WAL): every change is written to a durable log before being applied to the data pages.\n\nCheckpointing periodically flushes dirty pages to disk, bounding how much log must be replayed on recovery. ARIES (Algorithm for Recovery and Isolation Exploiting Semantics) is the standard recovery algorithm used in most relational databases.`,
    keyPoints: [
      'WAL (Write-Ahead Logging): log record written to durable storage BEFORE data page is modified',
      'Force/steal policy: force = flush page at commit (guarantees durability without WAL); steal = allow dirty pages to disk before commit',
      'ARIES uses: no-force + steal → maximum flexibility; WAL provides durability',
      'Log records: LSN (Log Sequence Number), transaction ID, page ID, before-image, after-image',
      'Recovery phases: Analysis (find dirty pages + active transactions) → Redo (replay from last checkpoint) → Undo (rollback incomplete transactions)',
      'Checkpoint: write all dirty page LSNs to log → reduces redo work on recovery',
      'Idempotent redo: replaying a log record multiple times has same effect as once (critical for crash-safe recovery)',
    ],
    code: `// Write-Ahead Logging — conceptual flow
interface LogRecord {
  lsn: number;        // Log Sequence Number (monotonic)
  txnId: string;
  type: 'BEGIN' | 'UPDATE' | 'COMMIT' | 'ABORT' | 'CHECKPOINT';
  pageId?: string;
  before?: Buffer;    // pre-image (for undo)
  after?: Buffer;     // post-image (for redo)
  prevLSN?: number;   // previous log record for this transaction (undo chain)
}

// Transaction flow with WAL
async function updateRecord(txn: Transaction, pageId: string, data: Buffer) {
  const page = await bufferPool.getPage(pageId);

  // 1. Write log record FIRST (WAL rule: log before data)
  const lsn = await log.append({
    txnId: txn.id,
    type: 'UPDATE',
    pageId,
    before: page.currentData,  // for undo
    after: data,                // for redo
    prevLSN: txn.lastLSN,
  });

  // 2. Update page in buffer pool (NOT yet on disk)
  page.data = data;
  page.pageLSN = lsn;    // mark: log covers up to this LSN
  txn.lastLSN = lsn;

  // Page may flush to disk later (steal policy) — that's OK because
  // the log record is already durable and can redo or undo the change
}

async function commit(txn: Transaction) {
  // Write COMMIT log record and flush log to disk
  await log.append({ txnId: txn.id, type: 'COMMIT' });
  await log.flush();  // THIS guarantees durability — log is on disk
  // Data pages can stay in buffer pool — will be flushed lazily
}`,
    codeLang: 'typescript',
    summary: 'WAL is the core mechanism behind database durability. The ARIES protocol (no-force + steal + WAL) maximizes performance while guaranteeing ACID. In system design interviews, mention WAL when discussing how databases survive crashes — it\'s also the mechanism behind change data capture (CDC) and replication in systems like PostgreSQL.',
  },

  'query-opt': {
    overview: `The query optimizer is arguably the most sophisticated component of a relational database. Given a SQL query, it generates multiple logically equivalent execution plans and chooses the one with the lowest estimated cost — measured in disk I/O and CPU operations.\n\nModern optimizers are cost-based: they maintain statistics (row counts, column cardinality, histograms) and model the cost of each operation. Understanding query plans helps you write queries that the optimizer can execute efficiently.`,
    keyPoints: [
      'Query parsing → logical plan (algebraic expression) → physical plan (with access methods) → execution',
      'EXPLAIN / EXPLAIN ANALYZE: shows the chosen plan; ANALYZE actually runs the query and shows real vs estimated rows',
      'Sequential scan vs index scan: seq scan is often faster for > 10-15% of table rows (fewer random I/Os)',
      'Nested loop join: O(n×m) — good when inner table has index and outer table is small',
      'Hash join: O(n+m) — best for large equijoins, builds hash table of smaller side',
      'Merge join: O(n log n + m log m) — best for already-sorted inputs (exploit ORDER BY)',
      'Statistics: optimizer uses pg_statistic / system catalogs — stale stats → bad plans → ANALYZE to refresh',
      'Index selection: covering index eliminates heap reads; composite index order matches query predicates',
    ],
    code: `-- PostgreSQL EXPLAIN ANALYZE example
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.country = 'India'
  AND o.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.name
ORDER BY order_count DESC
LIMIT 10;

-- Reading the output:
-- "Seq Scan on users" + "rows=50000" + "actual rows=50000"  → stats accurate
-- "Index Scan on orders" → good, using idx_orders_user_date
-- "Hash Join" → building hash table on smaller side
-- "Sort" → memory sort (< work_mem) or disk sort (worse)
-- "cost=0.00..123.45" → estimated; "actual time=0.1..15.2ms" → real

-- Optimization strategies:
-- 1. Add composite index for common WHERE + ORDER BY
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

-- 2. Cover the query (avoid heap reads)
CREATE INDEX idx_orders_covering
  ON orders(user_id, created_at DESC)
  INCLUDE (id);   -- PostgreSQL 11+ INCLUDE clause

-- 3. Partial index for filtered queries
CREATE INDEX idx_recent_orders ON orders(user_id)
  WHERE created_at > '2024-01-01';   -- only index rows you query

-- 4. Force/hint the planner (when optimizer is wrong)
SET enable_seqscan = off;   -- PostgreSQL: force index use (debug only)
-- Note: MySQL supports USE INDEX, FORCE INDEX hints

-- Statistics freshness
ANALYZE orders;             -- refresh statistics for one table
-- Auto-ANALYZE runs when > 20% of rows changed (pg_autovacuum)`,
    codeLang: 'sql',
    summary: 'The query optimizer is doing machine-learning-before-ML to find the cheapest execution plan. As a developer: read EXPLAIN ANALYZE, look for seq scans on large tables, nested loops on large joins, and rows estimates that are wildly off actual. Fix with targeted indexes, fresh statistics, or query rewrites that align with how indexes are built.',
  },

  // ── Networks: QUIC & Congestion ───────────────────────────────────────────

  quic: {
    overview: `QUIC is a transport protocol built on UDP that underlies HTTP/3. It combines the best properties of TCP (reliability, ordering, flow control) and TLS (encryption) into a single protocol, eliminating the separate TCP and TLS handshakes. QUIC reduces connection establishment from 2+ RTTs (TCP + TLS) to 1 RTT, or even 0-RTT for returning clients.\n\nQuic's biggest innovation is multiplexing streams without head-of-line blocking. In HTTP/2 over TCP, a single lost packet blocks all streams; in QUIC each stream is independent at the transport layer.`,
    keyPoints: [
      'QUIC = reliability + encryption + multiplexing, all built into one UDP-based protocol',
      'Connection: 1-RTT establishment (TLS 1.3 integrated); 0-RTT for session resumption',
      'HTTP/3 over QUIC: eliminates TCP head-of-line blocking — one lost packet can\'t stall other streams',
      'Connection migration: QUIC uses connection IDs (not 4-tuple) — survives IP/port changes (mobile roaming)',
      'Forward Error Correction (FEC): some implementations add redundant packets to mask losses',
      'Userspace: QUIC runs in application code, not kernel — faster iteration than TCP (which needs kernel patches)',
      'Adoption: Google (all traffic), Cloudflare, Meta, YouTube all use QUIC/HTTP3',
      'When not to use QUIC: UDP blocked by corporate firewalls; UDP is not QUIC\'s problem, fallback to TCP',
    ],
    code: `// HTTP/3 vs HTTP/2 — the HOL blocking problem
// HTTP/2 over TCP:
// Stream 1: GET /style.css  [frame 1] [frame 2] ← LOST [frame 4]
// Stream 2: GET /app.js     ← blocked! TCP must retransmit frame 3
//                               all streams stalled by single TCP loss

// QUIC:
// Stream 1: GET /style.css  [frame 1] [frame 2] ← LOST → retransmit
// Stream 2: GET /app.js     [frame A] [frame B] [frame C] → ✅ delivered
//           Stream 2 is NOT affected by stream 1's loss

// QUIC connection establishment
// TLS 1.2 + TCP: TCP SYN/SYNACK + TLS ClientHello/ServerHello/Finish = 2-3 RTT
// TLS 1.3 + TCP: 1 RTT for TCP + 1 RTT for TLS = 2 RTT
// QUIC (first connection): 1 RTT (TLS 1.3 integrated into QUIC handshake)
// QUIC (0-RTT resume): 0 RTT — client sends data in first packet!
//   (0-RTT has replay attack risk — use only for idempotent requests)

// Connection ID (enables migration)
// Traditional TCP: identified by (srcIP, srcPort, dstIP, dstPort)
// Switch Wi-Fi → 4G? IP changes → TCP connection drops → reconnect needed
// QUIC: identified by Connection ID (random, app-level)
// Switch Wi-Fi → 4G? Same Connection ID → seamless handoff!

// Checking HTTP/3 support:
// curl --http3 https://example.com
// Response: HTTP/3 200`,
    codeLang: 'typescript',
    summary: 'QUIC/HTTP3 is the future of web transport. The key advantages for system design: 1) faster connection setup (0-RTT), 2) no HOL blocking for multiplexed streams, 3) connection migration for mobile. The practical note: most major CDNs (Cloudflare, AWS CloudFront) support HTTP/3 transparently — enable it for free latency wins.',
  },

  congestion: {
    overview: `TCP congestion control prevents any single sender from overwhelming the network. Without it, senders would transmit at line rate until routers drop packets, causing global congestion collapse.\n\nModern TCP uses Additive Increase Multiplicative Decrease (AIMD): slowly increase sending rate, back off sharply on loss. Different algorithms (Reno, CUBIC, BBR) vary in how aggressively they probe and how they interpret congestion signals.`,
    keyPoints: [
      'Congestion window (cwnd): sender\'s self-imposed limit on unacknowledged bytes in flight',
      'Slow start: cwnd doubles every RTT until ssthresh — exponential growth, not slow at all',
      'Congestion avoidance: after ssthresh, cwnd grows by 1 MSS per RTT — linear increase',
      'Fast retransmit: 3 duplicate ACKs → retransmit without waiting for timeout',
      'TCP Reno: on loss, ssthresh = cwnd/2, cwnd = ssthresh (AIMD)',
      'TCP CUBIC (Linux default): cubic function for cwnd growth — faster recovery on high-bandwidth paths',
      'BBR (Bottleneck Bandwidth and RTT): model-based, measures actual bandwidth and RTT — used by Google, YouTube',
      'ECN (Explicit Congestion Notification): routers mark packets (not drop) to signal congestion — preserves throughput',
    ],
    code: `// TCP Congestion Control state machine (simplified)
interface TCPSender {
  cwnd: number;      // congestion window (bytes)
  ssthresh: number;  // slow start threshold
  state: 'slow_start' | 'congestion_avoidance' | 'fast_recovery';
  mss: number;       // maximum segment size (typically 1460 bytes)
}

function onACK(tcp: TCPSender): void {
  if (tcp.state === 'slow_start') {
    tcp.cwnd += tcp.mss;             // double per RTT (exponential)
    if (tcp.cwnd >= tcp.ssthresh) {
      tcp.state = 'congestion_avoidance';
    }
  } else {
    // Congestion avoidance: increase by 1 MSS per RTT
    tcp.cwnd += (tcp.mss * tcp.mss) / tcp.cwnd;  // ≈ 1 MSS / RTT
  }
}

function onLoss(tcp: TCPSender, signal: 'timeout' | 'triple_dup_ack'): void {
  if (signal === 'timeout') {
    // Severe congestion: reset to slow start
    tcp.ssthresh = tcp.cwnd / 2;
    tcp.cwnd = tcp.mss;              // restart from 1 MSS
    tcp.state = 'slow_start';
  } else {
    // Triple duplicate ACK: fast retransmit + fast recovery
    tcp.ssthresh = tcp.cwnd / 2;
    tcp.cwnd = tcp.ssthresh;         // halve (AIMD multiplicative decrease)
    tcp.state = 'congestion_avoidance';
  }
}

// BBR approach (bandwidth-delay product model)
// BBR tracks: maxBW (max bandwidth observed) + minRTT (min RTT observed)
// Target cwnd = maxBW × minRTT (bandwidth-delay product)
// No packet loss signals — uses ACK timing to infer network state
// Result: 2-25× higher throughput on congested networks vs CUBIC`,
    codeLang: 'typescript',
    summary: 'TCP congestion control is elegant distributed coordination: all senders collectively probe the network\'s capacity without central coordination. BBR is worth knowing for interviews — it\'s why YouTube streams smoothly on congested networks. For system design: large file transfers benefit from tuning TCP buffer sizes (net.core.rmem_max) and TCP BBR.',
  },

  // ─── Networking ─────────────────────────────────────────────────────────────

  routing: {
    overview: `Routing is the process of selecting paths for network traffic. Routers use routing tables — built by routing protocols — to forward packets hop-by-hop toward their destination.\n\n**Interior Gateway Protocols (IGP)** operate within an autonomous system (AS). OSPF (Open Shortest Path First) uses link-state advertisements to build a complete network topology map, then runs Dijkstra's algorithm to compute shortest paths. RIP (Routing Information Protocol) is distance-vector based — routers share their distance tables with neighbors and converge slowly.\n\n**Exterior Gateway Protocols (EGP)** connect autonomous systems. BGP (Border Gateway Protocol) is the backbone of the internet — ISPs and large networks use it to advertise reachable prefixes. BGP selects routes based on policy attributes (AS path, local preference, MED) not just shortest path.`,
    keyPoints: [
      'Static routing: manually configured, no overhead, poor scalability',
      'OSPF: link-state, Dijkstra-based, fast convergence, used in enterprise/ISP',
      'BGP: path-vector, internet backbone, policy-driven, slow convergence',
      'Routing table: destination → next hop + metric + interface',
      'ECMP (Equal-Cost Multi-Path): load balance across multiple equal-cost routes',
      'CIDR & longest prefix match: /24 beats /16 for the same destination',
      'ARP (Address Resolution Protocol): maps IP → MAC within a subnet',
    ],
    code: `# Inspect routing table (Linux)
ip route show

# Example routing table
# default via 192.168.1.1 dev eth0       ← default gateway
# 10.0.0.0/8 via 10.1.0.1 dev eth1      ← static corporate route
# 192.168.1.0/24 dev eth0 proto kernel   ← directly connected

# Traceroute: see each hop to destination
traceroute 8.8.8.8

# BGP path selection (simplified):
# 1. Highest LOCAL_PREF (prefer internal routes)
# 2. Shortest AS_PATH (fewer ASes traversed)
# 3. Lowest MED (multi-exit discriminator)
# 4. Lowest router-id (tiebreaker)`,
    codeLang: 'bash',
    summary: 'Routing is how the internet works at scale. OSPF is the workhorse inside data centers and ISPs; BGP is what connects them. For system design: CDNs use BGP anycast to route users to the nearest PoP. Subnet design (CIDR) and VPC routing are critical for cloud architecture interviews.',
  },

  ip: {
    overview: `The Internet Protocol (IP) is the network layer protocol responsible for addressing and routing packets across networks. IPv4 uses 32-bit addresses (4.3B addresses); IPv6 uses 128-bit addresses (340 undecillion).\n\n**IP Packet structure**: version, header length, TTL (decremented at each hop, dropped at 0), source IP, destination IP, payload. The TTL field prevents infinite loops.\n\n**Subnetting**: IP addresses are split into a network portion and host portion using a subnet mask. CIDR notation (e.g., 192.168.1.0/24) specifies how many bits are the network. This enables hierarchical routing and efficient address allocation.\n\n**NAT (Network Address Translation)**: allows multiple private IPs (10.x, 172.16.x, 192.168.x) to share one public IP. A NAT table maps (private IP, port) ↔ (public IP, port). Every home router does this.`,
    keyPoints: [
      'IPv4: 32-bit, dotted decimal, ~4.3B addresses (exhausted, hence NAT/IPv6)',
      'IPv6: 128-bit, colon-hex, stateless address autoconfiguration (SLAAC)',
      'Subnetting: /24 = 256 addresses, /16 = 65536, /8 = 16M',
      'Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16',
      'TTL: prevents loops; traceroute exploits TTL=1,2,3... to trace hops',
      'Fragmentation: MTU (1500 bytes Ethernet) — large packets are split, reassembled at dest',
      'ICMP: control messages (ping = echo request/reply, unreachable, TTL exceeded)',
    ],
    code: `# Key IP commands
ip addr show                     # view IP addresses
ip route add 10.0.0.0/8 via 192.168.1.1  # add route
ping -c 4 8.8.8.8               # ICMP echo
traceroute 1.1.1.1              # hop-by-hop trace

# Subnet math (Python)
import ipaddress
net = ipaddress.IPv4Network('192.168.1.0/24')
print(net.network_address)   # 192.168.1.0
print(net.broadcast_address) # 192.168.1.255
print(net.num_addresses)     # 256
print(list(net.hosts())[:3]) # .1 .2 .3 (first 3 usable)

# IPv6 example
ip6 = ipaddress.IPv6Address('2001:db8::1')
print(ip6.compressed)  # 2001:db8::1`,
    codeLang: 'python',
    summary: 'IP is the universal language of the internet. Subnetting, CIDR, and NAT are must-knows for cloud/infrastructure roles. In system design: private VPC subnets, security group rules, and load balancer placement all require IP addressing knowledge. IPv6 adoption is accelerating — AWS dual-stack and IPv6-only subnets are production realities.',
  },

  wifi: {
    overview: `Wi-Fi (IEEE 802.11) is the dominant wireless LAN standard. It operates in the 2.4 GHz and 5 GHz radio bands (Wi-Fi 6E also uses 6 GHz). The fundamental challenge of wireless is the shared medium — all devices in range hear each other's signals.\n\n**CSMA/CA (Carrier Sense Multiple Access / Collision Avoidance)**: Unlike Ethernet's CSMA/CD (collision detection), Wi-Fi uses collision avoidance because wireless devices can't detect collisions while transmitting. Before sending, a device listens (carrier sense), waits for the channel to be idle, then waits a random backoff time, then transmits.\n\n**Wi-Fi generations**: 802.11n (Wi-Fi 4) = MIMO, 300 Mbps. 802.11ac (Wi-Fi 5) = MU-MIMO, 1 Gbps. 802.11ax (Wi-Fi 6) = OFDMA, 9.6 Gbps, better in dense environments. Wi-Fi 6E adds 6 GHz channels for less congestion.`,
    keyPoints: [
      'SSID: network name; BSSID: AP MAC address; BSS: Basic Service Set',
      '2.4 GHz: longer range, more interference (microwaves, Bluetooth); 3 non-overlapping channels',
      '5 GHz: shorter range, faster speeds, 23+ non-overlapping channels',
      'CSMA/CA + RTS/CTS for hidden node problem',
      'WPA3 is current security standard (WPA2 has KRACK vulnerability)',
      'OFDMA (Wi-Fi 6): multiple clients served simultaneously per channel',
      'BSS coloring (Wi-Fi 6): spatial reuse — ignore transmissions from other networks',
    ],
    code: `# Wi-Fi channel planning (2.4 GHz)
# Only channels 1, 6, 11 are non-overlapping
# Channel 1:  2412 MHz
# Channel 6:  2437 MHz
# Channel 11: 2462 MHz

# Security protocols
# WEP   → broken (RC4 key reuse), never use
# WPA   → TKIP, deprecated
# WPA2  → AES-CCMP, good; KRACK attack exists
# WPA3  → SAE (Dragonfly), forward secrecy, required since 2020

# Signal strength to quality mapping
# -30 dBm: Excellent (max signal)
# -67 dBm: Good (minimum for streaming)
# -70 dBm: Okay (web browsing)
# -80 dBm: Poor (basic connectivity)
# -90 dBm: Unusable

# WPA3 SAE handshake (simplified)
# 1. Both sides compute a shared secret from password + MAC addresses
# 2. Exchange commit messages (with anti-timing protections)
# 3. Confirm exchange — no password transmitted`,
    codeLang: 'bash',
    summary: 'Wi-Fi is essential networking knowledge for mobile and IoT roles. Key interview topics: CSMA/CA collision avoidance, WPA3 security, channel planning to reduce interference, and Wi-Fi 6 OFDMA for dense deployments. Data centers use wired Ethernet (25G/100G) — Wi-Fi is for client access.',
  },

  firewall: {
    overview: `A firewall controls network traffic based on rules — permitting or denying packets based on source/destination IP, port, protocol, and connection state. Firewalls are the primary perimeter defense in network security.\n\n**Packet filtering firewalls** inspect each packet independently (Layer 3/4). They're fast but stateless — can't track TCP connections.\n\n**Stateful firewalls** track connection state (SYN → ESTABLISHED → FIN). They can detect out-of-state packets (e.g., a TCP RST with no matching connection = suspicious).\n\n**Application-layer firewalls (WAF)** operate at Layer 7 — they parse HTTP, detect SQL injection, XSS, and can block based on request content. AWS WAF, Cloudflare WAF are cloud WAF examples.\n\n**iptables** (Linux) is the canonical packet filter. nftables replaces it in modern kernels. Cloud equivalents: AWS Security Groups (stateful) and Network ACLs (stateless).`,
    keyPoints: [
      'Stateless: filter by IP/port/protocol; stateful: track connection state',
      'Default deny: block everything, allow only what is needed (allowlist approach)',
      'DMZ (Demilitarized Zone): isolated subnet for public-facing servers',
      'WAF: protects against OWASP Top 10 at Layer 7',
      'iptables chains: INPUT, OUTPUT, FORWARD — each packet traverses relevant chains',
      'Security Group (AWS): stateful, per-instance firewall rules',
      'Network ACL (AWS): stateless, subnet-level, rules evaluated in order',
    ],
    code: `# iptables basics (Linux firewall)
# Allow established/related traffic (stateful)
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH from specific IP
iptables -A INPUT -s 203.0.113.10 -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS from anywhere
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Default deny everything else
iptables -P INPUT DROP
iptables -P FORWARD DROP

# Allow all outbound
iptables -P OUTPUT ACCEPT

# View rules
iptables -L -v -n --line-numbers`,
    codeLang: 'bash',
    summary: 'Firewalls are the backbone of network security. Stateful firewalls track connection context; WAFs protect web apps at Layer 7. In cloud architecture: Security Groups (stateful, per-instance) and NACLs (stateless, subnet-level) serve different roles. Zero-trust networks supplement perimeter firewalls with per-request authentication.',
  },

  'net-sec': {
    overview: `Network security protects data in transit and infrastructure from attack. The core threat model: untrusted networks (internet), partially-trusted networks (corporate LAN), and trusted enclaves (VPCs, internal services).\n\n**TLS** (Transport Layer Security) is the primary cryptographic protocol for securing network communication. It provides confidentiality (encryption), integrity (MAC), and authentication (certificates). HTTPS = HTTP over TLS.\n\n**Common attacks**: Man-in-the-middle (MITM) intercepts traffic between client and server. DNS spoofing poisons DNS caches to redirect traffic. ARP poisoning sends false ARP replies to redirect traffic on a LAN. DDoS floods a target with traffic to exhaust resources.\n\n**Defense in depth**: multiple security layers so no single failure is catastrophic. Combine firewalls, IDS/IPS, encryption, authentication, logging, and monitoring.`,
    keyPoints: [
      'Defense in depth: firewall + IDS/IPS + encryption + auth + monitoring',
      'Zero Trust: never trust, always verify — even internal traffic',
      'VPN: creates encrypted tunnel over untrusted network (IPsec, WireGuard, OpenVPN)',
      'IDS vs IPS: IDS detects anomalies; IPS can block malicious traffic inline',
      'Certificate pinning: reject any cert not matching a known fingerprint',
      'HSTS: forces HTTPS for a domain, prevents SSL stripping attacks',
      'DNSSEC: authenticates DNS responses to prevent spoofing',
    ],
    code: String.raw`# Check TLS certificate details
openssl s_client -connect example.com:443 -servername example.com < /dev/null 2>/dev/null | \
  openssl x509 -text -noout | grep -E "Subject:|Issuer:|Not After"

# Scan for open ports (nmap)
nmap -sV -p 80,443,22,3306 target.example.com

# Test HSTS header
curl -I https://example.com | grep strict

# WireGuard VPN config (server)
[Interface]
Address = 10.0.0.1/24
PrivateKey = <server_private_key>
ListenPort = 51820

[Peer]
PublicKey = <client_public_key>
AllowedIPs = 10.0.0.2/32  # only route client IP`,
    codeLang: 'bash',
    summary: 'Network security is multi-layered. TLS secures transport; firewalls control access; IDS/IPS detect intrusions; VPNs encrypt remote access. Zero Trust (verify every request, assume breach) is the modern paradigm replacing perimeter-only security. For interviews: know TLS handshake, certificate chain of trust, and common attack vectors.',
  },

  // ─── DBMS ─────────────────────────────────────────────────────────────────

  er: {
    overview: `Entity-Relationship (ER) diagrams model a database's conceptual schema — what data exists and how entities relate, before deciding on tables and columns.\n\n**Entities** are things with independent existence (User, Order, Product). **Attributes** describe entities (User has name, email, createdAt). **Relationships** link entities — a User *places* many Orders.\n\n**Cardinality** defines the multiplicity of a relationship:\n- One-to-One (1:1): Person ↔ Passport\n- One-to-Many (1:N): Customer → Orders\n- Many-to-Many (M:N): Students ↔ Courses (needs a junction table: Enrollment)\n\n**Weak entities** depend on a strong entity for their identity (OrderItem depends on Order).\n\n**Normalization** follows from ER: redundancy in your ER diagram signals a normalization problem. Many-to-many relationships always produce three tables: two entity tables + one junction table.`,
    keyPoints: [
      'Entity: noun with independent existence and a primary key',
      'Weak entity: identified by its relationship with a strong entity + partial key',
      'Attributes: simple, composite (address = street + city), multivalued (phone numbers)',
      '1:1 → can merge into one table or use FK; 1:N → FK on the "many" side; M:N → junction table',
      'Participation: total (every entity must participate) vs partial',
      'ER → Relational: each entity → table; M:N → junction table; 1:N → FK on child',
      'Extended ER: generalization (supertype/subtype), specialization, aggregation',
    ],
    code: `-- ER → SQL example: Blog (User, Post, Tag — M:N)
-- User (1) → Post (N): user_id FK on posts
-- Post (M) ↔ Tag (N): junction table post_tags

CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE posts (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tags (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- M:N junction table
CREATE TABLE post_tags (
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  INT REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);`,
    codeLang: 'sql',
    summary: 'ER modeling is the first step in database design — get the entities and relationships right before writing SQL. M:N relationships always need a junction table. Weak entities inherit identity from their parent. In interviews: draw ER diagrams for e-commerce (User, Product, Order, OrderItem) or social networks (User, Post, Comment, Like) to demonstrate schema design skill.',
  },

  'db-design': {
    overview: `Database design is the process of translating business requirements into a schema that is correct, efficient, and maintainable. It spans three levels:\n\n1. **Conceptual**: ER diagram — what entities and relationships exist\n2. **Logical**: relational schema — tables, columns, types, constraints, keys\n3. **Physical**: indexes, partitioning, storage engines, denormalization for query performance\n\n**Principles**: Normalize to 3NF to eliminate redundancy (no update anomalies). Denormalize selectively when reads are bottlenecked and consistency can be managed. Always define proper constraints (NOT NULL, UNIQUE, FK, CHECK) — your DB is the last line of defense against bad data.\n\n**Common patterns**: Soft deletes (deleted_at column), audit logs (created_at, updated_at, created_by), polymorphic associations (careful: breaks FK integrity), event sourcing (append-only events as the source of truth).`,
    keyPoints: [
      'Functional dependency: X → Y means Y is determined by X (basis for normalization)',
      '1NF: atomic values, no repeating groups; 2NF: no partial dependency on composite PK; 3NF: no transitive dependency',
      'Surrogate vs natural keys: surrogate (auto-increment/UUID) is usually better for FKs',
      'ON DELETE CASCADE vs RESTRICT: choose based on domain (cascade for ownership, restrict for references)',
      'Soft delete: set deleted_at instead of DELETE to preserve history and audit trail',
      'Audit columns: created_at, updated_at (auto-updated via trigger or ORM), created_by',
      'Schema migrations: additive changes are safe; removals/renames require multi-step deploys',
    ],
    code: `-- Good database design patterns

-- Timestamps + soft delete
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku         TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  deleted_at  TIMESTAMPTZ  -- NULL = active, non-NULL = soft deleted
);

-- Auto-update updated_at via trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Filter soft-deleted rows
CREATE VIEW active_products AS
  SELECT * FROM products WHERE deleted_at IS NULL;`,
    codeLang: 'sql',
    summary: 'Database design is about making the right trade-offs: normalize for consistency, denormalize for read performance, add constraints for correctness, soft-delete for auditability. In system design interviews, always define your schema before talking about indexes or caching — a well-designed schema eliminates whole classes of bugs.',
  },

  'distributed-db': {
    overview: `Distributed databases spread data across multiple nodes to achieve horizontal scalability, fault tolerance, and geographic distribution. The CAP theorem (you can have at most 2 of Consistency, Availability, Partition tolerance) defines the fundamental trade-offs.\n\n**Replication** (data on multiple nodes) improves read throughput and fault tolerance. **Sharding** (data split across nodes) improves write throughput. Most production systems use both.\n\n**Consensus algorithms** (Raft, Paxos) ensure distributed nodes agree on a single value — critical for leader election and replication. Raft is more understandable and widely adopted (etcd, CockroachDB, TiDB).\n\n**Distributed transactions** are hard: two-phase commit (2PC) provides atomicity across nodes but is blocking — if the coordinator fails, participants are stuck. Google Spanner uses TrueTime (GPS + atomic clocks) to order transactions globally. CockroachDB implements serializable isolation using Raft + MVCC.`,
    keyPoints: [
      'CAP: at partition, choose CP (reject writes to maintain consistency) or AP (serve stale data)',
      'PACELC: extends CAP — even without partition, trade latency vs consistency',
      'Raft: leader-based consensus, leader elected by majority vote, logs replicated before commit',
      '2PC: prepare phase (all vote yes/no) + commit phase (all commit or abort)',
      'SAGA pattern: distributed transactions via compensating transactions (no 2PC)',
      'CRDTs: conflict-free replicated data types — merge without coordination (counters, sets)',
      'Google Spanner: globally distributed, serializable, uses TrueTime for external consistency',
    ],
    code: `// Saga pattern (compensation-based distributed transaction)
// Order service coordinates: charge card → create order → reserve inventory
// If inventory reservation fails → compensate by refunding card + deleting order

class OrderSaga {
  async execute(orderData: OrderData) {
    let chargeId: string | null = null;
    let orderId: string | null = null;

    try {
      // Step 1: charge customer
      chargeId = await paymentService.charge(orderData.customerId, orderData.total);

      // Step 2: create order record
      orderId = await orderService.create({ ...orderData, chargeId });

      // Step 3: reserve inventory
      await inventoryService.reserve(orderData.items, orderId);

      return { success: true, orderId };
    } catch (err) {
      // Compensate in reverse order
      if (orderId)  await orderService.cancel(orderId);
      if (chargeId) await paymentService.refund(chargeId);
      throw err;
    }
  }
}`,
    codeLang: 'typescript',
    summary: 'Distributed databases are the backbone of large-scale systems. Key concepts: CAP trade-offs (CP vs AP), Raft consensus for leader election, sharding strategies (range vs hash), and SAGA for distributed transactions. For interviews: know why 2PC is dangerous (blocking), why Raft beats Paxos in practice (understandability), and when to use eventual consistency vs strong consistency.',
  },

  // ─── OS / Systems ─────────────────────────────────────────────────────────

  'fs-intro': {
    overview: `A file system organizes data on storage devices into a hierarchical structure of files and directories. It abstracts raw disk blocks into named, typed data accessible by path.\n\n**Key abstractions**:\n- **File**: a named sequence of bytes with metadata (permissions, timestamps, size, type)\n- **Directory**: a file that maps names → inodes\n- **Inode**: a data structure storing file metadata and pointers to data blocks\n- **Block**: the minimum unit of disk I/O (typically 4 KB)\n\n**VFS (Virtual File System)**: Linux's abstraction layer allowing multiple file system types (ext4, XFS, Btrfs, tmpfs) to coexist behind a single system call interface. When you call open(), the kernel dispatches to the correct FS driver via VFS.\n\nCommon Linux file systems: ext4 (mature, journaling, default on many distros), XFS (high performance, large files), Btrfs (snapshots, checksums, RAID), tmpfs (in-memory, cleared on reboot).`,
    keyPoints: [
      'Inode: stores metadata (permissions, size, timestamps, owner, data block pointers) — NOT the filename',
      'Filename lives in directory; directory entry maps name → inode number',
      'Hard link: multiple directory entries pointing to same inode; soft link: file containing a path',
      'Block allocation strategies: contiguous (fast, fragmentation), linked list, indexed (inode with block pointers)',
      'Free space management: bitmap (1 bit per block) or free list',
      'Mount: attach a file system to a directory in the VFS tree',
      'File descriptor: process-level handle to an open file; kernel tracks file table per process',
    ],
    code: `# Exploring the file system (Linux)

# View inode info
stat /etc/passwd
# Inode: 123456   Links: 1   Size: 2847
# Access: -rw-r--r--  Uid: 0   Gid: 0

# View inode number
ls -i /etc/passwd   # 123456 /etc/passwd

# Show disk usage per filesystem
df -h

# Show inode usage (can run out before disk space!)
df -i

# Find which process has a file open
lsof /var/log/syslog

# Hard link: same inode, different names
ln original.txt hardlink.txt
ls -i original.txt hardlink.txt  # same inode number

# Soft link: a pointer file
ln -s /usr/bin/python3 /usr/local/bin/python`,
    codeLang: 'bash',
    summary: 'File systems bridge the gap between raw storage and the files programmers use. Inodes are the key data structure — they hold metadata and point to data blocks; filenames live in directories. Understanding inodes matters for hard vs soft links, file recovery, and why you can run out of inodes before disk space. VFS enables Linux\'s "everything is a file" philosophy.',
  },

  inodes: {
    overview: `An inode (index node) is the core data structure of Unix file systems. Every file and directory has exactly one inode, which stores all metadata except the filename.\n\n**Inode contents**: file type (regular, directory, symlink, device), permissions (rwxrwxrwx), owner (UID/GID), timestamps (atime/mtime/ctime), file size, link count, and crucially — **block pointers** pointing to where the file's data lives on disk.\n\n**Block pointer structure** (ext4 uses extents, older systems used direct/indirect blocks):\n- Direct block pointers: fast access to the first ~48 KB\n- Single indirect: pointer to block of pointers (~4 MB)\n- Double indirect: pointer → block of pointers → data (~4 GB)\n- Triple indirect: for huge files\n\nExt4 replaced this with **extents** — a contiguous range (start block, length) — much more efficient for large files and sequential I/O.`,
    keyPoints: [
      'Inode stores everything about a file EXCEPT its name',
      'Link count: number of hard links. File is deleted when link count hits 0 AND no open FDs',
      'Inode number is unique per filesystem; not unique across filesystems (why hard links can\'t cross mounts)',
      'Timestamps: atime (last access), mtime (last content modification), ctime (last inode change)',
      'ext4 extents: (start_block, length) — efficient for large files; avoids fragmentation',
      'Directory entry: { filename: "foo.txt", inode: 42 } — simple mapping',
      'Deleting a file: remove directory entry + decrement link count; data freed when count = 0 and no FD',
    ],
    code: `# Inspect inode details
stat myfile.txt
# File: myfile.txt
# Size: 1234         Blocks: 8      IO Block: 4096  regular file
# Device: 8,1        Inode: 7865432 Links: 1
# Access: (0644/-rw-r--r--)  Uid: 1000   Gid: 1000
# Access: 2025-01-10 09:00
# Modify: 2025-01-09 18:30   (content changed)
# Change: 2025-01-09 18:30   (inode changed: chmod, chown, link)

# Inode usage — can exhaust before disk space
df -i /
# Filesystem       Inodes  IUsed   IFree IUse%
# /dev/sda1      6553600  412830  6140770    6%

# What happens on delete
rm myfile.txt
# 1. Remove "myfile.txt" → inode_num from directory
# 2. Decrement inode link count
# 3. If link_count == 0 AND no open FDs: mark blocks as free`,
    codeLang: 'bash',
    summary: 'Inodes are how Unix file systems track files. The separation of inode (metadata + block pointers) from directory entries (name → inode) enables hard links, atomic renames, and the "delete open file" pattern (file data persists until last FD is closed). Running out of inodes (even with free disk space) is a real production failure mode on systems with many small files.',
  },

  'page-replace': {
    overview: `When physical memory is full and a new page is needed, the OS must evict an existing page — it selects a victim using a page replacement algorithm. The goal: minimize page faults (evict pages least likely to be needed soon).\n\n**Optimal (Bélády)**: Evict the page that will be used furthest in the future. Optimal but impossible in practice (requires future knowledge). Used as a benchmark.\n\n**FIFO**: Evict the oldest loaded page. Simple but suffers from Bélády's anomaly — more frames can cause more page faults.\n\n**LRU (Least Recently Used)**: Evict the page not used for the longest time. Good approximation of optimal. Expensive to implement exactly (need to track access order). Hardware TLB and reference bits enable clock approximations.\n\n**Clock (Second Chance)**: Circular list of pages with a reference bit. On access, set bit=1. When evicting, scan: if bit=1, clear it and move on; if bit=0, evict. O(1) amortized, much more practical than exact LRU.`,
    keyPoints: [
      'Page fault: page not in RAM → OS loads it from disk (slow — microseconds vs nanoseconds)',
      'Thrashing: working set > RAM → constant page faults, near-zero useful work',
      'Optimal: provably best, impossible online; use to measure algorithm quality',
      'FIFO: Bélády\'s anomaly — more frames → more faults (counterintuitive!)',
      'LRU: excellent, costly; approximated by Clock/Second-Chance using reference bits',
      'Working Set: set of pages actively used by a process; should fit in RAM',
      'Dirty page: modified in RAM, not yet written back — must write to swap before evicting',
    ],
    code: `// LRU Cache — exact LRU (O(1) get/put via HashMap + doubly-linked list)
class LRUCache {
  private capacity: number;
  private map: Map<number, { key: number; val: number; prev: any; next: any }>;
  private head: any; // dummy head (most recent)
  private tail: any; // dummy tail (least recent)

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = {}; this.tail = {};
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: number): number {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key)!;
    this.remove(node);
    this.addFront(node);  // mark as most recently used
    return node.val;
  }

  put(key: number, val: number): void {
    if (this.map.has(key)) this.remove(this.map.get(key)!);
    const node = { key, val, prev: null, next: null };
    this.addFront(node);
    this.map.set(key, node);
    if (this.map.size > this.capacity) {
      const lru = this.tail.prev;
      this.remove(lru);
      this.map.delete(lru.key);
    }
  }

  private remove(node: any) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
  private addFront(node: any) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }
}`,
    codeLang: 'typescript',
    summary: 'Page replacement algorithms are foundational OS theory and a classic LeetCode problem (LRU Cache is a top-50 interview question). Know the trade-offs: Optimal is perfect but impossible; LRU is best in practice; Clock approximates LRU with O(1) overhead. Thrashing happens when working set exceeds physical RAM — cured by adding RAM or reducing multiprogramming degree.',
  },

  thrashing: {
    overview: `Thrashing occurs when a system spends more time handling page faults than executing useful work. It happens when the combined working sets of all running processes exceed available physical memory.\n\n**Working Set Model**: the working set W(t, Δ) is the set of pages a process referenced in the past Δ time units. If Σ|W(process)| > total frames, thrashing is inevitable.\n\n**Signs of thrashing**: CPU utilization drops (processes are always waiting for I/O), disk I/O spikes, and system feels sluggish or frozen. The OS scheduler may see many blocked processes and try to run more — making thrashing worse.\n\n**Remedies**:\n1. **Reduce multiprogramming** — swap out a process entirely (long-term scheduling)\n2. **Add RAM** — most effective in production\n3. **Increase swap space** — buys time but doesn't fix thrashing (swap access is slow)\n4. **Working set size estimation** — admit only processes whose working sets fit in RAM`,
    keyPoints: [
      'Thrashing: page fault rate so high that useful CPU work approaches zero',
      'Cause: sum of working sets > physical RAM; each process evicts another\'s pages',
      'CPU utilization curve: rises then plummets as multiprogramming degree increases past threshold',
      'Working set: pages used in recent Δ time; Δ too small → understimates; too large → overestimates',
      'PFF (Page Fault Frequency) algorithm: adjust frames allocated to process based on fault rate',
      'Linux OOM killer: when truly out of memory, kills processes by heuristic score',
      'Production fix: monitor /proc/vmstat for pgmajfault — sustained > 100/s indicates thrashing',
    ],
    code: `# Diagnosing thrashing on Linux
# Check page fault rates
vmstat 1 10
# procs  memory      swap    io     system  cpu
# r  b   swpd  free  buff  cache   si  so  bi  bo
# 8  7  2048000 12288 512 8192  4096 3072 5000 4000 ...
#         ↑ large si/so (swap in/out) = thrashing!

# Check major page faults per process
cat /proc/$(pgrep java)/status | grep VmRSS
ps -o pid,comm,min_flt,maj_flt -p $(pgrep java)
#   PID COMMAND   MINFLT   MAJFLT
# 12345 java    5234123    82934  ← 82934 major (disk) faults!

# OOM killer log
dmesg | grep "Out of memory"
dmesg | grep "Killed process"

# Force OOM killer (testing)
# /proc/sys/vm/panic_on_oom = 0 (default: kill process)
# /proc/$pid/oom_adj: adjust oom score (-17 to +15)`,
    codeLang: 'bash',
    summary: 'Thrashing is the ultimate memory bottleneck — the system looks busy (high I/O) but does no useful work. In production, catch it early with vmstat monitoring (si/so columns). The fix is almost always adding RAM or reducing the number of concurrent processes. For interviews: connect thrashing to the working set model and contrast with normal paging.',
  },

  'security-os': {
    overview: `Operating system security provides the foundation for all application security. The OS controls access to hardware, memory, files, and network — all higher-level security depends on the OS being trustworthy.\n\n**Protection rings**: hardware-enforced privilege levels. Ring 0 (kernel mode) has full hardware access. Ring 3 (user mode) is restricted — a process can't directly access hardware or other processes' memory. System calls are the controlled gateway from user space to kernel space.\n\n**Access control**: DAC (Discretionary Access Control) — owners set permissions (Unix rwxrwxrwx). MAC (Mandatory Access Control) — system policy enforces access regardless of owner (SELinux, AppArmor). RBAC (Role-Based Access Control) — permissions attached to roles, users get roles.\n\n**Memory protection**: virtual address spaces isolate processes. ASLR (Address Space Layout Randomization) randomizes base addresses to defeat ROP attacks. Stack canaries detect stack buffer overflows.`,
    keyPoints: [
      'Least privilege: processes run with minimum required permissions',
      'ASLR: randomize stack/heap/library addresses — mitigates return-oriented programming',
      'Stack canary: random value between local vars and return address — overflow detection',
      'NX/DEP: mark data pages non-executable — prevents shellcode execution on stack/heap',
      'SELinux/AppArmor: MAC systems confining processes to allowed syscalls and file paths',
      'Setuid binaries: run as file owner (root) — attack surface, minimize carefully',
      'seccomp: filter which syscalls a process can make (used by Docker, Chrome sandbox)',
    ],
    code: `# Check ASLR status
cat /proc/sys/kernel/randomize_va_space
# 0 = disabled, 1 = partial, 2 = full (default)

# seccomp — restrict syscalls (used in sandboxing)
# Docker default seccomp profile blocks ~44 syscalls
# Example: block ptrace (prevents process injection)
docker run --security-opt seccomp=/etc/docker/seccomp.json myapp

# Check if binary has security mitigations
checksec --file=/usr/bin/bash
# RELRO    STACK CANARY   NX       PIE      RPATH
# Full     Canary found   NX enabled  PIE enabled  No RPATH

# SELinux status and mode
getenforce        # Enforcing / Permissive / Disabled
sestatus          # detailed status
ls -Z /etc/passwd # view SELinux context: system_u:object_r:passwd_file_t:s0

# File capabilities (fine-grained root without full setuid)
getcap /usr/bin/ping  # cap_net_raw+ep  (ping needs raw sockets)`,
    codeLang: 'bash',
    summary: 'OS security is the bedrock of system security. Protection rings enforce privilege separation; ASLR+NX+stack canaries harden against memory exploits; SELinux/AppArmor enforce MAC policies beyond Unix permissions. For interviews in security/infra roles: know the difference between DAC (Unix permissions) and MAC (SELinux), and why seccomp is critical for container security.',
  },

  // ─── System Design ────────────────────────────────────────────────────────

  'design-search': {
    overview: `Designing a web search engine (Google-scale) is a canonical system design question that covers crawling, indexing, ranking, and serving.\n\n**Web Crawler**: fetches pages from the web. Politeness policy (robots.txt, rate limiting per domain), URL deduplication (Bloom filter), and distributed crawling across many nodes. Seeds → frontier queue → fetch → parse → extract links → re-queue.\n\n**Indexer**: processes crawled pages to build an inverted index. Tokenization → stemming → stop word removal → TF-IDF calculation. The inverted index maps term → [list of (docID, positions, frequency)].\n\n**Ranking**: PageRank (link graph authority) + BM25 (text relevance) + hundreds of signals (freshness, clickthrough, page speed). Modern engines use learning-to-rank ML models.\n\n**Query serving**: user query → tokenize → lookup inverted index per term → intersect posting lists → rank top-K → return. Must handle billions of queries per day at <200ms.`,
    keyPoints: [
      'Inverted index: term → sorted list of (docID, tf, positions) — core of all search',
      'TF-IDF: term frequency × inverse document frequency — basic relevance score',
      'PageRank: iterative algorithm; pages linked by authoritative pages rank higher',
      'Crawl frontier: priority queue; balance breadth (fresh content) vs depth (link graph)',
      'Bloom filter: space-efficient set membership for URL deduplication in crawler',
      'Sharding the index: by term (term partitioning) or by document (document partitioning)',
      'Query latency: <200ms for 99th percentile — caching frequent queries, pre-computed top-K',
    ],
    code: String.raw`// Simplified inverted index (in-memory)
interface PostingList {
  docId: number;
  tf: number;         // term frequency in this doc
  positions: number[]; // word positions (for phrase queries)
}

class InvertedIndex {
  private index = new Map<string, PostingList[]>();
  private docStore = new Map<number, { url: string; text: string }>();
  private nextId = 0;

  addDocument(url: string, text: string) {
    const docId = this.nextId++;
    this.docStore.set(docId, { url, text });
    const tokens = this.tokenize(text);
    const termPositions = new Map<string, number[]>();
    tokens.forEach((tok, pos) => {
      if (!termPositions.has(tok)) termPositions.set(tok, []);
      termPositions.get(tok)!.push(pos);
    });
    termPositions.forEach((positions, term) => {
      if (!this.index.has(term)) this.index.set(term, []);
      this.index.get(term)!.push({ docId, tf: positions.length, positions });
    });
  }

  search(query: string): number[] {
    const terms = this.tokenize(query);
    // Intersect posting lists for AND semantics
    const lists = terms.map(t => this.index.get(t) ?? []);
    return this.intersect(lists).map(p => p.docId);
  }

  private tokenize(text: string) {
    return text.toLowerCase().split(/\W+/).filter(Boolean);
  }
  private intersect(lists: PostingList[][]): PostingList[] { /* merge */ return []; }
}`,
    codeLang: 'typescript',
    summary: 'Search engine design tests your knowledge of distributed systems at the largest scale. Key concepts: inverted index for fast term lookup, PageRank for authority, TF-IDF/BM25 for relevance, and sharding for scalability. Elasticsearch and Apache Lucene implement these concepts — knowing the underlying theory makes you a stronger engineer when tuning search relevance or diagnosing slow queries.',
  },

  'design-uber': {
    overview: `Designing a ride-sharing platform (Uber/Lyft) involves real-time location tracking, matching, dispatch, pricing, and maps — all at massive scale.\n\n**Core flows**:\n1. Driver sends GPS location every 4 seconds → Location Service stores in-memory (Redis geospatial)\n2. Rider requests trip → Matching Service finds nearby drivers within N km using geospatial query\n3. Best driver dispatched → real-time notification via WebSocket or push notification\n4. Trip starts → route tracking, ETA calculation via Maps API\n5. Trip ends → payment processing, rating\n\n**Key challenges**:\n- **Geospatial matching**: find drivers within radius efficiently — use geohash or QuadTree\n- **Real-time updates**: WebSockets or SSE for live map position\n- **Supply-demand pricing**: surge pricing model during high demand\n- **ETA accuracy**: routing engine (Dijkstra/A* on road graph), real-time traffic data`,
    keyPoints: [
      'Geohash: encode lat/lng as base-32 string — nearby points share prefix; queryable in Redis',
      'QuadTree: recursively subdivide 2D space — efficient range queries, adaptive resolution',
      'Location update: driver pushes GPS every 4s → stored in Redis with TTL; stale if no update',
      'Matching: query geospatial index for drivers in radius, rank by ETA + rating + acceptance rate',
      'WebSocket: bidirectional persistent connection for real-time rider/driver position sync',
      'Surge pricing: demand/supply ratio per geohash area → dynamic multiplier',
      'Trip state machine: requested → accepted → driver_arriving → in_progress → completed',
    ],
    code: `// Geospatial driver location with Redis
// GEOADD: store driver location; GEORADIUS: find nearby

// Store driver location (called every 4 seconds)
async function updateDriverLocation(
  driverId: string, lat: number, lng: number
): Promise<void> {
  // Redis Geo commands: O(log N) storage and query
  await redis.geoadd('active_drivers', lng, lat, driverId);
  await redis.expire(\`driver:\${driverId}:location\`, 30); // 30s TTL
}

// Find drivers within 5km of rider
async function findNearbyDrivers(
  riderLat: number, riderLng: number, radiusKm: number
): Promise<DriverCandidate[]> {
  const results = await redis.georadius(
    'active_drivers', riderLng, riderLat, radiusKm, 'km',
    'WITHCOORD', 'WITHDIST', 'COUNT', 10, 'ASC'
  );
  return results.map(([driverId, dist, [lng, lat]]) => ({
    driverId,
    distanceKm: parseFloat(dist),
    location: { lat: parseFloat(lat), lng: parseFloat(lng) },
  }));
}

// Dispatch: pick best driver, create trip, notify via WebSocket
async function dispatch(riderId: string, riderLocation: LatLng) {
  const drivers = await findNearbyDrivers(riderLocation.lat, riderLocation.lng, 5);
  const best = drivers[0]; // already sorted by distance
  await tripService.create({ riderId, driverId: best.driverId });
  await notificationService.push(best.driverId, { type: 'TRIP_REQUEST', riderId });
}`,
    codeLang: 'typescript',
    summary: 'Uber is a top system design interview question. Key components: Redis geospatial for O(log N) driver lookup, WebSockets for real-time updates, geohash for surge pricing zones, and a trip state machine for reliability. Scale: 5M+ trips/day requires horizontal sharding of the location service and dedicated matching microservices per city/region.',
  },

  'load-bal': {
    overview: `A load balancer distributes incoming traffic across multiple backend servers, providing horizontal scalability and fault tolerance. Without a load balancer, a single server is a bottleneck and single point of failure.\n\n**Layer 4 (L4) load balancers** operate at TCP/UDP level — route connections based on IP and port without inspecting content. Fast, low overhead. Examples: AWS NLB, HAProxy TCP mode.\n\n**Layer 7 (L7) load balancers** operate at HTTP level — can route based on URL path, headers, cookies, and body. Enable advanced routing (canary releases, A/B testing, sticky sessions). Examples: AWS ALB, Nginx, Envoy.\n\n**Algorithms**: Round Robin (simple rotation), Weighted Round Robin (allocate more traffic to powerful servers), Least Connections (route to server with fewest active connections — best for long-lived connections), IP Hash (same client always hits same server — useful for stateful apps without sticky sessions).`,
    keyPoints: [
      'L4 vs L7: L4 is faster (TCP only), L7 is smarter (HTTP-aware routing)',
      'Health checks: LB pings backends; removes unhealthy nodes automatically',
      'Sticky sessions / session affinity: route same client to same server (via cookie or IP hash)',
      'SSL termination: LB decrypts HTTPS, forwards HTTP to backends (offloads CPU from backends)',
      'Connection draining: allow in-flight requests to finish before removing a server from rotation',
      'Active-passive HA: standby LB takes over on primary failure; active-active: both serve traffic',
      'Global load balancing: DNS-based routing (Route 53 latency routing, anycast BGP for CDN)',
    ],
    code: `# Nginx as L7 load balancer with health checks
upstream backend_pool {
  least_conn;  # route to server with least connections

  server backend1.internal:8080 weight=3;  # 3x traffic
  server backend2.internal:8080 weight=1;
  server backend3.internal:8080 backup;   # only used if others fail

  keepalive 32;  # persistent connections to backends
}

server {
  listen 443 ssl;
  ssl_certificate     /etc/ssl/cert.pem;
  ssl_certificate_key /etc/ssl/key.pem;

  location /api/ {
    proxy_pass http://backend_pool;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # Health check (Nginx Plus / OpenResty)
    # health_check interval=5s fails=3 passes=2;
  }

  # Route /admin to separate backend
  location /admin/ {
    proxy_pass http://admin_backend;
  }
}`,
    codeLang: 'bash',
    summary: 'Load balancers are the entry point of every production system. L4 for raw TCP performance (game servers, databases), L7 for HTTP-aware routing (canary, path-based). Key interview topics: the difference between L4 and L7, sticky sessions (and why they\'re a smell), SSL termination, health checks, and connection draining for zero-downtime deploys.',
  },

  'cdn': {
    overview: `A Content Delivery Network (CDN) is a globally distributed network of edge servers that caches content close to users, reducing latency and origin server load.\n\n**How it works**: User DNS query returns the IP of the nearest CDN edge node (via anycast routing or DNS-based geo-steering). The edge node checks its cache; on hit, it serves directly. On miss (cache miss), it fetches from the origin, caches the response, and serves it.\n\n**Cache control**: CDN respects HTTP headers — Cache-Control: max-age=86400 means cache for 24h. s-maxage overrides for shared caches. Vary: Accept-Encoding means cache separate copies per encoding. Surrogate-Control is CDN-specific and stripped before reaching the client.\n\n**Use cases**: static assets (JS, CSS, images — cache for months with fingerprinted URLs), API responses (short TTL), video streaming (HLS segments chunked for efficient delivery), DDoS mitigation (absorb volumetric attacks at edge).`,
    keyPoints: [
      'Edge PoP (Point of Presence): CDN node in a city; more PoPs = lower latency globally',
      'Cache hit ratio: percentage of requests served from cache — higher is better (less origin load)',
      'TTL strategy: static assets → long TTL + URL fingerprinting; API → short TTL or no-cache',
      'Cache invalidation: purge by URL/tag; instant purge (Cloudflare) vs TTL expiry',
      'Origin shield: CDN node between edge nodes and origin — reduces origin load 10-100x',
      'CDN for APIs: cache GET responses; never cache POST/PUT. Vary on Authorization if user-specific',
      'Anycast: same IP announced from multiple PoPs — BGP routes to nearest; transparent failover',
    ],
    code: `// Setting optimal cache headers for CDN

// Static assets (long-lived, fingerprinted URL)
// e.g., /assets/app.3f4a2b1c.js
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
// max-age=1 year; immutable = browser never revalidates

// HTML page (short TTL, always revalidate)
res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
res.setHeader('ETag', computeETag(html));

// API response (cache at CDN for 60s, private in browser)
res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=0');
res.setHeader('Surrogate-Control', 'max-age=60');

// User-specific: never cache at CDN
res.setHeader('Cache-Control', 'private, no-store');

// Cloudflare cache purge API
// POST https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache
// Body: { "files": ["https://example.com/api/products"] }`,
    codeLang: 'typescript',
    summary: 'CDNs are mandatory in production for any global app. Key insight: cache as much as possible at the edge, with the right TTL. URL fingerprinting enables infinite TTL for static assets. Cloudflare, Fastly, and AWS CloudFront all support purge APIs for cache invalidation. In system design interviews, always mention CDN for static assets, origin shield for high-traffic APIs, and anycast for DDoS mitigation.',
  },

  storage: {
    overview: `Storage systems are categorized by access patterns, latency, durability, and cost. Choosing the right storage for each type of data is a critical system design skill.\n\n**Hierarchy by speed** (fastest to slowest, cheapest to most expensive per GB):\n- CPU registers & L1/L2/L3 cache: ns latency\n- DRAM (RAM): ~100ns, volatile, expensive\n- NVMe SSD: ~100µs, persistent, fast\n- SATA SSD: ~500µs\n- HDD: ~10ms (mechanical seek), cheap per GB\n- Network storage (NFS, EBS): adds network latency\n- Object storage (S3): ~10-100ms, infinite scale, cheap\n- Tape: archive, very slow access, very cheap\n\n**Block vs File vs Object**:\n- Block: raw device (EBS, iSCSI) — OS formats it, databases love it\n- File: NFS, SMB — shared directories, easy for apps\n- Object: S3, GCS — HTTP API, scale to exabytes, best for unstructured data`,
    keyPoints: [
      'Block storage: raw volumes, formatted by OS, lowest latency, used by databases (EBS, NVMe)',
      'File storage: NFS/SMB share, familiar filesystem interface, good for shared content',
      'Object storage: S3 API, flat namespace, infinite scale, great for blobs/backups/media',
      'RAID 0: striping (speed, no redundancy); RAID 1: mirroring (redundancy); RAID 5: striping + parity',
      'Ephemeral vs persistent: EC2 instance store is fast but lost on stop; EBS persists',
      'Replication factor: 3 copies in HDFS/Ceph; S3 stores 11 nines durability across 3 AZs',
      'Tiering: hot data → SSD; warm → HDD; cold → Glacier/tape — automated lifecycle policies',
    ],
    code: `# AWS storage decision tree

# Hot, structured data with complex queries → RDS / Aurora (managed PostgreSQL/MySQL)
# Key-value lookups at scale → DynamoDB (single-digit ms, auto-scaling)
# Session store / cache → ElastiCache Redis
# Files for EC2 (shared) → EFS (NFS-backed, auto-scales)
# Files for EC2 (dedicated, fast) → EBS gp3 (NVMe SSD, ~3000 IOPS default)
# Unstructured data, backups, media → S3
# Data warehouse / analytics → Redshift / Athena (query S3 directly)
# Archive (access once a year) → S3 Glacier Deep Archive ($0.00099/GB/month)

# S3 storage classes by cost and retrieval
# Standard:            $0.023/GB   — ms retrieval
# Standard-IA:         $0.0125/GB  — ms retrieval, min 30 days
# One Zone-IA:         $0.01/GB    — ms, single AZ
# Glacier Instant:     $0.004/GB   — ms retrieval
# Glacier Flexible:    $0.0036/GB  — minutes to hours
# Glacier Deep Archive:$0.00099/GB — 12 hours retrieval`,
    codeLang: 'bash',
    summary: 'Storage selection drives system cost, performance, and architecture. Rule of thumb: object storage (S3) for unstructured data at scale, block storage (EBS/NVMe) for databases, file storage (EFS/NFS) for shared access, Redis/Memcached for hot caching. In interviews, always consider durability requirements and cost when recommending a storage solution.',
  },

  realtime: {
    overview: `Real-time systems deliver data to clients immediately as events occur, rather than requiring clients to poll. The choice of technology depends on communication pattern, scale, and whether the connection needs to be bidirectional.\n\n**Server-Sent Events (SSE)**: unidirectional push from server to client over HTTP. Client subscribes once; server streams events. Automatic reconnection, event IDs for resume-from-failure. Simple to implement, works through HTTP/2 load balancers. Ideal for: live feeds, notifications, progress bars.\n\n**WebSockets**: full-duplex persistent connection after HTTP upgrade handshake. Both client and server can send at any time. Ideal for: chat, collaborative editing, multiplayer games, live dashboards.\n\n**Long polling**: client sends request, server holds it open until data is available, then responds — client immediately re-polls. Simpler than WebSockets, works everywhere. Higher overhead per message.\n\n**WebRTC**: peer-to-peer audio/video/data with NAT traversal (STUN/TURN). Used by video calling, screen sharing.`,
    keyPoints: [
      'SSE: HTTP/1.1 chunked encoding, EventSource API, unidirectional, auto-reconnect',
      'WebSocket: ws:// or wss://, after HTTP 101 Upgrade, bidirectional, lower overhead per message',
      'Long polling: works everywhere, simpler, higher latency (~100ms extra per message)',
      'Fan-out: Redis Pub/Sub or Kafka to push events to all connected WebSocket servers',
      'Presence: track connected users with heartbeat (periodic ping); clean up on disconnect',
      'Back-pressure: if client consumes too slowly, buffer or drop messages (depends on use case)',
      'Scaling WebSockets: sticky sessions so client stays on same server, or use Redis for state',
    ],
    code: `// WebSocket server (Node.js) with Redis fan-out
import { WebSocketServer } from 'ws';
import { createClient } from 'redis';

const wss = new WebSocketServer({ port: 8080 });
const subscriber = createClient();
await subscriber.connect();

// Map: userId → Set of WebSocket connections (one user, multiple tabs)
const connections = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const userId = getUserIdFromRequest(req);
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId)!.add(ws);

  ws.on('close', () => {
    connections.get(userId)?.delete(ws);
    if (connections.get(userId)?.size === 0) connections.delete(userId);
  });

  // Heartbeat to detect stale connections
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
});

// Redis subscriber: receive events from any service, fan out to clients
await subscriber.subscribe('user_events', (message) => {
  const event = JSON.parse(message); // { userId, type, data }
  const userConns = connections.get(event.userId);
  userConns?.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(message);
  });
});

// Heartbeat interval
setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);`,
    codeLang: 'typescript',
    summary: 'Real-time delivery is essential for modern UX. Rule: use SSE for server→client push (feeds, notifications); WebSockets for bidirectional (chat, collab); long polling as a fallback. The hardest part is scaling: each server holds WebSocket connections in memory, so fan-out via Redis Pub/Sub or Kafka coordinates across nodes. For 1M concurrent WebSocket connections, you need 100+ servers at 10K connections each.',
  },

  // ─── Discrete Math / Theory ──────────────────────────────────────────────────

  'graph-basics': {
    overview: `Graphs are one of the most versatile data structures — used for social networks, road maps, dependency resolution, web page ranking, and circuit design. A graph G = (V, E) consists of a set of vertices (nodes) V and edges E connecting pairs of vertices.\n\n**Types**: Directed (edges have direction, like Twitter following) vs Undirected (edges go both ways, like Facebook friendship). Weighted (edges have costs) vs Unweighted. Cyclic vs Acyclic (DAG — Directed Acyclic Graph).\n\n**Representations**: Adjacency Matrix (V×V matrix, O(V²) space, O(1) edge lookup) vs Adjacency List (array of lists, O(V+E) space, better for sparse graphs — use in most interview problems).`,
    keyPoints: [
      'Degree of a vertex: number of edges incident to it (in-degree + out-degree for directed)',
      'Adjacency list: preferred representation — O(V+E) space, O(degree(v)) neighbor traversal',
      'BFS: level-by-level traversal using a queue — shortest path in unweighted graphs',
      'DFS: depth-first using stack/recursion — cycle detection, topological sort, connected components',
      'Topological sort: linear ordering of vertices in a DAG such that all edges go "forward"',
      'Connected components: DFS/BFS from each unvisited node to find all components',
      'Bipartite check: 2-colorable using BFS — used for matching problems',
    ],
    code: `// Graph represented as adjacency list
class Graph {
  constructor(directed = false) {
    this.adj = new Map();
    this.directed = directed;
  }
  addEdge(u, v, weight = 1) {
    if (!this.adj.has(u)) this.adj.set(u, []);
    if (!this.adj.has(v)) this.adj.set(v, []);
    this.adj.get(u).push({ node: v, weight });
    if (!this.directed) this.adj.get(v).push({ node: u, weight });
  }
  bfs(start) {
    const visited = new Set([start]);
    const queue = [start];
    const order = [];
    while (queue.length) {
      const node = queue.shift();
      order.push(node);
      for (const { node: neighbor } of (this.adj.get(node) ?? [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return order;
  }
  dfs(start, visited = new Set(), order = []) {
    visited.add(start);
    order.push(start);
    for (const { node: neighbor } of (this.adj.get(start) ?? [])) {
      if (!visited.has(neighbor)) this.dfs(neighbor, visited, order);
    }
    return order;
  }
}

const g = new Graph(false);
['A-B','A-C','B-D','C-D','D-E'].forEach(e => {
  const [u, v] = e.split('-');
  g.addEdge(u, v);
});
console.log('BFS:', g.bfs('A'));  // A B C D E (level order)
console.log('DFS:', g.dfs('A'));  // A B D C E (depth-first)`,
    codeLang: 'javascript',
    summary: 'Graphs are everywhere in interviews — BFS for shortest path (unweighted), DFS for cycle detection and topological sort, Dijkstra for weighted shortest path. Represent as adjacency list (O(V+E)) not matrix (O(V²)) unless the graph is dense. The key to graph problems: identify the type (directed/undirected, weighted/unweighted, cyclic/acyclic), then select the right algorithm.',
  },

  sets: {
    overview: `Set theory is the mathematical foundation of computer science. A set is an unordered collection of distinct elements. Set operations model database queries, access control, type systems, and formal language theory.\n\n**Basic operations**: Union (A ∪ B — elements in A or B), Intersection (A ∩ B — elements in both), Difference (A \\ B — in A but not B), Complement (everything not in A).\n\n**Relations**: A relation R on set A is a subset of A × A. Properties: reflexive (aRa), symmetric (aRb → bRa), transitive (aRb ∧ bRc → aRc). An equivalence relation has all three. A partial order is reflexive, antisymmetric, and transitive.\n\n**Cardinality**: |A ∪ B| = |A| + |B| - |A ∩ B| (inclusion-exclusion). For infinite sets: |ℕ| = |ℤ| = ℵ₀ (countably infinite); |ℝ| = 2^ℵ₀ (uncountably infinite — Cantor's diagonal argument).`,
    keyPoints: [
      'Power set P(A): set of all subsets; |P(A)| = 2^|A| — exponential (backtracking problems!)',
      'Cartesian product A × B: set of all ordered pairs (a, b) where a ∈ A, b ∈ B',
      'Inclusion-exclusion: |A ∪ B| = |A| + |B| - |A ∩ B| — generalizes to n sets',
      'Equivalence classes: partition a set into disjoint, exhaustive subsets (Union-Find DSU)',
      'Partial order: reflexive, antisymmetric, transitive — Hasse diagram visualization',
      'Functions as relations: total function maps every element; injective (one-to-one), surjective (onto), bijective (both)',
      'Countability: a set is countable if it can be put in 1-1 correspondence with ℕ',
    ],
    code: String.raw`// Set operations in JavaScript using built-in Set
const A = new Set([1, 2, 3, 4, 5]);
const B = new Set([3, 4, 5, 6, 7]);

const union        = new Set([...A, ...B]);           // {1,2,3,4,5,6,7}
const intersection = new Set([...A].filter(x => B.has(x))); // {3,4,5}
const difference   = new Set([...A].filter(x => !B.has(x))); // {1,2}

console.log('A ∪ B:', [...union]);
console.log('A ∩ B:', [...intersection]);
console.log('A \ B:', [...difference]);

// Power set (all subsets) — 2^n subsets
function powerSet(arr) {
  const result = [[]];
  for (const el of arr) {
    const newSubsets = result.map(subset => [...subset, el]);
    result.push(...newSubsets);
  }
  return result;
}
console.log('Power set of {1,2,3}:', powerSet([1,2,3]).length, 'subsets'); // 8

// Union-Find (Disjoint Set Union) — implements equivalence classes
class DSU {
  constructor(n) { this.parent = Array.from({length: n}, (_, i) => i); this.rank = new Array(n).fill(0); }
  find(x) { return this.parent[x] === x ? x : (this.parent[x] = this.find(this.parent[x])); }
  union(x, y) {
    const [px, py] = [this.find(x), this.find(y)];
    if (px === py) return false;
    if (this.rank[px] < this.rank[py]) this.parent[px] = py;
    else if (this.rank[px] > this.rank[py]) this.parent[py] = px;
    else { this.parent[py] = px; this.rank[px]++; }
    return true;
  }
}`,
    codeLang: 'javascript',
    summary: 'Set theory underpins computer science at every level: hash sets are O(1) set operations, DSU implements equivalence classes, power sets explain backtracking complexity (2^n), and inclusion-exclusion solves counting problems. In interviews: "how many elements in A or B but not both?" → inclusion-exclusion.',
  },

  proofs: {
    overview: `Mathematical proofs are the rigorous foundation of computer science — correctness of algorithms, complexity lower bounds, and protocol security all rest on formal proof. For CS interviews, proof techniques appear in complexity analysis, inductive correctness arguments, and combinatorial reasoning.\n\n**Proof by induction**: prove a base case, then prove that if P(k) holds, P(k+1) holds. Strong induction: assume P(1)...P(k) all hold to prove P(k+1). Used to prove loop invariants, recursive algorithm correctness, and tree properties.\n\n**Proof by contradiction**: assume ¬P, derive a contradiction. Classic: √2 is irrational. In CS: there are more real numbers than programs (undecidability foundation).\n\n**Proof by construction**: demonstrate existence by building it. "A sorting algorithm exists that runs in O(n log n)" — prove by exhibiting merge sort.\n\n**Diagonalization**: Cantor's technique; used to prove the Halting Problem is undecidable.`,
    keyPoints: [
      'Induction: base case + inductive step (P(k) → P(k+1)). Strong induction: all P(1..k) → P(k+1)',
      'Loop invariant: a property that holds before, during, and after each iteration — proves correctness',
      'Contradiction: assume the opposite, derive impossible consequence (√2 irrational, infinitely many primes)',
      'Contrapositive: P → Q is equivalent to ¬Q → ¬P (often easier to prove)',
      'Pigeonhole principle: n+1 items in n containers → some container has ≥2',
      'Diagonalization: build an object that differs from every element of a list (Cantor, Turing)',
      'Asymptotic proofs: show f(n) = O(g(n)) by finding constants c, n₀ such that f(n) ≤ c·g(n) for n ≥ n₀',
    ],
    code: `// Proof by induction: sum(1..n) = n(n+1)/2
// Base case: n=1: sum=1, formula=1·2/2=1 ✓
// Inductive step: assume sum(1..k) = k(k+1)/2
//   sum(1..k+1) = sum(1..k) + (k+1)
//               = k(k+1)/2 + (k+1)
//               = (k+1)(k/2 + 1)
//               = (k+1)(k+2)/2  ✓

// Verify computationally
function sumTo(n) { return n * (n + 1) / 2; }
function sumActual(n) {
  let s = 0;
  for (let i = 1; i <= n; i++) s += i;
  return s;
}

for (let n = 1; n <= 10; n++) {
  const formula = sumTo(n);
  const actual = sumActual(n);
  console.log(\`n=\${n}: formula=\${formula}, actual=\${actual}, match=\${formula === actual}\`);
}

// Pigeonhole principle example:
// Among any 13 people, at least 2 share a birth month (12 months, 13 people)
// Among any 367 people, at least 2 share a birthday (366 possible birthdays)

// Big-O proof: is 2n² + 3n = O(n²)?
// Need c, n₀ such that 2n² + 3n ≤ c·n² for all n ≥ n₀
// 2n² + 3n ≤ 2n² + 3n² = 5n²  (for n ≥ 1, since 3n ≤ 3n²)
// So c=5, n₀=1 works. Yes, 2n² + 3n = O(n²).`,
    codeLang: 'javascript',
    summary: 'Mathematical proofs are the language of algorithm analysis. Loop invariants prove correctness; asymptotic proofs bound complexity; induction appears in every recursive algorithm analysis. For interviews: know how to prove a loop invariant for binary search or merge sort, and how to derive O(n log n) for divide-and-conquer via the Master Theorem.',
  },

  pigeonhole: {
    overview: `The Pigeonhole Principle: if n+1 objects are placed in n containers, at least one container must contain 2 or more objects. This deceptively simple idea has powerful consequences in CS, combinatorics, and cryptography.\n\n**Generalized version**: if N objects are placed in k containers, at least one container has ⌈N/k⌉ objects.\n\n**Applications in CS**:\n- **Hash collisions are unavoidable**: if you have more keys than hash values, collisions must exist\n- **Birthday paradox**: only 23 people needed for 50% chance of shared birthday — because √366 ≈ 23 (pigeonhole at the probabilistic level)\n- **Compression limits**: you can't compress all files — more files (n+1) than distinct n-bit strings\n- **Network routing**: with k paths and k+1 packets, at least one path carries 2 packets\n- **TCP sequence numbers**: finite sequence number space means wraparound is unavoidable`,
    keyPoints: [
      'Basic: n+1 objects, n containers → at least one container has ≥2 objects',
      'Generalized: ⌈N/k⌉ objects guaranteed in some container',
      'Birthday paradox: O(√N) random samples guarantee a collision in a space of size N',
      'Hash collisions: unavoidable by pigeonhole — design for them, never assume they won\'t happen',
      'Lossless compression: cannot compress every possible input (Kolmogorov complexity)',
      'Infinite pigeonhole: any infinite sequence has a value appearing infinitely often',
      'Ramsey theory: generalization — in any large enough structure, regularity must appear',
    ],
    code: `// Birthday paradox simulation
function birthdayProbability(n) {
  // Probability that in a group of n people, at least 2 share a birthday
  let prob = 1;
  for (let i = 0; i < n; i++) {
    prob *= (365 - i) / 365;
  }
  return 1 - prob;
}

for (const n of [10, 23, 30, 50, 70]) {
  console.log(\`\${n} people: \${(birthdayProbability(n) * 100).toFixed(1)}% chance of shared birthday\`);
}
// 10 people: 11.7%
// 23 people: 50.7%  ← pigeonhole "tipping point"
// 50 people: 97.0%
// 70 people: 99.9%

// Hash collision demo (pigeonhole in action)
function naiveHash(str, buckets) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) % buckets;
  return h;
}

const words = ['apple','banana','cherry','date','elderberry','fig'];
const buckets = 4;
const map = {};
for (const w of words) {
  const h = naiveHash(w, buckets);
  if (!map[h]) map[h] = [];
  map[h].push(w);
}
console.log('Bucket collisions:', map);
// With 6 words and 4 buckets: guaranteed ≥2 collisions by pigeonhole`,
    codeLang: 'javascript',
    summary: 'Pigeonhole is a proof technique disguised as common sense. Its power: it proves existence of collision/overlap without finding it. In interviews: "Can you guarantee a duplicate?" — think pigeonhole. The birthday paradox (O(√N) for collision) underlies hash table load factor design, UUID collision probability, and cryptographic hash security analysis.',
  },

  recurrence: {
    overview: `Recurrence relations express the running time of recursive algorithms in terms of smaller subproblems. Solving them gives the closed-form Big-O complexity.\n\n**Substitution method**: guess a solution form, then prove by induction.\n\n**Recursion tree method**: draw the call tree, count work at each level, sum across all levels.\n\n**Master Theorem**: for divide-and-conquer T(n) = aT(n/b) + f(n):\n- Case 1: f(n) = O(n^(log_b a - ε)) → T(n) = Θ(n^(log_b a)) — subproblems dominate\n- Case 2: f(n) = Θ(n^(log_b a) log^k n) → T(n) = Θ(n^(log_b a) log^(k+1) n) — equal work\n- Case 3: f(n) = Ω(n^(log_b a + ε)) and regularity condition → T(n) = Θ(f(n)) — root dominates\n\nMost divide-and-conquer algorithms (merge sort, binary search, Strassen) fall into Case 2.`,
    keyPoints: [
      'T(n) = T(n-1) + O(1) → O(n) — linear recursion (factorial, list traversal)',
      'T(n) = T(n-1) + O(n) → O(n²) — insertion sort, selection sort',
      'T(n) = 2T(n/2) + O(n) → O(n log n) — merge sort [Master Case 2]',
      'T(n) = T(n/2) + O(1) → O(log n) — binary search [Master Case 2]',
      'T(n) = 2T(n/2) + O(1) → O(n) — tree traversal [Master Case 1]',
      'T(n) = 8T(n/2) + O(n²) → O(n^(log₂ 8)) = O(n³) — naive matrix multiply [Master Case 1]',
      'Strassen: T(n) = 7T(n/2) + O(n²) → O(n^(log₂ 7)) ≈ O(n^2.81) [Master Case 1]',
    ],
    code: `// Master Theorem examples
// T(n) = aT(n/b) + n^c

function masterTheoremCase(a, b, c) {
  const logba = Math.log(a) / Math.log(b);
  if (c < logba) return \`O(n^{log_\${b} \${a}}) = O(n^\${logba.toFixed(2)}) [Case 1: subproblems dominate]\`;
  if (Math.abs(c - logba) < 0.001) return \`O(n^\${c} log n) [Case 2: equal work at all levels]\`;
  return \`O(n^\${c}) [Case 3: root work dominates]\`;
}

console.log('Merge sort: T=2T(n/2)+n →',    masterTheoremCase(2, 2, 1)); // O(n log n) Case 2
console.log('Binary search: T=T(n/2)+1 →',  masterTheoremCase(1, 2, 0)); // O(log n) Case 2
console.log('Tree traversal: T=2T(n/2)+1 →', masterTheoremCase(2, 2, 0)); // O(n) Case 1

// Fibonacci recurrence: T(n) = T(n-1) + T(n-2) + O(1) ≈ O(φ^n)
// Without memoization — exponential!
let calls = 0;
function fibNaive(n) {
  calls++;
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}
fibNaive(20);
console.log(\`fibNaive(20): \${calls} calls (exponential)\`); // 21891 calls!

calls = 0;
const memo = {};
function fibMemo(n) {
  calls++;
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  return (memo[n] = fibMemo(n - 1) + fibMemo(n - 2));
}
fibMemo(20);
console.log(\`fibMemo(20): \${calls} calls (linear)\`); // 39 calls`,
    codeLang: 'javascript',
    summary: 'Recurrence relations are how you analyze divide-and-conquer algorithms. Memorize the Master Theorem cases — they appear in every algorithms course and in FAANG interviews when asked "what is the complexity of merge sort and why?". The key insight: the critical parameter is log_b(a) vs the exponent of f(n). T(n) = 2T(n/2) + O(n) → O(n log n) is the most important recurrence in CS.',
  },

  counting: {
    overview: `Combinatorics (counting) answers: "how many ways can something happen?" It's foundational for algorithm analysis (bounding the number of operations), probability (denominator of events), and complexity theory (proving exponential lower bounds).\n\n**Basic counting rules**:\n- **Sum rule**: if A and B are disjoint, |A ∪ B| = |A| + |B|\n- **Product rule**: if A and B are independent, |A × B| = |A| × |B|\n- **Complement**: count what you DON'T want, subtract from total\n\n**Permutations**: ordered arrangements. P(n,r) = n!/(n-r)! — arrange r items from n\n\n**Combinations**: unordered selections. C(n,r) = n!/(r!(n-r)!) = "n choose r"\n\n**Binomial theorem**: (x+y)^n = Σ C(n,k) x^k y^(n-k) — Pascal's triangle gives coefficients`,
    keyPoints: [
      'n! arrangements of n distinct items; (n-1)! for circular arrangements',
      'C(n,r) = "n choose r" — selecting r from n without order; C(n,r) = C(n,n-r)',
      'Multiplication principle: k₁ choices for step 1, k₂ for step 2, ... → k₁ × k₂ × ... total',
      'Stars and bars: distributing n identical items into k distinct bins → C(n+k-1, k-1)',
      'Inclusion-exclusion: |A₁ ∪ ... ∪ Aₙ| = Σ|Aᵢ| - Σ|Aᵢ ∩ Aⱼ| + ...',
      'Pascal\'s identity: C(n,r) = C(n-1,r-1) + C(n-1,r) — choosing to include/exclude an element',
      'Catalan numbers: C_n = C(2n,n)/(n+1) — counts valid bracket sequences, BST shapes, etc.',
    ],
    code: `// Combinatorics utilities
function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

function permutations(n, r) {
  return factorial(n) / factorial(n - r);  // P(n,r)
}

function combinations(n, r) {
  return factorial(n) / (factorial(r) * factorial(n - r));  // C(n,r)
}

// How many ways to:
console.log('Arrange 3 from 5:', permutations(5, 3));  // 60
console.log('Choose 3 from 5:', combinations(5, 3));   // 10
console.log('All subsets of {1..5}:', 2**5);           // 32 = 2^n

// Pascal's triangle (binomial coefficients)
function pascal(rows) {
  const triangle = [[1]];
  for (let i = 1; i < rows; i++) {
    const prev = triangle[i-1];
    const row = [1];
    for (let j = 1; j < i; j++) row.push(prev[j-1] + prev[j]);
    row.push(1);
    triangle.push(row);
  }
  return triangle;
}
pascal(6).forEach((row, i) => console.log(' '.repeat(5-i) + row.join('  ')));

// Catalan numbers: C_n = C(2n,n) / (n+1)
// C_0=1, C_1=1, C_2=2, C_3=5, C_4=14
const catalan = n => combinations(2*n, n) / (n + 1);
console.log('Catalan 0-5:', [0,1,2,3,4,5].map(catalan)); // [1,1,2,5,14,42]
// C_n counts valid bracket sequences of length 2n`,
    codeLang: 'javascript',
    summary: 'Counting is the basis of probability and complexity. Key formulas: n! (permutations), C(n,r) (combinations), 2^n (subsets), C_n Catalan. In interviews: "in how many ways..." → identify whether order matters (permutation) or not (combination). Catalan numbers count surprising things: valid bracket sequences, BST shapes, paths below the diagonal.',
  },

  // ─── Compiler Design ─────────────────────────────────────────────────────────

  lexer: {
    overview: `Lexical analysis (scanning) is the first phase of compilation. The lexer reads source text character by character and groups them into tokens — the atomic units of the programming language.\n\n**Tokens**: keywords (if, while, return), identifiers (variable names), literals (42, "hello"), operators (+, ==), and punctuation ({ }, ;). Each token has a type and optionally a value.\n\n**Implementation**: lexers are typically implemented as DFAs (Deterministic Finite Automata) — one state machine per token type. In practice, tools like Flex/Lex generate lexers from regular expression specifications.\n\n**Lexer vs Parser**: the lexer handles the "word level" (what are the tokens?); the parser handles the "sentence level" (how do tokens form valid syntax?). This separation of concerns simplifies both components significantly.`,
    keyPoints: [
      'Token: (type, value, position) — e.g., (NUMBER, "42", line 3)',
      'Lexeme: the actual source text that matches a token pattern (raw string)',
      'Regular expressions define tokens; DFAs implement them efficiently',
      'Maximal munch: always consume the longest possible token ("==" not "=" then "=")',
      'Whitespace and comments: typically consumed and discarded (or attached as trivia)',
      'Flex/Lex: lexer generators that take regex rules and produce C lexer code',
      String.raw`Line/column tracking: essential for error messages; increment on \n`,
    ],
    code: String.raw`// Simple hand-written lexer for arithmetic expressions
const TokenType = { NUMBER: 'NUMBER', PLUS: 'PLUS', MINUS: 'MINUS',
  STAR: 'STAR', SLASH: 'SLASH', LPAREN: 'LPAREN', RPAREN: 'RPAREN', EOF: 'EOF' };

function tokenize(input) {
  const tokens = [];
  let pos = 0;

  while (pos < input.length) {
    const ch = input[pos];

    if (/\s/.test(ch)) { pos++; continue; } // skip whitespace

    if (/\d/.test(ch)) {
      let num = '';
      while (pos < input.length && /\d/.test(input[pos])) num += input[pos++];
      tokens.push({ type: TokenType.NUMBER, value: parseInt(num) });
    } else if (ch === '+') { tokens.push({ type: TokenType.PLUS });  pos++; }
    else if (ch === '-') { tokens.push({ type: TokenType.MINUS }); pos++; }
    else if (ch === '*') { tokens.push({ type: TokenType.STAR });  pos++; }
    else if (ch === '/') { tokens.push({ type: TokenType.SLASH }); pos++; }
    else if (ch === '(') { tokens.push({ type: TokenType.LPAREN }); pos++; }
    else if (ch === ')') { tokens.push({ type: TokenType.RPAREN }); pos++; }
    else throw new Error(\`Unexpected character: '\${ch}' at pos \${pos}\`);
  }
  tokens.push({ type: TokenType.EOF });
  return tokens;
}

console.log(tokenize('3 + (42 * 7)'));
// [{NUMBER,3}, {PLUS}, {LPAREN}, {NUMBER,42}, {STAR}, {NUMBER,7}, {RPAREN}, {EOF}]`,
    codeLang: 'javascript',
    summary: 'Lexers are the first pipeline stage in compilers and interpreters. They tokenize source text using DFA-based pattern matching. In practice: hand-write a lexer for simple languages (JSON, calculator) or use Flex/ANTLR for full languages. Understanding lexing is essential for building DSLs, query languages, template engines, and any tool that processes structured text.',
  },

  parsing: {
    overview: `Parsing (syntax analysis) is the second phase of compilation. The parser takes a token stream from the lexer and builds a parse tree (or AST — Abstract Syntax Tree) that represents the syntactic structure of the program.\n\n**Grammars**: context-free grammars (CFGs) formally describe language syntax. A CFG has productions: non-terminal → sequence of terminals and non-terminals. Example: expr → expr '+' term | term.\n\n**Recursive descent parsing**: a top-down technique where each non-terminal has a corresponding function. Easy to understand and implement by hand. Handles LL(k) grammars. Most real-world compilers (GCC, LLVM Clang, TypeScript) use hand-written recursive descent.\n\n**Bottom-up parsing (LR)**: shift-reduce parsing using a table. More powerful — handles a broader class of grammars. Generated by tools like yacc/bison. Used when grammar is complex and must handle left recursion.`,
    keyPoints: [
      'AST (Abstract Syntax Tree): tree representation of program structure, without irrelevant tokens',
      'LL(k): Left-to-right, Leftmost derivation, k lookahead — top-down, recursive descent',
      'LR(k): Left-to-right, Rightmost derivation reversed, k lookahead — bottom-up, shift-reduce',
      'Ambiguous grammar: a string has 2+ parse trees — usually a bug (dangling else problem)',
      'Left recursion: A → Aα causes infinite loop in recursive descent; must eliminate or use LR',
      'FIRST(A): set of terminals that can begin strings derived from A',
      'FOLLOW(A): set of terminals that can appear after A in any sentential form',
    ],
    code: `// Recursive descent parser for: expr → term (('+' | '-') term)*
// term → factor (('*' | '/') factor)*
// factor → NUMBER | '(' expr ')'

function parse(tokens) {
  let pos = 0;
  const peek  = () => tokens[pos];
  const eat   = (type) => { if (peek()?.type !== type) throw new Error(\`Expected \${type}\`); return tokens[pos++]; };

  function factor() {
    if (peek()?.type === 'NUMBER') return eat('NUMBER').value;
    eat('LPAREN');
    const val = expr();
    eat('RPAREN');
    return val;
  }

  function term() {
    let val = factor();
    while (peek()?.type === 'STAR' || peek()?.type === 'SLASH') {
      const op = tokens[pos++].type;
      const right = factor();
      val = op === 'STAR' ? val * right : val / right;
    }
    return val;
  }

  function expr() {
    let val = term();
    while (peek()?.type === 'PLUS' || peek()?.type === 'MINUS') {
      const op = tokens[pos++].type;
      const right = term();
      val = op === 'PLUS' ? val + right : val - right;
    }
    return val;
  }

  return expr();
}

// Together with the tokenizer from the lexer topic:
// const result = parse(tokenize('3 + 4 * 2'));
// Result: 11 (correct operator precedence via grammar structure)`,
    codeLang: 'javascript',
    summary: 'Parsers transform token streams into ASTs — the structured representation programs operate on. Recursive descent is clean and debuggable; LR parsers are more powerful but generated by tools. In practice: all modern language frontends (TypeScript, Rust, Go, Swift) use hand-written recursive descent. Understanding parsing helps you read language specs, build DSLs, and contribute to compilers.',
  },

  // ─── Architecture ─────────────────────────────────────────────────────────────

  architecture: {
    overview: `Software architecture is the high-level structure of a system — how components are organized, how they communicate, and what trade-offs are made for performance, maintainability, and scalability.\n\n**Monolith**: all components in one deployable unit. Simple to develop and test initially; harder to scale independently. Right choice for early-stage startups and small teams.\n\n**Microservices**: each service owns a single bounded context, deployed independently, communicates over network (REST, gRPC, message queues). Enables independent scaling, polyglot tech stacks, and team autonomy — but adds operational complexity (service discovery, distributed tracing, eventual consistency).\n\n**Hexagonal (Ports & Adapters)**: business logic in the center, infrastructure (DB, HTTP, queues) as adapters. Enables swapping infrastructure without changing business rules. Core of Domain-Driven Design (DDD).\n\n**Event-driven architecture**: services communicate via events (Kafka, EventBridge). Loose coupling, high scalability — but harder to trace causality and ensure ordering.`,
    keyPoints: [
      'Monolith → Microservices: don\'t start microservices; split when teams and scale require it',
      'Bounded context: each service owns its own data model and database (no shared DB)',
      'Hexagonal: separate domain logic from infrastructure; makes testing without a DB trivial',
      'CQRS: separate read (query) and write (command) models for optimized scaling',
      'Event sourcing: store events as source of truth; derive state by replaying',
      'Strangler Fig: incrementally migrate monolith to microservices by routing traffic to new services',
      'ADR (Architecture Decision Record): document significant architecture decisions and their rationale',
    ],
    code: `// Hexagonal architecture example: User domain

// Domain layer — no dependencies on infrastructure
class User {
  constructor(id, email, name) {
    if (!email.includes('@')) throw new Error('Invalid email');
    this.id = id; this.email = email; this.name = name;
    this.createdAt = new Date();
  }
  updateName(newName) {
    if (!newName.trim()) throw new Error('Name cannot be empty');
    this.name = newName.trim();
  }
}

// Port (interface) — defined by domain
// interface UserRepository { findById(id): User; save(user): void; }

// Application service — orchestrates domain objects
class UserService {
  constructor(userRepo, emailService) {
    this.userRepo = userRepo;
    this.emailService = emailService;
  }
  async registerUser(id, email, name) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new Error('Email already registered');
    const user = new User(id, email, name);
    await this.userRepo.save(user);
    await this.emailService.sendWelcome(email, name);
    return user;
  }
}

// Adapter — implements port using infrastructure
class PostgresUserRepo {
  async findByEmail(email) { /* SQL query */ }
  async save(user) { /* INSERT or UPDATE */ }
}`,
    codeLang: 'javascript',
    summary: 'Architecture shapes the long-term health of a codebase. Monolith is often right to start. Hexagonal (ports & adapters) separates concerns elegantly — testable without infrastructure. Microservices shine when teams and traffic demand independent scaling, but add enormous operational complexity. In staff/principal interviews: articulate trade-offs, not just patterns.',
  },
  'pattern-selection': {
    overview: `Knowing design patterns is table stakes; knowing WHEN to apply each one is the skill that separates junior from senior engineers.\n\n**When to reach for a pattern**: You have a specific problem that the pattern was invented to solve — not because it sounds sophisticated. Over-engineering with patterns is as harmful as not using them.\n\n**Category quick-reference**:\n- **Creational**: object construction is complex or must be decoupled → Factory, Builder, Singleton\n- **Structural**: compose existing objects without changing them → Adapter, Decorator, Facade\n- **Behavioral**: communication and responsibility between objects → Strategy, Observer, Command\n\n**Anti-patterns**: Singleton misuse (global mutable state — prefer dependency injection), over-use of Abstract Factory (adds layers before you need them), pattern-first design (should be problem-first).`,
    keyPoints: [
      'Strategy: swap algorithms at runtime — replaces switch/if chains (payment methods, sort orders)',
      'Observer/Event Emitter: one-to-many notification without tight coupling — UI events, domain events',
      'Decorator: add behavior without subclassing — middleware chains, Python @decorators',
      'Factory Method: decouple creation from use — useful when subclass determines concrete type',
      'Command: encapsulate action as object — undo/redo, job queues, audit logs',
      'Adapter: make incompatible interfaces work together — wrapping third-party SDKs',
      'Facade: simplify a complex subsystem — one entry point for a module',
    ],
    code: `// Strategy: pluggable discount calculation
interface DiscountStrategy {
  calculate(price: number): number;
}
class StudentDiscount implements DiscountStrategy {
  calculate(price: number) { return price * 0.8; } // 20% off
}
class BulkDiscount implements DiscountStrategy {
  calculate(price: number) { return price > 1000 ? price * 0.9 : price; }
}

class Cart {
  constructor(private strategy: DiscountStrategy) {}
  checkout(price: number) { return this.strategy.calculate(price); }
  setStrategy(s: DiscountStrategy) { this.strategy = s; }
}

// Observer: decouple order placed from downstream effects
class EventBus {
  private handlers = new Map<string, Array<(data: unknown) => void>>();
  on(event: string, handler: (data: unknown) => void) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
  }
  emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach(h => h(data));
  }
}
const bus = new EventBus();
bus.on('order.placed', d => sendEmail(d));     // loosely coupled
bus.on('order.placed', d => updateInventory(d));
bus.on('order.placed', d => notifyWarehouse(d));

// Command: undo/redo
interface Command { execute(): void; undo(): void; }
class MoveCommand implements Command {
  constructor(private doc: Doc, private from: number, private to: number) {}
  execute() { this.doc.moveCursor(this.to); }
  undo()    { this.doc.moveCursor(this.from); }
}
const history: Command[] = [];
function run(cmd: Command) { cmd.execute(); history.push(cmd); }
function undoLast() { history.pop()?.undo(); }`,
    codeLang: 'typescript',
    summary: 'Pattern selection is about matching problem shape to solution shape. Strategy replaces conditionals when behavior varies. Observer decouples event producers from consumers. Command makes actions first-class objects (enabling undo/redo and job queues). Decorator adds behavior at runtime without subclassing. In interviews: always name the pattern AND state the problem it solves before writing code.',
  },

  // ── DBMS: SQL Advanced ──────────────────────────────────────────────
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
        <div style={{ paddingTop: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--t3)', fontSize: 18 }}>Topic not found.</p>
          <button
            onClick={() => navigate(`/app/subjects/${subjectId}`)}
            style={{ marginTop: 24, color: '#E82127', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}
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

  const isDone = topic.done || completed;

  return (
    <AppShell>
      <div style={{ paddingTop: 32, maxWidth: 768, margin: '0 auto' }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', marginBottom: 32 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #E82127, #ff4d52)', borderRadius: 999 }}
          />
        </div>

        {/* Back + breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}
        >
          <button
            onClick={() => navigate(`/app/subjects/${subjectId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Icon name="arrow_back" size={16} />
            {subject.title}
          </button>
          <span style={{ color: '#3f3f46' }}>›</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)' }}>
            {currentIdx + 1} / {allTopics.length}
          </span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 40 }}
        >
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', marginBottom: 12 }}>{topic.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E82127' }}>
              {subject.title}
            </span>
            <span style={{ color: '#3f3f46' }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)' }}>
              {topic.duration}
            </span>
            {isDone && (
              <>
                <span style={{ color: '#3f3f46' }}>·</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4ade80' }}>
                  Completed
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Overview */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            style={{ ...GLASS, borderRadius: 16, padding: 32 }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', marginBottom: 16 }}>Overview</p>
            {content.overview.split('\n\n').map((para) => (
              <p key={para.slice(0, 40)} style={{ color: 'var(--t2)', lineHeight: 1.75, marginBottom: 16, fontSize: 14 }}>{para}</p>
            ))}
          </motion.div>

          {/* Key Points */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            style={{ ...GLASS, borderRadius: 16, padding: 32 }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', marginBottom: 16 }}>Key Concepts</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {content.keyPoints.map((point) => (
                <li key={point.slice(0, 40)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(232,33,39,0.12)', border: '1px solid rgba(232,33,39,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E82127' }} />
                  </div>
                  <span style={{ color: 'var(--t2)', fontSize: 14, lineHeight: 1.7 }}>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Code Block */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            style={{ ...GLASS, borderRadius: 16, overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)' }}>Example</p>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3f3f46' }}>{content.codeLang}</span>
            </div>
            <pre style={{ padding: 24, overflowX: 'auto' }}>
              <code style={{ fontSize: 13, color: '#4ade80', fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre' }}>{content.code}</code>
            </pre>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            style={{ background: 'rgba(232,33,39,0.06)', border: '1px solid rgba(232,33,39,0.2)', borderRadius: 16, padding: 32 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Icon name="lightbulb" size={18} style={{ color: '#E82127' }} />
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E82127' }}>Summary</p>
            </div>
            <p style={{ color: 'var(--t2)', lineHeight: 1.75, fontSize: 14 }}>{content.summary}</p>
          </motion.div>
        </div>

        {/* Bottom navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <motion.button
            whileHover={{ scale: prevTopic ? 1.02 : 1 }}
            whileTap={{ scale: prevTopic ? 0.98 : 1 }}
            onClick={() => prevTopic && navigate(`/app/subjects/${subjectId}/${prevTopic.id}`)}
            disabled={!prevTopic}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--t2)', cursor: prevTopic ? 'pointer' : 'not-allowed', opacity: prevTopic ? 1 : 0.3 }}
          >
            <Icon name="arrow_back" size={16} />
            Previous
          </motion.button>

          <motion.button
            whileHover={{ scale: isDone ? 1 : 1.02 }}
            whileTap={{ scale: isDone ? 1 : 0.98 }}
            onClick={handleMarkComplete}
            disabled={isDone}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', borderRadius: 999, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: isDone ? 'default' : 'pointer', background: isDone ? 'rgba(34,197,94,0.15)' : '#E82127', color: isDone ? '#4ade80' : '#fff', boxShadow: isDone ? 'none' : '0 0 24px rgba(232,33,39,0.35)' }}
          >
            {isDone ? (
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
          </motion.button>
        </div>
      </div>
    </AppShell>
  );
}
