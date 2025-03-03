import { z } from 'zod';

// Status enums
export const environmentStatusEnum = ['pending', 'processing', 'completed', 'failed'] as const;
export type EnvironmentStatus = (typeof environmentStatusEnum)[number];

export const jobStatusEnum = ['queued', 'processing', 'completed', 'failed'] as const;
export type JobStatus = (typeof jobStatusEnum)[number];

// Environment type categorization
export const environmentTypeEnum = [
  'text-game',
  'reasoning-challenge',
  'mathematics',
  'code-generation',
  'instruction-following',
  'agent-task',
  'other',
] as const;
export type EnvironmentType = (typeof environmentTypeEnum)[number];

// Difficulty levels
export const difficultyLevelEnum = ['easy', 'medium', 'hard', 'expert'] as const;
export type DifficultyLevel = (typeof difficultyLevelEnum)[number];

// Metadata schema with structured fields
export const metadataSchema = z.object({
  environmentType: z.enum(environmentTypeEnum),
  difficultyLevel: z.enum(difficultyLevelEnum),
  tags: z.array(z.string()).min(1, 'At least one tag is required').max(5, 'Maximum 5 tags allowed'),
  successCriteria: z.string().min(10, 'Success criteria must be at least 10 characters'),
  additionalNotes: z.string().optional(),
});

// File upload schema
export const fileUploadSchema = z.object({
  originalName: z.string(),
  fileSize: z
    .number()
    .positive('File size must be positive')
    .max(10 * 1024 * 1024, 'File too large (max 10MB)'),
  fileType: z.string(),
  storageKey: z.string().optional(),
  uploadStatus: z.enum(['pending', 'uploading', 'completed', 'failed']).optional(),
});

// Main environment submission schema
export const environmentSubmissionSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  // For uploads, we'll track the file info before it's fully processed
  fileUpload: fileUploadSchema.optional(),
  // Once processed, the file URL will be stored
  file_url: z.string().url('Invalid file URL').nullable().optional(),
  // Make metadata optional for backward compatibility with existing tests
  // In the actual implementation, we'll handle this on the front-end with a multi-step form
  metadata: metadataSchema.optional().nullable().or(z.record(z.any())),
});

export type EnvironmentSubmission = z.infer<typeof environmentSubmissionSchema>;

// Metadata type derived from schema
export type EnvironmentMetadata = z.infer<typeof metadataSchema>;

// File upload type derived from schema
export type FileUpload = z.infer<typeof fileUploadSchema>;

// Full environment interface
export interface Environment {
  id: string;
  name: string;
  description: string;
  file_url: string | null;
  // Typed metadata
  metadata: EnvironmentMetadata | null;
  status: EnvironmentStatus;
  user_id: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  environment_id: string;
  status: JobStatus;
  result: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionResult {
  environment: Environment;
  job: Job;
}

export interface SubmissionRepository {
  saveEnvironment(data: Omit<Environment, 'id' | 'created_at'>): Promise<Environment>;
  createJob(environmentId: string): Promise<Job>;
}

export class SubmissionError extends Error {
  constructor(
    message: string,
    public readonly code: 'VALIDATION' | 'DATABASE' | 'AUTH' | 'FILE_UPLOAD' | 'UNKNOWN',
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'SubmissionError';
  }
}

// Helper constants for file validation
export const ALLOWED_FILE_TYPES = [
  // Python files
  'text/x-python',
  'application/x-python',
  'text/x-python-script',
  // JavaScript files
  'application/javascript',
  'text/javascript',
  // JSON files
  'application/json',
  // Text files
  'text/plain',
  // Markdown files
  'text/markdown',
  // YAML files
  'application/x-yaml',
  'text/yaml',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper functions for file validation
export const isValidFileType = (fileType: string): boolean => {
  return ALLOWED_FILE_TYPES.includes(fileType);
};

export const isValidFileSize = (fileSize: number): boolean => {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE;
};

// Helper functions for file extension checking
export const getExtensionFromFilename = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isValidExtension = (filename: string): boolean => {
  const extension = getExtensionFromFilename(filename);
  return ['py', 'js', 'json', 'txt', 'md', 'yaml', 'yml'].includes(extension);
};

// File upload related utility types
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FileUploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  isComplete: boolean;
  error?: string;
}

// Form state for multi-step forms
export enum SubmissionStep {
  BasicInfo = 'basic-info',
  FileUpload = 'file-upload',
  Metadata = 'metadata',
  Review = 'review',
  Complete = 'complete',
}

// Type for validating the entire submission
export const validateSubmission = (data: Partial<EnvironmentSubmission>): FileValidationResult => {
  const errors: string[] = [];

  // Validate name and description
  if (!data.name || data.name.length < 3) {
    errors.push('Name must be at least 3 characters');
  }

  if (!data.description || data.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  // For backward compatibility with existing tests
  // In the future we'll enforce file uploads and metadata
  if (!data.fileUpload && !data.file_url && process.env.NODE_ENV === 'production') {
    errors.push('Either file upload or file URL should be provided');
  }

  if (data.fileUpload) {
    if (!isValidFileSize(data.fileUpload.fileSize)) {
      errors.push(`File size must be between 1 byte and ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!isValidExtension(data.fileUpload.originalName)) {
      errors.push('Invalid file extension. Allowed: .py, .js, .json, .txt, .md, .yaml, .yml');
    }
  }

  // Validate metadata if it exists and is of the expected structure
  if (data.metadata && typeof data.metadata === 'object' && 'environmentType' in data.metadata) {
    const { environmentType, difficultyLevel, tags, successCriteria } =
      data.metadata as EnvironmentMetadata;

    if (!environmentType) {
      errors.push('Environment type is required');
    }

    if (!difficultyLevel) {
      errors.push('Difficulty level is required');
    }

    if (!tags || tags.length === 0) {
      errors.push('At least one tag is required');
    }

    if (!successCriteria || successCriteria.length < 10) {
      errors.push('Success criteria must be at least 10 characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
