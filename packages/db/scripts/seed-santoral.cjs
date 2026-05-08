const { config } = require('dotenv')
const path = require('path')
const postgres = require('postgres')

const envPath = path.resolve(__dirname, '../../../.env')
config({ path: envPath })

const dryRun = (process.env.SANTORAL_DRY_RUN || '').trim() === '1'

if (!dryRun && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = dryRun ? null : postgres(process.env.DATABASE_URL, { ssl: 'require' })
const year = Number(process.env.SANTORAL_YEAR || new Date().getFullYear())
const singleDate = (process.env.SANTORAL_DATE || '').trim()
const singleMonth = Number(process.env.SANTORAL_MONTH || '')
const singleDay = Number(process.env.SANTORAL_DAY || '')

function parseIsoDate(value) {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const y = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!y || month < 1 || month > 12 || day < 1 || day > 31) return null
  return { year: y, month, day }
}
const VATICAN_BASE_URL = 'https://www.vaticannews.va/es/santos'
const FANDOM_BASE_URL =
  'https://santoral.fandom.com/es/wiki/Santoral_Wiki:Artículo_del_día'
const FETCH_TIMEOUT_MS = 7000

const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const manualFallbacks = {
  '05-06': [
    { nameEs: 'Santos Mariano y Santiago, mártires', displayPriority: 0, sourceName: 'Vatican News' },
    { nameEs: 'Beata Ana Rosa Gattorno', displayPriority: 20, sourceName: 'Santoral Wiki' },
    { nameEs: 'Santo Domingo Savio', displayPriority: 21, sourceName: 'Santoral Wiki' },
    { nameEs: 'San Lucio de Cirene', displayPriority: 22, sourceName: 'Santoral Wiki' },
  ],
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function monthDayKey(month, day) {
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function normalizeWhitespace(value) {
  return decodeEntities(value)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHtmlToLines(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(h1|h2|h3|h4|p|li|div)>/gi, '\n')
    .replace(/<(h1|h2|h3|h4|p|li|div)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
}

async function fetchHtml(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'CaminoApp/1.0' },
    })
    if (!response.ok) {
      return null
    }
    return await response.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function isBoilerplate(line) {
  const lower = line.toLowerCase()
  return (
    lower === 'santo del día' ||
    lower.startsWith('fecha ') ||
    lower.startsWith('el santo del día es una reseña') ||
    lower.startsWith('su contribución') ||
    lower === 'enviar' ||
    lower === 'imprimir' ||
    lower.startsWith('otros eventos programados') ||
    lower.startsWith('copyright')
  )
}

function dedupe(candidates) {
  const seen = new Set()
  const result = []
  for (const candidate of candidates) {
    if (!/^(s\.|ss\.|san|santo|santa|santos|santas|beato|beata|beatos|beatas|nuestra señora)/i.test(candidate.nameEs.trim())) {
      continue
    }

    const key = slugify(candidate.nameEs)
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    result.push(candidate)
  }
  return result.sort((a, b) => a.displayPriority - b.displayPriority)
}

async function fetchVatican(month, day) {
  const url = `${VATICAN_BASE_URL}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}.html`
  const html = await fetchHtml(url)
  if (!html) {
    return []
  }

  const rawLines = stripHtmlToLines(html)
  const lines = rawLines.filter((line) => !isBoilerplate(line))

  // Vatican pages don't always contain a stable "Fecha DD ..." marker in the extracted text.
  // Pick the first saint-like title line instead.
  const title = lines.find((line) =>
    /^(s\.|ss\.|san|santo|santa|santos|santas|beato|beata|beatos|beatas|nuestra se)/i.test(line.trim())
  )
  if (!title || /^buscar$/i.test(title.trim())) {
    return []
  }

  const titleIndex = lines.indexOf(title)
  const bio = lines
    .slice(titleIndex + 1)
    .find((line) => !isBoilerplate(line) && !/^leer más$/i.test(line))

  return [{
    nameEs: title,
    shortBioEs: bio || null,
    quoteEs: null,
    feastType: title.toLowerCase().includes('mártir') ? 'martyrs' : null,
    sourceName: 'Vatican News',
    sourceUrl: url,
    isPrimary: true,
    displayPriority: 0,
  }]
}

async function fetchFandom(month, day) {
  const url = `${FANDOM_BASE_URL}/${day}_de_${monthNames[month - 1]}`
  const html = await fetchHtml(url)
  if (!html) {
    return []
  }

  const lines = stripHtmlToLines(html)
  const listStart = lines.findIndex((line) => /^leer más$/i.test(line))
  const listEnd = lines.findIndex((line) => /^santos de ayer/i.test(line))
  return lines
    .slice(listStart === -1 ? 0 : listStart + 1, listEnd === -1 ? undefined : listEnd)
    .filter((line) => /^(san|santo|santa|santos|santas|beato|beata|beatos|beatas|nuestra señora)/i.test(line))
    .map((nameEs, index) => ({
      nameEs,
      shortBioEs: null,
      quoteEs: null,
      feastType: /^beata?|^beatos?/i.test(nameEs) ? 'beato' : 'santo',
      sourceName: 'Santoral Wiki',
      sourceUrl: url,
      isPrimary: false,
      displayPriority: 20 + index,
    }))
}

async function upsertCandidate(month, day, candidate) {
  if (dryRun) {
    return
  }

  const slug = slugify(candidate.nameEs)
  const romcalKey = `santoral:${slug}`

  const saintRows = await sql`
    insert into saints (
      romcal_key,
      slug,
      name_es,
      name_original,
      short_bio_es,
      quote_es,
      is_martyr,
      needs_review,
      source,
      source_name,
      source_url,
      reviewed_at,
      created_at,
      updated_at
    ) values (
      ${romcalKey},
      ${slug},
      ${candidate.nameEs},
      ${candidate.nameEs},
      ${candidate.shortBioEs || null},
      ${candidate.quoteEs || null},
      ${/mártir|mártires/i.test(candidate.nameEs)},
      true,
      ${candidate.sourceName},
      ${candidate.sourceName},
      ${candidate.sourceUrl || null},
      null,
      now(),
      now()
    )
    on conflict (slug) do update set
      name_es = excluded.name_es,
      short_bio_es = coalesce(excluded.short_bio_es, saints.short_bio_es),
      quote_es = coalesce(excluded.quote_es, saints.quote_es),
      source = excluded.source,
      source_name = excluded.source_name,
      source_url = excluded.source_url,
      needs_review = true,
      reviewed_at = null,
      updated_at = now()
    returning id
  `

  const saintId = saintRows[0]?.id
  if (!saintId) {
    return
  }

  await sql`
    insert into saint_feasts (
      saint_id,
      feast_month,
      feast_day,
      feast_type,
      is_optional,
      is_primary,
      display_priority,
      romcal_key,
      romcal_name,
      source,
      source_name,
      source_url,
      created_at,
      updated_at
    ) values (
      ${saintId},
      ${month},
      ${day},
      ${candidate.feastType || 'santoral'},
      false,
      ${candidate.isPrimary},
      ${candidate.displayPriority},
      ${romcalKey},
      ${candidate.nameEs},
      ${candidate.sourceName},
      ${candidate.sourceName},
      ${candidate.sourceUrl || null},
      now(),
      now()
    )
    on conflict (saint_id, feast_month, feast_day) do update set
      feast_type = excluded.feast_type,
      is_primary = excluded.is_primary,
      display_priority = excluded.display_priority,
      romcal_key = excluded.romcal_key,
      romcal_name = excluded.romcal_name,
      source = excluded.source,
      source_name = excluded.source_name,
      source_url = excluded.source_url,
      updated_at = now()
  `
}

async function seedDay(month, day) {
  const key = monthDayKey(month, day)
  const candidates = dedupe([
    ...await fetchVatican(month, day),
    ...await fetchFandom(month, day),
    ...(manualFallbacks[key] || []).map((candidate) => ({
      shortBioEs: null,
      quoteEs: null,
      feastType: null,
      sourceUrl: null,
      isPrimary: candidate.displayPriority === 0,
      ...candidate,
    })),
  ])

  if (dryRun) {
    const label = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    console.log(`DRY RUN ${label}: ${candidates.length} candidates`)
    for (const candidate of candidates.slice(0, 6)) {
      console.log(`  - ${candidate.nameEs} (${candidate.sourceName})`)
    }
    return candidates.length
  }

  for (const [index, candidate] of candidates.entries()) {
    await upsertCandidate(month, day, {
      ...candidate,
      isPrimary: index === 0,
      displayPriority: index === 0 ? 0 : candidate.displayPriority,
    })
  }

  return candidates.length
}

async function run() {
  let total = 0

  const parsed = singleDate ? parseIsoDate(singleDate) : null
  const targetYear = parsed?.year ?? year

  if (parsed) {
    console.log(`Seeding santoral for ${singleDate}...`)
    total += await seedDay(parsed.month, parsed.day)
    console.log(`Seeded ${total} santoral rows for ${singleDate}`)
    if (sql) await sql.end()
    return
  }

  if (Number.isFinite(singleMonth) && Number.isFinite(singleDay) && singleMonth >= 1 && singleMonth <= 12 && singleDay >= 1 && singleDay <= 31) {
    const key = `${String(singleMonth).padStart(2, '0')}-${String(singleDay).padStart(2, '0')}`
    console.log(`Seeding santoral for ${targetYear}-${key}...`)
    total += await seedDay(singleMonth, singleDay)
    console.log(`Seeded ${total} santoral rows for ${targetYear}-${key}`)
    if (sql) await sql.end()
    return
  }

  console.log(`Seeding santoral rows for full year ${targetYear}...`)
  for (let month = 1; month <= 12; month += 1) {
    const daysInMonth = new Date(targetYear, month, 0).getDate()
    console.log(`Month ${String(month).padStart(2, '0')} (${daysInMonth} days)`)
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const seeded = await seedDay(month, day)
      total += seeded
      if (seeded > 0) {
        console.log(`  ${key}: +${seeded}`)
      }
      await sleep(120)
    }
  }

  console.log(`Seeded ${total} santoral rows for ${targetYear}`)
  if (sql) await sql.end()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
