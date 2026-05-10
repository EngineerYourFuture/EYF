import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

export function SecurityPage() {
  const session = getSession();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [twoFa, setTwoFa] = useState(false);

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    if (!session?.accessToken) return;
    setPwLoading(true);
    setPwMsg(null);
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        token: session.accessToken,
        body: { currentPassword: currentPw, newPassword: newPw },
      });
      setPwMsg({ type: 'success', text: 'Password updated successfully.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch {
      setPwMsg({ type: 'error', text: 'Failed to update password.' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="pt-8 max-w-3xl">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-3">Profile & <span className="text-primary-container">Security.</span></h1>
          <p className="text-on-surface-variant">Manage your account and security settings.</p>
        </div>

        {/* Profile card */}
        <div className="bg-surface-container rounded-xl p-8 mb-8 flex items-center gap-8">
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
            {session?.email?.[0].toUpperCase() ?? '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface">{session?.email}</h2>
            <p className="text-on-surface-variant text-sm capitalize">{session?.role ?? 'user'} Plan</p>
            <span className="px-3 py-1 mt-2 inline-block bg-primary-container/20 text-primary-container rounded-full text-[10px] font-bold uppercase tracking-widest">
              Free Plan
            </span>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-surface-container rounded-xl p-8 mb-8">
          <h2 className="text-lg font-black tracking-tight mb-6 flex items-center gap-3">
            <Icon name="lock" size={20} className="text-primary-container" />
            Change Password
          </h2>
          <form onSubmit={changePw} className="space-y-5">
            {[
              { label: 'Current Password', value: currentPw, setter: setCurrentPw },
              { label: 'New Password', value: newPw, setter: setNewPw },
              { label: 'Confirm New Password', value: confirmPw, setter: setConfirmPw },
            ].map((f) => (
              <div key={f.label}>
                <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">{f.label}</label>
                <input
                  type="password"
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface text-sm border-none focus:outline-none"
                  required
                />
              </div>
            ))}
            {pwMsg && (
              <div className={`flex items-center gap-2 text-sm ${pwMsg.type === 'success' ? 'text-green-400' : 'text-error'}`}>
                <Icon name={pwMsg.type === 'success' ? 'check_circle' : 'error_outline'} size={18} />
                {pwMsg.text}
              </div>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="bg-primary-container text-white font-bold px-8 py-3 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 disabled:opacity-60"
            >
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* 2FA */}
        <div className="bg-surface-container rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Icon name="security" size={24} className="text-primary-container" />
              <div>
                <h2 className="text-lg font-black tracking-tight">Two-Factor Authentication</h2>
                <p className="text-on-surface-variant text-sm">Add an extra layer of security.</p>
              </div>
            </div>
            <button
              onClick={() => setTwoFa(!twoFa)}
              className={`w-14 h-7 rounded-full transition-all relative ${twoFa ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${twoFa ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-surface-container rounded-xl p-8">
          <h2 className="text-lg font-black tracking-tight mb-6 flex items-center gap-3">
            <Icon name="devices" size={20} className="text-primary-container" />
            Active Sessions
          </h2>
          <div className="space-y-3">
            {[
              { device: 'MacBook Pro', browser: 'Chrome 120', location: 'San Francisco, CA', current: true },
              { device: 'iPhone 15', browser: 'Safari', location: 'San Francisco, CA', current: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-container-low rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <Icon name={s.device.includes('iPhone') ? 'smartphone' : 'laptop'} size={24} className="text-zinc-400" />
                  <div>
                    <p className="font-semibold text-on-surface text-sm">{s.device}</p>
                    <p className="text-zinc-500 text-xs">{s.browser} · {s.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.current && (
                    <span className="px-3 py-1 bg-green-400/10 text-green-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Current
                    </span>
                  )}
                  {!s.current && (
                    <button className="text-zinc-500 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest transition-colors">
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
