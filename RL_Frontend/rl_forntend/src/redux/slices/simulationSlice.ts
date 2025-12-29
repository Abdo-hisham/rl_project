import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ConnectionStatus, Trajectory } from '../../types';

type SimulationMode = 'idle' | 'training' | 'inference';

interface SimulationState {
  mode: SimulationMode;
  isRunning: boolean;
  progress: number;
  currentEpisode: number;
  totalEpisodes: number;
  connectionStatus: ConnectionStatus;
  trajectory: Trajectory[];
  currentStep: number;
  playbackSpeed: number;
  totalReward: number;
  reachedGoal: boolean;
  error: string | null;
}

const initialState: SimulationState = {
  mode: 'idle',
  isRunning: false,
  progress: 0,
  currentEpisode: 0,
  totalEpisodes: 0,
  connectionStatus: 'disconnected',
  trajectory: [],
  currentStep: 0,
  playbackSpeed: 500,
  totalReward: 0,
  reachedGoal: false,
  error: null,
};

const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<SimulationMode>) => {
      state.mode = action.payload;
    },
    setRunning: (state, action: PayloadAction<boolean>) => {
      state.isRunning = action.payload;
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    setEpisodeProgress: (state, action: PayloadAction<{ current: number; total: number }>) => {
      state.currentEpisode = action.payload.current;
      state.totalEpisodes = action.payload.total;
      state.progress = (action.payload.current / action.payload.total) * 100;
    },
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },
    setTrajectory: (state, action: PayloadAction<Trajectory[]>) => {
      state.trajectory = action.payload;
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    incrementStep: (state) => {
      if (state.currentStep < state.trajectory.length - 1) {
        state.currentStep += 1;
      }
    },
    setPlaybackSpeed: (state, action: PayloadAction<number>) => {
      state.playbackSpeed = action.payload;
    },
    setSimulationResult: (state, action: PayloadAction<{ totalReward: number; reachedGoal: boolean }>) => {
      state.totalReward = action.payload.totalReward;
      state.reachedGoal = action.payload.reachedGoal;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetSimulation: (state) => {
      state.mode = 'idle';
      state.isRunning = false;
      state.progress = 0;
      state.trajectory = [];
      state.currentStep = 0;
      state.totalReward = 0;
      state.reachedGoal = false;
      state.error = null;
    },
  },
});

export const {
  setMode,
  setRunning,
  setProgress,
  setEpisodeProgress,
  setConnectionStatus,
  setTrajectory,
  setCurrentStep,
  incrementStep,
  setPlaybackSpeed,
  setSimulationResult,
  setError,
  resetSimulation,
} = simulationSlice.actions;

export default simulationSlice.reducer;
