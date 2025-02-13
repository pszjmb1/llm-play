// __tests__/submit/page.test.tsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import SubmitPage from '@/app/submit/page';

// Mock the fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the toast hook with a spy
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

describe('SubmitPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockToast.mockReset();
  });

  it('renders form fields', () => {
    render(<SubmitPage />);
    
    expect(screen.getByLabelText(/environment name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<SubmitPage />);
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/description must be at least 10 characters/i)).toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('submits form successfully', async () => {
    // Setup mock response
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        success: true,
        environment: { id: 'test-id', name: 'Test Environment' },
        job: { id: 'job-id', status: 'queued' }
      })
    };
    mockFetch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve(mockResponse), 100);
    }));

    render(<SubmitPage />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/environment name/i), {
      target: { value: 'Test Environment' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'This is a test environment description' },
    });

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Immediately after click, button should be disabled
    expect(submitButton).toHaveAttribute('disabled');
    expect(submitButton).toHaveTextContent('Submitting...');

    // Wait for API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Environment',
          description: 'This is a test environment description'
        })
      });
    });

    // Wait for success toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Your environment has been submitted successfully.'
      });
    });

    // Button should be re-enabled
    await waitFor(() => {
      expect(submitButton).not.toHaveAttribute('disabled');
      expect(submitButton).toHaveTextContent('Submit Environment');
    });
  });

  it('handles API errors appropriately', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'Database error'
      })
    });

    render(<SubmitPage />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/environment name/i), {
      target: { value: 'Test Environment' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'This is a test environment description' },
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    // Verify error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Database error',
        variant: 'destructive'
      });
    });
  });

  it('handles network errors appropriately', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<SubmitPage />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/environment name/i), {
      target: { value: 'Test Environment' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'This is a test environment description' },
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-button'));
    });

    // Verify error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Network error',
        variant: 'destructive'
      });
    });
  });
});