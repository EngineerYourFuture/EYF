# EYF Interactive Labs — Vision & Roadmap (Core Subjects, B2B/LMS)

> Captured 2026-07-04 from the founder's spec. This is a **major separate
> initiative**, NOT built. It is the premium LMS content that anchors college /
> corporate seat-licensing (Rs 1,800–8,000/seat/yr). Recorded here so it's
> plannable + pitchable; do not confuse with what's shipped.

## Thesis
Teach CS by **doing**, not slides: every concept has an interactive artifact the
student controls, breaks, fixes, and is then **certified** on (employer-verifiable).
"What happens when you run `ls -la`?" — traced live, not recited.

## Modules (from the spec)
1. **OS — Live Kernel Lab:** browser Linux terminal (v86/WASM), CPU scheduler
   studio (+ build-your-own), memory/paging labs (page-fault walkthrough, Belady),
   deadlock lab (RAG builder, Banker's), ext4/inode explorer, syscall tracer.
2. **DBMS — Engine Lab:** query-execution pipeline visualizer (AST→optimizer→
   plan→live rows), B/B+ tree live builder, txn/concurrency lab (anomalies, MVCC,
   2PL, serializability), PGlite (WASM Postgres) index playground, buffer-pool/WAL,
   normalization workshop.
3. **CN — Simulation Env:** topology builder (Packet-Tracer alt), protocol deep
   dives (TCP handshake/flow/congestion, DNS, HTTP/1.1-2-3, ARP), routing lab
   (Dijkstra/Bellman-Ford/BGP), Wireshark-like packet analyzer, subnet/VLSM, queuing.
4. **Cross-subject capstones:** "run `ls -la`", "open a website", "DB crash & recovery".
5. **Assessment:** concept-validation gates (demonstrate, not recall), proctored
   mastery exam (sandbox-graded), verifiable certs.
6. **B2B/LMS:** institution admin dashboard, faculty tools, placement-coordinator
   view, per-seat pricing, NAAC docs package.

## Realistic phasing (effort-ordered; each is a real project)
- **P0 (fits EYF now, cheap wins):** the pure-logic/SVG visualizers that need no
  WASM runtime — CPU scheduler studio, page-replacement battle, B/B+ tree animator,
  Dijkstra/Bellman-Ford routing, subnet calculator, deadlock RAG + Banker's,
  normalization/FD explorer. These are D3/Canvas + TS state machines — buildable
  incrementally in the existing stack, and already ~60% of the "wow".
- **P1 (heavier, real infra):** PGlite (WASM Postgres) for the index/EXPLAIN lab;
  the network packet simulator (custom TS TCP/IP); the concept gates + sandbox grading.
- **P2 (specialized/costly):** v86 WASM Linux terminal + syscall tracer + Valgrind;
  Docker/K8s premium terminal labs; live-lecture realtime; institution analytics.

## How it plugs into what's built
- Extends the existing **LMS wedge** (Organization/Course/Lesson already exist) —
  labs become the Course content; concept gates → the existing `Certificate` +
  `/verify` page; institution dashboard builds on the org portal.
- Stack: implement on **Next.js/Fastify/Prisma** (not the doc's Supabase/Vite);
  D3/Canvas/Framer already in the web app; Monaco already used.

## Honest cost note
The v86 terminal, PGlite plans, and packet simulator are each multi-week
specialist efforts. Recommend starting **P0 visualizers** to demo to placement
coordinators (proves the concept cheaply), and only funding P1/P2 once a college
LOI validates the seat-license demand.
