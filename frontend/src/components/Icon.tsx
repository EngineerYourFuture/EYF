interface IconProps {
  readonly name: string;
  readonly className?: string;
  readonly filled?: boolean;
  readonly size?: number;
}

export function Icon({ name, className = '', filled = false, size = 24 }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 200, 'GRAD' 0, 'opsz' ${size}`,
        fontSize: `${size}px`,
      }}
    >
      {name}
    </span>
  );
}
