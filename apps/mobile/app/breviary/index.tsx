/**
 * @camino/mobile - Breviary Menu
 * Daily menu for Liturgia de las Horas.
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useBreviaryDay, useDailyLiturgy } from '../../src/hooks'
import {
  Card,
  LiturgicalHeader,
  Screen,
  Typography,
  getLiturgicalPalette,
} from '../../src/components/ui'

const toRoman = (value: number) => {
  const map: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
  }
  return map[value] || String(value)
}

const hours: Array<{
  label: string
  route: Href<string>
  note: string
  description: string
}> = [
  {
    label: 'Oficio de Lectura',
    route: '/breviary/office-of-readings',
    note: 'Lectura orante',
    description: 'Lectura extensa y salmos para meditar con calma.',
  },
  {
    label: 'Laudes',
    route: '/breviary/lauds',
    note: 'Oración de la mañana',
    description: 'Oración de la mañana.',
  },
  {
    label: 'Tercia',
    route: '/breviary/terce',
    note: 'Media mañana',
    description: 'Oración de media mañana.',
  },
  {
    label: 'Sexta',
    route: '/breviary/sext',
    note: 'Mediodía',
    description: 'Oración del mediodía.',
  },
  {
    label: 'Nona',
    route: '/breviary/none',
    note: 'Media tarde',
    description: 'Oración de media tarde.',
  },
  {
    label: 'Vísperas',
    route: '/breviary/vespers',
    note: 'Atardecer',
    description: 'Oración de la tarde.',
  },
  {
    label: 'Completas',
    route: '/breviary/compline',
    note: 'Antes del descanso',
    description: 'Oración antes del descanso.',
  },
]

export default function BreviaryScreen() {
  const router = useRouter()
  const { data: liturgy, isLoading } = useDailyLiturgy()
  const { data: breviaryDay } = useBreviaryDay()
  const palette = getLiturgicalPalette(liturgy?.season)
  const psalterWeek = liturgy?.psalterWeek
  const calendarWeek = liturgy?.calendarWeek
  const weekLabel = calendarWeek
    ? `Semana litúrgica ${calendarWeek}`
    : psalterWeek
      ? `Semana del Salterio ${toRoman(psalterWeek)}`
      : 'Liturgia de las Horas'

  return (
    <Screen>
      <LiturgicalHeader
        title="Breviario"
        date={liturgy?.date}
        season={liturgy?.season}
        subtitle={isLoading ? 'Cargando calendario...' : weekLabel}
      />

      <View style={styles.list}>
        {hours.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route)}
            style={({ pressed }) => [pressed ? styles.pressed : null]}
          >
            <Card style={styles.hourCard}>
              <View style={[styles.rule, { backgroundColor: palette.primary }]} />
              <View>
                <Typography variant="sectionTitle">{item.label}</Typography>
                <Typography variant="meta" style={styles.note}>
                  {item.note} · {item.description}
                </Typography>
                <Typography variant="meta" style={styles.status}>
                  {breviaryDay?.hours.find((hour) => hour.title === item.label)
                    ?.available
                    ? 'Disponible'
                    : 'Intentar cargar'}
                </Typography>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  hourCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 20,
  },
  rule: {
    alignSelf: 'stretch',
    width: 3,
  },
  note: {
    marginTop: 4,
  },
  status: {
    marginTop: 8,
  },
  pressed: {
    opacity: 0.82,
  },
})
