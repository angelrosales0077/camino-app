/**
 * @camino/backend - Santoral provider
 * Keeps saints of the day separate from the liturgical calendar provider.
 */

import { and, asc, desc, eq } from 'drizzle-orm'
import { getDb, saintFeasts, saints } from '@camino/db'
import type { DailySantoral, SaintOfDay } from '@camino/shared'

interface SantoralCandidate extends SaintOfDay {
  displayPriority: number
}

const VATICAN_BASE_URL = 'https://www.vaticannews.va/es/santos'
const FANDOM_BASE_URL =
  'https://santoral.fandom.com/es/wiki/Santoral_Wiki:Artículo_del_día'
const ACI_BASE_URL = 'https://www.aciprensa.com/santos'
const FETCH_TIMEOUT_MS = 7000

const fallbackSantoral: Record<string, SantoralCandidate[]> = {
  '05-06': [
    {
      nameEs: 'Santos Mariano y Santiago, mártires',
      shortBioEs:
        'Clérigos cristianos martirizados en Lambese, Numidia, por exhortar a otros creyentes a permanecer firmes en la fe.',
      quoteEs: null,
      feastType: 'martyrs',
      sourceName: 'Vatican News',
      sourceUrl: `${VATICAN_BASE_URL}/05/06.html`,
      needsReview: true,
      displayPriority: 0,
    },
    {
      nameEs: 'Beata Ana Rosa Gattorno',
      shortBioEs: null,
      quoteEs: null,
      feastType: 'beata',
      sourceName: 'Santoral Wiki',
      sourceUrl: `${FANDOM_BASE_URL}/6_de_mayo`,
      needsReview: true,
      displayPriority: 20,
    },
    {
      nameEs: 'Santo Domingo Savio',
      shortBioEs: null,
      quoteEs: null,
      feastType: 'santo',
      sourceName: 'Santoral Wiki',
      sourceUrl: `${FANDOM_BASE_URL}/6_de_mayo`,
      needsReview: true,
      displayPriority: 21,
    },
    {
      nameEs: 'San Lucio de Cirene',
      shortBioEs: null,
      quoteEs: null,
      feastType: 'santo',
      sourceName: 'Santoral Wiki',
      sourceUrl: `${FANDOM_BASE_URL}/6_de_mayo`,
      needsReview: true,
      displayPriority: 22,
    },
  ],
}

function dateParts(date: string) {
  const [, month, day] = date.split('-').map((part) => Number(part))
  return { month, day }
}

function monthDayKey(month: number, day: number) {
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
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
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHtmlToLines(html: string) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(h1|h2|h3|h4|p|li|div)>/gi, '\n')
    .replace(/<(h1|h2|h3|h4|p|li|div)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')

  return text
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
}

