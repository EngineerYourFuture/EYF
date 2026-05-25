import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

const GLASS = { background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' } as const;

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: 'billing',   label: 'Billing & Plans',          icon: 'credit_card' },
  { id: 'technical', label: 'Technical Issue',           icon: 'bug_report' },
  { id: 'account',   label: 'Account & Security',        icon: 'manage_accounts' },
  { id: 'feature',   label: 'Feature Request',           icon: 'lightbulb' },
  { id: 'content',   label: 'Content / Problem Error',   icon: 'edit_note' },
  { id: 'other',     label: 'Other',                     icon: 'help' },
];

const FAQS = [
  {
    category: 'Plans & Billing',
    questions: [
      { q: 'How do I upgrade my plan?', a: 'Go to Plans in the sidebar. You can upgrade directly from the plans page. Payment is processed securely via Stripe and your plan is activated instantly.' },
      { q: 'Can I cancel my subscription?', a: "Yes, you can cancel anytime from your Account settings under the Billing tab. You'll retain access until the end of your current billing period." },
      { q: 'Do you offer a student discount?', a: 'Yes! We offer 40% off for verified students. Email us from your .edu address or use the Student Verification flow in your profile settings.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex) and UPI. Indian users can also pay via Razorpay.' },
    ],
  },
  {
    category: 'Learning & Features',
    questions: [
      { q: 'How does the XP and leveling system work?', a: 'You earn XP by solving problems, completing OOP patterns, submitting behavioral answers, and more. Earn enough XP to level up from Newcomer to Legend.' },
      { q: 'How do I reset my progress on a topic?', a: "You can't fully reset progress, but you can re-read or re-attempt any topic. Your completion status is auto-saved when you finish a topic." },
      { q: 'Why is the algorithm visualizer not working?', a: "The visualizer requires a problem statement and input to generate a trace. Make sure you've selected an algorithm and provided valid test input before clicking Run." },
      { q: 'How do I book a mentorship session?', a: 'Navigate to Mentorship in the sidebar, find a mentor whose specializations match your needs, and click "Book Session". Choose a session type and describe your goal.' },
    ],
  },
  {
    category: 'Technical',
    questions: [
      { q: "Why isn't my submission being evaluated?", a: "Submissions go through a queue. If it's stuck for >2 minutes, try refreshing. If the issue persists, check that your code compiles locally and submit a ticket." },
      { q: 'The page is loading slowly. What should I do?', a: 'Try a hard refresh (Cmd/Ctrl+Shift+R). Clear your browser cache. If the issue persists, it may be a temporary server load — check our status page.' },
      { q: "I can't log in despite correct credentials.", a: 'First, try "Forgot Password" to reset your password. If you signed up with Google, use the Google login button. If still stuck, contact support.' },
    ],
  },
];

