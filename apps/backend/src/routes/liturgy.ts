/**
 * @camino/backend - Liturgy Routes
 * GET /api/liturgy/:date - Get liturgical information for specific date
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { DailyLiturgy, ApiResponse } from '@camino/shared'
import { fetchExternalLiturgy } from '../lib/external.js'
import { fetchSantoralForDate } from '../lib/santoral.js'

const app = new Hono()

const mockLiturgy: Record<string, DailyLiturgy> = {
  '2024-12-25': {
    date: '2024-12-25',
    liturgicalDayName: 'Natividad del Señor',
    season: 'christmas',
    color: '#FFD700',
    saintOfDay: null,
    otherSaintsOfDay: [],
    celebrationName: 'Natividad del Señor',
    hasSaintOfDay: false,
  },
  '2024-12-24': {
    date: '2024-12-24',
    liturgicalDayName: 'Vigilia de Navidad',
    season: 'advent',
    color: '#800080',
    saintOfDay: null,
    otherSaintsOfDay: [],
    celebrationName: 'Vigilia de Navidad',
    hasSaintOfDay: false,
  },
}

const getToday = () => new Date().toISOString().split('T')[0]

const buildFallbackLiturgy = (date: string): DailyLiturgy => ({
  date,
  liturgicalDayName: 'Feria del Tiempo Ordinario',
  season: 'ordinary',
  color: '#2D5A3D',
  saintOfDay: null,
  otherSaintsOfDay: [],
  hasSaintOfDay: false,
})

async function buildDailyLiturgy(date: string) {
  const external = await fetchExternalLiturgy(date)
  const liturgy = external || mockLiturgy[date] || buildFallbackLiturgy(date)
  const santoral = await fetchSantoralForDate(date)

  return {
    ...liturgy,
    saintOfDay: santoral.primarySaint,
    otherSaintsOfDay: santoral.otherSaints,
    hasSaintOfDay: santoral.primarySaint !== null,
  }
}

app.get('/today', async (c) => {
  const date = getToday()
  const liturgy = await buildDailyLiturgy(date)

  const response: ApiResponse<DailyLiturgy> = {
    success: true,
    data: liturgy,
  }

  return c.json(response)
})

app.get(
  '/:date',
  zValidator(
    'param',
    z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    })
  ),
  async (c) => {
    const { date } = c.req.valid('param')
    const liturgy = await buildDailyLiturgy(date)

    const response: ApiResponse<DailyLiturgy> = {
      success: true,
      data: liturgy,
    }

    return c.json(response)
  }
)

export { app as liturgyRoutes }
