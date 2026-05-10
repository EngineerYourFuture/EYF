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

  const [email, setEmail] = useState('user@eyf.dev');
  const [password, setPassword] = useState('Password123!');
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
              Kinetic <span className="text-primary-container">Precision</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-md font-light leading-relaxed">
              Access the high-performance environment of EYF Platform.
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
                      placeholder="operator@eyf.platform"
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
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-container text-white font-bold py-4 rounded-full text-lg shadow-lg shadow-red-900/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-3 disabled:opacity-60"
                  >
                    {loading ? 'Initializing...' : 'Initialize Session'}
                    <Icon name="arrow_forward" size={20} />
                  </button>
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
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full bg-primary-container text-white font-bold py-4 rounded-full text-lg shadow-lg shadow-red-900/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-3 disabled:opacity-60"
                  >
                    {regLoading ? 'Creating...' : 'Create Account'}
                    <Icon name="arrow_forward" size={20} />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer meta */}
          <div className="flex items-center gap-4 text-zinc-600 font-['Inter'] uppercase tracking-widest text-[10px] font-bold">
            <span>V1.0 Kinetic Noir</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
            <span>Encrypted Transaction</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
            <span className="text-primary-container">Live Operations</span>
          </div>
        </div>
      </main>
    </div>
  );
}
