/**
 * @camino/mobile - Environment Configuration
 */

import { Platform } from 'react-native'

const DEFAULT_API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3100'
  : 'http://localhost:3100'

const RAILWAY_API_URL = 'https://caminobackend-production.up.railway.app/api'

const isLocalishUrl = (value: string) => {
  const v = value.trim().toLowerCase()
  return (
    v.includes('localhost') ||
    v.includes('127.0.0.1') ||
    v.includes('10.0.2.2') ||
    v.startsWith('http://192.168.') ||
    v.startsWith('https://192.168.')
  )
}

const normalizeBaseUrl = (value: string) => {
  // Trim, remove trailing slash. Keep a single `/api` if present.
  const trimmed = value.trim().replace(/\/+$/, '')
  return trimmed
}

const resolveApiUrl = ({
  raw,
  allowLocal,
  fallback,
}: {
  raw: string | undefined
  allowLocal: boolean
  fallback: string
}) => {
  if (!raw || !raw.trim()) return fallback
  const normalized = normalizeBaseUrl(raw)
  if (!allowLocal && isLocalishUrl(normalized)) return fallback
  return normalized
}

const ENV = {
  dev: {
    apiUrl: resolveApiUrl({
      raw: process.env.EXPO_PUBLIC_API_URL,
      allowLocal: true,
      fallback: DEFAULT_API_URL,
    }),
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY || '',
    enableApiDiagnostics:
      __DEV__ || process.env.EXPO_PUBLIC_API_DIAGNOSTICS === '1',
  },
  prod: {
    apiUrl: resolveApiUrl({
      raw: process.env.EXPO_PUBLIC_API_URL,
      allowLocal: false,
      fallback: RAILWAY_API_URL,
    }),
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY || '',
    // Preview/production APK debugging: opt-in via EXPO_PUBLIC_API_DIAGNOSTICS=1
    enableApiDiagnostics: process.env.EXPO_PUBLIC_API_DIAGNOSTICS === '1',
  },
}

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev
  }
  return ENV.prod
}

export default getEnvVars()
