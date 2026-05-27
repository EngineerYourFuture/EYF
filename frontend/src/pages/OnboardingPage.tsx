import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '../components/Icon';
import { EYFMark } from '../components/EYFLogo';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

interface OnboardingData {
  track: string;
  targetRole: string;
  targetCompanies: string[];
  experienceYears: number;
  dailyGoalMinutes: number;
  focusAreas: string[];
  name: string;
}

const TRACKS = [
  { id: 'student',       title: 'Student',              icon: 'school',      desc: 'Currently in college or a bootcamp. Landing my first role.',    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)'  },
  { id: 'professional',  title: 'Working Professional', icon: 'work',        desc: 'Currently employed. Targeting FAANG or senior roles.',           color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.3)'  },
  { id: 'career_change', title: 'Career Changer',       icon: 'swap_horiz',  desc: 'Transitioning into tech from a non-CS background.',              color: '#c084fc', bg: 'rgba(192,132,252,0.1)',border: 'rgba(192,132,252,0.3)' },
];

const TARGET_ROLES = [
  'Software Engineer (SDE)',
  'Senior Software Engineer',
  'Data Scientist / ML Engineer',
  'Security Engineer',
  'DevOps / SRE',
  'Product Manager',
  'Full Stack Engineer',
  'Mobile Engineer',
];

const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber', 'Stripe', 'Flipkart', 'Swiggy', 'Zomato', 'Razorpay', 'Other'];

const FOCUS_AREAS = [
  { id: 'dsa',        label: 'DSA & Algorithms',    icon: 'code' },
  { id: 'system-design', label: 'System Design',   icon: 'architecture' },
  { id: 'oop',        label: 'OOP & Design Patterns', icon: 'account_tree' },
  { id: 'security',   label: 'Cybersecurity',       icon: 'shield' },
  { id: 'os',         label: 'Core CS (OS/DBMS/CN)', icon: 'terminal' },
  { id: 'behavioral', label: 'Behavioral Prep',     icon: 'record_voice_over' },
  { id: 'resume',     label: 'Resume Building',     icon: 'description' },
  { id: 'placement',  label: 'Placement Strategy',  icon: 'route' },
];

const DAILY_GOALS = [
  { minutes: 30,  label: '30 min/day', desc: 'Casual pace' },
  { minutes: 60,  label: '1 hour/day', desc: 'Recommended' },
  { minutes: 120, label: '2 hours/day', desc: 'Intensive' },
  { minutes: 180, label: '3+ hours/day', desc: 'All-in mode' },
];

const TOTAL_STEPS = 5;
const INPUT_STYLE = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', fontSize: 18, fontWeight: 700, color: 'var(--t1)', outline: 'none', boxSizing: 'border-box' } as const;

function canAdvanceStep(step: number, data: OnboardingData): boolean {
  if (step === 1) return data.name.length >= 2;
  if (step === 2) return data.track !== '';
  if (step === 3) return data.targetRole !== '';
  if (step === 4) return data.targetCompanies.length > 0;
  return true;
}

async function saveOnboardingProfile(token: string, data: OnboardingData): Promise<void> {
  await Promise.all([
    apiRequest('/career/profile', {
      token,
      method: 'PUT',
      body: { track: data.track, targetRole: data.targetRole, interests: data.focusAreas, experienceYears: data.experienceYears, dailyGoalMinutes: data.dailyGoalMinutes, targetCompanies: data.targetCompanies },
    }),
    data.name && apiRequest('/auth/profile', { token, method: 'PATCH', body: { name: data.name } }),
  ]);
}

async function runFinish(
  token: string | undefined,
  data: OnboardingData,
  refresh: () => void,
  navigate: (path: string, opts?: { replace?: boolean }) => void,
): Promise<void> {
  if (token) await saveOnboardingProfile(token, data);
  refresh();
  navigate('/app/dashboard', { replace: true });
}

