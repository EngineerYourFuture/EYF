import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { SUBJECT_DATA } from '../data/subjects';

export function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const subject = subjectId ? SUBJECT_DATA[subjectId] : null;

  if (!subject) {
    return (
      <AppShell>
        <div className="pt-8 text-center">
          <p className="text-zinc-500 text-lg">Subject not found.</p>
          <button
            onClick={() => navigate('/app/subjects')}
            className="mt-6 text-primary-container font-bold text-[11px] uppercase tracking-widest"
          >
            ← Back to Subjects
          </button>
        </div>
      </AppShell>
    );
  }

  const allTopics = subject.sections.flatMap((s) => s.topics);
  const doneCount = allTopics.filter((t) => t.done).length;

  return (
    <AppShell>
      <div className="pt-8 max-w-3xl">
        {/* Back */}
        <button
          onClick={() => navigate('/app/subjects')}
          className="flex items-center gap-2 text-zinc-500 hover:text-on-surface transition-colors font-bold text-[11px] uppercase tracking-widest mb-10"
        >
          <Icon name="arrow_back" size={16} />
          Core Subjects
        </button>

        {/* Header */}
        <div className="bg-surface-container rounded-xl p-8 mb-10 flex items-center gap-8">
          <div className={`w-20 h-20 bg-surface-container-high rounded-2xl flex items-center justify-center flex-shrink-0 ${subject.color}`}>
            <Icon name={subject.icon} size={40} />
          </div>
          <div className="flex-1">
            <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-1">Core Subject</p>
            <h1 className="text-3xl font-black tracking-tighter mb-2">{subject.title}</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400">{allTopics.length} topics</span>
              <span className="text-sm text-zinc-400">·</span>
              <span className="text-sm text-zinc-400">{doneCount} completed</span>
            </div>
            <div className="mt-3 h-1.5 bg-surface-container-highest rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full bg-primary-container rounded-full"
                style={{ width: `${allTopics.length ? (doneCount / allTopics.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {subject.sections.map((section) => (
            <div key={section.title}>
              <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-4">
                {section.title}
              </p>
              <div className="space-y-2">
                {section.topics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => navigate(`/app/subjects/${subjectId}/${topic.id}`)}
                    className="bg-surface-container rounded-xl px-6 py-4 flex items-center gap-4 hover:bg-surface-container-high transition-colors group cursor-pointer"
                  >
                    {/* Completion circle */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                      topic.done
                        ? 'bg-green-500 border-green-500'
                        : 'border-zinc-600 group-hover:border-zinc-400'
                    }`}>
                      {topic.done && <Icon name="check" size={14} className="text-white" />}
                    </div>

                    {/* Title */}
                    <span className="flex-1 font-semibold text-on-surface group-hover:text-white transition-colors">
                      {topic.title}
                    </span>

                    {/* Duration */}
                    <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {topic.duration}
                    </span>

                    {/* Start button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/app/subjects/${subjectId}/${topic.id}`); }}
                      className="px-4 py-1.5 bg-surface-container-high group-hover:bg-primary-container text-zinc-400 group-hover:text-white rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      {topic.done ? 'Review' : 'Start'}
                    </button>

                    <Icon name="chevron_right" size={18} className="text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
