/**
 * @camino/backend - Hono API Server
 * REST API for Camino mobile app
 */

import { config } from 'dotenv'
import path from 'path'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const envPath = process.env.DOTENV_CONFIG_PATH
  || path.resolve(process.cwd(), '../../.env')
config({ path: envPath })

// Routes
import { gospelRoutes } from './routes/gospel.js'
import { liturgyRoutes } from './routes/liturgy.js'
import { journalRoutes } from './routes/journal.js'
import { streakRoutes } from './routes/streak.js'
import { intentionRoutes } from './routes/intentions.js'
import { breviaryRoutes } from './routes/breviary.js'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API routes
app.route('/api/gospel', gospelRoutes)
app.route('/api/liturgy', liturgyRoutes)
app.route('/api/journal', journalRoutes)
app.route('/api/streak', streakRoutes)
app.route('/api/intentions', intentionRoutes)
app.route('/api/breviary', breviaryRoutes)

// 404 handler
app.notFound((c) => c.json({ error: 'Not Found', path: c.req.path }, 404))

const port = Number(process.env.PORT ?? 3100)

console.log(`Camino Backend API running on http://0.0.0.0:${port}`)

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
})
