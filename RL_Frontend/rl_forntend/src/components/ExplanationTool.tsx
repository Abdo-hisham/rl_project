import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { getAlgorithmById } from '../types/rl.types';
import { BookOpen, Lightbulb, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALGORITHM_EXPLANATIONS: Record<string, {
  overview: string;
  howItWorks: string[];
  pseudocode: string;
  keyInsight: string;
}> = {
  value_iteration: {
    overview: 'Value Iteration is a dynamic programming algorithm that computes the optimal value function by iteratively applying the Bellman optimality equation.',
    howItWorks: [
      'Initialize all state values to zero',
      'For each state, compute the maximum expected value over all actions',
      'Update the value function using: V(s) = max_a Σ P(s\'|s,a)[R + γV(s\')]',
      'Repeat until the maximum change (δ) is below threshold θ',
      'Extract optimal policy by choosing the action that maximizes value',
    ],
    pseudocode: `while δ > θ:
  δ = 0
  for each state s:
    v = V(s)
    V(s) = max_a Σ P(s'|s,a)[R + γV(s')]
    δ = max(δ, |v - V(s)|)`,
    keyInsight: 'Convergence is guaranteed because the Bellman operator is a contraction mapping.',
  },
  policy_iteration: {
    overview: 'Policy Iteration alternates between evaluating the current policy and improving it, converging to the optimal policy.',
    howItWorks: [
      'Start with an arbitrary policy',
      'Policy Evaluation: Compute V^π for current policy until convergence',
      'Policy Improvement: Create greedy policy from V^π',
      'If policy changed, go back to evaluation step',
      'When policy is stable, it is optimal',
    ],
    pseudocode: `while not policy_stable:
  while δ > θ:
    V(s) = Σ P(s'|s,π(s))[R + γV(s')]
  
  for each state s:
    π(s) = argmax_a Σ P(s'|s,a)[R + γV(s')]`,
    keyInsight: 'Policy Iteration often converges faster than Value Iteration in practice.',
  },
  mc_first_visit: {
    overview: 'Monte Carlo First Visit estimates state values by averaging returns only from the first time each state is visited in an episode.',
    howItWorks: [
      'Generate episodes following a policy',
      'For each state appearing in an episode, note the first visit',
      'Calculate the return (discounted sum of rewards) from that point',
      'Average all first-visit returns for each state',
      'Value converges to true value as episodes increase',
    ],
    pseudocode: `for each episode:
  Generate episode following π
  G = 0
  for t = T-1 to 0:
    G = γG + R_{t+1}
    if S_t not in {S_0, ..., S_{t-1}}:
      Returns(S_t).append(G)
      V(S_t) = average(Returns(S_t))`,
    keyInsight: 'No model needed! Learns directly from experience.',
  },
  mc_every_visit: {
    overview: 'Monte Carlo Every Visit estimates values using all visits to each state, not just the first.',
    howItWorks: [
      'Generate episodes following a policy',
      'For every time a state is visited, record the return',
      'Average all returns (from all visits) for each state',
      'Provides more data points but visits are correlated',
      'Also converges to true value',
    ],
    pseudocode: `for each episode:
  Generate episode following π
  G = 0
  for t = T-1 to 0:
    G = γG + R_{t+1}
    Returns(S_t).append(G)
    V(S_t) = average(Returns(S_t))`,
    keyInsight: 'More updates than First Visit, but with correlated samples.',
  },
  mc_control: {
    overview: 'Monte Carlo Control learns the optimal policy using ε-greedy exploration and Q-value estimation.',
    howItWorks: [
      'Initialize Q(s,a) arbitrarily',
      'Generate episodes using ε-greedy policy from Q',
      'Update Q values based on observed returns',
      'Policy improves implicitly as Q values update',
      'Gradually decrease ε for more exploitation',
    ],
    pseudocode: `for each episode:
  Generate episode using ε-greedy from Q
  G = 0
  for t = T-1 to 0:
    G = γG + R_{t+1}
    Q(S_t, A_t) = average(Returns(S_t, A_t))
    
  π(s) = argmax_a Q(s, a) (ε-greedy)`,
    keyInsight: 'Learns optimal policy without knowing environment dynamics.',
  },
  td_zero: {
    overview: 'TD(0) learns by bootstrapping - updating value estimates based on other value estimates after each step.',
    howItWorks: [
      'After each action, observe reward and next state',
      'Update current state value using TD error',
      'TD Error = R + γV(S\') - V(S)',
      'V(S) = V(S) + α * TD_Error',
      'Combines MC sampling with DP bootstrapping',
    ],
    pseudocode: `for each episode:
  Initialize S
  for each step:
    A = ε-greedy action from S
    Take action A, observe R, S'
    V(S) = V(S) + α[R + γV(S') - V(S)]
    S = S'
    if terminal: break`,
    keyInsight: 'Updates after every step, no need to wait for episode end.',
  },
};

const ExplanationTool: React.FC = () => {
  const { selectedAlgorithm } = useSelector((state: RootState) => state.algorithm);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'steps' | 'code'>('overview');

  const algorithm = getAlgorithmById(selectedAlgorithm);
  const explanation = ALGORITHM_EXPLANATIONS[selectedAlgorithm];

  if (!algorithm || !explanation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <BookOpen className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">How {algorithm.name} Works</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'steps'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Steps
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'code'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pseudocode
              </button>
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <p className="text-gray-600 mb-4">{explanation.overview}</p>
                    <div className="p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-amber-800">Key Insight</span>
                        <p className="text-sm text-amber-700">{explanation.keyInsight}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'steps' && (
                  <motion.div
                    key="steps"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <ol className="space-y-2">
                      {explanation.howItWorks.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-gray-600 text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </motion.div>
                )}

                {activeTab === 'code' && (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Pseudocode</span>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                      {explanation.pseudocode}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExplanationTool;
