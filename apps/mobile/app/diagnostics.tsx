/**
 * @camino/mobile - Diagnostics Screen (temporary)
 * Visible in preview builds when EXPO_PUBLIC_API_DIAGNOSTICS=1.
 */

import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Button,
  Card,
  LiturgicalHeader,
  Screen,
  Typography,
} from '../src/components/ui'
import env from '../src/config/env'
import { API_ENDPOINTS } from '../src/config'
import { buildApiUrl } from '../src/config/api'

type TestState = 'idle' | 'loading' | 'done'

type EndpointCheck = {
  label: string
  path: string
  finalUrl: string
  httpStatus: number | null
  ok: boolean
  jsonReceived: boolean
  error: string | null
}

const TESTS: Array<{ label: string; path: string }> = [
  { label: 'Liturgy', path: API_ENDPOINTS.LITURGY_TODAY },
  { label: 'Readings', path: API_ENDPOINTS.READINGS_TODAY },
  { label: 'Gospel', path: API_ENDPOINTS.GOSPEL_TODAY },
  { label: 'Breviary', path: API_ENDPOINTS.BREVIARY_TODAY },
]

export default function DiagnosticsScreen() {
  const router = useRouter()
  const [testState, setTestState] = useState<TestState>('idle')
  const [results, setResults] = useState<EndpointCheck[]>([])

  const apiBaseUrl = useMemo(() => env.apiUrl, [])

  const runTest = async () => {
    setTestState('loading')
    const nextResults: EndpointCheck[] = []

    for (const test of TESTS) {
      const finalUrl = buildApiUrl(apiBaseUrl, test.path)
      let httpStatus: number | null = null
      let ok = false
      let jsonReceived = false
      let error: string | null = null

      try {
        const response = await fetch(finalUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        httpStatus = response.status
        ok = response.ok

        const raw = await response.text()
        if (raw) {
          try {
            JSON.parse(raw)
            jsonReceived = true
          } catch {
            jsonReceived = false
          }
        }

        if (!response.ok) {
          error = `HTTP ${response.status}: ${response.statusText}`
        }
      } catch (err) {
        error = err instanceof Error ? err.message : String(err)
      }

      nextResults.push({
        label: test.label,
        path: test.path,
        finalUrl,
        httpStatus,
        ok,
        jsonReceived,
        error,
      })
    }

    setResults(nextResults)
    setTestState('done')
  }

  return (
    <Screen>
      <LiturgicalHeader title="Diagnostico" subtitle="Conexion al backend" />

      <Card>
        <Typography variant="sectionTitle">API</Typography>
        <Typography variant="meta" style={styles.mono}>
          {apiBaseUrl}
        </Typography>

        <View style={styles.actions}>
          <Button onPress={runTest} disabled={testState === 'loading'}>
            {testState === 'loading' ? 'Probando...' : 'Probar endpoints publicos'}
          </Button>
          <Button onPress={() => router.back()} variant="secondary">
            Volver
          </Button>
        </View>

        <View style={styles.result}>
          {testState === 'idle' ? (
            <Typography variant="meta">Sin ejecutar</Typography>
          ) : null}
          {testState === 'loading' ? (
            <Typography variant="meta">Conectando...</Typography>
          ) : null}
          {testState === 'done'
            ? results.map((item) => (
              <View key={item.label} style={styles.kv}>
                <Typography variant="meta">{item.label}</Typography>
                <Typography variant="meta">Path: {item.path}</Typography>
                <Typography variant="meta">URL final: {item.finalUrl}</Typography>
                <Typography variant="meta">HTTP: {item.httpStatus ?? 'N/A'}</Typography>
                <Typography variant="meta">JSON: {item.jsonReceived ? 'si' : 'no'}</Typography>
                <Typography variant="meta">OK: {item.ok ? 'si' : 'no'}</Typography>
                <Typography variant="meta">Error: {item.error ?? '(none)'}</Typography>
              </View>
            ))
            : null}
        </View>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
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
    marginTop: 14,
    gap: 6,
  },
})
