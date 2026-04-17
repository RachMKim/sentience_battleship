import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { BoardGrid, ShipPlacement, ShipName } from '../lib/types';
import { Cell } from './Cell';
import { ShipSVG } from './ShipSVG';
import { COLUMN_LABELS, ROW_LABELS } from '../lib/constants';
import { SHIPS } from '../lib/types';

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
  opponentShipsSunk?: Record<ShipName, boolean>;
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

interface RevealedShip {
  name: ShipName;
  cells: { x: number; y: number }[];
  orientation: 'horizontal' | 'vertical';
  sunk: boolean;
}

function buildRevealedEnemyShips(grid: BoardGrid, sunkMap?: Record<ShipName, boolean>): RevealedShip[] {
  if (!grid || !Array.isArray(grid) || grid.length === 0) return [];

  const shipCells = new Map<ShipName, { x: number; y: number }[]>();

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];
      if (!cell) continue;
      if (cell.isHit && cell.hasShip && cell.shipName) {
        if (!shipCells.has(cell.shipName)) shipCells.set(cell.shipName, []);
        shipCells.get(cell.shipName)!.push({ x, y });
      }
    }
  }

  const revealed: RevealedShip[] = [];
  for (const [name, cells] of shipCells) {
    if (cells.length === 0) continue;
    const sunk = sunkMap ? sunkMap[name] === true : false;

    let orient: 'horizontal' | 'vertical' = 'horizontal';
    if (cells.length > 1) {
      orient = cells[0].x === cells[1].x ? 'vertical' : 'horizontal';
    }

    cells.sort((a, b) => orient === 'horizontal' ? a.x - b.x : a.y - b.y);
    revealed.push({ name, cells, orientation: orient, sunk });
  }
  return revealed;
}

const GAP = 2;
const PAD = 6;

