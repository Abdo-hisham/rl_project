"""
Test script for RL Backend WebSocket connections

Run the Django server first:
    cd c:\RL_Project\RL_Backend\RL_Web_App
    python manage.py runserver

Then run this script to test WebSocket connections.

Requirements:
    pip install websockets
"""

import asyncio
import json
import websockets


async def test_environment_websocket():
    """Test the Environment WebSocket for real-time stepping"""
    print("\n" + "="*60)
    print("Testing: Environment WebSocket (ws://localhost:8000/ws/environment/)")
    print("="*60)
    
    uri = "ws://localhost:8000/ws/environment/"
    
    async with websockets.connect(uri) as websocket:
        # Receive connection confirmation
        response = await websocket.recv()
        print(f"Connected: {json.loads(response)}")
        
        # Initialize environment
        print("\n1. Initializing environment...")
        await websocket.send(json.dumps({
            "type": "init",
            "grid_size": 4,
            "agent_position": [0, 0],
            "goal_position": [3, 3]
        }))
        response = await websocket.recv()
        print(f"   Response: {json.loads(response)}")
        
        # Take some steps
        print("\n2. Taking steps...")
        actions = [1, 3, 1, 3, 1, 3]  # Down, Right, Down, Right, Down, Right
        action_names = {0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right'}
        
        for action in actions:
            await websocket.send(json.dumps({
                "type": "step",
                "action": action
            }))
            response = await websocket.recv()
            result = json.loads(response)
            state = result.get('state', {})
            print(f"   Action: {action_names[action]} -> Agent at {state.get('agent_position')}, Reward: {result.get('reward')}, Terminated: {result.get('terminated')}")
            
            if result.get('terminated'):
                print("   Goal reached!")
                break
        
        # Get optimal action
        print("\n3. Getting optimal action...")
        await websocket.send(json.dumps({
            "type": "get_optimal_action"
        }))
        response = await websocket.recv()
        print(f"   Response: {json.loads(response)}")


async def test_training_websocket():
    """Test the Training WebSocket for real-time training visualization"""
    print("\n" + "="*60)
    print("Testing: Training WebSocket (ws://localhost:8000/ws/training/)")
    print("="*60)
    
    uri = "ws://localhost:8000/ws/training/"
    
    async with websockets.connect(uri) as websocket:
        # Receive connection confirmation
        response = await websocket.recv()
        print(f"Connected: {json.loads(response)}")
        
        # Start training with real-time updates
        print("\n1. Starting Monte Carlo training (100 episodes)...")
        await websocket.send(json.dumps({
            "type": "start_training",
            "algorithm": "monte_carlo_first_visit",
            "grid_size": 3,
            "num_episodes": 100,
            "gamma": 0.9
        }))
        
        # Receive updates
        while True:
            response = await websocket.recv()
            result = json.loads(response)
            
            if result['type'] == 'training_started':
                print(f"   Training started: {result.get('algorithm')}")
            elif result['type'] == 'training_progress':
                print(f"   Progress: {result.get('progress'):.1f}% - Episode {result.get('episode')}/{result.get('total_episodes')} - States: {result.get('states_evaluated')}")
            elif result['type'] == 'training_complete':
                print(f"\n   Training complete!")
                print(f"   Total states: {result.get('total_states')}")
                break
        
        # Run Value Iteration
        print("\n2. Running Value Iteration...")
        await websocket.send(json.dumps({
            "type": "run_algorithm",
            "algorithm": "value_iteration",
            "grid_size": 3,
            "gamma": 0.9
        }))
        
        while True:
            response = await websocket.recv()
            result = json.loads(response)
            
            if result['type'] == 'algorithm_started':
                print(f"   Algorithm started: {result.get('algorithm')}")
            elif result['type'] == 'algorithm_complete':
                print(f"   Algorithm complete!")
                print(f"   Sample policy: {dict(list(result.get('policy', {}).items())[:3])}")
                break


async def test_policy_websocket():
    """Test the Policy Visualization WebSocket for auto-play"""
    print("\n" + "="*60)
    print("Testing: Policy WebSocket (ws://localhost:8000/ws/policy/)")
    print("="*60)
    
    uri = "ws://localhost:8000/ws/policy/"
    
    async with websockets.connect(uri) as websocket:
        # Receive connection confirmation
        response = await websocket.recv()
        print(f"Connected: {json.loads(response)}")
        
        # Initialize with policy computation
        print("\n1. Initializing with optimal policy...")
        await websocket.send(json.dumps({
            "type": "init_with_policy",
            "grid_size": 4,
            "agent_position": [0, 0],
            "goal_position": [3, 3],
            "gamma": 0.9
        }))
        response = await websocket.recv()
        result = json.loads(response)
        print(f"   Initialized: Policy computed = {result.get('policy_computed')}")
        
        # Auto-play with delay
        print("\n2. Starting auto-play...")
        await websocket.send(json.dumps({
            "type": "auto_play",
            "delay": 0.3,
            "max_steps": 20
        }))
        
        while True:
            response = await websocket.recv()
            result = json.loads(response)
            
            if result['type'] == 'auto_play_started':
                print(f"   Auto-play started at {result.get('state', {}).get('agent_position')}")
            elif result['type'] == 'auto_play_step':
                print(f"   Step {result.get('step')}: {result.get('action_name')} -> {result.get('state', {}).get('agent_position')} (reward: {result.get('reward')})")
            elif result['type'] == 'auto_play_complete':
                print(f"\n   Auto-play complete!")
                print(f"   Total steps: {result.get('total_steps')}")
                print(f"   Total reward: {result.get('total_reward')}")
                print(f"   Reached goal: {result.get('reached_goal')}")
                break


async def main():
    print("\n" + "#"*60)
    print("  RL BACKEND WEBSOCKET TEST")
    print("#"*60)
    
    try:
        await test_environment_websocket()
        await test_training_websocket()
        await test_policy_websocket()
        
        print("\n" + "="*60)
        print("  ALL WEBSOCKET TESTS COMPLETED!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\nERROR: {e}")
        print("\nMake sure:")
        print("1. The Django server is running: python manage.py runserver")
        print("2. websockets package is installed: pip install websockets")


if __name__ == "__main__":
    asyncio.run(main())
