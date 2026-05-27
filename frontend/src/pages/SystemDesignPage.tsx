import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

interface SDQuestion {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  planAccess: string;
  attempted: boolean;
  lastAttemptAt: string | null;
}

const CATEGORY_META: Record<string, { icon: string; color: string; glow: string }> = {
  scalability:   { icon: 'trending_up',  color: '#60a5fa', glow: 'rgba(96,165,250,0.15)' },
  database:      { icon: 'storage',      color: '#4ade80', glow: 'rgba(74,222,128,0.15)' },
  microservices: { icon: 'hub',          color: '#c084fc', glow: 'rgba(192,132,252,0.15)' },
  caching:       { icon: 'speed',        color: '#facc15', glow: 'rgba(250,204,21,0.15)' },
  messaging:     { icon: 'message',      color: '#fb923c', glow: 'rgba(251,146,60,0.15)' },
  api:           { icon: 'api',          color: '#22d3ee', glow: 'rgba(34,211,238,0.15)' },
};

const DIFF_STYLE: Record<string, { color: string; bg: string }> = {
  easy:   { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  medium: { color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

const STATIC_QUESTIONS: SDQuestion[] = [
  { id: '1',  slug: 'design-url-shortener',       title: 'Design a URL Shortener',              category: 'scalability',   difficulty: 'easy',   description: 'Design a system like bit.ly. Handle 100M URLs, 10B redirects/month, analytics, and custom aliases.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '2',  slug: 'design-twitter-feed',         title: 'Design Twitter/X Feed',               category: 'scalability',   difficulty: 'hard',   description: 'Design the Twitter news feed for 500M users. Handle fanout, hot users, timeline generation at scale.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '3',  slug: 'design-distributed-cache',    title: 'Design a Distributed Cache',          category: 'caching',       difficulty: 'medium', description: 'Design a distributed cache like Redis. Consistent hashing, eviction policies, replication, and failover.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '4',  slug: 'design-notification-system',  title: 'Design a Notification System',        category: 'messaging',     difficulty: 'medium', description: 'Design push/email/SMS notifications at scale. Delivery guarantees, deduplication, and rate limiting.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '5',  slug: 'design-ride-sharing',         title: 'Design a Ride-Sharing App',           category: 'scalability',   difficulty: 'hard',   description: 'Design Uber/Lyft. Location tracking, driver matching, surge pricing, and real-time dispatch.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
  { id: '6',  slug: 'design-relational-db',        title: 'Design a Relational Database Engine', category: 'database',      difficulty: 'hard',   description: 'Core concepts: B-tree indexes, WAL, MVCC, query planner, and buffer pool management.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
  { id: '7',  slug: 'design-api-gateway',          title: 'Design an API Gateway',               category: 'api',           difficulty: 'medium', description: 'Rate limiting, authentication, routing, load balancing, circuit breakers, and request aggregation.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '8',  slug: 'design-event-streaming',      title: 'Design an Event Streaming Platform',  category: 'messaging',     difficulty: 'hard',   description: 'Design Apache Kafka. Log-structured storage, consumer groups, partition assignment, and exactly-once semantics.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
  { id: '9',  slug: 'design-microservices-auth',   title: 'Authentication in Microservices',     category: 'microservices', difficulty: 'medium', description: 'JWT, OAuth2, service-to-service auth, API keys, mTLS, and secrets management at scale.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '10', slug: 'design-search-autocomplete',  title: 'Design Search Autocomplete',          category: 'scalability',   difficulty: 'medium', description: 'Trie-based and ML-based autocomplete. Serving 100K QPS with P99 < 100ms latency.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '11', slug: 'design-youtube',              title: 'Design YouTube / Video Platform',      category: 'scalability',   difficulty: 'hard',   description: 'Video upload, transcoding pipeline, CDN delivery, view counts, recommendations, and comment system at 2B users.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
  { id: '12', slug: 'design-web-crawler',          title: 'Design a Web Crawler',                category: 'scalability',   difficulty: 'hard',   description: 'Distributed crawling, URL deduplication, politeness, robots.txt, and building a search index from crawled pages.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
  { id: '13', slug: 'design-rate-limiter',         title: 'Design a Rate Limiter',               category: 'api',           difficulty: 'medium', description: 'Token bucket vs sliding window vs fixed window. Distributed rate limiting with Redis. Per-user, per-IP, and per-endpoint limits.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '14', slug: 'design-online-store',         title: 'Design an E-Commerce Platform',       category: 'database',      difficulty: 'hard',   description: 'Product catalog, inventory management, order processing, payment gateway integration, and flash sale handling.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
  { id: '15', slug: 'design-real-time-leaderboard',title: 'Design a Real-Time Leaderboard',      category: 'database',      difficulty: 'medium', description: 'Global rankings updated in real time for 10M users. Redis Sorted Sets, eventual consistency, and anti-cheat considerations.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '16', slug: 'design-cdn',                  title: 'Design a CDN',                        category: 'caching',       difficulty: 'hard',   description: 'Point-of-presence servers, cache invalidation, geo-routing, anycast, and origin shield architecture.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
  { id: '17', slug: 'design-chat-app',             title: 'Design a Chat Application',           category: 'messaging',     difficulty: 'medium', description: 'Real-time messaging with WebSockets, message ordering, read receipts, offline delivery, and group chats at WhatsApp scale.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '18', slug: 'design-service-mesh',         title: 'Design a Service Mesh',               category: 'microservices', difficulty: 'hard',   description: 'Sidecar proxy (Envoy), service discovery, mTLS, traffic shaping, circuit breaking, and observability for 500+ microservices.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
];

const CONCEPTS = [
  { title: 'CAP Theorem',                   desc: 'Consistency, Availability, Partition Tolerance trade-offs — in practice, choose CP or AP', icon: 'balance' },
  { title: 'Consistent Hashing',            desc: 'Distribute load across nodes with minimal key redistribution on topology changes', icon: 'join_inner' },
  { title: 'CQRS & Event Sourcing',         desc: 'Separate read/write models, rebuild state from immutable event log', icon: 'history' },
  { title: 'Rate Limiting',                 desc: 'Token bucket, leaky bucket, sliding window counter — trade precision for memory', icon: 'speed' },
  { title: 'Database Sharding',             desc: 'Horizontal partitioning strategies: hash, range, directory-based sharding', icon: 'grid_view' },
  { title: 'Circuit Breaker',               desc: 'Prevent cascading failures via CLOSED → OPEN → HALF_OPEN state machine', icon: 'electric_bolt' },
  { title: 'Read Replicas',                 desc: 'Route reads to replicas for horizontal read scaling; handle replication lag carefully', icon: 'content_copy' },
  { title: 'Write-Ahead Log',               desc: 'Append changes to WAL before applying — enables crash recovery and replication', icon: 'edit_note' },
  { title: 'Bloom Filter',                  desc: 'Probabilistic set membership: no false negatives, small false positive rate, O(1) space', icon: 'filter_alt' },
  { title: 'Long Polling vs SSE vs WebSocket', desc: 'Choose push mechanism based on direction (uni/bi), latency, and infrastructure', icon: 'sync_alt' },
  { title: 'Idempotency Keys',              desc: 'Prevent duplicate processing in distributed systems — retry-safe operations', icon: 'key' },
  { title: 'Two-Phase Commit',              desc: 'Distributed transaction protocol: prepare phase + commit phase with coordinator', icon: 'commit' },
];

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

export function SystemDesignPage() {
  const session = getSession();
  const { fireXP } = useUser();
  const [questions, setQuestions] = useState<SDQuestion[]>(STATIC_QUESTIONS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected] = useState<SDQuestion | null>(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState({ total: STATIC_QUESTIONS.length, attempted: 0 });

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<{ questions: SDQuestion[] }>('/system-design/questions', { token: session.accessToken })
      .then((d) => { if (d.questions.length > 0) setQuestions(d.questions); })
      .catch(() => {});
    apiRequest<{ total: number; attempted: number }>('/system-design/stats', { token: session.accessToken })
      .then(setStats)
      .catch(() => {});
  }, [session?.accessToken]);

  const cats = ['all', ...Object.keys(CATEGORY_META)];
  const filtered = activeCategory === 'all' ? questions : questions.filter((q) => q.category === activeCategory);

  const handleSubmit = async () => {
    if (!selected || !session?.accessToken || response.length < 10) return;
    setSubmitting(true);
    try {
      await apiRequest(`/system-design/questions/${selected.slug}/attempt`, {
        token: session.accessToken,
        method: 'POST',
        body: { response },
      });
      setSubmitted(true);
      setQuestions((prev) => prev.map((q) => q.id === selected.id ? { ...q, attempted: true, lastAttemptAt: new Date().toISOString() } : q));
      fireXP(40, 'System design response saved!');
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (selected) {
    const catMeta = CATEGORY_META[selected.category] ?? { icon: 'design_services', color: 'var(--t2)', glow: 'rgba(161,161,170,0.1)' };
    const diffStyle = DIFF_STYLE[selected.difficulty] ?? { color: 'var(--t2)', bg: 'rgba(161,161,170,0.1)' };
    return (
      <AppShell>
        <div className="pt-8 max-w-4xl mx-auto">
          <motion.button
            onClick={() => { setSelected(null); setResponse(''); setSubmitted(false); }}
            className="flex items-center gap-2 text-sm mb-8 transition-colors"
            style={{ color: 'var(--t2)' }}
            whileHover={{ color: 'rgba(255,255,255,0.8)', x: -2 }}
            transition={{ duration: 0.15 }}
          >
            <Icon name="arrow_back" size={16} />Back to questions
          </motion.button>

          <motion.div
            className="p-8 mb-6"
            style={GLASS}
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              style={{ height: 1, marginBottom: 28, background: `linear-gradient(90deg, transparent, ${catMeta.color}80 40%, ${catMeta.color}30 70%, transparent)` }}
            />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 flex items-center justify-center" style={{ background: catMeta.glow }}>
                <Icon name={catMeta.icon} size={22} style={{ color: catMeta.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: catMeta.color }}>{selected.category}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: diffStyle.color, background: diffStyle.bg }}>{selected.difficulty}</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>{selected.title}</h1>
              </div>
            </div>
            <p className="leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{selected.description}</p>
          </motion.div>

          {submitted ? (
            <motion.div
              className="p-8 text-center"
              style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Icon name="check_circle" size={40} filled style={{ color: '#4ade80' }} />
              <h3 className="text-xl font-bold mt-3 mb-2" style={{ color: '#4ade80' }}>Response Saved!</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Your system design response has been recorded. Review the reference approach and compare your solution.</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-sm underline" style={{ color: '#4ade80' }}>Write another attempt</button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="p-5" style={GLASS}>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <Icon name="tips_and_updates" size={16} style={{ color: '#facc15' }} />
                  Consider covering:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Requirements (functional & non-functional)', 'Capacity estimation', 'High-level architecture', 'Database schema', 'API design', 'Scalability & bottlenecks'].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      <Icon name="radio_button_unchecked" size={10} style={{ color: 'rgba(255,255,255,0.2)' }} />{t}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="sd-response" className="block text-sm font-bold mb-2" style={{ color: 'var(--t2)' }}>Your Design Response</label>
                <textarea
                  id="sd-response"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Start with requirements clarification, then capacity estimation, then architecture..."
                  rows={14}
                  className="w-full p-4 text-sm focus:outline-none resize-none font-mono"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.85)',
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.22)' }}>{response.length} characters</p>
              </div>
              <motion.button
                onClick={handleSubmit}
                disabled={submitting || response.length < 10}
                className="font-bold py-3 px-8 rounded-full flex items-center gap-2 disabled:opacity-40"
                style={{
                  background: 'linear-gradient(135deg, #E82127, #FF5566)',
                  color: 'white',
                  boxShadow: '0 4px 24px rgba(232,25,44,0.3)',
                }}
                whileHover={{ boxShadow: '0 4px 32px rgba(232,25,44,0.5)', scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {submitting ? <><Icon name="hourglass_empty" size={16} />Saving...</> : <><Icon name="save" size={16} />Save Response</>}
              </motion.button>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl">
        <PageHeader
          eyebrow="Architecture"
          title="System Design."
          subtitle="Scalability · Distributed Systems · Architecture Patterns"
          accentColor="#c084fc"
          stats={[
            { value: stats.total, label: 'Questions', color: '#c084fc' },
            { value: stats.attempted, label: 'Attempted' },
          ]}
        />

        {/* Core Concepts */}
        <section className="mb-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-5" style={{ color: 'rgba(255,255,255,0.22)' }}>Core Concepts</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CONCEPTS.map((c, i) => (
              <motion.div
                key={c.title}
                className="p-5 flex items-start gap-4"
                style={GLASS}
                initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(192,132,252,0.2)' }}
              >
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(192,132,252,0.1)' }}>
                  <Icon name={c.icon} size={18} style={{ color: '#c084fc' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{c.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Questions */}
        <section>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.22)' }}>Practice Questions</p>
            <div className="flex gap-1.5 flex-wrap">
              {cats.map((cat) => {
                const meta = CATEGORY_META[cat];
                const active = activeCategory === cat;
                let catBg: string;
                if (active) { catBg = meta ? `${meta.glow}` : 'rgba(255,255,255,0.08)'; } else { catBg = 'rgba(255,255,255,0.04)'; }
                let catBorder: string;
                if (active) { catBorder = `1px solid ${meta ? meta.color + '50' : 'rgba(255,255,255,0.25)'}`; } else { catBorder = '1px solid rgba(255,255,255,0.07)'; }
                let catColor: string;
                if (active) { catColor = meta ? meta.color : 'rgba(255,255,255,0.9)'; } else { catColor = 'rgba(255,255,255,0.32)'; }
                return (
                  <motion.button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      background: catBg,
                      border: catBorder,
                      color: catColor,
                      transition: 'all 0.15s',
                    }}
                  >
                    {cat}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((q, i) => {
              const catMeta = CATEGORY_META[q.category] ?? { icon: 'design_services', color: 'var(--t2)', glow: 'rgba(161,161,170,0.1)' };
              const diffStyle = DIFF_STYLE[q.difficulty] ?? { color: 'var(--t2)', bg: 'rgba(161,161,170,0.1)' };
              const locked = q.planAccess === 'pro' || q.planAccess === 'elite';
              return (
                <motion.button
                  key={q.id}
                  type="button"
                  disabled={locked}
                  onClick={() => setSelected(q)}
                  className="w-full text-left p-6"
                  style={{
                    ...GLASS,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    opacity: locked ? 0.5 : 1,
                    borderColor: q.attempted ? 'rgba(192,132,252,0.2)' : 'rgba(255,255,255,0.07)',
                  }}
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  whileInView={{ opacity: locked ? 0.5 : 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.4, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={locked ? {} : {
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: catMeta.color + '40',
                    boxShadow: `0 8px 32px ${catMeta.glow}`,
                    y: -2,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex items-center justify-center" style={{ background: catMeta.glow }}>
                        <Icon name={catMeta.icon} size={16} style={{ color: catMeta.color }} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: catMeta.color }}>{q.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {q.attempted && <Icon name="check_circle" size={16} filled style={{ color: '#c084fc' }} />}
                      {locked && <Icon name="lock" size={14} style={{ color: 'rgba(255,255,255,0.22)' }} />}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: diffStyle.color, background: diffStyle.bg }}>{q.difficulty}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: 'rgba(255,255,255,0.88)' }}>{q.title}</h3>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.38)' }}>{q.description}</p>
                  {q.lastAttemptAt && (
                    <p className="text-[10px] mt-3" style={{ color: 'rgba(255,255,255,0.22)' }}>Last attempted {new Date(q.lastAttemptAt).toLocaleDateString()}</p>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
