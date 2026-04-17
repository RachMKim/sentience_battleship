import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface GameRecord {
  id: string;
  mode: string;
  status: string;
  winner: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { moves: number };
}

interface GameHistoryProps {
  onBack: () => void;
}

export function GameHistory({ onBack }: GameHistoryProps) {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => { setGames(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display text-white tracking-wider text-3d">BATTLE LOG</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-4 py-2 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-lg border border-ocean-600 text-ocean-300
              hover:border-ocean-400 transition-all text-sm font-display tracking-wider btn-3d"
          >
            BACK
          </motion.button>
        </div>

        {loading && (
          <div className="text-center text-ocean-400">Loading...</div>
        )}

        {!loading && games.length === 0 && (
          <div className="text-center text-ocean-500 py-12">
            <p className="text-lg font-display" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>NO BATTLES RECORDED</p>
            <p className="text-sm mt-2">Play a game to see history here.</p>
          </div>
        )}

        <div className="space-y-3">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-xl border border-ocean-700/30 p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-ocean-500">{game.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-display tracking-wider
                    ${game.mode === 'ai'
                      ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                      : 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                    }`}
                    style={{
                      boxShadow: game.mode === 'ai'
                        ? '0 0 6px rgba(0,212,255,0.15)'
                        : '0 0 6px rgba(0,255,136,0.15)'
                    }}
                  >
                    {game.mode === 'ai' ? 'VS AI' : 'PVP'}
                  </span>
                </div>
                <p className="text-ocean-400 text-xs mt-1">
                  {new Date(game.createdAt).toLocaleDateString()} at {new Date(game.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ocean-500 font-display">{game._count.moves} moves</p>
                <p className={`text-xs font-display tracking-wider
                  ${game.winner === 'ai' ? 'text-hit' : 'text-neon-green'}`}
                  style={{
                    textShadow: game.winner === 'ai'
                      ? '0 0 6px rgba(255,51,102,0.4)'
                      : '0 0 6px rgba(0,255,136,0.4)'
                  }}
                >
                  {game.winner === 'ai' ? 'DEFEAT' : game.winner ? 'VICTORY' : 'IN PROGRESS'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
