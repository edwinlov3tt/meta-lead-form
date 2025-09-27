import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Schema for campaign brief input - enhanced for comprehensive form generation
export const CampaignBriefSchema = z.object({
  objective: z.string().min(10),
  industry: z.string().min(2),
  priority: z.enum(['volume', 'quality', 'balanced']),
  tone: z.string().min(2),
  audience: z.string().min(10),
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
})

// Schema for AI-generated questions
export const AIQuestionSchema = z.object({
  question: z.string(),
  type: z.enum(['multiple_choice', 'short_text', 'dropdown']),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  explanation: z.string().optional()
})

export const AIQuestionsResponseSchema = z.object({
  questions: z.array(AIQuestionSchema),
  rationale: z.string().optional()
})

// Schema for comprehensive AI form generation
export const AIContactFieldSchema = z.object({
  type: z.enum(['email', 'phone', 'text', 'first_name', 'last_name', 'full_name', 'street_address', 'city', 'state', 'zip_code']),
  name: z.string(),
  required: z.boolean(),
  placeholder: z.string(),
  autofill: z.boolean(),
  priority: z.number() // 1 = highest priority for this industry
})

export const AIFormGenerationResponseSchema = z.object({
  formName: z.string(),
  intro: z.object({
    headline: z.string(),
    description: z.string()
  }),
  questions: z.array(AIQuestionSchema),
  contactInfo: z.object({
    description: z.string(),
    recommendedFields: z.array(AIContactFieldSchema)
  }),
  completion: z.object({
    headline: z.string(),
    description: z.string()
  }),
  additionalAction: z.object({
    type: z.enum(['website', 'phone']),
    buttonText: z.string(),
    websiteUrl: z.string().optional(),
    phoneNumber: z.string().optional()
  }),
  rationale: z.string().optional()
})

export type CampaignBrief = z.infer<typeof CampaignBriefSchema>
export type AIQuestion = z.infer<typeof AIQuestionSchema>
export type AIQuestionsResponse = z.infer<typeof AIQuestionsResponseSchema>
export type AIContactField = z.infer<typeof AIContactFieldSchema>
export type AIFormGenerationResponse = z.infer<typeof AIFormGenerationResponseSchema>

/**
 * Generate qualifying questions based on campaign brief
 */
export async function generateQualifyingQuestions(
  brief: CampaignBrief
): Promise<AIQuestionsResponse> {
  const prompt = createQuestionsPrompt(brief)

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    // Parse and validate the AI response
    const parsed = JSON.parse(content)
    const validated = AIQuestionsResponseSchema.parse(parsed)

    return validated
  } catch (error) {
    console.error('AI Question Generation Error:', error)

    // Return fallback questions based on industry and priority
    return generateFallbackQuestions(brief)
  }
}

/**
 * Generate comprehensive form content based on campaign brief
 */
export async function generateCompleteForm(
  brief: CampaignBrief
): Promise<AIFormGenerationResponse> {
  const prompt = createComprehensiveFormPrompt(brief)

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: COMPREHENSIVE_FORM_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    // Parse and validate the AI response
    const parsed = JSON.parse(content)
    const validated = AIFormGenerationResponseSchema.parse(parsed)

    // Add UTM codes to website URL if provided
    if (validated.additionalAction.type === 'website' && validated.additionalAction.websiteUrl) {
      validated.additionalAction.websiteUrl = addUTMCodes(
        validated.additionalAction.websiteUrl,
        validated.formName
      )
    }

    return validated
  } catch (error) {
    console.error('AI Form Generation Error:', error)

    // Return fallback form based on industry and priority
    return generateFallbackForm(brief)
  }
}

const SYSTEM_PROMPT = `You are an expert at creating high-converting Meta Lead Ad forms. Your job is to generate 2-4 qualifying questions that will help businesses identify high-quality leads while maintaining good conversion rates.

Key principles:
- Questions should be industry-specific and relevant
- Balance lead quality with conversion rate based on priority setting
- Use clear, conversational language
- Provide meaningful multiple choice options
- Consider the buyer's journey and pain points

Respond with valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "type": "multiple_choice",
      "options": ["Option 1", "Option 2", "Option 3"],
      "required": true,
      "explanation": "Why this question helps qualify leads"
    }
  ],
  "rationale": "Brief explanation of the question strategy"
}`

