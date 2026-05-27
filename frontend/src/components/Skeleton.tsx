import type { CSSProperties } from 'react';

// Inject shimmer keyframe once on first import (SSR-safe)
if (typeof document !== 'undefined') {
  const id = 'sk-shimmer-kf';
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent =
      '@keyframes sk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
    document.head.appendChild(s);
  }
}

export function Skeleton({
  width,
  height = 16,
  borderRadius = 6,
  className,
  style,
}: {
  readonly width?: number | string;
  readonly height?: number | string;
  readonly borderRadius?: number;
  readonly className?: string;
  readonly style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'sk-shimmer 1.6s ease-in-out infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
