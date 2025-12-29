export type AlgorithmType =
  | 'value_iteration'
  | 'policy_iteration'
  | 'mc_first_visit'
  | 'mc_every_visit'
  | 'mc_control'
  | 'td_zero'
  | 'sarsa'
  | 'n_step_td';

export type EnvironmentType = 'gridworld' | 'frozen_lake' | 'breakout';

export interface AlgorithmInfo {
  id: AlgorithmType;
  name: string;
  category: 'dp' | 'mc' | 'td';
  description: string;
  parameters: ParameterConfig[];
}

export interface ParameterConfig {
  name: string;
  key: string;
  min: number;
  max: number;
  step: number;
  default: number;
  description: string;
}

export interface EnvironmentInfo {
  id: EnvironmentType;
  name: string;
  description: string;
  parameters: ParameterConfig[];
}

export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: 'value_iteration',
    name: 'Value Iteration',
    category: 'dp',
    description: 'Dynamic programming method that iteratively computes optimal value function.',
    parameters: [
      { name: 'Discount Factor', key: 'gamma', min: 0, max: 1, step: 0.01, default: 0.99, description: 'How much to discount future rewards (γ)' },
      { name: 'Convergence Threshold', key: 'theta', min: 0.0001, max: 0.1, step: 0.0001, default: 0.0001, description: 'Threshold for determining convergence' },
    ],
  },
  {
    id: 'policy_iteration',
    name: 'Policy Iteration',
    category: 'dp',
    description: 'Alternates between policy evaluation and policy improvement until optimal.',
    parameters: [
      { name: 'Discount Factor', key: 'gamma', min: 0, max: 1, step: 0.01, default: 0.99, description: 'How much to discount future rewards (γ)' },
      { name: 'Convergence Threshold', key: 'theta', min: 0.0001, max: 0.1, step: 0.0001, default: 0.0001, description: 'Threshold for determining convergence' },
    ],
  },
  {
    id: 'mc_first_visit',
    name: 'Monte Carlo First Visit',
    category: 'mc',
    description: 'Estimates values using first visits to states in sampled episodes.',
    parameters: [
      { name: 'Discount Factor', key: 'gamma', min: 0, max: 1, step: 0.01, default: 0.99, description: 'How much to discount future rewards (γ)' },
      { name: 'Episodes', key: 'num_episodes', min: 100, max: 10000, step: 100, default: 1000, description: 'Number of episodes to sample' },
    ],
  },
  {
    id: 'mc_every_visit',
    name: 'Monte Carlo Every Visit',
    category: 'mc',
    description: 'Estimates values using every visit to states in sampled episodes.',
    parameters: [
      { name: 'Discount Factor', key: 'gamma', min: 0, max: 1, step: 0.01, default: 0.99, description: 'How much to discount future rewards (γ)' },
      { name: 'Episodes', key: 'num_episodes', min: 100, max: 10000, step: 100, default: 1000, description: 'Number of episodes to sample' },
    ],
  },
  {
    id: 'mc_control',
    name: 'Monte Carlo Control',
    category: 'mc',
    description: 'Learns optimal policy using ε-greedy Monte Carlo control.',
    parameters: [
      { name: 'Discount Factor', key: 'gamma', min: 0, max: 1, step: 0.01, default: 0.99, description: 'How much to discount future rewards (γ)' },
      { name: 'Epsilon', key: 'epsilon', min: 0, max: 1, step: 0.01, default: 0.1, description: 'Exploration rate for ε-greedy policy' },
      { name: 'Episodes', key: 'num_episodes', min: 100, max: 10000, step: 100, default: 1000, description: 'Number of episodes to sample' },
    ],
  },
  {
    id: 'td_zero',
    name: 'TD(0)',
    category: 'td',
    description: 'Temporal difference learning with one-step bootstrapping.',
    parameters: [
      { name: 'Discount Factor', key: 'gamma', min: 0, max: 1, step: 0.01, default: 0.99, description: 'How much to discount future rewards (γ)' },
      { name: 'Learning Rate', key: 'alpha', min: 0, max: 1, step: 0.01, default: 0.1, description: 'Step size for value updates (α)' },
      { name: 'Epsilon', key: 'epsilon', min: 0, max: 1, step: 0.01, default: 0.1, description: 'Exploration rate for ε-greedy policy' },
      { name: 'Episodes', key: 'num_episodes', min: 100, max: 10000, step: 100, default: 1000, description: 'Number of episodes to sample' },
    ],
  },
  {
    id: 'sarsa',
    name: 'SARSA',
    category: 'td',
    description: 'On-policy TD control - uses actual next action for bootstrapping.',
    parameters: [
      { name: 'Discount Factor', key: 'gamma', min: 0, max: 1, step: 0.01, default: 0.99, description: 'How much to discount future rewards (γ)' },
      { name: 'Learning Rate', key: 'alpha', min: 0, max: 1, step: 0.01, default: 0.1, description: 'Step size for Q-value updates (α)' },
      { name: 'Epsilon', key: 'epsilon', min: 0, max: 1, step: 0.01, default: 0.1, description: 'Exploration rate for ε-greedy policy' },
      { name: 'Episodes', key: 'num_episodes', min: 100, max: 10000, step: 100, default: 1000, description: 'Number of episodes to sample' },
    ],
  },
  {
    id: 'n_step_td',
    name: 'n-Step TD',
    category: 'td',
    description: 'Bridge between TD(0) and Monte Carlo using n-step returns.',
    parameters: [
      { name: 'Discount Factor', key: 'gamma', min: 0, max: 1, step: 0.01, default: 0.99, description: 'How much to discount future rewards (γ)' },
      { name: 'Learning Rate', key: 'alpha', min: 0, max: 1, step: 0.01, default: 0.1, description: 'Step size for value updates (α)' },
      { name: 'N Steps', key: 'n_steps', min: 1, max: 20, step: 1, default: 3, description: 'Number of steps to look ahead (n)' },
      { name: 'Episodes', key: 'num_episodes', min: 100, max: 10000, step: 100, default: 1000, description: 'Number of episodes to sample' },
    ],
  },
];

