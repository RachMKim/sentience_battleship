import type { ShipName } from '../lib/types';

export const SHIP_THEME: Record<ShipName, {
  hull: string;
  hullDark: string;
  accent: string;
  glow: string;
}> = {
  carrier:    { hull: '#7c3aed', hullDark: '#4c1d95', accent: '#c4b5fd', glow: 'rgba(139,92,246,0.35)' },
  battleship: { hull: '#3b82f6', hullDark: '#1e3a8a', accent: '#bfdbfe', glow: 'rgba(59,130,246,0.35)' },
  cruiser:    { hull: '#0d9488', hullDark: '#134e4a', accent: '#99f6e4', glow: 'rgba(20,184,166,0.35)' },
  submarine:  { hull: '#16a34a', hullDark: '#14532d', accent: '#bbf7d0', glow: 'rgba(34,197,94,0.35)' },
  destroyer:  { hull: '#d97706', hullDark: '#78350f', accent: '#fef08a', glow: 'rgba(245,158,11,0.35)' },
};

interface ShipSVGProps {
  name: ShipName;
  cellCount: number;
  orientation: 'horizontal' | 'vertical';
  cellSize: number;
  sunk?: boolean;
  className?: string;
}

export function ShipSVG({ name, cellCount, orientation, cellSize, sunk, className }: ShipSVGProps) {
  const gap = 2;
  const totalW = cellCount * cellSize + (cellCount - 1) * gap;
  const totalH = cellSize;
  const inset = 2;
  const w = totalW - inset * 2;
  const h = totalH - inset * 2;

  const theme = SHIP_THEME[name];
  const uid = `s-${name}`;

  const isVert = orientation === 'vertical';
  const svgW = isVert ? totalH : totalW;
  const svgH = isVert ? totalW : totalH;

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      className={className}
      style={{
        filter: sunk
          ? 'saturate(0.15) brightness(0.4) opacity(0.7)'
          : `drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 8px ${theme.glow})`,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sunk ? '#666' : theme.hull} />
          <stop offset="45%" stopColor={sunk ? '#444' : theme.hullDark} />
          <stop offset="100%" stopColor={sunk ? '#333' : theme.hullDark} />
        </linearGradient>
        <linearGradient id={`${uid}-deck`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
        </linearGradient>
      </defs>
      <g transform={isVert ? `translate(${totalH}, 0) rotate(90)` : ''}>
        <g transform={`translate(${inset}, ${inset})`}>
          {/* Hull shadow */}
          <path d={getHullPath(name, w, h)} fill="rgba(0,0,0,0.4)" transform="translate(0, 1.5)" />
          {/* Main hull */}
          <path d={getHullPath(name, w, h)} fill={`url(#${uid}-g)`}
            stroke={sunk ? 'rgba(255,51,102,0.3)' : theme.accent}
            strokeWidth={1.2} strokeOpacity={0.6} />
          {/* Hull highlight */}
          <path d={getHullPath(name, w, h)} fill={`url(#${uid}-deck)`} />
          {/* Deck details */}
          {!sunk && renderShipDetails(name, w, h, theme)}
          {sunk && (
            <text x={w / 2} y={h / 2 + 1} textAnchor="middle" dominantBaseline="middle"
              fill="#ff3366" fontSize={h * 0.45} fontWeight="bold" opacity={0.6}>✕</text>
          )}
        </g>
      </g>
    </svg>
  );
}

function getHullPath(name: ShipName, w: number, h: number): string {
  const cy = h / 2;
  const hw = h * 0.45;
  switch (name) {
    case 'carrier':
      return `
        M 4,${cy - hw}
        L ${w * 0.08},${cy - hw * 0.95}
        L ${w * 0.85},${cy - hw * 0.9}
        L ${w * 0.92},${cy - hw * 0.5}
        L ${w - 1},${cy}
        L ${w * 0.92},${cy + hw * 0.5}
        L ${w * 0.85},${cy + hw * 0.9}
        L ${w * 0.08},${cy + hw * 0.95}
        L 4,${cy + hw}
        Q 0,${cy + hw * 0.5} 0,${cy}
        Q 0,${cy - hw * 0.5} 4,${cy - hw}
        Z`;
    case 'battleship':
      return `
        M 5,${cy - hw * 0.85}
        L ${w * 0.12},${cy - hw}
        L ${w * 0.82},${cy - hw * 0.85}
        L ${w * 0.92},${cy - hw * 0.4}
        L ${w},${cy}
        L ${w * 0.92},${cy + hw * 0.4}
        L ${w * 0.82},${cy + hw * 0.85}
        L ${w * 0.12},${cy + hw}
        L 5,${cy + hw * 0.85}
        Q 0,${cy} 5,${cy - hw * 0.85}
        Z`;
    case 'cruiser':
      return `
        M 4,${cy - hw * 0.75}
        L ${w * 0.15},${cy - hw * 0.9}
        L ${w * 0.75},${cy - hw * 0.7}
        L ${w * 0.9},${cy - hw * 0.3}
        L ${w},${cy}
        L ${w * 0.9},${cy + hw * 0.3}
        L ${w * 0.75},${cy + hw * 0.7}
        L ${w * 0.15},${cy + hw * 0.9}
        L 4,${cy + hw * 0.75}
        Q 0,${cy} 4,${cy - hw * 0.75}
        Z`;
    case 'submarine':
      return `
        M ${w * 0.08},${cy - hw * 0.65}
        Q ${w * 0.2},${cy - hw * 0.85} ${w * 0.35},${cy - hw * 0.7}
        L ${w * 0.65},${cy - hw * 0.7}
        Q ${w * 0.8},${cy - hw * 0.85} ${w * 0.92},${cy - hw * 0.65}
        Q ${w},${cy} ${w * 0.92},${cy + hw * 0.65}
        Q ${w * 0.8},${cy + hw * 0.85} ${w * 0.65},${cy + hw * 0.7}
        L ${w * 0.35},${cy + hw * 0.7}
        Q ${w * 0.2},${cy + hw * 0.85} ${w * 0.08},${cy + hw * 0.65}
        Q 0,${cy} ${w * 0.08},${cy - hw * 0.65}
        Z`;
    case 'destroyer':
      return `
        M 3,${cy - hw * 0.6}
        L ${w * 0.15},${cy - hw * 0.85}
        L ${w * 0.7},${cy - hw * 0.7}
        L ${w * 0.88},${cy - hw * 0.25}
        L ${w},${cy}
        L ${w * 0.88},${cy + hw * 0.25}
        L ${w * 0.7},${cy + hw * 0.7}
        L ${w * 0.15},${cy + hw * 0.85}
        L 3,${cy + hw * 0.6}
        Q 0,${cy} 3,${cy - hw * 0.6}
        Z`;
  }
}

function renderShipDetails(name: ShipName, w: number, h: number, theme: typeof SHIP_THEME.carrier) {
  const cy = h / 2;
  const c = theme.accent;

  switch (name) {
    case 'carrier':
      return (
        <g>
          {/* Flight deck - flat top */}
          <rect x={w * 0.06} y={cy - h * 0.12} width={w * 0.82} height={h * 0.24} rx={2}
            fill="rgba(255,255,255,0.08)" stroke={c} strokeWidth={0.6} strokeOpacity={0.3} />
          {/* Runway center line */}
          <line x1={w * 0.1} y1={cy} x2={w * 0.84} y2={cy}
            stroke={c} strokeWidth={1} strokeOpacity={0.5} strokeDasharray="6 4" />
          {/* Island superstructure */}
          <rect x={w * 0.6} y={cy - h * 0.32} width={w * 0.08} height={h * 0.22} rx={1.5}
            fill={c} fillOpacity={0.4} stroke={c} strokeWidth={0.5} strokeOpacity={0.4} />
          {/* Mast */}
          <line x1={w * 0.64} y1={cy - h * 0.32} x2={w * 0.64} y2={cy - h * 0.42}
            stroke={c} strokeWidth={1} strokeOpacity={0.5} />
          {/* Aircraft */}
          {[0.15, 0.28, 0.42, 0.72].map((px, i) => (
            <g key={i} transform={`translate(${w * px}, ${cy + (i % 2 === 0 ? -1 : 1) * h * 0.06})`}>
              <rect x={-3} y={-1.5} width={6} height={3} rx={1} fill={c} fillOpacity={0.3} />
              <line x1={0} y1={-3.5} x2={0} y2={3.5} stroke={c} strokeWidth={0.5} strokeOpacity={0.3} />
            </g>
          ))}
        </g>
      );
    case 'battleship':
      return (
        <g>
          {/* Center keel */}
          <line x1={w * 0.06} y1={cy} x2={w * 0.92} y2={cy}
            stroke={c} strokeWidth={0.8} strokeOpacity={0.4} />
          {/* Forward main turrets */}
          <circle cx={w * 0.2} cy={cy} r={h * 0.16} fill={c} fillOpacity={0.25}
            stroke={c} strokeWidth={0.8} strokeOpacity={0.5} />
          <line x1={w * 0.2} y1={cy} x2={w * 0.2 + h * 0.22} y2={cy}
            stroke={c} strokeWidth={1.5} strokeOpacity={0.5} />
          <circle cx={w * 0.35} cy={cy} r={h * 0.14} fill={c} fillOpacity={0.25}
            stroke={c} strokeWidth={0.8} strokeOpacity={0.5} />
          <line x1={w * 0.35} y1={cy} x2={w * 0.35 + h * 0.2} y2={cy}
            stroke={c} strokeWidth={1.5} strokeOpacity={0.5} />
          {/* Bridge superstructure */}
          <rect x={w * 0.48} y={cy - h * 0.25} width={w * 0.12} height={h * 0.5} rx={2}
            fill={c} fillOpacity={0.2} stroke={c} strokeWidth={0.8} strokeOpacity={0.4} />
          {/* Mast */}
          <line x1={w * 0.54} y1={cy - h * 0.25} x2={w * 0.54} y2={cy - h * 0.4}
            stroke={c} strokeWidth={1} strokeOpacity={0.5} />
          {/* Aft turret */}
          <circle cx={w * 0.75} cy={cy} r={h * 0.16} fill={c} fillOpacity={0.25}
            stroke={c} strokeWidth={0.8} strokeOpacity={0.5} />
          <line x1={w * 0.75} y1={cy} x2={w * 0.75 - h * 0.22} y2={cy}
            stroke={c} strokeWidth={1.5} strokeOpacity={0.5} />
          {/* Funnel */}
          <rect x={w * 0.64} y={cy - h * 0.18} width={w * 0.05} height={h * 0.22} rx={1}
            fill={c} fillOpacity={0.3} />
        </g>
      );
    case 'cruiser':
      return (
        <g>
          <line x1={w * 0.08} y1={cy} x2={w * 0.9} y2={cy}
            stroke={c} strokeWidth={0.7} strokeOpacity={0.35} />
          {/* Forward turret */}
          <circle cx={w * 0.25} cy={cy} r={h * 0.14} fill={c} fillOpacity={0.25}
            stroke={c} strokeWidth={0.7} strokeOpacity={0.5} />
          <line x1={w * 0.25} y1={cy} x2={w * 0.25 + h * 0.2} y2={cy}
            stroke={c} strokeWidth={1.2} strokeOpacity={0.5} />
          {/* Bridge */}
          <rect x={w * 0.45} y={cy - h * 0.22} width={w * 0.12} height={h * 0.44} rx={2}
            fill={c} fillOpacity={0.2} stroke={c} strokeWidth={0.7} strokeOpacity={0.4} />
          {/* Mast */}
          <line x1={w * 0.51} y1={cy - h * 0.22} x2={w * 0.51} y2={cy - h * 0.38}
            stroke={c} strokeWidth={0.8} strokeOpacity={0.4} />
          {/* Aft turret */}
          <circle cx={w * 0.72} cy={cy} r={h * 0.12} fill={c} fillOpacity={0.25}
            stroke={c} strokeWidth={0.7} strokeOpacity={0.5} />
          <line x1={w * 0.72} y1={cy} x2={w * 0.72 - h * 0.18} y2={cy}
            stroke={c} strokeWidth={1.2} strokeOpacity={0.5} />
        </g>
      );
    case 'submarine':
      return (
        <g>
          <line x1={w * 0.15} y1={cy} x2={w * 0.85} y2={cy}
            stroke={c} strokeWidth={0.6} strokeOpacity={0.3} />
          {/* Conning tower / sail */}
          <rect x={w * 0.4} y={cy - h * 0.35} width={w * 0.14} height={h * 0.35} rx={3}
            fill={c} fillOpacity={0.3} stroke={c} strokeWidth={0.8} strokeOpacity={0.5} />
          {/* Periscope */}
          <line x1={w * 0.47} y1={cy - h * 0.35} x2={w * 0.47} y2={cy - h * 0.48}
            stroke={c} strokeWidth={1.2} strokeOpacity={0.5} />
          <circle cx={w * 0.47} cy={cy - h * 0.48} r={1.5} fill={c} fillOpacity={0.5} />
          {/* Dive planes */}
          <line x1={w * 0.18} y1={cy - h * 0.15} x2={w * 0.18} y2={cy + h * 0.15}
            stroke={c} strokeWidth={1.5} strokeOpacity={0.3} />
          {/* Propeller */}
          <g transform={`translate(${w * 0.08}, ${cy})`} opacity={0.4}>
            <line x1={0} y1={-4} x2={0} y2={4} stroke={c} strokeWidth={1.2} />
            <line x1={-3} y1={0} x2={3} y2={0} stroke={c} strokeWidth={1.2} />
          </g>
          {/* Torpedo tubes hint */}
          <circle cx={w * 0.88} cy={cy - h * 0.08} r={1.5} fill={c} fillOpacity={0.3} />
          <circle cx={w * 0.88} cy={cy + h * 0.08} r={1.5} fill={c} fillOpacity={0.3} />
        </g>
      );
    case 'destroyer':
      return (
        <g>
          <line x1={w * 0.1} y1={cy} x2={w * 0.88} y2={cy}
            stroke={c} strokeWidth={0.6} strokeOpacity={0.3} />
          {/* Forward gun */}
          <circle cx={w * 0.3} cy={cy} r={h * 0.12} fill={c} fillOpacity={0.25}
            stroke={c} strokeWidth={0.7} strokeOpacity={0.5} />
          <line x1={w * 0.3} y1={cy} x2={w * 0.3 + h * 0.18} y2={cy}
            stroke={c} strokeWidth={1.2} strokeOpacity={0.5} />
          {/* Bridge */}
          <rect x={w * 0.5} y={cy - h * 0.2} width={w * 0.14} height={h * 0.4} rx={2}
            fill={c} fillOpacity={0.2} stroke={c} strokeWidth={0.7} strokeOpacity={0.4} />
          {/* Funnel */}
          <rect x={w * 0.68} y={cy - h * 0.15} width={w * 0.06} height={h * 0.18} rx={1}
            fill={c} fillOpacity={0.3} />
        </g>
      );
  }
}

export function ShipIcon({ name, size = 28, sunk }: { name: ShipName; size?: number; sunk?: boolean }) {
  const theme = SHIP_THEME[name];
  const w = size;
  const h = size * 0.45;
  const cy = h / 2;
  const hw = h * 0.42;

  const path = (() => {
    switch (name) {
      case 'carrier':
        return `M 1,${cy - hw} L ${w * 0.85},${cy - hw * 0.85} L ${w - 1},${cy} L ${w * 0.85},${cy + hw * 0.85} L 1,${cy + hw} Q 0,${cy} 1,${cy - hw} Z`;
      case 'battleship':
        return `M 2,${cy - hw * 0.8} L ${w * 0.12},${cy - hw} L ${w * 0.85},${cy - hw * 0.7} L ${w},${cy} L ${w * 0.85},${cy + hw * 0.7} L ${w * 0.12},${cy + hw} L 2,${cy + hw * 0.8} Q 0,${cy} 2,${cy - hw * 0.8} Z`;
      case 'cruiser':
        return `M 2,${cy - hw * 0.7} L ${w * 0.15},${cy - hw * 0.9} L ${w * 0.8},${cy - hw * 0.6} L ${w},${cy} L ${w * 0.8},${cy + hw * 0.6} L ${w * 0.15},${cy + hw * 0.9} L 2,${cy + hw * 0.7} Q 0,${cy} 2,${cy - hw * 0.7} Z`;
      case 'submarine':
        return `M ${w * 0.08},${cy} Q ${w * 0.08},${cy - hw} ${w * 0.3},${cy - hw * 0.85} L ${w * 0.7},${cy - hw * 0.85} Q ${w * 0.92},${cy - hw} ${w * 0.92},${cy} Q ${w * 0.92},${cy + hw} ${w * 0.7},${cy + hw * 0.85} L ${w * 0.3},${cy + hw * 0.85} Q ${w * 0.08},${cy + hw} ${w * 0.08},${cy} Z`;
      case 'destroyer':
        return `M 1,${cy - hw * 0.55} L ${w * 0.18},${cy - hw * 0.9} L ${w * 0.75},${cy - hw * 0.6} L ${w},${cy} L ${w * 0.75},${cy + hw * 0.6} L ${w * 0.18},${cy + hw * 0.9} L 1,${cy + hw * 0.55} Q 0,${cy} 1,${cy - hw * 0.55} Z`;
    }
  })();

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`icon-${name}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sunk ? '#555' : theme.hull} />
          <stop offset="100%" stopColor={sunk ? '#333' : theme.hullDark} />
        </linearGradient>
      </defs>
      <path d={path} fill={`url(#icon-${name})`}
        stroke={sunk ? 'rgba(255,51,102,0.4)' : theme.accent}
        strokeWidth={0.8} strokeOpacity={0.6}
        style={{ filter: sunk ? '' : `drop-shadow(0 0 2px ${theme.glow})` }} />
      {/* Mini bridge detail */}
      {!sunk && name !== 'submarine' && (
        <rect x={w * 0.45} y={cy - h * 0.15} width={w * 0.1} height={h * 0.3} rx={1}
          fill={theme.accent} fillOpacity={0.3} />
      )}
      {!sunk && name === 'submarine' && (
        <rect x={w * 0.4} y={cy - h * 0.35} width={w * 0.12} height={h * 0.35} rx={2}
          fill={theme.accent} fillOpacity={0.3} />
      )}
    </svg>
  );
}
