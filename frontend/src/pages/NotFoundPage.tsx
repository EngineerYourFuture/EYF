import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EYFMark } from '../components/EYFLogo';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--t1)',
        padding: '32px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top accent */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #E82127 30%, #E82127 70%, transparent)' }} />

      {/* Ambient glows */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '40%', height: '40%', background: 'radial-gradient(ellipse, rgba(232,25,44,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '35%', height: '35%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.03) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 40, filter: 'drop-shadow(0 0 10px rgba(232,25,44,0.4))' }}
      >
        <EYFMark size={28} />
      </motion.div>

      {/* 404 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: 'Space Grotesk', fontWeight: 800,
          fontSize: 'clamp(5rem, 18vw, 11rem)',
          letterSpacing: '-0.05em', lineHeight: 1,
          color: '#E82127', textShadow: '0 0 60px rgba(232,25,44,0.25)',
          marginBottom: 0,
        }}
      >
        404
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <h1 style={{
          fontFamily: 'Space Grotesk', fontWeight: 700,
          fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', letterSpacing: '-0.02em',
          marginBottom: 12, marginTop: 16,
        }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: 'var(--t3)', maxWidth: 380, lineHeight: 1.7, margin: '0 auto 36px' }}>
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 22px', background: 'transparent', color: 'var(--t2)',
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              border: '1px solid var(--border)', cursor: 'pointer',
            }}
          >
            ← Go back
          </button>
          <Link
            to="/app/dashboard"
            style={{
              padding: '10px 22px', background: '#E82127', color: '#000',
              fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              border: 'none', cursor: 'pointer', textDecoration: 'none',
              display: 'inline-block', boxShadow: '0 4px 20px rgba(232,25,44,0.35)',
            }}
          >
            Go to dashboard
          </Link>
        </div>

        {/* Quick nav shortcuts */}
        <div style={{ marginTop: 48, display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Problems', path: '/app/problems' },
            { label: 'Progress', path: '/app/progress' },
            { label: 'Community', path: '/app/community' },
            { label: 'Leaderboard', path: '/app/leaderboard' },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{ fontSize: 12, color: 'var(--t4)', textDecoration: 'none', fontFamily: 'Space Grotesk', fontWeight: 600, letterSpacing: '0.02em' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
