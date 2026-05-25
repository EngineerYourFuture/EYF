import { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

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
  { name: 'Arjun K.', role: 'SWE at Google',               avatar: 'A', text: 'EYF Pro is what got me through my Google loop. The system design questions are spot-on for actual interview difficulty.', plan: 'Pro' },
  { name: 'Priya M.', role: 'SDE2 at Amazon',              avatar: 'P', text: 'The placement guarantee on Elite actually made me take the leap. Got my Amazon offer 3 months in. Best investment I made.', plan: 'Elite' },
  { name: 'Rohan S.', role: 'Backend Engineer at Razorpay', avatar: 'R', text: 'Coming from a non-CS background, the OOP patterns module was incredibly structured. The Pro plan is worth every rupee.', plan: 'Pro' },
];

function FeatureValue({ value }: { readonly value: boolean | string }) {
  if (value === true) return <Icon name="check_circle" size={18} filled style={{ color: '#4ade80', display: 'block', margin: '0 auto' }} />;
  if (value === false) return <Icon name="remove" size={18} style={{ color: '#3f3f46', display: 'block', margin: '0 auto' }} />;
  return <span style={{ fontSize: 12, fontWeight: 700, color: '#e4e4e7' }}>{value}</span>;
}

export function BillingPage() {
  const session = getSession();
  const { plan: currentPlan, refresh } = useUser();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showComparison, setShowComparison] = useState(false);

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
      const planLabel = planId === 'free' ? 'downgraded to Free' : `upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`;
      setSuccessMsg(`Successfully ${planLabel}!`);
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
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.1 }}>
            <span style={{ background: 'linear-gradient(135deg, #fff 40%, #E82127)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CHOOSE YOUR PLAN.</span>
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: 18, maxWidth: 480, margin: '0 auto 24px' }}>
            Everything you need to go from beginner to FAANG-ready.
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...GLASS, padding: 6, borderRadius: 999 }}>
            <motion.button
              onClick={() => setBilling('monthly')}
              whileHover={{ scale: 1.03 }}
              style={{ padding: '8px 20px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: billing === 'monthly' ? 'rgba(255,255,255,0.1)' : 'transparent', color: billing === 'monthly' ? '#fff' : '#71717a' }}
            >
              Monthly
            </motion.button>
            <motion.button
              onClick={() => setBilling('annual')}
              whileHover={{ scale: 1.03 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: billing === 'annual' ? 'rgba(255,255,255,0.1)' : 'transparent', color: billing === 'annual' ? '#fff' : '#71717a' }}
            >
              Annual
              <span style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 999, fontSize: 9, fontWeight: 900 }}>SAVE 25%</span>
            </motion.button>
          </div>

          {/* Alerts */}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', borderRadius: 999, fontSize: 14, fontWeight: 700 }}>
              <Icon name="check_circle" size={16} filled />
              {successMsg}
            </motion.div>
          )}
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', borderRadius: 999, fontSize: 14, fontWeight: 700 }}>
              <Icon name="error" size={16} />
              {errorMsg}
            </motion.div>
          )}
        </motion.div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" style={{ marginBottom: 32 }}>
          {PLANS.map((plan, i) => {
            const isCurrent = plan.id === (currentPlan ?? 'free');
            const isPopular = plan.popular;
            const price = getPrice(plan);
            const savings = getSavings(plan);

            const cardStyle = isPopular
              ? { background: 'rgba(232,33,39,0.08)', border: '2px solid rgba(232,33,39,0.35)', boxShadow: '0 0 40px rgba(232,33,39,0.12)' }
              : isCurrent
              ? { background: 'rgba(10,10,10,0.7)', border: '2px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)' }
              : GLASS;

            let btnStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' };
            if (isCurrent) btnStyle = { background: 'rgba(255,255,255,0.04)', color: '#52525b', border: '1px solid rgba(255,255,255,0.06)', cursor: 'default' };
            else if (isPopular) btnStyle = { background: '#E82127', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 0 24px rgba(232,33,39,0.3)' };

            let btnLabel: ReactNode = `Get ${plan.name}`;
            if (loadingPlan === plan.id) btnLabel = <><Icon name="hourglass_empty" size={14} />Processing...</>;
            else if (isCurrent) btnLabel = 'Current Plan';
            else if (plan.monthlyPrice === 0) btnLabel = 'Downgrade to Free';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{ ...cardStyle, borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', position: 'relative' }}
              >
                {/* Badge */}
                {plan.tag && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{ padding: '4px 16px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: isPopular ? '#E82127' : 'rgba(63,63,70,1)', color: isPopular ? '#fff' : '#d4d4d8' }}>
                      {plan.tag}
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div style={{ position: 'absolute', top: -14, right: 16 }}>
                    <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(63,63,70,1)', color: '#d4d4d8' }}>
                      Current
                    </span>
                  </div>
                )}

                {/* Price */}
                <div style={{ marginBottom: 24, paddingTop: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#71717a', marginBottom: 12 }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 48, fontWeight: 900, color: '#e4e4e7', lineHeight: 1 }}>${price}</span>
                    <span style={{ color: '#71717a', fontSize: 14 }}>/mo</span>
                    {billing === 'annual' && savings && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '2px 8px', borderRadius: 999 }}>{savings}% off</span>
                    )}
                  </div>
                  {billing === 'annual' && plan.annualPrice && (
                    <p style={{ fontSize: 10, color: '#71717a', marginTop: 4 }}>Billed as ${plan.annualPrice * 12}/year</p>
                  )}
                </div>

                {/* Features */}
                <ul style={{ flex: 1, marginBottom: 32 }} className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#a1a1aa' }}>
                      <Icon name="check" size={15} style={{ flexShrink: 0, marginTop: 2, color: isPopular ? '#E82127' : '#4ade80' }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.button
                  disabled={isCurrent || loadingPlan === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                  whileHover={!isCurrent ? { scale: 1.03 } : {}}
                  whileTap={!isCurrent ? { scale: 0.97 } : {}}
                  style={{ ...btnStyle, width: '100%', padding: '14px 0', borderRadius: 999, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {btnLabel}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', color: '#52525b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 48 }}>
          7-day free trial on Pro & Elite · Cancel anytime · No hidden fees
        </p>

        {/* Comparison table toggle */}
        <div style={{ maxWidth: 800, margin: '0 auto', marginBottom: 24, textAlign: 'center' }}>
          <motion.button
            onClick={() => setShowComparison(!showComparison)}
            whileHover={{ scale: 1.03 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', margin: '0 auto' }}
          >
            <Icon name="table_chart" size={16} />
            {showComparison ? 'Hide' : 'Show'} Full Feature Comparison
            <Icon name="expand_more" size={16} style={{ transform: showComparison ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </motion.button>
        </div>

        {/* Comparison table */}
        <AnimatePresence>
          {showComparison && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ maxWidth: 800, margin: '0 auto', marginBottom: 64, ...GLASS, borderRadius: 20, overflow: 'hidden' }}>
              <div className="grid grid-cols-4 gap-0 text-center">
                <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b' }}>Feature</p>
                </div>
                {['Free', 'Pro', 'Elite'].map((name, i) => (
                  <div key={name} style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: name === 'Pro' ? 'rgba(232,33,39,0.04)' : 'transparent' }}>
                    <p style={{ fontSize: 14, fontWeight: 900, color: name === 'Pro' ? '#E82127' : '#e4e4e7' }}>{name}</p>
                  </div>
                ))}
                {COMPARISON_FEATURES.map((feature, rowIdx) => (
                  <>
                    <div key={`${feature.label}-label`} style={{ padding: 16, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.04)', borderBottom: rowIdx < COMPARISON_FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontSize: 14, color: '#a1a1aa' }}>{feature.label}</span>
                    </div>
                    {(['free', 'pro', 'elite'] as const).map((col, i) => (
                      <div
                        key={`${feature.label}-${col}`}
                        style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none', borderBottom: rowIdx < COMPARISON_FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: col === 'pro' ? 'rgba(232,33,39,0.03)' : 'transparent' }}
                      >
                        <FeatureValue value={feature[col]} />
                      </div>
                    ))}
                  </>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Testimonials */}
        <div style={{ maxWidth: 800, margin: '0 auto', marginBottom: 48 }}>
          <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#52525b', marginBottom: 32 }}>What Our Engineers Say</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={{ ...GLASS, borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(232,33,39,0.12)', border: '1px solid rgba(232,33,39,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E82127', fontWeight: 900, flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#e4e4e7' }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: '#71717a' }}>{t.role}</p>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#E82127' }}>{t.plan} Plan</span>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.7 }}>"{t.text}"</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 600, margin: '0 auto', marginBottom: 64 }}>
          <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#52525b', marginBottom: 32 }}>Frequently Asked</p>
          <div className="space-y-3">
            {[
              { q: 'Is there a free trial?',                       a: "Yes. Pro and Elite plans include a 7-day free trial. You won't be charged until the trial ends." },
              { q: 'Can I switch plans later?',                    a: 'Absolutely. You can upgrade or downgrade anytime. When upgrading, you only pay the prorated difference.' },
              { q: 'What is the Placement Guarantee on Elite?',    a: "If you complete 80% of the Elite curriculum and don't receive an offer within 6 months, we'll refund 3 months of subscription. Full terms in our T&C." },
              { q: 'Do you support Indian payment methods?',       a: 'Yes. We support UPI, Paytm, RazorPay, and all Indian debit/credit cards. Pricing is also available in INR on checkout.' },
            ].map((faq, i) => (
              <motion.div key={faq.q} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={{ ...GLASS, borderRadius: 14, padding: 24 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#e4e4e7', marginBottom: 8 }}>{faq.q}</p>
                <p style={{ fontSize: 14, color: '#a1a1aa', lineHeight: 1.7 }}>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
