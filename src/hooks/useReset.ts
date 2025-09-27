import { useState, useCallback, useEffect } from 'react';
import { hardReset, devReset, type ResetOptions, type ResetProgress } from '@/lib/resetSystem';

/**
 * React hook for reset functionality
 */

interface UseResetReturn {
  /** Trigger hard reset with confirmation */
  reset: (options?: ResetOptions) => Promise<void>;
  /** Quick reset for development (no confirmation) */
  devReset: () => Promise<void>;
  /** Whether reset is in progress */
  isResetting: boolean;
  /** Reset progress information */
  progress: ResetProgress | null;
  /** Reset error if any */
  error: string | null;
  /** Clear error state */
  clearError: () => void;
}

export function useReset(): UseResetReturn {
  const [isResetting, setIsResetting] = useState(false);
  const [progress, setProgress] = useState<ResetProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Listen for reset events
  useEffect(() => {
    const handleProgress = (event: CustomEvent<ResetProgress>) => {
      setProgress(event.detail);
    };

    const handleComplete = () => {
      setIsResetting(false);
      setProgress(null);
      setError(null);
    };

    const handleError = (event: CustomEvent<{ error: string }>) => {
      setIsResetting(false);
      setProgress(null);
      setError(event.detail.error);
    };

    window.addEventListener('reset:progress', handleProgress as EventListener);
    window.addEventListener('reset:complete', handleComplete);
    window.addEventListener('reset:error', handleError as EventListener);

    return () => {
      window.removeEventListener('reset:progress', handleProgress as EventListener);
      window.removeEventListener('reset:complete', handleComplete);
      window.removeEventListener('reset:error', handleError as EventListener);
    };
  }, []);

  const reset = useCallback(async (options?: ResetOptions) => {
    try {
      setIsResetting(true);
      setError(null);
      setProgress(null);

      await hardReset({
        showProgress: true,
        ...options,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Reset failed';
      setError(errorMessage);
      setIsResetting(false);
    }
  }, []);

  const handleDevReset = useCallback(async () => {
    try {
      setIsResetting(true);
      setError(null);
      setProgress(null);

      await devReset();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Dev reset failed';
      setError(errorMessage);
      setIsResetting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    reset,
    devReset: handleDevReset,
    isResetting,
    progress,
    error,
    clearError,
  };
}