import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { SUBJECT_DATA } from '../data/subjects';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

export function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const subject = subjectId ? SUBJECT_DATA[subjectId] : null;

  if (!subject) {
    return (
      <AppShell>
        <div style={{ paddingTop: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--t3)', fontSize: 18 }}>Subject not found.</p>
          <button
            onClick={() => navigate('/app/subjects')}
            style={{ marginTop: 24, color: '#E82127', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Back to Subjects
          </button>
        </div>
      </AppShell>
    );
  }

  const allTopics = subject.sections.flatMap((s) => s.topics);
  const doneCount = allTopics.filter((t) => t.done).length;
  const pct = allTopics.length ? (doneCount / allTopics.length) * 100 : 0;

  return (
    <AppShell>
      <div style={{ paddingTop: 32, maxWidth: 768, margin: '0 auto' }}>
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/app/subjects')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 40, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Icon name="arrow_back" size={16} />
          Core Subjects
        </motion.button>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...GLASS, borderRadius: 16, padding: 32, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 32 }}
        >
          <div style={{ width: 80, height: 80, background: 'rgba(232,33,39,0.12)', border: '1px solid rgba(232,33,39,0.25)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={subject.icon} size={40} style={{ color: '#E82127' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', marginBottom: 4 }}>Core Subject</p>
            <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', marginBottom: 8 }}>{subject.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--t3)' }}>{allTopics.length} topics</span>
              <span style={{ color: '#3f3f46' }}>·</span>
              <span style={{ fontSize: 14, color: 'var(--t3)' }}>{doneCount} completed</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', maxWidth: 320 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #E82127, #ff4d52)', borderRadius: 999 }}
              />
            </div>
          </div>
        </motion.div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {subject.sections.map((section, si) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08 }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', marginBottom: 16 }}>
                {section.title}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.topics.map((topic, ti) => (
                  <motion.button
                    key={topic.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: si * 0.08 + ti * 0.04 }}
                    whileHover={{ x: 4 }}
                    type="button"
                    onClick={() => navigate(`/app/subjects/${subjectId}/${topic.id}`)}
                    style={{ ...GLASS, borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  >
                    {/* Completion circle */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: topic.done ? '#22c55e' : 'transparent',
                      border: topic.done ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.15)',
                    }}>
                      {topic.done && <Icon name="check" size={14} style={{ color: '#fff' }} />}
                    </div>

                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--t1)' }}>{topic.title}</span>

                    <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t4)' }}>
                      {topic.duration}
                    </span>

                    <span style={{ padding: '6px 16px', background: topic.done ? 'rgba(34,197,94,0.1)' : 'rgba(232,33,39,0.1)', border: `1px solid ${topic.done ? 'rgba(34,197,94,0.25)' : 'rgba(232,33,39,0.25)'}`, borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: topic.done ? '#4ade80' : '#E82127' }}>
                      {topic.done ? 'Review' : 'Start'}
                    </span>

                    <Icon name="chevron_right" size={18} style={{ color: 'var(--t4)' }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
