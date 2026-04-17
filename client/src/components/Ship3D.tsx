import { motion } from 'framer-motion';
import type { ShipPlacement, ShipName } from '../lib/types';

interface Ship3DProps {
  placement: ShipPlacement;
  cellSize: number;
  sunk?: boolean;
}

const SHIP_CONFIGS: Record<ShipName, {
  hullColor: string;
  accentColor: string;
  deckFeatures: (length: number) => { offset: number; type: 'bridge' | 'turret' | 'mast' | 'scope' }[];
}> = {
  carrier: {
    hullColor: '#6b21a8',
    accentColor: '#9333ea',
    deckFeatures: () => [
      { offset: 0, type: 'mast' },
      { offset: 1, type: 'bridge' },
      { offset: 2, type: 'turret' },
      { offset: 3, type: 'turret' },
    ],
  },
  battleship: {
    hullColor: '#1e40af',
    accentColor: '#3b82f6',
    deckFeatures: () => [
      { offset: 0, type: 'turret' },
      { offset: 1, type: 'bridge' },
      { offset: 2, type: 'turret' },
    ],
  },
  cruiser: {
    hullColor: '#0f766e',
    accentColor: '#14b8a6',
    deckFeatures: () => [
      { offset: 0, type: 'turret' },
      { offset: 1, type: 'bridge' },
    ],
  },
  submarine: {
    hullColor: '#166534',
    accentColor: '#22c55e',
    deckFeatures: () => [
      { offset: 1, type: 'scope' },
    ],
  },
  destroyer: {
    hullColor: '#a16207',
    accentColor: '#eab308',
    deckFeatures: () => [
      { offset: 0, type: 'turret' },
    ],
  },
};

function DeckFeature({ type, color, cellSize }: { type: string; color: string; cellSize: number }) {
  const s = cellSize;

  if (type === 'bridge') {
    return (
      <div
        className="absolute rounded-sm"
        style={{
          width: s * 0.5,
          height: s * 0.5,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) translateZ(8px)',
          background: `linear-gradient(180deg, ${color}dd, ${color}88)`,
          boxShadow: `0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 6px ${color}44`,
        }}
      />
    );
  }

  if (type === 'turret') {
    return (
      <div
        className="absolute rounded-full"
        style={{
          width: s * 0.35,
          height: s * 0.35,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) translateZ(6px)',
          background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}66)`,
          boxShadow: `0 2px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
      >
        <div
          className="absolute"
          style={{
            width: 2,
            height: s * 0.3,
            left: '50%',
            bottom: '50%',
            transform: 'translateX(-50%)',
            background: color,
            borderRadius: 1,
            boxShadow: `0 -1px 2px rgba(0,0,0,0.3)`,
          }}
        />
      </div>
    );
  }

  if (type === 'mast') {
    return (
      <div
        className="absolute"
        style={{
          width: 3,
          height: s * 0.6,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -80%) translateZ(10px)',
          background: `linear-gradient(180deg, ${color}, ${color}88)`,
          borderRadius: 1,
          boxShadow: `0 2px 4px rgba(0,0,0,0.4)`,
        }}
      />
    );
  }

  if (type === 'scope') {
    return (
      <div
        className="absolute"
        style={{
          width: 3,
          height: s * 0.5,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -70%) translateZ(6px)',
          background: color,
          borderRadius: 1,
          boxShadow: `0 1px 3px rgba(0,0,0,0.4)`,
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: s * 0.18,
            height: s * 0.18,
            left: '50%',
            top: 0,
            transform: 'translate(-50%, -50%)',
            background: color,
            boxShadow: `0 0 4px ${color}88`,
          }}
        />
      </div>
    );
  }

  return null;
}

