import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';

const LEVEL_NAMES = ['Newcomer','Learner','Explorer','Builder','Practitioner','Engineer','Senior','Lead','Architect','Expert','Legend'];

interface Props {
  readonly level: number;
  readonly onClose: () => void;
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * 360,
  delay: i * 0.06,
  size: [4, 6, 5, 4, 7, 5][i % 6],
}));

export function LevelUpModal({ level, onClose }: Props) {
  const name = LEVEL_NAMES[level] ?? 'Legend';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9997] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Backdrop */}
        <motion.div
          role="none"
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        />

        {/* Modal */}
        <motion.div
          className="relative max-w-sm w-full mx-4 text-center"
          style={{
            background: 'rgba(8,8,8,0.96)',
            border: '1px solid rgba(232,25,44,0.4)',
            borderRadius: 28,
            padding: 40,
            boxShadow: '0 0 0 1px rgba(232,25,44,0.1), 0 48px 120px rgba(0,0,0,0.9), 0 0 60px rgba(232,25,44,0.12)',
          }}
          initial={{ scale: 0.8, y: 40, filter: 'blur(12px)', opacity: 0 }}
          animate={{ scale: 1, y: 0, filter: 'blur(0px)', opacity: 1 }}
          exit={{ scale: 0.9, y: -20, filter: 'blur(8px)', opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 28, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(232,25,44,0.08) 0%, transparent 70%)',
          }} />

          {/* Particle ring */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>
            {PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  width: p.size, height: p.size,
                  borderRadius: '50%',
                  background: i % 3 === 0 ? '#E8192C' : i % 3 === 1 ? '#FF8C00' : '#FFD700',
                  boxShadow: `0 0 6px currentColor`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: Math.cos((p.angle * Math.PI) / 180) * 120,
                  y: Math.sin((p.angle * Math.PI) / 180) * 120,
                  opacity: 0,
                  scale: [0, 1.5, 0],
                }}
                transition={{ duration: 1.2, delay: p.delay, ease: 'easeOut' }}
              />
            ))}
          </div>

          {/* Stars above */}
          <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            {(['✨','⭐','✨'] as const).map((s, i) => (
              <motion.span
                key={`star-${s}-${i}`}
                className="text-xl"
                initial={{ y: 0 }}
                animate={{ y: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
              >{s}</motion.span>
            ))}
          </div>

          {/* Icon with pulsing ring */}
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px' }}>
            <motion.div
              style={{
                position: 'absolute', inset: -8, borderRadius: '50%',
                border: '2px solid rgba(232,25,44,0.4)',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
            <motion.div
              style={{
                position: 'absolute', inset: -16, borderRadius: '50%',
                border: '1px solid rgba(232,25,44,0.2)',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.4, ease: 'easeInOut' }}
            />
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: 'rgba(232,25,44,0.15)',
              border: '1px solid rgba(232,25,44,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(232,25,44,0.3)',
            }}>
              <Icon name="stars" size={40} className="text-[#E82127]" filled />
            </div>
          </div>

          <motion.p
            className="text-[10px] font-black uppercase tracking-[0.3em] mb-2"
            style={{ color: '#E8192C', textShadow: '0 0 16px rgba(232,25,44,0.5)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >Level Up!</motion.p>

          <motion.h2
            className="text-4xl font-black tracking-tighter text-white mb-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >Level {level}</motion.h2>

          <motion.p
            className="text-2xl font-bold mb-6"
            style={{ color: '#C0C0C0' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >{name}</motion.p>

          <motion.p
            className="text-sm mb-8"
            style={{ color: '#555' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            You've reached a new milestone. Keep pushing — the next level awaits.
          </motion.p>

          <motion.button
            onClick={onClose}
            className="w-full text-white font-black uppercase tracking-widest text-sm py-4 rounded-full transition-all"
            style={{
              background: 'linear-gradient(135deg, #E8192C, #FF2D42)',
              boxShadow: '0 4px 24px rgba(232,25,44,0.5), 0 1px 0 rgba(255,255,255,0.1) inset',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            whileHover={{ boxShadow: '0 8px 32px rgba(232,25,44,0.65)', scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Let's Go 🔥
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
