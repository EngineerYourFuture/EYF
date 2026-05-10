import { useEffect, useState } from 'react';
import { AuthorityShell } from '../components/AuthorityShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

type Difficulty = 'easy' | 'medium' | 'hard';
type ProblemStatus = 'published' | 'draft';

interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  category?: string;
  status?: ProblemStatus;
}
interface ProblemsResponse {
  items: Problem[];
}

const diffColor = (d: string) => {
  if (d === 'easy') return 'text-green-400';
  if (d === 'medium') return 'text-yellow-400';
  return 'text-red-400';
};

export function AdminProblemsPage() {
  const session = getSession();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDiff, setNewDiff] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [newCat, setNewCat] = useState('');

  const openAdd = () => { setEditingProblem(null); setNewTitle(''); setNewDiff('easy'); setNewCat(''); setShowModal(true); };
  const openEdit = (p: Problem) => { setEditingProblem(p); setNewTitle(p.title); setNewDiff(p.difficulty); setNewCat(p.category ?? ''); setShowModal(true); };

  const load = () => {
    if (!session?.accessToken) return;
    apiRequest<ProblemsResponse>('/admin/problems', { token: session.accessToken })
      .then((d) => setProblems(d.items ?? []))
      .catch(() => setProblems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [session?.accessToken]);

  const addProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;
    try {
      if (editingProblem) {
        await apiRequest(`/admin/problems/${editingProblem.id}`, {
          method: 'PUT',
          token: session.accessToken,
          body: { title: newTitle, difficulty: newDiff, category: newCat },
        });
      } else {
        await apiRequest('/admin/problems', {
          method: 'POST',
          token: session.accessToken,
          body: { title: newTitle, difficulty: newDiff, category: newCat },
        });
      }
      setShowModal(false);
      setNewTitle(''); setNewDiff('easy'); setNewCat(''); setEditingProblem(null);
      load();
    } catch {}
  };

  const deleteProblem = async (id: string) => {
    if (!globalThis.confirm('Delete this problem? This action cannot be undone.')) return;
    if (!session?.accessToken) return;
    try {
      await apiRequest(`/admin/problems/${id}`, { method: 'DELETE', token: session.accessToken });
      load();
    } catch {}
  };

  return (
    <AuthorityShell>
      <div className="pt-8">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-3">Problem <span className="text-primary-container">Management.</span></h1>
            <p className="text-on-surface-variant">Create, edit, and manage the problem database.</p>
          </div>
          <button
            onClick={openAdd}
            className="bg-primary-container text-white font-bold px-6 py-3 rounded-full text-[11px] uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all active:scale-95"
          >
            <Icon name="add" size={18} />
            Add Problem
          </button>
        </div>

        <div className="grid grid-cols-12 gap-4 px-8 py-4 font-['Inter'] uppercase tracking-widest text-[10px] font-black text-zinc-500 mb-2">
          <div className="col-span-5">Title</div>
          <div className="col-span-2 text-center">Difficulty</div>
          <div className="col-span-2 text-center">Category</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500">Loading problems...</div>
        ) : (problems.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">No problems yet.</div>
        ) : (
          <div className="space-y-2">
            {problems.map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-4 bg-surface-container rounded-xl px-8 py-5 hover:bg-surface-container-high transition-colors items-center">
                <div className="col-span-5 font-semibold text-on-surface">{p.title}</div>
                <div className="col-span-2 text-center">
                  <span className={`font-bold text-xs uppercase tracking-widest ${diffColor(p.difficulty)}`}>{p.difficulty}</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold text-zinc-400">
                    {p.category ?? 'General'}
                  </span>
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${p.status === 'published' ? 'text-green-400 bg-green-400/10' : 'text-zinc-400 bg-zinc-400/10'}`}>
                    {p.status ?? 'draft'}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    onClick={() => deleteProblem(p.id)}
                    className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-container rounded-xl p-10 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black tracking-tight">{editingProblem ? 'Edit Problem' : 'Add Problem'}</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <Icon name="close" size={24} />
                </button>
              </div>
              <form onSubmit={addProblem} className="space-y-6">
                <div>
                  <label htmlFor="prob-title" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">Title</label>
                  <input
                    id="prob-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface text-sm border-none focus:outline-none"
                    placeholder="Two Sum"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="prob-diff" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">Difficulty</label>
                  <select
                    id="prob-diff"
                    value={newDiff}
                    onChange={(e) => setNewDiff(e.target.value as Difficulty)}
                    className="w-full bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface text-sm border-none focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="prob-cat" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">Category</label>
                  <input
                    id="prob-cat"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="w-full bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface text-sm border-none focus:outline-none"
                    placeholder="Arrays"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-container text-white font-bold py-4 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
                >
                  {editingProblem ? 'Save Changes' : 'Create Problem'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthorityShell>
  );
}
