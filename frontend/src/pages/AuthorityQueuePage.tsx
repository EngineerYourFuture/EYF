import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AuthorityShell } from '../components/AuthorityShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

interface Application {
  id: string;
  userId?: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'reviewing';
  createdAt: string;
  email?: string;
  reason?: string;
}
interface QueueResponse {
  items: Application[];
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  approved:  { color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  rejected:  { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  reviewing: { color: '#facc15', bg: 'rgba(250,204,21,0.1)' },
  pending:   { color: 'var(--t2)', bg: 'rgba(161,161,170,0.1)' },
};

export function AuthorityQueuePage() {
  const session = getSession();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => {
    if (!session?.accessToken) return;
    apiRequest<QueueResponse>('/authority/queue', { token: session.accessToken })
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [session?.accessToken]);

  const action = async (id: string, act: 'approve' | 'reject') => {
    if (!session?.accessToken) return;
    setActionLoading(`${id}-${act}`);
    try {
      await apiRequest(`/authority/applications/${id}/actions`, { method: 'POST', token: session.accessToken, body: { action: act } });
      load();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AuthorityShell>
      <div className="pt-8">
        <div style={{ marginBottom: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1 }}>
              <span style={{ background: 'linear-gradient(135deg, #fff 40%, #E82127)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>APPLICATIONS QUEUE.</span>
            </h1>
            <p style={{ color: 'var(--t3)' }}>Review and process incoming applications.</p>
          </motion.div>
          <div style={{ ...GLASS, padding: '8px 16px', borderRadius: 999, fontSize: 14, fontWeight: 700, color: '#d4d4d8' }}>
            {items.filter((i) => i.status === 'pending').length} Pending
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4" style={{ padding: '0 32px 8px', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t4)' }}>
          <div className="col-span-3">Email / ID</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--t3)' }}>Loading queue...</div>}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Icon name="done_all" size={48} style={{ color: 'rgba(74,222,128,0.4)', marginBottom: 16 }} />
            <p style={{ color: 'var(--t3)' }}>Queue is empty. All caught up!</p>
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, i) => {
              const ss = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-12 gap-4 items-center"
                  style={{ ...GLASS, borderRadius: 14, padding: '20px 32px' }}
                >
                  <div className="col-span-3">
                    <p style={{ fontWeight: 600, color: 'var(--t1)', fontSize: 14 }}>{item.email ?? item.userId ?? item.id}</p>
                  </div>
                  <div className="col-span-2">
                    <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t2)' }}>
                      {item.type}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ss.color, background: ss.bg }}>
                      {item.status}
                    </span>
                  </div>
                  <div className="col-span-2" style={{ color: 'var(--t3)', fontSize: 12 }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-3 flex items-center gap-2 justify-end">
                    {item.status === 'pending' && (
                      <>
                        <motion.button
                          onClick={() => action(item.id, 'approve')}
                          disabled={actionLoading !== null}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          style={{ padding: '8px 16px', background: 'rgba(74,222,128,0.1)', color: '#4ade80', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', opacity: actionLoading !== null ? 0.5 : 1, border: '1px solid rgba(74,222,128,0.2)' }}
                        >
                          {actionLoading === `${item.id}-approve` ? '…' : 'Approve'}
                        </motion.button>
                        <motion.button
                          onClick={() => action(item.id, 'reject')}
                          disabled={actionLoading !== null}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          style={{ padding: '8px 16px', background: 'rgba(248,113,113,0.1)', color: '#f87171', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', opacity: actionLoading !== null ? 0.5 : 1, border: '1px solid rgba(248,113,113,0.2)' }}
                        >
                          {actionLoading === `${item.id}-reject` ? '…' : 'Reject'}
                        </motion.button>
                      </>
                    )}
                    {item.status !== 'pending' && (
                      <span style={{ color: 'var(--t4)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Processed</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AuthorityShell>
  );
}
