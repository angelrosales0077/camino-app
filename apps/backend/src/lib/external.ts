import type {
  DailyLiturgy,
  DailyReading,
  DailyReadingType,
  DailyReadingsResponse,
  GospelEntry,
  ReadingCommentary,
} from '@camino/shared'
import romcal from 'romcal'

type JsonRecord = Record<string, unknown>

interface RomcalEntry {
  key?: string
  name?: string
  type?: string
  moment?: string | Date | { toISOString?: () => string }
  data?: {
    season?: { key?: string; value?: string }
    meta?: {
      liturgicalColor?: { key?: string; value?: string }
      psalterWeek?: { key?: string; value?: string }
    }
    calendar?: { week?: string | number }
  }
}

const LITURGY_API_BASE =
  process.env.LITURGY_API_BASE ||
  'https://calapi.inadiutorium.cz/api/v0/es/calendars/general-es'
const LITURGY_PROVIDER = process.env.LITURGY_PROVIDER || 'romcal'
const ROMCAL_LOCALE = process.env.ROMCAL_LOCALE || 'es'
const ROMCAL_COUNTRY = process.env.ROMCAL_COUNTRY || 'argentina'
const EVANGELIZO_API_BASE =
  process.env.EVANGELIZO_API_BASE ||
  'https://feed.evangelizo.org/v2/reader.php'
const EVANGELIZO_LANG = process.env.EVANGELIZO_LANG || 'SP'
const EVANGELIZO_TYPE = process.env.EVANGELIZO_TYPE || 'reading'
const EVANGELIZO_CONTENT = process.env.EVANGELIZO_CONTENT || 'GSP'
const GOSPEL_API_BASE = process.env.GOSPEL_API_BASE || 'https://bible-api.com'
const GOSPEL_DEFAULT_REF = process.env.GOSPEL_DEFAULT_REF || 'John 15:1-8'
const EXTERNAL_TIMEOUT_MS = Number(process.env.EXTERNAL_TIMEOUT_MS || 6000)
const DOMINICOS_COMMENTARY_BASE = 'https://www.dominicos.org/predicacion/evangelio-del-dia'
const VATICAN_NEWS_COMMENTARY_BASE = 'https://www.vaticannews.va/es/evangelio-de-hoy'
const OPUS_DEI_COMMENTARY_BASES = [
  'https://opusdei.org/es-es/gospel',
  'https://opusdei.org/es/gospel',
]
const CIUDAD_REDONDA_BASE = 'https://www.ciudadredonda.org'

const colorMap: Record<string, string> = {
  green: '#2D5A3D',
  verde: '#2D5A3D',
  red: '#7B1A2A',
  rojo: '#7B1A2A',
  purple: '#5C2D6B',
  morado: '#5C2D6B',
  violet: '#5C2D6B',
  violeta: '#5C2D6B',
  rose: '#F3C1CC',
  rosa: '#F3C1CC',
  white: '#FAF5E4',
  blanco: '#FAF5E4',
  gold: '#8B6914',
  dorado: '#8B6914',
}

const romcalCache = new Map<number, RomcalEntry[]>()

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function getRecord(value: unknown, key: string): JsonRecord | null {
  if (!isRecord(value)) {
    return null
  }
  const child = value[key]
  return isRecord(child) ? child : null
}

function getArray(value: unknown, key: string): unknown[] | null {
  if (!isRecord(value)) {
    return null
  }
  const child = value[key]
  return Array.isArray(child) ? child : null
}

function getString(value: unknown, key: string): string | null {
  if (!isRecord(value)) {
    return null
  }
  const child = value[key]
  return typeof child === 'string' || typeof child === 'number'
    ? String(child)
    : null
}

function getDateParts(date: string) {
  const [year, month, day] = date.split('-')
  return { year, month, day }
}

function normalizeSeason(raw: string) {
  const value = raw.toLowerCase()
  if (value.includes('advent')) return 'advent'
  if (value.includes('adviento')) return 'advent'
  if (value.includes('christmas')) return 'christmas'
  if (value.includes('navidad')) return 'christmas'
  if (value.includes('lent')) return 'lent'
  if (value.includes('cuaresma')) return 'lent'
  if (value.includes('holy week')) return 'holy-week'
  if (value.includes('semana santa')) return 'holy-week'
  if (value.includes('easter')) return 'easter'
  if (value.includes('pascua')) return 'easter'
  if (value.includes('ordinary')) return 'ordinary'
  if (value.includes('ordinario')) return 'ordinary'
  return 'ordinary'
}

