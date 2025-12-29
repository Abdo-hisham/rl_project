import React, { useMemo } from 'react';

interface ValueHeatmapProps {
  valueFunction: Record<string, number>;
  gridSize: number;
  title?: string;
  policy?: Record<string, number>;
  showPolicy?: boolean;
  colorScheme?: 'blue' | 'green' | 'heat';
}

const ValueHeatmap: React.FC<ValueHeatmapProps> = ({
  valueFunction,
  gridSize,
  title = 'Value Function',
  policy,
  showPolicy = true,
  colorScheme = 'heat',
}) => {
  const { gridValues, minValue, maxValue } = useMemo(() => {
    const grid: (number | null)[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(null)
    );
    
    let min = Infinity;
    let max = -Infinity;

    Object.entries(valueFunction).forEach(([key, value]) => {
      const match = key.match(/\((\d+),\s*(\d+)\)/);
      if (match) {
        const x = parseInt(match[1], 10);
        const y = parseInt(match[2], 10);
        if (x < gridSize && y < gridSize) {
          grid[y][x] = value;
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      }
    });

    return { gridValues: grid, minValue: min === Infinity ? 0 : min, maxValue: max === -Infinity ? 0 : max };
  }, [valueFunction, gridSize]);

  const policyGrid = useMemo(() => {
    if (!policy) return null;
    
    const grid: (number | null)[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(null)
    );

    Object.entries(policy).forEach(([key, action]) => {
      const match = key.match(/\((\d+),\s*(\d+)\)/);
      if (match) {
        const x = parseInt(match[1], 10);
        const y = parseInt(match[2], 10);
        if (x < gridSize && y < gridSize) {
          grid[y][x] = action;
        }
      }
    });

    return grid;
  }, [policy, gridSize]);

  const getColor = (value: number | null): string => {
    if (value === null) return 'rgb(31, 41, 55)'; // gray-800

    const range = maxValue - minValue || 1;
    const normalized = (value - minValue) / range;

    if (colorScheme === 'blue') {
      const intensity = Math.floor(normalized * 255);
      return `rgb(${255 - intensity}, ${255 - intensity}, 255)`;
    } else if (colorScheme === 'green') {
      const intensity = Math.floor(normalized * 255);
      return `rgb(${255 - intensity}, 255, ${255 - intensity})`;
    } else {
      if (normalized < 0.5) {
        const r = 255;
        const g = Math.floor(normalized * 2 * 255);
        return `rgb(${r}, ${g}, 0)`;
      } else {
        const r = Math.floor((1 - normalized) * 2 * 255);
        const g = 255;
        return `rgb(${r}, ${g}, 0)`;
      }
    }
  };

  const getArrow = (action: number | null): string => {
    if (action === null) return '';
    const arrows: Record<number, string> = {
      0: '↑', // Up
      1: '↓', // Down
      2: '←', // Left
      3: '→', // Right
    };
    return arrows[action] || '';
  };

  const cellSize = Math.min(60, 400 / gridSize);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
        <span>Min: <span className="text-red-400">{minValue.toFixed(2)}</span></span>
        <span>Max: <span className="text-green-400">{maxValue.toFixed(2)}</span></span>
        
        <div className="flex items-center gap-1">
          <span>Low</span>
          <div className="flex h-3 w-24">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-full"
                style={{ backgroundColor: getColor(minValue + (maxValue - minValue) * (i / 9)) }}
              />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
        }}
      >
        {gridValues.map((row, y) =>
          row.map((value, x) => (
            <div
              key={`${x}-${y}`}
              className="flex flex-col items-center justify-center rounded text-xs font-mono border border-gray-600"
              style={{
                backgroundColor: getColor(value),
                width: cellSize,
                height: cellSize,
              }}
            >
              {value !== null && (
                <>
                  <span className="text-gray-900 font-semibold">
                    {value.toFixed(1)}
                  </span>
                  {showPolicy && policyGrid && policyGrid[y][x] !== null && (
                    <span className="text-lg font-bold text-gray-900">
                      {getArrow(policyGrid[y][x])}
                    </span>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {showPolicy && policy && (
        <div className="mt-4 text-sm text-gray-400">
          <span className="font-semibold">Policy: </span>
          ↑ Up, ↓ Down, ← Left, → Right
        </div>
      )}
    </div>
  );
};

export default ValueHeatmap;
