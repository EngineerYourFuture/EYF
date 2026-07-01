/**
 * MCQ test bank — timed, sectioned multiple-choice practice.
 *
 * Mirrors the pattern of assessment-bank.ts: content is editorial and stateless;
 * only user *attempts* are persisted (see McqAttempt in schema.prisma). Migrate
 * to a table when the CONTENT_CREATOR role starts authoring at scale.
 *
 * Sections map to the McqCategory enum. `companies` optionally tags a question
 * to a recruiter's known pattern (TCS NQT, Infosys, Amazon OA, …) so learners
 * can drill "Am I ready for <company>?" the way prachub / ipugotplaced organise.
 */

export type McqCategory = "APTITUDE" | "LOGICAL" | "VERBAL" | "TECHNICAL";
export type McqDifficulty = "easy" | "medium" | "hard";

export type McqQuestion = {
  id: string;
  category: McqCategory;
  topic: string;
  difficulty: McqDifficulty;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  /** Companies known to test this pattern. Empty = general. */
  companies: string[];
};

// ─── Aptitude (quant / DI) ────────────────────────────────────────
const APTITUDE: McqQuestion[] = [
  { id: "apt-1", category: "APTITUDE", topic: "percentages", difficulty: "easy",
    prompt: "A shirt marked ₹1200 is sold at a 25% discount. Selling price?",
    choices: ["₹800", "₹900", "₹950", "₹1000"], correctIndex: 1,
    explanation: "25% of 1200 = 300; 1200 − 300 = ₹900.", companies: ["TCS", "Infosys", "Wipro"] },
  { id: "apt-2", category: "APTITUDE", topic: "time-speed-distance", difficulty: "medium",
    prompt: "A train 120 m long passes a pole in 6 s. Its speed is:",
    choices: ["60 km/h", "72 km/h", "80 km/h", "90 km/h"], correctIndex: 1,
    explanation: "Speed = 120/6 = 20 m/s = 20 × 3.6 = 72 km/h.", companies: ["TCS", "Cognizant"] },
  { id: "apt-3", category: "APTITUDE", topic: "ratio", difficulty: "easy",
    prompt: "If a : b = 2 : 3 and b : c = 4 : 5, then a : c =",
    choices: ["8 : 15", "2 : 5", "8 : 5", "3 : 5"], correctIndex: 0,
    explanation: "a:b:c = 8:12:15, so a:c = 8:15.", companies: ["Infosys", "Accenture"] },
  { id: "apt-4", category: "APTITUDE", topic: "profit-loss", difficulty: "medium",
    prompt: "An item bought for ₹500 is sold for ₹575. Profit percentage?",
    choices: ["10%", "12.5%", "15%", "20%"], correctIndex: 2,
    explanation: "Profit = 75; 75/500 × 100 = 15%.", companies: ["Wipro", "TCS"] },
  { id: "apt-5", category: "APTITUDE", topic: "averages", difficulty: "easy",
    prompt: "Average of 5 consecutive integers is 21. The largest is:",
    choices: ["21", "22", "23", "25"], correctIndex: 2,
    explanation: "Middle term = average = 21, so numbers are 19–23; largest = 23.", companies: ["Cognizant"] },
  { id: "apt-6", category: "APTITUDE", topic: "time-work", difficulty: "medium",
    prompt: "A does a job in 12 days, B in 6 days. Together they finish in:",
    choices: ["3 days", "4 days", "5 days", "9 days"], correctIndex: 1,
    explanation: "Rate = 1/12 + 1/6 = 3/12 = 1/4 → 4 days.", companies: ["Infosys", "Capgemini"] },
  { id: "apt-7", category: "APTITUDE", topic: "percentages", difficulty: "medium",
    prompt: "A number increased by 20% then decreased by 20% gives 96. Original number?",
    choices: ["100", "96", "104", "120"], correctIndex: 0,
    explanation: "x × 1.2 × 0.8 = 0.96x = 96 → x = 100.", companies: ["Amazon", "TCS"] },
  { id: "apt-8", category: "APTITUDE", topic: "probability", difficulty: "medium",
    prompt: "Two dice are rolled. Probability the sum is 7?",
    choices: ["1/6", "1/9", "5/36", "1/12"], correctIndex: 0,
    explanation: "6 favourable outcomes / 36 = 1/6.", companies: ["Amazon", "Goldman Sachs"] },
  { id: "apt-9", category: "APTITUDE", topic: "simple-interest", difficulty: "easy",
    prompt: "SI on ₹2000 at 5% p.a. for 3 years?",
    choices: ["₹250", "₹300", "₹350", "₹400"], correctIndex: 1,
    explanation: "SI = PRT/100 = 2000×5×3/100 = ₹300.", companies: ["Infosys", "Wipro"] },
  { id: "apt-10", category: "APTITUDE", topic: "permutation", difficulty: "hard",
    prompt: "In how many ways can the letters of 'LEVEL' be arranged?",
    choices: ["30", "60", "120", "20"], correctIndex: 0,
    explanation: "5!/(2!·2!) = 120/4 = 30 (two L's, two E's).", companies: ["Amazon", "Microsoft"] },
  { id: "apt-11", category: "APTITUDE", topic: "data-interpretation", difficulty: "medium",
    prompt: "Sales: Q1=200, Q2=250, Q3=300, Q4=250. Q3 as % of total?",
    choices: ["25%", "30%", "33.3%", "28%"], correctIndex: 1,
    explanation: "Total = 1000; 300/1000 = 30%.", companies: ["Deloitte", "Accenture"] },
  { id: "apt-12", category: "APTITUDE", topic: "ages", difficulty: "medium",
    prompt: "A is twice as old as B. 10 years ago A was thrice B. B's present age?",
    choices: ["15", "20", "25", "30"], correctIndex: 1,
    explanation: "A=2B; 2B−10 = 3(B−10) → B = 20.", companies: ["TCS", "Cognizant"] },
  { id: "apt-13", category: "APTITUDE", topic: "number-system", difficulty: "hard",
    prompt: "The remainder when 7^100 is divided by 5 is:",
    choices: ["1", "2", "3", "4"], correctIndex: 0,
    explanation: "7 ≡ 2 (mod 5); 2^100 cycles every 4 → 2^100 ≡ (2^4)^25 ≡ 1.", companies: ["Amazon", "Microsoft"] },
  { id: "apt-14", category: "APTITUDE", topic: "mixtures", difficulty: "hard",
    prompt: "How much water added to 60 L of 40% acid to make it 30% acid?",
    choices: ["10 L", "15 L", "20 L", "25 L"], correctIndex: 2,
    explanation: "Acid = 24 L fixed; 24/(60+x)=0.3 → x = 20 L.", companies: ["Cognizant"] },
  { id: "apt-15", category: "APTITUDE", topic: "percentages", difficulty: "easy",
    prompt: "What is 15% of 15% of 2000?",
    choices: ["30", "45", "60", "225"], correctIndex: 1,
    explanation: "0.15 × 0.15 × 2000 = 45.", companies: ["Infosys"] },
];

