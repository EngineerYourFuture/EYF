/**
 * Dev seed — users, problems, theory notes, flashcards, badges, projects, jobs.
 * Phase 2 content stays small + editorial. Scale-up via LLM-driven seeder later.
 */
import { PrismaClient, PlanTier, Role, Difficulty, Language, Subject, BadgeTier, JobRole, DemandLevel, InternshipDuration } from "../src/generated/client";

const prisma = new PrismaClient();

const devUsers = [
  { email: "user@eyf.dev",  name: "Free User",  role: Role.STUDENT_FREE,  plan: PlanTier.FREE,  clerkId: "dev_clerk_free" },
  { email: "basic@eyf.dev", name: "Basic User", role: Role.STUDENT_BASIC, plan: PlanTier.BASIC, clerkId: "dev_clerk_basic" },
  { email: "pro@eyf.dev",   name: "Pro User",   role: Role.STUDENT_PRO,   plan: PlanTier.PRO,   clerkId: "dev_clerk_pro" },
  { email: "elite@eyf.dev", name: "Elite User", role: Role.STUDENT_ELITE, plan: PlanTier.ELITE, clerkId: "dev_clerk_elite" },
  { email: "admin@eyf.dev", name: "Admin",      role: Role.ADMIN,         plan: PlanTier.ELITE, clerkId: "dev_clerk_admin" },
];

type ProblemSeed = {
  slug: string; title: string; description: string; difficulty: Difficulty;
  topics: string[]; patterns: string[]; companies: string[];
  premium?: boolean; examples: { input: string; expected: string }[];
};

