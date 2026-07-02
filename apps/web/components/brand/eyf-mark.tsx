/**
 * EYF iconic mark — a Y-shaped upward arrow (a circuit/road path that forks up):
 * the student's journey to industry. Brand red on transparent, scalable. The
 * mark only (no wordmark/background) so it composes anywhere.
 * Source: eyf_iconic_mark.svg.
 */
export function EyfMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size * (250 / 200)}
      viewBox="-100 -96 200 250"
      fill="none"
      role="img"
      aria-label="EYF"
      className={className}
    >
      {/* stem */}
      <rect x="-18" y="60" width="36" height="90" rx="18" fill="#E8192C" />
      {/* arms */}
      <path d="M -18,60 L -18,20 L -90,-70 L -54,-70 L 0,12 Z" fill="#E8192C" />
      <path d="M 18,60 L 18,20 L 90,-70 L 54,-70 L 0,12 Z" fill="#E8192C" />
      {/* arrowhead caps */}
      <rect x="-96" y="-90" width="58" height="28" rx="12" fill="#E8192C" />
      <rect x="38" y="-90" width="58" height="28" rx="12" fill="#E8192C" />
      {/* fork dot */}
      <circle cx="0" cy="18" r="13" fill="#0E0E0E" />
      <circle cx="0" cy="18" r="7" fill="#ffffff" />
    </svg>
  );
}
