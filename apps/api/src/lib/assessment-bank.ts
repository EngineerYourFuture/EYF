/**
 * Legacy assessment question bank — the fallback pool behind assessment-source.ts.
 *
 * Spec (Doc 07 §Skill Assessment): 20 questions per session — 12 DSA, 4 CS, 4 aptitude.
 * Staff-authored AssessmentBankQuestion rows win the moment they exist; this
 * hardcoded set keeps a fresh install alive and resolves legacy question ids
 * for sessions in flight across a bank→DB cutover. Selection now lives in
 * assessment-source.ts (pickQuestionsSource) — this file is data only.
 */

export type Difficulty = "easy" | "medium" | "hard";
export type Topic =
  | "arrays" | "strings" | "hash-map" | "two-pointers" | "sliding-window"
  | "linked-list" | "tree" | "graph" | "dp" | "greedy" | "sorting"
  | "os" | "dbms" | "cn" | "oop"
  | "quant" | "logic" | "verbal" | "diagram";

export type AssessmentQuestion = {
  id: string;
  topic: Topic;
  area: "dsa" | "cs" | "aptitude";
  difficulty: Difficulty;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
};

const DSA: AssessmentQuestion[] = [
  { id: "dsa-1",  topic: "arrays", area: "dsa", difficulty: "easy", prompt: "Time complexity to find max of n elements (single pass).", choices: ["O(1)","O(log n)","O(n)","O(n log n)"], correctIndex: 2 },
  { id: "dsa-2",  topic: "arrays", area: "dsa", difficulty: "easy", prompt: "Space complexity of in-place array reversal.", choices: ["O(1)","O(log n)","O(n)","O(n^2)"], correctIndex: 0 },
  { id: "dsa-3",  topic: "hash-map", area: "dsa", difficulty: "easy", prompt: "Average lookup in a hash map with good hash function.", choices: ["O(1)","O(log n)","O(n)","O(n log n)"], correctIndex: 0 },
  { id: "dsa-4",  topic: "two-pointers", area: "dsa", difficulty: "medium", prompt: "Best pattern for 'pair with sum K in sorted array'.", choices: ["DP","Two pointers","BFS","Segment tree"], correctIndex: 1 },
  { id: "dsa-5",  topic: "sliding-window", area: "dsa", difficulty: "medium", prompt: "'Longest substring without repeating characters' is solved with…", choices: ["Greedy","Sliding window + map","DP","Backtracking"], correctIndex: 1 },
  { id: "dsa-6",  topic: "linked-list", area: "dsa", difficulty: "medium", prompt: "Detect cycle in singly linked list — best space?", choices: ["O(n) with set","O(1) with slow/fast","O(log n)","O(n^2)"], correctIndex: 1 },
  { id: "dsa-7",  topic: "tree", area: "dsa", difficulty: "medium", prompt: "BST in-order traversal yields…", choices: ["Pre-order","Sorted ascending","Level order","Reverse sorted"], correctIndex: 1 },
  { id: "dsa-8",  topic: "graph", area: "dsa", difficulty: "medium", prompt: "Shortest path with unit weights — best algorithm.", choices: ["DFS","BFS","Dijkstra","Bellman-Ford"], correctIndex: 1 },
  { id: "dsa-9",  topic: "dp", area: "dsa", difficulty: "hard", prompt: "Number of distinct subsequences — best approach.", choices: ["Greedy","DP O(n*m)","Backtracking","BFS"], correctIndex: 1 },
  { id: "dsa-10", topic: "dp", area: "dsa", difficulty: "hard", prompt: "0/1 Knapsack — minimum DP state.", choices: ["1D O(W)","2D O(nW)","3D O(n^2 W)","O(2^n)"], correctIndex: 0, explanation: "Iterate weights descending to reuse row." },
  { id: "dsa-11", topic: "greedy", area: "dsa", difficulty: "medium", prompt: "Activity selection works because of…", choices: ["Sorting by end time","Sorting by start time","DP","Random"], correctIndex: 0 },
  { id: "dsa-12", topic: "sorting", area: "dsa", difficulty: "easy", prompt: "Worst-case time of quicksort.", choices: ["O(n)","O(n log n)","O(n^2)","O(n^3)"], correctIndex: 2 },
  { id: "dsa-13", topic: "arrays", area: "dsa", difficulty: "medium", prompt: "Kadane's algorithm finds…", choices: ["Max subarray sum","All subarrays","Median","Sorted order"], correctIndex: 0 },
  { id: "dsa-14", topic: "strings", area: "dsa", difficulty: "medium", prompt: "KMP preprocessing builds a…", choices: ["Suffix tree","LPS array","Trie","Hash"], correctIndex: 1 },
  { id: "dsa-15", topic: "graph", area: "dsa", difficulty: "hard", prompt: "Detect cycle in DIRECTED graph.", choices: ["Union-Find","BFS","DFS with rec-stack","Topo only"], correctIndex: 2 },
  { id: "dsa-16", topic: "tree", area: "dsa", difficulty: "hard", prompt: "LCA in BST without parent pointer — best time.", choices: ["O(log n)","O(n)","O(n log n)","O(1)"], correctIndex: 0 },
  { id: "dsa-17", topic: "hash-map", area: "dsa", difficulty: "medium", prompt: "Two Sum (unsorted) — optimal time + space.", choices: ["O(n^2), O(1)","O(n log n), O(1)","O(n), O(n)","O(log n), O(n)"], correctIndex: 2 },
  { id: "dsa-18", topic: "dp", area: "dsa", difficulty: "medium", prompt: "Fibonacci with memoization — time complexity.", choices: ["O(2^n)","O(n)","O(n log n)","O(n^2)"], correctIndex: 1 },
];

