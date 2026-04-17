import { useState } from 'react';
import { motion } from 'framer-motion';
import type { CellState } from '../lib/types';
import { COLUMN_LABELS } from '../lib/constants';

interface CellProps {
  cell: CellState;
  x: number;
  y: number;
  onClick?: (x: number, y: number) => void;
  isOwner: boolean;
  isHovering?: boolean;
  hoverValid?: boolean;
  disabled?: boolean;
}

export function Cell({ cell, x, y, onClick, isOwner, isHovering, hoverValid, disabled }: CellProps) {
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (!disabled && onClick) onClick(x, y);
  };

  let bgClass = 'bg-ocean-700/40 cell-3d-water';
  let depthClass = 'cell-3d';
  let content = null;

  if (cell.isHit && cell.hasShip) {
    bgClass = 'bg-hit/70';
    depthClass = 'cell-3d-hit';
    content = (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        className="w-full h-full flex items-center justify-center relative"
      >
        <span className="text-white text-base font-bold drop-shadow-[0_0_8px_rgba(255,51,102,0.9)] relative z-10">✕</span>
        <div className="absolute inset-0 bg-gradient-radial from-hit/30 to-transparent rounded-sm" />
      </motion.div>
    );
  } else if (cell.isHit && !cell.hasShip) {
    bgClass = 'bg-ocean-800/80';
    depthClass = 'cell-3d-miss';
    content = (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-3 h-3 rounded-full bg-ocean-400/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4),0_0_4px_rgba(0,180,255,0.15)]"
      />
    );
  } else if (cell.hasShip && isOwner) {
    bgClass = 'bg-ship';
    depthClass = 'cell-3d-ship';
  }

  // Placement hover (from ShipPlacement component)
  if (isHovering) {
    depthClass = 'cell-3d';
    bgClass = hoverValid
      ? 'bg-neon-green/25 ring-1 ring-neon-green/50 shadow-[0_0_12px_rgba(0,255,136,0.2)]'
      : 'bg-neon-red/25 ring-1 ring-neon-red/50 shadow-[0_0_12px_rgba(255,51,102,0.2)]';
  }

  const isClickable = !disabled && onClick && !cell.isHit;

  // Targeting hover for firing phase (enemy board)
  const showTargetHover = hovered && isClickable && !isOwner && !isHovering;

  const coordLabel = `${COLUMN_LABELS[x] || x}${y + 1}`;

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled || cell.isHit}
      whileHover={isClickable ? { scale: 1.08, zIndex: 10 } : undefined}
      whileTap={isClickable ? { scale: 0.92 } : undefined}
      aria-label={`${coordLabel}${cell.isHit ? (cell.hasShip ? ', hit' : ', miss') : ''}`}
      className={`
        w-full aspect-square rounded-[3px] border flex items-center justify-center
        transition-all duration-150 relative
        ${depthClass}
        ${showTargetHover
          ? 'bg-neon-blue/20 border-neon-blue/60 shadow-[0_0_14px_rgba(0,212,255,0.3),inset_0_0_8px_rgba(0,212,255,0.1)]'
          : `${bgClass} border-ocean-600/20`
        }
        ${isClickable ? 'cursor-crosshair' : 'cursor-default'}
      `}
    >
      {content}
      {showTargetHover && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-neon-blue/60 shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
          <div className="absolute inset-[3px] border border-neon-blue/30 rounded-[2px]" />
        </div>
      )}
    </motion.button>
  );
}
