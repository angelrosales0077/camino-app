/**
 * @camino/backend - Streak Routes
 * GET /api/streak - Get user's current prayer streak
 * POST /api/streak/checkin - Record daily prayer check-in
 */

import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDb, streaks, type Streak } from '@camino/db'
import type { ApiResponse } from '@camino/shared'
import { requireCurrentUserId } from '../lib/auth.js'

const app = new Hono()

const toDateString = (date: Date) => date.toISOString().split('T')[0]

// GET /api/streak
app.get('/', async (c) => {
  const db = getDb()
  const userId = await requireCurrentUserId(c)
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' } satisfies ApiResponse<Streak>, 401)
  }
  const existing = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1)

  const streak = existing.length
    ? existing[0]
    : (
        await db
          .insert(streaks)
          .values({ userId })
          .returning()
      )[0]

  const response: ApiResponse<Streak> = {
    success: true,
    data: streak,
  }

  return c.json(response)
})

// POST /api/streak/checkin
app.post('/checkin', async (c) => {
  const db = getDb()
  const userId = await requireCurrentUserId(c)
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' } satisfies ApiResponse<Streak>, 401)
  }
  const today = toDateString(new Date())
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = toDateString(yesterdayDate)

  const existing = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1)

  let streak = existing.length
    ? existing[0]
    : (
        await db
          .insert(streaks)
          .values({ userId })
          .returning()
      )[0]

  let currentCount = streak.currentCount
  if (streak.lastActiveDate === today) {
    currentCount = streak.currentCount
  } else if (streak.lastActiveDate === yesterday) {
    currentCount = streak.currentCount + 1
  } else {
    currentCount = 1
  }

  const longestCount = Math.max(streak.longestCount, currentCount)

  const updated = await db
    .update(streaks)
    .set({
      currentCount,
      longestCount,
      lastActiveDate: today,
      updatedAt: new Date(),
      graceDaysUsedThisWeek: streak.graceDaysUsedThisWeek,
    })
    .where(eq(streaks.userId, userId))
    .returning()

  streak = updated[0]

  const response: ApiResponse<Streak> = {
    success: true,
    data: streak,
  }

  return c.json(response)
})

export { app as streakRoutes }
