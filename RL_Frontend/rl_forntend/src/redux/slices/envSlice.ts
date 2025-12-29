import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { EnvironmentType } from '../../types/rl.types';

interface EnvironmentConfig {
  gridSize: number;
  agentPosition: [number, number];
  goalPosition: [number, number];
  isSlippery?: boolean;
  numBrickRows?: number;
}

interface BreakoutState {
  paddlePosition: number;
  ballPosition: [number, number];
  bricks: [number, number][];
  score: number;
}

interface EnvState {
  selectedEnvironment: EnvironmentType;
  config: EnvironmentConfig;
  isCreated: boolean;
  currentPosition: [number, number];
  isTerminated: boolean;
  breakoutState: BreakoutState | null;
}

const initialState: EnvState = {
  selectedEnvironment: 'gridworld',
  config: {
    gridSize: 4,
    agentPosition: [0, 0],
    goalPosition: [3, 3],
    isSlippery: false,
    numBrickRows: 2,
  },
  isCreated: false,
  currentPosition: [0, 0],
  isTerminated: false,
  breakoutState: null,
};

const envSlice = createSlice({
  name: 'environment',
  initialState,
  reducers: {
    setEnvironment: (state, action: PayloadAction<EnvironmentType>) => {
      state.selectedEnvironment = action.payload;
    },
    setGridSize: (state, action: PayloadAction<number>) => {
      state.config.gridSize = action.payload;
      if (state.config.goalPosition[0] >= action.payload) {
        state.config.goalPosition[0] = action.payload - 1;
      }
      if (state.config.goalPosition[1] >= action.payload) {
        state.config.goalPosition[1] = action.payload - 1;
      }
      if (state.config.agentPosition[0] >= action.payload) {
        state.config.agentPosition[0] = action.payload - 1;
      }
      if (state.config.agentPosition[1] >= action.payload) {
        state.config.agentPosition[1] = action.payload - 1;
      }
    },
    setAgentPosition: (state, action: PayloadAction<[number, number]>) => {
      state.config.agentPosition = action.payload;
    },
    setGoalPosition: (state, action: PayloadAction<[number, number]>) => {
      state.config.goalPosition = action.payload;
    },
    setEnvironmentCreated: (state, action: PayloadAction<boolean>) => {
      state.isCreated = action.payload;
      if (action.payload) {
        state.currentPosition = state.config.agentPosition;
        state.isTerminated = false;
      }
    },
    updateCurrentPosition: (state, action: PayloadAction<[number, number]>) => {
      state.currentPosition = action.payload;
    },
    setTerminated: (state, action: PayloadAction<boolean>) => {
      state.isTerminated = action.payload;
    },
    resetEnvironment: (state) => {
      state.currentPosition = state.config.agentPosition;
      state.isTerminated = false;
      state.breakoutState = null;
    },
    setSlippery: (state, action: PayloadAction<boolean>) => {
      state.config.isSlippery = action.payload;
    },
    setNumBrickRows: (state, action: PayloadAction<number>) => {
      state.config.numBrickRows = action.payload;
    },
    setBreakoutState: (state, action: PayloadAction<BreakoutState>) => {
      state.breakoutState = action.payload;
    },
    updatePaddlePosition: (state, action: PayloadAction<number>) => {
      if (state.breakoutState) {
        state.breakoutState.paddlePosition = action.payload;
      }
    },
    updateBallPosition: (state, action: PayloadAction<[number, number]>) => {
      if (state.breakoutState) {
        state.breakoutState.ballPosition = action.payload;
      }
    },
  },
});

export const {
  setEnvironment,
  setGridSize,
  setAgentPosition,
  setGoalPosition,
  setEnvironmentCreated,
  updateCurrentPosition,
  setTerminated,
  resetEnvironment,
  setSlippery,
  setNumBrickRows,
  setBreakoutState,
  updatePaddlePosition,
  updateBallPosition,
} = envSlice.actions;

export default envSlice.reducer;
