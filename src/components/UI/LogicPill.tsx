import React from 'react';
import { cn } from '@/utils/cn';

interface LogicPillProps {
  action?: 'goto' | 'end' | 'close' | null;
  target?: string;
  onClick?: () => void;
  className?: string;
}

export const LogicPill: React.FC<LogicPillProps> = ({
  action,
  target,
  onClick,
  className
}) => {
  const getContent = () => {
    if (!action) {
      return 'Set logic';
    }

    switch (action) {
      case 'goto':
        return (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="mr-1">
              <path d="M4 2L8 6L4 10" strokeWidth="1.5" stroke="currentColor" fill="none" />
            </svg>
            {target || 'Q3'}
          </>
        );
      case 'end':
        return (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="mr-1">
              <path d="M2 6L10 6M7 3L10 6L7 9" strokeWidth="1.5" stroke="currentColor" fill="none" />
            </svg>
            End: Leads
          </>
        );
      case 'close':
        return (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="mr-1">
              <path d="M3 3L9 9M9 3L3 9" strokeWidth="1.5" stroke="currentColor" fill="none" />
            </svg>
            Close
          </>
        );
      default:
        return 'Set logic';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'h-8 px-sp-3 rounded-md border border-border bg-surface hover:bg-canvas',
        'text-12 font-medium text-text-primary transition-colors duration-200',
        'flex items-center justify-center min-w-[80px]',
        !action && 'text-text-muted',
        className
      )}
    >
      {getContent()}
    </button>
  );
};