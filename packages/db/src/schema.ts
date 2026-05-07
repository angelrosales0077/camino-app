/**
 * @camino/db - Drizzle ORM Schema
 * PostgreSQL schema for Camino App
 *
 * Core entities:
 * - users: User accounts + authentication metadata
 * - journal_entries: Encrypted spiritual diary entries
 * - streaks: Users' prayer consistency tracking with grace days
 * - prayer_intentions: Community prayer requests (ephemeral, 7-day expiry)
 * - prayer_responses: Many-to-many link between users and prayer intentions
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Users table
 * - email: unique identifier for authentication
 * - name: optional display name
 * - donatedAt: timestamp when user made first donation (null = not donated)
 *
 * Security note: This table stores auth metadata only.
 * Actual password hashes are managed by Supabase Auth.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    donatedAt: timestamp('donated_at', { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
  })
)

/**
 * Journal Entries table
 * - content: ENCRYPTED text (cipher text only, server never sees plaintext)
 * - gospelDate: ISO 8601 date (YYYY-MM-DD) linking entry to specific Gospel
 * - userId: Foreign key to users (cascade delete)
 *
 * Encryption strategy:
 * Client derives encryption key from Supabase Auth token.
 * Text is encrypted before sending to server.
 * Server stores cipher only, cannot decrypt without user's key.
 */
export const journalEntries = pgTable(
  'journal_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    gospelDate: text('gospel_date').notNull(), // ISO 8601: '2025-05-15'
    content: text('content').notNull(), // Encrypted AES-256
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('journal_entries_user_id_idx').on(table.userId),
    gospelDateIdx: index('journal_entries_gospel_date_idx').on(
      table.gospelDate
    ),
    userGospelDateUnique: uniqueIndex(
      'journal_entries_user_id_gospel_date_unique'
    ).on(table.userId, table.gospelDate),
  })
)

/**
 * Streaks table
 * - currentCount: consecutive days of prayer (0 = not today, 1+ = active streak)
 * - longestCount: all-time record
 * - lastActiveDate: ISO 8601 of last day user checked in
 * - graceDaysUsedThisWeek: 0 or 1 (reset weekly on Sunday 00:00 UTC)
 *
 * Logic:
 * - User checks in → currentCount increments, lastActiveDate updates
 * - Day passed without checkin → currentCount resets to 0 (unless grace used)
 * - Grace day used → currentCount stays same, graceDaysUsedThisWeek = 1
 * - New week → graceDaysUsedThisWeek resets to 0
 */
export const streaks = pgTable(
  'streaks',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    currentCount: integer('current_count').default(0).notNull(),
    lastActiveDate: text('last_active_date'), // ISO 8601: '2025-05-15' or null
    graceDaysUsedThisWeek: integer('grace_days_used').default(0).notNull(),
    longestCount: integer('longest_count').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('streaks_user_id_idx').on(table.userId),
  })
)

/**
 * Prayer Intentions table (Community feature)
 * - text: user's prayer request (max 200 chars, enforced in API)
 * - isAnonymous: true = no author name shown in feed
 * - userId: nullable (for anonymous posts and cascade delete)
 * - prayerCount: how many people clicked "Rezar por esto"
 * - isArchived: true = hidden from feed (after 7 days or 50+ responses)
 * - expiresAt: auto-archive timestamp (created + 7 days)
 *
 * Feed algorithm: sorted by prayerCount ASC (least prayed first),
 * then by createdAt DESC. This prioritizes underserved intentions.
 */
export const prayerIntentions = pgTable(
  'prayer_intentions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    isAnonymous: boolean('is_anonymous').default(false).notNull(),
    text: text('text').notNull(),
    prayerCount: integer('prayer_count').default(0).notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdIdx: index('prayer_intentions_user_id_idx').on(table.userId),
    isArchivedIdx: index('prayer_intentions_is_archived_idx').on(
      table.isArchived
    ),
    expiresAtIdx: index('prayer_intentions_expires_at_idx').on(table.expiresAt),
    feedSortIdx: index('prayer_intentions_feed_sort_idx').on(
      table.isArchived,
      table.prayerCount,
      table.createdAt
    ),
  })
)

