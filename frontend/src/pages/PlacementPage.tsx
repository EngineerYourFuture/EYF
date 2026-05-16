import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

interface TrackProgress {
  id: string;
  title: string;
  company: string;
  icon: string;
  progress: number;
  totalTopics: number;
  completedTopics: number;
}

interface Application {
  id: string;
  company: string;
  role: string;
  status: 'applied' | 'oa' | 'interview' | 'offer' | 'rejected';
  appliedAt: string;
  nextStep?: string;
  nextStepDate?: string;
}

interface BehavioralQ {
  id: string;
  question: string;
  category: string;
  response?: string;
  lastPracticed?: string;
}

interface PlacementStats {
  applicationsSubmitted: number;
  interviewsScheduled: number;
  offersReceived: number;
  readinessScore: number;
}

const TRACKS = [
  { id: 'sde', title: 'SDE Track', company: 'FAANG', icon: 'code', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'ds', title: 'Data Science', company: 'MAANG', icon: 'data_object', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'sre', title: 'SRE / DevOps', company: 'Cloud', icon: 'cloud', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { id: 'pm', title: 'Product Management', company: 'Startups', icon: 'lightbulb', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
];

const COMPANIES = [
  { name: 'Google', logo: 'G', color: 'from-blue-500 to-green-400' },
  { name: 'Amazon', logo: 'A', color: 'from-orange-400 to-yellow-500' },
  { name: 'Microsoft', logo: 'M', color: 'from-blue-600 to-cyan-400' },
  { name: 'Meta', logo: 'M', color: 'from-blue-500 to-indigo-500' },
  { name: 'Apple', logo: '', color: 'from-zinc-400 to-zinc-600' },
  { name: 'Netflix', logo: 'N', color: 'from-red-500 to-red-700' },
  { name: 'Uber', logo: 'U', color: 'from-zinc-800 to-zinc-600' },
  { name: 'Airbnb', logo: 'A', color: 'from-pink-400 to-rose-500' },
  { name: 'Stripe', logo: 'S', color: 'from-indigo-500 to-purple-500' },
  { name: 'Flipkart', logo: 'F', color: 'from-blue-400 to-sky-500' },
  { name: 'Swiggy', logo: 'S', color: 'from-orange-500 to-amber-500' },
  { name: 'Zomato', logo: 'Z', color: 'from-red-400 to-rose-600' },
];

const BEHAVIORAL_QUESTIONS: BehavioralQ[] = [
  { id: 'b1', question: 'Tell me about a time you dealt with a difficult team member.', category: 'Conflict Resolution' },
  { id: 'b2', question: 'Describe a project where you had to learn a new technology quickly.', category: 'Learning Agility' },
  { id: 'b3', question: 'Give an example of when you failed and what you learned.', category: 'Growth Mindset' },
  { id: 'b4', question: 'Tell me about a time you had to make a decision with incomplete information.', category: 'Decision Making' },
  { id: 'b5', question: 'Describe a time you influenced others without direct authority.', category: 'Leadership' },
  { id: 'b6', question: 'Tell me about the most complex technical problem you\'ve solved.', category: 'Technical Depth' },
  { id: 'b7', question: 'Give an example of when you prioritized speed over quality, or vice versa.', category: 'Tradeoffs' },
  { id: 'b8', question: 'Describe a time you disagreed with your manager and how you handled it.', category: 'Conflict Resolution' },
  { id: 'b9', question: 'Tell me about a project you\'re most proud of and why.', category: 'Achievement' },
  { id: 'b10', question: 'How do you handle multiple competing priorities with the same deadline?', category: 'Time Management' },
  { id: 'b11', question: 'Describe a time you went above and beyond for a customer or user.', category: 'Customer Obsession' },
  { id: 'b12', question: 'Tell me about a time you improved a process or system proactively.', category: 'Ownership' },
];

const APP_STATUS: Record<Application['status'], { label: string; color: string; dot: string }> = {
  applied:   { label: 'Applied',    color: 'text-zinc-400 bg-zinc-500/10',   dot: 'bg-zinc-500' },
  oa:        { label: 'OA',         color: 'text-blue-400 bg-blue-500/10',   dot: 'bg-blue-400' },
  interview: { label: 'Interview',  color: 'text-yellow-400 bg-yellow-500/10', dot: 'bg-yellow-400' },
  offer:     { label: 'Offer 🎉',   color: 'text-green-400 bg-green-500/10', dot: 'bg-green-400' },
  rejected:  { label: 'Rejected',   color: 'text-red-400 bg-red-500/10',     dot: 'bg-red-400' },
};

const DAILY_QUESTION = {
  type: 'Behavioral',
  question: 'Describe a time you had to rapidly adapt to a significant change at work. What was the change, how did you respond, and what did you learn?',
  tip: 'Use the STAR method: Situation → Task → Action → Result. Aim for 2–3 minutes verbally.',
  category: 'Adaptability',
};

export function PlacementPage() {
  const navigate = useNavigate();
  const session = getSession();
  const { fireXP } = useUser();

  const [tracks, setTracks] = useState<TrackProgress[]>([]);
  const [stats, setStats] = useState<PlacementStats>({ applicationsSubmitted: 0, interviewsScheduled: 0, offersReceived: 0, readinessScore: 0 });
  const [applications, setApplications] = useState<Application[]>([]);
  const [behaviorals, setBehaviorals] = useState<BehavioralQ[]>(BEHAVIORAL_QUESTIONS);
  const [activeTab, setActiveTab] = useState<'tracks' | 'behavioral' | 'applications' | 'companies'>('tracks');
  const [selectedBQ, setSelectedBQ] = useState<BehavioralQ | null>(null);
  const [bqResponse, setBqResponse] = useState('');
  const [savingBQ, setSavingBQ] = useState(false);
  const [showAddApp, setShowAddApp] = useState(false);
  const [newApp, setNewApp] = useState({ company: '', role: '', status: 'applied' as Application['status'], nextStep: '', nextStepDate: '' });
  const [addingApp, setAddingApp] = useState(false);
  const [filterBQCat, setFilterBQCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState<Application['status'] | 'all'>('all');
  const [dailyAnswered, setDailyAnswered] = useState(false);
  const [dailyResponse, setDailyResponse] = useState('');
  const [showDailyInput, setShowDailyInput] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;

    apiRequest<{ tracks: TrackProgress[]; stats: PlacementStats }>('/placement/overview', { token: session.accessToken })
      .then((d) => {
        if (d.tracks?.length) setTracks(d.tracks);
        if (d.stats) setStats(d.stats);
      })
      .catch(() => {
        // fallback to local static
        setTracks(TRACKS.map((t) => ({ id: t.id, title: t.title, company: t.company, icon: t.icon, progress: 0, totalTopics: 20, completedTopics: 0 })));
      });

    apiRequest<{ applications: Application[] }>('/placement/applications', { token: session.accessToken })
      .then((d) => { if (d.applications?.length) setApplications(d.applications); })
      .catch(() => {});

    apiRequest<{ questions: BehavioralQ[] }>('/placement/behavioral', { token: session.accessToken })
      .then((d) => { if (d.questions?.length) setBehaviorals(d.questions); })
      .catch(() => {});
  }, [session?.accessToken]);

  const trackMeta = (id: string) => TRACKS.find((t) => t.id === id) ?? TRACKS[0];

  const saveBehavioral = async () => {
    if (!selectedBQ || !session?.accessToken || bqResponse.length < 10) return;
    setSavingBQ(true);
    try {
      await apiRequest(`/placement/behavioral/${selectedBQ.id}`, {
        token: session.accessToken,
        method: 'POST',
        body: { response: bqResponse },
      });
      setBehaviorals((prev) => prev.map((q) => q.id === selectedBQ.id
        ? { ...q, response: bqResponse, lastPracticed: new Date().toISOString() }
        : q
      ));
      fireXP(20, 'Behavioral question practiced!');
      setSelectedBQ(null);
      setBqResponse('');
    } catch {
      // ignore
    } finally {
      setSavingBQ(false);
    }
  };

  const addApplication = async () => {
    if (!session?.accessToken || !newApp.company || !newApp.role) return;
    setAddingApp(true);
    try {
      const created = await apiRequest<Application>('/placement/applications', {
        token: session.accessToken,
        method: 'POST',
        body: newApp,
      });
      setApplications((prev) => [created, ...prev]);
      setStats((s) => ({ ...s, applicationsSubmitted: s.applicationsSubmitted + 1 }));
      setNewApp({ company: '', role: '', status: 'applied', nextStep: '', nextStepDate: '' });
      setShowAddApp(false);
      fireXP(10, 'Application tracked!');
    } catch {
      // fallback: add locally
      const local: Application = { id: Date.now().toString(), company: newApp.company, role: newApp.role, status: newApp.status, appliedAt: new Date().toISOString(), nextStep: newApp.nextStep || undefined, nextStepDate: newApp.nextStepDate || undefined };
      setApplications((prev) => [local, ...prev]);
      setStats((s) => ({ ...s, applicationsSubmitted: s.applicationsSubmitted + 1 }));
      setNewApp({ company: '', role: '', status: 'applied', nextStep: '', nextStepDate: '' });
      setShowAddApp(false);
    } finally {
      setAddingApp(false);
    }
  };

  const updateAppStatus = async (id: string, status: Application['status']) => {
    if (!session?.accessToken) return;
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    try {
      await apiRequest(`/placement/applications/${id}`, {
        token: session.accessToken,
        method: 'PATCH',
        body: { status },
      });
      if (status === 'offer') fireXP(100, '🎉 Offer received!');
      if (status === 'interview') fireXP(30, 'Interview scheduled!');
    } catch {
      // ignore, local state already updated
    }
  };

  const submitDailyAnswer = async () => {
    if (!dailyResponse || dailyResponse.length < 20) return;
    setDailyAnswered(true);
    setShowDailyInput(false);
    fireXP(25, 'Daily question answered!');
    try {
      if (session?.accessToken) {
        await apiRequest('/placement/daily-answer', {
          token: session.accessToken,
          method: 'POST',
          body: { question: DAILY_QUESTION.question, response: dailyResponse },
        });
      }
    } catch {
      // ignore
    }
  };

  const bqCategories = ['all', ...Array.from(new Set(BEHAVIORAL_QUESTIONS.map((q) => q.category)))];
  const filteredBQ = filterBQCat === 'all' ? behaviorals : behaviorals.filter((q) => q.category === filterBQCat);
  const filteredApps = filterStatus === 'all' ? applications : applications.filter((a) => a.status === filterStatus);
  const practiceCount = behaviorals.filter((q) => q.lastPracticed).length;

  const readiness = Math.min(100, Math.round(
    (practiceCount / BEHAVIORAL_QUESTIONS.length) * 30 +
    (applications.length > 0 ? 20 : 0) +
    (applications.some((a) => a.status === 'interview') ? 25 : 0) +
    (stats.readinessScore || 25)
  ));

  const TABS = [
    { id: 'tracks' as const, label: 'Interview Tracks', icon: 'route' },
    { id: 'behavioral' as const, label: 'Behavioral', icon: 'record_voice_over' },
    { id: 'applications' as const, label: 'Applications', icon: 'work' },
    { id: 'companies' as const, label: 'Companies', icon: 'business' },
  ];

  if (selectedBQ) {
    return (
      <AppShell>
        <div className="pt-8 max-w-3xl">
          <button onClick={() => { setSelectedBQ(null); setBqResponse(''); }}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
            <Icon name="arrow_back" size={16} />Back to behavioral questions
          </button>

          <div className="bg-surface-container rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-primary-container/10 text-primary-container">
                {selectedBQ.category}
              </span>
              {selectedBQ.lastPracticed && (
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  Last practiced {new Date(selectedBQ.lastPracticed).toLocaleDateString()}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold leading-relaxed mb-6">{selectedBQ.question}</h2>

            <div className="bg-surface-container-highest rounded-xl p-4 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-2 flex items-center gap-1">
                <Icon name="tips_and_updates" size={12} />STAR Framework
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-on-surface-variant">
                {[
                  { label: 'S', name: 'Situation', desc: 'Set the scene' },
                  { label: 'T', name: 'Task', desc: 'Your responsibility' },
                  { label: 'A', name: 'Action', desc: 'What you did' },
                  { label: 'R', name: 'Result', desc: 'Quantified outcome' },
                ].map((s) => (
                  <div key={s.label} className="bg-surface-container rounded-lg p-2.5 text-center">
                    <p className="text-base font-black text-primary-container">{s.label}</p>
                    <p className="font-bold text-on-surface">{s.name}</p>
                    <p className="text-zinc-500">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedBQ.response && (
              <div className="mb-4 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-2">Previous Response</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{selectedBQ.response}</p>
              </div>
            )}

            <textarea
              value={bqResponse}
              onChange={(e) => setBqResponse(e.target.value)}
              placeholder="Write your STAR response here. Try to be specific — use real project names, numbers, and outcomes..."
              rows={8}
              className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:border-primary-container/40 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-zinc-600">{bqResponse.length} characters · ~{Math.ceil(bqResponse.split(' ').length / 130)} min read</p>
              <div className="flex gap-3">
                <button onClick={() => { setSelectedBQ(null); setBqResponse(''); }} className="text-sm text-zinc-500 hover:text-zinc-300 px-4 py-2 rounded-full transition-colors">Cancel</button>
                <button
                  onClick={saveBehavioral}
                  disabled={savingBQ || bqResponse.length < 10}
                  className="bg-primary-container text-white font-bold py-2.5 px-6 rounded-full text-sm hover:brightness-110 transition-all disabled:opacity-40 flex items-center gap-2"
                >
                  {savingBQ ? <Icon name="hourglass_empty" size={14} /> : <Icon name="save" size={14} />}
                  Save Response · +20 XP
                </button>
              </div>
            </div>
          </div>
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
            Placement <span className="text-primary-container">Prep.</span>
          </h1>
          <p className="text-on-surface-variant text-lg">FAANG-level interview preparation, engineered for precision.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: 'send', label: 'Applications', value: stats.applicationsSubmitted || applications.length, color: 'text-blue-400' },
            { icon: 'calendar_month', label: 'Interviews', value: stats.interviewsScheduled || applications.filter((a) => a.status === 'interview').length, color: 'text-yellow-400' },
            { icon: 'emoji_events', label: 'Offers', value: stats.offersReceived || applications.filter((a) => a.status === 'offer').length, color: 'text-green-400' },
            { icon: 'record_voice_over', label: 'BQ Practiced', value: `${practiceCount}/${BEHAVIORAL_QUESTIONS.length}`, color: 'text-purple-400' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name={s.icon} className={s.color} size={20} />
              </div>
              <div>
                <p className="text-2xl font-black text-on-surface">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAANG Readiness + Daily Question */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Readiness Score */}
          <div className="bg-surface-container rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <p className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500 mb-4">FAANG Readiness</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-5xl font-black text-on-surface">{readiness}</span>
                <span className="text-2xl font-black text-zinc-500 mb-1">/100</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    readiness >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                    readiness >= 40 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                    'bg-gradient-to-r from-primary-container to-red-400'
                  }`}
                  style={{ width: `${readiness}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">
                {readiness < 40 ? 'Keep practicing — you\'re building momentum!' :
                 readiness < 70 ? 'Good progress — focus on weak areas.' :
                 'Interview-ready! Start applying confidently.'}
              </p>
            </div>
            <div className="mt-4 space-y-1">
              {[
                { label: 'Behavioral prep', done: practiceCount >= 5 },
                { label: 'Applications tracked', done: applications.length > 0 },
                { label: 'Track in progress', done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500' : 'bg-surface-container-highest'}`}>
                    {item.done && <Icon name="check" size={10} className="text-white" />}
                  </div>
                  <span className={item.done ? 'text-on-surface' : 'text-zinc-500'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Question */}
          <div className="md:col-span-2 bg-surface-container rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-primary-container/10 rounded-lg flex items-center justify-center">
                  <Icon name="today" className="text-primary-container" size={16} />
                </div>
                <p className="font-['Inter'] uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Daily Interview Question</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-container/10 text-primary-container">{DAILY_QUESTION.type}</span>
            </div>

            <p className="text-base font-bold leading-relaxed mb-3">{DAILY_QUESTION.question}</p>
            <p className="text-xs text-zinc-500 mb-5 flex items-center gap-1">
              <Icon name="tips_and_updates" size={12} className="text-yellow-400" />
              {DAILY_QUESTION.tip}
            </p>

            {dailyAnswered ? (
              <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                <Icon name="check_circle" size={18} filled />
                Answered today · +25 XP earned
              </div>
            ) : showDailyInput ? (
              <div>
                <textarea
                  value={dailyResponse}
                  onChange={(e) => setDailyResponse(e.target.value)}
                  placeholder="Write your answer using STAR format..."
                  rows={4}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/40 resize-none mb-3"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowDailyInput(false)} className="text-sm text-zinc-500 hover:text-zinc-300 px-3 py-2 rounded-full">Cancel</button>
                  <button
                    onClick={submitDailyAnswer}
                    disabled={dailyResponse.length < 20}
                    className="bg-primary-container text-white font-bold py-2 px-5 rounded-full text-sm hover:brightness-110 disabled:opacity-40"
                  >
                    Submit · +25 XP
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDailyInput(true)}
                className="bg-primary-container text-white font-bold py-2.5 px-6 rounded-full text-sm hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Icon name="edit" size={14} />
                Answer Today's Question
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container p-1 rounded-full mb-8 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-container text-white shadow-lg shadow-red-900/20'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Icon name={tab.icon} size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Tracks */}
        {activeTab === 'tracks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TRACKS.map((t) => {
              const tp = tracks.find((tr) => tr.id === t.id);
              const progress = tp?.progress ?? 0;
              const completed = tp?.completedTopics ?? 0;
              const total = tp?.totalTopics ?? 20;
              return (
                <div key={t.id} className={`bg-surface-container rounded-2xl p-7 border ${t.border} hover:bg-surface-container-high transition-all group`}>
                  <div className="flex justify-between items-start mb-5">
                    <div className={`w-12 h-12 ${t.bg} rounded-xl flex items-center justify-center ${t.color}`}>
                      <Icon name={t.icon} size={24} />
                    </div>
                    <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {t.company}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{t.title}</h3>
                  <p className="text-xs text-zinc-500 mb-5">{completed}/{total} topics covered</p>

                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                    <span>Progress</span><span className={t.color}>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-5">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      t.id === 'sde' ? 'bg-blue-400' :
                      t.id === 'ds' ? 'bg-purple-400' :
                      t.id === 'sre' ? 'bg-green-400' : 'bg-yellow-400'
                    }`} style={{ width: `${progress}%` }} />
                  </div>

                  <button
                    onClick={() => navigate(`/app/placement/${t.id}`)}
                    className={`flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest ${t.color} group-hover:underline`}
                  >
                    {progress > 0 ? 'Continue Track' : 'Start Track'}
                    <Icon name="arrow_forward" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Behavioral */}
        {activeTab === 'behavioral' && (
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <p className="text-sm text-zinc-500">{practiceCount} of {BEHAVIORAL_QUESTIONS.length} questions practiced</p>
              <div className="flex gap-2 flex-wrap">
                {bqCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterBQCat(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      filterBQCat === cat
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredBQ.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => { setSelectedBQ(q); setBqResponse(q.response ?? ''); }}
                  className="w-full text-left bg-surface-container rounded-xl p-5 hover:bg-surface-container-high transition-all group flex items-start gap-4"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${q.lastPracticed ? 'bg-green-500/10' : 'bg-surface-container-highest'}`}>
                    <Icon name={q.lastPracticed ? 'check_circle' : 'record_voice_over'} size={18} className={q.lastPracticed ? 'text-green-400' : 'text-zinc-500'} filled={!!q.lastPracticed} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary-container/70">{q.category}</span>
                      {q.lastPracticed && (
                        <span className="text-[10px] text-zinc-600">Practiced {new Date(q.lastPracticed).toLocaleDateString()}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-on-surface group-hover:text-primary-container transition-colors">{q.question}</p>
                    {q.response && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{q.response}</p>
                    )}
                  </div>
                  <Icon name="chevron_right" size={18} className="text-zinc-600 group-hover:text-zinc-300 flex-shrink-0 mt-0.5 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Applications */}
        {activeTab === 'applications' && (
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'applied', 'oa', 'interview', 'offer', 'rejected'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      filterStatus === s
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {s === 'all' ? 'All' : APP_STATUS[s].label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAddApp(true)}
                className="bg-primary-container text-white font-bold py-2.5 px-5 rounded-full text-sm hover:brightness-110 transition-all flex items-center gap-2"
              >
                <Icon name="add" size={16} />Track Application
              </button>
            </div>

            {showAddApp && (
              <div className="bg-surface-container rounded-2xl p-6 mb-6 border border-primary-container/20">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Icon name="work" size={16} className="text-primary-container" />
                  Add Application
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    value={newApp.company}
                    onChange={(e) => setNewApp((p) => ({ ...p, company: e.target.value }))}
                    placeholder="Company name"
                    className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-container/40"
                  />
                  <input
                    type="text"
                    value={newApp.role}
                    onChange={(e) => setNewApp((p) => ({ ...p, role: e.target.value }))}
                    placeholder="Role title"
                    className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-container/40"
                  />
                  <select
                    value={newApp.status}
                    onChange={(e) => setNewApp((p) => ({ ...p, status: e.target.value as Application['status'] }))}
                    className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                  >
                    {Object.entries(APP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input
                    type="text"
                    value={newApp.nextStep}
                    onChange={(e) => setNewApp((p) => ({ ...p, nextStep: e.target.value }))}
                    placeholder="Next step (e.g. OA, Phone Screen)"
                    className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <input
                    type="date"
                    value={newApp.nextStepDate}
                    onChange={(e) => setNewApp((p) => ({ ...p, nextStepDate: e.target.value }))}
                    className="bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none md:col-span-2"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowAddApp(false)} className="text-sm text-zinc-500 hover:text-zinc-300 px-4 py-2 rounded-full">Cancel</button>
                  <button
                    onClick={addApplication}
                    disabled={addingApp || !newApp.company || !newApp.role}
                    className="bg-primary-container text-white font-bold py-2 px-5 rounded-full text-sm hover:brightness-110 disabled:opacity-40"
                  >
                    {addingApp ? 'Adding...' : 'Add Application'}
                  </button>
                </div>
              </div>
            )}

            {filteredApps.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="work_outline" size={48} className="text-zinc-700 mb-4" />
                <p className="text-on-surface-variant font-bold mb-2">No applications tracked yet</p>
                <p className="text-sm text-zinc-500">Track every application to stay organized and never miss a follow-up.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app) => {
                  const status = APP_STATUS[app.status];
                  return (
                    <div key={app.id} className="bg-surface-container rounded-xl p-5 flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-on-surface">{app.company}</p>
                          <span className="text-zinc-500">·</span>
                          <p className="text-sm text-on-surface-variant">{app.role}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                          <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                          {app.nextStep && (
                            <span className="flex items-center gap-1">
                              <Icon name="schedule" size={11} />
                              {app.nextStep}{app.nextStepDate ? ` · ${new Date(app.nextStepDate).toLocaleDateString()}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <select
                        value={app.status}
                        onChange={(e) => updateAppStatus(app.id, e.target.value as Application['status'])}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full border-0 focus:outline-none cursor-pointer ${status.color}`}
                      >
                        {Object.entries(APP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Companies */}
        {activeTab === 'companies' && (
          <div>
            <p className="text-sm text-on-surface-variant mb-6">Click a company to see tailored interview prep insights for that company's process.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {COMPANIES.map((c) => (
                <div
                  key={c.name}
                  className="bg-surface-container rounded-xl p-6 flex flex-col items-center gap-3 hover:bg-surface-container-high transition-all cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                    {c.logo || <Icon name="apple" size={20} />}
                  </div>
                  <p className="font-bold text-on-surface text-sm group-hover:text-primary-container transition-colors">{c.name}</p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Interview Guide</span>
                </div>
              ))}
            </div>

            {/* Company interview process overview */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { company: 'Google / FAANG', steps: ['OA (90 min coding)', '2x DSA interviews', 'System Design', 'Googleyness / Behavioral', 'Team Match'], color: 'text-blue-400', icon: 'code' },
                { company: 'Amazon', steps: ['OA + Work Simulation', 'Phone Screen DSA', '5-6 On-site loops', '14 Leadership Principles', 'Bar Raiser round'], color: 'text-orange-400', icon: 'bolt' },
                { company: 'Microsoft', steps: ['Recruiter Call', 'Technical Screen', '4 On-site interviews', 'Focus on coding quality', 'Behavioral + culture fit'], color: 'text-cyan-400', icon: 'window' },
              ].map((co) => (
                <div key={co.company} className="bg-surface-container rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name={co.icon} className={co.color} size={18} />
                    <h3 className="font-bold text-sm">{co.company}</h3>
                  </div>
                  <ol className="space-y-2">
                    {co.steps.map((step, i) => (
                      <li key={step} className="flex items-center gap-3 text-xs text-on-surface-variant">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 bg-surface-container-highest ${co.color}`}>{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
