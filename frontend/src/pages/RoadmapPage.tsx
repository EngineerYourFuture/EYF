import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useUser } from '../contexts/UserContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoadmapTask {
  title: string;
  type: 'theory' | 'practice' | 'project' | 'mock' | 'review';
  link?: string;
  xp: number;
  done?: boolean;
}

interface RoadmapWeek {
  week: number;
  theme: string;
  focus: string;
  color: string;
  tasks: RoadmapTask[];
  milestone?: string;
}

interface RoadmapTrack {
  id: string;
  label: string;
  icon: string;
  color: string;
  gradient: string;
  duration: string; // e.g. "8 weeks"
  targetRole: string;
  weeks: RoadmapWeek[];
}

// ─── Roadmap data ─────────────────────────────────────────────────────────────

const ROADMAPS: RoadmapTrack[] = [
  // ── SWE Campus / Fresher ──────────────────────────────────────────────────
  {
    id: 'campus',
    label: 'Campus / First Job',
    icon: 'school',
    color: 'text-blue-400',
    gradient: 'from-blue-600/20 to-blue-900/10',
    duration: '12 weeks',
    targetRole: 'SWE Intern / Junior SWE',
    weeks: [
      {
        week: 1,
        theme: 'Arrays & Strings',
        focus: 'DSA Foundation',
        color: 'border-blue-500',
        tasks: [
          { title: 'Two Sum, Best Time to Buy Stock', type: 'practice', link: '/app/problems', xp: 50 },
          { title: 'Arrays & Hashing — Theory', type: 'theory', link: '/app/subjects/os/processes', xp: 30 },
          { title: 'Big-O Notation Flashcards (10 cards)', type: 'practice', link: '/app/flashcards', xp: 20 },
          { title: 'Valid Anagram, Contains Duplicate, Product Except Self', type: 'practice', link: '/app/problems', xp: 60 },
        ],
        milestone: '5 easy problems solved',
      },
      {
        week: 2,
        theme: 'Two Pointers & Sliding Window',
        focus: 'DSA Patterns',
        color: 'border-blue-500',
        tasks: [
          { title: 'Two Pointers pattern — Pattern Quiz', type: 'practice', link: '/app/pattern-quiz', xp: 40 },
          { title: 'Valid Palindrome, 3Sum, Container With Most Water', type: 'practice', link: '/app/problems', xp: 80 },
          { title: 'Longest Substring Without Repeating Characters', type: 'practice', link: '/app/problems', xp: 50 },
          { title: 'Minimum Window Substring', type: 'practice', link: '/app/problems', xp: 60 },
        ],
      },
      {
        week: 3,
        theme: 'Linked Lists & Stacks',
        focus: 'DSA Patterns',
        color: 'border-blue-500',
        tasks: [
          { title: 'Reverse Linked List, Merge Two Lists, Detect Cycle', type: 'practice', link: '/app/problems', xp: 70 },
          { title: 'Valid Parentheses, Daily Temperatures, Min Stack', type: 'practice', link: '/app/problems', xp: 60 },
          { title: 'Linked Lists flashcard deck', type: 'practice', link: '/app/flashcards', xp: 25 },
          { title: 'Merge K Sorted Lists (hard stretch)', type: 'practice', link: '/app/problems', xp: 80 },
        ],
        milestone: '20 problems solved',
      },
      {
        week: 4,
        theme: 'Trees & Recursion',
        focus: 'DSA Patterns',
        color: 'border-blue-500',
        tasks: [
          { title: 'Invert Binary Tree, Max Depth, Level Order Traversal', type: 'practice', link: '/app/problems', xp: 70 },
          { title: 'LCA of BST, Serialize & Deserialize Tree', type: 'practice', link: '/app/problems', xp: 80 },
          { title: 'Tree BFS / DFS patterns — Visualizer', type: 'practice', link: '/app/visualizer', xp: 30 },
          { title: 'Algorithm Visualizer: Binary Search trace', type: 'theory', link: '/app/visualizer', xp: 20 },
        ],
      },
      {
        week: 5,
        theme: 'OS & Networks Core',
        focus: 'Core CS Subjects',
        color: 'border-purple-500',
        tasks: [
          { title: 'Processes & Threads — SubjectTopic', type: 'theory', link: '/app/subjects/os/processes', xp: 40 },
          { title: 'CPU Scheduling Algorithms', type: 'theory', link: '/app/subjects/os/scheduling', xp: 40 },
          { title: 'OSI & TCP/IP Model', type: 'theory', link: '/app/subjects/networks/osi', xp: 35 },
          { title: 'TCP vs UDP, HTTP/1.1 vs HTTP/2', type: 'theory', link: '/app/subjects/networks/tcp-udp', xp: 35 },
          { title: 'OS & Networks flashcard deck (20 cards)', type: 'practice', link: '/app/flashcards', xp: 30 },
        ],
        milestone: 'Core CS foundations solid',
      },
      {
        week: 6,
        theme: 'DBMS & SQL',
        focus: 'Core CS Subjects',
        color: 'border-purple-500',
        tasks: [
          { title: 'Normalization: 1NF → BCNF', type: 'theory', link: '/app/subjects/dbms/normalization', xp: 40 },
          { title: 'ACID Properties & Isolation Levels', type: 'theory', link: '/app/subjects/dbms/acid', xp: 40 },
          { title: 'SQL: Joins, Subqueries & Aggregation', type: 'practice', link: '/app/subjects/dbms/sql', xp: 45 },
          { title: 'Advanced SQL: Window Functions & CTEs', type: 'practice', link: '/app/subjects/dbms/sql-advanced', xp: 45 },
          { title: 'DBMS Flashcard Deck', type: 'practice', link: '/app/flashcards', xp: 25 },
        ],
      },
      {
        week: 7,
        theme: 'OOP & SOLID',
        focus: 'OOP & Design',
        color: 'border-green-500',
        tasks: [
          { title: 'Classes, Inheritance, Polymorphism deep-dives', type: 'theory', link: '/app/subjects/oop/classes', xp: 45 },
          { title: 'SOLID Principles (all 5) — read + implement', type: 'theory', link: '/app/subjects/oop/srp', xp: 60 },
          { title: 'Creational & Structural patterns', type: 'theory', link: '/app/subjects/oop/creational', xp: 50 },
          { title: 'OOP mock: design a Parking Lot system', type: 'mock', xp: 70 },
        ],
        milestone: 'Can design any LLD system in 30 min',
      },
      {
        week: 8,
        theme: 'Dynamic Programming',
        focus: 'DSA — Hard Territory',
        color: 'border-orange-500',
        tasks: [
          { title: 'Climb Stairs, Coin Change, House Robber', type: 'practice', link: '/app/problems', xp: 80 },
          { title: 'Longest Increasing Subsequence, Jump Game', type: 'practice', link: '/app/problems', xp: 80 },
          { title: 'DP decision framework flashcard', type: 'practice', link: '/app/flashcards', xp: 30 },
          { title: 'Word Break, Decode Ways', type: 'practice', link: '/app/problems', xp: 70 },
        ],
      },
      {
        week: 9,
        theme: 'Graphs & Backtracking',
        focus: 'DSA — Hard Territory',
        color: 'border-orange-500',
        tasks: [
          { title: 'Number of Islands, Course Schedule, Word Ladder', type: 'practice', link: '/app/problems', xp: 90 },
          { title: 'Permutations, Subsets, N-Queens (Backtracking)', type: 'practice', link: '/app/problems', xp: 80 },
          { title: 'Graph BFS/DFS patterns quiz', type: 'practice', link: '/app/pattern-quiz', xp: 40 },
        ],
        milestone: '50 problems solved',
      },
      {
        week: 10,
        theme: 'Behavioural & Resume',
        focus: 'Career Prep',
        color: 'border-pink-500',
        tasks: [
          { title: 'STAR method — Behavioural flashcard deck', type: 'theory', link: '/app/flashcards', xp: 30 },
          { title: 'Build / polish resume with EYF Resume Builder', type: 'project', link: '/app/resume', xp: 50 },
          { title: 'Mock behavioural interview (30 min)', type: 'mock', link: '/app/mock-interview', xp: 80 },
          { title: 'Amazon Leadership Principles — all 14', type: 'theory', link: '/app/flashcards', xp: 40 },
        ],
      },
      {
        week: 11,
        theme: 'Mock Interview Marathon',
        focus: 'Final Sprint',
        color: 'border-red-500',
        tasks: [
          { title: 'Full mock DSA interview (45 min)', type: 'mock', link: '/app/mock-interview', xp: 100 },
          { title: 'Solve 5 medium problems under timed pressure', type: 'practice', link: '/app/problems', xp: 80 },
          { title: 'Review all weak areas via Flashcards', type: 'review', link: '/app/flashcards', xp: 40 },
          { title: 'Daily Challenge streak — 7 consecutive days', type: 'practice', link: '/app/daily', xp: 70 },
        ],
      },
      {
        week: 12,
        theme: 'Final Review & Apply',
        focus: 'Launch',
        color: 'border-yellow-500',
        tasks: [
          { title: 'Pattern Quiz — full 20 questions, score > 80%', type: 'practice', link: '/app/pattern-quiz', xp: 100 },
          { title: 'Full mock: DSA + LLD back-to-back', type: 'mock', link: '/app/mock-interview', xp: 120 },
          { title: 'Log 10 applications in Interview Tracker', type: 'project', link: '/app/tracker', xp: 60 },
          { title: '🎉 You\'re ready — start applying!', type: 'review', xp: 50 },
        ],
        milestone: 'OFFER-READY 🚀',
      },
    ],
  },

  // ── SWE FAANG / Senior ────────────────────────────────────────────────────
  {
    id: 'faang',
    label: 'FAANG / Senior SWE',
    icon: 'rocket_launch',
    color: 'text-orange-400',
    gradient: 'from-orange-600/20 to-orange-900/10',
    duration: '10 weeks',
    targetRole: 'Senior / Staff SWE at FAANG+',
    weeks: [
      {
        week: 1,
        theme: 'Hard DSA Sprint',
        focus: 'Algorithms',
        color: 'border-orange-500',
        tasks: [
          { title: 'Trapping Rain Water, Largest Rectangle in Histogram', type: 'practice', link: '/app/problems', xp: 100 },
          { title: 'Find Median from Data Stream, Merge K Lists', type: 'practice', link: '/app/problems', xp: 90 },
          { title: 'Algorithm patterns review — Pattern Quiz (timed)', type: 'practice', link: '/app/pattern-quiz', xp: 50 },
        ],
        milestone: 'Hard problems in < 25 min',
      },
      {
        week: 2,
        theme: 'System Design Fundamentals',
        focus: 'System Design',
        color: 'border-cyan-500',
        tasks: [
          { title: 'Scalability: Vertical vs Horizontal + Load Balancing', type: 'theory', link: '/app/subjects/sd/scalability', xp: 50 },
          { title: 'Caching: Strategies, Eviction, CDN', type: 'theory', link: '/app/subjects/sd/caching', xp: 50 },
          { title: 'CAP Theorem & Consistency Models', type: 'theory', link: '/app/subjects/sd/cap', xp: 45 },
          { title: 'API Design: REST vs gRPC vs GraphQL', type: 'theory', link: '/app/subjects/sd/api-design', xp: 45 },
          { title: 'Rate Limiting Algorithms', type: 'theory', link: '/app/subjects/sd/rate-limiting', xp: 40 },
        ],
      },
      {
        week: 3,
        theme: 'Distributed Systems',
        focus: 'System Design',
        color: 'border-cyan-500',
        tasks: [
          { title: 'Replication: Leader/Follower, Multi-leader', type: 'theory', link: '/app/subjects/sd/replication', xp: 50 },
          { title: 'Sharding & Consistent Hashing', type: 'theory', link: '/app/subjects/sd/sharding', xp: 50 },
          { title: 'Microservices & Service Mesh', type: 'theory', link: '/app/subjects/sd/microservices', xp: 50 },
          { title: 'Kafka: messaging & event streaming', type: 'theory', link: '/app/subjects/sd/messaging', xp: 45 },
          { title: 'Observability: RED/USE, OpenTelemetry', type: 'theory', link: '/app/subjects/sd/observability', xp: 40 },
        ],
        milestone: 'Can whiteboard any distributed system',
      },
      {
        week: 4,
        theme: 'Design URL Shortener',
        focus: 'Case Studies',
        color: 'border-cyan-500',
        tasks: [
          { title: 'Study Design URL Shortener deep-dive', type: 'theory', link: '/app/subjects/sd/design-url', xp: 60 },
          { title: 'Mock: Design URL Shortener (45 min no notes)', type: 'mock', xp: 120 },
          { title: 'System Design flashcard deck', type: 'review', link: '/app/flashcards', xp: 30 },
        ],
      },
      {
        week: 5,
        theme: 'Design Twitter + YouTube',
        focus: 'Case Studies',
        color: 'border-cyan-500',
        tasks: [
          { title: 'Study Design Twitter / News Feed', type: 'theory', link: '/app/subjects/sd/design-twitter', xp: 60 },
          { title: 'Study Design YouTube / Video Platform', type: 'theory', link: '/app/subjects/sd/design-youtube', xp: 60 },
          { title: 'Mock: Design Twitter (45 min)', type: 'mock', xp: 120 },
          { title: 'Mock: Design Notification System', type: 'mock', xp: 100 },
        ],
        milestone: '5 system designs practiced',
      },
      {
        week: 6,
        theme: 'OOP Architecture & Design Patterns',
        focus: 'OOP & LLD',
        color: 'border-green-500',
        tasks: [
          { title: 'All SOLID principles with code examples', type: 'theory', link: '/app/subjects/oop/srp', xp: 60 },
          { title: 'All 23 GoF patterns — OOP page', type: 'theory', link: '/app/oop', xp: 60 },
          { title: 'Mock LLD: Design a Chess Game', type: 'mock', xp: 120 },
          { title: 'Mock LLD: Design an E-Commerce Cart', type: 'mock', xp: 100 },
        ],
      },
      {
        week: 7,
        theme: 'Behavioural (Amazon LP focus)',
        focus: 'Behavioural',
        color: 'border-pink-500',
        tasks: [
          { title: 'All 14 Amazon Leadership Principles — prep stories', type: 'theory', link: '/app/flashcards', xp: 60 },
          { title: 'STAR method: 10 distinct project stories prepared', type: 'project', xp: 80 },
          { title: 'Mock behavioural interview x2', type: 'mock', link: '/app/mock-interview', xp: 140 },
          { title: 'Conflict + failure stories — Behavioural flashcards', type: 'review', link: '/app/flashcards', xp: 30 },
        ],
        milestone: 'Story bank ready for any LP question',
      },
      {
        week: 8,
        theme: 'Security & Cybersecurity Basics',
        focus: 'Security',
        color: 'border-red-500',
        tasks: [
          { title: 'OWASP Top 10 — Cybersecurity page', type: 'theory', link: '/app/cybersecurity', xp: 50 },
          { title: 'Security flashcard deck (10 cards)', type: 'practice', link: '/app/flashcards', xp: 30 },
          { title: 'TLS 1.3 handshake deep-dive', type: 'theory', link: '/app/subjects/networks/tls', xp: 40 },
          { title: 'CTF: XSS / SQL Injection challenges', type: 'practice', link: '/app/cybersecurity', xp: 60 },
        ],
      },
      {
        week: 9,
        theme: 'Full Mock Loop',
        focus: 'Final Simulation',
        color: 'border-red-500',
        tasks: [
          { title: 'Full DSA round (2 medium + 1 hard, 60 min)', type: 'mock', link: '/app/mock-interview', xp: 150 },
          { title: 'Full System Design round (45 min)', type: 'mock', link: '/app/mock-interview', xp: 150 },
          { title: 'Full Behavioural round (45 min)', type: 'mock', link: '/app/mock-interview', xp: 100 },
          { title: 'Review feedback, update weak areas', type: 'review', xp: 40 },
        ],
        milestone: 'Entire loop simulated',
      },
      {
        week: 10,
        theme: 'Refinement & Launch',
        focus: 'Launch',
        color: 'border-yellow-500',
        tasks: [
          { title: 'Pattern Quiz — 20 questions, score > 90%', type: 'practice', link: '/app/pattern-quiz', xp: 120 },
          { title: 'Final hard problem x5 (cold, no hints)', type: 'practice', link: '/app/problems', xp: 100 },
          { title: 'Negotiate offer prep (salary research, BATNA)', type: 'theory', xp: 30 },
          { title: '🏆 You\'ve put in the work — go ace those interviews!', type: 'review', xp: 50 },
        ],
        milestone: 'FAANG-READY 🏆',
      },
    ],
  },

  // ── Backend / Platform SWE ─────────────────────────────────────────────────
  {
    id: 'backend',
    label: 'Backend / Platform Engineer',
    icon: 'dns',
    color: 'text-green-400',
    gradient: 'from-green-600/20 to-green-900/10',
    duration: '8 weeks',
    targetRole: 'Backend SWE / Platform Eng',
    weeks: [
      {
        week: 1,
        theme: 'Distributed Systems Core',
        focus: 'Systems',
        color: 'border-green-500',
        tasks: [
          { title: 'CAP Theorem, Consistency Models, PACELC', type: 'theory', link: '/app/subjects/sd/cap', xp: 50 },
          { title: 'Data Replication: Leader/Follower, Multi-leader, Leaderless', type: 'theory', link: '/app/subjects/sd/replication', xp: 50 },
          { title: 'Sharding & Consistent Hashing', type: 'theory', link: '/app/subjects/sd/sharding', xp: 50 },
          { title: 'ACID vs BASE, Isolation Levels', type: 'theory', link: '/app/subjects/dbms/acid', xp: 40 },
        ],
      },
      {
        week: 2,
        theme: 'API & Microservices Design',
        focus: 'Architecture',
        color: 'border-green-500',
        tasks: [
          { title: 'REST vs gRPC vs GraphQL — trade-offs', type: 'theory', link: '/app/subjects/sd/api-design', xp: 50 },
          { title: 'Microservices patterns: Circuit Breaker, Saga, CQRS', type: 'theory', link: '/app/subjects/sd/microservices', xp: 60 },
          { title: 'Rate Limiting: Token Bucket, Leaky Bucket, Sliding Window', type: 'theory', link: '/app/subjects/sd/rate-limiting', xp: 45 },
          { title: 'System Design flashcards', type: 'practice', link: '/app/flashcards', xp: 30 },
        ],
        milestone: 'Can design backend APIs for any system',
      },
      {
        week: 3,
        theme: 'Kafka & Messaging',
        focus: 'Data Infrastructure',
        color: 'border-teal-500',
        tasks: [
          { title: 'Kafka: partitions, consumer groups, exactly-once delivery', type: 'theory', link: '/app/subjects/sd/messaging', xp: 60 },
          { title: 'Observability: RED, USE, OpenTelemetry, Prometheus', type: 'theory', link: '/app/subjects/sd/observability', xp: 50 },
          { title: 'Design Notification System (end-to-end)', type: 'theory', link: '/app/subjects/sd/design-notification', xp: 60 },
        ],
      },
      {
        week: 4,
        theme: 'Database Internals',
        focus: 'DBMS',
        color: 'border-purple-500',
        tasks: [
          { title: 'Indexing: B-tree, covering indexes, EXPLAIN', type: 'theory', link: '/app/subjects/dbms/indexing', xp: 50 },
          { title: 'Concurrency Control: MVCC, Locks', type: 'theory', link: '/app/subjects/dbms/concurrency', xp: 50 },
          { title: 'NoSQL: document vs key-value vs wide-column vs graph', type: 'theory', link: '/app/subjects/dbms/nosql', xp: 50 },
          { title: 'Advanced SQL: Window Functions, CTEs, Recursive', type: 'practice', link: '/app/subjects/dbms/sql-advanced', xp: 45 },
        ],
        milestone: 'Can choose DB and design schema for any system',
      },
      {
        week: 5,
        theme: 'OS & Systems Programming',
        focus: 'OS',
        color: 'border-blue-500',
        tasks: [
          { title: 'Synchronization & Deadlocks', type: 'theory', link: '/app/subjects/os/sync', xp: 50 },
          { title: 'Race Conditions & Critical Sections', type: 'theory', link: '/app/subjects/os/race', xp: 50 },
          { title: 'IPC: Pipes, Sockets, Shared Memory, Message Queues', type: 'theory', link: '/app/subjects/os/ipc', xp: 45 },
          { title: 'Containers & Kubernetes basics', type: 'theory', link: '/app/subjects/os/containers', xp: 50 },
        ],
      },
      {
        week: 6,
        theme: 'DSA for Backend',
        focus: 'Algorithms',
        color: 'border-orange-500',
        tasks: [
          { title: 'LRU Cache (HashMap + Doubly Linked List)', type: 'practice', link: '/app/problems', xp: 80 },
          { title: 'Top K Frequent Elements, Find Median from Stream', type: 'practice', link: '/app/problems', xp: 80 },
          { title: 'Design concepts: consistent hashing, bloom filters', type: 'theory', xp: 40 },
          { title: 'Pattern Quiz — focus on heap/graph questions', type: 'practice', link: '/app/pattern-quiz', xp: 50 },
        ],
        milestone: '30 problems solved including LRU, heap, graph',
      },
      {
        week: 7,
        theme: 'Mock Interviews',
        focus: 'Practice',
        color: 'border-red-500',
        tasks: [
          { title: 'Full System Design mock: Design Uber', type: 'mock', link: '/app/mock-interview', xp: 150 },
          { title: 'Full System Design mock: Design YouTube', type: 'mock', link: '/app/mock-interview', xp: 150 },
          { title: 'DSA: 2 mediums timed (backend-flavored)', type: 'practice', link: '/app/problems', xp: 80 },
          { title: 'Behavioural: project impact + technical decision stories', type: 'mock', link: '/app/mock-interview', xp: 100 },
        ],
      },
      {
        week: 8,
        theme: 'Final Sprint',
        focus: 'Launch',
        color: 'border-yellow-500',
        tasks: [
          { title: 'Weak area review: Flashcards + SubjectTopics', type: 'review', link: '/app/flashcards', xp: 50 },
          { title: 'Full mock loop: DSA + SD + Behav', type: 'mock', link: '/app/mock-interview', xp: 200 },
          { title: 'Apply to 20 target companies — Interview Tracker', type: 'project', link: '/app/tracker', xp: 60 },
          { title: '🚀 Ready to build scalable systems!', type: 'review', xp: 50 },
        ],
        milestone: 'BACKEND-READY 🛠️',
      },
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<RoadmapTask['type'], { label: string; color: string; icon: string }> = {
  theory:   { label: 'Theory',   color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',    icon: 'menu_book' },
  practice: { label: 'Practice', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30', icon: 'code' },
  project:  { label: 'Project',  color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', icon: 'build' },
  mock:     { label: 'Mock',     color: 'bg-red-500/15 text-red-300 border-red-500/30',       icon: 'record_voice_over' },
  review:   { label: 'Review',   color: 'bg-green-500/15 text-green-300 border-green-500/30', icon: 'refresh' },
};

const WEEK_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  'border-blue-500':   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   ring: 'ring-blue-500/40' },
  'border-purple-500': { bg: 'bg-purple-500/10', text: 'text-purple-400', ring: 'ring-purple-500/40' },
  'border-green-500':  { bg: 'bg-green-500/10',  text: 'text-green-400',  ring: 'ring-green-500/40' },
  'border-orange-500': { bg: 'bg-orange-500/10', text: 'text-orange-400', ring: 'ring-orange-500/40' },
  'border-pink-500':   { bg: 'bg-pink-500/10',   text: 'text-pink-400',   ring: 'ring-pink-500/40' },
  'border-red-500':    { bg: 'bg-red-500/10',    text: 'text-red-400',    ring: 'ring-red-500/40' },
  'border-yellow-500': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', ring: 'ring-yellow-500/40' },
  'border-cyan-500':   { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   ring: 'ring-cyan-500/40' },
  'border-teal-500':   { bg: 'bg-teal-500/10',   text: 'text-teal-400',   ring: 'ring-teal-500/40' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RoadmapPage() {
  const { fireXP } = useUser();
  const [selectedTrack, setSelectedTrack] = useState<string>('campus');
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('eyf.roadmap.done');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  const track = useMemo(() => ROADMAPS.find(r => r.id === selectedTrack)!, [selectedTrack]);

  const totalXP = useMemo(() =>
    track.weeks.flatMap(w => w.tasks).reduce((s, t) => s + t.xp, 0),
    [track]
  );
  const earnedXP = useMemo(() =>
    track.weeks.flatMap((w, wi) =>
      w.tasks.map((t, ti) => ({ key: `${selectedTrack}-${wi}-${ti}`, xp: t.xp }))
    ).filter(({ key }) => completedTasks.has(key)).reduce((s, { xp }) => s + xp, 0),
    [track, completedTasks, selectedTrack]
  );
  const totalTasks = track.weeks.flatMap(w => w.tasks).length;
  const doneTasks = track.weeks.flatMap((w, wi) =>
    w.tasks.map((_, ti) => `${selectedTrack}-${wi}-${ti}`)
  ).filter(k => completedTasks.has(k)).length;

  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  function toggleTask(trackId: string, weekIdx: number, taskIdx: number, xp: number) {
    const key = `${trackId}-${weekIdx}-${taskIdx}`;
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        fireXP(xp, 'Roadmap task completed');
      }
      localStorage.setItem('eyf.roadmap.done', JSON.stringify([...next]));
      return next;
    });
  }

  function getWeekProgress(wi: number) {
    const count = track.weeks[wi].tasks.length;
    const done = track.weeks[wi].tasks.filter((_, ti) => completedTasks.has(`${selectedTrack}-${wi}-${ti}`)).length;
    return { done, count };
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Interview Prep Roadmap</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Structured week-by-week plan for your target role. Check off tasks as you complete them — earn XP every step.
          </p>
        </div>

        {/* Track selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROADMAPS.map(r => (
            <button
              key={r.id}
              onClick={() => { setSelectedTrack(r.id); setExpandedWeek(1); }}
              className={`relative rounded-xl border p-4 text-left transition-all duration-200 ${
                selectedTrack === r.id
                  ? `border-zinc-500 bg-gradient-to-br ${r.gradient} ring-2 ring-inset ring-zinc-500/40`
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-xl ${r.color}`}>{r.icon}</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${r.color}`}>{r.duration}</span>
              </div>
              <p className="font-semibold text-zinc-100 text-sm">{r.label}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{r.targetRole}</p>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-zinc-200">{track.label} — Overall Progress</p>
              <p className="text-xs text-zinc-500 mt-0.5">{doneTasks} / {totalTasks} tasks · {earnedXP} / {totalXP} XP</p>
            </div>
            <span className={`text-2xl font-bold ${track.color}`}>{progressPct}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                progressPct >= 80 ? 'bg-green-500' : progressPct >= 40 ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Week cards */}
        <div className="space-y-3">
          {track.weeks.map((week, wi) => {
            const wc = WEEK_COLORS[week.color] ?? WEEK_COLORS['border-blue-500'];
            const { done, count } = getWeekProgress(wi);
            const weekPct = count > 0 ? Math.round((done / count) * 100) : 0;
            const isExpanded = expandedWeek === week.week;
            const isComplete = done === count;

            return (
              <div
                key={week.week}
                className={`rounded-xl border ${week.color} bg-zinc-900/60 overflow-hidden transition-all duration-200`}
              >
                {/* Week header */}
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-zinc-800/30 transition-colors"
                  onClick={() => setExpandedWeek(isExpanded ? null : week.week)}
                >
                  {/* Week number badge */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${wc.bg} ring-1 ${wc.ring}`}>
                    {isComplete
                      ? <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                      : <span className={`text-sm font-bold ${wc.text}`}>W{week.week}</span>
                    }
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-zinc-100 truncate">{week.theme}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${wc.bg} ${wc.text}`}>
                        {week.focus}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 max-w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-zinc-500'}`}
                          style={{ width: `${weekPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">{done}/{count} done</span>
                    </div>
                  </div>

                  {week.milestone && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-yellow-400 font-medium flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">flag</span>
                      {week.milestone}
                    </div>
                  )}

                  <span className="material-symbols-outlined text-zinc-600 flex-shrink-0">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Week tasks */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {week.milestone && (
                      <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs font-medium mb-3">
                        <span className="material-symbols-outlined text-sm">flag</span>
                        Milestone: {week.milestone}
                      </div>
                    )}
                    {week.tasks.map((task, ti) => {
                      const key = `${selectedTrack}-${wi}-${ti}`;
                      const isDone = completedTasks.has(key);
                      const meta = TYPE_META[task.type];

                      return (
                        <div
                          key={ti}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 ${
                            isDone
                              ? 'bg-green-500/5 border-green-500/20'
                              : 'bg-zinc-800/40 border-zinc-700/50 hover:border-zinc-600'
                          }`}
                        >
                          <button
                            onClick={() => toggleTask(selectedTrack, wi, ti, task.xp)}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                              isDone
                                ? 'bg-green-500 border-green-500'
                                : 'border-zinc-600 hover:border-green-500'
                            }`}
                          >
                            {isDone && (
                              <span className="material-symbols-outlined text-white text-xs leading-none">check</span>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            {task.link ? (
                              <Link
                                to={task.link}
                                className={`text-sm font-medium leading-snug transition-colors ${
                                  isDone ? 'text-zinc-500 line-through' : 'text-zinc-200 hover:text-white'
                                }`}
                              >
                                {task.title}
                              </Link>
                            ) : (
                              <p className={`text-sm font-medium leading-snug ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                {task.title}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.color}`}>
                              <span className="material-symbols-outlined text-xs">{meta.icon}</span>
                              {meta.label}
                            </span>
                            <span className="text-xs text-yellow-400 font-semibold">+{task.xp} XP</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 rounded-xl border border-zinc-700 p-6 text-center">
          <p className="text-zinc-300 font-semibold mb-1">Want a personalized daily schedule?</p>
          <p className="text-zinc-500 text-sm mb-4">The Study Plan generator turns this roadmap into day-by-day tasks tailored to your target date.</p>
          <Link
            to="/app/study-plan"
            className="inline-flex items-center gap-2 bg-[#E82127] hover:bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            Generate My Study Plan
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
