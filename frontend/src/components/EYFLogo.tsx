interface Props {
  animated?: boolean;
  size?: number;
  className?: string;
}

// Static mark — just the Y-arrow, no background, use as inline icon
export function EYFMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="230 75 220 260" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="322" y="235" width="36" height="90" rx="18" fill="#E8192C"/>
      <path d="M 322,235 L 322,195 L 250,105 L 286,105 L 340,187 Z" fill="#E8192C"/>
      <path d="M 358,235 L 358,195 L 430,105 L 394,105 L 340,187 Z" fill="#E8192C"/>
      <rect x="244" y="85" width="58" height="28" rx="12" fill="#E8192C"/>
      <rect x="378" y="85" width="58" height="28" rx="12" fill="#E8192C"/>
      <circle cx="340" cy="193" r="13" fill="currentColor"/>
      <circle cx="340" cy="193" r="7" fill="#ffffff"/>
    </svg>
  );
}

// Full logo — mark + wordmark + tagline, with optional entrance animation
export function EYFLogo({ animated = false, size = 200, className = '' }: Props) {
  return (
    <>
      {animated && (
        <style>{`
          .eyf-stem { transform-origin: 340px 310px; transform: scaleY(0); animation: eyfGrowUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; }
          .eyf-arm-l { clip-path: inset(0 100% 0 0); animation: eyfRevL 0.5s cubic-bezier(0.16,1,0.3,1) 0.55s forwards; }
          .eyf-arm-r { clip-path: inset(0 0 0 100%); animation: eyfRevR 0.5s cubic-bezier(0.16,1,0.3,1) 0.55s forwards; }
          .eyf-cap-l { opacity:0; transform-origin:273px 100px; transform:translate(0,8px) scale(0.6); animation: eyfCapIn 0.3s cubic-bezier(0.34,1.56,0.64,1) 1.0s forwards; }
          .eyf-cap-r { opacity:0; transform-origin:407px 100px; transform:translate(0,8px) scale(0.6); animation: eyfCapIn 0.3s cubic-bezier(0.34,1.56,0.64,1) 1.0s forwards; }
          .eyf-dot-o { opacity:0; transform-origin:340px 193px; transform:scale(0); animation: eyfDotPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 1.25s forwards; }
          .eyf-dot-i { opacity:0; transform-origin:340px 193px; transform:scale(0); animation: eyfDotPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 1.35s forwards, eyfPulse 2s ease-in-out 2.2s infinite; }
          .eyf-word  { opacity:0; transform:translateY(12px); animation: eyfFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 1.5s forwards; }
          .eyf-tag   { opacity:0; animation: eyfFadeIn 0.6s ease 1.9s forwards; }
          @keyframes eyfGrowUp  { from{transform:scaleY(0)} to{transform:scaleY(1)} }
          @keyframes eyfRevL    { from{clip-path:inset(0 100% 0 0)} to{clip-path:inset(0 0% 0 0)} }
          @keyframes eyfRevR    { from{clip-path:inset(0 0 0 100%)} to{clip-path:inset(0 0 0 0%)} }
          @keyframes eyfCapIn   { from{opacity:0;transform:translate(0,8px) scale(0.6)} to{opacity:1;transform:translate(0,0) scale(1)} }
          @keyframes eyfDotPop  { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }
          @keyframes eyfFadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
          @keyframes eyfFadeIn  { from{opacity:0} to{opacity:0.35} }
          @keyframes eyfPulse   { 0%,100%{r:7;opacity:1} 50%{r:10;opacity:0.6} }
        `}</style>
      )}
      <svg width={size} viewBox="0 0 680 390" xmlns="http://www.w3.org/2000/svg" className={className}>
        <g className={animated ? 'eyf-stem' : ''}>
          <rect x="322" y="235" width="36" height="90" rx="18" fill="#E8192C"/>
        </g>
        <g className={animated ? 'eyf-arm-l' : ''}>
          <path d="M 322,235 L 322,195 L 250,105 L 286,105 L 340,187 Z" fill="#E8192C"/>
        </g>
        <g className={animated ? 'eyf-arm-r' : ''}>
          <path d="M 358,235 L 358,195 L 430,105 L 394,105 L 340,187 Z" fill="#E8192C"/>
        </g>
        <g className={animated ? 'eyf-cap-l' : ''}>
          <rect x="244" y="85" width="58" height="28" rx="12" fill="#E8192C"/>
        </g>
        <g className={animated ? 'eyf-cap-r' : ''}>
          <rect x="378" y="85" width="58" height="28" rx="12" fill="#E8192C"/>
        </g>
        <circle cx="340" cy="193" r="13" fill="#0E0E0E" className={animated ? 'eyf-dot-o' : ''}/>
        <circle cx="340" cy="193" r="7" fill="#ffffff" className={animated ? 'eyf-dot-i' : ''}/>
        <text className={animated ? 'eyf-word' : ''} x="340" y="310" fontFamily="system-ui,-apple-system,sans-serif" fontSize="52" fontWeight="800" fill="#ffffff" letterSpacing="-1" textAnchor="middle">EYF</text>
        <text className={animated ? 'eyf-tag' : ''} x="340" y="344" fontFamily="system-ui,-apple-system,sans-serif" fontSize="11" fontWeight="500" fill="#ffffff" letterSpacing="5.5" textAnchor="middle" opacity="0.35">ENGINEER YOUR FUTURE</text>
      </svg>
    </>
  );
}
