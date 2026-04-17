import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BoardGrid, Orientation, ShipPlacement as ShipPlacementType, ShipName, ShipDefinition } from '../lib/types';
import { BOARD_SIZE, SHIPS } from '../lib/types';
import { COLUMN_LABELS, ROW_LABELS } from '../lib/constants';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { ShipSVG, ShipIcon, SHIP_THEME } from './ShipSVG';
import { useI18n } from '../lib/i18n';

interface ShipPlacementProps {
  onConfirm: (placements: ShipPlacementType[]) => void;
  waitingForOpponent?: boolean;
  onQuit?: () => void;
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
  orientation: Orientation,
  ignoreName?: ShipName
): boolean {
  for (let i = 0; i < length; i++) {
    const cx = orientation === 'horizontal' ? x + i : x;
    const cy = orientation === 'vertical' ? y + i : y;
    if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) return false;
    const cell = grid[cy][cx];
    if (cell.hasShip && cell.shipName !== ignoreName) return false;
  }
  return true;
}

function removeShipFromGrid(grid: BoardGrid, placement: ShipPlacementType): BoardGrid {
  const g = grid.map(row => row.map(cell => ({ ...cell })));
  for (let i = 0; i < placement.length; i++) {
    const cx = placement.orientation === 'horizontal' ? placement.x + i : placement.x;
    const cy = placement.orientation === 'vertical' ? placement.y + i : placement.y;
    g[cy][cx] = { hasShip: false, shipName: null, isHit: false };
  }
  return g;
}

function placeShipOnGrid(grid: BoardGrid, placement: ShipPlacementType): BoardGrid {
  const g = grid.map(row => row.map(cell => ({ ...cell })));
  for (let i = 0; i < placement.length; i++) {
    const cx = placement.orientation === 'horizontal' ? placement.x + i : placement.x;
    const cy = placement.orientation === 'vertical' ? placement.y + i : placement.y;
    g[cy][cx] = { hasShip: true, shipName: placement.name, isHit: false };
  }
  return g;
}

const GAP = 2;
const PAD = 6;

interface DragState {
  ship: ShipDefinition;
  orientation: Orientation;
  offsetX: number;
  offsetY: number;
  cursorX: number;
  cursorY: number;
  fromBoard: boolean;
}

