export const SUBJECT_DATA: Record<string, {
  title: string; icon: string; color: string;
  sections: { title: string; topics: { id: string; title: string; duration: string; done?: boolean }[] }[]
}> = {
  os: {
    title: 'Operating Systems', icon: 'terminal', color: 'text-blue-400',
    sections: [
      { title: 'Foundations', topics: [
        { id: 'processes', title: 'Processes & Threads', duration: '25 min' },
        { id: 'scheduling', title: 'CPU Scheduling Algorithms', duration: '30 min' },
        { id: 'sync', title: 'Synchronization & Deadlocks', duration: '35 min', done: true },
        { id: 'memory', title: 'Memory Management', duration: '40 min' },
      ]},
      { title: 'File Systems', topics: [
        { id: 'fs-intro', title: 'File System Concepts', duration: '20 min' },
        { id: 'inodes', title: 'Inodes & Directory Structure', duration: '25 min' },
        { id: 'virtual', title: 'Virtual File Systems', duration: '30 min' },
      ]},
      { title: 'Advanced', topics: [
        { id: 'paging', title: 'Paging & Segmentation', duration: '35 min' },
        { id: 'io', title: 'I/O Management', duration: '25 min' },
        { id: 'security-os', title: 'OS Security', duration: '20 min' },
      ]},
    ]
  },
  dbms: {
    title: 'DBMS', icon: 'storage', color: 'text-purple-400',
    sections: [
      { title: 'Relational Model', topics: [
        { id: 'er', title: 'ER Model & Mapping', duration: '25 min' },
        { id: 'normalization', title: 'Normalization (1NF–BCNF)', duration: '35 min', done: true },
        { id: 'sql', title: 'SQL Queries & Joins', duration: '40 min' },
        { id: 'indexing', title: 'Indexing & B-Trees', duration: '30 min' },
      ]},
      { title: 'Transactions', topics: [
        { id: 'acid', title: 'ACID Properties', duration: '20 min' },
        { id: 'concurrency', title: 'Concurrency Control', duration: '35 min' },
        { id: 'recovery', title: 'Recovery Mechanisms', duration: '25 min' },
      ]},
      { title: 'Advanced', topics: [
        { id: 'nosql', title: 'NoSQL & MongoDB', duration: '30 min' },
        { id: 'distributed-db', title: 'Distributed Databases', duration: '40 min' },
        { id: 'query-opt', title: 'Query Optimization', duration: '30 min' },
      ]},
    ]
  },
  networks: {
    title: 'Computer Networks', icon: 'wifi', color: 'text-cyan-400',
    sections: [
      { title: 'Core Concepts', topics: [
        { id: 'osi', title: 'OSI & TCP/IP Models', duration: '30 min' },
        { id: 'ip', title: 'IP Addressing & Subnetting', duration: '35 min' },
        { id: 'routing', title: 'Routing Protocols', duration: '30 min', done: true },
        { id: 'tcp-udp', title: 'TCP vs UDP', duration: '25 min' },
      ]},
      { title: 'Application Layer', topics: [
        { id: 'http', title: 'HTTP/HTTPS & REST', duration: '25 min' },
        { id: 'dns', title: 'DNS & DHCP', duration: '20 min' },
        { id: 'tls', title: 'TLS/SSL & Security', duration: '30 min' },
      ]},
    ]
  },
  oop: {
    title: 'OOP', icon: 'code_blocks', color: 'text-green-400',
    sections: [
      { title: 'Fundamentals', topics: [
        { id: 'classes', title: 'Classes & Objects', duration: '20 min', done: true },
        { id: 'inheritance', title: 'Inheritance & Polymorphism', duration: '25 min', done: true },
        { id: 'abstraction', title: 'Abstraction & Encapsulation', duration: '20 min' },
        { id: 'interfaces', title: 'Interfaces & Abstract Classes', duration: '25 min' },
      ]},
      { title: 'Design Patterns', topics: [
        { id: 'solid', title: 'SOLID Principles', duration: '35 min' },
        { id: 'creational', title: 'Creational Patterns', duration: '30 min' },
        { id: 'structural', title: 'Structural Patterns', duration: '30 min' },
        { id: 'behavioral', title: 'Behavioral Patterns', duration: '35 min' },
      ]},
    ]
  },
  sd: {
    title: 'System Design', icon: 'architecture', color: 'text-orange-400',
    sections: [
      { title: 'Fundamentals', topics: [
        { id: 'scalability', title: 'Scalability & Load Balancing', duration: '40 min' },
        { id: 'caching', title: 'Caching Strategies', duration: '30 min' },
        { id: 'db-design', title: 'Database Design Patterns', duration: '35 min' },
        { id: 'api-design', title: 'API Design & REST', duration: '25 min' },
      ]},
      { title: 'Distributed Systems', topics: [
        { id: 'cap', title: 'CAP Theorem', duration: '20 min' },
        { id: 'microservices', title: 'Microservices Architecture', duration: '45 min' },
        { id: 'messaging', title: 'Message Queues & Kafka', duration: '35 min' },
      ]},
      { title: 'Case Studies', topics: [
        { id: 'design-twitter', title: 'Design Twitter/X', duration: '60 min' },
        { id: 'design-youtube', title: 'Design YouTube', duration: '60 min' },
        { id: 'design-uber', title: 'Design Uber', duration: '60 min' },
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
