import numpy as np
import gymnasium as gym
from gymnasium import spaces


class BreakoutEnv(gym.Env):
    """
    Breakout Environment - Markovian version with brick_mask in state.
    
    State: (Paddle_X, Ball_X, Ball_Y, Ball_Dir, brick_mask)
    - brick_mask: integer bitmask representing which bricks are present
    - Each bit position corresponds to a brick position (row * GRID_SIZE + col)
    
    Actions: 0=Stay, 1=Left, 2=Right
    
    Ball Directions: 0=Up-Left, 1=Up-Right, 2=Down-Left, 3=Down-Right
    """

    def __init__(self, GRID_SIZE=5, Max_Steps=100, num_brick_rows=2):
        super().__init__()

        self.GRID_SIZE = GRID_SIZE
        self.Max_Steps = Max_Steps
        self.num_brick_rows = num_brick_rows
        self.num_bricks = GRID_SIZE * num_brick_rows
        self.action_space = spaces.Discrete(3)

        low = np.array([0, 0, 0, 0, 0], dtype=np.int64)
        max_brick_mask = (1 << self.num_bricks) - 1
        high = np.array([GRID_SIZE - 1, GRID_SIZE - 1, GRID_SIZE - 1, 3, max_brick_mask], dtype=np.int64)
        self.observation_space = spaces.Box(low, high, dtype=np.int64)

        self.States = [
            (Paddle_X, Ball_X, Ball_Y, Ball_Dir, 0)
            for Paddle_X in range(GRID_SIZE)
            for Ball_X in range(GRID_SIZE)
            for Ball_Y in range(GRID_SIZE)
            for Ball_Dir in range(4)
        ]

        self.Policy = {
            State: {0: 1/3, 1: 1/3, 2: 1/3}
            for State in self.States
        }

        self.Paddle_Position = None
        self.Ball_Position = None
        self.Ball_Direction = None
        self.Bricks = None
        self.brick_mask = 0
        self.Current_Step = 0
        self.Score = 0

    def _brick_to_bit(self, x, y):
        """Convert brick position to bit index"""
        return y * self.GRID_SIZE + x

    def _bricks_to_mask(self, bricks):
        """Convert brick set to bitmask"""
        mask = 0
        for x, y in bricks:
            mask |= (1 << self._brick_to_bit(x, y))
        return mask

    def _mask_to_bricks(self, mask):
        """Convert bitmask to brick set"""
        bricks = set()
        for y in range(self.num_brick_rows):
            for x in range(self.GRID_SIZE):
                bit = self._brick_to_bit(x, y)
                if mask & (1 << bit):
                    bricks.add((x, y))
        return bricks

    def _has_brick(self, mask, x, y):
        """Check if brick exists at position in mask"""
        if y >= self.num_brick_rows:
            return False
        bit = self._brick_to_bit(x, y)
        return bool(mask & (1 << bit))

    def _remove_brick(self, mask, x, y):
        """Remove brick from mask"""
        bit = self._brick_to_bit(x, y)
        return mask & ~(1 << bit)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        self.Paddle_Position = self.GRID_SIZE // 2
        self.Ball_Position = np.array([self.GRID_SIZE // 2, self.GRID_SIZE - 2], dtype=np.int32)
        self.Ball_Direction = self.np_random.choice([0, 1])

        self.Bricks = set()
        for y in range(self.num_brick_rows):
            for x in range(self.GRID_SIZE):
                self.Bricks.add((x, y))
        
        self.brick_mask = self._bricks_to_mask(self.Bricks)
        self.Current_Step = 0
        self.Score = 0

        return self._get_observation()

    def _get_observation(self):
        """Get Markovian observation including brick_mask"""
        return np.array([
            self.Paddle_Position,
            self.Ball_Position[0],
            self.Ball_Position[1],
            self.Ball_Direction,
            self.brick_mask
        ], dtype=np.int64)

    def get_state_dict(self):
        """Return current state as a dictionary for API responses"""
        return {
            'paddle_position': int(self.Paddle_Position) if self.Paddle_Position is not None else None,
            'ball_position': self.Ball_Position.tolist() if self.Ball_Position is not None else None,
            'ball_direction': int(self.Ball_Direction) if self.Ball_Direction is not None else None,
            'bricks': [list(b) for b in self.Bricks] if self.Bricks else [],
            'brick_mask': int(self.brick_mask),
            'grid_size': self.GRID_SIZE,
            'current_step': self.Current_Step,
            'max_steps': self.Max_Steps,
            'score': self.Score,
            'num_brick_rows': self.num_brick_rows
        }

    def _compute_ball_movement(self, ball_x, ball_y, ball_dir, paddle_x, brick_mask):
        """
        Compute ball movement and handle collisions.
        Returns: (new_x, new_y, new_dir, reward, done, new_brick_mask, brick_hit)
        """
        dx = -1 if ball_dir in [0, 2] else 1
        dy = -1 if ball_dir in [0, 1] else 1

        new_x = ball_x + dx
        new_y = ball_y + dy
        new_mask = brick_mask
        brick_hit = False
        reward = 0
        done = False

        if new_x < 0 or new_x >= self.GRID_SIZE:
            dx = -dx
            new_x = ball_x + dx

        if new_y < 0:
            dy = -dy
            new_y = ball_y + dy

        if dx < 0 and dy < 0:
            new_dir = 0
        elif dx > 0 and dy < 0:
            new_dir = 1
        elif dx < 0 and dy > 0:
            new_dir = 2
        else:
            new_dir = 3

        if self._has_brick(brick_mask, new_x, new_y):
            new_mask = self._remove_brick(brick_mask, new_x, new_y)
            new_dir = (new_dir + 2) % 4
            reward = 1
            brick_hit = True

        if new_y >= self.GRID_SIZE - 1:
            if new_x == paddle_x:
                new_dir = 0 if new_dir == 2 else 1
            else:
                reward = -10
                done = True

        if new_mask == 0:
            reward = 10
            done = True

        return new_x, new_y, new_dir, reward, done, new_mask, brick_hit

    def step(self, action):
        if action == 1:
            self.Paddle_Position = max(0, self.Paddle_Position - 1)
        elif action == 2:
            self.Paddle_Position = min(self.GRID_SIZE - 1, self.Paddle_Position + 1)

        new_x, new_y, new_dir, reward, done, new_mask, brick_hit = self._compute_ball_movement(
            self.Ball_Position[0],
            self.Ball_Position[1],
            self.Ball_Direction,
            self.Paddle_Position,
            self.brick_mask
        )

        self.Ball_Position[0] = new_x
        self.Ball_Position[1] = new_y
        self.Ball_Direction = new_dir
        self.brick_mask = new_mask
        self.Bricks = self._mask_to_bricks(new_mask)
        
        if brick_hit:
            self.Score += 1

        self.Current_Step += 1
        truncated = self.Current_Step >= self.Max_Steps

        return self._get_observation(), reward, done, truncated

    def Transition(self, State, Action):
        """
        Model-based transition for planning algorithms.
        State is (Paddle_X, Ball_X, Ball_Y, Ball_Dir, brick_mask)
        """
        if len(State) == 4:
            Paddle_X, Ball_X, Ball_Y, Ball_Dir = State
            brick_mask = self._bricks_to_mask(self.Bricks) if self.Bricks else 0
        else:
            Paddle_X, Ball_X, Ball_Y, Ball_Dir, brick_mask = State

        if Action == 1:
            Paddle_X = max(0, Paddle_X - 1)
        elif Action == 2:
            Paddle_X = min(self.GRID_SIZE - 1, Paddle_X + 1)

        new_x, new_y, new_dir, reward, done, new_mask, _ = self._compute_ball_movement(
            Ball_X, Ball_Y, Ball_Dir, Paddle_X, brick_mask
        )

        Next_State = (Paddle_X, new_x, new_y, new_dir, new_mask)
        return [(Next_State, reward, done)]

    def render(self):
        """Return render data for visualization"""
        return {
            **self.get_state_dict(),
            'brick_positions': [(x, y) for x, y in self.Bricks] if self.Bricks else []
        }

    def close(self):
        pass
