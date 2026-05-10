import { useNavigate, useParams, Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';

const TRACK_DATA: Record<string, {
  title: string;
  company: string;
  icon: string;
  rounds: { name: string; type: string; tips: string }[];
  resources: { title: string; type: string; url?: string }[];
}> = {
  sde: {
    title: 'SDE Track',
    company: 'FAANG',
    icon: 'code',
    rounds: [
      { name: 'Online Assessment', type: 'Coding', tips: 'Focus on LC Easy/Medium. Use built-in libraries. Time yourself strictly.' },
      { name: 'DSA Round 1', type: 'Coding Interview', tips: 'Arrays, strings, hashmaps. Talk through your approach before coding.' },
      { name: 'DSA Round 2', type: 'Coding Interview', tips: 'Trees, graphs, DP. Optimize after getting a working solution.' },
      { name: 'System Design', type: 'Design Interview', tips: 'Clarify requirements, estimate scale, design incrementally. Cover tradeoffs.' },
      { name: 'Behavioral / HR', type: 'Behavioral', tips: 'Use STAR format. Prepare 5-6 stories covering leadership, conflict, failure.' },
    ],
    resources: [
      { title: 'LeetCode Top Interview 150', type: 'Problem Set' },
      { title: 'System Design Primer (GitHub)', type: 'Guide' },
      { title: 'Cracking the Coding Interview', type: 'Book' },
      { title: 'NeetCode 150 Roadmap', type: 'Roadmap' },
    ],
  },
  ds: {
    title: 'Data Science Track',
    company: 'MAANG',
    icon: 'data_object',
    rounds: [
      { name: 'Coding Screen', type: 'Coding', tips: 'Python proficiency, Pandas/NumPy manipulation, SQL queries.' },
      { name: 'Statistics & ML', type: 'Technical', tips: 'Probability, hypothesis testing, regression, classification fundamentals.' },
      { name: 'Case Study', type: 'Case Interview', tips: 'Frame the problem, define metrics, handle edge cases and data quality issues.' },
      { name: 'System Design (ML)', type: 'Design', tips: 'Design ML pipelines, feature stores, model serving at scale.' },
      { name: 'Behavioral', type: 'Behavioral', tips: 'Highlight impact with data. Quantify results of past projects.' },
    ],
    resources: [
      { title: 'Kaggle Learn — ML Courses', type: 'Course' },
      { title: 'Statistics for Data Science (Khan Academy)', type: 'Course' },
      { title: 'Machine Learning Design Interview', type: 'Book' },
      { title: 'SQL for Data Scientists', type: 'Book' },
    ],
  },
  sre: {
    title: 'SRE / DevOps Track',
    company: 'Cloud',
    icon: 'cloud',
    rounds: [
      { name: 'Coding Screen', type: 'Coding', tips: 'Focus on scripting (Python/Bash), basic algorithms.' },
      { name: 'Systems Knowledge', type: 'Technical', tips: 'Linux internals, networking, storage, distributed systems fundamentals.' },
      { name: 'Incident Response', type: 'Scenario', tips: 'Walk through debugging a production incident. Think out loud, prioritize blast radius.' },
      { name: 'Design', type: 'Design', tips: 'Design for reliability: SLOs, SLAs, error budgets, monitoring strategies.' },
      { name: 'Culture Fit', type: 'Behavioral', tips: 'Blameless post-mortems, on-call culture, collaboration with dev teams.' },
    ],
    resources: [
      { title: 'Google SRE Book (free online)', type: 'Book' },
      { title: 'Linux Command Line & Scripting', type: 'Course' },
      { title: 'Kubernetes in Action', type: 'Book' },
      { title: 'AWS Solutions Architect Guide', type: 'Guide' },
    ],
  },
  pm: {
    title: 'Product Management Track',
    company: 'Startups',
    icon: 'lightbulb',
    rounds: [
      { name: 'Product Sense', type: 'Product', tips: 'Design a product for X. Structure: understand users → pain points → solutions → prioritize.' },
      { name: 'Analytical Thinking', type: 'Analytical', tips: 'Metrics, A/B testing, defining success. Clarify what and why before diving into numbers.' },
      { name: 'Technical Screen', type: 'Technical', tips: 'No coding, but understand APIs, databases, trade-offs. Can you work with engineers?' },
      { name: 'Leadership', type: 'Behavioral', tips: 'Influence without authority, driving alignment, navigating ambiguity.' },
      { name: 'Final Round', type: 'Executive', tips: 'Big picture thinking, company vision alignment, handling difficult stakeholders.' },
    ],
    resources: [
      { title: 'Cracking the PM Interview', type: 'Book' },
      { title: 'Lenny\'s Newsletter', type: 'Newsletter' },
      { title: 'Inspired by Marty Cagan', type: 'Book' },
      { title: 'Product School Masterclass', type: 'Course' },
    ],
  },
};

const typeColor = (type: string) => {
  const map: Record<string, string> = {
    'Coding': 'text-blue-400 bg-blue-400/10',
    'Coding Interview': 'text-blue-400 bg-blue-400/10',
    'Technical': 'text-cyan-400 bg-cyan-400/10',
    'Design': 'text-orange-400 bg-orange-400/10',
    'Design Interview': 'text-orange-400 bg-orange-400/10',
    'Behavioral': 'text-green-400 bg-green-400/10',
    'Case Interview': 'text-purple-400 bg-purple-400/10',
    'Scenario': 'text-yellow-400 bg-yellow-400/10',
    'Product': 'text-pink-400 bg-pink-400/10',
    'Analytical': 'text-cyan-400 bg-cyan-400/10',
    'Executive': 'text-primary-container bg-primary-container/10',
  };
  return map[type] ?? 'text-zinc-400 bg-zinc-400/10';
};

export function PlacementTrackPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const navigate = useNavigate();

  const track = trackId ? TRACK_DATA[trackId] : null;

  if (!track) {
    return (
      <AppShell>
        <div className="pt-8 text-center">
          <p className="text-zinc-500 text-lg">Track not found.</p>
          <button
            onClick={() => navigate('/app/placement')}
            className="mt-6 text-primary-container font-bold text-[11px] uppercase tracking-widest"
          >
            ← Back to Placement
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-8 max-w-4xl">
        {/* Back */}
        <button
          onClick={() => navigate('/app/placement')}
          className="flex items-center gap-2 text-zinc-500 hover:text-on-surface transition-colors font-bold text-[11px] uppercase tracking-widest mb-10"
        >
          <Icon name="arrow_back" size={16} />
          Placement Prep
        </button>

        {/* Header */}
        <div className="bg-surface-container rounded-xl p-8 mb-10 flex items-center gap-8">
          <div className="w-16 h-16 bg-primary-container/20 rounded-2xl flex items-center justify-center text-primary-container flex-shrink-0">
            <Icon name={track.icon} size={32} />
          </div>
          <div>
            <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-1">Interview Track</p>
            <h1 className="text-3xl font-black tracking-tighter mb-1">{track.title}</h1>
            <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {track.company}
            </span>
          </div>
        </div>

        {/* Interview Rounds */}
        <div className="mb-10">
          <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-6">Interview Rounds</p>
          <div className="space-y-3">
            {track.rounds.map((round, i) => (
              <div key={i} className="bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-colors">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-xs font-black text-zinc-400">
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-on-surface">{round.name}</h3>
                  <span className={`ml-auto px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${typeColor(round.type)}`}>
                    {round.type}
                  </span>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed pl-11">{round.tips}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resources + Practice side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Resources */}
          <div>
            <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-4">Curated Resources</p>
            <div className="space-y-3">
              {track.resources.map((r, i) => (
                <div key={i} className="bg-surface-container rounded-xl px-6 py-4 flex items-center gap-4 hover:bg-surface-container-high transition-colors">
                  <div className="w-8 h-8 bg-surface-container-highest rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="bookmark" size={16} className="text-primary-container" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface text-sm truncate">{r.title}</p>
                    <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">{r.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Problems */}
          <div>
            <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-4">Practice Problems</p>
            <div className="bg-surface-container rounded-xl p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-primary-container/20 rounded-2xl flex items-center justify-center text-primary-container mb-4">
                <Icon name="code" size={28} />
              </div>
              <h3 className="font-bold text-on-surface mb-2">Curated Problem Set</h3>
              <p className="text-on-surface-variant text-sm mb-6">
                Practice problems handpicked for the {track.title}.
              </p>
              <Link
                to={`/app/problems?tag=${trackId}`}
                className="w-full bg-primary-container text-white font-bold py-3 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 text-center"
              >
                View Problems
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
