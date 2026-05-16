import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

export interface UserSummary {
  xp: number;
  weeklyXp: number;
  streak: number;
  longestStreak: number;
  level: number;
  dsaDailyUsage: number;
  dsaDailyLimit: number | null;
  achievementsEarned: number;
  recentAchievements: Array<{ key: string; name: string; icon: string }>;
}

export interface XPToastEvent {
  id: string;
  amount: number;
  reason?: string;
}

interface UserContextValue {
  summary: UserSummary | null;
  displayName: string;
  plan: string;
  loading: boolean;
  refresh: () => void;
  toasts: XPToastEvent[];
  dismissToast: (id: string) => void;
  fireXP: (amount: number, reason?: string) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { readonly children: ReactNode }) {
  const session = getSession();
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [plan, setPlan] = useState('free');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<XPToastEvent[]>([]);
  const prevLevelRef = useRef<number | null>(null);

  const load = useCallback(() => {
    if (!session?.accessToken) { setLoading(false); return; }
    setLoading(true);
    apiRequest<{ user: { plan: string; email: string; name: string | null }; summary: UserSummary }>(
      '/home/summary',
      { token: session.accessToken }
    )
      .then((d) => {
        setSummary(d.summary);
        setPlan(d.user.plan);
        setDisplayName(d.user.name ?? d.user.email.split('@')[0]);
        prevLevelRef.current = d.summary.level;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => { load(); }, [load]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fireXP = useCallback((amount: number, reason?: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { id, amount, reason }]);
    setTimeout(() => dismissToast(id), 3500);
  }, [dismissToast]);

  return (
    <UserContext.Provider value={{ summary, displayName, plan, loading, refresh, toasts, dismissToast, fireXP }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
}
