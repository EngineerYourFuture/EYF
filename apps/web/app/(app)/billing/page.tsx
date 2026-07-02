"use client";
import { toast } from "sonner";
import Script from "next/script";
import { Card, Button, Badge } from "@eyf/ui";
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
  const { data: plans } = useApi<Plan[]>("/billing/plans");
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [pending, setPending] = useState<string | null>(null);
  const action = useApiAction();

  async function subscribe(planId: Exclude<Plan["id"], "free">) {
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
    <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12 max-w-5xl">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="font-display text-4xl font-bold tracking-tight">Pricing</h1>
      <p className="text-text-3 mt-2">Honest pricing. UPI / cards / wallets. Cancel any time.</p>

      <div className="mt-6 inline-flex border border-border rounded-md overflow-hidden text-sm">
        <button
          className={interval === "monthly" ? "bg-accent text-bg px-4 py-1.5" : "px-4 py-1.5 text-text-2"}
          onClick={() => setInterval("monthly")}
        >Monthly</button>
        <button
          className={interval === "annual" ? "bg-accent text-bg px-4 py-1.5" : "px-4 py-1.5 text-text-2"}
          onClick={() => setInterval("annual")}
        >Annual · save 30%</button>
      </div>

      <div className="mt-10 grid md:grid-cols-4 gap-4">
        {plans?.map((p) => {
          const price = interval === "annual" ? p.annualInr : p.priceInr;
          return (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">{p.name}</h3>
                {p.id === "pro" && <Badge tone="accent">Most popular</Badge>}
              </div>
              <div className="mt-3 font-display text-3xl font-bold">
                ₹{price}<span className="text-base text-text-3"> /{interval === "annual" ? "yr" : "mo"}</span>
              </div>
              <ul className="mt-4 text-sm text-text-2 space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><span className="text-accent">▸</span>{f}</li>
                ))}
              </ul>
              <div className="mt-6">
                {p.id === "free" ? (
                  <Button variant="secondary" disabled className="w-full">Current</Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => subscribe(p.id as Exclude<Plan["id"], "free">)}
                    disabled={pending === p.id}
                  >
                    {pending === p.id ? "Opening…" : `Upgrade to ${p.name}`}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
