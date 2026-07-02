"use client";
import Link from "next/link";
import { Card, Badge, Button, Skeleton } from "@eyf/ui";
import { useApi } from "@/lib/use-api";
import { Heatmap } from "@/components/heatmap";
import { PageMotion } from "@/components/page-motion";
import { Reveal } from "@/components/motion";
import { Icons, type IconName } from "@/components/icons";
import { useGuidance, type Guidance } from "@/lib/use-guidance";
import { PERSONAS, type PersonaId } from "@/lib/persona";

type Me = {
  user: {
    id: string; email: string; name: string; role: string;
    college?: string | null; targetRole?: string | null; graduationYear?: number | null;
    persona?: PersonaId | null;
    profile?: { currentXp: number; streakDays: number; totalSolved: number; level: number } | null;
    subscription?: { plan: string; status: string } | null;
  } | null;
};
type GamMe = {
  xp: number; level: number; xpAtLevel: number; xpToNext: number;
  streak: number; longestStreak: number; totalSolved: number;
  badges: { slug: string; name: string; icon: string; tier: string; earnedAt: string }[];
};
type StreakDay = { date: string; problemsSolved: number; xpEarned: number };
type Today = {
  challenge: {
    date: string;
    problem: { id: string; slug: string; title: string; difficulty: string; patterns: string[] };
    alreadySolvedToday: boolean;
  } | null;
  streak: number;
  xpToday: number;
  problemsSolvedToday: number;
};

const diffTone = { EASY: "easy", MEDIUM: "medium", HARD: "hard", EXPERT: "expert" } as const;

