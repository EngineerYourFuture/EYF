import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice?: number;
  features: string[];
  popular?: boolean;
  tag?: string;
}

const PLANS: Plan[] = [
  {
    id: 'free', name: 'Free', monthlyPrice: 0,
    tag: 'Get Started',
    features: [
      '10 problems/day',
      'Basic DSA access',
      'OOP fundamentals',
      'Community forum',
      'Leaderboard',
    ],
  },
  {
    id: 'pro', name: 'Pro', monthlyPrice: 19, annualPrice: 14,
    tag: 'Most Popular', popular: true,
    features: [
      'Unlimited problems',
      'All DSA + OOP patterns',
      'System Design (10 questions)',
      'Cybersecurity CTFs',
      'Core Subjects (all)',
      'Resume builder + export',
      'Placement prep tracks',
      'Mentorship (2 sessions/mo)',
      'Career path enrollment',
      'Priority support',
    ],
  },
  {
    id: 'elite', name: 'Elite', monthlyPrice: 39, annualPrice: 29,
    tag: 'For Serious Engineers',
    features: [
      'Everything in Pro',
      'Unlimited mentorship sessions',
      'Expert 1:1 sessions (2/mo)',
      'All System Design questions',
      'Mock interviews (unlimited)',
      'Placement guarantee*',
      'Dedicated career advisor',
      'Early access to new features',
      'EYF Alumni network access',
      'White-glove onboarding',
    ],
  },
];

const COMPARISON_FEATURES = [
  { label: 'Daily Problems',      free: '10/day',     pro: 'Unlimited',    elite: 'Unlimited' },
  { label: 'DSA Problems',        free: '50 basic',    pro: '2,400+',       elite: '2,400+' },
  { label: 'OOP Patterns',        free: '5 patterns',  pro: '23 patterns',  elite: '23 patterns' },
  { label: 'System Design',       free: false,         pro: '10 questions', elite: 'All questions' },
  { label: 'Cybersecurity CTFs',  free: '2 beginner',  pro: 'All levels',   elite: 'All + exclusive' },
  { label: 'Mentorship Sessions', free: false,         pro: '2/month',      elite: 'Unlimited' },
  { label: 'Expert 1:1 Sessions', free: false,         pro: false,          elite: '2/month' },
  { label: 'Resume Builder',      free: false,         pro: true,           elite: true },
  { label: 'Placement Tracks',    free: false,         pro: true,           elite: true },
  { label: 'Mock Interviews',     free: false,         pro: '5/month',      elite: 'Unlimited' },
  { label: 'Priority Support',    free: false,         pro: true,           elite: true },
  { label: 'Career Advisor',      free: false,         pro: false,          elite: true },
];

const TESTIMONIALS = [
  { name: 'Arjun K.', role: 'SWE at Google', avatar: 'A', text: 'EYF Pro is what got me through my Google loop. The system design questions are spot-on for actual interview difficulty.', plan: 'Pro' },
  { name: 'Priya M.', role: 'SDE2 at Amazon', avatar: 'P', text: 'The placement guarantee on Elite actually made me take the leap. Got my Amazon offer 3 months in. Best investment I made.', plan: 'Elite' },
  { name: 'Rohan S.', role: 'Backend Engineer at Razorpay', avatar: 'R', text: 'Coming from a non-CS background, the OOP patterns module was incredibly structured. The Pro plan is worth every rupee.', plan: 'Pro' },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true) return <Icon name="check_circle" size={18} className="text-green-400 mx-auto" filled />;
  if (value === false) return <Icon name="remove" size={18} className="text-zinc-700 mx-auto" />;
  return <span className="text-xs font-bold text-on-surface">{value}</span>;
}

