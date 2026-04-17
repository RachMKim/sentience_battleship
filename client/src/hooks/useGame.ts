import { useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import type { AIDifficulty, ClientGameState, GameMode, ShipPlacement, ShotResult } from '../lib/types';

export function useGame(socket: Socket | null) {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [lastShot, setLastShot] = useState<ShotResult | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('game-update', (state: ClientGameState) => {
      setGameState(state);
    });

    socket.on('ai-shot', (result: ShotResult) => {
      setLastShot(result);
    });

    socket.on('opponent-disconnected', () => {
      setOpponentDisconnected(true);
    });

    // Try to rejoin a saved game on reconnect
    socket.on('connect', () => {
      const savedGameId = localStorage.getItem('battleship-gameId');
      const savedPlayerId = localStorage.getItem('battleship-playerId');
      if (savedGameId && savedPlayerId) {
        socket.emit('rejoin-game', {
          gameId: savedGameId,
          oldPlayerId: savedPlayerId,
        }, (response: { state?: ClientGameState; gameId?: string; error?: string }) => {
          if (response.error) {
            localStorage.removeItem('battleship-gameId');
            localStorage.removeItem('battleship-playerId');
            return;
          }
          if (response.state) {
            setGameState(response.state);
            setGameId(response.gameId || savedGameId);
            localStorage.setItem('battleship-playerId', socket.id!);
          }
        });
      }
    });

    return () => {
      socket.off('game-update');
      socket.off('ai-shot');
      socket.off('opponent-disconnected');
      socket.off('connect');
    };
  }, [socket]);

  const createGame = useCallback(
    (mode: GameMode, difficulty?: AIDifficulty) => {
      if (!socket) return;
      socket.emit('create-game', { mode, difficulty }, (response: { gameId: string; state: ClientGameState }) => {
        setGameId(response.gameId);
        setGameState(response.state);
        setOpponentDisconnected(false);
        setLastShot(null);

        localStorage.setItem('battleship-gameId', response.gameId);
        localStorage.setItem('battleship-playerId', socket.id!);
      });
    },
    [socket]
  );

  const joinGame = useCallback(
    (joinGameId: string) => {
      if (!socket) return;
      socket.emit('join-game', { gameId: joinGameId }, (response: { gameId?: string; state?: ClientGameState; error?: string }) => {
        if (response.error) {
          alert(response.error);
          return;
        }
        setGameId(response.gameId!);
        setGameState(response.state!);
        setOpponentDisconnected(false);

        localStorage.setItem('battleship-gameId', response.gameId!);
        localStorage.setItem('battleship-playerId', socket.id!);
      });
    },
    [socket]
  );

  const placeShips = useCallback(
    (placements: ShipPlacement[]) => {
      if (!socket || !gameId) return;
      socket.emit('place-ships', { gameId, placements }, (response: { success?: boolean; error?: string }) => {
        if (response.error) {
          alert(response.error);
        }
      });
    },
    [socket, gameId]
  );

  const fireShot = useCallback(
    (x: number, y: number) => {
      if (!socket || !gameId) return;
      socket.emit('fire', { gameId, x, y }, (response: { result?: ShotResult; error?: string }) => {
        if (response.error) return;
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
    localStorage.removeItem('battleship-gameId');
    localStorage.removeItem('battleship-playerId');
  }, []);

  return {
    gameState,
    gameId,
    lastShot,
    opponentDisconnected,
    createGame,
    joinGame,
    placeShips,
    fireShot,
    resetGame,
    setLastShot,
  };
}
