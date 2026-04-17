import { v4 as uuidv4 } from 'uuid';
import { createEmptyBoard, getVisibleBoard, placeShip, placeShipsRandomly, processShot } from './Board.js';
import { createAIState, getAIShot, updateAIState } from './AIPlayer.js';
import { AIDifficulty, BOARD_SIZE, ClientGameState, GameMode, GameState, SHIPS, ShipPlacement, ShotResult } from './types.js';
import { prisma } from './prisma.js';

interface AIGameData {
  aiState: ReturnType<typeof createAIState>;
}

const GAME_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // every 10 min

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private aiData: Map<string, AIGameData> = new Map();
  private playerToGame: Map<string, string> = new Map();
  private gameTimestamps: Map<string, number> = new Map();

  constructor() {
    setInterval(() => this.cleanupStaleGames(), CLEANUP_INTERVAL_MS);
  }

  createGame(mode: GameMode, playerId: string, aiDifficulty?: AIDifficulty): GameState {
    const gameId = uuidv4().slice(0, 8);
    const state: GameState = {
      id: gameId,
      mode,
      phase: 'placement',
      currentTurn: playerId,
      players: {
        [playerId]: createEmptyBoard(),
      },
      playerIds: [playerId],
      winner: null,
      aiDifficulty,
    };

    if (mode === 'ai') {
      state.players['ai'] = createEmptyBoard();
      state.playerIds.push('ai');
      placeShipsRandomly(state.players['ai']);
    }

    this.games.set(gameId, state);
    this.playerToGame.set(playerId, gameId);
    this.gameTimestamps.set(gameId, Date.now());

    if (mode === 'ai') {
      this.aiData.set(gameId, { aiState: createAIState() });
    }

    this.persistGame(state);
    return state;
  }

  joinGame(gameId: string, playerId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || game.mode !== 'multiplayer') return null;
    if (game.playerIds.length >= 2) return null;
    if (game.playerIds.includes(playerId)) return null;

    game.players[playerId] = createEmptyBoard();
    game.playerIds.push(playerId);
    this.playerToGame.set(playerId, gameId);
    this.gameTimestamps.set(gameId, Date.now());

    this.persistGame(game);
    return game;
  }

  remapPlayer(gameId: string, oldPlayerId: string, newPlayerId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;

    const idx = game.playerIds.indexOf(oldPlayerId);
    if (idx === -1) return false;

    game.playerIds[idx] = newPlayerId;
    game.players[newPlayerId] = game.players[oldPlayerId];
    delete game.players[oldPlayerId];

    if (game.currentTurn === oldPlayerId) game.currentTurn = newPlayerId;
    if (game.winner === oldPlayerId) game.winner = newPlayerId;

    this.playerToGame.delete(oldPlayerId);
    this.playerToGame.set(newPlayerId, gameId);
    this.gameTimestamps.set(gameId, Date.now());

    this.persistGame(game);
    return true;
  }

  private isValidFleet(placements: ShipPlacement[]): boolean {
    if (!Array.isArray(placements) || placements.length !== SHIPS.length) return false;

    const required = new Map(SHIPS.map(s => [s.name, s.length]));
    const seen = new Set<string>();

    for (const p of placements) {
      if (!p || typeof p !== 'object') return false;
      if (!required.has(p.name)) return false;
      if (seen.has(p.name)) return false;
      if (p.length !== required.get(p.name)) return false;
      if (p.orientation !== 'horizontal' && p.orientation !== 'vertical') return false;
      if (!Number.isInteger(p.x) || !Number.isInteger(p.y)) return false;
      if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
      seen.add(p.name);
    }

    return seen.size === SHIPS.length;
  }

  placeShips(gameId: string, playerId: string, placements: ShipPlacement[]): boolean {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'placement') return false;
    if (!game.players[playerId]) return false;
    if (game.players[playerId].ships.length > 0) return false; // already placed

    if (!this.isValidFleet(placements)) return false;

    const board = createEmptyBoard();
    for (const placement of placements) {
      if (!placeShip(board, placement)) return false;
    }

    game.players[playerId] = board;

    if (this.allPlayersPlaced(game)) {
      game.phase = 'firing';
      game.currentTurn = game.playerIds[0];
    }

    this.gameTimestamps.set(gameId, Date.now());
    this.persistGame(game);
    return true;
  }

  private allPlayersPlaced(game: GameState): boolean {
    for (const pid of game.playerIds) {
      if (game.players[pid].ships.length !== SHIPS.length) return false;
    }
    return true;
  }

  fireShot(gameId: string, playerId: string, x: number, y: number): ShotResult | null {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'firing') return null;
    if (game.currentTurn !== playerId) return null;

    if (!Number.isInteger(x) || !Number.isInteger(y) ||
        x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return null;

    const opponentId = game.playerIds.find(id => id !== playerId);
    if (!opponentId || !game.players[opponentId]) return null;

    const opponentBoard = game.players[opponentId];
    if (opponentBoard.grid[y][x].isHit) return null;

    const result = processShot(opponentBoard, x, y);

    const shotResult: ShotResult = {
      x,
      y,
      hit: result.hit,
      sunk: result.sunk,
      shipName: result.shipName,
      gameOver: result.allSunk,
      winner: result.allSunk ? playerId : null,
    };

    if (result.allSunk) {
      game.phase = 'finished';
      game.winner = playerId;
    } else {
      game.currentTurn = opponentId;
    }

    this.gameTimestamps.set(gameId, Date.now());
    this.persistMove(game, playerId, shotResult);
    this.persistGame(game);
    return shotResult;
  }

  getAIResponse(gameId: string): ShotResult | null {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'firing' || game.mode !== 'ai') return null;
    if (game.currentTurn !== 'ai') return null;

    const aiGameData = this.aiData.get(gameId);
    if (!aiGameData) return null;

    const humanId = game.playerIds.find(id => id !== 'ai');
    if (!humanId || !game.players[humanId]) return null;

    const humanBoard = game.players[humanId];
    const difficulty = game.aiDifficulty || 'medium';

    const shot = getAIShot(aiGameData.aiState, humanBoard.grid, difficulty);
    if (!shot || typeof shot.x !== 'number' || typeof shot.y !== 'number') return null;

    const result = processShot(humanBoard, shot.x, shot.y);
    updateAIState(aiGameData.aiState, shot.x, shot.y, result.hit, result.sunk, result.shipName);

    const shotResult: ShotResult = {
      x: shot.x,
      y: shot.y,
      hit: result.hit,
      sunk: result.sunk,
      shipName: result.shipName,
      gameOver: result.allSunk,
      winner: result.allSunk ? 'ai' : null,
    };

    if (result.allSunk) {
      game.phase = 'finished';
      game.winner = 'ai';
    } else {
      game.currentTurn = humanId;
    }

    this.persistMove(game, 'ai', shotResult);
    this.persistGame(game);
    return shotResult;
  }

  getClientState(gameId: string, playerId: string): ClientGameState | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    const playerBoard = game.players[playerId];
    if (!playerBoard) return null;

    const opponentId = game.playerIds.find(id => id !== playerId);
    const opponentBoard = opponentId ? game.players[opponentId] : null;

    return {
      id: game.id,
      mode: game.mode,
      phase: game.phase,
      currentTurn: game.currentTurn,
      myBoard: getVisibleBoard(playerBoard, true),
      opponentBoard: opponentBoard ? getVisibleBoard(opponentBoard, false) : [],
      myShips: playerBoard.ships,
      myShipHealth: playerBoard.shipHealth,
      opponentShipsSunk: opponentBoard
        ? (Object.fromEntries(
            Object.entries(opponentBoard.shipHealth).map(([name, hp]) => [name, hp === 0])
          ) as Record<string, boolean>)
        : ({} as Record<string, boolean>),
      winner: game.winner,
      playerId,
      aiDifficulty: game.aiDifficulty,
    };
  }

  getGame(gameId: string): GameState | null {
    return this.games.get(gameId) || null;
  }

  getGameByPlayer(playerId: string): string | undefined {
    return this.playerToGame.get(playerId);
  }

  handleDisconnect(playerId: string): void {
    this.playerToGame.delete(playerId);
  }

  private async persistGame(game: GameState): Promise<void> {
    try {
      await prisma.game.upsert({
        where: { id: game.id },
        update: {
          status: game.phase,
          winner: game.winner,
          state: JSON.stringify(game),
        },
        create: {
          id: game.id,
          mode: game.mode,
          status: game.phase,
          winner: game.winner,
          state: JSON.stringify(game),
        },
      });
    } catch (err) {
      console.error('Failed to persist game:', game.id, err);
    }
  }

  private async persistMove(game: GameState, playerId: string, shot: ShotResult): Promise<void> {
    try {
      await prisma.move.create({
        data: {
          gameId: game.id,
          player: playerId,
          x: shot.x,
          y: shot.y,
          result: shot.hit ? (shot.sunk ? 'sunk' : 'hit') : 'miss',
          shipSunk: shot.sunk ? shot.shipName : null,
        },
      });
    } catch (err) {
      console.error('Failed to persist move:', game.id, err);
    }
  }

  async restoreGame(gameId: string): Promise<GameState | null> {
    try {
      const dbGame = await prisma.game.findUnique({ where: { id: gameId } });
      if (!dbGame) return null;

      const state = JSON.parse(dbGame.state) as GameState;

      if (!state.playerIds || !state.players || !state.id) return null;

      this.games.set(gameId, state);
      this.gameTimestamps.set(gameId, Date.now());
      for (const pid of state.playerIds) {
        if (pid !== 'ai') {
          this.playerToGame.set(pid, gameId);
        }
      }

      if (state.mode === 'ai' && !this.aiData.has(gameId)) {
        const aiState = createAIState();
        const humanId = state.playerIds.find(id => id !== 'ai');
        if (humanId && state.players[humanId]) {
          const humanBoard = state.players[humanId];
          for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
              if (humanBoard.grid[y]?.[x]?.isHit) {
                const cell = humanBoard.grid[y][x];
                const hit = cell.hasShip;
                const shipName = cell.shipName;
                const sunk = shipName ? humanBoard.shipHealth[shipName] === 0 : false;
                updateAIState(aiState, x, y, hit, sunk, shipName);
              }
            }
          }
        }
        this.aiData.set(gameId, { aiState });
      }

      return state;
    } catch (err) {
      console.error('Failed to restore game:', gameId, err);
      return null;
    }
  }

  private cleanupStaleGames(): void {
    const now = Date.now();
    for (const [gameId, timestamp] of this.gameTimestamps) {
      if (now - timestamp > GAME_TTL_MS) {
        const game = this.games.get(gameId);
        if (game) {
          for (const pid of game.playerIds) {
            if (pid !== 'ai') this.playerToGame.delete(pid);
          }
        }
        this.games.delete(gameId);
        this.aiData.delete(gameId);
        this.gameTimestamps.delete(gameId);
      }
    }
  }
}
