import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiPost } from '../lib/api';
import { Icon } from '../components/Icon';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No token provided.'); return; }
    apiPost('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        const e = err as { message?: string };
        setStatus('error');
        setMessage(e?.message ?? 'Verification failed. The link may have expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface-container rounded-2xl p-10 text-center">
        <span className="font-black text-2xl tracking-tighter block mb-8">
          EY<span className="text-primary-container">F</span>
        </span>

        {status === 'loading' && (
          <>
            <div className="w-14 h-14 rounded-full border-2 border-primary-container border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="verified" size={28} className="text-green-400" />
            </div>
            <p className="font-black text-xl tracking-tighter mb-2">Email verified!</p>
            <p className="text-zinc-500 text-sm mb-6">Your account is now fully active.</p>
            <Link to="/app/dashboard" className="bg-primary-container text-white font-bold px-8 py-3 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all">
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="error" size={28} className="text-red-400" />
            </div>
            <p className="font-black text-xl tracking-tighter mb-2">Verification failed</p>
            <p className="text-zinc-500 text-sm mb-6">{message}</p>
            <Link to="/login" className="text-primary-container hover:underline text-sm">Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
