import type { CSSProperties } from 'react';

interface IconProps {
  readonly name: string;
  readonly className?: string;
  readonly filled?: boolean;
  readonly size?: number;
  readonly style?: CSSProperties;
}

export function Icon({ name, className = '', filled = false, size = 24, style }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 200, 'GRAD' 0, 'opsz' ${size}`,
        fontSize: `${size}px`,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
