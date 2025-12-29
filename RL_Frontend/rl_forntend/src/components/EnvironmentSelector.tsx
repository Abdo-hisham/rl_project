import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { setEnvironment, setGridSize, setAgentPosition, setGoalPosition, setSlippery, setNumBrickRows } from '../redux/slices/envSlice';
import { ENVIRONMENTS } from '../types/rl.types';
import type { EnvironmentType } from '../types/rl.types';
import { Grid3X3, Target, Play, Info, Snowflake, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

const EnvironmentSelector: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedEnvironment, config } = useSelector((state: RootState) => state.environment);

  const currentEnv = ENVIRONMENTS.find((e) => e.id === selectedEnvironment);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Grid3X3 className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Environment</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Select Environment
          </label>
          <div className="grid gap-2">
            {ENVIRONMENTS.map((env) => (
              <button
                key={env.id}
                onClick={() => dispatch(setEnvironment(env.id as EnvironmentType))}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedEnvironment === env.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{env.name}</span>
                  {selectedEnvironment === env.id && (
                    <Play className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{env.description}</p>
              </button>
            ))}
          </div>
        </div>

        {currentEnv && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Configuration</span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-600">Grid Size</label>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {config.gridSize}×{config.gridSize}
                </span>
              </div>
              <input
                type="range"
                min={selectedEnvironment === 'frozen_lake' ? 4 : 3}
                max={selectedEnvironment === 'frozen_lake' ? 8 : 10}
                step={selectedEnvironment === 'frozen_lake' ? 4 : 1}
                value={config.gridSize}
                onChange={(e) => dispatch(setGridSize(parseInt(e.target.value)))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{selectedEnvironment === 'frozen_lake' ? '4×4' : '3×3'}</span>
                <span>{selectedEnvironment === 'frozen_lake' ? '8×8' : '10×10'}</span>
              </div>
            </div>

            {selectedEnvironment === 'gridworld' && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <label className="text-sm text-gray-600">Agent Start Position</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">X</label>
                    <input
                      type="number"
                      min={0}
                      max={config.gridSize - 1}
                      value={config.agentPosition[0]}
                      onChange={(e) =>
                        dispatch(setAgentPosition([parseInt(e.target.value), config.agentPosition[1]]))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Y</label>
                    <input
                      type="number"
                      min={0}
                      max={config.gridSize - 1}
                      value={config.agentPosition[1]}
                      onChange={(e) =>
                        dispatch(setAgentPosition([config.agentPosition[0], parseInt(e.target.value)]))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedEnvironment === 'gridworld' && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-3 h-3 text-green-500" />
                  <label className="text-sm text-gray-600">Goal Position</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">X</label>
                    <input
                      type="number"
                      min={0}
                      max={config.gridSize - 1}
                      value={config.goalPosition[0]}
                      onChange={(e) =>
                        dispatch(setGoalPosition([parseInt(e.target.value), config.goalPosition[1]]))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Y</label>
                    <input
                      type="number"
                      min={0}
                      max={config.gridSize - 1}
                      value={config.goalPosition[1]}
                      onChange={(e) =>
                        dispatch(setGoalPosition([config.goalPosition[0], parseInt(e.target.value)]))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedEnvironment === 'frozen_lake' && (
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-cyan-500" />
                    <label className="text-sm text-gray-600">Slippery Ice</label>
                  </div>
                  <button
                    onClick={() => dispatch(setSlippery(!config.isSlippery))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.isSlippery ? 'bg-cyan-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.isSlippery ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {config.isSlippery 
                    ? 'Agent may slip in random direction' 
                    : 'Agent moves deterministically'}
                </p>
              </div>
            )}

            {selectedEnvironment === 'breakout' && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-orange-500" />
                    <label className="text-sm text-gray-600">Brick Rows</label>
                  </div>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {config.numBrickRows}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={1}
                  value={config.numBrickRows || 2}
                  onChange={(e) => dispatch(setNumBrickRows(parseInt(e.target.value)))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 row</span>
                  <span>3 rows</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EnvironmentSelector;
