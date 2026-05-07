/**
 * @camino/backend - Journal Routes
 * POST /api/journal - Create journal entry
 * GET /api/journal - Get user's journal entries (paginated)
 * GET /api/journal/:id - Get specific journal entry
 * PATCH /api/journal/:id - Update journal entry
 * DELETE /api/journal/:id - Delete journal entry
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { and, desc, eq, sql } from 'drizzle-orm'
import { getDb, journalEntries, type JournalEntry } from '@camino/db'
import type { ApiResponse, PaginatedResponse } from '@camino/shared'
import { requireCurrentUserId } from '../lib/auth.js'

const app = new Hono()

// const db = getDb() // Moved to handler execution

const unauthorized = <T>() =>
  ({ success: false, error: 'Unauthorized' } satisfies ApiResponse<T>)

// POST /api/journal
app.post('/',
  zValidator('json', z.object({
    gospelDate: z.string(),
    content: z.string().min(1)
  })),
  async (c) => {
    const body = c.req.valid('json')

    const db = getDb() // Moved here
    const userId = await requireCurrentUserId(c)
    if (!userId) {
      return c.json(unauthorized<JournalEntry>(), 401)
    }
    const [newEntry] = await db
      .insert(journalEntries)
      .values({
        userId,
        gospelDate: body.gospelDate,
        content: body.content,
      })
      .onConflictDoUpdate({
        target: [journalEntries.userId, journalEntries.gospelDate],
        set: {
          content: body.content,
          updatedAt: new Date(),
        },
      })
      .returning()

    const response: ApiResponse<JournalEntry> = {
      success: true,
      data: newEntry
    }

    return c.json(response, 201)
  }
)

// GET /api/journal (paginated)
app.get('/', async (c) => {
  const userId = await requireCurrentUserId(c)
  if (!userId) {
    return c.json(unauthorized<PaginatedResponse<JournalEntry>>(), 401)
  }
  const page = Number(c.req.query('page')) || 1
  const db = getDb() // Moved here
  const limit = Number(c.req.query('limit')) || 10
  const offset = (page - 1) * limit

  const entries = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.createdAt))
    .limit(limit)
    .offset(offset)

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))

  const total = Number(totalResult[0]?.count ?? 0)

  const response: ApiResponse<PaginatedResponse<JournalEntry>> = {
    success: true,
    data: {
      items: entries,
      total,
      page,
      pageSize: limit,
      hasNextPage: page * limit < total
    }
  }

  return c.json(response)
})

// GET /api/journal/:id
app.get('/:id', async (c) => {
  const userId = await requireCurrentUserId(c)
  if (!userId) {
    return c.json(unauthorized<JournalEntry>(), 401)
  }
  const id = c.req.param('id')
  const db = getDb() // Moved here
  const entry = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
    .limit(1)

  if (entry.length === 0) {
    return c.json({ error: 'Journal entry not found' }, 404)
  }

  const response: ApiResponse<JournalEntry> = {
    success: true,
    data: entry[0]
  }

  return c.json(response)
})

async function updateJournalEntry(
  id: string,
  userId: string,
  body: { content?: string }
) {
  const db = getDb()

  // TODO: enforce the planned 24h edit window once product policy is final.
  const updateValues: Partial<JournalEntry> = {
    updatedAt: new Date(),
  }

  if (body.content) {
    updateValues.content = body.content
  }

  return db
    .update(journalEntries)
    .set(updateValues)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
    .returning()
}

// PATCH /api/journal/:id
app.patch('/:id',
  zValidator('json', z.object({
    content: z.string().min(1).optional()
  })),
  async (c) => {
    const userId = await requireCurrentUserId(c)
    if (!userId) {
      return c.json(unauthorized<JournalEntry>(), 401)
    }
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const updated = await updateJournalEntry(id, userId, body)

    if (updated.length === 0) {
      return c.json({ error: 'Journal entry not found' }, 404)
    }

    const response: ApiResponse<JournalEntry> = {
      success: true,
      data: updated[0]
    }

    return c.json(response)
  }
)

// PUT /api/journal/:id kept for older clients.
app.put('/:id',
  zValidator('json', z.object({
    content: z.string().min(1).optional()
  })),
  async (c) => {
    const userId = await requireCurrentUserId(c)
    if (!userId) {
      return c.json(unauthorized<JournalEntry>(), 401)
    }
    const id = c.req.param('id')
    const body = c.req.valid('json')
    const updated = await updateJournalEntry(id, userId, body)

    if (updated.length === 0) {
      return c.json({ error: 'Journal entry not found' }, 404)
    }

    const response: ApiResponse<JournalEntry> = {
      success: true,
      data: updated[0]
    }

    return c.json(response)
  }
)

// DELETE /api/journal/:id
app.delete('/:id', async (c) => {
    const userId = await requireCurrentUserId(c)
    if (!userId) {
      return c.json(unauthorized<{ id: string }>(), 401)
    }
    const id = c.req.param('id')
  const db = getDb() // Moved here

    const deleted = await db
      .delete(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning({ id: journalEntries.id })

    if (deleted.length === 0) {
      return c.json({ error: 'Journal entry not found' }, 404)
    }

    return c.json({
      success: true,
      data: { id: deleted[0].id }
    } satisfies ApiResponse<{ id: string }>)
  }
)

export { app as journalRoutes }
