import { useState } from 'react';
import { motion } from 'framer-motion';
import type { CellState, ShipName } from '../lib/types';
import { COLUMN_LABELS } from '../lib/constants';
import { SHIP_THEME } from './ShipSVG';

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

function SplashEffect() {
  return (
    <>
      <div className="splash-ring" />
      <div className="splash-ring" />
      <div className="splash-ring" />
    </>
  );
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
  const isSunk = hasShipEdge && (shipEdge as ShipEdge).sunk;

  let bgStyle: React.CSSProperties = {};
  let extraClass = 'cell-water';
  let content: React.ReactNode = null;

  if (cell.isHit && cell.hasShip) {
    extraClass = 'cell-hit';
    bgStyle = {
      background: isSunk
        ? 'linear-gradient(180deg, rgba(40,8,8,0.85) 0%, rgba(80,10,10,0.6) 100%)'
        : 'linear-gradient(180deg, rgba(60,15,0,0.75) 0%, rgba(100,20,0,0.5) 100%)',
    };
  } else if (cell.isHit && !cell.hasShip) {
    extraClass = 'cell-miss cell-splash';
    bgStyle = {
      background: 'radial-gradient(circle at 50% 50%, rgba(0,100,180,0.25) 0%, rgba(13,21,38,0.8) 70%)',
    };
    content = (
      <>
        <SplashEffect />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2 h-2 rounded-full relative z-[2]"
          style={{
            background: 'radial-gradient(circle at 40% 35%, rgba(0,180,255,0.5), rgba(30,60,100,0.6))',
            boxShadow: '0 0 4px rgba(0,180,255,0.3), inset 0 1px 2px rgba(255,255,255,0.15)',
          }}
        />
      </>
    );
  } else if (ownerShipCell) {
    const edge = shipEdge as ShipEdge;
    const theme = SHIP_THEME[edge.shipName];
    extraClass = '';

    bgStyle = {
      background: `radial-gradient(ellipse at 50% 50%, ${theme.glow}, transparent 70%)`,
    };
  }

  if (isHovering) {
    bgStyle = {};
    content = null;
    extraClass = hoverValid
      ? 'bg-neon-green/25 ring-1 ring-neon-green/50'
      : 'bg-neon-red/25 ring-1 ring-neon-red/50';
  }

  if (showTargetHover) {
    bgStyle = {
      background: 'rgba(0,212,255,0.12)',
      borderColor: 'rgba(0,212,255,0.5)',
      boxShadow: '0 0 12px rgba(0,212,255,0.2), inset 0 0 6px rgba(0,212,255,0.08)',
    };
    extraClass = '';
    content = null;
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
        transition-colors duration-100 relative overflow-hidden
        ${extraClass}
        ${isClickable ? 'cursor-crosshair hover:brightness-110' : 'cursor-default'}
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
