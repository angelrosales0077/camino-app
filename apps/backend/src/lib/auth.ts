/**
 * @camino/backend - Request auth helper
 * Uses Supabase Auth when a bearer token is present.
 */

import type { Context } from 'hono'
import { getDb, users } from '@camino/db'
import { getDevUserId } from './devUser.js'

interface SupabaseUserPayload {
  id?: string
  email?: string
  user_metadata?: {
    name?: string
    full_name?: string
  }
}

function getBearerToken(c: Context) {
  const header = c.req.header('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1] || null
}

function isDevelopment() {
  return process.env.NODE_ENV !== 'production'
}

async function verifySupabaseUser(token: string): Promise<SupabaseUserPayload | null> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseKey,
      authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return null
  }

  return await response.json() as SupabaseUserPayload
}

async function ensureLocalUser(authUser: SupabaseUserPayload) {
  if (!authUser.id || !authUser.email) {
    return null
  }

  const db = getDb()
  const name =
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    authUser.email.split('@')[0]

  const [user] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email: authUser.email,
      name,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { name },
    })
    .returning({ id: users.id })

  return user?.id || null
}

export async function getCurrentUserId(c: Context) {
  const token = getBearerToken(c)

  if (token) {
    const authUser = await verifySupabaseUser(token)
    const userId = authUser ? await ensureLocalUser(authUser) : null
    if (userId) {
      return userId
    }
  }

  if (isDevelopment()) {
    return getDevUserId()
  }

  return null
}

export async function requireCurrentUserId(c: Context) {
  const userId = await getCurrentUserId(c)
  if (!userId) {
    return null
  }
  return userId
}
