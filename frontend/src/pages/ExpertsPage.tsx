import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

interface Expert {
  id: string;
  displayName: string;
  title: string;
  company?: string;
  bio: string;
  specializations: string[];
  yearsExperience: number;
  available: boolean;
  hourlyRate?: number;
  rating: number;
  reviewCount: number;
}

interface ExpertDetail extends Expert {
  reviews: Array<{ id: string; rating: number; comment?: string; createdAt: string; reviewer: string }>;
}

const STATIC_EXPERTS: Expert[] = [
  { id: 'e1', displayName: 'Arjun Nair',   title: 'Staff Software Engineer',    company: 'Google',    bio: '8 years at Google working on distributed systems and infrastructure. Helped 200+ engineers crack FAANG interviews. Specialized in system design and advanced algorithms.', specializations: ['System Design', 'Distributed Systems', 'DSA', 'FAANG Prep'], yearsExperience: 8,  available: true,  hourlyRate: 150, rating: 4.9, reviewCount: 87 },
  { id: 'e2', displayName: 'Priya Sharma',  title: 'Principal Security Engineer', company: 'Microsoft', bio: 'OSCP-certified security engineer with 10 years in AppSec. Specializes in secure code review, threat modeling, and building security programs from scratch.',               specializations: ['Cybersecurity', 'AppSec', 'Threat Modeling', 'OWASP'],        yearsExperience: 10, available: true,  hourlyRate: 180, rating: 4.8, reviewCount: 62 },
  { id: 'e3', displayName: 'Rahul Mehta',   title: 'Engineering Manager',         company: 'Meta',      bio: 'Former SDE3 turned EM at Meta. Expert in career transitions, technical leadership, and navigating promotion cycles at large tech companies.',                          specializations: ['Career Growth', 'Leadership', 'System Design', 'OOP'],         yearsExperience: 12, available: false, hourlyRate: 200, rating: 4.7, reviewCount: 44 },
  { id: 'e4', displayName: 'Sneha Patel',   title: 'ML Engineer',                 company: 'Netflix',   bio: 'Working on recommendation systems and MLOps at Netflix. Passionate about teaching ML fundamentals and practical production ML engineering.',                           specializations: ['Machine Learning', 'MLOps', 'Python', 'System Design'],        yearsExperience: 6,  available: true,  hourlyRate: 130, rating: 4.8, reviewCount: 39 },
  { id: 'e5', displayName: 'Vikram Das',    title: 'Full Stack Architect',        company: 'Razorpay',  bio: 'Architect at Razorpay building payment infrastructure at scale. Expert in Node.js, React, PostgreSQL, and microservices architecture.',                               specializations: ['Full Stack', 'Microservices', 'Node.js', 'Architecture'],       yearsExperience: 9,  available: true,  hourlyRate: 100, rating: 4.6, reviewCount: 55 },
  { id: 'e6', displayName: 'Kavya Reddy',   title: 'DevOps/SRE Lead',             company: 'Flipkart',  bio: "SRE lead managing Flipkart's 99.99% uptime infrastructure. Deep expertise in Kubernetes, observability, incident management, and reliability engineering.",          specializations: ['DevOps', 'SRE', 'Kubernetes', 'Observability'],                 yearsExperience: 7,  available: true,  hourlyRate: 120, rating: 4.7, reviewCount: 31 },
];

function StarRating({ rating }: { readonly rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Icon key={s} name="star" size={12} filled style={{ color: s <= Math.round(rating) ? '#facc15' : '#3f3f46' }} />
      ))}
    </div>
  );
}

function filterExperts(experts: Expert[], filterAvailable: boolean, filterSpec: string): Expert[] {
  return experts.filter((e) => {
    if (filterAvailable && !e.available) return false;
    if (filterSpec !== 'all' && !e.specializations.includes(filterSpec)) return false;
    return true;
  });
}

