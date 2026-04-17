import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClientGameState, ShotResult, ShipName } from '../lib/types';
import { Board } from './Board';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { ShipIcon } from './ShipSVG';
import { useI18n } from '../lib/i18n';

interface FiringPhaseProps {
  gameState: ClientGameState;
  onFire: (x: number, y: number) => void;
  lastShot: ShotResult | null;
  onClearShot: () => void;
  onQuit: () => void;
}

export function FiringPhase({ gameState, onFire, lastShot, onClearShot, onQuit }: FiringPhaseProps) {
  const { t } = useI18n();
  const { playHit, playMiss, playSunk } = useSoundEffects();
  const prevShotRef = useRef<ShotResult | null>(null);

  const isMyTurn = gameState.currentTurn === gameState.playerId;

  useEffect(() => {
    if (!lastShot || lastShot === prevShotRef.current) return;
    prevShotRef.current = lastShot;

    if (lastShot.sunk) {
      playSunk();
    } else if (lastShot.hit) {
      playHit();
    } else {
      playMiss();
    }

    const timer = setTimeout(onClearShot, 2500);
    return () => clearTimeout(timer);
  }, [lastShot, playHit, playMiss, playSunk, onClearShot]);

  const opponentShipsRemaining = Object.entries(gameState.opponentShipsSunk).filter(([, sunk]) => !sunk).length;
  const myShipsRemaining = Object.entries(gameState.myShipHealth).filter(([, hp]) => hp > 0).length;

  const getShotLabel = () => {
    if (!lastShot) return '';
    if (lastShot.sunk && lastShot.shipName) {
      return t('sunk_ship', { ship: t(lastShot.shipName) });
    }
    return lastShot.hit ? t('direct_hit') : t('miss');
  };

  return (
    <div className="flex flex-col items-center px-3 sm:px-6 py-4 sm:py-8 w-full max-w-5xl mx-auto">
      <motion.div
        key={isMyTurn ? 'my-turn' : 'their-turn'}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 sm:mb-6 text-center"
      >
        <div className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border text-xs sm:text-sm font-display tracking-wider btn-3d
          ${isMyTurn
            ? 'border-neon-green/40 text-neon-green bg-gradient-to-b from-neon-green/15 to-neon-green/5'
            : 'border-neon-orange/40 text-neon-orange bg-gradient-to-b from-neon-orange/15 to-neon-orange/5'
          }`}
          style={{
            textShadow: isMyTurn
              ? '0 0 10px rgba(0,255,136,0.5)'
              : '0 0 10px rgba(255,136,0,0.5)'
          }}
        >
          <motion.div
            animate={isMyTurn ? { scale: [1, 1.3, 1] } : undefined}
            transition={{ duration: 1, repeat: Infinity }}
            className={`w-2 h-2 rounded-full ${isMyTurn
              ? 'bg-neon-green shadow-[0_0_8px_rgba(0,255,136,0.6)]'
              : 'bg-neon-orange shadow-[0_0_8px_rgba(255,136,0,0.6)]'}`}
          />
          {isMyTurn ? t('your_turn') : t('opponent_firing')}
        </div>
      </motion.div>

      <div className="h-10 sm:h-12 mb-2 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {lastShot && (
            <motion.div
              key={`${lastShot.x}-${lastShot.y}`}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`px-4 py-1.5 sm:py-2 rounded-lg border font-display tracking-wider text-sm
                ${lastShot.sunk
                  ? 'border-sunk/60 text-white'
                  : lastShot.hit
                  ? 'border-hit/50 text-hit'
                  : 'border-ocean-400/40 text-ocean-300'
                }`}
              style={{
                background: lastShot.sunk
                  ? 'linear-gradient(135deg, rgba(120,0,20,0.9) 0%, rgba(60,0,10,0.95) 100%)'
                  : lastShot.hit
                  ? 'linear-gradient(135deg, rgba(100,15,0,0.85) 0%, rgba(50,10,0,0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(13,21,38,0.85) 0%, rgba(10,14,26,0.9) 100%)',
                boxShadow: lastShot.sunk
                  ? '0 0 40px rgba(255,17,68,0.35), 0 4px 16px rgba(255,17,68,0.25)'
                  : lastShot.hit
                  ? '0 0 24px rgba(255,80,0,0.25), 0 4px 12px rgba(255,51,102,0.15)'
                  : '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <div className="flex items-center gap-2">
                {lastShot.sunk ? (
                  <motion.span className="text-xl"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5 }}>💥</motion.span>
                ) : lastShot.hit ? (
                  <motion.span className="text-lg"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}>🔥</motion.span>
                ) : (
                  <span className="text-base">💧</span>
                )}
                <div>
                  <div className={`text-sm ${lastShot.sunk ? 'text-3d-red text-base' : ''}`}>
                    {getShotLabel()}
                  </div>
                  {lastShot.sunk && (
                    <div className="text-[9px] text-red-300/50 tracking-widest">{t('vessel_destroyed')}</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Boards: column on mobile, row on md+. Each board + its status panel grouped. */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full">
        {/* Left column: enemy board + enemy status */}
        <div className="flex flex-col items-center gap-2 w-full md:flex-1 min-w-0">
          <Board
            grid={gameState.opponentBoard}
            isOwner={false}
            onCellClick={isMyTurn ? onFire : undefined}
            disabled={!isMyTurn}
            title={t('enemy_waters')}
            opponentShipsSunk={gameState.opponentShipsSunk}
          />
          <p className="text-ocean-500 text-[10px] sm:text-xs font-display" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            {t('ships_remaining', { count: opponentShipsRemaining })}
          </p>
          <OpponentShipStatusPanel
            title={t('enemy_fleet')}
            shipsSunk={gameState.opponentShipsSunk}
          />
        </div>

        <div className="hidden md:flex flex-col items-center justify-center gap-2 text-ocean-600 shrink-0">
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-ocean-600 to-transparent" />
          <span className="text-xs font-display tracking-widest">{t('vs')}</span>
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-ocean-600 to-transparent" />
        </div>

        {/* Right column: your board + your status */}
        <div className="flex flex-col items-center gap-2 w-full md:flex-1 min-w-0">
          <Board
            grid={gameState.myBoard}
            isOwner={true}
            disabled={true}
            title={t('your_fleet')}
            ships={gameState.myShips}
            shipHealth={gameState.myShipHealth}
          />
          <p className="text-ocean-500 text-[10px] sm:text-xs font-display" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
            {t('ships_remaining', { count: myShipsRemaining })}
          </p>
          <ShipStatusPanel
            title={t('your_fleet')}
            shipHealth={gameState.myShipHealth}
          />
        </div>
      </div>

      <button
        onClick={onQuit}
        className="mt-6 w-full px-6 py-3 text-sm font-display tracking-wider rounded-lg border
          border-neon-red/40 text-neon-red bg-neon-red/10
          hover:border-neon-red/60 hover:text-neon-red hover:bg-neon-red/15
          active:bg-neon-red/20 transition-all duration-200 btn-3d"
      >
        {t('quit_game')}
      </button>
    </div>
  );
}

function OpponentShipStatusPanel({ title, shipsSunk }: {
  title: string;
  shipsSunk: Record<string, boolean>;
}) {
  const { t } = useI18n();
  return (
    <div className="w-full glass-panel rounded-xl border border-ocean-700/30 p-3 sm:p-4">
      <h4 className="text-xs font-display text-ocean-400 tracking-wider mb-2 sm:mb-3"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{title}</h4>
      <div className="space-y-1.5 sm:space-y-2">
        {Object.entries(shipsSunk).map(([name, sunk]) => (
          <div key={name} className="flex items-center gap-2 text-xs">
            <ShipIcon name={name as ShipName} size={24} sunk={sunk} />
            <span className={`font-display tracking-wider flex-1 ${sunk ? 'text-hit line-through' : 'text-ocean-300'}`}>
              {t(name)}
            </span>
            <span className={`font-display tracking-wider text-[10px] ${sunk ? 'text-hit' : 'text-ocean-500'}`}
              style={{ textShadow: sunk ? '0 0 6px rgba(255,51,102,0.4)' : 'none' }}>
              {sunk ? t('sunk') : t('active')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShipStatusPanel({ title, shipHealth }: {
  title: string;
  shipHealth: Record<string, number>;
}) {
  const { t } = useI18n();
  return (
    <div className="w-full glass-panel rounded-xl border border-ocean-700/30 p-3 sm:p-4">
      <h4 className="text-xs font-display text-ocean-400 tracking-wider mb-2 sm:mb-3"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{title}</h4>
      <div className="space-y-1.5 sm:space-y-2">
        {Object.entries(shipHealth).map(([name, hp]) => {
          const maxHp = { carrier: 5, battleship: 4, cruiser: 3, submarine: 3, destroyer: 2 }[name] || 0;
          const sunk = hp === 0;
          return (
            <div key={name} className="flex items-center gap-2 text-xs">
              <ShipIcon name={name as ShipName} size={24} sunk={sunk} />
              <span className={`font-display tracking-wider flex-1 ${sunk ? 'text-hit line-through' : 'text-ocean-300'}`}>
                {t(name)}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: maxHp }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: i < hp ? 'rgba(0,255,136,0.6)' : 'rgba(255,51,102,0.45)',
                      boxShadow: i < hp
                        ? '0 0 4px rgba(0,255,136,0.3)'
                        : 'inset 0 1px 2px rgba(0,0,0,0.3)',
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
