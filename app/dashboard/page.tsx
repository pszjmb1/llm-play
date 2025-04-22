// app/dashboard/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// Define an interface for your environment object
interface Environment {
    id: string;
    name: string;
    description?: string;
    status?: string;
    created_at: string;
    job_status: string;
    result_summary?: string;
    user_id?: string;
  }

// Need to make this a client component since we're using hooks
export default function Dashboard() {
  // State for user session and environments
  const [session, setSession] = useState<any>(null);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user session and environments on component mount
  useEffect(() => {
    async function fetchUserData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        try {
          // Fetch all environments and filter client-side
          const { data, error } = await supabase
            .from('environments')
            .select('id, name, description, status, created_at, job_status, result_summary, user_id');
            
          if (error) {
            console.error('Error fetching environments:', error);
          } else if (data) {
            // Filter environments by user_id client-side
            const userEnvironments = data.filter(env => env.user_id === session.user.id);
            
            // Sort by created_at in descending order
            userEnvironments.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            
            setEnvironments(userEnvironments);
          }
        } catch (error) {
          console.error('Error in fetchUserData:', error);
        }
      }
      
      setLoading(false);
    }
    
    fetchUserData();
  }, []);

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
        <p className="mb-6">You need to be logged in to access the dashboard.</p>
        <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Go to Login
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My LLM Environments</h1>
          <p className="mt-2 text-gray-600">Manage your submitted reinforcement learning environments</p>
        </div>
        <a 
          href="/submit" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Submit New Environment
        </a>
      </div>

      {/* Environments List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {environments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {environments.map((env) => (
              <li key={env.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-lg font-medium text-blue-600 truncate">{env.name}</p>
                      <StatusBadge status={env.job_status || 'pending'} />
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
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex sm:flex-col">
                      <p className="text-sm text-gray-500">{env.description || 'No description provided'}</p>
                      {env.result_summary && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-700">Result Summary:</h4>
                          <p className="text-sm text-gray-500">{env.result_summary}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <p>
                        Submitted on {new Date(env.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <a href={`/dashboard/environment/${env.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      View Details <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No environments submitted yet</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first reinforcement learning environment to get started.</p>
            
            <div className="mt-4 max-w-2xl mx-auto text-left">
              <h4 className="text-md font-medium text-gray-800">How to create a reinforcement learning environment:</h4>
              <ol className="mt-2 list-decimal list-inside text-sm text-gray-600 space-y-2">
                <li>Define your environment's state space (what information is available to the agent)</li>
                <li>Define the action space (what actions the agent can take)</li>
                <li>Create reward functions (how the agent knows if it's doing well)</li>
                <li>Implement environment dynamics (how actions affect the state)</li>
                <li>Test your environment with a simple agent</li>
              </ol>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Try our demo:</span> Check out our{" "}
                  <a href="/demo/rl-environment" className="text-blue-600 hover:text-blue-800 underline">
                    interactive grid world example
                  </a>{" "}
                  to see a simple reinforcement learning environment in action.
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <a 
                href="/submit" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Submit New Environment
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Simple Reinforcement Learning Environment */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Interactive RL Environment</h2>
        <p className="text-sm text-gray-500 mt-1">Experiment with a simple grid world reinforcement learning environment</p>
        
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md p-6">
          <GridWorldEnvironment />
        </div>
      </div>

      {/* Community Activity Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Community Activity</h2>
        <p className="text-sm text-gray-500 mt-1">Recent environments submitted by the community</p>
        
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
          {/* This would be populated with actual community data */}
          <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
            <p>Community activity feed coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Grid World Environment Component
const GridWorldEnvironment = () => {
  // Grid size
  const rows = 5;
  const cols = 5;
  
  // Agent and environment state
  const [agentPosition, setAgentPosition] = useState({ x: 0, y: 0 });
  const [goalPosition] = useState({ x: 4, y: 4 });
  const [qTable, setQTable] = useState<number[][][]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [rewardHistory, setRewardHistory] = useState<number[]>([]);
  
  // RL parameters
  const learningRate = 0.1;
  const discountFactor = 0.9;
  const explorationRate = 0.2;
  
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
  }, []);
  
  // Reset environment
  const resetEnvironment = () => {
    setAgentPosition({ x: 0, y: 0 });
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
        setAgentPosition({ x: 0, y: 0 });
        
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
          <h3 className="text-lg font-medium mb-2">How It Works</h3>
          <p className="text-sm text-gray-600">
            This is a simple Q-learning implementation. The agent learns by exploring the environment and updating its Q-table, which stores the expected rewards for each action in each state. Over time, the agent learns the optimal path to the goal.
          </p>
        </div>
      </div>
    </div>
  );
};
