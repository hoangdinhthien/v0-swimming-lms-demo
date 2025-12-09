"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperContextValue {
  steps: Step[];
  currentStep: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const StepperContext = React.createContext<StepperContextValue | undefined>(
  undefined
);

export function useStepper() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a Stepper");
  }
  return context;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  children: React.ReactNode;
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  onStepChange,
  children,
  className,
}: StepperProps) {
  const goToStep = React.useCallback(
    (step: number) => {
      if (step >= 0 && step < steps.length) {
        onStepChange?.(step);
      }
    },
    [steps.length, onStepChange]
  );

  const nextStep = React.useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = React.useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const contextValue: StepperContextValue = {
    steps,
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
  };

  return (
    <StepperContext.Provider value={contextValue}>
      <div className={cn("w-full", className)}>{children}</div>
    </StepperContext.Provider>
  );
}

export function StepperHeader({ className }: { className?: string }) {
  const { steps, currentStep } = useStepper();

  return (
    <div className={cn("mb-8", className)}>
      <div className='flex items-center justify-between'>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <React.Fragment key={step.id}>
              <div className='flex flex-col items-center'>
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isActive &&
                      !isCompleted &&
                      "border-primary bg-background text-primary",
                    !isActive &&
                      !isCompleted &&
                      "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className='h-5 w-5' />
                  ) : (
                    <span className='text-sm font-medium'>{index + 1}</span>
                  )}
                </div>

                {/* Step Info */}
                <div className='mt-2 text-center'>
                  <div
                    className={cn(
                      "text-sm font-medium transition-colors",
                      isActive && "text-foreground",
                      !isActive && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className='mt-1 text-xs text-muted-foreground'>
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-0.5 flex-1 transition-colors",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function StepperContent({ children }: { children: React.ReactNode }) {
  return <div className='min-h-[400px]'>{children}</div>;
}

interface StepperStepProps {
  step: number;
  children: React.ReactNode;
}

export function StepperStep({ step, children }: StepperStepProps) {
  const { currentStep } = useStepper();

  if (currentStep !== step) {
    return null;
  }

  return <div className='animate-in fade-in-50 duration-300'>{children}</div>;
}

export function StepperFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-8 flex items-center justify-between border-t pt-6",
        className
      )}
    >
      {children}
    </div>
  );
}
