import { useState, useEffect, type ReactNode } from 'react';
import { EYFLogo } from './EYFLogo';

const SPLASH_KEY = 'eyf_splash_shown';

export function SplashScreen({ children }: { readonly children: ReactNode }) {
  const [phase, setPhase] = useState<'splash' | 'fading' | 'done'>(() =>
    sessionStorage.getItem(SPLASH_KEY) ? 'done' : 'splash'
  );

  useEffect(() => {
    if (phase !== 'splash') return;
    // Hold for 2.4s (animation finishes ~2.2s), then fade out
    const holdTimer = setTimeout(() => setPhase('fading'), 2400);
    return () => clearTimeout(holdTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fading') return;
    const fadeTimer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, '1');
      setPhase('done');
    }, 500);
    return () => clearTimeout(fadeTimer);
  }, [phase]);

  if (phase === 'done') return <>{children}</>;

  return (
    <>
      {/* Render app underneath so it loads in background */}
      <div className="opacity-0 pointer-events-none absolute inset-0">{children}</div>

      {/* Splash overlay */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0E0E0E] transition-opacity duration-500"
        style={{ opacity: phase === 'fading' ? 0 : 1 }}
      >
        <EYFLogo animated size={260} />
      </div>
    </>
  );
}
