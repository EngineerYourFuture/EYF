import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Icon } from './Icon';

function Toast({ id, amount, reason, onDone }: {
  readonly id: string;
  readonly amount: number;
  readonly reason?: string;
  readonly onDone: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enter = requestAnimationFrame(() => setVisible(true));
    // Start exit animation before removal
    const exit = setTimeout(() => setVisible(false), 2800);
    const remove = setTimeout(() => onDone(id), 3400);
    return () => { cancelAnimationFrame(enter); clearTimeout(exit); clearTimeout(remove); };
  }, [id, onDone]);

  return (
    <div
      className={`flex items-center gap-3 bg-[#1a1a1a] border border-[#E82127]/40 rounded-2xl px-5 py-3.5 shadow-2xl shadow-black/60 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
      }`}
    >
      <div className="w-9 h-9 rounded-xl bg-[#E82127]/20 flex items-center justify-center flex-shrink-0">
        <Icon name="bolt" size={20} className="text-[#E82127]" filled />
      </div>
      <div>
        <p className="text-white font-black text-base leading-none">+{amount} XP</p>
        {reason && <p className="text-zinc-400 text-[11px] mt-0.5 font-medium">{reason}</p>}
      </div>
    </div>
  );
}

export function XPToastContainer() {
  const { toasts, dismissToast } = useUser();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDone={dismissToast} />
      ))}
    </div>
  );
}
