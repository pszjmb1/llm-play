import { createClient } from '@/utils/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  FileUpload, 
  isValidFileSize, 
  isValidExtension, 
  FileValidationResult,
  FileUploadProgress
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
    errors.push('File size is too large (max 10MB)');
  }
  
  if (!isValidExtension(file.name)) {
    errors.push('File type is not supported (.py, .js, .json, .txt, .md, .yaml, .yml)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Performs a secure direct-to-storage upload using a signed URL
 * This is more secure than client-side Supabase storage uploads
 * 
 * @param file The file to upload
 * @param onProgress Optional callback for upload progress
 * @returns The public URL of the uploaded file
 */
export async function uploadFileSecure(
  file: File, 
  onProgress?: (progress: FileUploadProgress) => void
): Promise<string> {
  // Client-side validation
  const validation = validateFile(file);
  
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  try {
    // Step 1: Request a signed upload URL from our API
    const prepareResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    });
    
    if (!prepareResponse.ok) {
      const error = await prepareResponse.json();
      throw new Error(error.error || 'Failed to prepare upload');
    }
    
    const { uploadUrl, filePath } = await prepareResponse.json();
    
    // Step 2: Upload the file directly to storage using the signed URL
    if (onProgress) {
      onProgress({
        uploadedBytes: 0,
        totalBytes: file.size,
        percentage: 0,
        isComplete: false,
      });
    }
    
    // Use XMLHttpRequest for progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            uploadedBytes: event.loaded,
            totalBytes: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
            isComplete: false,
          });
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) {
            onProgress({
              uploadedBytes: file.size,
              totalBytes: file.size,
              percentage: 100,
              isComplete: true,
            });
          }
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
    
    // Step 3: Verify the upload and get the public URL
    const verifyResponse = await fetch(`/api/upload?filePath=${encodeURIComponent(filePath)}`);
    
    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      throw new Error(error.error || 'Failed to verify upload');
    }
    
    const { publicUrl } = await verifyResponse.json();
    return publicUrl;
    
  } catch (error) {
    console.error('File upload error:', error);
    if (onProgress) {
      onProgress({
        uploadedBytes: 0,
        totalBytes: file.size,
        percentage: 0,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      });
    }
    throw error;
  }
}

/**
 * Legacy direct storage upload using client-side Supabase
 * This will be deprecated in favor of the secure method above
 * 
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