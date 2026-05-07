/**
 * @camino/mobile - Environment Configuration
 */

import { Platform } from 'react-native'

const DEFAULT_API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3100'
  : 'http://localhost:3100'

const ENV = {
  dev: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY || '',
  },
  prod: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.camino.app',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY || '',
  },
}

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev
  }
  return ENV.prod
}

export default getEnvVars()
