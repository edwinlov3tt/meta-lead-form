export interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string
          username: string | null
          name: string | null
          profile_picture: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          name?: string | null
          profile_picture?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          name?: string | null
          profile_picture?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      forms: {
        Row: {
          form_id: string
          page_id: string
          form_name: string
          form_slug: string
          spec_json: any
          meta_preview: any | null
          version: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          form_id?: string
          page_id: string
          form_name: string
          form_slug: string
          spec_json: any
          meta_preview?: any | null
          version?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          form_id?: string
          page_id?: string
          form_name?: string
          form_slug?: string
          spec_json?: any
          meta_preview?: any | null
          version?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}