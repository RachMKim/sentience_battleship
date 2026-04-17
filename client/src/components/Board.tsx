import { motion } from 'framer-motion';
import type { BoardGrid, ShipPlacement, ShipName } from '../lib/types';
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
  ships?: ShipPlacement[];
  shipHealth?: Record<ShipName, number>;
  cellSize?: number;
}

type ShipEdge = { isShip: true; shipName: ShipName; isFirst: boolean; isLast: boolean; orientation: 'horizontal' | 'vertical'; sunk: boolean }
  | { isShip: false };

function buildShipEdgeMap(ships: ShipPlacement[], shipHealth?: Record<ShipName, number>): Map<string, ShipEdge> {
  const map = new Map<string, ShipEdge>();
  for (const ship of ships) {
    const sunk = shipHealth ? shipHealth[ship.name] === 0 : false;
    for (let i = 0; i < ship.length; i++) {
      const cx = ship.orientation === 'horizontal' ? ship.x + i : ship.x;
      const cy = ship.orientation === 'vertical' ? ship.y + i : ship.y;
      map.set(`${cx},${cy}`, {
        isShip: true,
        shipName: ship.name,
        isFirst: i === 0,
        isLast: i === ship.length - 1,
        orientation: ship.orientation,
        sunk,
      });
    }
  }
  return map;
}

export function Board({ grid, isOwner, onCellClick, disabled, title, hoverCells, hoverValid, ships, shipHealth, cellSize = 36 }: BoardProps) {
  if (!grid || grid.length === 0) return null;

  const hoverSet = new Set(hoverCells?.map(c => `${c.x},${c.y}`) || []);
  const shipEdgeMap = ships ? buildShipEdgeMap(ships, shipHealth) : new Map<string, ShipEdge>();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center"
    >
      <h3 className="text-sm font-display uppercase tracking-widest text-ocean-300 mb-3"
        style={{ textShadow: '0 0 10px rgba(90,130,180,0.4), 0 1px 0 rgba(0,0,0,0.4)' }}
      >
        {title}
      </h3>

      <div>
        {/* Column labels */}
        <div className="flex mb-1" style={{ marginLeft: '2rem' }}>
          {COLUMN_LABELS.map(label => (
            <div key={label} className="text-center text-xs text-ocean-400/80 font-mono" style={{ width: `${cellSize}px` }}>
              {label}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Row labels */}
          <div className="flex flex-col mr-1 justify-around">
            {ROW_LABELS.map(label => (
              <div key={label} className="h-full flex items-center justify-end pr-1 text-xs text-ocean-400/80 font-mono w-7">
                {label}
              </div>
            ))}
          </div>

          <div
            className="grid gap-[2px] p-1.5 rounded-lg board-frame"
            style={{
              gridTemplateColumns: `repeat(10, ${cellSize}px)`,
              gridTemplateRows: `repeat(10, ${cellSize}px)`,
            }}
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
                  shipEdge={shipEdgeMap.get(`${x},${y}`)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
