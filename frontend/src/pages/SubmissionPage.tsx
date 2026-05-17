import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

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
  accepted:             { label: 'Accepted',    color: 'text-green-400',  bg: 'bg-green-400/10',  icon: 'check_circle' },
  wrong_answer:         { label: 'Wrong Answer', color: 'text-red-400',   bg: 'bg-red-400/10',    icon: 'cancel' },
  time_limit_exceeded:  { label: 'TLE',          color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: 'timer_off' },
  memory_limit_exceeded:{ label: 'MLE',          color: 'text-orange-400', bg: 'bg-orange-400/10', icon: 'memory' },
  runtime_error:        { label: 'Runtime Error', color: 'text-pink-400',  bg: 'bg-pink-400/10',   icon: 'error' },
  compilation_error:    { label: 'Compile Error', color: 'text-zinc-400',  bg: 'bg-zinc-400/10',   icon: 'code_off' },
};

const DEFAULT_VERDICT_META = { label: 'Unknown', color: 'text-zinc-400', bg: 'bg-zinc-400/10', icon: 'help' };

const LANG_COLORS: Record<string, string> = {
  python: 'text-blue-400 bg-blue-500/10',
  javascript: 'text-yellow-400 bg-yellow-500/10',
  typescript: 'text-blue-300 bg-blue-400/10',
  java: 'text-orange-400 bg-orange-500/10',
  cpp: 'text-cyan-400 bg-cyan-500/10',
  go: 'text-cyan-300 bg-cyan-400/10',
  rust: 'text-orange-300 bg-orange-400/10',
};

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
        <div className="pt-8 max-w-4xl">
          <button
            onClick={() => { setSelected(null); setShowCode(false); }}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors"
          >
            <Icon name="arrow_back" size={16} />Back to submissions
          </button>

          <div className="bg-surface-container rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Submission</p>
                {selected.problemTitle && selected.problemId ? (
                  <Link to={`/app/problems/${selected.problemId}`} className="text-xl font-bold hover:text-primary-container transition-colors">
                    {selected.problemTitle}
                  </Link>
                ) : (
                  <h2 className="text-xl font-bold">{selected.problemTitle ?? `Problem ${selected.problemId}`}</h2>
                )}
                <p className="text-xs text-zinc-500 mt-1">{new Date(selected.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <span className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold ${meta.color} ${meta.bg}`}>
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
                <div key={stat.label} className="bg-surface-container-high rounded-xl p-4 text-center">
                  <Icon name={stat.icon} size={16} className="text-zinc-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-on-surface">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</p>
                </div>
              ))}
            </div>

            {selected.xpEarned && selected.xpEarned > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-primary-container">
                <Icon name="bolt" size={16} filled />
                +{selected.xpEarned} XP earned
              </div>
            )}
          </div>

          {selected.code ? (
            <div className="bg-surface-container rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                <p className="text-sm font-bold text-zinc-400">Submitted Code</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(selected.code ?? '')}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Icon name="content_copy" size={14} />
                  Copy
                </button>
              </div>
              <pre className="p-6 text-xs font-mono text-on-surface overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed">
                <code>{selected.code}</code>
              </pre>
            </div>
          ) : (
            <div className="bg-surface-container rounded-xl p-8 text-center">
              <Icon name="code_off" size={32} className="text-zinc-700 mb-3 mx-auto" />
              <p className="text-zinc-500 text-sm">Code not available for this submission.</p>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-8 max-w-6xl">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-5xl font-black tracking-tighter mb-2">
            Submissions <span className="text-primary-container">Log.</span>
          </h1>
          <p className="text-on-surface-variant">Your complete submission history and verdicts.</p>
        </div>

        {/* Stats */}
        {!loading && submissions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: 'task_alt', label: 'Total Submitted', value: totalCount, color: 'text-blue-400' },
              { icon: 'check_circle', label: 'Accepted', value: acceptedCount, color: 'text-green-400' },
              { icon: 'percent', label: 'Accept Rate', value: `${acceptRate}%`, color: 'text-yellow-400' },
              { icon: 'bolt', label: 'XP Earned', value: xpTotal > 0 ? `+${xpTotal}` : '0', color: 'text-primary-container' },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container rounded-xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name={s.icon} className={s.color} size={20} filled={s.icon === 'bolt'} />
                </div>
                <div>
                  <p className="text-xl font-black text-on-surface">{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {submissions.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center bg-surface-container p-1 rounded-full">
              <button onClick={() => setFilterVerdict('all')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${filterVerdict === 'all' ? 'bg-surface-container-highest text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>All</button>
              {Object.entries(VERDICT_META).map(([key, meta]) => {
                const activeClass = filterVerdict === key ? [meta.bg, meta.color].join(' ') : 'text-zinc-500 hover:text-zinc-200';
                return (
                  <button key={key} onClick={() => setFilterVerdict(key)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeClass}`}>
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {languages.length > 1 && (
              <div className="flex items-center bg-surface-container p-1 rounded-full">
                <button onClick={() => setFilterLang('all')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${filterLang === 'all' ? 'bg-surface-container-highest text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>All Langs</button>
                {languages.map((lang) => (
                  <button key={lang} onClick={() => setFilterLang(lang)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${filterLang === lang ? LANG_COLORS[lang] ?? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>
                    {lang}
                  </button>
                ))}
              </div>
            )}

            <span className="text-xs text-zinc-500 font-bold self-center ml-auto">{filtered.length} result{filtered.length === 1 ? '' : 's'}</span>
          </div>
        )}

        {/* Table header */}
        {!loading && submissions.length > 0 && (
          <div className="grid grid-cols-12 gap-4 px-6 py-3 font-['Inter'] uppercase tracking-widest text-[10px] font-black text-zinc-600 mb-1">
            <div className="col-span-5">Problem</div>
            <div className="col-span-2 text-center">Verdict</div>
            <div className="col-span-2 text-center">Language</div>
            <div className="col-span-1 text-center">Runtime</div>
            <div className="col-span-2 text-center">Date</div>
          </div>
        )}

        {/* Content */}
        {loading && (
          <div className="space-y-2">
            {[...new Array(8)].map((_, i) => (
              <div key={`skeleton-${i}`} className="h-14 bg-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && submissions.length === 0 && (
          <div className="text-center py-20">
            <Icon name="inbox" size={48} className="text-zinc-700 mx-auto mb-4" />
            <p className="font-bold text-on-surface-variant mb-2">No submissions yet</p>
            <p className="text-zinc-500 text-sm mb-6">Start solving problems to see your submission history here.</p>
            <Link to="/app/problems" className="bg-primary-container text-white font-bold py-3 px-8 rounded-full text-sm hover:brightness-110 transition-all">
              Browse Problems
            </Link>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-1.5">
            {filtered.map((s) => {
              const meta = VERDICT_META[s.verdict] ?? DEFAULT_VERDICT_META;
              const langColor = LANG_COLORS[s.language.toLowerCase()] ?? 'text-zinc-400 bg-zinc-500/10';
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSelected(s); setShowCode(true); }}
                  className="w-full grid grid-cols-12 gap-4 bg-surface-container rounded-xl px-6 py-4 hover:bg-surface-container-high transition-all cursor-pointer items-center text-left group"
                >
                  <div className="col-span-5">
                    <span className="font-semibold text-sm text-on-surface group-hover:text-primary-container transition-colors">
                      {s.problemTitle ?? `Problem ${s.problemId}`}
                    </span>
                    {s.xpEarned && s.xpEarned > 0 && s.verdict === 'accepted' && (
                      <span className="ml-2 text-[10px] font-bold text-primary-container">+{s.xpEarned} XP</span>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${meta.color} ${meta.bg}`}>
                      <Icon name={meta.icon} size={11} filled={s.verdict === 'accepted'} />
                      {meta.label}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${langColor}`}>
                      {s.language}
                    </span>
                  </div>
                  <div className="col-span-1 text-center text-xs text-zinc-500">{s.runtime ?? '—'}</div>
                  <div className="col-span-2 text-center text-xs text-zinc-500">
                    {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    <span className="block text-zinc-600">{new Date(s.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && submissions.length > 0 && (
          <div className="text-center py-12">
            <Icon name="filter_list_off" size={36} className="text-zinc-700 mb-3" />
            <p className="text-zinc-500 font-bold">No submissions match your filters.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
