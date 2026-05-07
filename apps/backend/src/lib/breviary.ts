/**
 * @camino/backend - Breviary provider
 * Scrapes and normalizes Liturgia de las Horas content.
 */

import type {
  BreviaryDay,
  BreviaryHour,
  BreviaryHourKey,
  BreviaryHourSummary,
  BreviarySection,
  BreviarySectionType,
} from '@camino/shared'

export interface BreviaryProvider {
  getHour(date: string, hour: BreviaryHourKey): Promise<BreviaryHour>
  getDay(date: string): Promise<BreviaryDay>
}

interface HourConfig {
  hour: BreviaryHourKey
  title: string
  subtitle: string
  description: string
  path: string
}

interface CacheEntry {
  value: BreviaryHour
  fetchedAtMs: number
}

const SOURCE_NAME = 'Liturgia de las Horas'
const SOURCE_BASE_URL = 'https://www.liturgiadelashoras.com.ar'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 8000

export const breviaryHours: HourConfig[] = [
  {
    hour: 'office-of-readings',
    title: 'Oficio de Lectura',
    subtitle: 'Lectura orante',
    description: 'Lectura extensa y salmos para meditar con calma.',
    path: '/oficio-de-lecturas',
  },
  {
    hour: 'lauds',
    title: 'Laudes',
    subtitle: 'Oración de la mañana',
    description: 'Oración de la mañana.',
    path: '/laudes',
  },
  {
    hour: 'terce',
    title: 'Tercia',
    subtitle: 'Oración de media mañana',
    description: 'Oración de media mañana.',
    path: '/hora-intermedia',
  },
  {
    hour: 'sext',
    title: 'Sexta',
    subtitle: 'Oración del mediodía',
    description: 'Oración del mediodía.',
    path: '/hora-intermedia',
  },
  {
    hour: 'none',
    title: 'Nona',
    subtitle: 'Oración de media tarde',
    description: 'Oración de media tarde.',
    path: '/hora-intermedia',
  },
  {
    hour: 'vespers',
    title: 'Vísperas',
    subtitle: 'Oración de la tarde',
    description: 'Oración de la tarde.',
    path: '/visperas',
  },
  {
    hour: 'compline',
    title: 'Completas',
    subtitle: 'Oración antes del descanso',
    description: 'Oración antes del descanso.',
    path: '/completas',
  },
]

const cache = new Map<string, CacheEntry>()

function getHourConfig(hour: BreviaryHourKey) {
  const config = breviaryHours.find((item) => item.hour === hour)
  if (!config) {
    throw new Error(`Unsupported breviary hour: ${hour}`)
  }
  return config
}

function cacheKey(date: string, hour: BreviaryHourKey) {
  return `${date}:${hour}`
}

function isFresh(entry: CacheEntry) {
  return Date.now() - entry.fetchedAtMs < CACHE_TTL_MS
}

