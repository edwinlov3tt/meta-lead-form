import React from 'react';
import { cn } from '@/utils/cn';

interface MetaCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'shadow' | 'border';
  padding?: 'standard' | 'header' | 'none';
}

export const MetaCard: React.FC<MetaCardProps> = ({
  children,
  className,
  variant = 'shadow',
  padding = 'standard'
}) => {
  const baseStyles = 'bg-surface rounded-card';

  const variantStyles = {
    shadow: 'shadow-1',
    border: 'border border-border'
  };

  const paddingStyles = {
    standard: 'p-sp-4', // 16px
    header: 'py-sp-3 px-sp-4', // 12px vertical, 16px horizontal
    none: ''
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  showDivider?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
  showDivider = false,
  className
}) => {
  return (
    <>
      <div className={cn("flex items-center justify-between", className)}>
        <h3 className="text-16 font-semibold text-primary">
          {title}
        </h3>
        {action && (
          <div className="flex items-center gap-sp-2">
            {action}
          </div>
        )}
      </div>
      {showDivider && (
        <div className="mt-sp-3 -mx-sp-4 border-t border-divider" />
      )}
    </>
  );
};

// Composite component for convenience
interface MetaCardSectionProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  showDivider?: boolean;
}

export const MetaCardSection: React.FC<MetaCardSectionProps> = ({
  title,
  action,
  children,
  showDivider = true
}) => {
  return (
    <div className="space-y-sp-3">
      <SectionHeader
        title={title}
        action={action}
        showDivider={showDivider}
      />
      <div className="pt-sp-3">
        {children}
      </div>
    </div>
  );
};