// services/submission.ts
import { 
    EnvironmentSubmission,
    SubmissionRepository,
    SubmissionResult,
    SubmissionError,
    environmentSubmissionSchema
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
  
        // Save environment
        const environment = await this.repository.saveEnvironment({
          ...result.data,
          status: 'pending'
        });
  
        // Create associated job
        const job = await this.repository.createJob(environment.id);
  
        return { environment, job };
      } catch (error) {
        if (error instanceof SubmissionError) {
          throw error;
        }
  
        // Log unexpected errors here
        console.error('Submission processing error:', error);
        throw new SubmissionError(
          'Failed to process submission',
          'UNKNOWN'
        );
      }
    }
  }