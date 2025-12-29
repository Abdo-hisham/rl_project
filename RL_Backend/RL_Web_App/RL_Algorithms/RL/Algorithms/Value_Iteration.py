import numpy as np


def Value_Iteration(env, gamma=0.9, theta=1e-6):
    V = {State: 0.0 for State in env.States}
    Q_Values = {State: {Action: 0.0 for Action in range(env.action_space.n)} for State in env.States}

    while True:
        Delta = 0

        for State in env.States:
            Old_V = V[State]
            Q_Values[State] = {Action: 0.0 for Action in range(env.action_space.n)}

            for Action in range(env.action_space.n):
                for Next_State, Reward, Done in env.Transition(State, Action):
                    if Done:
                        Q_Values[State][Action] += Reward
                    else:
                        Q_Values[State][Action] += Reward + gamma * V[Next_State]

            V[State] = max(Q_Values[State].values())
            Delta = max(Delta, abs(Old_V - V[State]))

        if Delta < theta:
            break

    Policy = {}
    for State in env.States:
        Best_Action = max(Q_Values[State], key=Q_Values[State].get)
        Policy[State] = Best_Action

    return V, Policy