import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

import { PageHeader } from '../components/PageHeader';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;
const INPUT = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--t1)', outline: 'none', boxSizing: 'border-box' } as const;

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
  { id: 'm1', name: 'Alex Chen', role: 'Senior SWE', company: 'Google', tags: ['DSA', 'System Design', 'LC 500+', 'FAANG Prep'], bio: '5 years at Google. Helped 50+ engineers clear FAANG interviews. Specializes in hard DSA and system design walkthroughs.', rating: 4.9, sessionCount: 87, available: true, featured: true, avatarColor: '#3b82f6' },
  { id: 'm2', name: 'Sarah Kim', role: 'Staff Engineer', company: 'Meta', tags: ['ML', 'Python', 'Career Growth'], bio: 'Staff engineer at Meta working on recommendation systems. Passionate about ML career paths and Python best practices.', rating: 4.8, sessionCount: 62, available: true, avatarColor: '#a855f7' },
  { id: 'm3', name: 'Raj Patel', role: 'SWE II', company: 'Amazon', tags: ['Backend', 'AWS', 'Java', 'System Design'], bio: 'Amazon SWE with deep experience in distributed systems and AWS. Loves helping engineers crack the backend track.', rating: 4.7, sessionCount: 44, available: true, avatarColor: '#f97316' },
  { id: 'm4', name: 'Maya Johnson', role: 'Principal SWE', company: 'Microsoft', tags: ['Leadership', 'Azure', 'Architecture'], bio: 'Principal engineer at Microsoft. Focus on technical leadership, career leveling, and architecture decisions at scale.', rating: 4.6, sessionCount: 39, available: false, avatarColor: '#06b6d4' },
  { id: 'm5', name: 'Lena Zhang', role: 'Tech Lead', company: 'Netflix', tags: ['Distributed Systems', 'Reliability', 'Scala'], bio: 'Tech lead at Netflix running chaos engineering and reliability. Expert in building fault-tolerant distributed systems.', rating: 4.8, sessionCount: 55, available: true, avatarColor: '#E82127' },
  { id: 'm6', name: 'Amit Sharma', role: 'Security Engineer', company: 'Razorpay', tags: ['AppSec', 'Bug Bounty', 'Penetration Testing'], bio: 'Security engineer with a bug bounty background. Helps engineers transition into security roles and CTF challenges.', rating: 4.7, sessionCount: 31, available: true, avatarColor: '#22c55e' },
  { id: 'm7', name: 'Priya Nair', role: 'SDE-III', company: 'Flipkart', tags: ['DSA', 'Java', 'Microservices', 'FAANG Prep'], bio: 'Senior engineer at Flipkart Infra. Cracked Google, Amazon, and Flipkart. Specializes in Java/microservices architecture and DSA coaching for freshers.', rating: 4.8, sessionCount: 48, available: true, avatarColor: '#6366f1' },
  { id: 'm8', name: 'Karan Mehta', role: 'ML Engineer', company: 'Swiggy', tags: ['Machine Learning', 'Python', 'Deep Learning', 'NLP'], bio: 'ML engineer at Swiggy working on demand forecasting and recommendation. Helps students break into ML/AI roles with solid fundamentals.', rating: 4.6, sessionCount: 27, available: true, avatarColor: '#ec4899' },
  { id: 'm9', name: 'Divya Reddy', role: 'Engineering Manager', company: 'Atlassian', tags: ['Leadership', 'Career Growth', 'EM Transition', 'System Design'], bio: 'Engineering Manager with 8 years of experience. Guides engineers on IC-to-EM transitions, performance reviews, and navigating big tech culture.', rating: 4.9, sessionCount: 73, available: false, featured: true, avatarColor: '#14b8a6' },
  { id: 'm10', name: 'Rohan Joshi', role: 'SRE Lead', company: 'Uber', tags: ['SRE', 'DevOps', 'Kubernetes', 'Reliability'], bio: 'SRE lead at Uber managing reliability for payment systems. Teaches SRE fundamentals, Kubernetes, and building on-call runbooks for the SRE track.', rating: 4.7, sessionCount: 36, available: true, avatarColor: '#71717a' },
];

