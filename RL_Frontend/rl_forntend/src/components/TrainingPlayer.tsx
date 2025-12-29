import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../redux/store';
import { setTrained, setValueFunction, setPolicy, setQValues, clearTraining } from '../redux/slices/algoSlice';
import { setMode, setRunning, setProgress, setError } from '../redux/slices/simulationSlice';
import { runAlgorithm } from '../services/api';
import { getAlgorithmById } from '../types/rl.types';
import { useRealtimeTraining } from '../hooks/useRealtimeTraining';
import { Play, Square, RotateCcw, CheckCircle, AlertCircle, Wifi, WifiOff, Activity, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LearningCurve from './LearningCurve';
import ConvergencePlot from './ConvergencePlot';

const TrainingPlayer: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedAlgorithm } = useSelector((state: RootState) => state.algorithm);
  const { selectedEnvironment, config } = useSelector((state: RootState) => state.environment);
  const params = useSelector((state: RootState) => state.parameters);
  const { progress, error } = useSelector((state: RootState) => state.simulation);

  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'complete' | 'error'>('idle');
  const [useRealtime, setUseRealtime] = useState(true);
  const [showLearningCurve, setShowLearningCurve] = useState(false);

  const {
    isConnected: wsConnected,
    isTraining: wsTraining,
    currentEpisode,
    totalEpisodes,
    currentIteration,
    currentDelta,
    avgValue,
    avgReward,
    episodeRewards,
    deltaHistory,
    startTraining: startRealtimeTraining,
    stopTraining: stopRealtimeTraining,
  } = useRealtimeTraining();

  const algorithm = getAlgorithmById(selectedAlgorithm);
  const isRunning = trainingStatus === 'training' || wsTraining;

  const handleStartRealtimeTraining = useCallback(() => {
    if (isRunning) return;

    setTrainingStatus('training');
    dispatch(setMode('training'));
    dispatch(setProgress(0));
    dispatch(setError(null));
    dispatch(clearTraining());

    startRealtimeTraining({
      algorithm: selectedAlgorithm,
      environment: selectedEnvironment,
      gridSize: config.gridSize,
      agentPosition: config.agentPosition,
      goalPosition: config.goalPosition,
      gamma: params.gamma,
      theta: params.theta,
      numEpisodes: params.numEpisodes,
      alpha: params.alpha,
      epsilon: params.epsilon,
      isSlippery: config.isSlippery,
      numBrickRows: config.numBrickRows,
    });
  }, [dispatch, selectedAlgorithm, selectedEnvironment, config, params, isRunning, startRealtimeTraining]);

  const handleStartApiTraining = useCallback(async () => {
    if (isRunning) return;

    setTrainingStatus('training');
    dispatch(setRunning(true));
    dispatch(setMode('training'));
    dispatch(setProgress(0));
    dispatch(setError(null));
    dispatch(clearTraining());

    try {
      const result = await runAlgorithm({
        algorithm: selectedAlgorithm,
        gridSize: config.gridSize,
        agentPosition: config.agentPosition,
        goalPosition: config.goalPosition,
        gamma: params.gamma,
        theta: params.theta,
        numEpisodes: params.numEpisodes,
        alpha: params.alpha,
        epsilon: params.epsilon,
      });

      if (result.valueFunction) {
        dispatch(setValueFunction(result.valueFunction));
      }
      if (result.policy) {
        dispatch(setPolicy(result.policy));
      }
      if (result.qValues) {
        dispatch(setQValues(result.qValues));
      }

      dispatch(setTrained(true));
      dispatch(setProgress(100));
      setTrainingStatus('complete');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Training failed';
      dispatch(setError(message));
      setTrainingStatus('error');
    } finally {
      dispatch(setRunning(false));
      dispatch(setMode('idle'));
    }
  }, [dispatch, selectedAlgorithm, config, params, isRunning]);

  const handleStartTraining = useCallback(() => {
    if (useRealtime && wsConnected) {
      handleStartRealtimeTraining();
    } else {
      handleStartApiTraining();
    }
  }, [useRealtime, wsConnected, handleStartRealtimeTraining, handleStartApiTraining]);

  const handleStopTraining = useCallback(() => {
    stopRealtimeTraining();
    setTrainingStatus('idle');
    dispatch(setRunning(false));
    dispatch(setMode('idle'));
  }, [stopRealtimeTraining, dispatch]);

  const handleReset = useCallback(() => {
    stopRealtimeTraining();
    dispatch(clearTraining());
    dispatch(setProgress(0));
    dispatch(setError(null));
    setTrainingStatus('idle');
  }, [dispatch, stopRealtimeTraining]);

  React.useEffect(() => {
    if (!wsTraining && trainingStatus === 'training' && progress >= 100) {
      setTrainingStatus('complete');
    }
  }, [wsTraining, trainingStatus, progress]);

  const isDPAlgorithm = selectedAlgorithm === 'value_iteration' || selectedAlgorithm === 'policy_iteration';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Training</h2>
        <div className="flex items-center gap-2">
          {algorithm && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {algorithm.name}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm text-gray-600">Real-time mode</span>
        </div>
        <button
          onClick={() => setUseRealtime(!useRealtime)}
          disabled={isRunning}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            useRealtime ? 'bg-blue-600' : 'bg-gray-300'
          } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              useRealtime ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-mono text-gray-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              trainingStatus === 'error'
                ? 'bg-red-500'
                : trainingStatus === 'complete'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isRunning && useRealtime && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-blue-700">Live Training Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {isDPAlgorithm ? (
                <>
                  <div>
                    <span className="text-gray-500">Iteration:</span>
                    <span className="ml-2 font-mono text-blue-700">{currentIteration}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Delta:</span>
                    <span className="ml-2 font-mono text-blue-700">{currentDelta.toExponential(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-gray-500">Episode:</span>
                    <span className="ml-2 font-mono text-blue-700">{currentEpisode}/{totalEpisodes}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg Reward:</span>
                    <span className="ml-2 font-mono text-blue-700">{avgReward.toFixed(3)}</span>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <span className="text-gray-500">Avg Value:</span>
                <span className="ml-2 font-mono text-blue-700">{avgValue.toFixed(4)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {trainingStatus === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700">Training completed successfully!</span>
          </motion.div>
        )}

        {trainingStatus === 'error' && error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        {isRunning ? (
          <button
            onClick={handleStopTraining}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
          >
            <Square className="w-5 h-5" />
            Stop Training
          </button>
        ) : (
          <button
            onClick={handleStartTraining}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
          >
            <Play className="w-5 h-5" />
            Start Training
          </button>
        )}

        <button
          onClick={handleReset}
          disabled={isRunning}
          className={`px-4 py-3 rounded-lg font-medium transition-all ${
            isRunning
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {((isDPAlgorithm && deltaHistory.length > 0) || (!isDPAlgorithm && episodeRewards.length > 0) || trainingStatus === 'complete') && (
        <div className="mt-4">
          <button
            onClick={() => setShowLearningCurve(!showLearningCurve)}
            className="flex items-center justify-between w-full px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {isDPAlgorithm ? 'Convergence Plot' : 'Learning Curve'}
              </span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                {isDPAlgorithm ? `${deltaHistory.length} iterations` : `${episodeRewards.length} episodes`}
              </span>
            </div>
            {showLearningCurve ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          <AnimatePresence>
            {showLearningCurve && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 overflow-hidden"
              >
                {isDPAlgorithm ? (
                  deltaHistory.length > 0 && (
                    <ConvergencePlot 
                      deltaHistory={deltaHistory} 
                      title="Value Iteration Convergence"
                      theta={params.theta}
                      compact
                    />
                  )
                ) : (
                  episodeRewards.length > 0 && (
                    <LearningCurve 
                      episodeRewards={episodeRewards} 
                      title="Episode Rewards"
                      windowSize={Math.max(5, Math.floor(episodeRewards.length / 10))}
                      compact
                    />
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default TrainingPlayer;
