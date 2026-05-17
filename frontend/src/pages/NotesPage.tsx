import { useState, useCallback, useEffect } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  title: string;
  content: string;
  tag: string;
  color: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  pinned: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = [
  { id: 'zinc',    cls: 'border-zinc-500/40 bg-zinc-500/5',     dot: 'bg-zinc-400' },
  { id: 'blue',    cls: 'border-blue-500/40 bg-blue-500/5',     dot: 'bg-blue-400' },
  { id: 'emerald', cls: 'border-emerald-500/40 bg-emerald-500/5', dot: 'bg-emerald-400' },
  { id: 'amber',   cls: 'border-amber-500/40 bg-amber-500/5',   dot: 'bg-amber-400' },
  { id: 'red',     cls: 'border-red-500/40 bg-red-500/5',       dot: 'bg-red-400' },
  { id: 'purple',  cls: 'border-purple-500/40 bg-purple-500/5', dot: 'bg-purple-400' },
  { id: 'cyan',    cls: 'border-cyan-500/40 bg-cyan-500/5',     dot: 'bg-cyan-400' },
];

const TAGS = ['DSA', 'System Design', 'OS', 'DBMS', 'Networks', 'OOP', 'Career', 'Interview', 'General'];

const STORAGE_KEY = 'eyf.notes';

