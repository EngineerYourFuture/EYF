import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

interface Post {
  id: string;
  title?: string;
  body: string;
  category: string;
  tags: string[];
  upvotes: number;
  pinned: boolean;
  createdAt: string;
  author: string;
  replyCount: number;
}

interface PostDetail extends Post {
  replies: Array<{ id: string; body: string; upvotes: number; createdAt: string; author: string; replyCount: number }>;
}

type ViewMode = 'community' | 'squads';

interface Squad {
  id: string;
  name: string;
  focus: string;
  focusIcon: string;
  focusColor: string;
  members: number;
  maxMembers: number;
  goal: string;
  cadence: string;
  streak: number;
  joined: boolean;
  tags: string[];
  description: string;
  todayTask: string;
  memberNames: string[];
}

const STATIC_SQUADS: Squad[] = [
  {
    id: 'sq1', name: 'LC Daily Grinders', focus: 'DSA', focusIcon: 'code', focusColor: 'text-blue-400',
    members: 4, maxMembers: 6, goal: '1 LeetCode problem every day', cadence: 'Daily',
    streak: 23, joined: false, tags: ['dsa', 'leetcode', 'daily'],
    description: 'Accountability group for daily DSA practice. We share our solutions and discuss approaches every evening.',
    todayTask: 'Solve: Maximum Product Subarray (Medium)',
    memberNames: ['arjun_cs', 'priya_dev', 'rohit_codes', 'naveen_j'],
  },
  {
    id: 'sq2', name: 'System Design Warriors', focus: 'System Design', focusIcon: 'architecture', focusColor: 'text-cyan-400',
    members: 5, maxMembers: 6, goal: '1 system design deep-dive per week', cadence: 'Weekly',
    streak: 8, joined: false, tags: ['system-design', 'architecture'],
    description: 'Weekend study group for system design. We pick one real-world system, design it together, and critique each other\'s approaches.',
    todayTask: 'This week: Design Twitter/X — post your HLD diagram',
    memberNames: ['sys_design_fan', 'backend_king', 'arch_aspirant', 'divya_ms', 'karthik_r'],
  },
  {
    id: 'sq3', name: 'FAANG 90-Day Sprint', focus: 'Interview Prep', focusIcon: 'route', focusColor: 'text-green-400',
    members: 3, maxMembers: 5, goal: 'Interview-ready in 90 days', cadence: 'Daily',
    streak: 12, joined: false, tags: ['faang', 'interview', 'sprint'],
    description: 'Intense 90-day structured prep with weekly mock interviews. Everyone submits a daily progress update — no silent days.',
    todayTask: 'Week 3, Day 4: Trees + BST chapter + 2 tree problems',
    memberNames: ['sprint_rajesh', 'faang_dreamer', 'bangalore_coder'],
  },
  {
    id: 'sq4', name: 'Campus Placement Crew', focus: 'Placement', focusIcon: 'work', focusColor: 'text-orange-400',
    members: 6, maxMembers: 6, goal: 'Clear TCS/Infosys/Wipro OA and get first offer', cadence: 'Daily',
    streak: 5, joined: false, tags: ['campus', 'placement', 'service-companies'],
    description: 'Freshers preparing for campus placements. We share OA questions, aptitude tricks, and celebrate each other\'s offers.',
    todayTask: 'Aptitude practice: Time & Work problems (30 min) + 1 coding problem',
    memberNames: ['fresher_vikram', 'placement_prep', 'gfg_grinder', 'aptitude_ace', 'new_bee_dev', 'campus_coder'],
  },
  {
    id: 'sq5', name: 'Backend Builders', focus: 'Backend', focusIcon: 'dns', focusColor: 'text-purple-400',
    members: 4, maxMembers: 6, goal: 'Ship one real project per month, learn together', cadence: 'Weekly',
    streak: 3, joined: false, tags: ['backend', 'projects', 'node', 'python'],
    description: 'Building real backend projects together. Each month we pick a project, split tasks, do code review, and deploy it.',
    todayTask: 'Review PRs for the URL shortener project + plan month 2',
    memberNames: ['api_builder', 'db_wizard', 'microservice_fan', 'container_dev'],
  },
  {
    id: 'sq6', name: 'Cybersecurity Circle', focus: 'Security', focusIcon: 'shield', focusColor: 'text-red-400',
    members: 3, maxMembers: 5, goal: 'Complete OWASP Top 10 + 5 CTF challenges per month', cadence: 'Weekly',
    streak: 7, joined: false, tags: ['security', 'ctf', 'owasp'],
    description: 'Security-focused study group. We work through CTF challenges together and build each other\'s threat modeling skills.',
    todayTask: 'CTF: Web challenge on PicoCTF — solve and share your approach',
    memberNames: ['sec_learner', 'ctf_hunter', 'owasp_student'],
  },
];

