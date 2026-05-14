import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import { setSession } from '../lib/session';
import { Icon } from '../components/Icon';

interface LoginResponse {
  accessToken: string;
  user: { role: 'user'; email: string; name?: string };
}
interface RegisterResponse {
  accessToken: string;
  user: { role: 'user'; email: string; name?: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
      const result = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
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
      const result = await apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: { name: regName, email: regEmail, password: regPassword },
      });
      setSession({ accessToken: result.accessToken, role: result.user.role, zone: 'public', email: result.user.email });
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setRegError(err instanceof ApiError ? err.message : 'Unable to register.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="dark bg-surface-dim text-on-surface min-h-screen overflow-hidden selection:bg-primary-container selection:text-white">
      {/* Brand header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-20 bg-gradient-to-b from-[#1F1F1F] to-transparent">
        <Link to="/" className="text-2xl font-black tracking-tighter text-[#E82127]">EYF</Link>
        <Link
          to="/authority/login"
          className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-400 hover:text-white transition-colors duration-300"
        >
          Authority Login
        </Link>
      </header>

      {/* Background glow */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -right-20 top-0 w-3/5 h-full opacity-5">
          <div className="w-full h-full bg-gradient-to-bl from-primary-container to-transparent" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dim via-surface-dim/90 to-transparent" />
      </div>

      <main className="relative h-screen w-full flex items-center justify-center p-6 md:p-12">
        <div className="relative z-10 w-full max-w-xl flex flex-col gap-12">
          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              Engineer Your <span className="text-primary-container">Future</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-md font-light leading-relaxed">
              Your all-in-one platform to master DSA, ace placements, and land your dream tech role.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-surface-container rounded-xl p-8 md:p-12 shadow-[40px_0_60px_-15px_rgba(0,0,0,0.3)]">
            {/* Tab toggle */}
            <div className="flex gap-2 mb-10 bg-surface-container-lowest p-1.5 rounded-full w-fit">
              <button
                onClick={() => setTab('login')}
                className={`px-8 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all ${tab === 'login' ? 'bg-primary-container text-white' : 'text-zinc-500 hover:text-on-surface'}`}
              >
                Login
              </button>
              <button
                onClick={() => setTab('register')}
                className={`px-8 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all ${tab === 'register' ? 'bg-primary-container text-white' : 'text-zinc-500 hover:text-on-surface'}`}
              >
                Register
              </button>
            </div>

            {tab === 'login' ? (
              <form onSubmit={onLogin} className="space-y-8">
                <div className="space-y-3">
                  <label htmlFor="login-email" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant block px-4">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-0 focus:border-b-2 focus:border-b-primary-container transition-all"
                      placeholder="you@example.com"
                      required
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600">
                      <Icon name="alternate_email" size={20} />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label htmlFor="login-password" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant block px-4">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-0 transition-all"
                      placeholder="••••••••••••"
                      required
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600">
                      <Icon name="key" size={20} />
                    </div>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 px-4 mt-2 text-error text-xs font-medium">
                      <Icon name="error_outline" size={16} />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="text-right mt-2 px-1">
                    <a href="/forgot-password" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">Forgot password?</a>
                  </div>
                </div>
                <div className="pt-4 space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-container text-white font-bold py-4 rounded-full text-lg shadow-lg shadow-red-900/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-3 disabled:opacity-60"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                    <Icon name="arrow_forward" size={20} />
                  </button>
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <a
                    href="/api/auth/google"
                    className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-bold py-3.5 rounded-full text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </a>
                </div>
              </form>
            ) : (
              <form onSubmit={onRegister} className="space-y-6">
                {[
                  { label: 'Full Name', value: regName, setter: setRegName, type: 'text', placeholder: 'John Engineer', icon: 'person' },
                  { label: 'Email', value: regEmail, setter: setRegEmail, type: 'email', placeholder: 'operator@eyf.platform', icon: 'alternate_email' },
                  { label: 'Password', value: regPassword, setter: setRegPassword, type: 'password', placeholder: '••••••••••••', icon: 'key' },
                  { label: 'Confirm Password', value: regConfirm, setter: setRegConfirm, type: 'password', placeholder: '••••••••••••', icon: 'key' },
                ].map((field) => (
                  <div key={field.label} className="space-y-2">
                    <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant block px-4">
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-0 transition-all"
                        placeholder={field.placeholder}
                        required
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600">
                        <Icon name={field.icon} size={20} />
                      </div>
                    </div>
                  </div>
                ))}
                {regError && (
                  <div className="flex items-center gap-2 px-4 text-error text-xs font-medium">
                    <Icon name="error_outline" size={16} />
                    <span>{regError}</span>
                  </div>
                )}
                <div className="pt-4 space-y-4">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full bg-primary-container text-white font-bold py-4 rounded-full text-lg shadow-lg shadow-red-900/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-3 disabled:opacity-60"
                  >
                    {regLoading ? 'Creating...' : 'Create Account'}
                    <Icon name="arrow_forward" size={20} />
                  </button>
                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  <a
                    href="/api/auth/google"
                    className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-bold py-3.5 rounded-full text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </a>
                </div>
              </form>
            )}
          </div>

          {/* Footer meta */}
          <div className="flex items-center gap-4 text-zinc-600 font-['Inter'] uppercase tracking-widest text-[10px] font-bold">
            <span>EYF Platform</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
            <span>Secure Login</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
            <span className="text-primary-container">Live</span>
          </div>
        </div>
      </main>
    </div>
  );
}
