import React, { useEffect } from 'react';
import { useDraftEnabledFormStore } from '@/stores/draftEnabledFormStore';
import { DraftRestoreModal } from './DraftRestoreModal';
import { DraftStatusIndicator } from './DraftStatusIndicator';
import { getDraftManager } from '@/lib/draftManager';

/**
 * Draft Provider Component
 * Wraps the application with draft functionality
 */

interface DraftProviderProps {
  children: React.ReactNode;
  pageKey: string;
  formSlug?: string;
  formId?: string;
  serverUpdatedAt?: string;
  showStatusIndicator?: boolean;
  statusIndicatorClassName?: string;
}

export function DraftProvider({
  children,
  pageKey,
  formSlug = 'default',
  formId,
  serverUpdatedAt,
  showStatusIndicator = true,
  statusIndicatorClassName = 'fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg px-3 py-2 border',
}: DraftProviderProps) {
  const {
    // Draft state
    isDraftEnabled,
    isDraftSaving,
    lastDraftSaved,
    draftError,
    pendingDraft,
    showRestoreModal,

    // Actions
    initializeDraftSystem,
    restoreDraft,
    discardDraft,
    dismissRestoreModal,
  } = useDraftEnabledFormStore();

  // Initialize draft system on mount
  useEffect(() => {
    initializeDraftSystem(pageKey, formSlug, formId, serverUpdatedAt);

    return () => {
      // Cleanup is handled by the store
    };
  }, [pageKey, formSlug, formId, serverUpdatedAt, initializeDraftSystem]);

  // Get draft manager for utility functions
  const draftManager = getDraftManager({ pageKey, formSlug });

  return (
    <>
      {children}

      {/* Draft Status Indicator */}
      {showStatusIndicator && isDraftEnabled && (
        <DraftStatusIndicator
          isDraftSaving={isDraftSaving}
          lastSaved={lastDraftSaved}
          saveError={draftError}
          getRelativeTime={(timestamp) => draftManager.getRelativeTime(timestamp)}
          className={statusIndicatorClassName}
        />
      )}

      {/* Draft Restoration Modal */}
      <DraftRestoreModal
        isOpen={showRestoreModal}
        draft={pendingDraft}
        onRestore={restoreDraft}
        onDiscard={discardDraft}
        onClose={dismissRestoreModal}
        getRelativeTime={(timestamp) => draftManager.getRelativeTime(timestamp)}
      />
    </>
  );
}

/**
 * Hook to access draft functionality from within the provider
 */
export function useDraftStatus() {
  const {
    isDraftEnabled,
    isDraftSaving,
    lastDraftSaved,
    draftError,
    saveDraftNow,
  } = useDraftEnabledFormStore();

  return {
    isDraftEnabled,
    isDraftSaving,
    lastDraftSaved,
    draftError,
    saveDraftNow,
  };
}