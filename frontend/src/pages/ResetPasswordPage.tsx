import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiPost } from '../lib/api';
import { Icon } from '../components/Icon';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await apiPost('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Invalid reset link.</p>
          <Link to="/forgot-password" className="text-primary-container hover:underline text-sm">Request a new one</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-container rounded-2xl p-10">
          <div className="mb-8">
            <span className="font-black text-2xl tracking-tighter">
              EY<span className="text-primary-container">F</span>
            </span>
            <h1 className="text-2xl font-black tracking-tighter mt-4 mb-2">Reset password</h1>
            <p className="text-zinc-500 text-sm">Choose a strong new password for your account.</p>
          </div>

          {done ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="check_circle" size={28} className="text-green-400" />
              </div>
              <p className="font-bold text-on-surface mb-2">Password updated!</p>
              <p className="text-zinc-500 text-sm">Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {[
                { id: 'rp-pass', label: 'New Password', value: password, setter: setPassword },
                { id: 'rp-confirm', label: 'Confirm Password', value: confirm, setter: setConfirm },
              ].map((f) => (
                <div key={f.id}>
                  <label htmlFor={f.id} className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">{f.label}</label>
                  <input
                    id={f.id}
                    type="password"
                    required
                    value={f.value}
                    onChange={(e) => f.setter(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-0 transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              ))}

              <p className="text-zinc-600 text-xs">8+ chars · uppercase · lowercase · digit · special char</p>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-white font-bold py-4 rounded-xl text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Updating…' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
