import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ParamState {
  gamma: number;
  theta: number;
  numEpisodes: number;
  alpha: number;
  epsilon: number;
}

const initialState: ParamState = {
  gamma: 0.99,
  theta: 0.0001,
  numEpisodes: 1000,
  alpha: 0.1,
  epsilon: 0.1,
};

const paramSlice = createSlice({
  name: 'parameters',
  initialState,
  reducers: {
    setGamma: (state, action: PayloadAction<number>) => {
      state.gamma = action.payload;
    },
    setTheta: (state, action: PayloadAction<number>) => {
      state.theta = action.payload;
    },
    setNumEpisodes: (state, action: PayloadAction<number>) => {
      state.numEpisodes = action.payload;
    },
    setAlpha: (state, action: PayloadAction<number>) => {
      state.alpha = action.payload;
    },
    setEpsilon: (state, action: PayloadAction<number>) => {
      state.epsilon = action.payload;
    },
    setParameter: (state, action: PayloadAction<{ key: keyof ParamState; value: number }>) => {
      state[action.payload.key] = action.payload.value;
    },
    resetParameters: () => initialState,
  },
});

export const {
  setGamma,
  setTheta,
  setNumEpisodes,
  setAlpha,
  setEpsilon,
  setParameter,
  resetParameters,
} = paramSlice.actions;

export default paramSlice.reducer;
