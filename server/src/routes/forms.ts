import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../services/database.js'
import { generateUniqueSlug } from '../utils/slugify.js'
import crypto from 'crypto'

// Idempotency key tracking
const idempotencyKeys = new Map<string, { result: any; timestamp: Date }>()
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000 // 24 hours

// ETag generation utility
function generateETag(data: any): string {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify(data))
    .digest('hex')
    .substring(0, 16)
}

// Middleware for idempotency key handling
function handleIdempotency(req: any, res: any, next: any) {
  const idempotencyKey = req.headers['idempotency-key']

  if (idempotencyKey) {
    // Clean up expired keys
    const now = new Date()
    for (const [key, value] of idempotencyKeys.entries()) {
      if (now.getTime() - value.timestamp.getTime() > IDEMPOTENCY_TTL) {
        idempotencyKeys.delete(key)
      }
    }

    // Check if key already exists
    const existing = idempotencyKeys.get(idempotencyKey)
    if (existing) {
      return res.status(422).json({
        error: 'Idempotency key already used',
        details: 'This request has already been processed',
        original_result: existing.result
      })
    }

    // Store the key for this request
    req.idempotencyKey = idempotencyKey
  }

  next()
}

// Middleware for ETag handling
function handleETags(req: any, res: any, next: any) {
  const ifNoneMatch = req.headers['if-none-match']
  const ifMatch = req.headers['if-match']

  req.etag = {
    ifNoneMatch,
    ifMatch
  }

  next()
}

const router = Router()

// Contact field schema
const ContactFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['email', 'phone', 'first_name', 'last_name', 'company', 'city', 'state', 'country', 'zip_code', 'custom']),
  required: z.boolean(),
  order: z.number(),
  label: z.string().optional(),
  description: z.string().optional(),
})

// Qualifier schema
const QualifierSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(['multiple_choice', 'short_answer', 'store_locator', 'conditional', 'appointment']),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  order: z.number(),
  conditional: z.object({
    ifAnswer: z.string(),
    showQuestions: z.array(z.string())
  }).optional(),
  allowMultipleResponses: z.boolean().optional(),
  confirmationMessage: z.string().optional(),
  showConfirmationMessage: z.boolean().optional(),
})

// Full form spec schema
const FormSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  intro: z.object({
    headline: z.string(),
    description: z.string(),
  }),
  contactFields: z.array(ContactFieldSchema),
  qualifiers: z.array(QualifierSchema),
  privacy: z.object({
    customNotices: z.object({
      consents: z.array(z.object({
        id: z.string(),
        label: z.string(),
        required: z.boolean(),
        isCustom: z.boolean().optional(),
      }))
    })
  }),
  thankYou: z.object({
    headline: z.string(),
    description: z.string(),
    action: z.object({
      type: z.enum(['website', 'phone']),
      url: z.string().optional(),
      buttonText: z.string().optional(),
      phoneNumber: z.string().optional(),
    })
  }),
  meta: z.object({
    objective: z.string(),
    industry: z.string(),
    formType: z.enum(['more_volume', 'higher_intent']),
    frictionScore: z.number(),
  }),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  schema_version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Meta preview schema for Facebook API payload
const MetaPreviewSchema = z.object({
  name: z.string(),
  privacy_policy_url: z.string().optional(),
  contextual_content: z.array(z.object({
    content_type: z.string(),
    content: z.string()
  })),
  questions: z.array(z.object({
    type: z.string(),
    key: z.string().optional(),
    label: z.string().optional(),
    input_type: z.string().optional(),
  }))
}).optional()

// Schema for form creation/update
const FormCreateSchema = z.object({
  page_id: z.string().min(1),
  form_name: z.string().min(1),
  spec_json: FormSpecSchema,
  meta_preview: MetaPreviewSchema,
  created_by: z.string().optional()
})

