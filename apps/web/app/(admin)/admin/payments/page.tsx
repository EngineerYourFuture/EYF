"use client";
import { Card, Badge, SkeletonRows } from "@eyf/ui";
import { useApi } from "@/lib/use-api";

type Overview = {
  activeSubscribers: number; mrrInr: number; totalRevenueInr: number;
  planBreakdown: { plan: string; count: number }[]; invoiceStats: Record<string, number>;
};
type Invoice = {
  id: string; amountInr: number; gstInr: number; status: string;
  paidAt: string | null; createdAt: string; plan: string; userName: string; userEmail: string;
};

const rupees = (n: number) => "₹" + n.toLocaleString("en-IN");
const fromPaisa = (p: number) => rupees(Math.round(p / 100));
const statusTone = (s: string) => (s === "paid" ? "easy" : s === "failed" ? "hard" : "medium");

export default function Page() {
  const { data: ov } = useApi<Overview>("/admin/payments/overview");
  const { data: invoices } = useApi<Invoice[]>("/admin/payments/invoices");

  return (
    <div className="px-6 lg:px-10 py-10 lg:py-12 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-bold tracking-tight">Payments</h1>
      <p className="text-text-3 mt-2">Revenue, subscriptions, and transactions.</p>

      {/* Metrics */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric label="Monthly recurring" value={ov ? fromPaisa(ov.mrrInr * 100) : undefined} hint="active paid subs, normalised" />
        <Metric label="Total revenue" value={ov ? fromPaisa(ov.totalRevenueInr * 100) : undefined} hint="all paid invoices" />
        <Metric label="Active subscribers" value={ov ? String(ov.activeSubscribers) : undefined} hint="paid, status active" />
      </div>

      {/* Plan mix + invoice status */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-display text-lg font-bold mb-3">Plan mix</h2>
          {!ov ? <SkeletonRows rows={2} /> : (
            <div className="flex flex-wrap gap-2">
              {ov.planBreakdown.map((p) => (
                <Badge key={p.plan} tone={p.plan === "FREE" ? "default" : "accent"}>{p.plan}: {p.count}</Badge>
              ))}
              {ov.planBreakdown.length === 0 && <span className="text-text-4 text-sm">No subscriptions yet.</span>}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="font-display text-lg font-bold mb-3">Invoices</h2>
          {!ov ? <SkeletonRows rows={2} /> : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(ov.invoiceStats).map(([s, n]) => (
                <Badge key={s} tone={statusTone(s)}>{s}: {n}</Badge>
              ))}
              {Object.keys(ov.invoiceStats).length === 0 && <span className="text-text-4 text-sm">No invoices yet.</span>}
            </div>
          )}
        </Card>
      </div>

      {/* Transactions */}
      <h2 className="font-display text-xl font-bold mt-8 mb-3">Recent transactions</h2>
      <div className="space-y-2">
        {!invoices && <SkeletonRows rows={4} />}
        {invoices?.map((i) => (
          <Card key={i.id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{i.userName}</span>
                <Badge tone={i.plan === "FREE" ? "default" : "accent"}>{i.plan}</Badge>
                <Badge tone={statusTone(i.status)}>{i.status}</Badge>
              </div>
              <div className="text-text-4 text-xs mt-0.5 truncate">
                {i.userEmail} · {new Date(i.paidAt ?? i.createdAt).toLocaleDateString("en-IN")}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono font-semibold">{fromPaisa(i.amountInr)}</div>
              {i.gstInr > 0 && <div className="text-text-4 text-xs">+{fromPaisa(i.gstInr)} GST</div>}
            </div>
          </Card>
        ))}
        {invoices?.length === 0 && (
          <p className="text-text-3 text-sm py-8 text-center">No transactions yet. Invoices appear here once students subscribe.</p>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value?: string; hint: string }) {
  return (
    <Card>
      <div className="text-text-3 text-xs uppercase tracking-wider">{label}</div>
      <div className="font-display text-3xl font-bold mt-2">{value ?? "—"}</div>
      <div className="text-text-4 text-xs mt-1">{hint}</div>
    </Card>
  );
}
