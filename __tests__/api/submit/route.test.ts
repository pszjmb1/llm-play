import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/submit/route';
import { SubmissionError } from '@/types/submission';

// Create a mock implementation
const mockSubmitEnvironment = vi.fn();

// Mock the service constructor to return an object with our mock method
vi.mock('@/services/submission', () => ({
  SubmissionService: vi.fn(() => ({
    submitEnvironment: mockSubmitEnvironment
  }))
}));

// Mock Supabase client with authentication
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve({
    auth: {
      getSession: () => ({
        data: {
          session: {
            user: { id: 'test-user-id' },
            access_token: 'mock-token'
          }
        },
        error: null
      })
    }
  }))
}));

describe('POST /api/submit', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    vi.clearAllMocks();
  });

  it('returns 200 for successful submission', async () => {
    const mockResult = {
      environment: { id: 'env-123', name: 'Test' },
      job: { id: 'job-123', status: 'queued' }
    };

    mockSubmitEnvironment.mockResolvedValue(mockResult);

    const response = await POST(new Request('http://localhost:3000/api/submit', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test', 
        description: 'Test description for the environment', 
        metadata: {
          environmentType: 'text-game',
          difficultyLevel: 'medium',
          tags: ['test'],
          successCriteria: 'The environment should execute successfully'
        }
      })
    }));

    const json = await response.json();
    
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.environment).toBeDefined();
    expect(json.job).toBeDefined();
  });

  it('returns 400 for validation errors', async () => {
    mockSubmitEnvironment.mockRejectedValue(
      new SubmissionError('Invalid data', 'VALIDATION', { name: ['Required'] })
    );

    const response = await POST(new Request('http://localhost:3000/api/submit', {
      method: 'POST',
      body: JSON.stringify({})
    }));

    const json = await response.json();
    
    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid data');
    expect(json.details).toBeDefined();
  });

  it('returns 500 for database errors', async () => {
    mockSubmitEnvironment.mockRejectedValue(
      new SubmissionError('Database error', 'DATABASE')
    );

    const response = await POST(new Request('http://localhost:3000/api/submit', {
      method: 'POST',
      body: JSON.stringify({ 
        name: 'Test', 
        description: 'Test description for the environment', 
        metadata: {
          environmentType: 'text-game',
          difficultyLevel: 'medium',
          tags: ['test'],
          successCriteria: 'The environment should execute successfully'
        }
      })
    }));

    const json = await response.json();
    
    expect(response.status).toBe(500);
    expect(json.error).toBe('Database error');
  });
});