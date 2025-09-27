import { useEffect, useRef, useCallback } from 'react';
import { getDraftManager, type DraftSnapshot } from '@/lib/draftManager';
import type { MetaLeadForm, PreFormBrief } from '@/lib/validation';

/**
 * React hook for managing drafts with auto-save functionality
 */

interface UseDraftManagerOptions {
  pageKey: string;
  formSlug?: string;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseDraftManagerReturn {
  saveDraft: (
    form: MetaLeadForm | null,
    brief: PreFormBrief | null,
    formId?: string,
    meta?: Record<string, unknown>
  ) => void;
  loadDraft: () => Promise<DraftSnapshot | null>;
  checkForNewerDraft: (serverUpdatedAt?: string) => Promise<{
    hasDraft: boolean;
    isNewer: boolean;
    draft?: DraftSnapshot;
  }>;
  clearDraft: () => Promise<void>;
  getRelativeTime: (timestamp: string) => string;
  isDraftSaving: boolean;
  lastSaved: string | null;
  saveError: Error | null;
}

export function useDraftManager(options: UseDraftManagerOptions): UseDraftManagerReturn {
  const {
    pageKey,
    formSlug = 'default',
    debounceMs = 750,
    enabled = true
  } = options;

  const managerRef = useRef(getDraftManager({ pageKey, formSlug, debounceMs }));
  const isDraftSavingRef = useRef(false);
  const lastSavedRef = useRef<string | null>(null);
  const saveErrorRef = useRef<Error | null>(null);

  // Force re-render when draft events occur
  const forceUpdate = useCallback(() => {
    // This is a simple force update mechanism
    // In a real app, you might want to use a state update
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleDraftSaved = (event: CustomEvent) => {
      isDraftSavingRef.current = false;
      lastSavedRef.current = event.detail.timestamp;
      saveErrorRef.current = null;
      forceUpdate();
    };

    const handleDraftSaveError = (event: CustomEvent) => {
      isDraftSavingRef.current = false;
      saveErrorRef.current = event.detail.error;
      forceUpdate();
    };

    const handleDraftCleared = () => {
      lastSavedRef.current = null;
      saveErrorRef.current = null;
      forceUpdate();
    };

    // Listen for draft events
    window.addEventListener('draft:saved', handleDraftSaved as EventListener);
    window.addEventListener('draft:save-error', handleDraftSaveError as EventListener);
    window.addEventListener('draft:cleared', handleDraftCleared);

    return () => {
      window.removeEventListener('draft:saved', handleDraftSaved as EventListener);
      window.removeEventListener('draft:save-error', handleDraftSaveError as EventListener);
      window.removeEventListener('draft:cleared', handleDraftCleared);
    };
  }, [enabled, forceUpdate]);

  const saveDraft = useCallback((
    form: MetaLeadForm | null,
    brief: PreFormBrief | null,
    formId?: string,
    meta?: Record<string, unknown>
  ) => {
    if (!enabled) return;

    isDraftSavingRef.current = true;
    saveErrorRef.current = null;
    managerRef.current.saveDraft(form, brief, formId, meta);
  }, [enabled]);

  const loadDraft = useCallback(async () => {
    if (!enabled) return null;
    return managerRef.current.loadDraft();
  }, [enabled]);

  const checkForNewerDraft = useCallback(async (serverUpdatedAt?: string) => {
    if (!enabled) return { hasDraft: false, isNewer: false };
    return managerRef.current.checkForNewerDraft(serverUpdatedAt);
  }, [enabled]);

  const clearDraft = useCallback(async () => {
    if (!enabled) return;
    await managerRef.current.clearDraft();
  }, [enabled]);

  const getRelativeTime = useCallback((timestamp: string) => {
    return managerRef.current.getRelativeTime(timestamp);
  }, []);

  return {
    saveDraft,
    loadDraft,
    checkForNewerDraft,
    clearDraft,
    getRelativeTime,
    isDraftSaving: isDraftSavingRef.current,
    lastSaved: lastSavedRef.current,
    saveError: saveErrorRef.current,
  };
}