const STATUS_META: Record<Ticket['status'], { label: string; color: string; bg: string }> = {
  open:        { label: 'Open',        color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  in_progress: { label: 'In Progress', color: '#facc15', bg: 'rgba(250,204,21,0.1)'  },
  resolved:    { label: 'Resolved',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
  closed:      { label: 'Closed',      color: 'var(--t3)', bg: 'rgba(113,113,122,0.1)' },
};

const INPUT_STYLE = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: 'var(--t1)', outline: 'none', boxSizing: 'border-box' } as const;

export function SupportPage() {
  const session = getSession();
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'faq'>('faq');
  const [category, setCategory] = useState('technical');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken || activeTab !== 'history') return;
    apiRequest<{ tickets: Ticket[] }>('/support/tickets', { token: session.accessToken })
      .then((d) => { if (d.tickets) setTickets(d.tickets); })
      .catch(() => {});
  }, [session?.accessToken, activeTab]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const created = await apiRequest<Ticket>('/support/tickets', {
        method: 'POST',
        token: session?.accessToken,
        body: { title: ticketTitle, description: ticketDesc, category, priority },
      });
      setSubmitted(true);
      setTickets((prev) => [created, ...prev]);
      setTicketTitle('');
      setTicketDesc('');
    } catch {
      setSubmitError('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const TABS = [
    { id: 'faq' as const, label: 'FAQ', icon: 'help_center' },
    { id: 'new' as const, label: 'New Ticket', icon: 'edit' },
    { id: 'history' as const, label: 'My Tickets', icon: 'receipt_long' },
  ];

  return (
    <AppShell>
      <div className="pt-8 max-w-3xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1 }}>
            <span style={{ background: 'linear-gradient(135deg, #fff 40%, #E82127)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HELP & SUPPORT.</span>
          </h1>
          <p style={{ color: 'var(--t3)' }}>We're here to help you engineer your future.</p>
        </motion.div>

        {/* Contact channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 32 }}>
          {[
            { icon: 'chat_bubble', title: 'Live Chat',      desc: 'Available 9 AM–6 PM IST', badge: 'Online',         iconColor: '#4ade80',  badgeColor: '#4ade80',  badgeBg: 'rgba(74,222,128,0.1)'   },
            { icon: 'email',       title: 'Email Support',  desc: 'Response in 24 hours',    badge: 'support@eyf.dev', iconColor: '#60a5fa',  badgeColor: '#60a5fa',  badgeBg: 'rgba(96,165,250,0.1)'   },
            { icon: 'menu_book',   title: 'Documentation',  desc: 'Guides and tutorials',    badge: 'docs.eyf.dev',    iconColor: '#c084fc',  badgeColor: '#c084fc',  badgeBg: 'rgba(192,132,252,0.1)'  },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={{ ...GLASS, borderRadius: 14, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.iconColor}18`, border: `1px solid ${item.iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={item.icon} size={20} style={{ color: item.iconColor }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 14, marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>{item.desc}</p>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, color: item.badgeColor, background: item.badgeBg }}>{item.badge}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, ...GLASS, padding: 4, borderRadius: 999, width: 'fit-content', marginBottom: 32 }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: 'none', background: active ? 'rgba(232,33,39,0.14)' : 'transparent', color: active ? '#fff' : '#71717a', boxShadow: active ? '0 0 12px rgba(232,33,39,0.18)' : 'none', transition: 'all 0.2s' }}
              >
                <Icon name={tab.icon} size={13} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Tab: FAQ */}
          {activeTab === 'faq' && (
            <motion.div key="faq" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-8">
              {FAQS.map((section) => (
                <div key={section.category}>
                  <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--t4)', marginBottom: 16 }}>{section.category}</p>
                  <div className="space-y-2">
                    {section.questions.map((faq) => {
                      const key = `${section.category}-${faq.q}`;
                      const isOpen = openFaq === key;
                      return (
                        <div key={faq.q} style={{ ...GLASS, borderRadius: 14, overflow: 'hidden' }}>
                          <button
                            type="button"
                            onClick={() => setOpenFaq(isOpen ? null : key)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', paddingRight: 16 }}>{faq.q}</span>
                            <Icon name="expand_more" size={20} style={{ color: 'var(--t3)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                                  <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7 }}>{faq.a}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'rgba(232,33,39,0.05)', border: '1px solid rgba(232,33,39,0.15)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                <Icon name="help_outline" size={28} style={{ color: '#E82127', display: 'block', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Didn't find what you're looking for?</p>
                <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 16 }}>Our support team typically responds within 24 hours.</p>
                <motion.button
                  onClick={() => setActiveTab('new')}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '10px 24px', borderRadius: 999, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}
                >
                  Submit a Ticket
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* Tab: New Ticket */}
          {activeTab === 'new' && (
            <motion.div key="new" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ ...GLASS, borderRadius: 16, padding: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 24, color: 'var(--t1)' }}>Submit a Support Ticket</h2>

              {submitted ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 64, height: 64, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Icon name="check_circle" size={32} style={{ color: '#4ade80' }} filled />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)', marginBottom: 8 }}>Ticket Submitted!</h3>
                  <p style={{ color: 'var(--t2)', fontSize: 14, marginBottom: 16 }}>We'll get back to you within 24 hours. You can track your ticket under "My Tickets".</p>
                  <button onClick={() => { setSubmitted(false); setActiveTab('history'); }} style={{ color: '#E82127', fontWeight: 700, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}>
                    View My Tickets →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Category */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t2)', marginBottom: 12 }}>Category</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => {
                        const active = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700, textAlign: 'left', cursor: 'pointer', border: active ? '1px solid rgba(232,33,39,0.4)' : '1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(232,33,39,0.1)' : 'rgba(255,255,255,0.03)', color: active ? '#e4e4e7' : '#71717a' }}
                          >
                            <Icon name={cat.icon} size={14} style={{ color: active ? '#E82127' : '#52525b' }} />
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t2)', marginBottom: 12 }}>Priority</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([
                        { id: 'low',    label: 'Low',    color: '#4ade80', bg: 'rgba(74,222,128,0.1)'  },
                        { id: 'medium', label: 'Medium', color: '#facc15', bg: 'rgba(250,204,21,0.1)'  },
                        { id: 'high',   label: 'High',   color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
                      ] as const).map((p) => {
                        const active = priority === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPriority(p.id)}
                            style={{ flex: 1, padding: '8px 0', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', border: active ? `1px solid ${p.color}50` : '1px solid rgba(255,255,255,0.08)', background: active ? p.bg : 'transparent', color: active ? p.color : '#71717a' }}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="ticket-subject" style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t2)', marginBottom: 8 }}>Subject *</label>
                    <input
                      id="ticket-subject"
                      value={ticketTitle}
                      onChange={(e) => setTicketTitle(e.target.value)}
                      style={INPUT_STYLE}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="ticket-desc" style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t2)', marginBottom: 8 }}>Description *</label>
                    <textarea
                      id="ticket-desc"
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      rows={5}
                      style={{ ...INPUT_STYLE, resize: 'none' }}
                      placeholder="Please describe your issue in detail. Include steps to reproduce if it's a bug, or your use case if it's a feature request..."
                      required
                    />
                    <p style={{ fontSize: 12, color: 'var(--t4)', marginTop: 4 }}>{ticketDesc.length}/2000</p>
                  </div>

                  {submitError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12 }}>
                      <Icon name="error" size={16} style={{ color: '#f87171' }} />
                      <p style={{ color: '#f87171', fontSize: 14, fontWeight: 700 }}>{submitError}</p>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={submitting || !ticketTitle.trim() || !ticketDesc.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ width: '100%', background: '#E82127', color: '#fff', fontWeight: 700, padding: '14px 0', borderRadius: 999, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: (submitting || !ticketTitle.trim() || !ticketDesc.trim()) ? 0.4 : 1, boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}
                  >
                    {submitting ? <><Icon name="hourglass_empty" size={16} />Submitting...</> : <><Icon name="send" size={16} />Submit Ticket</>}
                  </motion.button>
                </form>
              )}
            </motion.div>
          )}

          {/* Tab: Ticket History */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {tickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0' }}>
                  <Icon name="receipt_long" size={40} style={{ color: '#3f3f46', display: 'block', margin: '0 auto 16px' }} />
                  <p style={{ fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>No tickets yet</p>
                  <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 24 }}>Your support tickets will appear here.</p>
                  <motion.button
                    onClick={() => setActiveTab('new')}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{ background: '#E82127', color: '#fff', fontWeight: 700, padding: '10px 24px', borderRadius: 999, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(232,33,39,0.3)' }}
                  >
                    Create a Ticket
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket, i) => {
                    const status = STATUS_META[ticket.status];
                    const cat = CATEGORIES.find((c) => c.id === ticket.category);
                    return (
                      <motion.div key={ticket.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ ...GLASS, borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name={cat?.icon ?? 'help'} size={18} style={{ color: 'var(--t2)' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)' }}>{ticket.title}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
                            <span>{cat?.label ?? ticket.category}</span>
                            <span>·</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 12px', borderRadius: 999, color: status.color, background: status.bg, border: `1px solid ${status.color}30`, flexShrink: 0 }}>
                          {status.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
