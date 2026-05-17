import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: 'billing', label: 'Billing & Plans', icon: 'credit_card' },
  { id: 'technical', label: 'Technical Issue', icon: 'bug_report' },
  { id: 'account', label: 'Account & Security', icon: 'manage_accounts' },
  { id: 'feature', label: 'Feature Request', icon: 'lightbulb' },
  { id: 'content', label: 'Content / Problem Error', icon: 'edit_note' },
  { id: 'other', label: 'Other', icon: 'help' },
];

const FAQS = [
  {
    category: 'Plans & Billing',
    questions: [
      { q: 'How do I upgrade my plan?', a: 'Go to Plans in the sidebar. You can upgrade directly from the plans page. Payment is processed securely via Stripe and your plan is activated instantly.' },
      { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime from your Account settings under the Billing tab. You\'ll retain access until the end of your current billing period.' },
      { q: 'Do you offer a student discount?', a: 'Yes! We offer 40% off for verified students. Email us from your .edu address or use the Student Verification flow in your profile settings.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex) and UPI. Indian users can also pay via Razorpay.' },
    ],
  },
  {
    category: 'Learning & Features',
    questions: [
      { q: 'How does the XP and leveling system work?', a: 'You earn XP by solving problems, completing OOP patterns, submitting behavioral answers, and more. Earn enough XP to level up from Newcomer to Legend.' },
      { q: 'How do I reset my progress on a topic?', a: 'You can\'t fully reset progress, but you can re-read or re-attempt any topic. Your completion status is auto-saved when you finish a topic.' },
      { q: 'Why is the algorithm visualizer not working?', a: 'The visualizer requires a problem statement and input to generate a trace. Make sure you\'ve selected an algorithm and provided valid test input before clicking Run.' },
      { q: 'How do I book a mentorship session?', a: 'Navigate to Mentorship in the sidebar, find a mentor whose specializations match your needs, and click "Book Session". Choose a session type and describe your goal.' },
    ],
  },
  {
    category: 'Technical',
    questions: [
      { q: 'Why isn\'t my submission being evaluated?', a: 'Submissions go through a queue. If it\'s stuck for >2 minutes, try refreshing. If the issue persists, check that your code compiles locally and submit a ticket.' },
      { q: 'The page is loading slowly. What should I do?', a: 'Try a hard refresh (Cmd/Ctrl+Shift+R). Clear your browser cache. If the issue persists, it may be a temporary server load — check our status page.' },
      { q: 'I can\'t log in despite correct credentials.', a: 'First, try "Forgot Password" to reset your password. If you signed up with Google, use the Google login button. If still stuck, contact support.' },
    ],
  },
];

