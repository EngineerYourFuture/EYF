import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { Icon } from '../components/Icon';

interface ApplicationItem {
  id: string;
  userEmail: string;
  module: string;
  assignedReviewerId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  approved: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', label: 'Approved' },
  rejected: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Rejected' },
  pending:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: 'Pending' },
};

export const AuthorityApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const [item, setItem] = useState<ApplicationItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!session || !id) return;
    setError(null);
    try {
      const res = await apiRequest<ApplicationItem>(`/authority/applications/${id}`, { token: session.accessToken });
      setItem(res);
    } catch (unknownError) {
      setError(unknownError instanceof ApiError ? `${unknownError.code}: ${unknownError.message}` : 'Failed to load application.');
    }
  };

  useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, id]);

  const act = async (action: 'approve' | 'reject') => {
    if (!session || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<ApplicationItem>(`/authority/applications/${id}/actions`, {
        method: 'POST',
        token: session.accessToken,
        body: { action },
      });
      setItem(res);
    } catch (unknownError) {
      setError(unknownError instanceof ApiError ? `${unknownError.code}: ${unknownError.message}` : 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const GLASS: React.CSSProperties = {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, padding: 24,
  };

  const ROW_LABEL: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--t4)', marginBottom: 4,
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={ROW_LABEL}>Authority · Applications</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--t1)' }}>
            Application Detail
          </h1>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/authority/queue')}
        >
          <Icon name="arrow_back" size={14} />
          Back to queue
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

      {item ? (
        <div style={GLASS}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <p style={ROW_LABEL}>Application ID</p>
              <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t2)', wordBreak: 'break-all' }}>{item.id}</p>
            </div>
            <div>
              <p style={ROW_LABEL}>Status</p>
              {(() => {
                const meta = STATUS_META[item.status] ?? STATUS_META.pending;
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                );
              })()}
            </div>
            <div>
              <p style={ROW_LABEL}>User</p>
              <p style={{ fontSize: 14, color: 'var(--t1)' }}>{item.userEmail}</p>
            </div>
            <div>
              <p style={ROW_LABEL}>Module</p>
              <p style={{ fontSize: 14, color: 'var(--t1)', textTransform: 'capitalize' }}>{item.module}</p>
            </div>
            <div>
              <p style={ROW_LABEL}>Assigned Reviewer</p>
              <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t3)' }}>{item.assignedReviewerId}</p>
            </div>
            <div>
              <p style={ROW_LABEL}>Created</p>
              <p style={{ fontSize: 13, color: 'var(--t3)' }}>{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {item.status === 'pending' && (
            <div style={{ display: 'flex', gap: 10, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={loading}
                onClick={() => void act('approve')}
              >
                <Icon name="check_circle" size={14} />
                Approve
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => void act('reject')}
              >
                <Icon name="cancel" size={14} />
                Reject
              </button>
            </div>
          )}
        </div>
      ) : !error && (
        <div style={{ ...GLASS, textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#E82127', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: 'var(--t4)', fontSize: 14 }}>Loading application…</p>
        </div>
      )}
    </div>
  );
};
