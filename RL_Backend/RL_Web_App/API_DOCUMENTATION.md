# RL Backend API Documentation

## Overview

This Django backend provides both HTTP REST APIs and WebSocket connections for real-time Reinforcement Learning interactions with the Gridworld environment.

## Running the Server

```bash
cd c:\RL_Project\RL_Backend\RL_Web_App
python manage.py runserver
```

The server will start at `http://127.0.0.1:8000/`

---

## HTTP REST APIs

### Environment Endpoints

#### GET `/api/environment/info/`
Get information about available environments.

**Response:**
```json
{
  "environments": [{
    "name": "Gridworld",
    "description": "A grid-based environment where an agent navigates to a goal",
    "actions": {"0": "Up", "1": "Down", "2": "Left", "3": "Right"},
    "rewards": {"step": -1, "goal": 10}
  }]
}
```

#### POST `/api/environment/create/`
Create and initialize a new Gridworld environment.

**Request:**
```json
{
  "grid_size": 4,
  "agent_position": [0, 0],
  "goal_position": [3, 3]
}
```

#### POST `/api/environment/step/`
Take a step in the environment.

**Request:**
```json
{
  "agent_position": [0, 0],
  "goal_position": [3, 3],
  "action": 1,
  "grid_size": 4
}
```

---

### Algorithm Endpoints

#### GET `/api/algorithms/info/`
Get information about available algorithms.

#### POST `/api/algorithms/run/`
Run a specified algorithm on the Gridworld environment.

**Request (Value Iteration):**
```json
{
  "algorithm": "value_iteration",
  "grid_size": 4,
  "gamma": 0.9,
  "theta": 1e-6
}
```

**Request (Monte Carlo):**
```json
{
  "algorithm": "monte_carlo_first_visit",
  "grid_size": 4,
  "gamma": 0.9,
  "num_episodes": 500
}
```

**Available algorithms:**
- `value_iteration` - Dynamic Programming
- `policy_iteration` - Dynamic Programming
- `monte_carlo_first_visit` - Monte Carlo
- `monte_carlo_every_visit` - Monte Carlo
- `monte_carlo_control` - Monte Carlo Control (epsilon-greedy)
- `td_zero` - Temporal Difference

#### POST `/api/algorithms/optimal-action/`
Get the optimal action for a given state.

**Request:**
```json
{
  "agent_position": [0, 0],
  "goal_position": [2, 2],
  "grid_size": 4
}
```

#### POST `/api/algorithms/policy/`
Get optimal policy visualization for a specific goal position.

**Request:**
```json
{
  "goal_position": [1, 1],
  "grid_size": 4
}
```

**Response:**
```json
{
  "policy_grid": [["↓", "→", "G"], ["↓", "→", "↑"], ["→", "→", "↑"]],
  "value_grid": [[5.31, 7.01, 0.0], [5.31, 7.01, 7.01], [3.78, 5.31, 5.31]]
}
```

#### POST `/api/algorithms/simulate/`
Simulate a complete episode using the optimal policy.

**Request:**
```json
{
  "agent_position": [0, 0],
  "goal_position": [2, 2],
  "grid_size": 3
}
```

---

## WebSocket Endpoints

### Environment WebSocket: `ws://localhost:8000/ws/environment/`

Real-time environment interaction.

**Messages:**

1. **Initialize Environment:**
```json
{"type": "init", "grid_size": 4, "agent_position": [0, 0], "goal_position": [3, 3]}
```

2. **Reset Environment:**
```json
{"type": "reset"}
```

3. **Step Environment:**
```json
{"type": "step", "action": 1}
```

4. **Get Current State:**
```json
{"type": "get_state"}
```

5. **Get Optimal Action:**
```json
{"type": "get_optimal_action"}
```

---

### Training WebSocket: `ws://localhost:8000/ws/training/`

Real-time training visualization with progress updates.

**Messages:**

1. **Start Training (with real-time updates):**
```json
{
  "type": "start_training",
  "algorithm": "monte_carlo_first_visit",
  "grid_size": 4,
  "num_episodes": 100,
  "gamma": 0.9
}
```

2. **Stop Training:**
```json
{"type": "stop_training"}
```

3. **Run Algorithm (batch, returns result):**
```json
{
  "type": "run_algorithm",
  "algorithm": "value_iteration",
  "grid_size": 4,
  "gamma": 0.9
}
```

**Response Events:**
- `training_started` - Training began
- `training_progress` - Episode progress update
- `dp_iteration` - Dynamic programming iteration update
- `training_complete` - Training finished
- `algorithm_complete` - Batch algorithm finished

---

### Policy Visualization WebSocket: `ws://localhost:8000/ws/policy/`

Visualize learned policies with auto-play.

**Messages:**

1. **Initialize with Policy:**
```json
{
  "type": "init_with_policy",
  "grid_size": 4,
  "agent_position": [0, 0],
  "goal_position": [3, 3],
  "gamma": 0.9
}
```

2. **Step with Policy:**
```json
{"type": "step_with_policy"}
```

3. **Auto-Play (watch agent follow policy):**
```json
{"type": "auto_play", "delay": 0.5, "max_steps": 50}
```

---

## Testing

### Test HTTP APIs:
```bash
python test_api.py
```

### Test WebSockets:
```bash
pip install websockets
python test_websocket.py
```

---

## Architecture

```
RL_Web_App/
├── API/
│   ├── views.py          # HTTP REST endpoints
│   └── urls.py           # URL routing
├── RL_Algorithms/
│   ├── consumers.py      # WebSocket consumers
│   ├── routing.py        # WebSocket URL routing
│   └── RL/
│       ├── Environments/
│       │   └── Gridworld.py
│       ├── Algorithms/
│       │   ├── Value_Iteration.py
│       │   ├── Policy_Iteration.py
│       │   ├── Monte_Carlo.py
│       │   └── Tamporal_Difference.py
│       └── utils.py
└── RL_Web_App/
    ├── settings.py       # Django settings with Channels
    ├── asgi.py           # ASGI config for WebSockets
    └── urls.py           # Main URL configuration
```
