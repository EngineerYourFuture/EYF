import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface Problem {
  id: string;
  number?: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
  companies?: string[];
  acceptanceRate?: number;
  solved?: boolean;
  xpReward?: number;
  isPremium?: boolean;
}

interface ProblemsResponse {
  problems: Problem[];
  total?: number;
  stats?: {
    totalSolved: number;
    easySolved: number; easyTotal: number;
    mediumSolved: number; mediumTotal: number;
    hardSolved: number; hardTotal: number;
  };
}

const DIFF_STYLE: Record<string, string> = {
  easy:   'text-green-400 bg-green-400/10 border-green-500/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20',
  hard:   'text-red-400 bg-red-400/10 border-red-500/20',
};

const TOPIC_TAGS = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue',
  'Trees', 'Graphs', 'Dynamic Programming', 'Recursion', 'Backtracking',
  'Binary Search', 'Sorting', 'Hashing', 'Greedy', 'Math',
  'Two Pointers', 'Sliding Window', 'Heap', 'Trie', 'Segment Tree',
];

const COMPANY_TAGS = [
  'Google', 'Amazon', 'Meta', 'Microsoft', 'Apple',
  'Netflix', 'Uber', 'Adobe', 'Flipkart', 'Atlassian',
];

const STATIC_PROBLEMS: Problem[] = [
  // ── Arrays ────────────────────────────────────────────────────────────────
  { id: 'two-sum', number: 1, title: 'Two Sum', difficulty: 'easy', category: 'Arrays', tags: ['Arrays', 'Hashing'], companies: ['Google', 'Amazon', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 49, xpReward: 30 },
  { id: 'best-time-stock', number: 121, title: 'Best Time to Buy and Sell Stock', difficulty: 'easy', category: 'Arrays', tags: ['Arrays', 'Greedy'], companies: ['Amazon', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 54, xpReward: 30 },
  { id: 'contains-duplicate', number: 217, title: 'Contains Duplicate', difficulty: 'easy', category: 'Arrays', tags: ['Arrays', 'Hashing'], companies: ['Google', 'Amazon', 'Apple'], acceptanceRate: 61, xpReward: 30 },
  { id: 'product-except-self', number: 238, title: 'Product of Array Except Self', difficulty: 'medium', category: 'Arrays', tags: ['Arrays'], companies: ['Amazon', 'Meta', 'Microsoft', 'Apple', 'Google'], acceptanceRate: 64, xpReward: 60 },
  { id: 'maximum-subarray', number: 53, title: 'Maximum Subarray (Kadane\'s)', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe', 'Flipkart'], acceptanceRate: 50, xpReward: 60 },
  { id: 'max-product-subarray', number: 152, title: 'Maximum Product Subarray', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 35, xpReward: 60 },
  { id: 'find-min-rotated', number: 153, title: 'Find Minimum in Rotated Sorted Array', difficulty: 'medium', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], companies: ['Google', 'Amazon', 'Meta', 'Microsoft'], acceptanceRate: 48, xpReward: 60 },
  { id: 'search-rotated', number: 33, title: 'Search in Rotated Sorted Array', difficulty: 'medium', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], companies: ['Google', 'Amazon', 'Meta', 'Uber', 'Microsoft'], acceptanceRate: 39, xpReward: 60 },
  { id: 'three-sum', number: 15, title: '3Sum', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Two Pointers'], companies: ['Amazon', 'Meta', 'Google', 'Microsoft', 'Adobe'], acceptanceRate: 32, xpReward: 60 },
  { id: 'container-water', number: 11, title: 'Container With Most Water', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Two Pointers', 'Greedy'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 54, xpReward: 60 },
  { id: 'trapping-rain', number: 42, title: 'Trapping Rain Water', difficulty: 'hard', category: 'Arrays', tags: ['Arrays', 'Two Pointers', 'Stack'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple'], acceptanceRate: 60, xpReward: 100 },
  { id: 'spiral-matrix', number: 54, title: 'Spiral Matrix', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Math'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple'], acceptanceRate: 47, xpReward: 60 },
  { id: 'set-matrix-zeros', number: 73, title: 'Set Matrix Zeroes', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Math'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 55, xpReward: 60 },
  { id: 'rotate-image', number: 48, title: 'Rotate Image', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Math'], companies: ['Amazon', 'Microsoft', 'Adobe', 'Google'], acceptanceRate: 72, xpReward: 60 },
  { id: 'jump-game-ii', number: 45, title: 'Jump Game II', difficulty: 'medium', category: 'Greedy', tags: ['Arrays', 'Greedy', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 41, xpReward: 60 },
  // ── Strings ───────────────────────────────────────────────────────────────
  { id: 'valid-anagram', number: 242, title: 'Valid Anagram', difficulty: 'easy', category: 'Strings', tags: ['Strings', 'Hashing'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'], acceptanceRate: 63, xpReward: 30 },
  { id: 'valid-palindrome', number: 125, title: 'Valid Palindrome', difficulty: 'easy', category: 'Strings', tags: ['Strings', 'Two Pointers'], companies: ['Amazon', 'Meta', 'Microsoft', 'Apple'], acceptanceRate: 47, xpReward: 30 },
  { id: 'group-anagrams', number: 49, title: 'Group Anagrams', difficulty: 'medium', category: 'Strings', tags: ['Strings', 'Hashing'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 67, xpReward: 60 },
  { id: 'longest-substring', number: 3, title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', category: 'Sliding Window', tags: ['Strings', 'Sliding Window', 'Hashing'], companies: ['Amazon', 'Google', 'Meta', 'Adobe', 'Microsoft', 'Uber'], acceptanceRate: 34, xpReward: 60 },
  { id: 'longest-repeating', number: 424, title: 'Longest Repeating Character Replacement', difficulty: 'medium', category: 'Sliding Window', tags: ['Strings', 'Sliding Window'], companies: ['Google', 'Amazon', 'Microsoft'], acceptanceRate: 53, xpReward: 60 },
  { id: 'min-window-substring', number: 76, title: 'Minimum Window Substring', difficulty: 'hard', category: 'Sliding Window', tags: ['Strings', 'Sliding Window', 'Hashing'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Uber'], acceptanceRate: 41, xpReward: 100 },
  { id: 'valid-parentheses', number: 20, title: 'Valid Parentheses', difficulty: 'easy', category: 'Stack', tags: ['Stack', 'Strings'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 40, xpReward: 30 },
  { id: 'encode-decode', number: 271, title: 'Encode and Decode Strings', difficulty: 'medium', category: 'Strings', tags: ['Strings'], companies: ['Google', 'Meta', 'Amazon'], acceptanceRate: 39, xpReward: 60 },
  { id: 'palindromic-substrings', number: 647, title: 'Palindromic Substrings', difficulty: 'medium', category: 'Strings', tags: ['Strings', 'Dynamic Programming'], companies: ['Google', 'Amazon', 'Microsoft', 'Meta'], acceptanceRate: 69, xpReward: 60 },
  { id: 'longest-palindrome', number: 5, title: 'Longest Palindromic Substring', difficulty: 'medium', category: 'Strings', tags: ['Strings', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe', 'Uber'], acceptanceRate: 33, xpReward: 60 },
  { id: 'reverse-words', number: 151, title: 'Reverse Words in a String', difficulty: 'medium', category: 'Strings', tags: ['Strings', 'Two Pointers'], companies: ['Amazon', 'Microsoft', 'Adobe', 'Apple'], acceptanceRate: 43, xpReward: 60 },
  { id: 'string-to-integer', number: 8, title: 'String to Integer (atoi)', difficulty: 'medium', category: 'Strings', tags: ['Strings', 'Math'], companies: ['Amazon', 'Microsoft', 'Adobe'], acceptanceRate: 17, xpReward: 60 },
  // ── Linked List ───────────────────────────────────────────────────────────
  { id: 'reverse-linked-list', number: 206, title: 'Reverse a Linked List', difficulty: 'easy', category: 'Linked List', tags: ['Linked List', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe', 'Flipkart'], acceptanceRate: 74, xpReward: 30 },
  { id: 'merge-two-lists', number: 21, title: 'Merge Two Sorted Lists', difficulty: 'easy', category: 'Linked List', tags: ['Linked List', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 64, xpReward: 30 },
  { id: 'linked-list-cycle', number: 141, title: 'Linked List Cycle', difficulty: 'easy', category: 'Linked List', tags: ['Linked List', 'Two Pointers'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 48, xpReward: 30 },
  { id: 'reorder-list', number: 143, title: 'Reorder List', difficulty: 'medium', category: 'Linked List', tags: ['Linked List', 'Two Pointers', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 57, xpReward: 60 },
  { id: 'remove-nth-node', number: 19, title: 'Remove Nth Node From End of List', difficulty: 'medium', category: 'Linked List', tags: ['Linked List', 'Two Pointers'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 40, xpReward: 60 },
  { id: 'copy-list-random', number: 138, title: 'Copy List with Random Pointer', difficulty: 'medium', category: 'Linked List', tags: ['Linked List', 'Hashing'], companies: ['Amazon', 'Meta', 'Microsoft', 'Google'], acceptanceRate: 55, xpReward: 60 },
  { id: 'add-two-numbers', number: 2, title: 'Add Two Numbers', difficulty: 'medium', category: 'Linked List', tags: ['Linked List', 'Math'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 42, xpReward: 60 },
  { id: 'find-duplicate-number', number: 287, title: 'Find the Duplicate Number', difficulty: 'medium', category: 'Linked List', tags: ['Arrays', 'Two Pointers', 'Binary Search'], companies: ['Amazon', 'Google', 'Meta'], acceptanceRate: 59, xpReward: 60 },
  { id: 'merge-k-lists', number: 23, title: 'Merge K Sorted Lists', difficulty: 'hard', category: 'Linked List', tags: ['Linked List', 'Heap', 'Merge Sort'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Uber'], acceptanceRate: 50, xpReward: 100 },
  { id: 'reverse-nodes-k', number: 25, title: 'Reverse Nodes in k-Group', difficulty: 'hard', category: 'Linked List', tags: ['Linked List', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 57, xpReward: 100 },
  // ── Trees ─────────────────────────────────────────────────────────────────
  { id: 'invert-tree', number: 226, title: 'Invert Binary Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple'], acceptanceRate: 76, xpReward: 30 },
  { id: 'max-depth-tree', number: 104, title: 'Maximum Depth of Binary Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe', 'Flipkart'], acceptanceRate: 74, xpReward: 30 },
  { id: 'same-tree', number: 100, title: 'Same Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 60, xpReward: 30 },
  { id: 'subtree-of-tree', number: 572, title: 'Subtree of Another Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 46, xpReward: 30 },
  { id: 'binary-tree-diam', number: 543, title: 'Diameter of Binary Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 58, xpReward: 30 },
  { id: 'balanced-tree', number: 110, title: 'Balanced Binary Tree', difficulty: 'easy', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 50, xpReward: 30 },
  { id: 'lca-bst', number: 235, title: 'Lowest Common Ancestor of BST', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Binary Search'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 64, xpReward: 60 },
  { id: 'lca-binary-tree', number: 236, title: 'Lowest Common Ancestor of Binary Tree', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple'], acceptanceRate: 60, xpReward: 60 },
  { id: 'level-order', number: 102, title: 'Binary Tree Level Order Traversal', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Graphs'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe', 'Flipkart'], acceptanceRate: 66, xpReward: 60 },
  { id: 'right-side-view', number: 199, title: 'Binary Tree Right Side View', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Graphs'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 62, xpReward: 60 },
  { id: 'count-good-nodes', number: 1448, title: 'Count Good Nodes in Binary Tree', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Google', 'Amazon'], acceptanceRate: 73, xpReward: 60 },
  { id: 'validate-bst', number: 98, title: 'Validate Binary Search Tree', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'], acceptanceRate: 32, xpReward: 60 },
  { id: 'kth-smallest-bst', number: 230, title: 'Kth Smallest Element in BST', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Binary Search'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], acceptanceRate: 71, xpReward: 60 },
  { id: 'construct-preorder-inorder', number: 105, title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'medium', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'], acceptanceRate: 61, xpReward: 60 },
  { id: 'max-path-sum', number: 124, title: 'Binary Tree Maximum Path Sum', difficulty: 'hard', category: 'Trees', tags: ['Trees', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Uber'], acceptanceRate: 39, xpReward: 100 },
  { id: 'serialize-tree', number: 297, title: 'Serialize and Deserialize Binary Tree', difficulty: 'hard', category: 'Trees', tags: ['Trees', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 56, xpReward: 100 },
  // ── Graphs ────────────────────────────────────────────────────────────────
  { id: 'num-islands', number: 200, title: 'Number of Islands', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe', 'Uber', 'Flipkart'], acceptanceRate: 57, xpReward: 60 },
  { id: 'max-area-island', number: 695, title: 'Max Area of Island', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 71, xpReward: 60 },
  { id: 'clone-graph', number: 133, title: 'Clone Graph', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 53, xpReward: 60 },
  { id: 'walls-gates', number: 286, title: 'Walls and Gates', difficulty: 'medium', category: 'Graphs', tags: ['Graphs'], companies: ['Amazon', 'Meta', 'Google'], acceptanceRate: 59, xpReward: 60 },
  { id: 'rotting-oranges', number: 994, title: 'Rotting Oranges', difficulty: 'medium', category: 'Graphs', tags: ['Graphs'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 53, xpReward: 60 },
  { id: 'pacific-atlantic', number: 417, title: 'Pacific Atlantic Water Flow', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 54, xpReward: 60 },
  { id: 'course-schedule', number: 207, title: 'Course Schedule', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Sorting'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple', 'Uber'], acceptanceRate: 45, xpReward: 60 },
  { id: 'course-schedule-ii', number: 210, title: 'Course Schedule II', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Sorting'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 48, xpReward: 60 },
  { id: 'graph-valid-tree', number: 261, title: 'Graph Valid Tree', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Sorting'], companies: ['Google', 'Amazon', 'LinkedIn'], acceptanceRate: 46, xpReward: 60 },
  { id: 'num-connected-components', number: 323, title: 'Number of Connected Components in Undirected Graph', difficulty: 'medium', category: 'Graphs', tags: ['Graphs', 'Sorting'], companies: ['Google', 'Amazon', 'Meta'], acceptanceRate: 63, xpReward: 60 },
  { id: 'word-ladder', number: 127, title: 'Word Ladder', difficulty: 'hard', category: 'Graphs', tags: ['Graphs'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], acceptanceRate: 38, xpReward: 100 },
  { id: 'alien-dict', number: 269, title: 'Alien Dictionary', difficulty: 'hard', category: 'Graphs', tags: ['Graphs', 'Sorting'], companies: ['Google', 'Amazon', 'Meta', 'Uber'], acceptanceRate: 33, xpReward: 100 },
  // ── Dynamic Programming ───────────────────────────────────────────────────
  { id: 'climb-stairs', number: 70, title: 'Climbing Stairs', difficulty: 'easy', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe', 'Flipkart'], acceptanceRate: 52, xpReward: 30 },
  { id: 'min-cost-climbing', number: 746, title: 'Min Cost Climbing Stairs', difficulty: 'easy', category: 'Dynamic Programming', tags: ['Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 64, xpReward: 30 },
  { id: 'coin-change', number: 322, title: 'Coin Change', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe', 'Flipkart'], acceptanceRate: 42, xpReward: 60 },
  { id: 'longest-inc-subseq', number: 300, title: 'Longest Increasing Subsequence', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Binary Search'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], acceptanceRate: 54, xpReward: 60 },
  { id: 'unique-paths', number: 62, title: 'Unique Paths', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Math'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'], acceptanceRate: 64, xpReward: 60 },
  { id: 'jump-game', number: 55, title: 'Jump Game', difficulty: 'medium', category: 'Greedy', tags: ['Arrays', 'Greedy', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], acceptanceRate: 38, xpReward: 60 },
  { id: 'word-break', number: 139, title: 'Word Break', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Trie'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Apple'], acceptanceRate: 45, xpReward: 60 },
  { id: 'combination-sum', number: 39, title: 'Combination Sum', difficulty: 'medium', category: 'Recursion', tags: ['Recursion'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe', 'Flipkart'], acceptanceRate: 70, xpReward: 60 },
  { id: 'combination-sum-ii', number: 40, title: 'Combination Sum II', difficulty: 'medium', category: 'Recursion', tags: ['Recursion', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 53, xpReward: 60 },
  { id: 'house-robber', number: 198, title: 'House Robber', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft', 'Airbnb'], acceptanceRate: 50, xpReward: 60 },
  { id: 'house-robber-ii', number: 213, title: 'House Robber II', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 41, xpReward: 60 },
  { id: 'decode-ways', number: 91, title: 'Decode Ways', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], acceptanceRate: 33, xpReward: 60 },
  { id: 'partition-equal-subset', number: 416, title: 'Partition Equal Subset Sum', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 46, xpReward: 60 },
  { id: 'target-sum', number: 494, title: 'Target Sum', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], companies: ['Amazon', 'Google'], acceptanceRate: 48, xpReward: 60 },
  { id: 'last-stone-weight', number: 1046, title: 'Last Stone Weight II', difficulty: 'medium', category: 'Dynamic Programming', tags: ['Dynamic Programming'], companies: ['Amazon', 'Google'], acceptanceRate: 57, xpReward: 60 },
  { id: 'edit-distance', number: 72, title: 'Edit Distance', difficulty: 'hard', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Strings'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'], acceptanceRate: 55, xpReward: 100 },
  { id: 'burst-balloons', number: 312, title: 'Burst Balloons', difficulty: 'hard', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Recursion'], companies: ['Google', 'Amazon'], acceptanceRate: 58, xpReward: 100 },
  { id: 'regular-expression', number: 10, title: 'Regular Expression Matching', difficulty: 'hard', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Strings', 'Recursion'], companies: ['Google', 'Amazon', 'Meta', 'Microsoft'], acceptanceRate: 28, xpReward: 100 },
  { id: 'distinct-subsequences', number: 115, title: 'Distinct Subsequences', difficulty: 'hard', category: 'Dynamic Programming', tags: ['Dynamic Programming', 'Strings'], companies: ['Google', 'Amazon', 'Meta'], acceptanceRate: 44, xpReward: 100 },
  // ── Heap ──────────────────────────────────────────────────────────────────
  { id: 'kth-largest', number: 215, title: 'Kth Largest Element in Array', difficulty: 'medium', category: 'Sorting', tags: ['Arrays', 'Sorting', 'Heap'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 65, xpReward: 60 },
  { id: 'top-k-frequent', number: 347, title: 'Top K Frequent Elements', difficulty: 'medium', category: 'Hashing', tags: ['Arrays', 'Hashing', 'Heap', 'Sorting'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Uber'], acceptanceRate: 65, xpReward: 60 },
  { id: 'k-closest-points', number: 973, title: 'K Closest Points to Origin', difficulty: 'medium', category: 'Heap', tags: ['Heap', 'Sorting', 'Math'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Uber'], acceptanceRate: 67, xpReward: 60 },
  { id: 'task-scheduler', number: 621, title: 'Task Scheduler', difficulty: 'medium', category: 'Heap', tags: ['Heap', 'Greedy', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], acceptanceRate: 57, xpReward: 60 },
  { id: 'design-twitter', number: 355, title: 'Design Twitter', difficulty: 'medium', category: 'Heap', tags: ['Heap', 'Sorting'], companies: ['Amazon', 'Google', 'Meta', 'Twitter'], acceptanceRate: 37, xpReward: 60 },
  { id: 'find-median-stream', number: 295, title: 'Find Median from Data Stream', difficulty: 'hard', category: 'Heap', tags: ['Heap', 'Sorting'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 51, xpReward: 100 },
  // ── Trie ──────────────────────────────────────────────────────────────────
  { id: 'implement-trie', number: 208, title: 'Implement Trie (Prefix Tree)', difficulty: 'medium', category: 'Trie', tags: ['Trie', 'Strings'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 63, xpReward: 60 },
  { id: 'add-search-word', number: 211, title: 'Add and Search Word - Data Structure Design', difficulty: 'medium', category: 'Trie', tags: ['Trie', 'Strings', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 44, xpReward: 60 },
  { id: 'word-search-ii', number: 212, title: 'Word Search II', difficulty: 'hard', category: 'Trie', tags: ['Trie', 'Recursion', 'Graphs'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Airbnb'], acceptanceRate: 37, xpReward: 100 },
  // ── Stack/Queue ───────────────────────────────────────────────────────────
  { id: 'min-stack', number: 155, title: 'Min Stack', difficulty: 'medium', category: 'Stack', tags: ['Stack'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 53, xpReward: 30 },
  { id: 'daily-temperatures', number: 739, title: 'Daily Temperatures', difficulty: 'medium', category: 'Stack', tags: ['Stack', 'Arrays', 'Greedy'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 67, xpReward: 60 },
  { id: 'car-fleet', number: 853, title: 'Car Fleet', difficulty: 'medium', category: 'Stack', tags: ['Stack', 'Arrays', 'Sorting', 'Greedy'], companies: ['Amazon', 'Google'], acceptanceRate: 49, xpReward: 60 },
  { id: 'evaluate-rpn', number: 150, title: 'Evaluate Reverse Polish Notation', difficulty: 'medium', category: 'Stack', tags: ['Stack', 'Math'], companies: ['Amazon', 'Google', 'Microsoft', 'LinkedIn'], acceptanceRate: 47, xpReward: 60 },
  { id: 'generate-parentheses', number: 22, title: 'Generate Parentheses', difficulty: 'medium', category: 'Stack', tags: ['Stack', 'Strings', 'Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple'], acceptanceRate: 72, xpReward: 60 },
  { id: 'largest-rect-hist', number: 84, title: 'Largest Rectangle in Histogram', difficulty: 'hard', category: 'Stack', tags: ['Stack', 'Arrays'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 44, xpReward: 100 },
  // ── Binary Search ─────────────────────────────────────────────────────────
  { id: 'binary-search', number: 704, title: 'Binary Search', difficulty: 'easy', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe', 'Flipkart'], acceptanceRate: 55, xpReward: 30 },
  { id: 'search-2d-matrix', number: 74, title: 'Search a 2D Matrix', difficulty: 'medium', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'], acceptanceRate: 49, xpReward: 60 },
  { id: 'time-based-kv', number: 981, title: 'Time Based Key-Value Store', difficulty: 'medium', category: 'Binary Search', tags: ['Binary Search', 'Hashing'], companies: ['Google', 'Amazon', 'Meta', 'Uber'], acceptanceRate: 53, xpReward: 60 },
  { id: 'koko-eating-bananas', number: 875, title: 'Koko Eating Bananas', difficulty: 'medium', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], companies: ['Amazon', 'Google', 'Meta'], acceptanceRate: 52, xpReward: 60 },
  { id: 'capacity-ships', number: 1011, title: 'Capacity To Ship Packages Within D Days', difficulty: 'medium', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 67, xpReward: 60 },
  { id: 'split-array-largest-sum', number: 410, title: 'Split Array Largest Sum', difficulty: 'hard', category: 'Binary Search', tags: ['Arrays', 'Binary Search', 'Dynamic Programming'], companies: ['Google', 'Amazon', 'Meta', 'Microsoft'], acceptanceRate: 53, xpReward: 100 },
  { id: 'median-two-arrays', number: 4, title: 'Median of Two Sorted Arrays', difficulty: 'hard', category: 'Binary Search', tags: ['Arrays', 'Binary Search'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Uber'], acceptanceRate: 36, xpReward: 100 },
  // ── Backtracking ──────────────────────────────────────────────────────────
  { id: 'permutations', number: 46, title: 'Permutations', difficulty: 'medium', category: 'Recursion', tags: ['Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Flipkart'], acceptanceRate: 75, xpReward: 60 },
  { id: 'permutations-ii', number: 47, title: 'Permutations II', difficulty: 'medium', category: 'Recursion', tags: ['Recursion', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 58, xpReward: 60 },
  { id: 'subsets', number: 78, title: 'Subsets', difficulty: 'medium', category: 'Recursion', tags: ['Recursion', 'Sorting'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 76, xpReward: 60 },
  { id: 'subsets-ii', number: 90, title: 'Subsets II', difficulty: 'medium', category: 'Recursion', tags: ['Recursion', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 56, xpReward: 60 },
  { id: 'letter-combinations', number: 17, title: 'Letter Combinations of Phone Number', difficulty: 'medium', category: 'Recursion', tags: ['Recursion', 'Strings'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Uber'], acceptanceRate: 57, xpReward: 60 },
  { id: 'word-search', number: 79, title: 'Word Search', difficulty: 'medium', category: 'Recursion', tags: ['Recursion', 'Graphs'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 41, xpReward: 60 },
  { id: 'palindrome-partitioning', number: 131, title: 'Palindrome Partitioning', difficulty: 'medium', category: 'Recursion', tags: ['Recursion', 'Strings', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 67, xpReward: 60 },
  { id: 'n-queens', number: 51, title: 'N-Queens', difficulty: 'hard', category: 'Recursion', tags: ['Recursion'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 66, xpReward: 100 },
  { id: 'sudoku-solver', number: 37, title: 'Sudoku Solver', difficulty: 'hard', category: 'Recursion', tags: ['Recursion', 'Math'], companies: ['Google', 'Microsoft', 'Amazon'], acceptanceRate: 60, xpReward: 100 },
  // ── Greedy / Intervals ────────────────────────────────────────────────────
  { id: 'meeting-rooms', number: 252, title: 'Meeting Rooms', difficulty: 'easy', category: 'Sorting', tags: ['Arrays', 'Sorting'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 57, xpReward: 30 },
  { id: 'meeting-rooms-ii', number: 253, title: 'Meeting Rooms II', difficulty: 'medium', category: 'Heap', tags: ['Arrays', 'Sorting', 'Heap'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe', 'Uber'], acceptanceRate: 50, xpReward: 60 },
  { id: 'merge-intervals', number: 56, title: 'Merge Intervals', difficulty: 'medium', category: 'Sorting', tags: ['Arrays', 'Sorting'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe', 'Uber'], acceptanceRate: 46, xpReward: 60 },
  { id: 'insert-interval', number: 57, title: 'Insert Interval', difficulty: 'medium', category: 'Sorting', tags: ['Arrays', 'Sorting'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 39, xpReward: 60 },
  { id: 'non-overlapping-intervals', number: 435, title: 'Non-overlapping Intervals', difficulty: 'medium', category: 'Greedy', tags: ['Arrays', 'Sorting', 'Greedy'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 51, xpReward: 60 },
  { id: 'hand-of-straights', number: 846, title: 'Hand of Straights', difficulty: 'medium', category: 'Greedy', tags: ['Greedy', 'Sorting', 'Hashing'], companies: ['Amazon', 'Google', 'Meta'], acceptanceRate: 56, xpReward: 60 },
  { id: 'gas-station', number: 134, title: 'Gas Station', difficulty: 'medium', category: 'Greedy', tags: ['Arrays', 'Greedy'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 46, xpReward: 60 },
  { id: 'min-intervals', number: 1851, title: 'Minimum Interval to Include Each Query', difficulty: 'hard', category: 'Heap', tags: ['Arrays', 'Sorting', 'Heap', 'Binary Search'], companies: ['Google', 'Amazon', 'Meta'], acceptanceRate: 55, xpReward: 100 },
  // ── Math & Bit Manipulation ───────────────────────────────────────────────
  { id: 'reverse-integer', number: 7, title: 'Reverse Integer', difficulty: 'medium', category: 'Math', tags: ['Math'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'], acceptanceRate: 28, xpReward: 60 },
  { id: 'pow-x-n', number: 50, title: 'Pow(x, n)', difficulty: 'medium', category: 'Math', tags: ['Math', 'Recursion'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'], acceptanceRate: 34, xpReward: 60 },
  { id: 'happy-number', number: 202, title: 'Happy Number', difficulty: 'easy', category: 'Math', tags: ['Math', 'Hashing', 'Two Pointers'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 54, xpReward: 30 },
  { id: 'plus-one', number: 66, title: 'Plus One', difficulty: 'easy', category: 'Math', tags: ['Arrays', 'Math'], companies: ['Google', 'Amazon', 'Microsoft', 'Adobe'], acceptanceRate: 43, xpReward: 30 },
  { id: 'number-of-1-bits', number: 191, title: 'Number of 1 Bits', difficulty: 'easy', category: 'Math', tags: ['Math'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 66, xpReward: 30 },
  { id: 'counting-bits', number: 338, title: 'Counting Bits', difficulty: 'easy', category: 'Math', tags: ['Math', 'Dynamic Programming'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 75, xpReward: 30 },
  { id: 'reverse-bits', number: 190, title: 'Reverse Bits', difficulty: 'easy', category: 'Math', tags: ['Math'], companies: ['Amazon', 'Apple', 'Microsoft'], acceptanceRate: 55, xpReward: 30 },
  { id: 'missing-number', number: 268, title: 'Missing Number', difficulty: 'easy', category: 'Math', tags: ['Arrays', 'Math'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe', 'Flipkart'], acceptanceRate: 63, xpReward: 30 },
  { id: 'sum-two-integers', number: 371, title: 'Sum of Two Integers', difficulty: 'medium', category: 'Math', tags: ['Math'], companies: ['Amazon', 'Google', 'Meta'], acceptanceRate: 52, xpReward: 60 },
  // ── Two Pointers ──────────────────────────────────────────────────────────
  { id: 'move-zeroes', number: 283, title: 'Move Zeroes', difficulty: 'easy', category: 'Arrays', tags: ['Arrays', 'Two Pointers'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 61, xpReward: 30 },
  { id: 'squares-sorted', number: 977, title: 'Squares of a Sorted Array', difficulty: 'easy', category: 'Arrays', tags: ['Arrays', 'Two Pointers', 'Sorting'], companies: ['Amazon', 'Google'], acceptanceRate: 72, xpReward: 30 },
  { id: 'two-sum-ii', number: 167, title: 'Two Sum II - Input Array Is Sorted', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Two Pointers', 'Binary Search'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 60, xpReward: 60 },
  { id: '4sum', number: 18, title: '4Sum', difficulty: 'medium', category: 'Arrays', tags: ['Arrays', 'Two Pointers', 'Sorting'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 36, xpReward: 60 },
  // ── Design ────────────────────────────────────────────────────────────────
  { id: 'lru-cache', number: 146, title: 'LRU Cache', difficulty: 'medium', category: 'Design', tags: ['Hashing', 'Linked List'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple', 'Uber', 'Adobe'], acceptanceRate: 41, xpReward: 80 },
  { id: 'lfu-cache', number: 460, title: 'LFU Cache', difficulty: 'hard', category: 'Design', tags: ['Hashing', 'Linked List'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 42, xpReward: 120 },
  { id: 'design-hashmap', number: 706, title: 'Design HashMap', difficulty: 'easy', category: 'Design', tags: ['Hashing', 'Linked List'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Adobe'], acceptanceRate: 65, xpReward: 30 },
  { id: 'design-hashset', number: 705, title: 'Design HashSet', difficulty: 'easy', category: 'Design', tags: ['Hashing', 'Linked List'], companies: ['Amazon', 'Google', 'Meta', 'Microsoft'], acceptanceRate: 67, xpReward: 30 },
  { id: 'design-circular-queue', number: 622, title: 'Design Circular Queue', difficulty: 'medium', category: 'Design', tags: ['Queue', 'Arrays'], companies: ['Amazon', 'Google', 'Microsoft'], acceptanceRate: 49, xpReward: 60 },
  { id: 'snake-game', number: 353, title: 'Design Snake Game', difficulty: 'medium', category: 'Design', tags: ['Queue', 'Hashing'], companies: ['Amazon', 'Google', 'Microsoft', 'Apple'], acceptanceRate: 37, xpReward: 60 },
  { id: 'implement-stack-using-queues', number: 225, title: 'Implement Stack using Queues', difficulty: 'easy', category: 'Design', tags: ['Stack', 'Queue'], companies: ['Amazon', 'Microsoft'], acceptanceRate: 62, xpReward: 30 },
  { id: 'implement-queue-using-stacks', number: 232, title: 'Implement Queue using Stacks', difficulty: 'easy', category: 'Design', tags: ['Stack', 'Queue'], companies: ['Amazon', 'Microsoft', 'Adobe'], acceptanceRate: 63, xpReward: 30 },
];

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  'Arrays':            { icon: 'grid_on',          color: 'text-blue-400' },
  'Strings':           { icon: 'text_fields',       color: 'text-purple-400' },
  'Linked List':       { icon: 'link',              color: 'text-cyan-400' },
  'Stack':             { icon: 'layers',            color: 'text-orange-400' },
  'Queue':             { icon: 'queue',             color: 'text-yellow-400' },
  'Trees':             { icon: 'account_tree',      color: 'text-green-400' },
  'Graphs':            { icon: 'share',             color: 'text-pink-400' },
  'Dynamic Programming': { icon: 'table_chart',    color: 'text-red-400' },
  'Recursion':         { icon: 'repeat',            color: 'text-violet-400' },
  'Binary Search':     { icon: 'manage_search',     color: 'text-sky-400' },
  'Sorting':           { icon: 'sort',              color: 'text-lime-400' },
  'Hashing':           { icon: 'tag',               color: 'text-amber-400' },
  'Greedy':            { icon: 'bolt',              color: 'text-yellow-400' },
};

export function ProblemsPage() {
  const session = getSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [status, setStatus] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') ?? 'all');
  const [selectedCompany, setSelectedCompany] = useState<string>(searchParams.get('company') ?? 'all');
  const [stats, setStats] = useState<ProblemsResponse['stats'] | null>(null);

  const fetchProblems = useCallback(async () => {
    if (!session?.accessToken) {
      setProblems(STATIC_PROBLEMS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficulty !== 'all') params.set('difficulty', difficulty);
      if (selectedTag !== 'all') params.set('tag', selectedTag);
      const queryStr = params.toString();
      const url = queryStr ? `/problems?${queryStr}` : '/problems';
      const d = await apiRequest<ProblemsResponse>(url, { token: session.accessToken });
      setProblems(d.problems ?? []);
      if (d.stats) setStats(d.stats);
    } catch {
      setProblems(STATIC_PROBLEMS);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, difficulty, selectedTag]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  useEffect(() => {
    const tag = searchParams.get('tag');
    if (tag) setSelectedTag(tag);
  }, [searchParams]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    if (tag === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ tag });
    }
  };

  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchDiff    = difficulty === 'all' || p.difficulty === difficulty;
    const matchStatus  = status === 'all' || (status === 'solved' ? p.solved : !p.solved);
    const matchTag     = selectedTag === 'all' || (p.tags ?? []).includes(selectedTag) || p.category === selectedTag;
    const matchCompany = selectedCompany === 'all' || (p.companies ?? []).includes(selectedCompany);
    return matchSearch && matchDiff && matchStatus && matchTag && matchCompany;
  });

  const solvedCount = problems.filter((p) => p.solved).length;
  const easyTotal   = (stats?.easyTotal   ?? problems.filter((p) => p.difficulty === 'easy').length);
  const mediumTotal = (stats?.mediumTotal ?? problems.filter((p) => p.difficulty === 'medium').length);
  const hardTotal   = (stats?.hardTotal   ?? problems.filter((p) => p.difficulty === 'hard').length);
  const easySolved  = stats?.easySolved   ?? problems.filter((p) => p.difficulty === 'easy' && p.solved).length;
  const mediumSolved = stats?.mediumSolved ?? problems.filter((p) => p.difficulty === 'medium' && p.solved).length;
  const hardSolved  = stats?.hardSolved   ?? problems.filter((p) => p.difficulty === 'hard' && p.solved).length;

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl">
        {/* Hero */}
        <div className="mb-10 flex items-end justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-white mb-2 leading-none">
              MASTER THE<br /><span className="text-primary-container">ALGORITHMS.</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-lg">
              Curated problems engineered to take you from beginner to FAANG-ready.
            </p>
          </div>

          {/* Progress card */}
          <div className="bg-surface-container rounded-2xl p-6 w-full md:w-auto md:min-w-[280px] border border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container mb-4">Your Progress</p>
            <div className="space-y-3">
              {[
                { label: 'Easy', solved: easySolved, total: easyTotal, color: 'bg-green-400' },
                { label: 'Medium', solved: mediumSolved, total: mediumTotal, color: 'bg-yellow-400' },
                { label: 'Hard', solved: hardSolved, total: hardTotal, color: 'bg-red-400' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                    <span className="text-zinc-500">{row.label}</span>
                    <span className="text-on-surface">{row.solved}/{row.total}</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${row.color}`}
                      style={{ width: row.total ? `${(row.solved / row.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Solved</span>
              <span className="text-xl font-black text-on-surface">{solvedCount}/{problems.length}</span>
            </div>
          </div>
        </div>

        {/* Company Tags */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Company</p>
            <span className="text-[9px] font-bold text-[#E82127] bg-[#E82127]/10 px-2 py-0.5 rounded-full border border-[#E82127]/20">FREE on EYF · Premium on LeetCode</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCompany('all')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                selectedCompany === 'all'
                  ? 'bg-[#E82127] text-white border-transparent'
                  : 'text-zinc-500 border-zinc-800 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              All Companies
            </button>
            {COMPANY_TAGS.map((co) => (
              <button
                key={co}
                onClick={() => setSelectedCompany(co)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  selectedCompany === co
                    ? 'bg-zinc-700 text-white border-zinc-600'
                    : 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-600'
                }`}
              >
                {co}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Tags */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-3">Topic</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleTagClick('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                selectedTag === 'all'
                  ? 'bg-primary-container text-white border-transparent'
                  : 'text-zinc-500 border-zinc-800 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              All Topics
            </button>
            {TOPIC_TAGS.map((tag) => {
              const meta = CATEGORY_META[tag] ?? { icon: 'code', color: 'text-zinc-400' };
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    selectedTag === tag
                      ? `bg-surface-container-high ${meta.color} border-current/20`
                      : 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  <Icon name={meta.icon} size={11} />
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Difficulty */}
          <div className="flex items-center bg-surface-container p-1 rounded-full">
            {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-full font-['Inter'] uppercase tracking-widest text-[10px] font-black transition-all ${
                  difficulty === d ? 'bg-surface-container-highest text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {d === 'all' ? 'All' : d}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center bg-surface-container p-1 rounded-full">
            {(['all', 'solved', 'unsolved'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-full font-['Inter'] uppercase tracking-widest text-[10px] font-black transition-all ${
                  status === s ? 'bg-surface-container-highest text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems..."
              className="w-full bg-surface-container rounded-full pl-10 pr-5 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-0 text-on-surface"
            />
          </div>

          <span className="text-xs text-zinc-500 font-bold ml-auto">
            {filtered.length} problem{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 font-['Inter'] uppercase tracking-widest text-[10px] font-black text-zinc-600 mb-1">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Title</div>
          <div className="col-span-2 text-center">Difficulty</div>
          <div className="col-span-2 text-center">Companies</div>
          <div className="col-span-1 text-center">Tags</div>
          <div className="col-span-1 text-center">Acc %</div>
          <div className="col-span-1 text-center">XP</div>
        </div>

        {/* Problems list */}
        <div className="space-y-1.5">
          {loading && (
            <div className="space-y-1.5">
              {[...new Array(10)].map((_, i) => (
                <div key={`skeleton-${i}`} className="h-14 bg-surface-container rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <Icon name="search_off" size={40} className="text-zinc-700 mb-3" />
              <p className="text-zinc-500 font-bold">No problems found.</p>
              <p className="text-xs text-zinc-600 mt-1">Try adjusting your filters.</p>
            </div>
          )}

          {!loading && filtered.map((p, i) => {
            const DEFAULT_XP: Record<string, number> = { hard: 100, medium: 60 };
            const xpReward = p.xpReward ?? (DEFAULT_XP[p.difficulty] ?? 30);
            return (
            <Link key={p.id} to={`/app/problems/${p.id}`} className="block">
              <div className={`grid grid-cols-12 gap-4 rounded-xl px-6 py-4 hover:bg-surface-container-high transition-all cursor-pointer group items-center border ${
                p.solved ? 'bg-surface-container border-green-500/10' : 'bg-surface-container border-transparent'
              }`}>
                <div className="col-span-1 text-center">
                  {p.solved ? (
                    <Icon name="check_circle" size={18} className="text-green-400 mx-auto" filled />
                  ) : (
                    <span className="text-zinc-600 text-xs font-bold">{p.number ?? i + 1}</span>
                  )}
                </div>

                <div className="col-span-4">
                  <span className="font-semibold text-sm text-on-surface group-hover:text-primary-container transition-colors">
                    {p.title}
                  </span>
                  {p.category && (
                    <span className="ml-2 text-[10px] text-zinc-600 font-bold hidden sm:inline">{p.category}</span>
                  )}
                </div>

                <div className="col-span-2 flex justify-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${DIFF_STYLE[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                </div>

                <div className="col-span-2 flex justify-center gap-1 flex-wrap">
                  {(p.companies ?? []).slice(0, 3).map((co) => (
                    <span key={co} className="px-1.5 py-0.5 bg-zinc-800 rounded text-[9px] font-bold text-zinc-400 truncate max-w-[60px]">{co}</span>
                  ))}
                  {(p.companies ?? []).length > 3 && (
                    <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[9px] font-bold text-zinc-600">+{(p.companies ?? []).length - 3}</span>
                  )}
                </div>

                <div className="col-span-1 flex justify-center">
                  {(p.tags ?? []).slice(0, 1).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-surface-container-highest rounded-full text-[9px] font-bold text-zinc-500 truncate max-w-[80px]">{tag}</span>
                  ))}
                </div>

                <div className="col-span-1 text-center">
                  <span className="text-xs font-bold text-zinc-500">
                    {p.acceptanceRate == null ? '—' : `${Math.round(p.acceptanceRate)}%`}
                  </span>
                </div>

                <div className="col-span-1 flex justify-center items-center gap-0.5">
                  <span className="text-xs font-black text-primary-container">{xpReward}</span>
                  <Icon name="bolt" size={12} className="text-primary-container" filled />
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
