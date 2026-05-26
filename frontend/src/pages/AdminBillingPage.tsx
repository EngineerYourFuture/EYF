import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { Icon } from '../components/Icon';

interface SubscriptionItem {
  id: string;
  userId: string;
  userEmail: string;
  plan: 'free' | 'basic' | 'pro' | 'elite';
  status: string;
  periodStart: string;
  periodEnd: string;
  providerSubId: string;
}

interface BillingEventItem {
  id: string;
  providerEventId: string;
  type: string;
  userId: string;
  userEmail: string;
  processedAt: string;
}

const PLAN_COLOR: Record<string, { color: string; bg: string }> = {
  elite: { color: '#fde68a', bg: 'rgba(250,204,21,0.1)' },
  pro:   { color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  basic: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  free:  { color: 'var(--t4)', bg: 'rgba(255,255,255,0.04)' },
};

export const AdminBillingPage = () => {
  const session = getSession();
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [events, setEvents] = useState<BillingEventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!session) return;
    setError(null);
    setLoading(true);
    try {
      const [subRes, eventRes] = await Promise.all([
        apiRequest<{ items: SubscriptionItem[] }>('/admin/billing/subscriptions', { token: session.accessToken }),
        apiRequest<{ items: BillingEventItem[] }>('/admin/billing/events', { token: session.accessToken }),
      ]);
      setSubscriptions(subRes.items);
      setEvents(eventRes.items);
    } catch (unknownError) {
      setError(unknownError instanceof ApiError ? unknownError.message : 'Failed to load billing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const thStyle: React.CSSProperties = {
    padding: '10px 16px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--t4)', textAlign: 'left',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  };
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px', fontSize: 13, color: 'var(--t2)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t4)', marginBottom: 4 }}>
            Admin
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--t1)' }}>Billing Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>
            Subscription and payment event visibility for operations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <Icon name="refresh" size={14} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
          background: 'rgba(232,33,39,0.08)', border: '1px solid rgba(232,33,39,0.2)',
          borderRadius: 10, color: '#FF5566', fontSize: 14,
        }}>
          <Icon name="error_outline" size={16} />
          {error}
        </div>
      )}

      {/* Subscriptions table */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="payments" size={15} style={{ color: '#c084fc' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Subscriptions</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--t4)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 999 }}>
            {subscriptions.length}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['User', 'Plan', 'Status', 'Period', 'Provider Sub ID'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((item) => {
                const planMeta = PLAN_COLOR[item.plan] ?? PLAN_COLOR.free;
                return (
                  <tr key={item.id} style={{ transition: 'background 0.1s' }}>
                    <td style={tdStyle}>{item.userEmail}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: planMeta.color, background: planMeta.bg }}>
                        {item.plan}
                      </span>
                    </td>
                    <td style={tdStyle}>{item.status}</td>
                    <td style={{ ...tdStyle, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                      {new Date(item.periodStart).toLocaleDateString()} – {new Date(item.periodEnd).toLocaleDateString()}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t4)' }}>
                      {item.providerSubId}
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--t4)', fontSize: 14 }}>
                    No subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing events table */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="receipt_long" size={15} style={{ color: '#4ade80' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Billing Events</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--t4)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 999 }}>
            {events.length}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Type', 'User', 'Provider Event', 'Processed At'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#60a5fa', background: 'rgba(96,165,250,0.08)', padding: '2px 8px', borderRadius: 4 }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={tdStyle}>{item.userEmail}</td>
                  <td style={{ ...tdStyle, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t4)' }}>
                    {item.providerEventId}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--t3)' }}>
                    {new Date(item.processedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--t4)', fontSize: 14 }}>
                    No billing events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
