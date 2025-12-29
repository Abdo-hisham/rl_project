import React, { useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { motion } from 'framer-motion';

interface BreakoutCanvasProps {
  showValues?: boolean;
  showPolicy?: boolean;
  animatedPosition?: [number, number] | null;
}

const ACTION_SYMBOLS: Record<number, string> = {
  0: '●',
  1: '←',
  2: '→',
};

const BreakoutCanvas: React.FC<BreakoutCanvasProps> = ({
  showValues = false,
  showPolicy = false,
  animatedPosition = null,
}) => {
  const { config, breakoutState, currentPosition } = useSelector((state: RootState) => state.environment);
  const { valueFunction, policy, isTrained } = useSelector((state: RootState) => state.algorithm);

  const gridSize = config.gridSize || 5;
  const numBrickRows = config.numBrickRows || 2;

  const paddlePosition = breakoutState?.paddlePosition 
    ?? animatedPosition?.[0] 
    ?? currentPosition?.[0] 
    ?? Math.floor(gridSize / 2);

  const ballPosition: [number, number] = breakoutState?.ballPosition ?? [Math.floor(gridSize / 2), gridSize - 2];
  
  useEffect(() => {
    console.log('[Breakout] Paddle:', paddlePosition, 'Ball:', ballPosition, 'BreakoutState:', breakoutState);
  }, [paddlePosition, ballPosition, breakoutState]);
  const bricks = useMemo(() => {
    if (breakoutState?.bricks) {
      return new Set(breakoutState.bricks.map((b: [number, number]) => `${b[0]},${b[1]}`));
    }
    const defaultBricks = new Set<string>();
    for (let y = 0; y < numBrickRows; y++) {
      for (let x = 0; x < gridSize; x++) {
        defaultBricks.add(`${x},${y}`);
      }
    }
    return defaultBricks;
  }, [breakoutState, numBrickRows, gridSize]);

  const getValue = (x: number, y: number): number | null => {
    if (!showValues || !isTrained) return null;
    const key = `(${x}, ${y})`;
    return valueFunction[key] ?? null;
  };

  const getAction = (paddleX: number): number | null => {
    if (!showPolicy || !isTrained) return null;
    const key = `(${paddleX}, ${ballPosition[0]})`;
    return policy[key] ?? null;
  };

  const getValueColor = (value: number): string => {
    const values = Object.values(valueFunction);
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 1;
    const range = maxValue - minValue || 1;
    const normalized = (value - minValue) / range;
    
    const r = Math.round(100 - normalized * 100);
    const g = Math.round(150 + normalized * 100);
    const b = Math.round(200 - normalized * 100);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const cellSize = Math.min(60, 400 / gridSize);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎮</span>
        <h3 className="text-lg font-semibold text-gray-700">Breakout</h3>
      </div>

      <div 
        className="relative bg-gray-900 rounded-lg p-2 shadow-lg"
        style={{ 
          width: gridSize * cellSize + 16,
          height: gridSize * cellSize + 16 
        }}
      >
        <div 
          className="grid gap-0.5"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`
          }}
        >
          {Array.from({ length: gridSize }).map((_, y) =>
            Array.from({ length: gridSize }).map((_, x) => {
              const isBrick = bricks.has(`${x},${y}`);
              const isBall = ballPosition[0] === x && ballPosition[1] === y;
              const isPaddle = y === gridSize - 1 && x === paddlePosition;
              const value = getValue(x, y);

              return (
                <motion.div
                  key={`${x}-${y}`}
                  className={`
                    relative flex items-center justify-center
                    ${isBrick ? 'rounded' : 'rounded-sm'}
                    transition-all duration-150
                  `}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: isBrick 
                      ? getBrickColor(y) 
                      : isPaddle 
                        ? '#3B82F6'
                        : value !== null 
                          ? getValueColor(value)
                          : '#1F2937',
                    border: isBall ? '2px solid #FCD34D' : 'none',
                    boxShadow: isBrick ? 'inset 0 -2px 4px rgba(0,0,0,0.3)' : 'none'
                  }}
                  initial={isBall ? { scale: 0.8 } : false}
                  animate={isBall ? { scale: [0.8, 1, 0.8] } : {}}
                  transition={isBall ? { duration: 0.5, repeat: Infinity } : {}}
                >
                  {isBall && (
                    <motion.div
                      className="w-4 h-4 bg-yellow-400 rounded-full shadow-lg"
                      animate={{ 
                        boxShadow: ['0 0 10px #FCD34D', '0 0 20px #FCD34D', '0 0 10px #FCD34D']
                      }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}

                  {isBrick && (
                    <span className="text-white text-xs font-bold opacity-70">
                      🧱
                    </span>
                  )}

                  {isPaddle && (
                    <span className="text-white text-lg">▬</span>
                  )}

                  {!isBrick && !isBall && !isPaddle && value !== null && (
                    <span className="text-xs font-mono text-white opacity-80">
                      {value.toFixed(1)}
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Paddle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
          <span>Ball</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Bricks</span>
        </div>
      </div>

      {showPolicy && isTrained && (
        <div className="mt-2 flex gap-4 text-sm text-gray-600">
          <span className="font-medium">Actions:</span>
          <span>● Stay</span>
          <span>← Left</span>
          <span>→ Right</span>
        </div>
      )}

      {showPolicy && isTrained && (
        <div className="mt-2 text-sm">
          <span className="text-gray-600">Paddle Action: </span>
          <span className="font-mono font-bold text-blue-600">
            {ACTION_SYMBOLS[getAction(paddlePosition) ?? 0] || '●'}
          </span>
        </div>
      )}

      {breakoutState?.score !== undefined && (
        <div className="mt-2 text-lg font-bold text-gray-700">
          Score: {breakoutState.score}
        </div>
      )}
    </div>
  );
};

function getBrickColor(row: number): string {
  const colors = [
    '#EF4444',
    '#F97316',
    '#EAB308',
    '#22C55E',
    '#3B82F6',
  ];
  return colors[row % colors.length];
}

export default BreakoutCanvas;
