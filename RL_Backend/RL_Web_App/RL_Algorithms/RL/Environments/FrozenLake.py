import numpy as np
import gymnasium as gym
from gymnasium import spaces


class FrozenLakeEnv(gym.Env):
    """
    Frozen Lake Environment
    
    Actions: 0=Up (y-1), 1=Down (y+1), 2=Left (x-1), 3=Right (x+1)
    
    State: (Agent_X, Agent_Y, Goal_X, Goal_Y)
    
    Slippery: When enabled, there's 1/3 chance each for:
    - Moving in intended direction
    - Moving perpendicular left
    - Moving perpendicular right
    """

    MAPS = {
        4: [
            "SFFF",
            "FHFH",
            "FFFH",
            "HFFG"
        ],
        8: [
            "SFFFFFFF",
            "FFFFFFFF",
            "FFFHFFFF",
            "FFFFFHFF",
            "FFFHFFFF",
            "FHHFFFHF",
            "FHFFHFHF",
            "FFFHFFFG"
        ]
    }

    PERPENDICULAR = {
        0: [2, 3],
        1: [2, 3],
        2: [0, 1],
        3: [0, 1],
    }

    def __init__(self, GRID_SIZE=4, Max_Steps=50, is_slippery=False):
        super().__init__()

        self.GRID_SIZE = GRID_SIZE
        self.Max_Steps = Max_Steps
        self.is_slippery = is_slippery
        self.action_space = spaces.Discrete(4)

        self.lake_map = self.MAPS.get(GRID_SIZE, self._generate_map(GRID_SIZE))

        self.start_pos = self._find_cell('S')
        self.goal_pos = self._find_cell('G')
        self.holes = self._find_all_cells('H')

        low = np.array([0, 0, 0, 0], dtype=np.int32)
        high = np.array([GRID_SIZE - 1] * 4, dtype=np.int32)
        self.observation_space = spaces.Box(low, high, dtype=np.int32)

        Goal_X, Goal_Y = self.goal_pos
        self.States = [
            (Agent_X, Agent_Y, Goal_X, Goal_Y)
            for Agent_X in range(GRID_SIZE)
            for Agent_Y in range(GRID_SIZE)
        ]

        self.Policy = {
            State: {0: 0.25, 1: 0.25, 2: 0.25, 3: 0.25}
            for State in self.States
        }

        self.Agent_Position = None
        self.Goal_Position = None
        self.Current_Step = 0

    def _generate_map(self, size):
        """Generate a random map for non-standard sizes"""
        lake_map = [['F' for _ in range(size)] for _ in range(size)]
        lake_map[0][0] = 'S'
        lake_map[size-1][size-1] = 'G'

        num_holes = max(1, (size * size - 2) // 5)
        placed = 0

        while placed < num_holes:
            x, y = np.random.randint(0, size), np.random.randint(0, size)
            if lake_map[y][x] == 'F':
                lake_map[y][x] = 'H'
                placed += 1

        return [''.join(row) for row in lake_map]

    def _find_cell(self, cell_type):
        """Find first occurrence of cell type"""
        for y, row in enumerate(self.lake_map):
            for x, cell in enumerate(row):
                if cell == cell_type:
                    return (x, y)
        return (0, 0)

    def _find_all_cells(self, cell_type):
        """Find all occurrences of cell type"""
        cells = []
        for y, row in enumerate(self.lake_map):
            for x, cell in enumerate(row):
                if cell == cell_type:
                    cells.append((x, y))
        return cells

    def _get_cell(self, x, y):
        """Get cell type at position"""
        if 0 <= x < self.GRID_SIZE and 0 <= y < self.GRID_SIZE:
            return self.lake_map[y][x]
        return 'F'

    def _apply_action(self, x, y, action):
        """Apply action and return new position (with boundary checking)"""
        if action == 0:
            y = max(0, y - 1)
        elif action == 1:
            y = min(self.GRID_SIZE - 1, y + 1)
        elif action == 2:
            x = max(0, x - 1)
        elif action == 3:
            x = min(self.GRID_SIZE - 1, x + 1)
        return x, y

    def _get_slippery_actions(self, intended_action):
        """
        Get possible actions when surface is slippery.
        Returns list of (action, probability) tuples.
        Standard FrozenLake: 1/3 each for intended and two perpendicular directions
        """
        if not self.is_slippery:
            return [(intended_action, 1.0)]
        
        perp = self.PERPENDICULAR[intended_action]
        return [
            (intended_action, 1/3),
            (perp[0], 1/3),
            (perp[1], 1/3)
        ]

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        self.Agent_Position = np.array(self.start_pos, dtype=np.int32)
        self.Goal_Position = np.array(self.goal_pos, dtype=np.int32)
        self.Current_Step = 0

        Observation = np.concatenate((self.Agent_Position, self.Goal_Position))
        return Observation

    def get_state_dict(self):
        """Return current state as a dictionary for API responses"""
        return {
            'agent_position': self.Agent_Position.tolist() if self.Agent_Position is not None else None,
            'goal_position': self.Goal_Position.tolist() if self.Goal_Position is not None else None,
            'grid_size': self.GRID_SIZE,
            'current_step': self.Current_Step,
            'max_steps': self.Max_Steps,
            'lake_map': self.lake_map,
            'holes': [list(h) for h in self.holes],
            'is_slippery': self.is_slippery
        }

    def render(self):
        """Return render data for visualization"""
        return {
            **self.get_state_dict(),
            'cell_types': {
                f"({x},{y})": self._get_cell(x, y)
                for x in range(self.GRID_SIZE)
                for y in range(self.GRID_SIZE)
            }
        }

    def step(self, action):
        """
        Take a step in the environment.
        If slippery, action may be modified with 1/3 probability each for:
        - intended direction
        - perpendicular left
        - perpendicular right
        """
        if self.is_slippery:
            slippery_actions = self._get_slippery_actions(action)
            probs = [p for _, p in slippery_actions]
            actions = [a for a, _ in slippery_actions]
            action = self.np_random.choice(actions, p=probs)

        new_x, new_y = self._apply_action(
            self.Agent_Position[0], 
            self.Agent_Position[1], 
            action
        )
        self.Agent_Position[0] = new_x
        self.Agent_Position[1] = new_y

        self.Current_Step += 1

        current_cell = self._get_cell(new_x, new_y)

        Reward = -0.01
        Terminated = False

        if current_cell == 'H':
            Reward = -1.0
            Terminated = True
        elif current_cell == 'G':
            Reward = 1.0
            Terminated = True

        Truncated = self.Current_Step >= self.Max_Steps

        Observation = np.concatenate((self.Agent_Position, self.Goal_Position))
        return Observation, Reward, Terminated, Truncated

    def Transition(self, State, Action):
        """
        Return list of (next_state, reward, done) tuples.
        Used by model-based algorithms (Value Iteration, Policy Iteration).
        For slippery surface, returns expected value weighted transitions.
        """
        Agent_X, Agent_Y, Goal_X, Goal_Y = State

        if not self.is_slippery:
            new_x, new_y = self._apply_action(Agent_X, Agent_Y, Action)
            Next_State = (new_x, new_y, Goal_X, Goal_Y)
            cell = self._get_cell(new_x, new_y)

            if cell == 'H':
                return [(Next_State, -1.0, True)]
            elif cell == 'G':
                return [(Next_State, 1.0, True)]
            else:
                return [(Next_State, -0.01, False)]

        transitions = []
        action_probs = self._get_slippery_actions(Action)
        
        for actual_action, prob in action_probs:
            new_x, new_y = self._apply_action(Agent_X, Agent_Y, actual_action)
            Next_State = (new_x, new_y, Goal_X, Goal_Y)
            cell = self._get_cell(new_x, new_y)

            if cell == 'H':
                Reward, Done = -1.0, True
            elif cell == 'G':
                Reward, Done = 1.0, True
            else:
                Reward, Done = -0.01, False

            transitions.append((Next_State, Reward, Done, prob))

        aggregated = {}
        for next_state, reward, done, prob in transitions:
            key = next_state
            if key in aggregated:
                old_reward, old_done, old_prob = aggregated[key]
                new_prob = old_prob + prob
                new_reward = (old_reward * old_prob + reward * prob) / new_prob
                aggregated[key] = (new_reward, done, new_prob)
            else:
                aggregated[key] = (reward, done, prob)
        
        return [(ns, r, d) for ns, (r, d, p) in aggregated.items()]

    def close(self):
        pass
