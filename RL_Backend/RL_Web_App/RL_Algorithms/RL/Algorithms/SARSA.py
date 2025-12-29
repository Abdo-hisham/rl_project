from collections import defaultdict
import numpy as np
import random


def SARSA(env, num_episodes, alpha=0.1, gamma=0.9, epsilon=0.1, callback=None):
    Q = defaultdict(lambda: defaultdict(float))
    
    for state in env.States:
        for action in range(env.action_space.n):
            Q[state][action] = 0.0
    
    episode_rewards = []
    q_history = []
    policy_changes = []
    
    def epsilon_greedy_action(state, eps):
        if np.random.rand() < eps:
            return random.choice(range(env.action_space.n))
        else:
            action_values = [Q[state][a] for a in range(env.action_space.n)]
            return int(np.argmax(action_values))
    
    for episode in range(num_episodes):
        state = tuple(env.reset())
        action = epsilon_greedy_action(state, epsilon)
        
        episode_reward = 0
        trajectory = []
        
        while True:
            next_obs, reward, terminated, truncated = env.step(action)
            next_state = tuple(int(x) for x in next_obs)
            episode_reward += reward
            
            trajectory.append({
                'state': list(state),
                'action': int(action),
                'reward': float(reward),
                'next_state': list(next_state)
            })
            
            if terminated or truncated:
                Q[state][action] += alpha * (reward - Q[state][action])
                break
            
            next_action = epsilon_greedy_action(next_state, epsilon)
            
            td_target = reward + gamma * Q[next_state][next_action]
            Q[state][action] += alpha * (td_target - Q[state][action])
            
            state = next_state
            action = next_action
        
        episode_rewards.append(episode_reward)
        
        if (episode + 1) % max(1, num_episodes // 10) == 0:
            q_snapshot = {str(s): dict(Q[s]) for s in Q}
            q_history.append(q_snapshot)
        
        if callback:
            callback(episode, trajectory, dict(Q), None)
    
    policy = {}
    for state in env.States:
        action_values = [Q[state][a] for a in range(env.action_space.n)]
        best_action = int(np.argmax(action_values))
        policy[state] = {a: 1.0 if a == best_action else 0.0 for a in range(env.action_space.n)}
    
    history = {
        'episode_rewards': episode_rewards,
        'q_history': q_history,
        'policy_changes': policy_changes
    }
    
    return dict(Q), policy, history
