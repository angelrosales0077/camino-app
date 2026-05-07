/**
 * @camino/backend - Prayer Intentions Routes
 * POST /api/intentions - Create prayer intention
 * GET /api/intentions - Get prayer intentions (paginated)
 * POST /api/intentions/:id/pray - Record prayer for intention
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { and, asc, desc, eq, gt, sql } from 'drizzle-orm'
import { getDb, prayerIntentions, prayerResponses, users, type PrayerIntention, type PrayerResponse } from '@camino/db'
import type { ApiResponse, PaginatedResponse, PrayerIntentionFeedItem } from '@camino/shared'
import { getCurrentUserId, requireCurrentUserId } from '../lib/auth.js'

const app = new Hono()

function repairText(value: string) {
  let repaired = value

  // Narrow repair for a known corrupted variant reported in intentions.
  repaired = repaired.replace(/intenci!0on/gi, 'intención')
  repaired = repaired.replace(/intenci�n/gi, 'intención')
  repaired = repaired.replace(/oraci�n/gi, 'oración')

  // Normalize obvious spacing artifacts.
  repaired = repaired.replace(/\s{2,}/g, ' ').trim()

  return repaired
}

// const db = getDb()

// POST /api/intentions
app.post('/',
  zValidator('json', z.object({
    text: z.string().min(1).max(200),
    isAnonymous: z.boolean().optional()
  })),
  async (c) => {
    const body = c.req.valid('json')
    const text = repairText(body.text)

    // Replacement character indicates encoding corruption. Avoid persisting it.
    if (text.includes('�')) {
      const message = process.env.NODE_ENV === 'development'
        ? 'El texto contiene caracteres corruptos (�). Revisá el encoding del cliente o limpiá los datos viejos.'
        : 'El texto contiene caracteres invalidos.'
      return c.json({ success: false, error: message } satisfies ApiResponse<PrayerIntention>, 400)
    }

    const db = getDb()
    const userId = await requireCurrentUserId(c)
    if (!userId) {
      return c.json({ success: false, error: 'Unauthorized' } satisfies ApiResponse<PrayerIntention>, 401)
    }

    const activeCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(prayerIntentions)
      .where(and(
        eq(prayerIntentions.userId, userId),
        eq(prayerIntentions.isArchived, false),
        gt(prayerIntentions.expiresAt, new Date())
      ))

    if (Number(activeCountResult[0]?.count ?? 0) >= 3) {
      return c.json({ success: false, error: 'Ya tenés tres intenciones activas.' } satisfies ApiResponse<PrayerIntention>, 409)
    }

    const [newIntention] = await db
      .insert(prayerIntentions)
      .values({
        userId,
        isAnonymous: body.isAnonymous || false,
        text,
        prayerCount: 0,
        isArchived: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning()

    const response: ApiResponse<PrayerIntention> = {
      success: true,
      data: newIntention
    }

    return c.json(response, 201)
  }
)

// GET /api/intentions (paginated)
app.get('/', async (c) => {
  const currentUserId = await getCurrentUserId(c)
  const page = Number(c.req.query('page')) || 1
  const limit = Number(c.req.query('limit')) || 10
  const db = getDb()
  const offset = (page - 1) * limit
  const now = new Date()

  const conditions = and(
    eq(prayerIntentions.isArchived, false),
    gt(prayerIntentions.expiresAt, now)
  )

  const intentions = await db
    .select({
      id: prayerIntentions.id,
      userId: prayerIntentions.userId,
      isAnonymous: prayerIntentions.isAnonymous,
      text: prayerIntentions.text,
      prayerCount: prayerIntentions.prayerCount,
      isArchived: prayerIntentions.isArchived,
      createdAt: prayerIntentions.createdAt,
      expiresAt: prayerIntentions.expiresAt,
      authorName: users.name,
    })
    .from(prayerIntentions)
    .leftJoin(users, eq(prayerIntentions.userId, users.id))
    .where(conditions)
    .orderBy(asc(prayerIntentions.prayerCount), desc(prayerIntentions.createdAt))
    .limit(limit)
    .offset(offset)

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(prayerIntentions)
    .where(conditions)

  const total = Number(totalResult[0]?.count ?? 0)

  let prayedIds = new Set<string>()
  if (currentUserId && intentions.length > 0) {
    const responses = await db
      .select({ intentionId: prayerResponses.intentionId })
      .from(prayerResponses)
      .where(eq(prayerResponses.userId, currentUserId))

    prayedIds = new Set(responses.map((item) => item.intentionId))
  }

  const items: PrayerIntentionFeedItem[] = intentions.map((item) => ({
    ...item,
    text: repairText(item.text),
    authorName: item.isAnonymous ? null : item.authorName,
    hasPrayed: prayedIds.has(item.id),
  }))

  const response: ApiResponse<PaginatedResponse<PrayerIntentionFeedItem>> = {
    success: true,
    data: {
      items,
      total,
      page,
      pageSize: limit,
      hasNextPage: page * limit < total
    }
  }

  return c.json(response)
})

// POST /api/intentions/:id/pray
app.post('/:id/pray', async (c) => {
  const id = c.req.param('id')
  const db = getDb()
  const intention = await db
    .select({ id: prayerIntentions.id })
    .from(prayerIntentions)
    .where(eq(prayerIntentions.id, id))
    .limit(1)

  if (intention.length === 0) {
    return c.json({ error: 'Prayer intention not found' }, 404)
  }

  const userId = await requireCurrentUserId(c)
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' } satisfies ApiResponse<PrayerResponse>, 401)
  }

  const inserted = await db
    .insert(prayerResponses)
    .values({ intentionId: id, userId })
    .onConflictDoNothing()
    .returning()

  let responseRow: PrayerResponse | null = inserted[0] || null
  if (!responseRow) {
    const existing = await db
      .select()
      .from(prayerResponses)
      .where(and(eq(prayerResponses.intentionId, id), eq(prayerResponses.userId, userId)))
      .limit(1)

    responseRow = existing[0] || null
  }

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(prayerResponses)
    .where(eq(prayerResponses.intentionId, id))

  const prayerCount = countResult[0]?.count ?? 0

  await db
    .update(prayerIntentions)
    .set({ prayerCount })
    .where(eq(prayerIntentions.id, id))

  if (!responseRow) {
    return c.json({ error: 'Prayer response not found' }, 500)
  }

  const response: ApiResponse<PrayerResponse> = {
    success: true,
    data: responseRow,
  }

  return c.json(response)
})

export { app as intentionRoutes }
