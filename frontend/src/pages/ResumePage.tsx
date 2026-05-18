import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface ResumeData {
  name: string; email: string; phone: string; location: string; linkedin: string; github: string; summary: string;
  education: Array<{ school: string; degree: string; field: string; year: string; gpa?: string }>;
  experience: Array<{ company: string; role: string; duration: string; location: string; bullets: string[] }>;
  skills: string[];
  projects: Array<{ name: string; desc: string; stack: string; link?: string }>;
  certifications: Array<{ name: string; issuer: string; year: string }>;
}

const BLANK: ResumeData = {
  name: '', email: '', phone: '', location: '', linkedin: '', github: '', summary: '',
  education: [{ school: '', degree: '', field: 'Computer Science', year: '', gpa: '' }],
  experience: [{ company: '', role: '', duration: '', location: '', bullets: ['', '', ''] }],
  skills: [],
  projects: [{ name: '', desc: '', stack: '', link: '' }],
  certifications: [],
};

type Section = 'personal' | 'education' | 'experience' | 'skills' | 'projects' | 'certifications';
type Template = 'minimal' | 'modern';

interface ATSTip { ok: boolean; label: string; tip: string }

function computeATS(data: ResumeData): { score: number; tips: ATSTip[] } {
  const tips: ATSTip[] = [];

  const hasName = data.name.trim().length > 2;
  tips.push({ ok: hasName, label: 'Full name present', tip: 'Add your full name to the top of the resume.' });

  const atIdx = data.email.indexOf('@');
  const hasEmail = atIdx > 0 && data.email.indexOf('.', atIdx) > atIdx + 1 && !data.email.includes(' ');
  tips.push({ ok: hasEmail, label: 'Professional email', tip: 'Include a professional email address.' });

  const hasPhone = data.phone.trim().length >= 7;
  tips.push({ ok: hasPhone, label: 'Phone number', tip: 'Add a phone number for recruiters to reach you.' });

  const hasSummary = data.summary.trim().split(' ').length >= 20;
  tips.push({ ok: hasSummary, label: 'Summary ≥20 words', tip: 'Write a compelling 2-3 sentence professional summary.' });

  const hasExp = data.experience.some((e) => e.company.trim() && e.role.trim() && e.bullets.some((b) => b.trim().length > 10));
  tips.push({ ok: hasExp, label: 'Work experience with bullets', tip: 'Add at least one role with meaningful bullet points.' });

  const hasQuantified = data.experience.some((e) =>
    e.bullets.some((b) => {
      if (!/\d/.test(b)) return false;
      const lower = b.toLowerCase();
      return b.includes('%') || lower.includes('ms') || lower.includes('million')
          || lower.includes('billion') || lower.includes('thousand')
          || /\d\s*[xk+]/.test(lower);
    })
  );
  tips.push({ ok: hasQuantified, label: 'Quantified achievements', tip: 'Use numbers: "Improved latency by 40%" beats "Improved performance".' });

  const hasEdu = data.education.some((e) => e.school.trim() && e.degree.trim());
  tips.push({ ok: hasEdu, label: 'Education section', tip: 'Add your degree, institution, and graduation year.' });

  const hasSkills = data.skills.length >= 5;
  tips.push({ ok: hasSkills, label: '5+ skills listed', tip: 'List at least 5 technical skills relevant to the roles you\'re targeting.' });

  const hasProject = data.projects.some((p) => p.name.trim() && p.desc.trim() && p.stack.trim());
  tips.push({ ok: hasProject, label: 'Projects section', tip: 'Showcase 1-3 personal or open-source projects with tech stack.' });

  const hasLinkedIn = data.linkedin.trim().length > 5;
  tips.push({ ok: hasLinkedIn, label: 'LinkedIn URL', tip: 'Include your LinkedIn profile to boost recruiter confidence.' });

  const ok = tips.filter((t) => t.ok).length;
  return { score: Math.round((ok / tips.length) * 100), tips };
}

