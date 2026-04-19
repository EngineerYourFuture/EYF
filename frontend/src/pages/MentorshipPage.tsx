import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';

const MENTORS = [
  { id: 1, name: 'Alex Chen', role: 'Senior SWE', company: 'Google', tags: ['DSA', 'System Design', 'LC 500+'], featured: true },
  { id: 2, name: 'Sarah Kim', role: 'Staff Engineer', company: 'Meta', tags: ['ML', 'Python', 'Career'] },
  { id: 3, name: 'Raj Patel', role: 'SWE II', company: 'Amazon', tags: ['Backend', 'AWS', 'Java'] },
  { id: 4, name: 'Maya Johnson', role: 'Principal SWE', company: 'Microsoft', tags: ['Leadership', 'Azure', 'C#'] },
  { id: 5, name: 'Lena Zhang', role: 'Tech Lead', company: 'Netflix', tags: ['Distributed Systems', 'Scala'] },
];

const TIME_SLOTS = [
  'Tomorrow 10:00 AM',
  'Tomorrow 2:00 PM',
  'Day After 9:00 AM',
  'Day After 4:00 PM',
];

export function MentorshipPage() {
  const [bookingMentor, setBookingMentor] = useState<typeof MENTORS[0] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [booked, setBooked] = useState(false);

  const handleConfirm = () => {
    if (!selectedSlot) return;
    setBooked(true);
    setTimeout(() => {
      setBookingMentor(null);
      setSelectedSlot('');
      setBooked(false);
    }, 2000);
  };

  return (
    <AppShell>
      <div className="pt-8">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-3">Mentorship <span className="text-primary-container">Network.</span></h1>
          <p className="text-on-surface-variant text-lg max-w-xl">
            Connect with elite engineers from top-tier companies for 1:1 guidance.
          </p>
        </div>

        {/* Featured mentor */}
        {MENTORS.filter((m) => m.featured).map((m) => (
          <div key={m.id} className="bg-surface-container rounded-xl p-10 mb-8 relative overflow-hidden border-l-4 border-primary-container">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 blur-[60px] rounded-full" />
            <div className="flex items-start gap-8">
              <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
                {m.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black">{m.name}</h2>
                  <span className="px-3 py-1 bg-primary-container/20 text-primary-container rounded-full text-[10px] font-bold uppercase tracking-widest">Featured</span>
                </div>
                <p className="text-on-surface-variant mb-4">{m.role} at {m.company}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {m.tags.map((t) => (
                    <span key={t} className="px-3 py-1 bg-surface-container-highest rounded-full text-xs font-bold text-zinc-300">{t}</span>
                  ))}
                </div>
                <button onClick={() => { setBookingMentor(m); setSelectedSlot(''); }} className="bg-primary-container text-white font-bold px-8 py-3 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95">
                  Book Session
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Mentor grid */}
        <h2 className="font-['Inter'] uppercase tracking-[0.3em] text-[10px] font-bold text-zinc-500 mb-6">All Mentors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MENTORS.filter((m) => !m.featured).map((m) => (
            <div key={m.id} className="bg-surface-container rounded-xl p-8 hover:bg-surface-container-high transition-colors group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center text-xl font-black text-on-surface">
                  {m.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{m.name}</h3>
                  <p className="text-on-surface-variant text-sm">{m.role}</p>
                  <p className="text-primary-container text-xs font-bold">{m.company}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {m.tags.map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold text-zinc-400">{t}</span>
                ))}
              </div>
              <button onClick={() => { setBookingMentor(m); setSelectedSlot(''); }} className="w-full border border-outline-variant/30 hover:border-primary-container hover:text-primary-container text-zinc-400 font-bold py-3 rounded-full text-[10px] uppercase tracking-widest transition-all">
                Book Session
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#131313]/80 backdrop-blur-md">
          <div className="bg-surface-container rounded-xl p-10 w-full max-w-md shadow-2xl">
            {booked ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon name="check_circle" size={32} className="text-green-400" />
                </div>
                <h2 className="text-xl font-black tracking-tight mb-2">Session Booked!</h2>
                <p className="text-on-surface-variant text-sm">
                  Your session with {bookingMentor.name} at {selectedSlot} is confirmed.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tight">Book a Session</h2>
                  <button onClick={() => setBookingMentor(null)} className="text-zinc-500 hover:text-white transition-colors">
                    <Icon name="close" size={24} />
                  </button>
                </div>

                {/* Mentor info */}
                <div className="flex items-center gap-4 mb-8 p-4 bg-surface-container-high rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-xl font-black text-white flex-shrink-0">
                    {bookingMentor.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{bookingMentor.name}</p>
                    <p className="text-on-surface-variant text-sm">{bookingMentor.role} at {bookingMentor.company}</p>
                  </div>
                </div>

                {/* Time slot picker */}
                <div className="mb-8">
                  <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-3">Select Time Slot</p>
                  <div className="space-y-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full px-5 py-3.5 rounded-xl text-left text-sm font-semibold transition-all border ${
                          selectedSlot === slot
                            ? 'border-primary-container bg-primary-container/10 text-primary-container'
                            : 'border-white/5 bg-surface-container-high text-on-surface-variant hover:border-white/20'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={!selectedSlot}
                  className="w-full bg-primary-container text-white font-bold py-4 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
