import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';

const TRACKS = [
  { id: 'sde', title: 'SDE Track', company: 'FAANG', icon: 'code', progress: 40 },
  { id: 'ds', title: 'Data Science', company: 'MAANG', icon: 'data_object', progress: 20 },
  { id: 'sre', title: 'SRE/DevOps', company: 'Cloud', icon: 'cloud', progress: 15 },
  { id: 'pm', title: 'Product Management', company: 'Startups', icon: 'lightbulb', progress: 5 },
];

const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb'];

export function PlacementPage() {
  const navigate = useNavigate();
  return (
    <AppShell>
      <div className="pt-8">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-3">Placement <span className="text-primary-container">Prep.</span></h1>
          <p className="text-on-surface-variant text-lg">FAANG-level interview preparation engineered for precision.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { icon: 'business', label: 'Companies Targeting', value: '24+' },
            { icon: 'record_voice_over', label: 'Mock Interviews', value: '156' },
            { icon: 'description', label: 'Resume Score', value: '8.4/10' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container rounded-xl p-8 flex items-center gap-6">
              <div className="w-12 h-12 bg-primary-container/20 rounded-xl flex items-center justify-center text-primary-container">
                <Icon name={s.icon} size={24} />
              </div>
              <div>
                <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-1">{s.label}</p>
                <p className="text-2xl font-black text-on-surface">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tracks */}
        <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-zinc-500 mb-6">Interview Tracks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {TRACKS.map((t) => (
            <div key={t.id} className="bg-surface-container rounded-xl p-8 hover:bg-surface-container-high transition-colors group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-surface-container-highest rounded-xl flex items-center justify-center text-primary-container">
                  <Icon name={t.icon} size={24} />
                </div>
                <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  {t.company}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-4">{t.title}</h3>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                <span>Progress</span><span>{t.progress}%</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary-container rounded-full" style={{ width: `${t.progress}%` }} />
              </div>
              <button onClick={() => navigate(`/app/placement/${t.id}`)} className="mt-6 text-primary-container font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:underline">
                Start Track <Icon name="arrow_forward" size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Companies */}
        <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-zinc-500 mb-6">Target Companies</h2>
        <div className="flex flex-wrap gap-3">
          {COMPANIES.map((c) => (
            <div key={c} className="bg-surface-container rounded-full px-6 py-3 text-sm font-bold text-on-surface hover:bg-primary-container hover:text-white transition-all cursor-pointer">
              {c}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
