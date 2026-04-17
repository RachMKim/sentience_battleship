import { v4 as uuidv4 } from 'uuid';
import { createEmptyBoard, getVisibleBoard, placeShip, placeShipsRandomly, processShot } from './Board.js';
import { createAIState, getAIShot, updateAIState } from './AIPlayer.js';
import { AIDifficulty, ClientGameState, GameMode, GameState, ShipPlacement, ShotResult } from './types.js';
import { PrismaClient } from '@prisma/client';

interface AIGameData {
  aiState: ReturnType<typeof createAIState>;
}

const prisma = new PrismaClient();

export class GameManager {
  private games: Map<string, GameState> = new Map();
  private aiData: Map<string, AIGameData> = new Map();
  private playerToGame: Map<string, string> = new Map();

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
      const aiId = 'ai';
      state.players[aiId] = createEmptyBoard();
      state.playerIds.push(aiId);
      placeShipsRandomly(state.players[aiId]);
    }

    this.games.set(gameId, state);
    this.playerToGame.set(playerId, gameId);

    if (mode === 'ai') {
      this.aiData.set(gameId, {
        aiState: createAIState(),
      });
    }

    this.persistGame(state);

    return state;
  }

  joinGame(gameId: string, playerId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || game.mode !== 'multiplayer') return null;
    if (game.playerIds.length >= 2) return null;

    game.players[playerId] = createEmptyBoard();
    game.playerIds.push(playerId);
    this.playerToGame.set(playerId, gameId);

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

    if (game.currentTurn === oldPlayerId) {
      game.currentTurn = newPlayerId;
    }
    if (game.winner === oldPlayerId) {
      game.winner = newPlayerId;
    }

    this.playerToGame.delete(oldPlayerId);
    this.playerToGame.set(newPlayerId, gameId);

    this.persistGame(game);
    return true;
  }

  placeShips(gameId: string, playerId: string, placements: ShipPlacement[]): boolean {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'placement') return false;
    if (!game.players[playerId]) return false;

    const board = createEmptyBoard();

    for (const placement of placements) {
      if (!placeShip(board, placement)) {
        return false;
      }
    }

    game.players[playerId] = board;

    const allPlaced = this.allPlayersPlaced(game);
    if (allPlaced) {
      game.phase = 'firing';
      game.currentTurn = game.playerIds[0];
    }

    this.persistGame(game);

    return true;
  }

  private allPlayersPlaced(game: GameState): boolean {
    for (const pid of game.playerIds) {
      if (game.players[pid].ships.length === 0) return false;
    }
    return true;
  }

  fireShot(gameId: string, playerId: string, x: number, y: number): ShotResult | null {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'firing') return null;
    if (game.currentTurn !== playerId) return null;

    const opponentId = game.playerIds.find(id => id !== playerId)!;
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

    this.persistMove(game, playerId, shotResult);
    this.persistGame(game);

    return shotResult;
  }

  getAIResponse(gameId: string): ShotResult | null {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'firing' || game.mode !== 'ai') return null;

    const aiGameData = this.aiData.get(gameId);
    if (!aiGameData) return null;

    const humanId = game.playerIds.find(id => id !== 'ai')!;
    const humanBoard = game.players[humanId];
    const difficulty = game.aiDifficulty || 'medium';

    const { x, y } = getAIShot(aiGameData.aiState, humanBoard.grid, difficulty);
    const result = processShot(humanBoard, x, y);

    updateAIState(aiGameData.aiState, x, y, result.hit, result.sunk, result.shipName);

    const shotResult: ShotResult = {
      x,
      y,
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

    return {
      id: game.id,
      mode: game.mode,
      phase: game.phase,
      currentTurn: game.currentTurn,
      myBoard: getVisibleBoard(playerBoard, true),
      opponentBoard: opponentId && game.players[opponentId]
        ? getVisibleBoard(game.players[opponentId], false)
        : [],
      myShips: playerBoard.ships,
      myShipHealth: playerBoard.shipHealth,
      opponentShipHealth: opponentId && game.players[opponentId]
        ? game.players[opponentId].shipHealth
        : {} as any,
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

  removePlayer(playerId: string): void {
    const gameId = this.playerToGame.get(playerId);
    if (gameId) {
      this.playerToGame.delete(playerId);
    }
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
    } catch {
      // Non-critical
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
    } catch {
      // Non-critical
    }
  }

  async restoreGame(gameId: string): Promise<GameState | null> {
    try {
      const dbGame = await prisma.game.findUnique({ where: { id: gameId } });
      if (!dbGame) return null;

      const state = JSON.parse(dbGame.state) as GameState;
      this.games.set(gameId, state);
      for (const pid of state.playerIds) {
        if (pid !== 'ai') {
          this.playerToGame.set(pid, gameId);
        }
      }
      return state;
    } catch {
      return null;
    }
  }

  getFirstNonAIPlayer(gameId: string): string | null {
    const game = this.games.get(gameId);
    if (!game) return null;
    return game.playerIds.find(id => id !== 'ai') || null;
  }
}
