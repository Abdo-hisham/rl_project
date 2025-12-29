export interface Position {
  x: number;
  y: number;
}

export interface EnvironmentState {
  agentPosition: Position;
  goalPosition: Position;
  gridSize: number;
  currentStep: number;
  maxSteps: number;
}

export interface TrainingProgress {
  episode: number;
  totalEpisodes: number;
  progress: number;
  statesEvaluated: number;
  avgValue: number;
  sampleValues: Record<string, number>;
}

export interface DPIteration {
  iteration: number;
  delta: number;
  converged: boolean;
  sampleValues: Record<string, number>;
  avgValue: number;
}

export interface StepResult {
  observation: number[];
  agentPosition: number[];
  goalPosition: number[];
  reward: number;
  terminated: boolean;
  truncated: boolean;
  actionTaken: number;
  actionName: string;
}

export interface PolicyGrid {
  policyGrid: string[][];
  valueGrid: number[][];
  goalPosition: number[];
  gridSize: number;
  actionLegend: Record<number, string>;
}

export interface Trajectory {
  step: number;
  agentPosition: number[];
  action: number | null;
  actionName?: string;
  reward: number;
  paddlePosition?: number;
  ballPosition?: number[];
}

export interface SimulationResult {
  trajectory: Trajectory[];
  totalSteps: number;
  totalReward: number;
  reachedGoal: boolean;
  startPosition: number[];
  goalPosition: number[];
}

export interface AlgorithmResult {
  algorithm: string;
  gridSize: number;
  gamma: number;
  valueFunction?: Record<string, number>;
  policy?: Record<string, number>;
  qValues?: Record<string, Record<string, number>>;
  statesCount: number;
  numEpisodes?: number;
  alpha?: number;
  epsilon?: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}
