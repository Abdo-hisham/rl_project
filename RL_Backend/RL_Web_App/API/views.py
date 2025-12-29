from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from RL_Algorithms.RL.Environments.Gridworld import GridworldEnv
from RL_Algorithms.RL.Environments.Breakout import BreakoutEnv
from RL_Algorithms.RL.Environments.FrozenLake import FrozenLakeEnv
from RL_Algorithms.RL.Algorithms.Value_Iteration import Value_Iteration
from RL_Algorithms.RL.Algorithms.Policy_Iteration import Policy_Iteration
from RL_Algorithms.RL.Algorithms.Monte_Carlo import (
    Monte_Carlo_First_Visit,
    Monte_Carlo_Every_Visit,
    Monte_Carlo_Control_Epsilon_Greedy
)
from RL_Algorithms.RL.Algorithms.Tamporal_Difference import TD_Zero


class EnvironmentInfoAPIView(APIView):
    """Get information about available environments"""
    
    def get(self, request):
        return Response({
            'environments': [
                {
                    'id': 'gridworld',
                    'name': 'Gridworld',
                    'description': 'A grid-based environment where an agent navigates to a goal',
                    'parameters': {
                        'grid_size': 'Size of the grid (default: 5)',
                        'max_steps': 'Maximum steps per episode (default: 50)',
                        'agent_position': 'Starting position of agent [x, y]',
                        'goal_position': 'Position of goal [x, y]'
                    },
                    'actions': {
                        0: 'Up',
                        1: 'Down',
                        2: 'Left',
                        3: 'Right'
                    },
                    'rewards': {
                        'step': -1,
                        'goal': 10
                    }
                },
                {
                    'id': 'breakout',
                    'name': 'Breakout',
                    'description': 'A simplified Breakout game where a paddle catches a bouncing ball',
                    'parameters': {
                        'grid_size': 'Size of the playing area (default: 5)',
                        'max_steps': 'Maximum steps per episode (default: 100)'
                    },
                    'actions': {
                        0: 'Stay',
                        1: 'Left',
                        2: 'Right'
                    },
                    'rewards': {
                        'catch': 10,
                        'miss': -10
                    }
                },
                {
                    'id': 'frozen_lake',
                    'name': 'Frozen Lake',
                    'description': 'Navigate a frozen lake to reach the goal while avoiding holes',
                    'parameters': {
                        'grid_size': 'Size of the grid (4 or 8)',
                        'max_steps': 'Maximum steps per episode (default: 50)',
                        'is_slippery': 'Whether the ice is slippery (default: false)'
                    },
                    'actions': {
                        0: 'Up',
                        1: 'Down',
                        2: 'Left',
                        3: 'Right'
                    },
                    'rewards': {
                        'step': -1,
                        'hole': -10,
                        'goal': 10
                    }
                }
            ]
        })


