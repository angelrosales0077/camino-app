import { useEffect, useMemo, useState } from 'react'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Button, Card, LiturgicalHeader, Screen, Typography } from '../../src/components/ui'
import {
  getSessionCredentials,
  getUserWithAccessToken,
  saveSession,
  type SupabaseSessionResponse,
} from '../../src/lib/auth'
import { useUserStore } from '../../src/stores'
import { useCaminoTheme } from '../../src/theme'

function getParamMap(url: string) {
  const [, query = ''] = url.split('?')
  const [, hash = ''] = url.split('#')
  const parts = [query, hash].filter(Boolean)
  const params = new URLSearchParams(parts.join('&'))
  return params
}

function getAuthErrorMessage(params: URLSearchParams) {
  return params.get('error_description')
    || params.get('error')
    || params.get('message')
}

export default function AuthCallbackScreen() {
  const router = useRouter()
  const setCredentials = useUserStore((state) => state.setCredentials)
  const deepLinkUrl = Linking.useURL()
  const [error, setError] = useState<string | null>(null)
  const [isCompleting, setIsCompleting] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const { liturgicalPalettes } = useCaminoTheme()

  const targetUrl = useMemo(() => deepLinkUrl || null, [deepLinkUrl])

  useEffect(() => {
    let isMounted = true

    async function resolveCallback() {
      try {
        setError(null)
        setIsCompleting(true)
        setIsComplete(false)

        const initialUrl = targetUrl || await Linking.getInitialURL()
        if (!initialUrl) {
          throw new Error('No pudimos leer el enlace de confirmacion.')
        }

        const params = getParamMap(initialUrl)
        const authError = getAuthErrorMessage(params)
        if (authError) {
          throw new Error(authError)
        }

        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (!accessToken || !refreshToken) {
          throw new Error('El enlace de confirmacion no es valido.')
        }

        const user = await getUserWithAccessToken(accessToken)
        const session: SupabaseSessionResponse = {
          access_token: accessToken,
          refresh_token: refreshToken,
          user,
        }

        await saveSession(session)

        if (!isMounted) {
          return
        }

        const credentials = getSessionCredentials(session)
        setCredentials(credentials.user, credentials.token, credentials.refreshToken)
        setIsComplete(true)
        setIsCompleting(false)
      } catch (callbackError) {
        if (!isMounted) {
          return
        }

        setError(
          callbackError instanceof Error && callbackError.message
            ? callbackError.message
            : 'No se pudo confirmar tu cuenta. Intenta de nuevo.',
        )
        setIsCompleting(false)
      }
    }

    resolveCallback()

    return () => {
      isMounted = false
    }
  }, [setCredentials, targetUrl])

  return (
    <Screen>
      <LiturgicalHeader
        title="Confirmacion de cuenta"
        subtitle="Estamos finalizando tu ingreso en Camino."
      />
      <Card>
        <View style={styles.content}>
          {isCompleting ? (
            <Typography variant="meta">
              Confirmando tu cuenta...
            </Typography>
          ) : null}
          {isComplete ? (
            <Typography variant="meta" color={liturgicalPalettes.ordinary.primary}>
              Tu correo quedo confirmado. Ya podes continuar.
            </Typography>
          ) : null}
          {error ? (
            <Typography variant="meta" style={styles.error}>
              {error}
            </Typography>
          ) : null}
          {!isCompleting ? (
            <Button onPress={() => router.replace(isComplete ? '/(tabs)' : '/auth/login')}>
              {isComplete ? 'Continuar' : 'Volver a entrar'}
            </Button>
          ) : null}
        </View>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  error: {
    marginBottom: 4,
  },
})
