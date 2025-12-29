import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Target, Bot } from 'lucide-react';

interface VisualizationCanvasProps {
  showValues?: boolean;
  showPolicy?: boolean;
  highlightedCell?: [number, number] | null;
  animatedPosition?: [number, number] | null;
}

const ACTION_ARROWS: Record<number, React.ReactNode> = {
  0: <ArrowUp className="w-4 h-4 text-gray-600" />,
  1: <ArrowDown className="w-4 h-4 text-gray-600" />,
  2: <ArrowLeft className="w-4 h-4 text-gray-600" />,
  3: <ArrowRight className="w-4 h-4 text-gray-600" />,
};

const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
  showValues = true,
  showPolicy = true,
  highlightedCell = null,
  animatedPosition = null,
}) => {
  const { config, currentPosition } = useSelector((state: RootState) => state.environment);
  const { valueFunction, policy, isTrained } = useSelector((state: RootState) => state.algorithm);

  const { gridSize, goalPosition } = config;
  const displayPosition = animatedPosition || currentPosition;

  const values = Object.values(valueFunction);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 1;
  const valueRange = maxValue - minValue || 1;

  const getValueColor = (value: number) => {
    const normalized = (value - minValue) / valueRange;
    const r = Math.round(255 - normalized * 200);
    const g = Math.round(255 - normalized * 50);
    const b = Math.round(255 - normalized * 200);
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

  const isAgent = (x: number, y: number) =>
    displayPosition[0] === x && displayPosition[1] === y;

  const isGoal = (x: number, y: number) =>
    goalPosition[0] === x && goalPosition[1] === y;

  const isHighlighted = (x: number, y: number) =>
    highlightedCell && highlightedCell[0] === x && highlightedCell[1] === y;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Gridworld</h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Agent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Goal</span>
          </div>
        </div>
      </div>

      <div
        className="grid gap-1 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          maxWidth: Math.min(gridSize * 70, 500),
        }}
      >
        {Array.from({ length: gridSize }).map((_, y) =>
          Array.from({ length: gridSize }).map((_, x) => {
            const value = getValue(x, y);
            const action = getAction(x, y);
            const isGoalCell = isGoal(x, y);
            const isAgentCell = isAgent(x, y);
            const isHighlightedCell = isHighlighted(x, y);

            return (
              <motion.div
                key={`${x}-${y}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (x + y) * 0.02 }}
                className={`
                  relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center
                  transition-all duration-200
                  ${isGoalCell ? 'border-green-500 bg-green-100' : ''}
                  ${isHighlightedCell ? 'border-yellow-500 ring-2 ring-yellow-300' : ''}
                  ${!isGoalCell && !isHighlightedCell ? 'border-gray-200' : ''}
                `}
                style={{
                  backgroundColor:
                    isGoalCell
                      ? undefined
                      : showValues && value !== null
                      ? getValueColor(value)
                      : '#f9fafb',
                  minHeight: 50,
                }}
              >
                {isGoalCell && (
                  <Target className="w-6 h-6 text-green-600 absolute" />
                )}

                {isAgentCell && (
                  <motion.div
                    layoutId="agent"
                    className="absolute z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  </motion.div>
                )}

                {showValues && value !== null && !isAgentCell && (
                  <span className="text-xs font-mono text-gray-700">
                    {value.toFixed(1)}
                  </span>
                )}

                {showPolicy && action !== null && !isGoalCell && !isAgentCell && isTrained && (
                  <div className="absolute bottom-1">
                    {ACTION_ARROWS[action]}
                  </div>
                )}

                <span className="absolute top-0.5 left-1 text-[8px] text-gray-400">
                  {x},{y}
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      {showValues && isTrained && values.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-500">Value:</span>
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-1">{minValue.toFixed(1)}</span>
            <div
              className="w-32 h-3 rounded"
              style={{
                background: `linear-gradient(to right, ${getValueColor(minValue)}, ${getValueColor(maxValue)})`,
              }}
            ></div>
            <span className="text-xs text-gray-500 ml-1">{maxValue.toFixed(1)}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VisualizationCanvas;
