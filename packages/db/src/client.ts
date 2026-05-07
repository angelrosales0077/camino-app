/**
 * @camino/db - Database Client
 * Initialization and connection management for Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

/**
 * Create a PostgreSQL connection pool
 * For production, this should use a connection pool manager
 * (e.g., pgBouncer or similar)
 */
function createQueryClient() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. Please configure your database connection.'
    )
  }

  return postgres(databaseUrl, {
    prepare: false, // Disable prepared statements for edge-compatible scenarios
  })
}

/**
 * Initialize Drizzle ORM with schema and relations
 */
let db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!db) {
    const queryClient = createQueryClient()
    db = drizzle(queryClient, {
      schema,
      logger: process.env.NODE_ENV === 'development',
    })
  }
  return db
}

// For direct schema access
export { schema }
