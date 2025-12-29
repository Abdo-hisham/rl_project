import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { setParameter } from '../redux/slices/paramSlice';
import { getAlgorithmById } from '../types/rl.types';
import { Settings, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ParameterSliderProps {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description: string;
  onChange: (value: number) => void;
}

const ParameterSliderItem: React.FC<ParameterSliderProps> = ({
  name,
  value,
  min,
  max,
  step,
  description,
  onChange,
}) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const formatValue = (val: number) => {
    if (step < 0.01) return val.toFixed(4);
    if (step < 1) return val.toFixed(2);
    return val.toString();
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">{name}</label>
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10"
              >
                {description}
                <div className="absolute left-2 top-full border-4 border-transparent border-t-gray-800"></div>
              </motion.div>
            )}
          </div>
        </div>
        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
          {formatValue(value)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};

const ParameterSlider: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedAlgorithm } = useSelector((state: RootState) => state.algorithm);
  const params = useSelector((state: RootState) => state.parameters);

  const algorithm = getAlgorithmById(selectedAlgorithm);

  if (!algorithm) return null;

  const paramKeyMap: Record<string, keyof typeof params> = {
    gamma: 'gamma',
    theta: 'theta',
    num_episodes: 'numEpisodes',
    alpha: 'alpha',
    epsilon: 'epsilon',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Settings className="w-5 h-5 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Parameters</h2>
      </div>

      <div className="space-y-2">
        {algorithm.parameters.map((param) => {
          const stateKey = paramKeyMap[param.key];
          if (!stateKey) return null;

          return (
            <ParameterSliderItem
              key={param.key}
              name={param.name}
              value={params[stateKey]}
              min={param.min}
              max={param.max}
              step={param.step}
              description={param.description}
              onChange={(value) => dispatch(setParameter({ key: stateKey, value }))}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

export default ParameterSlider;
