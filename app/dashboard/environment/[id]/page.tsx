// app/dashboard/environment/[id]/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';

// Define interfaces for environment data
interface Environment {
  id: string;
  name: string;
  description?: string;
  status?: string;
  created_at: string;
  job_status?: string;
  result_summary?: string;
  user_id?: string;
  metadata?: {
    config?: {
      rows?: number;
      cols?: number;
      agentStart?: { x: number, y: number };
      goalPosition?: { x: number, y: number };
      learningRate?: number;
      discountFactor?: number;
      explorationRate?: number;
    }
  };
}

export default function EnvironmentDetails() {
  const params = useParams();
  const environmentId = params.id as string;
  
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  // Fetch environment details on component mount
  useEffect(() => {
    async function fetchEnvironmentDetails() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (!session) {
          setError('You must be logged in to view environment details');
          setLoading(false);
          return;
        }
        
        console.log('Fetching environment details for ID:', environmentId);
        
        const { data, error } = await supabase
          .from('environments')
          .select()
          .eq('id', environmentId)
          .single();
          
        if (error) {
          console.error('Error fetching environment details:', error);
          setError(`Failed to load environment details: ${error.message}`);
        } else if (data) {
          console.log('Environment details fetched successfully:', data);
          setEnvironment(data);
        } else {
          setError('Environment not found');
        }
      } catch (error: any) {
        console.error('Error in fetchEnvironmentDetails:', error);
        setError(`An unexpected error occurred: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEnvironmentDetails();
  }, [environmentId]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Auth check
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p className="mb-6">You need to be logged in to view environment details.</p>
        <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Go to Login
        </a>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Dashboard
        </a>
      </div>
    );
  }

  // Environment not found
  if (!environment) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">Environment not found</p>
            </div>
          </div>
        </div>
        <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Dashboard
        </a>
      </div>
    );
  }

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      running: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    };
    
    // Use a safer way to select the style
    const getStyleClass = () => {
      switch(status) {
        case 'pending': return statusStyles.pending;
        case 'running': return statusStyles.running;
        case 'completed': return statusStyles.completed;
        case 'failed': return statusStyles.failed;
        default: return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStyleClass()}`}>
        {status}
      </span>
    );
  };

  // Extract configuration from metadata
  const config = environment.metadata?.config || {};
  const rows = config.rows || 5;
  const cols = config.cols || 5;
  const agentStart = config.agentStart || { x: 0, y: 0 };
  const goalPosition = config.goalPosition || { x: 4, y: 4 };
  const learningRate = config.learningRate || 0.1;
  const discountFactor = config.discountFactor || 0.9;
  const explorationRate = config.explorationRate || 0.2;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Dashboard
        </a>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{environment.name}</h1>
            <div className="mt-1 flex items-center">
              <StatusBadge status={environment.job_status || 'pending'} />
              <span className="ml-2 text-sm text-gray-500">
                Submitted on {new Date(environment.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              title="Upvote this environment"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Vote
            </button>
            <button 
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              title="Add a comment"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comment
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Description</h3>
          <p className="mt-1 text-gray-600">{environment.description || 'No description provided'}</p>
        </div>
        
        {environment.result_summary && (
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Result Summary</h3>
            <p className="mt-1 text-gray-600">{environment.result_summary}</p>
          </div>
        )}
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
          <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Grid Size</dt>
              <dd className="mt-1 text-sm text-gray-900">{rows} x {cols}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Agent Start Position</dt>
              <dd className="mt-1 text-sm text-gray-900">({agentStart.x}, {agentStart.y})</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Goal Position</dt>
              <dd className="mt-1 text-sm text-gray-900">({goalPosition.x}, {goalPosition.y})</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Learning Parameters</dt>
              <dd className="mt-1 text-sm text-gray-900">
                α: {learningRate}, γ: {discountFactor}, ε: {explorationRate}
              </dd>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Interactive Environment</h2>
        <p className="text-sm text-gray-500 mb-6">Experiment with this reinforcement learning environment</p>
        
        <ConfigurableGridWorldEnvironment 
          rows={rows}
          cols={cols}
          initialAgentPosition={agentStart}
          goalPosition={goalPosition}
          learningRate={learningRate}
          discountFactor={discountFactor}
          explorationRate={explorationRate}
        />
      </div>
    </div>
  );
}

// Configurable Grid World Environment Component
interface GridWorldProps {
  rows: number;
  cols: number;
  initialAgentPosition: { x: number, y: number };
  goalPosition: { x: number, y: number };
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
}

const ConfigurableGridWorldEnvironment = ({
  rows,
  cols,
  initialAgentPosition,
  goalPosition,
  learningRate,
  discountFactor,
  explorationRate
}: GridWorldProps) => {
  // Agent and environment state
  const [agentPosition, setAgentPosition] = useState({ ...initialAgentPosition });
  const [qTable, setQTable] = useState<number[][][]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [rewardHistory, setRewardHistory] = useState<number[]>([]);
  
  // Initialize Q-table
  useEffect(() => {
    // Create a 3D array: [row][col][action]
    // Actions: 0=up, 1=right, 2=down, 3=left
    const newQTable = Array(rows).fill(0).map(() => 
      Array(cols).fill(0).map(() => 
        Array(4).fill(0)
      )
    );
    setQTable(newQTable);
    
    // Reset agent position when configuration changes
    setAgentPosition({ ...initialAgentPosition });
    setEpisodeCount(0);
    setRewardHistory([]);
    setIsTraining(false);
  }, [rows, cols, initialAgentPosition]);
  
  // Reset environment
  const resetEnvironment = () => {
    setAgentPosition({ ...initialAgentPosition });
    setEpisodeCount(0);
    setRewardHistory([]);
    setIsTraining(false);
  };
  
  // Choose action using epsilon-greedy policy
  const chooseAction = (state: { x: number, y: number }) => {
    if (Math.random() < explorationRate) {
      // Explore: choose random action
      return Math.floor(Math.random() * 4);
    } else {
      // Exploit: choose best action from Q-table
      const { x, y } = state;
      const qValues = qTable[y][x];
      // Find index of maximum value in qValues array
      let maxIndex = 0;
      let maxValue = qValues[0];
      
      for (let i = 1; i < qValues.length; i++) {
        if (qValues[i] > maxValue) {
          maxValue = qValues[i];
          maxIndex = i;
        }
      }
      
      return maxIndex;
    }
  };
  
  // Get next state based on action
  const getNextState = (state: { x: number, y: number }, action: number) => {
    let { x, y } = state;
    
    // Apply action
    switch (action) {
      case 0: // Up
        y = Math.max(0, y - 1);
        break;
      case 1: // Right
        x = Math.min(cols - 1, x + 1);
        break;
      case 2: // Down
        y = Math.min(rows - 1, y + 1);
        break;
      case 3: // Left
        x = Math.max(0, x - 1);
        break;
    }
    
    return { x, y };
  };
  
  // Calculate reward
  const getReward = (state: { x: number, y: number }) => {
    const { x, y } = state;
    const { x: goalX, y: goalY } = goalPosition;
    
    // Reward is 1 if agent reaches goal, -0.1 otherwise (to encourage finding shortest path)
    return (x === goalX && y === goalY) ? 1 : -0.1;
  };
  
  // Update Q-table using Q-learning algorithm
  const updateQTable = (
    state: { x: number, y: number },
    action: number,
    reward: number,
    nextState: { x: number, y: number }
  ) => {
    const { x, y } = state;
    const { x: nextX, y: nextY } = nextState;
    
    // Get current Q-value
    const currentQ = qTable[y][x][action];
    
    // Get max Q-value for next state
    const nextQValues = qTable[nextY][nextX];
    // Find maximum value in nextQValues array
    let maxNextQ = nextQValues[0];
    
    for (let i = 1; i < nextQValues.length; i++) {
      if (nextQValues[i] > maxNextQ) {
        maxNextQ = nextQValues[i];
      }
    }
    
    // Q-learning update formula: Q(s,a) = Q(s,a) + α * [r + γ * max(Q(s',a')) - Q(s,a)]
    const newQ = currentQ + learningRate * (reward + discountFactor * maxNextQ - currentQ);
    
    // Update Q-table
    const newQTable = [...qTable];
    newQTable[y][x][action] = newQ;
    setQTable(newQTable);
  };
  
  // Run a single training episode
  const runEpisode = () => {
    let currentState = { ...agentPosition };
    let totalReward = 0;
    let steps = 0;
    const maxSteps = 100; // Prevent infinite loops
    
    const runStep = () => {
      if (steps >= maxSteps || 
          (currentState.x === goalPosition.x && currentState.y === goalPosition.y)) {
        // Episode ended
        setEpisodeCount(prev => prev + 1);
        setRewardHistory(prev => [...prev, totalReward]);
        
        // Reset agent position for next episode
        setAgentPosition({ ...initialAgentPosition });
        
        // Continue training if not at goal
        if (isTraining && !(currentState.x === goalPosition.x && currentState.y === goalPosition.y)) {
          setTimeout(() => runEpisode(), 100);
        }
        return;
      }
      
      // Choose action
      const action = chooseAction(currentState);
      
      // Get next state
      const nextState = getNextState(currentState, action);
      
      // Get reward
      const reward = getReward(nextState);
      totalReward += reward;
      
      // Update Q-table
      updateQTable(currentState, action, reward, nextState);
      
      // Update current state
      currentState = nextState;
      
      // Update agent position for visualization
      setAgentPosition(nextState);
      
      // Continue episode
      steps++;
      setTimeout(runStep, 200); // Slow down for visualization
    };
    
    runStep();
  };
  
  // Start/stop training
  const toggleTraining = () => {
    const newTrainingState = !isTraining;
    setIsTraining(newTrainingState);
    
    if (newTrainingState) {
      runEpisode();
    }
  };
  
  // Render grid cell
  const renderCell = (row: number, col: number) => {
    const isAgent = agentPosition.x === col && agentPosition.y === row;
    const isGoal = goalPosition.x === col && goalPosition.y === row;
    
    let cellClass = "w-12 h-12 border border-gray-300 flex items-center justify-center";
    
    if (isAgent) {
      cellClass += " bg-blue-500 text-white";
    } else if (isGoal) {
      cellClass += " bg-green-500 text-white";
    } else {
      // Color based on Q-values if available
      if (qTable.length > 0) {
        const qValues = qTable[row][col];
        // Find maximum value in qValues array
        let maxQ = qValues[0];
        
        for (let i = 1; i < qValues.length; i++) {
          if (qValues[i] > maxQ) {
            maxQ = qValues[i];
          }
        }
        const intensity = Math.min(255, Math.max(0, Math.floor(maxQ * 200)));
        cellClass += ` bg-blue-${Math.max(1, Math.floor(intensity / 30))}0`;
      }
    }
    
    return (
      <div key={`${row}-${col}`} className={cellClass}>
        {isAgent ? "A" : isGoal ? "G" : ""}
      </div>
    );
  };
  
  // Render grid
  const renderGrid = () => {
    const grid = [];
    
    for (let row = 0; row < rows; row++) {
      const rowCells = [];
      for (let col = 0; col < cols; col++) {
        rowCells.push(renderCell(row, col));
      }
      
      grid.push(
        <div key={row} className="flex">
          {rowCells}
        </div>
      );
    }
    
    return grid;
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <h3 className="text-lg font-medium mb-4">Grid World</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            The agent (A) learns to navigate to the goal (G) using Q-learning.
          </p>
          <div className="inline-flex rounded-md shadow-sm mb-4" role="group">
            <button
              type="button"
              onClick={toggleTraining}
              className={`px-4 py-2 text-sm font-medium ${
                isTraining 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              } rounded-l-md`}
            >
              {isTraining ? "Stop Training" : "Start Training"}
            </button>
            <button
              type="button"
              onClick={resetEnvironment}
              className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-r-md"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
          {renderGrid()}
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="text-lg font-medium mb-4">Training Progress</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Episodes: {episodeCount}</p>
          <p className="text-sm text-gray-600">
            Last reward: {rewardHistory.length > 0 ? rewardHistory[rewardHistory.length - 1].toFixed(2) : "N/A"}
          </p>
        </div>
        
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50 h-64">
          <h4 className="text-sm font-medium mb-2">Reward History</h4>
          <div className="h-48 flex items-end space-x-1">
            {rewardHistory.slice(-20).map((reward, index) => {
              const height = Math.max(5, Math.min(100, (reward + 5) * 10));
              return (
                <div 
                  key={index} 
                  className="bg-blue-500 w-4"
                  style={{ height: `${height}%` }}
                  title={`Episode ${episodeCount - rewardHistory.length + index + 1}: ${reward.toFixed(2)}`}
                ></div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Configuration</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Learning Rate (α):</span> {learningRate}
            </div>
            <div>
              <span className="font-medium">Discount Factor (γ):</span> {discountFactor}
            </div>
            <div>
              <span className="font-medium">Exploration Rate (ε):</span> {explorationRate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};