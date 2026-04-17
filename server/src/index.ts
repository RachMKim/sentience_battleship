import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { GameManager } from './game/GameManager.js';
import type { AIDifficulty, ShipPlacement } from './game/types.js';
import historyRoutes from './routes/history.js';

const VALID_MODES = ['ai', 'multiplayer'] as const;
const VALID_DIFFICULTIES: AIDifficulty[] = ['easy', 'medium', 'hard'];

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;
const gameManager = new GameManager();

app.use(cors());
app.use(express.json());
app.use(historyRoutes);

const clientDist = path.join(process.cwd(), '../client/dist');
app.use(express.static(clientDist));

io.on('connection', (socket) => {
  const playerId = socket.id;
  console.log(`Player connected: ${playerId}`);

  socket.on('create-game', (data, callback) => {
    try {
      if (typeof callback !== 'function') return;
      if (!data || typeof data !== 'object') { callback({ error: 'Invalid request' }); return; }

      const mode = data.mode;
      if (!VALID_MODES.includes(mode)) { callback({ error: 'Invalid game mode' }); return; }

      const difficulty: AIDifficulty | undefined = mode === 'ai'
        ? (VALID_DIFFICULTIES.includes(data.difficulty) ? data.difficulty : 'medium')
        : undefined;

      const game = gameManager.createGame(mode, playerId, difficulty);
      socket.join(game.id);
      const clientState = gameManager.getClientState(game.id, playerId);
      callback({ gameId: game.id, state: clientState });
    } catch (err) {
      console.error('create-game error:', err);
      if (typeof callback === 'function') callback({ error: 'Server error' });
    }
  });

  socket.on('join-game', (data, callback) => {
    try {
      if (typeof callback !== 'function') return;
      if (!data || typeof data.gameId !== 'string' || !data.gameId.trim()) {
        callback({ error: 'Invalid game code' }); return;
      }

      const game = gameManager.joinGame(data.gameId.trim(), playerId);
      if (!game) { callback({ error: 'Game not found or full' }); return; }

      socket.join(game.id);

      for (const pid of game.playerIds) {
        const clientState = gameManager.getClientState(game.id, pid);
        io.to(pid).emit('game-update', clientState);
      }

      callback({ gameId: game.id, state: gameManager.getClientState(game.id, playerId) });
    } catch (err) {
      console.error('join-game error:', err);
      if (typeof callback === 'function') callback({ error: 'Server error' });
    }
  });

  socket.on('place-ships', (data, callback) => {
    try {
      if (typeof callback !== 'function') return;
      if (!data || typeof data.gameId !== 'string' || !Array.isArray(data.placements)) {
        callback({ error: 'Invalid request' }); return;
      }

      const success = gameManager.placeShips(data.gameId, playerId, data.placements as ShipPlacement[]);
      if (!success) { callback({ error: 'Invalid ship placement' }); return; }

      const game = gameManager.getGame(data.gameId);
      if (!game) { callback({ error: 'Game not found' }); return; }

      for (const pid of game.playerIds) {
        if (pid !== 'ai') {
          const clientState = gameManager.getClientState(data.gameId, pid);
          io.to(pid).emit('game-update', clientState);
        }
      }

      callback({ success: true });
    } catch (err) {
      console.error('place-ships error:', err);
      if (typeof callback === 'function') callback({ error: 'Server error' });
    }
  });

  socket.on('fire', async (data, callback) => {
    try {
      if (typeof callback !== 'function') return;
      if (!data || typeof data.gameId !== 'string' ||
          typeof data.x !== 'number' || typeof data.y !== 'number') {
        callback({ error: 'Invalid request' }); return;
      }

      const result = gameManager.fireShot(data.gameId, playerId, data.x, data.y);
      if (!result) { callback({ error: 'Invalid shot' }); return; }

      const game = gameManager.getGame(data.gameId);
      if (!game) { callback({ error: 'Game not found' }); return; }

      for (const pid of game.playerIds) {
        if (pid !== 'ai') {
          const clientState = gameManager.getClientState(data.gameId, pid);
          io.to(pid).emit('game-update', clientState);
        }
      }

      callback({ result });

      if (game.mode === 'ai' && !result.gameOver && game.currentTurn === 'ai') {
        await new Promise(resolve => setTimeout(resolve, 800));

        const currentGame = gameManager.getGame(data.gameId);
        if (!currentGame || currentGame.phase !== 'firing' || currentGame.currentTurn !== 'ai') return;

        const aiResult = gameManager.getAIResponse(data.gameId);
        if (aiResult) {
          for (const pid of currentGame.playerIds) {
            if (pid !== 'ai') {
              const clientState = gameManager.getClientState(data.gameId, pid);
              io.to(pid).emit('game-update', clientState);
              io.to(pid).emit('ai-shot', aiResult);
            }
          }
        }
      }
    } catch (err) {
      console.error('fire error:', err);
      if (typeof callback === 'function') callback({ error: 'Server error' });
    }
  });

  socket.on('rejoin-game', async (data, callback) => {
    try {
      if (typeof callback !== 'function') return;
      if (!data || typeof data.gameId !== 'string') {
        callback({ error: 'Invalid request' }); return;
      }

      let game = gameManager.getGame(data.gameId);
      if (!game) {
        game = await gameManager.restoreGame(data.gameId);
      }
      if (!game) { callback({ error: 'Game not found' }); return; }

      if (data.oldPlayerId && typeof data.oldPlayerId === 'string' &&
          data.oldPlayerId !== playerId && game.playerIds.includes(data.oldPlayerId)) {
        gameManager.remapPlayer(data.gameId, data.oldPlayerId, playerId);
      }

      socket.join(data.gameId);
      const clientState = gameManager.getClientState(data.gameId, playerId);
      if (!clientState) { callback({ error: 'Player not in this game' }); return; }
      callback({ state: clientState, gameId: data.gameId });
    } catch (err) {
      console.error('rejoin-game error:', err);
      if (typeof callback === 'function') callback({ error: 'Server error' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${playerId}`);
    const gameId = gameManager.getGameByPlayer(playerId);
    if (gameId) {
      io.to(gameId).emit('opponent-disconnected');
    }
    gameManager.handleDisconnect(playerId);
  });
});

app.get('*', (_req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('Battleship server running. Build client first for the UI.');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Battleship server running on port ${PORT}`);
});
