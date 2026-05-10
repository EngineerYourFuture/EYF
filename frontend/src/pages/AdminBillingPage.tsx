import { useEffect, useState } from "react";
import { ApiError, apiRequest } from "../lib/api";
import { getSession } from "../lib/session";

interface SubscriptionItem {
  id: string;
  userId: string;
  userEmail: string;
  plan: "free" | "basic" | "pro" | "elite";
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

export const AdminBillingPage = () => {
  const session = getSession();
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [events, setEvents] = useState<BillingEventItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!session) return;
    setError(null);
    try {
      const [subRes, eventRes] = await Promise.all([
        apiRequest<{ items: SubscriptionItem[] }>("/admin/billing/subscriptions", { token: session.accessToken }),
        apiRequest<{ items: BillingEventItem[] }>("/admin/billing/events", { token: session.accessToken })
      ]);
      setSubscriptions(subRes.items);
      setEvents(eventRes.items);
    } catch (unknownError) {
      setError(unknownError instanceof ApiError ? unknownError.message : "Failed to load admin billing data.");
    }
  };

  useEffect(() => {
    void load();
  }, [session?.accessToken]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Subscription and payment event visibility for operations.</p>
        </div>
        <button type="button" className="btn-secondary text-sm" onClick={() => void load()}>
          <i className="fa-solid fa-rotate-right" /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Subscriptions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                {["User", "Plan", "Status", "Period", "Provider Sub ID"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3.5 text-gray-900">{item.userEmail}</td>
                  <td className="px-5 py-3.5 capitalize text-gray-700">{item.plan}</td>
                  <td className="px-5 py-3.5">{item.status}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-500">{item.providerSubId}</td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-gray-400 text-center" colSpan={5}>No subscriptions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Billing events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                {["Type", "User", "Provider Event", "Processed At"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3.5 text-gray-900">{item.type}</td>
                  <td className="px-5 py-3.5 text-gray-700">{item.userEmail}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-gray-500">{item.providerEventId}</td>
                  <td className="px-5 py-3.5 text-gray-600">{new Date(item.processedAt).toLocaleString()}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td className="px-5 py-8 text-gray-400 text-center" colSpan={4}>No billing events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
