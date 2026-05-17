import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
  source: 'self' | 'computed' | 'endorsed';
  endorsements: number;
}

interface SkillCategory {
  name: string;
  icon: string;
  color: string;
  bg: string;
  skills: Skill[];
}


const DEFAULT_CATEGORIES: SkillCategory[] = [
  {
    name: 'Languages',
    icon: 'code', color: 'text-blue-400', bg: 'bg-blue-500/10',
    skills: [
      { id: 'python', name: 'Python', category: 'Languages', level: 0, source: 'self', endorsements: 0 },
      { id: 'javascript', name: 'JavaScript', category: 'Languages', level: 0, source: 'self', endorsements: 0 },
      { id: 'typescript', name: 'TypeScript', category: 'Languages', level: 0, source: 'self', endorsements: 0 },
      { id: 'java', name: 'Java', category: 'Languages', level: 0, source: 'self', endorsements: 0 },
      { id: 'go', name: 'Go', category: 'Languages', level: 0, source: 'self', endorsements: 0 },
      { id: 'cpp', name: 'C++', category: 'Languages', level: 0, source: 'self', endorsements: 0 },
      { id: 'rust', name: 'Rust', category: 'Languages', level: 0, source: 'self', endorsements: 0 },
    ],
  },
  {
    name: 'Frameworks',
    icon: 'layers', color: 'text-purple-400', bg: 'bg-purple-500/10',
    skills: [
      { id: 'react', name: 'React', category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
      { id: 'nodejs', name: 'Node.js', category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
      { id: 'fastapi', name: 'FastAPI', category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
      { id: 'spring', name: 'Spring Boot', category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
      { id: 'nextjs', name: 'Next.js', category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
      { id: 'django', name: 'Django', category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
    ],
  },
  {
    name: 'Databases',
    icon: 'storage', color: 'text-green-400', bg: 'bg-green-500/10',
    skills: [
      { id: 'postgresql', name: 'PostgreSQL', category: 'Databases', level: 0, source: 'self', endorsements: 0 },
      { id: 'mysql', name: 'MySQL', category: 'Databases', level: 0, source: 'self', endorsements: 0 },
      { id: 'mongodb', name: 'MongoDB', category: 'Databases', level: 0, source: 'self', endorsements: 0 },
      { id: 'redis', name: 'Redis', category: 'Databases', level: 0, source: 'self', endorsements: 0 },
      { id: 'elasticsearch', name: 'Elasticsearch', category: 'Databases', level: 0, source: 'self', endorsements: 0 },
    ],
  },
  {
    name: 'Cloud & DevOps',
    icon: 'cloud', color: 'text-cyan-400', bg: 'bg-cyan-500/10',
    skills: [
      { id: 'aws', name: 'AWS', category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
      { id: 'gcp', name: 'GCP', category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
      { id: 'docker', name: 'Docker', category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
      { id: 'kubernetes', name: 'Kubernetes', category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
      { id: 'cicd', name: 'CI/CD', category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
      { id: 'terraform', name: 'Terraform', category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
    ],
  },
  {
    name: 'Algorithms & CS',
    icon: 'psychology', color: 'text-yellow-400', bg: 'bg-yellow-500/10',
    skills: [
      { id: 'dsa', name: 'Data Structures', category: 'Algorithms & CS', level: 0, source: 'self', endorsements: 0 },
      { id: 'algorithms', name: 'Algorithms', category: 'Algorithms & CS', level: 0, source: 'self', endorsements: 0 },
      { id: 'os', name: 'Operating Systems', category: 'Algorithms & CS', level: 0, source: 'self', endorsements: 0 },
      { id: 'networking', name: 'Computer Networks', category: 'Algorithms & CS', level: 0, source: 'self', endorsements: 0 },
      { id: 'dbms', name: 'DBMS', category: 'Algorithms & CS', level: 0, source: 'self', endorsements: 0 },
    ],
  },
];

const FAANG_MUST_HAVE = ['Data Structures', 'Algorithms', 'System Design', 'PostgreSQL', 'Python', 'JavaScript'];
const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Proficient', 'Expert'];
const LEVEL_COLORS = ['text-zinc-600', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400', 'text-blue-400'];
const LEVEL_BAR_COLORS = ['bg-zinc-700', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-blue-400'];

function SkillBar({ skill, onRate }: { readonly skill: Skill; readonly onRate: (id: string, level: number) => void }) {
  const [hoveredLevel, setHoveredLevel] = useState(0);
  const displayLevel = hoveredLevel || skill.level;

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-on-surface">{skill.name}</span>
          {skill.source === 'computed' && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">from problems</span>
          )}
          {skill.endorsements > 0 && (
            <span className="text-[9px] font-bold text-green-400 flex items-center gap-0.5">
              <Icon name="thumb_up" size={10} filled />{skill.endorsements}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${LEVEL_COLORS[displayLevel]}`}>
          {displayLevel > 0 ? LEVEL_LABELS[displayLevel] : 'Not set'}
        </span>
      </div>

      {/* 5-dot rating */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onMouseEnter={() => setHoveredLevel(lvl)}
              onMouseLeave={() => setHoveredLevel(0)}
              onClick={() => onRate(skill.id, lvl)}
              className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                lvl <= displayLevel ? LEVEL_BAR_COLORS[displayLevel] : 'bg-surface-container-highest'
              } hover:scale-y-150`}
              style={{ width: '36px' }}
              title={LEVEL_LABELS[lvl]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type SavedSkill = { skillId: string; level: number; source: string; endorsements: number };

function mergeSkillsFromApi(categories: SkillCategory[], savedSkills: SavedSkill[]): SkillCategory[] {
  return categories.map((cat) => ({
    ...cat,
    skills: cat.skills.map((s) => {
      const saved = savedSkills.find((sk) => sk.skillId === s.id);
      return saved ? { ...s, level: saved.level, source: saved.source as Skill['source'], endorsements: saved.endorsements } : s;
    }),
  }));
}

export function TechSkillsPage() {
  const session = getSession();
  const { fireXP } = useUser();
  const [categories, setCategories] = useState<SkillCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'gaps' | 'recommendations'>('skills');

  useEffect(() => {
    if (!session?.accessToken) { setLoading(false); return; }
    apiRequest<{ skills: Array<{ skillId: string; level: number; source: string; endorsements: number }> }>(
      '/skills',
      { token: session.accessToken }
    )
      .then((d) => {
        if (d.skills?.length) {
          setCategories((prev) => mergeSkillsFromApi(prev, d.skills));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const handleRate = (skillId: string, level: number) => {
    setCategories((prev) => prev.map((cat) => ({
      ...cat,
      skills: cat.skills.map((s) => (s.id === skillId ? { ...s, level, source: 'self' as const } : s)),
    })));
  };

  const saveSkills = async () => {
    if (!session?.accessToken) return;
    setSaving(true);
    try {
      const allSkills = categories.flatMap((c) => c.skills.filter((s) => s.level > 0).map((s) => ({ skillId: s.id, level: s.level })));
      await apiRequest('/skills', {
        token: session.accessToken,
        method: 'PUT',
        body: { skills: allSkills },
      });
      setLastSaved(new Date());
      fireXP(15, 'Skills updated!');
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const allSkills = categories.flatMap((c) => c.skills);
  const ratedSkills = allSkills.filter((s) => s.level > 0);
  const avgLevel = ratedSkills.length ? Math.round(ratedSkills.reduce((sum, s) => sum + s.level, 0) / ratedSkills.length * 10) / 10 : 0;
  const strongSkills = allSkills.filter((s) => s.level >= 4);
  const weakSkills = allSkills.filter((s) => s.level > 0 && s.level <= 2);

  // Gap analysis: FAANG must-have skills not yet proficient
  const gapSkills = FAANG_MUST_HAVE.map((name) => {
    const skill = allSkills.find((s) => s.name === name);
    return { name, level: skill?.level ?? 0, id: skill?.id ?? name.toLowerCase() };
  }).filter((s) => s.level < 4);

  const filteredCats = activeCategory === 'all' ? categories : categories.filter((c) => c.name === activeCategory);

  const RECOMMENDATIONS = [
    {
      title: 'Level up your Data Structures',
      desc: 'Solve 20+ medium DSA problems this week to push your rating to Proficient.',
      icon: 'psychology',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      href: '/app/problems?tag=dsa',
    },
    {
      title: 'System Design Fundamentals',
      desc: 'Complete the System Design track — 3 case studies remain.',
      icon: 'architecture',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      href: '/app/system-design',
    },
    {
      title: 'Get endorsed by the community',
      desc: 'Answer 5 community questions to earn skill endorsements from peers.',
      icon: 'forum',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      href: '/app/community',
    },
    {
      title: 'Security Engineer path',
      desc: 'Finish the Cybersecurity CTFs to unlock the AppSec skill badge automatically.',
      icon: 'shield',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      href: '/app/cybersecurity',
    },
  ];

  return (
    <AppShell>
      <div className="pt-8 max-w-6xl">
        {/* Hero */}
        <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2">
              Tech <span className="text-primary-container">Skills.</span>
            </h1>
            <p className="text-on-surface-variant text-lg">Rate yourself honestly. Track gaps. Get recommendations.</p>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <p className="text-xs text-zinc-500">Saved {lastSaved.toLocaleTimeString()}</p>
            )}
            <button
              onClick={saveSkills}
              disabled={saving}
              className="bg-primary-container text-white font-bold py-2.5 px-6 rounded-full text-sm hover:brightness-110 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {saving ? <Icon name="hourglass_empty" size={14} /> : <Icon name="save" size={14} />}
              Save Skills
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Skills Rated', value: `${ratedSkills.length}/${allSkills.length}`, icon: 'checklist', color: 'text-blue-400' },
            { label: 'Avg Level', value: avgLevel > 0 ? LEVEL_LABELS[Math.round(avgLevel)] : 'Not set', icon: 'show_chart', color: 'text-green-400' },
            { label: 'Strong Skills', value: strongSkills.length, icon: 'star', color: 'text-yellow-400' },
            { label: 'Gaps to Close', value: gapSkills.length, icon: 'warning', color: 'text-orange-400' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container rounded-xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name={s.icon} className={s.color} size={20} />
              </div>
              <div>
                <p className="text-lg font-black text-on-surface">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container p-1 rounded-full mb-8 w-fit">
          {[
            { id: 'skills' as const, label: 'My Skills', icon: 'psychology' },
            { id: 'gaps' as const, label: 'Skill Gaps', icon: 'warning' },
            { id: 'recommendations' as const, label: 'Recommendations', icon: 'tips_and_updates' },
          ].map((tab) => (
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

        {/* Tab: Skills */}
        {activeTab === 'skills' && (
          <div>
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-6">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeCategory === 'all' ? 'bg-primary-container text-white' : 'bg-surface-container text-zinc-500 hover:text-zinc-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeCategory === cat.name
                      ? `${cat.bg} ${cat.color} border border-current/20`
                      : 'bg-surface-container text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  <Icon name={cat.icon} size={11} />
                  {cat.name}
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-500 mb-6 flex items-center gap-1">
              <Icon name="info" size={12} className="text-zinc-600" />
              Click the bars to rate your proficiency: 1 = Beginner → 5 = Expert
            </p>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => <div key={i} className="bg-surface-container rounded-2xl p-6 h-48 animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-8">
                {filteredCats.map((cat) => (
                  <div key={cat.name} className="bg-surface-container rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-10 h-10 ${cat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon name={cat.icon} className={cat.color} size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black">{cat.name}</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                          {cat.skills.filter((s) => s.level > 0).length}/{cat.skills.length} rated
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cat.skills.map((skill) => (
                        <SkillBar key={skill.id} skill={skill} onRate={handleRate} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Gaps */}
        {activeTab === 'gaps' && (
          <div>
            <div className="bg-surface-container rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Icon name="warning" className="text-orange-400" size={20} />
                </div>
                <div>
                  <h3 className="font-bold">FAANG Skill Gap Analysis</h3>
                  <p className="text-xs text-zinc-500">Skills that top tech companies require — where you stand.</p>
                </div>
              </div>

              <div className="space-y-4">
                {FAANG_MUST_HAVE.map((name) => {
                  const skill = allSkills.find((s) => s.name === name);
                  const level = skill?.level ?? 0;
                  const gap = Math.max(0, 4 - level);
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-on-surface">{name}</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${LEVEL_COLORS[level]}`}>
                            {level > 0 ? LEVEL_LABELS[level] : 'Not rated'}
                          </span>
                          {gap > 0 ? (
                            <span className="text-[10px] font-bold text-orange-400">{gap} level{gap > 1 ? 's' : ''} gap</span>
                          ) : (
                            <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                              <Icon name="check_circle" size={10} filled />Ready
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${LEVEL_BAR_COLORS[level]}`}
                          style={{ width: `${(level / 5) * 100}%` }}
                        />
                        {/* Target line at 4/5 */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-orange-500/50" style={{ left: '80%' }} />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[9px] text-zinc-600">Your level</span>
                        <span className="text-[9px] text-orange-400/70">FAANG target →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weak skills */}
            {weakSkills.length > 0 && (
              <div className="bg-surface-container rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Icon name="trending_up" className="text-primary-container" size={18} />
                  Skills Needing Improvement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {weakSkills.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 bg-surface-container-high rounded-xl p-4">
                      <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon name="school" className="text-orange-400" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">{s.name}</p>
                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">{LEVEL_LABELS[s.level]} · Level {s.level}/5</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('skills')}
                        className="text-[10px] font-bold text-primary-container hover:underline flex-shrink-0"
                      >
                        Improve
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Recommendations */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500 mb-6">Personalized actions to accelerate your growth based on your current skill profile.</p>
            {RECOMMENDATIONS.map((rec) => (
              <a key={rec.title} href={rec.href} className="block bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 ${rec.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon name={rec.icon} className={rec.color} size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-on-surface group-hover:text-primary-container transition-colors mb-1">{rec.title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{rec.desc}</p>
                  </div>
                  <Icon name="arrow_forward" size={18} className="text-zinc-600 group-hover:text-primary-container transition-colors flex-shrink-0 mt-0.5" />
                </div>
              </a>
            ))}

            {/* Strong skills showcase */}
            {strongSkills.length > 0 && (
              <div className="bg-surface-container rounded-xl p-6 mt-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Icon name="star" className="text-yellow-400" size={16} filled />
                  Your Strong Suits
                </h3>
                <div className="flex flex-wrap gap-2">
                  {strongSkills.map((s) => (
                    <span key={s.id} className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
                      <Icon name="check" size={12} />
                      {s.name} · {LEVEL_LABELS[s.level]}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-4">These are your interview talking points. Lead with them in your answers.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
