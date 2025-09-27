import React from 'react';
import { cn } from '@/utils/cn';

interface MetaInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const MetaInput = React.forwardRef<HTMLInputElement, MetaInputProps>(
  ({ className, label, error, helperText, fullWidth = true, ...props }, ref) => {
    const inputStyles = cn(
      'h-10 px-sp-3 rounded-md border bg-surface text-text-primary placeholder:text-text-muted',
      'focus:outline-none focus:border-primary transition-colors duration-200',
      error ? 'border-danger' : 'border-border',
      fullWidth ? 'w-full' : '',
      className
    );

    return (
      <div className={cn(fullWidth ? 'w-full' : '')}>
        {label && (
          <label className="block text-12 text-text-muted mb-sp-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={inputStyles}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn(
            'mt-sp-2 text-12',
            error ? 'text-danger' : 'text-text-secondary'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

MetaInput.displayName = 'MetaInput';

interface MetaTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const MetaTextarea = React.forwardRef<HTMLTextAreaElement, MetaTextareaProps>(
  ({ className, label, error, helperText, fullWidth = true, rows = 4, ...props }, ref) => {
    const textareaStyles = cn(
      'px-sp-3 py-sp-2 rounded-md border bg-surface text-text-primary placeholder:text-text-muted resize-none',
      'focus:outline-none focus:border-primary transition-colors duration-200',
      error ? 'border-danger' : 'border-border',
      fullWidth ? 'w-full' : '',
      className
    );

    return (
      <div className={cn(fullWidth ? 'w-full' : '')}>
        {label && (
          <label className="block text-12 text-text-muted mb-sp-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={textareaStyles}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn(
            'mt-sp-2 text-12',
            error ? 'text-danger' : 'text-text-secondary'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

MetaTextarea.displayName = 'MetaTextarea';

interface MetaSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: { value: string; label: string }[];
}

export const MetaSelect = React.forwardRef<HTMLSelectElement, MetaSelectProps>(
  ({ className, label, error, helperText, fullWidth = true, options, ...props }, ref) => {
    const selectStyles = cn(
      'h-10 px-sp-3 rounded-md border bg-surface text-text-primary cursor-pointer',
      'focus:outline-none focus:border-primary transition-colors duration-200',
      error ? 'border-danger' : 'border-border',
      fullWidth ? 'w-full' : '',
      className
    );

    return (
      <div className={cn(fullWidth ? 'w-full' : '')}>
        {label && (
          <label className="block text-12 text-text-muted mb-sp-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={selectStyles}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {(error || helperText) && (
          <p className={cn(
            'mt-sp-2 text-12',
            error ? 'text-danger' : 'text-text-secondary'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

MetaSelect.displayName = 'MetaSelect';