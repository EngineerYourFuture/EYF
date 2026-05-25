import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest, ApiError } from '../lib/api';
import { getSession, setSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;
const INPUT = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#e4e4e7', outline: 'none', boxSizing: 'border-box' } as const;

interface SecuritySettings {
  totpEnabled: boolean;
  loginEvents: Array<{ id: string; ip: string; device: string; createdAt: string; outcome: string }>;
}

interface Session {
  id: string;
  zone: string;
  ip: string;
  device: string;
  createdAt: string;
}

function StatusMsg({ msg }: { readonly msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: msg.type === 'success' ? '#4ade80' : '#f87171' }}>
      <Icon name={msg.type === 'success' ? 'check_circle' : 'error_outline'} size={16} />
      {msg.text}
    </div>
  );
}

export function SecurityPage() {
  const session  = getSession();
  const { summary, displayName, plan, refresh } = useUser();

  const [nameEdit, setNameEdit] = useState(false);
  const [nameVal, setNameVal]   = useState(displayName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [security, setSecurity]   = useState<SecuritySettings | null>(null);
  const [totp2FASecret, setTotp2FASecret] = useState<{ secret: string; qr: string } | null>(null);
  const [totpCode, setTotpCode]   = useState('');
  const [twoFAMsg, setTwoFAMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [disable2FAPw, setDisable2FAPw] = useState('');

  const [sessions, setSessions]   = useState<Session[]>([]);
  const [revoking, setRevoking]   = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<SecuritySettings>('/auth/security', { token: session.accessToken })
      .then(setSecurity).catch(() => {});
    apiRequest<{ sessions: Session[] }>('/auth/sessions', { token: session.accessToken })
      .then((d) => setSessions(d.sessions)).catch(() => {});
  }, [session?.accessToken]);

  useEffect(() => { setNameVal(displayName); }, [displayName]);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;
    setNameLoading(true); setNameMsg(null);
    try {
      await apiRequest('/auth/profile', { method: 'PATCH', token: session.accessToken, body: { name: nameVal } });
      setSession({ ...session, email: session.email });
      setNameMsg({ type: 'success', text: 'Name updated!' });
      setNameEdit(false);
      refresh();
    } catch {
      setNameMsg({ type: 'error', text: 'Failed to update name.' });
    } finally {
      setNameLoading(false);
    }
  };

  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    if (!session?.accessToken) return;
    setPwLoading(true); setPwMsg(null);
    try {
      await apiRequest('/auth/change-password', { method: 'POST', token: session.accessToken, body: { currentPassword: currentPw, newPassword: newPw } });
      setPwMsg({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Failed to update password.' });
    } finally {
      setPwLoading(false);
    }
  };

  const setup2FA = async () => {
    if (!session?.accessToken) return;
    setTwoFALoading(true); setTwoFAMsg(null);
    try {
      const res = await apiRequest<{ secret: string; qr: string }>('/auth/2fa/setup', { method: 'POST', token: session.accessToken });
      setTotp2FASecret(res);
    } catch {
      setTwoFAMsg({ type: 'error', text: 'Failed to set up 2FA.' });
    } finally {
      setTwoFALoading(false);
    }
  };

  const verify2FA = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken || !totpCode) return;
    setTwoFALoading(true); setTwoFAMsg(null);
    try {
      await apiRequest('/auth/2fa/verify', { method: 'POST', token: session.accessToken, body: { token: totpCode } });
      setSecurity((prev) => prev ? { ...prev, totpEnabled: true } : prev);
      setTotp2FASecret(null); setTotpCode('');
      setTwoFAMsg({ type: 'success', text: '2FA enabled successfully! Your account is now more secure.' });
    } catch (err) {
      setTwoFAMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Invalid code.' });
    } finally {
      setTwoFALoading(false);
    }
  };

  const disable2FA = async (e: FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;
    setTwoFALoading(true); setTwoFAMsg(null);
    try {
      await apiRequest('/auth/2fa', { method: 'DELETE', token: session.accessToken, body: { password: disable2FAPw } });
      setSecurity((prev) => prev ? { ...prev, totpEnabled: false } : prev);
      setDisable2FAPw('');
      setTwoFAMsg({ type: 'success', text: '2FA disabled.' });
    } catch (err) {
      setTwoFAMsg({ type: 'error', text: err instanceof ApiError ? err.message : 'Incorrect password.' });
    } finally {
      setTwoFALoading(false);
    }
  };

  const revokeSession = async (id: string) => {
    if (!session?.accessToken) return;
    setRevoking(id);
    try {
      await apiRequest(`/auth/sessions/${id}`, { method: 'DELETE', token: session.accessToken });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ } finally {
      setRevoking(null);
    }
  };

  const xp    = summary?.xp ?? 0;
  const level = summary?.level ?? 0;
  const LEVEL_NAMES = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];
  let planLabel = 'Free';
  if (plan === 'elite') planLabel = '⭐ Elite';
  else if (plan === 'pro') planLabel = '✦ Pro';

  return (
    <AppShell>
      <div className="pt-8 max-w-3xl space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 6, lineHeight: 1.1 }}>
            <span style={{ background: 'linear-gradient(135deg, #fff 40%, #E82127)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PROFILE & SECURITY.</span>
          </h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>Manage your account, security, and active sessions.</p>
        </motion.div>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} style={{ ...GLASS, borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: '#E82127', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {(displayName || session?.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#e4e4e7', fontWeight: 900, fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName || session?.email}</p>
              <p style={{ color: '#71717a', fontSize: 12 }}>{session?.email}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(232,33,39,0.12)', color: '#E82127', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: 999 }}>{planLabel}</span>
                <span style={{ color: '#52525b', fontSize: 10, fontWeight: 700 }}>Lv.{level} {LEVEL_NAMES[level]}</span>
                <span style={{ color: '#52525b', fontSize: 10, fontWeight: 700 }}>{xp.toLocaleString()} XP</span>
              </div>
            </div>
            {plan === 'free' && (
              <Link to="/plans">
                <button style={{ flexShrink: 0, background: '#E82127', color: '#fff', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', boxShadow: '0 0 16px rgba(232,33,39,0.3)' }}>
                  Upgrade
                </button>
              </Link>
            )}
          </div>

          {nameEdit ? (
            <form onSubmit={saveName} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                style={{ flex: 1, ...INPUT }}
                placeholder="Your display name"
                autoFocus
              />
              <button type="submit" disabled={nameLoading} style={{ background: '#E82127', color: '#fff', padding: '10px 16px', borderRadius: 12, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', opacity: nameLoading ? 0.6 : 1 }}>
                {nameLoading ? '...' : 'Save'}
              </button>
              <button type="button" onClick={() => { setNameEdit(false); setNameVal(displayName); }} style={{ color: '#71717a', padding: '10px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setNameEdit(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#71717a', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Icon name="edit" size={14} /> Edit display name
            </button>
          )}
          <div style={{ marginTop: 8 }}>
            <StatusMsg msg={nameMsg} />
          </div>
        </motion.div>

        {/* Change password */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} style={{ ...GLASS, borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontWeight: 900, color: '#e4e4e7', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="lock" size={18} style={{ color: '#E82127' }} /> Change Password
          </h2>
          <form onSubmit={changePw} className="space-y-4">
            {[
              { label: 'Current Password', value: currentPw, setter: setCurrentPw },
              { label: 'New Password',     value: newPw,     setter: setNewPw },
              { label: 'Confirm New',      value: confirmPw, setter: setConfirmPw },
            ].map((f) => (
              <div key={f.label}>
                <label style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input
                  type="password"
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  style={INPUT}
                  required
                />
              </div>
            ))}
            <StatusMsg msg={pwMsg} />
            <motion.button
              type="submit"
              disabled={pwLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ background: '#E82127', color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10, padding: '12px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', opacity: pwLoading ? 0.6 : 1, boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}
            >
              {pwLoading ? 'Updating…' : 'Update Password'}
            </motion.button>
          </form>
        </motion.div>

        {/* 2FA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} style={{ ...GLASS, borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Icon name="security" size={18} style={{ color: '#E82127' }} />
            <div style={{ flex: 1 }}>
              <h2 style={{ fontWeight: 900, color: '#e4e4e7', fontSize: 14 }}>Two-Factor Authentication</h2>
              <p style={{ color: '#71717a', fontSize: 12 }}>Protect your account with a TOTP authenticator app.</p>
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 12px', borderRadius: 999, color: security?.totpEnabled ? '#4ade80' : '#71717a', background: security?.totpEnabled ? 'rgba(74,222,128,0.1)' : 'rgba(113,113,122,0.1)' }}>
              {security?.totpEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {!security?.totpEnabled && !totp2FASecret && (
            <motion.button
              onClick={() => void setup2FA()}
              disabled={twoFALoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', color: '#e4e4e7', fontWeight: 700, fontSize: 12, padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', opacity: twoFALoading ? 0.6 : 1 }}
            >
              <Icon name="qr_code" size={14} /> Set up 2FA
            </motion.button>
          )}

          {totp2FASecret && (
            <div className="space-y-4">
              <p style={{ color: '#a1a1aa', fontSize: 12 }}>Scan this QR code with Google Authenticator, Authy, or any TOTP app:</p>
              <div style={{ background: '#fff', padding: 12, borderRadius: 12, width: 'fit-content' }}>
                <img src={totp2FASecret.qr} alt="2FA QR code" style={{ width: 160, height: 160 }} />
              </div>
              <p style={{ color: '#71717a', fontSize: 12 }}>Or enter this key manually: <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6, color: '#d4d4d8', fontFamily: 'monospace', fontSize: 11 }}>{totp2FASecret.secret}</code></p>
              <form onSubmit={verify2FA} style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{ flex: 1, ...INPUT, fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.3em', textAlign: 'center' }}
                  required
                  autoFocus
                />
                <button type="submit" disabled={twoFALoading || totpCode.length < 6} style={{ background: '#16a34a', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', opacity: (twoFALoading || totpCode.length < 6) ? 0.6 : 1 }}>
                  Verify
                </button>
              </form>
            </div>
          )}

          {security?.totpEnabled && !totp2FASecret && (
            <form onSubmit={disable2FA} style={{ display: 'flex', gap: 12 }}>
              <input
                type="password"
                value={disable2FAPw}
                onChange={(e) => setDisable2FAPw(e.target.value)}
                placeholder="Enter password to disable 2FA"
                style={{ flex: 1, ...INPUT }}
                required
              />
              <button type="submit" disabled={twoFALoading} style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', padding: '12px 16px', borderRadius: 12, fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', opacity: twoFALoading ? 0.6 : 1 }}>
                Disable
              </button>
            </form>
          )}

          <div style={{ marginTop: 12 }}>
            <StatusMsg msg={twoFAMsg} />
          </div>
        </motion.div>

        {/* Login history */}
        {security?.loginEvents && security.loginEvents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} style={{ ...GLASS, borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontWeight: 900, color: '#e4e4e7', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <Icon name="history" size={18} style={{ color: '#71717a' }} /> Recent Login Activity
            </h2>
            <div className="space-y-2">
              {security.loginEvents.slice(0, 5).map((e) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon name={e.device?.toLowerCase().includes('mobile') ? 'smartphone' : 'laptop'} size={14} style={{ color: '#52525b' }} />
                    <div>
                      <p style={{ color: '#d4d4d8' }}>{e.device || 'Unknown device'}</p>
                      <p style={{ color: '#52525b' }}>{e.ip} · {new Date(e.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, color: e.outcome === 'allowed' ? '#4ade80' : '#f87171', background: e.outcome === 'allowed' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)' }}>
                    {e.outcome}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sessions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ ...GLASS, borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontWeight: 900, color: '#e4e4e7', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <Icon name="devices" size={18} style={{ color: '#71717a' }} /> Active Sessions
          </h2>
          {sessions.length === 0 ? (
            <p style={{ color: '#52525b', fontSize: 12 }}>No session data available.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon name={s.device?.toLowerCase().includes('mobile') ? 'smartphone' : 'laptop'} size={18} style={{ color: '#71717a' }} />
                    <div>
                      <p style={{ fontSize: 14, color: '#e4e4e7', fontWeight: 500 }}>{s.device || 'Unknown device'}</p>
                      <p style={{ fontSize: 12, color: '#52525b' }}>{s.ip} · {new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => void revokeSession(s.id)}
                    disabled={revoking === s.id}
                    style={{ color: revoking === s.id ? '#52525b' : '#71717a', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer', opacity: revoking === s.id ? 0.4 : 1 }}
                  >
                    {revoking === s.id ? '…' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}