async function fetchHtml(url: string) {
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

function isBoilerplate(line: string) {
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

function toSaint(candidate: SantoralCandidate): SaintOfDay {
  return {
    nameEs: candidate.nameEs,
    shortBioEs: candidate.shortBioEs ?? null,
    quoteEs: candidate.quoteEs ?? null,
    feastType: candidate.feastType ?? null,
    sourceName: candidate.sourceName ?? null,
    sourceUrl: candidate.sourceUrl ?? null,
    needsReview: candidate.needsReview,
  }
}

function looksLikeSaintName(value: string) {
  return /^(s\.|ss\.|san|santo|santa|santos|santas|beato|beata|beatos|beatas|nuestra señora)/i.test(value.trim())
}

function dedupeCandidates(candidates: SantoralCandidate[]) {
  const seen = new Set<string>()
  const deduped: SantoralCandidate[] = []

  for (const candidate of candidates) {
    if (!looksLikeSaintName(candidate.nameEs)) {
      continue
    }

    const key = slugify(candidate.nameEs)
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    deduped.push(candidate)
  }

  return deduped.sort((a, b) => a.displayPriority - b.displayPriority)
}

async function getSantoralFromDb(month: number, day: number) {
  try {
    const db = getDb()
    const rows = await db
      .select({
        nameEs: saints.nameEs,
        shortBioEs: saints.shortBioEs,
        quoteEs: saints.quoteEs,
        feastType: saintFeasts.feastType,
        saintSourceName: saints.sourceName,
        saintSourceUrl: saints.sourceUrl,
        feastSourceName: saintFeasts.sourceName,
        feastSourceUrl: saintFeasts.sourceUrl,
        needsReview: saints.needsReview,
        isPrimary: saintFeasts.isPrimary,
        displayPriority: saintFeasts.displayPriority,
      })
      .from(saintFeasts)
      .innerJoin(saints, eq(saintFeasts.saintId, saints.id))
      .where(and(eq(saintFeasts.feastMonth, month), eq(saintFeasts.feastDay, day)))
      .orderBy(desc(saintFeasts.isPrimary), asc(saintFeasts.displayPriority), asc(saints.nameEs))

    return rows.map((row) => ({
      nameEs: row.nameEs,
      shortBioEs: row.shortBioEs ?? null,
      quoteEs: row.quoteEs ?? null,
      feastType: row.feastType ?? null,
      sourceName: row.feastSourceName ?? row.saintSourceName ?? null,
      sourceUrl: row.feastSourceUrl ?? row.saintSourceUrl ?? null,
      needsReview: row.needsReview,
      displayPriority: row.displayPriority ?? (row.isPrimary ? 0 : 100),
    }))
  } catch {
    return []
  }
}

async function fetchVaticanSaint(month: number, day: number) {
  const url = `${VATICAN_BASE_URL}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}.html`
  const html = await fetchHtml(url)
  if (!html) {
    return null
  }

  const rawLines = stripHtmlToLines(html)
  const lines = rawLines.filter((line) => !isBoilerplate(line))

  // Vatican pages don't always contain a stable "Fecha DD ..." marker in the extracted text.
  // Pick the first saint-like title line instead.
  const title = lines.find((line) => looksLikeSaintName(line))
  if (!title || /^buscar$/i.test(title.trim())) {
    return null
  }

  const titleIndex = lines.indexOf(title)
  const bio = lines
    .slice(titleIndex + 1)
    .find((line) => !isBoilerplate(line) && !/^leer más$/i.test(line))

  return {
    nameEs: title,
    shortBioEs: bio ?? null,
    quoteEs: null,
    feastType: title.toLowerCase().includes('mártir') ? 'martyrs' : null,
    sourceName: 'Vatican News',
    sourceUrl: url,
    needsReview: true,
    displayPriority: 0,
  } satisfies SantoralCandidate
}

async function fetchFandomSaints(month: number, day: number) {
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
  const url = `${FANDOM_BASE_URL}/${day}_de_${monthNames[month - 1]}`
  const html = await fetchHtml(url)
  if (!html) {
    return []
  }

  const lines = stripHtmlToLines(html)
  const listStart = lines.findIndex((line) => /^leer más$/i.test(line))
  const listEnd = lines.findIndex((line) => /^santos de ayer/i.test(line))
  const candidates = lines
    .slice(listStart === -1 ? 0 : listStart + 1, listEnd === -1 ? undefined : listEnd)
    .filter((line) => /^(san|santo|santa|santos|santas|beato|beata|beatos|beatas|nuestra señora)/i.test(line))
    .map((nameEs, index) => ({
      nameEs,
      shortBioEs: null,
      quoteEs: null,
      feastType: /^beata?|^beatos?/i.test(nameEs) ? 'beato' : 'santo',
      sourceName: 'Santoral Wiki',
      sourceUrl: url,
      needsReview: true,
      displayPriority: 20 + index,
    }))

  return candidates
}

async function fetchAciSaints(month: number, day: number) {
  if (month !== new Date().getMonth() + 1 || day !== new Date().getDate()) {
    return []
  }

  const html = await fetchHtml(ACI_BASE_URL)
  if (!html) {
    return []
  }

  const lines = stripHtmlToLines(html)
  const datePattern = new RegExp(`^${day}\\s+`, 'i')
  const start = lines.findIndex((line) => datePattern.test(line))
  if (start === -1) {
    return []
  }

  return lines
    .slice(start + 1, start + 8)
    .filter((line) => /^(san|santo|santa|santos|santas|beato|beata)/i.test(line))
    .map((nameEs, index) => ({
      nameEs,
      shortBioEs: null,
      quoteEs: null,
      feastType: null,
      sourceName: 'ACI Prensa',
      sourceUrl: ACI_BASE_URL,
      needsReview: true,
      displayPriority: 40 + index,
    }))
}

async function fetchExternalSantoral(month: number, day: number) {
  const candidates: SantoralCandidate[] = []
  const vatican = await fetchVaticanSaint(month, day)
  if (vatican) {
    candidates.push(vatican)
  }

  candidates.push(...await fetchFandomSaints(month, day))

  if (candidates.length === 0) {
    candidates.push(...await fetchAciSaints(month, day))
  }

  const fallback = fallbackSantoral[monthDayKey(month, day)] || []
  candidates.push(...fallback)

  return dedupeCandidates(candidates)
}

export async function fetchSantoralForDate(date: string): Promise<DailySantoral> {
  const { month, day } = dateParts(date)
  const dbCandidates = await getSantoralFromDb(month, day)
  const externalCandidates = await fetchExternalSantoral(month, day)
  const candidates = dedupeCandidates([...dbCandidates, ...externalCandidates])
  const primary = candidates[0] ?? null
  const others = candidates.slice(1)
  const sourceName = primary?.sourceName || 'Santoral'

  return {
    date,
    primarySaint: primary ? toSaint(primary) : null,
    otherSaints: others.map(toSaint),
    sourceName,
    sourceUrl: primary?.sourceUrl ?? undefined,
    fetchedAt: new Date().toISOString(),
  }
}