const FormUpdateSchema = z.object({
  form_name: z.string().min(1).optional(),
  spec_json: FormSpecSchema.optional(),
  meta_preview: MetaPreviewSchema
})

/**
 * GET /api/forms?query={page_id_or_username}
 * Used to populate the "existing forms" modal
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query.query as string

    if (!query) {
      return res.status(400).json({
        error: 'Query parameter required'
      })
    }

    // Try to find page by ID first, then by username
    let page
    const { data: pageById } = await supabase
      .from('pages')
      .select('*')
      .eq('id', query)
      .single()

    if (pageById) {
      page = pageById
    } else {
      // Try by username
      const { data: pageByUsername } = await supabase
        .from('pages')
        .select('*')
        .eq('username', query)
        .single()

      if (pageByUsername) {
        page = pageByUsername
      }
    }

    if (!page) {
      return res.status(404).json({
        error: 'Page not found'
      })
    }

    // Get forms for this page
    const { data: forms, error } = await supabase
      .from('forms')
      .select('form_id, form_name, form_slug, version, updated_at')
      .eq('page_id', page.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({
        error: 'Database error',
        details: error.message
      })
    }

    return res.json({
      page: {
        page_id: page.id,
        username: page.username,
        name: page.name,
        profile_picture: page.profile_picture
      },
      forms: forms || []
    })

  } catch (error) {
    console.error('Forms list error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
})

/**
 * POST /api/forms
 * Upsert behavior: if (page_id, form_name) exists → update spec_json, bump version, return same slug
 */
router.post('/', async (req, res) => {
  try {
    const body = FormCreateSchema.parse(req.body)

    // Check if form with this name already exists for this page
    const { data: existingForm } = await supabase
      .from('forms')
      .select('form_id, form_slug, version')
      .eq('page_id', body.page_id)
      .eq('form_name', body.form_name)
      .single()

    if (existingForm) {
      // Update existing form
      const { data, error } = await supabase
        .from('forms')
        .update({
          spec_json: body.spec_json,
          meta_preview: body.meta_preview,
          version: existingForm.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('form_id', existingForm.form_id)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return res.status(500).json({
          error: 'Database error',
          details: error.message
        })
      }

      const result = {
        form_id: data.form_id,
        page_id: data.page_id,
        form_name: data.form_name,
        form_slug: data.form_slug,
        version: data.version
      }

      // Store idempotency result
      if (req.idempotencyKey) {
        idempotencyKeys.set(req.idempotencyKey, {
          result,
          timestamp: new Date()
        })
      }

      // Generate ETag
      const etag = generateETag(result)
      res.set('ETag', `"${etag}"`)

      return res.json(result)
    } else {
      // Create new form
      const formSlug = await generateUniqueSlug(body.page_id, body.form_name)

      const { data, error } = await supabase
        .from('forms')
        .insert({
          page_id: body.page_id,
          form_name: body.form_name,
          form_slug: formSlug,
          spec_json: body.spec_json,
          meta_preview: body.meta_preview,
          created_by: body.created_by
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return res.status(500).json({
          error: 'Database error',
          details: error.message
        })
      }

      const result = {
        form_id: data.form_id,
        page_id: data.page_id,
        form_name: data.form_name,
        form_slug: data.form_slug,
        version: data.version
      }

      // Store idempotency result
      if (req.idempotencyKey) {
        idempotencyKeys.set(req.idempotencyKey, {
          result,
          timestamp: new Date()
        })
      }

      // Generate ETag
      const etag = generateETag(result)
      res.set('ETag', `"${etag}"`)

      return res.json(result)
    }

  } catch (error) {
    console.error('Form create error:', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      })
    }

    return res.status(500).json({
      error: 'Internal server error'
    })
  }
})

/**
 * GET /api/forms/:pageKey/:formSlug
 * :pageKey accepts either numeric page_id or username
 */
