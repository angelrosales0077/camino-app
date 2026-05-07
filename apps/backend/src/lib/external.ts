import type { DailyLiturgy, GospelEntry } from '@camino/shared'
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

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ')
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
      'Evangelio del dia'
    const textRaw =
      extractTag(payload, ['text', 'content', 'reading']) ||
      extractTag(payload, ['body']) ||
      payload
    const text = decodeEntities(stripHtml(textRaw))
      .replace(/\s+/g, ' ')
      .trim()

    if (!text) {
      return null
    }

    let filtered = repairEncoding(text)
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
      'Evangelio del dia'
    const textRaw =
      getString(readingRecord, 'text') ||
      getString(readingRecord, 'content') ||
      getString(dataRecord, 'text') ||
      ''
    const text = repairEncoding(decodeEntities(stripHtml(String(textRaw))))
      .replace(/\s+/g, ' ')
      .trim()
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
