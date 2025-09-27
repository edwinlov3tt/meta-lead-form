# Database Schema Documentation

## Overview

The Lead Spec application uses Supabase (PostgreSQL) as the database backend. This document outlines the complete database schema, relationships, and data structures used to store Meta Lead Forms and associated campaign data.

## Database Tables

### 1. `pages` Table

Stores Facebook page information used for lead form campaigns.

**Schema:**
```sql
CREATE TABLE pages (
  id TEXT PRIMARY KEY,                    -- Facebook Page ID
  username TEXT,                          -- Page username (e.g., @businessname)
  name TEXT,                             -- Display name of the page
  profile_picture TEXT,                  -- URL to profile picture
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**TypeScript Interface:**
```typescript
interface PagesTable {
  Row: {
    id: string                    // Facebook Page ID (primary key)
    username: string | null       // Page username
    name: string | null          // Page display name
    profile_picture: string | null // Profile picture URL
    created_at: string           // ISO timestamp
    updated_at: string           // ISO timestamp
  }
  Insert: {
    id: string                   // Required: Facebook Page ID
    username?: string | null
    name?: string | null
    profile_picture?: string | null
    created_at?: string          // Auto-generated if not provided
    updated_at?: string          // Auto-generated if not provided
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
```

### 2. `forms` Table

Stores complete Meta Lead Form configurations including campaign briefs and form specifications.

**Schema:**
```sql
CREATE TABLE forms (
  form_id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL REFERENCES pages(id),  -- Foreign key to pages table
  form_name TEXT NOT NULL,                     -- Campaign/Form name
  form_slug TEXT NOT NULL,                     -- URL-safe identifier
  spec_json JSONB NOT NULL,                    -- Complete form specification
  meta_preview JSONB,                          -- Preview configuration data
  version INTEGER DEFAULT 1,                  -- Schema version for migrations
  created_by TEXT,                            -- User identifier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**TypeScript Interface:**
```typescript
interface FormsTable {
  Row: {
    form_id: string              // UUID primary key
    page_id: string             // References pages.id
    form_name: string           // Form display name
    form_slug: string           // URL-safe identifier
    spec_json: any              // MetaCampaign JSON structure
    meta_preview: any | null    // Preview settings and state
    version: number             // Schema version (default: 1)
    created_by: string | null   // User identifier
    created_at: string          // ISO timestamp
    updated_at: string          // ISO timestamp
  }
  Insert: {
    form_id?: string            // Auto-generated UUID if not provided
    page_id: string            // Required: Must reference existing page
    form_name: string          // Required: Form name
    form_slug: string          // Required: URL slug
    spec_json: any             // Required: Complete MetaCampaign object
    meta_preview?: any | null
    version?: number           // Defaults to 1
    created_by?: string | null
    created_at?: string        // Auto-generated if not provided
    updated_at?: string        // Auto-generated if not provided
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
```

## Relationships

### Table Relationships
- `forms.page_id` → `pages.id` (Foreign Key)
  - Each form belongs to one Facebook page
  - One page can have multiple forms
  - Cascading deletes should be considered based on business logic

## JSON Schema Specifications

### `spec_json` Structure (MetaCampaign)

The `spec_json` field contains the complete campaign and form data structure:

```typescript
interface MetaCampaign {
  id: string                    // Campaign identifier
  name: string                 // Campaign name
  brief: PreFormBrief         // Campaign brief data
  form: MetaLeadForm          // Form builder data
  version: string             // Schema version
  createdAt: Date
  updatedAt: Date
}
```

#### PreFormBrief Structure
```typescript
interface PreFormBrief {
  id: string
  clientFacebookPage: string              // Facebook page URL
  facebookPageData?: FacebookPageData     // Fetched page info
  industry?: string                       // Business vertical
  campaignObjective: string               // Campaign goal description
  creativeFile?: {                        // Uploaded creative assets
    name: string
    size: number
    type: string
    data?: string                         // base64 encoded
  } | null
  monthlyLeadGoal: string                // Target lead volume
  formType: 'more_volume' | 'higher_intent' | 'rich_creative'
  hasAdminAccess: 'yes' | 'no' | 'pending'
  leadEmailAddresses: string             // Email distribution list
  isHealthRelated: boolean               // HIPAA compliance flag
  hasScreeningQuestions: boolean
  screeningQuestionSuggestions: string
  responseTime: {
    value: string
    unit: 'minutes' | 'hours'
  }
  hasPrivacyPolicy: 'yes' | 'no' | 'not_sure'
  privacyPolicyUrl: string
  clientWebsiteUrl?: string
  additionalNotes: string
  isComplete: boolean                    // Brief completion status
  createdAt: Date
  updatedAt: Date
}
```

#### MetaLeadForm Structure
```typescript
interface MetaLeadForm {
  id: string
  name: string                          // Form name (displayed in Ads Manager only)
  meta: MetaInfo                       // AI generation context
  formType: 'more_volume' | 'higher_intent' | 'rich_creative'
  intro: FormIntro                     // Form introduction section
  contactDescription: string           // Contact fields section description
  contactFields: ContactField[]        // Lead collection fields
  qualifiers: Qualifier[]             // Screening questions
  privacy: Privacy                    // Privacy policy and consents
  thankYou: ThankYou                 // Post-submission experience
  createdAt: Date
  updatedAt: Date
}
```

#### Supporting Data Structures

**Contact Fields:**
```typescript
interface ContactField {
  id: string
  name: string
  type: 'email' | 'phone' | 'text' | 'first_name' | 'last_name' | 'full_name' | 'street_address' | 'city' | 'state' | 'zip_code'
  required: boolean
  placeholder: string
  autofill: boolean                    // Enable Facebook autofill
  order: number                       // Display order
}
```

**Qualifier Questions:**
```typescript
interface Qualifier {
  id: string
  question: string
  type: 'multiple_choice' | 'short_text' | 'conditional' | 'appointment_request' | 'dropdown'
  options?: string[]                  // For multiple choice questions
  required: boolean
  order: number
  conditional?: ConditionalRule       // Conditional logic rules
  allowMultipleResponses?: boolean    // For multiple choice
  confirmationMessage?: string        // Custom confirmation text
  showConfirmationMessage?: boolean
}
```

**Privacy Configuration:**
```typescript
interface Privacy {
  businessPrivacyUrl: string          // Required privacy policy URL
  customNotices: {
    title: string
    disclaimerText: string
    consents: Array<{                 // Custom consent checkboxes
      id: string
      label: string
      optional: boolean
    }>
  }
}
```

**Thank You Page:**
```typescript
interface ThankYou {
  headline: string
  description: string
  action: {
    type: 'website' | 'phone' | 'whatsapp' | 'download'
    label: string                     // Button text
    websiteUrl?: string
    phoneNumber?: string
    whatsappNumber?: string
    downloadUrl?: string
  }
}
```

### `meta_preview` Structure

The `meta_preview` field stores preview-specific data and UI state:

```typescript
interface MetaPreview {
  currentStep: number                   // Active preview step
  previewSteps: Array<{                // Step configuration
    id: string
    title: string
    component: 'intro' | 'questions' | 'contact' | 'privacy' | 'review' | 'thankyou'
  }>
  frictionScore: {                     // Calculated friction metrics
    total: number
    breakdown: {
      requiredFields: number
      qualifyingQuestions: number
      customConsents: number
    }
    level: 'low' | 'medium' | 'high'
    recommendations: string[]
  }
  validation: {                        // Form validation state
    isValid: boolean
    errors: Array<{
      field: string
      message: string
    }>
    warnings: Array<{
      field: string
      message: string
    }>
  }
}
```

## Indexes

Recommended indexes for optimal query performance:

```sql
-- Primary indexes (automatically created)
CREATE UNIQUE INDEX pages_pkey ON pages(id);
CREATE UNIQUE INDEX forms_pkey ON forms(form_id);

-- Foreign key indexes
CREATE INDEX forms_page_id_idx ON forms(page_id);

-- Query optimization indexes
CREATE INDEX forms_form_slug_idx ON forms(form_slug);
CREATE INDEX forms_created_at_idx ON forms(created_at DESC);
CREATE INDEX forms_updated_at_idx ON forms(updated_at DESC);

-- JSONB indexes for spec_json queries
CREATE INDEX forms_spec_json_name_idx ON forms USING GIN ((spec_json->'name'));
CREATE INDEX forms_spec_json_brief_complete_idx ON forms USING GIN ((spec_json->'brief'->'isComplete'));
```

## Security Considerations

### Row Level Security (RLS)

Supabase RLS policies should be implemented to ensure proper data access:

```sql
-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on authentication strategy)
CREATE POLICY "Users can read their own pages" ON pages
  FOR SELECT USING (auth.uid()::text = created_by);

CREATE POLICY "Users can read their own forms" ON forms
  FOR SELECT USING (auth.uid()::text = created_by);
```

### Data Validation

- `page_id` must reference a valid Facebook page
- `form_slug` should be unique within the application
- `spec_json` should conform to MetaCampaign schema
- Email addresses in `leadEmailAddresses` should be validated
- URLs should be validated for proper format

## Migration Strategy

### Version Management

The `version` field in the `forms` table enables schema evolution:

1. **Version 1**: Initial implementation
2. **Future versions**: Add migration logic based on version number

### Backup Recommendations

- Regular automated backups of complete database
- Point-in-time recovery capability
- Export critical `spec_json` data for external backup
- Monitor `updated_at` timestamps for incremental backups

## Usage Examples

### Creating a New Form
```typescript
// Insert new page (if not exists)
const { data: page } = await supabase
  .from('pages')
  .upsert({
    id: facebookPageId,
    name: pageData.name,
    username: pageData.username,
    profile_picture: pageData.profile_picture
  });

// Create form with complete MetaCampaign data
const { data: form } = await supabase
  .from('forms')
  .insert({
    page_id: facebookPageId,
    form_name: campaignName,
    form_slug: generateSlug(campaignName),
    spec_json: metaCampaignData,
    created_by: userId
  });
```

### Querying Forms with Brief Status
```typescript
const { data: incompleteForms } = await supabase
  .from('forms')
  .select('*')
  .eq('spec_json->brief->isComplete', false);
```

### Updating Form Configuration
```typescript
const { data } = await supabase
  .from('forms')
  .update({
    spec_json: updatedMetaCampaign,
    meta_preview: updatedPreviewState,
    updated_at: new Date().toISOString()
  })
  .eq('form_id', formId);
```

## Performance Considerations

- Use JSONB for structured data with indexing support
- Implement connection pooling for high-concurrency scenarios
- Monitor query performance with `EXPLAIN ANALYZE`
- Consider read replicas for reporting/analytics queries
- Implement caching for frequently accessed form configurations

---

*This documentation reflects the current schema as of the latest version. Update this document when making schema changes.*