import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateFile } from '@/services/file-upload';
import { isValidFileSize, isValidExtension } from '@/types/submission';

// Mock the validation functions from types/submission
vi.mock('@/types/submission', () => ({
  isValidFileSize: vi.fn(),
  isValidExtension: vi.fn(),
  MAX_FILE_SIZE: 10 * 1024 * 1024,
}));

describe('File Upload Service', () => {
  // Test file creation helper
  const createTestFile = (name = 'test.py', type = 'text/x-python', size = 1024) => {
    const file = new File(['test content'], name, { type });

    // Mock size property since it's readonly
    Object.defineProperty(file, 'size', {
      value: size,
      writable: false,
    });

    return file;
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('validateFile', () => {
    it('validates a valid file correctly', () => {
      // Mock validation functions to return true
      vi.mocked(isValidFileSize).mockReturnValue(true);
      vi.mocked(isValidExtension).mockReturnValue(true);

      const file = createTestFile();
      const result = validateFile(file);

      // Verify validation functions were called
      expect(isValidFileSize).toHaveBeenCalledWith(file.size);
      expect(isValidExtension).toHaveBeenCalledWith(file.name);

      // Check result
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('detects invalid file size', () => {
      // Mock validation functions
      vi.mocked(isValidFileSize).mockReturnValue(false);
      vi.mocked(isValidExtension).mockReturnValue(true);

      const file = createTestFile('large.py', 'text/x-python', 11 * 1024 * 1024);
      const result = validateFile(file);

      // Check result
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/file size is too large/i);
    });

    it('detects invalid file extension', () => {
      // Mock validation functions
      vi.mocked(isValidFileSize).mockReturnValue(true);
      vi.mocked(isValidExtension).mockReturnValue(false);

      const file = createTestFile('invalid.exe', 'application/octet-stream');
      const result = validateFile(file);

      // Check result
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/file type is not supported/i);
    });

    it('collects multiple validation errors', () => {
      // Mock validation functions to both return false
      vi.mocked(isValidFileSize).mockReturnValue(false);
      vi.mocked(isValidExtension).mockReturnValue(false);

      const file = createTestFile('invalid.exe', 'application/octet-stream', 11 * 1024 * 1024);
      const result = validateFile(file);

      // Check result
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0]).toMatch(/file size is too large/i);
      expect(result.errors[1]).toMatch(/file type is not supported/i);
    });

    it('handles null input', () => {
      const result = validateFile(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No file provided');
    });
  });
});
