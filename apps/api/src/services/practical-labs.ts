import { prisma } from "@eyf/db";
import { testSuiteHash } from "./test-suite.js";

const sqlString = (s: string) => `'${s.replaceAll("'", "''")}'`;
type Ticket = [number, string, string, number];
function tickets(rows: Ticket[], viewer: string) {
  const inserts = rows.map((r) => `INSERT INTO tickets VALUES (${r[0]},${sqlString(r[1])},${sqlString(r[2])},${r[3]});`).join("\n");
  return `CREATE TABLE tickets(id INTEGER PRIMARY KEY, owner_id TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL);\nCREATE TABLE request_context(viewer_id TEXT NOT NULL);\nINSERT INTO request_context VALUES (${sqlString(viewer)});\n${inserts}`;
}
type Customer = [number, string]; type Order = [number, number, string, number];
function revenue(customers: Customer[], orders: Order[]) {
  const customerRows = customers.map((c) => `INSERT INTO customers VALUES (${c[0]},${sqlString(c[1])});`).join("\n");
  const orderRows = orders.map((o) => `INSERT INTO orders VALUES (${o[0]},${o[1]},${sqlString(o[2])},${o[3]});`).join("\n");
  return `CREATE TABLE customers(id INTEGER PRIMARY KEY, name TEXT NOT NULL);\nCREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL, status TEXT NOT NULL, amount_cents INTEGER NOT NULL);\n${customerRows}\n${orderRows}`;
}
const test = (input: string, expected: string, isPublic = false) => ({ input, expected, isPublic });
export const SQL_LABS = [
  { slug: "sql-private-ticket-queue-v1", title: "Build a private ticket queue", summary: "Read trusted scope, filter open tickets and make tied ordering deterministic.",
    description: `Write one SQLite SELECT query. The isolated test database already contains tickets(id INTEGER PRIMARY KEY, owner_id TEXT, status TEXT, created_at INTEGER) and request_context(viewer_id TEXT), which has exactly one row representing the trusted caller.\n\nReturn id and created_at for open tickets belonging to that viewer, ordered by created_at descending, then id ascending. Include no headers. SQLite prints columns separated by |. Return no rows when nothing matches. IDs and timestamps are integers; all fixture values are non-null.\n\nWrite only the query; do not recreate the tables or print setup statements. Each test starts with a new database. The public test input shows its setup; hidden tests use different data. This checks query results, not whether an application authenticates a caller correctly.`,
    starter: "-- The test database is already populated.\nSELECT id, created_at\nFROM tickets\n-- Apply trusted scope, filter and stable ordering.\n;\n",
    reference: "SELECT t.id, t.created_at FROM tickets t JOIN request_context r ON r.viewer_id = t.owner_id WHERE t.status = 'open' ORDER BY t.created_at DESC, t.id ASC;",
    tests: [test(tickets([[1,"a","open",10],[2,"b","open",40],[3,"a","closed",50],[4,"a","open",30]],"a"),"4|30\n1|10",true), test(tickets([],"a"),""), test(tickets([[9,"a","open",8],[2,"a","open",8],[5,"a","open",8]],"a"),"2|8\n5|8\n9|8"), test(tickets([[1,"b","open",5],[2,"a","closed",10]],"a"),""), test(tickets([[1,"o'neal","open",0],[2,"a","open",9]],"o'neal"),"1|0"), test(tickets([[1,"a","open",-2],[2,"a","open",0],[3,"a","open",100]],"a"),"3|100\n2|0\n1|-2")],
  },
  { slug: "sql-paid-revenue-v1", title: "Reconcile paid customer revenue", summary: "Aggregate paid orders while keeping customers who have never paid.",
    description: `Write one SQLite SELECT query against customers(id INTEGER PRIMARY KEY, name TEXT) and orders(id INTEGER PRIMARY KEY, customer_id INTEGER, status TEXT, amount_cents INTEGER).\n\nReturn every customer, including those with no orders: customer id, number of paid orders, and sum of paid amount_cents. Only status='paid' contributes. A customer with no paid orders has 0 count and 0 total. Order by customer id ascending. Use integer cents without converting currency. There are no NULL input values, but a LEFT JOIN creates NULLs for unmatched rows.\n\nOutput columns are separated by |, without headers. The sandbox creates a fresh database per case; submit only your query. Hidden tests include empty orders, cancelled orders, repeated amounts and zero-valued payments.`,
    starter: "-- Keep every customer, even with no paid orders.\nSELECT c.id, COUNT(o.id), COALESCE(SUM(o.amount_cents), 0)\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id\nORDER BY c.id;\n",
    reference: "SELECT c.id, COUNT(o.id), COALESCE(SUM(o.amount_cents),0) FROM customers c LEFT JOIN orders o ON o.customer_id=c.id AND o.status='paid' GROUP BY c.id ORDER BY c.id;",
    tests: [test(revenue([[1,"A"],[2,"B"],[3,"C"]],[[1,1,"paid",200],[2,1,"cancelled",500],[3,2,"paid",100]]),"1|1|200\n2|1|100\n3|0|0",true),test(revenue([[1,"A"],[2,"B"]],[]),"1|0|0\n2|0|0"),test(revenue([[3,"C"]],[[1,3,"cancelled",100]]),"3|0|0"),test(revenue([[1,"A"]],[[1,1,"paid",200],[2,1,"paid",200]]),"1|2|400"),test(revenue([[5,"Same"],[1,"Same"]],[[1,5,"paid",0]]),"1|0|0\n5|1|0"),test(revenue([],[]),"")],
  },
];
export async function ensureSqlLabs() {
  for (const lab of SQL_LABS) {
    let problem;
    try { problem = await prisma.problem.upsert({ where: { slug: lab.slug }, update: {}, create: { slug: lab.slug, title: lab.title, description: lab.description, difficulty: "MEDIUM", executionMode: "SQL", topics: ["SQL", "Backend"], patterns: [], companies: [], starterCode: { create: { language: "SQL", code: lab.starter } }, testCases: { create: lab.tests.map((t, orderIndex) => ({ ...t, orderIndex })) } }, include: { testCases: { orderBy: { orderIndex: "asc" } } } }); }
    catch (error) { if ((error as { code?: string }).code !== "P2002") { throw error; } problem = await prisma.problem.findUniqueOrThrow({ where: { slug: lab.slug }, include: { testCases: { orderBy: { orderIndex: "asc" } } } }); }
    if (problem.executionMode !== "SQL" || testSuiteHash(problem.testCases) !== testSuiteHash(lab.tests)) { throw Object.assign(new Error("A versioned SQL lab has changed. Restore its published test bank before continuing."), { statusCode: 409 }); }
  }
}