function decodeEntities(value: string) {
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

function normalizeWhitespace(value: string) {
  return decodeEntities(value)
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function stripHtmlToLines(html: string) {
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i)
  const entryMatch = html.match(/<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
  const source = entryMatch?.[1] || articleMatch?.[0] || html
  const withBreaks = source
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h1|h2|h3|h4|li|div)>/gi, '\n')
    .replace(/<(p|h1|h2|h3|h4|li|div)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')

  return normalizeWhitespace(withBreaks)
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .filter((line) => !isBoilerplate(line))
}

function isBoilerplate(line: string) {
  const normalized = line.toLowerCase()
  return (
    normalized === 'breviario' ||
    normalized === '- menú -' ||
    normalized === 'buscar:' ||
    normalized === 'entradas recientes' ||
    normalized === 'archivos' ||
    normalized === 'main menu' ||
    normalized.startsWith('liturgia de las horas online') ||
    normalized.startsWith('libro de liturgia de las horas')
  )
}

function normalizeHeading(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

function getSectionType(title: string): BreviarySectionType {
  const normalized = normalizeHeading(title)

  if (
    normalized.includes('INVITATORIO') ||
    normalized === 'OFICIO DE LECTURA' ||
    normalized === 'OFICIO DE LECTURAS' ||
    normalized === 'LAUDES' ||
    normalized === 'HORA INTERMEDIA' ||
    normalized === 'TERCIA' ||
    normalized === 'SEXTA' ||
    normalized === 'NONA' ||
    normalized === 'VISPERAS' ||
    normalized === 'COMPLETAS'
  ) {
    return 'intro'
  }
  if (normalized.includes('EXAMEN DE CONCIENCIA')) return 'examination'
  if (normalized === 'HIMNO') return 'hymn'
  if (normalized === 'SALMODIA') return 'psalmody'
  if (normalized.startsWith('LECTURA BREVE')) return 'short-reading'
  if (normalized.includes('RESPONSORIO BREVE')) return 'responsory'
  if (normalized.includes('CANTICO EVANGELICO')) return 'gospel-canticle'
  if (normalized === 'PRECES') return 'intercessions'
  if (normalized === 'PADRE NUESTRO') return 'lords-prayer'
  if (normalized === 'ORACION') return 'final-prayer'
  if (normalized === 'CONCLUSION') return 'conclusion'
  if (normalized.includes('INVOCACION A LA SANTISIMA VIRGEN')) {
    return 'marian-antiphon'
  }

  return 'unknown'
}

function isKnownHeading(line: string) {
  const normalized = normalizeHeading(line)
  const headings = [
    'INVITATORIO',
    'OFICIO DE LECTURA',
    'OFICIO DE LECTURAS',
    'LAUDES',
    'HORA INTERMEDIA',
    'TERCIA',
    'SEXTA',
    'NONA',
    'VISPERAS',
    'COMPLETAS',
    'EXAMEN DE CONCIENCIA',
    'HIMNO',
    'SALMODIA',
    'RESPONSORIO BREVE',
    'CANTICO EVANGELICO',
    'PRECES',
    'PADRE NUESTRO',
    'ORACION',
    'CONCLUSION',
    'INVOCACION A LA SANTISIMA VIRGEN',
  ]

  return (
    headings.includes(normalized) ||
    normalized.startsWith('LECTURA BREVE')
  )
}

function buildSections(lines: string[], fallbackTitle: string): BreviarySection[] {
  const sections: BreviarySection[] = []
  let current: BreviarySection = {
    type: 'intro',
    title: fallbackTitle,
    content: [],
  }

  for (const line of lines) {
    if (isKnownHeading(line)) {
      if (current.content.length > 0 || sections.length === 0) {
        sections.push(current)
      }
      current = {
        type: getSectionType(line),
        title: line,
        content: [],
      }
      continue
    }

    current.content.push(line)
  }

  if (current.content.length > 0) {
    sections.push(current)
  }

  return sections.filter((section) => section.content.length > 0)
}

function filterHourSections(
  sections: BreviarySection[],
  hour: BreviaryHourKey
) {
  if (hour !== 'terce' && hour !== 'sext' && hour !== 'none') {
    return sections
  }

  const target = hour === 'terce' ? 'TERCIA' : hour === 'sext' ? 'SEXTA' : 'NONA'
  const start = sections.findIndex(
    (section) => normalizeHeading(section.title) === target
  )
  if (start === -1) {
    return sections
  }

  const next = sections.findIndex(
    (section, index) =>
      index > start &&
      ['TERCIA', 'SEXTA', 'NONA'].includes(normalizeHeading(section.title))
  )

  return sections.slice(start, next === -1 ? undefined : next)
}

async function fetchHtml(url: string) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CaminoApp/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Breviary source returned HTTP ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timer)
  }
}

export class ScrapedBreviaryProvider implements BreviaryProvider {
  async getHour(date: string, hour: BreviaryHourKey): Promise<BreviaryHour> {
    const config = getHourConfig(hour)
    const key = cacheKey(date, hour)
    const cached = cache.get(key)
    if (cached && isFresh(cached)) {
      return cached.value
    }

    const sourceUrl = `${SOURCE_BASE_URL}${config.path}`

    try {
      const html = await fetchHtml(sourceUrl)
      const lines = stripHtmlToLines(html)
      const parsed = buildSections(lines, config.title)
      const sections = filterHourSections(parsed, hour)
      if (sections.length === 0) {
        throw new Error('Breviary source returned no sections')
      }

      const fetchedAt = new Date().toISOString()
      const value: BreviaryHour = {
        date,
        hour,
        title: config.title,
        subtitle: config.subtitle,
        sourceName: SOURCE_NAME,
        sourceUrl,
        fetchedAt,
        sections,
      }

      cache.set(key, { value, fetchedAtMs: Date.now() })
      return value
    } catch (error) {
      if (cached) {
        return cached.value
      }
      throw error
    }
  }

  async getDay(date: string): Promise<BreviaryDay> {
    const results = await Promise.allSettled(
      breviaryHours.map((config) => this.getHour(date, config.hour))
    )

    const hours: BreviaryHourSummary[] = breviaryHours.map((config, index) => ({
      hour: config.hour,
      title: config.title,
      subtitle: config.subtitle,
      description: config.description,
      available:
        results[index]?.status === 'fulfilled' &&
        (results[index] as PromiseFulfilledResult<BreviaryHour>).value.sections.length > 0,
    }))

    const firstFulfilled = results.find(
      (result): result is PromiseFulfilledResult<BreviaryHour> =>
        result.status === 'fulfilled'
    )

    return {
      date,
      sourceName: SOURCE_NAME,
      fetchedAt: firstFulfilled?.value.fetchedAt,
      hours,
    }
  }
}

export const breviaryProvider = new ScrapedBreviaryProvider()
