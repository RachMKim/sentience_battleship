import { motion } from 'framer-motion';
import type { CellState } from '../lib/types';

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

  if (isHovering) {
    depthClass = 'cell-3d';
    bgClass = hoverValid
      ? 'bg-neon-green/25 ring-1 ring-neon-green/50 shadow-[0_0_12px_rgba(0,255,136,0.2)]'
      : 'bg-neon-red/25 ring-1 ring-neon-red/50 shadow-[0_0_12px_rgba(255,51,102,0.2)]';
  }

  const isClickable = !disabled && onClick && !cell.isHit;

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || cell.isHit}
      whileHover={isClickable ? { scale: 1.12, zIndex: 10, translateZ: '6px' } : undefined}
      whileTap={isClickable ? { scale: 0.92 } : undefined}
      className={`
        w-full aspect-square rounded-[3px] border border-ocean-600/20 flex items-center justify-center
        transition-all duration-150
        ${depthClass}
        ${bgClass}
        ${isClickable ? 'cursor-crosshair hover:border-neon-blue/50 hover:shadow-[0_0_10px_rgba(0,212,255,0.15)]' : 'cursor-default'}
      `}
    >
      {content}
    </motion.button>
  );
}
