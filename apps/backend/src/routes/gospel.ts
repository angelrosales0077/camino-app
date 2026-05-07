/**
 * @camino/backend - Gospel Routes
 * GET /api/gospel/:date - Get gospel reading for specific date
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { GospelEntry, ApiResponse } from '@camino/shared'
import { fetchExternalGospel } from '../lib/external.js'

const app = new Hono()

// Mock gospel data (replace with real API/database later)
const mockGospel: Record<string, GospelEntry> = {
  '2024-12-25': {
    date: '2024-12-25',
    reference: 'Juan 1, 1-18',
    text: 'En el principio existía la Palabra...',
    shortQuote: 'La Palabra se hizo carne y habitó entre nosotros.',
    patristicComment: null
  },
  '2024-12-24': {
    date: '2024-12-24',
    reference: 'Isaías 9, 1-6',
    text: 'El pueblo que caminaba en tinieblas vio una gran luz...',
    shortQuote: 'Cristo es la luz del mundo.',
    patristicComment: null
  }
}

const getToday = () => new Date().toISOString().split('T')[0]

const buildFallbackGospel = (date: string): GospelEntry => ({
  date,
  reference: 'Juan 15, 1-8',
  text: 'Permanezcan en mi amor... (Mock)',
  shortQuote: 'Yo soy la vid, ustedes los sarmientos. (Mock)',
  patristicComment: null,
})

// GET /api/gospel/today
app.get('/today', async (c) => {
  const date = getToday()
  const external = await fetchExternalGospel(date)
  const gospel = external || mockGospel[date] || buildFallbackGospel(date)

  const response: ApiResponse<GospelEntry> = {
    success: true,
    data: gospel,
  }

  return c.json(response)
})

// GET /api/gospel/:date
app.get('/:date',
  zValidator('param', z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  })),
  async (c) => {
    const { date } = c.req.valid('param')

    const external = await fetchExternalGospel(date)
    const gospel = external || mockGospel[date] || buildFallbackGospel(date)
    const response: ApiResponse<GospelEntry> = {
      success: true,
      data: gospel,
    }

    return c.json(response)
  }
)

export { app as gospelRoutes }
