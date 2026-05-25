import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      const result = await apiRequest<AuthorityLoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password, zone: 'authority' },
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
    <div style={{ minHeight: '100vh', background: '#080808', color: 'var(--t1)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
      {/* Background glows */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '60%', borderRadius: '50%', background: 'rgba(232,33,39,0.04)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: 'rgba(96,165,250,0.03)', filter: 'blur(120px)' }} />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 1024, display: 'grid', gridTemplateColumns: '1fr', borderRadius: 16, overflow: 'hidden', background: 'rgba(10,10,10,0.85)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        className="lg:grid-cols-12"
      >
        {/* Left brand panel */}
        <div className="hidden lg:flex lg:col-span-5" style={{ flexDirection: 'column', justifyContent: 'space-between', padding: 64, background: 'rgba(0,0,0,0.3)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E82127' }} />
              <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', textTransform: 'uppercase', color: 'var(--t1)' }}>EYF PLATFORM</span>
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, color: 'var(--t1)' }}>
              Authority<br />
              <span style={{ color: '#E82127' }}>Gateway.</span>
            </h1>
            <p style={{ color: 'var(--t3)', fontSize: 14, lineHeight: 1.7, marginTop: 16, maxWidth: 280 }}>
              Restricted access for authorized EYF Platform operators, staff, and administrators.
            </p>
          </div>
          <div className="space-y-1">
            {[
              { icon: 'shield',     label: 'ENCRYPTED ACCESS', value: 'AES-256'   },
              { icon: 'groups',     label: 'AUTHORITY ZONE',   value: 'RESTRICTED' },
              { icon: 'monitoring', label: 'AUDIT LOGGING',    value: 'ACTIVE'     },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon name={item.icon} size={16} style={{ color: 'var(--t3)' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E82127' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right form panel */}
        <div className="lg:col-span-7" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 48 }}>
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--t1)', marginBottom: 8 }}>Secure Login</h2>
            <p style={{ color: 'var(--t3)', fontSize: 14 }}>Enter your authority credentials to access the operator dashboard.</p>
          </div>

          <form onSubmit={onLogin} className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="auth-email" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', display: 'block' }}>
                Authority Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 48px 14px 20px', color: 'var(--t1)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="authority@eyf.platform"
                  required
                />
                <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)' }}>
                  <Icon name="badge" size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="auth-token" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', display: 'block' }}>
                Security Token
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-token"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 48px 14px 20px', color: 'var(--t1)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="••••••••••••"
                  required
                />
                <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)' }}>
                  <Icon name="key" size={20} />
                </div>
              </div>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: '#f87171', fontSize: 12, fontWeight: 500 }}>
                  <Icon name="error_outline" size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div style={{ paddingTop: 16 }} className="space-y-4">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', background: '#E82127', color: '#fff', fontWeight: 700, padding: '16px 0', borderRadius: 999, fontSize: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: loading ? 0.6 : 1, boxShadow: '0 0 32px rgba(232,33,39,0.3)' }}
              >
                {loading ? 'Authenticating...' : 'Access Authority Zone'}
                <Icon name="arrow_forward" size={20} />
              </motion.button>
              <div style={{ textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: 12, color: 'var(--t3)', textDecoration: 'none' }}>
                  ← Return to User Login
                </Link>
              </div>
            </div>
          </form>

          <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 16, color: '#3f3f46', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <span>V1.0</span>
            <span style={{ width: 4, height: 4, background: '#3f3f46', borderRadius: '50%' }} />
            <span>Authority Protocol</span>
            <span style={{ width: 4, height: 4, background: '#3f3f46', borderRadius: '50%' }} />
            <span style={{ color: '#E82127' }}>Encrypted</span>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
