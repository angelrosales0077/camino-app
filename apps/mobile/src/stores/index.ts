/**
 * @camino/mobile - Zustand stores
 * Global state management (user, liturgy, settings)
 */

import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  name?: string | null
}

/**
 * User store - authentication and profile
 */
export interface UserStore {
  user: AuthUser | null
  authToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  setAuthToken: (token: string | null) => void
  setCredentials: (user: AuthUser | null, token: string | null, refreshToken?: string | null) => void
  logout: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  authToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthToken: (token) => set({ authToken: token }),
  setCredentials: (user, token, refreshToken = null) =>
    set({
      user,
      authToken: token,
      refreshToken,
      isAuthenticated: !!user && !!token,
    }),
  logout: () =>
    set({
      user: null,
      authToken: null,
      refreshToken: null,
      isAuthenticated: false,
    }),
}))

/**
 * Liturgy store - current season and colors
 */
export interface LiturgyStore {
  season: 'ordinary' | 'advent' | 'christmas' | 'lent' | 'holy-week' | 'easter' | 'martyrs'
  setSeason: (season: LiturgyStore['season']) => void
}

export const useLiturgyStore = create<LiturgyStore>((set) => ({
  season: 'ordinary',
  setSeason: (season) => set({ season }),
}))

/**
 * Settings store - user preferences
 */
export interface SettingsStore {
  notificationsEnabled: boolean
  fontSize: 'sm' | 'md' | 'lg'
  darkMode: boolean
  toggleNotifications: () => void
  setFontSize: (size: 'sm' | 'md' | 'lg') => void
  setDarkMode: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  notificationsEnabled: true,
  fontSize: 'md',
  darkMode: false,
  toggleNotifications: () =>
    set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
  setFontSize: (fontSize) => set({ fontSize }),
  setDarkMode: (darkMode) => set({ darkMode }),
}))