export function BillingPage() {
  const session = getSession();
  const { plan: currentPlan, refresh } = useUser();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  // Sync plan with backend
  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<{ plan: string }>('/billing/current', { token: session.accessToken })
      .catch(() => {});
  }, [session?.accessToken]);

  const handleUpgrade = async (planId: string) => {
    if (!session?.accessToken || planId === currentPlan) return;
    setLoadingPlan(planId);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiRequest('/billing/change-plan', {
        method: 'POST',
        token: session.accessToken,
        body: { plan: planId, billing },
      });
      setSuccessMsg(`Successfully ${planId === 'free' ? 'downgraded to Free' : `upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`}!`);
      refresh();
    } catch {
      setErrorMsg('Failed to change plan. Please try again or contact support.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return 0;
    return billing === 'annual' ? (plan.annualPrice ?? plan.monthlyPrice) : plan.monthlyPrice;
  };

  const getSavings = (plan: Plan) => {
    if (!plan.annualPrice || plan.monthlyPrice === 0) return null;
    return Math.round(((plan.monthlyPrice - plan.annualPrice) / plan.monthlyPrice) * 100);
  };

  return (
    <AppShell>
      <div className="pt-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tighter mb-3">
            Choose Your <span className="text-primary-container">Plan.</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto mb-6">
            Everything you need to go from beginner to FAANG-ready.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-surface-container p-1.5 rounded-full">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                billing === 'monthly' ? 'bg-surface-container-highest text-white' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                billing === 'annual' ? 'bg-surface-container-highest text-white' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              Annual
              <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[9px] font-black">SAVE 25%</span>
            </button>
          </div>

          {/* Alert messages */}
          {successMsg && (
            <div className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-sm font-bold">
              <Icon name="check_circle" size={16} filled />
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm font-bold">
              <Icon name="error" size={16} />
              {errorMsg}
            </div>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === (currentPlan ?? 'free');
            const isPopular = plan.popular;
            const price = getPrice(plan);
            const savings = getSavings(plan);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col transition-all ${
                  isPopular
                    ? 'bg-primary-container/10 border-2 border-primary-container shadow-[0_0_40px_rgba(232,33,39,0.12)]'
                    : isCurrent
                    ? 'bg-surface-container border-2 border-zinc-700'
                    : 'bg-surface-container border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Badge */}
                {plan.tag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      isPopular ? 'bg-primary-container text-white' : 'bg-zinc-700 text-zinc-300'
                    }`}>
                      {plan.tag}
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3.5 right-4">
                    <span className="bg-zinc-700 text-zinc-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Current
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-6 pt-2">
                  <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-3">{plan.name}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-on-surface">${price}</span>
                    <span className="text-zinc-500 text-sm">/mo</span>
                    {billing === 'annual' && savings && (
                      <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">{savings}% off</span>
                    )}
                  </div>
                  {billing === 'annual' && plan.annualPrice && (
                    <p className="text-[10px] text-zinc-500 mt-1">Billed as ${plan.annualPrice * 12}/year</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                      <Icon name="check" size={15} className={`flex-shrink-0 mt-0.5 ${isPopular ? 'text-primary-container' : 'text-green-400'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  disabled={isCurrent || loadingPlan === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-3.5 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-surface-container-highest text-zinc-600 cursor-default'
                      : isPopular
                      ? 'bg-primary-container text-white hover:brightness-110 shadow-lg shadow-red-900/20'
                      : 'bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-white border border-zinc-700'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <><Icon name="hourglass_empty" size={14} />Processing...</>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.monthlyPrice === 0 ? (
                    'Downgrade to Free'
                  ) : (
                    `Get ${plan.name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-zinc-600 text-xs uppercase tracking-widest font-bold mb-12">
          7-day free trial on Pro & Elite · Cancel anytime · No hidden fees
        </p>

        {/* Comparison table toggle */}
        <div className="max-w-5xl mx-auto mb-6 text-center">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-200 transition-colors mx-auto"
          >
            <Icon name="table_chart" size={16} />
            {showComparison ? 'Hide' : 'Show'} Full Feature Comparison
            <Icon name="expand_more" size={16} style={{ transform: showComparison ? 'rotate(180deg)' : 'rotate(0deg)' }} className="transition-transform" />
          </button>
        </div>

        {/* Comparison table */}
        {showComparison && (
          <div className="max-w-5xl mx-auto mb-16 bg-surface-container rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 gap-0 text-center">
              {/* Header */}
              <div className="p-5 border-b border-r border-zinc-800 text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Feature</p>
              </div>
              {['Free', 'Pro', 'Elite'].map((name, i) => (
                <div key={name} className={`p-5 border-b border-zinc-800 ${i < 2 ? 'border-r' : ''} ${name === 'Pro' ? 'bg-primary-container/5' : ''}`}>
                  <p className={`text-sm font-black ${name === 'Pro' ? 'text-primary-container' : 'text-on-surface'}`}>{name}</p>
                </div>
              ))}
              {/* Rows */}
              {COMPARISON_FEATURES.map((feature, rowIdx) => (
                <>
                  <div key={`${feature.label}-label`} className={`p-4 text-left border-r border-zinc-800/50 ${rowIdx < COMPARISON_FEATURES.length - 1 ? 'border-b' : ''}`}>
                    <span className="text-sm text-on-surface-variant font-medium">{feature.label}</span>
                  </div>
                  {(['free', 'pro', 'elite'] as const).map((col, i) => (
                    <div
                      key={`${feature.label}-${col}`}
                      className={`p-4 flex items-center justify-center ${i < 2 ? 'border-r' : ''} ${rowIdx < COMPARISON_FEATURES.length - 1 ? 'border-b' : ''} border-zinc-800/50 ${col === 'pro' ? 'bg-primary-container/5' : ''}`}
                    >
                      <FeatureValue value={feature[col]} />
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        <div className="max-w-5xl mx-auto mb-12">
          <h2 className="text-center font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-zinc-600 mb-8">What Our Engineers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-surface-container rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-black flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary-container">{t.plan} Plan</span>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-center font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-zinc-600 mb-8">Frequently Asked</h2>
          <div className="space-y-3">
            {[
              { q: 'Is there a free trial?', a: 'Yes. Pro and Elite plans include a 7-day free trial. You won\'t be charged until the trial ends.' },
              { q: 'Can I switch plans later?', a: 'Absolutely. You can upgrade or downgrade anytime. When upgrading, you only pay the prorated difference.' },
              { q: 'What is the Placement Guarantee on Elite?', a: 'If you complete 80% of the Elite curriculum and don\'t receive an offer within 6 months, we\'ll refund 3 months of subscription. Full terms in our T&C.' },
              { q: 'Do you support Indian payment methods?', a: 'Yes. We support UPI, Paytm, RazorPay, and all Indian debit/credit cards. Pricing is also available in INR on checkout.' },
            ].map((faq) => (
              <div key={faq.q} className="bg-surface-container rounded-xl p-6">
                <p className="font-bold text-sm text-on-surface mb-2">{faq.q}</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
