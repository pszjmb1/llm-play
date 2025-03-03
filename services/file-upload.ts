import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  FileUpload, 
  isValidFileSize, 
  isValidExtension, 
  FileValidationResult
} from '@/types/submission';

/**
 * Validates a file for upload
 * @param file The file to validate
 * @returns A validation result object
 */
export function validateFile(file: File): FileValidationResult {
  const errors: string[] = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  if (!isValidFileSize(file.size)) {
    errors.push('File size is too large');
  }
  
  if (!isValidExtension(file.name)) {
    errors.push('File type is not supported');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param folderPath The folder path to upload to (default: 'environments')
 * @returns The URL of the uploaded file
 */
export async function uploadFile(file: File, folderPath = 'environments'): Promise<string> {
  const validation = validateFile(file);
  
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const supabase = createClient();
  
  // Generate a unique filename to prevent collisions
  const fileExt = file.name.split('.').pop() || '';
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${folderPath}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('environments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) {
    console.error('Error uploading file:', error);
    throw new Error(error.message);
  }
  
  if (!data?.path) {
    throw new Error('No file path returned from upload');
  }
  
  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from('environments')
    .getPublicUrl(data.path);
  
  return publicUrlData.publicUrl;
}

/**
 * Deletes a file from Supabase storage
 * @param fileUrl The URL of the file to delete
 * @returns A boolean indicating if the file was deleted successfully
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  const supabase = createClient();
  
  // Extract the path from the URL
  // Example URL: https://xxxx.supabase.co/storage/v1/object/public/environments/folderPath/fileName
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'public');
    
    if (bucketIndex === -1 || bucketIndex + 2 >= pathParts.length) {
      throw new Error('Invalid file URL format');
    }
    
    const bucket = pathParts[bucketIndex + 1];
    const path = pathParts.slice(bucketIndex + 2).join('/');
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error parsing file URL:', error);
    return false;
  }
}