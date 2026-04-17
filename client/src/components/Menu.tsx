import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AIDifficulty } from '../lib/types';
import { useI18n } from '../lib/i18n';

interface MenuProps {
  onStartAI: (difficulty: AIDifficulty) => void;
  onCreateMultiplayer: () => void;
  onJoinMultiplayer: (gameId: string) => void;
  onViewHistory: () => void;
  onResume?: () => void;
  onStartFresh?: () => void;
  connected: boolean;
  hasSavedGame?: boolean;
}

export function Menu({ onStartAI, onCreateMultiplayer, onJoinMultiplayer, onViewHistory, onResume, onStartFresh, connected, hasSavedGame }: MenuProps) {
  const { t } = useI18n();
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
        <motion.div variants={itemVariants} className="text-center">
          <h1 className="text-5xl md:text-6xl font-display font-black tracking-wider text-white mb-2">
            <span className="text-3d drop-shadow-[0_0_20px_rgba(0,212,255,0.5)]">{t('title_battle')}</span>
            <span className="text-neon-blue text-3d drop-shadow-[0_0_20px_rgba(0,212,255,0.8)]">{t('title_ship')}</span>
          </h1>
          <p className="text-ocean-400 text-sm tracking-widest uppercase"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-neon-green animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.5)]' : 'bg-neon-red shadow-[0_0_8px_rgba(255,51,102,0.5)]'}`} />
          <span className="text-ocean-400">{connected ? t('connected') : t('connecting')}</span>
        </motion.div>

        {!showDifficulty && !showJoin && (
          <>
            {hasSavedGame && connected && onResume && onStartFresh && (
              <motion.div variants={itemVariants} className="w-full flex flex-col items-center gap-3">
                <div className="w-full p-4 rounded-xl border border-neon-yellow/30 bg-neon-yellow/5 text-center">
                  <p className="text-neon-yellow text-xs font-display tracking-wider mb-3"
                    style={{ textShadow: '0 0 8px rgba(255,204,0,0.3)' }}>
                    {t('saved_game_found')}
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onResume}
                      className="flex-1 py-3 px-4 bg-gradient-to-b from-neon-green/20 to-neon-green/10 rounded-lg
                        border border-neon-green/40 text-neon-green font-display text-sm tracking-wider
                        hover:border-neon-green/70 transition-all duration-300 btn-3d"
                      style={{ textShadow: '0 0 8px rgba(0,255,136,0.4)' }}
                    >
                      {t('resume_game')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onStartFresh}
                      className="flex-1 py-3 px-4 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-lg
                        border border-ocean-500/30 text-ocean-300 font-display text-sm tracking-wider
                        hover:border-ocean-400/50 transition-all duration-300 btn-3d"
                    >
                      {t('start_fresh')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

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
              {t('vs_computer')}
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
              {t('create_room')}
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
              {t('join_room')}
            </motion.button>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onViewHistory}
              className="text-ocean-400 hover:text-ocean-300 text-sm font-display tracking-wider transition-colors"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
            >
              {t('game_history')}
            </motion.button>
          </>
        )}

        {showDifficulty && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-3">
            <p className="text-center text-ocean-300 font-display text-sm tracking-wider mb-2"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
              {t('select_difficulty')}
            </p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => onStartAI('easy')} disabled={!connected}
              className="w-full py-3 px-6 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-xl border border-neon-green/30 text-white font-display tracking-wider hover:border-neon-green/60 transition-all duration-300 btn-3d disabled:opacity-40 disabled:cursor-not-allowed">
              <div className="flex justify-between items-center">
                <span>{t('easy')}</span>
                <span className="text-xs text-ocean-400 font-body">{t('easy_desc')}</span>
              </div>
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => onStartAI('medium')} disabled={!connected}
              className="w-full py-3 px-6 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-xl border border-neon-yellow/30 text-white font-display tracking-wider hover:border-neon-yellow/60 transition-all duration-300 btn-3d disabled:opacity-40 disabled:cursor-not-allowed">
              <div className="flex justify-between items-center">
                <span>{t('medium')}</span>
                <span className="text-xs text-ocean-400 font-body">{t('medium_desc')}</span>
              </div>
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => onStartAI('hard')} disabled={!connected}
              className="w-full py-3 px-6 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-xl border border-neon-red/30 text-white font-display tracking-wider hover:border-neon-red/60 transition-all duration-300 btn-3d disabled:opacity-40 disabled:cursor-not-allowed">
              <div className="flex justify-between items-center">
                <span>{t('hard')}</span>
                <span className="text-xs text-ocean-400 font-body">{t('hard_desc')}</span>
              </div>
            </motion.button>
            <button onClick={() => setShowDifficulty(false)} className="text-ocean-500 hover:text-ocean-300 text-sm mt-2 transition-colors">
              {t('back')}
            </button>
          </motion.div>
        )}

        {showJoin && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col gap-3">
            <p className="text-center text-ocean-300 font-display text-sm tracking-wider mb-2"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
              {t('enter_room_code')}
            </p>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder={t('room_code_placeholder')}
              className="w-full py-3 px-4 bg-ocean-800 rounded-xl border border-ocean-600
                text-white placeholder-ocean-500 font-mono text-center text-lg tracking-widest
                focus:outline-none focus:border-neon-blue/60
                shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,255,255,0.03)]"
              autoFocus
            />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { if (joinCode.trim()) onJoinMultiplayer(joinCode.trim()); }}
              className="w-full py-3 px-6 bg-gradient-to-b from-neon-blue/20 to-neon-blue/10 rounded-xl border border-neon-blue/40 text-white font-display tracking-wider hover:bg-neon-blue/30 transition-all duration-300 btn-3d">
              {t('join')}
            </motion.button>
            <button onClick={() => { setShowJoin(false); setJoinCode(''); }}
              className="text-ocean-500 hover:text-ocean-300 text-sm mt-1 transition-colors">
              {t('back')}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
