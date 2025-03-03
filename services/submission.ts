// services/submission.ts
import {
  EnvironmentSubmission,
  SubmissionRepository,
  SubmissionResult,
  SubmissionError,
  environmentSubmissionSchema,
  Environment
} from '@/types/submission';

export class SubmissionService {
  constructor(private repository: SubmissionRepository) {}

  async submitEnvironment(data: EnvironmentSubmission): Promise<SubmissionResult> {
    try {
      // Validate submission data
      const result = environmentSubmissionSchema.safeParse(data);
      if (!result.success) {
        throw new SubmissionError(
          'Invalid submission data',
          'VALIDATION',
          result.error.format()
        );
      }
  
      // Prepare environment data with proper typing
      const environmentData: Omit<Environment, 'id' | 'created_at'> = {
        name: result.data.name,
        description: result.data.description,
        file_url: result.data.file_url ?? null,
        metadata: result.data.metadata ?? null,
        status: 'pending',
        user_id: null
      };
  
      // Save environment
      const environment = await this.repository.saveEnvironment(environmentData);
  
      // Create associated job
      const job = await this.repository.createJob(environment.id);
  
      return { environment, job };
    } catch (error) {
      if (error instanceof SubmissionError) {
        throw error;
      }
  
      console.error('Submission processing error:', error);
      throw new SubmissionError(
        'Failed to process submission',
        'UNKNOWN',
        error instanceof Error ? error.message : undefined
      );
    }
  }
}