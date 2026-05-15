import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface SecurityLesson {
  id: string;
  lessonKey: string;
  title: string;
  category: string;
  description: string;
  difficulty: string;
  planAccess: string;
  status: string;
}

interface CTFChallenge {
  id: string;
  challengeKey: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  points: number;
  solved: boolean;
  attempts: number;
}

interface SecProgress {
  lessons: { total: number; completed: number };
  ctf: { total: number; solved: number; points: number };
}

const CATEGORY_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  owasp:    { icon: 'security', color: 'text-red-400', bg: 'bg-red-500/10', label: 'OWASP Top 10' },
  web:      { icon: 'language', color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Web Security' },
  network:  { icon: 'router', color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Network Security' },
  crypto:   { icon: 'lock', color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Cryptography' },
  cloud:    { icon: 'cloud', color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Cloud Security' },
  forensics:{ icon: 'search', color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Digital Forensics' },
  malware:  { icon: 'bug_report', color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Malware Analysis' },
};

const STATIC_LESSONS: SecurityLesson[] = [
  { id: '1', lessonKey: 'owasp-injection', title: 'Injection Attacks', category: 'owasp', description: 'SQL, NoSQL, OS, LDAP injection flaws. Learn how attackers manipulate queries and how to prevent them.', difficulty: 'easy', planAccess: 'free', status: 'not_started' },
  { id: '2', lessonKey: 'owasp-broken-auth', title: 'Broken Authentication', category: 'owasp', description: 'Credential stuffing, brute force, session fixation, and insecure token storage vulnerabilities.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '3', lessonKey: 'owasp-xss', title: 'Cross-Site Scripting (XSS)', category: 'owasp', description: 'Stored, reflected, and DOM-based XSS. Content Security Policy and input sanitization.', difficulty: 'easy', planAccess: 'free', status: 'not_started' },
  { id: '4', lessonKey: 'owasp-idor', title: 'Insecure Direct Object References', category: 'owasp', description: 'IDOR vulnerabilities, object-level authorization, and horizontal privilege escalation.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '5', lessonKey: 'owasp-security-misconfig', title: 'Security Misconfiguration', category: 'owasp', description: 'Default credentials, exposed admin panels, unnecessary features, and verbose error messages.', difficulty: 'easy', planAccess: 'free', status: 'not_started' },
  { id: '6', lessonKey: 'web-csrf', title: 'Cross-Site Request Forgery', category: 'web', description: 'CSRF attacks, SameSite cookies, CSRF tokens, and double-submit cookie pattern.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '7', lessonKey: 'web-cors', title: 'CORS & Same-Origin Policy', category: 'web', description: 'Origin policies, preflight requests, CORS misconfiguration exploits and secure configurations.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '8', lessonKey: 'web-headers', title: 'Security Headers', category: 'web', description: 'HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and their impact.', difficulty: 'easy', planAccess: 'free', status: 'not_started' },
  { id: '9', lessonKey: 'network-tls', title: 'TLS & PKI', category: 'network', description: 'TLS handshake, certificate chains, pinning, MITM attacks, and downgrade attacks.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '10', lessonKey: 'network-firewalls', title: 'Firewalls & IDS/IPS', category: 'network', description: 'Stateful vs stateless firewalls, intrusion detection, WAF rules, and network segmentation.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '11', lessonKey: 'crypto-symmetric', title: 'Symmetric Encryption', category: 'crypto', description: 'AES modes (ECB, CBC, GCM), key derivation, padding oracles, and common pitfalls.', difficulty: 'hard', planAccess: 'pro', status: 'not_started' },
  { id: '12', lessonKey: 'crypto-asymmetric', title: 'Asymmetric Encryption & Signatures', category: 'crypto', description: 'RSA, ECDSA, key exchange (DH, ECDH), digital signatures, and PKI.', difficulty: 'hard', planAccess: 'pro', status: 'not_started' },
  { id: '13', lessonKey: 'cloud-iam', title: 'Cloud IAM & Privilege Escalation', category: 'cloud', description: 'AWS/GCP/Azure IAM misconfigurations, excessive permissions, and lateral movement.', difficulty: 'hard', planAccess: 'pro', status: 'not_started' },
  { id: '14', lessonKey: 'forensics-log-analysis', title: 'Log Analysis & Threat Hunting', category: 'forensics', description: 'SIEM, log correlation, IOC extraction, and forensic artifact analysis.', difficulty: 'hard', planAccess: 'pro', status: 'not_started' },
];

const STATIC_CTF: CTFChallenge[] = [
  { id: 'c1', challengeKey: 'sql-injection-1', title: 'Login Bypass', category: 'web', difficulty: 'easy', description: 'A login form with a classic SQL injection vulnerability. Extract the admin credentials.', points: 100, solved: false, attempts: 0 },
  { id: 'c2', challengeKey: 'xss-stored-1', title: 'Comment Box', category: 'web', difficulty: 'easy', description: 'A blog with a stored XSS vulnerability. Steal the admin\'s session cookie.', points: 150, solved: false, attempts: 0 },
  { id: 'c3', challengeKey: 'rsa-weak-1', title: 'Weak RSA', category: 'crypto', difficulty: 'medium', description: 'A server using RSA with a small modulus. Factor the key and decrypt the message.', points: 200, solved: false, attempts: 0 },
  { id: 'c4', challengeKey: 'forensics-pcap-1', title: 'Suspicious Traffic', category: 'forensics', difficulty: 'medium', description: 'Analyze a PCAP file to find credentials exfiltrated over DNS.', points: 250, solved: false, attempts: 0 },
  { id: 'c5', challengeKey: 'reverse-1', title: 'License Check', category: 'reverse', difficulty: 'medium', description: 'A binary with a license key validation. Reverse engineer to find or bypass the check.', points: 300, solved: false, attempts: 0 },
];

const CERT_ROADMAP = [
  { cert: 'CompTIA Security+', level: 'Beginner', months: '2-3', focus: 'Security fundamentals, risk management, cryptography basics', color: 'border-green-500/30 bg-green-500/5' },
  { cert: 'CEH', level: 'Intermediate', months: '3-4', focus: 'Ethical hacking methodology, penetration testing, vulnerability assessment', color: 'border-yellow-500/30 bg-yellow-500/5' },
  { cert: 'OSCP', level: 'Advanced', months: '6-12', focus: 'Hands-on penetration testing, exploit development, report writing', color: 'border-orange-500/30 bg-orange-500/5' },
  { cert: 'CISSP', level: 'Expert', months: '12+', focus: 'Security management, architecture, 8 domains of knowledge', color: 'border-red-500/30 bg-red-500/5' },
];

const DIFF_COLOR: Record<string, string> = {
  easy: 'text-green-400 bg-green-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  hard: 'text-red-400 bg-red-500/10',
};

export function CybersecurityPage() {
  const session = getSession();
  const [lessons, setLessons] = useState<SecurityLesson[]>(STATIC_LESSONS);
  const [ctf, setCTF] = useState<CTFChallenge[]>(STATIC_CTF);
  const [progress, setProgress] = useState<SecProgress | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'ctf' | 'certs'>('learn');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<{ lessons: SecurityLesson[] }>('/security-learn/lessons', { token: session.accessToken })
      .then((d) => { if (d.lessons.length > 0) setLessons(d.lessons); })
      .catch(() => {});
    apiRequest<{ challenges: CTFChallenge[] }>('/security-learn/ctf', { token: session.accessToken })
      .then((d) => { if (d.challenges.length > 0) setCTF(d.challenges); })
      .catch(() => {});
    apiRequest<SecProgress>('/security-learn/progress', { token: session.accessToken })
      .then(setProgress)
      .catch(() => {});
  }, [session?.accessToken]);

  const cats = ['all', ...Object.keys(CATEGORY_META)];
  const filteredLessons = activeCategory === 'all' ? lessons : lessons.filter((l) => l.category === activeCategory);

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="mb-10 p-10 bg-surface-container rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-32 w-64 h-64 bg-orange-500/5 blur-[80px] rounded-full" />
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <Icon name="shield" className="text-red-400" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tighter">Cybersecurity</h1>
                  <p className="text-on-surface-variant text-sm mt-0.5">OWASP · Ethical Hacking · CTF Challenges · Certifications</p>
                </div>
              </div>
              <div className="flex gap-6 mt-8">
                <div>
                  <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">Lessons Done</p>
                  <p className="text-2xl font-bold">{progress?.lessons.completed ?? 0}<span className="text-zinc-500 text-base">/{progress?.lessons.total ?? 14}</span></p>
                </div>
                <div className="border-l border-outline-variant/20 pl-6">
                  <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">CTF Solved</p>
                  <p className="text-2xl font-bold">{progress?.ctf.solved ?? 0}<span className="text-zinc-500 text-base">/{progress?.ctf.total ?? 5}</span></p>
                </div>
                <div className="border-l border-outline-variant/20 pl-6">
                  <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant mb-1">CTF Points</p>
                  <p className="text-2xl font-bold text-red-400">{progress?.ctf.points ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                <Icon name="warning" size={14} />
                Ethical use only. Never attack systems without authorization.
              </div>
              <div className="bg-surface-container-high rounded-xl p-4 text-xs text-zinc-400">
                All labs are in isolated sandboxed environments
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-surface-container rounded-xl p-1 w-fit">
          {(['learn', 'ctf', 'certs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-primary-container text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'learn' ? 'Learn' : tab === 'ctf' ? 'CTF Challenges' : 'Certifications'}
            </button>
          ))}
        </div>

        {/* Learn Tab */}
        {activeTab === 'learn' && (
          <div>
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-6">
              {cats.map((cat) => {
                const meta = CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      activeCategory === cat
                        ? `${meta?.bg ?? 'bg-zinc-500/10'} ${meta?.color ?? 'text-zinc-300'} border-current/30`
                        : 'text-zinc-500 hover:text-zinc-300 border-zinc-800/50'
                    }`}
                  >
                    {meta?.label ?? 'All'}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLessons.map((lesson) => {
                const catMeta = CATEGORY_META[lesson.category] ?? { icon: 'security', color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: lesson.category };
                const locked = lesson.planAccess === 'pro' || lesson.planAccess === 'elite';
                return (
                  <div key={lesson.id} className={`bg-surface-container rounded-xl p-6 transition-all ${locked ? 'opacity-70' : 'hover:bg-surface-container-high'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${catMeta.bg} rounded-lg flex items-center justify-center`}>
                          <Icon name={catMeta.icon} className={catMeta.color} size={16} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${catMeta.color}`}>{catMeta.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {locked && <span className="text-[9px] font-bold bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-full uppercase tracking-widest">Pro</span>}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[lesson.difficulty] ?? 'text-zinc-400 bg-zinc-500/10'}`}>
                          {lesson.difficulty}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold mb-2">{lesson.title}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-2">{lesson.description}</p>
                    {lesson.status === 'completed' && (
                      <div className="flex items-center gap-1 text-green-400 text-[10px] font-bold">
                        <Icon name="check_circle" size={12} filled /> Completed
                      </div>
                    )}
                    {locked ? (
                      <Link to="/plans" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary-container flex items-center gap-1">
                        <Icon name="upgrade" size={12} />Upgrade
                      </Link>
                    ) : (
                      <button className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${catMeta.color} hover:brightness-125`}>
                        Start Lesson <Icon name="arrow_forward" size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTF Tab */}
        {activeTab === 'ctf' && (
          <div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Icon name="emoji_events" className="text-yellow-400" size={20} />
              <p className="text-sm text-yellow-400">Capture The Flag challenges use sandboxed environments. Submit flags in <code className="bg-black/20 px-1 rounded">EYF&#123;...&#125;</code> format.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ctf.map((c) => {
                const catMeta = CATEGORY_META[c.category] ?? { icon: 'bug_report', color: 'text-zinc-400', bg: 'bg-zinc-500/10', label: c.category };
                return (
                  <div key={c.id} className={`bg-surface-container rounded-xl p-6 transition-all hover:bg-surface-container-high ${c.solved ? 'border border-green-500/20' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 ${catMeta.bg} rounded-xl flex items-center justify-center`}>
                        <Icon name={catMeta.icon} className={catMeta.color} size={20} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {c.solved && <Icon name="emoji_events" className="text-yellow-400" size={18} filled />}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFF_COLOR[c.difficulty] ?? ''}`}>{c.difficulty}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${catMeta.color}`}>{catMeta.label}</span>
                    </div>
                    <h3 className="text-base font-bold mb-2">{c.title}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-2">{c.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-400 font-bold text-sm">{c.points} pts</span>
                      {c.solved ? (
                        <span className="text-green-400 text-[10px] font-bold flex items-center gap-1"><Icon name="check_circle" size={12} filled /> Solved</span>
                      ) : (
                        <button className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${catMeta.color}`}>
                          Attempt <Icon name="arrow_forward" size={12} />
                        </button>
                      )}
                    </div>
                    {c.attempts > 0 && !c.solved && (
                      <p className="text-[10px] text-zinc-600 mt-2">{c.attempts} attempt{c.attempts > 1 ? 's' : ''}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certs' && (
          <div>
            <p className="text-on-surface-variant text-sm mb-8 max-w-2xl">
              EYF maps its curriculum directly to industry certifications. Each certification track includes the relevant lessons, practice labs, and exam prep resources.
            </p>
            <div className="space-y-4">
              {CERT_ROADMAP.map((cert, i) => (
                <div key={cert.cert} className={`rounded-xl p-6 border ${cert.color} transition-all hover:brightness-110`}>
                  <div className="flex items-start gap-6">
                    <div className="w-10 h-10 bg-surface-container-highest rounded-xl flex items-center justify-center text-lg font-black text-zinc-400 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold">{cert.cert}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-surface-container-high px-2 py-0.5 rounded-full text-zinc-400">{cert.level}</span>
                        <span className="text-[10px] font-bold text-zinc-500">{cert.months} months prep</span>
                      </div>
                      <p className="text-sm text-on-surface-variant">{cert.focus}</p>
                    </div>
                    <button className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-primary-container hover:underline flex items-center gap-1">
                      View Path <Icon name="arrow_forward" size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-surface-container rounded-xl p-6">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Icon name="info" className="text-blue-400" size={16} />Certification Disclaimer</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                EYF prepares you for certification exams but does not issue official certificates. Official certifications must be obtained through the respective governing bodies (CompTIA, EC-Council, Offensive Security, (ISC)²).
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
