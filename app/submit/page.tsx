// app/submit/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EnvironmentConfig {
  rows: number;
  cols: number;
  agentStartX: number;
  agentStartY: number;
  goalX: number;
  goalY: number;
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
}

export default function SubmitEnvironment() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMode, setTestMode] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [config, setConfig] = useState<EnvironmentConfig>({
    rows: 5,
    cols: 5,
    agentStartX: 0,
    agentStartY: 0,
    goalX: 4,
    goalY: 4,
    learningRate: 0.1,
    discountFactor: 0.9,
    explorationRate: 0.2
  });
  
  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
      
      if (!session) {
        router.push('/sign-in?redirect=/submit');
      }
    }
    
    checkAuth();
  }, [router]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    // Validate config values
    if (config.rows < 2 || config.rows > 10) {
      newErrors.rows = 'Rows must be between 2 and 10';
    }
    
    if (config.cols < 2 || config.cols > 10) {
      newErrors.cols = 'Columns must be between 2 and 10';
    }
    
    if (config.agentStartX < 0 || config.agentStartX >= config.cols) {
      newErrors.agentStartX = 'Agent start X must be within grid bounds';
    }
    
    if (config.agentStartY < 0 || config.agentStartY >= config.rows) {
      newErrors.agentStartY = 'Agent start Y must be within grid bounds';
    }
    
    if (config.goalX < 0 || config.goalX >= config.cols) {
      newErrors.goalX = 'Goal X must be within grid bounds';
    }
    
    if (config.goalY < 0 || config.goalY >= config.rows) {
      newErrors.goalY = 'Goal Y must be within grid bounds';
    }
    
    if (config.learningRate <= 0 || config.learningRate > 1) {
      newErrors.learningRate = 'Learning rate must be between 0 and 1';
    }
    
    if (config.discountFactor <= 0 || config.discountFactor > 1) {
      newErrors.discountFactor = 'Discount factor must be between 0 and 1';
    }
    
    if (config.explorationRate < 0 || config.explorationRate > 1) {
      newErrors.explorationRate = 'Exploration rate must be between 0 and 1';
    }
    
    setErrors(newErrors);
    
    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    // Save to database
    setSaving(true);
    
    try {
      // Create a fresh Supabase client to ensure we have the latest auth state
      const supabase = createClient();
      
      // Get the current session to ensure we have the latest auth state
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // First, check if we have a valid session
      if (!currentSession || !currentSession.user || !currentSession.user.id) {
        throw new Error('No valid session found. Please log in again.');
      }
      
      // Log the user ID we're using (for debugging)
      console.log('Current user ID:', currentSession.user.id);
      
      // Log the data we're trying to insert (for debugging)
      console.log('Saving environment with data:', {
        name,
        description,
        metadata: { config },
        status: 'pending',
        user_id: currentSession.user.id
      });
      
      // Insert the environment with explicit fields
      const { data, error } = await supabase
        .from('environments')
        .insert({
          name: name,
          description: description,
          metadata: { config },
          status: 'pending',
          user_id: currentSession.user.id
        });
      
      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      // Log success
      console.log('Environment saved successfully:', data);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      // More detailed error logging
      console.error('Error saving environment:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Show more helpful error message
      alert(`Failed to save environment: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle config changes
  const updateConfig = (key: keyof EnvironmentConfig, value: number) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Toggle test mode
  const toggleTestMode = () => {
    setTestMode(!testMode);
  };
  
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
        <p className="mb-6">You need to be logged in to submit an environment.</p>
        <a href="/sign-in?redirect=/submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Go to Login
        </a>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submit New Environment</h1>
        <p className="mt-2 text-gray-600">Create and test your reinforcement learning environment</p>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Environment Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Grid World Navigation"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>
                
                <div className="sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="A grid world environment where an agent learns to navigate to a goal using Q-learning."
                    rows={3}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                </div>
              </div>
            </div>
            
            {/* Grid Configuration */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Grid Configuration</h2>
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
                <div>
                  <Label htmlFor="rows">Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    min="2"
                    max="10"
                    value={config.rows}
                    onChange={(e) => updateConfig('rows', parseInt(e.target.value))}
                    className={`mt-1 ${errors.rows ? 'border-red-500' : ''}`}
                  />
                  {errors.rows && <p className="mt-1 text-sm text-red-500">{errors.rows}</p>}
                </div>
                
                <div>
                  <Label htmlFor="cols">Columns</Label>
                  <Input
                    id="cols"
                    type="number"
                    min="2"
                    max="10"
                    value={config.cols}
                    onChange={(e) => updateConfig('cols', parseInt(e.target.value))}
                    className={`mt-1 ${errors.cols ? 'border-red-500' : ''}`}
                  />
                  {errors.cols && <p className="mt-1 text-sm text-red-500">{errors.cols}</p>}
                </div>
              </div>
            </div>
            
            {/* Agent and Goal Configuration */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Agent and Goal Configuration</h2>
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-4 sm:gap-x-4">
                <div>
                  <Label htmlFor="agentStartX">Agent Start X</Label>
                  <Input
                    id="agentStartX"
                    type="number"
                    min="0"
                    max={config.cols - 1}
                    value={config.agentStartX}
                    onChange={(e) => updateConfig('agentStartX', parseInt(e.target.value))}
                    className={`mt-1 ${errors.agentStartX ? 'border-red-500' : ''}`}
                  />
                  {errors.agentStartX && <p className="mt-1 text-sm text-red-500">{errors.agentStartX}</p>}
                </div>
                
                <div>
                  <Label htmlFor="agentStartY">Agent Start Y</Label>
                  <Input
                    id="agentStartY"
                    type="number"
                    min="0"
                    max={config.rows - 1}
                    value={config.agentStartY}
                    onChange={(e) => updateConfig('agentStartY', parseInt(e.target.value))}
                    className={`mt-1 ${errors.agentStartY ? 'border-red-500' : ''}`}
                  />
                  {errors.agentStartY && <p className="mt-1 text-sm text-red-500">{errors.agentStartY}</p>}
                </div>
                
                <div>
                  <Label htmlFor="goalX">Goal X</Label>
                  <Input
                    id="goalX"
                    type="number"
                    min="0"
                    max={config.cols - 1}
                    value={config.goalX}
                    onChange={(e) => updateConfig('goalX', parseInt(e.target.value))}
                    className={`mt-1 ${errors.goalX ? 'border-red-500' : ''}`}
                  />
                  {errors.goalX && <p className="mt-1 text-sm text-red-500">{errors.goalX}</p>}
                </div>
                
                <div>
                  <Label htmlFor="goalY">Goal Y</Label>
                  <Input
                    id="goalY"
                    type="number"
                    min="0"
                    max={config.rows - 1}
                    value={config.goalY}
                    onChange={(e) => updateConfig('goalY', parseInt(e.target.value))}
                    className={`mt-1 ${errors.goalY ? 'border-red-500' : ''}`}
                  />
                  {errors.goalY && <p className="mt-1 text-sm text-red-500">{errors.goalY}</p>}
                </div>
              </div>
            </div>
            
            {/* Learning Parameters */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Learning Parameters</h2>
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
                <div>
                  <Label htmlFor="learningRate">Learning Rate (α)</Label>
                  <Input
                    id="learningRate"
                    type="number"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={config.learningRate}
                    onChange={(e) => updateConfig('learningRate', parseFloat(e.target.value))}
                    className={`mt-1 ${errors.learningRate ? 'border-red-500' : ''}`}
                  />
                  {errors.learningRate && <p className="mt-1 text-sm text-red-500">{errors.learningRate}</p>}
                </div>
                
                <div>
                  <Label htmlFor="discountFactor">Discount Factor (γ)</Label>
                  <Input
                    id="discountFactor"
                    type="number"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={config.discountFactor}
                    onChange={(e) => updateConfig('discountFactor', parseFloat(e.target.value))}
                    className={`mt-1 ${errors.discountFactor ? 'border-red-500' : ''}`}
                  />
                  {errors.discountFactor && <p className="mt-1 text-sm text-red-500">{errors.discountFactor}</p>}
                </div>
                
                <div>
                  <Label htmlFor="explorationRate">Exploration Rate (ε)</Label>
                  <Input
                    id="explorationRate"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.explorationRate}
                    onChange={(e) => updateConfig('explorationRate', parseFloat(e.target.value))}
                    className={`mt-1 ${errors.explorationRate ? 'border-red-500' : ''}`}
                  />
                  {errors.explorationRate && <p className="mt-1 text-sm text-red-500">{errors.explorationRate}</p>}
                </div>
              </div>
            </div>
            
            {/* Test Environment */}
            <div>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Test Environment</h2>
                <Button 
                  type="button" 
                  onClick={toggleTestMode}
                  variant={testMode ? "destructive" : "default"}
                >
                  {testMode ? "Hide Test Environment" : "Show Test Environment"}
                </Button>
              </div>
              
              {testMode && (
                <div className="mt-4">
                  <ConfigurableGridWorld config={config} />
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Environment'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Configurable Grid World Component
const ConfigurableGridWorld = ({ config }: { config: EnvironmentConfig }) => {
  // Agent and environment state
  const [agentPosition, setAgentPosition] = useState({ 
    x: config.agentStartX, 
    y: config.agentStartY 
  });
  const [goalPosition] = useState({ 
    x: config.goalX, 
    y: config.goalY 
  });
  const [qTable, setQTable] = useState<number[][][]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [episodeCount, setEpisodeCount] = useState(0);
  const [rewardHistory, setRewardHistory] = useState<number[]>([]);
  
  // Update state when config changes
  useEffect(() => {
    setAgentPosition({ x: config.agentStartX, y: config.agentStartY });
    
    // Initialize Q-table based on grid size
    const newQTable = Array(config.rows).fill(0).map(() => 
      Array(config.cols).fill(0).map(() => 
        Array(4).fill(0)
      )
    );
    setQTable(newQTable);
    
    // Reset training state
    setIsTraining(false);
    setEpisodeCount(0);
    setRewardHistory([]);
  }, [config]);
  
  // Reset environment
  const resetEnvironment = () => {
    setAgentPosition({ x: config.agentStartX, y: config.agentStartY });
    setEpisodeCount(0);
    setRewardHistory([]);
    setIsTraining(false);
  };
  
  // Choose action using epsilon-greedy policy
  const chooseAction = (state: { x: number, y: number }) => {
    if (Math.random() < config.explorationRate) {
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
        x = Math.min(config.cols - 1, x + 1);
        break;
      case 2: // Down
        y = Math.min(config.rows - 1, y + 1);
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
    const newQ = currentQ + config.learningRate * (reward + config.discountFactor * maxNextQ - currentQ);
    
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
        setAgentPosition({ x: config.agentStartX, y: config.agentStartY });
        
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
    
    for (let row = 0; row < config.rows; row++) {
      const rowCells = [];
      for (let col = 0; col < config.cols; col++) {
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
            <Button
              type="button"
              onClick={toggleTraining}
              variant={isTraining ? "destructive" : "default"}
              className="rounded-l-md"
            >
              {isTraining ? "Stop Training" : "Start Training"}
            </Button>
            <Button
              type="button"
              onClick={resetEnvironment}
              variant="secondary"
              className="rounded-r-md"
            >
              Reset
            </Button>
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
      </div>
    </div>
  );
};
