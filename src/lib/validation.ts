import { z } from 'zod';

/**
 * Zod validation schemas for type-safe data validation
 * These schemas validate payloads going in/out of cache and DB
 */

// Base field validation
// Base draggable item interface for consistent drag/drop behavior
const DraggableItemSchema = z.object({
  id: z.string(),
  order: z.number().int().min(0),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

// Enhanced contact field with drag/drop support
export const ContactFieldSchema = DraggableItemSchema.extend({
  name: z.string().min(1, 'Field name is required').max(50, 'Field name too long'),
  type: z.enum(['email', 'phone', 'first_name', 'last_name', 'company', 'city', 'state', 'country', 'zip_code', 'custom']),
  required: z.boolean(),
  label: z.string().max(100, 'Label too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  placeholder: z.string().max(100, 'Placeholder too long').optional(),
  validation: z.object({
    min_length: z.number().int().min(0).optional(),
    max_length: z.number().int().min(1).optional(),
    pattern: z.string().optional(),
    custom_error_message: z.string().max(200).optional(),
  }).optional(),
  meta: z.object({
    autofill: z.boolean().default(false),
    width: z.enum(['full', 'half', 'third']).default('full'),
    conditional_logic: z.object({
      depends_on: z.string().optional(),
      show_when: z.enum(['equals', 'not_equals', 'contains']).optional(),
      value: z.string().optional(),
    }).optional(),
  }).optional(),
});

// Enhanced qualifier with drag/drop and nested logic support
export const QualifierSchema = DraggableItemSchema.extend({
  question: z.string().min(1, 'Question is required').max(200, 'Question too long'),
  type: z.enum(['multiple_choice', 'short_answer', 'store_locator', 'conditional', 'appointment']),
  required: z.boolean(),
  options: z.array(z.object({
    id: z.string(),
    label: z.string().min(1).max(100),
    value: z.string(),
    order: z.number().int().min(0),
    conditional_logic: z.object({
      action: z.enum(['show', 'hide', 'require']),
      target_fields: z.array(z.string()),
    }).optional(),
  })).optional(),
  validation: z.object({
    min_selections: z.number().int().min(0).optional(),
    max_selections: z.number().int().min(1).optional(),
    allow_other: z.boolean().default(false),
    other_placeholder: z.string().max(100).optional(),
  }).optional(),
  ui_config: z.object({
    layout: z.enum(['vertical', 'horizontal', 'grid']).default('vertical'),
    columns: z.number().int().min(1).max(4).optional(),
    show_confirmation: z.boolean().default(false),
    confirmation_message: z.string().max(300).optional(),
  }).optional(),
  conditional: z.object({
    depends_on: z.string(),
    show_when: z.enum(['equals', 'not_equals', 'contains', 'any', 'none']),
    values: z.array(z.string()),
  }).optional(),
});

export const ThankYouSchema = z.object({
  headline: z.string().min(1, 'Headline is required'),
  description: z.string().min(1, 'Description is required'),
  action: z.object({
    type: z.enum(['website', 'phone']),
    url: z.string().url().optional(),
    buttonText: z.string().optional(),
    phoneNumber: z.string().optional(),
  })
});

// Enhanced form schema with canonical design and full drag/drop support
export const MetaLeadFormSchema = z.object({
  id: z.string().uuid('Invalid form ID format'),
  name: z.string().min(1, 'Form name is required').max(100, 'Form name too long'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').optional(),

  // Form sections with enhanced validation
  intro: z.object({
    headline: z.string().min(1, 'Intro headline is required').max(60, 'Headline too long for Meta'),
    description: z.string().min(1, 'Intro description is required').max(500, 'Description too long'),
    media: z.object({
      type: z.enum(['none', 'image', 'video']).default('none'),
      url: z.string().url().optional(),
      alt_text: z.string().max(200).optional(),
    }).optional(),
  }),

  // Ordered arrays with enhanced validation
  sections: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['contact_fields', 'qualifiers', 'custom_section']),
    title: z.string().max(100).optional(),
    description: z.string().max(300).optional(),
    order: z.number().int().min(0),
    collapsible: z.boolean().default(false),
    required_completion: z.boolean().default(true),
  })),

  contactFields: z.array(ContactFieldSchema)
    .min(1, 'At least one contact field is required')
    .max(10, 'Maximum 10 contact fields allowed')
    .refine(
      (fields) => fields.some(f => f.type === 'email'),
      'At least one email field is required'
    ),

  qualifiers: z.array(QualifierSchema)
    .max(5, 'Maximum 5 qualifying questions allowed'),

  privacy: z.object({
    policy_url: z.string().url().optional(),
    custom_notices: z.object({
      title: z.string().max(100).default('Terms and Conditions'),
      description: z.string().max(1000).optional(),
      consents: z.array(z.object({
        id: z.string().uuid(),
        label: z.string().min(1, 'Consent label is required').max(300),
        required: z.boolean(),
        is_custom: z.boolean().default(true),
        order: z.number().int().min(0),
        legal_basis: z.enum(['consent', 'legitimate_interest', 'contract']).default('consent'),
      })).max(4, 'Maximum 4 custom consents allowed')
    })
  }),

  thankYou: ThankYouSchema,

  // Enhanced metadata with analytics
  meta: z.object({
    objective: z.string().max(200),
    industry: z.string().max(100),
    form_type: z.enum(['more_volume', 'higher_intent']),
    friction_score: z.number().min(0).max(10),
    estimated_completion_time: z.number().int().min(30).max(600), // seconds
    target_audience: z.array(z.string()).optional(),
    keywords: z.array(z.string().max(50)).optional(),
    analytics: z.object({
      conversion_goals: z.array(z.string()),
      tracking_pixels: z.array(z.object({
        provider: z.string(),
        pixel_id: z.string(),
        events: z.array(z.string()),
      })),
    }).optional(),
  }),

  // Production database fields
  status: z.enum(['draft', 'published', 'archived', 'deleted']).default('draft'),
  schema_version: z.string().regex(/^\d+\.\d+$/).default('1.0'),
  revision: z.number().int().min(1).default(1),
  parent_form_id: z.string().uuid().optional(), // For A/B testing
  tags: z.array(z.string().max(30)).max(10).default([]),

  // Access control
  visibility: z.enum(['private', 'team', 'public']).default('private'),
  team_permissions: z.array(z.object({
    user_id: z.string().uuid(),
    role: z.enum(['viewer', 'editor', 'admin']),
    granted_at: z.date(),
  })).optional(),

  // Timestamps with timezone support
  created_at: z.date(),
  updated_at: z.date(),
  published_at: z.date().optional(),
  archived_at: z.date().optional(),
});

