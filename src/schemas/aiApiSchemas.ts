/**
 * Zod Runtime Validation Schemas for AI API
 * Ensures type safety at runtime for API requests and responses
 */

import { z } from 'zod';

// ============================================================================
// AI Form Generation Request Schema
// ============================================================================

export const AIFormGenerationRequestSchema = z.object({
  // Required fields
  objective: z.string().min(1, 'Campaign objective is required'),
  industry: z.string().min(1, 'Industry is required'),
  priority: z.enum(['volume', 'quality', 'balanced'], {
    errorMap: () => ({ message: 'Priority must be volume, quality, or balanced' })
  }),
  tone: z.string().min(1, 'Tone is required'),
  audience: z.string().min(1, 'Audience is required'),

  // Optional fields
  monthlyLeadGoal: z.string().optional(),
  formType: z.enum(['more_volume', 'higher_intent', 'rich_creative']).optional(),
  hasScreeningQuestions: z.boolean().optional(),
  screeningQuestionSuggestions: z.string().optional(),
  isHealthRelated: z.boolean().optional(),
  additionalNotes: z.string().optional(),
  facebookPageData: z.object({
    name: z.string(),
    website: z.string().optional(),
    profile_picture: z.string().optional(),
    categories: z.array(z.string()).optional()
  }).optional(),
  responseTime: z.object({
    value: z.string(),
    unit: z.enum(['minutes', 'hours'])
  }).optional()
});

export type AIFormGenerationRequestValidated = z.infer<typeof AIFormGenerationRequestSchema>;

// ============================================================================
// AI Form Generation Response Schema
// ============================================================================

export const AIQuestionSchema = z.object({
  question: z.string().min(1, 'Question text is required'),
  type: z.enum(['multiple_choice', 'short_text', 'dropdown'], {
    errorMap: () => ({ message: 'Question type must be multiple_choice, short_text, or dropdown' })
  }),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  explanation: z.string().optional()
}).refine(
  (data) => {
    // If type is multiple_choice or dropdown, options array must exist and have items
    if (data.type === 'multiple_choice' || data.type === 'dropdown') {
      return Array.isArray(data.options) && data.options.length > 0;
    }
    return true;
  },
  {
    message: 'Questions with type multiple_choice or dropdown must have at least one option',
    path: ['options']
  }
);

export const AIContactFieldSchema = z.object({
  type: z.enum([
    'email',
    'phone',
    'text',
    'first_name',
    'last_name',
    'full_name',
    'street_address',
    'city',
    'state',
    'zip_code'
  ]),
  name: z.string().min(1, 'Field name is required'),
  required: z.boolean(),
  placeholder: z.string(),
  autofill: z.boolean(),
  priority: z.number().int().min(0)
});

export const AIFormGenerationResponseSchema = z.object({
  formName: z.string().min(1, 'Form name is required'),
  intro: z.object({
    headline: z.string().min(1, 'Intro headline is required'),
    description: z.string()
  }),
  questions: z.array(AIQuestionSchema).max(10, 'Maximum 10 questions allowed'),
  contactInfo: z.object({
    description: z.string(),
    recommendedFields: z.array(AIContactFieldSchema)
      .min(1, 'At least one contact field is required')
      .max(10, 'Maximum 10 contact fields allowed')
  }),
  completion: z.object({
    headline: z.string().min(1, 'Completion headline is required'),
    description: z.string()
  }),
  additionalAction: z.object({
    type: z.enum(['website', 'phone']),
    buttonText: z.string().min(1, 'Button text is required'),
    websiteUrl: z.string().url().optional(),
    phoneNumber: z.string().optional()
  }).refine(
    (data) => {
      // If type is website, websiteUrl must be present
      if (data.type === 'website') {
        return !!data.websiteUrl;
      }
      // If type is phone, phoneNumber must be present
      if (data.type === 'phone') {
        return !!data.phoneNumber;
      }
      return true;
    },
    {
      message: 'Website actions require websiteUrl, phone actions require phoneNumber',
      path: ['websiteUrl', 'phoneNumber']
    }
  ),
  rationale: z.string().optional()
});

export type AIFormGenerationResponseValidated = z.infer<typeof AIFormGenerationResponseSchema>;

// ============================================================================
// AI Health Check Response Schema
// ============================================================================

export const AIHealthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'down']),
  service: z.string(),
  timestamp: z.string()
});

export type AIHealthCheckResponseValidated = z.infer<typeof AIHealthCheckResponseSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates AI form generation request data
 * @throws {z.ZodError} if validation fails
 */
export function validateAIFormRequest(data: unknown): AIFormGenerationRequestValidated {
  return AIFormGenerationRequestSchema.parse(data);
}

/**
 * Safely validates AI form generation request with error details
 */
export function safeValidateAIFormRequest(data: unknown): {
  success: boolean;
  data?: AIFormGenerationRequestValidated;
  errors?: z.ZodIssue[];
} {
  const result = AIFormGenerationRequestSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues
  };
}

/**
 * Validates AI form generation response data
 * @throws {z.ZodError} if validation fails
 */
export function validateAIFormResponse(data: unknown): AIFormGenerationResponseValidated {
  return AIFormGenerationResponseSchema.parse(data);
}

/**
 * Safely validates AI form generation response with error details
 */
export function safeValidateAIFormResponse(data: unknown): {
  success: boolean;
  data?: AIFormGenerationResponseValidated;
  errors?: z.ZodIssue[];
} {
  const result = AIFormGenerationResponseSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues
  };
}

/**
 * Validates AI health check response
 * @throws {z.ZodError} if validation fails
 */
export function validateAIHealthResponse(data: unknown): AIHealthCheckResponseValidated {
  return AIHealthCheckResponseSchema.parse(data);
}

/**
 * Formats Zod validation errors for user display
 */
export function formatValidationErrors(errors: z.ZodIssue[]): string {
  return errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join('; ');
}
