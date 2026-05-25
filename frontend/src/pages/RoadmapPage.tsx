import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { useUser } from '../contexts/UserContext';

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

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

const TYPE_META: Record<RoadmapTask['type'], { label: string; color: string; bg: string; icon: string }> = {
  theory:   { label: 'Theory',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',   icon: 'menu_book'        },
  practice: { label: 'Practice', color: '#fb923c', bg: 'rgba(251,146,60,0.12)',   icon: 'code'             },
  project:  { label: 'Project',  color: '#c084fc', bg: 'rgba(192,132,252,0.12)',  icon: 'build'            },
  mock:     { label: 'Mock',     color: '#f87171', bg: 'rgba(248,113,113,0.12)',  icon: 'record_voice_over'},
  review:   { label: 'Review',   color: '#4ade80', bg: 'rgba(74,222,128,0.12)',   icon: 'refresh'          },
};

const WEEK_COLORS: Record<string, { color: string; glow: string; border: string }> = {
  'border-blue-500':   { color: '#60a5fa', glow: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)'  },
  'border-purple-500': { color: '#c084fc', glow: 'rgba(192,132,252,0.1)',  border: 'rgba(192,132,252,0.25)' },
  'border-green-500':  { color: '#4ade80', glow: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)'  },
  'border-orange-500': { color: '#fb923c', glow: 'rgba(251,146,60,0.1)',   border: 'rgba(251,146,60,0.25)'  },
  'border-pink-500':   { color: '#f472b6', glow: 'rgba(244,114,182,0.1)',  border: 'rgba(244,114,182,0.25)' },
  'border-red-500':    { color: '#f87171', glow: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)' },
  'border-yellow-500': { color: '#facc15', glow: 'rgba(250,204,21,0.1)',   border: 'rgba(250,204,21,0.25)'  },
  'border-cyan-500':   { color: '#22d3ee', glow: 'rgba(34,211,238,0.1)',   border: 'rgba(34,211,238,0.25)'  },
  'border-teal-500':   { color: '#2dd4bf', glow: 'rgba(45,212,191,0.1)',   border: 'rgba(45,212,191,0.25)'  },
};

const TRACK_COLOR: Record<string, { color: string; glow: string }> = {
  campus:  { color: '#60a5fa', glow: 'rgba(96,165,250,0.15)'  },
  faang:   { color: '#c084fc', glow: 'rgba(192,132,252,0.15)' },
  backend: { color: '#4ade80', glow: 'rgba(74,222,128,0.15)'  },
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
  const progressBarHex = progressPct >= 80 ? '#4ade80' : progressPct >= 40 ? '#fb923c' : '#60a5fa';
  const trackColors = TRACK_COLOR[selectedTrack] ?? { color: '#60a5fa', glow: 'rgba(96,165,250,0.15)' };

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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ paddingTop: 56, paddingBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>
            Prep Strategy
          </p>
          <h1 style={{
            fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
            background: 'linear-gradient(135deg, #60a5fa 0%, #c084fc 50%, #4ade80 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12,
          }}>
            ROADMAP.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--t2)' }}>
            Structured week-by-week plan for your target role. Check off tasks, earn XP every step.
          </p>
        </motion.div>

        {/* ── Track selector ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
          {ROADMAPS.map((r, i) => {
            const tc = TRACK_COLOR[r.id] ?? { color: '#60a5fa', glow: 'rgba(96,165,250,0.15)' };
            const isActive = selectedTrack === r.id;
            return (
              <motion.button
                key={r.id}
                onClick={() => { setSelectedTrack(r.id); setExpandedWeek(1); }}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                whileHover={{ boxShadow: `0 8px 28px ${tc.glow}` }}
                style={{
                  textAlign: 'left', padding: 20, borderRadius: 18,
                  background: isActive ? tc.glow.replace('0.15', '0.1') : 'rgba(10,10,10,0.7)',
                  border: isActive ? `1px solid ${tc.color}40` : '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(16px)', cursor: 'pointer',
                  boxShadow: isActive ? `0 0 28px ${tc.glow}` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className="material-symbols-outlined" style={{ color: tc.color, fontSize: 20 }}>{r.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: tc.color }}>{r.duration}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{r.label}</p>
                <p style={{ fontSize: 11, color: 'var(--t2)' }}>{r.targetRole}</p>
              </motion.button>
            );
          })}
        </div>

        {/* ── Progress card ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ ...GLASS, borderRadius: 18, padding: '18px 22px', marginBottom: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{track.label} — Overall Progress</p>
              <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>{doneTasks} / {totalTasks} tasks · {earnedXP} / {totalXP} XP</p>
            </div>
            <span style={{ fontSize: 26, fontWeight: 900, color: trackColors.color }}>{progressPct}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ height: '100%', background: progressBarHex, borderRadius: 4 }}
            />
          </div>
        </motion.div>

        {/* ── Week cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {track.weeks.map((week, wi) => {
            const wc = WEEK_COLORS[week.color] ?? WEEK_COLORS['border-blue-500'];
            const { done, count } = getWeekProgress(wi);
            const weekPct = count > 0 ? Math.round((done / count) * 100) : 0;
            const isExpanded = expandedWeek === week.week;
            const isComplete = done === count;

            return (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ delay: wi * 0.03 }}
                style={{
                  borderRadius: 16, border: `1px solid ${isComplete ? 'rgba(74,222,128,0.2)' : wc.border}`,
                  background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(16px)', overflow: 'hidden',
                }}
              >
                {/* Week header */}
                <button
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', background: 'none', border: 'none' }}
                  onClick={() => setExpandedWeek(isExpanded ? null : week.week)}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isComplete ? 'rgba(74,222,128,0.1)' : wc.glow,
                    border: `1px solid ${isComplete ? 'rgba(74,222,128,0.25)' : wc.border}`, flexShrink: 0,
                  }}>
                    {isComplete
                      ? <span className="material-symbols-outlined" style={{ color: '#4ade80', fontSize: 20 }}>check_circle</span>
                      : <span style={{ fontSize: 12, fontWeight: 900, color: wc.color }}>W{week.week}</span>
                    }
                  </div>

                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{week.theme}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '2px 8px', borderRadius: 999, background: wc.glow, color: wc.color }}>
                        {week.focus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                      <div style={{ width: 120, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: isComplete ? '#4ade80' : wc.color, borderRadius: 3, width: `${weekPct}%`, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>{done}/{count}</span>
                    </div>
                  </div>

                  {week.milestone && (
                    <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 4, fontSize: 11, color: '#facc15', fontWeight: 600, flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>flag</span>
                      {week.milestone}
                    </div>
                  )}

                  <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, fontSize: 20 }}>
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Week tasks */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 18px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {week.milestone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.2)', fontSize: 11, fontWeight: 600, color: '#facc15', marginBottom: 4 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>flag</span>
                            Milestone: {week.milestone}
                          </div>
                        )}
                        {week.tasks.map((task, ti) => {
                          const key = `${selectedTrack}-${wi}-${ti}`;
                          const isDone = completedTasks.has(key);
                          const meta = TYPE_META[task.type];

                          return (
                            <div
                              key={`task-${wi}-${ti}`}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12,
                                background: isDone ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.03)',
                                border: isDone ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.15s',
                              }}
                            >
                              <button
                                onClick={() => toggleTask(selectedTrack, wi, ti, task.xp)}
                                style={{
                                  flexShrink: 0, width: 20, height: 20, borderRadius: 6,
                                  border: isDone ? '2px solid #4ade80' : '2px solid rgba(255,255,255,0.2)',
                                  background: isDone ? '#4ade80' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', marginTop: 1, transition: 'all 0.15s',
                                }}
                              >
                                {isDone && <span className="material-symbols-outlined" style={{ color: '#000', fontSize: 12, lineHeight: 1 }}>check</span>}
                              </button>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                {task.link ? (
                                  <Link to={task.link} style={{ textDecoration: 'none' }}>
                                    <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: isDone ? 'rgba(255,255,255,0.3)' : '#fff', textDecoration: isDone ? 'line-through' : 'none' }}>
                                      {task.title}
                                    </span>
                                  </Link>
                                ) : (
                                  <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5, color: isDone ? 'rgba(255,255,255,0.3)' : '#fff', textDecoration: isDone ? 'line-through' : 'none', margin: 0 }}>
                                    {task.title}
                                  </p>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <span className="hidden sm:inline-flex" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 999, background: meta.bg, color: meta.color }}>
                                  {meta.label}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#facc15' }}>+{task.xp}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* ── Footer CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ marginTop: 28, borderRadius: 20, padding: '28px 32px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(232,33,39,0.08), rgba(192,132,252,0.08))', border: '1px solid rgba(232,33,39,0.15)' }}
        >
          <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Want a personalized daily schedule?</p>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 18 }}>The Study Plan generator turns this roadmap into day-by-day tasks tailored to your target date.</p>
          <Link to="/app/study-plan" style={{ textDecoration: 'none' }}>
            <motion.span
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(232,33,39,0.35)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #e82127, #c41a1f)', borderRadius: 999, padding: '12px 28px',
                color: '#fff', fontSize: 13, fontWeight: 900,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_month</span>
              Generate My Study Plan
            </motion.span>
          </Link>
        </motion.div>

      </div>
    </AppShell>
  );
}
