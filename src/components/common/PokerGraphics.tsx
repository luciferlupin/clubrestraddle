import React from 'react';

/* =====================================================================
   POKER GRAPHICS LIBRARY
   Inline SVG poker elements — suits, chips, cards, decorations.
   All components are pure SVG, no external images needed.
   ===================================================================== */

// ─── TYPES ────────────────────────────────────────────────────────────────────
export type Suit = 'spade' | 'heart' | 'diamond' | 'club';
export type CardRank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

// ─── CARD SUIT SVG PATHS ──────────────────────────────────────────────────────
const SUIT_PATHS: Record<Suit, string> = {
  spade:
    'M12 2C8.5 6 4 9 4 13a4 4 0 0 0 6.5 3.1C10 18 9.5 20 8 21h8c-1.5-1-2-3-2.5-4.9A4 4 0 0 0 20 13c0-4-4.5-7-8-11z',
  heart:
    'M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z',
  diamond:
    'M12 2L2 12l10 10L22 12z',
  club:
    'M12 3a3 3 0 0 0-3 3 3 3 0 0 0 1.5 2.6A3 3 0 0 0 6 11.5a3 3 0 0 0 3 3 3 3 0 0 0 1.2-.26L9 19h6l-1.2-4.76A3 3 0 0 0 15 14.5a3 3 0 0 0 3-3 3 3 0 0 0-4.5-2.6A3 3 0 0 0 15 6a3 3 0 0 0-3-3z',
};

// ─── 1. CARD SUIT ICON ────────────────────────────────────────────────────────
interface CardSuitProps {
  suit: Suit;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
}

export const CardSuit: React.FC<CardSuitProps> = ({
  suit,
  size = 24,
  color,
  className = '',
  style,
  animate = false,
}) => {
  const defaultColor =
    suit === 'heart' || suit === 'diamond' ? '#e11d48' : '#ffffff';
  const fill = color ?? defaultColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      className={`poker-suit-icon ${animate ? 'suit-pulse' : ''} ${className}`}
      style={style}
      aria-hidden="true"
    >
      <path d={SUIT_PATHS[suit]} />
    </svg>
  );
};

// ─── 2. QUAD SUITS CLUSTER (♠♥♦♣) ───────────────────────────────────────────
interface QuadSuitsProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const QuadSuits: React.FC<QuadSuitsProps> = ({
  size = 36,
  className = '',
  style,
}) => {
  const half = size / 2;
  const iconSize = Math.round(size * 0.42);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={`quad-suits ${className}`}
      style={style}
      aria-hidden="true"
    >
      {/* ♠ top-left */}
      <path
        d="M9 2C6.8 4.8 4 7 4 9.5a2.5 2.5 0 0 0 4.1 1.9c-.3 1.1-.7 2.1-1.6 2.6h7c-.9-.5-1.3-1.5-1.6-2.6A2.5 2.5 0 0 0 16 9.5c0-2.5-2.8-4.7-5-7.5z"
        fill="#ffffff"
      />
      {/* ♥ top-right */}
      <path
        d="M27 2c-3.5 0-5.5 2.5-5.5 4.5 0 3 3.5 6 5.5 8 2-2 5.5-5 5.5-8 0-2-2-4.5-5.5-4.5z"
        fill="#e11d48"
      />
      {/* ♦ bottom-left */}
      <path d="M9 22L3 28l6 6 6-6z" fill="#e11d48" />
      {/* ♣ bottom-right */}
      <path
        d="M27 22a2 2 0 0 0-2 2 2 2 0 0 0 1 1.73 2 2 0 0 0-3 1.77 2 2 0 0 0 2 2 2 2 0 0 0 .8-.17L25 33h4l-.8-3.67A2 2 0 0 0 30 27.5a2 2 0 0 0-3-1.77A2 2 0 0 0 27 22z"
        fill="#ffffff"
      />
    </svg>
  );
};

// ─── 3. DECORATIVE MINI PLAYING CARD ─────────────────────────────────────────
interface PlayingCardMiniProps {
  rank?: CardRank;
  suit: Suit;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  rotate?: number;
}

