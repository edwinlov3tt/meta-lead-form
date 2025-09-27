import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDraftManager, type DraftSnapshot } from '@/lib/draftManager';
import { safeValidate } from '@/lib/validation';
import type { MetaLeadForm, PreFormBrief } from '@/lib/validation';

/**
 * Enhanced form store with integrated draft management
 * Automatically saves drafts and handles restoration
 */

interface DraftEnabledFormState {
  // Current data
  activeForm: MetaLeadForm | null;
  preFormBrief: PreFormBrief | null;
  currentView: 'brief' | 'builder' | 'preview';

  // Draft management
  pageKey: string;
  formSlug: string;
  formId?: string;
  serverUpdatedAt?: string;

  // Draft status
  isDraftEnabled: boolean;
  isDraftSaving: boolean;
  lastDraftSaved: string | null;
  draftError: Error | null;

  // Restoration state
  pendingDraft: DraftSnapshot | null;
  showRestoreModal: boolean;

  // Actions - Basic setters
  setActiveForm: (form: MetaLeadForm | null) => void;
  setPreFormBrief: (brief: PreFormBrief | null) => void;
  setCurrentView: (view: 'brief' | 'builder' | 'preview') => void;

  // Actions - Draft management
  initializeDraftSystem: (pageKey: string, formSlug?: string, formId?: string, serverUpdatedAt?: string) => void;
  enableDrafts: () => void;
  disableDrafts: () => void;
  saveDraftNow: () => void;

  // Actions - Restoration flow
  checkForDraft: () => Promise<void>;
  restoreDraft: () => void;
  discardDraft: () => void;
  dismissRestoreModal: () => void;

  // Actions - Form operations with auto-draft
  updateForm: (updates: Partial<MetaLeadForm>) => void;
  updateBrief: (updates: Partial<PreFormBrief>) => void;

  // Actions - Cleanup
  clearAll: () => void;
}

