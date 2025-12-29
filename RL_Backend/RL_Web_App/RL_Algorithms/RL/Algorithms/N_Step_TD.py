from collections import defaultdict
import numpy as np


def N_Step_TD(env, num_episodes, n=3, alpha=0.1, gamma=0.9, callback=None):
    V = defaultdict(float)
    num_actions = env.action_space.n
    default_probs = [1.0 / num_actions] * num_actions
    
    episode_rewards = []
    v_history = []
    
    for episode in range(num_episodes):
        states = {}
        rewards = {}
        
        obs = env.reset()
        states[0] = tuple(obs)
        T = float('inf')
        t = 0
        episode_reward = 0
        trajectory = []
        
        while True:
            if t < T:
                state = states[t % (n + 1)]
                if state in env.Policy:
                    probs = [env.Policy[state][a] for a in range(num_actions)]
                else:
                    probs = default_probs
                action = np.random.choice(range(num_actions), p=probs)
                
                next_obs, reward, terminated, truncated = env.step(action)
                next_state = tuple(int(x) for x in next_obs)
                
                rewards[(t + 1) % (n + 1)] = reward
                states[(t + 1) % (n + 1)] = next_state
                episode_reward += reward
                
                trajectory.append({
                    'state': list(state),
                    'action': int(action),
                    'reward': float(reward),
                    'next_state': list(next_state)
                })
                
                if terminated or truncated:
                    T = t + 1
            
            tau = t - n + 1
            
            if tau >= 0:
                G = 0
                for i in range(tau + 1, min(tau + n, int(T)) + 1):
                    G += (gamma ** (i - tau - 1)) * rewards[i % (n + 1)]
                
                if tau + n < T:
                    G += (gamma ** n) * V[states[(tau + n) % (n + 1)]]
                
                state_tau = states[tau % (n + 1)]
                V[state_tau] += alpha * (G - V[state_tau])
            
            if tau == T - 1:
                break
            
            t += 1
        
        episode_rewards.append(episode_reward)
        
        if (episode + 1) % max(1, num_episodes // 10) == 0:
            v_history.append({s: float(v) for s, v in V.items()})
        
        if callback:
            callback(episode, trajectory, dict(V), None)
    
    history = {
        'episode_rewards': episode_rewards,
        'v_history': v_history,
        'n': n
    }
    
    return dict(V), history
