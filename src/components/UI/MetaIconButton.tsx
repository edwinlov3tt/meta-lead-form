import React from 'react';
import { cn } from '@/utils/cn';

interface MetaIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'default' | 'drag';
  size?: 'default' | 'small';
}

export const MetaIconButton: React.FC<MetaIconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'default',
  className,
  ...props
}) => {
  const sizeStyles = {
    default: 'w-8 h-8', // 32x32 touch target
    small: 'w-6 h-6'    // 24x24 for tight spaces
  };

  const baseStyles = 'rounded-md border border-border bg-surface hover:bg-canvas transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';

  return (
    <button
      className={cn(
        baseStyles,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span className="w-4 h-4 flex items-center justify-center text-text-primary">
        {icon}
      </span>
    </button>
  );
};

// Specific icon buttons for common use cases
export const AddIconButton: React.FC<Omit<MetaIconButtonProps, 'icon'>> = (props) => (
  <MetaIconButton
    icon={
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
      </svg>
    }
    {...props}
  />
);

export const RemoveIconButton: React.FC<Omit<MetaIconButtonProps, 'icon'>> = (props) => (
  <MetaIconButton
    icon={
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
      </svg>
    }
    {...props}
  />
);

export const DragHandleButton: React.FC<Omit<MetaIconButtonProps, 'icon' | 'variant'>> = (props) => (
  <MetaIconButton
    variant="drag"
    icon={
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <circle cx="3" cy="2" r="1" />
        <circle cx="9" cy="2" r="1" />
        <circle cx="3" cy="6" r="1" />
        <circle cx="9" cy="6" r="1" />
        <circle cx="3" cy="10" r="1" />
        <circle cx="9" cy="10" r="1" />
      </svg>
    }
    className="cursor-grab hover:cursor-grabbing hover:bg-canvas transition-all duration-200"
    {...props}
  />
);

export const DeleteIconButton: React.FC<Omit<MetaIconButtonProps, 'icon'>> = (props) => (
  <MetaIconButton
    icon={
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
      </svg>
    }
    className="hover:bg-danger/10 hover:border-danger hover:text-danger"
    {...props}
  />
);

export const EditIconButton: React.FC<Omit<MetaIconButtonProps, 'icon'>> = (props) => (
  <MetaIconButton
    icon={
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L9.708 9H12.5a.5.5 0 0 1 0 1H8.5a.5.5 0 0 1-.5-.5V5.5a.5.5 0 0 1 1 0v2.793L15.146.854a.5.5 0 0 1 .708-.708zM1 2a1 1 0 0 1 1-1h5.5a.5.5 0 0 1 0 1H2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V8.5a.5.5 0 0 1 1 0V14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2z"/>
      </svg>
    }
    {...props}
  />
);