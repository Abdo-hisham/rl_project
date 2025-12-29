import numpy as np
import random
import matplotlib.pyplot as plt
import gymnasium as gym
from gymnasium import spaces



class GridworldEnv(gym.Env):

    def __init__(self, GRID_SIZE=5, Max_Steps=50, Agent_Start_Pos=None, Goal_Pos=None):
        super().__init__()
        
        self.GRID_SIZE = GRID_SIZE
        self.Max_Steps = Max_Steps
        self.action_space = spaces.Discrete(4)
        
        self.Agent_Start_Pos = Agent_Start_Pos
        self.Goal_Pos = Goal_Pos
        
        low = np.array([0, 0], dtype=np.int32)
        high = np.array([GRID_SIZE - 1, GRID_SIZE - 1], dtype=np.int32)
        self.observation_space = spaces.Box(low, high, dtype=np.int32)

        self.States = [
            (Agent_X, Agent_Y, Goal_X, Goal_Y)

            for Agent_X in range(GRID_SIZE)
            for Agent_Y in range(GRID_SIZE)
            for Goal_X in range(GRID_SIZE)
            for Goal_Y in range(GRID_SIZE)
        ]


        self.Policy = {
            State : {
                0 : 0.25,
                1 : 0.25,
                2 : 0.25,
                3 : 0.25
            }

            for State in self.States
        }

        self.Agent_Position = None
        self.Goal_Position = None
        self.Current_Step = 0
        
        if Agent_Start_Pos is not None and Goal_Pos is not None:
            self.Agent_Position = np.array(Agent_Start_Pos, dtype=np.int32)
            self.Goal_Position = np.array(Goal_Pos, dtype=np.int32)

    def reset(self, seed=None, options=None):

        super().reset(seed=seed)

        if self.Agent_Start_Pos is not None:
            Agent_X, Agent_Y = self.Agent_Start_Pos
        else:
            Agent_X = self.np_random.integers(0, self.GRID_SIZE)
            Agent_Y = self.np_random.integers(0, self.GRID_SIZE)

        if self.Goal_Pos is not None:
            Goal_X, Goal_Y = self.Goal_Pos
        else:
            while True:
                Goal_X = self.np_random.integers(0, self.GRID_SIZE)
                Goal_Y = self.np_random.integers(0, self.GRID_SIZE)

                if (Goal_X != Agent_X) or (Goal_Y != Agent_Y):
                    break
        
        self.Current_Step = 0

        self.Agent_Position = np.array([Agent_X, Agent_Y], dtype=np.int32)
        self.Goal_Position = np.array([Goal_X, Goal_Y], dtype=np.int32)

        Observation = np.concatenate((self.Agent_Position, self.Goal_Position))

        return Observation
    
    def get_state_dict(self):
        """Return current state as a dictionary for API responses"""
        return {
            'agent_position': self.Agent_Position.tolist() if self.Agent_Position is not None else None,
            'goal_position': self.Goal_Position.tolist() if self.Goal_Position is not None else None,
            'grid_size': self.GRID_SIZE,
            'current_step': self.Current_Step,
            'max_steps': self.Max_Steps
        }
    

    def step(self, action):

        if action == 0:
            self.Agent_Position[1] = max(0, self.Agent_Position[1] - 1)
        
        elif action == 1:
            self.Agent_Position[1] = min(self.GRID_SIZE - 1, self.Agent_Position[1] + 1)
        
        elif action == 2:
            self.Agent_Position[0] = max(0, self.Agent_Position[0] - 1)
        
        elif action == 3:
            self.Agent_Position[0] = min(self.GRID_SIZE - 1, self.Agent_Position[0] + 1)
        

        self.Current_Step += 1

        Reward = -1 

        Terminated = False

        if np.array_equal(self.Agent_Position, self.Goal_Position):
            Reward = 10
            Terminated = True
        
        Truncated = self.Current_Step >= self.Max_Steps

        
        Observation = np.concatenate((self.Agent_Position, self.Goal_Position))

        return Observation, Reward, Terminated, Truncated
    
    def Transition(self, State, Action):

        Agent_X, Agent_Y, Goal_X, Goal_Y = State

        if Action == 0:

            Agent_Y = max(0 , Agent_Y - 1)

        elif Action == 1:

            Agent_Y = min(self.GRID_SIZE - 1, Agent_Y + 1)

        elif Action == 2:

            Agent_X = max(0 , Agent_X - 1)

        elif Action == 3:

            Agent_X = min(self.GRID_SIZE - 1, Agent_X + 1)

        Next_State = (Agent_X, Agent_Y, Goal_X, Goal_Y)
        Done = (Agent_X, Agent_Y) == (Goal_X, Goal_Y)

        Reward = 10 if Done else -1

        return [(Next_State, Reward, Done)]

    def close(self):
        pass

