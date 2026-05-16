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
  acceptanceRate?: number;
  solved?: boolean;
  xpReward?: number;
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
  const [stats, setStats] = useState<ProblemsResponse['stats'] | null>(null);

  const fetchProblems = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficulty !== 'all') params.set('difficulty', difficulty);
      if (selectedTag !== 'all') params.set('tag', selectedTag);
      const url = `/problems${params.toString() ? `?${params}` : ''}`;
      const d = await apiRequest<ProblemsResponse>(url, { token: session.accessToken });
      setProblems(d.problems ?? []);
      if (d.stats) setStats(d.stats);
    } catch {
      setProblems([]);
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
    if (tag !== 'all') {
      setSearchParams({ tag });
    } else {
      setSearchParams({});
    }
  };

  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchDiff   = difficulty === 'all' || p.difficulty === difficulty;
    const matchStatus = status === 'all' || (status === 'solved' ? p.solved : !p.solved);
    return matchSearch && matchDiff && matchStatus;
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

        {/* Topic Tags */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 mb-3">Filter by Topic</p>
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
            {filtered.length} problem{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 font-['Inter'] uppercase tracking-widest text-[10px] font-black text-zinc-600 mb-1">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-2 text-center">Difficulty</div>
          <div className="col-span-2 text-center">Tags</div>
          <div className="col-span-1 text-center">Acc %</div>
          <div className="col-span-1 text-center">XP</div>
        </div>

        {/* Problems list */}
        <div className="space-y-1.5">
          {loading && (
            <div className="space-y-1.5">
              {[...Array(10)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <div key={i} className="h-14 bg-surface-container rounded-xl animate-pulse" />
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

          {!loading && filtered.map((p, i) => (
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

                <div className="col-span-5">
                  <span className="font-semibold text-sm text-on-surface group-hover:text-primary-container transition-colors">
                    {p.title}
                  </span>
                  {p.category && (
                    <span className="ml-2 text-[10px] text-zinc-600 font-bold">{p.category}</span>
                  )}
                </div>

                <div className="col-span-2 flex justify-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${DIFF_STYLE[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                </div>

                <div className="col-span-2 flex justify-center gap-1 flex-wrap">
                  {(p.tags ?? []).slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-surface-container-highest rounded-full text-[9px] font-bold text-zinc-500 truncate max-w-[80px]">{tag}</span>
                  ))}
                </div>

                <div className="col-span-1 text-center">
                  <span className="text-xs font-bold text-zinc-500">
                    {p.acceptanceRate != null ? `${Math.round(p.acceptanceRate)}%` : '—'}
                  </span>
                </div>

                <div className="col-span-1 flex justify-center items-center gap-0.5">
                  <span className="text-xs font-black text-primary-container">{p.xpReward ?? (p.difficulty === 'hard' ? 100 : p.difficulty === 'medium' ? 60 : 30)}</span>
                  <Icon name="bolt" size={12} className="text-primary-container" filled />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
