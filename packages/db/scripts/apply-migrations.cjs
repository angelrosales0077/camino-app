const fs = require('fs')
const path = require('path')
const { config } = require('dotenv')
const postgres = require('postgres')

const envPath = path.resolve(__dirname, '../../../.env')
config({ path: envPath })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' })

const migrationsDir = path.resolve(__dirname, '../migrations')
const files = fs.readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()

async function apply() {
  for (const file of files) {
    const fullPath = path.join(migrationsDir, file)
    const raw = fs.readFileSync(fullPath, 'utf8')
    const statements = raw
      .split('--> statement-breakpoint')
      .map((stmt) => stmt.trim())
      .filter(Boolean)

    if (statements.length === 0) {
      continue
    }

    await sql.begin(async (tx) => {
      for (const stmt of statements) {
        await tx.unsafe(stmt)
      }
    })
  }

  await sql.end()
}

apply().catch((err) => {
  console.error(err)
  process.exit(1)
})
