import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { Skeleton } from '../components/Skeleton';
import { SUBJECT_DATA, findTopic } from '../data/subjects';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';
import type { TopicContent } from '../data/subjectTopicContent';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

function markTopicCompleteApi(token: string, subjectId: string, topicId: string) {
  apiRequest(`/subjects/${subjectId}/topics/${topicId}/complete`, {
    method: 'POST',
    token,
    body: {},
  }).catch(() => {});
}

function triggerMarkComplete(
  token: string | undefined,
  subjectId: string | undefined,
  topicId: string | undefined,
  navigate: (path: string) => void,
  nextTopicId: string | undefined,
): void {
  if (token && subjectId && topicId) {
    markTopicCompleteApi(token, subjectId, topicId);
  }
  if (nextTopicId && subjectId) {
    setTimeout(() => navigate(`/app/subjects/${subjectId}/${nextTopicId}`), 500);
  }
}

export function SubjectTopicPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const navigate = useNavigate();
  const { fireXP } = useUser();
  const session = getSession();
  const [completed, setCompleted] = useState(false);
  const [content, setContent] = useState<TopicContent | null>(null);

  useEffect(() => {
    import('../data/subjectTopicContent').then(({ TOPIC_CONTENT, DEFAULT_CONTENT }) => {
      setContent(topicId ? (TOPIC_CONTENT[topicId] ?? DEFAULT_CONTENT) : DEFAULT_CONTENT);
    });
  }, [topicId]);

  const result = subjectId && topicId ? findTopic(subjectId, topicId) : null;
  const subject = subjectId ? SUBJECT_DATA[subjectId] : null;

  if (!result || !subject) {
    return (
      <AppShell>
        <div style={{ paddingTop: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--t3)', fontSize: 18 }}>Topic not found.</p>
          <button
            onClick={() => navigate(`/app/subjects/${subjectId}`)}
            style={{ marginTop: 24, color: '#E82127', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Back
          </button>
        </div>
      </AppShell>
    );
  }

  const { topic, allTopics } = result;
  const currentIdx = allTopics.findIndex((t) => t.id === topicId);
  const prevTopic = currentIdx > 0 ? allTopics[currentIdx - 1] : null;
  const nextTopic = currentIdx < allTopics.length - 1 ? allTopics[currentIdx + 1] : null;
  const progress = ((currentIdx + 1) / allTopics.length) * 100;

  const handleMarkComplete = () => {
    setCompleted(true);
    fireXP(15, `"${topic.title}" completed!`);
    triggerMarkComplete(session?.accessToken, subjectId, topicId, navigate, nextTopic?.id);
  };

  const isDone = topic.done || completed;

  return (
    <AppShell>
      <div style={{ paddingTop: 32, maxWidth: 768, margin: '0 auto' }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden', marginBottom: 32 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #E82127, #ff4d52)', borderRadius: 999 }}
          />
        </div>

        {/* Back + breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}
        >
          <button
            onClick={() => navigate(`/app/subjects/${subjectId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Icon name="arrow_back" size={16} />
            {subject.title}
          </button>
          <span style={{ color: '#3f3f46' }}>›</span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)' }}>
            {currentIdx + 1} / {allTopics.length}
          </span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 40 }}
        >
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', marginBottom: 12 }}>{topic.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E82127' }}>
              {subject.title}
            </span>
            <span style={{ color: '#3f3f46' }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)' }}>
              {topic.duration}
            </span>
            {isDone && (
              <>
                <span style={{ color: '#3f3f46' }}>·</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4ade80' }}>
                  Completed
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {content === null ? (
            <>
              <div style={{ ...GLASS, borderRadius: 16, padding: 32 }}>
                <Skeleton width={80} height={10} style={{ marginBottom: 16 }} />
                <Skeleton height={14} style={{ marginBottom: 10 }} />
                <Skeleton height={14} width="90%" style={{ marginBottom: 10 }} />
                <Skeleton height={14} width="75%" />
              </div>
              <div style={{ ...GLASS, borderRadius: 16, padding: 32 }}>
                <Skeleton width={100} height={10} style={{ marginBottom: 16 }} />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Skeleton width={20} height={20} borderRadius={10} style={{ flexShrink: 0 }} />
                    <Skeleton height={14} width={`${60 + i * 8}%`} />
                  </div>
                ))}
              </div>
              <div style={{ ...GLASS, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Skeleton width={64} height={10} />
                </div>
                <div style={{ padding: 24 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} height={13} width={`${50 + i * 7}%`} style={{ marginBottom: 8 }} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Overview */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                style={{ ...GLASS, borderRadius: 16, padding: 32 }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', marginBottom: 16 }}>Overview</p>
                {content.overview.split('\n\n').map((para) => (
                  <p key={para.slice(0, 40)} style={{ color: 'var(--t2)', lineHeight: 1.75, marginBottom: 16, fontSize: 14 }}>{para}</p>
                ))}
              </motion.div>

              {/* Key Points */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                style={{ ...GLASS, borderRadius: 16, padding: 32 }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', marginBottom: 16 }}>Key Concepts</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {content.keyPoints.map((point) => (
                    <li key={point.slice(0, 40)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(232,33,39,0.12)', border: '1px solid rgba(232,33,39,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E82127' }} />
                      </div>
                      <span style={{ color: 'var(--t2)', fontSize: 14, lineHeight: 1.7 }}>{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Code Block */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                style={{ ...GLASS, borderRadius: 16, overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)' }}>Example</p>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3f3f46' }}>{content.codeLang}</span>
                </div>
                <pre style={{ padding: 24, overflowX: 'auto' }}>
                  <code style={{ fontSize: 13, color: '#4ade80', fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre' }}>{content.code}</code>
                </pre>
              </motion.div>

              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                style={{ background: 'rgba(232,33,39,0.06)', border: '1px solid rgba(232,33,39,0.2)', borderRadius: 16, padding: 32 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Icon name="lightbulb" size={18} style={{ color: '#E82127' }} />
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E82127' }}>Summary</p>
                </div>
                <p style={{ color: 'var(--t2)', lineHeight: 1.75, fontSize: 14 }}>{content.summary}</p>
              </motion.div>
            </>
          )}
        </div>

        {/* Bottom navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <motion.button
            whileHover={{ scale: prevTopic ? 1.02 : 1 }}
            whileTap={{ scale: prevTopic ? 0.98 : 1 }}
            onClick={() => prevTopic && navigate(`/app/subjects/${subjectId}/${prevTopic.id}`)}
            disabled={!prevTopic}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--t2)', cursor: prevTopic ? 'pointer' : 'not-allowed', opacity: prevTopic ? 1 : 0.3 }}
          >
            <Icon name="arrow_back" size={16} />
            Previous
          </motion.button>

          <motion.button
            whileHover={{ scale: isDone ? 1 : 1.02 }}
            whileTap={{ scale: isDone ? 1 : 0.98 }}
            onClick={handleMarkComplete}
            disabled={isDone}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px', borderRadius: 999, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: isDone ? 'default' : 'pointer', background: isDone ? 'rgba(34,197,94,0.15)' : '#E82127', color: isDone ? '#4ade80' : '#fff', boxShadow: isDone ? 'none' : '0 0 24px rgba(232,33,39,0.35)' }}
          >
            {isDone ? (
              <>
                <Icon name="check_circle" size={16} />
                Completed
              </>
            ) : (
              <>
                Mark Complete {nextTopic ? '& Next' : ''}
                <Icon name="arrow_forward" size={16} />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </AppShell>
  );
}