router.get('/:pageKey/:formSlug', async (req, res) => {
  try {
    const { pageKey, formSlug } = req.params

    // Resolve page by ID or username
    let page
    const { data: pageById } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageKey)
      .single()

    if (pageById) {
      page = pageById
    } else {
      // Try by username
      const { data: pageByUsername } = await supabase
        .from('pages')
        .select('*')
        .eq('username', pageKey)
        .single()

      if (pageByUsername) {
        page = pageByUsername
      }
    }

    if (!page) {
      return res.status(404).json({
        error: 'Page not found'
      })
    }

    // Get the form
    const { data: form, error } = await supabase
      .from('forms')
      .select('*')
      .eq('page_id', page.id)
      .eq('form_slug', formSlug)
      .single()

    if (error || !form) {
      return res.status(404).json({
        error: 'Form not found'
      })
    }

    return res.json({
      page: {
        page_id: page.id,
        username: page.username,
        name: page.name,
        profile_picture: page.profile_picture
      },
      form: {
        form_id: form.form_id,
        form_name: form.form_name,
        form_slug: form.form_slug,
        spec_json: form.spec_json,
        meta_preview: form.meta_preview,
        version: form.version,
        created_at: form.created_at,
        updated_at: form.updated_at
      }
    })

  } catch (error) {
    console.error('Form get error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
})

/**
 * PUT /api/forms/:form_id
 * If form_name changes → regenerate slug with conflict suffix rules
 */
router.put('/:form_id', async (req, res) => {
  try {
    const { form_id } = req.params
    const body = FormUpdateSchema.parse(req.body)

    // Get existing form
    const { data: existingForm } = await supabase
      .from('forms')
      .select('*')
      .eq('form_id', form_id)
      .single()

    if (!existingForm) {
      return res.status(404).json({
        error: 'Form not found'
      })
    }

    let newSlug = existingForm.form_slug

    // If form name is changing, generate new slug
    if (body.form_name && body.form_name !== existingForm.form_name) {
      newSlug = await generateUniqueSlug(
        existingForm.page_id,
        body.form_name,
        form_id
      )
    }

    const { data, error } = await supabase
      .from('forms')
      .update({
        form_name: body.form_name || existingForm.form_name,
        form_slug: newSlug,
        spec_json: body.spec_json || existingForm.spec_json,
        meta_preview: body.meta_preview !== undefined ? body.meta_preview : existingForm.meta_preview,
        version: existingForm.version + 1,
        updated_at: new Date().toISOString()
      })
      .eq('form_id', form_id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({
        error: 'Database error',
        details: error.message
      })
    }

    return res.json({
      form_id: data.form_id,
      page_id: data.page_id,
      form_name: data.form_name,
      form_slug: data.form_slug,
      version: data.version
    })

  } catch (error) {
    console.error('Form update error:', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      })
    }

    return res.status(500).json({
      error: 'Internal server error'
    })
  }
})

/**
 * GET /api/forms/:form_id/export
 */
router.get('/:form_id/export', async (req, res) => {
  try {
    const { form_id } = req.params

    const { data: form, error } = await supabase
      .from('forms')
      .select('form_name, spec_json, meta_preview')
      .eq('form_id', form_id)
      .single()

    if (error || !form) {
      return res.status(404).json({
        error: 'Form not found'
      })
    }

    return res.json({
      spec_json: form.spec_json,
      meta_payload_json: form.meta_preview,
      form_name: form.form_name,
      docs_url: null // TODO: Generate PDF/docs
    })

  } catch (error) {
    console.error('Form export error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
})

/**
 * DELETE /api/forms/:form_id
 */
router.delete('/:form_id', async (req, res) => {
  try {
    const { form_id } = req.params

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('form_id', form_id)

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({
        error: 'Database error',
        details: error.message
      })
    }

    return res.json({
      success: true,
      message: 'Form deleted successfully'
    })

  } catch (error) {
    console.error('Form delete error:', error)
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
})

export default router