import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiPost } from '../lib/api';
import { Icon } from '../components/Icon';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'rgba(232,33,39,0.04)', filter: 'blur(120px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ ...GLASS, borderRadius: 20, padding: 40, maxWidth: 440, width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em', color: 'var(--t1)', display: 'block', marginBottom: 32 }}>
          EY<span style={{ color: '#E82127' }}>F</span>
        </span>

        {status === 'loading' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #E82127', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--t2)', fontSize: 14 }}>Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ width: 56, height: 56, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="verified" size={28} style={{ color: '#4ade80' }} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--t1)', marginBottom: 8 }}>Email verified!</p>
            <p style={{ color: 'var(--t3)', fontSize: 14, marginBottom: 24 }}>Your account is now fully active.</p>
            <Link to="/app/dashboard" style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '12px 32px', borderRadius: 999, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none', boxShadow: '0 0 20px rgba(232,33,39,0.3)', display: 'inline-block' }}>
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ width: 56, height: 56, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="error" size={28} style={{ color: '#f87171' }} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--t1)', marginBottom: 8 }}>Verification failed</p>
            <p style={{ color: 'var(--t3)', fontSize: 14, marginBottom: 24 }}>{message}</p>
            <Link to="/login" style={{ color: '#E82127', fontSize: 14, textDecoration: 'none', fontWeight: 700 }}>Back to login</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