function createQuestionsPrompt(brief: CampaignBrief): string {
  const formTypeGuidance = brief.formType ? getFormTypeGuidance(brief.formType) : ''

  return `Generate qualifying questions for this Meta Lead Ad campaign:

**Campaign Objective:** ${brief.objective}

**Industry:** ${brief.industry}

**Priority:** ${brief.priority} (volume = more leads, quality = better leads, balanced = optimize for both)

${brief.formType ? `**Form Type:** ${brief.formType} - ${formTypeGuidance}` : ''}

**Target Audience:** ${brief.audience}

**Tone:** ${brief.tone}

${brief.monthlyLeadGoal ? `**Monthly Goal:** ${brief.monthlyLeadGoal} leads` : ''}

${brief.responseTime ? `**Response Time:** ${brief.responseTime.value} ${brief.responseTime.unit}` : ''}

Create 2-4 qualifying questions that:
1. Help identify prospects most likely to convert
2. Are relevant to the ${brief.industry} industry
3. Match the ${brief.priority} priority (${brief.priority === 'volume' ? 'fewer, simpler questions' : brief.priority === 'quality' ? 'more thorough qualification' : 'balanced approach'})
${brief.formType ? `4. Align with the ${brief.formType} form strategy` : '4. Focus on lead qualification'}
5. Use ${brief.tone} tone
6. Consider the target audience: ${brief.audience}

Focus on questions that reveal:
- Intent level and timeline
- Budget or investment capacity
- Specific needs or pain points
- Decision-making authority

${brief.formType ? getFormTypeQuestionFocus(brief.formType) : ''}

Prefer multiple choice questions with 3-5 clear options. Avoid overly personal or complex questions.`
}

/**
 * Get form type specific guidance for AI prompt
 */
function getFormTypeGuidance(formType: string): string {
  switch (formType) {
    case 'more_volume':
      return 'Focus on maximizing lead volume with minimal friction. Keep questions simple and broad.'
    case 'higher_intent':
      return 'Focus on identifying high-intent leads with stronger qualification questions.'
    case 'rich_creative':
      return 'Focus on engagement and creative appeal while maintaining good qualification.'
    default:
      return ''
  }
}

/**
 * Get form type specific question focus for AI prompt
 */
function getFormTypeQuestionFocus(formType: string): string {
  switch (formType) {
    case 'more_volume':
      return 'For MORE VOLUME: Use 1-2 broad questions that capture interest without being too specific or limiting.'
    case 'higher_intent':
      return 'For HIGHER INTENT: Use 3-4 detailed questions that thoroughly qualify budget, timeline, and decision-making authority.'
    case 'rich_creative':
      return 'For RICH CREATIVE: Use 2-3 engaging questions that feel natural and conversational while still qualifying leads.'
    default:
      return ''
  }
}

/**
 * Generate fallback questions when AI fails
 */
