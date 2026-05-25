import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

// ─── Design tokens ────────────────────────────────────────────────────────────

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStatus = 'applied' | 'oa' | 'phone' | 'onsite' | 'offer' | 'rejected' | 'withdrawn';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Round {
  id: string;
  type: string;
  date: string;
  result: 'pass' | 'fail' | 'pending';
  notes: string;
  difficulty: Difficulty;
}

interface Application {
  id: string;
  company: string;
  role: string;
  status: AppStatus;
  appliedDate: string;
  salary?: string;
  location: string;
  remote: boolean;
  rounds: Round[];
  notes: string;
  starred: boolean;
}

// ─── Static state helpers ─────────────────────────────────────────────────────

const STATUS_META: Record<AppStatus, { label: string; color: string; glow: string; bg: string; icon: string; order: number }> = {
  applied:   { label: 'Applied',   color: 'var(--t2)', glow: 'rgba(161,161,170,0.15)', bg: 'rgba(161,161,170,0.08)', icon: 'send',           order: 0 },
  oa:        { label: 'OA',        color: '#60a5fa', glow: 'rgba(96,165,250,0.15)',  bg: 'rgba(96,165,250,0.08)',  icon: 'code',           order: 1 },
  phone:     { label: 'Phone',     color: '#22d3ee', glow: 'rgba(34,211,238,0.15)',  bg: 'rgba(34,211,238,0.08)', icon: 'call',           order: 2 },
  onsite:    { label: 'Onsite',    color: '#fb923c', glow: 'rgba(251,146,60,0.15)',  bg: 'rgba(251,146,60,0.08)', icon: 'corporate_fare', order: 3 },
  offer:     { label: 'Offer 🎉',  color: '#4ade80', glow: 'rgba(74,222,128,0.15)',  bg: 'rgba(74,222,128,0.08)', icon: 'celebration',    order: 4 },
  rejected:  { label: 'Rejected',  color: '#f87171', glow: 'rgba(248,113,113,0.15)', bg: 'rgba(248,113,113,0.08)',icon: 'cancel',         order: 5 },
  withdrawn: { label: 'Withdrawn', color: 'var(--t4)', glow: 'rgba(82,82,91,0.15)',    bg: 'rgba(82,82,91,0.08)',   icon: 'exit_to_app',    order: 6 },
};

