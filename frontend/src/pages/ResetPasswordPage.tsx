import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiPost } from '../lib/api';
import { Icon } from '../components/Icon';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;
const INPUT = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 20px', color: 'var(--t1)', fontSize: 14, outline: 'none', boxSizing: 'border-box' } as const;

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
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--t2)', marginBottom: 16 }}>Invalid reset link.</p>
          <Link to="/forgot-password" style={{ color: '#E82127', fontSize: 14, textDecoration: 'none', fontWeight: 700 }}>Request a new one</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'rgba(232,33,39,0.04)', filter: 'blur(120px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ ...GLASS, borderRadius: 20, padding: 40 }}>
          <div style={{ marginBottom: 32 }}>
            <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em', color: 'var(--t1)' }}>
              EY<span style={{ color: '#E82127' }}>F</span>
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', marginTop: 16, marginBottom: 8, color: 'var(--t1)' }}>Reset password</h1>
            <p style={{ color: 'var(--t3)', fontSize: 14 }}>Choose a strong new password for your account.</p>
          </div>

          {done ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 56, height: 56, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="check_circle" size={28} style={{ color: '#4ade80' }} />
              </div>
              <p style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>Password updated!</p>
              <p style={{ color: 'var(--t3)', fontSize: 14 }}>Redirecting to login…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {[
                { id: 'rp-pass',    label: 'New Password',     value: password, setter: setPassword },
                { id: 'rp-confirm', label: 'Confirm Password', value: confirm,  setter: setConfirm },
              ].map((f) => (
                <div key={f.id}>
                  <label htmlFor={f.id} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', display: 'block', marginBottom: 8 }}>{f.label}</label>
                  <input
                    id={f.id}
                    type="password"
                    required
                    value={f.value}
                    onChange={(e) => f.setter(e.target.value)}
                    style={INPUT}
                    placeholder="••••••••••••"
                  />
                </div>
              ))}

              <p style={{ color: 'var(--t4)', fontSize: 12 }}>8+ chars · uppercase · lowercase · digit · special char</p>

              {error && <p style={{ color: '#f87171', fontSize: 14 }}>{error}</p>}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', background: '#E82127', color: '#fff', fontWeight: 700, padding: '14px 0', borderRadius: 12, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1, boxShadow: '0 0 24px rgba(232,33,39,0.3)' }}
              >
                {loading ? 'Updating…' : 'Set New Password'}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
