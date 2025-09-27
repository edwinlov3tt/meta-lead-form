import React from 'react';
import { cn } from '@/utils/cn';

interface MetaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'small';
  fullWidth?: boolean;
}

export const MetaButton = React.forwardRef<HTMLButtonElement, MetaButtonProps>(
  ({ className, variant = 'primary', size = 'default', fullWidth = false, ...props }, ref) => {
    const baseStyles = 'font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';

    const sizeStyles = {
      default: 'h-10 px-sp-4 text-14 rounded-md', // 40px height
      small: 'h-8 px-sp-3 text-12 rounded-md', // 32px height
    };

    const variantStyles = {
      primary: 'bg-primary text-white hover:bg-primary-hover',
      secondary: 'bg-surface border border-border text-text-primary hover:bg-canvas',
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          widthStyles,
          className
        )}
        {...props}
      />
    );
  }
);

MetaButton.displayName = 'MetaButton';