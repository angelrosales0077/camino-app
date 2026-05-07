/**
 * @camino/db - Database Types and Schema Export
 * Central hub for exporting Drizzle schema and inferred types
 */

// Re-export schema tables
export {
  users,
  journalEntries,
  streaks,
  prayerIntentions,
  prayerResponses,
  saints,
  saintFeasts,
  // Relations
  usersRelations,
  journalEntriesRelations,
  streaksRelations,
  prayerIntentionsRelations,
  prayerResponsesRelations,
  saintsRelations,
  saintFeastsRelations,
} from './schema.js'

// Re-export client
export { getDb, schema } from './client.js'

// Infer types from schema
import { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import {
  users,
  journalEntries,
  streaks,
  prayerIntentions,
  prayerResponses,
  saints,
  saintFeasts,
} from './schema.js'

/**
 * User types
 * - User: Read model (SELECT) - what comes from database
 * - NewUser: Insert model (INSERT) - what we send to database
 */
export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

/**
 * Journal Entry types
 * - JournalEntry: Read model
 * - NewJournalEntry: Insert model
 */
export type JournalEntry = InferSelectModel<typeof journalEntries>
export type NewJournalEntry = InferInsertModel<typeof journalEntries>

/**
 * Streak types
 * - Streak: Read model
 * - NewStreak: Insert model (rarely used, usually only updates)
 */
export type Streak = InferSelectModel<typeof streaks>
export type NewStreak = InferInsertModel<typeof streaks>

/**
 * Prayer Intention types
 * - PrayerIntention: Read model
 * - NewPrayerIntention: Insert model
 */
export type PrayerIntention = InferSelectModel<typeof prayerIntentions>
export type NewPrayerIntention = InferInsertModel<typeof prayerIntentions>

/**
 * Prayer Response types
 * - PrayerResponse: Read model
 * - NewPrayerResponse: Insert model
 */
export type PrayerResponse = InferSelectModel<typeof prayerResponses>
export type NewPrayerResponse = InferInsertModel<typeof prayerResponses>

/**
 * Saint types
 * - Saint: Read model
 * - NewSaint: Insert model
 */
export type Saint = InferSelectModel<typeof saints>
export type NewSaint = InferInsertModel<typeof saints>

/**
 * Saint Feast types
 * - SaintFeast: Read model
 * - NewSaintFeast: Insert model
 */
export type SaintFeast = InferSelectModel<typeof saintFeasts>
export type NewSaintFeast = InferInsertModel<typeof saintFeasts>


