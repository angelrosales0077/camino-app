/**
 * @camino/mobile - Diagnostics Screen (temporary)
 * Visible in preview builds when EXPO_PUBLIC_API_DIAGNOSTICS=1.
 */

import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Card, LiturgicalHeader, Screen, Typography } from '../src/components/ui'
import env from '../src/config/env'
import { apiClient, API_ENDPOINTS } from '../src/config'
import type { DailyLiturgy } from '@camino/shared'

type TestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; httpOk: true; liturgy: DailyLiturgy }
  | { status: 'error'; message: string }

export default function DiagnosticsScreen() {
  const router = useRouter()
  const [testState, setTestState] = useState<TestState>({ status: 'idle' })

  const apiBaseUrl = useMemo(() => env.apiUrl, [])

  const runTest = async () => {
    setTestState({ status: 'loading' })
    try {
      const result = await apiClient.get(API_ENDPOINTS.LITURGY_TODAY)
      if (!result.success) {
        setTestState({ status: 'error', message: result.error })
        return
      }
      setTestState({ status: 'success', httpOk: true, liturgy: result.data as DailyLiturgy })
    } catch (err) {
      setTestState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  return (
    <Screen>
      <LiturgicalHeader title="Diagnóstico" subtitle="Conexión al backend" />

      <Card>
        <Typography variant="sectionTitle">API</Typography>
        <Typography variant="meta" style={styles.mono}>
          {apiBaseUrl}
        </Typography>
        <Typography variant="meta" style={styles.meta}>
          Prueba: {API_ENDPOINTS.LITURGY_TODAY}
        </Typography>

        <View style={styles.actions}>
          <Button onPress={runTest} disabled={testState.status === 'loading'}>
            {testState.status === 'loading' ? 'Probando...' : 'Test backend connection'}
          </Button>
          <Button onPress={() => router.back()} variant="secondary">
            Volver
          </Button>
        </View>

        <View style={styles.result}>
          {testState.status === 'idle' ? (
            <Typography variant="meta">Sin ejecutar</Typography>
          ) : null}
          {testState.status === 'loading' ? (
            <Typography variant="meta">Conectando...</Typography>
          ) : null}
          {testState.status === 'success' ? (
            <View style={styles.kv}>
              <Typography variant="meta">OK: respuesta válida</Typography>
              <Typography variant="meta">
                hasSaintOfDay: {String(testState.liturgy.hasSaintOfDay)}
              </Typography>
              <Typography variant="meta">
                saintOfDay: {testState.liturgy.saintOfDay?.nameEs ?? '(null)'}
              </Typography>
              <Typography variant="meta">
                otherSaintsOfDay: {String(testState.liturgy.otherSaintsOfDay?.length ?? 0)}
              </Typography>
            </View>
          ) : null}
          {testState.status === 'error' ? (
            <Typography variant="meta">Error: {testState.message}</Typography>
          ) : null}
        </View>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  meta: {
    marginTop: 8,
  },
  mono: {
    marginTop: 8,
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  result: {
    marginTop: 16,
  },
  kv: {
    marginTop: 8,
    gap: 6,
  },
})
