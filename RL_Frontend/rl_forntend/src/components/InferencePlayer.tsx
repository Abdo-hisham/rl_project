import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../redux/store';
import { updateCurrentPosition, resetEnvironment, setBreakoutState } from '../redux/slices/envSlice';
import {
  setMode,
  setRunning,
  setTrajectory,
  setCurrentStep,
  setPlaybackSpeed,
  setSimulationResult,
  resetSimulation,
} from '../redux/slices/simulationSlice';
import { simulatePolicy, createEnvironment } from '../services/api';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronRight,
  ChevronLeft,
  Trophy,
  XCircle,
  Gauge,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SPEED_OPTIONS = [
  { label: '0.5x', value: 1000 },
  { label: '1x', value: 500 },
  { label: '2x', value: 250 },
  { label: '4x', value: 125 },
];

const InferencePlayer: React.FC = () => {
  const dispatch = useDispatch();
  const { isTrained, policy } = useSelector((state: RootState) => state.algorithm);
  const { selectedEnvironment, config } = useSelector((state: RootState) => state.environment);
  const { trajectory, currentStep, playbackSpeed, totalReward, reachedGoal, isRunning } = useSelector(
    (state: RootState) => state.simulation
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (trajectory.length > 0 && currentStep < trajectory.length) {
      const step = trajectory[currentStep];
      const pos = step.agentPosition as [number, number];
      dispatch(updateCurrentPosition(pos));
      
      if (selectedEnvironment === 'breakout' && step.paddlePosition !== undefined) {
        dispatch(setBreakoutState({
          paddlePosition: step.paddlePosition,
          ballPosition: (step.ballPosition as [number, number]) || [pos[0], pos[1]],
          bricks: [],
          score: 0
        }));
      }
    }
  }, [currentStep, trajectory, dispatch, selectedEnvironment]);

  useEffect(() => {
    if (isPlaying && currentStep < trajectory.length - 1) {
      intervalRef.current = setInterval(() => {
        dispatch(setCurrentStep(currentStep + 1));
      }, playbackSpeed);
    } else if (currentStep >= trajectory.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentStep, trajectory.length, playbackSpeed, dispatch]);

  const handleSimulate = useCallback(async () => {
    if (!isTrained) return;

    dispatch(setRunning(true));
    dispatch(setMode('inference'));
    dispatch(resetEnvironment());

    try {
      await createEnvironment({
        environment: selectedEnvironment,
        gridSize: config.gridSize,
        agentPosition: config.agentPosition,
        goalPosition: config.goalPosition,
        isSlippery: config.isSlippery,
        numBrickRows: config.numBrickRows,
      });

      const result = await simulatePolicy({
        maxSteps: 100,
        agentPosition: config.agentPosition,
        goalPosition: config.goalPosition,
        gridSize: config.gridSize,
        gamma: 0.99,
        environment: selectedEnvironment,
        policy: policy,  // Pass the trained policy
      });

      dispatch(setTrajectory(result.trajectory));
      dispatch(setSimulationResult({
        totalReward: result.totalReward,
        reachedGoal: result.reachedGoal,
      }));
      dispatch(setCurrentStep(0));
      setHasSimulated(true);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      dispatch(setRunning(false));
    }
  }, [dispatch, isTrained, config, selectedEnvironment, policy]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    dispatch(setCurrentStep(0));
    dispatch(resetEnvironment());
  }, [dispatch]);

  const handleStepForward = useCallback(() => {
    if (currentStep < trajectory.length - 1) {
      dispatch(setCurrentStep(currentStep + 1));
    }
  }, [currentStep, trajectory.length, dispatch]);

  const handleStepBackward = useCallback(() => {
    if (currentStep > 0) {
      dispatch(setCurrentStep(currentStep - 1));
    }
  }, [currentStep, dispatch]);

  const handleSpeedChange = useCallback(
    (speed: number) => {
      dispatch(setPlaybackSpeed(speed));
    },
    [dispatch]
  );

  const currentTrajectoryItem = trajectory[currentStep];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Inference</h2>
        {!isTrained && (
          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            Train model first
          </span>
        )}
      </div>

      {!hasSimulated && (
        <button
          onClick={handleSimulate}
          disabled={!isTrained || isRunning}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all mb-4 ${
            !isTrained || isRunning
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
          }`}
        >
          <Play className="w-5 h-5" />
          Simulate Policy
        </button>
      )}

      {hasSimulated && trajectory.length > 0 && (
        <>
          <AnimatePresence>
            {currentStep === trajectory.length - 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
                  reachedGoal ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {reachedGoal ? (
                    <>
                      <Trophy className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Goal Reached!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-700 font-medium">Max Steps Reached</span>
                    </>
                  )}
                </div>
                <span className="text-sm font-mono">
                  Reward: {totalReward.toFixed(1)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">
                Step {currentStep + 1} of {trajectory.length}
              </span>
              {currentTrajectoryItem?.actionName && (
                <span className="text-sm text-gray-500">
                  Action: <span className="font-medium">{currentTrajectoryItem.actionName}</span>
                </span>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={trajectory.length - 1}
              value={currentStep}
              onChange={(e) => dispatch(setCurrentStep(parseInt(e.target.value)))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              title="Reset"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={handleStepBackward}
              disabled={currentStep === 0}
              className={`p-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Step Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-3 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button
              onClick={handleStepForward}
              disabled={currentStep >= trajectory.length - 1}
              className={`p-2 rounded-lg transition-colors ${
                currentStep >= trajectory.length - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Step Forward"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => dispatch(setCurrentStep(trajectory.length - 1))}
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              title="Skip to End"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Gauge className="w-4 h-4" />
              <span className="text-sm">Speed:</span>
            </div>
            <div className="flex gap-1">
              {SPEED_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSpeedChange(option.value)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    playbackSpeed === option.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setHasSimulated(false);
              dispatch(resetSimulation());
              dispatch(resetEnvironment());
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            New Simulation
          </button>
        </>
      )}
    </motion.div>
  );
};

export default InferencePlayer;
