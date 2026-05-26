import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/PageHeader';
import { apiRequest, ApiError } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

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

const CATEGORY_META: Record<string, { icon: string; color: string; glow: string; label: string }> = {
  owasp:    { icon: 'security',   color: '#f87171', glow: 'rgba(248,113,113,0.14)', label: 'OWASP Top 10' },
  web:      { icon: 'language',   color: '#fb923c', glow: 'rgba(251,146,60,0.14)',  label: 'Web Security' },
  network:  { icon: 'router',     color: '#facc15', glow: 'rgba(250,204,21,0.14)',  label: 'Network Security' },
  crypto:   { icon: 'lock',       color: '#60a5fa', glow: 'rgba(96,165,250,0.14)',  label: 'Cryptography' },
  cloud:    { icon: 'cloud',      color: '#22d3ee', glow: 'rgba(34,211,238,0.14)',  label: 'Cloud Security' },
  forensics:{ icon: 'search',     color: '#c084fc', glow: 'rgba(192,132,252,0.14)', label: 'Digital Forensics' },
  malware:  { icon: 'bug_report', color: '#f472b6', glow: 'rgba(244,114,182,0.14)', label: 'Malware Analysis' },
};

const DIFF_STYLE: Record<string, { color: string; bg: string }> = {
  easy:   { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  medium: { color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

const STATIC_LESSONS: SecurityLesson[] = [
  { id: '1',  lessonKey: 'owasp-injection',        title: 'Injection Attacks',                   category: 'owasp',     description: 'SQL, NoSQL, OS, LDAP injection flaws. Learn how attackers manipulate queries and how to prevent them.', difficulty: 'easy',   planAccess: 'free', status: 'not_started' },
  { id: '2',  lessonKey: 'owasp-broken-auth',      title: 'Broken Authentication',               category: 'owasp',     description: 'Credential stuffing, brute force, session fixation, and insecure token storage vulnerabilities.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '3',  lessonKey: 'owasp-xss',              title: 'Cross-Site Scripting (XSS)',          category: 'owasp',     description: 'Stored, reflected, and DOM-based XSS. Content Security Policy and input sanitization.', difficulty: 'easy',   planAccess: 'free', status: 'not_started' },
  { id: '4',  lessonKey: 'owasp-idor',             title: 'Insecure Direct Object References',   category: 'owasp',     description: 'IDOR vulnerabilities, object-level authorization, and horizontal privilege escalation.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '5',  lessonKey: 'owasp-security-misconfig',title: 'Security Misconfiguration',          category: 'owasp',     description: 'Default credentials, exposed admin panels, unnecessary features, and verbose error messages.', difficulty: 'easy',   planAccess: 'free', status: 'not_started' },
  { id: '6',  lessonKey: 'web-csrf',               title: 'Cross-Site Request Forgery',          category: 'web',       description: 'CSRF attacks, SameSite cookies, CSRF tokens, and double-submit cookie pattern.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '7',  lessonKey: 'web-cors',               title: 'CORS & Same-Origin Policy',           category: 'web',       description: 'Origin policies, preflight requests, CORS misconfiguration exploits and secure configurations.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '8',  lessonKey: 'web-headers',            title: 'Security Headers',                    category: 'web',       description: 'HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and their impact.', difficulty: 'easy',   planAccess: 'free', status: 'not_started' },
  { id: '9',  lessonKey: 'network-tls',            title: 'TLS & PKI',                           category: 'network',   description: 'TLS handshake, certificate chains, pinning, MITM attacks, and downgrade attacks.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '10', lessonKey: 'network-firewalls',      title: 'Firewalls & IDS/IPS',                 category: 'network',   description: 'Stateful vs stateless firewalls, intrusion detection, WAF rules, and network segmentation.', difficulty: 'medium', planAccess: 'free', status: 'not_started' },
  { id: '11', lessonKey: 'crypto-symmetric',       title: 'Symmetric Encryption',                category: 'crypto',    description: 'AES modes (ECB, CBC, GCM), key derivation, padding oracles, and common pitfalls.', difficulty: 'hard',   planAccess: 'pro',  status: 'not_started' },
  { id: '12', lessonKey: 'crypto-asymmetric',      title: 'Asymmetric Encryption & Signatures',  category: 'crypto',    description: 'RSA, ECDSA, key exchange (DH, ECDH), digital signatures, and PKI.', difficulty: 'hard',   planAccess: 'pro',  status: 'not_started' },
  { id: '13', lessonKey: 'cloud-iam',              title: 'Cloud IAM & Privilege Escalation',    category: 'cloud',     description: 'AWS/GCP/Azure IAM misconfigurations, excessive permissions, and lateral movement.', difficulty: 'hard',   planAccess: 'pro',  status: 'not_started' },
  { id: '14', lessonKey: 'forensics-log-analysis', title: 'Log Analysis & Threat Hunting',       category: 'forensics', description: 'SIEM, log correlation, IOC extraction, and forensic artifact analysis.', difficulty: 'hard',   planAccess: 'pro',  status: 'not_started' },
];

const STATIC_CTF: CTFChallenge[] = [
  { id: 'c1', challengeKey: 'sql-injection-1', title: 'Login Bypass',        category: 'web',       difficulty: 'easy',   description: "A login form with a classic SQL injection vulnerability. Extract the admin credentials.", points: 100, solved: false, attempts: 0 },
  { id: 'c2', challengeKey: 'xss-stored-1',    title: 'Comment Box',          category: 'web',       difficulty: 'easy',   description: "A blog with a stored XSS vulnerability. Steal the admin's session cookie.", points: 150, solved: false, attempts: 0 },
  { id: 'c3', challengeKey: 'rsa-weak-1',      title: 'Weak RSA',             category: 'crypto',    difficulty: 'medium', description: 'A server using RSA with a small modulus. Factor the key and decrypt the message.', points: 200, solved: false, attempts: 0 },
  { id: 'c4', challengeKey: 'forensics-pcap-1',title: 'Suspicious Traffic',   category: 'forensics', difficulty: 'medium', description: 'Analyze a PCAP file to find credentials exfiltrated over DNS.', points: 250, solved: false, attempts: 0 },
  { id: 'c5', challengeKey: 'reverse-1',       title: 'License Check',        category: 'reverse',   difficulty: 'medium', description: 'A binary with a license key validation. Reverse engineer to find or bypass the check.', points: 300, solved: false, attempts: 0 },
];

const CERT_ROADMAP = [
  { cert: 'CompTIA Security+', level: 'Beginner',     months: '2-3',  focus: 'Security fundamentals, risk management, cryptography basics', borderColor: 'rgba(74,222,128,0.25)',  bg: 'rgba(74,222,128,0.04)'  },
  { cert: 'CEH',               level: 'Intermediate', months: '3-4',  focus: 'Ethical hacking methodology, penetration testing, vulnerability assessment', borderColor: 'rgba(250,204,21,0.25)', bg: 'rgba(250,204,21,0.04)' },
  { cert: 'OSCP',              level: 'Advanced',     months: '6-12', focus: 'Hands-on penetration testing, exploit development, report writing', borderColor: 'rgba(251,146,60,0.25)',  bg: 'rgba(251,146,60,0.04)'  },
  { cert: 'CISSP',             level: 'Expert',       months: '12+',  focus: 'Security management, architecture, 8 domains of knowledge', borderColor: 'rgba(248,113,113,0.25)', bg: 'rgba(248,113,113,0.04)' },
];

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

export function CybersecurityPage() {
  const session = getSession();
  const { fireXP } = useUser();
  const [lessons, setLessons] = useState<SecurityLesson[]>(STATIC_LESSONS);
  const [ctf, setCTF] = useState<CTFChallenge[]>(STATIC_CTF);
  const [progress, setProgress] = useState<SecProgress | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'ctf' | 'certs'>('learn');
  const [activeCategory, setActiveCategory] = useState('all');
  const [flagInput, setFlagInput] = useState<Record<string, string>>({});
  const [flagError, setFlagError] = useState<Record<string, string>>({});
  const [submittingFlag, setSubmittingFlag] = useState<string | null>(null);

  const submitFlag = async (challenge: CTFChallenge) => {
    const flag = flagInput[challenge.id]?.trim();
    if (!flag || !session?.accessToken) return;
    setSubmittingFlag(challenge.id);
    setFlagError((prev) => ({ ...prev, [challenge.id]: '' }));
    try {
      await apiRequest(`/security-learn/ctf/${challenge.challengeKey}/submit`, {
        method: 'POST', body: { flag }, token: session.accessToken,
      });
      setCTF((prev) => prev.map((c) => c.id === challenge.id ? { ...c, solved: true } : c));
      setFlagInput((prev) => ({ ...prev, [challenge.id]: '' }));
      fireXP(challenge.points, `Flag captured: ${challenge.title}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Incorrect flag. Try again!';
      setFlagError((prev) => ({ ...prev, [challenge.id]: msg }));
    } finally {
      setSubmittingFlag(null);
    }
  };

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
        <PageHeader
          eyebrow="Security Training"
          title="Cybersecurity."
          subtitle="OWASP · Ethical Hacking · CTF Challenges · Certifications"
          accentColor="#f87171"
          stats={[
            { value: `${progress?.lessons.completed ?? 0}/${progress?.lessons.total ?? 14}`, label: 'Lessons Done', color: '#f87171' },
            { value: `${progress?.ctf.solved ?? 0}/${progress?.ctf.total ?? 5}`,             label: 'CTF Solved',   color: '#fb923c' },
            { value: String(progress?.ctf.points ?? 0),                                       label: 'CTF Points',   color: '#facc15' },
          ]}
        />

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 w-fit " style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {(['learn', 'ctf', 'certs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all"
              style={{
                background: activeTab === tab ? 'rgba(232,25,44,0.15)' : 'transparent',
                color: activeTab === tab ? '#ff4d5a' : 'rgba(255,255,255,0.3)',
                border: activeTab === tab ? '1px solid rgba(232,25,44,0.3)' : '1px solid transparent',
                boxShadow: activeTab === tab ? '0 0 12px rgba(232,25,44,0.12)' : 'none',
              }}
            >
              {{ learn: 'Learn', ctf: 'CTF Challenges', certs: 'Certifications' }[tab]}
            </button>
          ))}
        </div>

        {/* Learn Tab */}
        {activeTab === 'learn' && (
          <div>
            <div className="flex gap-1.5 flex-wrap mb-6">
              {cats.map((cat) => {
                const meta = CATEGORY_META[cat];
                const active = activeCategory === cat;
                const catBg = active ? (meta ? meta.glow : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.04)';
                const catBorder = active ? `1px solid ${meta ? meta.color + '50' : 'rgba(255,255,255,0.25)'}` : '1px solid rgba(255,255,255,0.07)';
                const catColor = active ? (meta ? meta.color : 'rgba(255,255,255,0.9)') : 'rgba(255,255,255,0.32)';
                return (
                  <motion.button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      padding: '5px 14px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                      background: catBg,
                      border: catBorder,
                      color: catColor,
                      transition: 'all 0.15s',
                    }}
                  >
                    {meta?.label ?? 'All'}
                  </motion.button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredLessons.map((lesson, i) => {
                const catMeta = CATEGORY_META[lesson.category] ?? { icon: 'security', color: 'var(--t2)', glow: 'rgba(161,161,170,0.1)', label: lesson.category };
                const diffStyle = DIFF_STYLE[lesson.difficulty] ?? { color: 'var(--t2)', bg: 'rgba(161,161,170,0.1)' };
                const locked = lesson.planAccess === 'pro' || lesson.planAccess === 'elite';
                return (
                  <motion.div
                    key={lesson.id}
                    className="p-6"
                    style={{ ...GLASS, opacity: locked ? 0.6 : 1 }}
                    initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                    whileInView={{ opacity: locked ? 0.6 : 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ duration: 0.4, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={locked ? {} : { background: 'rgba(255,255,255,0.06)', borderColor: `${catMeta.color}35`, y: -1 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center" style={{ background: catMeta.glow }}>
                          <Icon name={catMeta.icon} size={16} style={{ color: catMeta.color }} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: catMeta.color }}>{catMeta.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {locked && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#E82127', background: 'rgba(232,25,44,0.1)' }}>Pro</span>}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: diffStyle.color, background: diffStyle.bg }}>{lesson.difficulty}</span>
                      </div>
                    </div>
                    <h3 className="text-base font-bold mb-2" style={{ color: 'rgba(255,255,255,0.88)' }}>{lesson.title}</h3>
                    <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--t2)' }}>{lesson.description}</p>
                    {lesson.status === 'completed' && (
                      <div className="flex items-center gap-1 text-[10px] font-bold mb-2" style={{ color: '#4ade80' }}>
                        <Icon name="check_circle" size={12} filled /> Completed
                      </div>
                    )}
                    {locked ? (
                      <Link to="/plans" className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors" style={{ color: 'var(--t3)' }}>
                        <Icon name="upgrade" size={12} />Upgrade to unlock
                      </Link>
                    ) : (
                      <button className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: catMeta.color }}>
                        Start Lesson <Icon name="arrow_forward" size={12} />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTF Tab */}
        {activeTab === 'ctf' && (
          <div>
            <div className="p-4 mb-6 flex items-center gap-3" style={{ background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.2)' }}>
              <Icon name="emoji_events" size={20} style={{ color: '#facc15' }} />
              <p className="text-sm" style={{ color: '#facc15' }}>
                Capture The Flag challenges use sandboxed environments. Submit flags in <code className="rounded px-1" style={{ background: 'rgba(0,0,0,0.3)' }}>EYF{'{...}'}</code> format.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ctf.map((c, i) => {
                const catMeta = CATEGORY_META[c.category] ?? { icon: 'bug_report', color: 'var(--t2)', glow: 'rgba(161,161,170,0.1)', label: c.category };
                const diffStyle = DIFF_STYLE[c.difficulty] ?? { color: 'var(--t2)', bg: 'rgba(161,161,170,0.1)' };
                return (
                  <motion.div
                    key={c.id}
                    className="p-6"
                    style={{ ...GLASS, borderColor: c.solved ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)' }}
                    initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, margin: '-20px' }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ background: 'rgba(255,255,255,0.06)', y: -1 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 flex items-center justify-center" style={{ background: catMeta.glow }}>
                        <Icon name={catMeta.icon} size={20} style={{ color: catMeta.color }} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {c.solved && <Icon name="emoji_events" size={18} filled style={{ color: '#facc15' }} />}
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: diffStyle.color, background: diffStyle.bg }}>{c.difficulty}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: catMeta.color }}>{catMeta.label}</span>
                    <h3 className="text-base font-bold mt-1 mb-2" style={{ color: 'rgba(255,255,255,0.88)' }}>{c.title}</h3>
                    <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--t2)' }}>{c.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-sm" style={{ color: '#facc15' }}>{c.points} pts</span>
                      {c.solved && (
                        <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: '#4ade80' }}>
                          <Icon name="check_circle" size={12} filled /> Solved
                        </span>
                      )}
                    </div>
                    {!c.solved && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={flagInput[c.id] ?? ''}
                            onChange={(e) => setFlagInput((prev) => ({ ...prev, [c.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') { void submitFlag(c); } }}
                            placeholder="EYF{flag_here}"
                            className="flex-1 px-3 py-2 text-xs font-mono focus:outline-none transition-colors"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
                          />
                          <button
                            onClick={() => void submitFlag(c)}
                            disabled={submittingFlag === c.id || !flagInput[c.id]?.trim()}
                            className="px-3 py-2 text-xs font-black uppercase tracking-widest transition-all flex-shrink-0 disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #E82127, #ff5566)', color: 'white' }}
                          >
                            {submittingFlag === c.id ? '…' : 'Submit'}
                          </button>
                        </div>
                        {flagError[c.id] && (
                          <p className="text-[10px] font-bold flex items-center gap-1" style={{ color: '#f87171' }}>
                            <Icon name="error_outline" size={11} /> {flagError[c.id]}
                          </p>
                        )}
                        {c.attempts > 0 && (
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>{c.attempts} attempt{c.attempts === 1 ? '' : 's'}</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certs' && (
          <div>
            <p className="text-sm mb-8 max-w-2xl" style={{ color: 'var(--t2)' }}>
              EYF maps its curriculum directly to industry certifications. Each track includes relevant lessons, practice labs, and exam prep resources.
            </p>
            <div className="space-y-3">
              {CERT_ROADMAP.map((cert, i) => (
                <motion.div
                  key={cert.cert}
                  className="p-6"
                  style={{ background: cert.bg, border: `1px solid ${cert.borderColor}` }}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.005 }}
                >
                  <div className="flex items-start gap-6">
                    <div className="w-10 h-10 flex items-center justify-center text-lg font-black flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.88)' }}>{cert.cert}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: 'var(--t2)', background: 'rgba(255,255,255,0.06)' }}>{cert.level}</span>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--t3)' }}>{cert.months} months prep</span>
                      </div>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{cert.focus}</p>
                    </div>
                    <button className="flex-shrink-0 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: 'var(--t3)' }}>
                      View Path <Icon name="arrow_forward" size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div
              className="mt-6 p-6"
              style={GLASS}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                <Icon name="info" size={16} style={{ color: '#60a5fa' }} />Certification Disclaimer
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                EYF prepares you for certification exams but does not issue official certificates. Official certifications must be obtained through the respective governing bodies (CompTIA, EC-Council, Offensive Security, ISC²).
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