// ─── Logical reasoning ────────────────────────────────────────────
const LOGICAL: McqQuestion[] = [
  { id: "log-1", category: "LOGICAL", topic: "series", difficulty: "easy",
    prompt: "Find the next term: 2, 6, 12, 20, 30, ?",
    choices: ["36", "40", "42", "44"], correctIndex: 2,
    explanation: "Differences 4,6,8,10,12 → 30+12 = 42.", companies: ["TCS", "Wipro"] },
  { id: "log-2", category: "LOGICAL", topic: "coding-decoding", difficulty: "medium",
    prompt: "If CAT = 24, DOG = 26, then LION = ?",
    choices: ["50", "45", "46", "48"], correctIndex: 0,
    explanation: "Sum of letter positions: L12+I9+O15+N14 = 50.", companies: ["Infosys", "Cognizant"] },
  { id: "log-3", category: "LOGICAL", topic: "blood-relations", difficulty: "medium",
    prompt: "Pointing to a man, Neha said 'His mother is the only daughter of my mother.' How is the man related to Neha?",
    choices: ["Son", "Brother", "Uncle", "Father"], correctIndex: 0,
    explanation: "Only daughter of Neha's mother = Neha herself; so the man is Neha's son.", companies: ["TCS", "Accenture"] },
  { id: "log-4", category: "LOGICAL", topic: "series", difficulty: "medium",
    prompt: "Odd one out: 3, 5, 11, 14, 17, 21",
    choices: ["11", "14", "17", "21"], correctIndex: 1,
    explanation: "All others are odd; 14 is even.", companies: ["Wipro"] },
  { id: "log-5", category: "LOGICAL", topic: "syllogism", difficulty: "hard",
    prompt: "All cats are animals. Some animals are wild. Which follows?",
    choices: ["All cats are wild", "Some cats are wild", "No cats are wild", "None necessarily follows"], correctIndex: 3,
    explanation: "Overlap of 'some animals wild' need not include cats — nothing definite follows.", companies: ["Infosys", "TCS"] },
  { id: "log-6", category: "LOGICAL", topic: "direction", difficulty: "medium",
    prompt: "A man walks 5 km North, turns right and walks 3 km, turns right and walks 5 km. How far is he from start?",
    choices: ["3 km", "5 km", "8 km", "13 km"], correctIndex: 0,
    explanation: "North then East then South cancels the North; net = 3 km East.", companies: ["Cognizant", "Capgemini"] },
  { id: "log-7", category: "LOGICAL", topic: "series", difficulty: "easy",
    prompt: "Complete: AZ, BY, CX, ?",
    choices: ["DV", "DW", "EW", "DU"], correctIndex: 1,
    explanation: "First letter +1, second letter −1 → D, W.", companies: ["TCS"] },
  { id: "log-8", category: "LOGICAL", topic: "puzzle", difficulty: "hard",
    prompt: "If in a code TEACHER is written as VGCEJGT, how is CHILD written?",
    choices: ["EJKNF", "EJKNE", "DJKNF", "EJLNF"], correctIndex: 0,
    explanation: "Each letter shifted +2: C→E, H→J, I→K, L→N, D→F.", companies: ["Infosys", "Amazon"] },
  { id: "log-9", category: "LOGICAL", topic: "clocks", difficulty: "hard",
    prompt: "The angle between the hour and minute hands at 3:15 is:",
    choices: ["0°", "7.5°", "15°", "30°"], correctIndex: 1,
    explanation: "Minute at 90°; hour at 3×30 + 15×0.5 = 97.5°; diff = 7.5°.", companies: ["Amazon", "Microsoft"] },
  { id: "log-10", category: "LOGICAL", topic: "series", difficulty: "medium",
    prompt: "Next number: 1, 1, 2, 3, 5, 8, ?",
    choices: ["11", "12", "13", "15"], correctIndex: 2,
    explanation: "Fibonacci: 5+8 = 13.", companies: ["TCS", "Amazon"] },
  { id: "log-11", category: "LOGICAL", topic: "seating", difficulty: "hard",
    prompt: "Five people A–E sit in a row. A is left of B, C is right of B, D is at an end left of A. Who could be at the far right?",
    choices: ["A", "B", "C or E", "D"], correctIndex: 2,
    explanation: "Order constrained to D…A…B…C with E floating; far right is C or E.", companies: ["Deloitte"] },
  { id: "log-12", category: "LOGICAL", topic: "number-analogy", difficulty: "easy",
    prompt: "6 : 42 :: 8 : ?",
    choices: ["56", "64", "72", "48"], correctIndex: 2,
    explanation: "Pattern is n² + n: 6²+6 = 42, so 8²+8 = 72.", companies: ["Wipro"] },
];

