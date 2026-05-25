import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

type RoleKey = 'frontend' | 'backend' | 'fullstack' | 'genai' | 'data' | 'devops';

interface Month {
  title: string;
  weeks: string;
  focus: string[];
  resources: Array<{ label: string; path: string }>;
}

interface RoleTrack {
  key: RoleKey;
  title: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  tagline: string;
  avgCTC: string;
  hiringCompanies: string[];
  coreSkills: string[];
  interviewTopics: string[];
  projects: string[];
  months: Month[];
  indiaContext: string;
}

const ROLE_TRACKS: RoleTrack[] = [
  {
    key: 'frontend',
    title: 'Frontend Engineer',
    icon: 'web',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
    border: 'rgba(96,165,250,0.3)',
    tagline: 'Build the interfaces millions interact with',
    avgCTC: '₹8–30 LPA (India) · $90k–$180k (US)',
    hiringCompanies: ['Swiggy', 'Meesho', 'Razorpay', 'Atlassian', 'Flipkart', 'Google', 'Microsoft', 'Adobe'],
    coreSkills: ['HTML/CSS/JS', 'React', 'TypeScript', 'Performance Optimization', 'Accessibility', 'Testing'],
    interviewTopics: ['Event loop & closures', 'Virtual DOM & reconciliation', 'Browser APIs', 'CSS specificity', 'Debounce/Throttle', 'Web Vitals'],
    projects: ['Personal portfolio with animations', 'E-commerce product page (React)', 'Real-time dashboard with WebSocket'],
    indiaContext: 'High demand in product companies (Swiggy, Meesho, Razorpay, Groww). Service companies (TCS, Infosys) also hire Frontend devs — expect Angular/jQuery questions.',
    months: [
      {
        title: 'HTML, CSS, and Vanilla JS',
        weeks: 'Weeks 1–4',
        focus: ['Semantic HTML, accessibility (ARIA)', 'Flexbox, Grid, responsive design', 'DOM manipulation, events', 'Fetch API, Promises, async/await', 'Git & GitHub basics'],
        resources: [
          { label: 'Core Subjects → Networks', path: '/app/subjects/cn' },
          { label: 'Cheat Sheets', path: '/app/cheatsheets' },
        ],
      },
      {
        title: 'React, TypeScript, and State',
        weeks: 'Weeks 5–8',
        focus: ['React 19: hooks, context, refs', 'TypeScript fundamentals', 'State management (Zustand/Redux Toolkit)', 'React Router v7', 'REST API integration', 'Jest + React Testing Library'],
        resources: [
          { label: 'Playground → React examples', path: '/app/playground' },
          { label: 'Skill Assessment: React', path: '/app/assessments' },
        ],
      },
      {
        title: 'Performance, Interviews, and Projects',
        weeks: 'Weeks 9–12',
        focus: ['Core Web Vitals, Lighthouse', 'Code splitting, lazy loading', 'DSA (arrays, strings, hashmaps)', 'System Design: CDN, caching, BFF', 'Mock frontend interviews', 'Build + deploy portfolio project'],
        resources: [
          { label: 'DSA Problems', path: '/app/problems' },
          { label: 'System Design', path: '/app/system-design' },
          { label: 'Mock Interview', path: '/app/mock-interview' },
        ],
      },
    ],
  },
  {
    key: 'backend',
    title: 'Backend Engineer',
    icon: 'dns',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.1)',
    border: 'rgba(74,222,128,0.3)',
    tagline: 'Build the servers, APIs, and data pipelines',
    avgCTC: '₹10–35 LPA (India) · $100k–$200k (US)',
    hiringCompanies: ['Zepto', 'PhonePe', 'Paytm', 'Infosys', 'TCS', 'Amazon', 'Uber', 'Stripe'],
    coreSkills: ['Node.js / Python / Java', 'REST & GraphQL APIs', 'PostgreSQL / MongoDB', 'Redis caching', 'Message queues', 'Docker'],
    interviewTopics: ['Database indexing', 'N+1 problem', 'Rate limiting', 'Authentication (JWT/OAuth)', 'Caching strategies', 'SQL query optimization'],
    projects: ['REST API with auth & rate limiting', 'Real-time chat with WebSocket', 'Event-driven order system with queues'],
    indiaContext: 'Backend roles dominate India hiring. TCS, Infosys, Wipro hire 50k+ backend devs/year. Product companies (Zepto, PhonePe) pay 3–5× more and ask harder system design.',
    months: [
      {
        title: 'APIs, Databases, and Data Modeling',
        weeks: 'Weeks 1–4',
        focus: ['HTTP fundamentals, REST design', 'SQL: joins, indexes, transactions', 'ORMs (Prisma / SQLAlchemy)', 'Authentication: JWT, sessions, OAuth2', 'Environment variables & secrets management'],
        resources: [
          { label: 'Core Subjects → DBMS', path: '/app/subjects/dbms' },
          { label: 'Skill Assessment: SQL', path: '/app/assessments' },
        ],
      },
      {
        title: 'Scale, Caching, and Queues',
        weeks: 'Weeks 5–8',
        focus: ['Redis: caching, pub/sub, distributed locks', 'Message queues (RabbitMQ / Kafka basics)', 'API rate limiting & throttling', 'Error handling & observability (logs/metrics)', 'Docker & containerization'],
        resources: [
          { label: 'Real-World Challenges → Rate Limiter', path: '/app/real-world' },
          { label: 'System Design', path: '/app/system-design' },
        ],
      },
      {
        title: 'DSA, System Design, and Interviews',
        weeks: 'Weeks 9–12',
        focus: ['DSA: trees, graphs, DP, sorting', 'System design: URL shortener, WhatsApp, Uber', 'OOP & design patterns', 'Cybersecurity: OWASP Top 10', 'Mock backend interviews', 'Portfolio API project'],
        resources: [
          { label: 'DSA Problems', path: '/app/problems' },
          { label: 'OOP & Patterns', path: '/app/oop' },
          { label: 'Cybersecurity', path: '/app/cybersecurity' },
        ],
      },
    ],
  },
  {
    key: 'fullstack',
    title: 'Fullstack Engineer',
    icon: 'layers',
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.1)',
    border: 'rgba(192,132,252,0.3)',
    tagline: 'Own the complete product — frontend to database',
    avgCTC: '₹12–40 LPA (India) · $110k–$220k (US)',
    hiringCompanies: ['Razorpay', 'Freshworks', 'Postman', 'Atlassian', 'Notion', 'Linear', 'Vercel', 'GitHub'],
    coreSkills: ['React + TypeScript', 'Node.js / Next.js', 'PostgreSQL', 'API design', 'CI/CD', 'Testing'],
    interviewTopics: ['SPA vs SSR vs SSG', 'Database schema design', 'Authentication flow', 'State management trade-offs', 'React performance', 'API security'],
    projects: ['SaaS starter (auth, billing, dashboard)', 'Real-time collaborative app', 'Full-stack e-commerce (Next.js)'],
    indiaContext: 'Highly valued at startups and product companies. Freshworks, Razorpay, Postman prefer fullstack engineers who can ship end-to-end. Most common role at Series A/B startups.',
    months: [
      {
        title: 'Frontend Foundation + Backend Basics',
        weeks: 'Weeks 1–5',
        focus: ['React + TypeScript (hooks, router)', 'Node.js + Express REST API', 'PostgreSQL schema design', 'JWT auth end-to-end', 'Environment setup & Git workflow'],
        resources: [
          { label: 'Core Subjects → DBMS', path: '/app/subjects/dbms' },
          { label: 'Playground', path: '/app/playground' },
        ],
      },
      {
        title: 'Integration, Testing, and DevOps',
        weeks: 'Weeks 6–9',
        focus: ['Frontend ↔ Backend API integration', 'React Testing Library + Supertest', 'Docker Compose (app + DB)', 'GitHub Actions CI/CD pipeline', 'Error boundaries & observability'],
        resources: [
          { label: 'Real-World Challenges', path: '/app/real-world' },
          { label: 'System Design', path: '/app/system-design' },
        ],
      },
      {
        title: 'Scale, DSA, and Interview Prep',
        weeks: 'Weeks 10–14',
        focus: ['Redis caching + CDN', 'DSA: medium-hard problems', 'System design interviews', 'OOP patterns in practice', 'Full-stack project: Ship to production', 'Mock fullstack interview × 3'],
        resources: [
          { label: 'DSA Problems', path: '/app/problems' },
          { label: 'Mock Interview', path: '/app/mock-interview' },
          { label: 'OOP & Patterns', path: '/app/oop' },
        ],
      },
    ],
  },
  {
    key: 'genai',
    title: 'GenAI Engineer',
    icon: 'auto_awesome',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.3)',
    tagline: 'Build with LLMs, RAG, and agentic systems',
    avgCTC: '₹18–60 LPA (India) · $150k–$300k (US)',
    hiringCompanies: ['Anthropic', 'OpenAI', 'Sarvam AI', 'Krutrim', 'Microsoft', 'Google DeepMind', 'Fractal', 'MuSigma'],
    coreSkills: ['Python', 'LLM APIs (Claude/GPT)', 'RAG + vector databases', 'LangChain / LlamaIndex', 'Prompt engineering', 'Fine-tuning basics'],
    interviewTopics: ['Transformer architecture', 'RAG vs fine-tuning', 'Prompt injection attacks', 'Hallucination mitigation', 'Agent loops', 'Embedding distance metrics'],
    projects: ['RAG-powered knowledge base', 'AI coding assistant (Claude API)', 'Multi-agent document analysis pipeline'],
    indiaContext: 'Explosive growth in 2024–2026. Sarvam AI, Krutrim, and Bhashini are building India-first LLMs. US companies pay 2–4× base + equity. Strong Python + ML math required.',
    months: [
      {
        title: 'Python, APIs, and LLM Basics',
        weeks: 'Weeks 1–4',
        focus: ['Python: list comp, generators, async', 'REST API calls with httpx', 'Claude / OpenAI API: completions, tools', 'Prompt engineering: zero-shot, few-shot, CoT', 'Structured output: JSON mode, tool use'],
        resources: [
          { label: 'Playground → Python examples', path: '/app/playground' },
          { label: 'Skill Assessment: Python', path: '/app/assessments' },
        ],
      },
      {
        title: 'RAG, Embeddings, and Vector DBs',
        weeks: 'Weeks 5–8',
        focus: ['Text embeddings & cosine similarity', 'Vector databases (Pinecone / Chroma / pgvector)', 'Chunking strategies for documents', 'Retrieval-augmented generation pipeline', 'Evaluation: faithfulness, relevance, groundedness'],
        resources: [
          { label: 'Core Subjects → DBMS', path: '/app/subjects/dbms' },
          { label: 'System Design', path: '/app/system-design' },
        ],
      },
      {
        title: 'Agents, Safety, and Production',
        weeks: 'Weeks 9–13',
        focus: ['Agent loops: tool use, self-reflection', 'MCP servers & function calling', 'Prompt injection & jailbreak defenses', 'LLM observability (Langfuse/Braintrust)', 'Ship: deploy RAG app with auth + rate limiting', 'GenAI interview prep'],
        resources: [
          { label: 'Cybersecurity', path: '/app/cybersecurity' },
          { label: 'Real-World Challenges', path: '/app/real-world' },
          { label: 'Mock Interview', path: '/app/mock-interview' },
        ],
      },
    ],
  },
  {
    key: 'data',
    title: 'Data Analyst / Data Engineer',
    icon: 'bar_chart',
    color: '#22d3ee',
    bg: 'rgba(34,211,238,0.1)',
    border: 'rgba(34,211,238,0.3)',
    tagline: 'Turn raw data into business decisions',
    avgCTC: '₹7–25 LPA (India) · $80k–$160k (US)',
    hiringCompanies: ['Walmart', 'Amazon', 'Juspay', 'CRED', 'Dunzo', 'Deloitte', 'EY', 'McKinsey'],
    coreSkills: ['SQL (advanced)', 'Python (pandas, numpy)', 'ETL / data pipelines', 'Tableau / Looker', 'Statistics', 'dbt / Airflow'],
    interviewTopics: ['Window functions', 'Query optimization', 'Data modeling (star schema)', 'A/B test analysis', 'Pandas operations', 'Business metric design'],
    projects: ['Sales funnel analysis dashboard', 'ETL pipeline with dbt + Airflow', 'A/B test significance calculator'],
    indiaContext: 'High demand in consulting (Deloitte, EY), e-commerce (Flipkart, Meesho), and fintech (CRED, Juspay). SQL fluency is the #1 filter. Analytics engineering (dbt) is the fastest-growing specialization.',
    months: [
      {
        title: 'SQL and Data Fundamentals',
        weeks: 'Weeks 1–4',
        focus: ['SQL: SELECT, JOINs, GROUP BY', 'Window functions: RANK, LEAD, LAG, PARTITION', 'Query optimization: EXPLAIN, indexes', 'Data modeling: star/snowflake schemas', 'Statistics: mean, median, std dev, correlation'],
        resources: [
          { label: 'Core Subjects → DBMS', path: '/app/subjects/dbms' },
          { label: 'Skill Assessment: SQL', path: '/app/assessments' },
          { label: 'Playground → SQL', path: '/app/playground' },
        ],
      },
      {
        title: 'Python, pandas, and ETL',
        weeks: 'Weeks 5–8',
        focus: ['pandas: groupby, merge, pivot, apply', 'matplotlib + seaborn visualization', 'Data cleaning: nulls, duplicates, type casting', 'ETL pipeline design', 'dbt basics: models, tests, documentation'],
        resources: [
          { label: 'Playground → Python examples', path: '/app/playground' },
          { label: 'Skill Assessment: Python', path: '/app/assessments' },
        ],
      },
      {
        title: 'Business Analysis and Interview Prep',
        weeks: 'Weeks 9–12',
        focus: ['A/B testing: p-value, power, significance', 'Metric design: DAU, retention, LTV, CAC', 'Case studies: product sense + data stories', 'Dashboard in Looker / Tableau / Metabase', 'Mock data analyst interviews', 'Capstone: full end-to-end analysis project'],
        resources: [
          { label: 'Real-World Challenges', path: '/app/real-world' },
          { label: 'Mock Interview', path: '/app/mock-interview' },
        ],
      },
    ],
  },
  {
    key: 'devops',
    title: 'DevOps / SRE',
    icon: 'cloud',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.1)',
    border: 'rgba(251,146,60,0.3)',
    tagline: 'Ship fast, stay reliable, scale infinitely',
    avgCTC: '₹12–40 LPA (India) · $120k–$220k (US)',
    hiringCompanies: ['Cloudflare', 'Hetzner', 'Razorpay', 'Ola', 'HDFC Bank', 'Infosys', 'Google SRE', 'Datadog'],
    coreSkills: ['Linux / Bash', 'Docker + Kubernetes', 'CI/CD (GitHub Actions)', 'Terraform (IaC)', 'Prometheus + Grafana', 'Incident response'],
    interviewTopics: ['Container orchestration', 'SLOs / SLAs / error budgets', 'Blue-green vs canary deploys', 'Distributed tracing', 'On-call & incident management', 'Networking: TCP, DNS, load balancers'],
    projects: ['Kubernetes deployment with auto-scaling', 'Full CI/CD pipeline from scratch', 'Monitoring stack: Prometheus + Grafana + alerts'],
    indiaContext: 'Cloud adoption is accelerating across Indian banks, telcos, and unicorns. AWS/GCP certified DevOps engineers earn 40–60% more. SRE at Google/Meta is one of the highest-paid engineering roles in India offices.',
    months: [
      {
        title: 'Linux, Networking, and Containers',
        weeks: 'Weeks 1–4',
        focus: ['Linux: file system, processes, permissions', 'Bash scripting: loops, functions, pipes', 'Networking: TCP/IP, DNS, HTTP, load balancers', 'Docker: images, containers, compose', 'Dockerfile best practices & layer caching'],
        resources: [
          { label: 'Core Subjects → OS', path: '/app/subjects/os' },
          { label: 'Core Subjects → Networks', path: '/app/subjects/cn' },
          { label: 'Cybersecurity', path: '/app/cybersecurity' },
        ],
      },
      {
        title: 'Kubernetes, CI/CD, and IaC',
        weeks: 'Weeks 5–8',
        focus: ['Kubernetes: pods, deployments, services, ingress', 'Helm charts for app packaging', 'GitHub Actions: build, test, deploy pipelines', 'Terraform: provision AWS/GCP infra as code', 'Secrets management: Vault / AWS Secrets Manager'],
        resources: [
          { label: 'System Design', path: '/app/system-design' },
          { label: 'Real-World Challenges', path: '/app/real-world' },
        ],
      },
      {
        title: 'Observability, SRE, and Interview',
        weeks: 'Weeks 9–12',
        focus: ['Prometheus + Grafana metrics & alerts', 'Distributed tracing with OpenTelemetry', 'SLOs, error budgets, blameless postmortems', 'Incident management: on-call rotations, runbooks', 'Mock SRE/DevOps interviews', 'Capstone: full production-grade deploy'],
        resources: [
          { label: 'Mock Interview', path: '/app/mock-interview' },
          { label: 'System Design → CDN, Load Balancing', path: '/app/system-design' },
        ],
      },
    ],
  },
];

