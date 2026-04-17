import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLUMN_LABELS } from '../lib/constants';
import { useI18n } from '../lib/i18n';

interface MoveRecord {
  id: string;
  player: string;
  x: number;
  y: number;
  result: string;
  shipSunk: string | null;
  timestamp: string;
}

interface GameRecord {
  id: string;
  mode: string;
  status: string;
  winner: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { moves: number };
}

interface GameDetail {
  id: string;
  mode: string;
  status: string;
  winner: string | null;
  createdAt: string;
  updatedAt: string;
  moves: MoveRecord[];
}

interface GameHistoryProps {
  onBack: () => void;
}

function formatCoord(x: number, y: number): string {
  return `${COLUMN_LABELS[x] || x}${y + 1}`;
}

export function GameHistory({ onBack }: GameHistoryProps) {
  const { t, locale } = useI18n();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => { setGames(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setGames([]); setLoading(false); });
  }, []);

  const loadGameDetail = (gameId: string) => {
    setDetailLoading(true);
    fetch(`/api/games/${gameId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.moves) setSelectedGame(data);
        setDetailLoading(false);
      })
      .catch(() => setDetailLoading(false));
  };

  const getOutcome = (winner: string | null) => {
    if (winner === 'ai') return t('defeat');
    if (winner) return t('victory');
    return t('in_progress');
  };

  const getOutcomeClass = (winner: string | null) =>
    winner === 'ai' ? 'text-hit' : 'text-neon-green';

  if (selectedGame) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-display text-white tracking-wider text-3d">{t('battle_replay')}</h2>
              <p className="text-ocean-500 text-xs mt-1 font-mono">{selectedGame.id}</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedGame(null)}
              className="px-4 py-2 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-lg border border-ocean-600 text-ocean-300
                hover:border-ocean-400 transition-all text-sm font-display tracking-wider btn-3d">
              {t('back')}
            </motion.button>
          </div>

          <div className="glass-panel rounded-xl border border-ocean-700/30 p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-display tracking-wider
                  ${selectedGame.mode === 'ai'
                    ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'
                    : 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                  }`}>
                  {selectedGame.mode === 'ai' ? t('vs_ai') : t('pvp')}
                </span>
                <span className={`text-xs font-display tracking-wider ${getOutcomeClass(selectedGame.winner)}`}>
                  {getOutcome(selectedGame.winner)}
                </span>
              </div>
              <div className="text-ocean-500 text-xs">
                {selectedGame.moves.length} {t('moves')} &middot; {new Date(selectedGame.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {selectedGame.moves.map((move, i) => (
              <motion.div
                key={move.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 1) }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs hover:bg-ocean-800/50 transition-colors"
              >
                <span className="text-ocean-600 font-mono w-8 text-right">{i + 1}.</span>
                <span className={`font-display tracking-wider w-16
                  ${move.player === 'ai' ? 'text-neon-orange' : 'text-neon-blue'}`}>
                  {move.player === 'ai' ? t('ai') : t('you')}
                </span>
                <span className="text-ocean-300 font-mono w-8">{formatCoord(move.x, move.y)}</span>
                <span className={`font-display tracking-wider
                  ${move.result === 'sunk' ? 'text-sunk' :
                    move.result === 'hit' ? 'text-hit' : 'text-ocean-500'}`}
                  style={{
                    textShadow: move.result === 'sunk' ? '0 0 6px rgba(255,17,68,0.4)' :
                      move.result === 'hit' ? '0 0 6px rgba(255,51,102,0.3)' : 'none'
                  }}>
                  {move.result === 'hit' ? t('hit') : move.result === 'sunk' ? t('sunk') : t('miss')}
                </span>
                {move.shipSunk && (
                  <span className="text-sunk text-[10px] font-display tracking-wider ml-1"
                    style={{ textShadow: '0 0 6px rgba(255,17,68,0.4)' }}>
                    ({t(move.shipSunk)})
                  </span>
                )}
                <span className="text-ocean-600 text-[10px] ml-auto font-mono">
                  {new Date(move.timestamp).toLocaleTimeString()}
                </span>
              </motion.div>
            ))}
          </div>

          {selectedGame.moves.length === 0 && (
            <div className="text-center text-ocean-500 py-8">
              <p className="font-display">{t('no_moves')}</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display text-white tracking-wider text-3d">{t('battle_log')}</h2>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-4 py-2 bg-gradient-to-b from-ocean-700 to-ocean-800 rounded-lg border border-ocean-600 text-ocean-300
              hover:border-ocean-400 transition-all text-sm font-display tracking-wider btn-3d">
            {t('back')}
          </motion.button>
        </div>

        {loading && <div className="text-center text-ocean-400">{t('loading')}</div>}

        {!loading && games.length === 0 && (
          <div className="text-center text-ocean-500 py-12">
            <p className="text-lg font-display" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{t('no_battles')}</p>
            <p className="text-sm mt-2">{t('play_to_see')}</p>
          </div>
        )}

        <AnimatePresence>
          {detailLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-ocean-400 py-4">
              {t('loading_details')}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {games.map((game, i) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => loadGameDetail(game.id)}
              className="w-full glass-panel rounded-xl border border-ocean-700/30 p-4 flex items-center justify-between
                hover:border-ocean-500/40 transition-all cursor-pointer text-left group"
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
                    }}>
                    {game.mode === 'ai' ? t('vs_ai') : t('pvp')}
                  </span>
                </div>
                <p className="text-ocean-400 text-xs mt-1">
                  {new Date(game.createdAt).toLocaleDateString(locale)} {new Date(game.createdAt).toLocaleTimeString(locale)}
                </p>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-xs text-ocean-500 font-display">{game._count.moves} {t('moves')}</p>
                  <p className={`text-xs font-display tracking-wider ${getOutcomeClass(game.winner)}`}
                    style={{
                      textShadow: game.winner === 'ai'
                        ? '0 0 6px rgba(255,51,102,0.4)'
                        : '0 0 6px rgba(0,255,136,0.4)'
                    }}>
                    {getOutcome(game.winner)}
                  </p>
                </div>
                <span className="text-ocean-600 group-hover:text-ocean-400 transition-colors text-sm">&rsaquo;</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
