import { BOARD_SIZE, BoardGrid, CellState, Orientation, PlayerBoard, ShipName, ShipPlacement, SHIPS } from './types.js';

export function createEmptyGrid(): BoardGrid {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): CellState => ({
      hasShip: false,
      shipName: null,
      isHit: false,
    }))
  );
}

export function createEmptyBoard(): PlayerBoard {
  const shipHealth: Record<string, number> = {};
  for (const ship of SHIPS) {
    shipHealth[ship.name] = ship.length;
  }
  return {
    grid: createEmptyGrid(),
    ships: [],
    shipHealth: shipHealth as Record<ShipName, number>,
  };
}

export function isValidPlacement(
  grid: BoardGrid,
  x: number,
  y: number,
  length: number,
  orientation: Orientation
): boolean {
  for (let i = 0; i < length; i++) {
    const cx = orientation === 'horizontal' ? x + i : x;
    const cy = orientation === 'vertical' ? y + i : y;

    if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) {
      return false;
    }
    if (grid[cy][cx].hasShip) {
      return false;
    }
  }
  return true;
}

export function placeShip(
  board: PlayerBoard,
  placement: ShipPlacement
): boolean {
  const { x, y, orientation, length, name } = placement;

  if (!isValidPlacement(board.grid, x, y, length, orientation)) {
    return false;
  }

  for (let i = 0; i < length; i++) {
    const cx = orientation === 'horizontal' ? x + i : x;
    const cy = orientation === 'vertical' ? y + i : y;
    board.grid[cy][cx] = {
      hasShip: true,
      shipName: name,
      isHit: false,
    };
  }

  board.ships.push(placement);
  return true;
}

export function placeShipsRandomly(board: PlayerBoard): void {
  for (const ship of SHIPS) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 1000) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const x = Math.floor(Math.random() * BOARD_SIZE);
      const y = Math.floor(Math.random() * BOARD_SIZE);
      placed = placeShip(board, {
        name: ship.name,
        x,
        y,
        orientation,
        length: ship.length,
      });
      attempts++;
    }
  }
}

export function processShot(
  board: PlayerBoard,
  x: number,
  y: number
): { hit: boolean; sunk: boolean; shipName: ShipName | null; allSunk: boolean } {
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return { hit: false, sunk: false, shipName: null, allSunk: false };
  }

  const cell = board.grid[y][x];

  if (cell.isHit) {
    return { hit: false, sunk: false, shipName: null, allSunk: false };
  }

  cell.isHit = true;

  if (!cell.hasShip || !cell.shipName) {
    return { hit: false, sunk: false, shipName: null, allSunk: false };
  }

  const shipName = cell.shipName;
  board.shipHealth[shipName]--;

  const sunk = board.shipHealth[shipName] === 0;
  const allSunk = Object.values(board.shipHealth).every(h => h === 0);

  return { hit: true, sunk, shipName, allSunk };
}

export function getVisibleBoard(board: PlayerBoard, isOwner: boolean): BoardGrid {
  return board.grid.map(row =>
    row.map(cell => {
      if (isOwner) {
        return { ...cell };
      }
      return {
        hasShip: cell.isHit && cell.hasShip,
        shipName: cell.isHit ? cell.shipName : null,
        isHit: cell.isHit,
      };
    })
  );
}