export function CareerPathPage() {
  const { fireXP } = useUser();
  const [selectedRole, setSelectedRole] = useState<RoleKey>('backend');
  const [savedRole, setSavedRole] = useState<RoleKey | null>(() => {
    const stored = localStorage.getItem('eyf.career.role');
    return stored as RoleKey | null;
  });
  const [activeMonth, setActiveMonth] = useState(0);

  const role = ROLE_TRACKS.find((r) => r.key === selectedRole)!;

  const saveRole = () => {
    localStorage.setItem('eyf.career.role', selectedRole);
    setSavedRole(selectedRole);
    fireXP(15, 'Career track selected!');
  };

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1 }}>
                <span style={{ background: 'linear-gradient(135deg, #fff 40%, #E82127)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CAREER TRACKS.</span>
              </h1>
              <p style={{ color: '#71717a', maxWidth: 480 }}>Pick your engineering role. Get a week-by-week curriculum, company targets, and direct links to every resource you need on EYF.</p>
            </motion.div>
            {savedRole && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 14 }}
              >
                <Icon name="check_circle" size={16} style={{ color: '#4ade80' }} />
                <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 700 }}>Your track: {ROLE_TRACKS.find((r) => r.key === savedRole)?.title}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" style={{ marginBottom: 40 }}>
          {ROLE_TRACKS.map((r, i) => (
            <motion.button
              key={r.key}
              type="button"
              onClick={() => { setSelectedRole(r.key); setActiveMonth(0); }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={selectedRole === r.key ? {
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, borderRadius: 20, textAlign: 'center',
                background: r.bg, border: `1px solid ${r.border}`, cursor: 'pointer', boxShadow: `0 0 24px ${r.bg}`,
              } : {
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, borderRadius: 20, textAlign: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedRole === r.key ? r.bg : 'rgba(255,255,255,0.06)' }}>
                <Icon name={r.icon} size={20} style={{ color: selectedRole === r.key ? r.color : '#71717a' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.3, color: selectedRole === r.key ? '#fff' : '#71717a' }}>{r.title}</span>
              {savedRole === r.key && <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 700 }}>★ Saved</span>}
            </motion.button>
          ))}
        </div>

        {/* Role detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ marginBottom: 32 }}>
          {/* Left: role info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Header card */}
            <motion.div
              key={role.key}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ padding: 24, borderRadius: 20, background: role.bg, border: `1px solid ${role.border}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: role.bg, border: `1px solid ${role.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={role.icon} size={24} style={{ color: role.color }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{role.title}</h2>
                  <p style={{ fontSize: 12, fontWeight: 700, color: role.color }}>{role.tagline}</p>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#71717a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Avg CTC</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{role.avgCTC}</p>
              </div>
              {savedRole === selectedRole ? (
                <div style={{ marginTop: 16, width: '100%', padding: '10px 0', borderRadius: 12, fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                  ✓ Your current track
                </div>
              ) : (
                <motion.button
                  onClick={saveRole}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ marginTop: 16, width: '100%', padding: '10px 0', borderRadius: 12, fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', background: role.bg, color: role.color, border: `1px solid ${role.border}`, cursor: 'pointer' }}
                >
                  Set as My Track
                </motion.button>
              )}
            </motion.div>

            {/* Core skills */}
            <motion.div key={`${role.key}-skills`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ ...GLASS, padding: 20, borderRadius: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', marginBottom: 12 }}>Core Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                {role.coreSkills.map((s) => (
                  <span key={s} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12, color: '#d4d4d8', fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </motion.div>

            {/* Interview topics */}
            <motion.div key={`${role.key}-topics`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ ...GLASS, padding: 20, borderRadius: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', marginBottom: 12 }}>Interview Topics</p>
              <ul className="space-y-1.5">
                {role.interviewTopics.map((t) => (
                  <li key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#a1a1aa' }}>
                    <Icon name="arrow_right" size={14} style={{ color: role.color, marginTop: 2, flexShrink: 0 }} />
                    {t}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Companies hiring */}
            <motion.div key={`${role.key}-hiring`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }} style={{ ...GLASS, padding: 20, borderRadius: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', marginBottom: 12 }}>Who's Hiring</p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                {role.hiringCompanies.map((c) => (
                  <span key={c} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>{c}</span>
                ))}
              </div>
            </motion.div>

            {/* Projects to build */}
            <motion.div key={`${role.key}-projects`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} style={{ ...GLASS, padding: 20, borderRadius: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', marginBottom: 12 }}>Projects to Build</p>
              <ul className="space-y-2">
                {role.projects.map((p, i) => (
                  <li key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#a1a1aa' }}>
                    <span style={{ fontWeight: 900, fontSize: 12, color: role.color, marginTop: 2, flexShrink: 0 }}>{i + 1}.</span>
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* India context */}
            <motion.div key={`${role.key}-india`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} style={{ padding: 20, borderRadius: 20, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🇮🇳</span>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fbbf24' }}>India Placement Context</p>
              </div>
              <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.6 }}>{role.indiaContext}</p>
            </motion.div>
          </div>

          {/* Right: curriculum */}
          <div className="lg:col-span-2">
            <motion.div key={`${role.key}-curriculum`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ ...GLASS, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Week-by-Week Curriculum</h3>
                <p style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>Structured {role.months.length * 4}-week path from zero to interview-ready</p>
              </div>

              {/* Month tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {role.months.map((month, i) => (
                  <button
                    key={month.title}
                    type="button"
                    onClick={() => setActiveMonth(i)}
                    style={{
                      flex: 1, padding: '12px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', background: 'transparent',
                      color: activeMonth === i ? role.color : '#52525b',
                      borderBottom: activeMonth === i ? `2px solid ${role.color}` : '2px solid transparent',
                    }}
                  >
                    Month {i + 1}
                  </button>
                ))}
              </div>

              {/* Month content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${role.key}-month-${activeMonth}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{ padding: 24 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h4 style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{role.months[activeMonth].title}</h4>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: role.bg, color: role.color }}>{role.months[activeMonth].weeks}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#52525b', marginBottom: 24 }}>Focus areas for {role.months[activeMonth].weeks.toLowerCase()}</p>

                  <ul className="space-y-3" style={{ marginBottom: 32 }}>
                    {role.months[activeMonth].focus.map((item, i) => (
                      <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: role.bg, border: `1px solid ${role.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 900, color: role.color }}>{i + 1}</span>
                        </div>
                        <span style={{ fontSize: 14, color: '#d4d4d8' }}>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Platform resources for this month */}
                  <div style={{ paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b', marginBottom: 12 }}>Study on EYF This Month</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                      {role.months[activeMonth].resources.map((res) => (
                        <Link
                          key={res.path}
                          to={res.path}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 12, border: `1px solid ${role.border}`, fontSize: 12, fontWeight: 700, background: role.bg, color: role.color }}
                        >
                          <Icon name="arrow_forward" size={12} />
                          {res.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                    <motion.button
                      type="button"
                      onClick={() => setActiveMonth((m) => Math.max(0, m - 1))}
                      disabled={activeMonth === 0}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#a1a1aa', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: activeMonth === 0 ? 0.3 : 1 }}
                    >
                      <Icon name="chevron_left" size={14} /> Prev Month
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setActiveMonth((m) => Math.min(role.months.length - 1, m + 1))}
                      disabled={activeMonth === role.months.length - 1}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: role.bg, color: role.color, border: `1px solid ${role.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: activeMonth === role.months.length - 1 ? 0.3 : 1 }}
                    >
                      Next Month <Icon name="chevron_right" size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Quick links to company prep */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ ...GLASS, padding: 20, borderRadius: 20, marginTop: 16 }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b', marginBottom: 12 }}>Jump to Targeted Prep</p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 12 }}>
                {[
                  { to: '/app/companies', icon: 'business', label: 'Company Prep' },
                  { to: '/app/readiness', icon: 'speed', label: 'Readiness Score' },
                  { to: '/app/roadmap', icon: 'map', label: 'Interview Roadmap' },
                  { to: '/app/mock-interview', icon: 'record_voice_over', label: 'Mock Interview' },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 12, fontSize: 12, fontWeight: 700, color: '#d4d4d8', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <Icon name={link.icon} size={13} />
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
