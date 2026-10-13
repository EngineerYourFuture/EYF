"use client";
import { toast } from "sonner";
import Script from "next/script";
import Link from "next/link";
import { Card, Button, Badge, SkeletonRows, ErrorState } from "@eyf/ui";
import { useApi, useApiAction } from "@/lib/use-api";
import { track, Events } from "@/lib/analytics";
import { useState } from "react";

type Plan = {
  id: "free" | "basic" | "pro" | "elite";
  name: string;
  priceInr: number;
  annualInr: number;
  features: string[];
};

declare global {
  interface Window {
    Razorpay?: new (options: object) => { open: () => void };
  }
}

export default function Page() {
  const { data: plans, error: plansError, mutate: reloadPlans } = useApi<Plan[]>("/billing/plans");
  const { data: billing, error: billingError, mutate: reloadBilling } = useApi<{ enabled: boolean }>("/billing/status");
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [pending, setPending] = useState<string | null>(null);
  const action = useApiAction();

  async function subscribe(planId: Exclude<Plan["id"], "free">) {
    if (!billing?.enabled) return;
    if (!window.Razorpay) {
      toast.error("Payments not ready — refresh and try again.");
      return;
    }
    setPending(planId);
    try {
      const order = await action<{ orderId: string; amountInr: number; keyId: string }>(
        "/billing/create-order",
        { method: "POST", body: JSON.stringify({ plan: planId, interval }) },
        { silent: true },
      );
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountInr * 100,
        currency: "INR",
        name: "EYF",
        description: `${planId.toUpperCase()} · ${interval}`,
        order_id: order.orderId,
        theme: { color: "#F5F5F5" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await action("/billing/confirm", {
            method: "POST",
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan: planId,
              interval,
            }),
          }, { silent: true });
          track(Events.PlanUpgraded, { plan: planId, interval, amountInr: order.amountInr });
          toast.success("Welcome to " + planId.toUpperCase());
        },
      });
      rzp.open();
    } catch (e) {
      toast.error("Couldn't start checkout: " + (e as Error).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl mx-auto">
      {billing?.enabled && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Plans and access</h1>
      <p className="text-text-2 mt-3 max-w-2xl">Keep your preparation moving. Choose your next step below.</p>

      {billing?.enabled === false && (
        <section aria-labelledby="preview-title" className="mt-8 rounded-xl border border-border p-5 sm:p-7">
          <h2 id="preview-title" className="font-display text-2xl font-semibold">Continue without payment</h2>
          <p className="mt-3 max-w-2xl text-text-2 leading-relaxed">
            Payment setup is coming later. During this preview, you can use student features without a paid plan.
            No card is required, and continuing won&apos;t create a subscription.
          </p>
          <Link href="/today" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-brand px-5 py-3 font-medium text-brand-ink hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
            Continue to my daily plan
          </Link>
        </section>
      )}
      {!billing && !billingError && <output  className="block mt-6 text-text-2">Checking plan availability…</output>}
      {billingError && (
        <div className="mt-6">
          <ErrorState message="We couldn't check plan availability. Retry, or continue to your daily plan." retry={() => reloadBilling()} />
          <Link href="/today" className="inline-flex min-h-11 items-center underline underline-offset-4">Continue to my daily plan</Link>
        </div>
      )}

      {billing?.enabled === false && <h2 className="mt-10 text-xl font-semibold">Planned pricing</h2>}
      {billing?.enabled === false && <p className="mt-2 text-text-2">For reference only. Checkout is unavailable during preview.</p>}

      <div className="mt-6 inline-flex border border-border rounded-md overflow-hidden text-sm">
        <button type="button"
          aria-pressed={interval === "monthly"}
          className={interval === "monthly" ? "bg-accent text-bg px-4 py-1.5" : "px-4 py-1.5 text-text-2"}
          onClick={() => setInterval("monthly")}
        >Monthly</button>
        <button type="button"
          aria-pressed={interval === "annual"}
          className={interval === "annual" ? "bg-accent text-bg px-4 py-1.5" : "px-4 py-1.5 text-text-2"}
          onClick={() => setInterval("annual")}
        >Annual</button>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {!plans && !plansError && <div className="col-span-full"><SkeletonRows rows={4} /></div>}
        {plansError && <div className="col-span-full"><ErrorState message="We couldn't load the plans." retry={() => reloadPlans()} /></div>}
        {plans?.map((p) => {
          const price = interval === "annual" ? p.annualInr : p.priceInr;
          const subscriptionAction = p.id === "free" ? (
                  <Link href="/today" className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2">Continue learning</Link>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => subscribe(p.id as Exclude<Plan["id"], "free">)}
                    disabled={pending === p.id}
                  >
                    {pending === p.id ? "Opening…" : `Upgrade to ${p.name}`}
                  </Button>
                );
  return (
            <Card key={p.id} className="flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-xl font-bold">{p.name}</h3>
                {p.id === "pro" && <Badge tone="accent">Most popular</Badge>}
              </div>
              <div className="mt-3 font-display text-3xl font-bold">
                ₹{price.toLocaleString("en-IN")}<span className="text-base text-text-2"> /{interval === "annual" ? "yr" : "mo"}</span>
              </div>
              <ul className="mt-4 text-sm text-text-2 space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className="mt-6">
                {!billing?.enabled ? (
                  <p className="text-sm text-text-2">{billing ? "No payment needed now" : "Checking availability"}</p>
                ) : subscriptionAction}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
