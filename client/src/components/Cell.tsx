import { useState } from 'react';
import { motion } from 'framer-motion';
import type { CellState, ShipName } from '../lib/types';
import { COLUMN_LABELS } from '../lib/constants';

const SHIP_HUE: Record<ShipName, { bg: string; border: string; glow: string }> = {
  carrier:    { bg: 'rgba(107,33,168,0.55)', border: 'rgba(147,51,234,0.6)', glow: 'rgba(147,51,234,0.15)' },
  battleship: { bg: 'rgba(30,64,175,0.55)',  border: 'rgba(59,130,246,0.6)', glow: 'rgba(59,130,246,0.15)' },
  cruiser:    { bg: 'rgba(15,118,110,0.55)', border: 'rgba(20,184,166,0.6)', glow: 'rgba(20,184,166,0.15)' },
  submarine:  { bg: 'rgba(22,101,52,0.55)',  border: 'rgba(34,197,94,0.6)',  glow: 'rgba(34,197,94,0.15)' },
  destroyer:  { bg: 'rgba(161,98,7,0.55)',   border: 'rgba(234,179,8,0.6)',  glow: 'rgba(234,179,8,0.15)' },
};

interface ShipEdge {
  isShip: true;
  shipName: ShipName;
  isFirst: boolean;
  isLast: boolean;
  orientation: 'horizontal' | 'vertical';
  sunk: boolean;
}

interface CellProps {
  cell: CellState;
  x: number;
  y: number;
  onClick?: (x: number, y: number) => void;
  isOwner: boolean;
  isHovering?: boolean;
  hoverValid?: boolean;
  disabled?: boolean;
  shipEdge?: ShipEdge | { isShip: false };
}

function shipBorderRadius(edge: ShipEdge): string {
  const r = '6px';
  const z = '2px';
  if (edge.orientation === 'horizontal') {
    return `${edge.isFirst ? r : z} ${edge.isLast ? r : z} ${edge.isLast ? r : z} ${edge.isFirst ? r : z}`;
  }
  return `${edge.isFirst ? r : z} ${edge.isFirst ? r : z} ${edge.isLast ? r : z} ${edge.isLast ? r : z}`;
}

export function Cell({ cell, x, y, onClick, isOwner, isHovering, hoverValid, disabled, shipEdge }: CellProps) {
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (!disabled && onClick) onClick(x, y);
  };

  const isClickable = !disabled && onClick && !cell.isHit;
  const showTargetHover = hovered && isClickable && !isOwner && !isHovering;
  const coordLabel = `${COLUMN_LABELS[x] || x}${y + 1}`;

  const hasShipEdge = shipEdge && shipEdge.isShip;
  const ownerShipCell = cell.hasShip && isOwner && hasShipEdge;

  let bgStyle: React.CSSProperties = {};
  let extraClass = 'cell-water';
  let content: React.ReactNode = null;

  if (cell.isHit && cell.hasShip) {
    extraClass = 'cell-hit';
    bgStyle = { background: 'rgba(255,51,102,0.55)' };
    content = (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        className="w-full h-full flex items-center justify-center"
      >
        <span className="text-white text-sm font-bold drop-shadow-[0_0_8px_rgba(255,51,102,0.9)]">✕</span>
      </motion.div>
    );
  } else if (cell.isHit && !cell.hasShip) {
    extraClass = 'cell-miss';
    bgStyle = { background: 'rgba(18,29,53,0.8)' };
    content = (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: 'rgba(61,96,144,0.5)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}
      />
    );
  } else if (ownerShipCell) {
    const edge = shipEdge as ShipEdge;
    const hue = SHIP_HUE[edge.shipName];
    extraClass = 'cell-ship';
    bgStyle = {
      background: edge.sunk
        ? 'rgba(255,17,68,0.25)'
        : hue.bg,
      borderColor: edge.sunk
        ? 'rgba(255,17,68,0.4)'
        : hue.border,
      borderRadius: shipBorderRadius(edge),
      boxShadow: edge.sunk
        ? 'inset 0 0 8px rgba(255,17,68,0.2)'
        : `inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2), 0 0 8px ${hue.glow}`,
    };
    if (edge.sunk) {
      content = (
        <span className="text-hit/60 text-[10px] font-bold">✕</span>
      );
    }
  }

  if (isHovering) {
    bgStyle = {};
    extraClass = hoverValid
      ? 'bg-neon-green/25 ring-1 ring-neon-green/50'
      : 'bg-neon-red/25 ring-1 ring-neon-red/50';
  }

  if (showTargetHover) {
    bgStyle = {
      background: 'rgba(0,212,255,0.15)',
      borderColor: 'rgba(0,212,255,0.5)',
      boxShadow: '0 0 12px rgba(0,212,255,0.2), inset 0 0 6px rgba(0,212,255,0.08)',
    };
    extraClass = '';
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled || cell.isHit}
      aria-label={`${coordLabel}${cell.isHit ? (cell.hasShip ? ', hit' : ', miss') : ''}`}
      className={`
        w-full aspect-square rounded-[3px] border border-ocean-600/20 flex items-center justify-center
        transition-colors duration-100 relative
        ${extraClass}
        ${isClickable ? 'cursor-crosshair hover:brightness-125' : 'cursor-default'}
      `}
      style={bgStyle}
    >
      {content}
      {showTargetHover && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(0,212,255,0.7)', boxShadow: '0 0 6px rgba(0,212,255,0.5)' }} />
        </div>
      )}
    </button>
  );
}
