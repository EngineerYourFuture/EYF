import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';

const SUBJECTS = [
  { id: 'os', icon: 'terminal', title: 'Operating Systems', topicCount: 42, progress: 35, color: 'text-blue-400' },
  { id: 'dbms', icon: 'storage', title: 'DBMS', topicCount: 38, progress: 20, color: 'text-purple-400' },
  { id: 'networks', icon: 'wifi', title: 'Computer Networks', topicCount: 35, progress: 15, color: 'text-cyan-400' },
  { id: 'oop', icon: 'code_blocks', title: 'OOP', topicCount: 28, progress: 50, color: 'text-green-400' },
  { id: 'sd', icon: 'architecture', title: 'System Design', topicCount: 24, progress: 10, color: 'text-orange-400' },
];

export function CoreSubjectsPage() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <div className="pt-8">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-3">Core <span className="text-primary-container">Subjects.</span></h1>
          <p className="text-on-surface-variant text-lg max-w-xl">
            Master the foundational computer science concepts that every engineer must know.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SUBJECTS.map((s) => (
            <div key={s.id} className="bg-surface-container rounded-xl p-8 hover:bg-surface-container-high transition-colors group">
              <div className="flex justify-between items-start mb-8">
                <div className={`w-14 h-14 bg-surface-container-highest rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon name={s.icon} size={28} />
                </div>
                <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">
                  {s.topicCount} Topics
                </span>
              </div>

              <h3 className="text-xl font-bold mb-2">{s.title}</h3>

              <div className="mt-6 mb-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                  <span>Progress</span>
                  <span>{s.progress}%</span>
                </div>
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container rounded-full transition-all" style={{ width: `${s.progress}%` }} />
                </div>
              </div>

              <button onClick={() => navigate(`/app/subjects/${s.id}`)} className="mt-6 w-full bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-white font-bold py-3 rounded-full text-[10px] uppercase tracking-widest transition-all group-hover:bg-primary-container group-hover:text-white">
                Start Learning
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
