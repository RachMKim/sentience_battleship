import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./prisma.js', () => ({
  prisma: {
    game: {
      upsert: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    move: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { GameManager } from './GameManager.js';
import { SHIPS, BOARD_SIZE } from './types.js';
import type { ShipPlacement } from './types.js';

function makeValidPlacements(): ShipPlacement[] {
  return [
    { name: 'carrier', x: 0, y: 0, orientation: 'horizontal', length: 5 },
    { name: 'battleship', x: 0, y: 1, orientation: 'horizontal', length: 4 },
    { name: 'cruiser', x: 0, y: 2, orientation: 'horizontal', length: 3 },
    { name: 'submarine', x: 0, y: 3, orientation: 'horizontal', length: 3 },
    { name: 'destroyer', x: 0, y: 4, orientation: 'horizontal', length: 2 },
  ];
}

describe('GameManager', () => {
  let gm: GameManager;

  beforeEach(() => {
    gm = new GameManager();
  });

  describe('createGame', () => {
    it('creates an AI game', () => {
      const game = gm.createGame('ai', 'player1', 'medium');
      expect(game.mode).toBe('ai');
      expect(game.phase).toBe('placement');
      expect(game.playerIds).toContain('player1');
      expect(game.playerIds).toContain('ai');
      expect(game.aiDifficulty).toBe('medium');
    });

    it('AI has ships already placed', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      expect(game.players['ai'].ships).toHaveLength(SHIPS.length);
    });

    it('creates a multiplayer game', () => {
      const game = gm.createGame('multiplayer', 'player1');
      expect(game.mode).toBe('multiplayer');
      expect(game.playerIds).toHaveLength(1);
      expect(game.playerIds).toContain('player1');
    });

    it('assigns game to player lookup', () => {
      const game = gm.createGame('ai', 'player1');
      expect(gm.getGameByPlayer('player1')).toBe(game.id);
    });
  });

  describe('joinGame', () => {
    it('lets second player join multiplayer game', () => {
      const game = gm.createGame('multiplayer', 'player1');
      const result = gm.joinGame(game.id, 'player2');
      expect(result).not.toBeNull();
      expect(result!.playerIds).toContain('player2');
    });

    it('rejects joining AI game', () => {
      const game = gm.createGame('ai', 'player1');
      expect(gm.joinGame(game.id, 'player2')).toBeNull();
    });

    it('rejects third player', () => {
      const game = gm.createGame('multiplayer', 'player1');
      gm.joinGame(game.id, 'player2');
      expect(gm.joinGame(game.id, 'player3')).toBeNull();
    });

    it('rejects joining non-existent game', () => {
      expect(gm.joinGame('fake-id', 'player2')).toBeNull();
    });

    it('rejects same player joining twice', () => {
      const game = gm.createGame('multiplayer', 'player1');
      expect(gm.joinGame(game.id, 'player1')).toBeNull();
    });
  });

  describe('placeShips', () => {
    it('places valid fleet', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      const result = gm.placeShips(game.id, 'player1', makeValidPlacements());
      expect(result).toBe(true);
    });

    it('transitions to firing phase after all ships placed in AI game', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      gm.placeShips(game.id, 'player1', makeValidPlacements());
      const state = gm.getGame(game.id);
      expect(state!.phase).toBe('firing');
    });

    it('rejects incomplete fleet', () => {
      const game = gm.createGame('ai', 'player1');
      const partial = makeValidPlacements().slice(0, 3);
      expect(gm.placeShips(game.id, 'player1', partial)).toBe(false);
    });

    it('rejects duplicate ship names', () => {
      const game = gm.createGame('ai', 'player1');
      const placements = makeValidPlacements();
      placements[4] = { ...placements[0], y: 5 };
      expect(gm.placeShips(game.id, 'player1', placements)).toBe(false);
    });

    it('rejects wrong ship length', () => {
      const game = gm.createGame('ai', 'player1');
      const placements = makeValidPlacements();
      placements[0] = { ...placements[0], length: 3 };
      expect(gm.placeShips(game.id, 'player1', placements)).toBe(false);
    });

    it('rejects out-of-bounds placement', () => {
      const game = gm.createGame('ai', 'player1');
      const placements = makeValidPlacements();
      placements[0] = { ...placements[0], x: 8 };
      expect(gm.placeShips(game.id, 'player1', placements)).toBe(false);
    });

    it('rejects placing twice', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      gm.placeShips(game.id, 'player1', makeValidPlacements());
      expect(gm.placeShips(game.id, 'player1', makeValidPlacements())).toBe(false);
    });

    it('rejects invalid orientation', () => {
      const game = gm.createGame('ai', 'player1');
      const placements = makeValidPlacements();
      (placements[0] as any).orientation = 'diagonal';
      expect(gm.placeShips(game.id, 'player1', placements)).toBe(false);
    });

    it('rejects non-integer coordinates', () => {
      const game = gm.createGame('ai', 'player1');
      const placements = makeValidPlacements();
      (placements[0] as any).x = 1.5;
      expect(gm.placeShips(game.id, 'player1', placements)).toBe(false);
    });
  });

  describe('fireShot', () => {
    function setupFiringGame() {
      const game = gm.createGame('ai', 'player1', 'easy');
      gm.placeShips(game.id, 'player1', makeValidPlacements());
      return game;
    }

    it('returns result on valid shot', () => {
      const game = setupFiringGame();
      const result = gm.fireShot(game.id, 'player1', 5, 5);
      expect(result).not.toBeNull();
      expect(typeof result!.hit).toBe('boolean');
    });

    it('rejects shot when not your turn', () => {
      const game = setupFiringGame();
      gm.fireShot(game.id, 'player1', 0, 0);
      const result = gm.fireShot(game.id, 'player1', 1, 0);
      expect(result).toBeNull();
    });

    it('rejects out of bounds shot', () => {
      const game = setupFiringGame();
      expect(gm.fireShot(game.id, 'player1', -1, 0)).toBeNull();
      expect(gm.fireShot(game.id, 'player1', 10, 0)).toBeNull();
      expect(gm.fireShot(game.id, 'player1', 0, -1)).toBeNull();
      expect(gm.fireShot(game.id, 'player1', 0, 10)).toBeNull();
    });

    it('rejects non-integer coordinates', () => {
      const game = setupFiringGame();
      expect(gm.fireShot(game.id, 'player1', 1.5, 0)).toBeNull();
    });

    it('rejects shot on already-hit cell', () => {
      const game = setupFiringGame();
      gm.fireShot(game.id, 'player1', 5, 5);
      const aiResp = gm.getAIResponse(game.id);
      expect(gm.fireShot(game.id, 'player1', 5, 5)).toBeNull();
    });

    it('switches turn after shot', () => {
      const game = setupFiringGame();
      gm.fireShot(game.id, 'player1', 5, 5);
      const state = gm.getGame(game.id);
      expect(state!.currentTurn).toBe('ai');
    });

    it('rejects shot against non-existent game', () => {
      expect(gm.fireShot('fake', 'player1', 0, 0)).toBeNull();
    });
  });

  describe('getAIResponse', () => {
    it('returns shot when it is AI turn', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      gm.placeShips(game.id, 'player1', makeValidPlacements());
      gm.fireShot(game.id, 'player1', 9, 9);
      const result = gm.getAIResponse(game.id);
      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThanOrEqual(0);
      expect(result!.y).toBeGreaterThanOrEqual(0);
    });

    it('returns null when not AI turn', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      gm.placeShips(game.id, 'player1', makeValidPlacements());
      expect(gm.getAIResponse(game.id)).toBeNull();
    });

    it('switches turn back to player after AI shot', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      gm.placeShips(game.id, 'player1', makeValidPlacements());
      gm.fireShot(game.id, 'player1', 9, 9);
      gm.getAIResponse(game.id);
      const state = gm.getGame(game.id);
      expect(state!.currentTurn).toBe('player1');
    });
  });

  describe('getClientState', () => {
    it('hides opponent ship positions', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      gm.placeShips(game.id, 'player1', makeValidPlacements());
      const clientState = gm.getClientState(game.id, 'player1');
      expect(clientState).not.toBeNull();
      for (const row of clientState!.opponentBoard) {
        for (const cell of row) {
          if (!cell.isHit) {
            expect(cell.hasShip).toBe(false);
          }
        }
      }
    });

    it('shows own ships', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      gm.placeShips(game.id, 'player1', makeValidPlacements());
      const clientState = gm.getClientState(game.id, 'player1');
      expect(clientState!.myShips).toHaveLength(SHIPS.length);
      expect(clientState!.myBoard[0][0].hasShip).toBe(true);
    });

    it('provides opponentShipsSunk instead of health', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      gm.placeShips(game.id, 'player1', makeValidPlacements());
      const clientState = gm.getClientState(game.id, 'player1');
      expect(clientState!.opponentShipsSunk).toBeDefined();
      for (const [, sunk] of Object.entries(clientState!.opponentShipsSunk)) {
        expect(typeof sunk).toBe('boolean');
      }
    });

    it('returns null for unknown game', () => {
      expect(gm.getClientState('fake', 'player1')).toBeNull();
    });
  });

  describe('handleDisconnect', () => {
    it('removes player from lookup', () => {
      const game = gm.createGame('ai', 'player1');
      gm.handleDisconnect('player1');
      expect(gm.getGameByPlayer('player1')).toBeUndefined();
    });
  });

  describe('full game simulation', () => {
    it('can play a complete AI game to victory', () => {
      const game = gm.createGame('ai', 'player1', 'easy');
      gm.placeShips(game.id, 'player1', makeValidPlacements());

      const aiBoard = game.players['ai'];
      let gameOver = false;

      for (let y = 0; y < BOARD_SIZE && !gameOver; y++) {
        for (let x = 0; x < BOARD_SIZE && !gameOver; x++) {
          const state = gm.getGame(game.id);
          if (state!.phase === 'finished') { gameOver = true; break; }

          if (state!.currentTurn === 'player1') {
            const result = gm.fireShot(game.id, 'player1', x, y);
            if (result && result.gameOver) { gameOver = true; break; }
          }

          const state2 = gm.getGame(game.id);
          if (state2!.currentTurn === 'ai' && state2!.phase === 'firing') {
            const aiResult = gm.getAIResponse(game.id);
            if (aiResult && aiResult.gameOver) { gameOver = true; break; }
          }
        }
      }

      const final = gm.getGame(game.id);
      expect(final!.phase).toBe('finished');
      expect(final!.winner).not.toBeNull();
    });
  });
});