// ─── Verbal ability ───────────────────────────────────────────────
const VERBAL: McqQuestion[] = [
  { id: "vrb-1", category: "VERBAL", topic: "synonym", difficulty: "easy",
    prompt: "Choose the synonym of 'ABUNDANT':",
    choices: ["Scarce", "Plentiful", "Rare", "Empty"], correctIndex: 1,
    explanation: "Abundant means existing in large quantity = plentiful.", companies: ["TCS", "Infosys"] },
  { id: "vrb-2", category: "VERBAL", topic: "antonym", difficulty: "easy",
    prompt: "Choose the antonym of 'BENEVOLENT':",
    choices: ["Kind", "Generous", "Malevolent", "Gentle"], correctIndex: 2,
    explanation: "Benevolent = well-meaning; its opposite is malevolent.", companies: ["Wipro"] },
  { id: "vrb-3", category: "VERBAL", topic: "grammar", difficulty: "medium",
    prompt: "Choose the correct sentence:",
    choices: ["Each of the boys have a book.", "Each of the boys has a book.", "Each of the boys are having book.", "Each of the boy have books."], correctIndex: 1,
    explanation: "'Each' is singular → takes 'has'.", companies: ["TCS", "Cognizant"] },
  { id: "vrb-4", category: "VERBAL", topic: "error-spotting", difficulty: "medium",
    prompt: "Spot the error: 'He is one of the best player / in the team / this year.' (no error = last)",
    choices: ["He is one of the best player", "in the team", "this year", "No error"], correctIndex: 0,
    explanation: "'One of the best players' — noun after superlative + 'one of' is plural.", companies: ["Infosys", "Accenture"] },
  { id: "vrb-5", category: "VERBAL", topic: "preposition", difficulty: "easy",
    prompt: "She is good ___ mathematics.",
    choices: ["in", "at", "on", "with"], correctIndex: 1,
    explanation: "'Good at' a subject/skill is the correct collocation.", companies: ["Wipro", "Capgemini"] },
  { id: "vrb-6", category: "VERBAL", topic: "para-jumble", difficulty: "hard",
    prompt: "Arrange: (P) it began to rain (Q) we were playing (R) so we ran inside (S) suddenly.",
    choices: ["QSPR", "QPSR", "PQRS", "SQPR"], correctIndex: 0,
    explanation: "We were playing → suddenly → it began to rain → so we ran inside = QSPR.", companies: ["TCS"] },
  { id: "vrb-7", category: "VERBAL", topic: "fill-blank", difficulty: "medium",
    prompt: "The scientist's theory was so ___ that few could refute it.",
    choices: ["flimsy", "cogent", "vague", "trivial"], correctIndex: 1,
    explanation: "'Cogent' = clear and convincing; fits 'few could refute'.", companies: ["Amazon", "Infosys"] },
  { id: "vrb-8", category: "VERBAL", topic: "idiom", difficulty: "medium",
    prompt: "'To beat around the bush' means:",
    choices: ["To work hard", "To avoid the main point", "To win easily", "To garden"], correctIndex: 1,
    explanation: "The idiom means to avoid coming to the point.", companies: ["Cognizant"] },
  { id: "vrb-9", category: "VERBAL", topic: "grammar", difficulty: "medium",
    prompt: "Neither the manager nor the employees ___ present.",
    choices: ["was", "were", "is", "has been"], correctIndex: 1,
    explanation: "With 'neither…nor', the verb agrees with the nearer subject 'employees' → 'were'.", companies: ["TCS", "Wipro"] },
  { id: "vrb-10", category: "VERBAL", topic: "synonym", difficulty: "hard",
    prompt: "Choose the synonym of 'PRAGMATIC':",
    choices: ["Idealistic", "Practical", "Emotional", "Stubborn"], correctIndex: 1,
    explanation: "Pragmatic = dealing with things practically.", companies: ["Amazon", "Microsoft"] },
  { id: "vrb-11", category: "VERBAL", topic: "reading-comp", difficulty: "medium",
    prompt: "'The policy backfired.' Here 'backfired' most nearly means:",
    choices: ["succeeded", "produced the opposite of the intended effect", "was delayed", "was cancelled"], correctIndex: 1,
    explanation: "To backfire = to have an unexpected, unwanted, opposite result.", companies: ["Deloitte"] },
  { id: "vrb-12", category: "VERBAL", topic: "article", difficulty: "easy",
    prompt: "He is ___ honest man.",
    choices: ["a", "an", "the", "no article"], correctIndex: 1,
    explanation: "'Honest' starts with a silent 'h' (vowel sound) → 'an'.", companies: ["Infosys"] },
];

