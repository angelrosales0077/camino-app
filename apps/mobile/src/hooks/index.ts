/**
 * @camino/mobile - Custom Hooks
 * Domain-specific hooks for liturgy, gospel, streak, and journal
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiturgyStore, useUserStore } from '../stores'
import { apiClient, API_ENDPOINTS, CACHE_TIMES, GC_TIMES } from '../config'
import type {
  BreviaryDay,
  BreviaryHour,
  BreviaryHourKey,
  DailyReadingsResponse,
  DailyLiturgy,
  GospelEntry,
  PaginatedResponse,
  PrayerIntentionFeedItem,
} from '@camino/shared'
import type { JournalEntry, Streak, PrayerIntention, PrayerResponse } from '@camino/db'

interface CreateJournalEntryInput {
  gospelDate: string
  content: string
}

interface UpdateJournalEntryInput {
  id: string
  content: string
}

interface CreatePrayerIntentionInput {
  text: string
  isAnonymous?: boolean
}

const todayIso = () => new Date().toISOString().split('T')[0]

/**
 * Fetch gospel for specific date
 * Offline-first: stale-while-revalidate pattern
 */
export function useGospel(date: string = 'today') {
  const token = useUserStore((state) => state.authToken)

  return useQuery({
    queryKey: ['gospel', date],
    queryFn: async () => {
      const endpoint = date === 'today' ? API_ENDPOINTS.GOSPEL_TODAY : API_ENDPOINTS.GOSPEL_BY_DATE(date)
      const result = await apiClient.get<GospelEntry>(endpoint, token || undefined)

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    staleTime: CACHE_TIMES.GOSPEL,
    gcTime: GC_TIMES.GOSPEL,
  })
}

/**
 * Fetch daily liturgy (season, saint, colors)
 * Server is source of truth for liturgical calendar
 */
export function useDailyLiturgy(date: string = todayIso()) {
  const { setSeason } = useLiturgyStore()
  const token = useUserStore((state) => state.authToken)

  return useQuery({
    queryKey: ['liturgy', 'santoral-v2', date],
    queryFn: async () => {
      const endpoint = date === 'today' ? API_ENDPOINTS.LITURGY_TODAY : API_ENDPOINTS.LITURGY_BY_DATE(date)
      const result = await apiClient.get<DailyLiturgy>(endpoint, token || undefined)

      if (!result.success) {
        throw new Error(result.error)
      }

      if (__DEV__) {
        console.log('[useDailyLiturgy]', {
          date: result.data.date,
          hasSaintOfDay: result.data.hasSaintOfDay,
          saintOfDay: result.data.saintOfDay?.nameEs,
          otherSaintsCount: result.data.otherSaintsOfDay?.length ?? 0,
        })
      }

      setSeason(result.data.season)
      return result.data
    },
    staleTime: CACHE_TIMES.LITURGY,
    gcTime: GC_TIMES.LITURGY,
  })
}

/**
 * Get current liturgical colors and palette
 */
export function useLiturgicalColors() {
  const season = useLiturgyStore((state) => state.season)

  const palettes: Record<typeof season, { primary: string; accent: string; light: string }> = {
    ordinary: { primary: '#2D5A3D', accent: '#4A7C5C', light: '#E8F0EB' },
    advent: { primary: '#4A2C6B', accent: '#6B4A8A', light: '#EDE8F5' },
    christmas: { primary: '#8B6914', accent: '#B8860B', light: '#FAF5E4' },
    lent: { primary: '#5C2D6B', accent: '#7A4A8A', light: '#F0EAF5' },
    'holy-week': { primary: '#7B1A2A', accent: '#A02535', light: '#F5E8EA' },
    easter: { primary: '#8B6914', accent: '#C9A84C', light: '#FDFAF0' },
    martyrs: { primary: '#8B2020', accent: '#B03030', light: '#F5EAEA' },
  }

  return palettes[season]
}

export function useDailyReadings(date: string = 'today') {
  const token = useUserStore((state) => state.authToken)

  return useQuery({
    queryKey: ['readings', date],
    queryFn: async () => {
      const endpoint = date === 'today'
        ? API_ENDPOINTS.READINGS_TODAY
        : API_ENDPOINTS.READINGS_BY_DATE(date)
      const result = await apiClient.get<DailyReadingsResponse>(
        endpoint,
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    staleTime: CACHE_TIMES.GOSPEL,
    gcTime: GC_TIMES.GOSPEL,
  })
}

export function useBreviaryDay(date: string = 'today') {
  const token = useUserStore((state) => state.authToken)

  return useQuery({
    queryKey: ['breviary', date],
    queryFn: async () => {
      const endpoint = date === 'today'
        ? API_ENDPOINTS.BREVIARY_TODAY
        : API_ENDPOINTS.BREVIARY_BY_DATE(date)
      const result = await apiClient.get<BreviaryDay>(
        endpoint,
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    staleTime: CACHE_TIMES.BREVIARY,
    gcTime: GC_TIMES.BREVIARY,
  })
}

export function useBreviaryHour(
  date: string,
  hour: BreviaryHourKey
) {
  const token = useUserStore((state) => state.authToken)

  return useQuery({
    queryKey: ['breviary', date, hour],
    queryFn: async () => {
      const result = await apiClient.get<BreviaryHour>(
        API_ENDPOINTS.BREVIARY_HOUR(date, hour),
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    staleTime: CACHE_TIMES.BREVIARY,
    gcTime: GC_TIMES.BREVIARY,
  })
}

/**
 * Track user streak (prayer days completed)
 */
export function useStreak() {
  const token = useUserStore((state) => state.authToken)

  return useQuery({
    queryKey: ['streak'],
    enabled: Boolean(token),
    queryFn: async () => {
      const result = await apiClient.get<Streak>(API_ENDPOINTS.STREAK_INFO, token || undefined)

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    staleTime: CACHE_TIMES.STREAK,
    gcTime: GC_TIMES.STREAK,
  })
}

/**
 * Check if user has completed today's prayer
 */
export function useTodayCheckIn() {
  const token = useUserStore((state) => state.authToken)

  return useQuery({
    queryKey: ['checkin', 'today'],
    enabled: Boolean(token),
    queryFn: async () => {
      const result = await apiClient.get<Streak>(
        API_ENDPOINTS.STREAK_INFO,
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      const today = new Date().toISOString().split('T')[0]
      const lastDate = result.data.lastActiveDate
        ? result.data.lastActiveDate.split('T')[0]
        : null

      return {
        completed: lastDate === today,
        timestamp: result.data.lastActiveDate,
      }
    },
    staleTime: CACHE_TIMES.STREAK,
    gcTime: GC_TIMES.STREAK,
  })
}

/**
 * Fetch paginated journal entries
 */
export function useJournalEntries(limit = 10, page = 1) {
  const token = useUserStore((state) => state.authToken)

  return useQuery({
    queryKey: ['journal', limit, page],
    enabled: Boolean(token),
    queryFn: async () => {
      const result = await apiClient.get<PaginatedResponse<JournalEntry>>(
        API_ENDPOINTS.JOURNAL_LIST(limit, page),
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    staleTime: CACHE_TIMES.INTENTIONS,
    gcTime: GC_TIMES.INTENTIONS,
  })
}

export function useJournalEntry(id?: string) {
  const token = useUserStore((state) => state.authToken)

  return useQuery({
    queryKey: ['journal-entry', id],
    enabled: Boolean(id && token),
    queryFn: async () => {
      if (!id) {
        throw new Error('Journal entry id is required')
      }

      const result = await apiClient.get<JournalEntry>(
        API_ENDPOINTS.JOURNAL_BY_ID(id),
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    staleTime: CACHE_TIMES.INTENTIONS,
    gcTime: GC_TIMES.INTENTIONS,
  })
}

/**
 * Fetch prayer intentions feed (sorted by least prayed first)
 */
export function usePrayerIntentions(limit = 10, page = 1) {
  const token = useUserStore((state) => state.authToken)

  return useQuery({
    queryKey: ['intentions', limit, page],
    queryFn: async () => {
      const result = await apiClient.get<PaginatedResponse<PrayerIntentionFeedItem>>(
        API_ENDPOINTS.INTENTIONS_LIST(limit, page),
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    staleTime: CACHE_TIMES.INTENTIONS,
    gcTime: GC_TIMES.INTENTIONS,
  })
}

/**
 * Create journal entry (with client-side encryption before transmission)
 */
export const useCreateJournalEntry = () => {
  const token = useUserStore((state) => state.authToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateJournalEntryInput) => {
      const result = await apiClient.post<JournalEntry>(
        API_ENDPOINTS.JOURNAL_CREATE,
        data,
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['journal'] })
      queryClient.setQueryData(['journal-entry', entry.id], entry)
    },
  })
}

/**
 * Update journal entry content.
 */
export const useUpdateJournalEntry = () => {
  const token = useUserStore((state) => state.authToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, content }: UpdateJournalEntryInput) => {
      const result = await apiClient.patch<JournalEntry>(
        API_ENDPOINTS.JOURNAL_UPDATE(id),
        { content },
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['journal'] })
      queryClient.setQueryData(['journal-entry', entry.id], entry)
    },
  })
}

/**
 * Delete journal entry.
 */
export const useDeleteJournalEntry = () => {
  const token = useUserStore((state) => state.authToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await apiClient.delete<{ id: string }>(
        API_ENDPOINTS.JOURNAL_DELETE(id),
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ['journal'] })
      queryClient.removeQueries({ queryKey: ['journal-entry', deleted.id] })
    },
  })
}

/**
 * Create prayer intention
 */
export const useCreatePrayerIntention = () => {
  const token = useUserStore((state) => state.authToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePrayerIntentionInput) => {
      const result = await apiClient.post<PrayerIntention>(
        API_ENDPOINTS.INTENTIONS_CREATE,
        data,
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intentions'] })
    },
  })
}

/**
 * Submit prayer for intention
 */
export const usePrayForIntention = () => {
  const token = useUserStore((state) => state.authToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (intentionId: string) => {
      const result = await apiClient.post<PrayerResponse>(
        API_ENDPOINTS.INTENTIONS_PRAY(intentionId),
        {},
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intentions'] })
    },
  })
}

/**
 * Check in (mark prayer completed for today)
 */
export const useCheckInPrayer = () => {
  const token = useUserStore((state) => state.authToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const result = await apiClient.post<Streak>(
        API_ENDPOINTS.STREAK_CHECK_IN,
        {},
        token || undefined
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      return result.data
    },
    onSuccess: (streak) => {
      queryClient.setQueryData(['streak'], streak)
      queryClient.invalidateQueries({ queryKey: ['streak'] })
      queryClient.invalidateQueries({ queryKey: ['checkin', 'today'] })
    },
  })
}
