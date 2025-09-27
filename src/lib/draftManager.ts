import { storage } from './storage';
import { safeValidate } from './validation';
import type { MetaLeadForm, PreFormBrief } from './validation';

/**
 * Draft Management System
 * Handles auto-saving drafts to prevent data loss on refresh
 */

export interface DraftSnapshot {
  v: number; // Schema version
  updatedAt: string; // ISO timestamp
  pageKey: string; // page_id or username
  formId?: string; // if server row exists
  payload: {
    form: MetaLeadForm | null;
    brief: PreFormBrief | null;
  };
  meta: {
    // Hidden FB lookup data
    pageMetadata?: unknown;
    permissions?: unknown;
    [key: string]: unknown;
  };
}

interface DraftManagerOptions {
  pageKey: string;
  formSlug?: string;
  debounceMs?: number;
}

export class DraftManager {
  private pageKey: string;
  private formSlug: string;
  private debounceMs: number;
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastSnapshot: string | null = null;

  constructor(options: DraftManagerOptions) {
    this.pageKey = options.pageKey;
    this.formSlug = options.formSlug || 'default';
    this.debounceMs = options.debounceMs || 750;
  }

  /**
   * Generate storage key for draft
   */
  private getDraftKey(): string {
    return `mlfb:${this.pageKey}:${this.formSlug}:draft`;
  }

  /**
   * Create a draft snapshot from current data
   */
  private createSnapshot(
    form: MetaLeadForm | null,
    brief: PreFormBrief | null,
    formId?: string,
    meta?: Record<string, unknown>
  ): DraftSnapshot {
    return {
      v: 1, // Schema version
      updatedAt: new Date().toISOString(),
      pageKey: this.pageKey,
      formId,
      payload: {
        form,
        brief,
      },
      meta: meta || {},
    };
  }

  /**
   * Save draft to IndexedDB with debouncing and change detection
   */
  saveDraft(
    form: MetaLeadForm | null,
    brief: PreFormBrief | null,
    formId?: string,
    meta?: Record<string, unknown>
  ): void {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce the save operation
    this.debounceTimer = setTimeout(async () => {
      try {
        const snapshot = this.createSnapshot(form, brief, formId, meta);
        const snapshotJson = JSON.stringify(snapshot);

        // Only write if content has changed (cheap hash comparison)
        if (snapshotJson === this.lastSnapshot) {
          return; // No changes, skip save
        }

        await storage.forms.save(this.getDraftKey(), snapshot);
        this.lastSnapshot = snapshotJson;

        // Optional: Dispatch event for UI feedback
        window.dispatchEvent(new CustomEvent('draft:saved', {
          detail: { timestamp: snapshot.updatedAt }
        }));

        console.log('📝 Draft saved:', this.getDraftKey());
      } catch (error) {
        console.error('Failed to save draft:', error);
        window.dispatchEvent(new CustomEvent('draft:save-error', {
          detail: { error }
        }));
      }
    }, this.debounceMs);
  }

  /**
   * Load draft from IndexedDB
   */
  async loadDraft(): Promise<DraftSnapshot | null> {
    try {
      const draft = await storage.forms.load<DraftSnapshot>(this.getDraftKey());

      if (!draft) {
        return null;
      }

      // Basic validation of draft structure
      if (!draft.v || !draft.updatedAt || !draft.pageKey || !draft.payload) {
        console.warn('Invalid draft structure, ignoring');
        await this.clearDraft(); // Clean up invalid draft
        return null;
      }

      // Validate the payload data
      if (draft.payload.form) {
        const formResult = safeValidate.form(draft.payload.form);
        if (!formResult.success) {
          console.warn('Draft form data invalid:', formResult.error);
          draft.payload.form = null; // Clear invalid form data
        }
      }

      if (draft.payload.brief) {
        const briefResult = safeValidate.brief(draft.payload.brief);
        if (!briefResult.success) {
          console.warn('Draft brief data invalid:', briefResult.error);
          draft.payload.brief = null; // Clear invalid brief data
        }
      }

      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }

  /**
   * Check if draft exists and is newer than server data
   */
  async checkForNewerDraft(serverUpdatedAt?: string): Promise<{
    hasDraft: boolean;
    isNewer: boolean;
    draft?: DraftSnapshot;
  }> {
    const draft = await this.loadDraft();

    if (!draft) {
      return { hasDraft: false, isNewer: false };
    }

    const isNewer = serverUpdatedAt ?
      new Date(draft.updatedAt) > new Date(serverUpdatedAt) :
      true; // If no server timestamp, assume draft is newer

    return {
      hasDraft: true,
      isNewer,
      draft,
    };
  }

  /**
   * Clear draft from storage
   */
  async clearDraft(): Promise<void> {
    try {
      await storage.forms.remove(this.getDraftKey());
      this.lastSnapshot = null;

      window.dispatchEvent(new CustomEvent('draft:cleared'));
      console.log('🗑️ Draft cleared:', this.getDraftKey());
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }

  /**
   * Get relative time string for UI display
   */
  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return time.toLocaleDateString();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}

/**
 * Singleton draft manager factory
 */
const draftManagers = new Map<string, DraftManager>();

export function getDraftManager(options: DraftManagerOptions): DraftManager {
  const key = `${options.pageKey}:${options.formSlug || 'default'}`;

  if (!draftManagers.has(key)) {
    draftManagers.set(key, new DraftManager(options));
  }

  return draftManagers.get(key)!;
}

/**
 * Clean up all draft managers (call on app unmount)
 */
export function destroyAllDraftManagers(): void {
  draftManagers.forEach(manager => manager.destroy());
  draftManagers.clear();
}