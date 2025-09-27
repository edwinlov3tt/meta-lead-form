import React from 'react';
import { Check, Lock, ChevronRight } from 'lucide-react';

export type StepStatus = 'active' | 'enabled' | 'locked' | 'done';

export type Step = {
  id: string;
  label: string;
  status: StepStatus;
  href?: string;
};

interface BreadcrumbStepperProps {
  steps: Step[];
  onStepClick?: (id: string) => void;
}

const cls = (...classes: (string | false | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

export const BreadcrumbStepper: React.FC<BreadcrumbStepperProps> = ({
  steps,
  onStepClick,
}) => {
  return (
    <nav aria-label="Form steps" className="mb-4 w-full border-b border-gray-100 pb-6">
      <div className="overflow-x-auto">
        <ol className="flex items-center justify-center gap-1 sm:gap-2 min-w-max px-2">
          {steps.map((step, index) => {
            const isActive = step.status === 'active';
            const isLocked = step.status === 'locked';
            const isDone = step.status === 'done';

            const baseClasses =
              'inline-flex items-center justify-center h-10 rounded-lg border border-gray-200 px-2 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out whitespace-nowrap flex-shrink-0';

            const colorClasses = isActive
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
              : isLocked
                ? 'text-gray-400 bg-gray-50 border-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer';

            return (
              <li key={step.id} className="flex items-center flex-shrink-0">
                <button
                  type="button"
                  aria-current={isActive ? 'step' : undefined}
                  aria-disabled={isLocked || undefined}
                  onClick={() => !isLocked && onStepClick?.(step.id)}
                  className={cls(baseClasses, colorClasses)}
                  disabled={isLocked}
                >
                  {/* Icon with proper alignment */}
                  <span className="inline-flex items-center justify-center w-4 h-4 mr-1 sm:mr-2 flex-shrink-0">
                    {isDone ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : isLocked ? (
                      <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    ) : isActive ? (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full" />
                    ) : (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 border border-current rounded-full" />
                    )}
                  </span>

                  {/* Text with responsive sizing */}
                  <span className="leading-tight">
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">
                      {step.label === 'Campaign Brief' ? 'Brief' :
                       step.label === 'Form Builder' ? 'Builder' :
                       step.label === 'Review & Export' ? 'Review' : step.label}
                    </span>
                  </span>

                  {/* Done badge with better styling */}
                  {isDone && (
                    <span className="ml-1 sm:ml-2 inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 flex-shrink-0">
                      ✓
                    </span>
                  )}
                </button>

                {/* Better separator with consistent spacing */}
                {index < steps.length - 1 && (
                  <ChevronRight className="mx-1 sm:mx-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-300 flex-shrink-0" />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};