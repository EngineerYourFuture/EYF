import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AuthorityShell } from '../components/AuthorityShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

interface OpsStats {
  totalUsers?: number;
  activePlans?: number;
  revenue?: number;
  openTickets?: number;
}
interface ActivityItem {
  id: string;
  action: string;
  user?: string;
  createdAt: string;
  type?: string;
}
interface OpsResponse {
  stats?: OpsStats;
  recentActivity?: ActivityItem[];
}

export function AdminOperationsPage() {
  const session = getSession();
  const [data, setData] = useState<OpsResponse>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<OpsResponse>('/authority/admin/stats', { token: session.accessToken })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const stats = data.stats;
  const activity = data.recentActivity ?? [];

  const STAT_CARDS = [
    { icon: 'group',           label: 'Total Users',   value: stats?.totalUsers ?? '—',                                    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
    { icon: 'card_membership', label: 'Active Plans',  value: stats?.activePlans ?? '—',                                   color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
    { icon: 'attach_money',    label: 'Revenue',       value: stats?.revenue ? `$${stats.revenue.toLocaleString()}` : '—', color: '#facc15', bg: 'rgba(250,204,21,0.1)'  },
    { icon: 'support_agent',   label: 'Open Tickets',  value: stats?.openTickets ?? '—',                                   color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  ];

  return (
    <AuthorityShell>
      <div className="pt-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1 }}>
            <span style={{ background: 'linear-gradient(135deg, #fff 40%, #E82127)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ADMIN OPERATIONS.</span>
          </h1>
          <p style={{ color: 'var(--t3)' }}>System overview and platform management.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" style={{ marginBottom: 48 }}>
          {STAT_CARDS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{ ...GLASS, borderRadius: 16, padding: 32 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: s.bg, border: `1px solid ${s.color}30` }}>
                <Icon name={s.icon} size={24} style={{ color: s.color }} />
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--t1)' }}>{String(s.value)}</p>
            </motion.div>
          ))}
        </div>

        {/* System health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ marginBottom: 48 }}>
          {[
            { label: 'API Gateway',   status: 'Operational', uptime: '99.9%', color: '#4ade80' },
            { label: 'Database',      status: 'Operational', uptime: '100%',  color: '#4ade80' },
            { label: 'Judge System',  status: 'Operational', uptime: '99.7%', color: '#4ade80' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 + i * 0.06 }}
              style={{ ...GLASS, borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: 'var(--t1)' }}>{s.label}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.status}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>{s.uptime}</span>
            </motion.div>
          ))}
        </div>

        {/* Recent activity */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ ...GLASS, borderRadius: 16, padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 24, color: 'var(--t1)' }}>Recent Activity</h2>
          {loading && <div style={{ color: 'var(--t3)', textAlign: 'center', padding: 32 }}>Loading...</div>}
          {!loading && activity.length === 0 && <div style={{ color: 'var(--t3)', textAlign: 'center', padding: 32 }}>No recent activity.</div>}
          {!loading && activity.length > 0 && (
            <div className="space-y-3">
              {activity.slice(0, 10).map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 24px', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(232,33,39,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="history" size={16} style={{ color: '#E82127' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'var(--t1)', fontSize: 14 }}>{a.action}</p>
                    {a.user && <p style={{ color: 'var(--t3)', fontSize: 12 }}>{a.user}</p>}
                  </div>
                  <span style={{ color: 'var(--t4)', fontSize: 12 }}>{new Date(a.createdAt).toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AuthorityShell>
  );
}
