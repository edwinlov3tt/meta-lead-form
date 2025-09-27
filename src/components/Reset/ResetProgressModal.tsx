import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import type { ResetProgress } from '@/lib/resetSystem';

interface ResetProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResetProgressModal({ isOpen, onClose }: ResetProgressModalProps) {
  const [progress, setProgress] = useState<ResetProgress | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleProgress = (event: CustomEvent<ResetProgress>) => {
      setProgress(event.detail);
    };

    const handleComplete = () => {
      setIsComplete(true);
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    };

    const handleError = (event: CustomEvent<{ error: string }>) => {
      setError(event.detail.error);
    };

    if (isOpen) {
      window.addEventListener('reset:progress', handleProgress as EventListener);
      window.addEventListener('reset:complete', handleComplete);
      window.addEventListener('reset:error', handleError as EventListener);
    }

    return () => {
      window.removeEventListener('reset:progress', handleProgress as EventListener);
      window.removeEventListener('reset:complete', handleComplete);
      window.removeEventListener('reset:error', handleError as EventListener);
    };
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProgress(null);
      setIsComplete(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    'Clearing localForage data',
    'Clearing TanStack Query cache',
    'Clearing sessionStorage',
    'Clearing localStorage',
    'Destroying draft managers',
    'Resetting in-memory state',
  ];

  const getStepStatus = (stepIndex: number) => {
    if (error) return 'error';
    if (!progress) return 'pending';
    if (stepIndex < progress.completed) return 'completed';
    if (stepIndex === progress.completed && !progress.isComplete) return 'in-progress';
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title="">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {error ? 'Reset Failed' : isComplete ? 'Reset Complete!' : 'Resetting Application'}
          </h2>
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : isComplete ? (
            <p className="text-sm text-green-600">All data has been cleared successfully</p>
          ) : (
            <p className="text-sm text-gray-600">
              Clearing all local data and caches...
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {progress && !error && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progress.step}</span>
              <span>{progress.completed} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isComplete ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{
                  width: `${(progress.completed / progress.total) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Step List */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div
                key={step}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  status === 'completed'
                    ? 'bg-green-50 border border-green-200'
                    : status === 'in-progress'
                    ? 'bg-blue-50 border border-blue-200'
                    : status === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {getStepIcon(status)}
                <span
                  className={`flex-1 text-sm ${
                    status === 'completed'
                      ? 'text-green-800 font-medium'
                      : status === 'in-progress'
                      ? 'text-blue-800 font-medium'
                      : status === 'error'
                      ? 'text-red-800'
                      : 'text-gray-600'
                  }`}
                >
                  {step}
                </span>
                {status === 'completed' && (
                  <span className="text-xs text-green-600 font-medium">Done</span>
                )}
                {status === 'in-progress' && (
                  <span className="text-xs text-blue-600 font-medium">Working...</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-6 h-6" />
              <span className="font-medium">Reset Complete</span>
            </div>
            <p className="text-sm text-gray-600">
              Page will reload automatically to ensure a clean slate
            </p>
          </div>
        )}

        {/* Error Actions */}
        {error && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}