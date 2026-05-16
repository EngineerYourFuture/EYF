import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { EYFMark } from '../components/EYFLogo';
// Standalone page — no AppShell sidebar
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
  {
    id: 'student',
    title: 'Student',
    icon: 'school',
    desc: 'Currently in college or a bootcamp. Landing my first role.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  {
    id: 'professional',
    title: 'Working Professional',
    icon: 'work',
    desc: 'Currently employed. Targeting FAANG or senior roles.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  {
    id: 'career_change',
    title: 'Career Changer',
    icon: 'swap_horiz',
    desc: 'Transitioning into tech from a non-CS background.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
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
  { id: 'dsa', label: 'DSA & Algorithms', icon: 'code' },
  { id: 'system-design', label: 'System Design', icon: 'architecture' },
  { id: 'oop', label: 'OOP & Design Patterns', icon: 'account_tree' },
  { id: 'security', label: 'Cybersecurity', icon: 'shield' },
  { id: 'os', label: 'Core CS (OS/DBMS/CN)', icon: 'terminal' },
  { id: 'behavioral', label: 'Behavioral Prep', icon: 'record_voice_over' },
  { id: 'resume', label: 'Resume Building', icon: 'description' },
  { id: 'placement', label: 'Placement Strategy', icon: 'route' },
];

const DAILY_GOALS = [
  { minutes: 30, label: '30 min/day', desc: 'Casual pace' },
  { minutes: 60, label: '1 hour/day', desc: 'Recommended' },
  { minutes: 120, label: '2 hours/day', desc: 'Intensive' },
  { minutes: 180, label: '3+ hours/day', desc: 'All-in mode' },
];

const TOTAL_STEPS = 5;

