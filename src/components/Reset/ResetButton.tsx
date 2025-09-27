import React from 'react';
import { RotateCcw, AlertTriangle, Loader, Trash2 } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { useReset } from '@/hooks/useReset';

interface ResetButtonProps {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Show as icon-only button */
  iconOnly?: boolean;
  /** Custom button text */
  children?: React.ReactNode;
  /** Show development reset option */
  showDevReset?: boolean;
}

export function ResetButton({
  variant = 'danger',
  size = 'md',
  className = '',
  iconOnly = false,
  children,
  showDevReset = process.env.NODE_ENV === 'development',
}: ResetButtonProps) {
  const { reset, devReset, isResetting, progress, error, clearError } = useReset();

  const handleReset = () => {
    reset();
  };

  const handleDevReset = () => {
    devReset();
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Reset failed: {error}</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={clearError}
        >
          Dismiss
        </Button>
      </div>
    );
  }

  if (isResetting) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 text-blue-600">
          <Loader className="w-4 h-4 animate-spin" />
          <div className="text-sm">
            {progress ? (
              <div>
                <div>{progress.step}</div>
                <div className="text-xs text-gray-500">
                  {progress.completed} / {progress.total}
                </div>
              </div>
            ) : (
              <span>Resetting...</span>
            )}
          </div>
        </div>

        {progress && (
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(progress.completed / progress.total) * 100}%`
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={handleReset}
        className="flex items-center gap-2"
        title="Reset all application data (Hold ⌘/Ctrl + Click)"
      >
        <RotateCcw className="w-4 h-4" />
        {!iconOnly && (children || 'Reset All Data')}
      </Button>

      {/* Development-only quick reset */}
      {showDevReset && (
        <Button
          variant="secondary"
          size={size}
          onClick={handleDevReset}
          className="flex items-center gap-2"
          title="Development reset (no confirmation)"
        >
          <Trash2 className="w-4 h-4" />
          {!iconOnly && 'Dev Reset'}
        </Button>
      )}
    </div>
  );
}