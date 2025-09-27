import { createMachine, assign } from 'xstate';
import type { MetaLeadForm, PreFormBrief } from './validation';
import { safeValidate } from './validation';

/**
 * XState machine for managing form builder flow with guarded steps
 * Ensures proper validation and state transitions
 */

interface FormBuilderContext {
  preFormBrief: PreFormBrief | null;
  activeForm: MetaLeadForm | null;
  error: string | null;
  validationErrors: string[];
  aiEnabled: boolean;
}

type FormBuilderEvent =
  | { type: 'START_BRIEF' }
  | { type: 'COMPLETE_BRIEF'; brief: PreFormBrief }
  | { type: 'ENABLE_AI' }
  | { type: 'DISABLE_AI' }
  | { type: 'GENERATE_FORM'; form: MetaLeadForm }
  | { type: 'EDIT_FORM' }
  | { type: 'VALIDATE_FORM' }
  | { type: 'PREVIEW_FORM' }
  | { type: 'EXPORT_FORM' }
  | { type: 'RESET' }
  | { type: 'RETRY' };

export const formBuilderMachine = createMachine<FormBuilderContext, FormBuilderEvent>({
  id: 'formBuilder',
  initial: 'briefing',
  context: {
    preFormBrief: null,
    activeForm: null,
    error: null,
    validationErrors: [],
    aiEnabled: false,
  },
  states: {
    briefing: {
      on: {
        COMPLETE_BRIEF: {
          target: 'briefCompleted',
          actions: assign({
            preFormBrief: (_, event) => event.brief,
            error: null,
            validationErrors: [],
          }),
          cond: 'isValidBrief',
        },
        ENABLE_AI: {
          actions: assign({ aiEnabled: true }),
        },
        DISABLE_AI: {
          actions: assign({ aiEnabled: false }),
        },
      },
    },
    briefCompleted: {
      always: [
        { target: 'aiGeneration', cond: 'shouldUseAI' },
        { target: 'manualBuilding', cond: 'shouldBuildManually' },
      ],
    },
    aiGeneration: {
      invoke: {
        id: 'generateForm',
        src: 'generateFormWithAI',
        onDone: {
          target: 'building',
          actions: assign({
            activeForm: (_, event) => event.data,
            error: null,
          }),
        },
        onError: {
          target: 'generationFailed',
          actions: assign({
            error: (_, event) => `AI generation failed: ${event.data}`,
          }),
        },
      },
    },
    manualBuilding: {
      on: {
        GENERATE_FORM: {
          target: 'building',
          actions: assign({
            activeForm: (_, event) => event.form,
            error: null,
          }),
          cond: 'isValidForm',
        },
      },
    },
    building: {
      on: {
        VALIDATE_FORM: {
          target: 'validating',
        },
        PREVIEW_FORM: {
          target: 'previewing',
          cond: 'canPreview',
        },
        EDIT_FORM: {
          target: 'building',
          actions: assign({
            error: null,
            validationErrors: [],
          }),
        },
      },
    },
    validating: {
      invoke: {
        id: 'validateForm',
        src: 'validateFormData',
        onDone: [
          {
            target: 'validated',
            cond: (_, event) => event.data.isValid,
            actions: assign({
              validationErrors: [],
              error: null,
            }),
          },
          {
            target: 'building',
            actions: assign({
              validationErrors: (_, event) => event.data.errors,
              error: 'Form validation failed. Please fix the errors.',
            }),
          },
        ],
        onError: {
          target: 'building',
          actions: assign({
            error: 'Validation process failed.',
          }),
        },
      },
    },
    validated: {
      on: {
        PREVIEW_FORM: 'previewing',
        EXPORT_FORM: 'exporting',
        EDIT_FORM: 'building',
      },
    },
    previewing: {
      on: {
        EDIT_FORM: 'building',
        EXPORT_FORM: 'exporting',
        VALIDATE_FORM: 'validating',
      },
    },
    exporting: {
      invoke: {
        id: 'exportForm',
        src: 'exportFormData',
        onDone: {
          target: 'exported',
        },
        onError: {
          target: 'previewing',
          actions: assign({
            error: 'Export failed. Please try again.',
          }),
        },
      },
    },
    exported: {
      on: {
        RESET: 'briefing',
        EDIT_FORM: 'building',
      },
    },
    generationFailed: {
      on: {
        RETRY: 'aiGeneration',
        EDIT_FORM: 'manualBuilding',
        RESET: 'briefing',
      },
    },
  },
  on: {
    RESET: {
      target: 'briefing',
      actions: assign({
        preFormBrief: null,
        activeForm: null,
        error: null,
        validationErrors: [],
        aiEnabled: false,
      }),
    },
  },
}, {
  guards: {
    isValidBrief: (_, event) => {
      if (event.type !== 'COMPLETE_BRIEF') return false;
      const result = safeValidate.brief(event.brief);
      return result.success;
    },

    isValidForm: (_, event) => {
      if (event.type !== 'GENERATE_FORM') return false;
      const result = safeValidate.form(event.form);
      return result.success;
    },

    shouldUseAI: (context) => {
      return context.aiEnabled && context.preFormBrief?.useAIGeneration === true;
    },

    shouldBuildManually: (context) => {
      return !context.aiEnabled || context.preFormBrief?.useAIGeneration !== true;
    },

    canPreview: (context) => {
      return context.activeForm !== null;
    },
  },
  services: {
    generateFormWithAI: async (context) => {
      // This would integrate with your AI form generation service
      if (!context.preFormBrief) {
        throw new Error('Brief is required for AI generation');
      }

      // Placeholder for AI generation
      // In real implementation, this would call aiFormGenerator.generateForm()
      throw new Error('AI generation not implemented yet');
    },

    validateFormData: async (context) => {
      if (!context.activeForm) {
        return { isValid: false, errors: ['No form to validate'] };
      }

      const result = safeValidate.form(context.activeForm);
      if (result.success) {
        return { isValid: true, errors: [] };
      } else {
        return {
          isValid: false,
          errors: result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        };
      }
    },

    exportFormData: async (context) => {
      if (!context.activeForm || !context.preFormBrief) {
        throw new Error('Both form and brief are required for export');
      }

      // This would integrate with your export service
      return {
        brief: context.preFormBrief,
        form: context.activeForm,
        exportedAt: new Date(),
      };
    },
  },
});