function normalizeColor(raw: string) {
  const value = raw.toLowerCase()
  return colorMap[value] || '#2D5A3D'
}

function normalizeCelebrationName(raw?: string | null) {
  if (!raw) {
    return null
  }

  return raw.trim()
}

function getWeekdayName(date: string) {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(
    new Date(`${date}T00:00:00`)
  )
}

function toRoman(value: number) {
  const numerals: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let remaining = value
  let result = ''

  for (const [number, roman] of numerals) {
    while (remaining >= number) {
      result += roman
      remaining -= number
    }
  }

  return result
}

function getSeasonName(raw: string) {
  const season = normalizeSeason(raw)
  if (season === 'advent') return 'Adviento'
  if (season === 'christmas') return 'Navidad'
  if (season === 'lent') return 'Cuaresma'
  if (season === 'holy-week') return 'Semana Santa'
  if (season === 'easter') return 'Pascua'
  return 'Tiempo Ordinario'
}

function buildLiturgicalDayName(date: string, seasonRaw: string, calendarWeek?: number | null) {
  const weekday = getWeekdayName(date)
  const seasonName = getSeasonName(seasonRaw)

  if (!calendarWeek) {
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} de ${seasonName}`
  }

  const romanWeek = toRoman(calendarWeek)
  if (seasonName === 'Tiempo Ordinario') {
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} de la ${romanWeek} semana del ${seasonName}`
  }

  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} de la ${romanWeek} semana de ${seasonName}`
}

function parseWeek(value: unknown) {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const match = value.match(/\d+/)
    if (match) {
      return Number(match[0])
    }
  }
  return null
}

function parseLiturgicalWeekFromName(value?: string | null) {
  if (!value) {
    return null
  }

  const match = value.match(/(\d+)\s*[º°]?\s+week/i)
  return match ? Number(match[1]) : null
}

function parseLiturgicalWeekNumber(value?: string | null) {
  if (!value) {
    return null
  }

  const match = value.match(/(\d+)\D+week/i)
  return match ? Number(match[1]) : null
}

async function fetchJson(url: string): Promise<unknown | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function fetchRaw(url: string): Promise<unknown | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      return null
    }
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return await response.json()
    }

    const buffer = await response.arrayBuffer()
    const utf8Text = new TextDecoder('utf-8').decode(buffer)
    if (utf8Text.includes('\uFFFD')) {
      return new TextDecoder('latin1').decode(buffer)
    }
    return utf8Text
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function fetchCalendar(date: string) {
  const { year, month, day } = getDateParts(date)
  const url = `${LITURGY_API_BASE}/${year}/${month}/${day}`
  return fetchJson(url)
}

function extractGospelRef(calendar: unknown) {
  const calendarRecord = isRecord(calendar) ? calendar : null
  const celebration = getArray(calendarRecord, 'celebrations')?.[0]
  const celebrationRecord = isRecord(celebration) ? celebration : null
  const readings =
    getRecord(celebrationRecord, 'readings') ||
    getRecord(calendarRecord, 'readings')
  const gospelRecord = getRecord(readings, 'gospel')
  const gospelCandidate =
    getString(gospelRecord, 'reference') ||
    (typeof readings?.gospel === 'string' ? readings.gospel : null) ||
    getString(celebrationRecord, 'gospel') ||
    getString(calendarRecord, 'gospel')

  if (typeof gospelCandidate === 'string') {
    return gospelCandidate
  }

  return null
}

function toEvangelizoDate(date: string) {
  return date.replace(/-/g, '')
}

function toDmySlug(date: string) {
  const { year, month, day } = getDateParts(date)
  return `${Number(day)}-${Number(month)}-${year}`
}

const spanishMonthSlugs = [
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

function toSpanishLongDateSlug(date: string) {
  const { year, month, day } = getDateParts(date)
  const monthName = spanishMonthSlugs[Number(month) - 1]
  if (!monthName) {
    return null
  }

  return `${Number(day)}-de-${monthName}-de-${year}`
}

function toYmdPath(date: string) {
  const { year, month, day } = getDateParts(date)
  return `${year}/${month}/${day}`
}

const htmlNamedEntities: Record<string, string> = {
  Aacute: 'Á',
  Eacute: 'É',
  Iacute: 'Í',
  Oacute: 'Ó',
  Uacute: 'Ú',
  Ntilde: 'Ñ',
  Uuml: 'Ü',
  aacute: 'á',
  amp: '&',
  apos: "'",
  copy: '©',
  deg: '°',
  eacute: 'é',
  euro: '€',
  gt: '>',
  hellip: '...',
  iacute: 'í',
  iexcl: '¡',
  iquest: '¿',
  laquo: '«',
  ldquo: '“',
  lsquo: '‘',
  lt: '<',
  mdash: '—',
  nbsp: ' ',
  ndash: '–',
  ntilde: 'ñ',
  oacute: 'ó',
  ordf: 'ª',
  ordm: 'º',
  quot: '"',
  raquo: '»',
  rdquo: '”',
  reg: '®',
  rsquo: '’',
  uacute: 'ú',
  uuml: 'ü',
}

function decodeEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&([a-zA-Z]+);/g, (entity, name: string) => htmlNamedEntities[name] || entity)
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ')
}

function normalizeHtmlText(value: string) {
  return repairEncoding(decodeEntities(stripHtml(value)))
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/extraido de la biblia[\s\S]*/i, '')
    .replace(/para recibir[\s\S]*/i, '')
    .trim()
}

function normalizeHtmlExcerpt(value: string) {
  return repairEncoding(decodeEntities(stripHtml(value)))
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractHtmlAttribute(html: string, attribute: string) {
  const match = html.match(new RegExp(`${attribute}=["']([^"']+)["']`, 'i'))
  return match?.[1] ? decodeEntities(match[1]).trim() : null
}

function extractHtmlParagraphs(html: string) {
  return Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => normalizeHtmlExcerpt(match[1]))
    .filter((item) => item.length > 0)
}

function isEvangelizoError(value: unknown) {
  return typeof value === 'string' && /error\s*:\s*wrong param/i.test(value)
}

function repairEncoding(value: string) {
  if (value.includes('Ã') || value.includes('Â')) {
    return Buffer.from(value, 'latin1').toString('utf8')
  }
  return value
}

function extractTag(xml: string, tags: string[]) {
  for (const tag of tags) {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
    if (match?.[1]) {
      return match[1]
    }
  }
  return null
}

function parseEvangelizoPayload(payload: unknown, date: string): GospelEntry | null {
  if (!payload) {
    return null
  }

  if (typeof payload === 'string') {
    const reference =
      extractTag(payload, ['title', 'reference', 'citation']) ||
      extractTag(payload, ['header']) ||
      'Evangelio del día'
    const textRaw =
      extractTag(payload, ['text', 'content', 'reading']) ||
      extractTag(payload, ['body']) ||
      payload
    const text = normalizeHtmlText(textRaw)

    if (!text) {
      return null
    }

    let filtered = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => {
        const lower = line.toLowerCase()
        if (lower.startsWith('extraido de la biblia')) return false
        if (lower.startsWith('para recibir')) return false
        return true
      })
      .join(' ')

    filtered = filtered
      .replace(/extraido de la biblia[\s\S]*/i, '')
      .replace(/para recibir[\s\S]*/i, '')
      .trim()

    const shortQuote = filtered.split(/(?<=[.!?])\s/)[0]?.slice(0, 160)
      || filtered.slice(0, 160)

    return {
      date,
      reference,
      text: filtered,
      shortQuote,
      patristicComment: null,
    }
  }

  if (typeof payload === 'object') {
    const data = payload
    const dataRecord = isRecord(data) ? data : null
    const nestedData = getRecord(dataRecord, 'data')
    const readings =
      getRecord(dataRecord, 'readings') ||
      getRecord(nestedData, 'readings') ||
      getRecord(dataRecord, 'lectures')
    const reading =
      (Array.isArray(readings) && readings[0]) ||
      getArray(readings, 'reading')?.[0] ||
      getRecord(readings, 'reading') ||
      readings
    const readingRecord = isRecord(reading) ? reading : null

    const reference =
      getString(readingRecord, 'title') ||
      getString(readingRecord, 'reference') ||
      getString(readingRecord, 'citation') ||
      getString(dataRecord, 'title') ||
      'Evangelio del día'
    const textRaw =
      getString(readingRecord, 'text') ||
      getString(readingRecord, 'content') ||
      getString(dataRecord, 'text') ||
      ''
    const text = normalizeHtmlText(String(textRaw))
    if (!text) {
      return null
    }

    const shortQuote = text.split(/(?<=[.!?])\s/)[0]?.slice(0, 160) || text.slice(0, 160)

    return {
      date,
      reference,
      text,
      shortQuote,
      patristicComment: null,
    }
  }

  return null
}

function getRomcalCalendar(year: number) {
  if (romcalCache.has(year)) {
    return romcalCache.get(year) || []
  }

  const calendar = romcal.calendarFor({
    year,
    locale: ROMCAL_LOCALE,
    country: ROMCAL_COUNTRY,
    type: 'calendar',
  }) as RomcalEntry[]

  romcalCache.set(year, calendar)
  return calendar
}

function hasNamedRomcalCelebration(type: string) {
  const value = type.toLowerCase()
  return (
    value === 'solemnity' ||
    value === 'feast' ||
    value === 'memorial' ||
    value === 'opt_memorial'
  )
}

function splitReadingTitle(value: string) {
  const text = normalizeHtmlText(value)
  const referenceMatch = text.match(/(\d?\s?[\p{L}\s]+\s+\d[\d,.\-\s()\p{L}]*\.?)$/u)
  if (!referenceMatch) {
    return { title: text || 'Lectura', reference: null }
  }

  const reference = referenceMatch[1].trim().replace(/\.$/, '')
  const title = text.slice(0, referenceMatch.index).trim() || 'Lectura'
  return { title, reference }
}

function inferCommentaryAuthorType(author: string): ReadingCommentary['authorType'] {
  const value = author.toLowerCase()
  if (
    value.includes('papa') ||
    value.includes('pope') ||
    value.includes('benedicto xvi') ||
    value.includes('juan pablo ii')
  ) return 'pope'
  if (value.includes('doctor de la iglesia')) return 'doctor-of-the-church'
  if (value.includes('padre de la iglesia')) return 'church-father'
  if (value.includes('san ') || value.includes('santa ') || value.includes('s. ')) return 'saint'
  return 'other'
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function shortenCommentaryText(value: string) {
  const excerpt = value.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ').trim()
  if (excerpt.length <= 720) {
    return excerpt
  }

  return `${excerpt.slice(0, 700).trimEnd()}...`
}

interface CuratedCatholicCommentary extends ReadingCommentary {
  date?: string
  references?: string[]
}

const curatedCatholicCommentaries: CuratedCatholicCommentary[] = []

function normalizeReference(value?: string | null) {
  return normalizeSearchText(value || '').replace(/[^\p{L}\d]+/gu, '')
}

function findCuratedCatholicCommentary(
  date: string,
  gospel?: DailyReading | null
): ReadingCommentary | null {
  const gospelReference = normalizeReference(gospel?.reference)
  const match = curatedCatholicCommentaries.find((item) => {
    if (item.date && item.date === date) {
      return true
    }

    if (!gospelReference) {
      return false
    }

    return item.references?.some(
      (reference) => normalizeReference(reference) === gospelReference
    )
  })

  if (!match) {
    return null
  }

  return {
    title: match.title,
    author: match.author,
    authorType: match.authorType,
    relatedTo: match.relatedTo || 'gospel',
    text: shortenCommentaryText(match.text),
    sourceName: match.sourceName,
    sourceUrl: match.sourceUrl,
    needsReview: match.needsReview,
  }
}

function isUsableCommentaryText(value: string) {
  return normalizeSearchText(value).length >= 80
}

function absoluteUrl(baseUrl: string, href: string) {
  return new URL(decodeEntities(href), baseUrl).toString()
}

function buildCommentary({
  title,
  author,
  authorType,
  text,
  sourceName,
  sourceUrl,
  needsReview,
}: ReadingCommentary): ReadingCommentary | null {
  const normalizedText = shortenCommentaryText(text)
  if (!isUsableCommentaryText(normalizedText)) {
    return null
  }

  return {
    title: title.trim(),
    author: author.trim(),
    authorType,
    relatedTo: 'gospel',
    text: normalizedText,
    sourceName,
    sourceUrl,
    needsReview,
  }
}

const vaticanProfiles = [
  {
    slug: 'leo-xiv',
    author: 'Papa León XIV',
    startYear: 2025,
    endYear: 2026,
  },
  {
    slug: 'francesco',
    author: 'Papa Francisco',
    startYear: 2013,
    endYear: 2025,
  },
  {
    slug: 'benedict-xvi',
    author: 'Benedicto XVI',
    startYear: 2005,
    endYear: 2013,
  },
  {
    slug: 'john-paul-ii',
    author: 'San Juan Pablo II',
    startYear: 1978,
    endYear: 2005,
  },
]

const vaticanSections = ['homilies', 'angelus', 'audiences']

function findVaticanDocument(indexHtml: string, date: string) {
  const ymd = toEvangelizoDate(date)
  const matches = Array.from(
    indexHtml.matchAll(/<h2>\s*<a\s+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/h2>/gi)
  )

  for (const match of matches) {
    const href = decodeEntities(match[1])
    if (!href.includes(`/documents/${ymd}`)) {
      continue
    }

    return {
      href,
      title: normalizeHtmlExcerpt(match[2]),
    }
  }

  return null
}

function extractVaticanText(html: string) {
  const body =
    html.match(/<div[^>]+class=["'][^"']*documento[^"']*["'][^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
    html

  return extractHtmlParagraphs(body)
    .filter((paragraph) => {
      const normalized = normalizeSearchText(paragraph)
      if (normalized.includes('boletin de la santa sede')) return false
      if (normalized.includes('copyright')) return false
      if (normalized.length < 60) return false
      return true
    })
    .slice(0, 3)
    .join(' ')
}

async function fetchVaticanCommentary(date: string): Promise<ReadingCommentary | null> {
  const year = Number(getDateParts(date).year)

  for (const profile of vaticanProfiles) {
    if (year < profile.startYear || year > profile.endYear) {
      continue
    }

    for (const section of vaticanSections) {
      const indexUrl = `https://www.vatican.va/content/${profile.slug}/es/${section}/${year}.index.html`
      const indexPayload = await fetchRaw(indexUrl)
      if (typeof indexPayload !== 'string') {
        continue
      }

      const document = findVaticanDocument(indexPayload, date)
      if (!document) {
        continue
      }

      const sourceUrl = absoluteUrl('https://www.vatican.va', document.href)
      const documentPayload = await fetchRaw(sourceUrl)
      if (typeof documentPayload !== 'string') {
        continue
      }

      const text = extractVaticanText(documentPayload)
      const commentary = buildCommentary({
        title: document.title || 'Comentario del Evangelio',
        author: profile.author,
        authorType: 'pope',
        relatedTo: 'gospel',
        text,
        sourceName: 'Vatican.va',
        sourceUrl,
        needsReview: false,
      })

      if (commentary) {
        return commentary
      }
    }
  }

  return null
}

