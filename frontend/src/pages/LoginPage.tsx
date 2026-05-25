import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { ApiError, apiRequest } from '../lib/api';
import { setSession } from '../lib/session';
import { Icon } from '../components/Icon';
import { EYFMark } from '../components/EYFLogo';
import type { Role } from '../types';

interface AuthResponse {
  accessToken: string;
  require2FA?: boolean;
  user: { role: Role; email: string; name?: string };
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_cancelled: 'Google sign-in was cancelled.',
  oauth_failed:    'Google sign-in failed. Please try again.',
  oauth_no_email:  'No email returned from Google.',
  oauth_error:     'An error occurred during Google sign-in.',
};

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function ErrorBanner({ message }: { readonly message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.25 }}
      role="alert"
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
      style={{
        background: 'rgba(232,25,44,0.08)',
        color: '#FF5566',
        border: '1px solid rgba(232,25,44,0.2)',
        boxShadow: '0 0 16px rgba(232,25,44,0.08)',
      }}
    >
      <Icon name="error_outline" size={14} aria-hidden="true" />
      {message}
    </motion.div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      <span className="text-xs font-medium" style={{ color: 'var(--t4)' }}>or</span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}

/* ── Animated stat on left panel ───────────────────────────────────────────── */

function AnimStat({ stat, label, delay }: { readonly stat: string; readonly label: string; readonly delay: number }) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <span
        className="text-2xl font-black"
        style={{
          color: '#E82127',
          letterSpacing: '-0.04em',
          textShadow: '0 0 20px rgba(232,25,44,0.5)',
        }}
      >{stat}</span>
      <span className="text-sm" style={{ color: 'var(--t3)' }}>{label}</span>
    </motion.div>
  );
}

