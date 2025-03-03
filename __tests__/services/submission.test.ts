import { describe, expect, it, vi } from 'vitest';
import { SubmissionService } from '@/services/submission';
import { SubmissionRepository, SubmissionError, Environment, Job } from '@/types/submission';

// Mock repository implementation for testing
class MockSubmissionRepository implements SubmissionRepository {
  saveEnvironment = vi.fn();
  createJob = vi.fn();
}

describe('SubmissionService', () => {
  // Test data with updated schema
  const validSubmission = {
    name: 'Test Environment',
    description: 'Test Description that is long enough',
    file_url: null,
    metadata: {
      environmentType: 'text-game',
      difficultyLevel: 'medium',
      tags: ['test', 'example'],
      successCriteria: 'The environment should successfully execute and return results',
    },
  };

  const mockEnvironment: Environment = {
    id: 'test-id',
    name: validSubmission.name,
    description: validSubmission.description,
    file_url: null,
    metadata: validSubmission.metadata,
    status: 'pending',
    user_id: null,
    created_at: new Date().toISOString(),
  };

  const mockJob: Job = {
    id: 'job-id',
    environment_id: 'test-id',
    status: 'queued',
    result: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('successfully processes valid submission', async () => {
    const repository = new MockSubmissionRepository();
    repository.saveEnvironment.mockResolvedValue(mockEnvironment);
    repository.createJob.mockResolvedValue(mockJob);

    const service = new SubmissionService(repository);
    const result = await service.submitEnvironment(validSubmission);

    expect(result.environment).toEqual(mockEnvironment);
    expect(result.job).toEqual(mockJob);
    expect(repository.saveEnvironment).toHaveBeenCalledWith({
      ...validSubmission,
      status: 'pending',
      user_id: null,
    });
    expect(repository.createJob).toHaveBeenCalledWith(mockEnvironment.id);
  });

  it('throws validation error for invalid submission', async () => {
    const repository = new MockSubmissionRepository();
    const service = new SubmissionService(repository);

    const invalidSubmission = {
      name: '', // Invalid - too short
      description: '', // Invalid - too short
      file_url: null,
      // Missing required metadata property
    };

    await expect(service.submitEnvironment(invalidSubmission)).rejects.toThrow(SubmissionError);
    expect(repository.saveEnvironment).not.toHaveBeenCalled();
    expect(repository.createJob).not.toHaveBeenCalled();
  });

  it('handles database errors properly', async () => {
    const repository = new MockSubmissionRepository();
    repository.saveEnvironment.mockRejectedValue(new SubmissionError('Database error', 'DATABASE'));

    const service = new SubmissionService(repository);
    await expect(service.submitEnvironment(validSubmission)).rejects.toThrow(SubmissionError);
    expect(repository.createJob).not.toHaveBeenCalled();
  });
});
