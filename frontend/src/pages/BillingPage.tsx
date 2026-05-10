import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}
interface PlansResponse {
  items: Plan[];
}

const DEFAULT_PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: 0, features: ['10 problems/day', 'Basic DSA', 'Community support'] },
  { id: 'basic', name: 'Basic', price: 9, features: ['50 problems/day', 'Core Subjects', 'Email support', 'Resume builder'] },
  { id: 'pro', name: 'Pro', price: 19, features: ['Unlimited problems', 'All modules', 'Mock interviews', 'Mentorship (2/mo)', 'Priority support'], popular: true },
  { id: 'elite', name: 'Elite', price: 39, features: ['Everything in Pro', 'Unlimited mentorship', 'Placement guarantee', 'Dedicated advisor', '1:1 sessions'] },
];

export function BillingPage() {
  const session = getSession();
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [currentPlan] = useState('free');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<PlansResponse>('/plans', { token: session.accessToken })
      .then((d) => { if (d.items?.length) setPlans(d.items); })
      .catch(() => {});
  }, [session?.accessToken]);

  const handleUpgrade = async (planId: string) => {
    if (!session?.accessToken) return;
    setLoadingPlan(planId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiRequest('/billing/change-plan', {
        method: 'POST',
        token: session.accessToken,
        body: { plan: planId },
      });
      setSuccessMsg('Plan upgraded successfully!');
    } catch {
      setErrorMsg('Failed to upgrade plan. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <AppShell>
      <div className="pt-8">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black tracking-tighter mb-3">Choose Your <span className="text-primary-container">Plan.</span></h1>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
            Unlock your full potential with the right tier of access.
          </p>
          {successMsg && (
            <div className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 rounded-full text-sm font-bold">
              <Icon name="check_circle" size={16} />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 rounded-full text-sm font-bold">
              <Icon name="error" size={16} />
              {errorMsg}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isPopular = plan.popular;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl p-8 flex flex-col ${
                  isPopular
                    ? 'bg-primary-container/10 border-2 border-primary-container'
                    : (isCurrent
                      ? 'bg-surface-container-high border border-white/10'
                      : 'bg-surface-container border border-white/5 hover:bg-surface-container-high transition-colors')
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-container text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-2">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-on-surface">${plan.price}</span>
                    <span className="text-zinc-500 text-sm">/mo</span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <Icon name="check" size={16} className="text-primary-container flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent || loadingPlan === plan.id}
                  onClick={() => !isCurrent && handleUpgrade(plan.id)}
                  className={`w-full py-3.5 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 ${
                    isCurrent
                      ? 'bg-surface-container-highest text-zinc-500 cursor-default'
                      : (isPopular
                        ? 'bg-primary-container text-white hover:brightness-110 shadow-lg shadow-red-900/20'
                        : 'bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-white')
                  }`}
                >
                  {isCurrent ? 'Current Plan' : (loadingPlan === plan.id ? 'Processing…' : 'Upgrade')}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-zinc-600 text-xs uppercase tracking-widest font-bold mt-12">
          All plans include a 7-day free trial. Cancel anytime.
        </p>
      </div>
    </AppShell>
  );
}
