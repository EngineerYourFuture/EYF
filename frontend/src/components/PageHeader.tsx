import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

type PageHeaderProps = Readonly<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  stats?: Array<{ value: string | number; label: string; color?: string }>;
  accentColor?: string;
}>;

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  stats,
  accentColor = '#E82127',
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'relative',
        paddingBottom: 36,
        marginBottom: 40,
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Full-width animated accent line at bottom */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: -1, left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80 60%, transparent)`,
          transformOrigin: 'left',
        }}
      />

      {/* Left accent bar */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: 2,
          height: '100%',
          background: `linear-gradient(180deg, ${accentColor}, transparent)`,
          transformOrigin: 'top',
        }}
      />

      <div style={{ paddingLeft: 20 }}>
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
            style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: accentColor,
              marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            <span style={{ display: 'inline-block', width: 16, height: 1, background: accentColor }} />
            {eyebrow}
          </motion.p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 0.92,
                textTransform: 'uppercase',
                color: 'var(--t1)',
                margin: 0,
                marginBottom: subtitle ? 14 : 0,
              }}
            >
              {title}
            </motion.h1>

            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.65, maxWidth: 520, marginTop: 4 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {actions && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
              style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 4 }}
            >
              {actions}
            </motion.div>
          )}
        </div>

        {stats && stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            style={{
              display: 'flex', gap: 0, flexWrap: 'wrap',
              marginTop: 24,
              borderTop: '1px solid var(--border)',
              paddingTop: 20,
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: '0 32px 0 0',
                  borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
                  marginRight: i < stats.length - 1 ? 32 : 0,
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}
              >
                <span style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
                  fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
                  color: s.color ?? 'var(--t1)',
                }}>
                  {s.value}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'var(--t4)',
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
