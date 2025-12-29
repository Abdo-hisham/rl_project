import axios from 'axios';
import type { AlgorithmType, EnvironmentType } from '../types/rl.types';
import type { StepResult, AlgorithmResult, PolicyGrid, SimulationResult } from '../types';

const BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CreateEnvironmentParams {
  environment: EnvironmentType;
  gridSize?: number;
  agentPosition?: [number, number];
  goalPosition?: [number, number];
  isSlippery?: boolean;
  numBrickRows?: number;
}

export const getEnvironmentInfo = async () => {
  const response = await api.get('/environment/info/');
  return response.data;
};

export const createEnvironment = async (params: CreateEnvironmentParams) => {
  const body: Record<string, unknown> = {
    environment: params.environment,
    grid_size: params.gridSize ?? 4,
    agent_position: params.agentPosition ?? [0, 0],
    goal_position: params.goalPosition ?? [params.gridSize ? params.gridSize - 1 : 3, params.gridSize ? params.gridSize - 1 : 3],
  };
  
  if (params.isSlippery !== undefined) {
    body.is_slippery = params.isSlippery;
  }
  if (params.numBrickRows !== undefined) {
    body.num_brick_rows = params.numBrickRows;
  }
  
  const response = await api.post('/environment/create/', body);
  return response.data;
};

export const stepEnvironment = async (action: number): Promise<StepResult> => {
  const response = await api.post('/environment/step/', { action });
  return response.data;
};

export interface RunAlgorithmParams {
  algorithm: AlgorithmType;
  gridSize?: number;
  agentPosition?: [number, number];
  goalPosition?: [number, number];
  gamma?: number;
  theta?: number;
  numEpisodes?: number;
  alpha?: number;
  epsilon?: number;
}

export const getAlgorithmsInfo = async () => {
  const response = await api.get('/algorithms/info/');
  return response.data;
};

export const runAlgorithm = async (params: RunAlgorithmParams): Promise<AlgorithmResult> => {
  const body = {
    algorithm: params.algorithm,
    grid_size: params.gridSize ?? 4,
    agent_position: params.agentPosition ?? [0, 0],
    goal_position: params.goalPosition ?? [params.gridSize ? params.gridSize - 1 : 3, params.gridSize ? params.gridSize - 1 : 3],
    gamma: params.gamma ?? 0.99,
    theta: params.theta ?? 0.0001,
    num_episodes: params.numEpisodes ?? 1000,
    alpha: params.alpha ?? 0.1,
    epsilon: params.epsilon ?? 0.1,
  };
  const response = await api.post('/algorithms/run/', body);
  return response.data;
};

export const getOptimalAction = async (state: [number, number]): Promise<{ action: number; actionName: string }> => {
  const response = await api.post('/algorithms/optimal-action/', { state });
  return response.data;
};

export const getPolicy = async (): Promise<PolicyGrid> => {
  const response = await api.get('/algorithms/policy/');
  return response.data;
};

export interface SimulatePolicyParams {
  maxSteps?: number;
  agentPosition?: [number, number];
  goalPosition: [number, number];
  gridSize?: number;
  gamma?: number;
  environment?: string;
  policy?: Record<string, number>;
  isSlippery?: boolean;
  numBrickRows?: number;
}

export const simulatePolicy = async (params: SimulatePolicyParams): Promise<SimulationResult> => {
  const body: Record<string, unknown> = {
    max_steps: params.maxSteps ?? 100,
    agent_position: params.agentPosition,
    goal_position: params.goalPosition,
    grid_size: params.gridSize ?? 4,
    gamma: params.gamma ?? 0.99,
    environment: params.environment ?? 'gridworld',
  };
  
  if (params.policy && Object.keys(params.policy).length > 0) {
    body.policy = params.policy;
  }
  if (params.isSlippery !== undefined) {
    body.is_slippery = params.isSlippery;
  }
  if (params.numBrickRows !== undefined) {
    body.num_brick_rows = params.numBrickRows;
  }
  
  const response = await api.post('/algorithms/simulate/', body);
  
  const data = response.data;
  return {
    trajectory: data.trajectory.map((t: { 
      step: number; 
      agent_position: number[]; 
      action: number | null; 
      action_name?: string; 
      reward: number;
      paddle_position?: number;
      ball_position?: number[];
    }) => ({
      step: t.step,
      agentPosition: t.agent_position,
      action: t.action,
      actionName: t.action_name,
      reward: t.reward,
      paddlePosition: t.paddle_position,
      ballPosition: t.ball_position,
    })),
    totalSteps: data.total_steps,
    totalReward: data.total_reward,
    reachedGoal: data.reached_goal,
    startPosition: data.start_position,
    goalPosition: data.goal_position,
  };
};

export default api;
