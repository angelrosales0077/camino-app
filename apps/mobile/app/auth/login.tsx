import { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Button,
  Card,
  LiturgicalHeader,
  Screen,
  Typography,
} from '../../src/components/ui'
import { useCaminoTheme } from '../../src/theme'
import { getSessionCredentials, signInWithPassword } from '../../src/lib/auth'
import { useUserStore } from '../../src/stores'

export default function LoginScreen() {
  const router = useRouter()
  const setCredentials = useUserStore((state) => state.setCredentials)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { colors } = useCaminoTheme()

  const handleLogin = async () => {
    if (!email.trim() || !password || isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      const session = await signInWithPassword(email.trim(), password)
      const credentials = getSessionCredentials(session)
      setCredentials(credentials.user, credentials.token, credentials.refreshToken)
      router.replace('/(tabs)')
    } catch {
      setError('No se pudo entrar. Revisá tus datos e intentá nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen>
      <LiturgicalHeader
        title="Entrar a Camino"
        subtitle="Guardá tu diario y tus días de camino en tu cuenta."
      />
      <Card>
        <View style={styles.fields}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { borderBottomColor: colors.border, color: colors.textPrimary }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Contraseña"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { borderBottomColor: colors.border, color: colors.textPrimary }]}
          />
        </View>
        {error ? (
          <Typography variant="meta" style={styles.error}>
            {error}
          </Typography>
        ) : null}
        <View style={styles.actions}>
          <Button
            onPress={handleLogin}
            disabled={!email.trim() || !password || isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
          <Button onPress={() => router.push('/auth/register')} variant="quiet">
            Crear cuenta
          </Button>
        </View>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  fields: {
    gap: 12,
  },
  input: {
    borderBottomWidth: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    paddingVertical: 12,
  },
  actions: {
    gap: 10,
    marginTop: 22,
  },
  error: {
    marginTop: 14,
  },
})