const CATEGORIES = ['general', 'dsa', 'oop', 'security', 'system-design', 'career'] as const;
const CAT_META: Record<string, { icon: string; color: string; bg: string }> = {
  general:       { icon: 'forum', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  dsa:           { icon: 'code', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  oop:           { icon: 'account_tree', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  security:      { icon: 'shield', color: 'text-red-400', bg: 'bg-red-500/10' },
  'system-design':{ icon: 'architecture', color: 'text-green-400', bg: 'bg-green-500/10' },
  career:        { icon: 'work', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
};

const STATIC_POSTS: Post[] = [
  { id: 'p1', title: 'How do you approach system design questions in interviews?', body: 'I always struggle with where to start. Do you clarify requirements first or jump into high-level architecture? Looking for a framework that works consistently.', category: 'system-design', tags: ['interviews', 'system-design'], upvotes: 47, pinned: true, createdAt: '2026-05-14T10:00:00Z', author: 'praneeth_dev', replyCount: 12 },
  { id: 'p2', title: 'Observer vs Mediator pattern — when to choose which?', body: 'Both decouple components but in different ways. In what scenarios would you pick Observer over Mediator? Real-world examples appreciated.', category: 'oop', tags: ['patterns', 'design'], upvotes: 34, pinned: false, createdAt: '2026-05-13T14:30:00Z', author: 'arjun_cs', replyCount: 8 },
  { id: 'p3', title: 'XSS vs CSRF — confusing myself with the differences', body: 'I keep mixing these up. Can someone give a clear intuitive explanation with a concrete attack scenario for each? I understand the technical definition but can\'t "feel" the difference.', category: 'security', tags: ['web-security', 'owasp'], upvotes: 29, pinned: false, createdAt: '2026-05-12T09:15:00Z', author: 'sec_learner', replyCount: 6 },
  { id: 'p4', title: 'Tips for staying consistent with DSA practice?', body: 'I start strong then lose motivation after a week. How do you maintain a daily DSA habit without burning out? Especially when work gets hectic.', category: 'dsa', tags: ['habit', 'productivity'], upvotes: 61, pinned: false, createdAt: '2026-05-11T16:45:00Z', author: 'dev_consistent', replyCount: 22 },
  { id: 'p5', title: 'Moving from SDE2 to SDE3 — what actually changes?', body: 'About to go for SDE3 promotion. Beyond leetcode, what\'s the mindset/skill shift expected? Especially around design and ownership.', category: 'career', tags: ['career-growth', 'senior'], upvotes: 89, pinned: true, createdAt: '2026-05-10T11:00:00Z', author: 'growth_minded', replyCount: 31 },
  { id: 'p6', title: 'Is it worth learning assembly for a security career?', body: 'Starting my journey into reverse engineering and malware analysis. How much assembly do I actually need? Any resources that helped you?', category: 'security', tags: ['reverse-engineering', 'assembly'], upvotes: 18, pinned: false, createdAt: '2026-05-09T08:30:00Z', author: 'malware_curious', replyCount: 5 },
  { id: 'p7', title: 'Just got my Google L4 offer — AMA about the process', body: 'It took 3 attempts over 18 months but I finally cracked it. Happy to answer anything about the interview structure, what they actually look for in system design rounds, and how I prepared this time differently.', category: 'career', tags: ['google', 'success-story', 'ama'], upvotes: 142, pinned: true, createdAt: '2026-05-08T12:00:00Z', author: 'g_l4_achieve', replyCount: 47 },
  { id: 'p8', title: 'Difference between eventual consistency and strong consistency — practical examples?', body: 'I understand the theory but struggle to explain it intuitively. When does eventual consistency actually bite you? Looking for real production war stories not textbook definitions.', category: 'system-design', tags: ['distributed-systems', 'consistency'], upvotes: 38, pinned: false, createdAt: '2026-05-08T09:00:00Z', author: 'dist_sys_noob', replyCount: 14 },
  { id: 'p9', title: 'Struggling with graph problems — how do you decide BFS vs DFS?', body: 'I can implement both but always freeze when deciding which one to use. Is there a rule of thumb? Shortest path = BFS obviously, but what about everything else?', category: 'dsa', tags: ['graphs', 'bfs', 'dfs'], upvotes: 55, pinned: false, createdAt: '2026-05-07T15:20:00Z', author: 'graph_confused', replyCount: 19 },
  { id: 'p10', title: 'How do you handle "tell me about yourself" as an introvert?', body: 'The most dreaded question for me. I blank out or ramble. How do you structure a compelling 2-minute intro that doesn\'t feel scripted but also doesn\'t go all over the place?', category: 'career', tags: ['behavioral', 'intro', 'soft-skills'], upvotes: 73, pinned: false, createdAt: '2026-05-06T11:45:00Z', author: 'introvert_eng', replyCount: 28 },
  { id: 'p11', title: 'SOLID — which principle do you actually use most day-to-day?', body: 'We all know the acronym but which one genuinely impacts your day-to-day code quality the most? For me it\'s DIP by far — swapped implementations during testing so many times.', category: 'oop', tags: ['solid', 'clean-code'], upvotes: 44, pinned: false, createdAt: '2026-05-05T14:00:00Z', author: 'solid_fan', replyCount: 17 },
  { id: 'p12', title: 'JWT stored in localStorage — is it really that bad?', body: 'I keep seeing "never use localStorage for tokens" but our entire company does it. Is the risk actually significant for an internal B2B tool? What\'s the realistic threat model?', category: 'security', tags: ['jwt', 'auth', 'localStorage'], upvotes: 51, pinned: false, createdAt: '2026-05-04T10:30:00Z', author: 'sec_pragmatist', replyCount: 21 },
  { id: 'p13', title: 'How do you explain technical complexity to non-technical stakeholders?', body: 'Preparing for a principal role interview where they test your ability to influence without authority. Any frameworks or stories that worked for you?', category: 'career', tags: ['leadership', 'communication', 'principal'], upvotes: 67, pinned: false, createdAt: '2026-05-03T09:00:00Z', author: 'future_principal', replyCount: 24 },
  { id: 'p14', title: 'Database selection for a real-time leaderboard — SQL or NoSQL?', body: 'Building a feature that needs top-100 globally updated in real time. Millions of users. Redis sorted sets seem obvious but what about persistence? How would you design this?', category: 'system-design', tags: ['database', 'redis', 'leaderboard'], upvotes: 82, pinned: false, createdAt: '2026-05-02T16:00:00Z', author: 'leaderboard_builder', replyCount: 33 },
  { id: 'p15', title: 'Sliding window vs two pointers — they feel the same to me', body: 'I know they\'re technically different but when I see a new problem I can\'t tell which to reach for. Someone please give me a decision rule I can actually use in an interview.', category: 'dsa', tags: ['patterns', 'sliding-window', 'two-pointers'], upvotes: 93, pinned: false, createdAt: '2026-05-01T11:30:00Z', author: 'pattern_confused', replyCount: 38 },
];

const SQUAD_FOCUS_META: Record<string, { icon: string; color: string }> = {
  'DSA': { icon: 'code', color: 'text-blue-400' },
  'System Design': { icon: 'architecture', color: 'text-cyan-400' },
  'Interview Prep': { icon: 'route', color: 'text-green-400' },
  'Placement': { icon: 'work', color: 'text-orange-400' },
  'Backend': { icon: 'dns', color: 'text-purple-400' },
  'Security': { icon: 'shield', color: 'text-red-400' },
  'Frontend': { icon: 'web', color: 'text-blue-300' },
  'GenAI': { icon: 'auto_awesome', color: 'text-amber-400' },
};

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CommunityPage() {
  const session = getSession();
  const { fireXP } = useUser();
  const [posts, setPosts] = useState<Post[]>(STATIC_POSTS);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selected, setSelected] = useState<PostDetail | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>('community');
  const [squads, setSquads] = useState<Squad[]>(() => {
    try {
      const stored = localStorage.getItem('eyf.squads');
      if (stored) return JSON.parse(stored) as Squad[];
    } catch { /* ignore */ }
    return STATIC_SQUADS;
  });
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [newSquad, setNewSquad] = useState({ name: '', focus: 'DSA', goal: '', cadence: 'Daily', description: '' });
  const [squadDoneToday, setSquadDoneToday] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('eyf.squad.done') ?? '[]') as string[]); } catch { return new Set(); }
  });
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '', category: 'general', tags: '' });
  const [newReply, setNewReply] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    const url = activeCategory === 'all' ? '/community/posts' : `/community/posts?category=${activeCategory}`;
    apiRequest<{ posts: Post[] }>(url, { token: session.accessToken })
      .then((d) => { if (d.posts.length > 0) setPosts(d.posts); })
      .catch(() => {});
  }, [session?.accessToken, activeCategory]);

  const openPost = async (id: string) => {
    if (!session?.accessToken) return;
    try {
      const d = await apiRequest<PostDetail>(`/community/posts/${id}`, { token: session.accessToken });
      setSelected(d);
    } catch {
      const found = posts.find((p) => p.id === id);
      if (found) setSelected({ ...found, replies: [] });
    }
  };

  const submitPost = async () => {
    if (!session?.accessToken || !newPost.title || !newPost.body) return;
    setPosting(true);
    try {
      const created = await apiRequest<Post>('/community/posts', {
        token: session.accessToken,
        method: 'POST',
        body: {
          title: newPost.title,
          body: newPost.body,
          category: newPost.category,
          tags: newPost.tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      });
      setPosts((prev) => [created, ...prev]);
      setNewPost({ title: '', body: '', category: 'general', tags: '' });
      setShowCompose(false);
      fireXP(15, 'Post shared with the community!');
    } catch {
      // ignore
    } finally {
      setPosting(false);
    }
  };

  const submitReply = async () => {
    if (!session?.accessToken || !newReply || !selected) return;
    setPosting(true);
    try {
      const reply = await apiRequest<{ id: string; body: string; upvotes: number; createdAt: string; author: string; replyCount: number }>('/community/posts', {
        token: session.accessToken,
        method: 'POST',
        body: { body: newReply, category: selected.category, parentId: selected.id },
      });
      setSelected((prev) => prev ? { ...prev, replies: [...prev.replies, reply], replyCount: prev.replyCount + 1 } : prev);
      setNewReply('');
      fireXP(5, 'Reply posted!');
    } catch {
      // ignore
    } finally {
      setPosting(false);
    }
  };

  const vote = async (postId: string, v: 1 | -1) => {
    if (!session?.accessToken) return;
    try {
      const { upvotes } = await apiRequest<{ upvotes: number }>(`/community/posts/${postId}/vote`, {
        token: session.accessToken,
        method: 'POST',
        body: { vote: v },
      });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, upvotes } : p));
      if (selected?.id === postId) setSelected((prev) => prev ? { ...prev, upvotes } : prev);
    } catch {
      // ignore
    }
  };

  const joinSquad = (id: string) => {
    setSquads((prev) => {
      const updated = prev.map((s) => s.id === id ? { ...s, joined: true, members: s.members + 1 } : s);
      localStorage.setItem('eyf.squads', JSON.stringify(updated));
      return updated;
    });
    fireXP(25, 'Joined a Study Squad!');
    if (selectedSquad?.id === id) setSelectedSquad((s) => s ? { ...s, joined: true, members: s.members + 1 } : s);
  };

  const leaveSquad = (id: string) => {
    setSquads((prev) => {
      const updated = prev.map((s) => s.id === id ? { ...s, joined: false, members: Math.max(0, s.members - 1) } : s);
      localStorage.setItem('eyf.squads', JSON.stringify(updated));
      return updated;
    });
    if (selectedSquad?.id === id) setSelectedSquad((s) => s ? { ...s, joined: false, members: Math.max(0, s.members - 1) } : s);
  };

  const markTodayDone = (id: string) => {
    const updated = new Set(squadDoneToday).add(id);
    setSquadDoneToday(updated);
    localStorage.setItem('eyf.squad.done', JSON.stringify([...updated]));
    fireXP(10, 'Squad task completed!');
  };

  const createSquad = () => {
    if (!newSquad.name || !newSquad.goal) return;
    const meta = SQUAD_FOCUS_META[newSquad.focus] ?? SQUAD_FOCUS_META['DSA'];
    const squad: Squad = {
      id: `sq${Date.now()}`,
      name: newSquad.name,
      focus: newSquad.focus,
      focusIcon: meta.icon,
      focusColor: meta.color,
      members: 1,
      maxMembers: 5,
      goal: newSquad.goal,
      cadence: newSquad.cadence,
      streak: 0,
      joined: true,
      tags: [newSquad.focus.toLowerCase().replace(' ', '-')],
      description: newSquad.description || `${newSquad.name} — studying together`,
      todayTask: newSquad.goal,
      memberNames: ['you'],
    };
    setSquads((prev) => {
      const updated = [squad, ...prev];
      localStorage.setItem('eyf.squads', JSON.stringify(updated));
      return updated;
    });
    setNewSquad({ name: '', focus: 'DSA', goal: '', cadence: 'Daily', description: '' });
    setShowCreateSquad(false);
    fireXP(30, 'Study Squad created!');
  };

  const filtered = activeCategory === 'all' ? posts : posts.filter((p) => p.category === activeCategory);

  if (selected) {
    const catMeta = CAT_META[selected.category] ?? CAT_META.general;
    return (
      <AppShell>
        <div className="pt-8 max-w-3xl mx-auto">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6 transition-colors">
            <Icon name="arrow_back" size={16} />Back to community
          </button>

          <div className="bg-surface-container rounded-2xl p-8 mb-4">
            {selected.pinned && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 mb-3">
                <Icon name="push_pin" size={12} />Pinned
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-7 h-7 ${catMeta.bg} rounded-lg flex items-center justify-center`}>
                <Icon name={catMeta.icon} className={catMeta.color} size={14} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${catMeta.color}`}>{selected.category}</span>
            </div>
            <h1 className="text-2xl font-bold mb-3">{selected.title}</h1>
            <p className="text-on-surface-variant leading-relaxed mb-6">{selected.body}</p>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="font-bold text-zinc-400">{selected.author}</span>
                <span>{timeAgo(selected.createdAt)}</span>
                {selected.tags.map((t) => (
                  <span key={t} className="bg-surface-container-high px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => vote(selected.id, 1)} className="flex items-center gap-1 text-zinc-500 hover:text-green-400 transition-colors">
                  <Icon name="arrow_upward" size={16} />
                  <span className="text-sm font-bold">{selected.upvotes}</span>
                </button>
                <button onClick={() => vote(selected.id, -1)} className="text-zinc-500 hover:text-red-400 transition-colors">
                  <Icon name="arrow_downward" size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Replies */}
          <div className="space-y-3 mb-6">
            {selected.replies.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">No replies yet. Be the first to respond.</p>
            ) : (
              selected.replies.map((r) => (
                <div key={r.id} className="bg-surface-container rounded-xl p-5 ml-4 border-l-2 border-outline-variant/20">
                  <p className="text-sm text-on-surface leading-relaxed mb-3">{r.body}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-500">
                      <span className="font-bold text-zinc-400 mr-2">{r.author}</span>{timeAgo(r.createdAt)}
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Icon name="arrow_upward" size={14} />
                      <span className="text-xs">{r.upvotes}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply composer */}
          <div className="bg-surface-container rounded-xl p-5">
            <h3 className="text-sm font-bold mb-3">Write a Reply</h3>
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg p-3 text-sm focus:outline-none focus:border-primary-container/40 resize-none"
            />
            <div className="flex justify-end mt-3">
              <button onClick={submitReply} disabled={posting || !newReply}
                className="bg-primary-container text-white font-bold py-2 px-5 rounded-full text-sm hover:brightness-110 transition-all disabled:opacity-40 flex items-center gap-2">
                {posting ? <Icon name="hourglass_empty" size={14} /> : <Icon name="send" size={14} />}
                Reply
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="pt-8 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-1">Community</h1>
            <p className="text-on-surface-variant">Discuss, ask questions, and share knowledge with other engineers</p>
          </div>
          <button onClick={() => setShowCompose(!showCompose)}
            className="bg-primary-container text-white font-bold py-3 px-6 rounded-full hover:brightness-110 transition-all flex items-center gap-2 text-sm">
            <Icon name="edit" size={16} />New Post
          </button>
        </div>

        {/* View toggle */}
        <div className="flex gap-2 mb-6">
          {([
            { id: 'community', label: 'Discussion', icon: 'forum' },
            { id: 'squads', label: 'Study Squads', icon: 'groups' },
          ] as const).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveView(v.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                activeView === v.id
                  ? 'bg-[#E82127] text-white shadow-lg shadow-red-900/20'
                  : 'bg-[#1a1a1a] border border-white/5 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon name={v.icon} size={14} />
              {v.label}
              {v.id === 'squads' && squads.some((s) => s.joined) && (
                <span className="bg-white/20 px-1.5 rounded-full text-[10px]">{squads.filter((s) => s.joined).length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Study Squads view */}
        {activeView === 'squads' && (
          <div>
            {selectedSquad ? (
              <div>
                <button onClick={() => setSelectedSquad(null)} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-5 transition-colors">
                  <Icon name="arrow_back" size={16} /> All squads
                </button>
                {/* Squad detail header */}
                <div className={`p-6 bg-[#1a1a1a] border border-white/8 rounded-2xl mb-5`}>
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                        <Icon name={selectedSquad.focusIcon} size={26} className={selectedSquad.focusColor} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white">{selectedSquad.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] font-bold ${selectedSquad.focusColor}`}>{selectedSquad.focus}</span>
                          <span className="text-zinc-600 text-[10px]">·</span>
                          <span className="text-zinc-500 text-[10px] font-bold">{selectedSquad.cadence}</span>
                          <span className="text-zinc-600 text-[10px]">·</span>
                          <span className="text-orange-400 text-[10px] font-black">🔥 {selectedSquad.streak}-day streak</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedSquad.joined ? (
                        <button
                          onClick={() => leaveSquad(selectedSquad.id)}
                          className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-bold hover:bg-zinc-700 transition-colors"
                        >
                          Leave Squad
                        </button>
                      ) : (
                        <button
                          onClick={() => joinSquad(selectedSquad.id)}
                          disabled={selectedSquad.members >= selectedSquad.maxMembers}
                          className="px-4 py-2 rounded-xl bg-[#E82127] text-white text-xs font-bold hover:brightness-110 transition-all disabled:opacity-40"
                        >
                          {selectedSquad.members >= selectedSquad.maxMembers ? 'Full' : 'Join Squad'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-400 text-sm mt-4 leading-relaxed">{selectedSquad.description}</p>
                  <div className="mt-4 p-3 bg-zinc-900 rounded-xl">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Squad Goal</p>
                    <p className="text-white text-sm font-bold">{selectedSquad.goal}</p>
                  </div>
                </div>

                {/* Today's task */}
                <div className={`p-5 rounded-2xl border mb-5 ${squadDoneToday.has(selectedSquad.id) ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${squadDoneToday.has(selectedSquad.id) ? 'text-green-400' : 'text-amber-400'}`}>
                        {squadDoneToday.has(selectedSquad.id) ? '✓ Completed Today' : "Today's Squad Task"}
                      </p>
                      <p className="text-white font-bold">{selectedSquad.todayTask}</p>
                    </div>
                    {!squadDoneToday.has(selectedSquad.id) && selectedSquad.joined && (
                      <button
                        onClick={() => markTodayDone(selectedSquad.id)}
                        className="flex-shrink-0 px-4 py-2 bg-amber-500 text-black font-black text-xs rounded-xl hover:brightness-110 transition-all"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>

                {/* Members */}
                <div className="p-5 bg-[#1a1a1a] border border-white/5 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Members ({selectedSquad.members}/{selectedSquad.maxMembers})</p>
                  </div>
                  <div className="space-y-3">
                    {selectedSquad.memberNames.map((name, i) => (
                      <div key={name} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E82127] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                          {name[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-zinc-300">{name}</p>
                          <div className="flex gap-2 mt-0.5">
                            <span className="text-[10px] text-zinc-600">🔥 {Math.max(0, selectedSquad.streak - i)} day streak</span>
                          </div>
                        </div>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i < 3 ? 'bg-green-400' : 'bg-zinc-700'}`} title={i < 3 ? 'Active today' : 'Not yet'} />
                      </div>
                    ))}
                    {selectedSquad.joined && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-xs flex-shrink-0">Y</div>
                        <p className="text-sm font-bold text-blue-400">You</p>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ml-auto ${squadDoneToday.has(selectedSquad.id) ? 'bg-green-400' : 'bg-zinc-700'}`} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* My squads */}
                {squads.some((s) => s.joined) && (
                  <div className="mb-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">My Squads</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {squads.filter((s) => s.joined).map((squad) => (
                        <button
                          key={squad.id}
                          type="button"
                          onClick={() => setSelectedSquad(squad)}
                          className="text-left bg-[#1a1a1a] border border-[#E82127]/20 rounded-2xl p-5 hover:border-[#E82127]/40 transition-all"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                              <Icon name={squad.focusIcon} size={18} className={squad.focusColor} />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{squad.name}</p>
                              <p className="text-[10px] text-zinc-500">{squad.focus} · {squad.cadence}</p>
                            </div>
                            <div className="ml-auto text-right">
                              <p className="text-orange-400 font-black text-sm">🔥 {squad.streak}</p>
                              <p className="text-[10px] text-zinc-600">streak</p>
                            </div>
                          </div>
                          <div className={`px-3 py-2 rounded-lg text-xs font-medium mt-2 ${squadDoneToday.has(squad.id) ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {squadDoneToday.has(squad.id) ? '✓ Task done today' : "📌 Task pending: " + squad.todayTask.slice(0, 50) + '…'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* All squads + Create */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Discover Squads</p>
                  <button
                    onClick={() => setShowCreateSquad(!showCreateSquad)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#E82127] rounded-full text-xs font-bold text-white hover:brightness-110 transition-all"
                  >
                    <Icon name="add" size={14} /> Create Squad
                  </button>
                </div>

                {/* Create squad form */}
                {showCreateSquad && (
                  <div className="bg-[#1a1a1a] border border-[#E82127]/20 rounded-2xl p-5 mb-6">
                    <h3 className="font-bold text-white mb-4">Create a New Squad</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newSquad.name}
                        onChange={(e) => setNewSquad((s) => ({ ...s, name: e.target.value }))}
                        placeholder="Squad name (e.g. DSA Daily Grinders)"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20"
                      />
                      <select
                        value={newSquad.focus}
                        onChange={(e) => setNewSquad((s) => ({ ...s, focus: e.target.value }))}
                        className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                      >
                        {['DSA', 'System Design', 'Interview Prep', 'Placement', 'Backend', 'Frontend', 'Security', 'GenAI'].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newSquad.goal}
                        onChange={(e) => setNewSquad((s) => ({ ...s, goal: e.target.value }))}
                        placeholder="Daily/Weekly goal (e.g. 1 problem per day)"
                        className="md:col-span-2 w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20"
                      />
                      <textarea
                        value={newSquad.description}
                        onChange={(e) => setNewSquad((s) => ({ ...s, description: e.target.value }))}
                        placeholder="What's your squad about? Who should join?"
                        rows={2}
                        className="md:col-span-2 w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button onClick={() => setShowCreateSquad(false)} className="text-sm text-zinc-500 hover:text-zinc-300 px-4 py-2 rounded-full transition-colors">Cancel</button>
                      <button onClick={createSquad} disabled={!newSquad.name || !newSquad.goal}
                        className="bg-[#E82127] text-white font-bold py-2 px-5 rounded-full text-sm hover:brightness-110 transition-all disabled:opacity-40">
                        Create Squad
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {squads.filter((s) => !s.joined).map((squad) => (
                    <div key={squad.id} className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <Icon name={squad.focusIcon} size={18} className={squad.focusColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white">{squad.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-[10px] font-bold ${squad.focusColor}`}>{squad.focus}</span>
                            <span className="text-zinc-600 text-[10px]">·</span>
                            <span className="text-zinc-500 text-[10px]">{squad.cadence}</span>
                            <span className="text-zinc-600 text-[10px]">·</span>
                            <span className="text-orange-400 text-[10px] font-black">🔥 {squad.streak}-day streak</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed mb-3">{squad.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {squad.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-zinc-800 rounded-full text-[10px] text-zinc-400">{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Icon name="people" size={13} />
                          {squad.members}/{squad.maxMembers} members
                          {squad.members >= squad.maxMembers && <span className="text-red-400 font-bold ml-1">(Full)</span>}
                        </div>
                        <button
                          onClick={() => { joinSquad(squad.id); setSelectedSquad({ ...squad, joined: true, members: squad.members + 1 }); }}
                          disabled={squad.members >= squad.maxMembers}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#E82127] text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Icon name="group_add" size={13} />
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {squads.filter((s) => !s.joined).length === 0 && (
                  <div className="text-center py-10">
                    <Icon name="groups" className="text-zinc-700 mb-3" size={40} />
                    <p className="text-zinc-500">You've joined all available squads! Create a new one.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Community view */}
        {activeView === 'community' && <>
        {/* Compose */}
        {showCompose && (
          <div className="bg-surface-container rounded-2xl p-6 mb-8 border border-primary-container/20">
            <h3 className="font-bold mb-4">Create a Post</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
                placeholder="Post title..."
                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary-container/40"
              />
              <textarea
                value={newPost.body}
                onChange={(e) => setNewPost((p) => ({ ...p, body: e.target.value }))}
                placeholder="What's on your mind? Share a question, insight, or experience..."
                rows={5}
                className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg p-3 text-sm focus:outline-none focus:border-primary-container/40 resize-none"
              />
              <div className="flex gap-3">
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost((p) => ({ ...p, category: e.target.value }))}
                  className="flex-1 bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(e) => setNewPost((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="Tags (comma-separated)"
                  className="flex-1 bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowCompose(false)} className="text-sm text-zinc-500 hover:text-zinc-300 px-4 py-2 rounded-full transition-colors">Cancel</button>
                <button onClick={submitPost} disabled={posting || !newPost.title || !newPost.body}
                  className="bg-primary-container text-white font-bold py-2 px-5 rounded-full text-sm hover:brightness-110 transition-all disabled:opacity-40">
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {['all', ...CATEGORIES].map((cat) => {
            const meta = CAT_META[cat];
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  activeCategory === cat
                    ? `${meta?.bg ?? 'bg-zinc-500/10'} ${meta?.color ?? 'text-zinc-300'} border-current/30`
                    : 'text-zinc-500 border-zinc-800/50 hover:text-zinc-300'
                }`}>
                {cat === 'all' ? 'All' : cat.replace('-', ' ')}
              </button>
            );
          })}
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {filtered.map((post) => {
            const catMeta = CAT_META[post.category] ?? CAT_META.general;
            return (
              <button
                key={post.id}
                type="button"
                className="w-full text-left bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-all cursor-pointer group"
                onClick={() => openPost(post.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Vote column */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={(e) => { e.stopPropagation(); vote(post.id, 1); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-green-400 hover:bg-green-500/10 transition-all">
                      <Icon name="arrow_upward" size={14} />
                    </button>
                    <span className="text-sm font-bold text-zinc-400">{post.upvotes}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); vote(post.id, -1); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Icon name="arrow_downward" size={14} />
                    </button>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {post.pinned && <Icon name="push_pin" className="text-yellow-400" size={12} />}
                      <div className={`flex items-center gap-1 ${catMeta.bg} ${catMeta.color} px-2 py-0.5 rounded-full`}>
                        <Icon name={catMeta.icon} size={10} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{post.category.replace('-', ' ')}</span>
                      </div>
                      {post.tags.map((t) => (
                        <span key={t} className="text-[10px] bg-surface-container-highest px-2 py-0.5 rounded-full text-zinc-500">{t}</span>
                      ))}
                    </div>
                    {post.title && <h3 className="text-base font-bold mb-1 group-hover:text-primary-container transition-colors">{post.title}</h3>}
                    <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">{post.body}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="font-bold text-zinc-400">{post.author}</span>
                      <span>{timeAgo(post.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <Icon name="chat_bubble_outline" size={12} />
                        {post.replyCount} replies
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Icon name="forum" className="text-zinc-700 mb-3" size={40} />
              <p className="text-on-surface-variant">No posts in this category yet. Start the conversation!</p>
            </div>
          )}
        </div>
        </>}
      </div>
    </AppShell>
  );
}
