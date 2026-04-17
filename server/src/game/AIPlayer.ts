import { AIDifficulty, BOARD_SIZE, BoardGrid, ShipName, SHIPS } from './types.js';

interface AIState {
  mode: 'hunt' | 'target';
  hits: { x: number; y: number }[];
  targetQueue: { x: number; y: number }[];
  shotHistory: boolean[][];
  remainingShips: { name: ShipName; length: number }[];
}

export function createAIState(): AIState {
  return {
    mode: 'hunt',
    hits: [],
    targetQueue: [],
    shotHistory: Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => false)
    ),
    remainingShips: SHIPS.map(s => ({ ...s })),
  };
}

export function getAIShot(
  aiState: AIState,
  opponentGrid: BoardGrid,
  difficulty: AIDifficulty
): { x: number; y: number } {
  switch (difficulty) {
    case 'easy':
      return getRandomShot(aiState);
    case 'medium':
      return getHuntTargetShot(aiState);
    case 'hard':
      return getProbabilityShot(aiState);
  }
}

export function updateAIState(
  aiState: AIState,
  x: number,
  y: number,
  hit: boolean,
  sunk: boolean,
  shipName: ShipName | null
): void {
  aiState.shotHistory[y][x] = true;

  if (hit) {
    aiState.hits.push({ x, y });
    aiState.mode = 'target';

    const adjacent = getAdjacentCells(x, y);
    for (const adj of adjacent) {
      if (!aiState.shotHistory[adj.y][adj.x] &&
          !aiState.targetQueue.some(t => t.x === adj.x && t.y === adj.y)) {
        aiState.targetQueue.push(adj);
      }
    }

    if (sunk && shipName) {
      aiState.remainingShips = aiState.remainingShips.filter(s => s.name !== shipName);
      const sunkShipHits = aiState.hits.filter(h => {
        return true;
      });
      aiState.targetQueue = aiState.targetQueue.filter(t =>
        !aiState.shotHistory[t.y][t.x]
      );
      if (aiState.targetQueue.length === 0) {
        aiState.mode = 'hunt';
        aiState.hits = [];
      }
    }
  } else {
    aiState.targetQueue = aiState.targetQueue.filter(
      t => !(t.x === x && t.y === y)
    );
    if (aiState.targetQueue.length === 0 && aiState.mode === 'target') {
      aiState.mode = 'hunt';
      aiState.hits = [];
    }
  }
}

function getRandomShot(aiState: AIState): { x: number; y: number } {
  const available: { x: number; y: number }[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!aiState.shotHistory[y][x]) {
        available.push({ x, y });
      }
    }
  }
  return available[Math.floor(Math.random() * available.length)];
}

function getHuntTargetShot(aiState: AIState): { x: number; y: number } {
  if (aiState.mode === 'target' && aiState.targetQueue.length > 0) {
    while (aiState.targetQueue.length > 0) {
      const target = aiState.targetQueue.shift()!;
      if (!aiState.shotHistory[target.y][target.x]) {
        return target;
      }
    }
    aiState.mode = 'hunt';
  }

  // Hunt mode: use checkerboard pattern for efficiency
  const available: { x: number; y: number }[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!aiState.shotHistory[y][x] && (x + y) % 2 === 0) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) {
    return getRandomShot(aiState);
  }

  return available[Math.floor(Math.random() * available.length)];
}

function getProbabilityShot(aiState: AIState): { x: number; y: number } {
  if (aiState.mode === 'target' && aiState.targetQueue.length > 0) {
    return getBestTargetShot(aiState);
  }

  const density: number[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 0)
  );

  for (const ship of aiState.remainingShips) {
    // Try every possible placement of this ship
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        for (const orientation of ['horizontal', 'vertical'] as const) {
          if (canShipFit(aiState, x, y, ship.length, orientation)) {
            for (let i = 0; i < ship.length; i++) {
              const cx = orientation === 'horizontal' ? x + i : x;
              const cy = orientation === 'vertical' ? y + i : y;
              density[cy][cx]++;
            }
          }
        }
      }
    }
  }

  // Zero out already-shot cells
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (aiState.shotHistory[y][x]) {
        density[y][x] = 0;
      }
    }
  }

  let bestScore = 0;
  let bestCells: { x: number; y: number }[] = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (density[y][x] > bestScore) {
        bestScore = density[y][x];
        bestCells = [{ x, y }];
      } else if (density[y][x] === bestScore && bestScore > 0) {
        bestCells.push({ x, y });
      }
    }
  }

  if (bestCells.length === 0) {
    return getRandomShot(aiState);
  }

  return bestCells[Math.floor(Math.random() * bestCells.length)];
}

function getBestTargetShot(aiState: AIState): { x: number; y: number } {
  // Among target queue cells, pick the one with highest probability
  const density: number[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 0)
  );

  for (const ship of aiState.remainingShips) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        for (const orientation of ['horizontal', 'vertical'] as const) {
          if (canShipFitWithHits(aiState, x, y, ship.length, orientation)) {
            for (let i = 0; i < ship.length; i++) {
              const cx = orientation === 'horizontal' ? x + i : x;
              const cy = orientation === 'vertical' ? y + i : y;
              if (!aiState.shotHistory[cy][cx]) {
                density[cy][cx]++;
              }
            }
          }
        }
      }
    }
  }

  let bestScore = 0;
  let bestTarget: { x: number; y: number } | null = null;

  for (const target of aiState.targetQueue) {
    if (!aiState.shotHistory[target.y][target.x] && density[target.y][target.x] > bestScore) {
      bestScore = density[target.y][target.x];
      bestTarget = target;
    }
  }

  if (bestTarget) {
    aiState.targetQueue = aiState.targetQueue.filter(
      t => !(t.x === bestTarget!.x && t.y === bestTarget!.y)
    );
    return bestTarget;
  }

  aiState.mode = 'hunt';
  return getProbabilityShot(aiState);
}

function canShipFit(
  aiState: AIState,
  x: number,
  y: number,
  length: number,
  orientation: 'horizontal' | 'vertical'
): boolean {
  for (let i = 0; i < length; i++) {
    const cx = orientation === 'horizontal' ? x + i : x;
    const cy = orientation === 'vertical' ? y + i : y;

    if (cx >= BOARD_SIZE || cy >= BOARD_SIZE) return false;

    // Can't place through a known miss
    if (aiState.shotHistory[cy][cx]) return false;
  }
  return true;
}

function canShipFitWithHits(
  aiState: AIState,
  x: number,
  y: number,
  length: number,
  orientation: 'horizontal' | 'vertical'
): boolean {
  let hitsOverlap = false;
  for (let i = 0; i < length; i++) {
    const cx = orientation === 'horizontal' ? x + i : x;
    const cy = orientation === 'vertical' ? y + i : y;

    if (cx >= BOARD_SIZE || cy >= BOARD_SIZE) return false;

    const isShot = aiState.shotHistory[cy][cx];
    const isHit = aiState.hits.some(h => h.x === cx && h.y === cy);

    if (isShot && !isHit) return false;
    if (isHit) hitsOverlap = true;
  }
  return hitsOverlap;
}

function getAdjacentCells(x: number, y: number): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  if (x > 0) cells.push({ x: x - 1, y });
  if (x < BOARD_SIZE - 1) cells.push({ x: x + 1, y });
  if (y > 0) cells.push({ x, y: y - 1 });
  if (y < BOARD_SIZE - 1) cells.push({ x, y: y + 1 });
  return cells;
}
