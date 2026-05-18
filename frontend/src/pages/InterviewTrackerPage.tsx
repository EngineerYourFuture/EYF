import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

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

const STATUS_META: Record<AppStatus, { label: string; color: string; bg: string; icon: string; order: number }> = {
  applied:   { label: 'Applied',   color: 'text-zinc-400',   bg: 'bg-zinc-500/10',   icon: 'send',              order: 0 },
  oa:        { label: 'OA',        color: 'text-blue-400',   bg: 'bg-blue-500/10',   icon: 'code',              order: 1 },
  phone:     { label: 'Phone',     color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   icon: 'call',              order: 2 },
  onsite:    { label: 'Onsite',    color: 'text-orange-400', bg: 'bg-orange-500/10', icon: 'corporate_fare',    order: 3 },
  offer:     { label: 'Offer 🎉',  color: 'text-green-400',  bg: 'bg-green-500/10',  icon: 'celebration',       order: 4 },
  rejected:  { label: 'Rejected',  color: 'text-red-400',    bg: 'bg-red-500/10',    icon: 'cancel',            order: 5 },
  withdrawn: { label: 'Withdrawn', color: 'text-zinc-600',   bg: 'bg-zinc-700/20',   icon: 'exit_to_app',       order: 6 },
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${meta.color} ${meta.bg}`}>
      <Icon name={meta.icon} size={10} />
      {meta.label}
    </span>
  );
}

function StageBar({ status }: { readonly status: AppStatus }) {
  const stages: AppStatus[] = ['applied', 'oa', 'phone', 'onsite', 'offer'];
  const currentOrder = STATUS_META[status].order;
  return (
    <div className="flex items-center gap-1 mt-2">
      {stages.map((s, i) => {
        const order = STATUS_META[s].order;
        const meta = STATUS_META[s];
        const active = status === s;
        const done = !['rejected', 'withdrawn'].includes(status) && currentOrder > order;
        let stageClass = 'bg-zinc-800';
        if (done) stageClass = 'bg-green-400';
        else if (active) stageClass = `${meta.bg.replace('/10', '/40')} ${meta.color}`;
        return (
          <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
            <div className={`h-1.5 rounded-full flex-1 transition-all ${stageClass}`} />
            {i < stages.length - 1 && <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 flex-shrink-0" />}
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

  // Stats
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

  // Pipeline view
  const PIPELINE_COLS: AppStatus[] = ['applied', 'oa', 'phone', 'onsite', 'offer'];

  const roundResultIcon = (r: Round['result']) => {
    if (r === 'pass') return 'check_circle';
    if (r === 'fail') return 'cancel';
    return 'schedule';
  };
  const roundResultColor = (r: Round['result']) => {
    if (r === 'pass') return 'text-green-400';
    if (r === 'fail') return 'text-red-400';
    return 'text-zinc-500';
  };
  const diffColor = (d: Difficulty) => {
    if (d === 'easy') return 'text-green-400 bg-green-500/10';
    if (d === 'medium') return 'text-yellow-400 bg-yellow-500/10';
    return 'text-red-400 bg-red-500/10';
  };

  // Detail view
  if (selected) {
    return (
      <AppShell>
        <div className="pt-8 max-w-3xl">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 mb-6 text-sm transition-colors">
            <Icon name="arrow_back" size={16} /> Back to tracker
          </button>

          {/* Company header */}
          <div className="bg-[#161616] border border-white/5 rounded-2xl p-8 mb-5">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black tracking-tighter">{selected.company}</h1>
                  <button onClick={() => toggleStar(selected.id)} className="transition-colors">
                    <Icon name="star" size={20} className={selected.starred ? 'text-yellow-400' : 'text-zinc-700'} filled={selected.starred} />
                  </button>
                </div>
                <p className="text-zinc-400 text-sm">{selected.role}</p>
                <p className="text-zinc-600 text-xs mt-1">{selected.location}{selected.remote ? ' · Remote OK' : ''}{selected.salary ? ` · ${selected.salary}` : ''}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            {/* Stage bar */}
            {!['rejected', 'withdrawn'].includes(selected.status) && <StageBar status={selected.status} />}

            {/* Update status */}
            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_META) as AppStatus[]).map((s) => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      selected.status === s
                        ? `${STATUS_META[s].bg} ${STATUS_META[s].color} border-current/30`
                        : 'text-zinc-600 border-zinc-800 hover:text-zinc-400'
                    }`}
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rounds */}
          <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-sm">Interview Rounds</h2>
              <button onClick={() => setShowAddRound(true)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#E82127] hover:opacity-80 transition-opacity">
                <Icon name="add" size={14} /> Add Round
              </button>
            </div>

            {selected.rounds.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-6">No rounds logged yet.</p>
            ) : (
              <div className="space-y-3">
                {selected.rounds.map((round, i) => (
                  <div key={round.id} className="flex items-start gap-4 p-4 bg-[#1a1a1a] rounded-xl">
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-[#222] flex items-center justify-center text-xs font-bold text-zinc-500">{i + 1}</div>
                      {i < selected.rounds.length - 1 && <div className="w-0.5 h-8 bg-zinc-800 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-white">{round.type}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${diffColor(round.difficulty)}`}>{round.difficulty}</span>
                        <Icon name={roundResultIcon(round.result)} size={14} className={roundResultColor(round.result)} filled={round.result !== 'pending'} />
                      </div>
                      <p className="text-[10px] text-zinc-600 mb-1">{new Date(round.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      {round.notes && <p className="text-xs text-zinc-400 leading-relaxed">{round.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddRound && (
              <div className="mt-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#E82127]/20 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="round-type" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Round Type</label>
                    <select id="round-type" value={roundForm.type} onChange={(e) => setRoundForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full bg-[#111] border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                      {ROUND_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="round-date" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Date</label>
                    <input id="round-date" type="date" value={roundForm.date} onChange={(e) => setRoundForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full bg-[#111] border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="round-result" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Result</label>
                    <select id="round-result" value={roundForm.result} onChange={(e) => setRoundForm((f) => ({ ...f, result: e.target.value as Round['result'] }))}
                      className="w-full bg-[#111] border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                      <option value="pending">Pending</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="round-difficulty" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Difficulty</label>
                    <select id="round-difficulty" value={roundForm.difficulty} onChange={(e) => setRoundForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))}
                      className="w-full bg-[#111] border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="round-notes" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Notes</label>
                  <textarea id="round-notes" value={roundForm.notes} onChange={(e) => setRoundForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Questions asked, how it went, what to improve..."
                    rows={3} className="w-full bg-[#111] border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={addRound} className="bg-[#E82127] text-white font-bold px-4 py-2 rounded-full text-xs hover:brightness-110 transition-all">Save Round</button>
                  <button onClick={() => setShowAddRound(false)} className="text-zinc-500 hover:text-zinc-300 text-xs px-4 py-2 rounded-full transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {selected.notes && (
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 mb-5">
              <h2 className="font-black text-sm mb-3">Notes</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">{selected.notes}</p>
            </div>
          )}

          {/* Delete */}
          <button onClick={() => { deleteApp(selected.id); }} className="text-zinc-700 hover:text-red-400 text-xs transition-colors flex items-center gap-1">
            <Icon name="delete" size={14} /> Delete this application
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-1">Interview Tracker</h1>
            <p className="text-zinc-500 text-sm">Log your applications, track rounds, and land that offer.</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="bg-[#E82127] text-white font-bold py-3 px-6 rounded-full hover:brightness-110 transition-all flex items-center gap-2 text-sm shadow-lg shadow-red-900/20">
            <Icon name="add" size={18} /> Add Application
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applied', value: total, icon: 'send', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
            { label: 'Active',        value: active, icon: 'trending_up', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Offers',        value: offers, icon: 'celebration', color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Offer Rate',    value: `${offerRate}%`, icon: 'percent', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon name={s.icon} size={18} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Application Modal */}
        {showAdd && (
          <div className="bg-[#161616] border border-[#E82127]/25 rounded-2xl p-6 mb-8 space-y-4">
            <h3 className="font-black text-base">New Application</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Company', key: 'company', placeholder: 'Google' },
                { label: 'Role', key: 'role', placeholder: 'Software Engineer L4' },
                { label: 'Location', key: 'location', placeholder: 'Bangalore' },
                { label: 'Salary / CTC', key: 'salary', placeholder: '₹50-80 LPA' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label htmlFor={`app-${key}`} className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">{label}</label>
                  <input id={`app-${key}`} type="text" placeholder={placeholder}
                    value={(form as unknown as Record<string, string>)[key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-[#E82127]/40" />
                </div>
              ))}
              <div>
                <label htmlFor="app-applied-date" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Applied Date</label>
                <input id="app-applied-date" type="date" value={form.appliedDate} onChange={(e) => setForm((f) => ({ ...f, appliedDate: e.target.value }))}
                  className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E82127]/40" />
              </div>
              <div>
                <label htmlFor="app-status" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Status</label>
                <select id="app-status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AppStatus }))}
                  className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none">
                  {(Object.keys(STATUS_META) as AppStatus[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="app-notes" className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 block mb-1">Notes</label>
              <textarea id="app-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Referral source, key contact, anything to remember..."
                rows={2} className="w-full bg-[#111] border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-700 focus:outline-none resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={addApp} disabled={!form.company || !form.role}
                className="bg-[#E82127] text-white font-bold px-6 py-2.5 rounded-full text-sm hover:brightness-110 transition-all disabled:opacity-40">
                Add Application
              </button>
              <button onClick={() => setShowAdd(false)} className="text-zinc-500 hover:text-zinc-300 text-sm px-4 py-2.5 rounded-full transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* View toggle + filters */}
        <div className="flex items-center gap-3 flex-wrap mb-6">
          <div className="flex bg-[#1a1a1a] border border-white/8 rounded-full p-1">
            {(['pipeline', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setTab(v)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${tab === v ? 'bg-[#E82127] text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/8 rounded-xl px-3 py-2">
            <Icon name="search" size={14} className="text-zinc-600" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company or role..."
              className="bg-transparent text-sm text-white placeholder:text-zinc-700 focus:outline-none w-40" />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['all', ...Object.keys(STATUS_META)] as (AppStatus | 'all')[]).map((s) => {
              const meta = s === 'all' ? null : STATUS_META[s];
              return (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    filterStatus === s
                      ? `${meta?.bg ?? 'bg-zinc-500/10'} ${meta?.color ?? 'text-zinc-300'} border-current/30`
                      : 'text-zinc-600 border-zinc-800 hover:text-zinc-400'
                  }`}>
                  {s === 'all' ? 'All' : STATUS_META[s].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pipeline View */}
        {tab === 'pipeline' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {PIPELINE_COLS.map((status) => {
              const col = byStatus(status);
              const meta = STATUS_META[status];
              return (
                <div key={status} className="min-h-48">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 ${meta.bg}`}>
                    <Icon name={meta.icon} size={14} className={meta.color} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>{meta.label}</span>
                    <span className="ml-auto text-[10px] font-bold text-zinc-600">{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.map((app) => (
                      <button key={app.id} onClick={() => setSelected(app)} type="button"
                        className="w-full text-left bg-[#1a1a1a] border border-white/8 rounded-xl p-3 hover:border-white/15 transition-all group">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <p className="text-white text-xs font-bold truncate">{app.company}</p>
                          {app.starred && <Icon name="star" size={12} className="text-yellow-400 flex-shrink-0" filled />}
                        </div>
                        <p className="text-zinc-500 text-[10px] truncate">{app.role}</p>
                        {app.rounds.length > 0 && (
                          <p className="text-[9px] text-zinc-700 mt-1">{app.rounds.length} round{app.rounds.length > 1 ? 's' : ''}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rejected / Withdrawn in pipeline */}
        {tab === 'pipeline' && (byStatus('rejected').length > 0 || byStatus('withdrawn').length > 0) && (
          <div className="border-t border-zinc-800 pt-6 mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-4">Closed</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[...byStatus('rejected'), ...byStatus('withdrawn')].map((app) => (
                <button key={app.id} onClick={() => setSelected(app)} type="button"
                  className="text-left bg-[#1a1a1a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all opacity-60 hover:opacity-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-xs font-bold">{app.company}</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-zinc-500 text-[10px]">{app.role}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {tab === 'list' && (
          <div className="space-y-2 mb-8">
            {filtered.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-16">No applications match your filters.</p>
            ) : (
              filtered.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()).map((app) => (
                <button key={app.id} onClick={() => setSelected(app)} type="button"
                  className="w-full text-left bg-[#161616] border border-white/5 rounded-xl px-5 py-4 hover:bg-[#1e1e1e] hover:border-white/10 transition-all group flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#222] rounded-xl flex items-center justify-center text-base font-black text-white flex-shrink-0">
                    {app.company[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white text-sm font-bold">{app.company}</p>
                      {app.starred && <Icon name="star" size={14} className="text-yellow-400" filled />}
                    </div>
                    <p className="text-zinc-500 text-xs truncate">{app.role} · {app.location}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                    <p className="text-[10px] text-zinc-600">{new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    <p className="text-[10px] text-zinc-600">{app.rounds.length} rounds</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <Icon name="chevron_right" size={16} className="text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Tips */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="lightbulb" size={18} className="text-yellow-400" filled />
            <h3 className="font-black text-sm">Interview Tips</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Apply to 5-8 companies at once to maintain leverage and avoid desperation.',
              'Log interview notes within 30 minutes — memory fades fast after a stressful round.',
              'Keep an "offer in hand" as negotiation leverage — never accept the first number.',
              'Rejected? Follow up after 3-6 months. Feedback improves your next attempt.',
              'Track your weak spots by round type — patterns emerge across companies.',
              'One offer received → log it for +100 XP to celebrate your achievement!',
            ].map((tip) => (
              <div key={tip.slice(0, 20)} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#E82127] mt-2 flex-shrink-0" />
                <p className="text-xs text-zinc-500 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