function generateFallbackQuestions(brief: CampaignBrief): AIQuestionsResponse {
  const industryQuestions: Record<string, AIQuestion[]> = {
    'home services': [
      {
        question: "When are you looking to start this project?",
        type: "multiple_choice",
        options: ["Immediately", "Within 1 month", "1-3 months", "3+ months", "Just researching"],
        required: true,
        explanation: "Timeline helps prioritize leads and set expectations"
      },
      {
        question: "What's your estimated budget range?",
        type: "multiple_choice",
        options: ["Under $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "$10,000+", "Need estimate"],
        required: true,
        explanation: "Budget qualification ensures good fit for services"
      }
    ],
    'real estate': [
      {
        question: "Are you pre-approved for a mortgage?",
        type: "multiple_choice",
        options: ["Yes, pre-approved", "Pre-qualified", "Not yet, but ready to start", "Just browsing"],
        required: true,
        explanation: "Mortgage readiness indicates serious buying intent"
      },
      {
        question: "What's your preferred timeline to purchase?",
        type: "multiple_choice",
        options: ["Within 30 days", "1-3 months", "3-6 months", "6+ months", "Just looking"],
        required: true,
        explanation: "Timeline helps prioritize lead follow-up"
      }
    ],
    'default': [
      {
        question: "What's your timeline for this project?",
        type: "multiple_choice",
        options: ["Immediate need", "Within 1 month", "1-3 months", "Planning ahead", "Just exploring"],
        required: true,
        explanation: "Timeline indicates urgency and purchase intent"
      },
      {
        question: "What's most important to you?",
        type: "multiple_choice",
        options: ["Best price", "Quality service", "Fast delivery", "Experience/reputation"],
        required: false,
        explanation: "Priorities help tailor the sales approach"
      }
    ]
  }

  const industryKey = brief.industry.toLowerCase()
  const questions = industryQuestions[industryKey] || industryQuestions['default']

  // Adjust number of questions based on priority and form type
  let questionCount = brief.priority === 'volume' ? 1 : brief.priority === 'quality' ? questions.length : 2

  // Override based on form type if provided
  if (brief.formType) {
    switch (brief.formType) {
      case 'more_volume':
        questionCount = 1
        break
      case 'higher_intent':
        questionCount = Math.min(questions.length, 4)
        break
      case 'rich_creative':
        questionCount = 2
        break
    }
  }

  const formTypeNote = brief.formType ? ` optimized for ${brief.formType} strategy` : ''

  return {
    questions: questions.slice(0, questionCount),
    rationale: `Generated fallback questions for ${brief.industry} with ${brief.priority} priority focus${formTypeNote}.`
  }
}

/**
 * Comprehensive Form System Prompt
 */
const COMPREHENSIVE_FORM_SYSTEM_PROMPT = `You are an expert at creating high-converting Meta Lead Ad forms that generate quality leads while minimizing friction. Your job is to create complete, optimized form content based on campaign details.

CRITICAL REQUIREMENTS:
- Headlines must be under 60 characters and compelling (avoid generic phrases)
- Descriptions must be under 100 characters and engaging (create excitement/urgency)
- Generate 2-3 qualifying questions unless screening disabled
- Contact fields must use exact Meta field types and be industry-optimized
- All content must be compliant with Meta policies
- HIPAA-sensitive industries require special handling
- Use Facebook's contact field guidelines for descriptions
- Content should be industry-specific, not generic

AVOID GENERIC LANGUAGE:
- Don't use "Thank you" in completion headlines
- Don't use "We'll get back to you" - be specific about timing and value
- Don't generate generic questions - make them relevant to the industry and objective
- Don't ignore screening question suggestions - implement them as requested

RESPONSE FORMAT - Respond with valid JSON in this exact format:
{
  "formName": "Catchy form name here",
  "intro": {
    "headline": "Under 60 chars headline",
    "description": "Under 100 chars description"
  },
  "questions": [
    {
      "question": "Question text here?",
      "type": "multiple_choice",
      "options": ["Option 1", "Option 2", "Option 3"],
      "required": true,
      "explanation": "Why this question helps qualify leads"
    }
  ],
  "contactInfo": {
    "description": "How contact data will be used (Meta compliant)",
    "recommendedFields": [
      {
        "type": "email",
        "name": "Email Address",
        "required": true,
        "placeholder": "Enter your email",
        "autofill": true,
        "priority": 1
      }
    ]
  },
  "completion": {
    "headline": "Under 60 chars thank you headline",
    "description": "What happens next explanation"
  },
  "additionalAction": {
    "type": "website",
    "buttonText": "Visit Our Website",
    "websiteUrl": "extracted from Facebook data or campaign context",
    "phoneNumber": "extracted from Facebook data if available"
  },
  "rationale": "Brief explanation of the form strategy"
}`

/**
 * Create comprehensive form generation prompt
 */
function createComprehensiveFormPrompt(brief: CampaignBrief): string {
  const hipaaNote = brief.isHealthRelated ? '\n**IMPORTANT: This is a HIPAA-sensitive healthcare campaign. Ensure all content is compliant and avoid sensitive medical terminology.**' : ''

  const screeningNote = brief.hasScreeningQuestions === false
    ? '\n**SCREENING QUESTIONS: Client does NOT want screening questions. Generate 0 questions in the questions array.**'
    : brief.screeningQuestionSuggestions
      ? `\n**SUGGESTED SCREENING QUESTIONS: Client specifically wants these topics covered: "${brief.screeningQuestionSuggestions}". Optimize and implement these as qualifying questions.`
      : '\n**SCREENING QUESTIONS: Generate appropriate qualifying questions for lead qualification.**'

  const facebookDataNote = brief.facebookPageData
    ? `\n**FACEBOOK PAGE DATA:**
- Business Name: ${brief.facebookPageData.name}
- Website: ${brief.facebookPageData.website || 'Not provided'}
- Business Categories: ${brief.facebookPageData.categories?.join(', ') || 'Not provided'}
Use this data to populate websiteUrl and phoneNumber in additionalAction.`
    : ''

  return `Generate a complete Meta Lead Form for this campaign:

**CAMPAIGN OBJECTIVE:** ${brief.objective}

**INDUSTRY:** ${brief.industry}

**FORM TYPE:** ${brief.formType || 'more_volume'} - ${getFormTypeGuidance(brief.formType || 'more_volume')}

**TARGET AUDIENCE:** ${brief.audience}

**TONE:** ${brief.tone}

**PRIORITY:** ${brief.priority} (volume = more leads/less friction, quality = better leads/more qualification, balanced = optimize for both)

${brief.monthlyLeadGoal ? `**MONTHLY GOAL:** ${brief.monthlyLeadGoal} leads` : ''}

${brief.additionalNotes ? `**ADDITIONAL CONTEXT:** ${brief.additionalNotes}` : ''}

${hipaaNote}${screeningNote}${facebookDataNote}

GENERATE:

1. **FORM NAME** - Compelling, benefit-focused name for internal use

2. **INTRO SECTION** - Headlines <60 chars, descriptions <100 chars
   - Headline should be compelling, action-oriented, and communicate clear value
   - Use power words, urgency, or benefits specific to the industry/objective
   - Description should clearly explain what happens next and create excitement
   - Avoid generic phrases like "We'll get back to you" - be specific and engaging

3. **QUESTIONS** (Generate 2-3 qualifying questions unless screening disabled)
   ${brief.hasScreeningQuestions === false ? '- Generate ZERO questions (empty array)' : '- Generate 2-3 high-quality qualifying questions'}
   ${brief.screeningQuestionSuggestions ? `- MUST incorporate these specific topics: ${brief.screeningQuestionSuggestions}` : '- Focus on timeline, budget, decision authority, and pain points'}
   - Use multiple choice questions with 3-4 clear, specific options
   - Make questions industry-specific and relevant to the objective
   - Match form type strategy (${getFormTypeQuestionFocus(brief.formType || 'more_volume')})

4. **CONTACT INFO** - Industry-optimized field selection
   - MUST use only these exact field types: email, phone, text, first_name, last_name, full_name, street_address, city, state, zip_code
   - Generate 3-5 fields maximum, prioritize: email (always required), then industry-specific most important
   - Set proper required/optional status and priority ordering (1=highest priority)
   - Use Meta-compliant data usage descriptions
   - For ${brief.industry}: ${getIndustryContactFieldGuidance(brief.industry)}

5. **COMPLETION PAGE** - What happens after submission
   - Headline <60 chars - celebratory, specific, and reassuring (avoid generic "Thank you")
   - Description - specific next steps with clear timeline and what value they'll receive
   - Make it industry-specific and build anticipation for the follow-up

6. **ADDITIONAL ACTION** - Smart CTA selection
   - Choose website OR phone based on campaign objective and form type
   - For website: use Facebook page website if provided
   - For phone: extract from Facebook data or indicate none available
   - Button text should be action-oriented and relevant to the objective

Optimize for ${brief.formType} strategy and ${brief.priority} priority focus.`
}

/**
 * Get industry-specific contact field guidance
 */
function getIndustryContactFieldGuidance(industry: string): string {
  const guidance: Record<string, string> = {
    'home services': 'zip_code and phone are critical for service area and immediate contact',
    'real estate': 'phone, email, and location fields (zip_code) for immediate follow-up',
    'healthcare': 'phone and email only - avoid sensitive personal information',
    'automotive': 'phone, email, zip_code for inventory and location matching',
    'education': 'email, phone, and relevant demographic info for program matching',
    'legal': 'phone and email for immediate consultation scheduling',
    'financial': 'email and phone only - avoid sensitive financial data collection',
    'fitness': 'email, phone, and basic location for membership/class scheduling'
  }

  return guidance[industry.toLowerCase()] || 'email and phone are typically most important, add location if service-area dependent'
}

/**
 * Normalize and clean website URL, then add UTM codes
 */
function addUTMCodes(url: string, formName: string): string {
  try {
    // First normalize the URL - remove paths, parameters, fragments
    let cleanUrl = url.trim()

    // Add protocol if missing
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }

    const urlObj = new URL(cleanUrl)

    // Keep only the domain and root path
    const normalizedUrl = `${urlObj.protocol}//${urlObj.hostname}`
    const finalUrlObj = new URL(normalizedUrl)

    // Generate UTM slug from form name
    const slug = formName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Add UTM parameters
    finalUrlObj.searchParams.set('utm_campaign', 'Ignite')
    finalUrlObj.searchParams.set('utm_medium', 'Facebook')
    finalUrlObj.searchParams.set('utm_source', 'lead-ad')
    finalUrlObj.searchParams.set('utm_content', slug)

    return finalUrlObj.toString()
  } catch (error) {
    console.error('Error processing URL:', error)
    // Return a clean version without UTMs if URL parsing fails
    try {
      let fallback = url.trim()
      if (!fallback.startsWith('http://') && !fallback.startsWith('https://')) {
        fallback = 'https://' + fallback
      }
      const fallbackObj = new URL(fallback)
      return `${fallbackObj.protocol}//${fallbackObj.hostname}`
    } catch {
      return url
    }
  }
}

