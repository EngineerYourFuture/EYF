import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiPost } from '../lib/api';
import { Icon } from '../components/Icon';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'rgba(232,33,39,0.04)', filter: 'blur(120px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#71717a', fontSize: 14, textDecoration: 'none', marginBottom: 32 }}>
          <Icon name="arrow_back" size={16} />Back to login
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ ...GLASS, borderRadius: 20, padding: 40 }}>
          <div style={{ marginBottom: 32 }}>
            <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.04em', color: '#e4e4e7' }}>
              EY<span style={{ color: '#E82127' }}>F</span>
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', marginTop: 16, marginBottom: 8, color: '#e4e4e7' }}>Forgot password?</h1>
            <p style={{ color: '#71717a', fontSize: 14 }}>Enter your email and we'll send a reset link.</p>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 56, height: 56, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="mark_email_read" size={28} style={{ color: '#4ade80' }} />
              </div>
              <p style={{ fontWeight: 700, color: '#e4e4e7', marginBottom: 8 }}>Check your inbox</p>
              <p style={{ color: '#71717a', fontSize: 14 }}>If an account exists for <span style={{ color: '#d4d4d8' }}>{email}</span>, you'll receive a reset link shortly.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label htmlFor="fp-email" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', display: 'block', marginBottom: 8 }}>Email</label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 20px', color: '#e4e4e7', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="you@example.com"
                />
              </div>

              {error && <p style={{ color: '#f87171', fontSize: 14 }}>{error}</p>}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', background: '#E82127', color: '#fff', fontWeight: 700, padding: '14px 0', borderRadius: 12, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1, boxShadow: '0 0 24px rgba(232,33,39,0.3)' }}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
