import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from './hooks/useSocket';
import { useGame } from './hooks/useGame';
import { Menu } from './components/Menu';
import { ShipPlacement } from './components/ShipPlacement';
import { FiringPhase } from './components/FiringPhase';
import { GameOver } from './components/GameOver';
import { GameHistory } from './components/GameHistory';
import { WaitingRoom } from './components/WaitingRoom';
import type { AIDifficulty } from './lib/types';

type Screen = 'menu' | 'game' | 'history';

function App() {
  const { socket, connected } = useSocket();
  const { gameState, gameId, lastShot, opponentDisconnected, createGame, joinGame, placeShips, fireShot, resetGame, setLastShot } = useGame(socket);
  const [screen, setScreen] = useState<Screen>('menu');

  const handleStartAI = useCallback(
    (difficulty: AIDifficulty) => {
      createGame('ai', difficulty);
      setScreen('game');
    },
    [createGame]
  );

  const handleCreateMultiplayer = useCallback(() => {
    createGame('multiplayer');
    setScreen('game');
  }, [createGame]);

  const handleJoinMultiplayer = useCallback(
    (code: string) => {
      joinGame(code);
      setScreen('game');
    },
    [joinGame]
  );

  const handleMenu = useCallback(() => {
    resetGame();
    setScreen('menu');
  }, [resetGame]);

  const handleRematch = useCallback(() => {
    if (gameState?.mode === 'ai') {
      const difficulty = gameState.aiDifficulty || 'medium';
      resetGame();
      createGame('ai', difficulty);
      setScreen('game');
    } else {
      resetGame();
      setScreen('menu');
    }
  }, [gameState, resetGame, createGame]);

  if (screen === 'history') {
    return <GameHistory onBack={() => setScreen('menu')} />;
  }

  if (screen === 'menu' || !gameState) {
    return (
      <Menu
        onStartAI={handleStartAI}
        onCreateMultiplayer={handleCreateMultiplayer}
        onJoinMultiplayer={handleJoinMultiplayer}
        onViewHistory={() => setScreen('history')}
        connected={connected}
      />
    );
  }

  // Multiplayer waiting room: game created but only 1 player and in placement
  if (
    gameState.mode === 'multiplayer' &&
    gameState.phase === 'placement' &&
    gameState.opponentBoard.length === 0 &&
    gameId
  ) {
    return <WaitingRoom gameId={gameId} onCancel={handleMenu} />;
  }

  return (
    <div className="relative">
      {/* Opponent disconnected banner */}
      <AnimatePresence>
        {opponentDisconnected && gameState.phase !== 'finished' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 bg-neon-red/20 border-b border-neon-red/30 py-2 text-center"
          >
            <span className="text-neon-red text-sm font-display tracking-wider">OPPONENT DISCONNECTED</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {gameState.phase === 'placement' && (
          <motion.div key="placement" exit={{ opacity: 0, x: -50 }}>
            <ShipPlacement
              onConfirm={placeShips}
              waitingForOpponent={
                gameState.mode === 'multiplayer' &&
                gameState.myShips.length > 0 &&
                gameState.phase === 'placement'
              }
            />
          </motion.div>
        )}

        {gameState.phase === 'firing' && (
          <motion.div key="firing" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
            <FiringPhase
              gameState={gameState}
              onFire={fireShot}
              lastShot={lastShot}
              onClearShot={() => setLastShot(null)}
            />
          </motion.div>
        )}

        {gameState.phase === 'finished' && (
          <motion.div key="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GameOver
              gameState={gameState}
              onRematch={handleRematch}
              onMenu={handleMenu}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
