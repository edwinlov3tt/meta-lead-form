import { useEffect, useCallback, useRef, useState } from 'react';
import { useFormStore } from '@/stores/formStore';
import { autosaveManager, type ConflictResolution } from '@/utils/autosave';

interface AutosaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  showNotifications?: boolean;
}

interface AutosaveStatus {
  isEnabled: boolean;
  lastSaved?: Date;
  hasUnsavedChanges: boolean;
  isConflicted: boolean;
  isSaving: boolean;
}

export const useSmartAutosave = (options: AutosaveOptions = {}) => {
  const {
    enabled = true,
    debounceMs = 2000,
    showNotifications = false
  } = options;

  const { activeForm, preFormBrief, isDirty } = useFormStore();
  const lastSaveRef = useRef<string>('');
  const [status, setStatus] = useState<AutosaveStatus>({
    isEnabled: enabled,
    hasUnsavedChanges: false,
    isConflicted: false,
    isSaving: false
  });

  // Generate content hash for comparison
  const generateContentHash = useCallback(() => {
    const content = JSON.stringify({ form: activeForm, brief: preFormBrief });
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }, [activeForm, preFormBrief]);

  // Check for conflicts
  const checkForConflicts = useCallback(async () => {
    try {
      const conflict = await autosaveManager.detectConflicts(activeForm, preFormBrief);
      setStatus(prev => ({ ...prev, isConflicted: conflict.hasConflict }));
      return conflict;
    } catch (error) {
      console.error('Failed to check for conflicts:', error);
      return { hasConflict: false };
    }
  }, [activeForm, preFormBrief]);

  // Perform autosave
  const performAutosave = useCallback(async () => {
    if (!enabled || !activeForm) return;

    const currentHash = generateContentHash();
    if (currentHash === lastSaveRef.current) return;

    try {
      setStatus(prev => ({ ...prev, isSaving: true }));

      // Check for conflicts before saving
      const conflict = await checkForConflicts();
      if (conflict.hasConflict) {
        console.warn('Autosave skipped due to conflict');
        setStatus(prev => ({ ...prev, isConflicted: true, isSaving: false }));
        return;
      }

      await autosaveManager.save(activeForm, preFormBrief);

      lastSaveRef.current = currentHash;
      setStatus(prev => ({
        ...prev,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        isConflicted: false,
        isSaving: false
      }));

      if (showNotifications) {
        console.log('✓ Auto-saved successfully');
      }
    } catch (error) {
      console.error('Autosave failed:', error);
      setStatus(prev => ({ ...prev, isSaving: false }));
    }
  }, [enabled, activeForm, preFormBrief, generateContentHash, checkForConflicts, showNotifications]);

  // Auto-trigger save when data changes
  useEffect(() => {
    if (!enabled || !isDirty) return;

    const timeoutId = setTimeout(performAutosave, debounceMs);
    setStatus(prev => ({ ...prev, hasUnsavedChanges: true }));

    return () => clearTimeout(timeoutId);
  }, [enabled, isDirty, debounceMs, performAutosave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      autosaveManager.cleanup();
    };
  }, []);

  // Manual save function
  const saveNow = useCallback(async () => {
    await performAutosave();
  }, [performAutosave]);

  // Resolve conflicts
  const resolveConflict = useCallback(async (strategy: 'local' | 'remote' | 'manual', mergedData?: any) => {
    try {
      const resolution: ConflictResolution = {
        strategy,
        mergedData
      };

      const resolved = await autosaveManager.resolveConflict(resolution);

      if (strategy === 'remote' && resolved.form) {
        // Apply remote changes
        useFormStore.getState().setActiveForm(resolved.form);
        if (resolved.brief) {
          useFormStore.getState().setPreFormBrief(resolved.brief);
        }
      }

      setStatus(prev => ({ ...prev, isConflicted: false }));
      return resolved;
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }, []);

  // Get autosave history
  const getHistory = useCallback(() => {
    return autosaveManager.getAutosaveEntries().map(entry => ({
      id: entry.id,
      timestamp: new Date(entry.timestamp),
      version: entry.version,
      hasForm: !!entry.data.form,
      hasBrief: !!entry.data.brief
    }));
  }, []);

  // Restore from history
  const restoreFromHistory = useCallback(async (entryId: string) => {
    try {
      const data = await autosaveManager.restoreFromEntry(entryId);
      if (!data) {
        throw new Error('Autosave entry not found');
      }

      if (data.form) {
        useFormStore.getState().setActiveForm(data.form);
      }
      if (data.brief) {
        useFormStore.getState().setPreFormBrief(data.brief);
      }

      return data;
    } catch (error) {
      console.error('Failed to restore from history:', error);
      throw error;
    }
  }, []);

  // Clear autosave history
  const clearHistory = useCallback(() => {
    autosaveManager.clearAutosaveHistory();
    lastSaveRef.current = '';
  }, []);

  return {
    status,
    saveNow,
    checkForConflicts,
    resolveConflict,
    getHistory,
    restoreFromHistory,
    clearHistory
  };
};