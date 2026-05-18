import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

/* ── helpers ──────────────────────────────────────────────────────────────── */

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 5;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 5;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 5;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 5;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/* ─────────────────────────────────────────────────────────────────────────────
   XP LINE CHART
   ───────────────────────────────────────────────────────────────────────────── */

export function XPLineChart({ weeklyHistory }: { readonly weeklyHistory?: number[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [hover, setHover] = useState<number | null>(null);

  const W = 320, H = 110, padL = 28, padR = 12, padT = 12, padB = 28;
  const data = weeklyHistory?.length ? weeklyHistory : [60, 180, 120, 340, 260, 480, 380, 620];
  const labels = ['7w','6w','5w','4w','3w','2w','1w','now'];
  const maxVal = Math.max(...data, 1);
  const pts: [number, number][] = data.map((v, i) => [
    padL + (i / (data.length - 1)) * (W - padL - padR),
    padT + (1 - v / maxVal) * (H - padT - padB),
  ]);
  const line  = smoothPath(pts);
  const area  = `${line} L ${pts[pts.length-1][0]} ${H - padB} L ${pts[0][0]} ${H - padB} Z`;
  return (
    <div className="chart-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>XP Progress</p>
          <p className="text-xs" style={{ color: 'var(--t3)' }}>Weekly earned XP</p>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--red-muted)', color: 'var(--red)' }}>
          +{data[data.length - 1]}
        </span>
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: 110 }}>
        <defs>
          <linearGradient id="xp-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E8192C" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#E8192C" stopOpacity="0" />
          </linearGradient>
          <clipPath id="xp-clip">
            <motion.rect
              x="0" y="0" height={H}
              initial={{ width: 0 }}
              animate={{ width: inView ? W : 0 }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padL} x2={W - padR}
            y1={padT + (1 - f) * (H - padT - padB)}
            y2={padT + (1 - f) * (H - padT - padB)}
            stroke="var(--border)" strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={area} fill="url(#xp-area)" clipPath="url(#xp-clip)" />

        {/* Line */}
        <motion.path
          d={line} fill="none"
          stroke="#E8192C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: inView ? 1 : 0, opacity: inView ? 1 : 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Dots */}
        {pts.map(([x, y], i) => (
          <motion.circle
            key={i} cx={x} cy={y} r={hover === i ? 5 : 3}
            fill={hover === i ? '#E8192C' : '#fff'}
            stroke="#E8192C" strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: inView ? 1 : 0, opacity: inView ? 1 : 0 }}
            transition={{ delay: 1.2 + i * 0.05, duration: 0.25 }}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {/* Hover tooltip */}
        {hover !== null && (
          <g>
            <rect
              x={pts[hover][0] - 22} y={pts[hover][1] - 22}
              width="44" height="18" rx="4"
              fill="#09090B"
            />
            <text
              x={pts[hover][0]} y={pts[hover][1] - 9}
              textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff"
            >
              {data[hover]} XP
            </text>
          </g>
        )}

        {/* X axis labels */}
        {labels.map((l, i) => (
          <text
            key={l}
            x={padL + (i / (labels.length - 1)) * (W - padL - padR)}
            y={H - 4}
            textAnchor="middle" fontSize="8"
            fill={i === labels.length - 1 ? 'var(--red)' : 'var(--t4)'}
            fontWeight={i === labels.length - 1 ? '700' : '400'}
          >
            {l}
          </text>
        ))}

        {/* Y axis label */}
        <text x={padL - 4} y={padT + (1 - 1) * (H - padT - padB) + 4} textAnchor="end" fontSize="8" fill="var(--t4)">
          {Math.round(maxVal / 100) * 100}
        </text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKILLS RADAR
   ───────────────────────────────────────────────────────────────────────────── */

interface Skill { label: string; value: number; color: string }

export function SkillsRadar({ skills }: { readonly skills?: Skill[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  const defaultSkills: Skill[] = [
    { label: 'DSA',     value: 0.68, color: '#2563EB' },
    { label: 'Design',  value: 0.41, color: '#0891B2' },
    { label: 'OOP',     value: 0.55, color: '#7C3AED' },
    { label: 'Core CS', value: 0.72, color: '#16A34A' },
    { label: 'Security',value: 0.30, color: '#E8192C' },
    { label: 'Career',  value: 0.45, color: '#EA580C' },
  ];
  const data = skills ?? defaultSkills;
  const n = data.length;
  const CX = 110, CY = 100, R = 72;

  const angle = (i: number) => (i * 2 * Math.PI / n) - Math.PI / 2;
  const gridPts = (f: number) => data.map((_, i) => {
    const a = angle(i);
    return `${CX + R * f * Math.cos(a)},${CY + R * f * Math.sin(a)}`;
  }).join(' ');
  const dataPts = data.map((s, i) => {
    const a = angle(i);
    return `${CX + R * s.value * Math.cos(a)},${CY + R * s.value * Math.sin(a)}`;
  }).join(' ');
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="chart-card">
      <div className="mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Skill Map</p>
        <p className="text-xs" style={{ color: 'var(--t3)' }}>Strength across domains</p>
      </div>
      <svg ref={ref} viewBox="0 0 220 190" className="w-full" style={{ height: 160 }}>
        {/* Grid polygons */}
        {gridLevels.map((f) => (
          <polygon
            key={f} points={gridPts(f)}
            fill="none" stroke="var(--border)" strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={CX + R * Math.cos(angle(i))}
            y2={CY + R * Math.sin(angle(i))}
            stroke="var(--border)" strokeWidth="1"
          />
        ))}

        {/* Data polygon */}
        <motion.polygon
          points={dataPts}
          fill="rgba(232,25,44,0.08)"
          stroke="#E8192C" strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />

        {/* Data dots */}
        {data.map((s, i) => {
          const a = angle(i);
          const x = CX + R * s.value * Math.cos(a);
          const y = CY + R * s.value * Math.sin(a);
          return (
            <motion.circle
              key={i} cx={x} cy={y} r={4}
              fill={s.color} stroke="#fff" strokeWidth="1.5"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: inView ? 1 : 0, opacity: inView ? 1 : 0 }}
              transition={{ delay: 0.7 + i * 0.07, duration: 0.3 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          );
        })}

        {/* Labels */}
        {data.map((s, i) => {
          const a = angle(i);
          const lx = CX + (R + 14) * Math.cos(a);
          const ly = CY + (R + 14) * Math.sin(a);
          return (
            <text
              key={i} x={lx} y={ly + 3}
              textAnchor="middle" fontSize="8.5" fontWeight="600"
              fill="var(--t2)"
            >
              {s.label}
            </text>
          );
        })}

        {/* Center pct */}
        <text x={CX} y={CY - 3} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--t1)">
          {Math.round(data.reduce((a, s) => a + s.value, 0) / data.length * 100)}%
        </text>
        <text x={CX} y={CY + 9} textAnchor="middle" fontSize="7" fill="var(--t4)">
          avg
        </text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   READINESS GAUGE
   ───────────────────────────────────────────────────────────────────────────── */

export function ReadinessGauge({ value }: { readonly value: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [displayed, setDisplayed] = useState(0);

  const pct = Math.min(100, Math.max(0, value));
  const R = 68, CX = 110, CY = 110;
  const circ = 2 * Math.PI * R;
  const arc = circ * 0.75; // 270° arc

  // Rotation so arc starts at bottom-left (225° from 3 o'clock = 135° offset)
  const rotation = 135;

  const color = pct >= 70 ? '#16A34A' : pct >= 40 ? '#EA580C' : '#E8192C';
  const trackColor = 'var(--bg-elevated)';

  return (
    <div className="chart-card">
      <div className="mb-2">
        <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Readiness Score</p>
        <p className="text-xs" style={{ color: 'var(--t3)' }}>Overall placement readiness</p>
      </div>
      <svg ref={ref} viewBox="0 0 220 160" className="w-full" style={{ height: 140 }}>
        <g transform={`rotate(${rotation} ${CX} ${CY})`}>
          {/* Track */}
          <circle
            cx={CX} cy={CY} r={R} fill="none"
            stroke={trackColor} strokeWidth="10"
            strokeDasharray={`${arc} ${circ}`}
            strokeLinecap="round"
          />
          {/* Fill */}
          <motion.circle
            cx={CX} cy={CY} r={R} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${arc} ${circ}`}
            strokeLinecap="round"
            initial={{ strokeDashoffset: arc }}
            animate={{ strokeDashoffset: inView ? arc - (pct / 100) * arc : arc }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            onUpdate={(latest) => {
              const offset = typeof latest.strokeDashoffset === 'number' ? latest.strokeDashoffset : 0;
              setDisplayed(Math.round(((arc - offset) / arc) * pct));
            }}
          />
        </g>

        {/* Center text */}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="28" fontWeight="800" fill={color}>
          {displayed}%
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--t3)">
          PLACEMENT READY
        </text>

        {/* Min / max labels */}
        <text x={CX - R - 8} y={CY + R * 0.38 + 8} textAnchor="middle" fontSize="8" fill="var(--t4)">0</text>
        <text x={CX + R + 8} y={CY + R * 0.38 + 8} textAnchor="middle" fontSize="8" fill="var(--t4)">100</text>

        {/* Status badges */}
        <rect x={CX - 28} y={CY + 38} width="56" height="16" rx="8"
          fill={pct >= 70 ? 'rgba(22,163,74,0.1)' : pct >= 40 ? 'rgba(234,88,12,0.1)' : 'rgba(232,25,44,0.1)'} />
        <text x={CX} y={CY + 50} textAnchor="middle" fontSize="8" fontWeight="700"
          fill={pct >= 70 ? '#16A34A' : pct >= 40 ? '#EA580C' : '#E8192C'}>
          {pct >= 70 ? 'STRONG' : pct >= 40 ? 'GROWING' : 'NEEDS WORK'}
        </text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ACTIVITY BAR CHART (last 14 days)
   ───────────────────────────────────────────────────────────────────────────── */

export function ActivityBars({ streak }: { readonly streak: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  const days = 14;
  const W = 320, H = 100, padL = 10, padR = 10, padT = 8, padB = 24;
  const barW = (W - padL - padR) / days - 2;
  const innerH = H - padT - padB;

  // Generate realistic activity from streak
  const data: number[] = Array.from({ length: days }, (_, i) => {
    const daysAgo = days - 1 - i;
    if (daysAgo === 0) return 45 + Math.floor(((i * 7919) % 100) * 0.3);
    if (daysAgo < streak) return 20 + Math.floor(((i * 2654435761) >>> 0) % 50);
    if (daysAgo < streak + 3) return Math.floor(((i * 1234567) >>> 0) % 30);
    const h = ((i * 6700417) >>> 0) % 100;
    return h > 70 ? 10 + (h % 30) : 0;
  });

  const maxVal = Math.max(...data, 1);
  const dayLabels = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.getDate();
  });

  return (
    <div className="chart-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>Daily Activity</p>
          <p className="text-xs" style={{ color: 'var(--t3)' }}>Problems solved last 14 days</p>
        </div>
        {streak > 0 && (
          <span className="streak-badge">🔥 {streak}d</span>
        )}
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: H }}>
        {data.map((v, i) => {
          const x = padL + i * ((W - padL - padR) / days);
          const barH = v > 0 ? Math.max((v / maxVal) * innerH, 3) : 0;
          const y = padT + innerH - barH;
          const isToday = i === days - 1;
          const hasActivity = v > 0;

          return (
            <g key={i}>
              {/* Bar */}
              <motion.rect
                x={x} width={barW} rx={3}
                y={inView ? y : padT + innerH}
                height={inView ? barH : 0}
                fill={isToday ? '#E8192C' : hasActivity ? 'rgba(232,25,44,0.35)' : 'var(--bg-elevated)'}
                initial={false}
                animate={{ y: inView ? y : padT + innerH, height: inView ? barH : 0 }}
                transition={{ duration: 0.7, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              />
              {/* Day label (every 2nd) */}
              {i % 2 === 0 && (
                <text
                  x={x + barW / 2} y={H - 6}
                  textAnchor="middle" fontSize="7.5"
                  fill={isToday ? 'var(--red)' : 'var(--t4)'}
                  fontWeight={isToday ? '700' : '400'}
                >
                  {dayLabels[i]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
