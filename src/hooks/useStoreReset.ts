import React, { useEffect } from 'react';
import { useFormStore } from '@/stores/formStore';
import { useDraftEnabledFormStore } from '@/stores/draftEnabledFormStore';

/**
 * Hook that connects stores to the global reset system
 * Automatically resets all store states when app:reset event is fired
 */
export function useStoreReset() {
  const formStoreReset = useFormStore(state => state.reset);

  useEffect(() => {
    const handleAppReset = () => {
      // Reset the original form store
      formStoreReset();

      // The draft-enabled store handles its own reset via event listener
      // No need to call it directly here

      console.log('All stores reset');
    };

    window.addEventListener('app:reset', handleAppReset);

    return () => {
      window.removeEventListener('app:reset', handleAppReset);
    };
  }, [formStoreReset]);
}

/**
 * Provider component that sets up store reset functionality
 */
export function StoreResetProvider({ children }: { children: React.ReactNode }) {
  useStoreReset();
  return React.createElement(React.Fragment, null, children);
}