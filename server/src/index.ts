import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pagesRouter from './routes/pages.js'
import formsRouter from './routes/forms.js'
import aiRouter from './routes/ai.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
app.use('/api/pages', pagesRouter)
app.use('/api/forms', formsRouter)
app.use('/api', aiRouter)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Meta Lead Form Server running on port ${PORT}`)
  console.log(`📍 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`)
  console.log(`🤖 AI Service: ${process.env.OPENAI_API_KEY ? '✅ OpenAI configured' : '❌ No OpenAI key'}`)
  console.log(`💾 Database: ${process.env.SUPABASE_URL ? '✅ Supabase configured' : '❌ No Supabase config'}`)
})

export default app