const DIFF_META: Record<Difficulty, { color: string; bg: string }> = {
  easy:   { color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  medium: { color: '#facc15', bg: 'rgba(250,204,21,0.1)'  },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

const ROUND_RESULT_COLOR: Record<Round['result'], string> = {
  pass:    '#4ade80',
  fail:    '#f87171',
  pending: '#52525b',
};

const ROUND_TYPES = ['Online Assessment', 'Phone Screen', 'Technical Interview', 'System Design', 'Behavioral', 'HR Round', 'Culture Fit', 'Bar Raiser'];

const SEED_APPS: Application[] = [
  {
    id: 'a1', company: 'Google', role: 'Software Engineer L4', status: 'onsite',
    appliedDate: '2026-04-20', salary: '₹60-90 LPA', location: 'Bangalore', remote: false,
    starred: true, notes: 'Referral from college senior. Strong in DSA, need to improve system design.',
    rounds: [
      { id: 'r1', type: 'Phone Screen', date: '2026-05-01', result: 'pass', difficulty: 'medium', notes: 'Two Leetcode mediums. Sliding window + graph BFS.' },
      { id: 'r2', type: 'Technical Interview', date: '2026-05-10', result: 'pass', difficulty: 'hard', notes: 'DP problem + code review. Went well.' },
      { id: 'r3', type: 'System Design', date: '2026-05-20', result: 'pending', difficulty: 'hard', notes: 'Design YouTube. Need to review CDN & encoding pipeline.' },
    ],
  },
  {
    id: 'a2', company: 'Flipkart', role: 'SDE-2 Backend', status: 'offer',
    appliedDate: '2026-04-10', salary: '₹42 LPA', location: 'Bangalore', remote: false,
    starred: true, notes: 'Got offer! Deciding between this and Google onsite.',
    rounds: [
      { id: 'r4', type: 'Online Assessment', date: '2026-04-15', result: 'pass', difficulty: 'medium', notes: '3 questions in 90 min. All solved.' },
      { id: 'r5', type: 'Technical Interview', date: '2026-04-22', result: 'pass', difficulty: 'medium', notes: 'Java internals + DSA.' },
      { id: 'r6', type: 'System Design', date: '2026-04-28', result: 'pass', difficulty: 'medium', notes: 'Design Flipkart catalog.' },
      { id: 'r7', type: 'HR Round', date: '2026-05-02', result: 'pass', difficulty: 'easy', notes: 'Salary negotiation. Got 8% bump on initial offer.' },
    ],
  },
  {
    id: 'a3', company: 'Amazon', role: 'SDE-2 AWS', status: 'rejected',
    appliedDate: '2026-03-28', salary: '₹55 LPA', location: 'Hyderabad', remote: true,
    starred: false, notes: 'Failed behavioral round. Need to prepare more LP stories.',
    rounds: [
      { id: 'r8', type: 'Online Assessment', date: '2026-04-02', result: 'pass', difficulty: 'medium', notes: 'Standard 2 questions.' },
      { id: 'r9', type: 'Phone Screen', date: '2026-04-08', result: 'pass', difficulty: 'medium', notes: 'Arrays + recursion.' },
      { id: 'r10', type: 'Behavioral', date: '2026-04-15', result: 'fail', difficulty: 'hard', notes: 'Bar Raiser round. Answers not structured enough. Work on STAR format.' },
    ],
  },
  {
    id: 'a4', company: 'Razorpay', role: 'Backend Engineer', status: 'phone',
    appliedDate: '2026-05-05', salary: '₹28-35 LPA', location: 'Bangalore', remote: false,
    starred: false, notes: 'Direct application via LinkedIn.',
    rounds: [
      { id: 'r11', type: 'Phone Screen', date: '2026-05-12', result: 'pending', difficulty: 'easy', notes: 'Scheduled for next week.' },
    ],
  },
  {
    id: 'a5', company: 'Atlassian', role: 'Senior Software Engineer', status: 'applied',
    appliedDate: '2026-05-13', salary: 'AUD 180K', location: 'Sydney (Remote OK)', remote: true,
    starred: false, notes: 'Via referral. Strong company for work-life balance.',
    rounds: [],
  },
];

const EMPTY_APP: Omit<Application, 'id' | 'rounds' | 'starred'> = {
  company: '', role: '', status: 'applied', appliedDate: new Date().toISOString().slice(0, 10),
  salary: '', location: '', remote: false, notes: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { readonly status: AppStatus }) {
  const meta = STATUS_META[status];
  return (
    <span style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.color}30` }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
      <Icon name={meta.icon} size={10} />
      {meta.label}
    </span>
  );
}

function StageBar({ status }: { readonly status: AppStatus }) {
  const stages: AppStatus[] = ['applied', 'oa', 'phone', 'onsite', 'offer'];
  const currentOrder = STATUS_META[status].order;
  return (
    <div className="flex items-center gap-1 mt-3">
      {stages.map((s, i) => {
        const order = STATUS_META[s].order;
        const meta = STATUS_META[s];
        const active = status === s;
        const done = !['rejected', 'withdrawn'].includes(status) && currentOrder > order;
        const barColor = done ? '#4ade80' : active ? meta.color : 'rgba(255,255,255,0.06)';
        return (
          <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
            <div style={{ background: barColor, boxShadow: active ? `0 0 8px ${meta.glow}` : 'none' }}
              className="h-1.5 rounded-full flex-1 transition-all duration-500" />
            {i < stages.length - 1 && <div style={{ background: 'rgba(255,255,255,0.06)' }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function InterviewTrackerPage() {
  const { fireXP } = useUser();
  const [apps, setApps] = useState<Application[]>(() => {
    try {
      const stored = localStorage.getItem('eyf.interviewApps');
      return stored ? (JSON.parse(stored) as Application[]) : SEED_APPS;
    } catch { return SEED_APPS; }
  });
  const [filterStatus, setFilterStatus] = useState<AppStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Application | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddRound, setShowAddRound] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_APP>({ ...EMPTY_APP });
  const [roundForm, setRoundForm] = useState({ type: ROUND_TYPES[0], date: new Date().toISOString().slice(0, 10), result: 'pending' as Round['result'], difficulty: 'medium' as Difficulty, notes: '' });
  const [tab, setTab] = useState<'pipeline' | 'list'>('pipeline');

  const persist = (next: Application[]) => {
    setApps(next);
    try { localStorage.setItem('eyf.interviewApps', JSON.stringify(next)); } catch { /* ignore */ }
  };

  const addApp = () => {
    if (!form.company || !form.role) return;
    const newApp: Application = { ...form, id: crypto.randomUUID(), rounds: [], starred: false };
    const next = [newApp, ...apps];
    persist(next);
    setShowAdd(false);
    setForm({ ...EMPTY_APP });
    fireXP(5, `Tracking ${form.company}!`);
  };

  const updateStatus = (id: string, status: AppStatus) => {
    const next = apps.map((a) => a.id === id ? { ...a, status } : a);
    persist(next);
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s);
    if (status === 'offer') fireXP(100, 'Offer received! 🎉');
  };

  const toggleStar = (id: string) => {
    const next = apps.map((a) => a.id === id ? { ...a, starred: !a.starred } : a);
    persist(next);
    if (selected?.id === id) setSelected((s) => s ? { ...s, starred: !s.starred } : s);
  };

  const deleteApp = (id: string) => {
    persist(apps.filter((a) => a.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const addRound = () => {
    if (!selected) return;
    const newRound: Round = { id: crypto.randomUUID(), ...roundForm };
    const updatedApp = { ...selected, rounds: [...selected.rounds, newRound] };
    const next = apps.map((a) => a.id === selected.id ? updatedApp : a);
    persist(next);
    setSelected(updatedApp);
    setShowAddRound(false);
    setRoundForm({ type: ROUND_TYPES[0], date: new Date().toISOString().slice(0, 10), result: 'pending', difficulty: 'medium', notes: '' });
    fireXP(10, 'Round logged!');
  };

  const total = apps.length;
  const active = apps.filter((a) => !['rejected', 'withdrawn'].includes(a.status)).length;
  const offers = apps.filter((a) => a.status === 'offer').length;
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  const filtered = apps.filter((a) => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const lowerSearch = search.toLowerCase();
    const matchSearch = search === '' || a.company.toLowerCase().includes(lowerSearch) || a.role.toLowerCase().includes(lowerSearch);
    return matchStatus && matchSearch;
  });

  const byStatus = (status: AppStatus) => filtered.filter((a) => a.status === status);
  const PIPELINE_COLS: AppStatus[] = ['applied', 'oa', 'phone', 'onsite', 'offer'];

  const roundResultIcon = (r: Round['result']) => {
    if (r === 'pass') return 'check_circle';
    if (r === 'fail') return 'cancel';
    return 'schedule';
  };

  // ─── Detail view ───────────────────────────────────────────────────────────

  if (selected) {
    const selMeta = STATUS_META[selected.status];
    return (
      <AppShell>
        <div className="pt-8 max-w-3xl mx-auto">
          <motion.button
            onClick={() => setSelected(null)}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-widest transition-colors"
            style={{ color: 'var(--t2)' }}
            whileHover={{ color: '#fff' } as never}
          >
            <Icon name="arrow_back" size={16} /> Back to tracker
          </motion.button>

          {/* Company header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ ...GLASS, borderRadius: 20, padding: '2rem', marginBottom: '1.25rem',
              boxShadow: `0 0 60px ${selMeta.glow}` }}
          >
            {/* Top accent */}
            <div style={{ height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${selMeta.color}, transparent)`, marginBottom: '1.5rem' }} />

            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 style={{
                    fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em',
                    background: `linear-gradient(135deg, #fff 30%, ${selMeta.color})`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    {selected.company}
                  </h1>
                  <motion.button onClick={() => toggleStar(selected.id)} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                    <Icon name="star" size={20} style={{ color: selected.starred ? '#facc15' : 'rgba(255,255,255,0.15)' }} filled={selected.starred} />
                  </motion.button>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{selected.role}</p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', marginTop: 4 }}>
                  {selected.location}{selected.remote ? ' · Remote OK' : ''}{selected.salary ? ` · ${selected.salary}` : ''}
                </p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            {!['rejected', 'withdrawn'].includes(selected.status) && <StageBar status={selected.status} />}

            {/* Update status */}
            <div className="mt-6">
              <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>
                UPDATE STATUS
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_META) as AppStatus[]).map((s) => {
                  const m = STATUS_META[s];
                  const isActive = selected.status === s;
                  return (
                    <motion.button key={s} onClick={() => updateStatus(selected.id, s)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      style={{
                        padding: '6px 14px', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
                        color: isActive ? m.color : 'rgba(255,255,255,0.25)',
                        background: isActive ? m.bg : 'transparent',
                        border: isActive ? `1px solid ${m.color}40` : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: isActive ? `0 0 12px ${m.glow}` : 'none',
                      }}
                    >
                      {m.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Rounds */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            style={{ ...GLASS, borderRadius: 20, padding: '1.5rem', marginBottom: '1.25rem' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontWeight: 900, fontSize: '0.875rem', letterSpacing: '-0.02em' }}>Interview Rounds</h2>
              <motion.button onClick={() => setShowAddRound(true)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1"
                style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E82127' }}
              >
                <Icon name="add" size={14} /> Add Round
              </motion.button>
            </div>

            {selected.rounds.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No rounds logged yet.</p>
            ) : (
              <div className="space-y-3">
                {selected.rounds.map((round, i) => {
                  const dm = DIFF_META[round.difficulty];
                  const rc = ROUND_RESULT_COLOR[round.result];
                  return (
                    <motion.div key={round.id}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--t2)' }}>{i + 1}</div>
                        {i < selected.rounds.length - 1 && <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.06)', marginTop: 4 }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{round.type}</span>
                          <span style={{ fontSize: '0.5625rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, color: dm.color, background: dm.bg }}>{round.difficulty}</span>
                          <Icon name={roundResultIcon(round.result)} size={14} style={{ color: rc }} filled={round.result !== 'pending'} />
                        </div>
                        <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>
                          {new Date(round.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {round.notes && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{round.notes}</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <AnimatePresence>
              {showAddRound && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  style={{ marginTop: 16, padding: 16, background: 'rgba(232,33,39,0.04)', borderRadius: 14, border: '1px solid rgba(232,33,39,0.2)' }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'round-type', label: 'Round Type', type: 'select', opts: ROUND_TYPES, val: roundForm.type, cb: (v: string) => setRoundForm((f) => ({ ...f, type: v })) },
                    ].map(({ id, label, opts, val, cb }) => (
                      <div key={id}>
                        <label htmlFor={id} style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 4 }}>{label.toUpperCase()}</label>
                        <select id={id} value={val} onChange={(e) => cb(e.target.value)}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: '0.875rem', color: '#fff', outline: 'none' }}>
                          {opts?.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    ))}
                    <div>
                      <label htmlFor="round-date" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 4 }}>DATE</label>
                      <input id="round-date" type="date" value={roundForm.date} onChange={(e) => setRoundForm((f) => ({ ...f, date: e.target.value }))}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: '0.875rem', color: '#fff', outline: 'none' }} />
                    </div>
                    <div>
                      <label htmlFor="round-result" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 4 }}>RESULT</label>
                      <select id="round-result" value={roundForm.result} onChange={(e) => setRoundForm((f) => ({ ...f, result: e.target.value as Round['result'] }))}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: '0.875rem', color: '#fff', outline: 'none' }}>
                        <option value="pending">Pending</option>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="round-difficulty" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 4 }}>DIFFICULTY</label>
                      <select id="round-difficulty" value={roundForm.difficulty} onChange={(e) => setRoundForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: '0.875rem', color: '#fff', outline: 'none' }}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="round-notes" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 4 }}>NOTES</label>
                    <textarea id="round-notes" value={roundForm.notes} onChange={(e) => setRoundForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Questions asked, how it went, what to improve..."
                      rows={3} style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', fontSize: '0.875rem', color: '#fff', outline: 'none', resize: 'none' }} />
                  </div>
                  <div className="flex gap-2">
                    <motion.button onClick={addRound} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      style={{ background: 'linear-gradient(135deg,#E82127,#ff6b35)', color: '#fff', fontWeight: 700, padding: '8px 20px', borderRadius: 9999, fontSize: '0.75rem', boxShadow: '0 0 20px rgba(232,33,39,0.35)', cursor: 'pointer' }}>
                      Save Round
                    </motion.button>
                    <button onClick={() => setShowAddRound(false)}
                      style={{ color: 'var(--t3)', fontSize: '0.75rem', padding: '8px 16px', borderRadius: 9999, cursor: 'pointer', background: 'transparent', border: 'none' }}>
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Notes */}
          {selected.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
              style={{ ...GLASS, borderRadius: 20, padding: '1.5rem', marginBottom: '1.25rem' }}
            >
              <h2 style={{ fontWeight: 900, fontSize: '0.875rem', letterSpacing: '-0.02em', marginBottom: 12 }}>Notes</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', lineHeight: 1.7 }}>{selected.notes}</p>
            </motion.div>
          )}

          {/* Delete */}
          <motion.button onClick={() => deleteApp(selected.id)}
            whileHover={{ color: '#f87171' } as never}
            className="flex items-center gap-1 transition-colors"
            style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <Icon name="delete" size={14} /> Delete this application
          </motion.button>
        </div>
      </AppShell>
    );
  }

  // ─── Main list / pipeline view ─────────────────────────────────────────────

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl mx-auto">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--t3)', marginBottom: 8, textTransform: 'uppercase' }}>
            EYF · Application Tracking
          </p>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em',
                background: 'linear-gradient(135deg, #fff 20%, #E82127 50%, #fb923c 80%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                INTERVIEW TRACKER.
              </h1>
              <p style={{ color: 'var(--t2)', fontSize: '0.875rem', marginTop: 8 }}>
                Log applications, track rounds, land that offer.
              </p>
            </div>
            <motion.button onClick={() => setShowAdd(!showAdd)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              style={{
                background: 'linear-gradient(135deg,#E82127,#ff6b35)', color: '#fff', fontWeight: 700,
                padding: '12px 24px', borderRadius: 9999, fontSize: '0.875rem', display: 'flex', alignItems: 'center',
                gap: 8, boxShadow: '0 0 32px rgba(232,33,39,0.35)', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Icon name="add" size={18} /> Add Application
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applied', value: total,       icon: 'send',        color: 'var(--t2)', glow: 'rgba(161,161,170,0.15)' },
            { label: 'Active',        value: active,      icon: 'trending_up', color: '#60a5fa', glow: 'rgba(96,165,250,0.15)'  },
            { label: 'Offers',        value: offers,      icon: 'celebration', color: '#4ade80', glow: 'rgba(74,222,128,0.15)'  },
            { label: 'Offer Rate',    value: `${offerRate}%`, icon: 'percent', color: '#facc15', glow: 'rgba(250,204,21,0.15)'  },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ ...GLASS, borderRadius: 18, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(${s.color.slice(1).match(/.{2}/g)?.map((x) => parseInt(x, 16)).join(',') ?? '255,255,255'},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 16px ${s.glow}` }}>
                <Icon name={s.icon} size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>{s.value}</p>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add Application form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              style={{ ...GLASS, borderRadius: 20, padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(232,33,39,0.2)', boxShadow: '0 0 40px rgba(232,33,39,0.08)' }}
            >
              <h3 style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.02em', marginBottom: 16 }}>New Application</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'COMPANY',     key: 'company',  placeholder: 'Google' },
                  { label: 'ROLE',        key: 'role',     placeholder: 'Software Engineer L4' },
                  { label: 'LOCATION',    key: 'location', placeholder: 'Bangalore' },
                  { label: 'SALARY / CTC',key: 'salary',   placeholder: '₹50-80 LPA' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label htmlFor={`app-${key}`} style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 6 }}>{label}</label>
                    <input id={`app-${key}`} type="text" placeholder={placeholder}
                      value={(form as unknown as Record<string, string>)[key] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', fontSize: '0.875rem', color: '#fff', outline: 'none' }} />
                  </div>
                ))}
                <div>
                  <label htmlFor="app-applied-date" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 6 }}>APPLIED DATE</label>
                  <input id="app-applied-date" type="date" value={form.appliedDate} onChange={(e) => setForm((f) => ({ ...f, appliedDate: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', fontSize: '0.875rem', color: '#fff', outline: 'none' }} />
                </div>
                <div>
                  <label htmlFor="app-status" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 6 }}>STATUS</label>
                  <select id="app-status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AppStatus }))}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', fontSize: '0.875rem', color: '#fff', outline: 'none' }}>
                    {(Object.keys(STATUS_META) as AppStatus[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="app-notes" style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 6 }}>NOTES</label>
                <textarea id="app-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Referral source, key contact, anything to remember..."
                  rows={2} style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', fontSize: '0.875rem', color: '#fff', outline: 'none', resize: 'none' }} />
              </div>
              <div className="flex gap-3 mt-4">
                <motion.button onClick={addApp} disabled={!form.company || !form.role}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{ background: 'linear-gradient(135deg,#E82127,#ff6b35)', color: '#fff', fontWeight: 700, padding: '10px 24px', borderRadius: 9999, fontSize: '0.875rem', boxShadow: '0 0 20px rgba(232,33,39,0.3)', cursor: 'pointer', opacity: (!form.company || !form.role) ? 0.4 : 1 }}>
                  Add Application
                </motion.button>
                <button onClick={() => setShowAdd(false)}
                  style={{ color: 'var(--t3)', fontSize: '0.875rem', padding: '10px 16px', borderRadius: 9999, cursor: 'pointer', background: 'transparent', border: 'none' }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View toggle + filters */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-3 flex-wrap mb-6">
          {/* Tab toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9999, padding: 4 }}>
            {(['pipeline', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setTab(v)}
                style={{
                  padding: '6px 18px', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
                  background: tab === v ? '#E82127' : 'transparent',
                  color: tab === v ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  boxShadow: tab === v ? '0 0 16px rgba(232,33,39,0.4)' : 'none',
                }}>
                {v}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '8px 14px' }}>
            <Icon name="search" size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company or role..."
              style={{ background: 'transparent', fontSize: '0.875rem', color: '#fff', outline: 'none', width: 160, border: 'none' }} />
          </div>

          {/* Status filter pills */}
          <div className="flex gap-2 flex-wrap">
            {(['all', ...Object.keys(STATUS_META)] as (AppStatus | 'all')[]).map((s) => {
              const meta = s === 'all' ? null : STATUS_META[s];
              const isActive = filterStatus === s;
              return (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '6px 14px', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s',
                    color: isActive ? (meta?.color ?? 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.25)',
                    background: isActive ? (meta?.bg ?? 'rgba(255,255,255,0.08)') : 'transparent',
                    border: isActive ? `1px solid ${meta?.color ?? 'rgba(255,255,255,0.3)'}40` : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isActive && meta ? `0 0 10px ${meta.glow}` : 'none',
                  }}>
                  {s === 'all' ? 'All' : STATUS_META[s as AppStatus].label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Pipeline View */}
        {tab === 'pipeline' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {PIPELINE_COLS.map((status, colIdx) => {
              const col = byStatus(status);
              const meta = STATUS_META[status];
              return (
                <motion.div key={status}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: colIdx * 0.05 }}
                  className="min-h-48"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, marginBottom: 12, background: meta.bg, border: `1px solid ${meta.color}20` }}>
                    <Icon name={meta.icon} size={14} style={{ color: meta.color }} />
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: meta.color, flex: 1 }}>{meta.label}</span>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.map((app) => (
                      <motion.button key={app.id} onClick={() => setSelected(app)} type="button"
                        whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${meta.glow}` }}
                        style={{ width: '100%', textAlign: 'left', ...GLASS, borderRadius: 14, padding: 12, cursor: 'pointer' }}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.company}</p>
                          {app.starred && <Icon name="star" size={12} style={{ color: '#facc15', flexShrink: 0 }} filled />}
                        </div>
                        <p style={{ fontSize: '0.625rem', color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role}</p>
                        {app.rounds.length > 0 && (
                          <p style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>{app.rounds.length} round{app.rounds.length > 1 ? 's' : ''}</p>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Closed section in pipeline */}
        {tab === 'pipeline' && (byStatus('rejected').length > 0 || byStatus('withdrawn').length > 0) && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, marginBottom: 32 }}>
            <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: 16 }}>Closed</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[...byStatus('rejected'), ...byStatus('withdrawn')].map((app) => (
                <motion.button key={app.id} onClick={() => setSelected(app)} type="button"
                  whileHover={{ opacity: 1, scale: 1.02 }}
                  style={{ textAlign: 'left', ...GLASS, borderRadius: 14, padding: 16, cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.2s' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{app.company}</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <p style={{ fontSize: '0.625rem', color: 'var(--t3)' }}>{app.role}</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {tab === 'list' && (
          <div className="space-y-2 mb-8">
            {filtered.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.875rem', textAlign: 'center', padding: '4rem 0' }}>No applications match your filters.</p>
            ) : (
              [...filtered].sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()).map((app, i) => {
                const meta = STATUS_META[app.status];
                return (
                  <motion.button key={app.id} onClick={() => setSelected(app)} type="button"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    whileHover={{ scale: 1.005, boxShadow: `0 0 24px ${meta.glow}` }}
                    style={{ width: '100%', textAlign: 'left', ...GLASS, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 900, color: meta.color, flexShrink: 0 }}>
                      {app.company[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{app.company}</p>
                        {app.starred && <Icon name="star" size={14} style={{ color: '#facc15' }} filled />}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role} · {app.location}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                      <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)' }}>{new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)' }}>{app.rounds.length} rounds</p>
                      <StatusBadge status={app.status} />
                    </div>
                    <Icon name="chevron_right" size={16} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                  </motion.button>
                );
              })
            )}
          </div>
        )}

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }}
          style={{ ...GLASS, borderRadius: 20, padding: '1.5rem' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Icon name="lightbulb" size={18} style={{ color: '#facc15' }} filled />
            <h3 style={{ fontWeight: 900, fontSize: '0.875rem', letterSpacing: '-0.02em' }}>Interview Tips</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Apply to 5-8 companies at once to maintain leverage and avoid desperation.',
              'Log interview notes within 30 minutes — memory fades fast after a stressful round.',
              'Keep an "offer in hand" as negotiation leverage — never accept the first number.',
              'Rejected? Follow up after 3-6 months. Feedback improves your next attempt.',
              'Track your weak spots by round type — patterns emerge across companies.',
              'One offer received → log it for +100 XP to celebrate your achievement!',
            ].map((tip, i) => (
              <motion.div key={tip.slice(0, 20)}
                initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-2"
              >
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#E82127', marginTop: 8, flexShrink: 0 }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--t2)', lineHeight: 1.7 }}>{tip}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </AppShell>
  );
}
