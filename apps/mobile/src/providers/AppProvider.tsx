/**
 * @camino/mobile - App Root Provider
 * Wraps the entire app with Query Client, navigation, and theme providers
 */

import React, { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../config/queryClient'
import { getSessionCredentials, loadSession, refreshSession } from '../lib/auth'
import { useUserStore } from '../stores'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const setCredentials = useUserStore((state) => state.setCredentials)
  const logout = useUserStore((state) => state.logout)

  useEffect(() => {
    let isMounted = true

    async function hydrateSession() {
      try {
        const session = await loadSession()
        if (!session || !isMounted) {
          return
        }

        if (session.refresh_token) {
          const refreshed = await refreshSession(session.refresh_token)
          if (!isMounted) {
            return
          }
          const credentials = getSessionCredentials(refreshed)
          setCredentials(credentials.user, credentials.token, credentials.refreshToken)
          return
        }

        const credentials = getSessionCredentials(session)
        setCredentials(credentials.user, credentials.token, credentials.refreshToken)
      } catch {
        if (isMounted) {
          logout()
        }
      }
    }

    hydrateSession()

    return () => {
      isMounted = false
    }
  }, [logout, setCredentials])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
