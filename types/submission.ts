// types/submission.ts
import { z } from 'zod';

export const environmentSubmissionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  file_url: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

export type EnvironmentSubmission = z.infer<typeof environmentSubmissionSchema>;

export interface Environment extends EnvironmentSubmission {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface Job {
  id: string;
  environment_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: Record<string, any>;
  created_at: string;
}

// Database interface that any storage implementation must satisfy
export interface SubmissionRepository {
  saveEnvironment(data: Omit<Environment, 'id' | 'created_at'>): Promise<Environment>;
  createJob(environmentId: string): Promise<Job>;
}

// Service result types
export interface SubmissionResult {
  environment: Environment;
  job: Job;
}

export class SubmissionError extends Error {
  constructor(
    message: string,
    public readonly code: 'VALIDATION' | 'DATABASE' | 'UNKNOWN',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'SubmissionError';
  }
}