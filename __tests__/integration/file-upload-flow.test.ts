import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createClient } from '@/utils/supabase/client';
import { uploadFileSecure } from '@/services/file-upload';
import { isValidFileSize, isValidExtension } from '@/types/submission';

/**
 * This integration test tests the full file upload flow:
 * 1. Client-side validation
 * 2. Request for a secure upload URL from the API
 * 3. Direct upload to storage
 * 4. Verification of the upload
 * 5. Getting the public URL
 */

// Mock fetch API
global.fetch = vi.fn();

// Mock validation functions
vi.mock('@/types/submission', () => ({
  isValidFileSize: vi.fn(),
  isValidExtension: vi.fn(),
}));

// Mock XMLHttpRequest for direct upload
global.XMLHttpRequest = vi.fn(() => ({
  open: vi.fn(),
  send: vi.fn(function () {
    // Simulate success after a short delay
    setTimeout(() => {
      this.status = 200;
      this.dispatchEvent(new Event('load'));
    }, 50);
  }),
  setRequestHeader: vi.fn(),
  upload: {
    addEventListener: vi.fn(),
  },
  addEventListener: vi.fn(function (event, callback) {
    this[`on${event}`] = callback;
  }),
  dispatchEvent: vi.fn(function (event) {
    if (this[`on${event.type}`]) {
      this[`on${event.type}`]();
    }
  }),
})) as any;

// Mock Event constructor for XMLHttpRequest events
global.Event = vi.fn((type) => ({ type })) as any;

// Mock console.error to suppress expected error messages
console.error = vi.fn();

// Mocks for Supabase client
vi.mock('@/utils/supabase/client');

describe('File Upload Flow Integration', () => {
  // Set up mocks for the entire test suite
  beforeAll(() => {
    // Mock authenticated Supabase client
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'test-user-id' },
              access_token: 'test-token',
            },
          },
          error: null,
        }),
      },
    } as any);

    // Mock validation functions to pass by default
    vi.mocked(isValidFileSize).mockReturnValue(true);
    vi.mocked(isValidExtension).mockReturnValue(true);

    // Mock fetch for API calls
    vi.mocked(fetch).mockImplementation((url: string, options?: RequestInit) => {
      // Mock POST request to get signed URL
      if (url === '/api/upload' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              uploadUrl: 'https://example.com/signed-upload-url',
              filePath: 'environments/test-user-id/test-uuid.py',
              expiresIn: 600,
            }),
        }) as Response;
      }

      // Mock GET request to verify upload
      if (typeof url === 'string' && url.startsWith('/api/upload?filePath=')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              publicUrl: 'https://example.com/storage/environments/test-user-id/test-uuid.py',
              filePath: 'environments/test-user-id/test-uuid.py',
            }),
        }) as Response;
      }

      return Promise.reject(new Error(`Unhandled fetch call to ${url}`));
    });
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  it('completes the full upload flow successfully', async () => {
    // Create a test file
    const file = new File(['test content'], 'test.py', { type: 'text/x-python' });

    // Track progress events
    const progressEvents: any[] = [];
    const progressCallback = (progress: any) => {
      progressEvents.push({ ...progress });
    };

    // Perform the upload
    const publicUrl = await uploadFileSecure(file, progressCallback);

    // Verify the API calls
    expect(fetch).toHaveBeenCalledWith(
      '/api/upload',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );

    // Verify direct upload using XMLHttpRequest
    expect(XMLHttpRequest).toHaveBeenCalled();
    const xhrInstance = vi.mocked(XMLHttpRequest).mock.results[0].value;
    expect(xhrInstance.open).toHaveBeenCalledWith('PUT', 'https://example.com/signed-upload-url');
    expect(xhrInstance.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'text/x-python');
    expect(xhrInstance.send).toHaveBeenCalledWith(file);

    // Verify the final result
    expect(publicUrl).toBe('https://example.com/storage/environments/test-user-id/test-uuid.py');
  });

  it('validates files before attempting upload', async () => {
    // Reset fetch call history
    vi.mocked(fetch).mockClear();

    // Mock validation to fail
    vi.mocked(isValidFileSize).mockReturnValue(false);
    vi.mocked(isValidExtension).mockReturnValue(false);

    // Create an invalid file
    const invalidFile = new File(['bad content'], 'invalid.exe', {
      type: 'application/octet-stream',
    });

    // Attempt to upload should fail
    await expect(uploadFileSecure(invalidFile)).rejects.toThrow();

    // Restore validation mocks for other tests
    vi.mocked(isValidFileSize).mockReturnValue(true);
    vi.mocked(isValidExtension).mockReturnValue(true);
  });

  it('handles API errors gracefully', async () => {
    // Create a valid file
    const file = new File(['test content'], 'test.py', { type: 'text/x-python' });

    // Mock API error
    const originalMockFetch = fetch;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Server error' }),
        }) as any,
    );

    // Attempt to upload
    await expect(uploadFileSecure(file)).rejects.toThrow();

    // Restore fetch mock
    vi.mocked(fetch).mockImplementation(originalMockFetch as any);
  });

  it('handles upload errors gracefully', async () => {
    // Create a valid file
    const file = new File(['test content'], 'test.py', { type: 'text/x-python' });

    // Mock XMLHttpRequest error
    vi.mocked(XMLHttpRequest as any).mockImplementationOnce(() => ({
      open: vi.fn(),
      send: vi.fn(function () {
        // Simulate error after a short delay
        setTimeout(() => {
          this.status = 500;
          this.dispatchEvent(new Event('error'));
        }, 50);
      }),
      setRequestHeader: vi.fn(),
      upload: {
        addEventListener: vi.fn(),
      },
      addEventListener: vi.fn(function (event, callback) {
        this[`on${event}`] = callback;
      }),
      dispatchEvent: vi.fn(function (event) {
        if (this[`on${event.type}`]) {
          this[`on${event.type}`]();
        }
      }),
    }));

    // Attempt to upload
    await expect(uploadFileSecure(file)).rejects.toThrow();
  });

  it('handles verification errors gracefully', async () => {
    // Create a valid file
    const file = new File(['test content'], 'test.py', { type: 'text/x-python' });

    // Save original mock implementation
    const originalImplementation = vi.mocked(fetch).getMockImplementation();

    // Mock successful URL generation, but failed verification
    vi.mocked(fetch).mockImplementation((url: string, options?: RequestInit) => {
      // First request is successful (get signed URL)
      if (url === '/api/upload' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              uploadUrl: 'https://example.com/signed-upload-url',
              filePath: 'environments/test-user-id/test-uuid.py',
              expiresIn: 600,
            }),
        }) as Response;
      }

      // Second request fails (verification)
      if (typeof url === 'string' && url.startsWith('/api/upload?filePath=')) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'File not found' }),
        }) as Response;
      }

      return Promise.reject(new Error(`Unhandled fetch call to ${url}`));
    });

    // Attempt to upload
    await expect(uploadFileSecure(file)).rejects.toThrow();

    // Restore fetch mock
    if (originalImplementation) {
      vi.mocked(fetch).mockImplementation(originalImplementation);
    }
  });
});