const STATUS_META: Record<Ticket['status'], { label: string; color: string; bg: string }> = {
  open:        { label: 'Open',        color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  in_progress: { label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  resolved:    { label: 'Resolved',    color: 'text-green-400',  bg: 'bg-green-500/10' },
  closed:      { label: 'Closed',      color: 'text-zinc-500',   bg: 'bg-zinc-500/10' },
};

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
      <div className="pt-8 max-w-3xl">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-5xl font-black tracking-tighter mb-2">
            Help & <span className="text-primary-container">Support.</span>
          </h1>
          <p className="text-on-surface-variant">We're here to help you engineer your future.</p>
        </div>

        {/* Contact channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: 'chat_bubble', title: 'Live Chat', desc: 'Available 9 AM–6 PM IST', badge: 'Online', badgeColor: 'text-green-400 bg-green-500/10' },
            { icon: 'email', title: 'Email Support', desc: 'Response in 24 hours', badge: 'support@eyf.dev', badgeColor: 'text-blue-400 bg-blue-500/10' },
            { icon: 'menu_book', title: 'Documentation', desc: 'Guides and tutorials', badge: 'docs.eyf.dev', badgeColor: 'text-purple-400 bg-purple-500/10' },
          ].map((item) => (
            <div key={item.title} className="bg-surface-container rounded-xl p-5 flex items-start gap-4 hover:bg-surface-container-high transition-colors">
              <div className="w-10 h-10 bg-primary-container/10 rounded-xl flex items-center justify-center text-primary-container flex-shrink-0">
                <Icon name={item.icon} size={20} />
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm mb-0.5">{item.title}</p>
                <p className="text-xs text-zinc-500 mb-2">{item.desc}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>{item.badge}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-container p-1 rounded-full mb-8 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-container text-white shadow-lg shadow-red-900/20'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <Icon name={tab.icon} size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-8">
            {FAQS.map((section) => (
              <div key={section.category}>
                <p className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-zinc-600 mb-4">{section.category}</p>
                <div className="space-y-2">
                  {section.questions.map((faq) => {
                    const key = `${section.category}-${faq.q}`;
                    const isOpen = openFaq === key;
                    return (
                      <div key={faq.q} className="bg-surface-container rounded-xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : key)}
                          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-container-high transition-colors"
                        >
                          <span className="font-bold text-sm text-on-surface pr-4">{faq.q}</span>
                          <Icon
                            name="expand_more"
                            size={20}
                            className="text-zinc-500 flex-shrink-0 transition-transform duration-200"
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-5">
                            <p className="text-sm text-on-surface-variant leading-relaxed border-t border-zinc-800/50 pt-4">{faq.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="bg-primary-container/5 border border-primary-container/20 rounded-xl p-6 text-center">
              <Icon name="help_outline" className="text-primary-container mb-3 mx-auto" size={28} />
              <p className="font-bold mb-1">Didn't find what you're looking for?</p>
              <p className="text-sm text-zinc-500 mb-4">Our support team typically responds within 24 hours.</p>
              <button
                onClick={() => setActiveTab('new')}
                className="bg-primary-container text-white font-bold py-2.5 px-6 rounded-full text-sm hover:brightness-110 transition-all"
              >
                Submit a Ticket
              </button>
            </div>
          </div>
        )}

        {/* Tab: New Ticket */}
        {activeTab === 'new' && (
          <div className="bg-surface-container rounded-2xl p-8">
            <h2 className="text-lg font-black tracking-tight mb-6">Submit a Support Ticket</h2>

            {submitted ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="check_circle" size={32} className="text-green-400" filled />
                </div>
                <h3 className="text-xl font-black mb-2">Ticket Submitted!</h3>
                <p className="text-on-surface-variant text-sm mb-4">We'll get back to you within 24 hours. You can track your ticket under "My Tickets".</p>
                <button onClick={() => { setSubmitted(false); setActiveTab('history'); }} className="text-primary-container font-bold text-sm hover:underline">
                  View My Tickets →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category */}
                <div>
                  <p className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Category</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                          category === cat.id
                            ? 'border-primary-container/50 bg-primary-container/10 text-on-surface'
                            : 'border-zinc-800 hover:border-zinc-700 text-zinc-500'
                        }`}
                      >
                        <Icon name={cat.icon} size={14} className={category === cat.id ? 'text-primary-container' : 'text-zinc-600'} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <p className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Priority</p>
                  <div className="flex gap-2">
                    {([
                      { id: 'low', label: 'Low', color: 'text-green-400 border-green-500/30 bg-green-500/5' },
                      { id: 'medium', label: 'Medium', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5' },
                      { id: 'high', label: 'High', color: 'text-red-400 border-red-500/30 bg-red-500/5' },
                    ] as const).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`flex-1 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                          priority === p.id ? p.color : 'border-zinc-800 text-zinc-600 hover:border-zinc-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="ticket-subject" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Subject *</label>
                  <input
                    id="ticket-subject"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    className="w-full bg-surface-container-highest border border-zinc-800 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/40"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="ticket-desc" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Description *</label>
                  <textarea
                    id="ticket-desc"
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    rows={5}
                    className="w-full bg-surface-container-highest border border-zinc-800 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary-container/40 resize-none"
                    placeholder="Please describe your issue in detail. Include steps to reproduce if it's a bug, or your use case if it's a feature request..."
                    required
                  />
                  <p className="text-xs text-zinc-600 mt-1">{ticketDesc.length}/2000</p>
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-xl">
                    <Icon name="error" size={16} className="text-red-400" />
                    <p className="text-red-400 text-sm font-bold">{submitError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !ticketTitle.trim() || !ticketDesc.trim()}
                  className="w-full bg-primary-container text-white font-bold py-3.5 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submitting ? <><Icon name="hourglass_empty" size={16} />Submitting...</> : <><Icon name="send" size={16} />Submit Ticket</>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab: Ticket History */}
        {activeTab === 'history' && (
          <div>
            {tickets.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="receipt_long" size={40} className="text-zinc-700 mb-4" />
                <p className="font-bold text-on-surface-variant mb-2">No tickets yet</p>
                <p className="text-sm text-zinc-500 mb-6">Your support tickets will appear here.</p>
                <button onClick={() => setActiveTab('new')} className="bg-primary-container text-white font-bold py-2.5 px-6 rounded-full text-sm hover:brightness-110 transition-all">
                  Create a Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const status = STATUS_META[ticket.status];
                  const cat = CATEGORIES.find((c) => c.id === ticket.category);
                  return (
                    <div key={ticket.id} className="bg-surface-container rounded-xl p-5 flex items-center gap-4 flex-wrap">
                      <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon name={cat?.icon ?? 'help'} size={18} className="text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-on-surface truncate">{ticket.title}</p>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                          <span>{cat?.label ?? ticket.category}</span>
                          <span>·</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex-shrink-0 ${status.color} ${status.bg}`}>
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
