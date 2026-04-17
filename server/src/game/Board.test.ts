import { describe, it, expect } from 'vitest';
import { createEmptyGrid, createEmptyBoard, isValidPlacement, placeShip, placeShipsRandomly, processShot, getVisibleBoard } from './Board.js';
import { BOARD_SIZE, SHIPS } from './types.js';
import type { ShipPlacement } from './types.js';

describe('createEmptyGrid', () => {
  it('creates a 10x10 grid', () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(BOARD_SIZE);
    for (const row of grid) {
      expect(row).toHaveLength(BOARD_SIZE);
    }
  });

  it('all cells start empty and unhit', () => {
    const grid = createEmptyGrid();
    for (const row of grid) {
      for (const cell of row) {
        expect(cell.hasShip).toBe(false);
        expect(cell.shipName).toBeNull();
        expect(cell.isHit).toBe(false);
      }
    }
  });
});

describe('createEmptyBoard', () => {
  it('has correct initial ship health for all 5 ships', () => {
    const board = createEmptyBoard();
    expect(board.shipHealth.carrier).toBe(5);
    expect(board.shipHealth.battleship).toBe(4);
    expect(board.shipHealth.cruiser).toBe(3);
    expect(board.shipHealth.submarine).toBe(3);
    expect(board.shipHealth.destroyer).toBe(2);
  });

  it('starts with no placed ships', () => {
    const board = createEmptyBoard();
    expect(board.ships).toHaveLength(0);
  });
});

describe('isValidPlacement', () => {
  it('accepts valid horizontal placement', () => {
    const grid = createEmptyGrid();
    expect(isValidPlacement(grid, 0, 0, 5, 'horizontal')).toBe(true);
  });

  it('accepts valid vertical placement', () => {
    const grid = createEmptyGrid();
    expect(isValidPlacement(grid, 0, 0, 5, 'vertical')).toBe(true);
  });

  it('rejects placement going off right edge', () => {
    const grid = createEmptyGrid();
    expect(isValidPlacement(grid, 8, 0, 5, 'horizontal')).toBe(false);
  });

  it('rejects placement going off bottom edge', () => {
    const grid = createEmptyGrid();
    expect(isValidPlacement(grid, 0, 8, 5, 'vertical')).toBe(false);
  });

  it('rejects overlapping ships', () => {
    const grid = createEmptyGrid();
    grid[0][0].hasShip = true;
    expect(isValidPlacement(grid, 0, 0, 3, 'horizontal')).toBe(false);
  });

  it('accepts placement at bottom-right corner', () => {
    const grid = createEmptyGrid();
    expect(isValidPlacement(grid, 9, 9, 1, 'horizontal')).toBe(true);
  });

  it('rejects negative coordinates', () => {
    const grid = createEmptyGrid();
    expect(isValidPlacement(grid, -1, 0, 2, 'horizontal')).toBe(false);
  });
});

describe('placeShip', () => {
  it('places a horizontal ship correctly', () => {
    const board = createEmptyBoard();
    const placement: ShipPlacement = { name: 'carrier', x: 0, y: 0, orientation: 'horizontal', length: 5 };
    expect(placeShip(board, placement)).toBe(true);
    for (let i = 0; i < 5; i++) {
      expect(board.grid[0][i].hasShip).toBe(true);
      expect(board.grid[0][i].shipName).toBe('carrier');
    }
    expect(board.grid[0][5].hasShip).toBe(false);
    expect(board.ships).toHaveLength(1);
  });

  it('places a vertical ship correctly', () => {
    const board = createEmptyBoard();
    const placement: ShipPlacement = { name: 'destroyer', x: 3, y: 7, orientation: 'vertical', length: 2 };
    expect(placeShip(board, placement)).toBe(true);
    expect(board.grid[7][3].hasShip).toBe(true);
    expect(board.grid[8][3].hasShip).toBe(true);
    expect(board.grid[7][3].shipName).toBe('destroyer');
  });

  it('rejects invalid placement', () => {
    const board = createEmptyBoard();
    const placement: ShipPlacement = { name: 'carrier', x: 8, y: 0, orientation: 'horizontal', length: 5 };
    expect(placeShip(board, placement)).toBe(false);
    expect(board.ships).toHaveLength(0);
  });
});