export function ShipPlacement({ onConfirm, waitingForOpponent, onQuit }: ShipPlacementProps) {
  const [grid, setGrid] = useState<BoardGrid>(createEmptyGrid);
  const { t } = useI18n();
  const [placements, setPlacements] = useState<ShipPlacementType[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipDefinition | null>(SHIPS[0]);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const { playPlace } = useSoundEffects();

  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (!gridRef.current) return;
      const firstCell = gridRef.current.querySelector('button');
      if (firstCell) setCellSize(firstCell.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (gridRef.current) ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, []);

  const placedNames = new Set(placements.map(p => p.name));

  const gridForValidation = useCallback((): BoardGrid => {
    if (!drag?.fromBoard) return grid;
    const existing = placements.find(p => p.name === drag.ship.name);
    return existing ? removeShipFromGrid(grid, existing) : grid;
  }, [drag, grid, placements]);

  const getHoverCells = useCallback(
    (x: number, y: number): { x: number; y: number }[] => {
      if (!selectedShip) return [];
      const cells: { x: number; y: number }[] = [];
      for (let i = 0; i < selectedShip.length; i++) {
        const cx = orientation === 'horizontal' ? x + i : x;
        const cy = orientation === 'vertical' ? y + i : y;
        cells.push({ x: cx, y: cy });
      }
      return cells;
    },
    [selectedShip, orientation]
  );

  const hoverCells = hoverPos && !drag ? getHoverCells(hoverPos.x, hoverPos.y) : [];
  const isValid = hoverPos && selectedShip && !drag
    ? isValidPlacement(grid, hoverPos.x, hoverPos.y, selectedShip.length, orientation)
    : false;

  const dragCells = useCallback((): { x: number; y: number }[] => {
    if (!drag || !dropTarget) return [];
    const cells: { x: number; y: number }[] = [];
    for (let i = 0; i < drag.ship.length; i++) {
      const cx = drag.orientation === 'horizontal' ? dropTarget.x + i : dropTarget.x;
      const cy = drag.orientation === 'vertical' ? dropTarget.y + i : dropTarget.y;
      cells.push({ x: cx, y: cy });
    }
    return cells;
  }, [drag, dropTarget]);

  const dragValid = useCallback((): boolean => {
    if (!drag || !dropTarget) return false;
    const vGrid = gridForValidation();
    return isValidPlacement(vGrid, dropTarget.x, dropTarget.y, drag.ship.length, drag.orientation, drag.fromBoard ? drag.ship.name : undefined);
  }, [drag, dropTarget, gridForValidation]);

  const boardToCell = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left - PAD) / (cellSize + GAP));
    const y = Math.floor((clientY - rect.top - PAD) / (cellSize + GAP));
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return null;
    return { x, y };
  }, [cellSize]);

  const handleCellClick = (x: number, y: number) => {
    if (drag) return;
    if (!selectedShip) return;
    if (!isValidPlacement(grid, x, y, selectedShip.length, orientation)) return;

    const newPlacement: ShipPlacementType = {
      name: selectedShip.name,
      x, y, orientation,
      length: selectedShip.length,
    };
    const newGrid = placeShipOnGrid(grid, newPlacement);
    const newPlacements = [...placements, newPlacement];

    setGrid(newGrid);
    setPlacements(newPlacements);
    setHoverPos(null);
    playPlace();

    const newPlacedNames = new Set(newPlacements.map(p => p.name));
    const nextUnplaced = SHIPS.find(s => !newPlacedNames.has(s.name));
    setSelectedShip(nextUnplaced || null);
  };

  // -- Drag handlers --
  const startDragFromPanel = (ship: ShipDefinition, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (placedNames.has(ship.name)) {
      const existing = placements.find(p => p.name === ship.name);
      if (existing) {
        setDrag({
          ship,
          orientation: existing.orientation,
          offsetX: 0, offsetY: 0,
          cursorX: clientX, cursorY: clientY,
          fromBoard: true,
        });
        return;
      }
    }

    setDrag({
      ship,
      orientation,
      offsetX: 0, offsetY: 0,
      cursorX: clientX, cursorY: clientY,
      fromBoard: false,
    });
  };

  const startDragFromBoard = (shipName: ShipName, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const placement = placements.find(p => p.name === shipName);
    if (!placement) return;
    const shipDef = SHIPS.find(s => s.name === shipName);
    if (!shipDef) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDrag({
      ship: shipDef,
      orientation: placement.orientation,
      offsetX: 0, offsetY: 0,
      cursorX: clientX, cursorY: clientY,
      fromBoard: true,
    });
  };

  useEffect(() => {
    if (!drag) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setDrag(prev => prev ? { ...prev, cursorX: clientX, cursorY: clientY } : null);
      const cell = boardToCell(clientX, clientY);
      setDropTarget(cell);
    };

    const onUp = (e: MouseEvent | TouchEvent) => {
      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;
      const cell = boardToCell(clientX, clientY);

      if (cell && drag) {
        const vGrid = drag.fromBoard
          ? removeShipFromGrid(grid, placements.find(p => p.name === drag.ship.name)!)
          : grid;

        if (isValidPlacement(vGrid, cell.x, cell.y, drag.ship.length, drag.orientation, drag.fromBoard ? drag.ship.name : undefined)) {
          const newPlacement: ShipPlacementType = {
            name: drag.ship.name,
            x: cell.x, y: cell.y,
            orientation: drag.orientation,
            length: drag.ship.length,
          };

          let baseGrid = vGrid;
          let basePlacements = drag.fromBoard
            ? placements.filter(p => p.name !== drag.ship.name)
            : placements;

          baseGrid = placeShipOnGrid(baseGrid, newPlacement);
          basePlacements = [...basePlacements, newPlacement];

          setGrid(baseGrid);
          setPlacements(basePlacements);
          playPlace();

          const newPlacedNames = new Set(basePlacements.map(p => p.name));
          const nextUnplaced = SHIPS.find(s => !newPlacedNames.has(s.name));
          setSelectedShip(nextUnplaced || null);
        }
      }

      setDrag(null);
      setDropTarget(null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setDrag(prev => prev ? {
          ...prev,
          orientation: prev.orientation === 'horizontal' ? 'vertical' : 'horizontal',
        } : null);
      }
      if (e.key === 'Escape') {
        setDrag(null);
        setDropTarget(null);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drag, grid, placements, boardToCell, playPlace, cellSize]);

  const handleSelectShip = (ship: ShipDefinition) => {
    if (drag) return;
    if (placedNames.has(ship.name)) {
      const existing = placements.find(p => p.name === ship.name)!;
      setGrid(removeShipFromGrid(grid, existing));
      setPlacements(prev => prev.filter(p => p.name !== ship.name));
      setSelectedShip(ship);
    } else {
      setSelectedShip(selectedShip?.name === ship.name ? null : ship);
    }
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
    setSelectedShip(null);
    playPlace();
  };

  const handleClear = () => {
    setGrid(createEmptyGrid());
    setPlacements([]);
    setSelectedShip(SHIPS[0]);
  };

  const allPlaced = placements.length === SHIPS.length;
  const currentDragCells = dragCells();
  const currentDragValid = dragValid();

  const visiblePlacements = drag?.fromBoard
    ? placements.filter(p => p.name !== drag.ship.name)
    : placements;

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
            className="w-12 h-12 border-2 border-neon-blue/30 border-t-neon-blue rounded-full mx-auto mb-6
              shadow-[0_0_12px_rgba(0,212,255,0.3)]"
          />
          <h2 className="text-2xl font-display text-white mb-2 text-3d">{t('ships_deployed')}</h2>
          <p className="text-ocean-400">{t('waiting_opponent_deploy')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-3 sm:px-6 py-4 sm:py-8 select-none w-full max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 sm:gap-5 w-full"
      >
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-display text-white tracking-wider mb-1 text-3d">{t('deploy_fleet')}</h2>
          {drag && (
            <p className="text-ocean-400 text-sm">
              {t('dragging')} <span className="text-neon-blue font-semibold"
                style={{ textShadow: '0 0 8px rgba(0,212,255,0.4)' }}>
                {t(drag.ship.name)}
              </span>
              <span className="text-ocean-500"> &mdash; {t('press_r_rotate')}</span>
            </p>
          )}
          {!drag && selectedShip && (
            <p className="text-ocean-400 text-sm">
              {t('placing')} <span className="text-neon-blue font-semibold"
                style={{ textShadow: '0 0 8px rgba(0,212,255,0.4)' }}>
                {t(selectedShip.name)}
              </span>
              <span className="text-ocean-500"> ({selectedShip.length} {t('cells')})</span>
            </p>
          )}
          {!drag && !selectedShip && !allPlaced && (
            <p className="text-ocean-400 text-sm">{t('drag_select_hint')}</p>
          )}
          {!drag && allPlaced && (
            <p className="text-neon-green text-sm" style={{ textShadow: '0 0 8px rgba(0,255,136,0.4)' }}>
              {t('all_ships_placed')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}
            className="px-4 py-2 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-lg border border-ocean-600 text-ocean-300
              hover:border-neon-blue/50 transition-all text-sm font-display tracking-wider btn-3d"
          >
            {orientation === 'horizontal' ? t('orientation_horizontal') : t('orientation_vertical')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRandomize}
            className="px-4 py-2 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-lg border border-ocean-600 text-ocean-300
              hover:border-neon-orange/50 transition-all text-sm font-display tracking-wider btn-3d"
          >
            {t('randomize')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            disabled={placements.length === 0}
            className="px-4 py-2 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-lg border border-ocean-600 text-ocean-300
              hover:border-neon-red/50 transition-all text-sm font-display tracking-wider btn-3d
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t('clear')}
          </motion.button>
        </div>

        <p className="text-ocean-500 text-xs">
          <kbd className="px-1.5 py-0.5 bg-ocean-800 rounded text-ocean-300
            shadow-[0_2px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">R</kbd> {t('rotate')}
          &nbsp;&#183;&nbsp; {t('drag_hint')}
        </p>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start w-full">
          {/* Fleet panel */}
          <div className="glass-panel rounded-xl border border-ocean-700/30 p-3 sm:p-4 w-full md:w-56 shrink-0">
            <h4 className="text-xs font-display text-ocean-400 tracking-wider mb-3"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{t('drag_to_deploy')}</h4>
            <div className="space-y-1.5">
              {SHIPS.map(ship => {
                const isPlaced = placedNames.has(ship.name);
                const isActive = selectedShip?.name === ship.name;
                const isDragging = drag?.ship.name === ship.name;
                const theme = SHIP_THEME[ship.name];

                return (
                  <button
                    key={ship.name}
                    onClick={() => handleSelectShip(ship)}
                    onMouseDown={(e) => startDragFromPanel(ship, e)}
                    onTouchStart={(e) => startDragFromPanel(ship, e)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 cursor-grab active:cursor-grabbing
                      ${isDragging
                        ? 'border-neon-blue/80 bg-neon-blue/20 opacity-50'
                        : isActive
                        ? 'border-neon-blue/60 bg-neon-blue/10'
                        : isPlaced
                        ? 'border-neon-green/30 bg-neon-green/5 hover:border-neon-green/50'
                        : 'border-ocean-600/30 bg-ocean-800/50 hover:border-ocean-500/50 hover:bg-ocean-700/40'
                      }`}
                    style={{
                      boxShadow: isActive
                        ? `0 0 12px ${theme.glow}, inset 0 1px 0 rgba(0,212,255,0.1)`
                        : isPlaced
                        ? '0 2px 4px rgba(0,0,0,0.3)'
                        : '0 1px 2px rgba(0,0,0,0.2)',
                    }}
                  >
                    <ShipIcon name={ship.name} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-display tracking-wider truncate
                        ${isActive ? 'text-neon-blue' : isPlaced ? 'text-neon-green/70' : 'text-ocean-300'}`}>
                        {t(ship.name)}
                      </div>
                      <div className="text-[10px] text-ocean-500 font-mono">{ship.length} {t('cells')}</div>
                    </div>
                    {isPlaced && !isDragging && (
                      <span className="text-neon-green text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Board */}
          <div
            className="relative w-full md:flex-1 min-w-0"
            onKeyDown={(e) => { if (e.key === 'r' || e.key === 'R') setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal'); }}
            tabIndex={0}
          >
            <div className="grid grid-cols-10 gap-[2px] mb-0.5" style={{ marginLeft: '28px', paddingLeft: `${PAD}px`, paddingRight: `${PAD}px` }}>
              {COLUMN_LABELS.map(label => (
                <div key={label} className="text-center text-[10px] sm:text-xs text-ocean-400/80 font-mono">
                  {label}
                </div>
              ))}
            </div>
            <div className="flex">
              <div className="flex flex-col w-7 shrink-0" style={{ paddingTop: `${PAD}px`, paddingBottom: `${PAD}px` }}>
                {ROW_LABELS.map(label => (
                  <div key={label} className="flex-1 flex items-center justify-end pr-1 text-[10px] sm:text-xs text-ocean-400/80 font-mono">
                    {label}
                  </div>
                ))}
              </div>

              <div className="relative flex-1" ref={boardRef}>
                <div
                  ref={gridRef}
                  className="grid grid-cols-10 gap-[2px] p-1.5 rounded-lg board-frame w-full"
                  style={{ aspectRatio: '1 / 1' }}
                >
                  {grid.map((row, y) =>
                    row.map((cell, x) => {
                      const isHoveringCell = !drag && hoverCells.some(c => c.x === x && c.y === y);
                      const isDragCell = drag && currentDragCells.some(c => c.x === x && c.y === y);
                      const hasShip = cell.hasShip && cell.shipName;
                      const isBeingDragged = drag?.fromBoard && hasShip && cell.shipName === drag.ship.name;

                      let bgClass = 'cell-water';
                      let cellStyle: React.CSSProperties = {};

                      if (hasShip && !isBeingDragged) {
                        const theme = SHIP_THEME[cell.shipName!];
                        bgClass = '';
                        cellStyle = {
                          background: `radial-gradient(ellipse at 50% 50%, ${theme.glow}, transparent 70%)`,
                        };
                      }

                      if (isBeingDragged) {
                        bgClass = 'cell-water';
                        cellStyle = { opacity: 0.4 };
                      }

                      if (isDragCell) {
                        bgClass = currentDragValid
                          ? 'bg-neon-green/25 ring-1 ring-neon-green/50'
                          : 'bg-neon-red/25 ring-1 ring-neon-red/50';
                        cellStyle = {};
                      } else if (isHoveringCell) {
                        bgClass = isValid
                          ? 'bg-neon-green/25 ring-1 ring-neon-green/50'
                          : 'bg-neon-red/25 ring-1 ring-neon-red/50';
                        cellStyle = {};
                      }

                      return (
                        <button
                          key={`${x}-${y}`}
                          onClick={() => handleCellClick(x, y)}
                          onMouseEnter={() => !drag && setHoverPos({ x, y })}
                          onMouseLeave={() => !drag && setHoverPos(null)}
                          disabled={allPlaced && !selectedShip && !drag}
                          className={`rounded-[3px] border border-ocean-600/20 transition-colors duration-100 relative
                            ${bgClass} ${(!allPlaced || selectedShip || drag) ? 'cursor-crosshair hover:brightness-110' : 'cursor-default'}`}
                          style={cellStyle}
                        />
                      );
                    })
                  )}
                </div>

                {/* SVG ship overlays -- draggable */}
                {visiblePlacements.map(ship => {
                  const left = PAD + ship.x * (cellSize + GAP);
                  const top = PAD + ship.y * (cellSize + GAP);
                  return (
                    <div
                      key={ship.name}
                      onMouseDown={(e) => startDragFromBoard(ship.name, e)}
                      onTouchStart={(e) => startDragFromBoard(ship.name, e)}
                      style={{
                        position: 'absolute',
                        left,
                        top,
                        cursor: 'grab',
                        zIndex: 2,
                      }}
                    >
                      <ShipSVG
                        name={ship.name}
                        cellCount={ship.length}
                        orientation={ship.orientation}
                        cellSize={cellSize}
                      />
                    </div>
                  );
                })}

                {/* Drop preview SVG */}
                {drag && dropTarget && (
                  <div
                    style={{
                      position: 'absolute',
                      left: PAD + dropTarget.x * (cellSize + GAP),
                      top: PAD + dropTarget.y * (cellSize + GAP),
                      opacity: currentDragValid ? 0.7 : 0.3,
                      pointerEvents: 'none',
                      zIndex: 3,
                    }}
                  >
                    <ShipSVG
                      name={drag.ship.name}
                      cellCount={drag.ship.length}
                      orientation={drag.orientation}
                      cellSize={cellSize}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {allPlaced && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onConfirm(placements)}
              className="w-full px-8 py-3 bg-gradient-to-b from-neon-green/20 to-neon-blue/10 rounded-xl
                border border-neon-green/40 text-white font-display text-lg tracking-wider
                hover:border-neon-green/70 transition-all duration-300 btn-3d"
              style={{ textShadow: '0 0 10px rgba(0,255,136,0.4)' }}
            >
              {t('confirm_deployment')}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {onQuit && (
        <button
          onClick={onQuit}
          className="mt-6 w-full px-6 py-3 text-sm font-display tracking-wider rounded-lg border
            border-neon-red/40 text-neon-red bg-neon-red/10
            hover:border-neon-red/60 hover:text-neon-red hover:bg-neon-red/15
            active:bg-neon-red/20 transition-all duration-200 btn-3d"
        >
          {t('quit_game')}
        </button>
      )}

      {/* Floating drag ghost */}
      {drag && (
        <div
          style={{
            position: 'fixed',
            left: drag.cursorX - 20,
            top: drag.cursorY - 20,
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.85,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
          }}
        >
          <ShipSVG
            name={drag.ship.name}
            cellCount={drag.ship.length}
            orientation={drag.orientation}
            cellSize={cellSize}
          />
        </div>
      )}
    </div>
  );
}
