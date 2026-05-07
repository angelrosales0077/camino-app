/**
 * @camino/mobile - Breviary Hour Screen
 */

import { StyleSheet, View } from 'react-native'
import type { BreviaryHourKey, BreviarySectionType } from '@camino/shared'
import { useBreviaryHour, useDailyLiturgy } from '../../src/hooks'
import {
  Card,
  EmptyState,
  LiturgicalHeader,
  Screen,
  Typography,
} from '../../src/components/ui'
import { neutralColors } from '../../src/theme'

const todayIso = () => new Date().toISOString().split('T')[0]

interface BreviaryHourScreenProps {
  hour: BreviaryHourKey
  title: string
  subtitle?: string
}

const sectionLabels: Record<BreviarySectionType, string> = {
  intro: 'Inicio',
  examination: 'Examen de conciencia',
  hymn: 'Himno',
  psalmody: 'Salmodia',
  'short-reading': 'Lectura breve',
  responsory: 'Responsorio breve',
  'gospel-canticle': 'Cántico evangélico',
  intercessions: 'Preces',
  'lords-prayer': 'Padre nuestro',
  'final-prayer': 'Oración',
  conclusion: 'Conclusión',
  'marian-antiphon': 'Invocación a la Santísima Virgen',
  unknown: 'Sección',
}

export function BreviaryHourScreen({
  hour,
  title,
  subtitle,
}: BreviaryHourScreenProps) {
  const date = todayIso()
  const { data: liturgy } = useDailyLiturgy(date)
  const {
    data: breviary,
    isLoading,
    error,
  } = useBreviaryHour(date, hour)

  return (
    <Screen>
      <LiturgicalHeader
        title={breviary?.title || title}
        date={date}
        season={liturgy?.season}
        subtitle={breviary?.subtitle || subtitle}
      />

      {isLoading ? (
        <EmptyState title="Cargando oración..." />
      ) : error ? (
        <EmptyState
          title="No se pudo cargar esta hora."
          body="Intentá nuevamente en unos minutos."
        />
      ) : breviary?.sections.length ? (
        <View style={styles.sections}>
          <Typography variant="meta">
            Fuente: {breviary.sourceName}
          </Typography>
          {breviary.sections.map((section, index) => (
            <Card key={`${section.title}-${index}`}>
              <Typography variant="label" color={neutralColors.textSecondary}>
                {sectionLabels[section.type]}
              </Typography>
              <Typography variant="sectionTitle" style={styles.sectionTitle}>
                {section.title}
              </Typography>
              <View style={styles.lines}>
                {section.content.map((line, lineIndex) => (
                  <Typography
                    key={`${section.title}-${lineIndex}`}
                    variant="spiritualBody"
                  >
                    {line}
                  </Typography>
                ))}
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState title="No hay contenido disponible para esta hora." />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  sections: {
    gap: 18,
  },
  sectionTitle: {
    marginTop: 8,
  },
  lines: {
    gap: 10,
    marginTop: 16,
  },
})
