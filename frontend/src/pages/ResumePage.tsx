import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { getSession } from '../lib/session';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface ResumeData {
  name: string; email: string; phone: string; location: string; summary: string;
  education: Array<{ school: string; degree: string; year: string }>;
  experience: Array<{ company: string; role: string; duration: string; bullets: string[] }>;
  skills: string[];
  projects: Array<{ name: string; desc: string; stack: string }>;
}

const INITIAL: ResumeData = {
  name: 'John Engineer', email: 'john@eyf.dev', phone: '+1 (555) 000-0000', location: 'San Francisco, CA',
  summary: 'Full-stack software engineer with 3+ years of experience building scalable distributed systems.',
  education: [{ school: 'State University', degree: 'B.Tech Computer Science', year: '2022' }],
  experience: [{ company: 'Tech Corp', role: 'Software Engineer', duration: 'Jan 2022 – Present', bullets: ['Built microservices at scale', 'Improved latency by 40%'] }],
  skills: ['Python', 'TypeScript', 'React', 'Node.js', 'AWS', 'PostgreSQL'],
  projects: [{ name: 'Distributed Cache', desc: 'Redis-based caching layer', stack: 'Go, Redis, Docker' }],
};

export function ResumePage() {
  const [data, setData] = useState<ResumeData>(INITIAL);
  const [section, setSection] = useState<'personal' | 'education' | 'experience' | 'skills' | 'projects'>('personal');
  const [exporting, setExporting] = useState(false);

  const update = <K extends keyof ResumeData>(key: K, val: ResumeData[K]) =>
    setData((d) => ({ ...d, [key]: val }));

  const exportPdf = async () => {
    setExporting(true);
    try {
      const session = getSession();
      const res = await fetch(`${API_BASE}/resume/export`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({
          template: 'default',
          data: {
            personalInfo: { name: data.name, email: data.email, phone: data.phone, location: data.location, summary: data.summary },
            experience: data.experience.map((e) => ({ company: e.company, role: e.role, startDate: e.duration, bullets: e.bullets })),
            education: data.education.map((e) => ({ institution: e.school, degree: e.degree, field: '', startDate: e.year })),
            skills: [{ category: 'Technical', items: data.skills }],
            projects: data.projects.map((p) => ({ name: p.name, description: p.desc, tech: p.stack.split(',').map((s) => s.trim()), bullets: [] })),
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
      a.download = 'resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="pt-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2">Resume <span className="text-primary-container">Builder.</span></h1>
            <p className="text-on-surface-variant">ATS-optimized engineering resume.</p>
          </div>
          <button
            onClick={exportPdf}
            disabled={exporting}
            className="bg-primary-container text-white font-bold px-8 py-3 rounded-full text-[11px] uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 disabled:opacity-60"
          >
            <Icon name="download" size={18} />
            {exporting ? 'Generating…' : 'Export PDF'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: form */}
          <div className="space-y-4">
            {/* Section tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-surface-container-low rounded-full w-fit mb-6">
              {(['personal', 'education', 'experience', 'skills', 'projects'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`px-5 py-2.5 rounded-full font-['Inter'] uppercase tracking-widest text-[10px] font-bold transition-all ${section === s ? 'bg-primary-container text-white' : 'text-zinc-500 hover:text-zinc-200'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {section === 'personal' && (
              <div className="bg-surface-container rounded-xl p-8 space-y-6">
                {[
                  { label: 'Full Name', key: 'name' as const, type: 'text' },
                  { label: 'Email', key: 'email' as const, type: 'email' },
                  { label: 'Phone', key: 'phone' as const, type: 'tel' },
                  { label: 'Location', key: 'location' as const, type: 'text' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">{f.label}</label>
                    <input
                      type={f.type}
                      value={data[f.key] as string}
                      onChange={(e) => update(f.key, e.target.value as ResumeData[typeof f.key])}
                      className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface text-sm border-none focus:outline-none"
                    />
                  </div>
                ))}
                <div>
                  <label htmlFor="resume-summary" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">Summary</label>
                  <textarea
                    id="resume-summary"
                    value={data.summary}
                    onChange={(e) => update('summary', e.target.value)}
                    rows={3}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface text-sm border-none focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {section === 'skills' && (
              <div className="bg-surface-container rounded-xl p-8">
                <label htmlFor="resume-skills" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-4">Skills (comma-separated)</label>
                <input
                  id="resume-skills"
                  type="text"
                  value={data.skills.join(', ')}
                  onChange={(e) => update('skills', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                  className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface text-sm border-none focus:outline-none"
                />
                <div className="flex flex-wrap gap-2 mt-4">
                  {data.skills.map((s) => (
                    <span key={s} className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-bold text-zinc-300">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {section === 'education' && (
              <div className="space-y-4">
                {data.education.map((edu, i) => (
                  <div key={edu.school || String(i)} className="bg-surface-container rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Entry {i + 1}</span>
                      <button onClick={() => update('education', data.education.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                    {(['school', 'degree', 'year'] as const).map((f) => (
                      <div key={f}>
                        <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1">{f}</label>
                        <input
                          type="text"
                          value={edu[f]}
                          onChange={(e) => {
                            const updated = [...data.education];
                            updated[i] = { ...updated[i], [f]: e.target.value };
                            update('education', updated);
                          }}
                          className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface text-sm border-none focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                ))}
                <button
                  onClick={() => update('education', [...data.education, { school: '', degree: '', year: '' }])}
                  className="w-full border border-dashed border-zinc-700 rounded-xl py-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Icon name="add" size={16} /> Add Education
                </button>
              </div>
            )}

            {section === 'experience' && (
              <div className="space-y-4">
                {data.experience.map((exp, i) => (
                  <div key={exp.company || String(i)} className="bg-surface-container rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Entry {i + 1}</span>
                      <button onClick={() => update('experience', data.experience.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                    {(['company', 'role', 'duration'] as const).map((f) => (
                      <div key={f}>
                        <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1">{f}</label>
                        <input
                          type="text"
                          value={exp[f]}
                          onChange={(e) => {
                            const updated = [...data.experience];
                            updated[i] = { ...updated[i], [f]: e.target.value };
                            update('experience', updated);
                          }}
                          className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface text-sm border-none focus:outline-none"
                        />
                      </div>
                    ))}
                    <div>
                      <label htmlFor={`bullets-${i}`} className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1">Bullets (one per line)</label>
                      <textarea
                        id={`bullets-${i}`}
                        rows={3}
                        value={exp.bullets.join('\n')}
                        onChange={(e) => {
                          const updated = [...data.experience];
                          updated[i] = { ...updated[i], bullets: e.target.value.split('\n') };
                          update('experience', updated);
                        }}
                        className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface text-sm border-none focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => update('experience', [...data.experience, { company: '', role: '', duration: '', bullets: [''] }])}
                  className="w-full border border-dashed border-zinc-700 rounded-xl py-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Icon name="add" size={16} /> Add Experience
                </button>
              </div>
            )}

            {section === 'projects' && (
              <div className="space-y-4">
                {data.projects.map((proj, i) => (
                  <div key={proj.name || String(i)} className="bg-surface-container rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Project {i + 1}</span>
                      <button onClick={() => update('projects', data.projects.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                    {(['name', 'desc', 'stack'] as const).map((f) => {
                      let fieldLabel: string;
                      if (f === 'desc') { fieldLabel = 'Description'; }
                      else if (f === 'stack') { fieldLabel = 'Tech Stack'; }
                      else { fieldLabel = 'Project Name'; }
                      return (
                      <div key={f}>
                        <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-1">{fieldLabel}</label>
                        <input
                          type="text"
                          value={proj[f]}
                          onChange={(e) => {
                            const updated = [...data.projects];
                            updated[i] = { ...updated[i], [f]: e.target.value };
                            update('projects', updated);
                          }}
                          className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-on-surface text-sm border-none focus:outline-none"
                        />
                      </div>
                    );
                    })}
                  </div>
                ))}
                <button
                  onClick={() => update('projects', [...data.projects, { name: '', desc: '', stack: '' }])}
                  className="w-full border border-dashed border-zinc-700 rounded-xl py-3 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Icon name="add" size={16} /> Add Project
                </button>
              </div>
            )}
          </div>

          {/* Right: preview */}
          <div className="bg-white text-black rounded-xl p-10 font-sans text-sm shadow-2xl sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="border-b-2 border-black pb-4 mb-4">
              <h1 className="text-2xl font-black">{data.name}</h1>
              <p className="text-gray-600 text-xs">{data.email} · {data.phone} · {data.location}</p>
            </div>
            {data.summary && (
              <div className="mb-4">
                <h2 className="text-xs font-black uppercase tracking-widest mb-1">Summary</h2>
                <p className="text-gray-700">{data.summary}</p>
              </div>
            )}
            {data.skills.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xs font-black uppercase tracking-widest mb-1">Skills</h2>
                <p className="text-gray-700">{data.skills.join(' · ')}</p>
              </div>
            )}
            {data.education.map((e, i) => (
              <div key={`edu-${e.school ?? i}`} className="mb-2">
                {i === 0 && <h2 className="text-xs font-black uppercase tracking-widest mb-1">Education</h2>}
                <p className="font-semibold">{e.degree}</p>
                <p className="text-gray-600 text-xs">{e.school} · {e.year}</p>
              </div>
            ))}
            {data.experience.map((ex, i) => (
              <div key={`exp-${ex.company ?? i}`} className="mb-3">
                {i === 0 && <h2 className="text-xs font-black uppercase tracking-widest mb-1 mt-3">Experience</h2>}
                <p className="font-semibold">{ex.role} — {ex.company}</p>
                <p className="text-gray-500 text-xs">{ex.duration}</p>
                <ul className="list-disc ml-4 text-gray-700 text-xs mt-1">
                  {ex.bullets.filter(Boolean).map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
            ))}
            {data.projects.length > 0 && (
              <div className="mt-3">
                <h2 className="text-xs font-black uppercase tracking-widest mb-1">Projects</h2>
                {data.projects.map((p, i) => (
                  <div key={`proj-${p.name ?? i}`} className="mb-2">
                    <p className="font-semibold">{p.name} <span className="font-normal text-gray-500 text-xs">· {p.stack}</span></p>
                    <p className="text-gray-700 text-xs">{p.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
