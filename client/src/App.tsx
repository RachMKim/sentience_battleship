import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from './hooks/useSocket';
import { useGame } from './hooks/useGame';
import { Menu } from './components/Menu';
import { ShipPlacement } from './components/ShipPlacement';
import { FiringPhase } from './components/FiringPhase';
import { GameOver } from './components/GameOver';
import { GameHistory } from './components/GameHistory';
import { WaitingRoom } from './components/WaitingRoom';
import { LanguageSelector } from './components/LanguageSelector';
import { useI18n } from './lib/i18n';
import type { AIDifficulty } from './lib/types';

type Screen = 'menu' | 'game' | 'history';

function App() {
  const { t } = useI18n();
  const { socket, connected } = useSocket();
  const {
    gameState, gameId, lastShot, opponentDisconnected, error, hasSavedGame,
    createGame, joinGame, placeShips, fireShot, resumeGame, pauseGame, clearSavedGame, resetGame, setLastShot, setError,
  } = useGame(socket);
  const [screen, setScreen] = useState<Screen>('menu');

  useEffect(() => {
    if (gameState && screen === 'menu') {
      setScreen('game');
    }
  }, [gameState, screen]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

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

  const handleResume = useCallback(() => {
    resumeGame();
  }, [resumeGame]);

  const handleStartFresh = useCallback(() => {
    clearSavedGame();
  }, [clearSavedGame]);

  const handleQuit = useCallback(() => {
    pauseGame();
    setScreen('menu');
  }, [pauseGame]);

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

  const errorToast = (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl border border-neon-red/50 bg-neon-red/20 text-neon-red font-display tracking-wider text-sm backdrop-blur-sm"
        >
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (screen === 'history') {
    return (
      <>
        <LanguageSelector />
        <GameHistory onBack={() => setScreen('menu')} />
      </>
    );
  }

  if (screen === 'menu' || !gameState) {
    return (
      <>
        <LanguageSelector />
        {errorToast}
        <Menu
          onStartAI={handleStartAI}
          onCreateMultiplayer={handleCreateMultiplayer}
          onJoinMultiplayer={handleJoinMultiplayer}
          onViewHistory={() => setScreen('history')}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
          connected={connected}
          hasSavedGame={hasSavedGame && !gameState}
        />
      </>
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
      <LanguageSelector />
      {errorToast}
      <AnimatePresence>
        {opponentDisconnected && gameState.phase !== 'finished' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 bg-neon-red/20 border-b border-neon-red/30 py-3 text-center flex items-center justify-center gap-4"
          >
            <span className="text-neon-red text-sm font-display tracking-wider">{t('opponent_disconnected')}</span>
            <button
              onClick={handleMenu}
              className="px-3 py-1 text-xs font-display tracking-wider rounded-lg border border-neon-red/40 text-white bg-neon-red/10 hover:bg-neon-red/20 transition-colors"
            >
              {t('return_to_menu')}
            </button>
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
              onQuit={handleQuit}
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
              onQuit={handleQuit}
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