// ─── Technical (core CS theory) ───────────────────────────────────
const TECHNICAL: McqQuestion[] = [
  { id: "tec-1", category: "TECHNICAL", topic: "os", difficulty: "medium",
    prompt: "Which scheduling algorithm can cause starvation?",
    choices: ["Round Robin", "FCFS", "Priority (non-preemptive)", "None"], correctIndex: 2,
    explanation: "Low-priority processes may wait indefinitely under priority scheduling.", companies: ["Amazon", "TCS"] },
  { id: "tec-2", category: "TECHNICAL", topic: "dbms", difficulty: "medium",
    prompt: "Which normal form removes transitive dependency?",
    choices: ["1NF", "2NF", "3NF", "BCNF"], correctIndex: 2,
    explanation: "3NF eliminates transitive dependencies on the primary key.", companies: ["Infosys", "Cognizant"] },
  { id: "tec-3", category: "TECHNICAL", topic: "cn", difficulty: "easy",
    prompt: "Which layer of the OSI model does a router operate at?",
    choices: ["Data Link", "Network", "Transport", "Application"], correctIndex: 1,
    explanation: "Routers forward packets using IP at the Network layer (L3).", companies: ["Wipro", "TCS"] },
  { id: "tec-4", category: "TECHNICAL", topic: "oop", difficulty: "easy",
    prompt: "Runtime polymorphism in Java is achieved through:",
    choices: ["Method overloading", "Method overriding", "Static methods", "Final methods"], correctIndex: 1,
    explanation: "Overriding + dynamic dispatch gives runtime polymorphism; overloading is compile-time.", companies: ["TCS", "Accenture"] },
  { id: "tec-5", category: "TECHNICAL", topic: "dbms", difficulty: "medium",
    prompt: "In SQL, which clause filters groups after aggregation?",
    choices: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], correctIndex: 1,
    explanation: "HAVING filters on aggregates; WHERE filters rows before grouping.", companies: ["Amazon", "Infosys"] },
  { id: "tec-6", category: "TECHNICAL", topic: "os", difficulty: "hard",
    prompt: "Thrashing in an OS refers to:",
    choices: ["High CPU utilisation", "Excessive paging with low CPU work", "Deadlock", "Cache miss"], correctIndex: 1,
    explanation: "Thrashing = processes spend more time paging than executing.", companies: ["Microsoft", "Amazon"] },
  { id: "tec-7", category: "TECHNICAL", topic: "cn", difficulty: "medium",
    prompt: "Which protocol is connectionless?",
    choices: ["TCP", "UDP", "FTP", "HTTP"], correctIndex: 1,
    explanation: "UDP is connectionless and unreliable; TCP is connection-oriented.", companies: ["TCS", "Wipro"] },
  { id: "tec-8", category: "TECHNICAL", topic: "dsa", difficulty: "medium",
    prompt: "Worst-case time complexity of searching in a balanced BST:",
    choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correctIndex: 1,
    explanation: "Balanced BST height is O(log n).", companies: ["Amazon", "Google"] },
  { id: "tec-9", category: "TECHNICAL", topic: "oop", difficulty: "medium",
    prompt: "Which OOP principle is violated by making all fields public?",
    choices: ["Inheritance", "Abstraction", "Encapsulation", "Polymorphism"], correctIndex: 2,
    explanation: "Public fields expose internal state, breaking encapsulation.", companies: ["Cognizant"] },
  { id: "tec-10", category: "TECHNICAL", topic: "dbms", difficulty: "hard",
    prompt: "Which isolation level prevents phantom reads?",
    choices: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"], correctIndex: 3,
    explanation: "Only Serializable prevents phantom reads.", companies: ["Amazon", "Oracle"] },
  { id: "tec-11", category: "TECHNICAL", topic: "os", difficulty: "medium",
    prompt: "The four Coffman conditions are necessary for:",
    choices: ["Paging", "Deadlock", "Context switching", "Scheduling"], correctIndex: 1,
    explanation: "Mutual exclusion, hold-and-wait, no-preemption, circular-wait → deadlock.", companies: ["TCS", "Microsoft"] },
  { id: "tec-12", category: "TECHNICAL", topic: "dsa", difficulty: "easy",
    prompt: "Which data structure uses FIFO ordering?",
    choices: ["Stack", "Queue", "Tree", "Heap"], correctIndex: 1,
    explanation: "Queue is First-In-First-Out; stack is LIFO.", companies: ["Infosys", "Wipro"] },
  { id: "tec-13", category: "TECHNICAL", topic: "cn", difficulty: "hard",
    prompt: "TCP's three-way handshake sequence is:",
    choices: ["SYN → ACK → FIN", "SYN → SYN-ACK → ACK", "ACK → SYN → ACK", "SYN → FIN → ACK"], correctIndex: 1,
    explanation: "Client SYN, server SYN-ACK, client ACK.", companies: ["Amazon", "Cisco"] },
  { id: "tec-14", category: "TECHNICAL", topic: "dsa", difficulty: "medium",
    prompt: "A hash table's average lookup with a good hash function is:",
    choices: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], correctIndex: 0,
    explanation: "Amortised O(1) average with low collisions.", companies: ["Google", "Amazon"] },
];

