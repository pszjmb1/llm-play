// app/api/submit/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SubmissionService } from '@/services/submission';
import { SupabaseSubmissionRepository } from '@/repositories/supabase';
import { SubmissionError } from '@/types/submission';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    
    // Initialize dependencies
    const supabase = await createClient();
    const repository = new SupabaseSubmissionRepository(supabase);
    const service = new SubmissionService(repository);

    // Process submission
    const result = await service.submitEnvironment(json);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
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

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}