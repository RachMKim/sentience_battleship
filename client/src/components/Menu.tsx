import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AIDifficulty } from '../lib/types';

interface MenuProps {
  onStartAI: (difficulty: AIDifficulty) => void;
  onCreateMultiplayer: () => void;
  onJoinMultiplayer: (gameId: string) => void;
  onViewHistory: () => void;
  connected: boolean;
}

export function Menu({ onStartAI, onCreateMultiplayer, onJoinMultiplayer, onViewHistory, connected }: MenuProps) {
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showDifficulty, setShowDifficulty] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Background animated grid lines */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,212,255,0.06)_0%,_transparent_70%)]" />
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-neon-blue/10 to-transparent w-full"
            style={{ top: `${(i + 1) * 8}%` }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full"
      >
        {/* Title with 3D depth */}
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-5xl md:text-6xl font-display font-black tracking-wider text-white mb-2">
            <span className="text-3d drop-shadow-[0_0_20px_rgba(0,212,255,0.5)]">BATTLE</span>
            <span className="text-neon-blue text-3d drop-shadow-[0_0_20px_rgba(0,212,255,0.8)]">SHIP</span>
          </h1>
          <p className="text-ocean-400 text-sm tracking-widest uppercase"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            Naval Warfare Simulator
          </p>
        </motion.div>

        {/* Connection status */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-neon-green animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.5)]' : 'bg-neon-red shadow-[0_0_8px_rgba(255,51,102,0.5)]'}`} />
          <span className="text-ocean-400">{connected ? 'Connected' : 'Connecting...'}</span>
        </motion.div>

        {/* Main buttons */}
        {!showDifficulty && !showJoin && (
          <>
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDifficulty(true)}
              disabled={!connected}
              className="w-full py-4 px-6 bg-gradient-to-b from-ocean-600 to-ocean-700 rounded-xl
                border border-neon-blue/30 text-white font-display text-lg tracking-wider
                hover:border-neon-blue/60 transition-all duration-300 btn-3d
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              VS COMPUTER
            </motion.button>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateMultiplayer}
              disabled={!connected}
              className="w-full py-4 px-6 bg-gradient-to-b from-ocean-600 to-ocean-700 rounded-xl
                border border-neon-green/30 text-white font-display text-lg tracking-wider
                hover:border-neon-green/60 transition-all duration-300 btn-3d
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              CREATE ROOM
            </motion.button>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowJoin(true)}
              disabled={!connected}
              className="w-full py-4 px-6 bg-gradient-to-b from-ocean-600 to-ocean-700 rounded-xl
                border border-neon-orange/30 text-white font-display text-lg tracking-wider
                hover:border-neon-orange/60 transition-all duration-300 btn-3d
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              JOIN ROOM
            </motion.button>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onViewHistory}
              className="text-ocean-400 hover:text-ocean-300 text-sm font-display tracking-wider transition-colors"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
            >
              GAME HISTORY
            </motion.button>
          </>
        )}

        {/* Difficulty selection */}
        {showDifficulty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-3"
          >
            <p className="text-center text-ocean-300 font-display text-sm tracking-wider mb-2"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
              SELECT DIFFICULTY
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStartAI('easy')}
              className="w-full py-3 px-6 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-xl
                border border-neon-green/30 text-white font-display tracking-wider
                hover:border-neon-green/60 transition-all duration-300 btn-3d"
            >
              <div className="flex justify-between items-center">
                <span>EASY</span>
                <span className="text-xs text-ocean-400 font-body">Random shots</span>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStartAI('medium')}
              className="w-full py-3 px-6 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-xl
                border border-neon-yellow/30 text-white font-display tracking-wider
                hover:border-neon-yellow/60 transition-all duration-300 btn-3d"
            >
              <div className="flex justify-between items-center">
                <span>MEDIUM</span>
                <span className="text-xs text-ocean-400 font-body">Hunt & Target</span>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStartAI('hard')}
              className="w-full py-3 px-6 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-xl
                border border-neon-red/30 text-white font-display tracking-wider
                hover:border-neon-red/60 transition-all duration-300 btn-3d"
            >
              <div className="flex justify-between items-center">
                <span>HARD</span>
                <span className="text-xs text-ocean-400 font-body">Probability Analysis</span>
              </div>
            </motion.button>
            <button
              onClick={() => setShowDifficulty(false)}
              className="text-ocean-500 hover:text-ocean-300 text-sm mt-2 transition-colors"
            >
              Back
            </button>
          </motion.div>
        )}

        {/* Join room input */}
        {showJoin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-3"
          >
            <p className="text-center text-ocean-300 font-display text-sm tracking-wider mb-2"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
              ENTER ROOM CODE
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Room code..."
              className="w-full py-3 px-4 bg-ocean-800 rounded-xl border border-ocean-600
                text-white placeholder-ocean-500 font-mono text-center text-lg tracking-widest
                focus:outline-none focus:border-neon-blue/60
                shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.03)]"
              autoFocus
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { if (joinCode.trim()) onJoinMultiplayer(joinCode.trim()); }}
              className="w-full py-3 px-6 bg-gradient-to-b from-neon-blue/20 to-neon-blue/10 rounded-xl
                border border-neon-blue/40 text-white font-display tracking-wider
                hover:bg-neon-blue/30 transition-all duration-300 btn-3d"
            >
              JOIN
            </motion.button>
            <button
              onClick={() => { setShowJoin(false); setJoinCode(''); }}
              className="text-ocean-500 hover:text-ocean-300 text-sm mt-1 transition-colors"
            >
              Back
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