export const PlayingCardMini: React.FC<PlayingCardMiniProps> = ({
  rank = 'A',
  suit,
  width = 44,
  height = 62,
  className = '',
  style,
  rotate = 0,
}) => {
  const suitColor = suit === 'heart' || suit === 'diamond' ? '#e11d48' : '#1e1e2e';
  const suitSymbol = { spade: '♠', heart: '♥', diamond: '♦', club: '♣' }[suit];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 44 62"
      className={`playing-card-mini ${className}`}
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="42" height="60" rx="6" ry="6"
        fill="#ffffff" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" />
      {/* Top-left pip */}
      <text x="5" y="14" fontSize="9" fontWeight="800" fill={suitColor} fontFamily="sans-serif">{rank}</text>
      <text x="5" y="23" fontSize="10" fill={suitColor} fontFamily="sans-serif">{suitSymbol}</text>
      {/* Center large suit */}
      <text x="22" y="37" fontSize="22" textAnchor="middle" fill={suitColor} fontFamily="sans-serif">{suitSymbol}</text>
      {/* Bottom-right pip (rotated 180°) */}
      <text x="39" y="55" fontSize="9" fontWeight="800" fill={suitColor} fontFamily="sans-serif"
        transform="rotate(180 39 52)">{rank}</text>
      <text x="39" y="47" fontSize="10" fill={suitColor} fontFamily="sans-serif"
        transform="rotate(180 39 44)">{suitSymbol}</text>
    </svg>
  );
};

// ─── 4. FANNED CARD DECK ─────────────────────────────────────────────────────
interface CardDeckFanProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const CardDeckFan: React.FC<CardDeckFanProps> = ({
  size = 120,
  className = '',
  style,
}) => {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.75)}
      viewBox="0 0 120 90"
      className={`card-deck-fan ${className}`}
      style={style}
      aria-hidden="true"
    >
      {/* Back card — leftmost */}
      <g transform="rotate(-20 60 80)">
        <rect x="25" y="20" width="38" height="52" rx="5" fill="#0c0406" stroke="rgba(225,29,72,0.5)" strokeWidth="1.5" />
        <rect x="29" y="24" width="30" height="44" rx="3" fill="none" stroke="rgba(225,29,72,0.25)" strokeWidth="1" />
        <text x="44" y="51" textAnchor="middle" fontSize="16" fill="rgba(225,29,72,0.4)" fontFamily="sans-serif">♠</text>
      </g>
      {/* Middle card */}
      <g transform="rotate(-7 60 80)">
        <rect x="28" y="18" width="38" height="52" rx="5" fill="#111" stroke="rgba(225,29,72,0.55)" strokeWidth="1.5" />
        <rect x="32" y="22" width="30" height="44" rx="3" fill="none" stroke="rgba(225,29,72,0.25)" strokeWidth="1" />
        <text x="47" y="49" textAnchor="middle" fontSize="16" fill="rgba(225,29,72,0.5)" fontFamily="sans-serif">♥</text>
      </g>
      {/* Front face card — rightmost */}
      <g transform="rotate(8 60 80)">
        <rect x="30" y="16" width="40" height="56" rx="5" fill="#ffffff" stroke="#e11d48" strokeWidth="2" />
        <text x="36" y="28" fontSize="9" fontWeight="800" fill="#0f172a" fontFamily="sans-serif">A</text>
        <text x="36" y="37" fontSize="11" fill="#0f172a" fontFamily="sans-serif">♠</text>
        <text x="50" y="52" textAnchor="middle" fontSize="24" fill="#0f172a" fontFamily="sans-serif">♠</text>
        <text x="64" y="67" fontSize="9" fontWeight="800" fill="#0f172a" fontFamily="sans-serif"
          transform="rotate(180 64 64)">A</text>
        <text x="64" y="60" fontSize="11" fill="#0f172a" fontFamily="sans-serif"
          transform="rotate(180 64 57)">♠</text>
      </g>
    </svg>
  );
};

