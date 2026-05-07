/**
 * @camino/shared - Shared Types and Utilities
 *
 * This package serves as the central hub for:
 * 1. API response/request types
 * 2. Shared utility functions and constants
 * 3. Domain model types (liturgy, gospel, etc.)
 *
 * Note: Database types (User, JournalEntry, etc.) are imported directly from @camino/db
 * to avoid circular dependency issues with composite TS builds.
 * Use: import { User, JournalEntry } from '@camino/db'
 *
 * Used by both @camino/mobile and @camino/api
 */

// API Response Wrapper
/**
 * Generic API response type for standardized client-server communication
 * Success: { success: true, data: T }
 * Error: { success: false, error: string }
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Paginated response for feed-based endpoints
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

/**
 * Literals for time-related enums
 */
export type LiturgicalSeason =
  | 'ordinary'
  | 'advent'
  | 'christmas'
  | 'lent'
  | 'holy-week'
  | 'easter'
  | 'martyrs'

export type SaintFeastType =
  | 'solemnity'
  | 'feast'
  | 'memorial'
  | 'optional-memorial'

/**
 * Daily Liturgy structure returned by /liturgy/today endpoint
 */
export interface SaintOfDay {
  nameEs: string
  shortBioEs?: string | null
  quoteEs?: string | null
  feastType?: SaintFeastType | string | null
  sourceName?: string | null
  sourceUrl?: string | null
  needsReview: boolean
}

export interface DailyLiturgy {
  date: string
  liturgicalDayName: string
  season: LiturgicalSeason
  psalterWeek?: number
  calendarWeek?: number
  color?: string
  saintOfDay: SaintOfDay | null
  otherSaintsOfDay: SaintOfDay[]
  celebrationName?: string
  hasSaintOfDay: boolean
}

export interface DailySantoral {
  date: string
  primarySaint: SaintOfDay | null
  otherSaints: SaintOfDay[]
  sourceName: string
  sourceUrl?: string
  fetchedAt?: string
}

export interface PrayerIntentionFeedItem {
  id: string
  userId: string | null
  isAnonymous: boolean
  text: string
  prayerCount: number
  isArchived: boolean
  createdAt: Date | string
  expiresAt: Date | string
  authorName: string | null
  hasPrayed: boolean
}

/**
 * Gospel entry structure
 */
export interface GospelEntry {
  date: string // ISO 8601: '2025-05-15'
  reference: string // 'Juan 15, 1-8'
  text: string
  shortQuote: string // main thought, for sharing
  patristicComment: PatristicComment | null
}

export interface PatristicComment {
  author: string // 'San Agustín de Hipona'
  century: string // 'Siglo IV'
  text: string
}

export type BreviaryHourKey =
  | 'office-of-readings'
  | 'lauds'
  | 'terce'
  | 'sext'
  | 'none'
  | 'vespers'
  | 'compline'

export type BreviarySectionType =
  | 'intro'
  | 'examination'
  | 'hymn'
  | 'psalmody'
  | 'short-reading'
  | 'responsory'
  | 'gospel-canticle'
  | 'intercessions'
  | 'lords-prayer'
  | 'final-prayer'
  | 'conclusion'
  | 'marian-antiphon'
  | 'unknown'

export interface BreviarySection {
  type: BreviarySectionType
  title: string
  content: string[]
}

export interface BreviaryHour {
  date: string
  hour: BreviaryHourKey
  title: string
  subtitle?: string
  sourceName: string
  sourceUrl?: string
  fetchedAt?: string
  sections: BreviarySection[]
}

export interface BreviaryHourSummary {
  hour: BreviaryHourKey
  title: string
  subtitle: string
  description: string
  available: boolean
}

export interface BreviaryDay {
  date: string
  sourceName: string
  fetchedAt?: string
  hours: BreviaryHourSummary[]
}

export const VERSION = '0.0.1'
