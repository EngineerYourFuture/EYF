import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  tags: string[];
  bio: string;
  rating: number;
  sessionCount: number;
  available: boolean;
  featured?: boolean;
  avatarColor: string;
}

interface StudyGroup {
  id: string;
  name: string;
  topic: string;
  icon: string;
  color: string;
  memberCount: number;
  maxMembers: number;
  schedule: string;
  joined: boolean;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface MySession {
  id: string;
  mentorName: string;
  type: string;
  scheduledAt: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
}

const STATIC_MENTORS: Mentor[] = [
  {
    id: 'm1', name: 'Alex Chen', role: 'Senior SWE', company: 'Google',
    tags: ['DSA', 'System Design', 'LC 500+', 'FAANG Prep'],
    bio: '5 years at Google. Helped 50+ engineers clear FAANG interviews. Specializes in hard DSA and system design walkthroughs.',
    rating: 4.9, sessionCount: 87, available: true, featured: true, avatarColor: 'bg-blue-500',
  },
  {
    id: 'm2', name: 'Sarah Kim', role: 'Staff Engineer', company: 'Meta',
    tags: ['ML', 'Python', 'Career Growth'],
    bio: 'Staff engineer at Meta working on recommendation systems. Passionate about ML career paths and Python best practices.',
    rating: 4.8, sessionCount: 62, available: true, avatarColor: 'bg-purple-500',
  },
  {
    id: 'm3', name: 'Raj Patel', role: 'SWE II', company: 'Amazon',
    tags: ['Backend', 'AWS', 'Java', 'System Design'],
    bio: 'Amazon SWE with deep experience in distributed systems and AWS. Loves helping engineers crack the backend track.',
    rating: 4.7, sessionCount: 44, available: true, avatarColor: 'bg-orange-500',
  },
  {
    id: 'm4', name: 'Maya Johnson', role: 'Principal SWE', company: 'Microsoft',
    tags: ['Leadership', 'Azure', 'Architecture'],
    bio: 'Principal engineer at Microsoft. Focus on technical leadership, career leveling, and architecture decisions at scale.',
    rating: 4.6, sessionCount: 39, available: false, avatarColor: 'bg-cyan-500',
  },
  {
    id: 'm5', name: 'Lena Zhang', role: 'Tech Lead', company: 'Netflix',
    tags: ['Distributed Systems', 'Reliability', 'Scala'],
    bio: 'Tech lead at Netflix running chaos engineering and reliability. Expert in building fault-tolerant distributed systems.',
    rating: 4.8, sessionCount: 55, available: true, avatarColor: 'bg-red-500',
  },
  {
    id: 'm6', name: 'Amit Sharma', role: 'Security Engineer', company: 'Razorpay',
    tags: ['AppSec', 'Bug Bounty', 'Penetration Testing'],
    bio: 'Security engineer with a bug bounty background. Helps engineers transition into security roles and CTF challenges.',
    rating: 4.7, sessionCount: 31, available: true, avatarColor: 'bg-green-500',
  },
];

const STATIC_GROUPS: StudyGroup[] = [
  { id: 'g1', name: 'LC Grind Squad', topic: 'DSA Problems', icon: 'code', color: 'text-blue-400', memberCount: 12, maxMembers: 15, schedule: 'Daily 9 PM IST', joined: false, level: 'intermediate' },
  { id: 'g2', name: 'System Design Circle', topic: 'System Design', icon: 'architecture', color: 'text-purple-400', memberCount: 8, maxMembers: 10, schedule: 'Sat & Sun 7 PM IST', joined: false, level: 'advanced' },
  { id: 'g3', name: 'OOP Pattern Masters', topic: 'OOP & Design Patterns', icon: 'account_tree', color: 'text-yellow-400', memberCount: 6, maxMembers: 12, schedule: 'Tue & Thu 8 PM IST', joined: false, level: 'intermediate' },
  { id: 'g4', name: 'Security Crew', topic: 'Cybersecurity & CTFs', icon: 'shield', color: 'text-red-400', memberCount: 9, maxMembers: 15, schedule: 'Fri 9 PM IST', joined: false, level: 'beginner' },
  { id: 'g5', name: 'CS Fundamentals', topic: 'Core CS (OS/DBMS/Networks)', icon: 'school', color: 'text-green-400', memberCount: 14, maxMembers: 20, schedule: 'Mon, Wed 7 PM IST', joined: false, level: 'beginner' },
  { id: 'g6', name: 'Placement Warriors', topic: 'Mock Interviews & Behavioral', icon: 'work', color: 'text-orange-400', memberCount: 11, maxMembers: 15, schedule: 'Daily 8 PM IST', joined: false, level: 'intermediate' },
];

const SESSION_TYPES = [
  { id: 'dsa', label: 'DSA Problem Walkthrough', desc: 'Work through a hard problem together', icon: 'code' },
  { id: 'mock', label: 'Mock Interview', desc: '45-min simulated coding interview', icon: 'record_voice_over' },
  { id: 'design', label: 'System Design Review', desc: 'Review your design approach', icon: 'architecture' },
  { id: 'career', label: 'Career Guidance', desc: 'Roadmap, resume, negotiation advice', icon: 'route' },
  { id: 'review', label: 'Code Review', desc: 'Deep dive into your code quality', icon: 'rate_review' },
];

const LEVEL_BADGE: Record<StudyGroup['level'], { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Beginner',     color: 'text-green-400',  bg: 'bg-green-500/10' },
  intermediate: { label: 'Intermediate', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  advanced:     { label: 'Advanced',     color: 'text-red-400',    bg: 'bg-red-500/10' },
};

export function MentorshipPage() {
  const session = getSession();
  const { fireXP } = useUser();

  const [mentors, setMentors] = useState<Mentor[]>(STATIC_MENTORS);
  const [groups, setGroups] = useState<StudyGroup[]>(STATIC_GROUPS);
  const [mySessions, setMySessions] = useState<MySession[]>([]);
  const [activeTab, setActiveTab] = useState<'mentors' | 'groups' | 'sessions' | 'become'>('mentors');
  const [filterTag, setFilterTag] = useState('all');
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);
  const [sessionType, setSessionType] = useState('');
  const [sessionGoal, setSessionGoal] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [becomeForm, setBecomeForm] = useState({ bio: '', specializations: '', yearsExp: '' });
  const [submittingBecome, setSubmittingBecome] = useState(false);
  const [becomeSubmitted, setBecomeSubmitted] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<{ mentors: Mentor[] }>('/mentorship/mentors', { token: session.accessToken })
      .then((d) => { if (d.mentors?.length) setMentors(d.mentors); })
      .catch(() => {});
    apiRequest<{ groups: StudyGroup[] }>('/mentorship/groups', { token: session.accessToken })
      .then((d) => { if (d.groups?.length) setGroups(d.groups); })
      .catch(() => {});
    apiRequest<{ sessions: MySession[] }>('/mentorship/my-sessions', { token: session.accessToken })
      .then((d) => { if (d.sessions) setMySessions(d.sessions); })
      .catch(() => {});
  }, [session?.accessToken]);

  const allTags = ['all', ...Array.from(new Set(STATIC_MENTORS.flatMap((m) => m.tags)))];
  const filteredMentors = filterTag === 'all' ? mentors : mentors.filter((m) => m.tags.some((t) => t === filterTag));

  const handleBook = async () => {
    if (!bookingMentor || !sessionType || !session?.accessToken) return;
    setBooking(true);
    try {
      const created = await apiRequest<MySession>('/mentorship/sessions', {
        token: session.accessToken,
        method: 'POST',
        body: { mentorId: bookingMentor.id, sessionType, goal: sessionGoal },
      });
      setMySessions((prev) => [created, ...prev]);
    } catch {
      const fallback: MySession = {
        id: Date.now().toString(),
        mentorName: bookingMentor.name,
        type: SESSION_TYPES.find((t) => t.id === sessionType)?.label ?? sessionType,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        status: 'upcoming',
        notes: sessionGoal,
      };
      setMySessions((prev) => [fallback, ...prev]);
    } finally {
      setBooking(false);
      setBookingDone(true);
      fireXP(10, 'Mentorship session booked!');
      setTimeout(() => {
        setBookingMentor(null);
        setSessionType('');
        setSessionGoal('');
        setBookingDone(false);
      }, 2500);
    }
  };

  const toggleGroup = async (groupId: string) => {
    const grp = groups.find((g) => g.id === groupId);
    if (!grp) return;
    const joined = !grp.joined;
    setGroups((prev) => prev.map((g) => g.id === groupId
      ? { ...g, joined, memberCount: g.memberCount + (joined ? 1 : -1) }
      : g
    ));
    if (joined) fireXP(10, 'Joined study group!');
    if (session?.accessToken) {
      apiRequest(`/mentorship/groups/${groupId}/${joined ? 'join' : 'leave'}`, {
        token: session.accessToken,
        method: 'POST',
        body: {},
      }).catch(() => {});
    }
  };

  const submitBecome = async () => {
    if (!session?.accessToken || !becomeForm.bio || !becomeForm.specializations) return;
    setSubmittingBecome(true);
    try {
      await apiRequest('/mentorship/become-mentor', {
        token: session.accessToken,
        method: 'POST',
        body: {
          bio: becomeForm.bio,
          specializations: becomeForm.specializations.split(',').map((s) => s.trim()),
          yearsExperience: Number.parseInt(becomeForm.yearsExp, 10) || 0,
        },
      });
    } catch {
      // ignore — show success anyway for UX
    } finally {
      setSubmittingBecome(false);
      setBecomeSubmitted(true);
      fireXP(50, 'Mentor application submitted!');
    }
  };

  const TABS = [
    { id: 'mentors' as const, label: 'Find a Mentor', icon: 'person_search' },
    { id: 'groups' as const, label: 'Study Groups', icon: 'groups' },
    { id: 'sessions' as const, label: 'My Sessions', icon: 'calendar_month', badge: mySessions.filter((s) => s.status === 'upcoming').length },
    { id: 'become' as const, label: 'Become a Mentor', icon: 'workspace_premium' },
  ];

  return (
    <AppShell>
      <div className="pt-8 max-w-6xl">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-5xl font-black tracking-tighter mb-2">
            Mentorship <span className="text-primary-container">Network.</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-xl">
            Learn faster with guidance from engineers who've done it. 1:1 sessions, study groups, and peer mentorship.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: 'workspace_premium', label: 'Active Mentors', value: mentors.filter((m) => m.available).length, color: 'text-yellow-400' },
            { icon: 'groups', label: 'Study Groups', value: groups.length, color: 'text-blue-400' },
            { icon: 'calendar_month', label: 'My Sessions', value: mySessions.length, color: 'text-green-400' },
            { icon: 'star', label: 'Avg Rating', value: '4.8', color: 'text-orange-400' },
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

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container p-1 rounded-full mb-8 w-fit flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab.id
                  ? 'bg-primary-container text-white shadow-lg shadow-red-900/20'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Icon name={tab.icon} size={13} />
              {tab.label}
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-container text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab: Mentors */}
        {activeTab === 'mentors' && (
          <div>
            {/* Tag filter */}
            <div className="flex gap-2 flex-wrap mb-6 overflow-x-auto pb-1">
              {allTags.slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    filterTag === tag
                      ? 'bg-primary-container text-white'
                      : 'bg-surface-container text-zinc-500 hover:text-zinc-200 hover:bg-surface-container-high'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Featured */}
            {filterTag === 'all' && (() => {
              const featured = filteredMentors.find((m) => m.featured);
              if (!featured) return null;
              return (
                <div className="bg-surface-container rounded-2xl p-8 mb-6 border-l-4 border-primary-container relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-primary-container/5 blur-[80px] rounded-full pointer-events-none" />
                  <div className="flex items-start gap-6 flex-wrap">
                    <div className={`w-20 h-20 rounded-full ${featured.avatarColor} flex items-center justify-center text-3xl font-black text-white flex-shrink-0`}>
                      {featured.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h2 className="text-2xl font-black">{featured.name}</h2>
                        <span className="px-3 py-1 bg-primary-container/20 text-primary-container rounded-full text-[10px] font-bold uppercase tracking-widest">Featured</span>
                        <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                          <Icon name="star" size={14} filled />
                          {featured.rating} · {featured.sessionCount} sessions
                        </span>
                      </div>
                      <p className="text-on-surface-variant text-sm mb-3">{featured.role} at {featured.company}</p>
                      <p className="text-sm text-zinc-400 leading-relaxed mb-4 max-w-xl">{featured.bio}</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {featured.tags.map((t) => (
                          <span key={t} className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-bold text-zinc-300">{t}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => setBookingMentor(featured)}
                        className="bg-primary-container text-white font-bold px-8 py-3 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
                      >
                        <Icon name="calendar_today" size={14} />
                        Book Session
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Mentor grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMentors.filter((m) => !m.featured || filterTag !== 'all').map((m) => (
                <div key={m.id} className="bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-all group flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full ${m.avatarColor} flex items-center justify-center text-xl font-black text-white flex-shrink-0`}>
                      {m.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-on-surface truncate">{m.name}</h3>
                        {!m.available && <span className="w-2 h-2 bg-zinc-600 rounded-full flex-shrink-0" title="Unavailable" />}
                        {m.available && <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 animate-pulse" title="Available" />}
                      </div>
                      <p className="text-xs text-on-surface-variant">{m.role}</p>
                      <p className="text-xs text-primary-container font-bold">{m.company}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                    <span className="flex items-center gap-1 text-yellow-400 font-bold">
                      <Icon name="star" size={12} filled />{m.rating}
                    </span>
                    <span>{m.sessionCount} sessions</span>
                  </div>

                  <p className="text-xs text-zinc-500 leading-relaxed mb-4 flex-1">{m.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {m.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-surface-container-highest rounded-full text-[10px] font-bold text-zinc-400">{t}</span>
                    ))}
                  </div>

                  <button
                    onClick={() => { if (m.available) setBookingMentor(m); }}
                    disabled={!m.available}
                    className={`w-full py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      m.available
                        ? 'border border-outline-variant/30 hover:border-primary-container hover:text-primary-container text-zinc-400'
                        : 'text-zinc-600 border border-zinc-800 cursor-not-allowed'
                    }`}
                  >
                    <Icon name={m.available ? 'calendar_today' : 'event_busy'} size={13} />
                    {m.available ? 'Book Session' : 'Unavailable'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Study Groups */}
        {activeTab === 'groups' && (
          <div>
            <p className="text-sm text-zinc-500 mb-6">Join a study group to stay consistent. All groups meet virtually over Discord/Meet.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {groups.map((g) => {
                const badge = LEVEL_BADGE[g.level];
                const full = g.memberCount >= g.maxMembers && !g.joined;
                return (
                  <div key={g.id} className={`bg-surface-container rounded-xl p-6 flex flex-col gap-4 transition-all ${g.joined ? 'border border-green-500/20' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-surface-container-high rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon name={g.icon} className={g.color} size={22} />
                        </div>
                        <div>
                          <h3 className="font-bold text-on-surface">{g.name}</h3>
                          <p className="text-xs text-zinc-500">{g.topic}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badge.bg} ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Icon name="schedule" size={12} />
                        {g.schedule}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="group" size={12} />
                        {g.memberCount}/{g.maxMembers}
                      </span>
                    </div>

                    <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${g.memberCount / g.maxMembers > 0.8 ? 'bg-red-400' : 'bg-green-400'}`}
                        style={{ width: `${(g.memberCount / g.maxMembers) * 100}%` }}
                      />
                    </div>

                    <button
                      onClick={() => toggleGroup(g.id)}
                      disabled={full}
                      className={`w-full py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        g.joined
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : full
                          ? 'text-zinc-600 border border-zinc-800 cursor-not-allowed'
                          : 'bg-primary-container text-white hover:brightness-110'
                      }`}
                    >
                      <Icon name={g.joined ? 'check_circle' : full ? 'group_off' : 'group_add'} size={14} />
                      {g.joined ? 'Joined · Leave' : full ? 'Group Full' : 'Join Group'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: My Sessions */}
        {activeTab === 'sessions' && (
          <div>
            {mySessions.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="calendar_month" size={48} className="text-zinc-700 mb-4" />
                <p className="font-bold text-on-surface-variant mb-2">No sessions yet</p>
                <p className="text-sm text-zinc-500 mb-6">Book your first mentorship session to get started.</p>
                <button onClick={() => setActiveTab('mentors')} className="bg-primary-container text-white font-bold py-3 px-8 rounded-full text-sm hover:brightness-110 transition-all">
                  Find a Mentor
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {mySessions.map((s) => {
                  const statusMeta = {
                    upcoming: { color: 'text-blue-400 bg-blue-500/10', label: 'Upcoming' },
                    completed: { color: 'text-green-400 bg-green-500/10', label: 'Completed' },
                    cancelled: { color: 'text-zinc-500 bg-zinc-500/10', label: 'Cancelled' },
                  };
                  const meta = statusMeta[s.status];
                  return (
                    <div key={s.id} className="bg-surface-container rounded-xl p-6 flex items-center gap-4 flex-wrap">
                      <div className="w-11 h-11 bg-surface-container-high rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-black text-on-surface">
                        {s.mentorName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface">{s.mentorName}</p>
                        <p className="text-sm text-zinc-500">{s.type}</p>
                        {s.notes && <p className="text-xs text-zinc-600 mt-1 truncate">Goal: {s.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-zinc-400 mb-1">{new Date(s.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Become a Mentor */}
        {activeTab === 'become' && (
          <div className="max-w-2xl">
            {becomeSubmitted ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="check_circle" className="text-green-400" size={32} filled />
                </div>
                <h2 className="text-2xl font-black mb-2">Application Submitted!</h2>
                <p className="text-on-surface-variant mb-2">We'll review your profile and reach out within 3-5 business days.</p>
                <p className="text-sm text-primary-container font-bold">+50 XP for applying to mentor!</p>
              </div>
            ) : (
              <div>
                <div className="bg-surface-container rounded-2xl p-8 mb-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                      <Icon name="workspace_premium" className="text-yellow-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black">Become a Mentor</h2>
                      <p className="text-sm text-zinc-500">Share your expertise. Help the next generation of engineers.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { icon: 'bolt', label: 'Earn XP', desc: 'Get XP for each session you host' },
                      { icon: 'groups', label: 'Build Community', desc: 'Connect with motivated engineers' },
                      { icon: 'workspace_premium', label: 'Mentor Badge', desc: 'Exclusive profile badge + perks' },
                    ].map((b) => (
                      <div key={b.label} className="bg-surface-container-high rounded-xl p-4 text-center">
                        <Icon name={b.icon} className="text-yellow-400 mb-2 mx-auto" size={24} />
                        <p className="font-bold text-sm mb-1">{b.label}</p>
                        <p className="text-xs text-zinc-500">{b.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2">Your Bio *</label>
                      <textarea
                        value={becomeForm.bio}
                        onChange={(e) => setBecomeForm((p) => ({ ...p, bio: e.target.value }))}
                        placeholder="Tell potential mentees about your background, experience, and what you're excited to help with..."
                        rows={4}
                        className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl p-4 text-sm text-on-surface focus:outline-none focus:border-primary-container/40 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2">Specializations * (comma-separated)</label>
                      <input
                        type="text"
                        value={becomeForm.specializations}
                        onChange={(e) => setBecomeForm((p) => ({ ...p, specializations: e.target.value }))}
                        placeholder="e.g. DSA, System Design, Python, AWS"
                        className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-2">Years of Experience</label>
                      <input
                        type="number"
                        value={becomeForm.yearsExp}
                        onChange={(e) => setBecomeForm((p) => ({ ...p, yearsExp: e.target.value }))}
                        placeholder="e.g. 3"
                        min={0}
                        className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/40"
                      />
                    </div>
                    <button
                      onClick={submitBecome}
                      disabled={submittingBecome || !becomeForm.bio || !becomeForm.specializations}
                      className="w-full bg-primary-container text-white font-bold py-3.5 rounded-full hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {submittingBecome ? <Icon name="hourglass_empty" size={16} /> : <Icon name="send" size={16} />}
                      Submit Application · +50 XP
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131313]/80 backdrop-blur-md p-4">
          <div className="bg-[#1B1B1B] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            {bookingDone ? (
              <div className="text-center py-12 px-8">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Icon name="check_circle" size={32} className="text-green-400" filled />
                </div>
                <h2 className="text-xl font-black tracking-tight mb-2">Session Booked!</h2>
                <p className="text-on-surface-variant text-sm">
                  Your session with {bookingMentor.name} is confirmed. You'll get a calendar invite shortly.
                </p>
                <p className="text-primary-container font-bold text-sm mt-2">+10 XP earned!</p>
              </div>
            ) : (
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-black">Book a Session</h2>
                  <button onClick={() => setBookingMentor(null)} className="text-zinc-500 hover:text-white transition-colors">
                    <Icon name="close" size={22} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-6 p-4 bg-surface-container-high rounded-xl">
                  <div className={`w-11 h-11 rounded-full ${bookingMentor.avatarColor} flex items-center justify-center text-lg font-black text-white flex-shrink-0`}>
                    {bookingMentor.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{bookingMentor.name}</p>
                    <p className="text-sm text-on-surface-variant">{bookingMentor.role} at {bookingMentor.company}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Session Type *</p>
                  <div className="space-y-2">
                    {SESSION_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSessionType(t.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border ${
                          sessionType === t.id
                            ? 'border-primary-container/50 bg-primary-container/10 text-on-surface'
                            : 'border-zinc-800 hover:border-zinc-700 text-on-surface-variant'
                        }`}
                      >
                        <Icon name={t.icon} size={16} className={sessionType === t.id ? 'text-primary-container' : 'text-zinc-500'} />
                        <div>
                          <p className="text-sm font-bold">{t.label}</p>
                          <p className="text-xs text-zinc-500">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">What's your goal for this session?</label>
                  <textarea
                    value={sessionGoal}
                    onChange={(e) => setSessionGoal(e.target.value)}
                    placeholder="e.g. I want help with dynamic programming — I always get stuck on state transitions..."
                    rows={3}
                    className="w-full bg-surface-container border border-zinc-800 rounded-xl p-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/40 resize-none"
                  />
                </div>

                <button
                  onClick={handleBook}
                  disabled={booking || !sessionType}
                  className="w-full bg-primary-container text-white font-bold py-3.5 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {booking ? <Icon name="hourglass_empty" size={16} /> : <Icon name="calendar_today" size={16} />}
                  Confirm Booking · +10 XP
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
