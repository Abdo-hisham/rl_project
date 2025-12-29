from collections import defaultdict
from RL_Algorithms.RL.utils import Generate_Episode
import numpy as np


def TD_Zero(env, num_episodes, alpha=0.1, gamma=0.9, callback=None):
    V = defaultdict(float)
    
    episode_rewards = []
    v_history = []
    
    for episode in range(num_episodes):
        Episode_Data = Generate_Episode(env, policy=env.Policy)
        episode_reward = sum(r for _, _, r in Episode_Data)
        episode_rewards.append(episode_reward)
        
        for t in reversed(range(len(Episode_Data) - 1)):
            state, action, reward = Episode_Data[t]
            next_state, _, _ = Episode_Data[t + 1]
            
            TD_Error = (reward + gamma * V[next_state] - V[state])
            V[state] += alpha * TD_Error
        
        if (episode + 1) % max(1, num_episodes // 10) == 0:
            v_history.append({s: float(v) for s, v in V.items()})
        
        if callback:
            callback(episode, Episode_Data, dict(V), None)
    
    history = {
        'episode_rewards': episode_rewards,
        'v_history': v_history
    }
    
    return dict(V), history


