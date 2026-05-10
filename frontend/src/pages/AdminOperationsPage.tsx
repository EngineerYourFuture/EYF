import { useEffect, useState } from 'react';
import { AuthorityShell } from '../components/AuthorityShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

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
    { icon: 'group', label: 'Total Users', value: stats?.totalUsers ?? '—', color: 'text-blue-400 bg-blue-400/10' },
    { icon: 'card_membership', label: 'Active Plans', value: stats?.activePlans ?? '—', color: 'text-green-400 bg-green-400/10' },
    { icon: 'attach_money', label: 'Revenue', value: stats?.revenue ? `$${stats.revenue.toLocaleString()}` : '—', color: 'text-yellow-400 bg-yellow-400/10' },
    { icon: 'support_agent', label: 'Open Tickets', value: stats?.openTickets ?? '—', color: 'text-red-400 bg-red-400/10' },
  ];

  return (
    <AuthorityShell>
      <div className="pt-8">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-3">Admin <span className="text-primary-container">Operations.</span></h1>
          <p className="text-on-surface-variant">System overview and platform management.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="bg-surface-container rounded-xl p-8">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
                <Icon name={s.icon} size={24} />
              </div>
              <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-2">{s.label}</p>
              <p className="text-3xl font-black text-on-surface">{s.value}</p>
            </div>
          ))}
        </div>

        {/* System health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'API Gateway', status: 'Operational', uptime: '99.9%', color: 'text-green-400' },
            { label: 'Database', status: 'Operational', uptime: '100%', color: 'text-green-400' },
            { label: 'Judge System', status: 'Operational', uptime: '99.7%', color: 'text-green-400' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container rounded-xl p-6 flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${s.color.replace('text-', 'bg-')}`} />
              <div className="flex-1">
                <p className="font-semibold text-on-surface">{s.label}</p>
                <p className={`text-xs font-bold ${s.color}`}>{s.status}</p>
              </div>
              <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">{s.uptime}</span>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="bg-surface-container rounded-xl p-8">
          <h2 className="text-lg font-black tracking-tight mb-6">Recent Activity</h2>
          {loading ? (
            <div className="text-zinc-500 text-center py-8">Loading...</div>
          ) : (activity.length === 0 ? (
            <div className="text-zinc-500 text-center py-8">No recent activity.</div>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-center gap-4 bg-surface-container-low rounded-xl px-6 py-4">
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                    <Icon name="history" size={16} className="text-primary-container" />
                  </div>
                  <div className="flex-1">
                    <p className="text-on-surface text-sm">{a.action}</p>
                    {a.user && <p className="text-zinc-500 text-xs">{a.user}</p>}
                  </div>
                  <span className="text-zinc-600 text-xs">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </AuthorityShell>
  );
}
