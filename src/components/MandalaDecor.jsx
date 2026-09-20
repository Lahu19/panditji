import React from 'react';

/* SVG Mandala — pure CSS animated decorative element */
export default function MandalaDecor({ size = 400, opacity = 0.06, style = {} }) {
  const r = size / 2;
  const petals = 16;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: 'absolute', pointerEvents: 'none', opacity, ...style }}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx={r} cy={r} r={r - 4} fill="none" stroke="#D4AF37" strokeWidth="1" />
      <circle cx={r} cy={r} r={r - 16} fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="4 6" />
      <circle cx={r} cy={r} r={r * 0.6} fill="none" stroke="#FF6B00" strokeWidth="0.8" />
      <circle cx={r} cy={r} r={r * 0.35} fill="none" stroke="#D4AF37" strokeWidth="0.8" />
      <circle cx={r} cy={r} r={r * 0.15} fill="none" stroke="#FF6B00" strokeWidth="1" />

      {/* Petals */}
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i * 360) / petals;
        const rad = (angle * Math.PI) / 180;
        const x1 = r + Math.cos(rad) * r * 0.35;
        const y1 = r + Math.sin(rad) * r * 0.35;
        const x2 = r + Math.cos(rad) * r * 0.8;
        const y2 = r + Math.sin(rad) * r * 0.8;
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#D4AF37"
            strokeWidth="0.6"
            opacity="0.7"
          />
        );
      })}

      {/* Lotus petals (outer) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const cx2 = r + Math.cos(angle) * r * 0.72;
        const cy2 = r + Math.sin(angle) * r * 0.72;
        return (
          <ellipse
            key={`petal-${i}`}
            cx={cx2}
            cy={cy2}
            rx={r * 0.1}
            ry={r * 0.2}
            fill="none"
            stroke="#FF6B00"
            strokeWidth="0.8"
            transform={`rotate(${i * 45 + 90}, ${cx2}, ${cy2})`}
            opacity="0.6"
          />
        );
      })}

      {/* Inner lotus */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const cx2 = r + Math.cos(angle) * r * 0.28;
        const cy2 = r + Math.sin(angle) * r * 0.28;
        return (
          <ellipse
            key={`inner-${i}`}
            cx={cx2}
            cy={cy2}
            rx={r * 0.06}
            ry={r * 0.12}
            fill="none"
            stroke="#D4AF37"
            strokeWidth="0.6"
            transform={`rotate(${i * 45 + 90}, ${cx2}, ${cy2})`}
            opacity="0.8"
          />
        );
      })}

      {/* Center Om dot */}
      <circle cx={r} cy={r} r={r * 0.04} fill="#D4AF37" opacity="0.8" />
    </svg>
  );
}

/* Floating diya/flame component */
export function DivaParticles({ count = 6 }) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${10 + i * 15}%`,
            bottom: '10%',
            fontSize: '1rem',
            animation: `particle-rise ${2 + i * 0.4}s ease-out infinite`,
            animationDelay: `${i * 0.6}s`,
            '--dx': `${(i % 2 === 0 ? 1 : -1) * (5 + i * 3)}px`,
          }}
          aria-hidden="true"
        >
          ✨
        </div>
      ))}
    </div>
  );
}

/* Gold dots border pattern */
export function DotBorder() {
  return (
    <div
      style={{
        height: 12,
        background:
          'repeating-linear-gradient(90deg, var(--gold) 0px, var(--gold) 3px, transparent 3px, transparent 12px)',
        opacity: 0.4,
      }}
      aria-hidden="true"
    />
  );
}

/* Rangoli-style decorative divider */
export function RangoliDivider({ label }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        margin: '0 0 8px',
      }}
    >
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
      <span style={{ fontSize: '1.1rem', color: 'var(--gold)' }}>✦</span>
      {label && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
          }}
        >
          {label}
        </span>
      )}
      <span style={{ fontSize: '1.1rem', color: 'var(--gold)' }}>✦</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
    </div>
  );
}