/**
 * Generate fallback form when AI fails
 */
function generateFallbackForm(brief: CampaignBrief): AIFormGenerationResponse {
  const fallbackQuestions = generateFallbackQuestions(brief)

  return {
    formName: `${brief.industry} Lead Form - ${brief.formType || 'Volume Optimized'}`,
    intro: {
      headline: 'Get Your Free Consultation',
      description: 'Fill out this quick form and we\'ll get back to you soon.'
    },
    questions: fallbackQuestions.questions,
    contactInfo: {
      description: 'We use this information to contact you about our services. See our privacy policy for details.',
      recommendedFields: [
        {
          type: 'email',
          name: 'Email Address',
          required: true,
          placeholder: 'Enter your email address',
          autofill: true,
          priority: 1
        },
        {
          type: 'phone',
          name: 'Phone Number',
          required: true,
          placeholder: 'Enter your phone number',
          autofill: true,
          priority: 2
        }
      ]
    },
    completion: {
      headline: 'Thank you for your interest!',
      description: 'We\'ll contact you within 24 hours to discuss your needs.'
    },
    additionalAction: {
      type: brief.facebookPageData?.website ? 'website' : 'phone',
      buttonText: brief.facebookPageData?.website ? 'Visit Our Website' : 'Call Now',
      websiteUrl: brief.facebookPageData?.website ? addUTMCodes(brief.facebookPageData.website, 'fallback-form') : undefined,
      phoneNumber: undefined // Would need to extract from Facebook data
    },
    rationale: `Generated fallback form for ${brief.industry} with ${brief.priority} priority focus due to AI service error.`
  }
}