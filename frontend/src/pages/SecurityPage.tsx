import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest, ApiError } from '../lib/api';
import { getSession, setSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

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
    <div className={`flex items-center gap-2 text-sm font-medium ${msg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
      <Icon name={msg.type === 'success' ? 'check_circle' : 'error_outline'} size={16} />
      {msg.text}
    </div>
  );
}

export function SecurityPage() {
  const session  = getSession();
  const { summary, displayName, plan, refresh } = useUser();

  // Profile edit
  const [nameEdit, setNameEdit] = useState(false);
  const [nameVal, setNameVal]   = useState(displayName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2FA
  const [security, setSecurity]   = useState<SecuritySettings | null>(null);
  const [totp2FASecret, setTotp2FASecret] = useState<{ secret: string; qr: string } | null>(null);
  const [totpCode, setTotpCode]   = useState('');
  const [twoFAMsg, setTwoFAMsg]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [disable2FAPw, setDisable2FAPw] = useState('');

  // Sessions
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
    setNameLoading(true);
    setNameMsg(null);
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
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-1">Profile & Security</h1>
          <p className="text-zinc-500 text-sm">Manage your account, security, and active sessions.</p>
        </div>

        {/* ── Profile card ── */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-5 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[#E82127] flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
              {(displayName || session?.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-lg truncate">{displayName || session?.email}</p>
              <p className="text-zinc-500 text-xs">{session?.email}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="bg-[#E82127]/10 text-[#E82127] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                  {planLabel}
                </span>
                <span className="text-zinc-600 text-[10px] font-bold">Lv.{level} {LEVEL_NAMES[level]}</span>
                <span className="text-zinc-600 text-[10px] font-bold">{xp.toLocaleString()} XP</span>
              </div>
            </div>
            {plan === 'free' && (
              <Link to="/plans">
                <button className="flex-shrink-0 bg-[#E82127] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full hover:brightness-110 transition-all">
                  Upgrade
                </button>
              </Link>
            )}
          </div>

          {/* Edit name */}
          {nameEdit ? (
            <form onSubmit={saveName} className="flex items-center gap-3">
              <input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E82127]/60"
                placeholder="Your display name"
                autoFocus
              />
              <button type="submit" disabled={nameLoading} className="bg-[#E82127] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60">
                {nameLoading ? '...' : 'Save'}
              </button>
              <button type="button" onClick={() => { setNameEdit(false); setNameVal(displayName); }} className="text-zinc-500 hover:text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-colors">
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setNameEdit(true)}
              className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
              <Icon name="edit" size={14} /> Edit display name
            </button>
          )}
          <StatusMsg msg={nameMsg} />
        </div>

        {/* ── Change password ── */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6">
          <h2 className="font-black text-white mb-5 flex items-center gap-2">
            <Icon name="lock" size={18} className="text-[#E82127]" /> Change Password
          </h2>
          <form onSubmit={changePw} className="space-y-4">
            {[
              { label: 'Current Password', value: currentPw, setter: setCurrentPw },
              { label: 'New Password',     value: newPw,     setter: setNewPw },
              { label: 'Confirm New',      value: confirmPw, setter: setConfirmPw },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block mb-1.5">{f.label}</label>
                <input
                  type="password"
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#E82127]/50 transition-colors"
                  required
                />
              </div>
            ))}
            <StatusMsg msg={pwMsg} />
            <button
              type="submit"
              disabled={pwLoading}
              className="bg-[#E82127] text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-full hover:brightness-110 transition-all active:scale-95 disabled:opacity-60"
            >
              {pwLoading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* ── 2FA ── */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="security" size={18} className="text-[#E82127]" />
            <div className="flex-1">
              <h2 className="font-black text-white text-sm">Two-Factor Authentication</h2>
              <p className="text-zinc-500 text-xs">Protect your account with a TOTP authenticator app.</p>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
              security?.totpEnabled ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {security?.totpEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {!security?.totpEnabled && !totp2FASecret && (
            <button
              onClick={() => void setup2FA()}
              disabled={twoFALoading}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-60"
            >
              <Icon name="qr_code" size={14} /> Set up 2FA
            </button>
          )}

          {totp2FASecret && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-xs">Scan this QR code with Google Authenticator, Authy, or any TOTP app:</p>
              <div className="bg-white p-3 rounded-xl w-fit">
                <img src={totp2FASecret.qr} alt="2FA QR code" className="w-40 h-40" />
              </div>
              <p className="text-zinc-500 text-xs">Or enter this key manually: <code className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-300 font-mono text-[11px]">{totp2FASecret.secret}</code></p>
              <form onSubmit={verify2FA} className="flex gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono text-lg tracking-[0.3em] text-center focus:outline-none focus:border-[#E82127]/60"
                  required
                  autoFocus
                />
                <button type="submit" disabled={twoFALoading || totpCode.length < 6} className="bg-green-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60">
                  Verify
                </button>
              </form>
            </div>
          )}

          {security?.totpEnabled && !totp2FASecret && (
            <form onSubmit={disable2FA} className="flex gap-3">
              <input
                type="password"
                value={disable2FAPw}
                onChange={(e) => setDisable2FAPw(e.target.value)}
                placeholder="Enter password to disable 2FA"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50"
                required
              />
              <button type="submit" disabled={twoFALoading} className="bg-red-900/60 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60">
                Disable
              </button>
            </form>
          )}

          <StatusMsg msg={twoFAMsg} />
        </div>

        {/* ── Login history ── */}
        {security?.loginEvents && security.loginEvents.length > 0 && (
          <div className="bg-[#161616] border border-white/5 rounded-2xl p-6">
            <h2 className="font-black text-white mb-4 flex items-center gap-2 text-sm">
              <Icon name="history" size={18} className="text-zinc-500" /> Recent Login Activity
            </h2>
            <div className="space-y-2">
              {security.loginEvents.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs py-2 border-b border-zinc-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon name={e.device?.toLowerCase().includes('mobile') ? 'smartphone' : 'laptop'} size={14} className="text-zinc-600" />
                    <div>
                      <p className="text-zinc-300">{e.device || 'Unknown device'}</p>
                      <p className="text-zinc-600">{e.ip} · {new Date(e.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    e.outcome === 'allowed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {e.outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Sessions ── */}
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6">
          <h2 className="font-black text-white mb-4 flex items-center gap-2 text-sm">
            <Icon name="devices" size={18} className="text-zinc-500" /> Active Sessions
          </h2>
          {sessions.length === 0 ? (
            <p className="text-zinc-600 text-xs">No session data available.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-zinc-900/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Icon name={s.device?.toLowerCase().includes('mobile') ? 'smartphone' : 'laptop'} size={18} className="text-zinc-500" />
                    <div>
                      <p className="text-sm text-white font-medium">{s.device || 'Unknown device'}</p>
                      <p className="text-xs text-zinc-600">{s.ip} · {new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => void revokeSession(s.id)}
                    disabled={revoking === s.id}
                    className="text-zinc-600 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40"
                  >
                    {revoking === s.id ? '…' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
