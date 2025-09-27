// Meta Lead Form Type Definitions
export type FormType = 'more_volume' | 'higher_intent' | 'rich_creative';

export type QuestionType =
  | 'multiple_choice'
  | 'short_text'
  | 'conditional'
  | 'appointment_request'
  | 'dropdown';

export type ContactFieldType =
  | 'email'
  | 'phone'
  | 'text'
  | 'first_name'
  | 'last_name'
  | 'full_name'
  | 'street_address'
  | 'city'
  | 'state'
  | 'zip_code';

export type ActionType = 'website' | 'phone' | 'whatsapp' | 'download';

export interface MetaInfo {
  objective: string;
  industry: string;
  priority: 'volume' | 'quality' | 'balanced';
  tone: string;
  audience: string;
}

export interface FormIntro {
  headline: string;
  description: string;
}

export interface ContactField {
  id: string;
  name: string;
  type: ContactFieldType;
  required: boolean;
  placeholder: string;
  autofill: boolean;
  order: number;
}

export interface ConditionalRule {
  ifQuestion: string;
  ifAnswer: string;
  showQuestions: string[];
}

export interface Qualifier {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  conditional?: ConditionalRule;
  allowMultipleResponses?: boolean;
  confirmationMessage?: string;
  showConfirmationMessage?: boolean;
}

export interface Consent {
  id: string;
  label: string;
  optional: boolean;
}

export interface CustomNotices {
  title: string;
  disclaimerText: string;
  consents: Consent[];
}

export interface Privacy {
  businessPrivacyUrl: string;
  customNotices: CustomNotices;
}

export interface ThankYouAction {
  type: ActionType;
  label: string;
  websiteUrl?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  downloadUrl?: string;
}

export interface ThankYou {
  headline: string;
  description: string;
  action: ThankYouAction;
}

export interface MetaLeadForm {
  id: string;
  name: string;
  meta: MetaInfo;
  formType: FormType;
  intro: FormIntro;
  contactDescription: string;
  contactFields: ContactField[];
  qualifiers: Qualifier[];
  privacy: Privacy;
  thankYou: ThankYou;
  createdAt: Date;
  updatedAt: Date;
}

