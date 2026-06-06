import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Card, Button, Badge } from "@eyf/ui";

const PLANS = [
  { id: "free",  name: "Free",  priceInr: 0,    features: ["5 submissions/day", "10 problems", "OS theory only"] },
  { id: "basic", name: "Basic", priceInr: 249,  features: ["20 submissions/day", "All core subjects", "SQL editor", "3 mocks/mo"] },
  { id: "pro",   name: "Pro",   priceInr: 499,  features: ["Unlimited", "AI mock interviews", "Resume ATS"], popular: true },
  { id: "elite", name: "Elite", priceInr: 899,  features: ["Everything in Pro", "2 expert mocks/mo", "Mentor priority"] },
] as const;

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
          Pay what a textbook costs.<br /><span className="text-accent">Get the whole path.</span>
        </h1>
        <p className="mt-4 text-text-2 max-w-2xl text-lg">
          ₹499/month vs ₹50,000–1,50,000 offline coaching. UPI / cards / wallets. Cancel any time.
        </p>

        <div className="mt-12 grid md:grid-cols-4 gap-4">
          {PLANS.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">{p.name}</h3>
                {"popular" in p && p.popular && <Badge tone="accent">Most popular</Badge>}
              </div>
              <div className="mt-3 font-display text-3xl font-bold">
                ₹{p.priceInr}<span className="text-base text-text-3"> /mo</span>
              </div>
              <ul className="mt-4 text-sm text-text-2 space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><span className="text-accent">▸</span>{f}</li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href={p.id === "free" ? "/sign-up" : "/billing"}>
                  <Button className="w-full">{p.id === "free" ? "Start free" : `Upgrade to ${p.name}`}</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
