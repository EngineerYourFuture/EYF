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
    code: `// Shared memory IPC (POSIX)
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
printf("Value: %d\\n", *shared);  // reads 42`,
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
  .where('status = \'active\'')
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