function PreviewMinimal({ data }: { readonly data: ResumeData }) {
  return (
    <div className="bg-white text-black p-10 font-sans text-sm min-h-[800px]">
      <div className="border-b-2 border-black pb-4 mb-4">
        <h1 className="text-2xl font-black">{data.name || 'Your Name'}</h1>
        <p className="text-gray-600 text-xs mt-0.5">
          {[data.email, data.phone, data.location].filter(Boolean).join(' · ')}
        </p>
        {(data.linkedin || data.github) && (
          <p className="text-gray-500 text-xs mt-0.5">
            {[data.linkedin, data.github].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      {data.summary && (
        <div className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest mb-1 border-b border-gray-200 pb-0.5">Summary</h2>
          <p className="text-gray-700 text-xs leading-relaxed">{data.summary}</p>
        </div>
      )}
      {data.skills.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest mb-1 border-b border-gray-200 pb-0.5">Skills</h2>
          <p className="text-gray-700 text-xs">{data.skills.join(' · ')}</p>
        </div>
      )}
      {data.experience.some((e) => e.company || e.role) && (
        <div className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest mb-1 border-b border-gray-200 pb-0.5">Experience</h2>
          {data.experience.map((ex, i) => ex.company || ex.role ? (
            <div key={`exp-${String(i)}`} className="mb-3">
              <div className="flex justify-between">
                <p className="font-bold text-xs">{ex.role}{ex.company ? ` — ${ex.company}` : ''}</p>
                <p className="text-gray-500 text-xs">{ex.duration}</p>
              </div>
              {ex.location && <p className="text-gray-400 text-[10px]">{ex.location}</p>}
              <ul className="list-disc ml-4 mt-1">
                {ex.bullets.filter(Boolean).map((b, j) => <li key={`b-${String(j)}`} className="text-gray-700 text-xs">{b}</li>)}
              </ul>
            </div>
          ) : null)}
        </div>
      )}
      {data.education.some((e) => e.school || e.degree) && (
        <div className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest mb-1 border-b border-gray-200 pb-0.5">Education</h2>
          {data.education.map((e, i) => e.school || e.degree ? (
            <div key={`edu-${String(i)}`} className="mb-2">
              <div className="flex justify-between">
                <p className="font-bold text-xs">{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                <p className="text-gray-500 text-xs">{e.year}</p>
              </div>
              <p className="text-gray-600 text-[10px]">{e.school}{e.gpa ? ` · GPA: ${e.gpa}` : ''}</p>
            </div>
          ) : null)}
        </div>
      )}
      {data.projects.some((p) => p.name || p.desc) && (
        <div className="mb-4">
          <h2 className="text-xs font-black uppercase tracking-widest mb-1 border-b border-gray-200 pb-0.5">Projects</h2>
          {data.projects.map((p, i) => p.name || p.desc ? (
            <div key={`proj-${String(i)}`} className="mb-2">
              <p className="font-bold text-xs">{p.name}{p.stack ? <span className="font-normal text-gray-500"> · {p.stack}</span> : null}</p>
              {p.desc && <p className="text-gray-700 text-[11px]">{p.desc}</p>}
              {p.link && <p className="text-blue-600 text-[10px]">{p.link}</p>}
            </div>
          ) : null)}
        </div>
      )}
      {data.certifications.some((c) => c.name) && (
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest mb-1 border-b border-gray-200 pb-0.5">Certifications</h2>
          {data.certifications.map((c, i) => c.name ? (
            <div key={`cert-${String(i)}`} className="flex justify-between text-xs mb-1">
              <span className="font-semibold">{c.name}</span>
              <span className="text-gray-500">{c.issuer} · {c.year}</span>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );
}

function PreviewModern({ data }: { readonly data: ResumeData }) {
  return (
    <div className="bg-white text-black font-sans text-sm min-h-[800px] flex">
      {/* Left sidebar */}
      <div className="w-1/3 bg-gray-900 text-white p-6">
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-black mb-3">
            {data.name ? data.name.charAt(0).toUpperCase() : '?'}
          </div>
          <h1 className="text-lg font-black leading-tight">{data.name || 'Your Name'}</h1>
        </div>
        <div className="space-y-1 mb-6">
          {data.email && <p className="text-gray-300 text-[10px] flex items-center gap-1"><span className="text-indigo-400">✉</span> {data.email}</p>}
          {data.phone && <p className="text-gray-300 text-[10px] flex items-center gap-1"><span className="text-indigo-400">✆</span> {data.phone}</p>}
          {data.location && <p className="text-gray-300 text-[10px] flex items-center gap-1"><span className="text-indigo-400">⌖</span> {data.location}</p>}
          {data.linkedin && <p className="text-gray-300 text-[10px] break-all">{data.linkedin}</p>}
          {data.github && <p className="text-gray-300 text-[10px] break-all">{data.github}</p>}
        </div>
        {data.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-1">
              {data.skills.map((s) => (
                <span key={s} className="text-[9px] bg-gray-800 text-gray-200 px-1.5 py-0.5 rounded">{s}</span>
              ))}
            </div>
          </div>
        )}
        {data.certifications.some((c) => c.name) && (
          <div>
            <h2 className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-2">Certifications</h2>
            {data.certifications.map((c, i) => c.name ? (
              <div key={`cert-${String(i)}`} className="mb-1.5">
                <p className="text-white text-[10px] font-semibold">{c.name}</p>
                <p className="text-gray-400 text-[9px]">{c.issuer} · {c.year}</p>
              </div>
            ) : null)}
          </div>
        )}
      </div>
      {/* Right content */}
      <div className="flex-1 p-6">
        {data.summary && (
          <div className="mb-4">
            <h2 className="text-[9px] font-black uppercase tracking-widest text-indigo-600 border-b border-indigo-100 pb-0.5 mb-1.5">About</h2>
            <p className="text-gray-700 text-xs leading-relaxed">{data.summary}</p>
          </div>
        )}
        {data.experience.some((e) => e.company || e.role) && (
          <div className="mb-4">
            <h2 className="text-[9px] font-black uppercase tracking-widest text-indigo-600 border-b border-indigo-100 pb-0.5 mb-2">Experience</h2>
            {data.experience.map((ex, i) => ex.company || ex.role ? (
              <div key={`exp-${String(i)}`} className="mb-3 pl-3 border-l-2 border-indigo-200">
                <div className="flex justify-between">
                  <p className="font-bold text-xs">{ex.role}</p>
                  <p className="text-gray-400 text-[10px]">{ex.duration}</p>
                </div>
                <p className="text-indigo-600 text-[10px] font-semibold">{ex.company}{ex.location ? ` · ${ex.location}` : ''}</p>
                <ul className="list-disc ml-4 mt-1">
                  {ex.bullets.filter(Boolean).map((b, j) => <li key={`b-${String(j)}`} className="text-gray-700 text-[11px]">{b}</li>)}
                </ul>
              </div>
            ) : null)}
          </div>
        )}
        {data.education.some((e) => e.school || e.degree) && (
          <div className="mb-4">
            <h2 className="text-[9px] font-black uppercase tracking-widest text-indigo-600 border-b border-indigo-100 pb-0.5 mb-2">Education</h2>
            {data.education.map((e, i) => e.school || e.degree ? (
              <div key={`edu-${String(i)}`} className="mb-2 pl-3 border-l-2 border-indigo-200">
                <p className="font-bold text-xs">{e.degree}{e.field ? `, ${e.field}` : ''}</p>
                <p className="text-indigo-600 text-[10px] font-semibold">{e.school}</p>
                <p className="text-gray-400 text-[10px]">{e.year}{e.gpa ? ` · GPA: ${e.gpa}` : ''}</p>
              </div>
            ) : null)}
          </div>
        )}
        {data.projects.some((p) => p.name || p.desc) && (
          <div>
            <h2 className="text-[9px] font-black uppercase tracking-widest text-indigo-600 border-b border-indigo-100 pb-0.5 mb-2">Projects</h2>
            {data.projects.map((p, i) => p.name || p.desc ? (
              <div key={`proj-${String(i)}`} className="mb-2 pl-3 border-l-2 border-indigo-200">
                <p className="font-bold text-xs">{p.name}</p>
                {p.stack && <p className="text-[9px] text-indigo-500 font-semibold">{p.stack}</p>}
                {p.desc && <p className="text-gray-700 text-[11px]">{p.desc}</p>}
              </div>
            ) : null)}
          </div>
        )}
      </div>
    </div>
  );
}

export function ResumePage() {
  const { fireXP, displayName } = useUser();
  const session = getSession();

  const [data, setData] = useState<ResumeData>(BLANK);
  const [section, setSection] = useState<Section>('personal');
  const [template, setTemplate] = useState<Template>('minimal');
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [showAts, setShowAts] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Auto-populate from session on first load
  useEffect(() => {
    if (loaded) return;
    const sessionEmail = session?.email ?? '';
    const name = displayName || '';
    setData((d) => ({
      ...d,
      name: d.name || name,
      email: d.email || sessionEmail,
    }));
    // Try to load saved resume from API
    if (session?.accessToken) {
      apiRequest<{ resume: ResumeData }>('/resume', { token: session.accessToken })
        .then((res) => {
          if (res.resume) setData(res.resume);
        })
        .catch(() => {})
        .finally(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [session?.accessToken, session?.email, displayName, loaded]);

  const { score: atsScore, tips: atsTips } = useMemo(() => computeATS(data), [data]);

  const update = <K extends keyof ResumeData>(key: K, val: ResumeData[K]) =>
    setData((d) => ({ ...d, [key]: val }));

  async function saveResume() {
    if (!session?.accessToken) return;
    setSaving(true);
    setSaveError('');
    try {
      await apiRequest('/resume', { method: 'PUT', body: { resume: data }, token: session.accessToken });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function exportPdf() {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/resume/export`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({
          template,
          data: {
            personalInfo: { name: data.name, email: data.email, phone: data.phone, location: data.location, summary: data.summary },
            experience: data.experience.map((e) => ({ company: e.company, role: e.role, startDate: e.duration, location: e.location, bullets: e.bullets })),
            education: data.education.map((e) => ({ institution: e.school, degree: e.degree, field: e.field, startDate: e.year, gpa: e.gpa })),
            skills: [{ category: 'Technical', items: data.skills }],
            projects: data.projects.map((p) => ({ name: p.name, description: p.desc, tech: p.stack.split(',').map((s) => s.trim()), link: p.link, bullets: [] })),
            certifications: data.certifications,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: { message?: string } };
        alert(err?.error?.message ?? 'Export failed.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.name.replace(/\s+/g, '_') || 'resume'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      fireXP(25, 'Resume exported!');
    } finally {
      setExporting(false);
    }
  }

  function addSkill() {
    const trimmed = skillInput.trim();
    if (!trimmed || data.skills.includes(trimmed)) { setSkillInput(''); return; }
    update('skills', [...data.skills, trimmed]);
    setSkillInput('');
  }

  function updateExpBullet(expIdx: number, bulletIdx: number, value: string) {
    const updated = [...data.experience];
    const newBullets = [...updated[expIdx].bullets];
    newBullets[bulletIdx] = value;
    updated[expIdx] = { ...updated[expIdx], bullets: newBullets };
    update('experience', updated);
  }

  function removeExpBullet(expIdx: number, bulletIdx: number) {
    const updated = [...data.experience];
    updated[expIdx] = { ...updated[expIdx], bullets: updated[expIdx].bullets.filter((_, k) => k !== bulletIdx) };
    update('experience', updated);
  }

  let atsColor = 'text-red-400';
  if (atsScore >= 80) atsColor = 'text-green-400';
  else if (atsScore >= 50) atsColor = 'text-yellow-400';
  let atsBg = 'bg-red-400';
  if (atsScore >= 80) atsBg = 'bg-green-400';
  else if (atsScore >= 50) atsBg = 'bg-yellow-400';

  const SECTIONS: { key: Section; label: string; icon: string }[] = [
    { key: 'personal',       label: 'Personal',       icon: 'person' },
    { key: 'education',      label: 'Education',      icon: 'school' },
    { key: 'experience',     label: 'Experience',     icon: 'work' },
    { key: 'skills',         label: 'Skills',         icon: 'psychology' },
    { key: 'projects',       label: 'Projects',       icon: 'code' },
    { key: 'certifications', label: 'Certs',          icon: 'verified' },
  ];

  let atsBorderBg = 'border-red-500/40 bg-red-500/10';
  if (atsScore >= 80) atsBorderBg = 'border-green-500/40 bg-green-500/10';
  else if (atsScore >= 50) atsBorderBg = 'border-yellow-500/40 bg-yellow-500/10';
  let atsBadge = `${atsColor} bg-red-400/10`;
  if (atsScore >= 80) atsBadge = `${atsColor} bg-green-400/10`;
  else if (atsScore >= 50) atsBadge = `${atsColor} bg-yellow-400/10`;

  let saveLabel = 'Save';
  if (saving) saveLabel = 'Saving…';
  else if (saved) saveLabel = 'Saved!';

  return (
    <AppShell>
      <div className="pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-1">
              Resume <span className="text-primary-container">Builder.</span>
            </h1>
            <p className="text-on-surface-variant">ATS-optimized. Export to PDF anytime.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* ATS Score pill */}
            <button
              type="button"
              onClick={() => setShowAts((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm transition-all ${atsBorderBg}`}
            >
              <div className={`w-2 h-2 rounded-full ${atsBg}`} />
              <span className={atsColor}>ATS Score: {atsScore}%</span>
              <Icon name={showAts ? 'expand_less' : 'expand_more'} size={16} className="text-zinc-500" />
            </button>
            {/* Save */}
            <button
              type="button"
              onClick={saveResume}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container text-zinc-300 font-bold text-sm hover:bg-surface-container-high transition-all disabled:opacity-60"
            >
              <Icon name={saved ? 'check' : 'save'} size={16} className={saved ? 'text-green-400' : ''} />
              {saveLabel}
            </button>
            {/* Export */}
            <button
              type="button"
              onClick={exportPdf}
              disabled={exporting}
              className="flex items-center gap-2 bg-primary-container text-white font-bold px-6 py-2.5 rounded-full text-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-60"
            >
              <Icon name="download" size={16} />
              {exporting ? 'Generating…' : 'Export PDF'}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{saveError}</div>
        )}

        {/* ATS tips panel */}
        {showAts && (
          <div className="bg-surface-container rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-on-surface">ATS Checklist</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${atsBadge}`}>{atsScore}%</span>
              </div>
              <div className="flex-1 mx-6 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${atsBg}`} style={{ width: `${atsScore}%` }} />
              </div>
              <span className="text-xs text-zinc-500">{atsTips.filter((t) => t.ok).length}/{atsTips.length} checks</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {atsTips.map((tip) => (
                <div
                  key={tip.label}
                  title={tip.ok ? '' : tip.tip}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold ${tip.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400 cursor-help'}`}
                >
                  <Icon name={tip.ok ? 'check_circle' : 'cancel'} size={12} filled={tip.ok} />
                  {tip.label}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left: Editor */}
          <div>
            {/* Template selector */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Template</span>
              <div className="flex items-center p-1 bg-surface-container rounded-full">
                {(['minimal', 'modern'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemplate(t)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all capitalize ${template === t ? 'bg-primary-container text-white' : 'text-zinc-500 hover:text-zinc-200'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Section tabs */}
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-surface-container rounded-2xl mb-5">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${section === s.key ? 'bg-primary-container text-white' : 'text-zinc-500 hover:text-zinc-200'}`}
                >
                  <Icon name={s.icon} size={13} />
                  {s.label}
                </button>
              ))}
            </div>

            {/* Personal section */}
            {section === 'personal' && (
              <div className="bg-surface-container rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { label: 'Full Name', key: 'name' as const, type: 'text', placeholder: 'John Engineer' },
                    { label: 'Email', key: 'email' as const, type: 'email', placeholder: 'john@example.com' },
                    { label: 'Phone', key: 'phone' as const, type: 'tel', placeholder: '+91 99999 99999' },
                    { label: 'Location', key: 'location' as const, type: 'text', placeholder: 'Bengaluru, India' },
                    { label: 'LinkedIn URL', key: 'linkedin' as const, type: 'url', placeholder: 'linkedin.com/in/john' },
                    { label: 'GitHub URL', key: 'github' as const, type: 'url', placeholder: 'github.com/john' },
                  ] as Array<{ label: string; key: keyof ResumeData; type: string; placeholder: string }>).map((f) => (
                    <div key={f.key}>
                      <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1.5">{f.label}</label>
                      <input
                        type={f.type}
                        value={data[f.key] as string}
                        placeholder={f.placeholder}
                        onChange={(e) => update(f.key, e.target.value as ResumeData[typeof f.key])}
                        className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-on-surface text-sm border border-transparent focus:border-primary-container/40 focus:outline-none transition-colors placeholder-zinc-700"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label htmlFor="resume-summary" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1.5">
                    Professional Summary
                  </label>
                  <textarea
                    id="resume-summary"
                    value={data.summary}
                    placeholder="Full-stack engineer with 3+ years building scalable distributed systems. Passionate about performance optimization and developer experience."
                    onChange={(e) => update('summary', e.target.value)}
                    rows={4}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-on-surface text-sm border border-transparent focus:border-primary-container/40 focus:outline-none resize-none transition-colors placeholder-zinc-700"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1">{data.summary.trim().split(/\s+/).filter(Boolean).length} words — aim for 30-50</p>
                </div>
              </div>
            )}

            {/* Skills section */}
            {section === 'skills' && (
              <div className="bg-surface-container rounded-xl p-6 space-y-4">
                <div>
                  <label htmlFor="resume-add-skill" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">Add Skills</label>
                  <div className="flex gap-2">
                    <input
                      id="resume-add-skill"
                      type="text"
                      value={skillInput}
                      placeholder="e.g. TypeScript, React, PostgreSQL"
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                      className="flex-1 bg-surface-container-low rounded-xl px-4 py-2.5 text-on-surface text-sm border border-transparent focus:border-primary-container/40 focus:outline-none placeholder-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="bg-primary-container text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1">Press Enter or click Add. Aim for 8-15 relevant skills.</p>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[60px]">
                  {data.skills.length === 0 && <p className="text-zinc-600 text-sm">No skills added yet.</p>}
                  {data.skills.map((s) => (
                    <div key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-highest rounded-full">
                      <span className="text-xs font-bold text-on-surface">{s}</span>
                      <button
                        type="button"
                        onClick={() => update('skills', data.skills.filter((sk) => sk !== s))}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Quick Add</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'C++', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'GraphQL'].filter((s) => !data.skills.includes(s)).slice(0, 10).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update('skills', [...data.skills, s])}
                        className="text-[10px] font-bold px-3 py-1 rounded-full border border-zinc-700 text-zinc-400 hover:border-primary-container/50 hover:text-primary-container transition-all"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Education section */}
            {section === 'education' && (
              <div className="space-y-4">
                {data.education.map((edu, i) => (
                  <div key={`edu-form-${String(i)}`} className="bg-surface-container rounded-xl p-6 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Entry {i + 1}</span>
                      <button type="button" onClick={() => update('education', data.education.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { label: 'Institution', f: 'school', placeholder: 'IIT Bombay' },
                        { label: 'Degree', f: 'degree', placeholder: 'B.Tech' },
                        { label: 'Field of Study', f: 'field', placeholder: 'Computer Science' },
                        { label: 'Graduation Year', f: 'year', placeholder: '2024' },
                        { label: 'GPA (optional)', f: 'gpa', placeholder: '8.5/10' },
                      ] as Array<{ label: string; f: keyof typeof edu; placeholder: string }>).map((field) => (
                        <div key={field.f} className={field.f === 'school' || field.f === 'field' ? 'col-span-2' : ''}>
                          <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1">{field.label}</label>
                          <input
                            type="text"
                            value={edu[field.f] ?? ''}
                            placeholder={field.placeholder}
                            onChange={(e) => {
                              const updated = [...data.education];
                              updated[i] = { ...updated[i], [field.f]: e.target.value };
                              update('education', updated);
                            }}
                            className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-on-surface text-sm border border-transparent focus:border-primary-container/40 focus:outline-none placeholder-zinc-700"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => update('education', [...data.education, { school: '', degree: '', field: 'Computer Science', year: '', gpa: '' }])}
                  className="w-full border border-dashed border-zinc-700 rounded-xl py-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Icon name="add" size={16} /> Add Education
                </button>
              </div>
            )}

            {/* Experience section */}
            {section === 'experience' && (
              <div className="space-y-4">
                {data.experience.map((exp, i) => (
                  <div key={`exp-form-${String(i)}`} className="bg-surface-container rounded-xl p-6 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Role {i + 1}</span>
                      <button type="button" onClick={() => update('experience', data.experience.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { label: 'Company', f: 'company', placeholder: 'Google' },
                        { label: 'Role / Title', f: 'role', placeholder: 'Software Engineer II' },
                        { label: 'Duration', f: 'duration', placeholder: 'Jun 2022 – Present' },
                        { label: 'Location', f: 'location', placeholder: 'Bengaluru, India (Remote)' },
                      ] as Array<{ label: string; f: keyof typeof exp; placeholder: string }>).map((field) => (
                        <div key={field.f}>
                          <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1">{field.label}</label>
                          <input
                            type="text"
                            value={exp[field.f] as string}
                            placeholder={field.placeholder}
                            onChange={(e) => {
                              const updated = [...data.experience];
                              updated[i] = { ...updated[i], [field.f]: e.target.value };
                              update('experience', updated);
                            }}
                            className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-on-surface text-sm border border-transparent focus:border-primary-container/40 focus:outline-none placeholder-zinc-700"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label htmlFor={`exp-bullet-${i}-0`} className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1">
                        Impact Bullets — use numbers & results
                      </label>
                      {exp.bullets.map((bullet, j) => (
                        <div key={`bullet-${String(j)}`} className="flex gap-2 mb-2">
                          <span className="text-zinc-600 text-sm mt-2.5 flex-shrink-0">•</span>
                          <input
                            id={`exp-bullet-${i}-${j}`}
                            type="text"
                            value={bullet}
                            placeholder={j === 0 ? 'Reduced API latency by 42% via Redis caching, saving $8k/month in infra costs.' : 'Add another impact bullet…'}
                            onChange={(e) => updateExpBullet(i, j, e.target.value)}
                            className="flex-1 bg-surface-container-low rounded-xl px-4 py-2 text-on-surface text-sm border border-transparent focus:border-primary-container/40 focus:outline-none placeholder-zinc-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeExpBullet(i, j)}
                            className="text-zinc-700 hover:text-red-400 transition-colors mt-1 flex-shrink-0"
                          >
                            <Icon name="remove" size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...data.experience];
                          updated[i] = { ...updated[i], bullets: [...updated[i].bullets, ''] };
                          update('experience', updated);
                        }}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 mt-1 transition-colors"
                      >
                        <Icon name="add" size={12} /> Add bullet
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => update('experience', [...data.experience, { company: '', role: '', duration: '', location: '', bullets: ['', '', ''] }])}
                  className="w-full border border-dashed border-zinc-700 rounded-xl py-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Icon name="add" size={16} /> Add Experience
                </button>
              </div>
            )}

            {/* Projects section */}
            {section === 'projects' && (
              <div className="space-y-4">
                {data.projects.map((proj, i) => (
                  <div key={`proj-form-${String(i)}`} className="bg-surface-container rounded-xl p-6 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Project {i + 1}</span>
                      <button type="button" onClick={() => update('projects', data.projects.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                    {([
                      { label: 'Project Name', f: 'name', placeholder: 'Distributed Cache System' },
                      { label: 'Description', f: 'desc', placeholder: 'Redis-based caching layer that reduced DB load by 60%' },
                      { label: 'Tech Stack', f: 'stack', placeholder: 'Go, Redis, Docker, Kubernetes' },
                      { label: 'Link (GitHub / Demo)', f: 'link', placeholder: 'github.com/you/project' },
                    ] as Array<{ label: string; f: keyof typeof proj; placeholder: string }>).map((field) => (
                      <div key={field.f}>
                        <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1">{field.label}</label>
                        <input
                          type="text"
                          value={proj[field.f] ?? ''}
                          placeholder={field.placeholder}
                          onChange={(e) => {
                            const updated = [...data.projects];
                            updated[i] = { ...updated[i], [field.f]: e.target.value };
                            update('projects', updated);
                          }}
                          className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-on-surface text-sm border border-transparent focus:border-primary-container/40 focus:outline-none placeholder-zinc-700"
                        />
                      </div>
                    ))}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => update('projects', [...data.projects, { name: '', desc: '', stack: '', link: '' }])}
                  className="w-full border border-dashed border-zinc-700 rounded-xl py-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Icon name="add" size={16} /> Add Project
                </button>
              </div>
            )}

            {/* Certifications section */}
            {section === 'certifications' && (
              <div className="space-y-4">
                {data.certifications.length === 0 && (
                  <div className="bg-surface-container rounded-xl p-8 text-center">
                    <Icon name="verified" size={32} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm mb-4">No certifications added yet.</p>
                    <p className="text-zinc-600 text-xs">Add AWS, Google Cloud, Azure, or any professional certification.</p>
                  </div>
                )}
                {data.certifications.map((cert, i) => (
                  <div key={`cert-form-${String(i)}`} className="bg-surface-container rounded-xl p-6 space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Cert {i + 1}</span>
                      <button type="button" onClick={() => update('certifications', data.certifications.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { label: 'Certification Name', f: 'name', placeholder: 'AWS Solutions Architect' },
                        { label: 'Issuing Organization', f: 'issuer', placeholder: 'Amazon Web Services' },
                        { label: 'Year', f: 'year', placeholder: '2024' },
                      ] as Array<{ label: string; f: keyof typeof cert; placeholder: string }>).map((field) => (
                        <div key={field.f} className={field.f === 'name' ? 'col-span-3' : ''}>
                          <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1">{field.label}</label>
                          <input
                            type="text"
                            value={cert[field.f]}
                            placeholder={field.placeholder}
                            onChange={(e) => {
                              const updated = [...data.certifications];
                              updated[i] = { ...updated[i], [field.f]: e.target.value };
                              update('certifications', updated);
                            }}
                            className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-on-surface text-sm border border-transparent focus:border-primary-container/40 focus:outline-none placeholder-zinc-700"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => update('certifications', [...data.certifications, { name: '', issuer: '', year: '' }])}
                  className="w-full border border-dashed border-zinc-700 rounded-xl py-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Icon name="add" size={16} /> Add Certification
                </button>
              </div>
            )}
          </div>

          {/* Right: Live preview */}
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl shadow-2xl border border-zinc-800">
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container border-b border-zinc-800 rounded-t-xl">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live Preview — {template}</span>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
            </div>
            {template === 'minimal' ? <PreviewMinimal data={data} /> : <PreviewModern data={data} />}
          </div>
        </div>

        {/* Resume tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: 'format_list_bulleted', title: 'Use Action Verbs', body: 'Start every bullet with a strong verb: Built, Reduced, Scaled, Architected, Led, Shipped.' },
            { icon: 'bar_chart', title: 'Quantify Everything', body: 'Numbers catch recruiter eyes. "40% latency reduction" beats "improved performance" every time.' },
            { icon: 'target', title: 'Tailor Per Role', body: 'Mirror keywords from the JD. ATS systems scan for exact matches before a human ever reads your resume.' },
          ].map((tip) => (
            <div key={tip.title} className="bg-surface-container rounded-xl p-5 flex gap-4">
              <div className="w-9 h-9 bg-primary-container/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name={tip.icon} size={18} className="text-primary-container" />
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface mb-1">{tip.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