function inferPapalAuthor(attribution?: string | null) {
  const normalized = normalizeSearchText(attribution || '')
  if (normalized.includes('leon xiv')) return 'Papa León XIV'
  if (normalized.includes('francisco')) return 'Papa Francisco'
  if (normalized.includes('benedicto xvi')) return 'Benedicto XVI'
  if (normalized.includes('juan pablo ii')) return 'San Juan Pablo II'
  return null
}

function extractVaticanNewsReflection(html: string) {
  const match = html.match(
    /<h2[^>]*>\s*Las palabras de los Papas\s*<\/h2>([\s\S]*?)<\/section>/i
  )
  if (!match?.[1]) {
    return null
  }

  const text = extractHtmlParagraphs(match[1]).join(' ')
  if (!text) {
    return null
  }

  const attributionMatch = text.match(/\(([^()]+)\)\s*$/)
  const attribution = attributionMatch?.[1]?.trim() || null
  const author = inferPapalAuthor(attribution) || attribution?.split('-')[0]?.trim() || null
  const body = attributionMatch
    ? text.slice(0, attributionMatch.index).trim()
    : text.trim()

  return {
    title: attribution ? `Las palabras de los Papas - ${attribution}` : 'Las palabras de los Papas',
    author,
    text: body,
    needsReview: !author,
  }
}

