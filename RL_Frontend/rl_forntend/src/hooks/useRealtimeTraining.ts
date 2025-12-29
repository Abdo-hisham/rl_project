import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setValueFunction, setPolicy, setTrained } from '../redux/slices/algoSlice';
import { setProgress } from '../redux/slices/simulationSlice';
import { updateCurrentPosition, setBreakoutState } from '../redux/slices/envSlice';
import type { AlgorithmType, EnvironmentType } from '../types/rl.types';

interface TrainingConfig {
  algorithm: AlgorithmType;
  environment: EnvironmentType;
  gridSize: number;
  agentPosition: [number, number];
  goalPosition: [number, number];
  gamma: number;
  theta: number;
  numEpisodes: number;
  alpha: number;
  epsilon: number;
  isSlippery?: boolean;
  numBrickRows?: number;
  nSteps?: number;
}

interface GridworldTrajectoryStep {
  step: number;
  position: [number, number];
  action: number;
  reward: number;
}

interface FrozenLakeTrajectoryStep {
  step: number;
  position: [number, number];
  action: number;
  reward: number;
  cell_type: string;
}

interface BreakoutTrajectoryStep {
  step: number;
  paddle_position: number;
  ball_position: [number, number];
  ball_direction: number;
  action: number;
  reward: number;
}

type TrajectoryStep = GridworldTrajectoryStep | FrozenLakeTrajectoryStep | BreakoutTrajectoryStep;

interface TrainingUpdate {
  type: string;
  episode?: number;
  total_episodes?: number;
  progress?: number;
  iteration?: number;
  delta?: number;
  converged?: boolean;
  sample_values?: Record<string, number>;
  value_function?: Record<string, number>;
  policy?: Record<string, number>;
  avg_value?: number;
  avg_reward?: number;
  episode_reward?: number;
  states_evaluated?: number;
  trajectory?: TrajectoryStep[];
  episode_length?: number;
  environment?: string;
  episode_rewards?: number[];
  n_steps?: number;
}

interface UseRealtimeTrainingReturn {
  isConnected: boolean;
  isTraining: boolean;
  currentEpisode: number;
  totalEpisodes: number;
  currentIteration: number;
  currentDelta: number;
  avgValue: number;
  avgReward: number;
  episodeRewards: number[];
  deltaHistory: number[];
  agentPosition: [number, number] | null;
  currentTrajectory: TrajectoryStep[];
  startTraining: (config: TrainingConfig) => void;
  stopTraining: () => void;
}

