const fs = require('fs')
const path = require('path')
const { config } = require('dotenv')
const postgres = require('postgres')
const romcal = require('romcal')

const envPath = path.resolve(__dirname, '../../../.env')
config({ path: envPath })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' })

const year = Number(process.env.SAINTS_YEAR || new Date().getFullYear())
const outputPath = path.resolve(__dirname, 'saints.seed.json')
const applyChanges = process.argv.includes('--apply')

const feastTypeMap = {
  SOLEMNITY: { feastType: 'solemnity', isOptional: false },
  FEAST: { feastType: 'feast', isOptional: false },
  MEMORIAL: { feastType: 'memorial', isOptional: false },
  OPT_MEMORIAL: { feastType: 'optional-memorial', isOptional: true },
}

const editorialNameMap = {
  'Mary, Mother of God': 'Santa María, Madre de Dios',
  'Saint Joseph, Husband of Mary': 'San José, esposo de la Virgen María',
  'Saint Joseph the Worker': 'San José Obrero',
  'Saint John the Baptist': 'San Juan Bautista',
  'Saint Peter and Saint Paul, Apostles': 'San Pedro y San Pablo, apóstoles',
  'Saint Mary Magdalene': 'Santa María Magdalena',
  'Saint James Apostle': 'Santiago, apóstol',
  'Saint Bartholomew the Apostle': 'San Bartolomé, apóstol',
  'Saint Matthew Apostle and Evangelist': 'San Mateo, apóstol y evangelista',
  'Saint Luke, Evangelist': 'San Lucas, evangelista',
  'Saint Mark the Evangelist': 'San Marcos, evangelista',
  'Saint Andrew the Apostle': 'San Andrés, apóstol',
  'Saint Stephen the First Martyr': 'San Esteban, protomártir',
  'All Saints': 'Todos los Santos',
  'All Souls': 'Conmemoración de todos los fieles difuntos',
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const slugify = (value) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const extractFirstSentence = (text) => {
  if (!text) {
    return null
  }
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) {
    return null
  }
  const sentence = cleaned.split(/(?<=[.!?])\s/)[0] || cleaned
  const maxLength = 220
  if (sentence.length <= maxLength) {
    return sentence
  }
  return `${sentence.slice(0, maxLength - 1)}…`
}

const fetchJson = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CaminoApp/1.0 (https://camino.app)',
      },
    })
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch {
    return null
  }
}

const fetchWikipediaSummary = async (query) => {
  const searchUrl = `https://es.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(query)}&limit=1`
  const searchData = await fetchJson(searchUrl)
  const page = searchData?.pages?.[0]
  const title = page?.title || page?.key

  if (!title) {
    return null
  }

  const summaryUrl = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const summary = await fetchJson(summaryUrl)
  if (!summary?.extract) {
    return null
  }

  return {
    title: summary.title || title,
    extract: summary.extract,
    url: summary?.content_urls?.desktop?.page || null,
  }
}

