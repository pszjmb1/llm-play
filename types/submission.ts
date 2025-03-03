import { z } from 'zod';

export const environmentStatusEnum = ['pending', 'processing', 'completed', 'failed'] as const;
export type EnvironmentStatus = typeof environmentStatusEnum[number];

export const jobStatusEnum = ['queued', 'processing', 'completed', 'failed'] as const;
export type JobStatus = typeof jobStatusEnum[number];

export const environmentSubmissionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  file_url: z.string().url().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

export type EnvironmentSubmission = z.infer<typeof environmentSubmissionSchema>;

export interface Environment {
  id: string;
  name: string;
  description: string;
  file_url: string | null;
  metadata: Record<string, any> | null;
  status: EnvironmentStatus;
  user_id: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  environment_id: string;
  status: JobStatus;
  result: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionResult {
  environment: Environment;
  job: Job;
}

export interface SubmissionRepository {
  saveEnvironment(data: Omit<Environment, 'id' | 'created_at'>): Promise<Environment>;
  createJob(environmentId: string): Promise<Job>;
}

export class SubmissionError extends Error {
  constructor(
    message: string,
    public readonly code: 'VALIDATION' | 'DATABASE' | 'AUTH' | 'UNKNOWN',
    public readonly details?: any
  ) {
    super(message);
    this.name = 'SubmissionError';
  }
}