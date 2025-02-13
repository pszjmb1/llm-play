// __tests__/services/submission.test.ts
import { describe, expect, it, vi } from 'vitest';
import { SubmissionService } from '@/services/submission';
import { SubmissionRepository, SubmissionError } from '@/types/submission';

// Mock repository implementation for testing
class MockSubmissionRepository implements SubmissionRepository {
  saveEnvironment = vi.fn();
  createJob = vi.fn();
}

describe('SubmissionService', () => {
  // Test data
  const validSubmission = {
    name: 'Test Environment',
    description: 'Test Description that is long enough',
  };

  const mockEnvironment = {
    id: 'test-id',
    ...validSubmission,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const mockJob = {
    id: 'job-id',
    environment_id: 'test-id',
    status: 'queued',
    created_at: new Date().toISOString()
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
      status: 'pending'
    });
    expect(repository.createJob).toHaveBeenCalledWith(mockEnvironment.id);
  });

  it('throws validation error for invalid submission', async () => {
    const repository = new MockSubmissionRepository();
    const service = new SubmissionService(repository);

    await expect(service.submitEnvironment({
      name: '', // Invalid - too short
      description: '' // Invalid - too short
    })).rejects.toThrow(SubmissionError);

    expect(repository.saveEnvironment).not.toHaveBeenCalled();
    expect(repository.createJob).not.toHaveBeenCalled();
  });

  it('handles database errors properly', async () => {
    const repository = new MockSubmissionRepository();
    repository.saveEnvironment.mockRejectedValue(
      new SubmissionError('Database error', 'DATABASE')
    );

    const service = new SubmissionService(repository);

    await expect(service.submitEnvironment(validSubmission))
      .rejects.toThrow(SubmissionError);

    expect(repository.createJob).not.toHaveBeenCalled();
  });
});