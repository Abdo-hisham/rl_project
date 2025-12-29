import numpy as np


def Policy_Evaluation(env, policy, gamma=0.9, theta=1e-6):
    V = {State: 0.0 for State in env.States}

    while True:
        Delta = 0

        for State in env.States:
            Old_Value = V[State]
            New_Value = 0.0

            if isinstance(policy[State], dict):
                for Action, Probability_Action in policy[State].items():
                    for Next_State, Reward, Done in env.Transition(State, Action):
                        if Done:
                            New_Value += Probability_Action * Reward
                        else:
                            New_Value += Probability_Action * (Reward + gamma * V[Next_State])
            else:
                Action = policy[State]
                for Next_State, Reward, Done in env.Transition(State, Action):
                    if Done:
                        New_Value += Reward
                    else:
                        New_Value += Reward + gamma * V[Next_State]

            V[State] = New_Value
            Delta = max(Delta, abs(Old_Value - New_Value))

        if Delta < theta:
            break

    return V


def Policy_Improvement(env, V, Policy, gamma=0.9):
    New_Policy = {}
    Policy_Stable = True

    for State in env.States:
        Old_Action = Policy[State]
        Action_Values = []

        for Action in range(env.action_space.n):
            Action_Value = 0.0
            for Next_State, Reward, Done in env.Transition(State, Action):
                if Done:
                    Action_Value += Reward
                else:
                    Action_Value += Reward + gamma * V[Next_State]
            Action_Values.append(Action_Value)

        Best_Action = np.argmax(Action_Values)
        New_Policy[State] = Best_Action

        if Old_Action != New_Policy[State]:
            Policy_Stable = False

    return New_Policy, Policy_Stable


def Policy_Iteration(env, gamma=0.9, theta=1e-6):
    Policy = {State: np.random.choice(range(env.action_space.n)) for State in env.States}
    V = {State: 0.0 for State in env.States}

    while True:
        V = Policy_Evaluation(env, Policy, gamma, theta)
        Policy, Policy_Stable = Policy_Improvement(env, V, Policy, gamma)

        if Policy_Stable:
            break

    return V, Policy