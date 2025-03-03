'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  EnvironmentSubmission, 
  environmentSubmissionSchema, 
  SubmissionStep, 
  environmentTypeEnum,
  difficultyLevelEnum,
  EnvironmentType,
  DifficultyLevel,
  FileUpload
} from '@/types/submission';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MultiStepForm, Step } from '@/components/ui/multi-step-form';
import { FileInput } from '@/components/ui/file-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagInput } from '@/components/ui/tag-input';
import { uploadFile } from '@/services/file-upload';
import { Check, AlertCircle, FileText, Hash, BarChart3, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Form steps definition
const FORM_STEPS: Step[] = [
  {
    id: SubmissionStep.BasicInfo,
    label: "Basic Info",
    description: "Name and description",
  },
  {
    id: SubmissionStep.FileUpload,
    label: "Environment File",
    description: "Upload environment code",
  },
  {
    id: SubmissionStep.Metadata,
    label: "Metadata",
    description: "Type, difficulty, tags",
  },
  {
    id: SubmissionStep.Review,
    label: "Review",
    description: "Verify submission",
  }
];

export default function SubmitPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Initialize form with default values
  const form = useForm<EnvironmentSubmission>({
    resolver: zodResolver(environmentSubmissionSchema),
    defaultValues: {
      name: '',
      description: '',
      metadata: {
        environmentType: 'text-game' as EnvironmentType,
        difficultyLevel: 'medium' as DifficultyLevel,
        tags: [],
        successCriteria: '',
        additionalNotes: '',
      },
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

  // Handle file uploads
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      setFileUploadError(null);
      const fileUrl = await uploadFile(file);
      return fileUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      setFileUploadError(errorMessage);
      throw error;
    }
  };

  // Determine if each step is valid
  const stepValidation = useMemo(() => {
    const formValues = form.getValues();
    const formErrors = form.formState.errors;
    
    return {
      [SubmissionStep.BasicInfo]: !formErrors.name && !formErrors.description && 
        !!formValues.name && !!formValues.description,
      [SubmissionStep.FileUpload]: true, // File is optional for now
      [SubmissionStep.Metadata]: !formErrors.metadata && !!formValues.metadata?.environmentType &&
        !!formValues.metadata?.difficultyLevel && !!formValues.metadata?.successCriteria &&
        formValues.metadata.tags.length > 0,
      [SubmissionStep.Review]: true,
    };
  }, [form.formState.errors, form.watch()]);

  // Handle form submission
  const onSubmit = form.handleSubmit(async (data: EnvironmentSubmission) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please sign in to submit an environment');
      }

      // Convert fileUpload to file_url if needed
      let finalData = { ...data };
      if (data.fileUpload?.storageKey) {
        finalData.file_url = data.fileUpload.storageKey;
      }

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(finalData),
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
      setCurrentStep(0);
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

  // Get current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
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
                  <FormDescription>
                    A clear and concise name for your environment
                  </FormDescription>
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
                  <FormDescription>
                    Explain what your environment tests or measures, how it works, and why it's interesting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      
      case 1: // File Upload
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Environment File</h2>
            <FormField
              control={form.control}
              name="fileUpload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Environment Code</FormLabel>
                  <FormControl>
                    <FileInput
                      value={field.value as FileUpload}
                      onChange={field.onChange}
                      onUpload={handleFileUpload}
                      disabled={isSubmitting || !!authError}
                      error={fileUploadError || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload the code for your environment (Python, JavaScript, or JSON files preferred)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      
      case 2: // Metadata
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Environment Metadata</h2>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="metadata.environmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment Type</FormLabel>
                    <Select
                      disabled={isSubmitting || !!authError}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {environmentTypeEnum.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.split('-').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The category that best describes your environment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metadata.difficultyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select
                      disabled={isSubmitting || !!authError}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {difficultyLevelEnum.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How challenging is this environment for an LLM
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="metadata.tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting || !!authError}
                      placeholder="Add tags and press Enter..."
                      maxTags={5}
                    />
                  </FormControl>
                  <FormDescription>
                    Add up to 5 tags to categorize your environment (press Enter after each tag)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata.successCriteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Success Criteria</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isSubmitting || !!authError}
                      placeholder="Describe what success looks like in this environment..."
                      className="h-24"
                    />
                  </FormControl>
                  <FormDescription>
                    Define how to measure successful completion of this environment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata.additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isSubmitting || !!authError}
                      placeholder="Any additional information..."
                      className="h-24"
                    />
                  </FormControl>
                  <FormDescription>
                    Any other details that would be helpful for users of this environment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      
      case 3: // Review
        const formValues = form.getValues();
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Review Submission</h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <h4 className="text-sm font-medium">Environment Name</h4>
                    <p>{formValues.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm whitespace-pre-wrap">{formValues.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Environment File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formValues.fileUpload ? (
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      <span>{formValues.fileUpload.originalName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(formValues.fileUpload.fileSize / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-5 w-5" />
                      <span>No file uploaded (optional)</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium">Environment Type</h4>
                      <p className="capitalize">
                        {formValues.metadata?.environmentType.split('-').join(' ')}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Difficulty Level</h4>
                      <p className="capitalize">
                        {formValues.metadata?.difficultyLevel}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">Tags</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formValues.metadata?.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">Success Criteria</h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {formValues.metadata?.successCriteria}
                    </p>
                  </div>
                  
                  {formValues.metadata?.additionalNotes && (
                    <div>
                      <h4 className="text-sm font-medium">Additional Notes</h4>
                      <p className="text-sm whitespace-pre-wrap">
                        {formValues.metadata.additionalNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  // Can proceed to next step?
  const canGoNext = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return stepValidation[SubmissionStep.BasicInfo];
      case 1: // File Upload
        return stepValidation[SubmissionStep.FileUpload] && !fileUploadError;
      case 2: // Metadata
        return stepValidation[SubmissionStep.Metadata];
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  // Update step completion status
  const updatedSteps = FORM_STEPS.map((step, index) => ({
    ...step,
    isCompleted: index < currentStep && Object.values(stepValidation)[index],
  }));

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="text-3xl font-bold mb-4">Submit Environment</h1>
      <p className="text-muted-foreground mb-8">
        Share your reinforcement learning environment with the community to test language models.
      </p>
      
      {authError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <MultiStepForm
            steps={updatedSteps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onComplete={onSubmit}
            isSubmitting={isSubmitting}
            canGoNext={canGoNext()}
            canGoPrevious={true}
          >
            {renderStepContent()}
          </MultiStepForm>
        </form>
      </FormProvider>
    </div>
  );
}