export function useRealtimeTraining(): UseRealtimeTrainingReturn {
  const dispatch = useDispatch();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [currentDelta, setCurrentDelta] = useState(0);
  const [avgValue, setAvgValue] = useState(0);
  const [avgReward, setAvgReward] = useState(0);
  const [episodeRewards, setEpisodeRewards] = useState<number[]>([]);
  const [deltaHistory, setDeltaHistory] = useState<number[]>([]);
  const [agentPosition, setAgentPosition] = useState<[number, number] | null>(null);
  const [currentTrajectory, setCurrentTrajectory] = useState<TrajectoryStep[]>([]);
  const [currentEnvironment, setCurrentEnvironment] = useState<string>('gridworld');
  const animationRef = useRef<number | null>(null);
  const animationQueueRef = useRef<TrajectoryStep[][]>([]);
  const isAnimatingRef = useRef<boolean>(false);

  const updatePositionFromStep = useCallback((step: TrajectoryStep, _environment: string) => {
    if ('paddle_position' in step) {
      const breakoutStep = step as BreakoutTrajectoryStep;
      dispatch(setBreakoutState({
        paddlePosition: breakoutStep.paddle_position,
        ballPosition: breakoutStep.ball_position,
        bricks: [],
        score: 0
      }));
      dispatch(updateCurrentPosition([breakoutStep.paddle_position, breakoutStep.ball_position[1]]));
      setAgentPosition([breakoutStep.paddle_position, breakoutStep.ball_position[1]]);
    } else if ('position' in step) {
      const pos = step.position as [number, number];
      setAgentPosition(pos);
      dispatch(updateCurrentPosition(pos));
    }
  }, [dispatch]);

  const animateTrajectory = useCallback((trajectory: TrajectoryStep[], environment: string) => {
    if (trajectory.length === 0) return;
    
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    
    const maxStepsToAnimate = Math.min(trajectory.length, 10);
    const startIdx = trajectory.length - maxStepsToAnimate;
    
    console.log(`[Animation] Animating last ${maxStepsToAnimate} steps of ${trajectory.length} for ${environment}`);
    
    let stepIndex = 0;
    isAnimatingRef.current = true;
    
    const animateStep = () => {
      if (stepIndex < maxStepsToAnimate) {
        const step = trajectory[startIdx + stepIndex];
        updatePositionFromStep(step, environment);
        stepIndex++;
        animationRef.current = window.setTimeout(animateStep, 30);
      } else {
        console.log(`[Animation] Complete for ${environment}`);
        isAnimatingRef.current = false;
        if (animationQueueRef.current.length > 0) {
          const nextTrajectory = animationQueueRef.current.shift();
          if (nextTrajectory && nextTrajectory.length > 0) {
            animateTrajectory(nextTrajectory, environment);
          }
        }
      }
    };
    
    animateStep();
  }, [updatePositionFromStep]);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket('ws://127.0.0.1:8000/ws/training/');

    ws.onopen = () => {
      console.log('Training WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data: TrainingUpdate = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connection_established':
          console.log('Training WS: Connection established');
          break;

        case 'training_started':
          setIsTraining(true);
          setTotalEpisodes(data.total_episodes || 0);
          if (data.environment) {
            setCurrentEnvironment(data.environment);
          }
          break;

        case 'dp_started':
          setIsTraining(true);
          if (data.environment) {
            setCurrentEnvironment(data.environment);
          }
          break;

        case 'agent_step':
          console.log(`[WebSocket] Received agent_step for ${data.environment}, trajectory length: ${data.trajectory?.length || 0}`);
          if (data.trajectory && data.trajectory.length > 0) {
            setCurrentTrajectory(data.trajectory);
            const env = data.environment || currentEnvironment;
            animateTrajectory(data.trajectory, env);
          }
          break;

        case 'training_progress':
          setCurrentEpisode(data.episode || 0);
          setTotalEpisodes(data.total_episodes || 0);
          dispatch(setProgress(data.progress || 0));
          setAvgValue(data.avg_value || 0);
          setAvgReward(data.avg_reward || 0);
          
          if (data.episode_rewards && data.episode_rewards.length > 0) {
            setEpisodeRewards(data.episode_rewards);
          }
          
          if (data.sample_values) {
            dispatch(setValueFunction(data.sample_values));
          }
          break;

        case 'dp_iteration':
          setCurrentIteration(data.iteration || 0);
          setCurrentDelta(data.delta || 0);
          setAvgValue(data.avg_value || 0);
          
          if (data.delta !== undefined) {
            setDeltaHistory(prev => [...prev, data.delta!]);
          }
          
          const dpProgress = data.converged ? 100 : Math.min(95, (1 - Math.min(data.delta || 1, 1)) * 100);
          dispatch(setProgress(dpProgress));
          
          if (data.sample_values) {
            dispatch(setValueFunction(data.sample_values));
          }
          break;

        case 'training_complete':
          setIsTraining(false);
          dispatch(setProgress(100));
          
          if (data.value_function) {
            dispatch(setValueFunction(data.value_function));
          }
          if (data.policy) {
            dispatch(setPolicy(data.policy));
          }
          if (data.episode_rewards) {
            setEpisodeRewards(data.episode_rewards);
          }
          dispatch(setTrained(true));
          break;

        case 'training_stopped':
          setIsTraining(false);
          break;

        case 'error':
          console.error('Training error:', data);
          setIsTraining(false);
          break;
      }
    };

    ws.onclose = () => {
      console.log('Training WebSocket disconnected');
      setIsConnected(false);
      setIsTraining(false);
    };

    ws.onerror = (error) => {
      console.error('Training WebSocket error:', error);
      setIsConnected(false);
    };

    socketRef.current = ws;
  }, [dispatch, animateTrajectory]);

  const disconnect = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const mapAlgorithmName = (algorithm: AlgorithmType): string => {
    const mapping: Record<AlgorithmType, string> = {
      'value_iteration': 'value_iteration',
      'policy_iteration': 'policy_iteration',
      'mc_first_visit': 'monte_carlo_first_visit',
      'mc_every_visit': 'monte_carlo_every_visit',
      'mc_control': 'monte_carlo_control',
      'td_zero': 'td_zero',
      'sarsa': 'sarsa',
      'n_step_td': 'n_step_td',
    };
    return mapping[algorithm] || algorithm;
  };

  const sendStartTraining = useCallback((config: TrainingConfig) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    setCurrentEpisode(0);
    setCurrentIteration(0);
    setCurrentDelta(0);
    setAvgValue(0);
    setAvgReward(0);
    setEpisodeRewards([]);
    setDeltaHistory([]);
    setAgentPosition(config.agentPosition);
    setCurrentEnvironment(config.environment);
    dispatch(setProgress(0));
    
    dispatch(updateCurrentPosition(config.agentPosition));

    const backendAlgorithm = mapAlgorithmName(config.algorithm);
    console.log('Starting training with algorithm:', backendAlgorithm, 'environment:', config.environment);

    socketRef.current.send(JSON.stringify({
      type: 'start_training',
      algorithm: backendAlgorithm,
      environment: config.environment,
      grid_size: config.gridSize,
      agent_position: config.agentPosition,
      goal_position: config.goalPosition,
      gamma: config.gamma,
      theta: config.theta,
      num_episodes: config.numEpisodes,
      alpha: config.alpha,
      epsilon: config.epsilon,
      is_slippery: config.isSlippery,
      num_brick_rows: config.numBrickRows,
      n_steps: config.nSteps,
    }));
  }, [dispatch]);

  const startTraining = useCallback((config: TrainingConfig) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      connect();
      setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          sendStartTraining(config);
        } else {
          console.error('WebSocket still not connected after 500ms');
        }
      }, 500);
      return;
    }
    sendStartTraining(config);
  }, [connect, sendStartTraining]);

  const stopTraining = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'stop_training' }));
    }
    setIsTraining(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    isTraining,
    currentEpisode,
    totalEpisodes,
    currentIteration,
    currentDelta,
    avgValue,
    avgReward,
    episodeRewards,
    deltaHistory,
    agentPosition,
    currentTrajectory,
    startTraining,
    stopTraining,
  };
}

export default useRealtimeTraining;
