import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { 
  ALLOWED_FILE_TYPES, 
  MAX_FILE_SIZE, 
  SubmissionError,
  isValidExtension,
  isValidFileType,
  isValidFileSize
} from '@/types/submission';

/**
 * Server-side function to generate a secure upload URL with expiry
 * This allows clients to upload directly to storage without exposing credentials
 * 
 * @param fileType The MIME type of the file
 * @param fileExtension The file extension
 * @param folderPath The folder path in the bucket
 * @returns Upload URL and file path
 */
export async function getSecureUploadUrl(
  fileType: string, 
  fileExtension: string, 
  folderPath = 'environments'
): Promise<{ uploadUrl: string; filePath: string }> {
  // Server-side validation
  if (!isValidFileType(fileType)) {
    throw new SubmissionError(
      `Unsupported file type: ${fileType}`,
      'FILE_UPLOAD',
      { allowedTypes: ALLOWED_FILE_TYPES }
    );
  }
  
  if (!isValidExtension(`.${fileExtension}`)) {
    throw new SubmissionError(
      `Unsupported file extension: ${fileExtension}`,
      'FILE_UPLOAD',
      { allowedExtensions: ['py', 'js', 'json', 'txt', 'md', 'yaml', 'yml'] }
    );
  }
  
  // Generate a secure, unique filename
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `${folderPath}/${fileName}`;
  
  // Create the Supabase client with server-side auth context
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    // Generate a signed URL that expires in 10 minutes
    const { data, error } = await supabase.storage
      .from('environments')
      .createSignedUploadUrl(filePath, {
        expiresIn: 600, // 10 minutes
        contentType: fileType,
        maxSize: MAX_FILE_SIZE,
      });
    
    if (error) {
      console.error('Error generating signed upload URL:', error);
      throw new SubmissionError(
        'Failed to prepare file upload',
        'FILE_UPLOAD',
        error
      );
    }
    
    if (!data?.signedUrl) {
      throw new SubmissionError(
        'No signed URL returned from server',
        'FILE_UPLOAD'
      );
    }
    
    return {
      uploadUrl: data.signedUrl,
      filePath: filePath,
    };
  } catch (error) {
    if (error instanceof SubmissionError) {
      throw error;
    }
    
    console.error('Unexpected error generating upload URL:', error);
    throw new SubmissionError(
      'Unexpected error preparing file upload',
      'UNKNOWN',
      error
    );
  }
}

/**
 * Generates a public URL for an uploaded file
 * 
 * @param filePath The path to the file in the bucket
 * @returns The public URL of the file
 */
export async function getPublicFileUrl(filePath: string): Promise<string> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data } = supabase.storage
    .from('environments')
    .getPublicUrl(filePath);
  
  if (!data.publicUrl) {
    throw new SubmissionError(
      'Failed to generate public URL for file',
      'FILE_UPLOAD'
    );
  }
  
  return data.publicUrl;
}

/**
 * Verifies that a file exists in storage and is valid
 * Used after upload to confirm the file was properly stored
 * 
 * @param filePath The path to the file in storage
 * @returns Boolean indicating if the file exists and is valid
 */
export async function verifyFileExists(filePath: string): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    // Check if the file exists by trying to get its metadata
    const { data, error } = await supabase.storage
      .from('environments')
      .download(filePath);
    
    if (error || !data) {
      console.error('File verification failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying file exists:', error);
    return false;
  }
}

/**
 * Deletes a file from storage
 * Used for cleanup if a submission fails or is deleted
 * 
 * @param filePath The path to the file in storage
 * @returns Boolean indicating if the deletion was successful
 */
export async function deleteStorageFile(filePath: string): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    const { error } = await supabase.storage
      .from('environments')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error deleting file:', error);
    return false;
  }
}