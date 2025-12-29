import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { setConnectionStatus } from '../redux/slices/simulationSlice';
import { setEnvironmentCreated } from '../redux/slices/envSlice';
import { getEnvironmentInfo, getAlgorithmsInfo, createEnvironment } from '../services/api';

interface UseBackendReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: string;
  checkConnection: () => Promise<boolean>;
  initializeEnvironment: () => Promise<void>;
}

export function useBackend(): UseBackendReturn {
  const dispatch = useDispatch();
  const { connectionStatus } = useSelector((state: RootState) => state.simulation);
  const { selectedEnvironment, config } = useSelector((state: RootState) => state.environment);
  const connectionChecked = useRef(false);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    dispatch(setConnectionStatus('connecting'));
    
    try {
      await getEnvironmentInfo();
      await getAlgorithmsInfo();
      dispatch(setConnectionStatus('connected'));
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      dispatch(setConnectionStatus('error'));
      return false;
    }
  }, [dispatch]);

  const initializeEnvironment = useCallback(async () => {
    try {
      await createEnvironment({
        environment: selectedEnvironment,
        gridSize: config.gridSize,
        agentPosition: config.agentPosition,
        goalPosition: config.goalPosition,
      });
      dispatch(setEnvironmentCreated(true));
    } catch (error) {
      console.error('Failed to initialize environment:', error);
      dispatch(setEnvironmentCreated(false));
    }
  }, [dispatch, selectedEnvironment, config]);

  useEffect(() => {
    if (!connectionChecked.current) {
      connectionChecked.current = true;
      checkConnection().then((connected) => {
        if (connected) {
          initializeEnvironment();
        }
      });
    }
  }, [checkConnection, initializeEnvironment]);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      initializeEnvironment();
    }
  }, [config.gridSize, config.agentPosition, config.goalPosition, connectionStatus, initializeEnvironment]);

  return {
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    connectionStatus,
    checkConnection,
    initializeEnvironment,
  };
}

export default useBackend;