export function Ship3D({ placement, cellSize, sunk }: Ship3DProps) {
  const config = SHIP_CONFIGS[placement.name];
  const isHorizontal = placement.orientation === 'horizontal';
  const gapSize = 2;

  const totalLength = placement.length * cellSize + (placement.length - 1) * gapSize;
  const shipWidth = cellSize * 0.82;

  const left = placement.x * (cellSize + gapSize);
  const top = placement.y * (cellSize + gapSize);

  const features = config.deckFeatures(placement.length);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: sunk ? 0.4 : 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="absolute"
      style={{
        left: left + (isHorizontal ? 0 : (cellSize - shipWidth) / 2),
        top: top + (isHorizontal ? (cellSize - shipWidth) / 2 : 0),
        width: isHorizontal ? totalLength : shipWidth,
        height: isHorizontal ? shipWidth : totalLength,
        transformStyle: 'preserve-3d',
        transform: `translateZ(3px)`,
        pointerEvents: 'none',
        filter: sunk ? 'grayscale(0.7) brightness(0.5)' : 'none',
      }}
    >
      {/* Hull bottom shadow */}
      <div
        className="absolute rounded-full"
        style={{
          inset: isHorizontal ? '15% -2% -8% -2%' : '-2% 15% -2% -8%',
          background: 'rgba(0,0,0,0.35)',
          filter: 'blur(4px)',
          transform: 'translateZ(-2px)',
        }}
      />

      {/* Main hull */}
      <div
        className="absolute"
        style={{
          inset: 0,
          background: `linear-gradient(${isHorizontal ? '180deg' : '90deg'}, 
            ${config.hullColor}ee 0%, 
            ${config.hullColor} 40%, 
            ${config.accentColor}44 100%)`,
          borderRadius: isHorizontal
            ? `${shipWidth * 0.4}px ${shipWidth * 0.5}px ${shipWidth * 0.5}px ${shipWidth * 0.4}px`
            : `${shipWidth * 0.4}px ${shipWidth * 0.4}px ${shipWidth * 0.5}px ${shipWidth * 0.5}px`,
          boxShadow: `
            inset 0 ${isHorizontal ? '1' : '0'}px ${isHorizontal ? '0' : '1'}px rgba(255,255,255,0.12),
            inset 0 ${isHorizontal ? '-2' : '0'}px ${isHorizontal ? '0' : '-2'}px rgba(0,0,0,0.3),
            0 3px 8px rgba(0,0,0,0.5),
            0 0 12px ${config.accentColor}22
          `,
          transform: 'translateZ(2px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Deck line highlight */}
        <div
          className="absolute"
          style={{
            left: isHorizontal ? '8%' : '20%',
            right: isHorizontal ? '8%' : '20%',
            top: isHorizontal ? '20%' : '8%',
            bottom: isHorizontal ? '20%' : '8%',
            border: `1px solid ${config.accentColor}33`,
            borderRadius: isHorizontal
              ? `${shipWidth * 0.2}px ${shipWidth * 0.3}px ${shipWidth * 0.3}px ${shipWidth * 0.2}px`
              : `${shipWidth * 0.2}px ${shipWidth * 0.2}px ${shipWidth * 0.3}px ${shipWidth * 0.3}px`,
          }}
        />

        {/* Deck features */}
        {features.map((feature, i) => {
          const featurePos = isHorizontal
            ? { left: (feature.offset + 0.5) * (cellSize + gapSize), top: shipWidth / 2 }
            : { left: shipWidth / 2, top: (feature.offset + 0.5) * (cellSize + gapSize) };

          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: featurePos.left,
                top: featurePos.top,
                width: 0,
                height: 0,
                transformStyle: 'preserve-3d',
              }}
            >
              <DeckFeature type={feature.type} color={config.accentColor} cellSize={cellSize} />
            </div>
          );
        })}

        {/* Bow wake / front highlight */}
        <div
          className="absolute"
          style={isHorizontal ? {
            right: 0,
            top: '10%',
            bottom: '10%',
            width: shipWidth * 0.35,
            background: `linear-gradient(270deg, ${config.accentColor}22, transparent)`,
            borderRadius: `0 ${shipWidth * 0.5}px ${shipWidth * 0.5}px 0`,
          } : {
            left: '10%',
            right: '10%',
            bottom: 0,
            height: shipWidth * 0.35,
            background: `linear-gradient(0deg, ${config.accentColor}22, transparent)`,
            borderRadius: `0 0 ${shipWidth * 0.5}px ${shipWidth * 0.5}px`,
          }}
        />
      </div>

      {/* Sunk overlay */}
      {sunk && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: 'translateZ(4px)',
            background: 'rgba(255,17,68,0.15)',
            borderRadius: 'inherit',
          }}
        >
          <span className="text-hit font-display text-xs tracking-widest"
            style={{ textShadow: '0 0 8px rgba(255,51,102,0.6)' }}>
            SUNK
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
