/**
 * @camino/mobile - Application Constants
 */

// Cache & Stale Times (in milliseconds)
export const CACHE_TIMES = {
  GOSPEL: 6 * 60 * 60 * 1000, // 6 hours
  LITURGY: 24 * 60 * 60 * 1000, // 24 hours
  INTENTIONS: 5 * 60 * 1000, // 5 minutes
  STREAK: 1 * 60 * 1000, // 1 minute
  SAINT: 24 * 60 * 60 * 1000, // 24 hours
  BREVIARY: 6 * 60 * 60 * 1000, // 6 hours
} as const

export const GC_TIMES = {
  GOSPEL: 48 * 60 * 60 * 1000, // 48 hours
  LITURGY: 7 * 24 * 60 * 60 * 1000, // 7 days
  INTENTIONS: 1 * 60 * 60 * 1000, // 1 hour
  STREAK: 30 * 60 * 1000, // 30 minutes
  SAINT: 2 * 24 * 60 * 60 * 1000, // 2 days
  BREVIARY: 24 * 60 * 60 * 1000, // 24 hours
} as const

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  
  // Gospel endpoints
  GOSPEL_TODAY: '/api/gospel/today',
  GOSPEL_BY_DATE: (date: string) => `/api/gospel/${date}`,
  
  // Liturgy endpoints
  LITURGY_TODAY: '/api/liturgy/today',
  LITURGY_BY_DATE: (date: string) => `/api/liturgy/${date}`,

  // Breviary endpoints
  BREVIARY_TODAY: '/api/breviary/today',
  BREVIARY_BY_DATE: (date: string) => `/api/breviary/${date}`,
  BREVIARY_HOUR: (date: string, hour: string) =>
    `/api/breviary/${date}/${hour}`,
  
  // Journal endpoints
  JOURNAL_CREATE: '/api/journal',
  JOURNAL_LIST: (limit?: number, page?: number) => 
    `/api/journal?limit=${limit || 10}&page=${page || 1}`,
  JOURNAL_BY_ID: (id: string) => `/api/journal/${id}`,
  JOURNAL_BY_DATE: (date: string) => `/api/journal/${date}`,
  JOURNAL_UPDATE: (id: string) => `/api/journal/${id}`,
  JOURNAL_DELETE: (id: string) => `/api/journal/${id}`,
  
  // Prayer intentions endpoints
  INTENTIONS_LIST: (limit?: number, page?: number) =>
    `/api/intentions?limit=${limit || 10}&page=${page || 1}`,
  INTENTIONS_CREATE: '/api/intentions',
  INTENTIONS_BY_ID: (id: string) => `/api/intentions/${id}`,
  INTENTIONS_UPDATE: (id: string) => `/api/intentions/${id}`,
  INTENTIONS_DELETE: (id: string) => `/api/intentions/${id}`,
  INTENTIONS_PRAY: (id: string) => `/api/intentions/${id}/pray`,
  
  // Streak endpoints
  STREAK_INFO: '/api/streak',
  STREAK_CHECK_IN: '/api/streak/checkin',
  
  // Auth endpoints
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_LOGOUT: '/auth/logout',
  
  // User endpoints
  USER_PROFILE: '/user/profile',
  USER_UPDATE: '/user/profile',
  USER_DELETE: '/user/profile',
} as const

// Prayer streak constants
export const STREAK_CONSTANTS = {
  GRACE_DAYS_PER_WEEK: 1,
  REQUIRED_PRAYERS_PER_DAY: 1,
  INTENTION_AUTO_ARCHIVE_DAYS: 7,
  INTENTION_AUTO_ARCHIVE_RESPONSES: 50,
} as const

// Fonts
export const FONTS = {
  SERIF: {
    name: 'Lora',
    weights: {
      400: 'Lora_400Regular',
      600: 'Lora_600SemiBold',
      700: 'Lora_700Bold',
    },
  },
  SANS: {
    name: 'Inter',
    weights: {
      400: 'Inter_400Regular',
      500: 'Inter_500Medium',
      600: 'Inter_600SemiBold',
      700: 'Inter_700Bold',
    },
  },
} as const

// Validation constants
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  JOURNAL_ENTRY_MAX_LENGTH: 5000,
  PRAYER_INTENTION_MAX_LENGTH: 500,
  SAINT_NAME_MAX_LENGTH: 200,
} as const

// Prayer times (approximate, in 24h format)
export const PRAYER_TIMES = {
  LAUDES: '06:00', // Morning praise
  TERCE: '09:00', // Third hour
  SEXT: '12:00', // Sixth hour
  NONE: '15:00', // Ninth hour
  VESPERS: '18:00', // Evening praise
  COMPLINE: '21:00', // Night prayer
} as const
