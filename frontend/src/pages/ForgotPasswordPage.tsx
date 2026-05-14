import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../lib/api';
import { Icon } from '../components/Icon';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiPost('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-8 text-sm">
          <Icon name="arrow_back" size={16} />
          Back to login
        </Link>

        <div className="bg-surface-container rounded-2xl p-10">
          <div className="mb-8">
            <span className="font-black text-2xl tracking-tighter">
              EY<span className="text-primary-container">F</span>
            </span>
            <h1 className="text-2xl font-black tracking-tighter mt-4 mb-2">Forgot password?</h1>
            <p className="text-zinc-500 text-sm">Enter your email and we'll send a reset link.</p>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="mark_email_read" size={28} className="text-green-400" />
              </div>
              <p className="font-bold text-on-surface mb-2">Check your inbox</p>
              <p className="text-zinc-500 text-sm">If an account exists for <span className="text-zinc-300">{email}</span>, you'll receive a reset link shortly.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label htmlFor="fp-email" className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">Email</label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl px-6 py-4 text-on-surface placeholder:text-zinc-600 focus:outline-none focus:ring-0 transition-all"
                  placeholder="you@example.com"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-container text-white font-bold py-4 rounded-xl text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
