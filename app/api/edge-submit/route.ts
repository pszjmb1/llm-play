import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateSubmission, EnvironmentSubmission } from '@/types/submission';

export const config = {
  runtime: 'edge',
};

export async function POST(request: Request) {
  try {
    // Parse JSON body
    const submissionData: EnvironmentSubmission = await request.json();

    // Basic validation
    const validation = validateSubmission(submissionData);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 },
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Optional authentication check
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;

    // Save environment
    const { data: environment, error: envError } = await supabase
      .from('environments')
      .insert({
        name: submissionData.name,
        description: submissionData.description,
        file_url: submissionData.file_url || null,
        metadata: submissionData.metadata || null,
        status: 'pending',
        user_id: userId,
      })
      .select()
      .single();

    if (envError) {
      throw new Error(`Database error: ${envError.message}`);
    }

    // Queue job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        environment_id: environment.id,
        status: 'queued',
        result: null,
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Job creation error: ${jobError.message}`);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      environment,
      job,
    });
  } catch (error) {
    console.error('Edge submission error:', error);

    // Handle different error types
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: errorMessage,
        code: 'SERVER_ERROR',
      },
      { status: 500 },
    );
  }
}
