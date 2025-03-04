import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EdgeSubmissionService } from '@/services/edge-submission';
import * as fileUploadModule from '@/services/file-upload';
import { SubmissionError } from '@/types/submission';
import { fail } from 'assert';

// Mock fetch for the test
global.fetch = vi.fn() as unknown as typeof fetch;

// Mock file upload functions
vi.mock('@/services/file-upload', () => ({
  uploadFile: vi.fn(),
  uploadFileSecure: vi.fn(),
  validateFile: vi.fn(),
}));

describe('Edge Submission Flow', () => {
  let edgeSubmissionService: EdgeSubmissionService;

  beforeEach(() => {
    vi.resetAllMocks();

    // Create edge submission service instance
    edgeSubmissionService = new EdgeSubmissionService('http://localhost:3000');
  });

  it('should handle the complete submission flow with file upload', async () => {
    // 1. Mock file upload response
    const fileUrl = 'https://storage.example.com/environment-files/test-file.py';

    // Mock the uploadFile function to return a URL
    vi.mocked(fileUploadModule.uploadFile).mockResolvedValue(fileUrl);

    // 2. Mock submission response
    const mockSubmissionResponse = {
      success: true,
      environment: {
        id: 'env-123',
        name: 'Test Environment with File',
        description: 'Test description',
        file_url: fileUrl,
        metadata: {
          environmentType: 'text-game',
          difficultyLevel: 'medium',
          tags: ['test'],
          successCriteria: 'The environment should execute successfully',
        },
        status: 'pending',
        user_id: 'user-123',
        created_at: new Date().toISOString(),
      },
      job: {
        id: 'job-456',
        environment_id: 'env-123',
        status: 'queued',
        result: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    // Mock fetch response for submission
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockSubmissionResponse,
    });

    // Create a mock file object
    const mockFile = new File(['console.log("Hello, world!")'], 'test-file.py', {
      type: 'text/x-python',
    });

    // Step 1: Upload a file (using the mocked function)
    const uploadedFileUrl = await fileUploadModule.uploadFile(mockFile);

    // Step 2: Submit the environment with the file URL
    const submissionData = {
      name: 'Test Environment with File',
      description: 'Test description',
      file_url: uploadedFileUrl,
      metadata: {
        environmentType: 'text-game',
        difficultyLevel: 'medium',
        tags: ['test'],
        successCriteria: 'The environment should execute successfully',
      },
    };

    const result = await edgeSubmissionService.submitEnvironment(submissionData);

    // Assertions
    expect(result.success).toBe(true);
    expect(result.environment.id).toBe('env-123');
    expect(result.environment.file_url).toBe(fileUrl);
    expect(result.job.id).toBe('job-456');
    expect(result.job.status).toBe('queued');

    // Verify the file upload was called
    expect(fileUploadModule.uploadFile).toHaveBeenCalledWith(mockFile);

    // Verify the fetch was called for the submission
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/edge-submit',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: expect.any(String),
      }),
    );
  });

  it('should handle validation errors in the submission flow', async () => {
    const errorResponse = {
      error: 'Validation failed',
      code: 'VALIDATION',
      details: ['Description must be at least 10 characters'],
    };

    // Mock error response for invalid submission
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => errorResponse,
    });

    // Invalid submission data
    const submissionData = {
      name: 'Test',
      description: 'Too short', // Invalid - less than 10 chars
      metadata: {
        environmentType: 'text-game',
        difficultyLevel: 'medium',
        tags: ['test'],
        successCriteria: 'The environment should execute successfully',
      },
    };

    // Attempt submission and expect error
    await expect(edgeSubmissionService.submitEnvironment(submissionData)).rejects.toThrow(
      SubmissionError,
    );

    // Reset mock for second test
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockReset();
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => errorResponse,
    });

    try {
      await edgeSubmissionService.submitEnvironment(submissionData);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(SubmissionError);
      const submissionError = error as SubmissionError;
      expect(submissionError.message).toBe(errorResponse.error);
      expect(submissionError.code).toBe(errorResponse.code);
      expect(submissionError.details).toEqual(errorResponse.details);
    }
  });
});
