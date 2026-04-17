import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ClientGameState } from '../lib/types';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface GameOverProps {
  gameState: ClientGameState;
  onRematch: () => void;
  onMenu: () => void;
}

export function GameOver({ gameState, onRematch, onMenu }: GameOverProps) {
  const { playVictory } = useSoundEffects();
  const isWinner = gameState.winner === gameState.playerId;

  useEffect(() => {
    if (isWinner) playVictory();
  }, [isWinner, playVictory]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center max-w-md"
      >
        {/* Glow effect */}
        <motion.div
          animate={isWinner ? {
            boxShadow: [
              '0 0 20px rgba(0, 255, 136, 0.1)',
              '0 0 60px rgba(0, 255, 136, 0.3)',
              '0 0 20px rgba(0, 255, 136, 0.1)',
            ],
          } : {
            boxShadow: [
              '0 0 20px rgba(255, 51, 102, 0.1)',
              '0 0 60px rgba(255, 51, 102, 0.3)',
              '0 0 20px rgba(255, 51, 102, 0.1)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block rounded-2xl p-8 bg-ocean-900/80 border border-ocean-700/30"
        >
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className={`text-5xl md:text-6xl font-display font-black tracking-wider mb-4 ${
              isWinner ? 'text-neon-green' : 'text-hit'
            }`}
          >
            {isWinner ? 'VICTORY' : 'DEFEAT'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-ocean-300 mb-8"
          >
            {isWinner
              ? 'All enemy ships have been destroyed!'
              : 'Your fleet has been destroyed.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onRematch}
              className={`w-full py-3 px-6 rounded-xl border font-display text-lg tracking-wider transition-all duration-300
                ${isWinner
                  ? 'bg-neon-green/10 border-neon-green/40 text-neon-green hover:bg-neon-green/20'
                  : 'bg-hit/10 border-hit/40 text-hit hover:bg-hit/20'
                }`}
            >
              REMATCH
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onMenu}
              className="w-full py-3 px-6 rounded-xl border border-ocean-600 text-ocean-300
                font-display tracking-wider hover:border-ocean-400 transition-all duration-300"
            >
              MAIN MENU
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
