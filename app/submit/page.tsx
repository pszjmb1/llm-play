'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { EnvironmentSubmission, environmentSubmissionSchema } from '@/types/submission';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SubmitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<EnvironmentSubmission>({
    resolver: zodResolver(environmentSubmissionSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth check error:', error);
          setAuthError('Failed to check authentication status');
        } else if (!session) {
          setAuthError('Please sign in to submit an environment');
        }
        
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthError('Failed to check authentication status');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const onSubmit = form.handleSubmit(async (data: EnvironmentSubmission) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please sign in to submit an environment');
      }

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      toast({
        title: 'Success',
        description: 'Your environment has been submitted successfully.',
      });

      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit environment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]">
      <p>Loading...</p>
    </div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-8 text-2xl font-bold">Submit Environment</h1>
      
      {authError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Environment Name</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    disabled={isSubmitting || !!authError}
                    placeholder="Enter environment name" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={isSubmitting || !!authError}
                    placeholder="Describe your environment..."
                    className="h-32"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isSubmitting || !!authError}
            aria-disabled={isSubmitting || !!authError}
            data-testid="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Environment'}
          </Button>
        </form>
      </Form>
    </div>
  );
}