export function Board({ grid, isOwner, onCellClick, disabled, title, hoverCells, hoverValid, ships, shipHealth, opponentShipsSunk }: BoardProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(0);

  const measure = useCallback(() => {
    if (!gridRef.current) return;
    const firstCell = gridRef.current.querySelector('button');
    if (firstCell) {
      setCellSize(firstCell.offsetWidth);
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (gridRef.current) ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [measure]);

  if (!grid || grid.length === 0) return null;

  const hoverSet = new Set(hoverCells?.map(c => `${c.x},${c.y}`) || []);
  const shipEdgeMap = ships ? buildShipEdgeMap(ships, shipHealth) : new Map<string, ShipEdge>();
  const revealedEnemyShips = !isOwner ? buildRevealedEnemyShips(grid, opponentShipsSunk) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center w-full"
    >
      <h3 className="text-xs sm:text-sm font-display uppercase tracking-widest text-ocean-300 mb-2 sm:mb-3"
        style={{ textShadow: '0 0 10px rgba(90,130,180,0.4), 0 1px 0 rgba(0,0,0,0.4)' }}
      >
        {title}
      </h3>

      <div className="w-full">
        {/* Column labels */}
        <div className="grid grid-cols-10 gap-[2px] mb-0.5" style={{ marginLeft: '28px', paddingLeft: `${PAD}px`, paddingRight: `${PAD}px` }}>
          {COLUMN_LABELS.map(label => (
            <div key={label} className="text-center text-[10px] sm:text-xs text-ocean-400/80 font-mono">
              {label}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Row labels */}
          <div className="flex flex-col w-7 shrink-0" style={{ paddingTop: `${PAD}px`, paddingBottom: `${PAD}px` }}>
            {ROW_LABELS.map(label => (
              <div key={label} className="flex-1 flex items-center justify-end pr-1 text-[10px] sm:text-xs text-ocean-400/80 font-mono" style={{ gap: '2px' }}>
                {label}
              </div>
            ))}
          </div>

          {/* Grid — cells use 1fr to fill available space */}
          <div className="relative flex-1">
            <div
              ref={gridRef}
              className="grid grid-cols-10 gap-[2px] p-1.5 rounded-lg board-frame w-full"
              style={{ aspectRatio: '1 / 1' }}
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

            {/* Owner ship SVGs + fire on hits */}
            {cellSize > 0 && isOwner && ships && ships.map(ship => {
              const sunk = shipHealth ? shipHealth[ship.name] === 0 : false;
              const left = PAD + ship.x * (cellSize + GAP);
              const top = PAD + ship.y * (cellSize + GAP);

              const hitIndices: number[] = [];
              for (let i = 0; i < ship.length; i++) {
                const cx = ship.orientation === 'horizontal' ? ship.x + i : ship.x;
                const cy = ship.orientation === 'vertical' ? ship.y + i : ship.y;
                if (grid[cy]?.[cx]?.isHit) hitIndices.push(i);
              }

              return (
                <div key={ship.name} style={{ position: 'absolute', left, top, pointerEvents: 'none', zIndex: 1 }}>
                  <ShipSVG name={ship.name} cellCount={ship.length} orientation={ship.orientation} cellSize={cellSize} sunk={sunk} />
                  {hitIndices.map(idx => {
                    const isHoriz = ship.orientation === 'horizontal';
                    return (
                      <div key={idx} className={sunk ? 'cell-sunk-fire' : 'cell-fire'}
                        style={{
                          position: 'absolute',
                          left: isHoriz ? idx * (cellSize + GAP) : 0,
                          top: isHoriz ? 0 : idx * (cellSize + GAP),
                          width: cellSize, height: cellSize,
                          pointerEvents: 'none', zIndex: 2,
                        }}>
                        {sunk ? (
                          <div className="sunk-embers"><div className="ember" /><div className="ember" /><div className="ember" /></div>
                        ) : (
                          <div className="flame-layer">
                            <div className="smoke-wisp" /><div className="smoke-wisp" />
                            <div className="flame-glow" /><div className="flame-core" /><div className="flame-inner" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Enemy board: revealed ship silhouettes from hit cells */}
            {cellSize > 0 && !isOwner && revealedEnemyShips.map(rs => {
              const firstCell = rs.cells[0];
              const left = PAD + firstCell.x * (cellSize + GAP);
              const top = PAD + firstCell.y * (cellSize + GAP);
              const shipDef = SHIPS.find(s => s.name === rs.name);
              const fullLength = shipDef?.length || rs.cells.length;

              if (rs.sunk && rs.cells.length === fullLength) {
                return (
                  <div key={rs.name} style={{ position: 'absolute', left, top, pointerEvents: 'none', zIndex: 1 }}>
                    <ShipSVG name={rs.name} cellCount={fullLength} orientation={rs.orientation} cellSize={cellSize} sunk />
                    {rs.cells.map((_, idx) => {
                      const isHoriz = rs.orientation === 'horizontal';
                      return (
                        <div key={idx} className="cell-sunk-fire"
                          style={{
                            position: 'absolute',
                            left: isHoriz ? idx * (cellSize + GAP) : 0,
                            top: isHoriz ? 0 : idx * (cellSize + GAP),
                            width: cellSize, height: cellSize,
                            pointerEvents: 'none', zIndex: 2,
                          }}>
                          <div className="sunk-embers"><div className="ember" /><div className="ember" /><div className="ember" /></div>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              return rs.cells.map((cell, idx) => (
                <div key={`${rs.name}-${idx}`} className="cell-fire"
                  style={{
                    position: 'absolute',
                    left: PAD + cell.x * (cellSize + GAP),
                    top: PAD + cell.y * (cellSize + GAP),
                    width: cellSize, height: cellSize,
                    pointerEvents: 'none', zIndex: 1,
                  }}>
                  <div className="flame-layer">
                    <div className="smoke-wisp" /><div className="smoke-wisp" />
                    <div className="flame-glow" /><div className="flame-core" /><div className="flame-inner" />
                  </div>
                </div>
              ));
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