const STATIC_GROUPS: StudyGroup[] = [
  { id: 'g1', name: 'LC Grind Squad', topic: 'DSA Problems', icon: 'code', color: '#60a5fa', memberCount: 12, maxMembers: 15, schedule: 'Daily 9 PM IST', joined: false, level: 'intermediate' },
  { id: 'g2', name: 'System Design Circle', topic: 'System Design', icon: 'architecture', color: '#c084fc', memberCount: 8, maxMembers: 10, schedule: 'Sat & Sun 7 PM IST', joined: false, level: 'advanced' },
  { id: 'g3', name: 'OOP Pattern Masters', topic: 'OOP & Design Patterns', icon: 'account_tree', color: '#facc15', memberCount: 6, maxMembers: 12, schedule: 'Tue & Thu 8 PM IST', joined: false, level: 'intermediate' },
  { id: 'g4', name: 'Security Crew', topic: 'Cybersecurity & CTFs', icon: 'shield', color: '#f87171', memberCount: 9, maxMembers: 15, schedule: 'Fri 9 PM IST', joined: false, level: 'beginner' },
  { id: 'g5', name: 'CS Fundamentals', topic: 'Core CS (OS/DBMS/Networks)', icon: 'school', color: '#4ade80', memberCount: 14, maxMembers: 20, schedule: 'Mon, Wed 7 PM IST', joined: false, level: 'beginner' },
  { id: 'g6', name: 'Placement Warriors', topic: 'Mock Interviews & Behavioral', icon: 'work', color: '#fb923c', memberCount: 11, maxMembers: 15, schedule: 'Daily 8 PM IST', joined: false, level: 'intermediate' },
  { id: 'g7', name: 'ML Study Group', topic: 'Machine Learning & Deep Learning', icon: 'psychology', color: '#f472b6', memberCount: 7, maxMembers: 12, schedule: 'Wed & Sat 6 PM IST', joined: false, level: 'intermediate' },
  { id: 'g8', name: 'SRE & DevOps Club', topic: 'Kubernetes, CI/CD, Reliability', icon: 'cloud', color: '#22d3ee', memberCount: 5, maxMembers: 10, schedule: 'Sun 5 PM IST', joined: false, level: 'advanced' },
];

const SESSION_TYPES = [
  { id: 'dsa', label: 'DSA Problem Walkthrough', desc: 'Work through a hard problem together', icon: 'code' },
  { id: 'mock', label: 'Mock Interview', desc: '45-min simulated coding interview', icon: 'record_voice_over' },
  { id: 'design', label: 'System Design Review', desc: 'Review your design approach', icon: 'architecture' },
  { id: 'career', label: 'Career Guidance', desc: 'Roadmap, resume, negotiation advice', icon: 'route' },
  { id: 'review', label: 'Code Review', desc: 'Deep dive into your code quality', icon: 'rate_review' },
];

const LEVEL_META: Record<StudyGroup['level'], { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Beginner',     color: '#4ade80', bg: 'rgba(74,222,128,0.1)'   },
  intermediate: { label: 'Intermediate', color: '#facc15', bg: 'rgba(250,204,21,0.1)'   },
  advanced:     { label: 'Advanced',     color: '#f87171', bg: 'rgba(248,113,113,0.1)'  },
};

function buildFallbackSession(mentor: Mentor, sessionType: string, sessionGoal: string): MySession {
  return {
    id: Date.now().toString(),
    mentorName: mentor.name,
    type: SESSION_TYPES.find((t) => t.id === sessionType)?.label ?? sessionType,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    status: 'upcoming',
    notes: sessionGoal,
  };
}

