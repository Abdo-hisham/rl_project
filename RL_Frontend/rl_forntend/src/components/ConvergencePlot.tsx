import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ConvergencePlotProps {
  deltaHistory: number[];
  title?: string;
  theta?: number;
  compact?: boolean;
}

const ConvergencePlot: React.FC<ConvergencePlotProps> = ({
  deltaHistory,
  title = 'Convergence Plot',
  theta = 0.0001,
  compact = false,
}) => {
  const chartData = useMemo(() => {
    if (!deltaHistory || deltaHistory.length === 0) return [];

    return deltaHistory
      .map((delta, index) => ({
        iteration: index + 1,
        delta: delta > 0 ? delta : 1e-10,
      }))
      .filter(d => d.delta > 0);
  }, [deltaHistory]);

  const stats = useMemo(() => {
    if (!deltaHistory || deltaHistory.length === 0) {
      return { initial: 0, final: 0, iterations: 0, converged: false };
    }

    const validDeltas = deltaHistory.filter(d => d > 0);
    const final = validDeltas.length > 0 ? validDeltas[validDeltas.length - 1] : 0;
    return {
      initial: validDeltas.length > 0 ? validDeltas[0] : 0,
      final: final,
      iterations: deltaHistory.length,
      converged: final > 0 && final < theta,
    };
  }, [deltaHistory, theta]);

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [1e-6, 10];
    
    const deltas = chartData.map(d => d.delta).filter(d => d > 0);
    if (deltas.length === 0) return [1e-6, 10];
    
    const minDelta = Math.min(...deltas);
    const maxDelta = Math.max(...deltas);
    
    const minLog = Math.floor(Math.log10(Math.max(minDelta, 1e-10)));
    const maxLog = Math.ceil(Math.log10(Math.max(maxDelta, 1e-6)));
    
    return [Math.pow(10, minLog - 1), Math.pow(10, maxLog + 1)];
  }, [chartData]);

  if (!deltaHistory || deltaHistory.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        No convergence data available
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        Invalid delta values (all zero or negative)
      </div>
    );
  }

  const chartHeight = compact ? 200 : 280;

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>Iterations: <span className="text-blue-600 font-medium">{stats.iterations}</span></span>
          <span>Final Δ: <span className="text-purple-600 font-medium">{stats.final > 0 ? stats.final.toExponential(2) : 'N/A'}</span></span>
          <span>θ: <span className="text-orange-600 font-medium">{theta.toExponential(2)}</span></span>
          {stats.converged && (
            <span className="text-green-600 font-medium">✓ Converged</span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="iteration"
            stroke="#9ca3af"
            tick={{ fontSize: 10 }}
            label={{ value: 'Iteration', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 10 }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fontSize: 10 }}
            scale="log"
            domain={yDomain}
            tickFormatter={(value) => {
              if (value <= 0) return '0';
              return value.toExponential(0);
            }}
            label={{ value: 'Delta (log)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10, dx: 15 }}
            allowDataOverflow={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
            formatter={(value) => {
              const numValue = Number(value);
              return [numValue > 0 ? numValue.toExponential(4) : 'N/A', 'Delta'];
            }}
            labelFormatter={(label) => `Iteration ${label}`}
          />
          <Legend 
            wrapperStyle={{ fontSize: '11px' }}
            iconSize={10}
          />
          {theta > 0 && theta >= yDomain[0] && theta <= yDomain[1] && (
            <ReferenceLine 
              y={theta} 
              stroke="#f97316" 
              strokeDasharray="5 5" 
              label={{ value: 'θ', position: 'right', fill: '#f97316', fontSize: 10 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="delta"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={chartData.length < 50}
            name="Delta (max change)"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConvergencePlot;
