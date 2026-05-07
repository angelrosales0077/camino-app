/**
 * @camino/mobile - Journal Entry Detail
 */

import { useEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  useDeleteJournalEntry,
  useGospel,
  useJournalEntry,
  useUpdateJournalEntry,
} from '../../src/hooks'
import {
  Button,
  Card,
  EmptyState,
  JournalInput,
  LiturgicalHeader,
  Screen,
  Typography,
  formatCaminoDate,
} from '../../src/components/ui'
import { neutralColors } from '../../src/theme'

function formatEntryDate(value: Date | string) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default function JournalEntryScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const entryId = typeof id === 'string' ? id : undefined
  const { data: entry, isLoading, error } = useJournalEntry(entryId)
  const { data: gospel } = useGospel(entry?.gospelDate || 'today')
  const updateJournalEntry = useUpdateJournalEntry()
  const deleteJournalEntry = useDeleteJournalEntry()
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (entry && !isEditing) {
      setContent(entry.content)
    }
  }, [entry, isEditing])

  const handleSave = async () => {
    const trimmed = content.trim()
    if (!entry || !trimmed || updateJournalEntry.isPending) {
      return
    }

    try {
      await updateJournalEntry.mutateAsync({
        id: entry.id,
        content: trimmed,
      })
      setSaveState('saved')
      setIsEditing(false)
    } catch {
      setSaveState('error')
    }
  }

  const handleDelete = () => {
    if (!entry || deleteJournalEntry.isPending) {
      return
    }

    Alert.alert(
      '¿Querés borrar esta reflexión?',
      'Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournalEntry.mutateAsync(entry.id)
              router.back()
            } catch {
              Alert.alert(
                'No se pudo borrar',
                'Intentá nuevamente en unos minutos.'
              )
            }
          },
        },
      ]
    )
  }

  return (
    <Screen backgroundColor={neutralColors.surface}>
      <LiturgicalHeader
        title="Reflexión"
        date={entry?.gospelDate}
        subtitle={
          entry
            ? gospel?.reference || `Evangelio: ${formatCaminoDate(entry.gospelDate)}`
            : 'Diario espiritual'
        }
      />

      {isLoading ? (
        <EmptyState title="Cargando reflexión..." />
      ) : error || !entry ? (
        <EmptyState
          title="No se pudo abrir esta reflexión."
          body="Volvé al diario e intentá nuevamente."
        />
      ) : (
        <View>
          <Card style={styles.metaCard}>
            <Typography variant="meta">Escrita el {formatEntryDate(entry.createdAt)}</Typography>
            <Typography variant="meta" style={styles.metaLine}>
              Fecha del Evangelio: {entry.gospelDate}
            </Typography>
          </Card>

          {isEditing ? (
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
                  disabled={!content.trim() || updateJournalEntry.isPending}
                >
                  {updateJournalEntry.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button
                  onPress={() => {
                    setContent(entry.content)
                    setIsEditing(false)
                    setSaveState('idle')
                  }}
                  variant="quiet"
                  disabled={updateJournalEntry.isPending}
                >
                  Cancelar
                </Button>
                {saveState === 'error' ? (
                  <Typography variant="meta" style={styles.status}>
                    No se pudo guardar.
                  </Typography>
                ) : null}
              </View>
            </View>
          ) : (
            <View>
              <Card style={styles.contentCard}>
                <Typography variant="spiritualBody">
                  {entry.content}
                </Typography>
              </Card>
              <View style={styles.actions}>
                <Button onPress={() => setIsEditing(true)}>
                  Editar
                </Button>
                <Button
                  onPress={handleDelete}
                  variant="secondary"
                  disabled={deleteJournalEntry.isPending}
                >
                  {deleteJournalEntry.isPending ? 'Borrando...' : 'Borrar'}
                </Button>
              </View>
            </View>
          )}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  metaCard: {
    backgroundColor: neutralColors.background,
    marginBottom: 18,
  },
  metaLine: {
    marginTop: 8,
  },
  contentCard: {
    backgroundColor: neutralColors.background,
  },
  actions: {
    gap: 10,
    marginTop: 18,
  },
  status: {
    textAlign: 'center',
  },
})
