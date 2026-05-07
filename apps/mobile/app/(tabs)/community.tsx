/**
 * @camino/mobile - Community Tab
 * Prayer intentions feed.
 */

import { useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { PrayerIntentionFeedItem } from '@camino/shared'
import {
  useCreatePrayerIntention,
  usePrayerIntentions,
  usePrayForIntention,
} from '../../src/hooks'
import {
  Button,
  Card,
  EmptyState,
  LiturgicalHeader,
  Screen,
  Typography,
} from '../../src/components/ui'
import { neutralColors } from '../../src/theme'
import { useUserStore } from '../../src/stores'

const MAX_LENGTH = 200

function IntentionCard({ intention }: { intention: PrayerIntentionFeedItem }) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const router = useRouter()
  const prayForIntention = usePrayForIntention()

  const handlePray = () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    prayForIntention.mutate(intention.id)
  }

  return (
    <Card>
      <Typography variant="spiritualBody">{intention.text}</Typography>
      <Typography variant="meta" style={styles.meta}>
        {intention.isAnonymous ? 'Anónimo' : intention.authorName || 'Camino'}
      </Typography>
      <Typography variant="meta" style={styles.meta}>
        {intention.prayerCount} personas rezando
      </Typography>
      <View style={styles.cardAction}>
        <Button
          onPress={handlePray}
          variant={intention.hasPrayed ? 'quiet' : 'secondary'}
          disabled={prayForIntention.isPending || intention.hasPrayed}
        >
          {intention.hasPrayed
            ? 'Gracias. Rezamos por esto.'
            : prayForIntention.isPending
              ? 'Enviando...'
              : 'Rezar por esta intención'}
        </Button>
      </View>
    </Card>
  )
}

export default function CommunityScreen() {
  const router = useRouter()
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const {
    data: intentions,
    isLoading,
    error,
  } = usePrayerIntentions()
  const createPrayerIntention = useCreatePrayerIntention()
  const [isWriting, setIsWriting] = useState(false)
  const [text, setText] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleCreate = async () => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length > MAX_LENGTH || createPrayerIntention.isPending) {
      return
    }

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    try {
      await createPrayerIntention.mutateAsync({
        text: trimmed,
        isAnonymous,
      })
      setText('')
      setIsWriting(false)
      setFeedback('Tu intención quedó compartida.')
    } catch {
      setFeedback('No se pudo enviar la intención. Probá de nuevo.')
    }
  }

  return (
    <Screen>
      <LiturgicalHeader
        title="Intenciones"
        subtitle="Oración comunitaria"
      />

      {feedback ? (
        <Card style={styles.feedback}>
          <Typography variant="meta">{feedback}</Typography>
        </Card>
      ) : null}

      {isWriting ? (
        <Card style={styles.formCard}>
          <TextInput
            value={text}
            onChangeText={(value) => {
              setText(value)
              setFeedback(null)
            }}
            placeholder="Escribí una intención breve."
            placeholderTextColor={neutralColors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={MAX_LENGTH}
            style={styles.input}
          />
          <Typography variant="meta" style={styles.counter}>
            {text.length}/{MAX_LENGTH}
          </Typography>
          <Pressable
            onPress={() => setIsAnonymous((value) => !value)}
            style={({ pressed }) => [styles.optionRow, pressed ? styles.pressed : null]}
          >
            <View style={[styles.checkbox, isAnonymous ? styles.checkboxActive : null]} />
            <Typography variant="body">Publicar como anónima</Typography>
          </Pressable>
          <View style={styles.actions}>
            <Button
              onPress={handleCreate}
              disabled={!text.trim() || createPrayerIntention.isPending}
            >
              {createPrayerIntention.isPending ? 'Compartiendo...' : 'Compartir intención'}
            </Button>
            <Button
              onPress={() => {
                setIsWriting(false)
                setText('')
              }}
              variant="quiet"
              disabled={createPrayerIntention.isPending}
            >
              Cancelar
            </Button>
          </View>
        </Card>
      ) : (
        <View style={styles.actions}>
          <Button
            onPress={() => {
              if (!isAuthenticated) {
                router.push('/auth/login')
                return
              }
              setIsWriting(true)
            }}
          >
            Compartir intención
          </Button>
        </View>
      )}

      {isLoading ? (
        <EmptyState title="Cargando intenciones..." />
      ) : error ? (
        <EmptyState title="No se pudieron cargar las intenciones." />
      ) : intentions?.items?.length ? (
        <View style={styles.list}>
          {intentions.items.map((item) => (
            <IntentionCard key={item.id} intention={item} />
          ))}
        </View>
      ) : (
        <EmptyState
          title="Todavía no hay intenciones compartidas."
          body="Podés dejar la primera intención para que recemos juntos."
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
    marginBottom: 24,
  },
  list: {
    gap: 14,
  },
  meta: {
    color: neutralColors.textMuted,
    marginTop: 10,
  },
  cardAction: {
    marginTop: 16,
  },
  formCard: {
    marginBottom: 24,
  },
  input: {
    color: neutralColors.textPrimary,
    fontFamily: 'Lora-Regular',
    fontSize: 17,
    lineHeight: 28,
    minHeight: 120,
    padding: 0,
  },
  counter: {
    marginTop: 10,
    textAlign: 'right',
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  checkbox: {
    borderColor: neutralColors.border,
    borderRadius: 4,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  checkboxActive: {
    backgroundColor: neutralColors.textPrimary,
  },
  feedback: {
    marginBottom: 16,
  },
  pressed: {
    opacity: 0.82,
  },
})
