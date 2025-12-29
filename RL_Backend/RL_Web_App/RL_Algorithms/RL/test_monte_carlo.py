import sys
import os


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from RL.Environments.Gridworld import GridworldEnv
from RL.Algorithms.Monte_Carlo import Monte_Carlo_First_Visit


env = GridworldEnv(GRID_SIZE=4, Max_Steps=50)

print("Testing Monte Carlo First Visit Algorithm")
print("=" * 50)
print(f"Grid Size: {env.GRID_SIZE}x{env.GRID_SIZE}")
print(f"Number of States: {len(env.States)}")
print(f"Number of Actions: {env.action_space.n}")
print("=" * 50)


num_episodes = 1000
gamma = 0.9

print(f"\nRunning Monte Carlo First Visit with {num_episodes} episodes...")
V = Monte_Carlo_First_Visit(env, num_episodes=num_episodes, gamma=gamma)

print(f"\nValue function computed for {len(V)} states")


print("\nSample State Values (Agent_X, Agent_Y, Goal_X, Goal_Y) -> Value:")
print("-" * 60)

sample_states = list(V.items())[:10]
for state, value in sample_states:
    print(f"State {state} -> V = {value:.4f}")


if V:
    best_state = max(V.items(), key=lambda x: x[1])
    worst_state = min(V.items(), key=lambda x: x[1])
    
    print("\n" + "=" * 50)
    print(f"Best State: {best_state[0]} with V = {best_state[1]:.4f}")
    print(f"Worst State: {worst_state[0]} with V = {worst_state[1]:.4f}")
    print(f"Average Value: {sum(V.values()) / len(V):.4f}")

print("\nTest completed successfully!")
