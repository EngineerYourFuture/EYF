"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@eyf/ui";
import { useApiAction } from "@/lib/use-api";
import { ThemeToggle } from "@/components/theme";
import { Icons } from "@/components/icons";
import { PERSONA_LIST, type PersonaId } from "@/lib/persona";

const ROLES = [
  { v: "SDE",       label: "Software Engineer", icon: "code" as const },
  { v: "Frontend",  label: "Frontend",          icon: "cube" as const },
  { v: "Backend",   label: "Backend",           icon: "briefcase" as const },
  { v: "Full-Stack",label: "Full-Stack",        icon: "compass" as const },
  { v: "Data",      label: "Data Engineer",     icon: "map" as const },
  { v: "ML",        label: "ML / AI",           icon: "brain" as const },
  { v: "DevOps",    label: "DevOps / SRE",      icon: "bolt" as const },
  { v: "Mobile",    label: "Mobile",            icon: "target" as const },
];

const YEARS = [2026, 2027, 2028, 2029];
const STEPS = 4;

export default function WelcomePage() {
  const router = useRouter();
  const action = useApiAction();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState<PersonaId | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [college, setCollege] = useState("");
  const [saving, setSaving] = useState(false);

  async function persist() {
    setSaving(true);
    try {
      await action("/me", {
        method: "PATCH",
        body: JSON.stringify({
          persona: persona ?? undefined,
          targetRole: role ?? undefined,
          graduationYear: year ?? undefined,
          college: college.trim() || undefined,
        }),
      });
      try { localStorage.setItem("eyf-onboarded", "1"); } catch {}
    } catch { /* non-blocking — still let them in */ }
    setSaving(false);
  }

  async function finish(dest: string) {
    await persist();
    router.push(dest);
  }

  return (
    <div className="min-h-screen bg-bg text-text-1 flex flex-col">

      <header className="relative flex items-center justify-between px-5 sm:px-8 h-16">
        <Link href="/" className="font-display font-bold text-xl tracking-tight">EYF</Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => finish("/dashboard")} className="text-sm text-text-3 hover:text-text-1">Skip</button>
        </div>
      </header>

      <main className="relative flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-lg">
          {/* progress */}
          <div
            className="flex items-center gap-2 mb-8"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS}
            aria-valuenow={step + 1}
            aria-valuetext={`Step ${step + 1} of ${STEPS}`}
            aria-label="Onboarding progress"
          >
            {Array.from({ length: STEPS }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-accent" : "bg-surface-3"}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>

              {step === 0 && (
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Welcome to EYF</div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">How do you want to use EYF?</h1>
                  <p className="text-text-3 mt-2">This shapes your home screen and your journey. You can change it later.</p>
                  <div className="mt-6 space-y-3">
                    {PERSONA_LIST.map((p) => {
                      const Icon = Icons[p.icon];
                      const on = persona === p.id;
                      return (
                        <button key={p.id} onClick={() => setPersona(p.id)} aria-pressed={on}
                          className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                            on ? "border-accent bg-accent-tint shadow-glow-sm" : "border-border bg-surface hover:border-edge"}`}>
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${on ? "bg-accent text-accent-ink" : "bg-surface-2 text-text-3"}`}>
                            <Icon width={20} height={20} />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-medium">{p.label}</span>
                            <span className="block text-text-4 text-xs mt-0.5">{p.who}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <Button onClick={() => setStep(1)} disabled={!persona} glow>Continue</Button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Step 2 of 4</div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">What role are you aiming for?</h1>
                  <p className="text-text-3 mt-2">We&apos;ll tune your roadmap, problems, and mock interviews around it.</p>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {ROLES.map((r) => {
                      const Icon = Icons[r.icon];
                      const on = role === r.v;
                      return (
                        <button key={r.v} onClick={() => setRole(r.v)} aria-pressed={on}
                          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                            on ? "border-accent bg-accent-tint shadow-glow-sm" : "border-border bg-surface hover:border-edge"}`}>
                          <span className={on ? "text-accent" : "text-text-3"}><Icon width={20} height={20} /></span>
                          <span className="font-medium text-sm">{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                    <Button onClick={() => setStep(2)} disabled={!role} glow>Continue</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Step 3 of 4</div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">When do you graduate?</h1>
                  <p className="text-text-3 mt-2">This sets how aggressive your prep timeline should be.</p>
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {YEARS.map((y) => (
                      <button key={y} onClick={() => setYear(y)} aria-pressed={year === y}
                        className={`rounded-xl border p-4 font-display text-xl font-bold transition-all ${
                          year === y ? "border-accent bg-accent-tint text-accent shadow-glow-sm" : "border-border bg-surface hover:border-edge"}`}>
                        {y}
                      </button>
                    ))}
                  </div>
                  <div className="mt-8 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)} disabled={!year} glow>Continue</Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Last step</div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Where do you study?</h1>
                  <p className="text-text-3 mt-2">Optional — helps us benchmark you against your cohort.</p>
                  <input
                    autoFocus value={college} onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. NIT Trichy"
                    className="mt-6 w-full rounded-xl border border-border bg-surface px-4 h-12 text-text-1 placeholder:text-text-4 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  />
                  <div className="mt-8 flex items-center justify-between gap-3">
                    <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={() => finish("/dashboard")} disabled={saving}>
                        {saving ? "Saving…" : "Go to dashboard"}
                      </Button>
                      <Button onClick={() => finish("/assessment")} disabled={saving} glow>
                        {saving ? "Saving…" : "Take assessment →"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