/**
 * Prayer Responses table (Many-to-many)
 * - Link between users and prayer intentions
 * - Unique constraint on (intentionId, userId): each user can "rezar" once per intention
 * - createdAt: timestamp for analytics / sorting
 *
 * Idempotency: POST /intentions/:id/pray is idempotent.
 * If user clicks twice, second request returns 200 (no duplicate entry).
 */
export const prayerResponses = pgTable(
  'prayer_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    intentionId: uuid('intention_id')
      .references(() => prayerIntentions.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    intentionIdIdx: index('prayer_responses_intention_id_idx').on(
      table.intentionId
    ),
    userIdIdx: index('prayer_responses_user_id_idx').on(table.userId),
    uniqueResponseIdx: uniqueIndex(
      'prayer_responses_intention_user_unique'
    ).on(table.intentionId, table.userId),
  })
)

/**
 * Saints table
 * - romcalKey: stable key from Romcal calendar
 * - nameEs: normalized Spanish name for display
 * - shortBioEs: brief bio in Spanish (1-2 lines)
 */
export const saints = pgTable(
  'saints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    romcalKey: text('romcal_key').notNull(),
    slug: text('slug').notNull(),
    nameEs: text('name_es').notNull(),
    nameOriginal: text('name_original'),
    shortBioEs: text('short_bio_es'),
    quoteEs: text('quote_es'),
    isMartyr: boolean('is_martyr').default(false).notNull(),
    needsReview: boolean('needs_review').default(true).notNull(),
    source: text('source'),
    sourceName: text('source_name'),
    sourceUrl: text('source_url'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    romcalKeyUnique: uniqueIndex('saints_romcal_key_unique').on(table.romcalKey),
    slugUnique: uniqueIndex('saints_slug_unique').on(table.slug),
  })
)

/**
 * Saint Feasts table
 * - Links saints to a specific feast date in the calendar
 */
export const saintFeasts = pgTable(
  'saint_feasts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    saintId: uuid('saint_id')
      .references(() => saints.id, { onDelete: 'cascade' })
      .notNull(),
    feastMonth: integer('feast_month').notNull(),
    feastDay: integer('feast_day').notNull(),
    feastType: text('feast_type').notNull(),
    isOptional: boolean('is_optional').default(false).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    displayPriority: integer('display_priority').default(100).notNull(),
    romcalKey: text('romcal_key'),
    romcalName: text('romcal_name'),
    source: text('source'),
    sourceName: text('source_name'),
    sourceUrl: text('source_url'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    saintIdIdx: index('saint_feasts_saint_id_idx').on(table.saintId),
    feastDateIdx: index('saint_feasts_month_day_idx').on(table.feastMonth, table.feastDay),
    saintDateUnique: uniqueIndex('saint_feasts_saint_date_unique').on(
      table.saintId,
      table.feastMonth,
      table.feastDay
    ),
  })
)

/**
 * ORM Relations (for eager loading with Drizzle)
 */
export const usersRelations = relations(users, ({ many, one }) => ({
  journalEntries: many(journalEntries),
  streak: one(streaks, {
    fields: [users.id],
    references: [streaks.userId],
  }),
  prayerIntentions: many(prayerIntentions),
  prayerResponses: many(prayerResponses),
}))

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
}))

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}))

export const prayerIntentionsRelations = relations(
  prayerIntentions,
  ({ one, many }) => ({
    author: one(users, {
      fields: [prayerIntentions.userId],
      references: [users.id],
    }),
    responses: many(prayerResponses),
  })
)

export const prayerResponsesRelations = relations(
  prayerResponses,
  ({ one }) => ({
    intention: one(prayerIntentions, {
      fields: [prayerResponses.intentionId],
      references: [prayerIntentions.id],
    }),
    user: one(users, {
      fields: [prayerResponses.userId],
      references: [users.id],
    }),
  })
)

export const saintsRelations = relations(saints, ({ many }) => ({
  feasts: many(saintFeasts),
}))

export const saintFeastsRelations = relations(saintFeasts, ({ one }) => ({
  saint: one(saints, {
    fields: [saintFeasts.saintId],
    references: [saints.id],
  }),
}))
