import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface CareerProfile {
  track: string;
  currentRole?: string;
  targetRole?: string;
  experienceYears: number;
  currentCompany?: string;
  skills: string[];
  interests: string[];
}

interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  targetTrack: string;
  targetRole?: string;
  estimatedWeeks: number;
  planAccess: string;
  enrolled: boolean;
  progress: number;
}

const TRACKS = [
  {
    key: 'student',
    title: 'Student',
    icon: 'school',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    desc: 'Pursuing a degree or transitioning from non-tech. Build fundamentals to land your first role.',
    focus: ['DSA Fundamentals', 'Core CS (OS/DBMS/CN)', 'OOP & Design', 'Resume Building', 'Placement Prep'],
    timeline: '3-6 months to first job',
  },
  {
    key: 'professional',
    title: 'Working Professional',
    icon: 'work',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    desc: 'Currently employed and targeting senior/principal roles or FAANG-level companies.',
    focus: ['System Design', 'Advanced Algorithms', 'OOP Architecture', 'Cybersecurity', 'Tech Leadership'],
    timeline: '2-4 months to level up',
  },
  {
    key: 'expert',
    title: 'Industry Expert',
    icon: 'workspace_premium',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    desc: 'Senior/principal engineer or tech lead. Deepen expertise, mentor others, and stay ahead of the curve.',
    focus: ['Architecture & Trade-offs', 'Security Engineering', 'Mentorship', 'Technical Writing', 'Open Source'],
    timeline: 'Continuous growth',
  },
];

const STATIC_PATHS: LearningPath[] = [
  { id: '1', slug: 'student-first-job', title: 'Student → First Dev Job', description: 'From CS basics to landing your first software engineering role. Covers DSA, OOP, system design fundamentals, and resume building.', targetTrack: 'student', targetRole: 'Junior Software Engineer', estimatedWeeks: 16, planAccess: 'free', enrolled: false, progress: 0 },
  { id: '2', slug: 'student-faang-prep', title: 'Student FAANG Prep', description: 'Intense preparation for FAANG/MAANG interviews. Advanced DSA, system design, behavioral prep, and mock interview practice.', targetTrack: 'student', targetRole: 'Software Engineer (FAANG)', estimatedWeeks: 24, planAccess: 'pro', enrolled: false, progress: 0 },
  { id: '3', slug: 'professional-senior-track', title: 'Mid → Senior Engineer', description: 'Transition from mid-level to senior engineering. System design, technical leadership, mentoring, and architecture decision-making.', targetTrack: 'professional', targetRole: 'Senior Software Engineer', estimatedWeeks: 12, planAccess: 'free', enrolled: false, progress: 0 },
  { id: '4', slug: 'professional-security-track', title: 'Dev → Security Engineer', description: 'Transition from software development to security engineering. OWASP, penetration testing, secure SDLC, and cloud security.', targetTrack: 'professional', targetRole: 'Security Engineer', estimatedWeeks: 20, planAccess: 'pro', enrolled: false, progress: 0 },
  { id: '5', slug: 'expert-architect', title: 'Senior → Principal/Architect', description: 'From senior engineer to principal architect. Large-scale system design, org-level technical vision, and cross-team leadership.', targetTrack: 'expert', targetRole: 'Principal Engineer / Architect', estimatedWeeks: 16, planAccess: 'elite', enrolled: false, progress: 0 },
  { id: '6', slug: 'expert-mentor', title: 'Expert Mentor Track', description: 'Become an EYF mentor. Structured coaching methodology, feedback techniques, and how to guide engineers at different stages.', targetTrack: 'expert', targetRole: 'Engineering Mentor', estimatedWeeks: 8, planAccess: 'elite', enrolled: false, progress: 0 },
];

const POPULAR_ROLES = [
  { role: 'Frontend Engineer', skills: ['React', 'TypeScript', 'CSS', 'Performance', 'Accessibility'], track: 'student' },
  { role: 'Backend Engineer', skills: ['Node.js/Python/Java', 'Databases', 'APIs', 'Caching', 'Messaging'], track: 'student' },
  { role: 'Full Stack Engineer', skills: ['Frontend + Backend', 'DevOps Basics', 'System Design', 'Testing'], track: 'student' },
  { role: 'Security Engineer', skills: ['AppSec', 'Network Security', 'Crypto', 'Compliance', 'Threat Modeling'], track: 'professional' },
  { role: 'SRE / DevOps', skills: ['Kubernetes', 'Observability', 'CI/CD', 'Incident Response', 'SLOs'], track: 'professional' },
  { role: 'ML Engineer', skills: ['Python', 'ML Fundamentals', 'MLOps', 'Data Engineering', 'Model Deployment'], track: 'professional' },
];