export function OnboardingPage() {
  const navigate = useNavigate();
  const session = getSession();
  const { refresh } = useUser();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    track: '',
    targetRole: '',
    targetCompanies: [],
    experienceYears: 0,
    dailyGoalMinutes: 60,
    focusAreas: [],
  });

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const toggleCompany = (company: string) => {
    setData((d) => ({
      ...d,
      targetCompanies: d.targetCompanies.includes(company)
        ? d.targetCompanies.filter((c) => c !== company)
        : d.targetCompanies.length < 4
        ? [...d.targetCompanies, company]
        : d.targetCompanies,
    }));
  };

  const toggleFocus = (id: string) => {
    setData((d) => ({
      ...d,
      focusAreas: d.focusAreas.includes(id)
        ? d.focusAreas.filter((f) => f !== id)
        : d.focusAreas.length < 4
        ? [...d.focusAreas, id]
        : d.focusAreas,
    }));
  };

  const finish = async () => {
    setSaving(true);
    try {
      await Promise.all([
        session?.accessToken && apiRequest('/career/profile', {
          token: session.accessToken,
          method: 'PUT',
          body: {
            track: data.track,
            targetRole: data.targetRole,
            interests: data.focusAreas,
            experienceYears: data.experienceYears,
            dailyGoalMinutes: data.dailyGoalMinutes,
            targetCompanies: data.targetCompanies,
          },
        }),
        data.name && session?.accessToken && apiRequest('/auth/profile', {
          token: session.accessToken,
          method: 'PATCH',
          body: { name: data.name },
        }),
      ]);
      await refresh();
    } catch {
      // Don't block — onboarding should always succeed UX-wise
    } finally {
      setSaving(false);
      navigate('/app/dashboard', { replace: true });
    }
  };

  const canNext = () => {
    if (step === 1) return data.name.length >= 2;
    if (step === 2) return data.track !== '';
    if (step === 3) return data.targetRole !== '';
    if (step === 4) return data.targetCompanies.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white flex flex-col dark">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-6 py-5 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <EYFMark size={32} className="text-[#E82127]" />
          <span className="font-black tracking-tighter text-white">EYF</span>
        </div>
        <button
          onClick={() => navigate('/app/dashboard', { replace: true })}
          className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      {/* Progress bar */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">
          <span>Setup</span>
          <span>Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-container to-red-400 rounded-full transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-xl">
        {/* Step 1: Name */}
        {step === 1 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-primary-container/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="waving_hand" size={36} className="text-primary-container" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-3">Welcome to EYF!</h1>
            <p className="text-zinc-400 mb-10">Let's set up your profile. It takes 2 minutes and personalizes your entire experience.</p>

            <div className="text-left">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">What should we call you?</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                placeholder="Your first name"
                autoFocus
                className="w-full bg-surface-container border border-zinc-800 rounded-xl px-5 py-4 text-lg font-bold text-on-surface focus:outline-none focus:border-primary-container/50 placeholder:font-normal placeholder:text-zinc-600"
              />
            </div>
          </div>
        )}

        {/* Step 2: Track */}
        {step === 2 && (
          <div>
            <h2 className="text-3xl font-black tracking-tighter mb-2">
              Hey {data.name.split(' ')[0]}! 👋
            </h2>
            <p className="text-zinc-400 mb-8">Which best describes where you are right now?</p>

            <div className="space-y-3">
              {TRACKS.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setData((d) => ({ ...d, track: track.id }))}
                  className={`w-full flex items-center gap-5 p-5 rounded-2xl text-left transition-all border ${
                    data.track === track.id
                      ? `${track.bg} ${track.border} border-2`
                      : 'bg-surface-container border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-12 h-12 ${track.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon name={track.icon} className={track.color} size={24} />
                  </div>
                  <div>
                    <p className={`font-bold text-base ${data.track === track.id ? track.color : 'text-on-surface'}`}>{track.title}</p>
                    <p className="text-sm text-zinc-500">{track.desc}</p>
                  </div>
                  {data.track === track.id && (
                    <Icon name="check_circle" className={`${track.color} ml-auto flex-shrink-0`} size={22} filled />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Target Role */}
        {step === 3 && (
          <div>
            <h2 className="text-3xl font-black tracking-tighter mb-2">What's your target?</h2>
            <p className="text-zinc-400 mb-8">This helps us recommend the right learning path for you.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8">
              {TARGET_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setData((d) => ({ ...d, targetRole: role }))}
                  className={`p-4 rounded-xl text-left text-sm font-bold transition-all border ${
                    data.targetRole === role
                      ? 'bg-primary-container/10 border-primary-container/50 text-primary-container'
                      : 'bg-surface-container border-zinc-800 text-on-surface-variant hover:border-zinc-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Years of experience</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 5, 7, 10].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setData((d) => ({ ...d, experienceYears: yr }))}
                    className={`flex-1 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      data.experienceYears === yr
                        ? 'bg-primary-container text-white'
                        : 'bg-surface-container text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {yr === 0 ? 'None' : yr === 10 ? '10+' : `${yr}yr`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Target Companies */}
        {step === 4 && (
          <div>
            <h2 className="text-3xl font-black tracking-tighter mb-2">Dream companies?</h2>
            <p className="text-zinc-400 mb-2">Pick up to 4 companies you're targeting.</p>
            <p className="text-[11px] text-zinc-600 mb-8">{data.targetCompanies.length}/4 selected</p>

            <div className="flex flex-wrap gap-2.5">
              {COMPANIES.map((c) => {
                const selected = data.targetCompanies.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCompany(c)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                      selected
                        ? 'bg-primary-container/10 border-primary-container/50 text-primary-container'
                        : data.targetCompanies.length >= 4
                        ? 'bg-surface-container border-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-surface-container border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                  >
                    {selected && <Icon name="check" size={12} className="inline mr-1" />}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Focus + Daily Goal */}
        {step === 5 && (
          <div>
            <h2 className="text-3xl font-black tracking-tighter mb-2">Almost there!</h2>
            <p className="text-zinc-400 mb-8">What do you want to focus on? Pick up to 4 areas.</p>

            <div className="grid grid-cols-2 gap-2 mb-8">
              {FOCUS_AREAS.map((f) => {
                const selected = data.focusAreas.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFocus(f.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all border ${
                      selected
                        ? 'bg-primary-container/10 border-primary-container/50 text-primary-container'
                        : data.focusAreas.length >= 4
                        ? 'bg-surface-container border-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-surface-container border-zinc-800 text-on-surface-variant hover:border-zinc-700'
                    }`}
                  >
                    <Icon name={f.icon} size={18} className={selected ? 'text-primary-container' : 'text-zinc-500'} />
                    <span className="text-sm font-bold">{f.label}</span>
                    {selected && <Icon name="check" size={14} className="ml-auto text-primary-container flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Daily study goal</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DAILY_GOALS.map((g) => (
                  <button
                    key={g.minutes}
                    type="button"
                    onClick={() => setData((d) => ({ ...d, dailyGoalMinutes: g.minutes }))}
                    className={`p-3 rounded-xl text-center transition-all border ${
                      data.dailyGoalMinutes === g.minutes
                        ? 'bg-primary-container/10 border-primary-container/50 text-primary-container'
                        : 'bg-surface-container border-zinc-800 text-on-surface-variant hover:border-zinc-700'
                    }`}
                  >
                    <p className="text-sm font-bold">{g.label}</p>
                    <p className="text-[10px] text-zinc-500">{g.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          {step > 1 ? (
            <button
              onClick={back}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors font-bold text-sm"
            >
              <Icon name="arrow_back" size={16} />
              Back
            </button>
          ) : (
            <button
              onClick={() => navigate('/app/dashboard', { replace: true })}
              className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm font-bold"
            >
              Skip for now
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={next}
              disabled={!canNext()}
              className="flex items-center gap-2 bg-primary-container text-white font-bold py-3 px-8 rounded-full hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <Icon name="arrow_forward" size={16} />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="flex items-center gap-2 bg-primary-container text-white font-bold py-3 px-8 rounded-full hover:brightness-110 transition-all disabled:opacity-40"
            >
              {saving ? (
                <><Icon name="hourglass_empty" size={16} />Setting up...</>
              ) : (
                <><Icon name="rocket_launch" size={16} />Launch EYF!</>
              )}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