function toggleArrayValue<T>(arr: T[], value: T, max: number): T[] {
  if (arr.includes(value)) return arr.filter((v) => v !== value);
  if (arr.length < max) return [...arr, value];
  return arr;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const session = getSession();
  const { refresh } = useUser();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '', track: '', targetRole: '', targetCompanies: [], experienceYears: 0, dailyGoalMinutes: 60, focusAreas: [],
  });

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const toggleCompany = (company: string) =>
    setData((d) => ({ ...d, targetCompanies: toggleArrayValue(d.targetCompanies, company, 4) }));

  const toggleFocus = (id: string) =>
    setData((d) => ({ ...d, focusAreas: toggleArrayValue(d.focusAreas, id, 4) }));

  const finish = async () => {
    setSaving(true);
    try {
      await runFinish(session?.accessToken, data, refresh, navigate);
    } catch {
      // Don't block onboarding UX
      navigate('/app/dashboard', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => canAdvanceStep(step, data);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'var(--t1)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <EYFMark size={32} className="text-red-600" />
          <span style={{ fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)' }}>EYF</span>
        </div>
        <button
          onClick={() => navigate('/app/dashboard', { replace: true })}
          style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Skip
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 576, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', marginBottom: 8 }}>
            <span>Setup</span>
            <span>Step {step} of {TOTAL_STEPS}</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #E82127, #ff6b6b)', borderRadius: 999 }}
            />
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 576 }}>
          {/* Step 1: Name */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: 'rgba(232,33,39,0.1)', border: '1px solid rgba(232,33,39,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Icon name="waving_hand" size={36} style={{ color: '#E82127' }} />
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>Welcome to EYF!</h1>
              <p style={{ color: 'var(--t3)', marginBottom: 40 }}>Let's set up your profile. It takes 2 minutes and personalizes your entire experience.</p>

              <div style={{ textAlign: 'left' }}>
                <label htmlFor="onboarding-name" style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t2)', marginBottom: 12 }}>What should we call you?</label>
                <input
                  id="onboarding-name"
                  type="text"
                  value={data.name}
                  onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Your first name"
                  autoFocus
                  style={INPUT_STYLE}
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Track */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
                Hey {data.name.split(' ')[0]}! 👋
              </h2>
              <p style={{ color: 'var(--t3)', marginBottom: 32 }}>Which best describes where you are right now?</p>

              <div className="space-y-3">
                {TRACKS.map((track) => {
                  const active = data.track === track.id;
                  return (
                    <motion.button
                      key={track.id}
                      type="button"
                      onClick={() => setData((d) => ({ ...d, track: track.id }))}
                      whileHover={{ scale: 1.01 }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 20, padding: 20, borderRadius: 16, textAlign: 'left', cursor: 'pointer', border: active ? `2px solid ${track.border}` : '1px solid rgba(255,255,255,0.08)', background: active ? track.bg : 'rgba(255,255,255,0.03)' }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: track.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={track.icon} size={24} style={{ color: track.color }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 16, color: active ? track.color : '#e4e4e7' }}>{track.title}</p>
                        <p style={{ fontSize: 14, color: 'var(--t3)' }}>{track.desc}</p>
                      </div>
                      {active && <Icon name="check_circle" size={22} filled style={{ color: track.color, marginLeft: 'auto', flexShrink: 0 }} />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Target Role */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>What's your target?</h2>
              <p style={{ color: 'var(--t3)', marginBottom: 32 }}>This helps us recommend the right learning path for you.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ marginBottom: 32 }}>
                {TARGET_ROLES.map((role) => {
                  const active = data.targetRole === role;
                  return (
                    <motion.button
                      key={role}
                      type="button"
                      onClick={() => setData((d) => ({ ...d, targetRole: role }))}
                      whileHover={{ scale: 1.02 }}
                      style={{ padding: 16, borderRadius: 12, textAlign: 'left', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: active ? '1px solid rgba(232,33,39,0.4)' : '1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(232,33,39,0.1)' : 'rgba(255,255,255,0.03)', color: active ? '#e4e4e7' : '#a1a1aa' }}
                    >
                      {role}
                    </motion.button>
                  );
                })}
              </div>

              <div>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t2)', marginBottom: 12 }}>Years of experience</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[0, 1, 2, 3, 5, 7, 10].map((yr) => {
                    let label: string;
                    if (yr === 0) { label = 'None'; }
                    else if (yr === 10) { label = '10+'; }
                    else { label = `${yr}yr`; }
                    const active = data.experienceYears === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setData((d) => ({ ...d, experienceYears: yr }))}
                        style={{ flex: 1, padding: '10px 0', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: active ? '#E82127' : 'rgba(255,255,255,0.06)', color: active ? '#fff' : '#71717a' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Target Companies */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Dream companies?</h2>
              <p style={{ color: 'var(--t3)', marginBottom: 4 }}>Pick up to 4 companies you're targeting.</p>
              <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 32 }}>{data.targetCompanies.length}/4 selected</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {COMPANIES.map((c) => {
                  const selected = data.targetCompanies.includes(c);
                  const disabled = !selected && data.targetCompanies.length >= 4;
                  let companyBtnColor: string;
                  if (selected) { companyBtnColor = '#e4e4e7'; }
                  else if (disabled) { companyBtnColor = '#3f3f46'; }
                  else { companyBtnColor = '#a1a1aa'; }
                  return (
                    <motion.button
                      key={c}
                      type="button"
                      onClick={() => toggleCompany(c)}
                      whileHover={disabled ? {} : { scale: 1.04 }}
                      style={{ padding: '10px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', border: selected ? '1px solid rgba(232,33,39,0.4)' : '1px solid rgba(255,255,255,0.08)', background: selected ? 'rgba(232,33,39,0.12)' : 'rgba(255,255,255,0.04)', color: companyBtnColor, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {selected && <Icon name="check" size={12} />}
                      {c}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 5: Focus + Daily Goal */}
          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Almost there!</h2>
              <p style={{ color: 'var(--t3)', marginBottom: 32 }}>What do you want to focus on? Pick up to 4 areas.</p>

              <div className="grid grid-cols-2 gap-2" style={{ marginBottom: 32 }}>
                {FOCUS_AREAS.map((f) => {
                  const selected = data.focusAreas.includes(f.id);
                  const disabled = !selected && data.focusAreas.length >= 4;
                  let focusBtnColor: string;
                  if (selected) { focusBtnColor = '#e4e4e7'; }
                  else if (disabled) { focusBtnColor = '#3f3f46'; }
                  else { focusBtnColor = '#a1a1aa'; }
                  return (
                    <motion.button
                      key={f.id}
                      type="button"
                      onClick={() => toggleFocus(f.id)}
                      whileHover={disabled ? {} : { scale: 1.02 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer', border: selected ? '1px solid rgba(232,33,39,0.4)' : '1px solid rgba(255,255,255,0.08)', background: selected ? 'rgba(232,33,39,0.1)' : 'rgba(255,255,255,0.03)', color: focusBtnColor }}
                    >
                      <Icon name={f.icon} size={18} style={{ color: selected ? '#E82127' : '#71717a' }} />
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{f.label}</span>
                      {selected && <Icon name="check" size={14} style={{ marginLeft: 'auto', color: '#E82127', flexShrink: 0 }} />}
                    </motion.button>
                  );
                })}
              </div>

              <div>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t2)', marginBottom: 12 }}>Daily study goal</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DAILY_GOALS.map((g) => {
                    const active = data.dailyGoalMinutes === g.minutes;
                    return (
                      <motion.button
                        key={g.minutes}
                        type="button"
                        onClick={() => setData((d) => ({ ...d, dailyGoalMinutes: g.minutes }))}
                        whileHover={{ scale: 1.04 }}
                        style={{ padding: 12, borderRadius: 12, textAlign: 'center', cursor: 'pointer', border: active ? '1px solid rgba(232,33,39,0.4)' : '1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(232,33,39,0.1)' : 'rgba(255,255,255,0.03)' }}
                      >
                        <p style={{ fontSize: 14, fontWeight: 700, color: active ? '#e4e4e7' : '#a1a1aa' }}>{g.label}</p>
                        <p style={{ fontSize: 10, color: 'var(--t3)' }}>{g.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 40 }}>
            {step > 1 ? (
              <motion.button onClick={back} whileHover={{ x: -2 }} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
                <Icon name="arrow_back" size={16} />Back
              </motion.button>
            ) : (
              <button onClick={() => navigate('/app/dashboard', { replace: true })} style={{ color: 'var(--t4)', fontSize: 14, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                Skip for now
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <motion.button
                onClick={next}
                disabled={!canNext()}
                whileHover={canNext() ? { scale: 1.04 } : {}}
                whileTap={canNext() ? { scale: 0.96 } : {}}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E82127', color: '#fff', fontWeight: 700, padding: '12px 32px', borderRadius: 999, border: 'none', cursor: canNext() ? 'pointer' : 'not-allowed', opacity: canNext() ? 1 : 0.4, boxShadow: canNext() ? '0 0 20px rgba(232,33,39,0.3)' : 'none' }}
              >
                Continue<Icon name="arrow_forward" size={16} />
              </motion.button>
            ) : (
              <motion.button
                onClick={finish}
                disabled={saving}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E82127', color: '#fff', fontWeight: 700, padding: '12px 32px', borderRadius: 999, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1, boxShadow: '0 0 24px rgba(232,33,39,0.3)' }}
              >
                {saving ? <><Icon name="hourglass_empty" size={16} />Setting up...</> : <><Icon name="rocket_launch" size={16} />Launch EYF!</>}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
