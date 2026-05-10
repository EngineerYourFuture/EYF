import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import { setSession } from '../lib/session';
import { Icon } from '../components/Icon';
import type { Role } from '../types';

interface AuthorityLoginResponse {
  accessToken: string;
  user: { role: Role; email: string };
}

export function AuthorityLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<AuthorityLoginResponse>('/authority/login', {
        method: 'POST',
        body: { email, password },
      });
      setSession({ accessToken: result.accessToken, role: result.user.role, zone: 'authority', email: result.user.email });
      navigate('/authority/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 overflow-hidden selection:bg-primary-container selection:text-white">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-surface" />
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-container/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-tertiary-container/5 blur-[120px]" />
      </div>

      <main className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden bg-surface-container rounded-xl shadow-2xl">
        {/* Left brand panel */}
        <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden flex-col justify-between p-16 bg-surface-container-low">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-container rounded-full" />
              <span className="text-xl font-black tracking-tighter text-on-surface uppercase">EYF PLATFORM</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface mt-12 leading-[1.1]">
              Authority <br />
              <span className="text-primary-container">Gateway.</span>
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed mt-4 max-w-xs">
              Restricted access for authorized EYF Platform operators, staff, and administrators.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: 'shield', label: 'ENCRYPTED ACCESS', value: 'AES-256' },
              { icon: 'groups', label: 'AUTHORITY ZONE', value: 'RESTRICTED' },
              { icon: 'monitoring', label: 'AUDIT LOGGING', value: 'ACTIVE' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <Icon name={item.icon} size={16} className="text-zinc-500" />
                  <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">{item.label}</span>
                </div>
                <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-primary-container">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right form panel */}
        <div className="lg:col-span-7 flex flex-col justify-center p-12 lg:p-20">
          <div className="mb-12">
            <h2 className="text-3xl font-black tracking-tighter text-white mb-2">Secure Login</h2>
            <p className="text-on-surface-variant text-sm">
              Enter your authority credentials to access the operator dashboard.
            </p>
          </div>

          <form onSubmit={onLogin} className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="auth-email" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant block">
                Authority Email
              </label>
              <div className="relative">
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-0 transition-all"
                  placeholder="authority@eyf.platform"
                  required
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600">
                  <Icon name="badge" size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="auth-token" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-on-surface-variant block">
                Security Token
              </label>
              <div className="relative">
                <input
                  id="auth-token"
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
                <div className="flex items-center gap-2 mt-2 text-error text-xs font-medium">
                  <Icon name="error_outline" size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="pt-4 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-white font-bold py-4 rounded-full text-lg shadow-lg shadow-red-900/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {loading ? 'Authenticating...' : 'Access Authority Zone'}
                <Icon name="arrow_forward" size={20} />
              </button>
              <div className="text-center">
                <Link to="/login" className="text-xs text-zinc-500 hover:text-white transition-colors">
                  ← Return to User Login
                </Link>
              </div>
            </div>
          </form>

          <div className="mt-12 flex items-center gap-4 text-zinc-700 font-['Inter'] uppercase tracking-widest text-[10px] font-bold">
            <span>V1.0</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
            <span>Authority Protocol</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
            <span className="text-primary-container">Encrypted</span>
          </div>
        </div>
      </main>
    </div>
  );
}
