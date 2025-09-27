import React from 'react';
import { cn } from '@/utils/cn';

// Meta Radio Component - Consistent everywhere
interface MetaRadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  fullWidth?: boolean;
}

export const MetaRadio = React.forwardRef<HTMLInputElement, MetaRadioProps>(
  ({ className, label, description, fullWidth = true, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <label
        htmlFor={radioId}
        className={cn(
          'flex items-start gap-sp-3 py-sp-3 px-sp-2 cursor-pointer hover:bg-canvas transition-colors rounded-md',
          'min-h-[44px]', // Ensures 40-44px height
          fullWidth ? 'w-full' : '',
          className
        )}
      >
        <div className="pt-0.5">
          <div className="relative">
            <input
              ref={ref}
              type="radio"
              id={radioId}
              className="peer sr-only"
              {...props}
            />
            <div className="w-[18px] h-[18px] rounded-full border-2 border-border peer-checked:border-primary transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[8px] h-[8px] rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform" />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-14 text-text-primary">{label}</div>
          {description && (
            <div className="text-12 text-text-secondary mt-0.5">{description}</div>
          )}
        </div>
      </label>
    );
  }
);

MetaRadio.displayName = 'MetaRadio';

// Meta Checkbox Component - Consistent everywhere
interface MetaCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  fullWidth?: boolean;
}

export const MetaCheckbox = React.forwardRef<HTMLInputElement, MetaCheckboxProps>(
  ({ className, label, description, fullWidth = true, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'flex items-start gap-sp-3 py-sp-3 px-sp-2 cursor-pointer hover:bg-canvas transition-colors rounded-md',
          'min-h-[44px]', // Ensures 40-44px height
          fullWidth ? 'w-full' : '',
          className
        )}
      >
        <div className="pt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              'w-[18px] h-[18px] rounded border-2 border-border',
              'checked:bg-primary checked:border-primary',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'transition-colors'
            )}
            {...props}
          />
        </div>
        <div className="flex-1">
          <div className="text-14 text-text-primary">{label}</div>
          {description && (
            <div className="text-12 text-text-secondary mt-0.5">{description}</div>
          )}
        </div>
      </label>
    );
  }
);

MetaCheckbox.displayName = 'MetaCheckbox';

// Radio Group Container - for proper spacing
interface MetaRadioGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export const MetaRadioGroup: React.FC<MetaRadioGroupProps> = ({
  children,
  label,
  className
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-12 text-text-muted mb-sp-2">
          {label}
        </label>
      )}
      <div className="space-y-2"> {/* 8px spacing between rows */}
        {children}
      </div>
    </div>
  );
};

// Checkbox Group Container - for proper spacing
interface MetaCheckboxGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export const MetaCheckboxGroup: React.FC<MetaCheckboxGroupProps> = ({
  children,
  label,
  className
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-12 text-text-muted mb-sp-2">
          {label}
        </label>
      )}
      <div className="space-y-2"> {/* 8px spacing between rows */}
        {children}
      </div>
    </div>
  );
};

// Custom Radio Button Style (visual only, uses native radio internally)
export const MetaRadioCustom: React.FC<MetaRadioProps> = React.forwardRef<HTMLInputElement, MetaRadioProps>(
  ({ className, label, description, fullWidth = true, ...props }, ref) => {
    return (
      <div
        className={cn(
          'relative',
          fullWidth ? 'w-full' : '',
          className
        )}
      >
        <input
          ref={ref}
          type="radio"
          className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          {...props}
        />
        <div className={cn(
          'flex items-start gap-sp-3 py-sp-3 px-sp-3 rounded-md border border-border',
          'peer-checked:border-primary peer-checked:bg-primary/5',
          'hover:border-primary/50 transition-all',
          'min-h-[44px]'
        )}>
          <div className="pt-0.5">
            <div className="relative">
              <div className="w-[18px] h-[18px] rounded-full border-2 border-border peer-checked:border-primary transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[8px] h-[8px] rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform" />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-14 font-medium text-text-primary">{label}</div>
            {description && (
              <div className="text-12 text-text-secondary mt-0.5">{description}</div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MetaRadioCustom.displayName = 'MetaRadioCustom';