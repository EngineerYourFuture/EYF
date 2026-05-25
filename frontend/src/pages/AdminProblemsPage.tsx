import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;
const INPUT = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--t1)', outline: 'none', boxSizing: 'border-box' } as const;

const DIFF_COLOR: Record<string, string> = { easy: '#4ade80', medium: '#facc15', hard: '#f87171' };

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
      <div style={{ paddingTop: 32 }}>
        <div style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 12 }}>
              Problem{' '}
              <span style={{ background: 'linear-gradient(135deg, #E82127, #ff4d52)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Management.</span>
            </h1>
            <p style={{ color: 'var(--t3)', fontSize: 15 }}>Create, edit, and manage the problem database.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openAdd}
            style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '12px 24px', borderRadius: 999, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', boxShadow: '0 0 24px rgba(232,33,39,0.3)', flexShrink: 0 }}
          >
            <Icon name="add" size={18} />
            Add Problem
          </motion.button>
        </div>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 2fr 1fr', gap: 16, padding: '12px 32px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', marginBottom: 8 }}>
          <div>Title</div>
          <div style={{ textAlign: 'center' }}>Difficulty</div>
          <div style={{ textAlign: 'center' }}>Category</div>
          <div style={{ textAlign: 'center' }}>Status</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--t4)' }}>Loading problems...</div>}
        {!loading && problems.length === 0 && <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--t4)' }}>No problems yet.</div>}
        {!loading && problems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {problems.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ ...GLASS, borderRadius: 12, padding: '20px 32px', display: 'grid', gridTemplateColumns: '5fr 2fr 2fr 2fr 1fr', gap: 16, alignItems: 'center' }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)' }}>{p.title}</div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: DIFF_COLOR[p.difficulty] ?? '#e4e4e7' }}>{p.difficulty}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, fontSize: 10, fontWeight: 700, color: 'var(--t3)' }}>
                    {p.category ?? 'General'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: p.status === 'published' ? 'rgba(74,222,128,0.1)' : 'rgba(113,113,122,0.1)', color: p.status === 'published' ? '#4ade80' : '#71717a' }}>
                    {p.status ?? 'draft'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={() => openEdit(p)}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', cursor: 'pointer' }}
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    onClick={() => deleteProblem(p.id)}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', cursor: 'pointer' }}
                  >
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ ...GLASS, borderRadius: 20, padding: 40, width: '100%', maxWidth: 440 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--t1)' }}>{editingProblem ? 'Edit Problem' : 'Add Problem'}</h2>
                <button onClick={() => setShowModal(false)} style={{ color: 'var(--t4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Icon name="close" size={24} />
                </button>
              </div>
              <form onSubmit={addProblem} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label htmlFor="prob-title" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', display: 'block', marginBottom: 8 }}>Title</label>
                  <input
                    id="prob-title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={INPUT}
                    placeholder="Two Sum"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="prob-diff" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', display: 'block', marginBottom: 8 }}>Difficulty</label>
                  <select
                    id="prob-diff"
                    value={newDiff}
                    onChange={(e) => setNewDiff(e.target.value as Difficulty)}
                    style={INPUT}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="prob-cat" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', display: 'block', marginBottom: 8 }}>Category</label>
                  <input
                    id="prob-cat"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    style={INPUT}
                    placeholder="Arrays"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', background: '#E82127', color: '#fff', fontWeight: 700, padding: '14px 0', borderRadius: 999, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}
                >
                  {editingProblem ? 'Save Changes' : 'Create Problem'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </AuthorityShell>
  );
}
