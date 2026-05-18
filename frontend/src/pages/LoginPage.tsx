import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  oauth_failed: 'Google sign-in failed. Please try again.',
  oauth_no_email: 'No email returned from Google.',
  oauth_error: 'An error occurred during Google sign-in.',
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  const oauthErrorKey = searchParams.get('error');
  const oauthError = oauthErrorKey ? (OAUTH_ERROR_MESSAGES[oauthErrorKey] ?? 'Sign-in failed.') : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [error, setError] = useState<string | null>(oauthError);
  const [loading, setLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  const onLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
    setRegLoading(true);
    setRegError(null);
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

  const inputClass = "w-full rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 transition-all duration-200 bg-white/4 border border-white/8 focus:border-white/20 focus:ring-white/10 focus:bg-white/6";

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-hidden relative">
      {/* Orbs */}
      <div className="orb orb-red w-[500px] h-[500px] top-[-80px] left-[-80px] opacity-12 pointer-events-none" />
      <div className="orb orb-purple w-[400px] h-[400px] bottom-[-60px] right-[-60px] opacity-10 pointer-events-none" />
      <div className="grid-bg absolute inset-0 opacity-25 pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-14">
        <Link to="/" className="flex items-center gap-2 group">
          <EYFMark size={24} className="text-[#080808] group-hover:scale-110 transition-transform duration-300" />
          <span className="font-black tracking-tight text-white">EYF</span>
        </Link>
        <Link
          to="/authority/login"
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Authority Login →
        </Link>
      </header>

      {/* Main */}
      <main className="relative min-h-screen flex items-center justify-center p-6 pt-20">
        <div className="w-full max-w-md">
          {/* Logo + headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-black tracking-tight mb-3">
              Engineer Your <span className="gradient-text">Future.</span>
            </h1>
            <p className="text-white/35 text-sm leading-relaxed">
              Master DSA, system design, OOP and land your dream role.
            </p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-heavy rounded-2xl p-7 border border-white/8"
          >
            {/* Tab switcher */}
            <div className="flex gap-1 mb-7 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {(['login', 'register'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(null); setRegError(null); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize"
                  style={tab === t
                    ? { background: '#E8192C', color: '#fff', boxShadow: '0 4px 16px rgba(232,25,44,0.3)' }
                    : { color: 'rgba(255,255,255,0.35)' }
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
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={onLogin}
                  className="space-y-4"
                >
                  {!require2FA ? (
                    <>
                      <div>
                        <label htmlFor="login-email" className="block text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5 px-1">Email</label>
                        <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          className={inputClass} placeholder="you@example.com" required />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5 px-1">
                          <label htmlFor="login-password" className="text-[9px] font-bold uppercase tracking-widest text-white/30">Password</label>
                          <Link to="/forgot-password" className="text-[9px] text-white/25 hover:text-white/50 transition-colors">Forgot?</Link>
                        </div>
                        <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                          className={inputClass} placeholder="••••••••••" required />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label htmlFor="login-totp" className="block text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5 px-1">Authenticator Code</label>
                      <input id="login-totp" type="text" inputMode="numeric" maxLength={6} value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                        className={`${inputClass} text-center tracking-[0.5em] text-xl font-black`}
                        placeholder="000000" required autoFocus />
                      <p className="text-[10px] text-white/25 mt-2 px-1">Enter the 6-digit code from your authenticator app.</p>
                    </div>
                  )}

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                      style={{ background: 'rgba(232,25,44,0.1)', color: '#ff8080', border: '1px solid rgba(232,25,44,0.2)' }}>
                      <Icon name="error_outline" size={14} />
                      {error}
                    </motion.div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: '#E8192C', boxShadow: '0 4px 24px rgba(232,25,44,0.35)' }}>
                    {loading ? 'Signing in…' : require2FA ? 'Verify code' : 'Sign in'}
                    {!loading && <Icon name="arrow_forward" size={16} />}
                  </button>

                  {!require2FA && (
                    <>
                      <div className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-white/6" />
                        <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">or</span>
                        <div className="flex-1 h-px bg-white/6" />
                      </div>
                      <a href="/api/auth/google"
                        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm text-zinc-900 bg-white hover:bg-zinc-100 transition-all duration-200 hover:scale-[1.02]">
                        <GoogleIcon />
                        Continue with Google
                      </a>
                    </>
                  )}
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={onRegister}
                  className="space-y-4"
                >
                  {[
                    { label: 'Full Name', value: regName, setter: setRegName, type: 'text', placeholder: 'John Engineer' },
                    { label: 'Email', value: regEmail, setter: setRegEmail, type: 'email', placeholder: 'you@example.com' },
                    { label: 'Password', value: regPassword, setter: setRegPassword, type: 'password', placeholder: '••••••••••' },
                    { label: 'Confirm Password', value: regConfirm, setter: setRegConfirm, type: 'password', placeholder: '••••••••••' },
                  ].map(({ label, value, setter, type, placeholder }) => (
                    <div key={label}>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5 px-1">{label}</label>
                      <input type={type} value={value} onChange={(e) => setter(e.target.value)}
                        className={inputClass} placeholder={placeholder} required />
                    </div>
                  ))}

                  {regError && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                      style={{ background: 'rgba(232,25,44,0.1)', color: '#ff8080', border: '1px solid rgba(232,25,44,0.2)' }}>
                      <Icon name="error_outline" size={14} />
                      {regError}
                    </motion.div>
                  )}

                  <button type="submit" disabled={regLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: '#E8192C', boxShadow: '0 4px 24px rgba(232,25,44,0.35)' }}>
                    {regLoading ? 'Creating…' : 'Create account'}
                    {!regLoading && <Icon name="arrow_forward" size={16} />}
                  </button>

                  <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-white/6" />
                    <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">or</span>
                    <div className="flex-1 h-px bg-white/6" />
                  </div>
                  <a href="/api/auth/google"
                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-sm text-zinc-900 bg-white hover:bg-zinc-100 transition-all duration-200 hover:scale-[1.02]">
                    <GoogleIcon />
                    Sign up with Google
                  </a>

                  <p className="text-[10px] text-white/20 text-center leading-relaxed">
                    By creating an account you agree to our Terms of Service and Privacy Policy.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-6 flex items-center justify-center gap-3 text-[9px] text-white/15 uppercase tracking-widest"
          >
            <span>EYF Platform</span>
            <span>·</span>
            <span>Secure Login</span>
            <span>·</span>
            <span style={{ color: '#22C55E' }}>Live</span>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
