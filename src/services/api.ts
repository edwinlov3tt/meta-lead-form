// Enhanced API client for Meta Lead Form Builder backend
// Supports idempotency keys, ETags, retry logic, and proper caching

import { z } from 'zod';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_LEAD_API_URL || 'http://localhost:3002';

// Enhanced API configuration
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  enableEtags: boolean;
  enableIdempotency: boolean;
}

const defaultConfig: ApiConfig = {
  baseUrl: API_BASE_URL,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  enableEtags: true,
  enableIdempotency: true,
};

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any,
    public retryAfter?: number,
    public etag?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ETag cache for conflict detection
class ETagCache {
  private cache = new Map<string, string>();

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  set(key: string, etag: string): void {
    this.cache.set(key, etag);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global ETag cache instance
const etagCache = new ETagCache();

// Request options with enhanced features
interface EnhancedRequestInit extends RequestInit {
  idempotencyKey?: string;
  etag?: string;
  skipRetry?: boolean;
  cacheKey?: string;
}

// Enhanced response with metadata
interface ApiResponse<T> {
  data: T;
  etag?: string;
  lastModified?: string;
  cacheStatus: 'hit' | 'miss' | 'stale';
  fromCache: boolean;
}

// Idempotency key generator
function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

// Enhanced fetch function with retries, ETags, and idempotency
async function fetchApi<T>(
  endpoint: string,
  options: EnhancedRequestInit = {},
  config: ApiConfig = defaultConfig
): Promise<ApiResponse<T>> {
  const url = `${config.baseUrl}${endpoint}`;
  const cacheKey = options.cacheKey || `${options.method || 'GET'}:${endpoint}`;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Request-ID': crypto.randomUUID(),
    ...options.headers as Record<string, string>,
  };

  // Add idempotency key for safe operations
  if (config.enableIdempotency && options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  // Add ETag for conditional requests
  if (config.enableEtags && options.etag) {
    if (options.method === 'GET' || options.method === undefined) {
      headers['If-None-Match'] = options.etag;
    } else {
      headers['If-Match'] = options.etag;
    }
  }

  // Add cached ETag if available
  const cachedETag = etagCache.get(cacheKey);
  if (config.enableEtags && cachedETag && !options.etag) {
    headers['If-None-Match'] = cachedETag;
  }

  let lastError: ApiError | null = null;
  const maxAttempts = options.skipRetry ? 1 : config.maxRetries;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 304 Not Modified (ETag cache hit)
      if (response.status === 304) {
        return {
          data: null as T, // Client should use cached data
          etag: cachedETag,
          cacheStatus: 'hit',
          fromCache: true,
        };
      }

      // Handle errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const retryAfter = response.headers.get('Retry-After');
        const responseETag = response.headers.get('ETag');

        const error = new ApiError(
          response.status,
          errorData.error || `HTTP ${response.status}`,
          errorData.details,
          retryAfter ? parseInt(retryAfter) * 1000 : undefined,
          responseETag || undefined
        );

        // Handle specific error types
        if (response.status === 409) {
          // Conflict - likely ETag mismatch
          error.message = 'Resource was modified by another request. Please refresh and try again.';
          throw error;
        }

        if (response.status === 422) {
          // Idempotency key already used
          if (errorData.error?.includes('idempotency')) {
            error.message = 'Duplicate request detected. The original request may still be processing.';
          }
          throw error;
        }

        // Retry on specific status codes
        if (attempt < maxAttempts && [408, 429, 500, 502, 503, 504].includes(response.status)) {
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
          continue;
        }

        throw error;
      }

      // Success - extract metadata
      const responseETag = response.headers.get('ETag');
      const lastModified = response.headers.get('Last-Modified');
      const data = await response.json();

      // Cache ETag for future requests
      if (responseETag && config.enableEtags) {
        etagCache.set(cacheKey, responseETag);
      }

      return {
        data,
        etag: responseETag || undefined,
        lastModified: lastModified || undefined,
        cacheStatus: 'miss',
        fromCache: false,
      };

    } catch (error) {
      if (error instanceof ApiError) {
        if (attempt < maxAttempts && error.status >= 500) {
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
          continue;
        }
        throw error;
      }

      // Network or other errors
      if (attempt < maxAttempts) {
        lastError = new ApiError(0, error instanceof Error ? error.message : 'Network error');
        await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
        continue;
      }

      throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
    }
  }

  // If we get here, all retries failed
  throw lastError || new ApiError(0, 'All retry attempts failed');
}

// Simple fetch wrapper for backward compatibility
async function fetchApiSimple<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchApi<T>(endpoint, options);
  return response.data;
}

// Types for API responses
export interface PageResolveRequest {
  page_url?: string
  page_id?: string
  name?: string
  profile_picture?: string
}

export interface PageResolveResponse {
  page_id: string
  username: string | null
  name: string | null
  profile_picture: string | null
}

export interface FormListResponse {
  page: {
    page_id: string
    username: string | null
    name: string | null
    profile_picture: string | null
  }
  forms: Array<{
    form_id: string
    form_name: string
    form_slug: string
    version: number
    updated_at: string
  }>
}

export interface FormCreateRequest {
  page_id: string
  form_name: string
  spec_json: any
  meta_preview?: any
  created_by?: string
}

