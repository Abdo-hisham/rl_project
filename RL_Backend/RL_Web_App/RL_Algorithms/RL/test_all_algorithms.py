import sys
import os

# Add parent directory to path so RL module can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from RL.Environments.Gridworld import GridworldEnv
from RL.Algorithms.Monte_Carlo import Monte_Carlo_First_Visit, Monte_Carlo_Every_Visit, Monte_Carlo_Control_Epsilon_Greedy
from RL.Algorithms.Value_Iteration import Value_Iteration
from RL.Algorithms.Policy_Iteration import Policy_Iteration
from RL.Algorithms.Tamporal_Difference import TD_Zero

import time

def print_header(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_results(V, env, algorithm_name):
    """Print summary of value function results"""
    if isinstance(V, dict) and V:
        # Filter non-terminal states
        non_terminal = {s: v for s, v in V.items() if s[0] != s[2] or s[1] != s[3]}
        if non_terminal:
            best = max(non_terminal.items(), key=lambda x: x[1])
            worst = min(non_terminal.items(), key=lambda x: x[1])
            avg = sum(non_terminal.values()) / len(non_terminal)
            
            print(f"  States evaluated: {len(V)}")
            print(f"  Best State:  {best[0]} -> V = {best[1]:.4f}")
            print(f"  Worst State: {worst[0]} -> V = {worst[1]:.4f}")
            print(f"  Average Value: {avg:.4f}")
        else:
            print(f"  States evaluated: {len(V)}")
    else:
        print("  No results to display")

def test_monte_carlo_first_visit(env, num_episodes=500, gamma=0.9):
    print_header("Monte Carlo First Visit")
    print(f"  Parameters: episodes={num_episodes}, gamma={gamma}")
    
    start = time.time()
    V = Monte_Carlo_First_Visit(env, num_episodes=num_episodes, gamma=gamma)
    elapsed = time.time() - start
    
    print(f"  Time: {elapsed:.2f}s")
    print_results(V, env, "MC First Visit")
    return V

def test_monte_carlo_every_visit(env, num_episodes=500, gamma=0.9):
    print_header("Monte Carlo Every Visit")
    print(f"  Parameters: episodes={num_episodes}, gamma={gamma}")
    
    start = time.time()
    V = Monte_Carlo_Every_Visit(env, num_episodes=num_episodes, gamma=gamma)
    elapsed = time.time() - start
    
    print(f"  Time: {elapsed:.2f}s")
    print_results(V, env, "MC Every Visit")
    return V

def test_monte_carlo_control(env, num_episodes=500, gamma=0.9, epsilon=0.1):
    print_header("Monte Carlo Control (Epsilon-Greedy)")
    print(f"  Parameters: episodes={num_episodes}, gamma={gamma}, epsilon={epsilon}")
    
    start = time.time()
    Q, Policy = Monte_Carlo_Control_Epsilon_Greedy(env, num_episodes=num_episodes, gamma=gamma, epsilon=epsilon)
    elapsed = time.time() - start
    
    print(f"  Time: {elapsed:.2f}s")
    print(f"  States with Q-values: {len(Q)}")
    print(f"  Policy computed for {len(Policy)} states")
    
    # Show sample policy
    sample_states = list(Policy.items())[:5]
    action_names = {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}
    print("  Sample Policy:")
    for state, action in sample_states:
        print(f"    State {state} -> {action_names[action]}")
    
    return Q, Policy

def test_td_zero(env, num_episodes=500, alpha=0.1, gamma=0.9):
    print_header("TD(0) - Temporal Difference")
    print(f"  Parameters: episodes={num_episodes}, alpha={alpha}, gamma={gamma}")
    
    start = time.time()
    V = TD_Zero(env, num_episodes=num_episodes, alpha=alpha, gamma=gamma)
    elapsed = time.time() - start
    
    print(f"  Time: {elapsed:.2f}s")
    print_results(V, env, "TD(0)")
    return V

def test_value_iteration(env, gamma=0.9, theta=1e-6):
    print_header("Value Iteration")
    print(f"  Parameters: gamma={gamma}, theta={theta}")
    
    start = time.time()
    V, Policy = Value_Iteration(env, gamma=gamma, theta=theta)
    elapsed = time.time() - start
    
    print(f"  Time: {elapsed:.2f}s")
    print_results(V, env, "Value Iteration")
    
    # Show sample policy
    action_names = {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}
    print("  Sample Policy (goal at 1,1):")
    for ax in range(min(3, env.GRID_SIZE)):
        for ay in range(min(3, env.GRID_SIZE)):
            if ax != 1 or ay != 1:
                state = (ax, ay, 1, 1)
                print(f"    Agent({ax},{ay}) -> {action_names[Policy[state]]}")
    
    return V, Policy

def test_policy_iteration(env, gamma=0.9, theta=1e-6):
    print_header("Policy Iteration")
    print(f"  Parameters: gamma={gamma}, theta={theta}")
    
    start = time.time()
    V, Policy = Policy_Iteration(env, gamma=gamma, theta=theta)
    elapsed = time.time() - start
    
    print(f"  Time: {elapsed:.2f}s")
    print_results(V, env, "Policy Iteration")
    
    # Show sample policy
    action_names = {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}
    print("  Sample Policy (goal at 1,1):")
    for ax in range(min(3, env.GRID_SIZE)):
        for ay in range(min(3, env.GRID_SIZE)):
            if ax != 1 or ay != 1:
                state = (ax, ay, 1, 1)
                print(f"    Agent({ax},{ay}) -> {action_names[Policy[state]]}")
    
    return V, Policy


def main():
    # Create the Gridworld environment
    GRID_SIZE = 4
    env = GridworldEnv(GRID_SIZE=GRID_SIZE, Max_Steps=50)
    
    print("\n" + "#" * 60)
    print("  REINFORCEMENT LEARNING ALGORITHMS TEST")
    print("#" * 60)
    print(f"\nEnvironment: Gridworld {GRID_SIZE}x{GRID_SIZE}")
    print(f"Total States: {len(env.States)}")
    print(f"Actions: Up(0), Down(1), Left(2), Right(3)")
    print(f"Rewards: +10 (goal), -1 (step)")
    
    # Test all algorithms
    results = {}
    
    # 1. Monte Carlo Methods
    results['mc_first'] = test_monte_carlo_first_visit(env, num_episodes=500)
    results['mc_every'] = test_monte_carlo_every_visit(env, num_episodes=500)
    results['mc_control'] = test_monte_carlo_control(env, num_episodes=500)
    
    # 2. Temporal Difference
    results['td_zero'] = test_td_zero(env, num_episodes=500)
    
    # 3. Dynamic Programming
    results['value_iter'] = test_value_iteration(env)
    results['policy_iter'] = test_policy_iteration(env)
    
    # Summary
    print_header("TEST SUMMARY")
    print("  All algorithms completed successfully!")
    print("\n  Algorithm Comparison (Dynamic Programming is optimal):")
    print("  - Value Iteration & Policy Iteration: Exact solutions")
    print("  - Monte Carlo & TD: Approximate solutions (sampling-based)")
    
    print("\n" + "=" * 60)
    print("  ALL TESTS PASSED!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
