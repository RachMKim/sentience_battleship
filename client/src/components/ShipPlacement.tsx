import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BoardGrid, Orientation, ShipPlacement as ShipPlacementType } from '../lib/types';
import { BOARD_SIZE, SHIPS } from '../lib/types';
import { COLUMN_LABELS, ROW_LABELS, SHIP_COLORS, SHIP_LABELS } from '../lib/constants';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface ShipPlacementProps {
  onConfirm: (placements: ShipPlacementType[]) => void;
  waitingForOpponent?: boolean;
}

function createEmptyGrid(): BoardGrid {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      hasShip: false,
      shipName: null,
      isHit: false,
    }))
  );
}

function isValidPlacement(
  grid: BoardGrid,
  x: number,
  y: number,
  length: number,
  orientation: Orientation
): boolean {
  for (let i = 0; i < length; i++) {
    const cx = orientation === 'horizontal' ? x + i : x;
    const cy = orientation === 'vertical' ? y + i : y;
    if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) return false;
    if (grid[cy][cx].hasShip) return false;
  }
  return true;
}

export function ShipPlacement({ onConfirm, waitingForOpponent }: ShipPlacementProps) {
  const [grid, setGrid] = useState<BoardGrid>(createEmptyGrid);
  const [placements, setPlacements] = useState<ShipPlacementType[]>([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const { playPlace } = useSoundEffects();

  const currentShip = currentShipIndex < SHIPS.length ? SHIPS[currentShipIndex] : null;

  const getHoverCells = useCallback(
    (x: number, y: number): { x: number; y: number }[] => {
      if (!currentShip) return [];
      const cells: { x: number; y: number }[] = [];
      for (let i = 0; i < currentShip.length; i++) {
        const cx = orientation === 'horizontal' ? x + i : x;
        const cy = orientation === 'vertical' ? y + i : y;
        cells.push({ x: cx, y: cy });
      }
      return cells;
    },
    [currentShip, orientation]
  );

  const hoverCells = hoverPos ? getHoverCells(hoverPos.x, hoverPos.y) : [];
  const isValid = hoverPos && currentShip
    ? isValidPlacement(grid, hoverPos.x, hoverPos.y, currentShip.length, orientation)
    : false;

  const handleCellClick = (x: number, y: number) => {
    if (!currentShip) return;
    if (!isValidPlacement(grid, x, y, currentShip.length, orientation)) return;

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    for (let i = 0; i < currentShip.length; i++) {
      const cx = orientation === 'horizontal' ? x + i : x;
      const cy = orientation === 'vertical' ? y + i : y;
      newGrid[cy][cx] = { hasShip: true, shipName: currentShip.name, isHit: false };
    }

    const newPlacement: ShipPlacementType = {
      name: currentShip.name,
      x,
      y,
      orientation,
      length: currentShip.length,
    };

    setGrid(newGrid);
    setPlacements(prev => [...prev, newPlacement]);
    setCurrentShipIndex(prev => prev + 1);
    setHoverPos(null);
    playPlace();
  };

  const handleUndo = () => {
    if (placements.length === 0) return;
    const last = placements[placements.length - 1];
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));

    for (let i = 0; i < last.length; i++) {
      const cx = last.orientation === 'horizontal' ? last.x + i : last.x;
      const cy = last.orientation === 'vertical' ? last.y + i : last.y;
      newGrid[cy][cx] = { hasShip: false, shipName: null, isHit: false };
    }

    setGrid(newGrid);
    setPlacements(prev => prev.slice(0, -1));
    setCurrentShipIndex(prev => prev - 1);
  };

  const handleRandomize = () => {
    const newGrid = createEmptyGrid();
    const newPlacements: ShipPlacementType[] = [];

    for (const ship of SHIPS) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 1000) {
        const o: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const x = Math.floor(Math.random() * BOARD_SIZE);
        const y = Math.floor(Math.random() * BOARD_SIZE);
        if (isValidPlacement(newGrid, x, y, ship.length, o)) {
          for (let i = 0; i < ship.length; i++) {
            const cx = o === 'horizontal' ? x + i : x;
            const cy = o === 'vertical' ? y + i : y;
            newGrid[cy][cx] = { hasShip: true, shipName: ship.name, isHit: false };
          }
          newPlacements.push({ name: ship.name, x, y, orientation: o, length: ship.length });
          placed = true;
        }
        attempts++;
      }
    }

    setGrid(newGrid);
    setPlacements(newPlacements);
    setCurrentShipIndex(SHIPS.length);
    playPlace();
  };

  const allPlaced = currentShipIndex >= SHIPS.length;

  if (waitingForOpponent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-neon-blue/30 border-t-neon-blue rounded-full mx-auto mb-6"
          />
          <h2 className="text-2xl font-display text-white mb-2">SHIPS DEPLOYED</h2>
          <p className="text-ocean-400">Waiting for opponent to place their ships...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="text-center">
          <h2 className="text-2xl font-display text-white tracking-wider mb-1">DEPLOY YOUR FLEET</h2>
          {currentShip && (
            <p className="text-ocean-400 text-sm">
              Placing: <span className="text-neon-blue font-semibold">{SHIP_LABELS[currentShip.name]}</span>
              <span className="text-ocean-500"> ({currentShip.length} cells)</span>
            </p>
          )}
          {allPlaced && <p className="text-neon-green text-sm">All ships placed! Confirm when ready.</p>}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}
            className="px-4 py-2 bg-ocean-800 rounded-lg border border-ocean-600 text-ocean-300
              hover:border-neon-blue/50 transition-all text-sm font-display tracking-wider"
          >
            {orientation === 'horizontal' ? '↔ HORIZONTAL' : '↕ VERTICAL'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRandomize}
            className="px-4 py-2 bg-ocean-800 rounded-lg border border-ocean-600 text-ocean-300
              hover:border-neon-orange/50 transition-all text-sm font-display tracking-wider"
          >
            RANDOMIZE
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            disabled={placements.length === 0}
            className="px-4 py-2 bg-ocean-800 rounded-lg border border-ocean-600 text-ocean-300
              hover:border-neon-red/50 transition-all text-sm font-display tracking-wider
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            UNDO
          </motion.button>
        </div>

        {/* Keyboard hint */}
        <p className="text-ocean-500 text-xs">Press <kbd className="px-1.5 py-0.5 bg-ocean-800 rounded text-ocean-300">R</kbd> to rotate</p>

        {/* Board */}
        <div
          className="relative"
          onKeyDown={(e) => { if (e.key === 'r' || e.key === 'R') setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal'); }}
          tabIndex={0}
        >
          <div className="flex ml-8 mb-1">
            {COLUMN_LABELS.map(label => (
              <div key={label} className="w-full text-center text-xs text-ocean-400 font-mono" style={{ width: '2.5rem' }}>
                {label}
              </div>
            ))}
          </div>
          <div className="flex">
            <div className="flex flex-col mr-1">
              {ROW_LABELS.map(label => (
                <div key={label} className="flex items-center justify-end pr-1 text-xs text-ocean-400 font-mono w-7" style={{ height: '2.5rem' }}>
                  {label}
                </div>
              ))}
            </div>
            <div
              className="grid gap-[2px] p-1 rounded-lg bg-ocean-900/80 border border-ocean-600/20"
              style={{ gridTemplateColumns: 'repeat(10, 2.5rem)', gridTemplateRows: 'repeat(10, 2.5rem)' }}
            >
              {grid.map((row, y) =>
                row.map((cell, x) => {
                  const isHovering = hoverCells.some(c => c.x === x && c.y === y);
                  let bgClass = 'bg-ocean-700/50';
                  if (cell.hasShip && cell.shipName) {
                    bgClass = SHIP_COLORS[cell.shipName];
                  }
                  if (isHovering) {
                    bgClass = isValid
                      ? 'bg-neon-green/30 ring-1 ring-neon-green/50'
                      : 'bg-neon-red/30 ring-1 ring-neon-red/50';
                  }

                  return (
                    <motion.button
                      key={`${x}-${y}`}
                      whileHover={!allPlaced ? { scale: 1.1, zIndex: 10 } : undefined}
                      onClick={() => handleCellClick(x, y)}
                      onMouseEnter={() => setHoverPos({ x, y })}
                      onMouseLeave={() => setHoverPos(null)}
                      disabled={allPlaced}
                      className={`rounded-sm border border-ocean-600/30 transition-colors duration-100
                        ${bgClass} ${!allPlaced ? 'cursor-crosshair' : 'cursor-default'}`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Ship list */}
        <div className="flex gap-2 flex-wrap justify-center">
          {SHIPS.map((ship, i) => {
            const placed = i < currentShipIndex;
            const active = i === currentShipIndex;
            return (
              <div
                key={ship.name}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-display tracking-wider
                  ${placed ? 'border-neon-green/30 text-neon-green/70 bg-neon-green/5' :
                    active ? 'border-neon-blue/50 text-neon-blue bg-neon-blue/10' :
                    'border-ocean-600/30 text-ocean-500 bg-ocean-800/50'}`}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: ship.length }).map((_, j) => (
                    <div key={j} className={`w-3 h-3 rounded-sm ${placed ? 'bg-neon-green/40' : active ? SHIP_COLORS[ship.name] : 'bg-ocean-600/30'}`} />
                  ))}
                </div>
                <span>{SHIP_LABELS[ship.name]}</span>
                {placed && <span>✓</span>}
              </div>
            );
          })}
        </div>

        {/* Confirm button */}
        <AnimatePresence>
          {allPlaced && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0, 255, 136, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onConfirm(placements)}
              className="px-8 py-3 bg-gradient-to-r from-neon-green/20 to-neon-blue/20 rounded-xl
                border border-neon-green/40 text-white font-display text-lg tracking-wider
                hover:border-neon-green/70 transition-all duration-300"
            >
              CONFIRM DEPLOYMENT
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
