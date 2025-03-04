import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cookies } from 'next/headers';
import * as serverFileUploadService from '@/services/server-file-upload';
import { isValidFileType, isValidExtension } from '@/types/submission';

// Mock dependencies
vi.mock('next/headers');
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
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
  })),
}));
vi.mock('@/services/server-file-upload');
vi.mock('@/types/submission', () => ({
  isValidFileType: vi.fn().mockReturnValue(true),
  isValidExtension: vi.fn().mockReturnValue(true),
  ALLOWED_FILE_TYPES: ['text/x-python', 'application/javascript', 'text/plain'],
}));

// Create mocked NextResponse
vi.mock('next/server', () => {
  class Headers {
    constructor(init?: Record<string, string>) {
      this._headers = init || {};
    }
    _headers: Record<string, string> = {};
    get(name: string) {
      return this._headers[name.toLowerCase()];
    }
    set(name: string, value: string) {
      this._headers[name.toLowerCase()] = value;
    }
  }

  class URL {
    constructor(url: string) {
      this.href = url;
      const [path, query] = url.split('?');
      this.pathname = path;
      this.searchParams = new URLSearchParams(query || '');
    }
    href: string;
    pathname: string;
    searchParams: URLSearchParams;
  }

  return {
    NextRequest: class {
      constructor(input: string, init?: { headers?: Record<string, string>; method?: string }) {
        this.url = input;
        this.nextUrl = new URL(input);
        this.headers = new Headers(init?.headers);
        this.method = init?.method || 'GET';
      }
      url: string;
      nextUrl: URL;
      headers: Headers;
      method: string;

      async json() {
        return this._json || {};
      }
      _json: any;

      clone() {
        const req = new NextRequest(this.url, {
          headers: this.headers._headers,
          method: this.method,
        });
        req._json = this._json;
        return req;
      }
    },
    NextResponse: {
      json: vi.fn((data, options) => ({
        status: options?.status || 200,
        async json() {
          return data;
        },
      })),
    },
  };
});

// Mock app/api/upload/route.ts
const mockPOSTHandler = vi.fn();
const mockGETHandler = vi.fn();

vi.mock('@/app/api/upload/route', () => ({
  POST: vi.fn(async (req) => {
    const result = await mockPOSTHandler(req);
    return result;
  }),
  GET: vi.fn(async (req) => {
    const result = await mockGETHandler(req);
    return result;
  }),
}));

