/**
 * @camino/backend - Breviary Routes
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type {
  ApiResponse,
  BreviaryDay,
  BreviaryHour,
  BreviaryHourKey,
} from '@camino/shared'
import { breviaryProvider } from '../lib/breviary.js'

const app = new Hono()

const hourSchema = z.enum([
  'office-of-readings',
  'lauds',
  'terce',
  'sext',
  'none',
  'vespers',
  'compline',
])

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const getToday = () => new Date().toISOString().split('T')[0]

app.get('/today', async (c) => {
  try {
    const date = getToday()
    const data = await breviaryProvider.getDay(date)
    const response: ApiResponse<BreviaryDay> = {
      success: true,
      data,
    }
    return c.json(response)
  } catch {
    return c.json(
      {
        success: false,
        error: 'No se pudo cargar el Breviario.',
      } satisfies ApiResponse<BreviaryDay>,
      502
    )
  }
})

app.get(
  '/:date',
  zValidator('param', z.object({ date: dateSchema })),
  async (c) => {
    try {
      const { date } = c.req.valid('param')
      const data = await breviaryProvider.getDay(date)
      const response: ApiResponse<BreviaryDay> = {
        success: true,
        data,
      }
      return c.json(response)
    } catch {
      return c.json(
        {
          success: false,
          error: 'No se pudo cargar el Breviario.',
        } satisfies ApiResponse<BreviaryDay>,
        502
      )
    }
  }
)

app.get(
  '/:date/:hour',
  zValidator('param', z.object({ date: dateSchema, hour: hourSchema })),
  async (c) => {
    try {
      const { date, hour } = c.req.valid('param')
      const data = await breviaryProvider.getHour(
        date,
        hour as BreviaryHourKey
      )
      const response: ApiResponse<BreviaryHour> = {
        success: true,
        data,
      }
      return c.json(response)
    } catch {
      return c.json(
        {
          success: false,
          error: 'No se pudo cargar esta hora del Breviario.',
        } satisfies ApiResponse<BreviaryHour>,
        502
      )
    }
  }
)

export { app as breviaryRoutes }