export interface FormResponse {
  form_id: string
  page_id: string
  form_name: string
  form_slug: string
  version: number
}

export interface FormGetResponse {
  page: {
    page_id: string
    username: string | null
    name: string | null
    profile_picture: string | null
  }
  form: {
    form_id: string
    form_name: string
    form_slug: string
    spec_json: any
    meta_preview: any
    version: number
    created_at: string
    updated_at: string
  }
}

export interface AIQuestionRequest {
  objective: string
  industry: string
  priority: 'volume' | 'quality' | 'balanced'
  tone: string
  audience: string
  monthlyLeadGoal?: string
  hasScreeningQuestions?: boolean
  responseTime?: {
    value: string
    unit: 'minutes' | 'hours'
  }
}

export interface AIFormGenerationRequest {
  objective: string
  industry: string
  priority: 'volume' | 'quality' | 'balanced'
  tone: string
  audience: string
  monthlyLeadGoal?: string
  formType?: 'more_volume' | 'higher_intent' | 'rich_creative'
  hasScreeningQuestions?: boolean
  screeningQuestionSuggestions?: string
  isHealthRelated?: boolean
  additionalNotes?: string
  facebookPageData?: {
    name: string
    website?: string
    profile_picture?: string
    categories?: string[]
  }
  responseTime?: {
    value: string
    unit: 'minutes' | 'hours'
  }
}

export interface AIQuestionResponse {
  questions: Array<{
    id: string
    question: string
    type: 'multiple_choice' | 'short_text' | 'dropdown'
    options: string[]
    required: boolean
    order: number
    allowMultipleResponses: boolean
    confirmationMessage: string
    showConfirmationMessage: boolean
  }>
  rationale: string
  generated_at: string
}

export interface AIFormGenerationResponse {
  formName: string
  intro: {
    headline: string
    description: string
  }
  questions: Array<{
    question: string
    type: 'multiple_choice' | 'short_text' | 'dropdown'
    options?: string[]
    required: boolean
    explanation?: string
  }>
  contactInfo: {
    description: string
    recommendedFields: Array<{
      type: 'email' | 'phone' | 'text' | 'first_name' | 'last_name' | 'full_name' | 'street_address' | 'city' | 'state' | 'zip_code'
      name: string
      required: boolean
      placeholder: string
      autofill: boolean
      priority: number
    }>
  }
  completion: {
    headline: string
    description: string
  }
  additionalAction: {
    type: 'website' | 'phone'
    buttonText: string
    websiteUrl?: string
    phoneNumber?: string
  }
  rationale?: string
}

// API methods
export const api = {
  // Page management
  async resolvePage(data: PageResolveRequest): Promise<PageResolveResponse> {
    return fetchApi('/api/pages/resolve', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Form management
  async listForms(pageIdOrUsername: string): Promise<FormListResponse> {
    return fetchApi(`/api/forms?query=${encodeURIComponent(pageIdOrUsername)}`)
  },

  async createForm(data: FormCreateRequest, options?: { idempotencyKey?: string }): Promise<FormResponse> {
    return fetchApiSimple('/api/forms', {
      method: 'POST',
      body: JSON.stringify(data),
      idempotencyKey: options?.idempotencyKey || generateIdempotencyKey(),
    } as EnhancedRequestInit)
  },

  async getForm(
    pageKey: string,
    formSlug: string,
    options?: { etag?: string }
  ): Promise<FormGetResponse> {
    const cacheKey = `form:${pageKey}:${formSlug}`;
    const response = await fetchApi(`/api/forms/${encodeURIComponent(pageKey)}/${encodeURIComponent(formSlug)}`, {
      cacheKey,
      etag: options?.etag,
    });

    // Handle 304 Not Modified
    if (response.cacheStatus === 'hit') {
      throw new ApiError(304, 'Not Modified', undefined, undefined, response.etag);
    }

    return response.data;
  },

  async updateForm(
    formId: string,
    data: Partial<FormCreateRequest>,
    options?: { etag?: string; idempotencyKey?: string }
  ): Promise<FormResponse> {
    return fetchApiSimple(`/api/forms/${formId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      etag: options?.etag,
      idempotencyKey: options?.idempotencyKey || generateIdempotencyKey(),
      cacheKey: `form:${formId}`,
    } as EnhancedRequestInit)
  },

  async deleteForm(formId: string): Promise<{ success: boolean; message: string }> {
    return fetchApi(`/api/forms/${formId}`, {
      method: 'DELETE',
    })
  },

  async exportForm(formId: string): Promise<any> {
    return fetchApi(`/api/forms/${formId}/export`)
  },

  // AI services
  async generateQuestions(brief: AIQuestionRequest): Promise<AIQuestionResponse> {
    return fetchApi('/api/generate-questions', {
      method: 'POST',
      body: JSON.stringify(brief),
    })
  },

  async generateCompleteForm(brief: AIFormGenerationRequest): Promise<AIFormGenerationResponse> {
    return fetchApi('/api/generate-complete-form', {
      method: 'POST',
      body: JSON.stringify(brief),
    })
  },

  async checkAIHealth(): Promise<{ status: string; service: string; timestamp: string }> {
    return fetchApi('/api/ai/health')
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; environment: string }> {
    return fetchApi('/health')
  }
}

export { ApiError }