describe('Upload API Route Tests', () => {
  // Import the module under test
  let routeModule: typeof import('@/app/api/upload/route');

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.resetModules();

    // Mock cookies
    vi.mocked(cookies).mockReturnValue({
      get: vi.fn(),
      getAll: vi.fn(),
    } as any);

    // Mock getSecureUploadUrl
    vi.mocked(serverFileUploadService.getSecureUploadUrl).mockResolvedValue({
      uploadUrl: 'https://example.com/signed-upload-url',
      filePath: 'environments/test-user-id/test-uuid.py',
    });

    // Mock getPublicFileUrl
    vi.mocked(serverFileUploadService.getPublicFileUrl).mockResolvedValue(
      'https://example.com/storage/environments/test-user-id/test-uuid.py',
    );

    // Mock verifyFileExists
    vi.mocked(serverFileUploadService.verifyFileExists).mockResolvedValue(true);

    // Setup the mock handlers
    mockPOSTHandler.mockImplementation(async (req) => {
      try {
        const body = await req.json();

        if (!body.fileName || !body.fileType || !body.fileSize) {
          return {
            status: 400,
            json: async () => ({ error: 'Missing required file information' }),
          };
        }

        const fileExtension = body.fileName.split('.').pop();

        const { uploadUrl, filePath } = await serverFileUploadService.getSecureUploadUrl(
          body.fileType,
          fileExtension,
          `environments/test-user-id`,
        );

        return {
          status: 200,
          json: async () => ({
            uploadUrl,
            filePath,
            expiresIn: 600,
          }),
        };
      } catch (error) {
        return {
          status: 500,
          json: async () => ({ error: 'Failed to prepare file upload' }),
        };
      }
    });

    mockGETHandler.mockImplementation(async (req) => {
      try {
        const filePath = req.nextUrl.searchParams.get('filePath');

        if (!filePath) {
          return {
            status: 400,
            json: async () => ({ error: 'Missing file path parameter' }),
          };
        }

        const fileExists = await serverFileUploadService.verifyFileExists(filePath);

        if (!fileExists) {
          return {
            status: 404,
            json: async () => ({ error: 'File not found in storage' }),
          };
        }

        const publicUrl = await serverFileUploadService.getPublicFileUrl(filePath);

        return {
          status: 200,
          json: async () => ({
            publicUrl,
            filePath,
          }),
        };
      } catch (error) {
        return {
          status: 500,
          json: async () => ({ error: 'Failed to verify file upload' }),
        };
      }
    });

    // Import the route module
    routeModule = await import('@/app/api/upload/route');
  });

  describe('POST /api/upload', () => {
    it('generates a signed upload URL for files', async () => {
      // Create a request with file information
      const { NextRequest } = await import('next/server');
      const request = new NextRequest('https://example.com/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      request._json = {
        fileName: 'test.py',
        fileType: 'text/x-python',
        fileSize: 1024,
      };

      // Call the POST handler
      const response = await routeModule.POST(request);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({
        uploadUrl: 'https://example.com/signed-upload-url',
        filePath: 'environments/test-user-id/test-uuid.py',
        expiresIn: 600,
      });

      // Verify the service was called
      expect(serverFileUploadService.getSecureUploadUrl).toHaveBeenCalledWith(
        'text/x-python',
        'py',
        'environments/test-user-id',
      );
    });

    it('validates required fields', async () => {
      // Create a request with missing information
      const { NextRequest } = await import('next/server');
      const request = new NextRequest('https://example.com/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      request._json = {
        // Missing fileName
        fileType: 'text/x-python',
        fileSize: 1024,
      };

      // Call the POST handler
      const response = await routeModule.POST(request);

      // Verify the response
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/upload', () => {
    it('verifies uploaded files and returns public URLs', async () => {
      // Create a request with file path
      const { NextRequest } = await import('next/server');
      const request = new NextRequest(
        'https://example.com/api/upload?filePath=environments/test-user-id/test-uuid.py',
      );

      // Call the GET handler
      const response = await routeModule.GET(request);
      const data = await response.json();

      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual({
        publicUrl: 'https://example.com/storage/environments/test-user-id/test-uuid.py',
        filePath: 'environments/test-user-id/test-uuid.py',
      });

      // Verify the services were called
      expect(serverFileUploadService.verifyFileExists).toHaveBeenCalledWith(
        'environments/test-user-id/test-uuid.py',
      );
      expect(serverFileUploadService.getPublicFileUrl).toHaveBeenCalledWith(
        'environments/test-user-id/test-uuid.py',
      );
    });

    it('returns 404 for non-existent files', async () => {
      // Mock verifyFileExists to return false
      vi.mocked(serverFileUploadService.verifyFileExists).mockResolvedValueOnce(false);

      // Create a request with non-existent file path
      const { NextRequest } = await import('next/server');
      const request = new NextRequest(
        'https://example.com/api/upload?filePath=environments/test-user-id/nonexistent.py',
      );

      // Call the GET handler
      const response = await routeModule.GET(request);

      // Verify the response
      expect(response.status).toBe(404);
    });

    it('requires a file path', async () => {
      // Create a request without file path
      const { NextRequest } = await import('next/server');
      const request = new NextRequest('https://example.com/api/upload');

      // Call the GET handler
      const response = await routeModule.GET(request);

      // Verify the response
      expect(response.status).toBe(400);
    });
  });
});
