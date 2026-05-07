/**
 * @camino/backend - Dev user helper
 * Temporary until auth is implemented
 */

import { getDb, users } from '@camino/db'
import { eq } from 'drizzle-orm'

let cachedUserId: string | null = null

export async function getDevUserId() {
  if (cachedUserId) {
    return cachedUserId
  }

  const db = getDb()
  const email = process.env.DEV_USER_EMAIL || 'dev@camino.local'
  const name = process.env.DEV_USER_NAME || 'Dev User'

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing.length > 0) {
    cachedUserId = existing[0].id
    return cachedUserId
  }

  const created = await db
    .insert(users)
    .values({ email, name })
    .returning({ id: users.id })

  cachedUserId = created[0].id
  return cachedUserId
}
