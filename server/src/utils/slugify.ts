import slugify from 'slugify'
import { supabase } from '../services/database.js'

/**
 * Generate a URL-safe slug from form name
 */
export function generateSlug(formName: string): string {
  return slugify(formName, {
    lower: true,
    strict: true,
    trim: true
  })
}

/**
 * Generate a unique slug for a form within a page
 * If slug exists, append -2, -3, etc.
 */
export async function generateUniqueSlug(
  pageId: string,
  formName: string,
  excludeFormId?: string
): Promise<string> {
  const baseSlug = generateSlug(formName)
  let slug = baseSlug
  let counter = 1

  while (true) {
    // Check if this slug already exists for this page
    let query = supabase
      .from('forms')
      .select('form_id')
      .eq('page_id', pageId)
      .eq('form_slug', slug)

    // If updating existing form, exclude it from the check
    if (excludeFormId) {
      query = query.neq('form_id', excludeFormId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Database error checking slug: ${error.message}`)
    }

    // If no existing form found with this slug, we can use it
    if (!data || data.length === 0) {
      return slug
    }

    // Try next variation
    counter++
    slug = `${baseSlug}-${counter}`
  }
}

/**
 * Extract Facebook username from URL
 */
export function extractFacebookUsername(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // Handle various Facebook URL formats
    if (urlObj.hostname.includes('facebook.com') || urlObj.hostname.includes('fb.com')) {
      const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0)

      if (pathParts.length > 0) {
        // Remove common prefixes like 'pages', 'profile.php', etc.
        const username = pathParts[pathParts.length - 1]

        // Skip numeric IDs and common paths
        if (!/^\d+$/.test(username) &&
            !['pages', 'profile.php', 'people'].includes(username)) {
          return username
        }
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Validate Facebook page ID format
 */
export function isValidFacebookPageId(pageId: string): boolean {
  // Facebook page IDs are typically numeric strings
  return /^\d+$/.test(pageId) && pageId.length >= 10 && pageId.length <= 20
}