const PLAN_COLOR: Record<string, string> = {
  free: 'text-green-400 bg-green-500/10',
  pro: 'text-yellow-400 bg-yellow-500/10',
  elite: 'text-purple-400 bg-purple-500/10',
};

export function CareerPathPage() {
  const session = getSession();
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>(STATIC_PATHS);
  const [activeTrack, setActiveTrack] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<CareerProfile>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<{ profile: CareerProfile | null }>('/career/profile', { token: session.accessToken })
      .then((d) => { if (d.profile) { setProfile(d.profile); setActiveTrack(d.profile.track); } })
      .catch(() => {});
    apiRequest<{ paths: LearningPath[] }>('/career/paths', { token: session.accessToken })
      .then((d) => { if (d.paths.length > 0) setPaths(d.paths); })
      .catch(() => {});
  }, [session?.accessToken]);

  const saveProfile = async () => {
    if (!session?.accessToken) return;
    setSaving(true);
    try {
      const resp = await apiRequest<{ profile: CareerProfile }>('/career/profile', {
        token: session.accessToken,
        method: 'PUT',
        body: form,
      });
      setProfile(resp.profile);
      setEditMode(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const enroll = async (slug: string) => {
    if (!session?.accessToken) return;
    try {
      await apiRequest(`/career/paths/${slug}/enroll`, { token: session.accessToken, method: 'POST', body: {} });
      setPaths((prev) => prev.map((p) => p.slug === slug ? { ...p, enrolled: true } : p));
    } catch {
      // ignore
    }
  };

  const filteredPaths = activeTrack === 'all' ? paths : paths.filter((p) => p.targetTrack === activeTrack);

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="mb-10 p-10 bg-surface-container rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-green-500/5 blur-[80px] rounded-full -mr-20 -mt-20" />
          <h1 className="text-4xl font-black tracking-tighter mb-2">Career Tracks</h1>
          <p className="text-on-surface-variant max-w-lg">From student to industry expert — pick your track, follow a curated path, and reach your next milestone.</p>
        </div>

        {/* Track Selector */}
        <section className="mb-12">
          <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-on-surface-variant/60 mb-6 ml-1">Choose Your Track</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRACKS.map((track) => (
              <div
                key={track.key}
                role="button"
                tabIndex={0}
                onClick={() => setActiveTrack(track.key)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTrack(track.key); }}
                className={`rounded-2xl p-7 cursor-pointer transition-all border ${
                  activeTrack === track.key ? `${track.bg} ${track.border}` : 'bg-surface-container border-transparent hover:bg-surface-container-high'
                } ${profile?.track === track.key ? `ring-1 ring-offset-0 ring-current/20` : ''}`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 ${track.bg} rounded-xl flex items-center justify-center`}>
                    <Icon name={track.icon} className={track.color} size={24} />
                  </div>
                  {profile?.track === track.key && (
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${track.color} bg-current/10 px-2 py-0.5 rounded-full`}>Your Track</span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{track.title}</h3>
                <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">{track.desc}</p>
                <div className="space-y-1.5">
                  {track.focus.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <Icon name="check" className={track.color} size={12} />
                      {f}
                    </div>
                  ))}
                </div>
                <p className={`text-[10px] font-bold mt-5 ${track.color}`}>{track.timeline}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Career Profile */}
        <section className="mb-12">
          <div className="bg-surface-container rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Your Career Profile</h2>
              <button onClick={() => { setEditMode(!editMode); setForm(profile ?? {}); }}
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                <Icon name={editMode ? 'close' : 'edit'} size={14} />
                {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'currentRole', label: 'Current Role', placeholder: 'e.g. Software Engineer II' },
                  { key: 'targetRole', label: 'Target Role', placeholder: 'e.g. Senior Engineer at FAANG' },
                  { key: 'currentCompany', label: 'Current Company', placeholder: 'e.g. Startup / University' },
                  { key: 'linkedinUrl', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...' },
                  { key: 'githubUrl', label: 'GitHub URL', placeholder: 'https://github.com/...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">{label}</label>
                    <input
                      type="text"
                      value={(form as Record<string, string>)[key] ?? ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary-container/40"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={form.experienceYears ?? 0}
                    onChange={(e) => setForm((prev) => ({ ...prev, experienceYears: parseInt(e.target.value, 10) }))}
                    min={0} max={50}
                    className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-container/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Track</label>
                  <select
                    value={form.track ?? 'student'}
                    onChange={(e) => setForm((prev) => ({ ...prev, track: e.target.value }))}
                    className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-container/40"
                  >
                    <option value="student">Student</option>
                    <option value="professional">Working Professional</option>
                    <option value="expert">Industry Expert</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button onClick={saveProfile} disabled={saving}
                    className="bg-primary-container text-white font-bold py-2.5 px-6 rounded-full hover:brightness-110 transition-all disabled:opacity-40 flex items-center gap-2 text-sm">
                    {saving ? <Icon name="hourglass_empty" size={14} /> : <Icon name="save" size={14} />}
                    Save Profile
                  </button>
                </div>
              </div>
            ) : profile ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Track', value: profile.track },
                  { label: 'Current Role', value: profile.currentRole || 'Not set' },
                  { label: 'Target Role', value: profile.targetRole || 'Not set' },
                  { label: 'Experience', value: `${profile.experienceYears} years` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-container-high rounded-xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
                    <p className="text-sm font-bold capitalize">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="person_add" className="text-zinc-600 mb-3" size={32} />
                <p className="text-sm text-on-surface-variant mb-4">Set up your career profile to get personalized recommendations.</p>
                <button onClick={() => setEditMode(true)} className="bg-primary-container text-white font-bold py-2 px-6 rounded-full text-sm hover:brightness-110 transition-all">
                  Set Up Profile
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Learning Paths */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-on-surface-variant/60 ml-1">Learning Paths</h2>
            <div className="flex gap-2">
              {['all', 'student', 'professional', 'expert'].map((t) => (
                <button key={t} onClick={() => setActiveTrack(t)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    activeTrack === t ? 'bg-primary-container/20 text-primary-container border-primary-container/30' : 'text-zinc-500 border-zinc-800/50 hover:text-zinc-300'
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredPaths.map((path) => {
              const locked = path.planAccess !== 'free';
              const track = TRACKS.find((t) => t.key === path.targetTrack);
              return (
                <div key={path.id} className={`bg-surface-container rounded-2xl p-7 transition-all ${locked ? 'opacity-70' : 'hover:bg-surface-container-high'} ${path.enrolled ? 'border border-green-500/20' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {track && <Icon name={track.icon} className={track.color} size={18} />}
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${track?.color ?? 'text-zinc-400'}`}>{path.targetTrack}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {path.enrolled && <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Enrolled</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PLAN_COLOR[path.planAccess] ?? ''}`}>{path.planAccess}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{path.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{path.description}</p>
                  {path.targetRole && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
                      <Icon name="flag" size={12} />Target: {path.targetRole}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Icon name="schedule" size={12} />~{path.estimatedWeeks} weeks
                    </div>
                    {path.enrolled ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 w-24 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full" style={{ width: `${path.progress * 100}%` }} />
                        </div>
                        <button className="text-[10px] font-bold uppercase tracking-widest text-green-400 flex items-center gap-1">
                          Continue <Icon name="arrow_forward" size={10} />
                        </button>
                      </div>
                    ) : locked ? (
                      <Link to="/plans" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary-container flex items-center gap-1">
                        <Icon name="upgrade" size={12} />Upgrade
                      </Link>
                    ) : (
                      <button onClick={() => enroll(path.slug)} className="text-[10px] font-bold uppercase tracking-widest text-primary-container hover:underline flex items-center gap-1">
                        Enroll <Icon name="arrow_forward" size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Role Explorer */}
        <section className="mb-10">
          <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-on-surface-variant/60 mb-5 ml-1">Explore Roles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_ROLES.map((r) => {
              const track = TRACKS.find((t) => t.key === r.track);
              return (
                <div key={r.role} className="bg-surface-container rounded-xl p-5 hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    {track && <Icon name={track.icon} className={track.color} size={14} />}
                    <h3 className="text-sm font-bold">{r.role}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.skills.map((s) => (
                      <span key={s} className="text-[10px] font-bold bg-surface-container-highest px-2 py-0.5 rounded-full text-zinc-400">{s}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
