const path = require('path')
const { config } = require('dotenv')
const postgres = require('postgres')

const envPath = path.resolve(__dirname, '../../../.env')
config({ path: envPath })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' })

async function main() {
  const before = await sql`
    select count(*)::int as count
    from prayer_intentions
    where text like ${'%�%'}
  `
  console.log(`[repair-intentions-encoding] rows_with_replacement_char_before=${before[0]?.count ?? 0}`)

  const updated = await sql`
    update prayer_intentions
    set text = regexp_replace(
      regexp_replace(
        regexp_replace(text, 'intenci�n', 'intención', 'gi'),
        'oraci�n', 'oración', 'gi'
      ),
      '\\s{2,}', ' ', 'g'
    )
    where text like ${'%�%'}
    returning id
  `
  console.log(`[repair-intentions-encoding] updated_rows=${updated.length}`)

  const after = await sql`
    select id, text
    from prayer_intentions
    where text like ${'%�%'}
    order by created_at desc
    limit 50
  `

  if (after.length) {
    console.log('[repair-intentions-encoding] remaining_rows_sample=')
    for (const row of after) {
      console.log(`- ${row.id}: ${row.text}`)
    }
    process.exitCode = 2
  } else {
    console.log('[repair-intentions-encoding] ok_no_remaining_rows')
  }

  await sql.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

