import { useEffect, useState } from 'react';

interface Props {
  readonly streak: number;
  readonly onClose: () => void;
}

const MILESTONES = new Set([7, 14, 30, 60, 100, 200, 365]);

export function StreakToast({ streak, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const exit = setTimeout(() => setVisible(false), 4200);
    const remove = setTimeout(onClose, 4700);
    return () => { cancelAnimationFrame(enter); clearTimeout(exit); clearTimeout(remove); };
  }, [onClose]);

  const isMilestone = MILESTONES.has(streak);

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-3 px-6 py-4 border shadow-2xl transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      } ${isMilestone
        ? 'bg-orange-950/80 border-orange-500/50 backdrop-blur-xl'
        : 'bg-[#1a1a1a] border-orange-500/30 backdrop-blur-xl'
      }`}
    >
      <span className="text-3xl">🔥</span>
      <div>
        <p className="text-white font-black text-base">
          {isMilestone ? `🏆 ${streak}-Day Streak Milestone!` : `${streak}-Day Streak!`}
        </p>
        <p className="text-orange-300/70 text-xs font-medium">
          {isMilestone ? 'Incredible consistency. You\'re unstoppable.' : 'Keep it going — don\'t break the chain!'}
        </p>
      </div>
    </div>
  );
}