export const MCQ_BANK: McqQuestion[] = [...APTITUDE, ...LOGICAL, ...VERBAL, ...TECHNICAL];

const BY_ID = new Map(MCQ_BANK.map((q) => [q.id, q]));
export const getMcq = (id: string): McqQuestion | undefined => BY_ID.get(id);

export const MCQ_CATEGORIES: { id: McqCategory; name: string; blurb: string; free: boolean }[] = [
  { id: "APTITUDE",  name: "Quantitative Aptitude", blurb: "Numbers, percentages, time-speed-distance, DI.", free: true },
  { id: "LOGICAL",   name: "Logical Reasoning",     blurb: "Series, coding-decoding, puzzles, directions.", free: true },
  { id: "VERBAL",    name: "Verbal Ability",        blurb: "Grammar, vocabulary, para-jumbles, RC.",       free: false },
  { id: "TECHNICAL", name: "Technical (Core CS)",   blurb: "OS, DBMS, CN, OOP, DSA theory.",               free: false },
];

/** Distinct company tags across the whole bank, sorted. */
export function mcqCompanies(): string[] {
  return [...new Set(MCQ_BANK.flatMap((q) => q.companies))].sort();
}

/** Count available questions for a category (optionally company-filtered). */
export function mcqCount(category: McqCategory, company?: string): number {
  return MCQ_BANK.filter(
    (q) => q.category === category && (!company || q.companies.includes(company)),
  ).length;
}

/**
 * Draw a shuffled test. Falls back to the full category pool if a company
 * filter yields fewer than `count` questions.
 */
export function pickTest(opts: { category: McqCategory; company?: string; count?: number }): McqQuestion[] {
  const count = opts.count ?? 10;
  let pool = MCQ_BANK.filter(
    (q) => q.category === opts.category && (!opts.company || q.companies.includes(opts.company)),
  );
  if (pool.length < count) {
    pool = MCQ_BANK.filter((q) => q.category === opts.category);
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
