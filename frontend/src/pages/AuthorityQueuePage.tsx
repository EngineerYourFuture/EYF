import { useEffect, useState } from 'react';
import { AuthorityShell } from '../components/AuthorityShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

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

const statusColor = (s: string) => {
  if (s === 'approved') return 'text-green-400 bg-green-400/10';
  if (s === 'rejected') return 'text-red-400 bg-red-400/10';
  if (s === 'reviewing') return 'text-yellow-400 bg-yellow-400/10';
  return 'text-zinc-400 bg-zinc-400/10';
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
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-3">Applications <span className="text-primary-container">Queue.</span></h1>
            <p className="text-on-surface-variant">Review and process incoming applications.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-surface-container rounded-full text-sm font-bold text-zinc-300">
              {items.filter((i) => i.status === 'pending').length} Pending
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 px-8 py-4 font-['Inter'] uppercase tracking-widest text-[10px] font-black text-zinc-500 mb-2">
          <div className="col-span-3">Email / ID</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {loading && <div className="text-center py-20 text-zinc-500">Loading queue...</div>}
        {!loading && items.length === 0 && (
          <div className="text-center py-20">
            <Icon name="done_all" size={48} className="text-green-400/40 mx-auto mb-4" />
            <p className="text-zinc-500">Queue is empty. All caught up!</p>
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 bg-surface-container rounded-xl px-8 py-5 hover:bg-surface-container-high transition-colors items-center">
                <div className="col-span-3">
                  <p className="font-semibold text-on-surface text-sm">{item.email ?? item.userId ?? item.id}</p>
                </div>
                <div className="col-span-2">
                  <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {item.type}
                  </span>
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="col-span-2 text-zinc-500 text-xs">
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
                <div className="col-span-3 flex items-center gap-2 justify-end">
                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => action(item.id, 'approve')}
                        disabled={actionLoading !== null}
                        className="px-4 py-2 bg-green-400/10 text-green-400 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-green-400/20 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `${item.id}-approve` ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => action(item.id, 'reject')}
                        disabled={actionLoading !== null}
                        className="px-4 py-2 bg-red-400/10 text-red-400 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-400/20 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `${item.id}-reject` ? '…' : 'Reject'}
                      </button>
                    </>
                  )}
                  {item.status !== 'pending' && (
                    <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Processed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthorityShell>
  );
}
