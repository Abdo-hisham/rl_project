import React, { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface LearningCurveProps {
  episodeRewards: number[];
  title?: string;
  windowSize?: number;
  showRaw?: boolean;
  showSmoothed?: boolean;
  compact?: boolean;
}

const LearningCurve: React.FC<LearningCurveProps> = ({
  episodeRewards,
  title = 'Learning Curve',
  windowSize = 10,
  showRaw = true,
  showSmoothed = true,
  compact = false,
}) => {
  const chartData = useMemo(() => {
    if (!episodeRewards || episodeRewards.length === 0) return [];

    return episodeRewards.map((reward, index) => {
      const start = Math.max(0, index - windowSize + 1);
      const window = episodeRewards.slice(start, index + 1);
      const avgReward = window.reduce((a, b) => a + b, 0) / window.length;

      return {
        episode: index + 1,
        reward: reward,
        avgReward: Number(avgReward.toFixed(3)),
      };
    });
  }, [episodeRewards, windowSize]);

  const stats = useMemo(() => {
    if (!episodeRewards || episodeRewards.length === 0) {
      return { min: 0, max: 0, mean: 0, final: 0 };
    }

    const mean = episodeRewards.reduce((a, b) => a + b, 0) / episodeRewards.length;
    const lastN = episodeRewards.slice(-Math.min(50, episodeRewards.length));
    const finalMean = lastN.reduce((a, b) => a + b, 0) / lastN.length;

    return {
      min: Math.min(...episodeRewards),
      max: Math.max(...episodeRewards),
      mean: Number(mean.toFixed(2)),
      final: Number(finalMean.toFixed(2)),
    };
  }, [episodeRewards]);

  if (!episodeRewards || episodeRewards.length === 0) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        No learning data available
      </div>
    );
  }

  const chartHeight = compact ? 200 : 280;

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>Min: <span className="text-red-600 font-medium">{stats.min.toFixed(2)}</span></span>
          <span>Max: <span className="text-green-600 font-medium">{stats.max.toFixed(2)}</span></span>
          <span>Mean: <span className="text-blue-600 font-medium">{stats.mean}</span></span>
          <span>Final: <span className="text-purple-600 font-medium">{stats.final}</span></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorReward" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="episode"
            stroke="#9ca3af"
            tick={{ fontSize: 10 }}
            label={{ value: 'Episode', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 10 }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fontSize: 10 }}
            label={{ value: 'Reward', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10, dx: 10 }}
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
          />
          <Legend 
            wrapperStyle={{ fontSize: '11px' }}
            iconSize={10}
          />
          {showRaw && (
            <Area
              type="monotone"
              dataKey="reward"
              stroke="#3b82f6"
              strokeWidth={1}
              fill="url(#colorReward)"
              name="Episode Reward"
              dot={false}
            />
          )}
          {showSmoothed && (
            <Line
              type="monotone"
              dataKey="avgReward"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name={`Moving Avg (${windowSize})`}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LearningCurve;
