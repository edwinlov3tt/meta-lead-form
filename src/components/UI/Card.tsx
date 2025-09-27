import React from 'react';
import { cn } from '@/utils/cn';

// Updated Card component following Meta design specs
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'shadow' | 'border';
  }
>(({ className, variant = 'border', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-card bg-surface',
      variant === 'shadow' ? 'shadow-1' : 'border border-border',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-sp-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-16 font-semibold text-primary', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-14 text-text-secondary', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-sp-4 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-sp-4 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// Additional Meta-specific card components
const CardDivider = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn('border-t border-divider -mx-sp-4 my-sp-3', className)}
    {...props}
  />
));
CardDivider.displayName = 'CardDivider';

const CardSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title?: string;
    action?: React.ReactNode;
  }
>(({ className, title, action, children, ...props }, ref) => (
  <div ref={ref} className={cn('p-sp-4', className)} {...props}>
    {title && (
      <>
        <div className="flex items-center justify-between mb-sp-3">
          <h3 className="text-16 font-semibold text-primary">{title}</h3>
          {action && <div>{action}</div>}
        </div>
        <CardDivider />
      </>
    )}
    <div className="pt-sp-3">{children}</div>
  </div>
));
CardSection.displayName = 'CardSection';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardDivider, CardSection };