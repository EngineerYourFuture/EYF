import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

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
];

export function CommunityPage() {
  const session = getSession();
  const [posts, setPosts] = useState<Post[]>(STATIC_POSTS);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selected, setSelected] = useState<PostDetail | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '', category: 'general', tags: '' });
  const [newReply, setNewReply] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    const url = activeCategory !== 'all' ? `/community/posts?category=${activeCategory}` : '/community/posts';
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

  const filtered = activeCategory === 'all' ? posts : posts.filter((p) => p.category === activeCategory);
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

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
              <div
                key={post.id}
                role="button"
                tabIndex={0}
                className="bg-surface-container rounded-xl p-6 hover:bg-surface-container-high transition-all cursor-pointer group"
                onClick={() => openPost(post.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openPost(post.id); }}
              >
                <div className="flex items-start gap-4">
                  {/* Vote column */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <button onClick={() => vote(post.id, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-green-400 hover:bg-green-500/10 transition-all">
                      <Icon name="arrow_upward" size={14} />
                    </button>
                    <span className="text-sm font-bold text-zinc-400">{post.upvotes}</span>
                    <button onClick={() => vote(post.id, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
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
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Icon name="forum" className="text-zinc-700 mb-3" size={40} />
              <p className="text-on-surface-variant">No posts in this category yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