export const PreFormBriefSchema = z.object({
  // Campaign details
  campaignObjective: z.string().min(1, 'Campaign objective is required'),
  industry: z.string().min(1, 'Industry is required'),
  formType: z.enum(['more_volume', 'higher_intent']),

  // Form configuration
  isHealthRelated: z.boolean(),
  hasScreeningQuestions: z.boolean(),

  // AI generation flags
  useAIGeneration: z.boolean().optional(),
  isComplete: z.boolean().optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Campaign export/import validation
export const MetaCampaignSchema = z.object({
  brief: PreFormBriefSchema,
  form: MetaLeadFormSchema,
  version: z.string().default('1.0'),
  exportedAt: z.date(),
});

// API Response validation
export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.union([
    MetaLeadFormSchema,
    PreFormBriefSchema,
    MetaCampaignSchema,
    z.array(MetaLeadFormSchema),
    z.array(PreFormBriefSchema),
    z.string(),
    z.null()
  ]).optional(),
  error: z.string().optional(),
  timestamp: z.date().optional(),
});

// Storage item validation
export const CacheItemSchema = z.object({
  data: z.union([
    MetaLeadFormSchema,
    PreFormBriefSchema,
    MetaCampaignSchema,
    z.array(MetaLeadFormSchema),
    z.array(PreFormBriefSchema),
    z.string(),
    z.number(),
    z.boolean(),
    z.null()
  ]),
  timestamp: z.number(),
  ttl: z.number(),
});

/**
 * Validation utility functions
 */
export const validate = {
  contactField: (data: unknown) => ContactFieldSchema.parse(data),
  qualifier: (data: unknown) => QualifierSchema.parse(data),
  form: (data: unknown) => MetaLeadFormSchema.parse(data),
  brief: (data: unknown) => PreFormBriefSchema.parse(data),
  campaign: (data: unknown) => MetaCampaignSchema.parse(data),
  apiResponse: (data: unknown) => APIResponseSchema.parse(data),
  cacheItem: (data: unknown) => CacheItemSchema.parse(data),
};

/**
 * Safe validation that returns results instead of throwing
 */
export const safeValidate = {
  contactField: (data: unknown) => ContactFieldSchema.safeParse(data),
  qualifier: (data: unknown) => QualifierSchema.safeParse(data),
  form: (data: unknown) => MetaLeadFormSchema.safeParse(data),
  brief: (data: unknown) => PreFormBriefSchema.safeParse(data),
  campaign: (data: unknown) => MetaCampaignSchema.safeParse(data),
  apiResponse: (data: unknown) => APIResponseSchema.safeParse(data),
  cacheItem: (data: unknown) => CacheItemSchema.safeParse(data),
};

// Drag and drop operation schemas
export const DragOperationSchema = z.object({
  action: z.enum(['move', 'copy', 'delete']),
  source: z.object({
    type: z.enum(['contact_field', 'qualifier', 'consent']),
    id: z.string().uuid(),
    index: z.number().int().min(0),
    section_id: z.string().uuid().optional(),
  }),
  target: z.object({
    index: z.number().int().min(0),
    section_id: z.string().uuid().optional(),
  }),
  timestamp: z.date(),
  user_id: z.string().uuid().optional(),
})

// Bulk operation schema for batch updates
export const BulkOperationSchema = z.object({
  operation: z.enum(['reorder', 'update_multiple', 'delete_multiple']),
  items: z.array(z.object({
    id: z.string().uuid(),
    updates: z.record(z.unknown()).optional(),
    new_order: z.number().int().min(0).optional(),
  })),
  timestamp: z.date(),
  user_id: z.string().uuid().optional(),
})

// Export types derived from schemas
export type DraggableItem = z.infer<typeof DraggableItemSchema>;
export type ContactField = z.infer<typeof ContactFieldSchema>;
export type Qualifier = z.infer<typeof QualifierSchema>;
export type MetaLeadForm = z.infer<typeof MetaLeadFormSchema>;
export type PreFormBrief = z.infer<typeof PreFormBriefSchema>;
export type MetaCampaign = z.infer<typeof MetaCampaignSchema>;
export type APIResponse = z.infer<typeof APIResponseSchema>;
export type CacheItem = z.infer<typeof CacheItemSchema>;
export type DragOperation = z.infer<typeof DragOperationSchema>;
export type BulkOperation = z.infer<typeof BulkOperationSchema>;