const problems: ProblemSeed[] = [
  { slug: "two-sum", title: "Two Sum", description: "Given an array of integers `nums` and an integer `target`, return indices of two numbers that add up to target.", difficulty: Difficulty.EASY, topics: ["array","hash-map"], patterns: ["hash-map"], companies: ["amazon","google","flipkart"], examples: [{ input: "[2,7,11,15], 9", expected: "[0,1]" }] },
  { slug: "valid-anagram", title: "Valid Anagram", description: "Given two strings s and t, return true if t is an anagram of s.", difficulty: Difficulty.EASY, topics: ["string","hash-map"], patterns: ["hash-map"], companies: ["microsoft","tcs"], examples: [{ input: "\"anagram\", \"nagaram\"", expected: "true" }] },
  { slug: "group-anagrams", title: "Group Anagrams", description: "Given an array of strings, group anagrams together.", difficulty: Difficulty.MEDIUM, topics: ["string","hash-map"], patterns: ["hash-map"], companies: ["amazon","uber"], examples: [{ input: "[\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", expected: "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]" }] },
  { slug: "container-with-most-water", title: "Container With Most Water", description: "Given n non-negative integers representing heights, find two lines that with the x-axis form a container holding the most water.", difficulty: Difficulty.MEDIUM, topics: ["array","two-pointers"], patterns: ["two-pointers"], companies: ["amazon","adobe"], examples: [{ input: "[1,8,6,2,5,4,8,3,7]", expected: "49" }] },
  { slug: "three-sum", title: "3Sum", description: "Return all unique triplets in the array which give the sum of zero.", difficulty: Difficulty.MEDIUM, topics: ["array","two-pointers"], patterns: ["two-pointers"], companies: ["meta","amazon"], examples: [{ input: "[-1,0,1,2,-1,-4]", expected: "[[-1,-1,2],[-1,0,1]]" }] },
  { slug: "trapping-rain-water", title: "Trapping Rain Water", description: "Compute how much water can be trapped after raining over an elevation map.", difficulty: Difficulty.HARD, topics: ["array","two-pointers","dp"], patterns: ["two-pointers"], companies: ["amazon","google"], premium: true, examples: [{ input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expected: "6" }] },
  { slug: "longest-substring-without-repeating-characters", title: "Longest Substring Without Repeating Characters", description: "Length of the longest substring of s without repeating characters.", difficulty: Difficulty.MEDIUM, topics: ["string","sliding-window"], patterns: ["sliding-window"], companies: ["amazon","google","meta"], examples: [{ input: "\"abcabcbb\"", expected: "3" }] },
  { slug: "minimum-window-substring", title: "Minimum Window Substring", description: "Return the minimum window of s which contains all characters of t.", difficulty: Difficulty.HARD, topics: ["string","sliding-window","hash-map"], patterns: ["sliding-window"], companies: ["meta","amazon"], premium: true, examples: [{ input: "\"ADOBECODEBANC\", \"ABC\"", expected: "\"BANC\"" }] },
  { slug: "binary-search", title: "Binary Search", description: "Sorted array + target, return index or -1.", difficulty: Difficulty.EASY, topics: ["array","binary-search"], patterns: ["binary-search"], companies: ["amazon"], examples: [{ input: "[-1,0,3,5,9,12], 9", expected: "4" }] },
  { slug: "search-in-rotated-sorted-array", title: "Search in Rotated Sorted Array", description: "Search a rotated sorted array in O(log n).", difficulty: Difficulty.MEDIUM, topics: ["array","binary-search"], patterns: ["binary-search"], companies: ["amazon","flipkart"], examples: [{ input: "[4,5,6,7,0,1,2], 0", expected: "4" }] },
  { slug: "reverse-linked-list", title: "Reverse Linked List", description: "Reverse a singly linked list.", difficulty: Difficulty.EASY, topics: ["linked-list"], patterns: ["linked-list"], companies: ["amazon","microsoft"], examples: [{ input: "[1,2,3,4,5]", expected: "[5,4,3,2,1]" }] },
  { slug: "linked-list-cycle", title: "Linked List Cycle", description: "Detect if a linked list has a cycle.", difficulty: Difficulty.EASY, topics: ["linked-list","two-pointers"], patterns: ["fast-slow-pointers"], companies: ["amazon"], examples: [{ input: "[3,2,0,-4], pos=1", expected: "true" }] },
  { slug: "merge-two-sorted-lists", title: "Merge Two Sorted Lists", description: "Merge two sorted linked lists into one.", difficulty: Difficulty.EASY, topics: ["linked-list"], patterns: ["linked-list"], companies: ["amazon","google"], examples: [{ input: "[1,2,4], [1,3,4]", expected: "[1,1,2,3,4,4]" }] },
  { slug: "maximum-depth-of-binary-tree", title: "Maximum Depth of Binary Tree", description: "Max depth of a binary tree.", difficulty: Difficulty.EASY, topics: ["tree","dfs"], patterns: ["dfs"], companies: ["amazon"], examples: [{ input: "[3,9,20,null,null,15,7]", expected: "3" }] },
  { slug: "binary-tree-level-order-traversal", title: "Binary Tree Level Order Traversal", description: "Return level-order traversal.", difficulty: Difficulty.MEDIUM, topics: ["tree","bfs"], patterns: ["bfs"], companies: ["amazon","linkedin"], examples: [{ input: "[3,9,20,null,null,15,7]", expected: "[[3],[9,20],[15,7]]" }] },
  { slug: "validate-binary-search-tree", title: "Validate Binary Search Tree", description: "Is the binary tree a valid BST?", difficulty: Difficulty.MEDIUM, topics: ["tree","dfs"], patterns: ["dfs"], companies: ["amazon","meta"], examples: [{ input: "[2,1,3]", expected: "true" }] },
  { slug: "lowest-common-ancestor-of-a-bst", title: "Lowest Common Ancestor of a BST", description: "Find LCA in a BST.", difficulty: Difficulty.MEDIUM, topics: ["tree","bst"], patterns: ["dfs"], companies: ["amazon","flipkart"], examples: [{ input: "[6,2,8,0,4,7,9,null,null,3,5], 2, 8", expected: "6" }] },
  { slug: "number-of-islands", title: "Number of Islands", description: "Count islands in a 2D grid.", difficulty: Difficulty.MEDIUM, topics: ["graph","dfs"], patterns: ["graph"], companies: ["amazon","google"], examples: [{ input: "[[1,1,0],[0,1,0],[1,0,1]]", expected: "3" }] },
  { slug: "course-schedule", title: "Course Schedule", description: "Can you finish all courses given prerequisites?", difficulty: Difficulty.MEDIUM, topics: ["graph","topological-sort"], patterns: ["graph"], companies: ["amazon","meta"], examples: [{ input: "2, [[1,0]]", expected: "true" }] },
  { slug: "climbing-stairs", title: "Climbing Stairs", description: "Count distinct ways to climb n stairs in 1 or 2 steps.", difficulty: Difficulty.EASY, topics: ["dp"], patterns: ["dp"], companies: ["amazon","adobe"], examples: [{ input: "3", expected: "3" }] },
  { slug: "house-robber", title: "House Robber", description: "Maximize loot without robbing adjacent houses.", difficulty: Difficulty.MEDIUM, topics: ["dp"], patterns: ["dp"], companies: ["amazon"], examples: [{ input: "[2,7,9,3,1]", expected: "12" }] },
  { slug: "longest-increasing-subsequence", title: "Longest Increasing Subsequence", description: "Length of the LIS.", difficulty: Difficulty.MEDIUM, topics: ["dp","binary-search"], patterns: ["dp"], companies: ["amazon","microsoft"], examples: [{ input: "[10,9,2,5,3,7,101,18]", expected: "4" }] },
  { slug: "edit-distance", title: "Edit Distance", description: "Min operations to convert word1 to word2.", difficulty: Difficulty.HARD, topics: ["dp","string"], patterns: ["dp"], companies: ["amazon","meta"], premium: true, examples: [{ input: "\"horse\", \"ros\"", expected: "3" }] },
  { slug: "best-time-to-buy-and-sell-stock", title: "Best Time to Buy and Sell Stock", description: "Max profit from one buy-sell pair.", difficulty: Difficulty.EASY, topics: ["array","greedy","dp"], patterns: ["greedy"], companies: ["amazon"], examples: [{ input: "[7,1,5,3,6,4]", expected: "5" }] },
  { slug: "jump-game", title: "Jump Game", description: "Can you reach the last index?", difficulty: Difficulty.MEDIUM, topics: ["array","greedy"], patterns: ["greedy"], companies: ["amazon"], examples: [{ input: "[2,3,1,1,4]", expected: "true" }] },
  { slug: "permutations", title: "Permutations", description: "Return all permutations of distinct integers.", difficulty: Difficulty.MEDIUM, topics: ["backtracking"], patterns: ["backtracking"], companies: ["amazon","linkedin"], examples: [{ input: "[1,2,3]", expected: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" }] },
  { slug: "subsets", title: "Subsets", description: "Return the power set.", difficulty: Difficulty.MEDIUM, topics: ["backtracking","bitmask"], patterns: ["backtracking"], companies: ["amazon"], examples: [{ input: "[1,2,3]", expected: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" }] },
  { slug: "valid-parentheses", title: "Valid Parentheses", description: "Is the bracket string valid?", difficulty: Difficulty.EASY, topics: ["stack","string"], patterns: ["stack"], companies: ["amazon","google"], examples: [{ input: "\"()[]{}\"", expected: "true" }] },
  { slug: "min-stack", title: "Min Stack", description: "Stack with O(1) getMin.", difficulty: Difficulty.MEDIUM, topics: ["stack","design"], patterns: ["stack"], companies: ["amazon"], examples: [{ input: "push(-2),push(0),push(-3),getMin()", expected: "-3" }] },
  { slug: "kth-largest-element-in-an-array", title: "Kth Largest Element in an Array", description: "Return the kth largest element.", difficulty: Difficulty.MEDIUM, topics: ["heap","quickselect"], patterns: ["heap"], companies: ["amazon","flipkart"], examples: [{ input: "[3,2,1,5,6,4], k=2", expected: "5" }] },
  { slug: "single-number", title: "Single Number", description: "Find the unique element in O(1) space.", difficulty: Difficulty.EASY, topics: ["bitmask","xor"], patterns: ["bitmask"], companies: ["amazon","microsoft"], examples: [{ input: "[2,2,1]", expected: "1" }] },
];

const STARTERS = [
  { language: Language.CPP,        code: "class Solution {\npublic:\n    // your code here\n};\n" },
  { language: Language.PYTHON,     code: "class Solution:\n    def solve(self):\n        pass\n" },
  { language: Language.JAVA,       code: "class Solution {\n    // your code here\n}\n" },
  { language: Language.JAVASCRIPT, code: "// your code here\n" },
];

// ── Theory notes ────────────────────────────────────────────────────
const notes = [
  { slug: "os-process-vs-thread", subject: Subject.OS, title: "Process vs Thread", premium: false, estMinutes: 6,
    content: `A **process** is an instance of a running program with its own address space, file descriptors, and resources. The OS isolates processes via virtual memory — a fault in one process can't directly corrupt another.

A **thread** is a unit of execution inside a process. Threads in the same process share the heap, globals, file descriptors. They have their own stack and registers. Cheaper to create. Easier to share data. Easier to corrupt that shared data.

**Interview takeaways**:
- Context switch between threads is cheaper than between processes (no TLB flush, same address space).
- A crashing thread crashes the whole process (in most runtimes). A crashing process leaves others intact.
- Concurrency primitives — mutexes, condition variables, atomics — exist because shared memory makes lock-free reasoning hard.

When to pick which: use processes for isolation/fault containment (browsers per-tab, OS daemons). Use threads for shared-memory parallelism inside one logical unit (web server worker pool, game engines).` },

  { slug: "os-deadlock", subject: Subject.OS, title: "Deadlock — 4 Coffman conditions", premium: false, estMinutes: 5,
    content: `Deadlock requires ALL four:
1. **Mutual exclusion** — at least one resource is non-shareable.
2. **Hold and wait** — a process holds resources while waiting for more.
3. **No preemption** — a held resource can't be forcibly taken.
4. **Circular wait** — a cycle in the wait-for graph.

Break any one and deadlock can't occur.

**Strategies**:
- *Prevention*: enforce ordering on resource acquisition (kills circular wait).
- *Avoidance*: Banker's algorithm — only grant if the resulting state is safe.
- *Detection + recovery*: build wait-for graph periodically, kill the lightest victim.
- *Ostrich*: ignore. Most desktop OSes do this for low-probability cases.

**Live example**: two threads each lock A then B vs B then A. Easiest fix: always lock in a global order.` },

  { slug: "dbms-acid", subject: Subject.DBMS, title: "ACID properties", premium: true, estMinutes: 7,
    content: `**A**tomicity, **C**onsistency, **I**solation, **D**urability. The four guarantees a transactional database makes.

- **Atomic**: all-or-nothing. Either every write in the transaction commits, or none do.
- **Consistent**: transactions move the DB from one valid state to another (constraints hold pre and post).
- **Isolated**: concurrent transactions don't see each other's intermediate state. Isolation levels (read uncommitted → serializable) trade off concurrency vs safety.
- **Durable**: once COMMIT returns, data survives crashes (typically via WAL fsync).

**Interview trap**: NoSQL stores like Cassandra are "AP" in CAP, meaning they sacrifice strict consistency for availability and partition tolerance — but ACID and CAP are different axes. Newer NoSQL (CockroachDB, Spanner) get ACID + horizontal scale via consensus.` },

  { slug: "cn-tcp-vs-udp", subject: Subject.CN, title: "TCP vs UDP", premium: true, estMinutes: 5,
    content: `**TCP** — connection-oriented, reliable, in-order, congestion-controlled. Three-way handshake. Use for HTTP, SSH, DB connections.

**UDP** — connectionless, no delivery guarantee, no ordering, no congestion control. Use for DNS, video conferencing, gaming — anything where retransmitting late data is worse than dropping it.

QUIC/HTTP3 is built on UDP because head-of-line blocking in TCP hurts multi-stream protocols. TCP can't ship stream B until stream A's lost packet retransmits.` },

  { slug: "oop-solid", subject: Subject.OOP, title: "SOLID principles", premium: true, estMinutes: 8,
    content: `**S**ingle responsibility, **O**pen/closed, **L**iskov substitution, **I**nterface segregation, **D**ependency inversion.

- *SRP*: a class should have one reason to change. Don't make a User class also do email sending.
- *OCP*: open for extension, closed for modification. Use polymorphism / strategy.
- *LSP*: subtypes must be substitutable. A Square-extends-Rectangle that breaks setWidth is the canonical violation.
- *ISP*: prefer many small interfaces over one fat one. Clients shouldn't depend on methods they don't use.
- *DIP*: depend on abstractions, not concretions. Inject the dependency.

These are guidelines, not laws. Over-applied, SRP gives you 300 one-line classes and DIP gives you interfaces with one implementation.` },
];

// ── Flashcards ──────────────────────────────────────────────────────
const flashcards = [
  { subject: Subject.OS,   topic: "scheduling", front: "What does FCFS stand for and what's its main downside?", back: "First-Come-First-Served — suffers from convoy effect: long CPU-bound jobs delay short ones.", difficulty: Difficulty.EASY },
  { subject: Subject.OS,   topic: "memory",     front: "What is thrashing?", back: "When the OS spends more time paging than executing — usually too many active processes for available RAM.", difficulty: Difficulty.MEDIUM },
  { subject: Subject.OS,   topic: "concurrency", front: "Difference between mutex and semaphore?", back: "Mutex = mutual exclusion (binary, owned by acquirer). Semaphore = counting signal (no ownership, multiple slots).", difficulty: Difficulty.MEDIUM },
  { subject: Subject.DBMS, topic: "normalization", front: "What does 3NF require?", back: "2NF (no partial dep on composite key) + no transitive dependency: non-key attributes depend only on the primary key.", difficulty: Difficulty.MEDIUM },
  { subject: Subject.DBMS, topic: "indexing",  front: "Why does an index slow down writes?", back: "Every insert/update/delete must also update each index's B-tree / hash structure.", difficulty: Difficulty.EASY },
  { subject: Subject.DBMS, topic: "transactions", front: "What's a phantom read?", back: "A range query returns different rows in the same transaction because another tx inserted matching rows. Prevented by serializable isolation.", difficulty: Difficulty.HARD },
  { subject: Subject.CN,   topic: "osi",        front: "Which OSI layer does TLS sit in?", back: "Presentation (technically between Application and Transport — but conventionally Presentation layer 6).", difficulty: Difficulty.MEDIUM },
  { subject: Subject.CN,   topic: "tcp",        front: "What does Nagle's algorithm do?", back: "Coalesces small TCP segments to reduce header overhead — delay-trade-off, often disabled for low-latency apps.", difficulty: Difficulty.HARD },
  { subject: Subject.OOP,  topic: "inheritance", front: "Composition vs inheritance — when to prefer which?", back: "Prefer composition by default (HAS-A is more flexible). Inherit only when there's a true IS-A and you need polymorphic substitution.", difficulty: Difficulty.MEDIUM },
  { subject: Subject.OOP,  topic: "abstraction", front: "Difference between abstract class and interface (Java)?", back: "Abstract class can have state + implementation; single-inheritance. Interface declares contract; multiple-implementation; default methods in 8+ but no instance state.", difficulty: Difficulty.MEDIUM },
];

// ── Badges ──────────────────────────────────────────────────────────
const badges = [
  { slug: "first-blood",    name: "First Blood",      description: "Solved your first problem.",            tier: BadgeTier.BRONZE,   icon: "zap",     xpReward: 25 },
  { slug: "ten-solved",     name: "Ten Solved",       description: "Solved 10 problems.",                   tier: BadgeTier.BRONZE,   icon: "trophy",  xpReward: 50 },
  { slug: "fifty-solved",   name: "Half Century",     description: "Solved 50 problems.",                   tier: BadgeTier.SILVER,   icon: "trophy",  xpReward: 100 },
  { slug: "century",        name: "Century",          description: "Solved 100 problems.",                  tier: BadgeTier.GOLD,     icon: "crown",   xpReward: 250 },
  { slug: "first-hard",     name: "First Hard",       description: "Solved your first Hard problem.",       tier: BadgeTier.BRONZE,   icon: "flame",   xpReward: 75 },
  { slug: "hard-hitter",    name: "Hard Hitter",      description: "Solved 10 Hard problems.",              tier: BadgeTier.GOLD,     icon: "flame",   xpReward: 200 },
  { slug: "week-warrior",   name: "Week Warrior",     description: "7-day solving streak.",                 tier: BadgeTier.SILVER,   icon: "fire",    xpReward: 100 },
  { slug: "month-monk",     name: "Month Monk",       description: "30-day solving streak.",                tier: BadgeTier.PLATINUM, icon: "fire",    xpReward: 500 },
];

// ── Project ideas ───────────────────────────────────────────────────
const projects = [
  { slug: "url-shortener",   title: "URL Shortener with Analytics",  description: "Build a Bitly-style shortener. Custom slugs, click analytics, expiry.", techStack: ["Next.js","Postgres","Redis"],  difficulty: Difficulty.MEDIUM, weeks: 3, tags: ["fullstack","backend"], outcomes: ["REST API","caching","analytics aggregation"] },
  { slug: "kanban-app",      title: "Kanban Board",                  description: "Drag-drop board with realtime sync, multiple boards, comments.", techStack: ["React","Node","Socket.io","Postgres"], difficulty: Difficulty.MEDIUM, weeks: 4, tags: ["fullstack","realtime"], outcomes: ["WebSockets","DnD UX","auth"] },
  { slug: "expense-tracker", title: "Expense Tracker with Charts",   description: "Track income/expenses by category. Monthly trend charts. CSV export.", techStack: ["Next.js","Prisma","Recharts"], difficulty: Difficulty.EASY,   weeks: 2, tags: ["fullstack"], outcomes: ["forms","charts","export"] },
  { slug: "study-buddy-bot", title: "Telegram Study Buddy Bot",      description: "Bot that sends spaced-repetition flashcards on Telegram. /add /due /stats.", techStack: ["Node","Telegraf","SQLite"], difficulty: Difficulty.MEDIUM, weeks: 2, tags: ["bot","backend"], outcomes: ["webhooks","cron jobs","SRS"] },
  { slug: "code-review-cli", title: "Code Review CLI w/ LLM",        description: "CLI that diffs your branch vs main and posts AI review comments inline.", techStack: ["Node","Anthropic SDK"], difficulty: Difficulty.HARD, weeks: 4, tags: ["llm","cli"], outcomes: ["prompt engineering","git plumbing","CLI UX"], premium: true },
  { slug: "rate-limiter",    title: "Distributed Rate Limiter",      description: "Token-bucket rate limiter as a middleware lib. Redis-backed.", techStack: ["Node","Redis"], difficulty: Difficulty.HARD, weeks: 3, tags: ["systems","backend"], outcomes: ["concurrency","Lua scripts"], premium: true },
  { slug: "personal-finance-dashboard", title: "Personal Finance Dashboard", description: "Plaid integration + budgets + monthly reports.", techStack: ["Next.js","Plaid","Postgres"], difficulty: Difficulty.HARD, weeks: 6, tags: ["fintech"], outcomes: ["3rd-party API","data normalization"] },
  { slug: "weather-mobile",  title: "Weather App (React Native)",    description: "Native iOS/Android weather app with location, offline cache, widgets.", techStack: ["React Native","Expo"], difficulty: Difficulty.EASY, weeks: 2, tags: ["mobile"], outcomes: ["RN basics","permissions","offline"] },
];

// ── Jobs ────────────────────────────────────────────────────────────
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);
const jobs = [
  { slug: "flipkart-sde1-blr",  company: "Flipkart",   title: "SDE 1",                   role: JobRole.SDE,      location: "Bangalore", remote: false, salaryMinInr: 1_800_000, salaryMaxInr: 2_400_000, experienceMin: 0, description: "Join Flipkart's payments team. Build at India scale.", applyUrl: "https://flipkartcareers.com/sde1", closesAt: daysFromNow(2) },
  { slug: "razorpay-backend-blr", company: "Razorpay", title: "Backend Engineer",        role: JobRole.BACKEND,  location: "Bangalore", remote: true,  salaryMinInr: 2_000_000, salaryMaxInr: 3_500_000, experienceMin: 1, description: "Build the payments rails for India.", applyUrl: "https://razorpay.com/jobs/backend", closesAt: daysFromNow(5) },
  { slug: "zomato-frontend",    company: "Zomato",     title: "Frontend Engineer",       role: JobRole.FRONTEND, location: "Gurugram",  remote: false, salaryMinInr: 1_600_000, salaryMaxInr: 2_800_000, experienceMin: 1, description: "Build the Zomato app and web experiences.", applyUrl: "https://zomato.com/careers", closesAt: daysFromNow(9) },
  { slug: "swiggy-ml",          company: "Swiggy",     title: "ML Engineer",             role: JobRole.ML,       location: "Bangalore", remote: false, salaryMinInr: 2_500_000, salaryMaxInr: 4_500_000, experienceMin: 2, description: "ETA, ranking, and dispatch models.", applyUrl: "https://swiggy.com/careers/ml", closesAt: daysFromNow(14) },
  { slug: "phonepe-android",    company: "PhonePe",    title: "Android Engineer",        role: JobRole.ANDROID,  location: "Bangalore", remote: false, salaryMinInr: 1_800_000, salaryMaxInr: 3_200_000, experienceMin: 1, description: "Build for 400M users on Android.", applyUrl: "https://phonepe.com/careers", closesAt: daysFromNow(7) },
  { slug: "cred-fullstack-rem", company: "CRED",       title: "Full-stack Engineer",     role: JobRole.FULLSTACK,location: "Remote",    remote: true,  salaryMinInr: 2_200_000, salaryMaxInr: 3_800_000, experienceMin: 1, description: "Ship across web + backend. Strong design culture.", applyUrl: "https://cred.club/careers", closesAt: daysFromNow(3) },
  { slug: "groww-data-eng",     company: "Groww",      title: "Data Engineer",           role: JobRole.DATA,     location: "Bangalore", remote: false, salaryMinInr: 1_800_000, salaryMaxInr: 3_000_000, experienceMin: 1, description: "Pipelines for retail investing.", applyUrl: "https://groww.in/careers" },
  { slug: "amazon-sde1-hyd",    company: "Amazon",     title: "SDE I",                   role: JobRole.SDE,      location: "Hyderabad", remote: false, salaryMinInr: 3_200_000, salaryMaxInr: 4_500_000, experienceMin: 0, description: "Various teams hiring SDE I (campus).", applyUrl: "https://amazon.jobs/in" },
];

async function main() {
  console.log("Seeding dev users…");
  for (const u of devUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role },
      create: {
        clerkId: u.clerkId, email: u.email, name: u.name, role: u.role,
        emailVerifiedAt: new Date(),
        profile: { create: { preferredLanguage: Language.CPP } },
        subscription: { create: { plan: u.plan } },
      },
    });
  }

  console.log(`Seeding ${problems.length} problems…`);
  for (const p of problems) {
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: { title: p.title, description: p.description, difficulty: p.difficulty, topics: p.topics, patterns: p.patterns, companies: p.companies, premium: p.premium ?? false },
      create: {
        slug: p.slug, title: p.title, description: p.description, difficulty: p.difficulty,
        topics: p.topics, patterns: p.patterns, companies: p.companies, premium: p.premium ?? false,
        testCases: { create: p.examples.map((ex, i) => ({ input: ex.input, expected: ex.expected, isPublic: true, orderIndex: i })) },
        starterCode: { create: STARTERS },
      },
    });
  }

  console.log(`Seeding ${notes.length} theory notes…`);
  for (const [i, n] of notes.entries()) {
    await prisma.theoryNote.upsert({
      where: { slug: n.slug },
      update: { title: n.title, content: n.content, premium: n.premium, estMinutes: n.estMinutes, subject: n.subject, orderIndex: i },
      create: { ...n, orderIndex: i },
    });
  }

  console.log(`Seeding ${flashcards.length} flashcards…`);
  for (const f of flashcards) {
    // No natural unique — use front+subject as a coarse upsert key.
    const existing = await prisma.flashcard.findFirst({ where: { subject: f.subject, front: f.front } });
    if (existing) {
      await prisma.flashcard.update({ where: { id: existing.id }, data: f });
    } else {
      await prisma.flashcard.create({ data: f });
    }
  }

  console.log(`Seeding ${badges.length} badges…`);
  for (const b of badges) {
    await prisma.badge.upsert({ where: { slug: b.slug }, update: b, create: b });
  }

  console.log(`Seeding ${projects.length} project ideas…`);
  for (const p of projects) {
    await prisma.projectIdea.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  console.log(`Seeding ${jobs.length} jobs…`);
  for (const j of jobs) {
    await prisma.job.upsert({ where: { slug: j.slug }, update: j, create: j });
  }

  console.log(`Seeding ${tracks.length} career tracks…`);
  for (const t of tracks) {
    await prisma.careerTrack.upsert({ where: { slug: t.slug }, update: t, create: t });
  }

  console.log(`Seeding ${internships.length} internships…`);
  for (const i of internships) {
    await prisma.internship.upsert({ where: { slug: i.slug }, update: i, create: i });
  }

  console.log("Done.");
}

// ── Career Tracks (12 roles per spec §5A) ───────────────────────────
const tracks = [
  { slug: "sde-product",      name: "Product SDE",        tagline: "Build core products at FAANG/unicorn scale.",       icon: "rocket",  salaryMinInr: 2_500_000, salaryMaxInr: 5_500_000, demand: DemandLevel.VERY_HIGH, weeks: 16, patterns: ["hash-map","two-pointers","sliding-window","dp","graph"], topics: ["arrays","trees","dp","system-design"], companies: ["Amazon","Google","Meta","Flipkart","Razorpay"], premium: false, description: "The product-engineering track. Heavy DSA, system design, behavioral.", curriculum: [{week: 1, focus: "Arrays + hashing"},{week: 2, focus: "Two pointers + sliding window"},{week: 3, focus: "Trees + BFS/DFS"},{week: 4, focus: "DP foundations"}] },
  { slug: "sde-service",      name: "Service SDE",        tagline: "TCS, Infosys, Wipro — high-volume hiring.",         icon: "briefcase", salaryMinInr: 350_000,  salaryMaxInr: 800_000,   demand: DemandLevel.VERY_HIGH, weeks: 8,  patterns: ["arrays","hash-map","greedy"],                            topics: ["arrays","strings","oop","dbms"],          companies: ["TCS","Infosys","Wipro","Cognizant","Accenture"], premium: false, description: "Volume hiring focus. Aptitude-heavy, easy DSA, communication.", curriculum: [{week: 1, focus: "Aptitude + verbal"},{week: 2, focus: "Easy DSA"}] },
  { slug: "fullstack",        name: "Full-Stack",         tagline: "Ship features end-to-end at fast-moving startups.", icon: "layers",  salaryMinInr: 1_500_000, salaryMaxInr: 3_500_000, demand: DemandLevel.HIGH,      weeks: 12, patterns: ["api-design","auth","cache"],                            topics: ["react","node","postgres","dbms"],         companies: ["CRED","Razorpay","Swiggy","Groww","Postman"], premium: false, description: "JS-heavy. Shipping cadence > pure DSA. Build, deploy, iterate.", curriculum: [{week: 1, focus: "REST + auth"},{week: 2, focus: "Postgres + Prisma"}] },
  { slug: "backend",          name: "Backend",            tagline: "Distributed systems + APIs + data modeling.",       icon: "server",  salaryMinInr: 1_800_000, salaryMaxInr: 4_500_000, demand: DemandLevel.HIGH,      weeks: 14, patterns: ["graph","dp","heap","string"],                            topics: ["dbms","cn","system-design","concurrency"], companies: ["Razorpay","PhonePe","Swiggy","Atlassian"], premium: false, description: "Backend specialization — queues, caches, replication, scaling.", curriculum: [{week: 1, focus: "Postgres internals"},{week: 2, focus: "Redis + queues"}] },
  { slug: "frontend",         name: "Frontend",           tagline: "Beautiful, accessible, performant web UIs.",        icon: "monitor", salaryMinInr: 1_600_000, salaryMaxInr: 3_500_000, demand: DemandLevel.HIGH,      weeks: 12, patterns: ["dom","state-management"],                                topics: ["react","css","accessibility","performance"], companies: ["Zomato","CRED","Razorpay"], premium: false, description: "React deep-dive, CSS mastery, a11y, perf budgets.", curriculum: [{week: 1, focus: "React fundamentals"},{week: 2, focus: "State management"}] },
  { slug: "data-engineer",    name: "Data Engineer",      tagline: "Pipelines, warehouses, ETL.",                       icon: "database", salaryMinInr: 1_800_000, salaryMaxInr: 4_000_000, demand: DemandLevel.HIGH,      weeks: 14, patterns: ["sql","graph"],                                           topics: ["sql","spark","airflow","modeling"],       companies: ["Swiggy","Groww","Razorpay","Flipkart"], premium: true, description: "Heavy SQL, modeling, distributed compute. Spark + dbt + Airflow.", curriculum: [{week: 1, focus: "Advanced SQL"},{week: 2, focus: "Data modeling"}] },
  { slug: "ml-engineer",      name: "ML Engineer",        tagline: "Production ML at India scale.",                     icon: "cpu",     salaryMinInr: 2_500_000, salaryMaxInr: 5_500_000, demand: DemandLevel.HIGH,      weeks: 16, patterns: ["statistics","probability","dp"],                         topics: ["ml","python","linear-algebra","mlops"],   companies: ["Swiggy","Flipkart","Meesho"], premium: true, description: "Real ML eng — not just notebooks. Training pipelines, online serving, drift.", curriculum: [{week: 1, focus: "Linear models"},{week: 2, focus: "Tree ensembles"}] },
  { slug: "android",          name: "Android Engineer",   tagline: "Kotlin/Jetpack — apps for 400M users.",             icon: "smartphone", salaryMinInr: 1_800_000, salaryMaxInr: 3_500_000, demand: DemandLevel.MEDIUM, weeks: 12, patterns: ["state","lifecycle"],                                     topics: ["kotlin","jetpack","compose"],             companies: ["PhonePe","Swiggy","Flipkart"], premium: false, description: "Kotlin + Compose. Memory & battery aware.", curriculum: [{week: 1, focus: "Kotlin coroutines"},{week: 2, focus: "Jetpack Compose"}] },
  { slug: "ios",              name: "iOS Engineer",       tagline: "Swift + SwiftUI for premium India apps.",           icon: "tablet",  salaryMinInr: 1_800_000, salaryMaxInr: 3_500_000, demand: DemandLevel.LOW,       weeks: 12, patterns: ["mvvm"],                                                  topics: ["swift","swiftui","combine"],              companies: ["CRED","Apple"], premium: true, description: "Swift + SwiftUI. Niche but premium roles.", curriculum: [{week: 1, focus: "Swift basics"},{week: 2, focus: "SwiftUI"}] },
  { slug: "devops-sre",       name: "DevOps / SRE",       tagline: "Reliability, infra-as-code, observability.",        icon: "settings", salaryMinInr: 1_800_000, salaryMaxInr: 4_000_000, demand: DemandLevel.MEDIUM,    weeks: 14, patterns: ["yaml","scripting"],                                      topics: ["kubernetes","aws","terraform","linux"],   companies: ["Razorpay","Postman","Atlassian"], premium: true, description: "K8s, CI/CD, monitoring. SLOs + error budgets.", curriculum: [{week: 1, focus: "Linux + bash"},{week: 2, focus: "Containers + K8s"}] },
  { slug: "security",         name: "Security",           tagline: "AppSec, infra security, red-team.",                 icon: "shield",  salaryMinInr: 2_000_000, salaryMaxInr: 4_500_000, demand: DemandLevel.MEDIUM,    weeks: 14, patterns: ["pentesting"],                                            topics: ["owasp","cryptography","network"],         companies: ["Razorpay","PhonePe","Microsoft"], premium: true, description: "AppSec deep. OWASP top 10, threat modeling.", curriculum: [{week: 1, focus: "OWASP top 10"},{week: 2, focus: "Auth + crypto"}] },
  { slug: "qa-sdet",          name: "QA / SDET",          tagline: "Test infra + automation at scale.",                 icon: "check-circle", salaryMinInr: 800_000, salaryMaxInr: 2_500_000, demand: DemandLevel.MEDIUM, weeks: 10, patterns: ["test-design"],                                           topics: ["selenium","cypress","testing-frameworks"], companies: ["TCS","Infosys","Flipkart"], premium: false, description: "Automation-first QA. Selenium/Cypress + CI integration.", curriculum: [{week: 1, focus: "Test fundamentals"},{week: 2, focus: "Automation tools"}] },
];

// ── Internships (Indian campus PPO funnel) ─────────────────────────
const internships = [
  { slug: "flipkart-runway-2026",   company: "Flipkart",     role: "SDE Intern",          duration: InternshipDuration.MONTHS_2, stipendInr: 80_000,  location: "Bangalore", remote: false, description: "Flipkart Runway program — 2-month summer intern for pre-final year. Strong PPO funnel.", applyUrl: "https://flipkartcareers.com/runway", eligibility: "Pre-final year, CGPA 7+, all branches.", ppoConversion: 0.85 },
  { slug: "razorpay-intern-2026",   company: "Razorpay",     role: "Backend Intern",      duration: InternshipDuration.MONTHS_6, stipendInr: 50_000,  location: "Bangalore", remote: true,  description: "Build payment rails. Real production code.",                                          applyUrl: "https://razorpay.com/jobs/intern", eligibility: "Pre-final year, CS/IT, strong DSA.", ppoConversion: 0.7 },
  { slug: "amazon-summer-intern",   company: "Amazon",       role: "SDE Intern",          duration: InternshipDuration.MONTHS_2, stipendInr: 110_000, location: "Hyderabad", remote: false, description: "Amazon's pre-final summer SDE intern. FANG-style interview process.",                  applyUrl: "https://amazon.jobs/in/sde-intern", eligibility: "Pre-final, top colleges preferred but all welcome.", ppoConversion: 0.6 },
  { slug: "swiggy-summer-intern",   company: "Swiggy",       role: "Full-Stack Intern",   duration: InternshipDuration.MONTHS_2, stipendInr: 60_000,  location: "Bangalore", remote: false, description: "Ship features on the consumer app. Mentor pairing.",                                  applyUrl: "https://swiggy.com/careers", eligibility: "Pre-final year, JS familiarity.", ppoConversion: 0.55 },
  { slug: "google-stp-india",       company: "Google",       role: "STEP Intern",         duration: InternshipDuration.MONTHS_3, stipendInr: 150_000, location: "Bangalore", remote: false, description: "STEP — Student Training in Engineering Program. 1st/2nd year focused.",              applyUrl: "https://buildyourfuture.withgoogle.com/programs/step", eligibility: "1st/2nd year only.", ppoConversion: null },
  { slug: "groww-frontend-intern",  company: "Groww",        role: "Frontend Intern",     duration: InternshipDuration.MONTHS_6, stipendInr: 40_000,  location: "Bangalore", remote: true,  description: "React + design systems. Ship to millions of retail investors.",                        applyUrl: "https://groww.in/careers", eligibility: "Pre-final, React experience.", ppoConversion: 0.65 },
];


main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
