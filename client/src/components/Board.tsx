import { motion } from 'framer-motion';
import type { BoardGrid } from '../lib/types';
import { Cell } from './Cell';
import { COLUMN_LABELS, ROW_LABELS } from '../lib/constants';

interface BoardProps {
  grid: BoardGrid;
  isOwner: boolean;
  onCellClick?: (x: number, y: number) => void;
  disabled?: boolean;
  title: string;
  hoverCells?: { x: number; y: number }[];
  hoverValid?: boolean;
}

export function Board({ grid, isOwner, onCellClick, disabled, title, hoverCells, hoverValid }: BoardProps) {
  if (!grid || grid.length === 0) return null;

  const hoverSet = new Set(hoverCells?.map(c => `${c.x},${c.y}`) || []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center"
    >
      <h3 className="text-sm font-display uppercase tracking-widest text-ocean-300 mb-3">{title}</h3>

      <div className="relative">
        {/* Column labels */}
        <div className="flex ml-8 mb-1">
          {COLUMN_LABELS.map(label => (
            <div key={label} className="text-center text-xs text-ocean-400 font-mono" style={{ width: '2rem' }}>
              {label}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Row labels */}
          <div className="flex flex-col mr-1 justify-around">
            {ROW_LABELS.map(label => (
              <div key={label} className="h-full flex items-center justify-end pr-1 text-xs text-ocean-400 font-mono w-7">
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div
            className="grid gap-[2px] p-1 rounded-lg bg-ocean-900/80 border border-ocean-600/20 shadow-[0_0_30px_rgba(0,212,255,0.05)]"
            style={{ gridTemplateColumns: 'repeat(10, 2rem)', gridTemplateRows: 'repeat(10, 2rem)' }}
          >
            {grid.map((row, y) =>
              row.map((cell, x) => (
                <Cell
                  key={`${x}-${y}`}
                  cell={cell}
                  x={x}
                  y={y}
                  onClick={onCellClick}
                  isOwner={isOwner}
                  isHovering={hoverSet.has(`${x},${y}`)}
                  hoverValid={hoverValid}
                  disabled={disabled}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
