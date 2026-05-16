export const SUBJECT_DATA: Record<string, {
  title: string; icon: string; color: string;
  sections: { title: string; topics: { id: string; title: string; duration: string; done?: boolean }[] }[]
}> = {
  os: {
    title: 'Operating Systems', icon: 'terminal', color: 'text-blue-400',
    sections: [
      { title: 'Processes & Threads', topics: [
        { id: 'processes', title: 'Processes & Threads', duration: '25 min' },
        { id: 'scheduling', title: 'CPU Scheduling Algorithms', duration: '30 min' },
        { id: 'sync', title: 'Synchronization & Deadlocks', duration: '35 min', done: true },
        { id: 'ipc', title: 'Inter-Process Communication (IPC)', duration: '25 min' },
        { id: 'race', title: 'Race Conditions & Critical Sections', duration: '30 min' },
      ]},
      { title: 'Memory Management', topics: [
        { id: 'memory', title: 'Memory Allocation & Fragmentation', duration: '40 min' },
        { id: 'paging', title: 'Paging & Page Tables', duration: '35 min' },
        { id: 'virtual', title: 'Virtual Memory & Demand Paging', duration: '35 min' },
        { id: 'page-replace', title: 'Page Replacement Algorithms', duration: '30 min' },
        { id: 'thrashing', title: 'Thrashing & Working Set', duration: '20 min' },
      ]},
      { title: 'File Systems', topics: [
        { id: 'fs-intro', title: 'File System Concepts', duration: '20 min' },
        { id: 'inodes', title: 'Inodes & Directory Structure', duration: '25 min' },
        { id: 'fs-impl', title: 'File System Implementation', duration: '30 min' },
        { id: 'journaling', title: 'Journaling & Crash Recovery', duration: '25 min' },
      ]},
      { title: 'Advanced Topics', topics: [
        { id: 'io', title: 'I/O Management & DMA', duration: '25 min' },
        { id: 'boot', title: 'Boot Process & Kernel Internals', duration: '30 min' },
        { id: 'security-os', title: 'OS Security & Protection', duration: '25 min' },
        { id: 'realtime', title: 'Real-Time Operating Systems', duration: '20 min' },
        { id: 'containers', title: 'Virtualization & Containers', duration: '35 min' },
      ]},
    ]
  },
  dbms: {
    title: 'DBMS', icon: 'storage', color: 'text-purple-400',
    sections: [
      { title: 'Relational Model & SQL', topics: [
        { id: 'er', title: 'ER Model & Relational Mapping', duration: '25 min' },
        { id: 'normalization', title: 'Normalization: 1NF → BCNF', duration: '35 min', done: true },
        { id: 'sql', title: 'SQL: Joins, Subqueries & Aggregation', duration: '40 min' },
        { id: 'sql-advanced', title: 'Advanced SQL: Window Functions & CTEs', duration: '35 min' },
        { id: 'indexing', title: 'Indexing & B-Tree Structure', duration: '30 min' },
      ]},
      { title: 'Transactions & Concurrency', topics: [
        { id: 'acid', title: 'ACID Properties', duration: '20 min' },
        { id: 'isolation', title: 'Isolation Levels & Anomalies', duration: '30 min' },
        { id: 'concurrency', title: 'Concurrency Control: Locks & MVCC', duration: '35 min' },
        { id: 'recovery', title: 'Recovery: WAL & Checkpointing', duration: '25 min' },
      ]},
      { title: 'Storage & Optimization', topics: [
        { id: 'storage', title: 'Storage Engines: Heap vs LSM', duration: '25 min' },
        { id: 'query-opt', title: 'Query Optimization & Execution Plans', duration: '30 min' },
        { id: 'partitioning', title: 'Table Partitioning & Sharding', duration: '30 min' },
      ]},
      { title: 'Modern Databases', topics: [
        { id: 'nosql', title: 'NoSQL Databases: Types & Trade-offs', duration: '30 min' },
        { id: 'distributed-db', title: 'Distributed Databases & CAP', duration: '40 min' },
        { id: 'newSQL', title: 'NewSQL & HTAP Systems', duration: '25 min' },
      ]},
    ]
  },
  networks: {
    title: 'Computer Networks', icon: 'wifi', color: 'text-cyan-400',
    sections: [
      { title: 'Network Fundamentals', topics: [
        { id: 'osi', title: 'OSI & TCP/IP Models', duration: '30 min' },
        { id: 'ip', title: 'IP Addressing, Subnetting & CIDR', duration: '35 min' },
        { id: 'routing', title: 'Routing Protocols: RIP, OSPF, BGP', duration: '30 min', done: true },
        { id: 'switching', title: 'Switching, VLANs & MAC Addressing', duration: '25 min' },
      ]},
      { title: 'Transport Layer', topics: [
        { id: 'tcp-udp', title: 'TCP vs UDP: Trade-offs', duration: '25 min' },
        { id: 'tcp-handshake', title: 'TCP Handshake & Flow Control', duration: '30 min' },
        { id: 'congestion', title: 'Congestion Control Algorithms', duration: '25 min' },
        { id: 'quic', title: 'QUIC & HTTP/3', duration: '20 min' },
      ]},
      { title: 'Application Layer', topics: [
        { id: 'http', title: 'HTTP/1.1, HTTP/2 & REST APIs', duration: '30 min' },
        { id: 'dns', title: 'DNS: Resolution & Record Types', duration: '25 min' },
        { id: 'tls', title: 'TLS 1.3 & Certificate Chain', duration: '35 min' },
        { id: 'websockets', title: 'WebSockets & Server-Sent Events', duration: '25 min' },
      ]},
      { title: 'Infrastructure', topics: [
        { id: 'cdn', title: 'CDN Architecture & Edge Caching', duration: '25 min' },
        { id: 'load-bal', title: 'Load Balancers: L4 vs L7', duration: '20 min' },
        { id: 'firewall', title: 'Firewalls, NAT & VPN', duration: '25 min' },
        { id: 'net-sec', title: 'Network Security & DDoS Mitigation', duration: '30 min' },
      ]},
    ]
  },
  oop: {
    title: 'OOP', icon: 'code_blocks', color: 'text-green-400',
    sections: [
      { title: 'OOP Fundamentals', topics: [
        { id: 'classes', title: 'Classes, Objects & Constructors', duration: '20 min', done: true },
        { id: 'inheritance', title: 'Inheritance & Method Overriding', duration: '25 min', done: true },
        { id: 'polymorphism', title: 'Polymorphism: Runtime & Compile-time', duration: '25 min' },
        { id: 'abstraction', title: 'Abstraction & Encapsulation', duration: '20 min' },
        { id: 'interfaces', title: 'Interfaces vs Abstract Classes', duration: '25 min' },
        { id: 'composition', title: 'Composition over Inheritance', duration: '20 min' },
      ]},
      { title: 'SOLID Principles', topics: [
        { id: 'srp', title: 'Single Responsibility Principle', duration: '20 min' },
        { id: 'ocp', title: 'Open/Closed Principle', duration: '20 min' },
        { id: 'lsp', title: 'Liskov Substitution Principle', duration: '20 min' },
        { id: 'isp', title: 'Interface Segregation Principle', duration: '20 min' },
        { id: 'dip', title: 'Dependency Inversion Principle', duration: '20 min' },
      ]},
      { title: 'Design Patterns', topics: [
        { id: 'creational', title: 'Creational: Singleton, Factory, Builder', duration: '35 min' },
        { id: 'structural', title: 'Structural: Adapter, Decorator, Facade', duration: '35 min' },
        { id: 'behavioral', title: 'Behavioral: Observer, Strategy, Command', duration: '35 min' },
        { id: 'pattern-selection', title: 'Choosing the Right Pattern', duration: '25 min' },
      ]},
    ]
  },
  sd: {
    title: 'System Design', icon: 'architecture', color: 'text-orange-400',
    sections: [
      { title: 'Fundamentals', topics: [
        { id: 'scalability', title: 'Scalability: Vertical vs Horizontal', duration: '30 min' },
        { id: 'caching', title: 'Caching: Strategies & Eviction Policies', duration: '30 min' },
        { id: 'db-design', title: 'Database Selection: SQL vs NoSQL', duration: '35 min' },
        { id: 'api-design', title: 'API Design: REST vs gRPC vs GraphQL', duration: '30 min' },
        { id: 'rate-limiting', title: 'Rate Limiting Algorithms', duration: '25 min' },
        { id: 'cdn-sd', title: 'CDN & Edge Computing', duration: '20 min' },
      ]},
      { title: 'Distributed Systems', topics: [
        { id: 'cap', title: 'CAP Theorem & PACELC', duration: '25 min' },
        { id: 'consistency', title: 'Consistency Models: Strong, Eventual', duration: '25 min' },
        { id: 'replication', title: 'Data Replication: Leader/Follower', duration: '30 min' },
        { id: 'sharding', title: 'Sharding & Consistent Hashing', duration: '30 min' },
        { id: 'microservices', title: 'Microservices & Service Mesh', duration: '40 min' },
        { id: 'messaging', title: 'Message Queues: Kafka vs RabbitMQ', duration: '35 min' },
        { id: 'observability', title: 'Observability: Metrics, Logs, Traces', duration: '25 min' },
      ]},
      { title: 'Case Studies', topics: [
        { id: 'design-url', title: 'Design URL Shortener', duration: '45 min' },
        { id: 'design-twitter', title: 'Design Twitter / News Feed', duration: '60 min' },
        { id: 'design-youtube', title: 'Design YouTube / Video Platform', duration: '60 min' },
        { id: 'design-uber', title: 'Design Uber / Ride Sharing', duration: '60 min' },
        { id: 'design-notification', title: 'Design Notification System', duration: '45 min' },
        { id: 'design-search', title: 'Design Web Crawler & Search Index', duration: '60 min' },
      ]},
    ]
  },
  compilers: {
    title: 'Compiler Design', icon: 'settings', color: 'text-rose-400',
    sections: [
      { title: 'Lexical & Syntax Analysis', topics: [
        { id: 'lexer', title: 'Lexical Analysis & Regular Expressions', duration: '30 min' },
        { id: 'cfg', title: 'Context-Free Grammars & Parse Trees', duration: '35 min' },
        { id: 'parsing', title: 'Top-Down & Bottom-Up Parsing', duration: '40 min' },
        { id: 'lr-parsing', title: 'LR, SLR & LALR Parsing', duration: '35 min' },
      ]},
      { title: 'Semantic Analysis & IR', topics: [
        { id: 'semantic', title: 'Type Checking & Semantic Rules', duration: '30 min' },
        { id: 'symbol-table', title: 'Symbol Tables & Scope', duration: '25 min' },
        { id: 'ir', title: 'Intermediate Representations (3AC, SSA)', duration: '30 min' },
      ]},
      { title: 'Code Generation & Optimization', topics: [
        { id: 'codegen', title: 'Code Generation Techniques', duration: '35 min' },
        { id: 'optimization', title: 'Compiler Optimizations: DCE, CSE, Inlining', duration: '35 min' },
        { id: 'register', title: 'Register Allocation & Graph Coloring', duration: '30 min' },
      ]},
    ]
  },
  discrete: {
    title: 'Discrete Mathematics', icon: 'calculate', color: 'text-teal-400',
    sections: [
      { title: 'Logic & Proofs', topics: [
        { id: 'propositional', title: 'Propositional & Predicate Logic', duration: '30 min' },
        { id: 'proofs', title: 'Proof Techniques: Induction, Contradiction', duration: '35 min' },
        { id: 'sets', title: 'Set Theory & Algebra', duration: '25 min' },
      ]},
      { title: 'Combinatorics', topics: [
        { id: 'counting', title: 'Counting Principles: Permutations & Combinations', duration: '30 min' },
        { id: 'recurrence', title: 'Recurrence Relations', duration: '35 min' },
        { id: 'generating', title: 'Generating Functions (intro)', duration: '30 min' },
        { id: 'pigeonhole', title: 'Pigeonhole Principle & Applications', duration: '20 min' },
      ]},
      { title: 'Graph Theory', topics: [
        { id: 'graph-basics', title: 'Graph Fundamentals: Types & Representations', duration: '25 min' },
        { id: 'trees-disc', title: 'Trees, Spanning Trees & MST', duration: '30 min' },
        { id: 'planarity', title: 'Planar Graphs & Euler\'s Formula', duration: '25 min' },
        { id: 'coloring', title: 'Graph Coloring & Applications', duration: '25 min' },
      ]},
      { title: 'Formal Languages & Automata', topics: [
        { id: 'dfa', title: 'Deterministic Finite Automata (DFA)', duration: '30 min' },
        { id: 'nfa', title: 'Non-deterministic FA & Equivalence', duration: '25 min' },
        { id: 'regex-fl', title: 'Regular Languages & Pumping Lemma', duration: '30 min' },
        { id: 'cfg-fl', title: 'Context-Free Languages & PDAs', duration: '35 min' },
        { id: 'turing', title: 'Turing Machines & Computability', duration: '35 min' },
      ]},
    ]
  },
};

export type SubjectTopic = { id: string; title: string; duration: string; done?: boolean };
export type SubjectSection = { title: string; topics: SubjectTopic[] };
export type SubjectEntry = { title: string; icon: string; color: string; sections: SubjectSection[] };

export function findTopic(subjectId: string, topicId: string): {
  topic: SubjectTopic;
  section: SubjectSection;
  sectionIndex: number;
  topicIndex: number;
  allTopics: SubjectTopic[];
} | null {
  const subject = SUBJECT_DATA[subjectId];
  if (!subject) return null;
  const allTopics = subject.sections.flatMap((s) => s.topics);
  for (let si = 0; si < subject.sections.length; si++) {
    const section = subject.sections[si];
    for (let ti = 0; ti < section.topics.length; ti++) {
      if (section.topics[ti].id === topicId) {
        return { topic: section.topics[ti], section, sectionIndex: si, topicIndex: ti, allTopics };
      }
    }
  }
  return null;
}
