/**
 * Domain Sanitization and URL Utilities
 * For privacy policy checker and URL validation
 */

import { useState, useCallback } from 'react';

export interface SanitizedDomain {
  domain: string;
  originalUrl: string;
  isValid: boolean;
  error?: string;
}

export class DomainSanitizer {

  /**
   * Sanitizes and validates a domain/URL input
   * Removes protocols, www prefixes, trailing slashes, query parameters
   * @param input - Raw URL or domain input from user
   * @returns SanitizedDomain object with cleaned domain and validation info
   */
  static sanitizeDomain(input: string): SanitizedDomain {
    if (!input || typeof input !== 'string') {
      return {
        domain: '',
        originalUrl: input || '',
        isValid: false,
        error: 'Please enter a valid domain or URL'
      };
    }

    const trimmedInput = input.trim();

    if (trimmedInput.length === 0) {
      return {
        domain: '',
        originalUrl: trimmedInput,
        isValid: false,
        error: 'Please enter a valid domain or URL'
      };
    }

    try {
      let processedUrl = trimmedInput;

      // Add protocol if missing for URL parsing
      if (!processedUrl.match(/^https?:\/\//i)) {
        processedUrl = `https://${processedUrl}`;
      }

      const urlObj = new URL(processedUrl);
      let domain = urlObj.hostname.toLowerCase();

      // Remove www prefix
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }

      // Basic domain validation
      if (!this.isValidDomainFormat(domain)) {
        return {
          domain: '',
          originalUrl: trimmedInput,
          isValid: false,
          error: 'Please enter a valid domain name'
        };
      }

      return {
        domain,
        originalUrl: trimmedInput,
        isValid: true
      };

    } catch (error) {
      return {
        domain: '',
        originalUrl: trimmedInput,
        isValid: false,
        error: 'Please enter a valid domain or URL format'
      };
    }
  }

  /**
   * Validates if a string is a properly formatted domain
   * @param domain - Domain string to validate
   * @returns boolean indicating if domain format is valid
   */
  private static isValidDomainFormat(domain: string): boolean {
    // Basic domain regex - allows for subdomains and common TLDs
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

    return domainRegex.test(domain) &&
           domain.length >= 4 &&
           domain.length <= 253 &&
           !domain.includes('..');
  }

  /**
   * Constructs full URL for privacy policy checking
   * @param domain - Sanitized domain name
   * @returns Full URL with https protocol
   */
  static constructFullUrl(domain: string): string {
    return `https://${domain}`;
  }

  /**
   * Generates common privacy policy URLs to check
   * @param domain - Sanitized domain name
   * @returns Array of common privacy policy URLs
   */
  static generatePrivacyPolicyUrls(domain: string): string[] {
    const baseUrl = `https://${domain}`;
    return [
      `${baseUrl}/privacy-policy`,
      `${baseUrl}/privacy`,
      `${baseUrl}/legal/privacy`,
      `${baseUrl}/legal/privacy-policy`,
      `${baseUrl}/policies/privacy`,
      `${baseUrl}/terms-privacy`,
      `${baseUrl}/privacy-notice`,
      baseUrl // Let the API scan the main site
    ];
  }

  /**
   * Validates the format of privacy policy API URL
   * @param apiUrl - API endpoint URL
   * @returns boolean indicating if API URL is properly formatted
   */
  static isValidApiUrl(apiUrl: string): boolean {
    try {
      const url = new URL(apiUrl);
      return url.protocol === 'https:' && url.hostname.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Extracts domain from various URL formats for consistent processing
   * @param url - Any URL format
   * @returns Extracted and sanitized domain or null if invalid
   */
  static extractDomain(url: string): string | null {
    const result = this.sanitizeDomain(url);
    return result.isValid ? result.domain : null;
  }

  /**
   * Checks if two domains are the same (ignoring www and protocol)
   * @param domain1 - First domain to compare
   * @param domain2 - Second domain to compare
   * @returns boolean indicating if domains match
   */
  static domainsMatch(domain1: string, domain2: string): boolean {
    const sanitized1 = this.sanitizeDomain(domain1);
    const sanitized2 = this.sanitizeDomain(domain2);

    return sanitized1.isValid &&
           sanitized2.isValid &&
           sanitized1.domain === sanitized2.domain;
  }
}

/**
 * React hook for domain sanitization with real-time validation
 * @param initialValue - Initial domain value
 * @returns Object with current value, sanitized result, and setter function
 */
export function useDomainSanitization(initialValue: string = '') {
  const [rawValue, setRawValue] = useState(initialValue);
  const [sanitizedResult, setSanitizedResult] = useState<SanitizedDomain>(
    () => DomainSanitizer.sanitizeDomain(initialValue)
  );

  const updateValue = useCallback((newValue: string) => {
    setRawValue(newValue);
    const result = DomainSanitizer.sanitizeDomain(newValue);
    setSanitizedResult(result);
  }, []);

  return {
    rawValue,
    sanitizedResult,
    updateValue,
    isValid: sanitizedResult.isValid,
    domain: sanitizedResult.domain,
    error: sanitizedResult.error
  };
}

