import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  MetaLeadForm,
  BuilderState,
  FrictionScore,
  FormValidation,
  ContactField,
  Qualifier,
  PreFormBrief,
  MetaCampaign
} from '@/types/form';

interface FormStore extends BuilderState {
  // Actions
  setActiveForm: (form: MetaLeadForm) => void;
  updateForm: (updates: Partial<MetaLeadForm>) => void;
  updateFormField: <K extends keyof MetaLeadForm>(field: K, value: MetaLeadForm[K]) => void;
  addQualifier: (qualifier: Omit<Qualifier, 'id' | 'order'>) => void;
  updateQualifier: (id: string, updates: Partial<Qualifier>) => void;
  removeQualifier: (id: string) => void;
  reorderQualifiers: (qualifiers: Qualifier[]) => void;
  addContactField: (field: Omit<ContactField, 'id' | 'order'>) => void;
  updateContactField: (id: string, updates: Partial<ContactField>) => void;
  removeContactField: (id: string) => void;
  reorderContactFields: (fields: ContactField[]) => void;
  setCurrentStep: (step: number) => void;
  calculateFrictionScore: () => void;
  validateForm: () => void;
  resetForm: () => void;
  reset: () => void;
  // Unified campaign actions
  setActiveCampaign: (campaign: MetaCampaign) => void;
  exportCampaign: () => string;
  importCampaign: (jsonString: string) => void;
  // Legacy actions (for backward compatibility)
  exportForm: () => string;
  importForm: (jsonString: string) => void;
  setPreFormBrief: (brief: PreFormBrief) => void;
  setCurrentView: (view: 'brief' | 'builder') => void;
  exportBrief: () => string;
  importBrief: (jsonString: string) => void;
  syncBriefToForm: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultForm = (): MetaLeadForm => ({
  id: generateId(),
  name: 'Untitled Form',
  meta: {
    objective: '',
    industry: '',
    priority: 'balanced',
    tone: '',
    audience: ''
  },
  formType: 'more_volume',
  intro: {
    headline: 'We need your help to get you the best service of your dreams',
    description: ''
  },
  contactDescription: '',
  contactFields: [
    {
      id: generateId(),
      name: 'Email',
      type: 'email',
      required: true,
      placeholder: 'you@example.com',
      autofill: true,
      order: 0
    },
    {
      id: generateId(),
      name: 'Full name',
      type: 'full_name',
      required: true,
      placeholder: 'Jane Doe',
      autofill: true,
      order: 1
    },
    {
      id: generateId(),
      name: 'Phone number',
      type: 'phone',
      required: true,
      placeholder: '(555) 123-4567',
      autofill: true,
      order: 2
    }
  ],
  qualifiers: [],
  privacy: {
    businessPrivacyUrl: '',
    customNotices: {
      title: 'Terms and Conditions',
      disclaimerText: '',
      consents: []
    }
  },
  thankYou: {
    headline: 'Thanks, you\'re all set.',
    description: '',
    action: {
      type: 'website',
      label: 'View website',
      websiteUrl: '',
      phoneNumber: ''
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

const calculateFriction = (form: MetaLeadForm): FrictionScore => {
  const requiredFields = form.contactFields.filter(f => f.required).length;
  const qualifyingQuestions = form.qualifiers.length;
  const customConsents = form.privacy.customNotices.consents.length;

  const breakdown = {
    requiredFields: requiredFields * 1.0,
    qualifyingQuestions: qualifyingQuestions * 1.5,
    customConsents: customConsents * 0.5
  };

  const total = breakdown.requiredFields + breakdown.qualifyingQuestions + breakdown.customConsents;

  let level: 'low' | 'medium' | 'high' = 'low';
  if (total >= 5) level = 'high';
  else if (total >= 3) level = 'medium';

  const recommendations: string[] = [];
  if (requiredFields > 5) recommendations.push('Consider reducing required contact fields');
  if (qualifyingQuestions > 3) recommendations.push('Too many qualifying questions may reduce completion rate');
  if (level === 'high') recommendations.push('High friction score may significantly impact lead volume');

  return {
    total: Math.round(total * 10) / 10,
    breakdown,
    level,
    recommendations
  };
};

const validateFormData = (form: MetaLeadForm): FormValidation => {
  const errors: { field: string; message: string; }[] = [];
  const warnings: { field: string; message: string; }[] = [];

  if (!form.intro.headline.trim()) {
    errors.push({ field: 'intro.headline', message: 'Headline is required' });
  }

  if (form.intro.headline.length > 60) {
    errors.push({ field: 'intro.headline', message: 'Headline must be 60 characters or less' });
  }

  if (!form.thankYou.description.trim()) {
    errors.push({ field: 'thankYou.description', message: 'Thank you description is required' });
  }

  if (form.contactFields.length < 2) {
    warnings.push({ field: 'contactFields', message: 'Consider adding more contact fields for better lead quality' });
  }

  if (form.contactFields.length > 8) {
    warnings.push({ field: 'contactFields', message: 'Too many contact fields may reduce form completion' });
  }

  if (form.qualifiers.length > 3) {
    warnings.push({ field: 'qualifiers', message: 'Meta recommends maximum 3 qualifying questions' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const useFormStore = create<FormStore>()(
  devtools(
    persist(
      (set, get) => ({
        activeForm: createDefaultForm(),
        preFormBrief: null,
        activeCampaign: null,
        isDirty: false,
        isLoading: false,
        currentStep: 0,
        previewSteps: [],
        validation: { isValid: true, errors: [], warnings: [] },
        frictionScore: { total: 0, breakdown: { requiredFields: 0, qualifyingQuestions: 0, customConsents: 0 }, level: 'low', recommendations: [] },
        currentView: 'brief',

        setActiveForm: (form) => {
          set({ activeForm: form, isDirty: false });
          get().calculateFrictionScore();
          get().validateForm();
        },

        updateForm: (updates) => {
          const currentForm = get().activeForm;
          if (!currentForm) return;

          const updatedForm = { ...currentForm, ...updates, updatedAt: new Date() };
          set({ activeForm: updatedForm, isDirty: true });
          get().calculateFrictionScore();
          get().validateForm();
        },

        updateFormField: (field, value) => {
          get().updateForm({ [field]: value });
        },

        addQualifier: (qualifier) => {
          const currentForm = get().activeForm;
          if (!currentForm) return;

          const newQualifier: Qualifier = {
            ...qualifier,
            id: generateId(),
            order: currentForm.qualifiers.length
          };

          get().updateForm({
            qualifiers: [...currentForm.qualifiers, newQualifier]
          });
        },

        updateQualifier: (id, updates) => {
          const currentForm = get().activeForm;
          if (!currentForm) return;

          const updatedQualifiers = currentForm.qualifiers.map(q =>
            q.id === id ? { ...q, ...updates } : q
          );

          get().updateForm({ qualifiers: updatedQualifiers });
        },

        removeQualifier: (id) => {
          const currentForm = get().activeForm;
          if (!currentForm) return;

          const filteredQualifiers = currentForm.qualifiers
            .filter(q => q.id !== id)
            .map((q, index) => ({ ...q, order: index }));

          get().updateForm({ qualifiers: filteredQualifiers });
        },

        reorderQualifiers: (qualifiers) => {
          const reorderedQualifiers = qualifiers.map((q, index) => ({ ...q, order: index }));
          get().updateForm({ qualifiers: reorderedQualifiers });
        },

        addContactField: (field) => {
          const currentForm = get().activeForm;
          if (!currentForm) return;

          const newField: ContactField = {
            ...field,
            id: generateId(),
            order: currentForm.contactFields.length
          };

          get().updateForm({
            contactFields: [...currentForm.contactFields, newField]
          });
        },

        updateContactField: (id, updates) => {
          const currentForm = get().activeForm;
          if (!currentForm) return;

          const updatedFields = currentForm.contactFields.map(f =>
            f.id === id ? { ...f, ...updates } : f
          );

          get().updateForm({ contactFields: updatedFields });
        },

        removeContactField: (id) => {
          const currentForm = get().activeForm;
          if (!currentForm) return;

          const filteredFields = currentForm.contactFields
            .filter(f => f.id !== id)
            .map((f, index) => ({ ...f, order: index }));

          get().updateForm({ contactFields: filteredFields });
        },

        reorderContactFields: (fields) => {
          const reorderedFields = fields.map((f, index) => ({ ...f, order: index }));
          get().updateForm({ contactFields: reorderedFields });
        },

        setCurrentStep: (step) => {
          set({ currentStep: step });
        },

        calculateFrictionScore: () => {
          const currentForm = get().activeForm;
          if (!currentForm) return;

          const frictionScore = calculateFriction(currentForm);
          set({ frictionScore });
        },

        validateForm: () => {
          const currentForm = get().activeForm;
          if (!currentForm) return;

          const validation = validateFormData(currentForm);
          set({ validation });
        },

        resetForm: () => {
          const newForm = createDefaultForm();
          set({
            activeForm: newForm,
            preFormBrief: null,
            activeCampaign: null,
            isDirty: false,
            currentStep: 0
          });
          get().calculateFrictionScore();
          get().validateForm();
        },

        exportForm: () => {
          const currentForm = get().activeForm;
          if (!currentForm) return '';
          return JSON.stringify(currentForm, null, 2);
        },

        importForm: (jsonString) => {
          try {
            const imported = JSON.parse(jsonString) as MetaLeadForm;
            imported.updatedAt = new Date();
            get().setActiveForm(imported);
          } catch (error) {
            console.error('Failed to import form:', error);
          }
        },

        setPreFormBrief: (brief) => {
          set({ preFormBrief: brief });
        },

        setCurrentView: (view) => {
          set({ currentView: view });
        },

        exportBrief: () => {
          const currentBrief = get().preFormBrief;
          if (!currentBrief) return '';

          // Convert File objects to serializable format
          const exportData = {
            ...currentBrief,
            creativeFile: currentBrief.creativeFile ? {
              name: currentBrief.creativeFile.name,
              size: currentBrief.creativeFile.size,
              type: currentBrief.creativeFile.type,
              // Note: File data would need to be converted to base64 for full export
            } : null,
            // Ensure dates are ISO strings - handle both Date objects and existing strings
            createdAt: currentBrief.createdAt instanceof Date ? currentBrief.createdAt.toISOString() : currentBrief.createdAt,
            updatedAt: currentBrief.updatedAt instanceof Date ? currentBrief.updatedAt.toISOString() : currentBrief.updatedAt,
          };

          return JSON.stringify(exportData, null, 2);
        },

        importBrief: (jsonString) => {
          try {
            const imported = JSON.parse(jsonString);

            // Convert ISO strings back to dates
            imported.createdAt = new Date(imported.createdAt);
            imported.updatedAt = new Date(imported.updatedAt);

            // Set the imported brief
            set({ preFormBrief: imported });

            // Auto-sync to form if brief is complete
            if (imported.isComplete) {
              get().syncBriefToForm();
            }
          } catch (error) {
            console.error('Failed to import campaign brief:', error);
            throw new Error('Invalid campaign brief JSON format');
          }
        },

        // Unified campaign management
        setActiveCampaign: (campaign: MetaCampaign) => {
          set({
            activeCampaign: campaign,
            activeForm: campaign.form,
            preFormBrief: campaign.brief,
            isDirty: false
          });
          get().calculateFrictionScore();
          get().validateForm();
        },

        exportCampaign: () => {
          const currentForm = get().activeForm;
          const currentBrief = get().preFormBrief;

          if (!currentForm || !currentBrief) return '';

          const campaign: MetaCampaign = {
            id: generateId(),
            name: currentForm.name || 'Untitled Campaign',
            version: '1.0.0',
            brief: {
              ...currentBrief,
              createdAt: currentBrief.createdAt,
              updatedAt: currentBrief.updatedAt,
            },
            form: {
              ...currentForm,
              createdAt: currentForm.createdAt,
              updatedAt: currentForm.updatedAt,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Convert dates to ISO strings for serialization
          const exportData = {
            ...campaign,
            brief: {
              ...campaign.brief,
              createdAt: campaign.brief.createdAt.toISOString(),
              updatedAt: campaign.brief.updatedAt.toISOString(),
            },
            form: {
              ...campaign.form,
              createdAt: campaign.form.createdAt instanceof Date ? campaign.form.createdAt.toISOString() : campaign.form.createdAt,
              updatedAt: campaign.form.updatedAt instanceof Date ? campaign.form.updatedAt.toISOString() : campaign.form.updatedAt,
            },
            createdAt: campaign.createdAt.toISOString(),
            updatedAt: campaign.updatedAt.toISOString(),
          };

          return JSON.stringify(exportData, null, 2);
        },

        importCampaign: (jsonString: string) => {
          try {
            const imported = JSON.parse(jsonString) as {
              brief?: PreFormBrief;
              form?: MetaLeadForm;
              [key: string]: unknown;
            };

            // Check if it's a unified campaign or legacy format
            if (imported.brief && imported.form) {
              // Unified campaign format
              const campaign: MetaCampaign = {
                ...imported,
                brief: {
                  ...imported.brief,
                  createdAt: new Date(imported.brief.createdAt),
                  updatedAt: new Date(imported.brief.updatedAt),
                },
                form: {
                  ...imported.form,
                  createdAt: new Date(imported.form.createdAt),
                  updatedAt: new Date(imported.form.updatedAt),
                },
                createdAt: new Date(imported.createdAt),
                updatedAt: new Date(imported.updatedAt),
              };

              get().setActiveCampaign(campaign);
            } else if (imported.clientFacebookPage && imported.campaignObjective) {
              // Legacy brief format
              get().importBrief(jsonString);
            } else {
              // Legacy form format
              get().importForm(jsonString);
            }
          } catch (error) {
            console.error('Failed to import campaign:', error);
            throw new Error('Invalid campaign JSON format');
          }
        },

        syncBriefToForm: () => {
          const brief = get().preFormBrief;
          const currentForm = get().activeForm;

          if (!brief || !currentForm) return;

          // Update form with brief data
          const updatedForm: MetaLeadForm = {
            ...currentForm,
            meta: {
              ...currentForm.meta,
              objective: brief.campaignObjective,
              // Extract industry from campaign objective (simple heuristic)
              industry: brief.campaignObjective.toLowerCase().includes('home') ? 'Home Services' :
                       brief.campaignObjective.toLowerCase().includes('health') ? 'Healthcare' :
                       'General',
            },
            // Update privacy policy URL if available
            privacy: {
              ...currentForm.privacy,
              businessPrivacyUrl: brief.privacyPolicyUrl || currentForm.privacy.businessPrivacyUrl,
            },
            // Update form type based on screening questions preference
            formType: brief.hasScreeningQuestions ? 'higher_intent' : 'more_volume',
            // Generate qualifiers from brief suggestions
            qualifiers: brief.hasScreeningQuestions && brief.screeningQuestionSuggestions ? [
              {
                id: generateId(),
                question: 'When are you looking to start?',
                type: 'multiple_choice' as const,
                options: ['Immediately', '1-3 months', '3+ months'],
                required: true,
                order: 0,
              }
            ] : [],
            updatedAt: new Date(),
          };

          set({ activeForm: updatedForm, isDirty: true });
          get().calculateFrictionScore();
          get().validateForm();
        },

        // Reset store state when app reset is triggered
        reset: () => {
          set({
            activeForm: createDefaultForm(),
            preFormBrief: null,
            activeCampaign: null,
            isDirty: false,
            isLoading: false,
            currentStep: 0,
            previewSteps: [],
            validation: { isValid: true, errors: [], warnings: [] },
            frictionScore: { total: 0, breakdown: { requiredFields: 0, qualifyingQuestions: 0, customConsents: 0 }, level: 'low', recommendations: [] },
            currentView: 'brief',
          });
        }
      }),
      {
        name: 'meta-form-builder-storage',
        partialize: (state) => ({
          activeForm: state.activeForm,
          preFormBrief: state.preFormBrief,
          activeCampaign: state.activeCampaign,
          currentView: state.currentView
        })
      }
    ),
    { name: 'form-store' }
  )
);