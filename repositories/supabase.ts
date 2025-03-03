import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { 
  Environment, 
  Job, 
  SubmissionRepository,
  SubmissionError,
  EnvironmentStatus,
  JobStatus
} from '@/types/submission';

type SupabaseClientType = SupabaseClient<Database>;
type DbEnvironment = Database['public']['Tables']['environments']['Row'];

export class SupabaseSubmissionRepository implements SubmissionRepository {
  constructor(private client: SupabaseClientType) {}

  private mapDbEnvironmentToDomain(dbEnv: DbEnvironment): Environment {
    const status = dbEnv.status as EnvironmentStatus;
    if (!status) {
      throw new Error('Invalid environment status');
    }

    // Ensure metadata is a Record or null
    const metadata = dbEnv.metadata ? 
      (typeof dbEnv.metadata === 'object' ? dbEnv.metadata as Record<string, any> : null) 
      : null;

    return {
      id: dbEnv.id,
      name: dbEnv.name,
      description: dbEnv.description,
      file_url: dbEnv.file_url,
      metadata,
      status,
      user_id: dbEnv.user_id,
      created_at: dbEnv.created_at
    };
  }

  async saveEnvironment(data: Omit<Environment, 'id' | 'created_at'>): Promise<Environment> {
    try {
      // Get current user's ID
      const { data: { user }, error: authError } = await this.client.auth.getUser();
      
      if (authError) {
        throw new SubmissionError(
          'Authentication required',
          'AUTH',
          authError
        );
      }

      if (!user) {
        throw new SubmissionError(
          'Authentication required',
          'AUTH',
          { message: 'No authenticated user found' }
        );
      }

      // Prepare the insert data
      const insertData = {
        name: data.name,
        description: data.description,
        file_url: data.file_url || null,
        metadata: data.metadata || null,
        status: data.status || 'pending',
        user_id: user.id
      };

      // Insert the environment
      const { data: environment, error: insertError } = await this.client
        .from('environments')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        throw new SubmissionError(
          insertError.message || 'Failed to save environment',
          'DATABASE',
          insertError
        );
      }

      if (!environment) {
        throw new SubmissionError(
          'No environment data returned',
          'DATABASE'
        );
      }

      return this.mapDbEnvironmentToDomain(environment);
    } catch (error) {
      if (error instanceof SubmissionError) {
        throw error;
      }

      throw new SubmissionError(
        'Failed to save environment',
        'DATABASE',
        error
      );
    }
  }

  async createJob(environmentId: string): Promise<Job> {
    try {
      const { data: job, error } = await this.client
        .from('jobs')
        .insert({
          environment_id: environmentId,
          status: 'queued' as JobStatus,
          result: null
        })
        .select()
        .single();

      if (error) {
        throw new SubmissionError(
          'Failed to create job',
          'DATABASE',
          error
        );
      }

      if (!job) {
        throw new SubmissionError(
          'No job data returned',
          'DATABASE'
        );
      }

      return {
        id: job.id,
        environment_id: job.environment_id,
        status: job.status as JobStatus,
        result: job.result,
        created_at: job.created_at,
        updated_at: job.updated_at
      };
    } catch (error) {
      if (error instanceof SubmissionError) {
        throw error;
      }
      throw new SubmissionError(
        'Failed to create job',
        'DATABASE',
        error
      );
    }
  }
}