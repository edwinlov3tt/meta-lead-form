export interface FacebookPageData {
  page_id: string;
  name: string;
  profile_picture: string;
  cover_image?: string;
  categories?: string[];
  intro?: string;
  instagram_url?: string;
  instagram_details?: any;
  verified?: boolean;
  website?: string;
  phone?: string;
}

export interface FacebookApiResponse {
  success: boolean;
  data?: FacebookPageData;
  error?: string;
  method?: string;
}

export class FacebookPageService {
  private static readonly API_URL = 'https://meta.edwinlovett.com/';
  private static readonly FALLBACK_API_URL = (import.meta.env.VITE_FACEBOOK_FALLBACK_URL || '/api/facebook-page.php').trim();
  private static readonly TIMEOUT = 10000; // 10 seconds

  /**
   * Fetches Facebook page data from the meta.edwinlovett.com worker API
   * @param facebookUrl - The Facebook page URL to fetch data for
   * @returns Promise with Facebook page data or error
   */
  static async fetchPageData(facebookUrl: string): Promise<FacebookApiResponse> {
    try {
      // Validate Facebook URL format
      if (!this.isValidFacebookUrl(facebookUrl)) {
        return {
          success: false,
          error: 'Invalid Facebook URL format'
        };
      }

      // Construct API URL
      const apiUrl = `${this.API_URL}?page=${encodeURIComponent(facebookUrl)}`;

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          // Keep the request CORS-simple by avoiding custom content types.
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const fallbackResult = await this.fetchFromFallback(facebookUrl);
        if (fallbackResult) {
          return fallbackResult;
        }

        return {
          success: false,
          error: `API request failed with status ${response.status}`
        };
      }

      const result = await response.json();

      // Check if the API returned an error
      if (!result.success) {
        const fallbackResult = await this.fetchFromFallback(facebookUrl, result.error);
        if (fallbackResult) {
          return fallbackResult;
        }

        return {
          success: false,
          error: result.error || 'Unknown API error'
        };
      }

      // Validate required fields
      if (!result.data || !result.data.name) {
        const fallbackResult = await this.fetchFromFallback(facebookUrl, 'Invalid response data from API');
        if (fallbackResult) {
          return fallbackResult;
        }

        return {
          success: false,
          error: 'Invalid response data from API'
        };
      }

      return {
        success: true,
        data: result.data,
        method: result.method
      };

    } catch (error) {
      console.error('Facebook API Error:', error);

      const fallbackResult = await this.fetchFromFallback(
        facebookUrl,
        error instanceof Error ? error.message : 'Unknown error'
      );
      if (fallbackResult) {
        return fallbackResult;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout - please try again'
          };
        }
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred'
      };
    }
  }

  /**
   * Validates if a URL is a valid Facebook page URL
   * @param url - URL to validate
   * @returns boolean indicating if URL is valid
   */
  static isValidFacebookUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      return (
        hostname === 'facebook.com' ||
        hostname === 'www.facebook.com' ||
        hostname === 'm.facebook.com'
      ) && urlObj.pathname !== '/';
    } catch {
      return false;
    }
  }

  /**
   * Extracts page username from Facebook URL
   * @param url - Facebook page URL
   * @returns page username or null if not found
   */
  static extractPageUsername(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Handle different Facebook URL formats
      const match = pathname.match(/^\/([^\/\?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  /**
   * Generates fallback profile picture URL
   * @param pageName - Page name for fallback
   * @returns fallback profile picture URL
   */
  static getFallbackProfilePicture(pageName: string): string {
    // Generate a simple avatar URL based on page name
    const firstLetter = pageName.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&background=1877f2&color=fff&size=128`;
  }

  private static async fetchFromFallback(
    facebookUrl: string,
    contextError?: string
  ): Promise<FacebookApiResponse | null> {
    if (!this.FALLBACK_API_URL) {
      return null;
    }

    try {
      const response = await fetch(this.FALLBACK_API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ facebookUrl })
      });

      if (!response.ok) {
        console.warn('Facebook fallback request failed', {
          status: response.status,
          statusText: response.statusText
        });
        return null;
      }

      const result = await response.json();

      if (!result?.success || !result?.data?.name) {
        console.warn('Facebook fallback returned error', {
          error: result?.error,
          contextError
        });
        return {
          success: false,
          error: result?.error || contextError || 'Fallback request failed'
        };
      }

      console.info('Facebook fallback succeeded', { method: result.method, contextError });
      return {
        success: true,
        data: result.data,
        method: result.method || 'fallback_api'
      };
    } catch (fallbackError) {
      console.error('Facebook fallback error', { fallbackError, contextError });
      return null;
    }
  }

  /**
   * Sanitizes Facebook page data for safe use in UI
   * @param data - Raw Facebook page data
   * @returns sanitized page data
   */
  static sanitizePageData(data: any): FacebookPageData {
    return {
      page_id: data.page_id || '',
      name: data.name || 'Unknown Page',
      profile_picture: data.image || data.profile_picture || this.getFallbackProfilePicture(data.name || 'Unknown'),
      cover_image: data.cover_image || '',
      categories: Array.isArray(data.categories) ? data.categories : [],
      intro: data.intro || '',
      instagram_url: data.instagram_url || '',
      instagram_details: data.instagram_details || null,
      verified: Boolean(data.verified),
      website: data.website || ''
    };
  }
}
