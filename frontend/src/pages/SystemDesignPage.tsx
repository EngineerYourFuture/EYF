import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

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

const CATEGORY_META: Record<string, { icon: string; color: string; bg: string }> = {
  scalability:   { icon: 'trending_up', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  database:      { icon: 'storage', color: 'text-green-400', bg: 'bg-green-500/10' },
  microservices: { icon: 'hub', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  caching:       { icon: 'speed', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  messaging:     { icon: 'message', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  api:           { icon: 'api', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
};

const STATIC_QUESTIONS: SDQuestion[] = [
  { id: '1', slug: 'design-url-shortener', title: 'Design a URL Shortener', category: 'scalability', difficulty: 'easy', description: 'Design a system like bit.ly. Handle 100M URLs, 10B redirects/month, analytics, and custom aliases.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '2', slug: 'design-twitter-feed', title: 'Design Twitter/X Feed', category: 'scalability', difficulty: 'hard', description: 'Design the Twitter news feed for 500M users. Handle fanout, hot users, timeline generation at scale.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '3', slug: 'design-distributed-cache', title: 'Design a Distributed Cache', category: 'caching', difficulty: 'medium', description: 'Design a distributed cache like Redis. Consistent hashing, eviction policies, replication, and failover.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '4', slug: 'design-notification-system', title: 'Design a Notification System', category: 'messaging', difficulty: 'medium', description: 'Design push/email/SMS notifications at scale. Delivery guarantees, deduplication, and rate limiting.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '5', slug: 'design-ride-sharing', title: 'Design a Ride-Sharing App', category: 'scalability', difficulty: 'hard', description: 'Design Uber/Lyft. Location tracking, driver matching, surge pricing, and real-time dispatch.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
  { id: '6', slug: 'design-relational-db', title: 'Design a Relational Database Engine', category: 'database', difficulty: 'hard', description: 'Core concepts: B-tree indexes, WAL, MVCC, query planner, and buffer pool management.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
  { id: '7', slug: 'design-api-gateway', title: 'Design an API Gateway', category: 'api', difficulty: 'medium', description: 'Rate limiting, authentication, routing, load balancing, circuit breakers, and request aggregation.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '8', slug: 'design-event-streaming', title: 'Design an Event Streaming Platform', category: 'messaging', difficulty: 'hard', description: 'Design Apache Kafka. Log-structured storage, consumer groups, partition assignment, and exactly-once semantics.', planAccess: 'pro', attempted: false, lastAttemptAt: null },
  { id: '9', slug: 'design-microservices-auth', title: 'Authentication in Microservices', category: 'microservices', difficulty: 'medium', description: 'JWT, OAuth2, service-to-service auth, API keys, mTLS, and secrets management at scale.', planAccess: 'free', attempted: false, lastAttemptAt: null },
  { id: '10', slug: 'design-search-autocomplete', title: 'Design Search Autocomplete', category: 'scalability', difficulty: 'medium', description: 'Trie-based and ML-based autocomplete. Serving 100K QPS with P99 < 100ms latency.', planAccess: 'free', attempted: false, lastAttemptAt: null },
];

const CONCEPTS = [
  { title: 'CAP Theorem', desc: 'Consistency, Availability, Partition Tolerance trade-offs in distributed systems', icon: 'balance' },
  { title: 'Consistent Hashing', desc: 'Distribute load across nodes with minimal key redistribution on topology changes', icon: 'join_inner' },
  { title: 'CQRS & Event Sourcing', desc: 'Separate read/write models, rebuild state from immutable event log', icon: 'history' },
  { title: 'Rate Limiting', desc: 'Token bucket, leaky bucket, sliding window algorithms and implementations', icon: 'speed' },
  { title: 'Database Sharding', desc: 'Horizontal partitioning strategies: hash, range, directory-based sharding', icon: 'grid_view' },
  { title: 'Circuit Breaker', desc: 'Prevent cascading failures in distributed systems with automatic recovery', icon: 'electric_bolt' },
];

const DIFF_COLOR: Record<string, string> = {
  easy: 'text-green-400 bg-green-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  hard: 'text-red-400 bg-red-500/10',
};

export function SystemDesignPage() {
  const session = getSession();
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
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (selected) {
    const catMeta = CATEGORY_META[selected.category] ?? { icon: 'design_services', color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
    return (
      <AppShell>
        <div className="pt-8 max-w-4xl mx-auto">
          <button onClick={() => { setSelected(null); setResponse(''); setSubmitted(false); }}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
            <Icon name="arrow_back" size={16} />Back to questions
          </button>
          <div className="bg-surface-container rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 ${catMeta.bg} rounded-xl flex items-center justify-center`}>
                <Icon name={catMeta.icon} className={catMeta.color} size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${catMeta.color}`}>{selected.category}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[selected.difficulty]}`}>{selected.difficulty}</span>
                </div>
                <h1 className="text-2xl font-bold">{selected.title}</h1>
              </div>
            </div>
            <p className="text-on-surface-variant leading-relaxed">{selected.description}</p>
          </div>

          {submitted ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center">
              <Icon name="check_circle" className="text-green-400 mb-3" size={40} filled />
              <h3 className="text-xl font-bold mb-2 text-green-400">Response Saved!</h3>
              <p className="text-on-surface-variant text-sm">Your system design response has been recorded. Review the reference approach and compare your solution.</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-green-400 hover:underline">Write another attempt</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-surface-container rounded-xl p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Icon name="tips_and_updates" className="text-yellow-400" size={16} />
                  Consider covering:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-on-surface-variant">
                  {['Requirements (functional & non-functional)', 'Capacity estimation', 'High-level architecture', 'Database schema', 'API design', 'Scalability & bottlenecks'].map((t) => (
                    <div key={t} className="flex items-center gap-1"><Icon name="radio_button_unchecked" size={10} className="text-zinc-600" />{t}</div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-on-surface-variant">Your Design Response</label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Start with requirements clarification, then capacity estimation, then architecture..."
                  rows={14}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:border-primary-container/40 resize-none font-mono"
                />
                <p className="text-xs text-zinc-500 mt-1">{response.length} characters</p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || response.length < 10}
                className="bg-primary-container text-white font-bold py-3 px-8 rounded-full hover:brightness-110 transition-all disabled:opacity-40 flex items-center gap-2"
              >
                {submitting ? <><Icon name="hourglass_empty" size={16} />Saving...</> : <><Icon name="save" size={16} />Save Response</>}
              </button>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="mb-10 p-10 bg-surface-container rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/5 blur-[80px] rounded-full -mr-20 -mt-20" />
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Icon name="architecture" className="text-purple-400" size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter">System Design</h1>
              <p className="text-on-surface-variant text-sm mt-0.5">Scalability · Distributed Systems · Architecture Patterns</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">Total Questions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="border-l border-outline-variant/20 pl-6">
              <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">Attempted</p>
              <p className="text-2xl font-bold text-purple-400">{stats.attempted}</p>
            </div>
          </div>
        </div>

        {/* Core Concepts */}
        <section className="mb-10">
          <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-on-surface-variant/60 mb-5 ml-1">Core Concepts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONCEPTS.map((c) => (
              <div key={c.title} className="bg-surface-container rounded-xl p-5 flex items-start gap-4 hover:bg-surface-container-high transition-colors">
                <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name={c.icon} className="text-purple-400" size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1">{c.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Questions */}
        <section>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-on-surface-variant/60 ml-1">Practice Questions</h2>
            <div className="flex gap-2 flex-wrap">
              {cats.map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      activeCategory === cat
                        ? `${meta?.bg ?? 'bg-zinc-500/10'} ${meta?.color ?? 'text-zinc-300'} border-current/30`
                        : 'text-zinc-500 border-zinc-800/50 hover:text-zinc-300'
                    }`}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((q) => {
              const catMeta = CATEGORY_META[q.category] ?? { icon: 'design_services', color: 'text-zinc-400', bg: 'bg-zinc-500/10' };
              const locked = q.planAccess === 'pro' || q.planAccess === 'elite';
              return (
                <div key={q.id}
                  className={`bg-surface-container rounded-xl p-6 transition-all ${locked ? 'opacity-60' : 'hover:bg-surface-container-high cursor-pointer'} ${q.attempted ? 'border border-purple-500/20' : ''}`}
                  onClick={() => !locked && setSelected(q)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${catMeta.bg} rounded-lg flex items-center justify-center`}>
                        <Icon name={catMeta.icon} className={catMeta.color} size={16} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${catMeta.color}`}>{q.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {q.attempted && <Icon name="check_circle" className="text-purple-400" size={16} filled />}
                      {locked && <Icon name="lock" className="text-zinc-600" size={14} />}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[q.difficulty]}`}>{q.difficulty}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold mb-2">{q.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{q.description}</p>
                  {q.lastAttemptAt && (
                    <p className="text-[10px] text-zinc-600 mt-3">Last attempted {new Date(q.lastAttemptAt).toLocaleDateString()}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
