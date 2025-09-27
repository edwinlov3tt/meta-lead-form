import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './queryClient';

/**
 * Root providers component to wrap the entire application
 * Includes TanStack Query provider and dev tools
 */

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show dev tools in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

/**
 * Hook to initialize the enhanced features
 * Call this in your main App component or root layout
 */
export function useInitializeApp() {
  React.useEffect(() => {
    // Initialize storage
    console.log('Initializing Meta Lead Form Builder with enhanced features...');

    // You can add initialization logic here
    // For example, loading initial data, setting up event listeners, etc.
  }, []);
}

export default Providers;