export function ExpertsPage() {
  const session = getSession();
  const { fireXP } = useUser();
  const [experts, setExperts] = useState<Expert[]>(STATIC_EXPERTS);
  const [selected, setSelected] = useState<ExpertDetail | null>(null);
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterSpec, setFilterSpec] = useState('all');
  const [showBecomeExpert, setShowBecomeExpert] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const ALL_SPECS = ['all', 'System Design', 'DSA', 'FAANG Prep', 'Cybersecurity', 'Career Growth', 'Machine Learning', 'Full Stack', 'DevOps'];

  useEffect(() => {
    if (!session?.accessToken) return;
    const params = new URLSearchParams();
    if (filterAvailable) params.set('available', 'true');
    if (filterSpec !== 'all') params.set('specialization', filterSpec);
    apiRequest<{ experts: Expert[] }>(`/experts?${params}`, { token: session.accessToken })
      .then((d) => { if (d.experts.length > 0) setExperts(d.experts); })
      .catch(() => {});
  }, [session?.accessToken, filterAvailable, filterSpec]);

  const openExpert = async (id: string) => {
    if (!session?.accessToken) return;
    try {
      const d = await apiRequest<ExpertDetail>(`/experts/${id}`, { token: session.accessToken });
      setSelected(d);
    } catch {
      const found = experts.find((e) => e.id === id);
      if (found) setSelected({ ...found, reviews: [] });
    }
  };

  const submitReview = async () => {
    if (!session?.accessToken || !selected) return;
    setSubmittingReview(true);
    try {
      await apiRequest(`/experts/${selected.id}/review`, {
        token: session.accessToken,
        method: 'POST',
        body: { rating, comment },
      });
      setSelected((prev) => prev ? {
        ...prev,
        reviews: [{ id: 'new', rating, comment, createdAt: new Date().toISOString(), reviewer: 'you' }, ...prev.reviews],
        rating: Number.parseFloat(((prev.rating * prev.reviewCount + rating) / (prev.reviewCount + 1)).toFixed(1)),
        reviewCount: prev.reviewCount + 1,
      } : prev);
      setComment('');
    } catch {
      // ignore
    } finally {
      setSubmittingReview(false);
    }
  };

  const filtered = filterExperts(experts, filterAvailable, filterSpec);

  if (selected) {
    return (
      <AppShell>
        <div className="pt-8 max-w-3xl mx-auto">
          <button onClick={() => setSelected(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontSize: 14, marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="arrow_back" size={16} />Back to experts
          </button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ ...GLASS, borderRadius: 16, padding: 32, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(232,33,39,0.15)', border: '1px solid rgba(232,33,39,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E82127', fontSize: 24, fontWeight: 900, flexShrink: 0 }}>
                {selected.displayName[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{selected.displayName}</h1>
                    <p style={{ color: 'var(--t2)' }}>{selected.title}{selected.company && ` @ ${selected.company}`}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 999, color: selected.available ? '#4ade80' : '#71717a', background: selected.available ? 'rgba(74,222,128,0.1)' : 'rgba(113,113,122,0.1)' }}>
                      {selected.available ? '● Available' : '● Unavailable'}
                    </span>
                    {selected.hourlyRate && (
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#facc15' }}>${selected.hourlyRate}/hr</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                  <StarRating rating={selected.rating} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{selected.rating}</span>
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>({selected.reviewCount} reviews)</span>
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>· {selected.yearsExperience} yrs exp</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 20 }}>{selected.bio}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {selected.specializations.map((s) => (
                <span key={s} style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: '#d4d4d8' }}>{s}</span>
              ))}
            </div>
            {selected.available ? (
              <motion.button
                type="button"
                onClick={() => fireXP(30, 'Mentorship session booked!')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '12px 32px', borderRadius: 999, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}
              >
                <Icon name="calendar_add_on" size={16} />Book a Session
              </motion.button>
            ) : (
              <button disabled style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--t3)', fontWeight: 700, padding: '12px 32px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.06)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Icon name="event_busy" size={16} />Currently Unavailable
              </button>
            )}
          </motion.div>

          {/* Review form */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...GLASS, borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>Leave a Review</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--t2)' }}>Rating:</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <Icon name="star" size={20} filled style={{ color: s <= rating ? '#facc15' : '#3f3f46' }} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this mentor..."
              rows={3}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--t1)', outline: 'none', resize: 'none', marginBottom: 12, boxSizing: 'border-box' }}
            />
            <motion.button
              onClick={submitReview}
              disabled={submittingReview}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ background: 'rgba(232,33,39,0.14)', color: '#fff', fontWeight: 700, padding: '8px 20px', borderRadius: 999, border: '1px solid rgba(232,33,39,0.3)', cursor: 'pointer', fontSize: 14, opacity: submittingReview ? 0.5 : 1 }}
            >
              Submit Review
            </motion.button>
          </motion.div>

          <div className="space-y-3">
            {selected.reviews.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--t3)', textAlign: 'center', padding: '24px 0' }}>No reviews yet.</p>
            ) : (
              selected.reviews.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ ...GLASS, borderRadius: 14, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{r.reviewer}</span>
                      <StarRating rating={r.rating} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: 14, color: 'var(--t2)' }}>{r.comment}</p>}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl mx-auto">
        <PageHeader
          eyebrow="1:1 Mentorship"
          title="Expert Network."
          subtitle="1:1 sessions with engineers from Google, Meta, Netflix, Microsoft and top startups."
          accentColor="#facc15"
          stats={[
            { value: experts.length, label: 'Experts' },
            { value: '4.8',          label: 'Avg Rating', color: '#facc15' },
            { value: '20+',          label: 'Companies'   },
          ]}
          actions={
            <motion.button
              onClick={() => setShowBecomeExpert(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{ border: '1px solid rgba(250,204,21,0.3)', background: 'rgba(250,204,21,0.08)', color: '#facc15', fontWeight: 800, padding: '8px 18px', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
            >
              <Icon name="workspace_premium" size={14} />Become an Expert
            </motion.button>
          }
        />

        {/* Become Expert Modal */}
        <AnimatePresence>
          {showBecomeExpert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: 16 }}
              onClick={() => setShowBecomeExpert(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{ ...GLASS, borderRadius: 20, padding: 32, maxWidth: 448, width: '100%' }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>Become an EYF Expert</h3>
                <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 24, lineHeight: 1.6 }}>Share your expertise, earn income, and help engineers grow. We vet all expert applications.</p>
                <div style={{ marginBottom: 24 }} className="space-y-2">
                  {['3+ years of industry experience', 'Active in your field', 'Commitment to 2+ sessions/month', 'Profile review within 48 hours'].map((r) => (
                    <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--t2)' }}>
                      <Icon name="check_circle" size={14} filled style={{ color: '#4ade80' }} />{r}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowBecomeExpert(false)} style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)', color: 'var(--t2)', fontWeight: 700, padding: '10px 0', borderRadius: 999, fontSize: 14, background: 'transparent', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{ flex: 1, border: '1px solid rgba(250,204,21,0.3)', background: 'rgba(250,204,21,0.12)', color: '#facc15', fontWeight: 700, padding: '10px 0', borderRadius: 999, fontSize: 14, cursor: 'pointer' }}
                  >
                    Apply Now
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <motion.button
            onClick={() => setFilterAvailable(!filterAvailable)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: filterAvailable ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(255,255,255,0.08)', background: filterAvailable ? 'rgba(74,222,128,0.1)' : 'transparent', color: filterAvailable ? '#4ade80' : '#71717a' }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: filterAvailable ? '#4ade80' : '#52525b' }} />
            Available Only
          </motion.button>
          {ALL_SPECS.map((spec) => {
            const active = filterSpec === spec;
            return (
              <motion.button key={spec} onClick={() => setFilterSpec(spec)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{ padding: '6px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: active ? '1px solid rgba(232,33,39,0.4)' : '1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(232,33,39,0.14)' : 'transparent', color: active ? '#fff' : '#71717a' }}
              >
                {spec}
              </motion.button>
            );
          })}
        </div>

        {/* Expert Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((expert, i) => (
            <motion.button
              key={expert.id}
              type="button"
              onClick={() => openExpert(expert.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-left"
              style={{ ...GLASS, borderRadius: 20, padding: 28, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(232,33,39,0.12)', border: '1px solid rgba(232,33,39,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E82127', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>
                  {expert.displayName[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expert.displayName}</h3>
                  <p style={{ fontSize: 12, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expert.title}{expert.company && ` @ ${expert.company}`}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, flexShrink: 0, color: expert.available ? '#4ade80' : '#71717a', background: expert.available ? 'rgba(74,222,128,0.1)' : 'rgba(113,113,122,0.1)' }}>
                  {expert.available ? '●' : '○'}
                </span>
              </div>

              <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{expert.bio}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {expert.specializations.slice(0, 3).map((s) => (
                  <span key={s} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: 'var(--t2)' }}>{s}</span>
                ))}
                {expert.specializations.length > 3 && (
                  <span style={{ fontSize: 10, color: 'var(--t4)' }}>+{expert.specializations.length - 3}</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StarRating rating={expert.rating} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{expert.rating}</span>
                  <span style={{ fontSize: 10, color: 'var(--t3)' }}>({expert.reviewCount})</span>
                </div>
                {expert.hourlyRate && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#facc15' }}>${expert.hourlyRate}/hr</span>
                )}
              </div>

              <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 8 }}>{expert.yearsExperience} years experience</div>
            </motion.button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3" style={{ textAlign: 'center', padding: '64px 0' }}>
              <Icon name="groups" size={40} style={{ color: '#3f3f46', display: 'block', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--t2)' }}>No experts match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