// ─── 5. POKER CHIP STACK SVG ─────────────────────────────────────────────────
interface PokerChipStackProps {
  count?: number; // how many chips to show (1-5)
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const PokerChipStack: React.FC<PokerChipStackProps> = ({
  count = 3,
  size = 56,
  color = '#e11d48',
  className = '',
  style,
}) => {
  const chips = Math.min(Math.max(count, 1), 5);
  const chipHeight = size * 0.18;
  const chipWidth = size * 0.9;
  const totalH = size * 0.4 + chips * chipHeight;

  return (
    <svg
      width={size}
      height={totalH}
      viewBox={`0 0 ${size} ${totalH}`}
      className={`poker-chip-stack ${className}`}
      style={style}
      aria-hidden="true"
    >
      {Array.from({ length: chips }, (_, i) => {
        const y = totalH - chipHeight * (i + 1) - (i * 1);
        const lighter = `${color}cc`;
        const darker = `${color}88`;
        return (
          <g key={i}>
            {/* Shadow/bottom of chip */}
            <ellipse cx={size / 2} cy={y + chipHeight * 0.8} rx={chipWidth / 2} ry={chipHeight * 0.35}
              fill="rgba(0,0,0,0.35)" />
            {/* Chip body */}
            <rect x={(size - chipWidth) / 2} y={y} width={chipWidth} height={chipHeight * 0.7}
              rx={chipHeight * 0.35} fill={color} />
            {/* Chip highlight */}
            <rect x={(size - chipWidth) / 2 + 3} y={y + 1} width={chipWidth - 6} height={chipHeight * 0.25}
              rx={chipHeight * 0.15} fill={lighter} opacity={0.5} />
            {/* Chip edge segments */}
            {[0, 1, 2, 3, 4].map(seg => (
              <rect
                key={seg}
                x={(size - chipWidth) / 2 + (chipWidth / 6) * seg + 1}
                y={y}
                width={chipWidth / 9}
                height={chipHeight * 0.7}
                rx={2}
                fill={darker}
                opacity={0.6}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

// ─── 6. LARGE GHOST SUIT WATERMARK ───────────────────────────────────────────
interface SuitWatermarkProps {
  suit?: Suit;
  size?: number;
  opacity?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SuitWatermark: React.FC<SuitWatermarkProps> = ({
  suit = 'spade',
  size = 200,
  opacity = 0.06,
  color = '#ffffff',
  className = '',
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    opacity={opacity}
    className={`suit-watermark ${className}`}
    style={{ pointerEvents: 'none', ...style }}
    aria-hidden="true"
  >
    <path d={SUIT_PATHS[suit]} />
  </svg>
);

// ─── 7. PASS CARD CORNER PIPS ────────────────────────────────────────────────
interface PassCornerPipProps {
  rank?: CardRank;
  suit: Suit;
  size?: number;
  flipped?: boolean;
  style?: React.CSSProperties;
}

export const PassCornerPip: React.FC<PassCornerPipProps> = ({
  rank = 'A',
  suit,
  size = 28,
  flipped = false,
  style,
}) => {
  const suitColor = suit === 'heart' || suit === 'diamond' ? '#e11d48' : 'rgba(255,255,255,0.9)';
  const suitSymbol = { spade: '♠', heart: '♥', diamond: '♦', club: '♣' }[suit];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 1,
        transform: flipped ? 'rotate(180deg)' : undefined,
        userSelect: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      <span style={{ fontSize: size * 0.55, fontWeight: 900, color: suitColor, fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}>
        {rank}
      </span>
      <span style={{ fontSize: size * 0.5, color: suitColor, lineHeight: 1 }}>
        {suitSymbol}
      </span>
    </div>
  );
};

// ─── 8. CHIP AMOUNT BADGE ────────────────────────────────────────────────────
interface ChipAmountBadgeProps {
  amount: string;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export const ChipAmountBadge: React.FC<ChipAmountBadgeProps> = ({
  amount,
  size = 'md',
  style,
}) => {
  const fontSize = size === 'sm' ? '0.7rem' : size === 'lg' ? '1rem' : '0.82rem';
  const padding = size === 'sm' ? '2px 8px' : size === 'lg' ? '6px 16px' : '3px 10px';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: 'rgba(225,29,72,0.15)',
        border: '1px solid rgba(225,29,72,0.45)',
        borderRadius: '999px',
        padding,
        fontSize,
        fontWeight: 700,
        color: '#ffffff',
        ...style,
      }}
      aria-hidden="true"
    >
      <span style={{ fontSize: '0.9em' }}>🎰</span>
      {amount}
    </div>
  );
};

// ─── 9. GAME TYPE SUIT BADGE ─────────────────────────────────────────────────
interface GameTypeBadgeProps {
  gameType: string; // e.g. "NLH", "PLO", "Omaha"
  size?: number;
  style?: React.CSSProperties;
}

export const GameTypeBadge: React.FC<GameTypeBadgeProps> = ({
  gameType,
  size = 18,
  style,
}) => {
  // Pick suit based on game keyword
  let suit: Suit = 'spade';
  const g = gameType.toUpperCase();
  if (g.includes('PLO') || g.includes('OMAHA')) suit = 'diamond';
  else if (g.includes('HIGH') || g.includes('ROLLER')) suit = 'heart';
  else if (g.includes('STRADDLE') || g.includes('RE')) suit = 'club';
  else suit = 'spade';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
      <CardSuit suit={suit} size={size} />
    </span>
  );
};

// ─── 10. FELT TABLE OVAL DECORATION ─────────────────────────────────────────
interface PokerTableFeltProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const PokerTableFelt: React.FC<PokerTableFeltProps> = ({
  width = 200,
  height = 100,
  className = '',
  style,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 200 100"
    className={`poker-table-felt ${className}`}
    style={{ pointerEvents: 'none', ...style }}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="felt-grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0d4a2a" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#052616" stopOpacity="0.15" />
      </radialGradient>
    </defs>
    <ellipse cx="100" cy="50" rx="95" ry="45" fill="url(#felt-grad)" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
    <ellipse cx="100" cy="50" rx="78" ry="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" strokeDasharray="6 4" />
    {/* Center suit */}
    <text x="100" y="57" textAnchor="middle" fontSize="22" fill="rgba(255,255,255,0.07)" fontFamily="sans-serif">♠</text>
  </svg>
);

// ─── 11. ANIMATED SUITS ROW (for footer) ─────────────────────────────────────
interface AnimatedSuitsRowProps {
  size?: number;
  gap?: number;
  style?: React.CSSProperties;
}

export const AnimatedSuitsRow: React.FC<AnimatedSuitsRowProps> = ({
  size = 16,
  gap = 10,
  style,
}) => (
  <span
    className="animated-suits-row"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap,
      ...style,
    }}
    aria-hidden="true"
  >
    <CardSuit suit="spade" size={size} color="#ffffff" className="suit-hover-anim" />
    <CardSuit suit="heart" size={size} color="#e11d48" className="suit-hover-anim suit-delay-1" />
    <CardSuit suit="diamond" size={size} color="#e11d48" className="suit-hover-anim suit-delay-2" />
    <CardSuit suit="club" size={size} color="#ffffff" className="suit-hover-anim suit-delay-3" />
  </span>
);

// ─── 12. SINGLE 3D POKER CHIP (inline SVG — realistic casino style) ──────────
interface Chip3DProps {
  size?: number;
  color?: 'red' | 'white' | 'black' | 'blue';
  uid: string;
}

const CHIP_PALETTES = {
  red: {
    body1: '#c0162e',   // dark face
    body2: '#e11d48',   // mid face
    body3: '#f97395',   // highlight
    edge1: '#ffffff',   // stripe light
    edge2: '#7f0020',   // stripe dark
    inlay: '#1a030a',   // inlay bg
    symbol: '#ffffff',
    glyph: '♥',
  },
  white: {
    body1: '#94a3b8',
    body2: '#e2e8f0',
    body3: '#ffffff',
    edge1: '#1e293b',
    edge2: '#cbd5e1',
    inlay: '#0f172a',
    symbol: '#e2e8f0',
    glyph: '♠',
  },
  black: {
    body1: '#0f0f0f',
    body2: '#1e1e2e',
    body3: '#3b3b5c',
    edge1: '#f43f5e',
    edge2: '#64748b',
    inlay: '#060210',
    symbol: '#f43f5e',
    glyph: '♦',
  },
  blue: {
    body1: '#1e3a8a',
    body2: '#2563eb',
    body3: '#93c5fd',
    edge1: '#ffffff',
    edge2: '#1e40af',
    inlay: '#030712',
    symbol: '#bfdbfe',
    glyph: '♣',
  },
};

const Chip3D: React.FC<Chip3DProps> = ({ size = 48, color = 'red', uid }) => {
  const p = CHIP_PALETTES[color];
  const r = size / 2;          // outer radius
  const bodyR  = r * 0.88;     // chip body radius
  const edgeR  = r * 0.88;     // where stripes sit (on edge of body)
  const ring1R = r * 0.72;     // outer inlay ring
  const ring2R = r * 0.64;     // inner inlay ring
  const inlayR = r * 0.58;     // inlay fill

  // 12 edge stripe segments — classic casino chip pattern
  const STRIPES = 12;
  const stripes = Array.from({ length: STRIPES }, (_, i) => {
    const angle = (i * (360 / STRIPES) - 90) * (Math.PI / 180);
    const x = r + edgeR * Math.cos(angle);
    const y = r + edgeR * Math.sin(angle);
    return { x, y, isLight: i % 2 === 0 };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* Body radial gradient — off-centre light source top-left */}
        <radialGradient id={`cf-${uid}`} cx="38%" cy="32%" r="70%">
          <stop offset="0%"   stopColor={p.body3} />
          <stop offset="40%"  stopColor={p.body2} />
          <stop offset="100%" stopColor={p.body1} />
        </radialGradient>
        {/* Specular shine */}
        <radialGradient id={`cs-${uid}`} cx="35%" cy="25%" r="45%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        {/* Inlay gradient */}
        <radialGradient id={`ci-${uid}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%"   stopColor={p.inlay} stopOpacity="0.7" />
          <stop offset="100%" stopColor={p.inlay} stopOpacity="0.95" />
        </radialGradient>
        {/* Drop shadow filter */}
        <filter id={`cd-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy={r * 0.18} stdDeviation={r * 0.14}
            floodColor={p.body1} floodOpacity="0.7" />
        </filter>
        {/* Edge ring clip */}
        <clipPath id={`cc-${uid}`}>
          <circle cx={r} cy={r} r={bodyR + r * 0.06} />
        </clipPath>
      </defs>

      {/* ── Bottom shadow ellipse for ground plane */}
      <ellipse
        cx={r} cy={r + bodyR * 0.88}
        rx={bodyR * 0.82} ry={bodyR * 0.18}
        fill="rgba(0,0,0,0.5)"
      />

      {/* ── Main chip body */}
      <circle cx={r} cy={r} r={bodyR}
        fill={`url(#cf-${uid})`}
        filter={`url(#cd-${uid})`}
      />

      {/* ── Edge outer ring (darker border) */}
      <circle cx={r} cy={r} r={bodyR}
        fill="none"
        stroke={p.body1}
        strokeWidth={r * 0.055}
      />

      {/* ── 12 stripe inserts around the edge */}
      {stripes.map((s, i) => (
        <circle key={i}
          cx={s.x} cy={s.y}
          r={r * 0.095}
          fill={s.isLight ? p.edge1 : p.edge2}
          opacity={s.isLight ? 0.95 : 0.85}
        />
      ))}

      {/* ── Outer inlay ring */}
      <circle cx={r} cy={r} r={ring1R}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={r * 0.03}
      />

      {/* ── Inner inlay ring */}
      <circle cx={r} cy={r} r={ring2R}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={r * 0.025}
      />

      {/* ── Inlay fill (centre clay area) */}
      <circle cx={r} cy={r} r={inlayR}
        fill={`url(#ci-${uid})`}
      />

      {/* ── Inlay border */}
      <circle cx={r} cy={r} r={inlayR}
        fill="none"
        stroke="rgba(255,255,255,0.20)"
        strokeWidth={r * 0.025}
      />

      {/* ── Centre suit glyph */}
      <text
        x={r} y={r + r * 0.30}
        textAnchor="middle"
        fontSize={r * 0.58}
        fill={p.symbol}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="bold"
        style={{ userSelect: 'none' }}
      >
        {p.glyph}
      </text>

      {/* ── Specular highlight (top-left arc) */}
      <circle cx={r} cy={r} r={bodyR}
        fill={`url(#cs-${uid})`}
      />
    </svg>
  );
};

// ─── 13. FLOATING CHIPS BACKGROUND ───────────────────────────────────────────
interface FloatingChipsBackgroundProps {
  mode?: 'fixed' | 'absolute';
  opacity?: number;
  chipCount?: number;
}

// 14 chips — varied sizes, colors, positions, animation speeds
const CHIP_CONFIGS = [
  { left: '4%',  top: '10%', size: 56, color: 'red'   as const, animClass: 'fchip-a', delay: '0s',   dur: '9s'  },
  { left: '87%', top: '7%',  size: 40, color: 'white' as const, animClass: 'fchip-b', delay: '1.3s', dur: '11s' },
  { left: '71%', top: '54%', size: 64, color: 'red'   as const, animClass: 'fchip-c', delay: '0.6s', dur: '13s' },
  { left: '17%', top: '67%', size: 46, color: 'white' as const, animClass: 'fchip-d', delay: '2.1s', dur: '10s' },
  { left: '47%', top: '4%',  size: 38, color: 'black' as const, animClass: 'fchip-e', delay: '0.4s', dur: '12s' },
  { left: '91%', top: '74%', size: 52, color: 'white' as const, animClass: 'fchip-f', delay: '1.8s', dur: '8s'  },
  { left: '31%', top: '34%', size: 44, color: 'red'   as const, animClass: 'fchip-g', delay: '3.0s', dur: '14s' },
  { left: '59%', top: '79%', size: 36, color: 'blue'  as const, animClass: 'fchip-h', delay: '0.9s', dur: '10s' },
  { left: '9%',  top: '44%', size: 58, color: 'red'   as const, animClass: 'fchip-i', delay: '2.5s', dur: '11s' },
  { left: '77%', top: '27%', size: 42, color: 'black' as const, animClass: 'fchip-j', delay: '1.1s', dur: '9s'  },
  { left: '39%', top: '61%', size: 50, color: 'red'   as const, animClass: 'fchip-k', delay: '0.2s', dur: '13s' },
  { left: '54%', top: '21%', size: 34, color: 'white' as const, animClass: 'fchip-l', delay: '3.4s', dur: '10s' },
  { left: '23%', top: '20%', size: 48, color: 'blue'  as const, animClass: 'fchip-a', delay: '1.6s', dur: '15s' },
  { left: '65%', top: '42%', size: 40, color: 'black' as const, animClass: 'fchip-c', delay: '2.8s', dur: '12s' },
] as const;


export const FloatingChipsBackground: React.FC<FloatingChipsBackgroundProps> = ({
  mode = 'fixed',
  opacity = 0.13,
  chipCount = 12,
}) => {
  const chips = CHIP_CONFIGS.slice(0, chipCount);

  return (
    <div
      aria-hidden="true"
      className="floating-chip-layer"
      style={{
        position: mode,
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {chips.map((cfg, i) => (
        <div
          key={i}
          className={`floating-chip ${cfg.animClass}`}
          style={{
            position: 'absolute',
            left: cfg.left,
            top: cfg.top,
            width: cfg.size,
            height: cfg.size,
            opacity,
            animationDelay: cfg.delay,
            animationDuration: cfg.dur,
            willChange: 'transform',
          }}
        >
          <Chip3D size={cfg.size} color={cfg.color} uid={`${i}-${cfg.animClass}`} />
        </div>
      ))}
    </div>
  );
};

