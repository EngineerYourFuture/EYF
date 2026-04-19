import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

export function SupportPage() {
  const session = getSession();
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await apiRequest('/support/tickets', {
        method: 'POST',
        token: session?.accessToken,
        body: { title: ticketTitle, description: ticketDesc },
      });
      setSubmitted(true);
      setTicketTitle('');
      setTicketDesc('');
    } catch {
      setSubmitError('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AppShell>
      <div className="pt-8 max-w-3xl">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-3">Help & <span className="text-primary-container">Support.</span></h1>
          <p className="text-on-surface-variant">We're here to help you engineer your future.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-12">
          {[
            { icon: 'chat', title: 'Live Chat', desc: 'Chat with our support team in real-time.', action: 'Start Chat' },
            { icon: 'email', title: 'Email Support', desc: 'Send us an email and we\'ll respond within 24 hours.', action: 'Send Email' },
            { icon: 'menu_book', title: 'Documentation', desc: 'Browse our comprehensive docs and guides.', action: 'View Docs' },
          ].map((item) => (
            <div key={item.title} className="bg-surface-container rounded-xl p-8 flex items-center gap-6 hover:bg-surface-container-high transition-colors group">
              <div className="w-14 h-14 bg-primary-container/20 rounded-xl flex items-center justify-center text-primary-container flex-shrink-0">
                <Icon name={item.icon} size={26} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-on-surface mb-1">{item.title}</h3>
                <p className="text-on-surface-variant text-sm">{item.desc}</p>
              </div>
              <button className="px-6 py-2.5 bg-surface-container-high group-hover:bg-primary-container group-hover:text-white rounded-full text-[11px] font-bold uppercase tracking-widest transition-all">
                {item.action}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-surface-container rounded-xl p-8">
          <h2 className="text-lg font-black tracking-tight mb-6">Submit a Support Ticket</h2>
          {submitted ? (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl">
              <Icon name="check_circle" size={20} className="text-green-400" />
              <p className="text-green-400 font-bold text-sm">Ticket submitted! We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">Subject</label>
                <input
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface text-sm border-none focus:outline-none focus:ring-1 focus:ring-primary-container/50"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              <div>
                <label className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 block mb-2">Description</label>
                <textarea
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-container-low rounded-xl px-5 py-3.5 text-on-surface text-sm border-none focus:outline-none focus:ring-1 focus:ring-primary-container/50 resize-none"
                  placeholder="Please describe your issue in detail..."
                  required
                />
              </div>
              {submitError && (
                <p className="text-red-400 text-sm font-bold">{submitError}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary-container text-white font-bold px-8 py-3 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </form>
          )}
        </div>

        <div className="bg-surface-container rounded-xl p-8 mt-6">
          <h2 className="text-lg font-black tracking-tight mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How do I upgrade my plan?', a: 'Go to Billing in the sidebar to view and upgrade your current plan.' },
              { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel anytime from your billing settings.' },
              { q: 'How does the visualizer work?', a: 'Enter your algorithm and input, then click Run Trace to see step-by-step execution.' },
              { q: 'How do I book a mentorship session?', a: 'Navigate to the Mentorship page and click Book Session on any mentor card.' },
            ].map((faq, i) => (
              <div key={i} className="bg-surface-container-low rounded-xl p-6">
                <p className="font-bold text-on-surface mb-2">{faq.q}</p>
                <p className="text-on-surface-variant text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
