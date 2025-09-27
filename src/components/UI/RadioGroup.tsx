import React from 'react';
import { cn } from '@/utils/cn';

// Unified RadioOption - same pattern everywhere
interface RadioOptionProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}

const RadioOption: React.FC<RadioOptionProps> = ({
  name,
  value,
  checked,
  onChange,
  label,
  description
}) => {
  const radioId = `${name}-${value}`;

  return (
    <label
      htmlFor={radioId}
      className={cn(
        'flex items-start gap-sp-3 py-sp-3 px-sp-4 cursor-pointer',
        'border border-border rounded-md transition-all duration-200',
        'min-h-[40px] w-full', // 40px total height with 12px vertical padding
        'hover:bg-[#F5F6F7]' // hover background
      )}
    >
      <div className="pt-0.5">
        <div className="relative">
          <input
            type="radio"
            id={radioId}
            name={name}
            value={value}
            checked={checked}
            onChange={(e) => onChange(e.target.value)}
            className="peer sr-only"
          />
          {/* 18px outer circle with brand colors */}
          <div
            className="w-[18px] h-[18px] rounded-full border-2 transition-colors"
            style={{
              borderColor: checked ? '#1877F2' : '#DADDE1'
            }}
          />
          {/* 8px inner circle when selected */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-[8px] h-[8px] rounded-full transition-transform"
              style={{
                backgroundColor: '#1877F2',
                transform: checked ? 'scale(1)' : 'scale(0)'
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="meta-section-title text-14">{label}</div>
        {description && (
          <div className="meta-label mt-0.5">{description}</div>
        )}
      </div>
    </label>
  );
};

// Unified RadioGroup - handles all use cases
export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioGroupOption[];
  label?: string;
  className?: string;
  // Key prop: only container width changes for "wide" look
  containerWidth?: 'normal' | 'wide' | 'full';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  label,
  className,
  containerWidth = 'normal'
}) => {
  const containerWidths = {
    normal: 'max-w-md',
    wide: 'max-w-2xl',
    full: 'w-full'
  };

  return (
    <div className={cn(containerWidths[containerWidth], className)}>
      {label && (
        <label className="block meta-label mb-sp-2">
          {label}
        </label>
      )}
      <div className="space-y-sp-2"> {/* 8px spacing between rows */}
        {options.map((option) => (
          <RadioOption
            key={option.value}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            label={option.label}
            description={option.description}
          />
        ))}
      </div>
    </div>
  );
};

// For backwards compatibility and special layouts
export { RadioOption };