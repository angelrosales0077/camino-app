/**
 * @camino/mobile - String & Validation Utilities
 */

import { VALIDATION } from '../config/constants'

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email)
}

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= VALIDATION.PASSWORD_MIN_LENGTH
}

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Remove accents from text
 */
export const removeAccents = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Convert text to slug
 */
export const slugify = (text: string): string => {
  return removeAccents(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Format number with thousand separators
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-ES').format(num)
}

/**
 * Get prayer count display text
 */
export const getPrayerCountText = (count: number): string => {
  if (count === 0) return 'Sin rezos'
  if (count === 1) return '1 rezo'
  return `${count} rezos`
}

/**
 * Get streak display text
 */
export const getStreakText = (count: number): string => {
  if (count === 0) return 'Sin racha'
  if (count === 1) return '1 día'
  if (count < 7) return `${count} días`
  if (count < 30) return `${Math.floor(count / 7)} semanas`
  return `${Math.floor(count / 30)} meses`
}

/**
 * Validate journal entry length
 */
export const isValidJournalEntry = (text: string): boolean => {
  return text.length > 0 && text.length <= VALIDATION.JOURNAL_ENTRY_MAX_LENGTH
}

/**
 * Validate prayer intention length
 */
export const isValidPrayerIntention = (text: string): boolean => {
  return text.length > 0 && text.length <= VALIDATION.PRAYER_INTENTION_MAX_LENGTH
}
