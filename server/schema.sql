-- Meta Lead Form Builder Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pages table (one row per Facebook Page we've seen)
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,                       -- facebook page id (as string)
  username TEXT UNIQUE,                      -- page username from URL (e.g., 'openai'); nullable
  name TEXT,                                 -- display name (e.g., 'OpenAI')
  profile_picture TEXT,                      -- profile picture URL
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Forms table (forms belong to a page)
CREATE TABLE IF NOT EXISTS forms (
  form_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),              -- internal uuid
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  form_name TEXT NOT NULL,                   -- human name (e.g., 'Marketing Experts Promo 2025')
  form_slug TEXT NOT NULL,                   -- slugified: 'marketing-experts-promo-2025'
  spec_json JSONB NOT NULL,                  -- full spec (questions, logic, end pages, etc.)
  meta_preview JSONB,                        -- optional cached Meta-ready payload
  version INT NOT NULL DEFAULT 1,
  created_by TEXT,                           -- user id/email (for future use)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_page_slug UNIQUE (page_id, form_slug),           -- page can have multiple forms; each slug unique per page
  CONSTRAINT unique_page_name UNIQUE (page_id, form_name)            -- guard against duplicate names on same page
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_username ON pages(username);
CREATE INDEX IF NOT EXISTS idx_forms_page_id ON forms(page_id);
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(form_slug);
CREATE INDEX IF NOT EXISTS idx_forms_updated_at ON forms(updated_at DESC);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forms_updated_at ON forms;
CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Enable later when adding authentication
-- ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

-- For now, allow public access (will restrict later with auth)
-- CREATE POLICY "Allow public access to pages" ON pages FOR ALL USING (true);
-- CREATE POLICY "Allow public access to forms" ON forms FOR ALL USING (true);