const EXAMPLE_NOTES: Note[] = [
  {
    id: 'example-1',
    title: 'Sliding Window Pattern',
    content: `Use when: "subarray/substring", "at most K", "contiguous range"

Template:
  left = 0, right = 0
  while right < n:
    expand window (add right)
    while window invalid:
      shrink from left
    update answer
    right++

Problems:
- Longest substring without repeating (LC 3)
- Minimum window substring (LC 76)
- Max consecutive ones III (LC 1004)`,
    tag: 'DSA',
    color: 'blue',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    pinned: true,
  },
  {
    id: 'example-2',
    title: 'CAP Theorem — Interview Key Points',
    content: `CAP: Consistency + Availability + Partition Tolerance
→ In a network partition, choose C or A (P is unavoidable)

CP systems (prefer consistency):
  - Zookeeper, etcd, HBase
  - Returns error if partition occurs

AP systems (prefer availability):
  - Cassandra, DynamoDB, CouchDB
  - Returns stale data during partition

Interview tip:
  Don't say "we'll use a CP database" — say
  "for this use case (user sessions), eventual consistency
  is acceptable, so we'll choose DynamoDB (AP)"`,
    tag: 'System Design',
    color: 'cyan',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    pinned: false,
  },
  {
    id: 'example-3',
    title: 'Amazon LP Stories',
    content: `Customer Obsession:
  → Redesigned checkout flow after watching user testing
  → Reduced confusion even though metrics didn't require it
  → "The data said X but the user was clearly struggling with Y"

Ownership:
  → Found a memory leak in legacy code nobody touched
  → Fixed it outside my sprint, proposed monitoring alert
  → "Nobody asked me to, but it was going to affect everyone"

Bias for Action:
  → Production bug at 2AM, no playbook
  → Made the call to rollback without manager approval
  → Communicated immediately, wrote postmortem, created runbook`,
    tag: 'Career',
    color: 'amber',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    pinned: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadNotes(): Note[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Note[];
  } catch { /* ignore */ }
  return EXAMPLE_NOTES;
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function colorOf(id: string) {
  return COLORS.find((c) => c.id === id) ?? COLORS[0];
}

// ─── Note Editor ─────────────────────────────────────────────────────────────

function NoteEditor({
  note,
  onSave,
  onClose,
}: {
  note: Partial<Note> | null;
  onSave: (note: Note) => void;
  onClose: () => void;
}) {
  const isNew = !note?.id;
  const [title,   setTitle]   = useState(note?.title   ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [tag,     setTag]     = useState(note?.tag     ?? TAGS[0]);
  const [color,   setColor]   = useState(note?.color   ?? 'zinc');

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    onSave({
      id:        note?.id ?? genId(),
      title:     title.trim(),
      content:   content.trim(),
      tag,
      color,
      createdAt: note?.createdAt ?? now,
      updatedAt: now,
      pinned:    note?.pinned ?? false,
    });
  }, [note, title, content, tag, color, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') onClose();
  }, [handleSave, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onKeyDown={handleKeyDown}>
      <div className="w-full max-w-2xl bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            autoFocus
            className="flex-1 bg-transparent text-white font-semibold text-lg placeholder-zinc-700 outline-none"
          />
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 flex-wrap gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600">Tag:</span>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="text-xs bg-white/5 text-zinc-300 border border-white/10 rounded-lg px-2 py-1 outline-none"
            >
              {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600">Color:</span>
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={`w-4 h-4 rounded-full ${c.dot} transition-transform ${color === c.id ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110'}`}
                />
              ))}
            </div>
          </div>
          <span className="text-[10px] text-zinc-700 ml-auto">⌘S to save · Esc to close</span>
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing... (plain text or code snippets work great)"
          className="flex-1 min-h-[300px] bg-transparent text-zinc-300 text-sm font-mono leading-relaxed resize-none outline-none p-6 placeholder-zinc-800"
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <span className="text-xs text-zinc-700">{content.length} chars</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="bg-[#E82127] hover:bg-red-600 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              {isNew ? 'Create Note' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────

function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const c = colorOf(note.color);

  return (
    <div
      className={`relative rounded-2xl border ${c.cls} p-4 flex flex-col gap-3 hover:border-white/20 transition-all cursor-pointer group`}
      onClick={onEdit}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div className="absolute top-3 right-3">
          <Icon name="push_pin" className="text-sm text-zinc-500 rotate-45" />
        </div>
      )}

      {/* Tag */}
      <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{note.tag}</span>

      {/* Title */}
      <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 pr-4">{note.title}</h3>

      {/* Preview */}
      {note.content && (
        <p className="text-xs text-zinc-600 font-mono leading-relaxed line-clamp-4 whitespace-pre-wrap">
          {note.content.slice(0, 200)}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <span className="text-[10px] text-zinc-700">{formatRelative(note.updatedAt)}</span>
        <div
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-400"
          >
            <Icon name="more_vert" className="text-base" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 bottom-6 w-36 bg-[#252525] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20"
              onBlur={() => setMenuOpen(false)}
            >
              <button
                onClick={() => { onEdit(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
              >
                <Icon name="edit" className="text-sm" /> Edit
              </button>
              <button
                onClick={() => { onTogglePin(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
              >
                <Icon name="push_pin" className="text-sm" /> {note.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={() => { onDelete(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <Icon name="delete" className="text-sm" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function NotesPage() {
  const [notes,    setNotes]    = useState<Note[]>(loadNotes);
  const [editing,  setEditing]  = useState<Partial<Note> | null | 'new'>(null);
  const [search,   setSearch]   = useState('');
  const [filterTag, setFilterTag] = useState<string>('All');

  useEffect(() => { saveNotes(notes); }, [notes]);

  const handleSave = useCallback((saved: Note) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setEditing(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handlePin = useCallback((id: string) => {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n));
  }, []);

  const filtered = notes
    .filter((n) => {
      const q = search.toLowerCase();
      return !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    })
    .filter((n) => filterTag === 'All' || n.tag === filterTag)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const allTags = ['All', ...TAGS.filter((t) => notes.some((n) => n.tag === t))];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">My Notes</h1>
            <p className="text-sm text-zinc-500">
              Personal study notes saved locally in your browser.
              <span className="ml-1 text-[10px] text-zinc-700">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
            </p>
          </div>
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 bg-[#E82127] hover:bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <Icon name="add" className="text-lg" />
            New Note
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3 mb-6 flex-wrap gap-y-2">
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/5 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Icon name="search" className="text-sm text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="bg-transparent text-sm text-zinc-300 placeholder-zinc-700 outline-none flex-1"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-zinc-700 hover:text-zinc-500">
                <Icon name="close" className="text-sm" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setFilterTag(t)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filterTag === t
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Notes grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => setEditing(note)}
                onDelete={() => handleDelete(note.id)}
                onTogglePin={() => handlePin(note.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Icon name="sticky_note_2" className="text-5xl text-zinc-800 mb-4" />
            {search ? (
              <>
                <p className="text-zinc-600 mb-2">No notes match "{search}"</p>
                <button onClick={() => setSearch('')} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-zinc-600 mb-4">No notes yet — start capturing your learning</p>
                <button
                  onClick={() => setEditing('new')}
                  className="flex items-center gap-2 text-sm text-[#E82127] hover:text-red-400 transition-colors"
                >
                  <Icon name="add_circle" className="text-lg" />
                  Create your first note
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {editing !== null && (
        <NoteEditor
          note={editing === 'new' ? {} : (editing as Partial<Note>)}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </AppShell>
  );
}
