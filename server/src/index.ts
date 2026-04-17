import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { GameManager } from './game/GameManager.js';
import { AIDifficulty, ShipPlacement } from './game/types.js';
import historyRoutes from './routes/history.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
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

  socket.on('create-game', (data: { mode: 'ai' | 'multiplayer'; difficulty?: AIDifficulty }, callback) => {
    const game = gameManager.createGame(data.mode, playerId, data.difficulty);
    socket.join(game.id);
    const clientState = gameManager.getClientState(game.id, playerId);
    callback({ gameId: game.id, state: clientState });
  });

  socket.on('join-game', (data: { gameId: string }, callback) => {
    const game = gameManager.joinGame(data.gameId, playerId);
    if (!game) {
      callback({ error: 'Game not found or full' });
      return;
    }

    socket.join(game.id);

    for (const pid of game.playerIds) {
      const clientState = gameManager.getClientState(game.id, pid);
      io.to(pid).emit('game-update', clientState);
    }

    callback({ gameId: game.id, state: gameManager.getClientState(game.id, playerId) });
  });

  socket.on('place-ships', (data: { gameId: string; placements: ShipPlacement[] }, callback) => {
    const success = gameManager.placeShips(data.gameId, playerId, data.placements);
    if (!success) {
      callback({ error: 'Invalid ship placement' });
      return;
    }

    const game = gameManager.getGame(data.gameId);
    if (!game) {
      callback({ error: 'Game not found' });
      return;
    }

    for (const pid of game.playerIds) {
      if (pid !== 'ai') {
        const clientState = gameManager.getClientState(data.gameId, pid);
        io.to(pid).emit('game-update', clientState);
      }
    }

    callback({ success: true });
  });

  socket.on('fire', async (data: { gameId: string; x: number; y: number }, callback) => {
    const result = gameManager.fireShot(data.gameId, playerId, data.x, data.y);
    if (!result) {
      callback({ error: 'Invalid shot' });
      return;
    }

    const game = gameManager.getGame(data.gameId);
    if (!game) {
      callback({ error: 'Game not found' });
      return;
    }

    for (const pid of game.playerIds) {
      if (pid !== 'ai') {
        const clientState = gameManager.getClientState(data.gameId, pid);
        io.to(pid).emit('game-update', clientState);
      }
    }

    callback({ result });

    if (game.mode === 'ai' && !result.gameOver && game.currentTurn === 'ai') {
      await new Promise(resolve => setTimeout(resolve, 800));

      const aiResult = gameManager.getAIResponse(data.gameId);
      if (aiResult) {
        for (const pid of game.playerIds) {
          if (pid !== 'ai') {
            const clientState = gameManager.getClientState(data.gameId, pid);
            io.to(pid).emit('game-update', clientState);
            io.to(pid).emit('ai-shot', aiResult);
          }
        }
      }
    }
  });

  socket.on('rejoin-game', async (data: { gameId: string; oldPlayerId?: string }, callback) => {
    let game = gameManager.getGame(data.gameId);
    if (!game) {
      game = await gameManager.restoreGame(data.gameId);
    }
    if (!game) {
      callback({ error: 'Game not found' });
      return;
    }

    // Remap the old player ID to the new socket ID
    if (data.oldPlayerId && data.oldPlayerId !== playerId && game.playerIds.includes(data.oldPlayerId)) {
      gameManager.remapPlayer(data.gameId, data.oldPlayerId, playerId);
    }

    socket.join(data.gameId);
    const clientState = gameManager.getClientState(data.gameId, playerId);
    if (!clientState) {
      callback({ error: 'Player not in this game' });
      return;
    }
    callback({ state: clientState, gameId: data.gameId });
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${playerId}`);
    const gameId = gameManager.getGameByPlayer(playerId);
    if (gameId) {
      io.to(gameId).emit('opponent-disconnected');
    }
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
