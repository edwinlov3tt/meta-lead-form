import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../services/database.js'
import { extractFacebookUsername, isValidFacebookPageId } from '../utils/slugify.js'

const router = Router()

// Schema for page resolution request
const PageResolveSchema = z.object({
  page_url: z.string().url().optional(),
  page_id: z.string().optional(),
  name: z.string().optional(),
  profile_picture: z.string().url().optional()
}).refine(data => data.page_url || data.page_id, {
  message: "Either page_url or page_id must be provided"
})

/**
 * POST /api/pages/resolve
 * Accept either URL (facebook.com/{username}) or page_id. Create/upsert pages row.
 */
router.post('/resolve', async (req, res) => {
  try {
    const body = PageResolveSchema.parse(req.body)

    let pageId: string
    let username: string | null = null
    let name = body.name || null
    let profilePicture = body.profile_picture || null

    if (body.page_id) {
      // Direct page ID provided
      if (!isValidFacebookPageId(body.page_id)) {
        return res.status(400).json({
          error: 'Invalid Facebook page ID format'
        })
      }
      pageId = body.page_id
    } else if (body.page_url) {
      // Extract info from URL
      username = extractFacebookUsername(body.page_url)

      // Try to extract numeric ID from URL if present
      const urlObj = new URL(body.page_url)
      const pathMatch = urlObj.pathname.match(/\/(\d+)/)

      if (pathMatch && isValidFacebookPageId(pathMatch[1])) {
        pageId = pathMatch[1]
      } else if (username) {
        // For now, use username as ID if we can't find numeric ID
        // In real implementation, you'd call Facebook API to resolve
        pageId = `username_${username}`

        // Check if we already have this username in database
        const { data: existingPage } = await supabase
          .from('pages')
          .select('id')
          .eq('username', username)
          .single()

        if (existingPage) {
          pageId = existingPage.id
        }
      } else {
        return res.status(400).json({
          error: 'Could not extract page information from URL'
        })
      }
    } else {
      return res.status(400).json({
        error: 'Either page_url or page_id must be provided'
      })
    }

    // Upsert page record
    const { data, error } = await supabase
      .from('pages')
      .upsert({
        id: pageId,
        username,
        name,
        profile_picture: profilePicture,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
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

    return res.json({
      page_id: data.id,
      username: data.username,
      name: data.name,
      profile_picture: data.profile_picture
    })

  } catch (error) {
    console.error('Page resolve error:', error)

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

export default router