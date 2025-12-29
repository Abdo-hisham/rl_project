import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import EnvironmentSelector from '../components/EnvironmentSelector';
import AlgorithmSelector from '../components/AlgorithmSelector';
import ParameterSlider from '../components/ParameterSlider';
import EnvironmentVisualization from '../components/EnvironmentVisualization';
import TrainingPlayer from '../components/TrainingPlayer';
import InferencePlayer from '../components/InferencePlayer';
import ExplanationTool from '../components/ExplanationTool';
import { useBackend } from '../hooks/useBackend';
import { Bot, Github, BookOpen, RefreshCw, WifiOff, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

const Home: React.FC = () => {
  const { connectionStatus, isConnected, isConnecting, checkConnection } = useBackend();
  const { error } = useSelector((state: RootState) => state.simulation);
  
  const { currentPosition } = useSelector((state: RootState) => state.environment);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 5 }}
                className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl"
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RL Visualizer</h1>
                <p className="text-xs text-gray-500">Interactive Reinforcement Learning</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => checkConnection()}
                disabled={isConnecting}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isConnected
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                }`}
              >
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isConnected ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Reconnect'}
                </span>
              </button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BookOpen className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {!isConnected && !isConnecting && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-b border-amber-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Backend not connected.</span>{' '}
                  Make sure the Django server is running on{' '}
                  <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">http://127.0.0.1:8000</code>
                </p>
              </div>
              <button
                onClick={() => checkConnection()}
                className="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-b border-red-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <EnvironmentSelector />
            <AlgorithmSelector />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <EnvironmentVisualization showValues showPolicy animatedPosition={currentPosition} />
            <ExplanationTool />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <ParameterSlider />
            <TrainingPlayer />
            <InferencePlayer />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Built with React, Redux, and Django Channels
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Documentation
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                API Reference
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                About
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
