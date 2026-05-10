import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  acceptanceRate?: number;
  solved?: boolean;
}

interface ProblemsResponse {
  problems: Problem[];
  total?: number;
}

const diffColor = (d: string) => {
  if (d === 'easy') return 'text-green-400 bg-green-400/10';
  if (d === 'medium') return 'text-yellow-400 bg-yellow-400/10';
  return 'text-red-400 bg-red-400/10';
};

export function ProblemsPage() {
  const session = getSession();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    apiRequest<ProblemsResponse>('/problems', { token: session.accessToken })
      .then((d) => setProblems(d.problems ?? []))
      .catch(() => setProblems([]))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchDiff = difficulty === 'all' || p.difficulty === difficulty;
    return matchSearch && matchDiff;
  });

  return (
    <AppShell>
      <div className="pt-8">
        {/* Hero */}
        <section className="mt-4 mb-16 grid grid-cols-12 gap-8 items-end">
          <div className="col-span-8">
            <h2 className="text-6xl font-black tracking-tighter text-white mb-6 leading-[0.9]">
              MASTER THE <br /><span className="text-primary-container">ALGORITHMS.</span>
            </h2>
            <p className="text-on-surface-variant max-w-lg leading-relaxed text-lg font-medium opacity-80">
              Curated technical challenges engineered for precision and performance.
            </p>
          </div>
          <div className="col-span-4 flex justify-end">
            <div className="bg-[rgba(57,57,57,0.4)] backdrop-blur-xl p-6 rounded-lg w-full max-w-xs border border-white/5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-black text-primary-container">PLATFORM STATS</span>
                <Icon name="trending_up" size={16} className="text-zinc-500" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-zinc-400">TOTAL PROBLEMS</span>
                    <span>{problems.length}</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest rounded-full">
                    <div className="h-full bg-primary-container rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-zinc-400">SOLVED</span>
                    <span>{problems.filter((p) => p.solved).length}</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest rounded-full">
                    <div className="h-full bg-tertiary rounded-full" style={{ width: `${problems.length ? (problems.filter(p => p.solved).length / problems.length) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <section className="mb-12 flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-surface-container-low p-1.5 rounded-full">
            {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-6 py-2.5 rounded-full font-['Inter'] uppercase tracking-widest text-[10px] font-black transition-all ${
                  difficulty === d ? 'bg-surface-container-highest text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {d === 'all' ? 'All Problems' : d}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH PROBLEMS..."
              className="w-full bg-surface-container-low rounded-full pl-10 pr-5 py-3 text-[11px] font-bold uppercase tracking-widest placeholder:text-zinc-600 focus:outline-none focus:ring-0"
            />
          </div>
        </section>

        {/* Problems list */}
        <section className="space-y-2 max-w-screen-xl">
          <div className="grid grid-cols-12 gap-6 px-10 py-4 font-['Inter'] uppercase tracking-widest text-[10px] font-black text-zinc-500 mb-2">
            <div className="col-span-6 flex items-center gap-4">
              <span>#</span><span>TITLE</span>
            </div>
            <div className="col-span-2 text-center">DIFFICULTY</div>
            <div className="col-span-2 text-center">CATEGORY</div>
            <div className="col-span-2 text-center">STATUS</div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500">Loading problems...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">No problems found.</div>
          ) : (
            filtered.map((p, i) => (
              <Link key={p.id} to={`/app/problems/${p.id}`}>
                <div className="grid grid-cols-12 gap-6 bg-surface-container rounded-xl px-10 py-5 hover:bg-surface-container-high transition-colors group cursor-pointer items-center">
                  <div className="col-span-6 flex items-center gap-4">
                    <span className="text-zinc-600 text-[11px] font-bold w-8">{p.number ?? i + 1}.</span>
                    <span className="font-semibold text-on-surface group-hover:text-primary-container transition-colors">{p.title}</span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${diffColor(p.difficulty)}`}>
                      {p.difficulty}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {p.category ?? 'General'}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {p.solved ? (
                      <Icon name="check_circle" size={20} className="text-green-400" filled />
                    ) : (
                      <Icon name="radio_button_unchecked" size={20} className="text-zinc-600" />
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </section>
      </div>
    </AppShell>
  );
}
