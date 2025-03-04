import { EnvironmentSubmission, SubmissionResult, SubmissionError } from '@/types/submission';

/**
 * Service for submitting environments via the Edge API
 */
export class EdgeSubmissionService {
  private apiEndpoint: string;

  /**
   * Creates a new instance of the EdgeSubmissionService
   * @param baseUrl Optional base URL for the API (defaults to current origin)
   */
  constructor(baseUrl?: string) {
    // Use provided base URL or current origin in browser
    this.apiEndpoint =
      (baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')) +
      '/api/edge-submit';
  }

  /**
   * Submit an environment via the Edge API
   * @param data The environment submission data
   * @returns A promise with the submission result
   */
  async submitEnvironment(data: EnvironmentSubmission): Promise<SubmissionResult> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API errors with exact error message from the API
        throw new SubmissionError(
          result.error || 'Failed to submit environment',
          result.code || 'UNKNOWN',
          result.details,
        );
      }

      return result as SubmissionResult;
    } catch (error) {
      // Re-throw SubmissionError instances
      if (error instanceof SubmissionError) {
        throw error;
      }

      // Network or other fetch errors
      throw new SubmissionError(
        'Failed to submit environment',
        'UNKNOWN',
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}
