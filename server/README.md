# Meta Lead Form Builder - Backend API

## Quick Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new Supabase project at https://supabase.com
   - Go to SQL Editor and run the schema from `schema.sql`
   - Get your project URL and service role key from Settings > API

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual keys
   ```

4. **Get OpenAI API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Add it to your `.env` file

5. **Start the server**:
   ```bash
   npm run dev
   ```

The server will start on http://localhost:3001

## API Endpoints

### Pages
- `POST /api/pages/resolve` - Resolve Facebook page by URL or ID
-
### Forms
- `GET /api/forms?query={page_id_or_username}` - List forms for a page
- `POST /api/forms` - Create/update form
- `GET /api/forms/:pageKey/:formSlug` - Get specific form
- `PUT /api/forms/:form_id` - Update form
- `DELETE /api/forms/:form_id` - Delete form
- `GET /api/forms/:form_id/export` - Export form

### AI
- `POST /api/generate-questions` - Generate questions from campaign brief
- `GET /api/ai/health` - Check AI service status

### Health
- `GET /health` - Server health check

## Environment Variables

```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173

# AI Service
OPENAI_API_KEY=your_openai_api_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Schema

The database has two main tables:
- `pages` - Facebook page information
- `forms` - Form specifications with versioning

See `schema.sql` for the complete schema.

## AI Question Generation

The AI service takes campaign brief data and generates relevant qualifying questions:

```json
{
  "objective": "Get leads for home renovation services",
  "industry": "Home Services",
  "priority": "balanced",
  "tone": "friendly and professional",
  "audience": "homeowners planning renovations"
}
```

Returns structured questions ready for the form builder.

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server