export interface FrictionScore {
  total: number;
  breakdown: {
    requiredFields: number;
    qualifyingQuestions: number;
    customConsents: number;
  };
  level: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface FormValidation {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
}

// UI State Types
export interface DragItem {
  id: string;
  type: 'qualifier' | 'contact_field';
  index: number;
}

export interface PreviewStep {
  id: string;
  title: string;
  component: 'intro' | 'questions' | 'contact' | 'privacy' | 'review' | 'thankyou';
}

export interface FacebookPageData {
  page_id: string;
  name: string;
  profile_picture: string;
  cover_image?: string;
  categories?: string[];
  intro?: string;
  instagram_url?: string;
  verified?: boolean;
  website?: string;
}

export interface PreFormBrief {
  id: string;
  clientFacebookPage: string;
  facebookPageData?: FacebookPageData | null; // Fetched Facebook page data
  industry?: string; // Industry/Vertical selection
  campaignObjective: string;
  creativeFile?: {
    name: string;
    size: number;
    type: string;
    data?: string; // base64 for export/import
  } | null;
  monthlyLeadGoal: string;
  formType: FormType; // Form optimization strategy
  hasAdminAccess: 'yes' | 'no' | 'pending';
  leadEmailAddresses: string;
  isHealthRelated: boolean;
  hasScreeningQuestions: boolean;
  screeningQuestionSuggestions: string;
  responseTime: {
    value: string;
    unit: 'minutes' | 'hours';
  };
  hasPrivacyPolicy: 'yes' | 'no' | 'not_sure';
  privacyPolicyUrl: string;
  clientWebsiteUrl?: string; // Added for tracking website URL
  additionalNotes: string;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Unified Campaign and Form data structure
export interface MetaCampaign {
  id: string;
  name: string;
  // Campaign Brief Data
  brief: PreFormBrief;
  // Form Builder Data
  form: MetaLeadForm;
  // Campaign metadata
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

// Unified JSON Schema for Meta Campaign (Brief + Form)
export const MetaCampaignSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Meta Lead Form Campaign",
  type: "object",
  required: ["id", "name", "brief", "form", "version", "createdAt", "updatedAt"],
  properties: {
    id: {
      type: "string",
      description: "Unique identifier for the campaign"
    },
    name: {
      type: "string",
      description: "Campaign name"
    },
    version: {
      type: "string",
      description: "Schema version for compatibility"
    },
    brief: {
      type: "object",
      required: [
        "id",
        "clientFacebookPage",
        "campaignObjective",
        "monthlyLeadGoal",
        "hasAdminAccess",
        "responseTime",
        "hasPrivacyPolicy",
        "isComplete"
      ],
      properties: {
        id: { type: "string" },
        clientFacebookPage: {
          type: "string",
          format: "uri",
          pattern: "^https://(?:www\\.)?facebook\\.com/"
        },
        campaignObjective: {
          type: "string",
          minLength: 10,
          maxLength: 500
        },
        creativeFile: {
          type: ["object", "null"],
          properties: {
            name: { type: "string" },
            size: { type: "number" },
            type: { type: "string" },
            data: { type: "string" }
          }
        },
        monthlyLeadGoal: {
          type: "string",
          pattern: "^[1-9]\\d*$"
        },
        hasAdminAccess: {
          type: "string",
          enum: ["yes", "no", "pending"]
        },
        leadEmailAddresses: { type: "string" },
        isHealthRelated: { type: "boolean" },
        hasScreeningQuestions: { type: "boolean" },
        screeningQuestionSuggestions: { type: "string" },
        responseTime: {
          type: "object",
          required: ["value", "unit"],
          properties: {
            value: { type: "string", pattern: "^[1-9]\\d*(\\.\\d+)?$" },
            unit: { type: "string", enum: ["minutes", "hours"] }
          }
        },
        hasPrivacyPolicy: {
          type: "string",
          enum: ["yes", "no", "not_sure"]
        },
        privacyPolicyUrl: { type: "string", format: "uri" },
        clientWebsiteUrl: { type: "string", format: "uri" },
        additionalNotes: { type: "string", maxLength: 1000 },
        isComplete: { type: "boolean" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" }
      }
    },
    form: {
      type: "object",
      required: ["id", "name", "meta", "formType", "intro", "contactFields", "qualifiers", "privacy", "thankYou"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        meta: {
          type: "object",
          properties: {
            objective: { type: "string" },
            industry: { type: "string" },
            priority: { type: "string", enum: ["volume", "quality", "balanced"] },
            tone: { type: "string" },
            audience: { type: "string" }
          }
        },
        formType: {
          type: "string",
          enum: ["more_volume", "higher_intent", "rich_creative"]
        },
        intro: {
          type: "object",
          properties: {
            headline: { type: "string" },
            description: { type: "string" }
          }
        },
        contactDescription: { type: "string" },
        contactFields: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              type: { type: "string" },
              required: { type: "boolean" },
              placeholder: { type: "string" },
              autofill: { type: "boolean" },
              order: { type: "number" }
            }
          }
        },
        qualifiers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              question: { type: "string" },
              type: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              required: { type: "boolean" },
              order: { type: "number" }
            }
          }
        },
        privacy: {
          type: "object",
          properties: {
            businessPrivacyUrl: { type: "string" },
            customNotices: {
              type: "object",
              properties: {
                title: { type: "string" },
                disclaimerText: { type: "string" },
                consents: { type: "array" }
              }
            }
          }
        },
        thankYou: {
          type: "object",
          properties: {
            headline: { type: "string" },
            description: { type: "string" },
            action: {
              type: "object",
              properties: {
                type: { type: "string" },
                label: { type: "string" },
                websiteUrl: { type: "string" },
                phoneNumber: { type: "string" }
              }
            }
          }
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" }
      }
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  }
};

export interface BuilderState {
  activeForm: MetaLeadForm | null;
  preFormBrief: PreFormBrief | null;
  activeCampaign: MetaCampaign | null;
  isDirty: boolean;
  isLoading: boolean;
  currentStep: number;
  previewSteps: PreviewStep[];
  validation: FormValidation;
  frictionScore: FrictionScore;
  currentView: 'brief' | 'builder' | 'review';
}

// Export types for form builder UI
export interface FormBuilderProps {
  form: MetaLeadForm;
  onChange: (form: MetaLeadForm) => void;
  onValidation: (validation: FormValidation) => void;
}

export interface PreviewProps {
  form: MetaLeadForm;
  currentStep: number;
  onStepChange: (step: number) => void;
}