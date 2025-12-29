import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AlgorithmType } from '../../types/rl.types';

interface AlgoState {
  selectedAlgorithm: AlgorithmType;
  isTrained: boolean;
  valueFunction: Record<string, number>;
  policy: Record<string, number>;
  qValues: Record<string, Record<string, number>>;
}

const initialState: AlgoState = {
  selectedAlgorithm: 'value_iteration',
  isTrained: false,
  valueFunction: {},
  policy: {},
  qValues: {},
};

const algoSlice = createSlice({
  name: 'algorithm',
  initialState,
  reducers: {
    setAlgorithm: (state, action: PayloadAction<AlgorithmType>) => {
      state.selectedAlgorithm = action.payload;
      state.isTrained = false;
    },
    setTrained: (state, action: PayloadAction<boolean>) => {
      state.isTrained = action.payload;
    },
    setValueFunction: (state, action: PayloadAction<Record<string, number>>) => {
      state.valueFunction = action.payload;
    },
    setPolicy: (state, action: PayloadAction<Record<string, number>>) => {
      state.policy = action.payload;
    },
    setQValues: (state, action: PayloadAction<Record<string, Record<string, number>>>) => {
      state.qValues = action.payload;
    },
    clearTraining: (state) => {
      state.isTrained = false;
      state.valueFunction = {};
      state.policy = {};
      state.qValues = {};
    },
  },
});

export const {
  setAlgorithm,
  setTrained,
  setValueFunction,
  setPolicy,
  setQValues,
  clearTraining,
} = algoSlice.actions;

export default algoSlice.reducer;
