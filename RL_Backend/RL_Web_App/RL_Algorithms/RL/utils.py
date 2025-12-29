import numpy as np
import random


def Generate_Episode(env, policy):
    Episode = []
    State = env.reset()
    State = tuple(State)
    num_actions = env.action_space.n
    default_probs = [1.0 / num_actions] * num_actions

    while True:
        if State in policy:
            Probabilities = [policy[State][Action] for Action in range(num_actions)]
        else:
            Probabilities = default_probs
        Action = np.random.choice(range(num_actions), p=Probabilities)
        Next_State, Reward, Terminated, Truncated = env.step(Action)
        Next_State = tuple(Next_State)
        Episode.append((State, Action, Reward))

        if Terminated or Truncated:
            break

        State = Next_State

    return Episode


def Generate_Epsilon_Greedy_Episode(env, Q, epsilon):
    Episode = []
    State = env.reset()
    State = tuple(State)

    while True:
        if np.random.rand() < epsilon:
            Action = random.choice(range(env.action_space.n))
        else:
            Action_Values = [Q[State][action] for action in range(env.action_space.n)]
            Action = np.argmax(Action_Values)

        Next_State, Reward, Terminated, Truncated = env.step(Action)
        Next_State = tuple(Next_State)
        Episode.append((State, Action, Reward))

        if Terminated or Truncated:
            break

        State = Next_State

    return Episode