/**
 * @camino/backend - Daily Mass Readings Routes
 * GET /api/readings/:date - Get structured daily Mass readings.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { ApiResponse, DailyReadingsResponse } from '@camino/shared'
import { fetchExternalReadings } from '../lib/external.js'

const app = new Hono()

const getToday = () => new Date().toISOString().split('T')[0]

const buildFallbackReadings = (date: string): DailyReadingsResponse => ({
  date,
  liturgicalDayName: 'Lecturas del día',
  season: 'ordinary',
  readings: [],
  commentary: null,
})

async function buildDailyReadings(date: string) {
  return await fetchExternalReadings(date) || buildFallbackReadings(date)
}

app.get('/today', async (c) => {
  const date = getToday()
  const readings = await buildDailyReadings(date)

  const response: ApiResponse<DailyReadingsResponse> = {
    success: true,
    data: readings,
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
    const readings = await buildDailyReadings(date)

    const response: ApiResponse<DailyReadingsResponse> = {
      success: true,
      data: readings,
    }

    return c.json(response)
  }
)

export { app as readingsRoutes }
