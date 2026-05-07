import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
import path from 'path'

const envPath = process.env.DOTENV_CONFIG_PATH
  || path.resolve(process.cwd(), '../../.env')
config({ path: envPath })

export default defineConfig({
  // SQLite doesn't support schemas, so this is for PostgreSQL only
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/camino_dev',
  },
  // Verbose logging for debugging
  verbose: true,
  // Strict mode: warn on potentially unsafe migrations
  strict: true,
})