const CS: AssessmentQuestion[] = [
  { id: "cs-1", topic: "os", area: "cs", difficulty: "easy", prompt: "Process vs thread — main difference.", choices: ["Same memory","Separate memory","Same CPU","No difference"], correctIndex: 1 },
  { id: "cs-2", topic: "os", area: "cs", difficulty: "medium", prompt: "Deadlock requires all of these EXCEPT…", choices: ["Mutual exclusion","Hold and wait","Preemption","Circular wait"], correctIndex: 2 },
  { id: "cs-3", topic: "dbms", area: "cs", difficulty: "medium", prompt: "ACID — the 'I' stands for…", choices: ["Indexed","Isolation","Immutable","Inherited"], correctIndex: 1 },
  { id: "cs-4", topic: "dbms", area: "cs", difficulty: "medium", prompt: "Index makes reads faster and writes…", choices: ["Faster","Same","Slower","Unaffected"], correctIndex: 2 },
  { id: "cs-5", topic: "cn", area: "cs", difficulty: "easy", prompt: "HTTPS uses port…", choices: ["80","443","21","22"], correctIndex: 1 },
  { id: "cs-6", topic: "cn", area: "cs", difficulty: "medium", prompt: "TCP is — vs UDP.", choices: ["Connectionless","Unreliable","Connection-oriented + reliable","Stateless"], correctIndex: 2 },
  { id: "cs-7", topic: "oop", area: "cs", difficulty: "easy", prompt: "Encapsulation =", choices: ["Hide internal state","Override methods","Multiple inheritance","Templates"], correctIndex: 0 },
  { id: "cs-8", topic: "oop", area: "cs", difficulty: "medium", prompt: "Polymorphism in Java is achieved via…", choices: ["Inheritance only","Overloading + overriding","Encapsulation","Abstraction"], correctIndex: 1 },
];

const APTI: AssessmentQuestion[] = [
  { id: "ap-1", topic: "quant", area: "aptitude", difficulty: "easy", prompt: "If 5x = 35, x = ?", choices: ["5","7","8","9"], correctIndex: 1 },
  { id: "ap-2", topic: "quant", area: "aptitude", difficulty: "medium", prompt: "A train 200m long passes a pole in 10s. Speed (km/h)?", choices: ["36","60","72","90"], correctIndex: 2 },
  { id: "ap-3", topic: "logic", area: "aptitude", difficulty: "medium", prompt: "All A are B. Some B are C. Therefore…", choices: ["All A are C","Some A are C","No conclusion","All C are A"], correctIndex: 2 },
  { id: "ap-4", topic: "logic", area: "aptitude", difficulty: "easy", prompt: "Next in series: 2,4,8,16,?", choices: ["18","20","24","32"], correctIndex: 3 },
  { id: "ap-5", topic: "verbal", area: "aptitude", difficulty: "easy", prompt: "Antonym of 'frugal'.", choices: ["Thrifty","Lavish","Modest","Sparing"], correctIndex: 1 },
  { id: "ap-6", topic: "diagram", area: "aptitude", difficulty: "medium", prompt: "If a clock shows 3:15, angle between hands?", choices: ["0°","7.5°","30°","45°"], correctIndex: 1 },
];

export const ASSESSMENT_BANK: AssessmentQuestion[] = [...DSA, ...CS, ...APTI];
