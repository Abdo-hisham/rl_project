import React, { useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface FrozenLakeCanvasProps {
  showValues?: boolean;
  showPolicy?: boolean;
  animatedPosition?: [number, number] | null;
}

const CELL_COLORS: Record<string, string> = {
  S: '#90EE90',
  F: '#E0F4FF',
  H: '#1E3A5F',
  G: '#FFD700',
};

const CELL_EMOJIS: Record<string, string> = {
  S: '🚩',
  F: '',
  H: '🕳️',
  G: '⭐',
};

const FROZEN_LAKE_MAPS: Record<number, string[]> = {
  4: [
    "SFFF",
    "FHFH", 
    "FFFH",
    "HFFG"
  ],
  8: [
    "SFFFFFFF",
    "FFFFFFFF",
    "FFFHFFFF",
    "FFFFFHFF",
    "FFFHFFFF",
    "FHHFFFHF",
    "FHFFHFHF",
    "FFFHFFFG"
  ]
};

const ACTION_ARROWS: Record<number, React.ReactNode> = {
  0: <ArrowUp className="w-4 h-4" />,
  1: <ArrowDown className="w-4 h-4" />,
  2: <ArrowLeft className="w-4 h-4" />,
  3: <ArrowRight className="w-4 h-4" />,
};

const FrozenLakeCanvas: React.FC<FrozenLakeCanvasProps> = ({
  showValues = true,
  showPolicy = true,
  animatedPosition = null,
}) => {
  const { config, currentPosition } = useSelector((state: RootState) => state.environment);
  const { valueFunction, policy, isTrained } = useSelector((state: RootState) => state.algorithm);

  const gridSize = config.gridSize || 4;
  
  const displayPosition: [number, number] = animatedPosition || currentPosition || [0, 0];
  
  useEffect(() => {
    console.log('[FrozenLake] Display position updated:', displayPosition);
  }, [displayPosition]);

  const lakeMap = useMemo(() => {
    return FROZEN_LAKE_MAPS[gridSize] || FROZEN_LAKE_MAPS[4];
  }, [gridSize]);

  const isAgentInHole = useMemo(() => {
    const [ax, ay] = displayPosition;
    if (ay < lakeMap.length && ax < lakeMap[ay].length) {
      return lakeMap[ay][ax] === 'H';
    }
    return false;
  }, [displayPosition, lakeMap]);

  const isAgentAtGoal = useMemo(() => {
    const [ax, ay] = displayPosition;
    if (ay < lakeMap.length && ax < lakeMap[ay].length) {
      return lakeMap[ay][ax] === 'G';
    }
    return false;
  }, [displayPosition, lakeMap]);

  const values = Object.values(valueFunction);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 1;
  const valueRange = maxValue - minValue || 1;

  const getValueColor = (value: number, cellType: string) => {
    if (cellType === 'H') return CELL_COLORS.H;
    if (cellType === 'G') return CELL_COLORS.G;
    const normalized = (value - minValue) / valueRange;
    const r = Math.round(200 - normalized * 150);
    const g = Math.round(230 - normalized * 30);
    const b = Math.round(255 - normalized * 50);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getValue = (x: number, y: number): number | null => {
    const key = `(${x}, ${y})`;
    return valueFunction[key] ?? null;
  };

  const getAction = (x: number, y: number): number | null => {
    const key = `(${x}, ${y})`;
    return policy[key] ?? null;
  };

  const getCellType = (x: number, y: number): string => {
    if (y < lakeMap.length && x < lakeMap[y].length) {
      return lakeMap[y][x];
    }
    return 'F';
  };

  const isAgent = (x: number, y: number) => displayPosition[0] === x && displayPosition[1] === y;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900 rounded-xl shadow-md p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">🏔️ Frozen Lake</h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300">Agent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span className="text-gray-300">Goal</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAgentInHole && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded-lg text-center"
          >
            <span className="text-red-400 text-sm font-medium">💀 Fell in hole! Episode ended</span>
          </motion.div>
        )}
        {isAgentAtGoal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-3 p-2 bg-green-900/50 border border-green-500 rounded-lg text-center"
          >
            <span className="text-green-400 text-sm font-medium">🎉 Reached goal! Episode ended</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="grid gap-1 mx-auto bg-gray-800 p-2 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          maxWidth: Math.min(gridSize * 80, 400),
        }}
      >
        {Array.from({ length: gridSize }).map((_, y) =>
          Array.from({ length: gridSize }).map((_, x) => {
            const cellType = getCellType(x, y);
            const value = getValue(x, y);
            const action = getAction(x, y);
            const isAgentCell = isAgent(x, y);
            const isHole = cellType === 'H';
            const isGoal = cellType === 'G';
            const isStart = cellType === 'S';

            return (
              <motion.div
                key={`${x}-${y}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (x + y) * 0.02 }}
                className={`
                  relative aspect-square rounded-md flex flex-col items-center justify-center
                  transition-all duration-200 border-2
                  ${isHole ? 'border-blue-900' : isGoal ? 'border-yellow-500' : isStart ? 'border-green-500' : 'border-blue-300'}
                `}
                style={{
                  backgroundColor:
                    showValues && value !== null && isTrained && !isHole && !isGoal
                      ? getValueColor(value, cellType)
                      : CELL_COLORS[cellType] || CELL_COLORS.F,
                  minHeight: 70,
                  minWidth: 70,
                }}
              >
                {isAgentCell && (
                  <motion.div
                    layoutId="frozen-lake-agent"
                    className="absolute z-20"
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    animate={isHole ? { scale: [1, 0.5], opacity: [1, 0.5] } : { scale: 1, opacity: 1 }}
                  >
                    <span className="text-2xl">{isHole ? '😵' : isGoal ? '🥳' : '🧑'}</span>
                  </motion.div>
                )}

                {!isAgentCell && CELL_EMOJIS[cellType] && (
                  <span className="text-xl z-10">
                    {CELL_EMOJIS[cellType]}
                  </span>
                )}

                {showPolicy && action !== null && isTrained && !isHole && !isGoal && !isAgentCell && (
                  <div className="absolute top-1 right-1 text-gray-700">
                    {ACTION_ARROWS[action]}
                  </div>
                )}

                {showValues && value !== null && isTrained && !isAgentCell && (
                  <span className={`text-[10px] font-mono absolute bottom-1 ${isHole ? 'text-gray-400' : 'text-gray-700'}`}>
                    {value.toFixed(1)}
                  </span>
                )}

                <span className="absolute top-0.5 left-1 text-[8px] text-gray-500">
                  {x},{y}
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 rounded flex items-center justify-center text-sm" style={{ backgroundColor: CELL_COLORS.S }}>🚩</span>
          <span>Start</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 rounded" style={{ backgroundColor: CELL_COLORS.F }}></span>
          <span>Ice</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 rounded flex items-center justify-center text-sm" style={{ backgroundColor: CELL_COLORS.H }}>🕳️</span>
          <span>Hole</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 rounded flex items-center justify-center text-sm" style={{ backgroundColor: CELL_COLORS.G }}>⭐</span>
          <span>Goal</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 flex items-center justify-center bg-gray-700 rounded"><ArrowUp className="w-3 h-3" /></span>
          <span>Up</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 flex items-center justify-center bg-gray-700 rounded"><ArrowDown className="w-3 h-3" /></span>
          <span>Down</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 flex items-center justify-center bg-gray-700 rounded"><ArrowLeft className="w-3 h-3" /></span>
          <span>Left</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-5 h-5 flex items-center justify-center bg-gray-700 rounded"><ArrowRight className="w-3 h-3" /></span>
          <span>Right</span>
        </div>
      </div>

      {showValues && isTrained && values.length > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-500">Value:</span>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-1">{minValue.toFixed(1)}</span>
            <div
              className="w-20 h-2 rounded"
              style={{
                background: `linear-gradient(to right, rgb(200, 230, 255), rgb(50, 200, 205))`,
              }}
            ></div>
            <span className="text-xs text-gray-500 ml-1">{maxValue.toFixed(1)}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FrozenLakeCanvas;