describe('placeShipsRandomly', () => {
  it('places all 5 ships', () => {
    const board = createEmptyBoard();
    placeShipsRandomly(board);
    expect(board.ships).toHaveLength(SHIPS.length);
  });

  it('total ship cells equals 17 (5+4+3+3+2)', () => {
    const board = createEmptyBoard();
    placeShipsRandomly(board);
    let count = 0;
    for (const row of board.grid) {
      for (const cell of row) {
        if (cell.hasShip) count++;
      }
    }
    expect(count).toBe(17);
  });

  it('all placed ships are within bounds', () => {
    const board = createEmptyBoard();
    placeShipsRandomly(board);
    for (const ship of board.ships) {
      for (let i = 0; i < ship.length; i++) {
        const cx = ship.orientation === 'horizontal' ? ship.x + i : ship.x;
        const cy = ship.orientation === 'vertical' ? ship.y + i : ship.y;
        expect(cx).toBeGreaterThanOrEqual(0);
        expect(cx).toBeLessThan(BOARD_SIZE);
        expect(cy).toBeGreaterThanOrEqual(0);
        expect(cy).toBeLessThan(BOARD_SIZE);
      }
    }
  });

  it('no ships overlap', () => {
    const board = createEmptyBoard();
    placeShipsRandomly(board);
    const occupied = new Set<string>();
    for (const ship of board.ships) {
      for (let i = 0; i < ship.length; i++) {
        const cx = ship.orientation === 'horizontal' ? ship.x + i : ship.x;
        const cy = ship.orientation === 'vertical' ? ship.y + i : ship.y;
        const key = `${cx},${cy}`;
        expect(occupied.has(key)).toBe(false);
        occupied.add(key);
      }
    }
  });
});

describe('processShot', () => {
  it('returns miss for empty cell', () => {
    const board = createEmptyBoard();
    const result = processShot(board, 0, 0);
    expect(result.hit).toBe(false);
    expect(result.sunk).toBe(false);
    expect(result.shipName).toBeNull();
    expect(board.grid[0][0].isHit).toBe(true);
  });

  it('returns hit for ship cell', () => {
    const board = createEmptyBoard();
    placeShip(board, { name: 'destroyer', x: 0, y: 0, orientation: 'horizontal', length: 2 });
    const result = processShot(board, 0, 0);
    expect(result.hit).toBe(true);
    expect(result.sunk).toBe(false);
    expect(result.shipName).toBe('destroyer');
    expect(board.shipHealth.destroyer).toBe(1);
  });

  it('returns sunk when all cells of a ship are hit', () => {
    const board = createEmptyBoard();
    placeShip(board, { name: 'destroyer', x: 0, y: 0, orientation: 'horizontal', length: 2 });
    processShot(board, 0, 0);
    const result = processShot(board, 1, 0);
    expect(result.hit).toBe(true);
    expect(result.sunk).toBe(true);
    expect(result.shipName).toBe('destroyer');
    expect(board.shipHealth.destroyer).toBe(0);
  });

  it('returns allSunk when every ship is sunk', () => {
    const board = createEmptyBoard();
    placeShip(board, { name: 'destroyer', x: 0, y: 0, orientation: 'horizontal', length: 2 });
    board.shipHealth.carrier = 0;
    board.shipHealth.battleship = 0;
    board.shipHealth.cruiser = 0;
    board.shipHealth.submarine = 0;
    processShot(board, 0, 0);
    const result = processShot(board, 1, 0);
    expect(result.allSunk).toBe(true);
  });

  it('rejects duplicate shot on same cell', () => {
    const board = createEmptyBoard();
    processShot(board, 0, 0);
    const result = processShot(board, 0, 0);
    expect(result.hit).toBe(false);
  });

  it('rejects out-of-bounds coordinates', () => {
    const board = createEmptyBoard();
    expect(processShot(board, -1, 0).hit).toBe(false);
    expect(processShot(board, 0, -1).hit).toBe(false);
    expect(processShot(board, 10, 0).hit).toBe(false);
    expect(processShot(board, 0, 10).hit).toBe(false);
  });
});

describe('getVisibleBoard', () => {
  it('owner sees all ship positions', () => {
    const board = createEmptyBoard();
    placeShip(board, { name: 'destroyer', x: 0, y: 0, orientation: 'horizontal', length: 2 });
    const visible = getVisibleBoard(board, true);
    expect(visible[0][0].hasShip).toBe(true);
    expect(visible[0][0].shipName).toBe('destroyer');
  });

  it('opponent does not see unhit ships', () => {
    const board = createEmptyBoard();
    placeShip(board, { name: 'destroyer', x: 0, y: 0, orientation: 'horizontal', length: 2 });
    const visible = getVisibleBoard(board, false);
    expect(visible[0][0].hasShip).toBe(false);
    expect(visible[0][0].shipName).toBeNull();
  });

  it('opponent sees hit ships', () => {
    const board = createEmptyBoard();
    placeShip(board, { name: 'destroyer', x: 0, y: 0, orientation: 'horizontal', length: 2 });
    processShot(board, 0, 0);
    const visible = getVisibleBoard(board, false);
    expect(visible[0][0].hasShip).toBe(true);
    expect(visible[0][0].isHit).toBe(true);
  });

  it('opponent sees misses', () => {
    const board = createEmptyBoard();
    processShot(board, 5, 5);
    const visible = getVisibleBoard(board, false);
    expect(visible[5][5].isHit).toBe(true);
    expect(visible[5][5].hasShip).toBe(false);
  });
});
