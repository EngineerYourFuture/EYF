import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, apiRequest } from "../lib/api";
import { getSession } from "../lib/session";

interface ApplicationItem {
  id: string;
  userEmail: string;
  module: string;
  assignedReviewerId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

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
      setError(unknownError instanceof ApiError ? `${unknownError.code}: ${unknownError.message}` : "Failed to load application.");
    }
  };

  useEffect(() => {
    void load();
  }, [session?.accessToken, id]);

  const act = async (action: "approve" | "reject") => {
    if (!session || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<ApplicationItem>(`/authority/applications/${id}/actions`, {
        method: "POST",
        token: session.accessToken,
        body: { action }
      });
      setItem(res);
    } catch (unknownError) {
      setError(unknownError instanceof ApiError ? `${unknownError.code}: ${unknownError.message}` : "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Application Detail</h1>
          <p className="text-sm text-gray-500 mt-1">Review and process authority application.</p>
        </div>
        <button type="button" className="btn-secondary text-sm" onClick={() => navigate("/authority/queue")}>
          Back to queue
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}

      {item ? (
        <div className="glass-card p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Application ID</p>
              <p className="text-sm font-mono text-gray-800 break-all">{item.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${item.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : (item.status === "rejected" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200")}`}>
                {item.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">User</p>
              <p className="text-sm text-gray-800">{item.userEmail}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Module</p>
              <p className="text-sm text-gray-800 capitalize">{item.module}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Assigned Reviewer</p>
              <p className="text-sm text-gray-800 font-mono">{item.assignedReviewerId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
              <p className="text-sm text-gray-800">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {item.status === "pending" && (
            <div className="flex gap-2">
              <button type="button" className="btn-primary text-sm" disabled={loading} onClick={() => void act("approve")}>
                Approve
              </button>
              <button type="button" className="btn-secondary text-sm" disabled={loading} onClick={() => void act("reject")}>
                Reject
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-10 text-center text-gray-400">Loading application...</div>
      )}
    </div>
  );
};
