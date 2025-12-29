import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import numpy as np

from RL_Algorithms.RL.Environments.Gridworld import GridworldEnv
from RL_Algorithms.RL.Environments.FrozenLake import FrozenLakeEnv
from RL_Algorithms.RL.Environments.Breakout import BreakoutEnv
from RL_Algorithms.RL.Algorithms.Value_Iteration import Value_Iteration
from RL_Algorithms.RL.Algorithms.Policy_Iteration import Policy_Iteration
from RL_Algorithms.RL.Algorithms.Monte_Carlo import (
    Monte_Carlo_First_Visit, 
    Monte_Carlo_Every_Visit,
    Monte_Carlo_Control_Epsilon_Greedy
)
from RL_Algorithms.RL.Algorithms.Tamporal_Difference import TD_Zero
from RL_Algorithms.RL.Algorithms.SARSA import SARSA
from RL_Algorithms.RL.Algorithms.N_Step_TD import N_Step_TD


def format_state_for_grid(state):
    """Convert state tuple (agent_x, agent_y, goal_x, goal_y) or (x, y) to grid position (x, y)"""
    if isinstance(state, tuple) and len(state) >= 2:
        return f"({state[0]}, {state[1]})"
    return str(state)


def format_frozen_lake_state_for_grid(state):
    """Convert Frozen Lake state tuple (x, y) to key"""
    if isinstance(state, tuple) and len(state) >= 2:
        return f"({state[0]}, {state[1]})"
    return str(state)


def format_frozen_lake_value_function(V, grid_size):
    """Convert Frozen Lake value function to grid format for visualization."""
    grid_values = {}
    
    for state, value in V.items():
        if isinstance(state, tuple) and len(state) >= 2:
            key = f"({state[0]}, {state[1]})"
            grid_values[key] = float(value)
    
    return grid_values


def format_frozen_lake_policy(policy, grid_size):
    """Convert Frozen Lake policy to grid format for visualization."""
    grid_policy = {}
    
    for state, action in policy.items():
        if isinstance(state, tuple) and len(state) >= 2:
            key = f"({state[0]}, {state[1]})"
            grid_policy[key] = int(action)
    
    return grid_policy


def format_value_function_for_grid(V, grid_size):
    """Convert value function to grid-based format for frontend visualization"""
    grid_values = {}
    for state, value in V.items():
        if isinstance(state, tuple) and len(state) >= 2:
            key = f"({state[0]}, {state[1]})"
            if key not in grid_values or value > grid_values[key]:
                grid_values[key] = float(value)
    return grid_values


def format_policy_for_grid(policy, grid_size):
    """Convert policy to grid-based format for frontend visualization"""
    grid_policy = {}
    for state, action in policy.items():
        if isinstance(state, tuple) and len(state) >= 2:
            key = f"({state[0]}, {state[1]})"
            grid_policy[key] = int(action)
        else:
            grid_policy[str(state)] = int(action)
    return grid_policy


def format_breakout_value_function(V, grid_size):
    """Convert Breakout value function to grid format for visualization."""
    grid_values = {}
    for state, value in V.items():
        if isinstance(state, tuple) and len(state) >= 2:
            key = f"({state[0]}, {state[1]})"
            if key not in grid_values or value > grid_values[key]:
                grid_values[key] = float(value)
    return grid_values


def format_breakout_policy(policy, grid_size):
    """Convert Breakout policy to grid format for visualization."""
    grid_policy = {}
    for state, action in policy.items():
        if isinstance(state, tuple) and len(state) >= 2:
            key = f"({state[0]}, {state[1]})"
            grid_policy[key] = int(action)
    return grid_policy


class EnvironmentConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time environment interaction.
    Supports: reset, step, get_state
    """
    
    async def connect(self):
        self.env = None
        self.grid_size = 5
        self.max_steps = 50
        await self.accept()
        await self.send(json.dumps({
            'type': 'connection_established',
            'message': 'Connected to Gridworld Environment WebSocket'
        }))
    
    async def disconnect(self, close_code):
        if self.env:
            self.env.close()
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        action_type = data.get('type')
        
        if action_type == 'init':
            await self.init_environment(data)
        elif action_type == 'reset':
            await self.reset_environment(data)
        elif action_type == 'step':
            await self.step_environment(data)
        elif action_type == 'get_state':
            await self.get_state()
        elif action_type == 'get_optimal_action':
            await self.get_optimal_action(data)
        else:
            await self.send(json.dumps({
                'type': 'error',
                'message': f'Unknown action type: {action_type}'
            }))
    
    async def init_environment(self, data):
        """Initialize a new environment with given parameters"""
        self.grid_size = data.get('grid_size', 5)
        self.max_steps = data.get('max_steps', 50)
        agent_pos = data.get('agent_position')
        goal_pos = data.get('goal_position')
        
        self.env = GridworldEnv(
            GRID_SIZE=self.grid_size,
            Max_Steps=self.max_steps,
            Agent_Start_Pos=tuple(agent_pos) if agent_pos else None,
            Goal_Pos=tuple(goal_pos) if goal_pos else None
        )
        
        observation = self.env.reset()
        
        await self.send(json.dumps({
            'type': 'environment_initialized',
            'state': self.env.get_state_dict(),
            'observation': observation.tolist()
        }))
    
    async def reset_environment(self, data):
        """Reset the environment"""
        if not self.env:
            agent_pos = data.get('agent_position')
            goal_pos = data.get('goal_position')
            self.env = GridworldEnv(
                GRID_SIZE=self.grid_size,
                Max_Steps=self.max_steps,
                Agent_Start_Pos=tuple(agent_pos) if agent_pos else None,
                Goal_Pos=tuple(goal_pos) if goal_pos else None
            )
        
        observation = self.env.reset()
        
        await self.send(json.dumps({
            'type': 'environment_reset',
            'state': self.env.get_state_dict(),
            'observation': observation.tolist()
        }))
    
    async def step_environment(self, data):
        """Take a step in the environment"""
        if not self.env:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Environment not initialized. Call init or reset first.'
            }))
            return
        
        action = data.get('action')
        if action is None:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Action is required for step'
            }))
            return
        
        observation, reward, terminated, truncated = self.env.step(action)
        
        await self.send(json.dumps({
            'type': 'step_result',
            'observation': observation.tolist(),
            'reward': float(reward),
            'terminated': terminated,
            'truncated': truncated,
            'state': self.env.get_state_dict()
        }))
    
    async def get_state(self):
        """Get current environment state"""
        if not self.env:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Environment not initialized'
            }))
            return
        
        await self.send(json.dumps({
            'type': 'current_state',
            'state': self.env.get_state_dict()
        }))
    
    async def get_optimal_action(self, data):
        """Get optimal action from a pre-computed policy"""
        if not self.env:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Environment not initialized'
            }))
            return
        
        _, policy = await sync_to_async(Value_Iteration)(self.env)
        
        state = tuple(np.concatenate((self.env.Agent_Position, self.env.Goal_Position)))
        optimal_action = policy.get(state, 0)
        
        action_names = {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}
        
        await self.send(json.dumps({
            'type': 'optimal_action',
            'action': int(optimal_action),
            'action_name': action_names[optimal_action],
            'state': state
        }))


class TrainingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time training visualization.
    Streams training progress, value updates, and policy changes.
    """
    
    async def connect(self):
        self.training_task = None
        self.is_training = False
        await self.accept()
        await self.send(json.dumps({
            'type': 'connection_established',
            'message': 'Connected to Training WebSocket'
        }))
    
    async def disconnect(self, close_code):
        self.is_training = False
        if self.training_task:
            self.training_task.cancel()
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        action_type = data.get('type')
        
        if action_type == 'start_training':
            await self.start_training(data)
        elif action_type == 'stop_training':
            await self.stop_training()
        elif action_type == 'run_algorithm':
            await self.run_algorithm(data)
        else:
            await self.send(json.dumps({
                'type': 'error',
                'message': f'Unknown action type: {action_type}'
            }))
    
    async def start_training(self, data):
        """Start training with real-time updates"""
        algorithm = data.get('algorithm', 'monte_carlo_first_visit')
        grid_size = data.get('grid_size', 4)
        num_episodes = data.get('num_episodes', 100)
        gamma = data.get('gamma', 0.9)
        alpha = data.get('alpha', 0.1)
        environment = data.get('environment', 'gridworld')
        
        print(f"[Training] Starting {algorithm} with {num_episodes} episodes, grid_size={grid_size}, env={environment}")
        
        self.is_training = True
        self.environment_type = environment
        
        await self.send(json.dumps({
            'type': 'training_started',
            'algorithm': algorithm,
            'num_episodes': num_episodes,
            'total_episodes': num_episodes,
            'environment': environment
        }))
        
        if environment == 'frozen_lake':
            is_slippery = data.get('is_slippery', False)
            env = FrozenLakeEnv(GRID_SIZE=grid_size, Max_Steps=100, is_slippery=is_slippery)
        elif environment == 'breakout':
            num_brick_rows = data.get('num_brick_rows', 2)
            env = BreakoutEnv(GRID_SIZE=grid_size, Max_Steps=200, num_brick_rows=num_brick_rows)
        else:
            env = GridworldEnv(GRID_SIZE=grid_size, Max_Steps=50)
        
        if algorithm in ['monte_carlo_first_visit', 'monte_carlo_every_visit', 'td_zero']:
            print(f"[Training] Using train_episodic for {algorithm}")
            await self.train_episodic(env, algorithm, num_episodes, gamma, alpha, environment)
        elif algorithm in ['value_iteration', 'policy_iteration']:
            print(f"[Training] Using train_dp for {algorithm}")
            await self.train_dp(env, algorithm, gamma, environment)
        elif algorithm == 'monte_carlo_control':
            epsilon = data.get('epsilon', 0.1)
            print(f"[Training] Using train_control for {algorithm}")
            await self.train_control(env, num_episodes, gamma, epsilon, environment)
        elif algorithm == 'sarsa':
            epsilon = data.get('epsilon', 0.1)
            print(f"[Training] Using train_td_control for {algorithm}")
            await self.train_td_control(env, algorithm, num_episodes, gamma, alpha, epsilon, environment)
        elif algorithm == 'n_step_td':
            n_steps = data.get('n_steps', 3)
            print(f"[Training] Using train_n_step_td for {algorithm} with n={n_steps}")
            await self.train_n_step_td(env, num_episodes, n_steps, gamma, alpha, environment)
        else:
            print(f"[Training] Unknown algorithm: {algorithm}")
            await self.send(json.dumps({
                'type': 'error',
                'message': f'Unknown algorithm: {algorithm}'
            }))
    
    async def train_episodic(self, env, algorithm, num_episodes, gamma, alpha=0.1, environment='gridworld'):
        """Train Monte Carlo or TD with episode-by-episode updates"""
        from collections import defaultdict
        from RL_Algorithms.RL.utils import Generate_Episode
        
        print(f"[train_episodic] Starting {algorithm} for {num_episodes} episodes on {environment}")
        
        V = defaultdict(float)
        Returns = defaultdict(list)
        is_frozen_lake = environment == 'frozen_lake'
        is_breakout = environment == 'breakout'
        
        episode_rewards = []
        
        for episode in range(num_episodes):
            if not self.is_training:
                print(f"[train_episodic] Training stopped at episode {episode}")
                break
            
            try:
                episode_data = await sync_to_async(Generate_Episode)(env, policy=env.Policy)
            except Exception as e:
                print(f"[train_episodic] Error generating episode: {e}")
                await self.send(json.dumps({
                    'type': 'error',
                    'message': f'Error generating episode: {str(e)}'
                }))
                return
            
            episode_reward = sum(reward for _, _, reward in episode_data)
            episode_rewards.append(episode_reward)
            
            should_send_trajectory = ((episode + 1) % 5 == 0 and episode < 100) or ((episode + 1) % 10 == 0)
            if should_send_trajectory:
                trajectory = []
                for step, (state, action, reward) in enumerate(episode_data):
                    if isinstance(state, tuple):
                        if is_breakout and len(state) >= 4:
                            trajectory.append({
                                'step': int(step),
                                'paddle_position': int(state[0]),
                                'ball_position': [int(state[1]), int(state[2])],
                                'ball_direction': int(state[3]),
                                'action': int(action),
                                'reward': float(reward)
                            })
                        elif is_frozen_lake and len(state) >= 2:
                            cell_type = 'F'
                            try:
                                cell_type = env._get_cell(int(state[0]), int(state[1]))
                            except:
                                pass
                            trajectory.append({
                                'step': int(step),
                                'position': [int(state[0]), int(state[1])],
                                'action': int(action),
                                'reward': float(reward),
                                'cell_type': cell_type
                            })
                        elif len(state) >= 2:
                            trajectory.append({
                                'step': int(step),
                                'position': [int(state[0]), int(state[1])],
                                'action': int(action),
                                'reward': float(reward)
                            })
                
                await self.send(json.dumps({
                    'type': 'agent_step',
                    'episode': int(episode + 1),
                    'trajectory': trajectory,
                    'episode_length': int(len(episode_data)),
                    'environment': environment
                }))
                await asyncio.sleep(0.02)
            
            if algorithm == 'td_zero':
                for t in range(len(episode_data) - 1):
                    state, action, reward = episode_data[t]
                    next_state, _, _ = episode_data[t + 1]
                    V[state] = V[state] + alpha * (reward + gamma * V[next_state] - V[state])
                if episode_data:
                    last_state, _, last_reward = episode_data[-1]
                    V[last_state] = V[last_state] + alpha * (last_reward - V[last_state])
            else:
                G = 0
                visited = set()
                
                for t in reversed(range(len(episode_data))):
                    state, action, reward = episode_data[t]
                    G = gamma * G + reward
                    
                    if algorithm == 'monte_carlo_first_visit':
                        if state not in visited:
                            Returns[state].append(G)
                            V[state] = float(np.mean(Returns[state]))
                            visited.add(state)
                    elif algorithm == 'monte_carlo_every_visit':
                        Returns[state].append(G)
                        V[state] = float(np.mean(Returns[state]))
            
            if (episode + 1) % 10 == 0 or episode == num_episodes - 1:
                if is_breakout:
                    grid_values = format_breakout_value_function(V, env.GRID_SIZE)
                else:
                    grid_values = format_value_function_for_grid(V, env.GRID_SIZE)
                
                avg_reward = float(np.mean(episode_rewards[-100:])) if episode_rewards else 0
                
                await self.send(json.dumps({
                    'type': 'training_progress',
                    'episode': episode + 1,
                    'total_episodes': num_episodes,
                    'progress': (episode + 1) / num_episodes * 100,
                    'states_evaluated': len(V),
                    'sample_values': grid_values,
                    'avg_value': float(np.mean(list(V.values()))) if V else 0,
                    'avg_reward': avg_reward,
                    'episode_reward': episode_reward,
                    'episode_rewards': episode_rewards,
                    'environment': environment
                }))
                
                await asyncio.sleep(0.05)
        
        if is_breakout:
            final_values = format_breakout_value_function(V, env.GRID_SIZE)
        else:
            final_values = format_value_function_for_grid(V, env.GRID_SIZE)
        print(f"[train_episodic] Training complete! Sending {len(final_values)} final values, {len(episode_rewards)} episode rewards")
        await self.send(json.dumps({
            'type': 'training_complete',
            'algorithm': algorithm,
            'total_states': len(V),
            'value_function': final_values,
            'episode_rewards': episode_rewards,
            'environment': environment
        }))
    
    async def train_dp(self, env, algorithm, gamma, environment='gridworld'):
        """Train Value Iteration or Policy Iteration with iteration updates"""
        V = {state: 0.0 for state in env.States}
        theta = 1e-4
        iteration = 0
        grid_size = env.GRID_SIZE
        is_breakout = environment == 'breakout'
        is_frozen_lake = environment == 'frozen_lake'
        
        print(f"[train_dp] Starting {algorithm} on {environment}, {len(env.States)} states, theta={theta}")
        
        await self.send(json.dumps({
            'type': 'dp_started',
            'algorithm': algorithm,
            'total_states': len(env.States),
            'environment': environment
        }))
        
        while self.is_training:
            delta = 0
            iteration += 1
            
            trajectory = []
            state_count = 0
            
            for state in env.States:
                old_v = V[state]
                
                if state_count % max(1, len(env.States) // 20) == 0:
                    if isinstance(state, tuple) and len(state) >= 2:
                        if is_breakout and len(state) >= 4:
                            trajectory.append({
                                'step': state_count,
                                'paddle_position': int(state[0]),
                                'ball_position': [int(state[1]), int(state[2])],
                                'ball_direction': int(state[3]) if len(state) > 3 else 0,
                                'action': 0,
                                'reward': 0.0
                            })
                        elif is_frozen_lake:
                            cell_type = 'F'
                            try:
                                cell_type = env._get_cell(int(state[0]), int(state[1]))
                            except:
                                pass
                            trajectory.append({
                                'step': state_count,
                                'position': [int(state[0]), int(state[1])],
                                'action': 0,
                                'reward': 0.0,
                                'cell_type': cell_type
                            })
                        else:
                            trajectory.append({
                                'step': state_count,
                                'position': [int(state[0]), int(state[1])],
                                'action': 0,
                                'reward': 0.0
                            })
                state_count += 1
                
                q_values = []
                for action in range(env.action_space.n):
                    for next_state, reward, done in env.Transition(state, action):
                        if done:
                            q_values.append(reward)
                        else:
                            q_values.append(reward + gamma * V[next_state])
                
                V[state] = max(q_values) if q_values else 0
                delta = max(delta, abs(old_v - V[state]))
            
            if trajectory:
                await self.send(json.dumps({
                    'type': 'agent_step',
                    'episode': iteration,
                    'trajectory': trajectory,
                    'episode_length': len(trajectory),
                    'environment': environment
                }))
                await asyncio.sleep(0.02)
            
            if is_breakout:
                grid_values = format_breakout_value_function(V, grid_size)
            else:
                grid_values = format_value_function_for_grid(V, grid_size)
            
            print(f"[train_dp] Iteration {iteration}, delta={delta:.6f}, converged={delta < theta}")
            
            await self.send(json.dumps({
                'type': 'dp_iteration',
                'iteration': iteration,
                'delta': float(delta),
                'converged': delta < theta,
                'sample_values': grid_values,
                'avg_value': float(np.mean(list(V.values()))),
                'environment': environment
            }))
            
            await asyncio.sleep(0.1)
            
            if delta < theta:
                print(f"[train_dp] Converged after {iteration} iterations, final delta={delta:.6f}")
                break
        
        policy = {}
        for state in env.States:
            q_values = {}
            for action in range(env.action_space.n):
                for next_state, reward, done in env.Transition(state, action):
                    if done:
                        q_values[action] = reward
                    else:
                        q_values[action] = reward + gamma * V[next_state]
            if q_values:
                policy[state] = int(max(q_values, key=q_values.get))
        
        if is_breakout:
            final_values = format_breakout_value_function(V, grid_size)
            final_policy = format_breakout_policy(policy, grid_size)
        else:
            final_values = format_value_function_for_grid(V, grid_size)
            final_policy = format_policy_for_grid(policy, grid_size)

        await self.send(json.dumps({
            'type': 'training_complete',
            'algorithm': algorithm,
            'iterations': iteration,
            'value_function': final_values,
            'policy': final_policy,
            'environment': environment
        }))
    
    async def train_control(self, env, num_episodes, gamma, epsilon, environment='gridworld'):
        """Train Monte Carlo Control with Q-value updates"""
        from collections import defaultdict
        from RL_Algorithms.RL.utils import Generate_Epsilon_Greedy_Episode
        
        Q = defaultdict(lambda: defaultdict(float))
        Returns = defaultdict(lambda: defaultdict(list))
        is_breakout = environment == 'breakout'
        
        for episode in range(num_episodes):
            if not self.is_training:
                break
            
            episode_data = await sync_to_async(Generate_Epsilon_Greedy_Episode)(env, Q, epsilon)
            
            should_send_trajectory = (episode < 20) or ((episode + 1) % 3 == 0)
            if should_send_trajectory:
                trajectory = []
                for step, (state, action, reward) in enumerate(episode_data):
                    if isinstance(state, tuple):
                        if is_breakout and len(state) >= 3:
                            trajectory.append({
                                'step': int(step),
                                'paddle_x': int(state[0]),
                                'ball_x': int(state[1]),
                                'ball_y': int(state[2]),
                                'ball_dx': int(state[3]) if len(state) > 3 else 1,
                                'ball_dy': int(state[4]) if len(state) > 4 else 1,
                                'action': int(action),
                                'reward': float(reward)
                            })
                        elif len(state) >= 2:
                            trajectory.append({
                                'step': int(step),
                                'position': [int(state[0]), int(state[1])],
                                'action': int(action),
                                'reward': float(reward)
                            })
                
                await self.send(json.dumps({
                    'type': 'agent_step',
                    'episode': int(episode + 1),
                    'trajectory': trajectory,
                    'episode_length': int(len(episode_data)),
                    'environment': environment
                }))
                await asyncio.sleep(0.05)
            
            G = 0
            visited = set()
            
            for t in reversed(range(len(episode_data))):
                state, action, reward = episode_data[t]
                G = gamma * G + reward
                
                if (state, action) not in visited:
                    Returns[state][action].append(G)
                    Q[state][action] = float(np.mean(Returns[state][action]))
                    visited.add((state, action))
            
            if (episode + 1) % 10 == 0 or episode == num_episodes - 1:
                V_from_Q = {}
                for state in Q:
                    if Q[state]:
                        V_from_Q[state] = max(Q[state].values())
                
                if is_breakout:
                    sample_values = format_breakout_value_function(V_from_Q, env.GRID_SIZE)
                else:
                    sample_values = format_value_function_for_grid(V_from_Q, env.GRID_SIZE)
                
                await self.send(json.dumps({
                    'type': 'training_progress',
                    'episode': episode + 1,
                    'total_episodes': num_episodes,
                    'progress': (episode + 1) / num_episodes * 100,
                    'states_with_q': len(Q),
                    'sample_values': sample_values,
                    'avg_value': float(np.mean(list(V_from_Q.values()))) if V_from_Q else 0,
                    'environment': environment
                }))
                await asyncio.sleep(0.05)
        
        policy = {}
        V_final = {}
        for state in Q:
            if Q[state]:
                policy[state] = int(max(Q[state], key=Q[state].get))
                V_final[state] = max(Q[state].values())
        
        if is_breakout:
            final_values = format_breakout_value_function(V_final, env.GRID_SIZE)
            final_policy = format_breakout_policy(policy, env.GRID_SIZE)
        else:
            final_values = format_value_function_for_grid(V_final, env.GRID_SIZE)
            final_policy = format_policy_for_grid(policy, env.GRID_SIZE)
        
        await self.send(json.dumps({
            'type': 'training_complete',
            'algorithm': 'monte_carlo_control',
            'policy': final_policy,
            'value_function': final_values,
            'states_evaluated': len(Q),
            'environment': environment
        }))
    
    async def train_td_control(self, env, algorithm, num_episodes, gamma, alpha, epsilon, environment='gridworld'):
        from collections import defaultdict
        import random
        
        print(f"[train_td_control] Starting {algorithm} for {num_episodes} episodes")
        
        Q = defaultdict(lambda: defaultdict(float))
        is_frozen_lake = environment == 'frozen_lake'
        is_breakout = environment == 'breakout'
        
        for state in env.States:
            for action in range(env.action_space.n):
                Q[state][action] = 0.0
        
        episode_rewards = []
        
        def epsilon_greedy_action(state, eps):
            if np.random.rand() < eps:
                return random.choice(range(env.action_space.n))
            else:
                action_values = [Q[state][a] for a in range(env.action_space.n)]
                return int(np.argmax(action_values))
        
        for episode in range(num_episodes):
            if not self.is_training:
                print(f"[train_td_control] Stopped at episode {episode}")
                break
            
            state = tuple(env.reset())
            action = epsilon_greedy_action(state, epsilon)
            episode_reward = 0
            trajectory = []
            
            step = 0
            while True:
                next_obs, reward, terminated, truncated = env.step(action)
                next_state = tuple(int(x) for x in next_obs)
                episode_reward += reward
                
                if is_breakout and len(state) >= 4:
                    trajectory.append({
                        'step': step,
                        'paddle_position': int(state[0]),
                        'ball_position': [int(state[1]), int(state[2])],
                        'ball_direction': int(state[3]),
                        'action': int(action),
                        'reward': float(reward)
                    })
                elif is_frozen_lake and len(state) >= 2:
                    cell_type = 'F'
                    try:
                        cell_type = env._get_cell(int(state[0]), int(state[1]))
                    except:
                        pass
                    trajectory.append({
                        'step': step,
                        'position': [int(state[0]), int(state[1])],
                        'action': int(action),
                        'reward': float(reward),
                        'cell_type': cell_type
                    })
                elif len(state) >= 2:
                    trajectory.append({
                        'step': step,
                        'position': [int(state[0]), int(state[1])],
                        'action': int(action),
                        'reward': float(reward)
                    })
                
                if terminated or truncated:
                    Q[state][action] += alpha * (reward - Q[state][action])
                    break
                
                next_action = epsilon_greedy_action(next_state, epsilon)
                td_target = reward + gamma * Q[next_state][next_action]
                Q[state][action] += alpha * (td_target - Q[state][action])
                action = next_action
                
                state = next_state
                step += 1
            
            episode_rewards.append(episode_reward)
            
            should_send = ((episode + 1) % 5 == 0 and episode < 100) or ((episode + 1) % 10 == 0)
            if should_send and trajectory:
                await self.send(json.dumps({
                    'type': 'agent_step',
                    'episode': int(episode + 1),
                    'trajectory': trajectory,
                    'episode_length': int(len(trajectory)),
                    'environment': environment
                }))
                await asyncio.sleep(0.02)
            
            if (episode + 1) % 10 == 0 or episode == num_episodes - 1:
                V_from_Q = {s: max(Q[s].values()) for s in Q if Q[s]}
                if is_breakout:
                    grid_values = format_breakout_value_function(V_from_Q, env.GRID_SIZE)
                else:
                    grid_values = format_value_function_for_grid(V_from_Q, env.GRID_SIZE)
                
                await self.send(json.dumps({
                    'type': 'training_progress',
                    'episode': episode + 1,
                    'total_episodes': num_episodes,
                    'progress': (episode + 1) / num_episodes * 100,
                    'states_with_q': len(Q),
                    'sample_values': grid_values,
                    'avg_value': float(np.mean(list(V_from_Q.values()))) if V_from_Q else 0,
                    'avg_reward': float(np.mean(episode_rewards[-100:])) if episode_rewards else 0,
                    'episode_reward': episode_reward,
                    'episode_rewards': episode_rewards,
                    'environment': environment
                }))
                await asyncio.sleep(0.05)
        
        policy = {}
        V_final = {}
        for state in Q:
            if Q[state]:
                policy[state] = int(max(Q[state], key=Q[state].get))
                V_final[state] = max(Q[state].values())
        
        if is_breakout:
            final_values = format_breakout_value_function(V_final, env.GRID_SIZE)
            final_policy = format_breakout_policy(policy, env.GRID_SIZE)
        else:
            final_values = format_value_function_for_grid(V_final, env.GRID_SIZE)
            final_policy = format_policy_for_grid(policy, env.GRID_SIZE)
        
        await self.send(json.dumps({
            'type': 'training_complete',
            'algorithm': algorithm,
            'policy': final_policy,
            'value_function': final_values,
            'states_evaluated': len(Q),
            'episode_rewards': episode_rewards[-100:],
            'environment': environment
        }))
    
    async def train_n_step_td(self, env, num_episodes, n, gamma, alpha, environment='gridworld'):
        """Train n-step TD with real-time updates"""
        from collections import defaultdict
        
        print(f"[train_n_step_td] Starting n-step TD (n={n}) for {num_episodes} episodes")
        
        V = defaultdict(float)
        is_frozen_lake = environment == 'frozen_lake'
        is_breakout = environment == 'breakout'
        
        episode_rewards = []
        
        for episode in range(num_episodes):
            if not self.is_training:
                break
            
            states = []
            rewards = []
            trajectory = []
            
            obs = env.reset()
            state = tuple(obs)
            states.append(state)
            episode_reward = 0
            
            terminated = truncated = False
            step = 0
            
            while not (terminated or truncated):
                probs = [env.Policy[state][a] for a in range(env.action_space.n)]
                action = np.random.choice(range(env.action_space.n), p=probs)
                
                next_obs, reward, terminated, truncated = env.step(action)
                next_state = tuple(int(x) for x in next_obs)
                
                rewards.append(reward)
                states.append(next_state)
                episode_reward += reward
                
                if is_breakout and len(state) >= 4:
                    trajectory.append({
                        'step': step,
                        'paddle_position': int(state[0]),
                        'ball_position': [int(state[1]), int(state[2])],
                        'ball_direction': int(state[3]),
                        'action': int(action),
                        'reward': float(reward)
                    })
                elif is_frozen_lake and len(state) >= 2:
                    cell_type = 'F'
                    try:
                        cell_type = env._get_cell(int(state[0]), int(state[1]))
                    except:
                        pass
                    trajectory.append({
                        'step': step,
                        'position': [int(state[0]), int(state[1])],
                        'action': int(action),
                        'reward': float(reward),
                        'cell_type': cell_type
                    })
                elif len(state) >= 2:
                    trajectory.append({
                        'step': step,
                        'position': [int(state[0]), int(state[1])],
                        'action': int(action),
                        'reward': float(reward)
                    })
                
                state = next_state
                step += 1
            
            episode_rewards.append(episode_reward)
            T = len(rewards)
            
            for t in range(T):
                G = 0
                end_step = min(t + n, T)
                
                for k in range(t, end_step):
                    G += (gamma ** (k - t)) * rewards[k]
                
                if end_step < T:
                    G += (gamma ** n) * V[states[end_step]]
                
                V[states[t]] += alpha * (G - V[states[t]])
            
            should_send = ((episode + 1) % 5 == 0 and episode < 100) or ((episode + 1) % 10 == 0)
            if should_send and trajectory:
                await self.send(json.dumps({
                    'type': 'agent_step',
                    'episode': int(episode + 1),
                    'trajectory': trajectory,
                    'episode_length': int(len(trajectory)),
                    'environment': environment
                }))
                await asyncio.sleep(0.02)
            
            if (episode + 1) % 10 == 0 or episode == num_episodes - 1:
                if is_breakout:
                    grid_values = format_breakout_value_function(V, env.GRID_SIZE)
                else:
                    grid_values = format_value_function_for_grid(V, env.GRID_SIZE)
                
                await self.send(json.dumps({
                    'type': 'training_progress',
                    'episode': episode + 1,
                    'total_episodes': num_episodes,
                    'progress': (episode + 1) / num_episodes * 100,
                    'states_evaluated': len(V),
                    'sample_values': grid_values,
                    'avg_value': float(np.mean(list(V.values()))) if V else 0,
                    'avg_reward': float(np.mean(episode_rewards[-100:])) if episode_rewards else 0,
                    'episode_reward': episode_reward,
                    'episode_rewards': episode_rewards,
                    'environment': environment,
                    'n_steps': n
                }))
                await asyncio.sleep(0.05)
        
        if is_breakout:
            final_values = format_breakout_value_function(V, env.GRID_SIZE)
        else:
            final_values = format_value_function_for_grid(V, env.GRID_SIZE)
        
        await self.send(json.dumps({
            'type': 'training_complete',
            'algorithm': f'n_step_td (n={n})',
            'value_function': final_values,
            'total_states': len(V),
            'episode_rewards': episode_rewards[-100:],
            'environment': environment
        }))
    
    async def stop_training(self):
        """Stop ongoing training"""
        self.is_training = False
        await self.send(json.dumps({
            'type': 'training_stopped',
            'message': 'Training stopped by user'
        }))
    
    async def run_algorithm(self, data):
        """Run a complete algorithm and return results"""
        algorithm = data.get('algorithm')
        grid_size = data.get('grid_size', 4)
        gamma = data.get('gamma', 0.9)
        num_episodes = data.get('num_episodes', 500)
        
        env = GridworldEnv(GRID_SIZE=grid_size, Max_Steps=50)
        
        await self.send(json.dumps({
            'type': 'algorithm_started',
            'algorithm': algorithm
        }))
        
        result = {}
        
        if algorithm == 'value_iteration':
            V, policy = await sync_to_async(Value_Iteration)(env, gamma=gamma)
            result = {
                'value_function': format_value_function_for_grid(V, grid_size),
                'policy': format_policy_for_grid(policy, grid_size)
            }
        
        elif algorithm == 'policy_iteration':
            V, policy = await sync_to_async(Policy_Iteration)(env, gamma=gamma)
            result = {
                'value_function': format_value_function_for_grid(V, grid_size),
                'policy': format_policy_for_grid(policy, grid_size)
            }
        
        elif algorithm == 'monte_carlo_first_visit':
            V = await sync_to_async(Monte_Carlo_First_Visit)(env, num_episodes=num_episodes, gamma=gamma)
            result = {
                'value_function': format_value_function_for_grid(V, grid_size)
            }
        
        elif algorithm == 'monte_carlo_every_visit':
            V = await sync_to_async(Monte_Carlo_Every_Visit)(env, num_episodes=num_episodes, gamma=gamma)
            result = {
                'value_function': format_value_function_for_grid(V, grid_size)
            }
        
        elif algorithm == 'monte_carlo_control':
            epsilon = data.get('epsilon', 0.1)
            Q, policy = await sync_to_async(Monte_Carlo_Control_Epsilon_Greedy)(
                env, num_episodes=num_episodes, gamma=gamma, epsilon=epsilon
            )
            V_from_Q = {state: max(actions.values()) if actions else 0 for state, actions in Q.items()}
            result = {
                'value_function': format_value_function_for_grid(V_from_Q, grid_size),
                'policy': format_policy_for_grid(policy, grid_size)
            }
        
        elif algorithm == 'td_zero':
            alpha = data.get('alpha', 0.1)
            V, history = await sync_to_async(TD_Zero)(env, num_episodes=num_episodes, alpha=alpha, gamma=gamma)
            result = {
                'value_function': format_value_function_for_grid(V, grid_size),
                'episode_rewards': history.get('episode_rewards', [])[-100:]
            }
        
        elif algorithm == 'sarsa':
            alpha = data.get('alpha', 0.1)
            epsilon = data.get('epsilon', 0.1)
            Q, policy, history = await sync_to_async(SARSA)(env, num_episodes=num_episodes, alpha=alpha, gamma=gamma, epsilon=epsilon)
            V_from_Q = {state: max(actions.values()) if actions else 0 for state, actions in Q.items()}
            result = {
                'value_function': format_value_function_for_grid(V_from_Q, grid_size),
                'policy': format_policy_for_grid(policy, grid_size),
                'episode_rewards': history.get('episode_rewards', [])[-100:]
            }
        
        elif algorithm == 'n_step_td':
            alpha = data.get('alpha', 0.1)
            n_steps = data.get('n_steps', 3)
            V, history = await sync_to_async(N_Step_TD)(env, num_episodes=num_episodes, n=n_steps, alpha=alpha, gamma=gamma)
            result = {
                'value_function': format_value_function_for_grid(V, grid_size),
                'episode_rewards': history.get('episode_rewards', [])[-100:],
                'n_steps': n_steps
            }
        
        await self.send(json.dumps({
            'type': 'algorithm_complete',
            'algorithm': algorithm,
            **result
        }))


class PolicyVisualizationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for policy visualization.
    Allows stepping through environment using learned policy.
    """
    
    async def connect(self):
        self.env = None
        self.policy = None
        await self.accept()
        await self.send(json.dumps({
            'type': 'connection_established',
            'message': 'Connected to Policy Visualization WebSocket'
        }))
    
    async def disconnect(self, close_code):
        if self.env:
            self.env.close()
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        action_type = data.get('type')
        
        if action_type == 'init_with_policy':
            await self.init_with_policy(data)
        elif action_type == 'auto_play':
            await self.auto_play(data)
        elif action_type == 'step_with_policy':
            await self.step_with_policy()
        else:
            await self.send(json.dumps({
                'type': 'error',
                'message': f'Unknown action type: {action_type}'
            }))
    
    async def init_with_policy(self, data):
        """Initialize environment and compute optimal policy"""
        grid_size = data.get('grid_size', 4)
        agent_pos = data.get('agent_position')
        goal_pos = data.get('goal_position')
        gamma = data.get('gamma', 0.9)
        
        self.env = GridworldEnv(
            GRID_SIZE=grid_size,
            Max_Steps=50,
            Agent_Start_Pos=tuple(agent_pos) if agent_pos else None,
            Goal_Pos=tuple(goal_pos) if goal_pos else None
        )
        
        observation = self.env.reset()
        
        # Compute optimal policy
        _, self.policy = await sync_to_async(Value_Iteration)(self.env, gamma=gamma)
        
        await self.send(json.dumps({
            'type': 'initialized',
            'state': self.env.get_state_dict(),
            'observation': observation.tolist(),
            'policy_computed': True
        }))
    
    async def step_with_policy(self):
        """Take one step using the learned policy"""
        if not self.env or not self.policy:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Environment or policy not initialized'
            }))
            return
        
        state = tuple(np.concatenate((self.env.Agent_Position, self.env.Goal_Position)))
        action = self.policy.get(state, 0)
        
        observation, reward, terminated, truncated = self.env.step(action)
        
        action_names = {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}
        
        await self.send(json.dumps({
            'type': 'policy_step',
            'action': int(action),
            'action_name': action_names[action],
            'observation': observation.tolist(),
            'reward': float(reward),
            'terminated': terminated,
            'truncated': truncated,
            'state': self.env.get_state_dict()
        }))
    
    async def auto_play(self, data):
        """Automatically play through using policy with delay"""
        if not self.env or not self.policy:
            await self.send(json.dumps({
                'type': 'error',
                'message': 'Environment or policy not initialized'
            }))
            return
        
        delay = data.get('delay', 0.5)  # Delay between steps in seconds
        max_steps = data.get('max_steps', 50)
        
        # Reset environment
        observation = self.env.reset()
        
        await self.send(json.dumps({
            'type': 'auto_play_started',
            'state': self.env.get_state_dict()
        }))
        
        action_names = {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}
        step_count = 0
        total_reward = 0
        
        while step_count < max_steps:
            state = tuple(np.concatenate((self.env.Agent_Position, self.env.Goal_Position)))
            action = self.policy.get(state, 0)
            
            observation, reward, terminated, truncated = self.env.step(action)
            total_reward += reward
            step_count += 1
            
            await self.send(json.dumps({
                'type': 'auto_play_step',
                'step': step_count,
                'action': int(action),
                'action_name': action_names[action],
                'observation': observation.tolist(),
                'reward': float(reward),
                'total_reward': float(total_reward),
                'terminated': terminated,
                'truncated': truncated,
                'state': self.env.get_state_dict()
            }))
            
            if terminated or truncated:
                break
            
            await asyncio.sleep(delay)
        
        await self.send(json.dumps({
            'type': 'auto_play_complete',
            'total_steps': step_count,
            'total_reward': float(total_reward),
            'reached_goal': terminated
        }))
