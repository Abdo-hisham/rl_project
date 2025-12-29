"""
Comprehensive Test Suite for RL Backend APIs

Run the Django server first:
    cd c:\RL_Project\RL_Backend\RL_Web_App
    python manage.py runserver

Then run this script:
    python test_api.py
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"


def print_test(name, passed, details=None):
    status = "✓ PASS" if passed else "✗ FAIL"
    print(f"  {status}: {name}")
    if not passed and details:
        print(f"         Details: {details}")


def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)


# ==================== Environment API Tests ====================

def test_environment_info():
    """Test GET /api/environment/info/"""
    print_section("1. Environment Info API")
    
    response = requests.get(f"{BASE_URL}/environment/info/")
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Response contains 'environments'", 'environments' in data)
    print_test("Gridworld environment exists", 
               any(e['name'] == 'Gridworld' for e in data.get('environments', [])))
    print_test("Actions are defined", 
               'actions' in data.get('environments', [{}])[0])
    
    return response.status_code == 200


def test_create_environment():
    """Test POST /api/environment/create/"""
    print_section("2. Create Environment API")
    
    # Test 1: Create with default positions
    response = requests.post(f"{BASE_URL}/environment/create/", json={
        "grid_size": 4,
        "max_steps": 50
    })
    data = response.json()
    
    print_test("Status code is 201", response.status_code == 201)
    print_test("Status is success", data.get('status') == 'success')
    print_test("State contains agent_position", 'agent_position' in data.get('state', {}))
    print_test("State contains goal_position", 'goal_position' in data.get('state', {}))
    
    # Test 2: Create with custom positions
    response = requests.post(f"{BASE_URL}/environment/create/", json={
        "grid_size": 5,
        "agent_position": [0, 0],
        "goal_position": [4, 4]
    })
    data = response.json()
    
    print_test("Custom agent position [0,0]", 
               data.get('state', {}).get('agent_position') == [0, 0])
    print_test("Custom goal position [4,4]", 
               data.get('state', {}).get('goal_position') == [4, 4])
    
    return response.status_code == 201


def test_step_environment():
    """Test POST /api/environment/step/"""
    print_section("3. Step Environment API")
    
    # Test stepping from [1,1] with action Down (1) should move to [1,2]
    response = requests.post(f"{BASE_URL}/environment/step/", json={
        "agent_position": [1, 1],
        "goal_position": [3, 3],
        "action": 1,  # Down
        "grid_size": 4
    })
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Status is success", data.get('status') == 'success')
    print_test("Agent moved down (y increased)", 
               data.get('agent_position', [0, 0])[1] == 2)
    print_test("Reward is -1 (not at goal)", data.get('reward') == -1)
    print_test("Not terminated", data.get('terminated') == False)
    
    # Test reaching goal
    response = requests.post(f"{BASE_URL}/environment/step/", json={
        "agent_position": [2, 3],
        "goal_position": [3, 3],
        "action": 3,  # Right
        "grid_size": 4
    })
    data = response.json()
    
    print_test("Reward is 10 at goal", data.get('reward') == 10)
    print_test("Terminated at goal", data.get('terminated') == True)
    
    # Test invalid request (missing action)
    response = requests.post(f"{BASE_URL}/environment/step/", json={
        "agent_position": [1, 1],
        "goal_position": [3, 3]
    })
    
    print_test("Error when action missing", response.status_code == 400)
    
    return True


def test_all_actions():
    """Test all 4 actions work correctly"""
    print_section("4. All Actions Test")
    
    actions = {
        0: ("Up", [2, 2], [2, 1]),      # y decreases
        1: ("Down", [2, 2], [2, 3]),    # y increases
        2: ("Left", [2, 2], [1, 2]),    # x decreases
        3: ("Right", [2, 2], [3, 2])    # x increases
    }
    
    for action, (name, start, expected) in actions.items():
        response = requests.post(f"{BASE_URL}/environment/step/", json={
            "agent_position": start,
            "goal_position": [0, 0],
            "action": action,
            "grid_size": 5
        })
        data = response.json()
        result = data.get('agent_position', [])
        
        print_test(f"Action {action} ({name}): {start} -> {expected}", 
                   result == expected, f"Got {result}")
    
    return True


def test_boundary_conditions():
    """Test environment boundary conditions"""
    print_section("5. Boundary Conditions")
    
    # Test moving up at top boundary (y=0)
    response = requests.post(f"{BASE_URL}/environment/step/", json={
        "agent_position": [1, 0],
        "goal_position": [3, 3],
        "action": 0,  # Up
        "grid_size": 4
    })
    data = response.json()
    print_test("Can't move above top (y stays 0)", 
               data.get('agent_position', [0, 1])[1] == 0)
    
    # Test moving left at left boundary (x=0)
    response = requests.post(f"{BASE_URL}/environment/step/", json={
        "agent_position": [0, 1],
        "goal_position": [3, 3],
        "action": 2,  # Left
        "grid_size": 4
    })
    data = response.json()
    print_test("Can't move left of boundary (x stays 0)", 
               data.get('agent_position', [1, 0])[0] == 0)
    
    # Test moving right at right boundary (x=grid_size-1)
    response = requests.post(f"{BASE_URL}/environment/step/", json={
        "agent_position": [3, 1],
        "goal_position": [0, 0],
        "action": 3,  # Right
        "grid_size": 4
    })
    data = response.json()
    print_test("Can't move right of boundary (x stays 3)", 
               data.get('agent_position', [0, 0])[0] == 3)
    
    # Test moving down at bottom boundary (y=grid_size-1)
    response = requests.post(f"{BASE_URL}/environment/step/", json={
        "agent_position": [1, 3],
        "goal_position": [0, 0],
        "action": 1,  # Down
        "grid_size": 4
    })
    data = response.json()
    print_test("Can't move below boundary (y stays 3)", 
               data.get('agent_position', [0, 0])[1] == 3)
    
    return True


# ==================== Algorithm API Tests ====================

def test_algorithms_info():
    """Test GET /api/algorithms/info/"""
    print_section("6. Algorithms Info API")
    
    response = requests.get(f"{BASE_URL}/algorithms/info/")
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Response contains 'algorithms'", 'algorithms' in data)
    
    algorithms = [a['name'] for a in data.get('algorithms', [])]
    print_test("value_iteration available", 'value_iteration' in algorithms)
    print_test("policy_iteration available", 'policy_iteration' in algorithms)
    print_test("monte_carlo_first_visit available", 'monte_carlo_first_visit' in algorithms)
    print_test("monte_carlo_control available", 'monte_carlo_control' in algorithms)
    print_test("td_zero available", 'td_zero' in algorithms)
    
    return response.status_code == 200


def test_value_iteration():
    """Test Value Iteration algorithm"""
    print_section("7. Value Iteration Algorithm")
    
    response = requests.post(f"{BASE_URL}/algorithms/run/", json={
        "algorithm": "value_iteration",
        "grid_size": 3,
        "gamma": 0.9
    })
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Status is success", data.get('status') == 'success')
    print_test("Value function returned", 'value_function' in data)
    print_test("Policy returned", 'policy' in data)
    print_test("States count is 81 (3^4)", data.get('states_count') == 81)
    
    return response.status_code == 200


def test_policy_iteration():
    """Test Policy Iteration algorithm"""
    print_section("8. Policy Iteration Algorithm")
    
    response = requests.post(f"{BASE_URL}/algorithms/run/", json={
        "algorithm": "policy_iteration",
        "grid_size": 3,
        "gamma": 0.9
    })
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Status is success", data.get('status') == 'success')
    print_test("Value function returned", 'value_function' in data)
    print_test("Policy returned", 'policy' in data)
    
    return response.status_code == 200


def test_monte_carlo_first_visit():
    """Test Monte Carlo First Visit algorithm"""
    print_section("9. Monte Carlo First Visit")
    
    response = requests.post(f"{BASE_URL}/algorithms/run/", json={
        "algorithm": "monte_carlo_first_visit",
        "grid_size": 3,
        "gamma": 0.9,
        "num_episodes": 100
    })
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Status is success", data.get('status') == 'success')
    print_test("Value function returned", 'value_function' in data)
    print_test("Num episodes recorded", data.get('num_episodes') == 100)
    
    return response.status_code == 200


def test_monte_carlo_every_visit():
    """Test Monte Carlo Every Visit algorithm"""
    print_section("10. Monte Carlo Every Visit")
    
    response = requests.post(f"{BASE_URL}/algorithms/run/", json={
        "algorithm": "monte_carlo_every_visit",
        "grid_size": 3,
        "gamma": 0.9,
        "num_episodes": 100
    })
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Status is success", data.get('status') == 'success')
    print_test("Value function returned", 'value_function' in data)
    
    return response.status_code == 200


def test_monte_carlo_control():
    """Test Monte Carlo Control algorithm"""
    print_section("11. Monte Carlo Control (Epsilon-Greedy)")
    
    response = requests.post(f"{BASE_URL}/algorithms/run/", json={
        "algorithm": "monte_carlo_control",
        "grid_size": 3,
        "gamma": 0.9,
        "epsilon": 0.1,
        "num_episodes": 100
    })
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Status is success", data.get('status') == 'success')
    print_test("Q-values returned", 'q_values' in data)
    print_test("Policy returned", 'policy' in data)
    print_test("Epsilon recorded", data.get('epsilon') == 0.1)
    
    return response.status_code == 200


def test_td_zero():
    """Test TD(0) algorithm"""
    print_section("12. TD(0) Temporal Difference")
    
    response = requests.post(f"{BASE_URL}/algorithms/run/", json={
        "algorithm": "td_zero",
        "grid_size": 3,
        "gamma": 0.9,
        "alpha": 0.1,
        "num_episodes": 100
    })
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Status is success", data.get('status') == 'success')
    print_test("Value function returned", 'value_function' in data)
    print_test("Alpha recorded", data.get('alpha') == 0.1)
    
    return response.status_code == 200


def test_invalid_algorithm():
    """Test error handling for invalid algorithm"""
    print_section("13. Invalid Algorithm Handling")
    
    response = requests.post(f"{BASE_URL}/algorithms/run/", json={
        "algorithm": "invalid_algorithm",
        "grid_size": 3
    })
    
    print_test("Status code is 400 for invalid algorithm", response.status_code == 400)
    print_test("Status is error", response.json().get('status') == 'error')
    
    # Test missing algorithm
    response = requests.post(f"{BASE_URL}/algorithms/run/", json={
        "grid_size": 3
    })
    
    print_test("Error when algorithm missing", response.status_code == 400)
    
    return True


def test_optimal_action():
    """Test optimal action API"""
    print_section("14. Optimal Action API")
    
    # Agent at (0,0), goal at (0,1) -> should move Down (action 1)
    response = requests.post(f"{BASE_URL}/algorithms/optimal-action/", json={
        "agent_position": [0, 0],
        "goal_position": [0, 1],
        "grid_size": 4
    })
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Status is success", data.get('status') == 'success')
    print_test("Optimal action returned", 'optimal_action' in data)
    print_test("Action name returned", 'action_name' in data)
    print_test("Optimal action is Down (1) to reach goal below", 
               data.get('optimal_action') == 1)
    
    # Agent at (1,1), goal at (0,1) -> should move Left (action 2)
    response = requests.post(f"{BASE_URL}/algorithms/optimal-action/", json={
        "agent_position": [1, 1],
        "goal_position": [0, 1],
        "grid_size": 4
    })
    data = response.json()
    print_test("Optimal action is Left (2) to reach goal on left", 
               data.get('optimal_action') == 2)
    
    # Test error handling
    response = requests.post(f"{BASE_URL}/algorithms/optimal-action/", json={
        "agent_position": [0, 0]
    })
    print_test("Error when goal_position missing", response.status_code == 400)
    
    return True


def test_get_policy():
    """Test policy visualization API"""
    print_section("15. Policy Visualization API")
    
    response = requests.post(f"{BASE_URL}/algorithms/policy/", json={
        "goal_position": [1, 1],
        "grid_size": 3
    })
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Status is success", data.get('status') == 'success')
    print_test("Policy grid returned", 'policy_grid' in data)
    print_test("Value grid returned", 'value_grid' in data)
    print_test("Action legend returned", 'action_legend' in data)
    
    policy_grid = data.get('policy_grid', [])
    print_test("Policy grid is 3x3", 
               len(policy_grid) == 3 and all(len(row) == 3 for row in policy_grid))
    print_test("Goal marked as 'G' at (1,1)", 
               policy_grid[1][1] == 'G' if len(policy_grid) > 1 else False)
    
    # Print the policy grid for visualization
    print("\n  Policy Grid:")
    for row in policy_grid:
        print(f"    {' '.join(row)}")
    
    return response.status_code == 200


def test_simulate_episode():
    """Test episode simulation API"""
    print_section("16. Simulate Episode API")
    
    response = requests.post(f"{BASE_URL}/algorithms/simulate/", json={
        "agent_position": [0, 0],
        "goal_position": [2, 2],
        "grid_size": 3,
        "max_steps": 20
    })
    data = response.json()
    
    print_test("Status code is 200", response.status_code == 200)
    print_test("Status is success", data.get('status') == 'success')
    print_test("Trajectory returned", 'trajectory' in data)
    print_test("Total steps returned", 'total_steps' in data)
    print_test("Total reward returned", 'total_reward' in data)
    print_test("Reached goal", data.get('reached_goal') == True)
    
    # Optimal path from (0,0) to (2,2) should be 4 steps
    print_test("Optimal path length is 4 steps", data.get('total_steps') == 4)
    
    # Expected reward: 4 steps * (-1) + 10 (goal) = 6
    print_test("Total reward is 6", data.get('total_reward') == 6)
    
    # Print trajectory
    print("\n  Trajectory:")
    for step in data.get('trajectory', [])[:6]:
        if step.get('action') is not None:
            print(f"    Step {step['step']}: {step['action_name']} -> {step['agent_position']}")
    
    return response.status_code == 200


def test_different_grid_sizes():
    """Test algorithms with different grid sizes"""
    print_section("17. Different Grid Sizes")
    
    for grid_size in [2, 3, 4, 5]:
        response = requests.post(f"{BASE_URL}/algorithms/run/", json={
            "algorithm": "value_iteration",
            "grid_size": grid_size,
            "gamma": 0.9
        })
        data = response.json()
        
        expected_states = grid_size ** 4
        actual_states = data.get('states_count', 0)
        
        print_test(f"Grid {grid_size}x{grid_size}: {expected_states} states", 
                   actual_states == expected_states)
    
    return True


def test_gamma_variations():
    """Test different gamma values affect results"""
    print_section("18. Gamma Parameter Variations")
    
    results = {}
    for gamma in [0.5, 0.9, 0.99]:
        response = requests.post(f"{BASE_URL}/algorithms/run/", json={
            "algorithm": "value_iteration",
            "grid_size": 3,
            "gamma": gamma
        })
        data = response.json()
        
        v_func = data.get('value_function', {})
        state_key = "(0, 0, 2, 2)"
        results[gamma] = v_func.get(state_key, 0)
        
        print_test(f"Gamma={gamma}: Algorithm runs successfully", 
                   data.get('status') == 'success')
    
    # Higher gamma should generally give higher values
    print_test("Higher gamma gives higher values", 
               results.get(0.99, 0) >= results.get(0.9, 0) >= results.get(0.5, 0))
    
    return True


def test_policy_consistency():
    """Test that Value Iteration and Policy Iteration produce similar policies"""
    print_section("19. Policy Consistency (VI vs PI)")
    
    # Run Value Iteration
    vi_response = requests.post(f"{BASE_URL}/algorithms/run/", json={
        "algorithm": "value_iteration",
        "grid_size": 3,
        "gamma": 0.9
    })
    vi_policy = vi_response.json().get('policy', {})
    
    # Run Policy Iteration
    pi_response = requests.post(f"{BASE_URL}/algorithms/run/", json={
        "algorithm": "policy_iteration",
        "grid_size": 3,
        "gamma": 0.9
    })
    pi_policy = pi_response.json().get('policy', {})
    
    # Compare policies
    matching = sum(1 for k in vi_policy if vi_policy.get(k) == pi_policy.get(k))
    total = len(vi_policy)
    match_rate = matching / total if total > 0 else 0
    
    print_test("Both algorithms return policies", 
               len(vi_policy) > 0 and len(pi_policy) > 0)
    print_test(f"Policies match rate >= 95% ({match_rate*100:.1f}%)", 
               match_rate >= 0.95)
    
    return True


def test_reward_structure():
    """Test that reward structure is correct"""
    print_section("20. Reward Structure Verification")
    
    # Test step reward (-1)
    response = requests.post(f"{BASE_URL}/environment/step/", json={
        "agent_position": [0, 0],
        "goal_position": [3, 3],
        "action": 1,
        "grid_size": 4
    })
    print_test("Step reward is -1", response.json().get('reward') == -1)
    
    # Test goal reward (+10)
    response = requests.post(f"{BASE_URL}/environment/step/", json={
        "agent_position": [3, 2],
        "goal_position": [3, 3],
        "action": 1,  # Down to goal
        "grid_size": 4
    })
    print_test("Goal reward is +10", response.json().get('reward') == 10)
    
    return True


# ==================== Main Test Runner ====================

def run_all_tests():
    print("\n" + "#"*60)
    print("  RL BACKEND API TEST SUITE")
    print("#"*60)
    
    tests = [
        test_environment_info,
        test_create_environment,
        test_step_environment,
        test_all_actions,
        test_boundary_conditions,
        test_algorithms_info,
        test_value_iteration,
        test_policy_iteration,
        test_monte_carlo_first_visit,
        test_monte_carlo_every_visit,
        test_monte_carlo_control,
        test_td_zero,
        test_invalid_algorithm,
        test_optimal_action,
        test_get_policy,
        test_simulate_episode,
        test_different_grid_sizes,
        test_gamma_variations,
        test_policy_consistency,
        test_reward_structure,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except requests.exceptions.ConnectionError:
            print(f"\n✗ Connection Error in {test.__name__}")
            print("  Make sure the Django server is running:")
            print("  cd c:\\RL_Project\\RL_Backend\\RL_Web_App")
            print("  python manage.py runserver")
            return
        except Exception as e:
            print(f"\n✗ Error in {test.__name__}: {e}")
            failed += 1
    
    print("\n" + "#"*60)
    print(f"  RESULTS: {passed} tests passed, {failed} tests failed")
    print(f"  Total: {len(tests)} tests")
    print("#"*60 + "\n")


if __name__ == "__main__":
    run_all_tests()
