/**
 * @camino/mobile - Journal Tab
 * Spiritual diary.
 */

import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { JournalEntry } from '@camino/db'
import {
  useCreateJournalEntry,
  useGospel,
  useJournalEntries,
} from '../../src/hooks'
import {
  Button,
  Card,
  JournalInput,
  LiturgicalHeader,
  Screen,
  SectionTitle,
  Typography,
  formatCaminoDate,
} from '../../src/components/ui'
import { neutralColors } from '../../src/theme'
import { useUserStore } from '../../src/stores'

const todayIso = () => new Date().toISOString().split('T')[0]

function previewContent(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 120) {
    return normalized
  }
  return `${normalized.slice(0, 119)}...`
}

function isWrittenToday(value: Date | string) {
  const date = new Date(value)
  return date.toISOString().split('T')[0] === todayIso()
}

function formatEntryDate(value: Date | string) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function JournalEntryRow({ entry }: { entry: JournalEntry }) {
  const router = useRouter()
  const { data: gospel } = useGospel(entry.gospelDate)

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/journal/[id]',
          params: { id: entry.id },
        })
      }
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      <Card style={styles.entryCard}>
        <View style={styles.entryMetaRow}>
          <Typography variant="meta">{formatEntryDate(entry.createdAt)}</Typography>
          {isWrittenToday(entry.createdAt) ? (
            <Typography variant="meta" color={neutralColors.textSecondary}>
              Escrita hoy
            </Typography>
          ) : null}
        </View>
        <Typography variant="spiritualBody" style={styles.entryPreview}>
          {previewContent(entry.content)}
        </Typography>
        <Typography variant="meta" style={styles.entryFooter}>
          {gospel?.reference || `Evangelio: ${formatCaminoDate(entry.gospelDate)}`}
        </Typography>
        <Typography variant="meta" style={styles.entryFooter}>
          Fecha del Evangelio: {entry.gospelDate}
        </Typography>
      </Card>
    </Pressable>
  )
}

export default function JournalScreen() {
  const { gospelDate } = useLocalSearchParams<{ gospelDate?: string }>()
  const router = useRouter()
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const entryDate =
    typeof gospelDate === 'string' && gospelDate ? gospelDate : todayIso()
  const [isWriting, setIsWriting] = useState(Boolean(gospelDate))
  const [content, setContent] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const createJournalEntry = useCreateJournalEntry()
  const { data: entries, isLoading } = useJournalEntries(30, 1)

  const hasEntries = Boolean(entries?.items.length)
  const statusText = useMemo(() => {
    if (createJournalEntry.isPending) return 'Guardando...'
    if (saveState === 'saved') return 'Guardado.'
    if (saveState === 'error') return 'No se pudo guardar.'
    return 'Privado por diseño.'
  }, [createJournalEntry.isPending, saveState])

  const handleSave = async () => {
    const trimmed = content.trim()
    if (!trimmed || createJournalEntry.isPending) {
      return
    }

    try {
      await createJournalEntry.mutateAsync({
        gospelDate: entryDate,
        content: trimmed,
      })
      setSaveState('saved')
      setContent('')
      setIsWriting(false)
    } catch {
      setSaveState('error')
    }
  }

  return (
    <Screen backgroundColor={neutralColors.surface}>
      <LiturgicalHeader
        title="Mi diario espiritual"
        date={entryDate}
        subtitle="Un lugar privado para volver sobre la Palabra."
      />

      {!isAuthenticated ? (
        <Card>
          <Typography variant="spiritualBody">
            Entrá para guardar tu diario espiritual.
          </Typography>
          <Typography variant="meta" style={styles.emptyText}>
            Tu espacio de oración queda reservado para vos.
          </Typography>
          <View style={styles.emptyAction}>
            <Button onPress={() => router.push('/auth/login')}>
              Entrar a Camino
            </Button>
          </View>
        </Card>
      ) : (
        <View>

      {isWriting ? (
        <View>
          <JournalInput
            value={content}
            onChangeText={(value) => {
              setContent(value)
              if (saveState !== 'idle') {
                setSaveState('idle')
              }
            }}
            placeholder="¿Qué te llevás de la lectura de hoy?"
          />

          <View style={styles.actions}>
            <Button
              onPress={handleSave}
              disabled={!content.trim() || createJournalEntry.isPending}
            >
              {createJournalEntry.isPending ? 'Guardando...' : 'Guardar entrada'}
            </Button>
            <Button
              onPress={() => {
                setContent('')
                setIsWriting(false)
                setSaveState('idle')
              }}
              variant="quiet"
              disabled={createJournalEntry.isPending}
            >
              Cancelar
            </Button>
            <Typography variant="meta" style={styles.status}>
              {statusText}
            </Typography>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button onPress={() => setIsWriting(true)}>
            Escribir reflexión de hoy
          </Button>
        </View>
      )}

      <SectionTitle title="Historial" />
      {isLoading ? (
        <Card>
          <Typography variant="body">Cargando entradas...</Typography>
        </Card>
      ) : hasEntries ? (
        <View style={styles.entryList}>
          {entries?.items.map((entry) => (
            <JournalEntryRow key={entry.id} entry={entry} />
          ))}
        </View>
      ) : (
        <Card>
          <Typography variant="spiritualBody">
            Todavía no escribiste en tu diario.
          </Typography>
          <Typography variant="meta" style={styles.emptyText}>
            Podés empezar con una frase después de leer el Evangelio.
          </Typography>
          {!isWriting ? (
            <View style={styles.emptyAction}>
              <Button onPress={() => setIsWriting(true)} variant="secondary">
                Escribir reflexión de hoy
              </Button>
            </View>
          ) : null}
        </Card>
      )}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
    marginBottom: 30,
    marginTop: 16,
  },
  status: {
    textAlign: 'center',
  },
  entryList: {
    gap: 14,
  },
  entryCard: {
    backgroundColor: neutralColors.background,
  },
  entryMetaRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  entryPreview: {
    marginTop: 10,
  },
  entryFooter: {
    marginTop: 8,
  },
  emptyText: {
    marginTop: 10,
  },
  emptyAction: {
    marginTop: 18,
  },
  pressed: {
    opacity: 0.82,
  },
})
