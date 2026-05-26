import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

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
  { name: 'Languages',      icon: 'code',      color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  skills: [
    { id: 'python',     name: 'Python',      category: 'Languages', level: 0, source: 'self', endorsements: 0 },
    { id: 'javascript', name: 'JavaScript',  category: 'Languages', level: 0, source: 'self', endorsements: 0 },
    { id: 'typescript', name: 'TypeScript',  category: 'Languages', level: 0, source: 'self', endorsements: 0 },
    { id: 'java',       name: 'Java',        category: 'Languages', level: 0, source: 'self', endorsements: 0 },
    { id: 'go',         name: 'Go',          category: 'Languages', level: 0, source: 'self', endorsements: 0 },
    { id: 'cpp',        name: 'C++',         category: 'Languages', level: 0, source: 'self', endorsements: 0 },
    { id: 'rust',       name: 'Rust',        category: 'Languages', level: 0, source: 'self', endorsements: 0 },
  ]},
  { name: 'Frameworks',     icon: 'layers',    color: '#c084fc', bg: 'rgba(192,132,252,0.1)', skills: [
    { id: 'react',   name: 'React',       category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
    { id: 'nodejs',  name: 'Node.js',     category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
    { id: 'fastapi', name: 'FastAPI',     category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
    { id: 'spring',  name: 'Spring Boot', category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
    { id: 'nextjs',  name: 'Next.js',     category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
    { id: 'django',  name: 'Django',      category: 'Frameworks', level: 0, source: 'self', endorsements: 0 },
  ]},
  { name: 'Databases',      icon: 'storage',   color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  skills: [
    { id: 'postgresql',    name: 'PostgreSQL',    category: 'Databases', level: 0, source: 'self', endorsements: 0 },
    { id: 'mysql',         name: 'MySQL',         category: 'Databases', level: 0, source: 'self', endorsements: 0 },
    { id: 'mongodb',       name: 'MongoDB',       category: 'Databases', level: 0, source: 'self', endorsements: 0 },
    { id: 'redis',         name: 'Redis',         category: 'Databases', level: 0, source: 'self', endorsements: 0 },
    { id: 'elasticsearch', name: 'Elasticsearch', category: 'Databases', level: 0, source: 'self', endorsements: 0 },
  ]},
  { name: 'Cloud & DevOps', icon: 'cloud',     color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',  skills: [
    { id: 'aws',        name: 'AWS',        category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
    { id: 'gcp',        name: 'GCP',        category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
    { id: 'docker',     name: 'Docker',     category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
    { id: 'kubernetes', name: 'Kubernetes', category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
    { id: 'cicd',       name: 'CI/CD',      category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
    { id: 'terraform',  name: 'Terraform',  category: 'Cloud & DevOps', level: 0, source: 'self', endorsements: 0 },
  ]},
  { name: 'Algorithms & CS', icon: 'psychology', color: '#facc15', bg: 'rgba(250,204,21,0.1)', skills: [
    { id: 'dsa',        name: 'Data Structures',  category: 'Algorithms & CS', level: 0, source: 'self', endorsements: 0 },
    { id: 'algorithms', name: 'Algorithms',        category: 'Algorithms & CS', level: 0, source: 'self', endorsements: 0 },
    { id: 'os',         name: 'Operating Systems', category: 'Algorithms & CS', level: 0, source: 'self', endorsements: 0 },
    { id: 'networking', name: 'Computer Networks', category: 'Algorithms & CS', level: 0, source: 'self', endorsements: 0 },
    { id: 'dbms',       name: 'DBMS',              category: 'Algorithms & CS', level: 0, source: 'self', endorsements: 0 },
  ]},
];

const FAANG_MUST_HAVE = ['Data Structures', 'Algorithms', 'System Design', 'PostgreSQL', 'Python', 'JavaScript'];
const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Proficient', 'Expert'];
const LEVEL_COLORS = ['#52525b', '#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa'];
const LEVEL_BAR_HEX  = ['#3f3f46', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

function SkillBar({ skill, onRate }: { readonly skill: Skill; readonly onRate: (id: string, level: number) => void }) {
  const [hoveredLevel, setHoveredLevel] = useState(0);
  const displayLevel = hoveredLevel || skill.level;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{skill.name}</span>
          {skill.source === 'computed' && (
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '2px 6px', borderRadius: 999 }}>from problems</span>
          )}
          {skill.endorsements > 0 && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon name="thumb_up" size={10} filled />{skill.endorsements}
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: LEVEL_COLORS[displayLevel] }}>
          {displayLevel > 0 ? LEVEL_LABELS[displayLevel] : 'Not set'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onMouseEnter={() => setHoveredLevel(lvl)}
              onMouseLeave={() => setHoveredLevel(0)}
              onClick={() => onRate(skill.id, lvl)}
              style={{ width: 36, height: 8, borderRadius: 999, border: 'none', cursor: 'pointer', background: lvl <= displayLevel ? LEVEL_BAR_HEX[displayLevel] : 'rgba(255,255,255,0.08)', transition: 'all 0.2s' }}
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
  const [, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'gaps' | 'recommendations'>('skills');

  useEffect(() => {
    if (!session?.accessToken) { setLoading(false); return; }
    apiRequest<{ skills: Array<{ skillId: string; level: number; source: string; endorsements: number }> }>('/skills', { token: session.accessToken })
      .then((d) => { if (d.skills?.length) setCategories((prev) => mergeSkillsFromApi(prev, d.skills)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const handleRate = (skillId: string, level: number) => {
    setCategories((prev) => prev.map((cat) => ({ ...cat, skills: cat.skills.map((s) => s.id === skillId ? { ...s, level, source: 'self' as const } : s) })));
  };

  const saveSkills = async () => {
    if (!session?.accessToken) return;
    setSaving(true);
    try {
      const allSkills = categories.flatMap((c) => c.skills.filter((s) => s.level > 0).map((s) => ({ skillId: s.id, level: s.level })));
      await apiRequest('/skills', { token: session.accessToken, method: 'PUT', body: { skills: allSkills } });
      setLastSaved(new Date());
      fireXP(15, 'Skills updated!');
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const allSkills = categories.flatMap((c) => c.skills);
  const ratedSkills = allSkills.filter((s) => s.level > 0);
  const avgLevel = ratedSkills.length ? Math.round(ratedSkills.reduce((sum, s) => sum + s.level, 0) / ratedSkills.length * 10) / 10 : 0;
  const strongSkills = allSkills.filter((s) => s.level >= 4);
  const weakSkills = allSkills.filter((s) => s.level > 0 && s.level <= 2);
  const gapSkills = FAANG_MUST_HAVE.map((name) => {
    const skill = allSkills.find((s) => s.name === name);
    return { name, level: skill?.level ?? 0, id: skill?.id ?? name.toLowerCase() };
  }).filter((s) => s.level < 4);
  const filteredCats = activeCategory === 'all' ? categories : categories.filter((c) => c.name === activeCategory);

  const RECOMMENDATIONS = [
    { title: 'Level up your Data Structures',  desc: 'Solve 20+ medium DSA problems this week to push your rating to Proficient.',        icon: 'psychology',      color: '#facc15', bg: 'rgba(250,204,21,0.1)',   href: '/app/problems?tag=dsa' },
    { title: 'System Design Fundamentals',     desc: 'Complete the System Design track — 3 case studies remain.',                          icon: 'architecture',    color: '#c084fc', bg: 'rgba(192,132,252,0.1)', href: '/app/system-design' },
    { title: 'Get endorsed by the community',  desc: 'Answer 5 community questions to earn skill endorsements from peers.',                icon: 'forum',           color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  href: '/app/community' },
    { title: 'Security Engineer path',         desc: 'Finish the Cybersecurity CTFs to unlock the AppSec skill badge automatically.',      icon: 'shield',          color: '#f87171', bg: 'rgba(248,113,113,0.1)', href: '/app/cybersecurity' },
  ];

  return (
    <AppShell>
      <div className="pt-8 max-w-6xl mx-auto">
        <PageHeader
          eyebrow="Skill Mapping"
          title="Tech Skills."
          subtitle="Rate yourself honestly. Track gaps. Get recommendations."
          stats={[
            { value: `${ratedSkills.length}/${allSkills.length}`, label: 'Rated',       color: '#60a5fa' },
            { value: strongSkills.length,                          label: 'Strong',      color: '#facc15' },
            { value: gapSkills.length,                             label: 'Gaps',        color: '#fb923c' },
          ]}
          actions={
            <motion.button
              onClick={saveSkills}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{ background: '#E82127', color: '#000', fontWeight: 800, padding: '8px 18px', border: 'none', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', opacity: saving ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
            >
              {saving ? <Icon name="hourglass_empty" size={14} /> : <Icon name="save" size={14} />}
              Save Skills
            </motion.button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 32, display: 'none' }}>
          {[
            { label: 'Skills Rated', value: `${ratedSkills.length}/${allSkills.length}`, icon: 'checklist', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
            { label: 'Avg Level',    value: avgLevel > 0 ? LEVEL_LABELS[Math.round(avgLevel)] : 'Not set', icon: 'show_chart', color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
            { label: 'Strong Skills', value: String(strongSkills.length), icon: 'star', color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
            { label: 'Gaps to Close', value: String(gapSkills.length), icon: 'warning', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={{ ...GLASS, borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, background: s.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={s.icon} size={20} style={{ color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--t1)' }}>{s.value}</p>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)' }}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, ...GLASS, padding: 4, borderRadius: 999, width: 'fit-content', marginBottom: 32 }}>
          {[
            { id: 'skills' as const,          label: 'My Skills',      icon: 'psychology' },
            { id: 'gaps' as const,             label: 'Skill Gaps',     icon: 'warning' },
            { id: 'recommendations' as const,  label: 'Recommendations', icon: 'tips_and_updates' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.03 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: active ? 'rgba(232,33,39,0.14)' : 'transparent', color: active ? '#fff' : '#71717a', boxShadow: active ? '0 0 12px rgba(232,33,39,0.18)' : 'none' }}
              >
                <Icon name={tab.icon} size={13} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Tab: Skills */}
        {activeTab === 'skills' && (
          <div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              <motion.button onClick={() => setActiveCategory('all')} whileHover={{ scale: 1.03 }} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: activeCategory === 'all' ? '#E82127' : 'rgba(255,255,255,0.06)', color: activeCategory === 'all' ? '#fff' : '#71717a' }}>All</motion.button>
              {categories.map((cat) => {
                const active = activeCategory === cat.name;
                return (
                  <motion.button key={cat.name} onClick={() => setActiveCategory(cat.name)} whileHover={{ scale: 1.03 }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: active ? `1px solid ${cat.color}30` : '1px solid transparent', background: active ? cat.bg : 'rgba(255,255,255,0.06)', color: active ? cat.color : '#71717a' }}>
                    <Icon name={cat.icon} size={11} />{cat.name}
                  </motion.button>
                );
              })}
            </div>

            <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="info" size={12} style={{ color: 'var(--t4)' }} />
              Click the bars to rate your proficiency: 1 = Beginner → 5 = Expert
            </p>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => <div key={i} style={{ ...GLASS, borderRadius: 16, height: 192, opacity: 0.4 }} />)}
              </div>
            ) : (
              <div className="space-y-8">
                {filteredCats.map((cat, ci) => (
                  <motion.div key={cat.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.06 }} style={{ ...GLASS, borderRadius: 16, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                      <div style={{ width: 40, height: 40, background: cat.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={cat.icon} size={20} style={{ color: cat.color }} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--t1)' }}>{cat.name}</h2>
                        <p style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {cat.skills.filter((s) => s.level > 0).length}/{cat.skills.length} rated
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cat.skills.map((skill) => (
                        <SkillBar key={skill.id} skill={skill} onRate={handleRate} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Gaps */}
        {activeTab === 'gaps' && (
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ ...GLASS, borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, background: 'rgba(251,146,60,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="warning" size={20} style={{ color: '#fb923c' }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, color: 'var(--t1)' }}>FAANG Skill Gap Analysis</h3>
                  <p style={{ fontSize: 12, color: 'var(--t3)' }}>Skills that top tech companies require — where you stand.</p>
                </div>
              </div>

              <div className="space-y-4">
                {FAANG_MUST_HAVE.map((name) => {
                  const skill = allSkills.find((s) => s.name === name);
                  const level = skill?.level ?? 0;
                  const gap = Math.max(0, 4 - level);
                  return (
                    <div key={name}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: LEVEL_COLORS[level] }}>
                            {level > 0 ? LEVEL_LABELS[level] : 'Not rated'}
                          </span>
                          {gap > 0 ? (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fb923c' }}>{gap} level{gap > 1 ? 's' : ''} gap</span>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="check_circle" size={10} filled />Ready
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                        <motion.div
                          animate={{ width: `${(level / 5) * 100}%` }}
                          transition={{ duration: 0.7 }}
                          style={{ height: '100%', borderRadius: 999, background: LEVEL_BAR_HEX[level] }}
                        />
                        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'rgba(251,146,60,0.5)', left: '80%' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <span style={{ fontSize: 9, color: 'var(--t4)' }}>Your level</span>
                        <span style={{ fontSize: 9, color: 'rgba(251,146,60,0.7)' }}>FAANG target →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {weakSkills.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...GLASS, borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="trending_up" size={18} style={{ color: '#E82127' }} />
                  Skills Needing Improvement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {weakSkills.map((s) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16 }}>
                      <div style={{ width: 32, height: 32, background: 'rgba(251,146,60,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="school" size={16} style={{ color: '#fb923c' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{s.name}</p>
                        <p style={{ fontSize: 10, color: '#fb923c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{LEVEL_LABELS[s.level]} · Level {s.level}/5</p>
                      </div>
                      <button onClick={() => setActiveTab('skills')} style={{ fontSize: 10, fontWeight: 700, color: '#E82127', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                        Improve
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Tab: Recommendations */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 24 }}>Personalized actions to accelerate your growth based on your current skill profile.</p>
            {RECOMMENDATIONS.map((rec, i) => (
              <motion.a
                key={rec.title}
                href={rec.href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.01 }}
                style={{ display: 'block', ...GLASS, borderRadius: 14, padding: 24, textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 44, height: 44, background: rec.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={rec.icon} size={22} style={{ color: rec.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>{rec.title}</h3>
                    <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6 }}>{rec.desc}</p>
                  </div>
                  <Icon name="arrow_forward" size={18} style={{ color: 'var(--t4)', flexShrink: 0, marginTop: 2 }} />
                </div>
              </motion.a>
            ))}

            {strongSkills.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ ...GLASS, borderRadius: 14, padding: 24, marginTop: 24 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="star" size={16} filled style={{ color: '#facc15' }} />
                  Your Strong Suits
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {strongSkills.map((s) => (
                    <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 999 }}>
                      <Icon name="check" size={12} />{s.name} · {LEVEL_LABELS[s.level]}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 16 }}>These are your interview talking points. Lead with them in your answers.</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
