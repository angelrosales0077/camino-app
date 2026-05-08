/**
 * @camino/mobile - Home Tab
 * Main screen: Gospel + Breviary + Saint + Streak
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  useCheckInPrayer,
  useDailyLiturgy,
  useGospel,
  useStreak,
} from '../../src/hooks'
import {
  Button,
  Card,
  Screen,
  SectionTitle,
  Typography,
  formatCaminoDate,
} from '../../src/components/ui'
import { useCaminoTheme } from '../../src/theme'
import type { LiturgicalSeason } from '@camino/shared'
import { useUserStore } from '../../src/stores'

const todayIso = () => new Date().toISOString().split('T')[0]

const firstSentence = (value: string) =>
  value.split(/(?<=[.!?])\s/)[0] || value

const seasonLabels: Record<LiturgicalSeason, string> = {
  ordinary: 'Tiempo Ordinario',
  advent: 'Adviento',
  christmas: 'Navidad',
  lent: 'Cuaresma',
  'holy-week': 'Semana Santa',
  easter: 'Tiempo Pascual',
  martyrs: 'Mártires',
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function toRoman(value: number) {
  const numerals: Array<[number, string]> = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let remaining = value
  let result = ''

  for (const [number, roman] of numerals) {
    while (remaining >= number) {
      result += roman
      remaining -= number
    }
  }

  return result
}

function fallbackLiturgicalDayName(date: string, season?: LiturgicalSeason) {
  const weekday = capitalize(
    new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(
      new Date(`${date}T00:00:00`)
    )
  )
  const seasonName = season ? seasonLabels[season] : 'Tiempo Ordinario'
  return `${weekday} de ${seasonName}`
}

function normalizeLiturgicalName(
  value: string | undefined,
  date: string,
  season?: LiturgicalSeason
) {
  if (!value || value.trim().toLowerCase() === 'feria') {
    return fallbackLiturgicalDayName(date, season)
  }

  const trimmed = value.trim()
  const englishWeekMatch = trimmed.match(/of the (\d+)(?:st|nd|rd|th|º)? week of (easter|ordinary time|advent|christmas|lent)/i)
  if (englishWeekMatch) {
    const weekday = capitalize(
      new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(
        new Date(`${date}T00:00:00`)
      )
    )
    const week = toRoman(Number(englishWeekMatch[1]))
    const rawSeason = englishWeekMatch[2].toLowerCase()
    const seasonName =
      rawSeason === 'easter'
        ? 'Pascua'
        : rawSeason === 'ordinary time'
          ? 'Tiempo Ordinario'
          : rawSeason === 'advent'
            ? 'Adviento'
            : rawSeason === 'christmas'
              ? 'Navidad'
              : 'Cuaresma'

    if (seasonName === 'Tiempo Ordinario') {
      return `${weekday} de la ${week} semana del ${seasonName}`
    }

    return `${weekday} de la ${week} semana de ${seasonName}`
  }

  return trimmed
}

function formatHomeDate(date: string) {
  const formattedDate = formatCaminoDate(date).replace(/ de \d{4}$/, '')
  return capitalize(formattedDate)
}

function normalizeCelebrationName(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.toLowerCase() === 'feria') {
    return null
  }
  return trimmed
}

export default function HomeScreen() {
  const router = useRouter()
  const currentDate = todayIso()
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const {
    data: gospel,
    isLoading: gospelLoading,
    error: gospelError,
  } = useGospel()
  const {
    data: liturgy,
    isLoading: liturgyLoading,
    error: liturgyError,
  } = useDailyLiturgy(currentDate)
  const { data: streak } = useStreak()
  const checkInPrayer = useCheckInPrayer()
  const { colors, liturgicalPalettes } = useCaminoTheme()
  const palette = liturgicalPalettes[liturgy?.season || 'ordinary']
  const today = liturgy?.date || currentDate
  const gospelDate = gospel?.date || today
  const saint = liturgy?.saintOfDay || null
  const otherSaints = liturgy?.otherSaintsOfDay || []
  const liturgicalDayName = normalizeLiturgicalName(
    liturgy?.liturgicalDayName,
    today,
    liturgy?.season
  )
  const celebrationName = normalizeCelebrationName(liturgy?.celebrationName)
  const completedToday = isAuthenticated && streak?.lastActiveDate === currentDate

  return (
    <Screen>
      <Card style={[styles.headerCard, { backgroundColor: palette.light }]}>
        <View style={[styles.rule, { backgroundColor: palette.primary }]} />
        <Typography variant="meta">
          {formatHomeDate(today)}
        </Typography>
        <Typography variant="screenTitle" style={styles.headerTitle}>
          Buenos días
        </Typography>
        <Typography variant="label" color={colors.textSecondary}>
          {liturgyLoading ? 'Cargando calendario...' : liturgicalDayName}
        </Typography>
      </Card>

      <SectionTitle title="Evangelio del día" />
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/gospel/[date]',
            params: { date: gospelDate },
          })
        }
        style={({ pressed }) => [pressed ? styles.pressed : null]}
      >
        <Card style={styles.sectionCard}>
          {gospelLoading ? (
            <Typography variant="spiritualBody">
              Cargando Evangelio...
            </Typography>
          ) : gospelError ? (
            <Typography variant="spiritualBody">
              No se pudo cargar el Evangelio.
            </Typography>
          ) : gospel ? (
            <View>
              <Typography
                variant="spiritualBody"
                style={styles.gospelQuote}
              >
                {firstSentence(gospel.shortQuote || gospel.text)}
              </Typography>
              <Typography variant="meta" style={styles.cardFooter}>
                También disponibles las lecturas del día
              </Typography>
              <Typography variant="label" color={palette.primary} style={styles.cardAction}>
                Leer lecturas
              </Typography>
            </View>
          ) : (
            <Typography variant="spiritualBody">
              Sin Evangelio disponible.
            </Typography>
          )}
        </Card>
      </Pressable>

      <Pressable
        onPress={() => router.push('/breviary')}
        style={({ pressed }) => [pressed ? styles.pressed : null]}
      >
        <Card style={styles.sectionCard}>
          <Typography variant="label" color={palette.primary}>
            Ir al breviario
          </Typography>
          <Typography variant="meta" style={styles.cardText}>
            Liturgia de las Horas del día
          </Typography>
        </Card>
      </Pressable>

      {liturgyLoading || liturgyError || saint || celebrationName ? (
        <>
          <SectionTitle
            title={saint ? 'Santo del día' : 'Celebración del día'}
          />
          <Card style={styles.sectionCard}>
            {liturgyLoading ? (
              <Typography variant="spiritualBody">
                Cargando calendario...
              </Typography>
            ) : liturgyError ? (
              <Typography variant="spiritualBody">
                No se pudo cargar la celebración del día.
              </Typography>
            ) : saint ? (
              <View>
                <Typography variant="spiritualBody">
                  {saint.nameEs}
                </Typography>
                {saint.shortBioEs ? (
                  <Typography variant="meta" style={styles.cardText}>
                    {saint.shortBioEs}
                  </Typography>
                ) : null}
                {saint.quoteEs ? (
                  <Typography variant="spiritualBody" style={styles.saintQuote}>
                    {saint.quoteEs}
                  </Typography>
                ) : null}
                {otherSaints.length > 0 ? (
                  <Typography variant="meta" style={styles.cardText}>
                    También se recuerda: {otherSaints
                      .slice(0, 3)
                      .map((item) => item.nameEs)
                      .join(', ')}
                  </Typography>
                ) : null}
              </View>
            ) : (
              <View>
                <Typography variant="spiritualBody">
                  {celebrationName}
                </Typography>
                <Typography variant="meta" style={styles.cardText}>
                  Hoy seguimos la liturgia propia del día.
                </Typography>
              </View>
            )}
          </Card>
        </>
      ) : null}

      <Card style={styles.pathDays}>
        <Typography variant="meta">Días de camino</Typography>
        <Typography variant="sectionTitle">
          {String(streak?.currentCount ?? 0)}
        </Typography>
        <Typography variant="spiritualBody" style={styles.pathMessage}>
          {completedToday
            ? 'Hoy caminaste un poco más.'
            : 'Un gesto sencillo también cuenta.'}
        </Typography>
        {!isAuthenticated ? (
          <View style={styles.pathAction}>
            <Button onPress={() => router.push('/auth/login')}>
              Entrar para guardar tus días
            </Button>
          </View>
        ) : completedToday ? null : (
          <View style={styles.pathAction}>
            <Button
              onPress={() => checkInPrayer.mutate()}
              disabled={checkInPrayer.isPending}
              variant="secondary"
              accentColor={palette.primary}
            >
              {checkInPrayer.isPending
                ? 'Marcando...'
                : 'Marcá tu oración de hoy'}
            </Button>
          </View>
        )}
        {checkInPrayer.isError ? (
          <Typography variant="meta" style={styles.pathError}>
            No se pudo marcar hoy. Intentá nuevamente.
          </Typography>
        ) : null}
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: 28,
  },
  rule: {
    height: 2,
    marginBottom: 18,
    width: 56,
  },
  headerTitle: {
    marginTop: 10,
  },
  sectionCard: {
    marginBottom: 26,
  },
  cardText: {
    marginTop: 10,
  },
  gospelQuote: {
    fontFamily: 'Lora-Italic',
  },
  saintQuote: {
    fontFamily: 'Lora-Italic',
    marginTop: 14,
  },
  cardFooter: {
    marginTop: 18,
  },
  cardAction: {
    marginTop: 8,
  },
  pathDays: {
    alignItems: 'center',
    marginTop: 4,
  },
  pathMessage: {
    marginTop: 8,
    textAlign: 'center',
  },
  pathAction: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
  pathError: {
    marginTop: 12,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
})
