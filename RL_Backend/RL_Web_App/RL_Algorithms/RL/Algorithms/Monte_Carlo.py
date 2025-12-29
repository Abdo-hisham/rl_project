from collections import defaultdict
from RL_Algorithms.RL.utils import Generate_Episode, Generate_Epsilon_Greedy_Episode
import numpy as np


def Monte_Carlo_First_Visit(env, num_episodes, gamma=0.9):
    V = defaultdict(float)
    Returns = defaultdict(list)

    for _ in range(num_episodes):
        Episode_Data = Generate_Episode(env, policy=env.Policy)
        G = 0
        Visited_States = set()

        for t in reversed(range(len(Episode_Data))):
            state, action, reward = Episode_Data[t]
            G = gamma * G + reward

            if state not in Visited_States:
                Returns[state].append(G)
                V[state] = np.mean(Returns[state])
                Visited_States.add(state)

    return dict(V)


def Monte_Carlo_Every_Visit(env, num_episodes, gamma=0.9):
    V = defaultdict(float)
    Returns = defaultdict(list)

    for _ in range(num_episodes):
        Episode_Data = Generate_Episode(env, policy=env.Policy)
        G = 0

        for t in reversed(range(len(Episode_Data))):
            state, action, reward = Episode_Data[t]
            G = gamma * G + reward
            Returns[state].append(G)
            V[state] = np.mean(Returns[state])

    return dict(V)


def Monte_Carlo_Control_Epsilon_Greedy(env, num_episodes, gamma=0.9, epsilon=0.1):
    Q = defaultdict(lambda: defaultdict(float))
    Returns = defaultdict(lambda: defaultdict(list))

    for _ in range(num_episodes):
        Episode_Data = Generate_Epsilon_Greedy_Episode(env, Q, epsilon)
        G = 0
        Visited_State_Actions = set()

        for t in reversed(range(len(Episode_Data))):
            state, action, reward = Episode_Data[t]
            G = gamma * G + reward

            if (state, action) not in Visited_State_Actions:
                Returns[state][action].append(G)
                Q[state][action] = np.mean(Returns[state][action])
                Visited_State_Actions.add((state, action))

    Policy = {}
    for state in Q:
        if Q[state]:
            best_action = max(Q[state], key=Q[state].get)
            Policy[state] = best_action

    return dict(Q), Policy