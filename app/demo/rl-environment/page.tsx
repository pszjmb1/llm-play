// app/demo/rl-environment/page.tsx
"use client";
import React, { useState, useEffect } from 'react';

export default function RLEnvironmentDemo() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reinforcement Learning Demo</h1>
        <p className="mt-2 text-gray-600">
          This is a demonstration of a simple reinforcement learning environment. 
          Experiment with the grid world below to see how an agent learns to navigate to a goal using Q-learning.
        </p>
      </div>
      
      {/* Simple Reinforcement Learning Environment */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Interactive RL Environment</h2>
        <p className="text-sm text-gray-500 mt-1">Experiment with a simple grid world reinforcement learning environment</p>
        
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md p-6">
          <GridWorldEnvironment />
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">About Reinforcement Learning</h2>
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md p-6">
          <p className="text-gray-700 mb-4">
            Reinforcement Learning (RL) is a type of machine learning where an agent learns to make decisions by taking actions in an environment to maximize some notion of cumulative reward.
          </p>
          <p className="text-gray-700 mb-4">
            In this demo, we're using Q-learning, a popular RL algorithm. The agent (blue square) learns to navigate to the goal (green square) by exploring the environment and updating its knowledge (Q-table) based on the rewards it receives.
          </p>
          <p className="text-gray-700">
            Key concepts demonstrated:
          </p>
          <ul className="list-disc pl-6 mt-2 text-gray-700">
            <li>States: Each cell in the grid represents a state</li>
            <li>Actions: The agent can move up, right, down, or left</li>
            <li>Rewards: Positive reward for reaching the goal, small negative reward for each step</li>
            <li>Q-learning: Algorithm that learns the value of taking an action in a given state</li>
            <li>Exploration vs. Exploitation: Balance between trying new actions and using known good actions</li>
          </ul>
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