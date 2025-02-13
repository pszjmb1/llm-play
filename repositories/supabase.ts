// repositories/supabase.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  Environment, 
  Job, 
  SubmissionRepository,
  SubmissionError
} from '@/types/submission';

export class SupabaseSubmissionRepository implements SubmissionRepository {
  constructor(private client: SupabaseClient) {}

  async saveEnvironment(data: Omit<Environment, 'id' | 'created_at'>): Promise<Environment> {
    const { data: environment, error } = await this.client
      .from('environments')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new SubmissionError(
        'Failed to save environment',
        'DATABASE',
        error
      );
    }

    return environment;
  }

  async createJob(environmentId: string): Promise<Job> {
    const { data: job, error } = await this.client
      .from('jobs')
      .insert([{
        environment_id: environmentId,
        status: 'queued'
      }])
      .select()
      .single();

    if (error) {
      throw new SubmissionError(
        'Failed to create job',
        'DATABASE',
        error
      );
    }

    return job;
  }
}