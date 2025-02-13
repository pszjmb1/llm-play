'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { EnvironmentSubmission, environmentSubmissionSchema } from '@/types/submission';

export default function SubmitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EnvironmentSubmission>({
    resolver: zodResolver(environmentSubmissionSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = form.handleSubmit(async (data: EnvironmentSubmission) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-8 text-2xl font-bold">Submit Environment</h1>
      
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
            data-testid="submit-button"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Environment'}
          </Button>
        </form>
      </Form>
    </div>
  );
}