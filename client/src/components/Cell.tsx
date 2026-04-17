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

  let bgClass = 'bg-ocean-700/50';
  let content = null;

  if (cell.isHit && cell.hasShip) {
    bgClass = 'bg-hit/80';
    content = (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        className="w-full h-full flex items-center justify-center"
      >
        <span className="text-white text-lg font-bold drop-shadow-[0_0_6px_rgba(255,51,102,0.8)]">✕</span>
      </motion.div>
    );
  } else if (cell.isHit && !cell.hasShip) {
    bgClass = 'bg-ocean-800';
    content = (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-2.5 h-2.5 rounded-full bg-ocean-400/60"
      />
    );
  } else if (cell.hasShip && isOwner) {
    bgClass = 'bg-ship';
  }

  if (isHovering) {
    bgClass = hoverValid
      ? 'bg-neon-green/30 ring-1 ring-neon-green/50'
      : 'bg-neon-red/30 ring-1 ring-neon-red/50';
  }

  const isClickable = !disabled && onClick && !cell.isHit;

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || cell.isHit}
      whileHover={isClickable ? { scale: 1.15, zIndex: 10 } : undefined}
      whileTap={isClickable ? { scale: 0.95 } : undefined}
      className={`
        w-full aspect-square rounded-sm border border-ocean-600/30 flex items-center justify-center
        transition-colors duration-150
        ${bgClass}
        ${isClickable ? 'cursor-crosshair hover:border-neon-blue/60' : 'cursor-default'}
      `}
    >
      {content}
    </motion.button>
  );
}
