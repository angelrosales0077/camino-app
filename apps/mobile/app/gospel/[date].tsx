/**
 * @camino/mobile - Daily Readings Detail Screen
 * Route: gospel/[date]
 */

import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDailyLiturgy, useDailyReadings } from '../../src/hooks'
import {
  Button,
  Card,
  EmptyState,
  LiturgicalHeader,
  Screen,
  Typography,
  getLiturgicalPalette,
} from '../../src/components/ui'
import type { DailyReading } from '@camino/shared'

const todayIso = () => new Date().toISOString().split('T')[0]

export default function GospelScreen() {
  const router = useRouter()
  const { date } = useLocalSearchParams<{ date?: string }>()
  const gospelDate = typeof date === 'string' && date ? date : todayIso()
  const {
    data: readings,
    isLoading: readingsLoading,
    error: readingsError,
  } = useDailyReadings(gospelDate)
  const {
    data: liturgy,
    isLoading: liturgyLoading,
  } = useDailyLiturgy(gospelDate)
  const palette = getLiturgicalPalette(readings?.season || liturgy?.season)
  const liturgicalContext =
    readings?.liturgicalDayName ||
    liturgy?.liturgicalDayName
  const gospelReading = readings?.readings.find((item) => item.type === 'gospel')

  return (
    <Screen>
      <LiturgicalHeader
        title="Lecturas del día"
        date={readings?.date || gospelDate}
        season={readings?.season || liturgy?.season}
        subtitle={
          liturgyLoading
            ? 'Cargando calendario...'
            : liturgicalContext || 'Misa del día'
        }
      />

      {readingsLoading ? (
        <EmptyState title="Cargando lecturas..." />
      ) : readingsError ? (
        <EmptyState
          title="No se pudieron cargar las lecturas."
          body="Intenta nuevamente en unos minutos."
        />
      ) : readings && readings.readings.length > 0 ? (
        <View>
          {readings.readings.map((reading) => (
            <ReadingCard
              key={`${reading.type}-${reading.reference || reading.title}`}
              reading={reading}
              accentColor={palette.primary}
            />
          ))}

          {readings.commentary ? (
            <Card style={styles.commentaryCard}>
              <Typography variant="label" color={palette.primary}>
                Comentario espiritual
              </Typography>
              <Typography variant="sectionTitle" style={styles.commentaryTitle}>
                {readings.commentary.title}
              </Typography>
              <Typography variant="meta" style={styles.commentaryAuthor}>
                {readings.commentary.author}
              </Typography>
              <Typography variant="spiritualBody" style={styles.commentaryText}>
                {readings.commentary.text}
              </Typography>
              {readings.commentary.sourceName ? (
                <Typography variant="meta" style={styles.source}>
                  Fuente: {readings.commentary.sourceName}
                </Typography>
              ) : null}
              {readings.commentary.sourceUrl ? (
                <Typography variant="meta" style={styles.source}>
                  URL: {readings.commentary.sourceUrl}
                </Typography>
              ) : null}
              {readings.commentary.needsReview ? (
                <Typography variant="meta" style={styles.source}>
                  Pendiente de revisión
                </Typography>
              ) : null}
            </Card>
          ) : null}

          <View style={styles.actions}>
            <Button
              accentColor={palette.primary}
              disabled={!gospelReading}
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
        <EmptyState title="Sin lecturas disponibles." />
      )}
    </Screen>
  )
}

function readingLabel(reading: DailyReading) {
  if (reading.type === 'first-reading') return 'Primera lectura'
  if (reading.type === 'psalm') return 'Salmo'
  if (reading.type === 'second-reading') return 'Segunda lectura'
  if (reading.type === 'gospel') return 'Evangelio'
  return reading.title
}

function ReadingCard({
  reading,
  accentColor,
}: {
  reading: DailyReading
  accentColor: string
}) {
  const emphasized = reading.type === 'gospel'

  return (
    <Card style={styles.readingCard}>
      <Typography variant="label" color={accentColor}>
        {readingLabel(reading)}
      </Typography>
      {reading.reference ? (
        <Typography variant="meta" style={styles.reference}>
          {reading.reference}
        </Typography>
      ) : null}
      <Typography
        variant="spiritualBody"
        style={[styles.readingText, emphasized ? styles.gospelText : null]}
      >
        {reading.text}
      </Typography>
    </Card>
  )
}

const styles = StyleSheet.create({
  readingCard: {
    marginBottom: 20,
  },
  reference: {
    marginTop: 6,
  },
  readingText: {
    marginTop: 18,
  },
  gospelText: {
    fontFamily: 'Lora-SemiBold',
  },
  commentaryCard: {
    marginBottom: 20,
  },
  commentaryTitle: {
    marginTop: 8,
  },
  commentaryAuthor: {
    marginTop: 6,
  },
  commentaryText: {
    marginTop: 18,
  },
  source: {
    marginTop: 14,
  },
  actions: {
    gap: 12,
  },
})