export const ENVIRONMENTS: EnvironmentInfo[] = [
  {
    id: 'gridworld',
    name: 'Gridworld',
    description: 'A simple grid environment where an agent navigates to reach a goal.',
    parameters: [
      { name: 'Grid Size', key: 'grid_size', min: 3, max: 10, step: 1, default: 4, description: 'Size of the grid (N×N)' },
      { name: 'Agent X', key: 'agent_x', min: 0, max: 9, step: 1, default: 0, description: 'Agent starting X position' },
      { name: 'Agent Y', key: 'agent_y', min: 0, max: 9, step: 1, default: 0, description: 'Agent starting Y position' },
      { name: 'Goal X', key: 'goal_x', min: 0, max: 9, step: 1, default: 3, description: 'Goal X position' },
      { name: 'Goal Y', key: 'goal_y', min: 0, max: 9, step: 1, default: 3, description: 'Goal Y position' },
    ],
  },
  {
    id: 'frozen_lake',
    name: 'Frozen Lake',
    description: 'Navigate a frozen lake to reach the goal while avoiding holes.',
    parameters: [
      { name: 'Grid Size', key: 'grid_size', min: 4, max: 8, step: 4, default: 4, description: 'Size of the lake (4×4 or 8×8)' },
      { name: 'Slippery', key: 'is_slippery', min: 0, max: 1, step: 1, default: 0, description: 'Whether the ice is slippery (stochastic)' },
    ],
  },
  {
    id: 'breakout',
    name: 'Breakout',
    description: 'A simplified Breakout game - paddle catches ball to break bricks.',
    parameters: [
      { name: 'Grid Size', key: 'grid_size', min: 5, max: 10, step: 1, default: 5, description: 'Size of the playing area (N×N)' },
      { name: 'Brick Rows', key: 'brick_rows', min: 1, max: 3, step: 1, default: 2, description: 'Number of rows of bricks' },
    ],
  },
];

export const getAlgorithmById = (id: AlgorithmType): AlgorithmInfo | undefined =>
  ALGORITHMS.find((a) => a.id === id);

export const getEnvironmentById = (id: EnvironmentType): EnvironmentInfo | undefined =>
  ENVIRONMENTS.find((e) => e.id === id);
