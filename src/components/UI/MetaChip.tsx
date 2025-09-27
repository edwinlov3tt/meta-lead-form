import React from 'react';
import { cn } from '@/utils/cn';

interface MetaChipProps {
  children: React.ReactNode;
  selected?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'filter' | 'tag';
}

export const MetaChip: React.FC<MetaChipProps> = ({
  children,
  selected = false,
  icon,
  onClick,
  className,
  variant = 'tag'
}) => {
  const baseStyles = 'h-7 px-sp-3 rounded-pill text-12 font-semibold transition-all duration-200 inline-flex items-center gap-1.5';

  const variantStyles = selected
    ? 'bg-[#E7F3FF] text-primary border border-primary'
    : 'bg-surface border border-border text-text-primary hover:bg-canvas';

  const interactiveStyles = onClick ? 'cursor-pointer' : '';

  return (
    <span
      onClick={onClick}
      className={cn(
        baseStyles,
        variantStyles,
        interactiveStyles,
        className
      )}
    >
      {icon && (
        <span className="w-4 h-4 flex items-center justify-center">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};

// Specific chip types for common use cases
interface FilterChipProps extends Omit<MetaChipProps, 'variant' | 'icon'> {
  filterIcon?: React.ReactNode;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  filterIcon,
  ...props
}) => (
  <MetaChip
    variant="filter"
    icon={filterIcon || (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M1.5 3a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zM3 6.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm2 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
      </svg>
    )}
    {...props}
  />
);

interface AddChipProps extends Omit<MetaChipProps, 'variant' | 'icon'> {
}

export const AddChip: React.FC<AddChipProps> = (props) => (
  <MetaChip
    variant="filter"
    icon={
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
      </svg>
    }
    {...props}
  />
);

// Tag chip for pure labels (no icon)
export const TagChip: React.FC<Omit<MetaChipProps, 'variant' | 'icon'>> = (props) => (
  <MetaChip variant="tag" {...props} />
);