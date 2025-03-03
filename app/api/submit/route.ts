import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SubmissionService } from '@/services/submission';
import { SupabaseSubmissionRepository } from '@/repositories/supabase';
import { SubmissionError } from '@/types/submission';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    
    // Initialize Supabase client
    const supabase = await createClient();

     // Verify authentication
     const { data: { session }, error: authError } = await supabase.auth.getSession();
    
     if (authError || !session) {
       console.error('Auth error:', authError);
       return NextResponse.json(
         { 
           error: 'Authentication required',
           details: authError?.message || 'No valid session found'
         },
         { status: 401 }
       );
     }

    // Initialize dependencies with authenticated client
    const repository = new SupabaseSubmissionRepository(supabase);
    const service = new SubmissionService(repository);

    // Process submission
    const result = await service.submitEnvironment(json);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Submission error:', error);
    
    if (error instanceof SubmissionError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details
        },
        { 
          status: error.code === 'VALIDATION' ? 400 : 500 
        }
      );
    }

    // Generic error response for any other errors
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}