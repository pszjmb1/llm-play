import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EdgeSubmissionService } from '@/services/edge-submission';
import { SubmissionError } from '@/types/submission';

// Mock fetch globally
global.fetch = vi.fn();

describe('EdgeSubmissionService', () => {
  let service: EdgeSubmissionService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new EdgeSubmissionService('http://localhost:3000');
  });

  it('should construct with the correct endpoint', () => {
    expect((service as any).apiEndpoint).toBe('http://localhost:3000/api/edge-submit');
  });

  it('should handle successful submissions', async () => {
    const mockResponse = {
      success: true,
      environment: {
        id: 'env-123',
        name: 'Test Environment',
        status: 'pending',
      },
      job: {
        id: 'job-456',
        status: 'queued',
      },
    };

    // Mock the fetch function to return a successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const submissionData = {
      name: 'Test Environment',
      description: 'Test description',
      metadata: {
        environmentType: 'text-game',
        difficultyLevel: 'medium',
        tags: ['test'],
        successCriteria: 'The environment should execute successfully',
      },
    };

    const result = await service.submitEnvironment(submissionData);

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/edge-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    });

    expect(result).toEqual(mockResponse);
    expect(result.success).toBe(true);
    expect(result.environment.id).toBe('env-123');
    expect(result.job.id).toBe('job-456');
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      error: 'Validation failed',
      code: 'VALIDATION',
      details: ['Name is required'],
    };

    // Mock the fetch function to return an error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => errorResponse,
    });

    const submissionData = {
      name: '',
      description: '',
    };

    // Test that the error is thrown and is the right type
    await expect(service.submitEnvironment(submissionData)).rejects.toThrow(SubmissionError);

    // Reset the mock for the second call
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => errorResponse,
    });

    // Test the specific properties of the error
    try {
      await service.submitEnvironment(submissionData);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(SubmissionError);
      const submissionError = error as SubmissionError;
      // Match the exact error message from the API response
      expect(submissionError.message).toBe(errorResponse.error);
      expect(submissionError.code).toBe(errorResponse.code);
      expect(submissionError.details).toEqual(errorResponse.details);
    }
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');

    // Mock the fetch function to throw a network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

    const submissionData = {
      name: 'Test Environment',
      description: 'Test description',
    };

    // Test that the error is thrown and is the right type
    await expect(service.submitEnvironment(submissionData)).rejects.toThrow(SubmissionError);

    // Reset the mock for the second call
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

    // Test the specific properties of the error
    try {
      await service.submitEnvironment(submissionData);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(SubmissionError);
      const submissionError = error as SubmissionError;
      expect(submissionError.message).toBe('Failed to submit environment');
      expect(submissionError.code).toBe('UNKNOWN');
      // Should include the original error message in the details
      expect(submissionError.details).toBe(networkError.message);
    }
  });
});
