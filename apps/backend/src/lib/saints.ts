/**
 * @camino/backend - Saints lookup helpers
 */

import { and, eq } from 'drizzle-orm'
import { getDb, saints, saintFeasts } from '@camino/db'
import type { SaintFeastType } from '@camino/shared'

export interface SaintOfDay {
  saintId: string
  nameEs: string
  feastType: SaintFeastType
  shortBioEs: string | null
  quoteEs: string | null
  sourceName: string | null
  sourceUrl: string | null
  needsReview: boolean
  reviewedAt: Date | null
}

const feastPriority: Record<SaintFeastType, number> = {
  solemnity: 4,
  feast: 3,
  memorial: 2,
  'optional-memorial': 1,
}

const saintNameEditorialMap: Record<string, string> = {
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

function normalizeSaintName(name: string) {
  return saintNameEditorialMap[name] || name
}

function normalizeFeastType(value: string): SaintFeastType {
  const normalized = value.toLowerCase()
  if (normalized.includes('solemnity')) return 'solemnity'
  if (normalized.includes('feast')) return 'feast'
  if (normalized.includes('optional')) return 'optional-memorial'
  if (normalized.includes('memorial')) return 'memorial'
  return 'memorial'
}

export async function getSaintForDate(date: string): Promise<SaintOfDay | null> {
  const parts = date.split('-').map((segment) => Number(segment))
  if (parts.length !== 3 || Number.isNaN(parts[1]) || Number.isNaN(parts[2])) {
    return null
  }

  const feastMonth = parts[1]
  const feastDay = parts[2]

  const db = getDb()
  const rows = await db
    .select({
      saintId: saints.id,
      nameEs: saints.nameEs,
      shortBioEs: saints.shortBioEs,
      quoteEs: saints.quoteEs,
      sourceName: saints.sourceName,
      sourceUrl: saints.sourceUrl,
      needsReview: saints.needsReview,
      reviewedAt: saints.reviewedAt,
      feastType: saintFeasts.feastType,
    })
    .from(saintFeasts)
    .innerJoin(saints, eq(saintFeasts.saintId, saints.id))
    .where(and(eq(saintFeasts.feastMonth, feastMonth), eq(saintFeasts.feastDay, feastDay)))

  if (rows.length === 0) {
    return null
  }

  const sorted = rows
    .map((row) => ({
      ...row,
      feastType: normalizeFeastType(row.feastType),
    }))
    .sort((a, b) => feastPriority[b.feastType] - feastPriority[a.feastType])

  const best = sorted[0]

  return {
    saintId: best.saintId,
    nameEs: normalizeSaintName(best.nameEs),
    feastType: best.feastType,
    shortBioEs: best.shortBioEs ?? null,
    quoteEs: best.quoteEs ?? null,
    sourceName: best.sourceName ?? null,
    sourceUrl: best.sourceUrl ?? null,
    needsReview: best.needsReview,
    reviewedAt: best.reviewedAt ?? null,
  }
}