const buildSaints = async () => {
  const calendar = romcal.calendarFor({
    year,
    locale: 'es',
    country: 'argentina',
    type: 'calendar',
  })

  const saintsByKey = new Map()
  const feastRows = []

  for (const entry of calendar) {
    const type = String(entry?.type || '').toUpperCase()
    const mapped = feastTypeMap[type]
    if (!mapped) {
      continue
    }

    const momentValue = entry?.moment
    const feastDate = momentValue ? new Date(momentValue) : null
    if (!feastDate || Number.isNaN(feastDate.getTime())) {
      continue
    }

    const feastMonth = feastDate.getUTCMonth() + 1
    const feastDay = feastDate.getUTCDate()
    const nameOriginal = String(entry?.name || '').trim()
    if (!nameOriginal) {
      continue
    }

    const baseKey = String(entry?.key || '') || `${slugify(nameOriginal)}-${feastMonth}-${feastDay}`

    if (!saintsByKey.has(baseKey)) {
      const isMartyr = /martyr|mártir/i.test(nameOriginal)
      saintsByKey.set(baseKey, {
        romcalKey: baseKey,
        nameEs: editorialNameMap[nameOriginal] || nameOriginal,
        nameOriginal,
        shortBioEs: null,
        quoteEs: null,
        isMartyr,
        needsReview: true,
        source: 'romcal',
        sourceName: 'Romcal',
        sourceUrl: null,
        reviewedAt: null,
        slug: slugify(nameOriginal),
      })
    }

    feastRows.push({
      romcalKey: baseKey,
      feastMonth,
      feastDay,
      feastType: mapped.feastType,
      isOptional: mapped.isOptional,
      romcalName: nameOriginal,
      source: 'romcal',
    })
  }

  const saints = Array.from(saintsByKey.values())

  for (const saint of saints) {
    const summary = await fetchWikipediaSummary(saint.nameOriginal || saint.nameEs)
    if (summary?.extract) {
      const sentence = extractFirstSentence(summary.extract)
      saint.nameEs = summary.title || saint.nameEs
      saint.shortBioEs = sentence
      saint.source = summary.url || saint.source
      saint.sourceName = 'Wikipedia'
      saint.sourceUrl = summary.url || null
      saint.needsReview = true
      saint.reviewedAt = null
      saint.slug = slugify(saint.nameEs)
    }

    await sleep(150)
  }

  const slugCounts = new Map()
  for (const saint of saints) {
    const baseSlug = saint.slug || slugify(saint.nameEs) || slugify(saint.romcalKey)
    const count = slugCounts.get(baseSlug) || 0
    const uniqueSlug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`
    slugCounts.set(baseSlug, count + 1)
    saint.slug = uniqueSlug
  }

  return { saints, feasts: feastRows }
}

const upsertSaints = async (saints, feasts) => {
  const saintIdByKey = new Map()

  for (const saint of saints) {
    const rows = await sql`
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
        ${saint.romcalKey},
        ${saint.slug},
        ${saint.nameEs},
        ${saint.nameOriginal},
        ${saint.shortBioEs},
        ${saint.quoteEs},
        ${saint.isMartyr},
        ${saint.needsReview},
        ${saint.source},
        ${saint.sourceName},
        ${saint.sourceUrl},
        ${saint.reviewedAt},
        now(),
        now()
      )
      on conflict (romcal_key) do update set
        slug = excluded.slug,
        name_es = excluded.name_es,
        name_original = excluded.name_original,
        short_bio_es = excluded.short_bio_es,
        quote_es = excluded.quote_es,
        is_martyr = excluded.is_martyr,
        needs_review = excluded.needs_review,
        source = excluded.source,
        source_name = excluded.source_name,
        source_url = excluded.source_url,
        reviewed_at = excluded.reviewed_at,
        updated_at = now()
      returning id
    `

    const saintId = rows[0]?.id
    if (saintId) {
      saintIdByKey.set(saint.romcalKey, saintId)
    }
  }

  for (const feast of feasts) {
    const saintId = saintIdByKey.get(feast.romcalKey)
    if (!saintId) {
      continue
    }

    await sql`
      insert into saint_feasts (
        saint_id,
        feast_month,
        feast_day,
        feast_type,
        is_optional,
        romcal_key,
        romcal_name,
        source,
        created_at,
        updated_at
      ) values (
        ${saintId},
        ${feast.feastMonth},
        ${feast.feastDay},
        ${feast.feastType},
        ${feast.isOptional},
        ${feast.romcalKey},
        ${feast.romcalName},
        ${feast.source},
        now(),
        now()
      )
      on conflict (saint_id, feast_month, feast_day) do update set
        feast_type = excluded.feast_type,
        is_optional = excluded.is_optional,
        romcal_key = excluded.romcal_key,
        romcal_name = excluded.romcal_name,
        source = excluded.source,
        updated_at = now()
    `
  }
}

async function run() {
  const { saints, feasts } = await buildSaints()

  const payload = {
    year,
    generatedAt: new Date().toISOString(),
    saints,
    feasts,
  }

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8')

  if (applyChanges) {
    await upsertSaints(saints, feasts)
  }

  await sql.end()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
