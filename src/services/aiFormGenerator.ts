import type { MetaLeadForm, PreFormBrief } from '@/types/form';

// AI Form Generation Service with Web Search Integration
export class AIFormGeneratorService {
  private static readonly API_BASE = 'https://api.anthropic.com/v1';
  private static readonly WEB_SEARCH_API = 'https://api.serper.dev/search';

  private apiKey: string | null = null;
  private searchApiKey: string | null = null;

  constructor() {
    // In production, these would come from environment variables
    // Guard against server-side rendering or non-browser environments
    if (typeof window !== 'undefined' && window.localStorage) {
      this.apiKey = localStorage.getItem('anthropic_api_key');
      this.searchApiKey = localStorage.getItem('serper_api_key');
    }
  }

  /**
   * Configure API keys for the service
   */
  configure(anthropicKey: string, serperKey?: string) {
    this.apiKey = anthropicKey;
    this.searchApiKey = serperKey;

    // Store keys securely (in production, use secure storage)
    // Guard against server-side rendering or non-browser environments
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('anthropic_api_key', anthropicKey);
      if (serperKey) {
        localStorage.setItem('serper_api_key', serperKey);
      }
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search for latest lead generation best practices for the specific industry
   */
  private async searchIndustryBestPractices(objective: string, industry: string): Promise<string> {
    if (!this.searchApiKey) {
      console.warn('Web search API key not configured, using default knowledge');
      return '';
    }

    try {
      const searchQuery = `${industry} lead generation form best practices 2024 conversion optimization`;

      const response = await fetch(this.WEB_SEARCH_API, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.searchApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: searchQuery,
          num: 5,
          hl: 'en',
          gl: 'us'
        })
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      const searchResults = await response.json();

      // Extract relevant information from search results
      interface SearchResult {
        title?: string;
        snippet?: string;
        link?: string;
      }

      const insights = (searchResults.organic as SearchResult[] | undefined)?.slice(0, 3).map((result) => ({
        title: result.title || '',
        snippet: result.snippet || '',
        source: result.link || ''
      })) || [];

      return insights.map(insight =>
        `• ${insight.title}: ${insight.snippet}`
      ).join('\n');

    } catch (error) {
      console.error('Web search failed:', error);
      return '';
    }
  }

  /**
   * Generate the system prompt for AI form generation
   */
  private createSystemPrompt(industryInsights: string): string {
    const basePrompt = `You are a strategic AI consultant, an expert in digital marketing specializing in the architecture of high-performance Meta/Facebook Lead Generation forms. Your primary function is to serve as a "smart" form builder for salespeople. You will take a campaign objective and translate it into a complete, optimized form blueprint, balancing the critical trade-offs between lead volume, quality, and cost.

## Core Principles

1. **Analyze the Objective's True Intent**: First, dissect the user's campaignObjective. Determine if the primary goal is **high-volume lead generation** (e.g., "fill the funnel," newsletter sign-ups) or **high-quality lead qualification** (e.g., "book demos," "get quotes for a high-ticket service"). This initial analysis dictates the entire form strategy.

2. **Aggressively Minimize Friction**: Every field is a potential drop-off point, especially on mobile. Your default stance should be to remove fields. Only include a question if it is absolutely essential for initial contact or qualification.

3. **Balance Volume vs. Quality Strategically**:
   * **For Volume**: Suggest the "more_volume" form type. Use a minimal number of fields (2-3 max), heavily prioritizing Meta's pre-fill options.
   * **For Quality**: Suggest the "higher_intent" form type (which adds a review step). Justify the inclusion of 1-2 custom qualifying questions to filter out low-intent leads.

4. **Use Field Types Intelligently**: Strongly prefer "multiple_choice" or "dropdown" over "short_text" for custom questions. This standardizes data, simplifies analysis, and reduces user effort.

5. **Leverage Pre-fill, But With Caution**: Default to using pre-fill for standard contact info (Name, Email, Phone) to reduce friction. However, for objectives where data accuracy is paramount (e.g., B2B sales), mention the option of disabling auto-fill.

## Latest Industry Insights
${industryInsights ? `Based on current research:\n${industryInsights}\n` : ''}

## Output Format
Your response must be a single JSON object matching this TypeScript interface:

interface AIFormResponse {
  campaignObjective: string;
  formConfiguration: {
    formType: "more_volume" | "higher_intent";
    strategySummary: string;
    verificationSuggestion: string;
  };
  generatedForm: {
    meta: {
      objective: string;
      industry: string;
      priority: "volume" | "quality" | "balanced";
      tone: string;
      audience: string;
    };
    formType: "more_volume" | "higher_intent";
    intro: {
      headline: string;
      description: string;
    };
    contactFields: Array<{
      id: string;
      name: string;
      type: "first_name" | "last_name" | "full_name" | "email" | "phone" | "text";
      required: boolean;
      placeholder: string;
      autofill: boolean;
      order: number;
    }>;
    qualifiers: Array<{
      id: string;
      question: string;
      type: "multiple_choice" | "dropdown" | "short_text";
      options?: string[];
      required: boolean;
      order: number;
    }>;
    privacy: {
      businessPrivacyUrl: string;
      customNotices: {
        title: string;
        disclaimerText: string;
        consents: Array<{
          id: string;
          label: string;
          optional: boolean;
        }>;
      };
    };
    thankYou: {
      headline: string;
      description: string;
      action: {
        type: "website" | "phone" | "whatsapp" | "download";
        label: string;
        websiteUrl?: string;
        phoneNumber?: string;
      };
    };
  };
}

Generate realistic, professional content that would work for actual businesses. Use industry-specific language and realistic business scenarios.`;

    return basePrompt;
  }