export const useDraftEnabledFormStore = create<DraftEnabledFormState>()(
  persist(
    (set, get) => {
      let draftManager: ReturnType<typeof getDraftManager> | null = null;

      // Draft event handlers
      const handleDraftSaved = (event: CustomEvent) => {
        set({
          isDraftSaving: false,
          lastDraftSaved: event.detail.timestamp,
          draftError: null,
        });
      };

      const handleDraftSaveError = (event: CustomEvent) => {
        set({
          isDraftSaving: false,
          draftError: event.detail.error,
        });
      };

      const handleDraftCleared = () => {
        set({
          lastDraftSaved: null,
          draftError: null,
        });
      };

      // Set up event listeners
      const setupEventListeners = () => {
        window.addEventListener('draft:saved', handleDraftSaved as EventListener);
        window.addEventListener('draft:save-error', handleDraftSaveError as EventListener);
        window.addEventListener('draft:cleared', handleDraftCleared);
        window.addEventListener('app:reset', handleAppReset);
      };

      const handleAppReset = () => {
        // Reset all state when app reset is triggered
        draftManager?.destroy();
        draftManager = null;
        set({
          activeForm: null,
          preFormBrief: null,
          currentView: 'brief',
          pageKey: 'default',
          formSlug: 'default',
          formId: undefined,
          serverUpdatedAt: undefined,
          isDraftEnabled: false,
          isDraftSaving: false,
          lastDraftSaved: null,
          draftError: null,
          pendingDraft: null,
          showRestoreModal: false,
        });
      };

      const cleanupEventListeners = () => {
        window.removeEventListener('draft:saved', handleDraftSaved as EventListener);
        window.removeEventListener('draft:save-error', handleDraftSaveError as EventListener);
        window.removeEventListener('draft:cleared', handleDraftCleared);
        window.removeEventListener('app:reset', handleAppReset);
      };

      setupEventListeners();

      return {
        // Initial state
        activeForm: null,
        preFormBrief: null,
        currentView: 'brief',

        // Draft config
        pageKey: 'default',
        formSlug: 'default',
        formId: undefined,
        serverUpdatedAt: undefined,

        // Draft status
        isDraftEnabled: false,
        isDraftSaving: false,
        lastDraftSaved: null,
        draftError: null,

        // Restoration
        pendingDraft: null,
        showRestoreModal: false,

        // Basic setters with auto-draft
        setActiveForm: (form) => {
          set({ activeForm: form });

          // Validate if form is provided
          if (form) {
            const result = safeValidate.form(form);
            if (!result.success) {
              set({ draftError: new Error(`Form validation error: ${result.error.message}`) });
              return;
            }
          }

          // Trigger draft save
          const state = get();
          if (state.isDraftEnabled && draftManager) {
            set({ isDraftSaving: true });
            draftManager.saveDraft(form, state.preFormBrief, state.formId);
          }
        },

        setPreFormBrief: (brief) => {
          set({ preFormBrief: brief });

          // Validate if brief is provided
          if (brief) {
            const result = safeValidate.brief(brief);
            if (!result.success) {
              set({ draftError: new Error(`Brief validation error: ${result.error.message}`) });
              return;
            }
          }

          // Trigger draft save
          const state = get();
          if (state.isDraftEnabled && draftManager) {
            set({ isDraftSaving: true });
            draftManager.saveDraft(state.activeForm, brief, state.formId);
          }
        },

        setCurrentView: (view) => {
          set({ currentView: view });
        },

        // Draft management
        initializeDraftSystem: (pageKey, formSlug = 'default', formId, serverUpdatedAt) => {
          // Clean up existing manager
          draftManager?.destroy();

          // Create new manager
          draftManager = getDraftManager({ pageKey, formSlug });

          set({
            pageKey,
            formSlug,
            formId,
            serverUpdatedAt,
            isDraftEnabled: true,
            draftError: null,
          });

          // Automatically check for existing drafts
          get().checkForDraft();
        },

        enableDrafts: () => {
          set({ isDraftEnabled: true });
        },

        disableDrafts: () => {
          set({ isDraftEnabled: false });
        },

        saveDraftNow: () => {
          const state = get();
          if (state.isDraftEnabled && draftManager) {
            set({ isDraftSaving: true });
            draftManager.saveDraft(state.activeForm, state.preFormBrief, state.formId);
          }
        },

        // Restoration flow
        checkForDraft: async () => {
          if (!draftManager) return;

          try {
            const state = get();
            const result = await draftManager.checkForNewerDraft(state.serverUpdatedAt);

            if (result.hasDraft && result.isNewer && result.draft) {
              set({
                pendingDraft: result.draft,
                showRestoreModal: true,
              });
            }
          } catch (error) {
            console.error('Failed to check for draft:', error);
            set({ draftError: error as Error });
          }
        },

        restoreDraft: () => {
          const state = get();
          if (!state.pendingDraft) return;

          const { payload } = state.pendingDraft;
          set({
            activeForm: payload.form,
            preFormBrief: payload.brief,
            pendingDraft: null,
            showRestoreModal: false,
            draftError: null,
          });

          // Show success notification
          window.dispatchEvent(new CustomEvent('draft:restored', {
            detail: { timestamp: state.pendingDraft.updatedAt }
          }));
        },

        discardDraft: async () => {
          if (!draftManager) return;

          try {
            await draftManager.clearDraft();
            set({
              pendingDraft: null,
              showRestoreModal: false,
              lastDraftSaved: null,
              draftError: null,
            });
          } catch (error) {
            console.error('Failed to discard draft:', error);
            set({ draftError: error as Error });
          }
        },

        dismissRestoreModal: () => {
          set({
            showRestoreModal: false,
            pendingDraft: null,
          });
        },

        // Enhanced form operations
        updateForm: (updates) => {
          const state = get();
          if (!state.activeForm) return;

          const updatedForm = {
            ...state.activeForm,
            ...updates,
            updatedAt: new Date(),
          };

          get().setActiveForm(updatedForm);
        },

        updateBrief: (updates) => {
          const state = get();
          if (!state.preFormBrief) return;

          const updatedBrief = {
            ...state.preFormBrief,
            ...updates,
            updatedAt: new Date(),
          };

          get().setPreFormBrief(updatedBrief);
        },

        // Cleanup
        clearAll: () => {
          draftManager?.destroy();
          cleanupEventListeners();

          set({
            activeForm: null,
            preFormBrief: null,
            currentView: 'brief',
            isDraftEnabled: false,
            isDraftSaving: false,
            lastDraftSaved: null,
            draftError: null,
            pendingDraft: null,
            showRestoreModal: false,
          });
        },
      };
    },
    {
      name: 'draft-enabled-form-store',
      partialize: (state) => ({
        // Only persist essential state, not draft status
        activeForm: state.activeForm,
        preFormBrief: state.preFormBrief,
        currentView: state.currentView,
        pageKey: state.pageKey,
        formSlug: state.formSlug,
      }),
    }
  )
);