import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

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
  { id: 'e1', displayName: 'Arjun Nair', title: 'Staff Software Engineer', company: 'Google', bio: '8 years at Google working on distributed systems and infrastructure. Helped 200+ engineers crack FAANG interviews. Specialized in system design and advanced algorithms.', specializations: ['System Design', 'Distributed Systems', 'DSA', 'FAANG Prep'], yearsExperience: 8, available: true, hourlyRate: 150, rating: 4.9, reviewCount: 87 },
  { id: 'e2', displayName: 'Priya Sharma', title: 'Principal Security Engineer', company: 'Microsoft', bio: 'OSCP-certified security engineer with 10 years in AppSec. Specializes in secure code review, threat modeling, and building security programs from scratch.', specializations: ['Cybersecurity', 'AppSec', 'Threat Modeling', 'OWASP'], yearsExperience: 10, available: true, hourlyRate: 180, rating: 4.8, reviewCount: 62 },
  { id: 'e3', displayName: 'Rahul Mehta', title: 'Engineering Manager', company: 'Meta', bio: 'Former SDE3 turned EM at Meta. Expert in career transitions, technical leadership, and navigating promotion cycles at large tech companies.', specializations: ['Career Growth', 'Leadership', 'System Design', 'OOP'], yearsExperience: 12, available: false, hourlyRate: 200, rating: 4.7, reviewCount: 44 },
  { id: 'e4', displayName: 'Sneha Patel', title: 'ML Engineer', company: 'Netflix', bio: 'Working on recommendation systems and MLOps at Netflix. Passionate about teaching ML fundamentals and practical production ML engineering.', specializations: ['Machine Learning', 'MLOps', 'Python', 'System Design'], yearsExperience: 6, available: true, hourlyRate: 130, rating: 4.8, reviewCount: 39 },
  { id: 'e5', displayName: 'Vikram Das', title: 'Full Stack Architect', company: 'Razorpay', bio: 'Architect at Razorpay building payment infrastructure at scale. Expert in Node.js, React, PostgreSQL, and microservices architecture.', specializations: ['Full Stack', 'Microservices', 'Node.js', 'Architecture'], yearsExperience: 9, available: true, hourlyRate: 100, rating: 4.6, reviewCount: 55 },
  { id: 'e6', displayName: 'Kavya Reddy', title: 'DevOps/SRE Lead', company: 'Flipkart', bio: 'SRE lead managing Flipkart\'s 99.99% uptime infrastructure. Deep expertise in Kubernetes, observability, incident management, and reliability engineering.', specializations: ['DevOps', 'SRE', 'Kubernetes', 'Observability'], yearsExperience: 7, available: true, hourlyRate: 120, rating: 4.7, reviewCount: 31 },
];

function StarRating({ rating }: { readonly rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Icon key={s} name="star" size={12} className={s <= Math.round(rating) ? 'text-yellow-400' : 'text-zinc-700'} filled />
      ))}
    </div>
  );
}

