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
    code: `// ❌ Violates SRP — three reasons to change: user logic, email format, DB schema
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
    overview: `DNS (Domain Name System) is the internet\'s distributed phonebook — it translates human-readable names like api.example.com into IP addresses. Understanding DNS is critical for debugging production incidents (propagation delays, TTL misconfiguration), designing global services, and security.\n\nDNS is hierarchical: root nameservers → TLD nameservers → authoritative nameservers. Caching at every layer makes it fast but means changes take time to propagate.`,
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
    summary: 'DNS is deceptively simple in theory but has real production implications. Always lower TTL before a migration, not after — once you\'ve changed the record, the old TTL is already baked into resolvers\' caches. CNAME records cannot be set on apex domains (example.com); use ALIAS or ANAME records or A records directly.',
  },

  // ── DBMS ─────────────────────────────────────────────────────────────────

  indexing: {
    overview: `Database indexes are the single most important performance tool in a software engineer\'s arsenal. A missing index on a 100M-row table can turn a 50ms query into a 30-second full scan. Knowing when to add one — and when not to — separates engineers who write fast code from those who write slow systems.\n\nIndexes are B-trees by default in PostgreSQL and MySQL. They store a sorted copy of the indexed column(s) with pointers to the heap row, enabling O(log N) lookups instead of O(N) sequential scans.`,
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
    overview: `Liskov Substitution Principle: if S is a subtype of T, then objects of type T may be replaced with objects of type S without altering the correctness of the program. Informally: subclasses must be usable wherever their superclass is expected.\n\nLSP violations manifest as instanceof checks in code that\'s supposed to work with the base type, or surprising exceptions thrown by subclasses that the base class contract didn\'t allow.`,
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
    overview: `Designing Twitter\'s news feed is one of the most comprehensive system design questions — it covers data modeling, fan-out strategies, caching, real-time delivery, and the fundamental tension between write-time and read-time work.\n\nThe core problem: when UserA posts a tweet, how do UserA\'s 50 million followers see it in their feeds with low latency? This is the fan-out problem.`,
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
