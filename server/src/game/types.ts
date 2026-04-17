export const BOARD_SIZE = 10;

export interface ShipDefinition {
  name: ShipName;
  length: number;
}

export type ShipName = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export const SHIPS: ShipDefinition[] = [
  { name: 'carrier', length: 5 },
  { name: 'battleship', length: 4 },
  { name: 'cruiser', length: 3 },
  { name: 'submarine', length: 3 },
  { name: 'destroyer', length: 2 },
];

export type Orientation = 'horizontal' | 'vertical';

export interface ShipPlacement {
  name: ShipName;
  x: number;
  y: number;
  orientation: Orientation;
  length: number;
}

export interface CellState {
  hasShip: boolean;
  shipName: ShipName | null;
  isHit: boolean;
}

export type BoardGrid = CellState[][];

export interface PlayerBoard {
  grid: BoardGrid;
  ships: ShipPlacement[];
  shipHealth: Record<ShipName, number>;
}

export interface ShotResult {
  x: number;
  y: number;
  hit: boolean;
  sunk: boolean;
  shipName: ShipName | null;
  gameOver: boolean;
  winner: string | null;
}

export type GamePhase = 'placement' | 'firing' | 'finished';
export type GameMode = 'ai' | 'multiplayer';
export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  id: string;
  mode: GameMode;
  phase: GamePhase;
  currentTurn: string;
  players: Record<string, PlayerBoard>;
  playerIds: string[];
  winner: string | null;
  aiDifficulty?: AIDifficulty;
}

export interface ClientGameState {
  id: string;
  mode: GameMode;
  phase: GamePhase;
  currentTurn: string;
  myBoard: BoardGrid;
  opponentBoard: BoardGrid;
  myShips: ShipPlacement[];
  myShipHealth: Record<ShipName, number>;
  opponentShipsSunk: Record<ShipName, boolean>;
  winner: string | null;
  playerId: string;
  aiDifficulty?: AIDifficulty;
}