const SESSION_STATUS_META = {
  upcoming:  { label: 'Upcoming',  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  completed: { label: 'Completed', color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  cancelled: { label: 'Cancelled', color: 'var(--t3)', bg: 'rgba(113,113,122,0.1)' },
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
  const filteredMentors = filterTag === 'all' ? mentors : mentors.filter((m) => m.tags.includes(filterTag));

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
      const fallback = buildFallbackSession(bookingMentor, sessionType, sessionGoal);
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
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, joined, memberCount: g.memberCount + (joined ? 1 : -1) } : g));
    if (joined) fireXP(10, 'Joined study group!');
    if (session?.accessToken) {
      apiRequest(`/mentorship/groups/${groupId}/${joined ? 'join' : 'leave'}`, { token: session.accessToken, method: 'POST', body: {} }).catch(() => {});
    }
  };

  const submitBecome = async () => {
    if (!session?.accessToken || !becomeForm.bio || !becomeForm.specializations) return;
    setSubmittingBecome(true);
    try {
      await apiRequest('/mentorship/become-mentor', {
        token: session.accessToken,
        method: 'POST',
        body: { bio: becomeForm.bio, specializations: becomeForm.specializations.split(',').map((s) => s.trim()), yearsExperience: Number.parseInt(becomeForm.yearsExp, 10) || 0 },
      });
    } catch {}
    finally {
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
      <div style={{ paddingTop: 32, maxWidth: 1152, margin: '0 auto' }}>
        <PageHeader
          eyebrow="Expert Guidance"
          title="Mentorship Network."
          subtitle="Learn faster with guidance from engineers who've done it. 1:1 sessions, study groups, and peer mentorship."
          stats={[
            { value: mentors.filter((m) => m.available).length, label: 'Active Mentors', color: '#facc15' },
            { value: groups.length, label: 'Study Groups', color: '#60a5fa' },
            { value: '4.8★', label: 'Avg Rating', color: '#fb923c' },
          ]}
        />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: 4, borderRadius: 999, width: 'fit-content', marginBottom: 32, flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', transition: 'all 0.2s', background: activeTab === tab.id ? '#E82127' : 'transparent', color: activeTab === tab.id ? '#fff' : '#71717a', boxShadow: activeTab === tab.id ? '0 0 16px rgba(232,33,39,0.35)' : 'none' }}
            >
              <Icon name={tab.icon} size={13} />
              {tab.label}
              {tab.badge && tab.badge > 0 ? (
                <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#E82127', color: '#fff', fontSize: 9, fontWeight: 900, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Tab: Mentors */}
          {activeTab === 'mentors' && (
            <motion.div key="mentors" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* Tag filter */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {allTags.slice(0, 12).map((tag) => {
                  const active = filterTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      style={{ padding: '6px 14px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', transition: 'all 0.15s', background: active ? 'rgba(232,33,39,0.14)' : 'rgba(255,255,255,0.04)', color: active ? '#E82127' : '#71717a', boxShadow: active ? '0 0 12px rgba(232,33,39,0.18)' : 'none' }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Featured mentor */}
              {filterTag === 'all' && (() => {
                const featured = filteredMentors.find((m) => m.featured);
                if (!featured) return null;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ ...GLASS, borderRadius: 20, padding: 32, marginBottom: 24, borderLeft: '4px solid #E82127', position: 'relative', overflow: 'hidden' }}
                  >
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 288, height: 288, background: 'rgba(232,33,39,0.04)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
                      <div style={{ width: 80, height: 80, borderRadius: '50%', background: featured.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {featured.name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)' }}>{featured.name}</h2>
                          <span style={{ padding: '3px 10px', background: 'rgba(232,33,39,0.12)', border: '1px solid rgba(232,33,39,0.25)', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#E82127' }}>Featured</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#facc15', fontSize: 13, fontWeight: 700 }}>
                            <Icon name="star" size={14} filled /> {featured.rating} · {featured.sessionCount} sessions
                          </span>
                        </div>
                        <p style={{ color: 'var(--t3)', fontSize: 13, marginBottom: 12 }}>{featured.role} at {featured.company}</p>
                        <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 16, maxWidth: 480 }}>{featured.bio}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                          {featured.tags.map((t) => (
                            <span key={t} style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#d4d4d8' }}>{t}</span>
                          ))}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setBookingMentor(featured)}
                          style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '12px 28px', borderRadius: 999, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 24px rgba(232,33,39,0.3)' }}
                        >
                          <Icon name="calendar_today" size={14} /> Book Session
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Mentor grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {filteredMentors.filter((m) => !m.featured || filterTag !== 'all').map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ ...GLASS, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: m.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {m.name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 style={{ fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</h3>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.available ? '#22c55e' : '#52525b', flexShrink: 0 }} title={m.available ? 'Available' : 'Unavailable'} />
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--t3)' }}>{m.role}</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#E82127' }}>{m.company}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--t3)', marginBottom: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#facc15', fontWeight: 700 }}>
                        <Icon name="star" size={12} filled />{m.rating}
                      </span>
                      <span>{m.sessionCount} sessions</span>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.7, marginBottom: 16, flex: 1 }}>{m.bio}</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                      {m.tags.map((t) => (
                        <span key={t} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, fontSize: 10, fontWeight: 700, color: 'var(--t3)' }}>{t}</span>
                      ))}
                    </div>

                    <button
                      onClick={() => { if (m.available) setBookingMentor(m); }}
                      disabled={!m.available}
                      style={{ width: '100%', padding: '10px 0', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: m.available ? 'pointer' : 'not-allowed', border: `1px solid ${m.available ? 'rgba(232,33,39,0.3)' : 'rgba(255,255,255,0.06)'}`, background: m.available ? 'rgba(232,33,39,0.06)' : 'transparent', color: m.available ? '#E82127' : '#52525b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <Icon name={m.available ? 'calendar_today' : 'event_busy'} size={13} />
                      {m.available ? 'Book Session' : 'Unavailable'}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tab: Study Groups */}
          {activeTab === 'groups' && (
            <motion.div key="groups" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 24 }}>Join a study group to stay consistent. All groups meet virtually over Discord/Meet.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {groups.map((g, i) => {
                  const badge = LEVEL_META[g.level];
                  const full = g.memberCount >= g.maxMembers && !g.joined;
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ ...GLASS, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, border: g.joined ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name={g.icon} size={22} style={{ color: g.color }} />
                          </div>
                          <div>
                            <h3 style={{ fontWeight: 700, color: 'var(--t1)' }}>{g.name}</h3>
                            <p style={{ fontSize: 12, color: 'var(--t3)' }}>{g.topic}</p>
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', background: badge.bg, borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: badge.color, flexShrink: 0 }}>
                          {badge.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--t3)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="schedule" size={12} />{g.schedule}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="group" size={12} />{g.memberCount}/{g.maxMembers}</span>
                      </div>

                      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: g.memberCount / g.maxMembers > 0.8 ? '#f87171' : '#4ade80', width: `${(g.memberCount / g.maxMembers) * 100}%`, transition: 'width 0.5s' }} />
                      </div>

                      {(() => {
                        let groupBtnBg: string;
                        if (g.joined) { groupBtnBg = 'rgba(34,197,94,0.1)'; }
                        else if (full) { groupBtnBg = 'rgba(255,255,255,0.03)'; }
                        else { groupBtnBg = '#E82127'; }
                        const groupBtnColor = g.joined ? '#4ade80' : (full ? '#52525b' : '#fff');
                        const groupBtnIcon = g.joined ? 'check_circle' : (full ? 'group_off' : 'group_add');
                        const groupBtnLabel = g.joined ? 'Joined · Leave' : (full ? 'Group Full' : 'Join Group');
                        return (
                        <button
                          onClick={() => toggleGroup(g.id)}
                          disabled={full}
                          style={{ width: '100%', padding: '10px 0', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: full ? 'not-allowed' : 'pointer', border: g.joined ? '1px solid rgba(34,197,94,0.25)' : 'none', background: groupBtnBg, color: groupBtnColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: (!g.joined && !full) ? '0 0 16px rgba(232,33,39,0.2)' : 'none' }}
                        >
                          <Icon name={groupBtnIcon} size={14} />
                          {groupBtnLabel}
                        </button>
                        );
                      })()}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Tab: My Sessions */}
          {activeTab === 'sessions' && (
            <motion.div key="sessions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {mySessions.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
                  <Icon name="calendar_month" size={48} style={{ color: '#3f3f46', marginBottom: 16 }} />
                  <p style={{ fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>No sessions yet</p>
                  <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 24 }}>Book your first mentorship session to get started.</p>
                  <button onClick={() => setActiveTab('mentors')} style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '12px 32px', borderRadius: 999, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}>
                    Find a Mentor
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {mySessions.map((s, i) => {
                    const meta = SESSION_STATUS_META[s.status];
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{ ...GLASS, borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
                      >
                        <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, fontWeight: 900, color: 'var(--t1)' }}>
                          {s.mentorName[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, color: 'var(--t1)' }}>{s.mentorName}</p>
                          <p style={{ fontSize: 13, color: 'var(--t3)' }}>{s.type}</p>
                          {s.notes && <p style={{ fontSize: 12, color: 'var(--t4)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Goal: {s.notes}</p>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 4 }}>{new Date(s.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                          <span style={{ padding: '3px 10px', background: meta.bg, borderRadius: 999, fontSize: 10, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Tab: Become a Mentor */}
          {activeTab === 'become' && (
            <motion.div key="become" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ maxWidth: 640 }}>
              {becomeSubmitted ? (
                <div style={{ textAlign: 'center', paddingTop: 64, paddingBottom: 64 }}>
                  <div style={{ width: 64, height: 64, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Icon name="check_circle" size={32} style={{ color: '#4ade80' }} filled />
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--t1)', marginBottom: 8 }}>Application Submitted!</h2>
                  <p style={{ color: 'var(--t3)', marginBottom: 8 }}>We'll review your profile and reach out within 3-5 business days.</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#E82127' }}>+50 XP for applying to mentor!</p>
                </div>
              ) : (
                <div>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ ...GLASS, borderRadius: 20, padding: 32, marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                      <div style={{ width: 48, height: 48, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="workspace_premium" size={24} style={{ color: '#facc15' }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)' }}>Become a Mentor</h2>
                        <p style={{ fontSize: 13, color: 'var(--t3)' }}>Share your expertise. Help the next generation of engineers.</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
                      {[
                        { icon: 'bolt',              label: 'Earn XP',        desc: 'Get XP for each session you host' },
                        { icon: 'groups',            label: 'Build Community', desc: 'Connect with motivated engineers'  },
                        { icon: 'workspace_premium', label: 'Mentor Badge',   desc: 'Exclusive profile badge + perks'   },
                      ].map((b) => (
                        <div key={b.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                          <Icon name={b.icon} size={24} style={{ color: '#facc15', marginBottom: 8 }} />
                          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)', marginBottom: 4 }}>{b.label}</p>
                          <p style={{ fontSize: 11, color: 'var(--t3)' }}>{b.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label htmlFor="mentor-bio" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', display: 'block', marginBottom: 8 }}>Your Bio *</label>
                        <textarea
                          id="mentor-bio"
                          value={becomeForm.bio}
                          onChange={(e) => setBecomeForm((p) => ({ ...p, bio: e.target.value }))}
                          placeholder="Tell potential mentees about your background, experience, and what you're excited to help with..."
                          rows={4}
                          style={{ ...INPUT, resize: 'none' }}
                        />
                      </div>
                      <div>
                        <label htmlFor="mentor-spec" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', display: 'block', marginBottom: 8 }}>Specializations * (comma-separated)</label>
                        <input
                          id="mentor-spec"
                          type="text"
                          value={becomeForm.specializations}
                          onChange={(e) => setBecomeForm((p) => ({ ...p, specializations: e.target.value }))}
                          placeholder="e.g. DSA, System Design, Python, AWS"
                          style={INPUT}
                        />
                      </div>
                      <div>
                        <label htmlFor="mentor-exp" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', display: 'block', marginBottom: 8 }}>Years of Experience</label>
                        <input
                          id="mentor-exp"
                          type="number"
                          value={becomeForm.yearsExp}
                          onChange={(e) => setBecomeForm((p) => ({ ...p, yearsExp: e.target.value }))}
                          placeholder="e.g. 3"
                          min={0}
                          style={INPUT}
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={submitBecome}
                        disabled={submittingBecome || !becomeForm.bio || !becomeForm.specializations}
                        style={{ width: '100%', background: '#E82127', color: '#fff', fontWeight: 700, padding: '14px 0', borderRadius: 999, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: (submittingBecome || !becomeForm.bio || !becomeForm.specializations) ? 'default' : 'pointer', opacity: (submittingBecome || !becomeForm.bio || !becomeForm.specializations) ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}
                      >
                        {submittingBecome ? <Icon name="hourglass_empty" size={16} /> : <Icon name="send" size={16} />}
                        Submit Application · +50 XP
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {bookingMentor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: 16 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
            >
              {bookingDone ? (
                <div style={{ textAlign: 'center', padding: '48px 32px' }}>
                  <div style={{ width: 64, height: 64, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Icon name="check_circle" size={32} style={{ color: '#4ade80' }} filled />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--t1)', marginBottom: 8 }}>Session Booked!</h2>
                  <p style={{ color: 'var(--t3)', fontSize: 14 }}>Your session with {bookingMentor.name} is confirmed. You'll get a calendar invite shortly.</p>
                  <p style={{ color: '#E82127', fontWeight: 700, fontSize: 14, marginTop: 8 }}>+10 XP earned!</p>
                </div>
              ) : (
                <div style={{ padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--t1)' }}>Book a Session</h2>
                    <button onClick={() => setBookingMentor(null)} style={{ color: 'var(--t4)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Icon name="close" size={22} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: bookingMentor.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                      {bookingMentor.name[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--t1)' }}>{bookingMentor.name}</p>
                      <p style={{ fontSize: 13, color: 'var(--t3)' }}>{bookingMentor.role} at {bookingMentor.company}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', marginBottom: 12 }}>Session Type *</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {SESSION_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSessionType(t.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', border: `1px solid ${sessionType === t.id ? 'rgba(232,33,39,0.4)' : 'rgba(255,255,255,0.07)'}`, background: sessionType === t.id ? 'rgba(232,33,39,0.08)' : 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}
                        >
                          <Icon name={t.icon} size={16} style={{ color: sessionType === t.id ? '#E82127' : '#71717a' }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{t.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--t3)' }}>{t.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label htmlFor="session-goal" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', display: 'block', marginBottom: 8 }}>What's your goal for this session?</label>
                    <textarea
                      id="session-goal"
                      value={sessionGoal}
                      onChange={(e) => setSessionGoal(e.target.value)}
                      placeholder="e.g. I want help with dynamic programming — I always get stuck on state transitions..."
                      rows={3}
                      style={{ ...INPUT, resize: 'none' }}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: booking || !sessionType ? 1 : 1.02 }}
                    whileTap={{ scale: booking || !sessionType ? 1 : 0.98 }}
                    onClick={handleBook}
                    disabled={booking || !sessionType}
                    style={{ width: '100%', background: '#E82127', color: '#fff', fontWeight: 700, padding: '14px 0', borderRadius: 999, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: booking || !sessionType ? 'default' : 'pointer', opacity: booking || !sessionType ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}
                  >
                    {booking ? <Icon name="hourglass_empty" size={16} /> : <Icon name="calendar_today" size={16} />}
                    Confirm Booking · +10 XP
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