class CreateEnvironmentAPIView(APIView):
    """Create and initialize a new environment"""
    
    def post(self, request):
        environment = request.data.get('environment', 'gridworld')
        grid_size = request.data.get('grid_size', 5)
        max_steps = request.data.get('max_steps', 50 if environment == 'gridworld' else 100)
        agent_position = request.data.get('agent_position')
        goal_position = request.data.get('goal_position')
        
        try:
            if environment == 'breakout':
                env = BreakoutEnv(
                    GRID_SIZE=grid_size,
                    Max_Steps=max_steps
                )
                observation = env.reset()
                
                return Response({
                    'status': 'success',
                    'environment': 'Breakout',
                    'state': env.get_state_dict(),
                    'observation': observation.tolist()
                }, status=status.HTTP_201_CREATED)
            
            elif environment == 'frozen_lake':
                is_slippery = request.data.get('is_slippery', False)
                env = FrozenLakeEnv(
                    GRID_SIZE=grid_size,
                    Max_Steps=max_steps,
                    is_slippery=is_slippery
                )
                observation = env.reset()
                
                return Response({
                    'status': 'success',
                    'environment': 'FrozenLake',
                    'state': env.get_state_dict(),
                    'observation': observation.tolist()
                }, status=status.HTTP_201_CREATED)
            
            else:
                env = GridworldEnv(
                    GRID_SIZE=grid_size,
                    Max_Steps=max_steps,
                    Agent_Start_Pos=tuple(agent_position) if agent_position else None,
                    Goal_Pos=tuple(goal_position) if goal_position else None
                )
                observation = env.reset()
                
                return Response({
                    'status': 'success',
                    'environment': 'Gridworld',
                    'state': env.get_state_dict(),
                    'observation': observation.tolist()
                }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class StepEnvironmentAPIView(APIView):
    """Take a step in the environment (stateless - recreates env from state)"""
    
    def post(self, request):
        agent_position = request.data.get('agent_position')
        goal_position = request.data.get('goal_position')
        action = request.data.get('action')
        grid_size = request.data.get('grid_size', 5)
        
        if agent_position is None or goal_position is None:
            return Response({
                'status': 'error',
                'message': 'agent_position and goal_position are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if action is None:
            return Response({
                'status': 'error',
                'message': 'action is required (0=Up, 1=Down, 2=Left, 3=Right)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            env = GridworldEnv(
                GRID_SIZE=grid_size,
                Max_Steps=50,
                Agent_Start_Pos=tuple(agent_position),
                Goal_Pos=tuple(goal_position)
            )
            env.reset()
            
            observation, reward, terminated, truncated = env.step(action)
            
            return Response({
                'status': 'success',
                'observation': observation.tolist(),
                'agent_position': env.Agent_Position.tolist(),
                'goal_position': env.Goal_Position.tolist(),
                'reward': float(reward),
                'terminated': terminated,
                'truncated': truncated,
                'action_taken': action,
                'action_name': {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}[action]
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class AlgorithmInfoAPIView(APIView):
    """Get information about available algorithms"""
    
    def get(self, request):
        return Response({
            'algorithms': [
                {
                    'name': 'value_iteration',
                    'type': 'Dynamic Programming',
                    'description': 'Computes optimal value function and policy iteratively',
                    'parameters': ['gamma', 'theta']
                },
                {
                    'name': 'policy_iteration',
                    'type': 'Dynamic Programming',
                    'description': 'Alternates between policy evaluation and improvement',
                    'parameters': ['gamma', 'theta']
                },
                {
                    'name': 'monte_carlo_first_visit',
                    'type': 'Monte Carlo',
                    'description': 'Estimates value function from sampled episodes (first visit)',
                    'parameters': ['num_episodes', 'gamma']
                },
                {
                    'name': 'monte_carlo_every_visit',
                    'type': 'Monte Carlo',
                    'description': 'Estimates value function from sampled episodes (every visit)',
                    'parameters': ['num_episodes', 'gamma']
                },
                {
                    'name': 'monte_carlo_control',
                    'type': 'Monte Carlo Control',
                    'description': 'Learns optimal policy using epsilon-greedy exploration',
                    'parameters': ['num_episodes', 'gamma', 'epsilon']
                },
                {
                    'name': 'td_zero',
                    'type': 'Temporal Difference',
                    'description': 'Online learning with bootstrapping (TD(0))',
                    'parameters': ['num_episodes', 'alpha', 'gamma']
                }
            ]
        })


class RunAlgorithmAPIView(APIView):
    """Run a specified algorithm on the Gridworld environment"""
    
    def post(self, request):
        algorithm = request.data.get('algorithm')
        grid_size = request.data.get('grid_size', 4)
        gamma = request.data.get('gamma', 0.9)
        
        if not algorithm:
            return Response({
                'status': 'error',
                'message': 'algorithm parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            env = GridworldEnv(GRID_SIZE=grid_size, Max_Steps=50)
            result = {'algorithm': algorithm, 'grid_size': grid_size, 'gamma': gamma}
            
            if algorithm == 'value_iteration':
                theta = request.data.get('theta', 1e-6)
                V, policy = Value_Iteration(env, gamma=gamma, theta=theta)
                result['value_function'] = {str(k): v for k, v in V.items()}
                result['policy'] = {str(k): int(v) for k, v in policy.items()}
                
            elif algorithm == 'policy_iteration':
                theta = request.data.get('theta', 1e-6)
                V, policy = Policy_Iteration(env, gamma=gamma, theta=theta)
                result['value_function'] = {str(k): v for k, v in V.items()}
                result['policy'] = {str(k): int(v) for k, v in policy.items()}
                
            elif algorithm == 'monte_carlo_first_visit':
                num_episodes = request.data.get('num_episodes', 500)
                V = Monte_Carlo_First_Visit(env, num_episodes=num_episodes, gamma=gamma)
                result['value_function'] = {str(k): v for k, v in V.items()}
                result['num_episodes'] = num_episodes
                
            elif algorithm == 'monte_carlo_every_visit':
                num_episodes = request.data.get('num_episodes', 500)
                V = Monte_Carlo_Every_Visit(env, num_episodes=num_episodes, gamma=gamma)
                result['value_function'] = {str(k): v for k, v in V.items()}
                result['num_episodes'] = num_episodes
                
            elif algorithm == 'monte_carlo_control':
                num_episodes = request.data.get('num_episodes', 500)
                epsilon = request.data.get('epsilon', 0.1)
                Q, policy = Monte_Carlo_Control_Epsilon_Greedy(
                    env, num_episodes=num_episodes, gamma=gamma, epsilon=epsilon
                )
                result['q_values'] = {str(k): dict(v) for k, v in Q.items()}
                result['policy'] = {str(k): int(v) for k, v in policy.items()}
                result['num_episodes'] = num_episodes
                result['epsilon'] = epsilon
                
            elif algorithm == 'td_zero':
                num_episodes = request.data.get('num_episodes', 500)
                alpha = request.data.get('alpha', 0.1)
                V = TD_Zero(env, num_episodes=num_episodes, alpha=alpha, gamma=gamma)
                result['value_function'] = {str(k): v for k, v in V.items()}
                result['num_episodes'] = num_episodes
                result['alpha'] = alpha
                
            else:
                return Response({
                    'status': 'error',
                    'message': f'Unknown algorithm: {algorithm}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            result['status'] = 'success'
            result['states_count'] = len(result.get('value_function', result.get('q_values', {})))
            
            return Response(result)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetOptimalActionAPIView(APIView):
    """Get the optimal action for a given state using Value Iteration"""
    
    def post(self, request):
        agent_position = request.data.get('agent_position')
        goal_position = request.data.get('goal_position')
        grid_size = request.data.get('grid_size', 5)
        gamma = request.data.get('gamma', 0.9)
        
        if agent_position is None or goal_position is None:
            return Response({
                'status': 'error',
                'message': 'agent_position and goal_position are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            env = GridworldEnv(GRID_SIZE=grid_size, Max_Steps=50)
            _, policy = Value_Iteration(env, gamma=gamma)
            
            state = (agent_position[0], agent_position[1], goal_position[0], goal_position[1])
            action = policy.get(state, 0)
            
            action_names = {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}
            
            return Response({
                'status': 'success',
                'state': state,
                'optimal_action': int(action),
                'action_name': action_names[action]
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetPolicyForGoalAPIView(APIView):
    """Get optimal policy visualization for a specific goal position"""
    
    def post(self, request):
        goal_position = request.data.get('goal_position')
        grid_size = request.data.get('grid_size', 4)
        gamma = request.data.get('gamma', 0.9)
        
        if goal_position is None:
            return Response({
                'status': 'error',
                'message': 'goal_position is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            env = GridworldEnv(GRID_SIZE=grid_size, Max_Steps=50)
            V, policy = Value_Iteration(env, gamma=gamma)
            
            goal_x, goal_y = goal_position
            action_names = {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}
            action_symbols = {0: '↑', 1: '↓', 2: '←', 3: '→'}
            
            policy_grid = []
            value_grid = []
            
            for y in range(grid_size):
                policy_row = []
                value_row = []
                for x in range(grid_size):
                    state = (x, y, goal_x, goal_y)
                    if x == goal_x and y == goal_y:
                        policy_row.append('G')
                        value_row.append(0.0)
                    else:
                        action = policy.get(state, 0)
                        policy_row.append(action_symbols[action])
                        value_row.append(round(V.get(state, 0.0), 2))
                policy_grid.append(policy_row)
                value_grid.append(value_row)
            
            return Response({
                'status': 'success',
                'goal_position': goal_position,
                'grid_size': grid_size,
                'policy_grid': policy_grid,
                'value_grid': value_grid,
                'action_legend': action_symbols
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SimulateEpisodeAPIView(APIView):
    """Simulate a complete episode using the optimal policy for any environment"""
    
    def post(self, request):
        agent_position = request.data.get('agent_position')
        goal_position = request.data.get('goal_position')
        grid_size = request.data.get('grid_size', 4)
        gamma = request.data.get('gamma', 0.9)
        max_steps = request.data.get('max_steps', 50)
        environment = request.data.get('environment', 'gridworld')
        passed_policy = request.data.get('policy')
        is_slippery = request.data.get('is_slippery', False)
        num_brick_rows = request.data.get('num_brick_rows', 2)
        
        try:
            if environment == 'frozen_lake':
                env = FrozenLakeEnv(GRID_SIZE=grid_size, Max_Steps=max_steps, is_slippery=is_slippery)
            elif environment == 'breakout':
                env = BreakoutEnv(GRID_SIZE=grid_size, Max_Steps=max_steps, num_brick_rows=num_brick_rows)
            else:
                env = GridworldEnv(
                    GRID_SIZE=grid_size,
                    Max_Steps=max_steps,
                    Agent_Start_Pos=tuple(agent_position) if agent_position else None,
                    Goal_Pos=tuple(goal_position) if goal_position else None
                )
            
            if passed_policy and len(passed_policy) > 0:
                policy = {}
                for key, value in passed_policy.items():
                    try:
                        coords = key.strip('()').split(',')
                        if len(coords) >= 2:
                            tuple_key = tuple(int(c.strip()) for c in coords)
                            if len(tuple_key) == 2 and environment == 'gridworld' and goal_position:
                                tuple_key = (tuple_key[0], tuple_key[1], goal_position[0], goal_position[1])
                            policy[tuple_key] = int(value)
                    except (ValueError, IndexError):
                        continue
            else:
                _, policy = Value_Iteration(env, gamma=gamma)
            
            observation = env.reset()
            
            if environment == 'breakout':
                action_names = {0: 'Stay', 1: 'Left', 2: 'Right'}
            else:
                action_names = {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}
            
            if environment == 'breakout':
                trajectory = [{
                    'step': 0,
                    'agent_position': [env.Paddle_Position, env.Ball_Position[1]],
                    'paddle_position': env.Paddle_Position,
                    'ball_position': env.Ball_Position.tolist(),
                    'action': None,
                    'reward': 0
                }]
            else:
                trajectory = [{
                    'step': 0,
                    'agent_position': env.Agent_Position.tolist(),
                    'action': None,
                    'reward': 0
                }]
            
            total_reward = 0
            step = 0
            reached_goal = False
            
            while step < max_steps:
                state = tuple(int(x) for x in observation)
                
                action = policy.get(state, 0)
                
                observation, reward, terminated, truncated = env.step(action)
                total_reward += reward
                step += 1
                
                if environment == 'breakout':
                    traj_entry = {
                        'step': step,
                        'agent_position': [env.Paddle_Position, env.Ball_Position[1]],
                        'paddle_position': env.Paddle_Position,
                        'ball_position': env.Ball_Position.tolist(),
                        'action': int(action),
                        'action_name': action_names.get(action, 'Unknown'),
                        'reward': float(reward)
                    }
                else:
                    traj_entry = {
                        'step': step,
                        'agent_position': env.Agent_Position.tolist(),
                        'action': int(action),
                        'action_name': action_names.get(action, 'Unknown'),
                        'reward': float(reward)
                    }
                
                trajectory.append(traj_entry)
                
                if terminated:
                    reached_goal = True
                    break
                if truncated:
                    break
            
            return Response({
                'status': 'success',
                'environment': environment,
                'trajectory': trajectory,
                'total_steps': step,
                'total_reward': float(total_reward),
                'reached_goal': reached_goal,
                'start_position': trajectory[0]['agent_position'],
                'goal_position': goal_position
            })
            
        except Exception as e:
            import traceback
            return Response({
                'status': 'error',
                'message': str(e),
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)