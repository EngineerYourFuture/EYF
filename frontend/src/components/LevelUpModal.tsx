import { useEffect, useState } from 'react';
import { Icon } from './Icon';

const LEVEL_NAMES = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];

interface Props {
  readonly level: number;
  readonly onClose: () => void;
}

export function LevelUpModal({ level, onClose }: Props) {
  const [visible, setVisible] = useState(false);
  const name = LEVEL_NAMES[level] ?? 'Legend';

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[9997] flex items-center justify-center transition-all duration-400 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div role="presentation" className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleClose} onKeyDown={(e) => { if (e.key === 'Escape') handleClose(); }} />

      <div
        className={`relative bg-[#111] border border-[#E82127]/40 rounded-3xl p-10 max-w-sm w-full mx-4 text-center shadow-2xl shadow-black/80 transition-all duration-500 ${
          visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'
        }`}
      >
        {/* Glow */}
        <div className="absolute inset-0 rounded-3xl bg-[#E82127]/5 pointer-events-none" />

        {/* Stars */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
          {['✨','⭐','✨'].map((s, i) => (
            <span key={i} className="text-xl animate-bounce" style={{ animationDelay: `${i * 150}ms` }}>{s}</span>
          ))}
        </div>

        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-[#E82127]/20 border border-[#E82127]/40 flex items-center justify-center">
          <Icon name="stars" size={40} className="text-[#E82127]" filled />
        </div>

        <p className="text-[#E82127] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Level Up!</p>
        <h2 className="text-4xl font-black tracking-tighter text-white mb-1">Level {level}</h2>
        <p className="text-2xl font-bold text-zinc-300 mb-6">{name}</p>

        <p className="text-zinc-500 text-sm mb-8">
          You've reached a new milestone. Keep pushing — the next level awaits.
        </p>

        <button
          onClick={handleClose}
          className="w-full bg-[#E82127] text-white font-black uppercase tracking-widest text-sm py-4 rounded-full hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-red-900/30"
        >
          Let's Go 🔥
        </button>
      </div>
    </div>
  );
}
