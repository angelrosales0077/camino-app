/**
 * @camino/mobile - Gospel Detail Screen
 * Route: gospel/[date]
 */

import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDailyLiturgy, useGospel } from '../../src/hooks'
import {
  Button,
  Card,
  EmptyState,
  LiturgicalHeader,
  Screen,
  Typography,
  getLiturgicalPalette,
} from '../../src/components/ui'
import { neutralColors } from '../../src/theme'

const todayIso = () => new Date().toISOString().split('T')[0]

export default function GospelScreen() {
  const router = useRouter()
  const { date } = useLocalSearchParams<{ date?: string }>()
  const gospelDate = typeof date === 'string' && date ? date : todayIso()
  const {
    data: gospel,
    isLoading: gospelLoading,
    error: gospelError,
  } = useGospel(gospelDate)
  const {
    data: liturgy,
    isLoading: liturgyLoading,
    error: liturgyError,
  } = useDailyLiturgy(gospelDate)
  const palette = getLiturgicalPalette(liturgy?.season)
  const liturgicalContext =
    liturgy?.saintOfDay?.nameEs ||
    liturgy?.liturgicalDayName ||
    liturgy?.celebrationName

  return (
    <Screen>
      <LiturgicalHeader
        title="Evangelio"
        date={gospel?.date || gospelDate}
        season={liturgy?.season}
        subtitle={
          liturgyLoading
            ? 'Cargando calendario...'
            : liturgicalContext || 'Lectura del día'
        }
      />

      {gospelLoading ? (
        <EmptyState title="Cargando Evangelio..." />
      ) : gospelError ? (
        <EmptyState
          title="No se pudo cargar el Evangelio."
          body="Intentá nuevamente en unos minutos."
        />
      ) : gospel ? (
        <View>
          <Card style={styles.gospelCard}>
            <Typography variant="label" color={palette.primary}>
              {gospel.reference}
            </Typography>
            <Typography variant="spiritualBody" style={styles.gospelText}>
              {gospel.text}
            </Typography>
          </Card>

          <Card style={styles.contextCard}>
            <Typography variant="meta">Fecha litúrgica</Typography>
            <Typography variant="spiritualBody" style={styles.contextText}>
              {liturgyError
                ? 'No se pudo cargar el calendario litúrgico.'
                : liturgicalContext || 'Feria del Tiempo Ordinario'}
            </Typography>
          </Card>

          <View style={styles.actions}>
            <Button
              accentColor={palette.primary}
              onPress={() =>
                router.push({
                  pathname: '/journal',
                  params: { gospelDate },
                })
              }
            >
              Escribir en mi diario
            </Button>
            <Button
              accentColor={palette.primary}
              onPress={() => undefined}
              variant="secondary"
              disabled
            >
              Compartir
            </Button>
          </View>
        </View>
      ) : (
        <EmptyState title="Sin Evangelio disponible." />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  gospelCard: {
    marginBottom: 20,
  },
  gospelText: {
    marginTop: 18,
  },
  contextCard: {
    backgroundColor: neutralColors.background,
    marginBottom: 24,
  },
  contextText: {
    marginTop: 8,
  },
  actions: {
    gap: 12,
  },
})
