import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Seed plan entitlements
  const entitlements = [
    { plan: "free", featureKey: "dsa_daily_submissions", enabled: true, limitValue: 10 },
    { plan: "free", featureKey: "dsa_library", enabled: true, limitValue: 1 },
    { plan: "free", featureKey: "core_subjects", enabled: true, limitValue: 1 },
    { plan: "free", featureKey: "visualizer", enabled: false, limitValue: null },
    { plan: "free", featureKey: "mock_interviews", enabled: false, limitValue: 0 },
    { plan: "free", featureKey: "mentorship_monthly", enabled: false, limitValue: 0 },
    { plan: "free", featureKey: "resume_pdf_export", enabled: false, limitValue: null },
    { plan: "free", featureKey: "ai_code_review", enabled: false, limitValue: null },

    { plan: "basic", featureKey: "dsa_daily_submissions", enabled: true, limitValue: 50 },
    { plan: "basic", featureKey: "dsa_library", enabled: true, limitValue: 2 },
    { plan: "basic", featureKey: "core_subjects", enabled: true, limitValue: 4 },
    { plan: "basic", featureKey: "visualizer", enabled: false, limitValue: null },
    { plan: "basic", featureKey: "mock_interviews", enabled: false, limitValue: 0 },
    { plan: "basic", featureKey: "mentorship_monthly", enabled: false, limitValue: 0 },
    { plan: "basic", featureKey: "resume_pdf_export", enabled: true, limitValue: null },
    { plan: "basic", featureKey: "ai_code_review", enabled: false, limitValue: null },

    { plan: "pro", featureKey: "dsa_daily_submissions", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "dsa_library", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "core_subjects", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "visualizer", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "mock_interviews", enabled: true, limitValue: 2 },
    { plan: "pro", featureKey: "mentorship_monthly", enabled: true, limitValue: 1 },
    { plan: "pro", featureKey: "resume_pdf_export", enabled: true, limitValue: null },
    { plan: "pro", featureKey: "ai_code_review", enabled: false, limitValue: null },

    { plan: "elite", featureKey: "dsa_daily_submissions", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "dsa_library", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "core_subjects", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "visualizer", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "mock_interviews", enabled: true, limitValue: 5 },
    { plan: "elite", featureKey: "mentorship_monthly", enabled: true, limitValue: 3 },
    { plan: "elite", featureKey: "resume_pdf_export", enabled: true, limitValue: null },
    { plan: "elite", featureKey: "ai_code_review", enabled: true, limitValue: null },
  ] as const;

  for (const e of entitlements) {
    await prisma.planEntitlement.upsert({
      where: { plan_featureKey: { plan: e.plan, featureKey: e.featureKey } },
      update: { enabled: e.enabled, limitValue: e.limitValue ?? null },
      create: e,
    });
  }
  console.log("Entitlements seeded.");

  // Seed dev users
  const hash = await bcrypt.hash("Password123!", 12);
  const users = [
    { email: "user@eyf.dev", role: "user", plan: "free" },
    { email: "pro@eyf.dev", role: "user", plan: "pro" },
    { email: "staff@eyf.dev", role: "staff", plan: "free" },
    { email: "admin@eyf.dev", role: "admin", plan: "elite" },
  ] as const;

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: hash,
          role: u.role,
          plan: u.plan,
          security: { create: {} },
          xp: { create: {} },
          learningGoal: { create: { priorityModules: ["dsa", "core-subjects", "placement"] } },
        },
      });
    }
  }
  console.log("Users seeded.");

  // Seed sample problems
  const problems = [
    {
      slug: "two-sum",
      title: "Two Sum",
      difficulty: "easy" as const,
      topics: ["array", "hash-table"],
      planAccess: "free" as const,
      statement: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
      examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
        { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
      ],
      constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists."],
      hints: ["A brute force approach is O(n²). Can you do better?", "Use a hash map to store complement lookups."],
      testCases: [
        { input: "2 7 11 15\n9", expectedOutput: "0 1", isHidden: false, orderIndex: 0 },
        { input: "3 2 4\n6", expectedOutput: "1 2", isHidden: false, orderIndex: 1 },
        { input: "3 3\n6", expectedOutput: "0 1", isHidden: true, orderIndex: 2 },
      ],
    },
    {
      slug: "valid-parentheses",
      title: "Valid Parentheses",
      difficulty: "easy" as const,
      topics: ["stack", "string"],
      planAccess: "free" as const,
      statement: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
      examples: [
        { input: 's = "()"', output: "true" },
        { input: 's = "()[]{}"', output: "true" },
        { input: 's = "(]"', output: "false" },
      ],
      constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
      hints: ["Use a stack. Push opening brackets, pop and compare when you see closing brackets."],
      testCases: [
        { input: "()", expectedOutput: "true", isHidden: false, orderIndex: 0 },
        { input: "()[]{}", expectedOutput: "true", isHidden: false, orderIndex: 1 },
        { input: "(]", expectedOutput: "false", isHidden: false, orderIndex: 2 },
        { input: "([)]", expectedOutput: "false", isHidden: true, orderIndex: 3 },
        { input: "{[]}", expectedOutput: "true", isHidden: true, orderIndex: 4 },
      ],
    },
    {
      slug: "best-time-to-buy-stock",
      title: "Best Time to Buy and Sell Stock",
      difficulty: "easy" as const,
      topics: ["array", "dynamic-programming"],
      planAccess: "free" as const,
      statement: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.`,
      examples: [
        { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5." },
        { input: "prices = [7,6,4,3,1]", output: "0", explanation: "No profit possible." },
      ],
      constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
      hints: ["Track the minimum price seen so far.", "At each step, compute profit = current price - min price so far."],
      testCases: [
        { input: "7 1 5 3 6 4", expectedOutput: "5", isHidden: false, orderIndex: 0 },
        { input: "7 6 4 3 1", expectedOutput: "0", isHidden: false, orderIndex: 1 },
        { input: "1 2", expectedOutput: "1", isHidden: true, orderIndex: 2 },
      ],
    },
    {
      slug: "longest-substring-without-repeating",
      title: "Longest Substring Without Repeating Characters",
      difficulty: "medium" as const,
      topics: ["sliding-window", "hash-table", "string"],
      planAccess: "free" as const,
      statement: `Given a string \`s\`, find the length of the longest substring without repeating characters.`,
      examples: [
        { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
        { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
        { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with the length of 3.' },
      ],
      constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
      hints: ["Use a sliding window with a hash set to track characters in the window."],
      testCases: [
        { input: "abcabcbb", expectedOutput: "3", isHidden: false, orderIndex: 0 },
        { input: "bbbbb", expectedOutput: "1", isHidden: false, orderIndex: 1 },
        { input: "pwwkew", expectedOutput: "3", isHidden: false, orderIndex: 2 },
        { input: "", expectedOutput: "0", isHidden: true, orderIndex: 3 },
      ],
    },
    {
      slug: "merge-intervals",
      title: "Merge Intervals",
      difficulty: "medium" as const,
      topics: ["array", "sorting"],
      planAccess: "basic" as const,
      statement: `Given an array of \`intervals\` where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
      examples: [
        { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
        { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]", explanation: "Intervals [1,4] and [4,5] are considered overlapping." },
      ],
      constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= starti <= endi <= 10^4"],
      hints: ["Sort intervals by start time.", "Iterate and merge when current interval overlaps the previous merged interval."],
      testCases: [
        { input: "1 3\n2 6\n8 10\n15 18", expectedOutput: "1 6\n8 10\n15 18", isHidden: false, orderIndex: 0 },
        { input: "1 4\n4 5", expectedOutput: "1 5", isHidden: false, orderIndex: 1 },
      ],
    },
    {
      slug: "lru-cache",
      title: "LRU Cache",
      difficulty: "hard" as const,
      topics: ["hash-table", "linked-list", "design"],
      planAccess: "pro" as const,
      statement: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size \`capacity\`.
- \`int get(int key)\` Return the value of the \`key\` if the key exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` Update the value of the \`key\` if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the \`capacity\` from this operation, evict the least recently used key.

The functions \`get\` and \`put\` must each run in \`O(1)\` average time complexity.`,
      examples: [
        { input: '["LRUCache","put","put","get","put","get","put","get","get","get"]\n[[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]', output: "[null,null,null,1,null,-1,null,-1,3,4]" },
      ],
      constraints: ["1 <= capacity <= 3000", "0 <= key <= 10^4", "0 <= value <= 10^5", "At most 2 * 10^5 calls will be made to get and put."],
      hints: ["Use a doubly linked list + HashMap.", "The head of the list is MRU, tail is LRU."],
      testCases: [
        { input: "2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4", expectedOutput: "1\n-1\n-1\n3\n4", isHidden: false, orderIndex: 0 },
      ],
    },
  ];

  for (const p of problems) {
    const { testCases, ...problemData } = p;
    const existing = await prisma.problem.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.problem.create({
        data: {
          ...problemData,
          testCases: { createMany: { data: testCases } },
        },
      });
    }
  }
  console.log("Problems seeded.");

  // Seed core subject content
  const subjectContent = [
    { subject: "os", topic: "process-scheduling", slug: "os-process-scheduling", title: "Process Scheduling", planAccess: "free" as const, orderIndex: 1,
      content: `# Process Scheduling

## What is Process Scheduling?
Process scheduling is the activity of the process manager that handles the removal of the running process from the CPU and the selection of another process based on a particular strategy.

## Key Algorithms

### First Come First Served (FCFS)
- Non-preemptive
- Processes are executed in the order they arrive
- Simple but may cause convoy effect

### Shortest Job First (SJF)
- Can be preemptive (SRTF) or non-preemptive
- Optimal for minimizing average waiting time
- Requires knowing burst times in advance

### Round Robin (RR)
- Preemptive
- Each process gets a fixed time quantum
- Best for time-sharing systems

### Priority Scheduling
- Each process has a priority; highest priority runs first
- Can suffer from starvation (fixed by aging)

## Key Metrics
- **Turnaround Time**: completion time - arrival time
- **Waiting Time**: turnaround time - burst time
- **Response Time**: first response - arrival time
- **CPU Utilization**: percentage of time CPU is busy

## Interview Tips
- Know how to calculate average waiting/turnaround time for each algorithm
- Understand when to use each algorithm
- SRTF is the preemptive version of SJF` },
    { subject: "os", topic: "memory-management", slug: "os-memory-management", title: "Memory Management", planAccess: "free" as const, orderIndex: 2,
      content: `# Memory Management

## Virtual Memory
Virtual memory creates the illusion that each process has its own large, contiguous address space.

## Paging
- Divide physical memory into fixed-size frames
- Divide logical memory into fixed-size pages (same size as frames)
- Page table maps logical pages to physical frames
- No external fragmentation, but internal fragmentation possible

## Segmentation
- Divide memory into variable-size segments (code, stack, heap)
- External fragmentation possible
- Better matches programmer's view

## Page Replacement Algorithms
- **FIFO**: Replace the oldest page
- **LRU**: Replace the least recently used page (optimal in practice)
- **Optimal**: Replace page that won't be used for longest time (theoretical)
- **Clock (Second Chance)**: FIFO with a reference bit

## Thrashing
When a process spends more time paging than executing. Caused by too many processes in memory or poor locality of reference.` },
    { subject: "dbms", topic: "normalization", slug: "dbms-normalization", title: "Normalization", planAccess: "free" as const, orderIndex: 1,
      content: `# Database Normalization

## Why Normalize?
Reduce data redundancy, eliminate anomalies (insertion, update, deletion), and improve data integrity.

## Normal Forms

### 1NF (First Normal Form)
- All attributes are atomic (no repeating groups or arrays)
- Each row is unique (has a primary key)

### 2NF (Second Normal Form)
- Must be in 1NF
- No partial dependencies (non-key attributes must depend on the WHOLE primary key)
- Applies to tables with composite primary keys

### 3NF (Third Normal Form)
- Must be in 2NF
- No transitive dependencies (non-key attributes must not depend on other non-key attributes)

### BCNF (Boyce-Codd Normal Form)
- Stronger version of 3NF
- For every functional dependency X → Y, X must be a superkey

## Functional Dependencies
A functional dependency X → Y means that X determines Y. Knowing the value of X, you can determine Y.

## Interview Tips
- Know how to identify and remove functional dependencies
- Understand trade-offs: normalization vs. performance (sometimes denormalization is better)
- 3NF is usually sufficient for most applications` },
    { subject: "cn", topic: "tcp-handshake", slug: "cn-tcp-handshake", title: "TCP Three-Way Handshake", planAccess: "free" as const, orderIndex: 1,
      content: `# TCP Three-Way Handshake

## What is TCP?
TCP (Transmission Control Protocol) is a connection-oriented protocol that provides reliable, ordered, and error-checked delivery of data.

## The Handshake Process

### Step 1: SYN
Client sends a SYN (synchronize) segment to the server:
- SYN flag = 1
- Sequence number = x (randomly chosen by client)

### Step 2: SYN-ACK
Server responds with SYN-ACK:
- SYN flag = 1, ACK flag = 1
- Sequence number = y (randomly chosen by server)
- Acknowledgment number = x + 1

### Step 3: ACK
Client sends ACK:
- ACK flag = 1
- Acknowledgment number = y + 1

Connection is now established!

## Four-Way Termination
TCP uses a four-way handshake to close connections:
1. Client sends FIN
2. Server sends ACK
3. Server sends FIN
4. Client sends ACK → enters TIME_WAIT state

## Why TIME_WAIT?
Ensures any delayed packets from the old connection are absorbed before a new connection on the same port pair is established.

## Key TCP Features
- **Flow Control**: Sliding window prevents receiver from being overwhelmed
- **Congestion Control**: Slow start, congestion avoidance, fast retransmit
- **Reliability**: Sequence numbers + acknowledgments + retransmission` },
    { subject: "oop", topic: "solid-principles", slug: "oop-solid-principles", title: "SOLID Principles", planAccess: "free" as const, orderIndex: 1,
      content: `# SOLID Principles

## S - Single Responsibility Principle
A class should have only one reason to change. Each class/module should focus on doing one thing well.

**Bad**: A User class that handles authentication, sends emails, AND manages database persistence.
**Good**: Separate classes — UserAuthService, UserEmailService, UserRepository.

## O - Open/Closed Principle
Software entities should be open for extension but closed for modification. Add new behavior without changing existing code.

**Approach**: Use interfaces, abstract classes, and composition over inheritance.

## L - Liskov Substitution Principle
Objects of a subclass should be substitutable for objects of the superclass without altering correctness.

**Classic violation**: Square extends Rectangle — setting width/height independently breaks the Rectangle contract.

## I - Interface Segregation Principle
Clients should not be forced to depend on interfaces they don't use. Prefer many small, specific interfaces over one large general-purpose interface.

## D - Dependency Inversion Principle
High-level modules should not depend on low-level modules. Both should depend on abstractions.

**Example**: Instead of \`UserService\` depending on \`MySQLRepository\`, both depend on a \`UserRepository\` interface.

## Why SOLID Matters
- Easier to test (decoupled, mockable dependencies)
- Easier to extend (new features don't require touching existing code)
- Easier to maintain (isolated changes)

## Design Patterns that Implement SOLID
- **Factory/Abstract Factory**: OCP, DIP
- **Strategy**: OCP, SRP
- **Observer**: SRP, OCP
- **Decorator**: OCP, SRP` },
  ];

  for (const content of subjectContent) {
    const existing = await prisma.coreSubjectContent.findUnique({ where: { slug: content.slug } });
    if (!existing) {
      await prisma.coreSubjectContent.create({ data: content });
    }
  }
  console.log("Subject content seeded.");

  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
