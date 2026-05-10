import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';

const SKILL_CATEGORIES = [
  {
    name: 'Languages',
    icon: 'code',
    skills: [
      { name: 'Python', level: 85 }, { name: 'JavaScript', level: 78 }, { name: 'TypeScript', level: 72 },
      { name: 'Java', level: 60 }, { name: 'Go', level: 45 }, { name: 'C++', level: 55 },
    ],
  },
  {
    name: 'Frameworks',
    icon: 'layers',
    skills: [
      { name: 'React', level: 80 }, { name: 'Node.js', level: 75 }, { name: 'FastAPI', level: 70 },
      { name: 'Spring Boot', level: 50 }, { name: 'Next.js', level: 65 },
    ],
  },
  {
    name: 'Tools',
    icon: 'build',
    skills: [
      { name: 'Git', level: 90 }, { name: 'Docker', level: 75 }, { name: 'Kubernetes', level: 55 },
      { name: 'CI/CD', level: 65 },
    ],
  },
  {
    name: 'Cloud',
    icon: 'cloud',
    skills: [
      { name: 'AWS', level: 70 }, { name: 'GCP', level: 50 }, { name: 'Azure', level: 45 },
    ],
  },
];

export function TechSkillsPage() {
  return (
    <AppShell>
      <div className="pt-8">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-3">Tech <span className="text-primary-container">Skills.</span></h1>
          <p className="text-on-surface-variant text-lg">Track and improve your technical proficiency across all domains.</p>
        </div>

        <div className="space-y-10">
          {SKILL_CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-container/20 rounded-xl flex items-center justify-center text-primary-container">
                  <Icon name={cat.icon} size={20} />
                </div>
                <h2 className="text-xl font-black tracking-tight">{cat.name}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cat.skills.map((skill) => {
                  let levelLabel: string;
                  if (skill.level >= 80) { levelLabel = 'Expert'; }
                  else if (skill.level >= 60) { levelLabel = 'Proficient'; }
                  else if (skill.level >= 40) { levelLabel = 'Intermediate'; }
                  else { levelLabel = 'Beginner'; }
                  return (
                    <div key={skill.name} className="bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-on-surface">{skill.name}</span>
                        <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-primary-container">{skill.level}%</span>
                      </div>
                      <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-container rounded-full transition-all duration-700"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2 font-bold">
                        {levelLabel}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
