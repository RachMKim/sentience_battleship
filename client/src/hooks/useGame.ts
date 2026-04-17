import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { AIDifficulty, ClientGameState, GameMode, ShipPlacement, ShotResult } from '../lib/types';

export function useGame(socket: Socket | null) {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [lastShot, setLastShot] = useState<ShotResult | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onGameUpdate = (state: ClientGameState) => setGameState(state);
    const onAiShot = (result: ShotResult) => setLastShot(result);
    const onOpponentDisconnected = () => setOpponentDisconnected(true);

    const onConnect = () => {
      const savedGameId = localStorage.getItem('battleship-gameId');
      const savedPlayerId = localStorage.getItem('battleship-playerId');
      if (savedGameId && savedPlayerId) {
        socket.emit('rejoin-game', {
          gameId: savedGameId,
          oldPlayerId: savedPlayerId,
        }, (response: { state?: ClientGameState; gameId?: string; error?: string }) => {
          if (!response || response.error) {
            localStorage.removeItem('battleship-gameId');
            localStorage.removeItem('battleship-playerId');
            return;
          }
          if (response.state) {
            setGameState(response.state);
            setGameId(response.gameId || savedGameId);
            if (socket.id) localStorage.setItem('battleship-playerId', socket.id);
          }
        });
      }
    };

    socket.on('game-update', onGameUpdate);
    socket.on('ai-shot', onAiShot);
    socket.on('opponent-disconnected', onOpponentDisconnected);
    socket.on('connect', onConnect);

    return () => {
      socket.off('game-update', onGameUpdate);
      socket.off('ai-shot', onAiShot);
      socket.off('opponent-disconnected', onOpponentDisconnected);
      socket.off('connect', onConnect);
    };
  }, [socket]);

  const createGame = useCallback(
    (mode: GameMode, difficulty?: AIDifficulty) => {
      if (!socket) return;
      setError(null);
      socket.emit('create-game', { mode, difficulty }, (response: { gameId?: string; state?: ClientGameState; error?: string }) => {
        if (!response || response.error) {
          setError(response?.error || 'Failed to create game');
          return;
        }
        if (response.gameId && response.state) {
          setGameId(response.gameId);
          setGameState(response.state);
          setOpponentDisconnected(false);
          setLastShot(null);
          localStorage.setItem('battleship-gameId', response.gameId);
          if (socket.id) localStorage.setItem('battleship-playerId', socket.id);
        }
      });
    },
    [socket]
  );

  const joinGame = useCallback(
    (joinGameId: string) => {
      if (!socket) return;
      setError(null);
      socket.emit('join-game', { gameId: joinGameId }, (response: { gameId?: string; state?: ClientGameState; error?: string }) => {
        if (!response || response.error) {
          setError(response?.error || 'Failed to join game');
          return;
        }
        if (response.gameId && response.state) {
          setGameId(response.gameId);
          setGameState(response.state);
          setOpponentDisconnected(false);
          localStorage.setItem('battleship-gameId', response.gameId);
          if (socket.id) localStorage.setItem('battleship-playerId', socket.id);
        }
      });
    },
    [socket]
  );

  const placeShips = useCallback(
    (placements: ShipPlacement[]) => {
      if (!socket || !gameId) return;
      socket.emit('place-ships', { gameId, placements }, (response: { success?: boolean; error?: string }) => {
        if (!response || response.error) {
          setError(response?.error || 'Invalid ship placement');
        }
      });
    },
    [socket, gameId]
  );

  const fireShot = useCallback(
    (x: number, y: number) => {
      if (!socket || !gameId) return;
      socket.emit('fire', { gameId, x, y }, (response: { result?: ShotResult; error?: string }) => {
        if (!response || response.error) {
          setError(response?.error || 'Invalid shot');
          return;
        }
        if (response.result) {
          setLastShot(response.result);
        }
      });
    },
    [socket, gameId]
  );

  const resetGame = useCallback(() => {
    setGameState(null);
    setGameId(null);
    setLastShot(null);
    setOpponentDisconnected(false);
    setError(null);
    localStorage.removeItem('battleship-gameId');
    localStorage.removeItem('battleship-playerId');
  }, []);

  return {
    gameState,
    gameId,
    lastShot,
    opponentDisconnected,
    error,
    createGame,
    joinGame,
    placeShips,
    fireShot,
    resetGame,
    setLastShot,
    setError,
  };
}
