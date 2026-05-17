import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { useUser } from '../contexts/UserContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type ContestStatus = 'upcoming' | 'live' | 'ended';

interface ContestProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  solvers: number;
  totalParticipants: number;
}

interface Contest {
  id: string;
  title: string;
  edition: number;
  status: ContestStatus;
  startTime: string; // ISO
  durationMinutes: number;
  participants: number;
  problems: ContestProblem[];
  topScorers: { rank: number; name: string; score: number; time: string }[];
}


// ─── Static Data ─────────────────────────────────────────────────────────────

const STATIC_CONTESTS: Contest[] = [
  {
    id: 'wc-031',
    title: 'EYF Weekly Contest 31',
    edition: 31,
    status: 'live',
    startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    participants: 1247,
    problems: [
      { id: 'wc31-1', title: 'Find Missing Number in Range', difficulty: 'easy',   points: 100, solvers: 892, totalParticipants: 1247 },
      { id: 'wc31-2', title: 'Maximum Product Subarray',     difficulty: 'easy',   points: 200, solvers: 613, totalParticipants: 1247 },
      { id: 'wc31-3', title: 'Minimum Window Substring',     difficulty: 'medium', points: 400, solvers: 289, totalParticipants: 1247 },
      { id: 'wc31-4', title: 'Alien Dictionary',             difficulty: 'hard',   points: 600, solvers: 87,  totalParticipants: 1247 },
    ],
    topScorers: [
      { rank: 1, name: 'arjun_dev',     score: 1300, time: '0:42:17' },
      { rank: 2, name: 'priya_codes',   score: 1300, time: '0:48:55' },
      { rank: 3, name: 'karthik_ace',   score: 1100, time: '0:51:02' },
      { rank: 4, name: 'devika_42',     score: 900,  time: '0:39:18' },
      { rank: 5, name: 'rohan_ninja',   score: 900,  time: '0:44:33' },
    ],
  },
  {
    id: 'wc-032',
    title: 'EYF Weekly Contest 32',
    edition: 32,
    status: 'upcoming',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    participants: 0,
    problems: [
      { id: 'wc32-1', title: 'Problem A (revealed at start)', difficulty: 'easy',   points: 100, solvers: 0, totalParticipants: 0 },
      { id: 'wc32-2', title: 'Problem B (revealed at start)', difficulty: 'easy',   points: 200, solvers: 0, totalParticipants: 0 },
      { id: 'wc32-3', title: 'Problem C (revealed at start)', difficulty: 'medium', points: 400, solvers: 0, totalParticipants: 0 },
      { id: 'wc32-4', title: 'Problem D (revealed at start)', difficulty: 'hard',   points: 600, solvers: 0, totalParticipants: 0 },
    ],
    topScorers: [],
  },
  {
    id: 'wc-030',
    title: 'EYF Weekly Contest 30',
    edition: 30,
    status: 'ended',
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    participants: 1089,
    problems: [
      { id: 'wc30-1', title: 'Palindrome Partitioning Count',     difficulty: 'easy',   points: 100, solvers: 834, totalParticipants: 1089 },
      { id: 'wc30-2', title: 'Longest Consecutive Sequence',      difficulty: 'easy',   points: 200, solvers: 621, totalParticipants: 1089 },
      { id: 'wc30-3', title: 'K-th Largest Element in a Stream',  difficulty: 'medium', points: 400, solvers: 312, totalParticipants: 1089 },
      { id: 'wc30-4', title: 'Word Ladder II',                    difficulty: 'hard',   points: 600, solvers: 73,  totalParticipants: 1089 },
    ],
    topScorers: [
      { rank: 1, name: 'priya_codes',    score: 1300, time: '0:38:44' },
      { rank: 2, name: 'siddharth_x',   score: 1300, time: '0:45:01' },
      { rank: 3, name: 'meera_solves',  score: 1100, time: '0:52:29' },
      { rank: 4, name: 'arjun_dev',     score: 700,  time: '0:41:17' },
      { rank: 5, name: 'vikram_cp',     score: 700,  time: '0:49:58' },
    ],
  },
  {
    id: 'wc-029',
    title: 'EYF Weekly Contest 29',
    edition: 29,
    status: 'ended',
    startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    participants: 978,
    problems: [
      { id: 'wc29-1', title: 'Two Sum Variations',               difficulty: 'easy',   points: 100, solvers: 791, totalParticipants: 978 },
      { id: 'wc29-2', title: 'Merge Intervals',                  difficulty: 'easy',   points: 200, solvers: 589, totalParticipants: 978 },
      { id: 'wc29-3', title: 'Number of Islands (3D variant)',   difficulty: 'medium', points: 400, solvers: 241, totalParticipants: 978 },
      { id: 'wc29-4', title: 'Minimum Cost to Hire K Workers',   difficulty: 'hard',   points: 600, solvers: 62,  totalParticipants: 978 },
    ],
    topScorers: [
      { rank: 1, name: 'karthik_ace',    score: 1300, time: '0:41:22' },
      { rank: 2, name: 'arjun_dev',      score: 1100, time: '0:53:07' },
      { rank: 3, name: 'priya_codes',    score: 1000, time: '0:47:40' },
      { rank: 4, name: 'rohan_ninja',    score: 900,  time: '0:43:11' },
      { rank: 5, name: 'ananya_cp',      score: 700,  time: '0:38:29' },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function diffPct(solvers: number, total: number): number {
  if (!total) return 0;
  return Math.round((solvers / total) * 100);
}

const DIFF_COLORS = {
  easy:   { text: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  medium: { text: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20' },
  hard:   { text: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20' },
};

const STATUS_META: Record<ContestStatus, { label: string; dot: string; ring: string }> = {
  live:     { label: 'LIVE',     dot: 'bg-red-500 animate-pulse', ring: 'border-red-500/30' },
  upcoming: { label: 'UPCOMING', dot: 'bg-amber-400',             ring: 'border-amber-400/20' },
  ended:    { label: 'ENDED',    dot: 'bg-zinc-500',              ring: 'border-white/5' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function LiveTimer({ endTime }: { endTime: Date }) {
  const [remaining, setRemaining] = useState(endTime.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(endTime.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const pct = Math.max(0, Math.min(100, (remaining / (90 * 60 * 1000)) * 100));

  return (
    <div className="flex items-center gap-3">
      <div className="font-mono text-2xl text-white font-bold tabular-nums tracking-wider">
        {formatCountdown(remaining)}
      </div>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden min-w-[80px]">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProblemRow({ prob, isLive }: { prob: ContestProblem; isLive: boolean }) {
  const dc = DIFF_COLORS[prob.difficulty];
  const pct = diffPct(prob.solvers, prob.totalParticipants);

  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-white/5 transition-colors group">
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${dc.bg} ${dc.text} w-16 text-center`}>
        {prob.difficulty}
      </span>
      <span className="flex-1 text-sm text-zinc-100 group-hover:text-white transition-colors">
        {isLive ? (
          <Link to={`/app/problems/${prob.id}`} className="hover:text-[#E82127] transition-colors">
            {prob.title}
          </Link>
        ) : prob.title}
      </span>
      <span className="text-xs text-amber-400 font-bold w-16 text-right">+{prob.points} pts</span>
      {prob.totalParticipants > 0 && (
        <div className="flex items-center gap-2 w-28">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500/60 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-zinc-500 tabular-nums w-8">{pct}%</span>
        </div>
      )}
    </div>
  );
}

function ContestCard({
  contest,
  onRegister,
  registered,
}: {
  contest: Contest;
  onRegister: (id: string) => void;
  registered: boolean;
}) {
  const [expanded, setExpanded] = useState(contest.status === 'live');
  const meta = STATUS_META[contest.status];
  const endTime = new Date(new Date(contest.startTime).getTime() + contest.durationMinutes * 60 * 1000);

  return (
    <div className={`bg-[#1a1a1a] rounded-2xl border ${meta.ring} overflow-hidden`}>
      {/* Header */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
            <span className="text-[10px] font-bold text-zinc-500 tracking-wider">{meta.label}</span>
          </div>
          <h3 className="text-base font-semibold text-white leading-tight">{contest.title}</h3>
          <p className="text-xs text-zinc-500 mt-1">{formatDate(contest.startTime)} · 90 min · {contest.problems.length} problems</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {contest.status === 'live' && (
            <LiveTimer endTime={endTime} />
          )}
          {contest.status === 'upcoming' && (
            <div className="text-right">
              <div className="text-[10px] text-zinc-500 mb-0.5">Starts in</div>
              <UpcomingCountdown target={new Date(contest.startTime)} />
            </div>
          )}
          {contest.status === 'ended' && (
            <div className="text-right">
              <div className="text-xs text-zinc-600">{contest.participants.toLocaleString()} participants</div>
            </div>
          )}
          <Icon name={expanded ? 'expand_less' : 'expand_more'} className="text-zinc-600 text-xl" />
        </div>
      </div>

      {/* CTA for live/upcoming */}
      {contest.status !== 'ended' && (
        <div className="px-5 pb-4 flex items-center gap-3">
          {contest.status === 'live' ? (
            <Link
              to={`/app/problems/${contest.problems[0].id}`}
              className="inline-flex items-center gap-2 bg-[#E82127] hover:bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              <Icon name="play_arrow" className="text-lg" />
              Enter Contest
            </Link>
          ) : (
            <button
              onClick={() => onRegister(contest.id)}
              className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl transition-colors ${
                registered
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                  : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/20'
              }`}
            >
              <Icon name={registered ? 'check_circle' : 'notifications'} className="text-lg" />
              {registered ? 'Registered' : 'Register & Get Notified'}
            </button>
          )}
          {contest.status === 'live' && (
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Icon name="people" className="text-sm" />
              {contest.participants.toLocaleString()} competing
            </span>
          )}
        </div>
      )}

      {/* Expanded: problems + leaderboard */}
      {expanded && (
        <div className="border-t border-white/5">
          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
            {/* Problems */}
            <div className="p-4">
              <div className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-2 px-4">Problems</div>
              {contest.problems.map((p) => (
                <ProblemRow key={p.id} prob={p} isLive={contest.status === 'live'} />
              ))}
            </div>

            {/* Leaderboard */}
            {contest.topScorers.length > 0 && (
              <div className="p-4">
                <div className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-2 px-4">Leaderboard</div>
                <div className="space-y-1">
                  {contest.topScorers.map((s) => (
                    <div key={s.rank} className="flex items-center gap-3 py-2 px-4 rounded-xl hover:bg-white/5 transition-colors">
                      <span className={`w-6 text-center text-xs font-bold ${s.rank <= 3 ? 'text-amber-400' : 'text-zinc-600'}`}>
                        #{s.rank}
                      </span>
                      <span className="flex-1 text-sm text-zinc-200">{s.name}</span>
                      <span className="text-xs text-amber-400 font-bold tabular-nums">{s.score} pts</span>
                      <span className="text-xs text-zinc-600 tabular-nums w-16 text-right">{s.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contest.topScorers.length === 0 && contest.status === 'upcoming' && (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <Icon name="emoji_events" className="text-4xl text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-600">Leaderboard opens when contest starts</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UpcomingCountdown({ target }: { target: Date }) {
  const [ms, setMs] = useState(target.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setMs(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return (
    <div className="font-mono text-sm font-bold text-amber-400 tabular-nums">
      {d > 0 ? `${d}d ` : ''}{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────

function StatBadge({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-2xl border border-white/5 px-5 py-4">
      <Icon name={icon} className="text-2xl text-zinc-500" />
      <div>
        <div className="text-lg font-bold text-white">{value}</div>
        <div className="text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function WeeklyContestPage() {
  const { fireXP } = useUser();

  const [registrations, setRegistrations] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('eyf.contest.reg') ?? '{}');
    } catch {
      return {};
    }
  });

  const handleRegister = useCallback((id: string) => {
    setRegistrations((prev) => {
      const next = { ...prev, [id]: true };
      localStorage.setItem('eyf.contest.reg', JSON.stringify(next));
      return next;
    });
    fireXP(10, 'Registered for contest');
  }, [fireXP]);

  const liveContest    = STATIC_CONTESTS.find((c) => c.status === 'live');
  const upcomingContests = STATIC_CONTESTS.filter((c) => c.status === 'upcoming');
  const pastContests   = STATIC_CONTESTS.filter((c) => c.status === 'ended');

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Weekly Contests</h1>
            <p className="text-sm text-zinc-500">
              90-minute timed contests every Sunday — 4 problems, global leaderboard, XP rewards.
              <span className="ml-2 text-[10px] font-bold text-[#E82127] bg-[#E82127]/10 px-2 py-0.5 rounded-full border border-[#E82127]/20">
                FREE · No paywall
              </span>
            </p>
          </div>
          <Link
            to="/app/problems"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          >
            <Icon name="code" className="text-base" />
            Practice Problems
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBadge icon="emoji_events" label="Contests run"         value="30+" />
          <StatBadge icon="people"       label="Total participants"   value="28K+" />
          <StatBadge icon="calendar_today" label="Every Sunday"      value="8:00 PM" />
          <StatBadge icon="stars"        label="Top prize"            value="1300 XP" />
        </div>

        {/* Live */}
        {liveContest && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-widest">Live Now</h2>
            </div>
            <ContestCard
              contest={liveContest}
              onRegister={handleRegister}
              registered={!!registrations[liveContest.id]}
            />
          </section>
        )}

        {/* Upcoming */}
        {upcomingContests.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-3">Upcoming</h2>
            <div className="space-y-3">
              {upcomingContests.map((c) => (
                <ContestCard
                  key={c.id}
                  contest={c}
                  onRegister={handleRegister}
                  registered={!!registrations[c.id]}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past */}
        {pastContests.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-3">Past Contests</h2>
            <div className="space-y-3">
              {pastContests.map((c) => (
                <ContestCard
                  key={c.id}
                  contest={c}
                  onRegister={handleRegister}
                  registered={!!registrations[c.id]}
                />
              ))}
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-6">
          <h2 className="text-base font-semibold text-white mb-4">How Contests Work</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-zinc-400">
            {[
              { icon: 'schedule',   title: 'Duration',   body: '90 minutes, every Sunday at 8:00 PM IST' },
              { icon: 'layers',     title: 'Format',     body: '4 problems: 2 easy, 1 medium, 1 hard — same for everyone' },
              { icon: 'stars',      title: 'Scoring',    body: 'Points per problem (100/200/400/600). Ties broken by submission time.' },
              { icon: 'leaderboard',title: 'Ranking',    body: 'Global rank + XP reward based on final position' },
              { icon: 'code',       title: 'Languages',  body: 'JavaScript, Python, Java, C++, TypeScript' },
              { icon: 'lock_open',  title: 'Free',       body: 'All contests are 100% free. No premium required.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex gap-3">
                <Icon name={icon} className="text-lg text-zinc-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-zinc-300 font-medium mb-0.5">{title}</div>
                  <div className="text-zinc-500 text-xs leading-relaxed">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