async function fetchVaticanNewsCommentary(date: string): Promise<ReadingCommentary | null> {
  const sourceUrl = `${VATICAN_NEWS_COMMENTARY_BASE}/${toYmdPath(date)}.html`
  const payload = await fetchRaw(sourceUrl)
  if (typeof payload !== 'string') {
    return null
  }

  const reflection = extractVaticanNewsReflection(payload)
  if (!reflection) {
    return null
  }

  return buildCommentary({
    title: reflection.title,
    author: reflection.author || 'Vatican News',
    authorType: inferCommentaryAuthorType(reflection.author || ''),
    relatedTo: 'gospel',
    text: reflection.text,
    sourceName: 'Vatican News',
    sourceUrl,
    needsReview: reflection.needsReview,
  })
}

function extractDominicosReflection(html: string) {
  const match = html.match(/<h2[^>]*>\s*Reflexión del Evangelio de hoy\s*<\/h2>([\s\S]*?)<footer[^>]+class=["'][^"']*autor/i)
  if (!match?.[1]) {
    return null
  }

  const segment = match[1]
  const title = normalizeHtmlExcerpt(
    segment.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || 'Reflexión del Evangelio'
  )
  const text = extractHtmlParagraphs(segment).join(' ')
  const author = normalizeHtmlExcerpt(
    html.match(/<span[^>]+class=["'][^"']*nombre[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ||
      'Dominicos'
  )

  return { title, text, author }
}

async function fetchDominicosCommentary(date: string): Promise<ReadingCommentary | null> {
  const sourceUrl = `${DOMINICOS_COMMENTARY_BASE}/${toDmySlug(date)}/`
  const payload = await fetchRaw(sourceUrl)
  if (typeof payload !== 'string') {
    return null
  }

  const reflection = extractDominicosReflection(payload)
  if (!reflection) {
    return null
  }

  return buildCommentary({
    title: reflection.title,
    author: reflection.author,
    authorType: inferCommentaryAuthorType(reflection.author),
    relatedTo: 'gospel',
    text: reflection.text,
    sourceName: 'Dominicos',
    sourceUrl,
    needsReview: false,
  })
}

function extractOpusDeiReflection(html: string) {
  if (normalizeSearchText(html).includes('just a moment')) {
    return null
  }

  const title =
    extractHtmlAttribute(
      html.match(/<meta[^>]+property=["']og:title["'][^>]*>/i)?.[0] || '',
      'content'
    ) ||
    normalizeHtmlExcerpt(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || 'Comentario al Evangelio')
  const marker = html.search(
    /<h[23][^>]*>\s*Comentario(?:\s+al\s+Evangelio)?\s*<\/h[23]>/i
  )
  if (marker < 0) {
    return null
  }

  const segment = html.slice(marker)
  const nextSection = segment.search(/<h2[^>]*>\s*(Evangelio|Audio|Enlaces|También)/i)
  const reflectionHtml = nextSection > 0 ? segment.slice(0, nextSection) : segment
  const text = extractHtmlParagraphs(reflectionHtml).join(' ')

  return { title, text }
}

async function fetchOpusDeiCommentary(date: string): Promise<ReadingCommentary | null> {
  for (const baseUrl of OPUS_DEI_COMMENTARY_BASES) {
    const sourceUrl = `${baseUrl}/${date}/`
    const payload = await fetchRaw(sourceUrl)
    if (typeof payload !== 'string') {
      continue
    }

    const reflection = extractOpusDeiReflection(payload)
    if (!reflection) {
      continue
    }

    const commentary = buildCommentary({
      title: reflection.title,
      author: 'Opus Dei',
      authorType: 'other',
      relatedTo: 'gospel',
      text: reflection.text,
      sourceName: 'Opus Dei',
      sourceUrl,
      needsReview: false,
    })

    if (commentary) {
      return commentary
    }
  }

  return null
}

function extractCiudadRedondaReflection(html: string) {
  const content = html.match(/<div[^>]+class=["'][^"']*mec-divi-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]
  if (!content) {
    return null
  }

  const paragraphs = extractHtmlParagraphs(content)
  if (paragraphs.length === 0) {
    return null
  }

  const maybeAuthor = paragraphs[paragraphs.length - 1]
  const hasExplicitAuthor = maybeAuthor.length <= 90 && !/[.!?]$/.test(maybeAuthor)
  const textParagraphs = hasExplicitAuthor ? paragraphs.slice(0, -1) : paragraphs
  const title =
    extractHtmlAttribute(
      html.match(/<meta[^>]+property=["']og:title["'][^>]*>/i)?.[0] || '',
      'content'
    ) ||
    normalizeHtmlExcerpt(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || 'Comentario al Evangelio')

  return {
    title,
    author: hasExplicitAuthor ? maybeAuthor : 'Ciudad Redonda',
    text: textParagraphs.join(' '),
    needsReview: !hasExplicitAuthor,
  }
}

async function fetchCiudadRedondaCommentary(date: string): Promise<ReadingCommentary | null> {
  const slug = toSpanishLongDateSlug(date)
  if (!slug) {
    return null
  }

  const sourceUrl = `${CIUDAD_REDONDA_BASE}/events/comentario-al-evangelio-del-${slug}/?occurrence=${date}`
  const payload = await fetchRaw(sourceUrl)
  if (typeof payload !== 'string') {
    return null
  }

  const reflection = extractCiudadRedondaReflection(payload)
  if (!reflection) {
    return null
  }

  return buildCommentary({
    title: reflection.title,
    author: reflection.author,
    authorType: 'other',
    relatedTo: 'gospel',
    text: reflection.text,
    sourceName: 'Ciudad Redonda',
    sourceUrl,
    needsReview: true,
  })
}

async function fetchCatholicCommentary(
  date: string,
  gospel?: DailyReading | null
): Promise<ReadingCommentary | null> {
  const curated = findCuratedCatholicCommentary(date, gospel)
  if (curated) {
    return curated
  }

  const vatican = await fetchVaticanCommentary(date)
  if (vatican) {
    return vatican
  }

  const vaticanNews = await fetchVaticanNewsCommentary(date)
  if (vaticanNews) {
    return vaticanNews
  }

  const dominicos = await fetchDominicosCommentary(date)
  if (dominicos) {
    return dominicos
  }

  const opusDei = await fetchOpusDeiCommentary(date)
  if (opusDei) {
    return opusDei
  }

  const ciudadRedonda = await fetchCiudadRedondaCommentary(date)
  if (ciudadRedonda) {
    return ciudadRedonda
  }

  return null
}

async function fetchEvangelizoReading(
  date: string,
  type: DailyReadingType,
  content: 'FR' | 'PS' | 'SR' | 'GSP'
): Promise<DailyReading | null> {
  const evangelizoDate = toEvangelizoDate(date)
  const titleUrl = `${EVANGELIZO_API_BASE}?date=${evangelizoDate}&type=reading_lt&lang=${EVANGELIZO_LANG}&content=${content}`
  const textUrl = `${EVANGELIZO_API_BASE}?date=${evangelizoDate}&type=reading&lang=${EVANGELIZO_LANG}&content=${content}`
  const [titlePayload, textPayload] = await Promise.all([
    fetchRaw(titleUrl),
    fetchRaw(textUrl),
  ])

  if (!titlePayload || !textPayload || isEvangelizoError(titlePayload) || isEvangelizoError(textPayload)) {
    return null
  }

  const text = normalizeHtmlText(String(textPayload))
  if (!text) {
    return null
  }

  const parsed = splitReadingTitle(String(titlePayload))
  const fallbackTitle: Record<DailyReadingType, string> = {
    'first-reading': 'Primera lectura',
    psalm: 'Salmo',
    'second-reading': 'Segunda lectura',
    gospel: 'Evangelio',
    alleluia: 'Aleluya',
    other: 'Lectura',
  }
  const title =
    parsed.title.trim().toLowerCase() === 'lectura'
      ? fallbackTitle[type]
      : parsed.title || fallbackTitle[type]

  return {
    type,
    title,
    reference: parsed.reference,
    text,
  }
}

function isFeriaName(value?: string | null) {
  if (!value) {
    return true
  }
  return value.trim().toLowerCase() === 'feria'
}

function findRomcalForDate(date: string) {
  const target = new Date(date)
  const year = target.getFullYear()
  const month = target.getMonth()
  const day = target.getDate()
  const calendar = getRomcalCalendar(year)

  return calendar.find((item) => {
    const momentValue = typeof item.moment === 'string'
      ? item.moment
      : item.moment?.toISOString?.()
    if (!momentValue) {
      return false
    }
    const parsed = new Date(momentValue)
    return (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month &&
      parsed.getDate() === day
    )
  })
}

async function fetchRomcalLiturgy(date: string): Promise<DailyLiturgy | null> {
  const entry = findRomcalForDate(date)
  if (!entry) {
    return null
  }

  const seasonRaw = entry?.data?.season?.key || entry?.data?.season?.value || 'ordinary'
  const colorRaw = entry?.data?.meta?.liturgicalColor?.key
    || entry?.data?.meta?.liturgicalColor?.value
    || 'green'

  const psalterWeek = parseWeek(entry?.data?.meta?.psalterWeek?.key)
    ?? parseWeek(entry?.data?.meta?.psalterWeek?.value)
  const calendarWeek =
    parseLiturgicalWeekNumber(entry?.name) ??
    parseLiturgicalWeekFromName(entry?.name) ??
    parseWeek(entry?.data?.calendar?.week)

  const entryType = String(entry?.type || '')
  const celebrationName = hasNamedRomcalCelebration(entryType)
    ? normalizeCelebrationName(String(entry?.name || ''))
    : null
  const liturgicalDayName = buildLiturgicalDayName(
    date,
    String(seasonRaw),
    calendarWeek
  )

  return {
    date,
    liturgicalDayName,
    season: normalizeSeason(String(seasonRaw)),
    psalterWeek: psalterWeek ?? undefined,
    calendarWeek: calendarWeek ?? undefined,
    color: normalizeColor(String(colorRaw)),
    saintOfDay: null,
    otherSaintsOfDay: [],
    celebrationName: !isFeriaName(celebrationName) ? celebrationName ?? undefined : undefined,
    hasSaintOfDay: false,
  }
}

export async function fetchExternalLiturgy(date: string): Promise<DailyLiturgy | null> {
  if (LITURGY_PROVIDER === 'romcal') {
    const romcalLiturgy = await fetchRomcalLiturgy(date)
    if (romcalLiturgy) {
      return romcalLiturgy
    }
  }

  const calendar = await fetchCalendar(date)
  if (!calendar) {
    return null
  }

  const calendarRecord = isRecord(calendar) ? calendar : null
  const celebration = getArray(calendarRecord, 'celebrations')?.[0]
  const celebrationRecord = isRecord(celebration) ? celebration : null
  const seasonRaw =
    getString(calendarRecord, 'season') ||
    getString(celebrationRecord, 'season') ||
    'ordinary'
  const colorRaw =
    getString(celebrationRecord, 'colour') ||
    getString(celebrationRecord, 'color') ||
    getString(calendarRecord, 'colour') ||
    'green'
  const calendarWeek = parseWeek(getString(calendarRecord, 'week'))
  const celebrationName =
    normalizeCelebrationName(
      getString(celebrationRecord, 'title') ||
      getString(calendarRecord, 'title')
    )

  return {
    date,
    liturgicalDayName: buildLiturgicalDayName(date, seasonRaw, calendarWeek),
    season: normalizeSeason(seasonRaw),
    psalterWeek: undefined,
    calendarWeek: calendarWeek ?? undefined,
    color: normalizeColor(colorRaw),
    saintOfDay: null,
    otherSaintsOfDay: [],
    celebrationName: !isFeriaName(celebrationName) ? celebrationName ?? undefined : undefined,
    hasSaintOfDay: false,
  }
}

export async function fetchExternalGospel(date: string): Promise<GospelEntry | null> {
  const evangelizoDate = toEvangelizoDate(date)
  const evangelizoUrl = `${EVANGELIZO_API_BASE}?date=${evangelizoDate}&type=${EVANGELIZO_TYPE}&lang=${EVANGELIZO_LANG}&content=${EVANGELIZO_CONTENT}`
  const evangelizoPayload = await fetchRaw(evangelizoUrl)
  const evangelizoEntry = parseEvangelizoPayload(evangelizoPayload, date)
  if (evangelizoEntry) {
    return evangelizoEntry
  }

  const calendar = await fetchCalendar(date)
  const gospelRef = extractGospelRef(calendar) || GOSPEL_DEFAULT_REF

  const bibleUrl = `${GOSPEL_API_BASE}/${encodeURIComponent(gospelRef)}`
  const bible = await fetchJson(bibleUrl)
  const bibleRecord = isRecord(bible) ? bible : null
  const bibleText = getString(bibleRecord, 'text')
  if (!bibleText) {
    return null
  }

  const text = bibleText.trim()
  const shortQuote = text.split(/(?<=[.!?])\s/)[0]?.slice(0, 160) || text.slice(0, 160)

  return {
    date,
    reference: getString(bibleRecord, 'reference') || gospelRef,
    text,
    shortQuote,
    patristicComment: null,
  }
}

export async function fetchExternalReadings(date: string): Promise<DailyReadingsResponse | null> {
  const [liturgy, firstReading, psalm, secondReading, gospel] = await Promise.all([
    fetchExternalLiturgy(date),
    fetchEvangelizoReading(date, 'first-reading', 'FR'),
    fetchEvangelizoReading(date, 'psalm', 'PS'),
    fetchEvangelizoReading(date, 'second-reading', 'SR'),
    fetchEvangelizoReading(date, 'gospel', 'GSP'),
  ])

  const readings = [firstReading, psalm, secondReading, gospel].filter(
    (item): item is DailyReading => item !== null
  )
  let gospelForCommentary =
    gospel || readings.find((item) => item.type === 'gospel') || null

  if (readings.length === 0) {
    const fallbackGospel = await fetchExternalGospel(date)
    if (!fallbackGospel) {
      return null
    }

    const fallbackReading: DailyReading = {
      type: 'gospel',
      title: 'Evangelio',
      reference: fallbackGospel.reference,
      text: fallbackGospel.text,
    }
    readings.push(fallbackReading)
    gospelForCommentary = fallbackReading
  }

  const commentary = await fetchCatholicCommentary(date, gospelForCommentary)

  return {
    date,
    liturgicalDayName: liturgy?.liturgicalDayName || 'Lecturas del día',
    season: liturgy?.season || 'ordinary',
    color: liturgy?.color,
    readings,
    commentary,
  }
}
