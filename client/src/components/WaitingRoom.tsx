import { useState } from 'react';
import { motion } from 'framer-motion';

interface WaitingRoomProps {
  gameId: string;
  onCancel: () => void;
}

export function WaitingRoom({ gameId, onCancel }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-2 border-neon-blue/20 border-t-neon-blue rounded-full mx-auto mb-8
            shadow-[0_0_16px_rgba(0,212,255,0.3)]"
        />

        <h2 className="text-2xl font-display text-white tracking-wider mb-2 text-3d">ROOM CREATED</h2>
        <p className="text-ocean-400 text-sm mb-6"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
          Share this code with your opponent
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copyCode}
          className="w-full py-4 px-6 rounded-xl border border-neon-blue/30
            text-neon-blue font-mono text-3xl tracking-[0.5em] text-center
            hover:border-neon-blue/60 transition-all duration-300 glass-panel btn-3d"
          style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}
        >
          {gameId}
        </motion.button>

        <p className="text-ocean-500 text-xs mt-3 mb-8">
          {copied
            ? <span className="text-neon-green" style={{ textShadow: '0 0 6px rgba(0,255,136,0.4)' }}>Copied to clipboard!</span>
            : 'Click to copy'}
        </p>

        <p className="text-ocean-400 text-sm mb-6">Waiting for opponent to join...</p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="text-ocean-500 hover:text-ocean-300 text-sm font-display tracking-wider transition-colors"
        >
          CANCEL
        </motion.button>
      </motion.div>
    </div>
  );
}
