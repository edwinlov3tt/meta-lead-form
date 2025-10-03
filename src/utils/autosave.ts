import type { MetaLeadForm, PreFormBrief } from '@/types/form';

export interface AutosaveEntry {
  id: string;
  timestamp: number;
  data: {
    form?: MetaLeadForm;
    brief?: PreFormBrief;
  };
  version: string;
  checksum: string;
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'manual';
  mergedData?: {
    form?: MetaLeadForm;
    brief?: PreFormBrief;
  };
}

class AutosaveManager {
  private static instance: AutosaveManager;
  private readonly STORAGE_KEY = 'meta-form-autosave';
  private readonly MAX_ENTRIES = 10;
  private readonly SAVE_DEBOUNCE = 2000; // 2 seconds
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastSaveVersion = '';

  static getInstance(): AutosaveManager {
    if (!AutosaveManager.instance) {
      AutosaveManager.instance = new AutosaveManager();
    }
    return AutosaveManager.instance;
  }

  private generateChecksum(data: any): string {
    // Simple hash function for change detection
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private generateVersion(): string {
    return `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async save(form?: MetaLeadForm, brief?: PreFormBrief): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.performSave(form, brief);
    }, this.SAVE_DEBOUNCE);
  }

  private async performSave(form?: MetaLeadForm, brief?: PreFormBrief): Promise<void> {
    try {
      const data = { form, brief };
      const checksum = this.generateChecksum(data);
      const version = this.generateVersion();

      // Skip save if data hasn't changed
      if (checksum === this.lastSaveVersion) {
        return;
      }

      const entry: AutosaveEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        data,
        version,
        checksum
      };

      const existing = this.getAutosaveEntries();
      const updated = [entry, ...existing].slice(0, this.MAX_ENTRIES);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      this.lastSaveVersion = checksum;

      console.log(`Autosaved at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('Failed to autosave:', error);
    }
  }

  getAutosaveEntries(): AutosaveEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);

      // Ensure we return an array
      if (!Array.isArray(parsed)) {
        console.warn('Invalid autosave data format, clearing storage');
        localStorage.removeItem(this.STORAGE_KEY);
        return [];
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse autosave entries:', error);
      // Clear corrupted data
      localStorage.removeItem(this.STORAGE_KEY);
      return [];
    }
  }

  getLatestEntry(): AutosaveEntry | null {
    const entries = this.getAutosaveEntries();
    return entries.length > 0 ? entries[0] : null;
  }

  async detectConflicts(currentForm?: MetaLeadForm, currentBrief?: PreFormBrief): Promise<{
    hasConflict: boolean;
    conflictType?: 'form' | 'brief' | 'both';
    latestEntry?: AutosaveEntry;
  }> {
    const latestEntry = this.getLatestEntry();
    if (!latestEntry) {
      return { hasConflict: false };
    }

    const currentChecksum = this.generateChecksum({ form: currentForm, brief: currentBrief });
    const hasConflict = currentChecksum !== latestEntry.checksum;

    if (!hasConflict) {
      return { hasConflict: false };
    }

    // Only report conflict if the autosave is significantly newer (>30 seconds)
    const timeDiff = Date.now() - latestEntry.timestamp;
    const CONFLICT_THRESHOLD = 30000; // 30 seconds

    if (timeDiff < CONFLICT_THRESHOLD) {
      // Recent autosave, probably from this session - no conflict
      return { hasConflict: false };
    }

    // Determine conflict type
    let conflictType: 'form' | 'brief' | 'both' = 'both';
    if (latestEntry.data.form && !latestEntry.data.brief) {
      conflictType = 'form';
    } else if (latestEntry.data.brief && !latestEntry.data.form) {
      conflictType = 'brief';
    }

    return {
      hasConflict: true,
      conflictType,
      latestEntry
    };
  }

  async resolveConflict(resolution: ConflictResolution): Promise<{
    form?: MetaLeadForm;
    brief?: PreFormBrief;
  }> {
    const latestEntry = this.getLatestEntry();
    if (!latestEntry) {
      throw new Error('No autosave entry found to resolve conflict');
    }

    switch (resolution.strategy) {
      case 'remote':
        return latestEntry.data;
      case 'local':
        // Return current data (handled by caller)
        return {};
      case 'manual':
        if (!resolution.mergedData) {
          throw new Error('Manual resolution requires merged data');
        }
        return resolution.mergedData;
      default:
        throw new Error(`Unknown resolution strategy: ${resolution.strategy}`);
    }
  }

  clearAutosaveHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.lastSaveVersion = '';
  }

  async restoreFromEntry(entryId: string): Promise<{
    form?: MetaLeadForm;
    brief?: PreFormBrief;
  } | null> {
    const entries = this.getAutosaveEntries();
    const entry = entries.find(e => e.id === entryId);
    return entry ? entry.data : null;
  }

  // Cleanup old entries (called periodically)
  cleanup(): void {
    try {
      const entries = this.getAutosaveEntries();
      if (!Array.isArray(entries)) {
        console.warn('Autosave entries is not an array, skipping cleanup');
        return;
      }

      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const cleaned = entries.filter(entry => entry && entry.timestamp && entry.timestamp > oneWeekAgo);

      if (cleaned.length !== entries.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleaned));
        console.log(`Cleaned up ${entries.length - cleaned.length} old autosave entries`);
      }
    } catch (error) {
      console.error('Failed to cleanup autosave entries:', error);
      // If cleanup fails, clear storage to prevent future errors
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

export const autosaveManager = AutosaveManager.getInstance();

// Export utilities for React hooks
export const useAutosave = () => {
  const save = (form?: MetaLeadForm, brief?: PreFormBrief) => {
    return autosaveManager.save(form, brief);
  };

  const detectConflicts = (form?: MetaLeadForm, brief?: PreFormBrief) => {
    return autosaveManager.detectConflicts(form, brief);
  };

  const resolveConflict = (resolution: ConflictResolution) => {
    return autosaveManager.resolveConflict(resolution);
  };

  const getHistory = () => {
    return autosaveManager.getAutosaveEntries();
  };

  const restore = (entryId: string) => {
    return autosaveManager.restoreFromEntry(entryId);
  };

  const clearHistory = () => {
    autosaveManager.clearAutosaveHistory();
  };

  return {
    save,
    detectConflicts,
    resolveConflict,
    getHistory,
    restore,
    clearHistory
  };
};