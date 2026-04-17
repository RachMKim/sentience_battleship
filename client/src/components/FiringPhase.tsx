import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClientGameState, ShotResult } from '../lib/types';
import { Board } from './Board';
import { SHIP_LABELS } from '../lib/constants';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface FiringPhaseProps {
  gameState: ClientGameState;
  onFire: (x: number, y: number) => void;
  lastShot: ShotResult | null;
  onClearShot: () => void;
}

export function FiringPhase({ gameState, onFire, lastShot, onClearShot }: FiringPhaseProps) {
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

  const opponentShipsRemaining = Object.entries(gameState.opponentShipHealth).filter(([, hp]) => hp > 0).length;
  const myShipsRemaining = Object.entries(gameState.myShipHealth).filter(([, hp]) => hp > 0).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Turn indicator */}
      <motion.div
        key={isMyTurn ? 'my-turn' : 'their-turn'}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-display tracking-wider
          ${isMyTurn
            ? 'border-neon-green/40 text-neon-green bg-neon-green/10'
            : 'border-neon-orange/40 text-neon-orange bg-neon-orange/10'
          }`}
        >
          <motion.div
            animate={isMyTurn ? { scale: [1, 1.3, 1] } : undefined}
            transition={{ duration: 1, repeat: Infinity }}
            className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-neon-green' : 'bg-neon-orange'}`}
          />
          {isMyTurn ? 'YOUR TURN — SELECT TARGET' : 'OPPONENT FIRING...'}
        </div>
      </motion.div>

      {/* Shot feedback toast */}
      <AnimatePresence>
        {lastShot && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl border font-display tracking-wider text-sm
              ${lastShot.sunk
                ? 'border-sunk/50 bg-sunk/20 text-white'
                : lastShot.hit
                ? 'border-hit/50 bg-hit/20 text-hit'
                : 'border-ocean-400/50 bg-ocean-800/90 text-ocean-300'
              }`}
          >
            {lastShot.sunk
              ? `${SHIP_LABELS[lastShot.shipName!]} SUNK!`
              : lastShot.hit
              ? 'HIT!'
              : 'MISS'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boards */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
        <div className="flex flex-col items-center gap-2">
          <Board
            grid={gameState.opponentBoard}
            isOwner={false}
            onCellClick={isMyTurn ? onFire : undefined}
            disabled={!isMyTurn}
            title="ENEMY WATERS"
          />
          <p className="text-ocean-500 text-xs font-display">Ships remaining: {opponentShipsRemaining}/5</p>
        </div>

        {/* Divider */}
        <div className="hidden lg:flex flex-col items-center gap-2 text-ocean-600">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-ocean-600 to-transparent" />
          <span className="text-xs font-display tracking-widest">VS</span>
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-ocean-600 to-transparent" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <Board
            grid={gameState.myBoard}
            isOwner={true}
            disabled={true}
            title="YOUR FLEET"
          />
          <p className="text-ocean-500 text-xs font-display">Ships remaining: {myShipsRemaining}/5</p>
        </div>
      </div>

      {/* Ship status panels */}
      <div className="flex flex-col lg:flex-row gap-6 mt-6 w-full max-w-4xl">
        <ShipStatusPanel
          title="ENEMY FLEET"
          shipHealth={gameState.opponentShipHealth}
          isOpponent={true}
        />
        <ShipStatusPanel
          title="YOUR FLEET"
          shipHealth={gameState.myShipHealth}
          isOpponent={false}
        />
      </div>
    </div>
  );
}

function ShipStatusPanel({ title, shipHealth, isOpponent }: {
  title: string;
  shipHealth: Record<string, number>;
  isOpponent: boolean;
}) {
  return (
    <div className="flex-1 bg-ocean-900/50 rounded-xl border border-ocean-700/30 p-4">
      <h4 className="text-xs font-display text-ocean-400 tracking-wider mb-3">{title}</h4>
      <div className="space-y-1.5">
        {Object.entries(shipHealth).map(([name, hp]) => {
          const ship = { carrier: 5, battleship: 4, cruiser: 3, submarine: 3, destroyer: 2 }[name] || 0;
          const sunk = hp === 0;
          return (
            <div key={name} className="flex items-center justify-between text-xs">
              <span className={`font-display tracking-wider ${sunk ? 'text-hit line-through' : 'text-ocean-300'}`}>
                {SHIP_LABELS[name as keyof typeof SHIP_LABELS]}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: ship }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-sm ${
                      i < hp
                        ? isOpponent ? 'bg-ocean-500' : 'bg-neon-green/60'
                        : 'bg-hit/60'
                    }`}
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