export default function DashboardPage() {
  const { data: me, isLoading } = useApi<Me>("/me");
  const { data: gam }    = useApi<GamMe>("/gamification/me");
  const { data: streak } = useApi<StreakDay[]>("/gamification/streak");
  const { data: today }  = useApi<Today>("/roadmap/today");
  const { guidance }     = useGuidance();

  const xpPct = gam ? Math.min(100, Math.round((gam.xpAtLevel / Math.max(1, gam.xpAtLevel + gam.xpToNext)) * 100)) : 0;
  const name = me?.user?.name?.split(" ")[0] ?? "there";

  return (
    <PageMotion className="relative">
      {/* ambient top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-glow-radial" aria-hidden />

      <div className="relative px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
        {/* Greeting */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs font-mono uppercase tracking-widest text-accent mb-2">{greeting()}</div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {isLoading ? <Skeleton className="h-12 w-72" /> : <>Hey, {name}.</>}
            </h1>
            <p className="text-text-3 mt-2">
              {today?.problemsSolvedToday
                ? `${today.problemsSolvedToday} solved today · keep the streak alive.`
                : me?.user?.persona
                  ? PERSONAS[me.user.persona].tagline
                  : "Your next step is one click away."}
            </p>
          </div>
          {me?.user?.subscription && (
            <Badge tone={me.user.subscription.plan === "FREE" ? "default" : "accent"}>
              {me.user.subscription.plan} plan
            </Badge>
          )}
        </div>

        {/* Placement Readiness strip — now shows the active next-best-action */}
        <ReadinessStrip guidance={guidance} />

        {/* First-run setup nudge */}
        {me?.user && !me.user.persona && (
          <Link href="/welcome"
            className="mt-6 flex items-center gap-3 rounded-xl border border-accent/40 bg-accent-tint px-4 py-3 shadow-glow-sm card-interactive">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-ink">
              <Icons.sparkle width={18} height={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-text-1">Tailor EYF to you</div>
              <div className="text-text-3 text-sm truncate">Tell us if you&apos;re a student, switcher, or developer — we&apos;ll shape your journey.</div>
            </div>
            <span className="text-accent shrink-0"><Icons.arrow width={18} height={18} /></span>
          </Link>
        )}

        {/* Persona-tailored journey */}
        {me?.user?.persona && <YourJourney persona={me.user.persona} />}

        {/* Hero: today's focus + level */}
        <div className="mt-6 grid lg:grid-cols-3 gap-5">
          <TodaysFocus today={today} />
          <LevelCard gam={gam} xpPct={xpPct} />
        </div>

        {/* Metric tiles */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric icon="flame" tone="accent" label="Current streak"
            value={gam?.streak ?? 0} unit="d" sub={gam ? `Best ${gam.longestStreak}d` : undefined} />
          <Metric icon="bolt" tone="medium" label="Earned today"
            value={today?.xpToday ?? 0} unit="xp" sub="Today" />
          <Metric icon="code" label="Total solved" value={gam?.totalSolved ?? 0} sub="All time" />
          <Metric icon="trophy" tone="info" label="Badges"
            value={gam?.badges.length ?? 0} sub={gam?.badges.length ? "Earned" : "None yet"} />
        </div>

        {/* Quick actions */}
        <Reveal className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Jump back in</h2>
            <Link href="/assessment" className="text-sm text-accent hover:underline">Take assessment →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((q) => <QuickAction key={q.href} {...q} />)}
          </div>
        </Reveal>

        {/* Activity */}
        <Reveal className="mt-8">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Activity</h2>
            <span className="text-text-3 text-xs font-mono">past 12 months</span>
          </div>
          <div className="mt-5">
            {streak ? <Heatmap days={streak} /> : <Skeleton className="h-28 w-full" />}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-text-3">
            <span>Less</span>
            {["fill-surface-3", "fill-accent/25", "fill-accent/50", "fill-accent/75", "fill-accent"].map((c) => (
              <svg key={c} width="11" height="11" className="inline-block"><rect width="11" height="11" rx="2" className={c} /></svg>
            ))}
            <span>More</span>
          </div>
        </Card>
        </Reveal>

        {gam && gam.badges.length > 0 && (
          <Reveal className="mt-5">
          <Card>
            <h2 className="font-display text-xl font-bold mb-4">Your badges</h2>
            <div className="flex flex-wrap gap-3">
              {gam.badges.map((b) => (
                <div key={b.slug} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <span className="text-lg leading-none">{b.icon}</span>
                  <div className="text-sm">
                    <div className="font-medium leading-tight">{b.name}</div>
                    <div className="text-text-4 text-[11px] uppercase tracking-wide">{b.tier}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          </Reveal>
        )}
      </div>
    </PageMotion>
  );
}

/* ---------- pieces ---------- */

function ReadinessStrip({ guidance: g }: { guidance: Guidance | null }) {
  if (!g) return <Skeleton className="mt-6 h-24 rounded-2xl" />;
  const r = g.readiness;
  const top = g.actions[0];
  const tone = r.overall >= 80 ? "easy" : r.overall >= 50 ? "accent" : "medium";
  // Sibling links, never nested: an <a> inside an <a> is invalid HTML and caused a
  // React hydration error that blanked this strip on the dashboard.
  return (
    <div className="mt-6 flex items-center gap-5 rounded-2xl border border-border bg-surface px-5 py-4 shadow-card">
      <Link href="/today" className="flex min-w-0 flex-1 items-center gap-5 rounded-xl card-interactive">
        <MiniRing score={r.overall} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-lg font-bold">Placement Readiness</span>
            <Badge tone={tone}>{r.band}</Badge>
          </div>
          {/* The active coaching line — personalised guidance on the landing screen. */}
          <p className="text-text-3 text-sm mt-1 truncate">
            {top ? g.coachNote : "Every pillar is strong — start applying with confidence."}
          </p>
        </div>
      </Link>
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        {top && (
          <Link href={top.href}>
            <Button size="sm" variant="secondary">{top.label}</Button>
          </Link>
        )}
        <Link href="/today" aria-label="Open today" className="text-accent">
          <Icons.arrow width={18} height={18} />
        </Link>
      </div>
    </div>
  );
}

function MiniRing({ score }: { score: number }) {
  const r = 28, c = 2 * Math.PI * r;
  return (
    <div className="relative h-[72px] w-[72px] shrink-0">
      <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90">
        <circle cx="36" cy="36" r={r} className="fill-none stroke-surface-3" strokeWidth="7" />
        <circle cx="36" cy="36" r={r} className="fill-none stroke-accent" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * score) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold leading-none">{score}</span>
        <span className="text-text-4 text-[9px] font-mono">/100</span>
      </div>
    </div>
  );
}

function YourJourney({ persona }: { persona: PersonaId }) {
  const p = PERSONAS[persona];
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-bold">Your journey</h2>
          <Badge tone="accent">{p.label}</Badge>
        </div>
        <Link href="/welcome" className="text-sm text-text-3 hover:text-text-1">Change</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {p.journey.map((j, i) => {
          const Icon = Icons[j.icon];
          return (
            <Link key={j.href} href={j.href}
              className="group relative rounded-xl border border-border bg-surface p-4 shadow-card card-interactive">
              <span className="absolute right-3 top-3 font-mono text-[11px] text-text-4">{i + 1}</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20 group-hover:bg-accent group-hover:text-accent-ink transition-colors">
                <Icon width={20} height={20} />
              </div>
              <div className="mt-3 font-medium text-text-1 leading-tight">{j.label}</div>
              <div className="text-text-4 text-xs mt-1 leading-snug">{j.why}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function TodaysFocus({ today }: { today?: Today }) {
  const c = today?.challenge;
  return (
    <Card variant="glow" className="lg:col-span-2 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-text-3">Today&apos;s focus</span>
        {c?.alreadySolvedToday && <Badge tone="easy">Solved ✓</Badge>}
      </div>
      {c ? (
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{c.problem.title}</h3>
            <Badge tone={diffTone[c.problem.difficulty as keyof typeof diffTone]}>{c.problem.difficulty}</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {c.problem.patterns.map((p) => <Badge key={p}>{p}</Badge>)}
          </div>
          <p className="text-text-3 text-sm mt-4 max-w-md">
            The daily challenge is hand-picked to push the pattern you&apos;re weakest on. Solve it to extend your streak.
          </p>
          <div className="mt-5 flex gap-3 flex-wrap">
            <Link href={`/problems/${c.problem.slug}`}>
              <Button glow>{c.alreadySolvedToday ? "Review solution" : "Solve now"}</Button>
            </Link>
            <Link href="/problems"><Button variant="secondary">Browse all</Button></Link>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight">Start your path</h3>
          <p className="text-text-3 text-sm mt-3 max-w-md">
            Take the 20-question assessment — 12 DSA + 4 CS + 4 aptitude. We&apos;ll calibrate your
            placement probability and generate a personalised roadmap.
          </p>
          <div className="mt-5 flex gap-3 flex-wrap">
            <Link href="/assessment"><Button glow>Start assessment</Button></Link>
            <Link href="/problems"><Button variant="secondary">Browse problems</Button></Link>
          </div>
        </div>
      )}
    </Card>
  );
}

function LevelCard({ gam, xpPct }: { gam?: GamMe; xpPct: number }) {
  return (
    <Card variant="elevated" className="flex flex-col items-center justify-center text-center">
      <ProgressRing pct={xpPct} label={`L${gam?.level ?? 1}`} />
      <div className="mt-4 font-display text-2xl font-bold">{(gam?.xp ?? 0).toLocaleString()} XP</div>
      {gam
        ? <div className="text-text-3 text-sm mt-1">{gam.xpToNext.toLocaleString()} XP to Level {gam.level + 1}</div>
        : <Skeleton className="h-4 w-32 mt-2" />}
      <Link href="/wrapped" className="mt-4 text-sm text-accent hover:underline">View your wrapped →</Link>
    </Card>
  );
}

function ProgressRing({ pct, label }: { pct: number; label: string }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r={r} className="fill-none stroke-surface-3" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} className="fill-none stroke-accent" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold">{label}</span>
        <span className="text-text-3 text-xs font-mono">{pct}%</span>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, unit, sub, tone = "default" }: {
  icon: IconName; label: string; value: number; unit?: string; sub?: string;
  tone?: "default" | "accent" | "medium" | "info";
}) {
  const Icon = Icons[icon];
  const toneCls = tone === "accent" ? "text-accent" : tone === "medium" ? "text-medium" : tone === "info" ? "text-info" : "text-text-2";
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-3">{label}</span>
        <span className={toneCls}><Icon width={16} height={16} /></span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold leading-none">
        {value.toLocaleString()}{unit && <span className="text-text-3 text-lg font-semibold"> {unit}</span>}
      </div>
      {sub && <div className="text-text-4 text-xs mt-1.5">{sub}</div>}
    </div>
  );
}

type QA = { href: string; label: string; desc: string; icon: IconName };
const QUICK_ACTIONS: QA[] = [
  { href: "/readiness",  label: "Readiness",    desc: "Am I ready?",        icon: "target" },
  { href: "/problems",   label: "Problems",     desc: "1000+ patterns",     icon: "code" },
  { href: "/companies",  label: "Company Prep", desc: "Targeted coverage",  icon: "building" },
  { href: "/mocks",      label: "AI Mock",      desc: "Interview practice", icon: "mic" },
  { href: "/subjects",   label: "Core CS",      desc: "OS · DBMS · CN",     icon: "book" },
  { href: "/resume",     label: "Resume",       desc: "ATS-scored",         icon: "doc" },
  { href: "/pipeline",   label: "Pipeline",     desc: "Track to offer",     icon: "activity" },
  { href: "/jobs",       label: "Jobs",         desc: "Find roles",         icon: "briefcase" },
];

function QuickAction({ href, label, desc, icon }: QA) {
  const Icon = Icons[icon];
  return (
    <Link href={href}
      className="group rounded-xl border border-border bg-surface p-4 shadow-card card-interactive">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-tint text-accent border border-accent/20 group-hover:bg-accent group-hover:text-accent-ink transition-colors">
        <Icon width={20} height={20} />
      </div>
      <div className="mt-3 font-medium text-text-1">{label}</div>
      <div className="text-text-4 text-xs mt-0.5">{desc}</div>
    </Link>
  );
}
