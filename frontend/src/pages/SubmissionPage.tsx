import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

interface Submission {
  id: string;
  problemTitle?: string;
  problemId?: string;
  verdict: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error';
  language: string;
  runtime?: string;
  memory?: string;
  code?: string;
  createdAt: string;
  xpEarned?: number;
}

interface SubmissionsResponse {
  items: Submission[];
}

const VERDICT_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  accepted:              { label: 'Accepted',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   icon: 'check_circle' },
  wrong_answer:          { label: 'Wrong Answer', color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: 'cancel' },
  time_limit_exceeded:   { label: 'TLE',          color: '#facc15', bg: 'rgba(250,204,21,0.1)',  icon: 'timer_off' },
  memory_limit_exceeded: { label: 'MLE',          color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  icon: 'memory' },
  runtime_error:         { label: 'Runtime Error', color: '#f472b6', bg: 'rgba(244,114,182,0.1)', icon: 'error' },
  compilation_error:     { label: 'Compile Error', color: 'var(--t2)', bg: 'rgba(161,161,170,0.1)', icon: 'code_off' },
};

const DEFAULT_VERDICT_META = { label: 'Unknown', color: 'var(--t2)', bg: 'rgba(161,161,170,0.1)', icon: 'help' };

const LANG_COLORS: Record<string, { color: string; bg: string }> = {
  python:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  javascript: { color: '#facc15', bg: 'rgba(250,204,21,0.1)'  },
  typescript: { color: '#93c5fd', bg: 'rgba(147,197,253,0.1)' },
  java:       { color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  cpp:        { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)'  },
  go:         { color: '#67e8f9', bg: 'rgba(103,232,249,0.1)' },
  rust:       { color: '#fdba74', bg: 'rgba(253,186,116,0.1)' },
};
const DEFAULT_LANG = { color: 'var(--t2)', bg: 'rgba(161,161,170,0.1)' };

export function SubmissionPage() {
  const session = getSession();
  const { submissionId } = useParams<{ submissionId?: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<SubmissionsResponse>('/submissions', { token: session.accessToken })
      .then((d) => setSubmissions(d.items ?? []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  useEffect(() => {
    if (submissionId && submissions.length > 0) {
      const found = submissions.find((s) => s.id === submissionId);
      if (found) { setSelected(found); setShowCode(true); }
    }
  }, [submissionId, submissions]);

  const acceptedCount = submissions.filter((s) => s.verdict === 'accepted').length;
  const totalCount    = submissions.length;
  const acceptRate    = totalCount ? Math.round((acceptedCount / totalCount) * 100) : 0;
  const languages     = Array.from(new Set(submissions.map((s) => s.language.toLowerCase())));
  const xpTotal       = submissions.filter((s) => s.verdict === 'accepted').reduce((sum, s) => sum + (s.xpEarned ?? 0), 0);

  const filtered = submissions.filter((s) => {
    const matchV = filterVerdict === 'all' || s.verdict === filterVerdict;
    const matchL = filterLang === 'all' || s.language.toLowerCase() === filterLang;
    return matchV && matchL;
  });

  if (selected && showCode) {
    const meta = VERDICT_META[selected.verdict] ?? DEFAULT_VERDICT_META;
    return (
      <AppShell>
        <div className="pt-8 max-w-4xl mx-auto">
          <button
            onClick={() => { setSelected(null); setShowCode(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontSize: 14, marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Icon name="arrow_back" size={16} />Back to submissions
          </button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ ...GLASS, borderRadius: 16, padding: 32, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', marginBottom: 4 }}>Submission</p>
                {selected.problemTitle && selected.problemId ? (
                  <Link to={`/app/problems/${selected.problemId}`} style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', textDecoration: 'none' }}>
                    {selected.problemTitle}
                  </Link>
                ) : (
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)' }}>{selected.problemTitle ?? `Problem ${selected.problemId}`}</h2>
                )}
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{new Date(selected.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}40` }}>
                <Icon name={meta.icon} size={16} filled />
                {meta.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Language', value: selected.language, icon: 'code' },
                { label: 'Runtime', value: selected.runtime ?? '—', icon: 'timer' },
                { label: 'Memory', value: selected.memory ?? '—', icon: 'memory' },
              ].map((stat) => (
                <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <Icon name={stat.icon} size={16} style={{ color: 'var(--t3)', display: 'block', margin: '0 auto 4px' }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{stat.value}</p>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', fontWeight: 700 }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {selected.xpEarned && selected.xpEarned > 0 && (
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#E82127' }}>
                <Icon name="bolt" size={16} filled />
                +{selected.xpEarned} XP earned
              </div>
            )}
          </motion.div>

          {selected.code ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...GLASS, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)' }}>Submitted Code</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(selected.code ?? '')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Icon name="content_copy" size={14} />Copy
                </button>
              </div>
              <pre style={{ padding: 24, fontSize: 12, fontFamily: 'monospace', color: 'var(--t1)', overflowX: 'auto', maxHeight: 500, overflowY: 'auto', lineHeight: 1.6 }}>
                <code>{selected.code}</code>
              </pre>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...GLASS, borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <Icon name="code_off" size={32} style={{ color: '#3f3f46', display: 'block', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--t3)', fontSize: 14 }}>Code not available for this submission.</p>
            </motion.div>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-8 max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1 }}>
            <span style={{ background: 'linear-gradient(135deg, #fff 40%, #E82127)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SUBMISSIONS LOG.</span>
          </h1>
          <p style={{ color: 'var(--t3)' }}>Your complete submission history and verdicts.</p>
        </motion.div>

        {/* Stats */}
        {!loading && submissions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 32 }}>
            {[
              { icon: 'task_alt',    label: 'Total Submitted', value: totalCount,                          color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
              { icon: 'check_circle', label: 'Accepted',       value: acceptedCount,                       color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
              { icon: 'percent',     label: 'Accept Rate',     value: `${acceptRate}%`,                    color: '#facc15', bg: 'rgba(250,204,21,0.1)'  },
              { icon: 'bolt',        label: 'XP Earned',       value: xpTotal > 0 ? `+${xpTotal}` : '0',  color: '#E82127', bg: 'rgba(232,33,39,0.1)'   },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={{ ...GLASS, borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={s.icon} size={20} filled={s.icon === 'bolt'} style={{ color: s.color }} />
                </div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)' }}>{s.value}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)' }}>{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filters */}
        {submissions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', ...GLASS, padding: 4, borderRadius: 999, gap: 2 }}>
              <button onClick={() => setFilterVerdict('all')} style={{ padding: '6px 16px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: filterVerdict === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent', color: filterVerdict === 'all' ? '#fff' : '#71717a' }}>All</button>
              {Object.entries(VERDICT_META).map(([key, meta]) => (
                <button key={key} onClick={() => setFilterVerdict(key)} style={{ padding: '6px 16px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: filterVerdict === key ? meta.bg : 'transparent', color: filterVerdict === key ? meta.color : '#71717a' }}>
                  {meta.label}
                </button>
              ))}
            </div>

            {languages.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', ...GLASS, padding: 4, borderRadius: 999, gap: 2 }}>
                <button onClick={() => setFilterLang('all')} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: filterLang === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent', color: filterLang === 'all' ? '#fff' : '#71717a' }}>All Langs</button>
                {languages.map((lang) => {
                  const lc = LANG_COLORS[lang] ?? DEFAULT_LANG;
                  return (
                    <button key={lang} onClick={() => setFilterLang(lang)} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: filterLang === lang ? lc.bg : 'transparent', color: filterLang === lang ? lc.color : '#71717a' }}>
                      {lang}
                    </button>
                  );
                })}
              </div>
            )}

            <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 700, alignSelf: 'center', marginLeft: 'auto' }}>{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
          </div>
        )}

        {/* Table header */}
        {!loading && submissions.length > 0 && (
          <div className="grid grid-cols-12 gap-4" style={{ padding: '0 24px 8px', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)' }}>
            <div className="col-span-5">Problem</div>
            <div className="col-span-2 text-center">Verdict</div>
            <div className="col-span-2 text-center">Language</div>
            <div className="col-span-1 text-center">Runtime</div>
            <div className="col-span-2 text-center">Date</div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-2">
            {[0,1,2,3,4,5,6,7].map((n) => (
              <div key={`skeleton-${n}`} style={{ height: 56, ...GLASS, borderRadius: 12, opacity: 0.4 }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && submissions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Icon name="inbox" size={48} style={{ color: '#3f3f46', display: 'block', margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>No submissions yet</p>
            <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 24 }}>Start solving problems to see your submission history here.</p>
            <Link to="/app/problems" style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '12px 32px', borderRadius: 999, fontSize: 14, textDecoration: 'none', boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}>
              Browse Problems
            </Link>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-1.5">
            {filtered.map((s, i) => {
              const meta = VERDICT_META[s.verdict] ?? DEFAULT_VERDICT_META;
              const lc = LANG_COLORS[s.language.toLowerCase()] ?? DEFAULT_LANG;
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  onClick={() => { setSelected(s); setShowCode(true); }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.002 }}
                  className="w-full grid grid-cols-12 gap-4 items-center text-left"
                  style={{ ...GLASS, borderRadius: 12, padding: '16px 24px', cursor: 'pointer' }}
                >
                  <div className="col-span-5">
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)' }}>
                      {s.problemTitle ?? `Problem ${s.problemId}`}
                    </span>
                    {s.xpEarned && s.xpEarned > 0 && s.verdict === 'accepted' && (
                      <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#E82127' }}>+{s.xpEarned} XP</span>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}>
                      <Icon name={meta.icon} size={11} filled={s.verdict === 'accepted'} />
                      {meta.label}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', color: lc.color, background: lc.bg }}>
                      {s.language}
                    </span>
                  </div>
                  <div className="col-span-1 text-center" style={{ fontSize: 12, color: 'var(--t3)' }}>{s.runtime ?? '—'}</div>
                  <div className="col-span-2 text-center" style={{ fontSize: 12, color: 'var(--t3)' }}>
                    {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    <span style={{ display: 'block', color: 'var(--t4)', fontSize: 11 }}>{new Date(s.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && submissions.length > 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Icon name="filter_list_off" size={36} style={{ color: '#3f3f46', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--t3)', fontWeight: 700 }}>No submissions match your filters.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
