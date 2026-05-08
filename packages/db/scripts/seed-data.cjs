const path = require('path')
const { config } = require('dotenv')
const postgres = require('postgres')

const envPath = path.resolve(__dirname, '../../../.env')
config({ path: envPath })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' })

const daysAgo = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

async function seed() {
  const email = process.env.DEV_USER_EMAIL || 'dev@camino.local'
  const name = process.env.DEV_USER_NAME || 'Dev User'

  const userRows = await sql`
    insert into users (email, name)
    values (${email}, ${name})
    on conflict (email) do update set name = excluded.name
    returning id
  `

  const userId = userRows[0]?.id

  const intentions = [
    {
      text: 'Por la paz mundial',
      isAnonymous: false,
      prayerCount: 3,
      createdAt: daysAgo(2),
      expiresAt: daysAgo(-5),
    },
    {
      text: 'Por mi familia',
      isAnonymous: false,
      prayerCount: 1,
      createdAt: daysAgo(1),
      expiresAt: daysAgo(-6),
    },
    {
      text: 'Por salud y trabajo',
      isAnonymous: true,
      prayerCount: 0,
      createdAt: daysAgo(0),
      expiresAt: daysAgo(-7),
    },
    {
      text: 'Por los jovenes',
      isAnonymous: true,
      prayerCount: 2,
      createdAt: daysAgo(3),
      expiresAt: daysAgo(-4),
    },
  ]

  for (const intention of intentions) {
    await sql`
      insert into prayer_intentions (
        user_id,
        is_anonymous,
        text,
        prayer_count,
        is_archived,
        created_at,
        expires_at
      ) values (
        ${intention.isAnonymous ? null : userId},
        ${intention.isAnonymous},
        ${intention.text},
        ${intention.prayerCount},
        false,
        ${intention.createdAt},
        ${intention.expiresAt}
      )
    `
  }

  const journalEntries = [
    {
      gospelDate: '2026-05-01',
      content: 'Reflexión breve sobre el Evangelio del día.',
      createdAt: daysAgo(3),
    },
    {
      gospelDate: '2026-05-02',
      content: 'Oración y agradecimiento por el día.',
      createdAt: daysAgo(2),
    },
    {
      gospelDate: '2026-05-03',
      content: 'Peticiones personales y esperanza.',
      createdAt: daysAgo(1),
    },
  ]

  for (const entry of journalEntries) {
    await sql`
      insert into journal_entries (
        user_id,
        gospel_date,
        content,
        created_at,
        updated_at
      ) values (
        ${userId},
        ${entry.gospelDate},
        ${entry.content},
        ${entry.createdAt},
        ${entry.createdAt}
      )
      on conflict (user_id, gospel_date)
      do update set content = excluded.content, updated_at = now()
    `
  }

  await sql.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
