import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from './storage';
import { validate, safeValidate } from './validation';
import type { MetaLeadForm, PreFormBrief } from './validation';

/**
 * Enhanced form store using Zustand with localForage persistence
 * This provides better performance and reliability than the existing store
 */

interface FormState {
  // Current data
  activeForm: MetaLeadForm | null;
  preFormBrief: PreFormBrief | null;
  currentView: 'brief' | 'builder' | 'preview';

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;

  // Error handling
  error: string | null;

  // Actions
  setActiveForm: (form: MetaLeadForm | null) => void;
  setPreFormBrief: (brief: PreFormBrief | null) => void;
  setCurrentView: (view: 'brief' | 'builder' | 'preview') => void;

  // Enhanced form operations
  updateForm: (updates: Partial<MetaLeadForm>) => void;
  updateBrief: (updates: Partial<PreFormBrief>) => void;

  // Persistence operations
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  exportCampaign: () => string;
  importCampaign: (jsonString: string) => Promise<boolean>;

  // Auto-save functionality
  enableAutoSave: () => void;
  disableAutoSave: () => void;

  // Error handling
  clearError: () => void;
  setError: (error: string) => void;

  // Reset functionality
  resetForm: () => void;
  resetAll: () => void;
}

// Auto-save interval
let autoSaveInterval: NodeJS.Timeout | null = null;

export const useEnhancedFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeForm: null,
      preFormBrief: null,
      currentView: 'brief',
      isLoading: false,
      isSaving: false,
      lastSaved: null,
      error: null,

      // Basic setters
      setActiveForm: (form) => {
        set({ activeForm: form, error: null });
        // Validate if form is provided
        if (form) {
          const result = safeValidate.form(form);
          if (!result.success) {
            set({ error: `Form validation error: ${result.error.message}` });
          }
        }
      },

      setPreFormBrief: (brief) => {
        set({ preFormBrief: brief, error: null });
        // Validate if brief is provided
        if (brief) {
          const result = safeValidate.brief(brief);
          if (!result.success) {
            set({ error: `Brief validation error: ${result.error.message}` });
          }
        }
      },

      setCurrentView: (view) => set({ currentView: view }),

      // Enhanced update operations
      updateForm: (updates) => {
        const { activeForm } = get();
        if (!activeForm) return;

        const updatedForm = {
          ...activeForm,
          ...updates,
          updatedAt: new Date(),
        };

        // Validate the updated form
        const result = safeValidate.form(updatedForm);
        if (result.success) {
          set({ activeForm: updatedForm, error: null });
        } else {
          set({ error: `Form update validation error: ${result.error.message}` });
        }
      },

      updateBrief: (updates) => {
        const { preFormBrief } = get();
        if (!preFormBrief) return;

        const updatedBrief = {
          ...preFormBrief,
          ...updates,
          updatedAt: new Date(),
        };

        // Validate the updated brief
        const result = safeValidate.brief(updatedBrief);
        if (result.success) {
          set({ preFormBrief: updatedBrief, error: null });
        } else {
          set({ error: `Brief update validation error: ${result.error.message}` });
        }
      },

      // Persistence operations
      saveToStorage: async () => {
        const { activeForm, preFormBrief } = get();
        set({ isSaving: true, error: null });

        try {
          if (activeForm) {
            await storage.forms.save('currentForm', activeForm);
          }
          if (preFormBrief) {
            await storage.forms.save('currentBrief', preFormBrief);
          }
          set({ lastSaved: new Date(), isSaving: false });
        } catch (error) {
          set({
            error: `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`,
            isSaving: false
          });
        }
      },

      loadFromStorage: async () => {
        set({ isLoading: true, error: null });

        try {
          const [storedForm, storedBrief] = await Promise.all([
            storage.forms.load<MetaLeadForm>('currentForm'),
            storage.forms.load<PreFormBrief>('currentBrief'),
          ]);

          let validForm: MetaLeadForm | null = null;
          let validBrief: PreFormBrief | null = null;

          // Validate and set form
          if (storedForm) {
            const formResult = safeValidate.form(storedForm);
            if (formResult.success) {
              validForm = formResult.data;
            } else {
              console.warn('Stored form failed validation:', formResult.error);
            }
          }

          // Validate and set brief
          if (storedBrief) {
            const briefResult = safeValidate.brief(storedBrief);
            if (briefResult.success) {
              validBrief = briefResult.data;
            } else {
              console.warn('Stored brief failed validation:', briefResult.error);
            }
          }

          set({
            activeForm: validForm,
            preFormBrief: validBrief,
            isLoading: false
          });
        } catch (error) {
          set({
            error: `Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`,
            isLoading: false
          });
        }
      },

      exportCampaign: () => {
        const { activeForm, preFormBrief } = get();

        if (!activeForm || !preFormBrief) {
          throw new Error('Both form and brief are required for export');
        }

        const campaign = {
          brief: preFormBrief,
          form: activeForm,
          version: '1.0',
          exportedAt: new Date(),
        };

        // Validate before export
        const result = safeValidate.campaign(campaign);
        if (!result.success) {
          throw new Error(`Export validation failed: ${result.error.message}`);
        }

        return JSON.stringify(campaign, null, 2);
      },

      importCampaign: async (jsonString: string): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const imported = JSON.parse(jsonString);
          const result = safeValidate.campaign(imported);

          if (!result.success) {
            set({
              error: `Import validation failed: ${result.error.message}`,
              isLoading: false
            });
            return false;
          }

          const { brief, form } = result.data;
          set({
            preFormBrief: brief,
            activeForm: form,
            isLoading: false
          });

          // Save to storage
          await get().saveToStorage();
          return true;
        } catch (error) {
          set({
            error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            isLoading: false
          });
          return false;
        }
      },

      // Auto-save functionality
      enableAutoSave: () => {
        if (autoSaveInterval) return;

        autoSaveInterval = setInterval(async () => {
          await get().saveToStorage();
        }, 30000); // Save every 30 seconds
      },

      disableAutoSave: () => {
        if (autoSaveInterval) {
          clearInterval(autoSaveInterval);
          autoSaveInterval = null;
        }
      },

      // Error handling
      clearError: () => set({ error: null }),
      setError: (error) => set({ error }),

      // Reset operations
      resetForm: () => set({ activeForm: null }),
      resetAll: () => set({
        activeForm: null,
        preFormBrief: null,
        currentView: 'brief',
        error: null
      }),
    }),
    {
      name: 'meta-form-store',
      storage: createJSONStorage(() => ({
        getItem: async (key: string) => {
          const data = await storage.forms.load(key);
          return data ? JSON.stringify(data) : null;
        },
        setItem: async (key: string, value: string) => {
          await storage.forms.save(key, JSON.parse(value));
        },
        removeItem: async (key: string) => {
          await storage.forms.remove(key);
        },
      })),
      partialize: (state) => ({
        activeForm: state.activeForm,
        preFormBrief: state.preFormBrief,
        currentView: state.currentView,
      }),
    }
  )
);