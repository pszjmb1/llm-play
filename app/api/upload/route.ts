import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getSecureUploadUrl, getPublicFileUrl, verifyFileExists } from '@/services/server-file-upload';
import { isValidExtension, isValidFileType } from '@/types/submission';

/**
 * API route for generating secure upload URLs
 * 
 * Flow:
 * 1. Client requests a signed upload URL with file info (type, name)
 * 2. Server generates a secure URL with a short expiration
 * 3. Client uploads directly to storage using the URL
 * 4. Server verifies the file was uploaded and returns the public URL
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required for file uploads' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { fileName, fileType, fileSize } = body;
    
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required file information' },
        { status: 400 }
      );
    }
    
    // Validate file extensions and type
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !isValidExtension(`.${fileExtension}`)) {
      return NextResponse.json(
        {
          error: 'Invalid file extension',
          allowed: ['py', 'js', 'json', 'txt', 'md', 'yaml', 'yml']
        },
        { status: 400 }
      );
    }
    
    if (!isValidFileType(fileType)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          allowed: ['text/x-python', 'application/javascript', 'application/json', 'text/plain', 'text/markdown', 'text/yaml']
        },
        { status: 400 }
      );
    }
    
    // Generate secure upload URL
    const { uploadUrl, filePath } = await getSecureUploadUrl(
      fileType,
      fileExtension,
      `environments/${session.user.id}`
    );
    
    // Return the upload URL and file info to the client
    return NextResponse.json({
      uploadUrl,
      filePath,
      expiresIn: 600, // 10 minutes in seconds
    });
    
  } catch (error) {
    console.error('Upload preparation error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare file upload' },
      { status: 500 }
    );
  }
}

/**
 * API route for confirming an upload and generating a public URL
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required for file access' },
        { status: 401 }
      );
    }
    
    // Get file path from query params
    const url = new URL(request.url);
    const filePath = url.searchParams.get('filePath');
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing file path parameter' },
        { status: 400 }
      );
    }
    
    // Verify the file exists in storage
    const fileExists = await verifyFileExists(filePath);
    
    if (!fileExists) {
      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 404 }
      );
    }
    
    // Generate a public URL for the file
    const publicUrl = await getPublicFileUrl(filePath);
    
    // Return the public URL to the client
    return NextResponse.json({
      publicUrl,
      filePath,
    });
    
  } catch (error) {
    console.error('File verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify file upload' },
      { status: 500 }
    );
  }
}