export function LoginPage() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab     = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [tab, setTab]  = useState<'login' | 'register'>(defaultTab);

  const oauthErrorKey = searchParams.get('error');
  const oauthError    = oauthErrorKey ? (OAUTH_ERROR_MESSAGES[oauthErrorKey] ?? 'Sign-in failed.') : null;

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [totpCode,    setTotpCode]    = useState('');
  const [require2FA,  setRequire2FA]  = useState(false);
  const [error,       setError]       = useState<string | null>(oauthError);
  const [loading,     setLoading]     = useState(false);

  const [regName,     setRegName]     = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm,  setRegConfirm]  = useState('');
  const [regError,    setRegError]    = useState<string | null>(null);
  const [regLoading,  setRegLoading]  = useState(false);

  /* Mouse parallax for left panel */
  const panelMx = useMotionValue(0);
  const panelMy = useMotionValue(0);
  const blobX = useSpring(panelMx, { stiffness: 40, damping: 18 });
  const blobY = useSpring(panelMy, { stiffness: 40, damping: 18 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      panelMx.set((e.clientX / globalThis.innerWidth  - 0.5) * 60);
      panelMy.set((e.clientY / globalThis.innerHeight - 0.5) * 40);
    }
    globalThis.addEventListener('mousemove', onMove);
    return () => globalThis.removeEventListener('mousemove', onMove);
  }, [panelMx, panelMy]);

  const onLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const result = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password, ...(require2FA ? { totpCode } : {}) },
      });
      if (result.require2FA) { setRequire2FA(true); setLoading(false); return; }
      setSession({ accessToken: result.accessToken, role: result.user.role, zone: 'public', email: result.user.email });
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (regPassword !== regConfirm) { setRegError('Passwords do not match.'); return; }
    setRegLoading(true); setRegError(null);
    try {
      const result = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { name: regName, email: regEmail, password: regPassword },
      });
      setSession({ accessToken: result.accessToken, role: result.user.role, zone: 'public', email: result.user.email });
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setRegError(err instanceof ApiError ? err.message : 'Unable to register.');
    } finally {
      setRegLoading(false);
    }
  };

  const submitLabel = require2FA ? 'Verify code' : 'Sign in';

  return (
    <div className="min-h-screen flex" style={{ background: '#020202' }}>

      {/* ── Left branding panel ──────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[480px] shrink-0 flex-col justify-between p-12"
        style={{ position: 'relative', overflow: 'hidden', background: '#050505' }}
      >
        {/* Top red accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(232,25,44,0.8) 40%, rgba(232,25,44,0.4) 70%, transparent)',
        }} />

        {/* Vertical right separator */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 1,
          background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.05) 20%, rgba(255,255,255,0.05) 80%, transparent)',
        }} />

        {/* Mouse-parallax ambient blob */}
        <motion.div
          style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,25,44,0.12) 0%, transparent 70%)',
            filter: 'blur(40px)',
            left: '50%', top: '40%',
            translateX: blobX,
            translateY: blobY,
            pointerEvents: 'none',
          }}
        />

        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        {/* Content */}
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <EYFMark size={22} />
          <span className="font-black tracking-tight text-base" style={{ color: '#F0F0F0' }}>EYF</span>
        </motion.div>

        <motion.div style={{ position: 'relative', zIndex: 1 }}>
          <motion.blockquote
            className="text-3xl font-bold leading-tight mb-8"
            style={{ letterSpacing: '-0.03em', color: '#E8E8E8' }}
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            "The structured path<br />to your first<br />
            <span style={{
              color: '#E82127',
              textShadow: '0 0 30px rgba(232,25,44,0.5)',
            }}>tech offer.</span>"
          </motion.blockquote>

          <div className="space-y-4">
            <AnimStat stat="12,000+" label="Students enrolled"      delay={0.3} />
            <AnimStat stat="450+"    label="DSA problems"            delay={0.4} />
            <AnimStat stat="94%"     label="Placement success rate"  delay={0.5} />
          </div>
        </motion.div>

        <motion.p
          className="text-xs"
          style={{ color: 'rgba(255,255,255,0.15)', position: 'relative', zIndex: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          © 2026 EYF · Engineer Your Future
        </motion.p>
      </div>

      {/* ── Right — auth form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ position: 'relative' }}>
        {/* Ambient glow behind form */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,25,44,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        {/* Mobile header */}
        <header
          className="flex items-center justify-between px-6 h-14 lg:hidden"
          style={{ borderBottom: '1px solid var(--border)', background: 'rgba(4,4,4,0.9)', backdropFilter: 'blur(16px)' }}
        >
          <Link to="/" className="flex items-center gap-2 group" aria-label="EYF home">
            <EYFMark size={20} />
            <span className="text-sm font-black tracking-tight" style={{ color: 'var(--t1)' }}>EYF</span>
          </Link>
          <Link
            to="/authority/login"
            className="text-xs transition-colors"
            style={{ color: 'var(--t4)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t4)')}
          >
            Authority login →
          </Link>
        </header>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center p-6" style={{ position: 'relative', zIndex: 1 }}>
          <div className="w-full max-w-[400px]">

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1
                    className="text-2xl font-bold mb-1.5"
                    style={{
                      color: 'var(--t1)',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {tab === 'login' ? 'Welcome back' : 'Create an account'}
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--t3)' }}>
                    {tab === 'login'
                      ? 'Sign in to continue your preparation.'
                      : 'Join 12,000+ students preparing for placements.'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(8,8,8,0.85)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(24px) saturate(160%)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              {/* Tab switcher */}
              <div
                className="flex mb-6 rounded-xl p-0.5"
                style={{ background: 'rgba(255,255,255,0.04)' }}
                role="tablist"
                aria-label="Authentication mode"
              >
                {(['login', 'register'] as const).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => { setTab(t); setError(null); setRegError(null); }}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={tab === t
                      ? {
                          background: 'rgba(232,25,44,0.12)',
                          color: '#FF4455',
                          border: '1px solid rgba(232,25,44,0.2)',
                          boxShadow: '0 0 12px rgba(232,25,44,0.15)',
                        }
                      : { color: 'var(--t3)', border: '1px solid transparent' }
                    }
                  >
                    {t === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === 'login' ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.22 }}
                    onSubmit={onLogin}
                    className="space-y-4"
                  >
                    {require2FA ? (
                      <div>
                        <label htmlFor="login-totp" className="field-label">Authenticator code</label>
                        <input
                          id="login-totp" type="text" inputMode="numeric" maxLength={6}
                          value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                          className="field-input text-center tracking-[0.4em] text-xl font-bold"
                          placeholder="000000" required autoFocus
                        />
                        <p className="text-xs mt-1.5" style={{ color: 'var(--t4)' }}>
                          Enter the 6-digit code from your authenticator app.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label htmlFor="login-email" className="field-label">Email</label>
                          <input
                            id="login-email" type="email" value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="field-input" placeholder="you@example.com" required
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="login-password" className="field-label" style={{ marginBottom: 0 }}>Password</label>
                            <Link
                              to="/forgot-password"
                              className="text-xs transition-colors"
                              style={{ color: 'var(--t4)' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t4)')}
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <input
                            id="login-password" type="password" value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="field-input" placeholder="••••••••••" required
                          />
                        </div>
                      </>
                    )}

                    {error && <ErrorBanner message={error} />}

                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-full"
                      whileHover={{ boxShadow: '0 0 24px rgba(232,25,44,0.4), 0 4px 12px rgba(0,0,0,0.4)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? 'Signing in…' : submitLabel}
                      {!loading && <Icon name="arrow_forward" size={15} aria-hidden="true" />}
                    </motion.button>

                    {!require2FA && (
                      <>
                        <Divider />
                        <a
                          href="/api/auth/google"
                          className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            color: 'var(--t2)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                        >
                          <GoogleIcon />
                          Continue with Google
                        </a>
                      </>
                    )}
                  </motion.form>
                ) : (
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}
                    onSubmit={onRegister}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="reg-name" className="field-label">Full name</label>
                      <input id="reg-name" type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                        className="field-input" placeholder="John Engineer" required />
                    </div>
                    <div>
                      <label htmlFor="reg-email" className="field-label">Email</label>
                      <input id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                        className="field-input" placeholder="you@example.com" required />
                    </div>
                    <div>
                      <label htmlFor="reg-password" className="field-label">Password</label>
                      <input id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                        className="field-input" placeholder="••••••••••" required />
                    </div>
                    <div>
                      <label htmlFor="reg-confirm" className="field-label">Confirm password</label>
                      <input id="reg-confirm" type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)}
                        className="field-input" placeholder="••••••••••" required />
                    </div>

                    {regError && <ErrorBanner message={regError} />}

                    <motion.button
                      type="submit"
                      disabled={regLoading}
                      className="btn btn-primary w-full"
                      whileHover={{ boxShadow: '0 0 24px rgba(232,25,44,0.4), 0 4px 12px rgba(0,0,0,0.4)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {regLoading ? 'Creating account…' : 'Create account'}
                      {!regLoading && <Icon name="arrow_forward" size={15} aria-hidden="true" />}
                    </motion.button>

                    <Divider />

                    <a
                      href="/api/auth/google"
                      className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--t2)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                      <GoogleIcon />
                      Sign up with Google
                    </a>

                    <p className="text-xs text-center" style={{ color: 'var(--t4)' }}>
                      By creating an account you agree to our{' '}
                      <Link to="/terms" className="underline underline-offset-2 transition-opacity hover:opacity-70">Terms</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="underline underline-offset-2 transition-opacity hover:opacity-70">Privacy Policy</Link>.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Desktop authority link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-5 text-center text-xs"
              style={{ color: 'var(--t4)' }}
            >
              <Link
                to="/authority/login"
                className="transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t2)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t4)')}
              >
                Authority login →
              </Link>
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
