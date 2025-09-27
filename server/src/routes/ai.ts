import { Router } from 'express'
import { z } from 'zod'
import { generateQualifyingQuestions, generateCompleteForm, CampaignBriefSchema } from '../services/ai.js'

const router = Router()

/**
 * POST /api/generate-questions
 * Generate qualifying questions from campaign brief
 */
router.post('/generate-questions', async (req, res) => {
  try {
    // Validate input
    const brief = CampaignBriefSchema.parse(req.body)

    // Generate questions using AI
    const result = await generateQualifyingQuestions(brief)

    // Transform AI questions into our form builder format
    const qualifiers = result.questions.map((q, index) => ({
      id: `ai_generated_${index + 1}`,
      question: q.question,
      type: q.type,
      options: q.options || [],
      required: q.required,
      order: index + 1,
      allowMultipleResponses: false,
      confirmationMessage: '',
      showConfirmationMessage: false,
      // Store AI explanation for debugging/improvement
      _aiExplanation: q.explanation
    }))

    return res.json({
      questions: qualifiers,
      rationale: result.rationale,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI generation error:', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid campaign brief data',
        details: error.errors
      })
    }

    // Return fallback response for AI failures
    return res.status(500).json({
      error: 'AI service temporarily unavailable',
      fallback_questions: [
        {
          id: 'fallback_1',
          question: 'What is your timeline for this project?',
          type: 'multiple_choice',
          options: ['Immediately', 'Within 1 month', '1-3 months', 'Planning ahead'],
          required: true,
          order: 1,
          allowMultipleResponses: false,
          confirmationMessage: '',
          showConfirmationMessage: false
        }
      ],
      rationale: 'Using fallback questions due to AI service error'
    })
  }
})

/**
 * POST /api/generate-complete-form
 * Generate comprehensive form content from campaign brief
 */
router.post('/generate-complete-form', async (req, res) => {
  try {
    // Validate input
    const brief = CampaignBriefSchema.parse(req.body)

    // Generate complete form using AI
    const result = await generateCompleteForm(brief)

    return res.json(result)

  } catch (error) {
    console.error('AI form generation error:', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid campaign brief data',
        details: error.errors
      })
    }

    // Return fallback response for AI failures
    return res.status(500).json({
      error: 'AI service temporarily unavailable',
      fallback_form: {
        formName: 'Lead Generation Form',
        intro: {
          headline: 'Get Your Free Quote',
          description: 'Fill out this form and we\'ll get back to you soon.'
        },
        questions: [],
        contactInfo: {
          description: 'We use this information to contact you about our services.',
          recommendedFields: [
            {
              type: 'email',
              name: 'Email Address',
              required: true,
              placeholder: 'Enter your email',
              autofill: true,
              priority: 1
            }
          ]
        },
        completion: {
          headline: 'Thank you!',
          description: 'We\'ll be in touch within 24 hours.'
        },
        additionalAction: {
          type: 'website',
          buttonText: 'Visit Website'
        },
        rationale: 'Using fallback form due to AI service error'
      }
    })
  }
})

/**
 * GET /api/ai/health
 * Check AI service health
 */
router.get('/health', async (req, res) => {
  try {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY

    res.json({
      status: hasOpenAIKey ? 'available' : 'unavailable',
      service: 'OpenAI',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router