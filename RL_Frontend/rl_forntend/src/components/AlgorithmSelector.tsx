import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { setAlgorithm } from '../redux/slices/algoSlice';
import { ALGORITHMS } from '../types/rl.types';
import type { AlgorithmType } from '../types/rl.types';
import { Brain, Zap, BarChart3, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryIcons = {
  dp: <Zap className="w-4 h-4" />,
  mc: <BarChart3 className="w-4 h-4" />,
  td: <Brain className="w-4 h-4" />,
};

const categoryColors = {
  dp: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  mc: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  td: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
};

const categoryNames = {
  dp: 'Dynamic Programming',
  mc: 'Monte Carlo',
  td: 'Temporal Difference',
};

const AlgorithmSelector: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedAlgorithm, isTrained } = useSelector((state: RootState) => state.algorithm);

  const groupedAlgorithms = ALGORITHMS.reduce((acc, algo) => {
    if (!acc[algo.category]) {
      acc[algo.category] = [];
    }
    acc[algo.category].push(algo);
    return acc;
  }, {} as Record<string, typeof ALGORITHMS>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-50 rounded-lg">
          <Brain className="w-5 h-5 text-purple-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Algorithm</h2>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedAlgorithms).map(([category, algorithms]) => (
          <div key={category}>
            <div className={`flex items-center gap-2 mb-2 ${categoryColors[category as keyof typeof categoryColors].text}`}>
              {categoryIcons[category as keyof typeof categoryIcons]}
              <span className="text-sm font-medium">{categoryNames[category as keyof typeof categoryNames]}</span>
            </div>
            <div className="space-y-2">
              {algorithms.map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => dispatch(setAlgorithm(algo.id as AlgorithmType))}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    selectedAlgorithm === algo.id
                      ? `${categoryColors[algo.category].border} ${categoryColors[algo.category].bg}`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800 text-sm">{algo.name}</span>
                    <div className="flex items-center gap-2">
                      {isTrained && selectedAlgorithm === algo.id && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Trained
                        </span>
                      )}
                      {selectedAlgorithm === algo.id && (
                        <div className={`w-2 h-2 rounded-full ${categoryColors[algo.category].text.replace('text', 'bg')}`}></div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{algo.description}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AlgorithmSelector;
