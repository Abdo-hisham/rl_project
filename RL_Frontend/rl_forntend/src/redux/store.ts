import { configureStore } from '@reduxjs/toolkit';
import envReducer from './slices/envSlice';
import algoReducer from './slices/algoSlice';
import paramReducer from './slices/paramSlice';
import simulationReducer from './slices/simulationSlice';

export const store = configureStore({
  reducer: {
    environment: envReducer,
    algorithm: algoReducer,
    parameters: paramReducer,
    simulation: simulationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
