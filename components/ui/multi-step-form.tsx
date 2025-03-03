import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  description?: string;
  isOptional?: boolean;
  isCompleted?: boolean;
}

export interface MultiStepFormProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
  className?: string;
  onComplete?: () => void;
  isLastStepSubmit?: boolean;
  isSubmitting?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
}

export function MultiStepForm({
  steps,
  currentStep,
  onStepChange,
  children,
  className,
  onComplete,
  isLastStepSubmit = true,
  isSubmitting = false,
  canGoNext = true,
  canGoPrevious = true,
}: MultiStepFormProps) {
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      return;
    }

    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Step indicators */}
      <div className="relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-muted" />
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep || step.isCompleted;
            const isCurrent = index === currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onStepChange(index)}
                    className={cn(
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full',
                      'border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isCompleted
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCurrent
                          ? 'border-primary bg-background text-primary'
                          : 'border-muted bg-background text-muted-foreground',
                    )}
                    disabled={isSubmitting}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </button>
                </div>

                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      'text-xs font-medium',
                      isCurrent ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="mt-0.5 text-xs text-muted-foreground">{step.description}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-lg border p-6">{children}</div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || isSubmitting || !canGoPrevious}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <Button type="button" onClick={handleNext} disabled={!canGoNext || isSubmitting}>
          {isLastStep && isLastStepSubmit ? (
            isSubmitting ? (
              'Submitting...'
            ) : (
              'Submit'
            )
          ) : (
            <>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