  /**
   * Generate an optimized lead form using AI
   */
  async generateForm(campaignBrief: Partial<PreFormBrief>): Promise<MetaLeadForm> {
    if (!this.apiKey) {
      throw new Error('AI service not configured. Please provide API keys.');
    }

    const {
      campaignObjective = '',
      industry = 'General Business',
      targetAudience = 'General consumers'
    } = campaignBrief;

    try {
      // Step 1: Search for latest industry insights
      const industryInsights = await this.searchIndustryBestPractices(
        campaignObjective,
        industry
      );

      // Step 2: Create the prompt
      const systemPrompt = this.createSystemPrompt(industryInsights);

      const userPrompt = `Campaign Objective: ${campaignObjective}
Industry: ${industry}
Target Audience: ${targetAudience}

Generate an optimized Meta lead form configuration that balances conversion rate with lead quality for this specific business scenario.`;

      // Step 3: Call the AI API
      const response = await fetch(`${AIFormGeneratorService.API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${response.status} - ${error}`);
      }

      const aiResponse = await response.json();
      const aiContent = aiResponse.content[0].text;

      // Step 4: Parse and validate the response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiContent);
      } catch (error) {
        console.error('Failed to parse AI response:', aiContent);
        throw new Error('AI returned invalid JSON format');
      }

      // Step 5: Transform to our form format
      const generatedForm = parsedResponse.generatedForm;

      // Add missing required fields if not present
      if (!generatedForm.id) {
        generatedForm.id = this.generateId();
      }

      if (!generatedForm.name) {
        generatedForm.name = `AI Generated: ${generatedForm.meta.objective}`;
      }

      // Ensure all contact fields have IDs
      generatedForm.contactFields = generatedForm.contactFields.map((field, index: number) => ({
        ...field,
        id: field.id || this.generateId(),
        order: index
      }));

      // Ensure all qualifiers have IDs
      generatedForm.qualifiers = generatedForm.qualifiers.map((qualifier, index: number) => ({
        ...qualifier,
        id: qualifier.id || this.generateId(),
        order: index
      }));

      // Ensure consent items have IDs
      generatedForm.privacy.customNotices.consents = generatedForm.privacy.customNotices.consents.map((consent) => ({
        ...consent,
        id: consent.id || this.generateId()
      }));

      // Add timestamps
      generatedForm.createdAt = new Date();
      generatedForm.updatedAt = new Date();

      // Store the AI generation metadata
      generatedForm._aiGenerated = {
        timestamp: new Date(),
        prompt: userPrompt,
        strategy: parsedResponse.formConfiguration.strategySummary,
        industryInsights: industryInsights ? 'Used current industry research' : 'Used baseline knowledge'
      };

      return generatedForm as MetaLeadForm;

    } catch (error) {
      console.error('AI form generation failed:', error);
      throw new Error(`Failed to generate form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a mock form for testing when AI is not configured
   */
  generateMockForm(campaignBrief: Partial<PreFormBrief>): MetaLeadForm {
    const {
      campaignObjective = 'Get leads for our business',
      industry = 'General Business'
    } = campaignBrief;

    return {
      id: this.generateId(),
      name: `Mock AI Form: ${campaignObjective}`,
      meta: {
        objective: campaignObjective,
        industry: industry,
        priority: 'balanced',
        tone: 'Professional and friendly',
        audience: 'Potential customers interested in our services'
      },
      formType: 'more_volume',
      intro: {
        headline: 'Get your free consultation',
        description: 'Tell us about your needs and we\'ll get back to you within 24 hours.'
      },
      contactFields: [
        {
          id: this.generateId(),
          name: 'Full name',
          type: 'full_name',
          required: true,
          placeholder: 'John Doe',
          autofill: true,
          order: 0
        },
        {
          id: this.generateId(),
          name: 'Email',
          type: 'email',
          required: true,
          placeholder: 'john@example.com',
          autofill: true,
          order: 1
        },
        {
          id: this.generateId(),
          name: 'Phone number',
          type: 'phone',
          required: false,
          placeholder: '(555) 123-4567',
          autofill: true,
          order: 2
        }
      ],
      qualifiers: [
        {
          id: this.generateId(),
          question: 'When are you looking to get started?',
          type: 'multiple_choice',
          options: ['Immediately', 'Within 1 month', '1-3 months', 'Just exploring'],
          required: true,
          order: 0
        }
      ],
      privacy: {
        businessPrivacyUrl: 'https://example.com/privacy',
        customNotices: {
          title: 'Terms and Conditions',
          disclaimerText: 'By submitting this form, you agree to our terms of service.',
          consents: [
            {
              id: this.generateId(),
              label: 'I agree to receive marketing communications',
              optional: true
            }
          ]
        }
      },
      thankYou: {
        headline: 'Thanks! We\'ll be in touch soon.',
        description: 'We\'ve received your information and will contact you within 24 hours to discuss your needs.',
        action: {
          type: 'website',
          label: 'Learn more about our services',
          websiteUrl: 'https://example.com'
        }
      },
      contactDescription: 'We collect this information to provide you with the best possible service.',
      createdAt: new Date(),
      updatedAt: new Date(),
      _aiGenerated: {
        timestamp: new Date(),
        prompt: `Mock generation for: ${campaignObjective}`,
        strategy: 'Mock form optimized for lead volume with minimal friction',
        industryInsights: 'Using general best practices (mock mode)'
      }
    } as MetaLeadForm;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const aiFormGenerator = new AIFormGeneratorService();