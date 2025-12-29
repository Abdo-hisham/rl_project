# RL Visualization Web App

A web application for visualizing Reinforcement Learning algorithms with real-time training.

## Algorithms

**Dynamic Programming:**
- Value Iteration
- Policy Iteration

**Monte Carlo:**
- First Visit MC
- Every Visit MC
- MC Control (ε-greedy)

**Temporal Difference:**
- TD(0)
- SARSA
- n-Step TD

## Environments

| Environment | Description |
|-------------|-------------|
| Gridworld | Grid navigation to reach a goal |
| Frozen Lake | Navigate ice, avoid holes |
| Breakout | Paddle and ball brick breaker |

## Parameters

| Parameter | Description |
|-----------|-------------|
| γ (gamma) | Discount factor |
| θ (theta) | Convergence threshold |
| α (alpha) | Learning rate |
| ε (epsilon) | Exploration rate |
| Episodes | Number of training episodes |
| n-Steps | Lookahead for n-Step TD |

## Visualizations

- **Learning Curve** - Episode rewards over time
- **Convergence Plot** - Algorithm convergence tracking
- **Environment Canvas** - Animated agent visualization

## Tech Stack
- **Frontend:** React, TypeScript, Redux, TailwindCSS, Recharts
- **Backend:** Django, Django Channels, Gymnasium, NumPy

## Installation

### Backend
```bash
cd RL_Backend/RL_Web_App
python -m venv venv
venv\Scripts\activate
pip install django djangorestframework django-cors-headers channels daphne gymnasium numpy
python manage.py migrate
daphne -b 0.0.0.0 -p 8000 RL_Web_App.asgi:application
```

### Frontend
```bash
cd RL_Frontend/rl_forntend
npm install
npm run dev
```

## Usage

1. Select environment and algorithm
2. Adjust parameters with sliders
3. Train and watch real-time visualization
4. Test learned policy with inference player
