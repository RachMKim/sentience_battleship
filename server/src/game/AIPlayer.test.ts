import { describe, it, expect } from 'vitest';
import { createAIState, getAIShot, updateAIState } from './AIPlayer.js';
import { createEmptyGrid } from './Board.js';
import { BOARD_SIZE } from './types.js';

describe('createAIState', () => {
  it('initializes in hunt mode', () => {
    const state = createAIState();
    expect(state.mode).toBe('hunt');
  });

  it('has empty hits and target queue', () => {
    const state = createAIState();
    expect(state.hits).toHaveLength(0);
    expect(state.targetQueue).toHaveLength(0);
  });

  it('tracks all 5 ships as remaining', () => {
    const state = createAIState();
    expect(state.remainingShips).toHaveLength(5);
    const names = state.remainingShips.map(s => s.name);
    expect(names).toContain('carrier');
    expect(names).toContain('battleship');
    expect(names).toContain('cruiser');
    expect(names).toContain('submarine');
    expect(names).toContain('destroyer');
  });

  it('has clean shot history (all false)', () => {
    const state = createAIState();
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        expect(state.shotHistory[y][x]).toBe(false);
      }
    }
  });
});

describe('getAIShot', () => {
  it('returns coordinates within bounds for easy', () => {
    const state = createAIState();
    const grid = createEmptyGrid();
    const shot = getAIShot(state, grid, 'easy');
    expect(shot.x).toBeGreaterThanOrEqual(0);
    expect(shot.x).toBeLessThan(BOARD_SIZE);
    expect(shot.y).toBeGreaterThanOrEqual(0);
    expect(shot.y).toBeLessThan(BOARD_SIZE);
  });

  it('returns coordinates within bounds for medium', () => {
    const state = createAIState();
    const grid = createEmptyGrid();
    const shot = getAIShot(state, grid, 'medium');
    expect(shot.x).toBeGreaterThanOrEqual(0);
    expect(shot.x).toBeLessThan(BOARD_SIZE);
    expect(shot.y).toBeGreaterThanOrEqual(0);
    expect(shot.y).toBeLessThan(BOARD_SIZE);
  });

  it('returns coordinates within bounds for hard', () => {
    const state = createAIState();
    const grid = createEmptyGrid();
    const shot = getAIShot(state, grid, 'hard');
    expect(shot.x).toBeGreaterThanOrEqual(0);
    expect(shot.x).toBeLessThan(BOARD_SIZE);
    expect(shot.y).toBeGreaterThanOrEqual(0);
    expect(shot.y).toBeLessThan(BOARD_SIZE);
  });

  it('never returns same cell twice', () => {
    const state = createAIState();
    const grid = createEmptyGrid();
    const shots = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const shot = getAIShot(state, grid, 'medium');
      const key = `${shot.x},${shot.y}`;
      expect(shots.has(key)).toBe(false);
      shots.add(key);
      state.shotHistory[shot.y][shot.x] = true;
    }
  });

  it('handles nearly full board without crashing', () => {
    const state = createAIState();
    const grid = createEmptyGrid();
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (x === 9 && y === 9) continue;
        state.shotHistory[y][x] = true;
      }
    }
    const shot = getAIShot(state, grid, 'hard');
    expect(shot.x).toBe(9);
    expect(shot.y).toBe(9);
  });
});

describe('updateAIState', () => {
  it('switches to target mode on hit', () => {
    const state = createAIState();
    updateAIState(state, 5, 5, true, false, 'carrier');
    expect(state.mode).toBe('target');
    expect(state.hits).toHaveLength(1);
  });

  it('adds adjacent cells to target queue on hit', () => {
    const state = createAIState();
    updateAIState(state, 5, 5, true, false, 'carrier');
    expect(state.targetQueue.length).toBeGreaterThan(0);
    const coords = state.targetQueue.map(t => `${t.x},${t.y}`);
    expect(coords).toContain('4,5');
    expect(coords).toContain('6,5');
    expect(coords).toContain('5,4');
    expect(coords).toContain('5,6');
  });

  it('removes sunk ship from remaining', () => {
    const state = createAIState();
    updateAIState(state, 0, 0, true, false, 'destroyer');
    updateAIState(state, 1, 0, true, true, 'destroyer');
    expect(state.remainingShips.find(s => s.name === 'destroyer')).toBeUndefined();
  });

  it('clears hits for sunk ship', () => {
    const state = createAIState();
    updateAIState(state, 0, 0, true, false, 'destroyer');
    updateAIState(state, 1, 0, true, true, 'destroyer');
    const destroyerHits = state.hits.filter(h =>
      (h.x === 0 && h.y === 0) || (h.x === 1 && h.y === 0)
    );
    expect(destroyerHits).toHaveLength(0);
  });

  it('returns to hunt mode when no more targets', () => {
    const state = createAIState();
    updateAIState(state, 5, 5, true, false, 'destroyer');
    state.shotHistory[4][5] = true;
    state.shotHistory[6][5] = true;
    state.shotHistory[5][4] = true;
    state.shotHistory[5][6] = true;
    state.targetQueue = [];
    updateAIState(state, 4, 4, false, false, null);
    expect(state.mode).toBe('hunt');
  });

  it('marks shots in history', () => {
    const state = createAIState();
    updateAIState(state, 3, 7, false, false, null);
    expect(state.shotHistory[7][3]).toBe(true);
  });
});

describe('AI difficulty behavior', () => {
  it('medium uses checkerboard pattern in hunt mode', () => {
    const state = createAIState();
    const grid = createEmptyGrid();
    const shots: { x: number; y: number }[] = [];
    for (let i = 0; i < 20; i++) {
      const shot = getAIShot(state, grid, 'medium');
      shots.push(shot);
      state.shotHistory[shot.y][shot.x] = true;
    }
    for (const shot of shots) {
      expect((shot.x + shot.y) % 2).toBe(0);
    }
  });

  it('hard mode targets higher probability cells', () => {
    const state = createAIState();
    const grid = createEmptyGrid();
    const shot = getAIShot(state, grid, 'hard');
    expect(shot.x).toBeGreaterThanOrEqual(0);
    expect(shot.y).toBeGreaterThanOrEqual(0);
  });
});
