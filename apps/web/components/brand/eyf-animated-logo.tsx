"use client";
/**
 * EYF animated logo — plays once on mount (the mark assembles + wordmark fades
 * in), then the dot pulses. Self-contained SVG + CSS-module animation.
 * Source: eyf_animated_logo.html.
 */
import styles from "./eyf-animated-logo.module.css";

export function EyfAnimatedLogo({ className, width = 260 }: { className?: string; width?: number }) {
  return (
    <svg viewBox="0 0 680 390" width={width} role="img" aria-label="EYF — Engineer Your Future" className={className}>
      <g className={styles.stem}>
        <rect x="322" y="235" width="36" height="90" rx="18" fill="#E8192C" />
      </g>
      <g className={styles.armLeft}>
        <path d="M 322,235 L 322,195 L 250,105 L 286,105 L 340,187 Z" fill="#E8192C" />
      </g>
      <g className={styles.armRight}>
        <path d="M 358,235 L 358,195 L 430,105 L 394,105 L 340,187 Z" fill="#E8192C" />
      </g>
      <g className={styles.capLeft}>
        <rect x="244" y="85" width="58" height="28" rx="12" fill="#E8192C" />
      </g>
      <g className={styles.capRight}>
        <rect x="378" y="85" width="58" height="28" rx="12" fill="#E8192C" />
      </g>
      <circle className={styles.dotOuter} cx="340" cy="193" r="13" fill="#0E0E0E" />
      <circle className={styles.dotInner} cx="340" cy="193" r="7" fill="#ffffff" />
      <text className={styles.wordmark} x="340" y="310" fontFamily="system-ui,-apple-system,sans-serif" fontSize="52" fontWeight="800" fill="#ffffff" letterSpacing="-1" textAnchor="middle">EYF</text>
      <text className={styles.tagline} x="340" y="344" fontFamily="system-ui,-apple-system,sans-serif" fontSize="11" fontWeight="500" fill="#ffffff" letterSpacing="5.5" textAnchor="middle">ENGINEER YOUR FUTURE</text>
    </svg>
  );
}