export function ExpertsPage() {
  const session = getSession();
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

  const filtered = experts.filter((e) => {
    if (filterAvailable && !e.available) return false;
    if (filterSpec !== 'all' && !e.specializations.includes(filterSpec)) return false;
    return true;
  });

  if (selected) {
    return (
      <AppShell>
        <div className="pt-8 max-w-3xl mx-auto">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
            <Icon name="arrow_back" size={16} />Back to experts
          </button>

          <div className="bg-surface-container rounded-2xl p-8 mb-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                {selected.displayName[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h1 className="text-2xl font-bold">{selected.displayName}</h1>
                    <p className="text-on-surface-variant">{selected.title}{selected.company && ` @ ${selected.company}`}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${selected.available ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-500'}`}>
                      {selected.available ? '● Available' : '● Unavailable'}
                    </span>
                    {selected.hourlyRate && (
                      <span className="text-sm font-bold text-yellow-400">${selected.hourlyRate}/hr</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <StarRating rating={selected.rating} />
                  <span className="text-sm font-bold">{selected.rating}</span>
                  <span className="text-xs text-zinc-500">({selected.reviewCount} reviews)</span>
                  <span className="text-xs text-zinc-500">· {selected.yearsExperience} yrs exp</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-5">{selected.bio}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {selected.specializations.map((s) => (
                <span key={s} className="text-[10px] font-bold bg-surface-container-highest px-3 py-1 rounded-full text-zinc-300">{s}</span>
              ))}
            </div>
            {selected.available ? (
              <button className="bg-primary-container text-white font-bold py-3 px-8 rounded-full hover:brightness-110 transition-all flex items-center gap-2">
                <Icon name="calendar_add_on" size={16} />Book a Session
              </button>
            ) : (
              <button disabled className="bg-surface-container-highest text-zinc-500 font-bold py-3 px-8 rounded-full cursor-not-allowed flex items-center gap-2">
                <Icon name="event_busy" size={16} />Currently Unavailable
              </button>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-surface-container rounded-xl p-6 mb-4">
            <h3 className="font-bold mb-4">Leave a Review</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-zinc-400">Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Icon name="star" size={20} className={s <= rating ? 'text-yellow-400' : 'text-zinc-700'} filled />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this mentor..."
              rows={3}
              className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg p-3 text-sm focus:outline-none resize-none mb-3"
            />
            <button onClick={submitReview} disabled={submittingReview}
              className="bg-primary-container text-white font-bold py-2 px-5 rounded-full text-sm hover:brightness-110 transition-all disabled:opacity-40">
              Submit Review
            </button>
          </div>

          <div className="space-y-3">
            {selected.reviews.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">No reviews yet.</p>
            ) : (
              selected.reviews.map((r) => (
                <div key={r.id} className="bg-surface-container rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{r.reviewer}</span>
                      <StarRating rating={r.rating} />
                    </div>
                    <span className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-sm text-on-surface-variant">{r.comment}</p>}
                </div>
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
        {/* Hero */}
        <div className="mb-10 p-10 bg-surface-container rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-500/5 blur-[80px] rounded-full -mr-20 -mt-20" />
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tighter mb-2">Expert Network</h1>
              <p className="text-on-surface-variant max-w-md">1:1 sessions with engineers from Google, Meta, Netflix, Microsoft and top startups. Accelerate your growth with personalized mentorship.</p>
              <div className="flex gap-6 mt-8">
                <div><p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">Experts</p><p className="text-2xl font-bold">{experts.length}</p></div>
                <div className="border-l border-outline-variant/20 pl-6"><p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">Avg Rating</p><p className="text-2xl font-bold text-yellow-400">4.8</p></div>
                <div className="border-l border-outline-variant/20 pl-6"><p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">Companies</p><p className="text-2xl font-bold">20+</p></div>
              </div>
            </div>
            <button onClick={() => setShowBecomeExpert(true)}
              className="border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-bold py-3 px-6 rounded-full hover:bg-yellow-500/20 transition-all flex items-center gap-2 text-sm">
              <Icon name="workspace_premium" size={16} />Become an Expert
            </button>
          </div>
        </div>

        {/* Become Expert Modal */}
        {showBecomeExpert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1B1B1B] rounded-2xl p-8 max-w-md w-full border border-white/10">
              <h3 className="text-xl font-bold mb-2">Become an EYF Expert</h3>
              <p className="text-sm text-on-surface-variant mb-6">Share your expertise, earn income, and help engineers grow. We vet all expert applications.</p>
              <div className="space-y-2 mb-6">
                {['3+ years of industry experience', 'Active in your field', 'Commitment to 2+ sessions/month', 'Profile review within 48 hours'].map((r) => (
                  <div key={r} className="flex items-center gap-2 text-sm text-zinc-400">
                    <Icon name="check_circle" className="text-green-400" size={14} filled />{r}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowBecomeExpert(false)} className="flex-1 border border-outline-variant/30 text-zinc-400 font-bold py-2.5 rounded-full text-sm hover:bg-surface-container transition-all">
                  Cancel
                </button>
                <button className="flex-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-bold py-2.5 rounded-full text-sm hover:bg-yellow-500/30 transition-all">
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setFilterAvailable(!filterAvailable)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
              filterAvailable ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'text-zinc-500 border-zinc-800/50 hover:text-zinc-300'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${filterAvailable ? 'bg-green-400' : 'bg-zinc-600'}`} />
            Available Only
          </button>
          {ALL_SPECS.map((spec) => (
            <button key={spec} onClick={() => setFilterSpec(spec)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                filterSpec === spec ? 'bg-primary-container/20 text-primary-container border-primary-container/30' : 'text-zinc-500 border-zinc-800/50 hover:text-zinc-300'
              }`}>
              {spec}
            </button>
          ))}
        </div>

        {/* Expert Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((expert) => (
            <button
              key={expert.id}
              type="button"
              onClick={() => openExpert(expert.id)}
              className="w-full text-left bg-surface-container rounded-2xl p-7 hover:bg-surface-container-high transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-white text-lg font-black flex-shrink-0">
                  {expert.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold group-hover:text-primary-container transition-colors truncate">{expert.displayName}</h3>
                  <p className="text-xs text-on-surface-variant truncate">{expert.title}{expert.company && ` @ ${expert.company}`}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${expert.available ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-500'}`}>
                  {expert.available ? '●' : '○'}
                </span>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-2">{expert.bio}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {expert.specializations.slice(0, 3).map((s) => (
                  <span key={s} className="text-[10px] font-bold bg-surface-container-highest px-2 py-0.5 rounded-full text-zinc-400">{s}</span>
                ))}
                {expert.specializations.length > 3 && (
                  <span className="text-[10px] text-zinc-600">+{expert.specializations.length - 3}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={expert.rating} />
                  <span className="text-xs font-bold">{expert.rating}</span>
                  <span className="text-[10px] text-zinc-500">({expert.reviewCount})</span>
                </div>
                {expert.hourlyRate && (
                  <span className="text-xs font-bold text-yellow-400">${expert.hourlyRate}/hr</span>
                )}
              </div>

              <div className="text-[10px] text-zinc-600 mt-2">{expert.yearsExperience} years experience</div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16">
              <Icon name="groups" className="text-zinc-700 mb-3" size={40} />
              <p className="text-on-surface-variant">No experts match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
