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
import { getSessionCredentials, signUpWithPassword } from '../../src/lib/auth'
import { useUserStore } from '../../src/stores'

export default function RegisterScreen() {
  const router = useRouter()
  const setCredentials = useUserStore((state) => state.setCredentials)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { colors, liturgicalPalettes } = useCaminoTheme()

  const handleRegister = async () => {
    if (!email.trim() || password.length < 6 || isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)
      const signUp = await signUpWithPassword(email.trim(), password)

      if (!signUp.session) {
        setSuccess('Cuenta creada. Revisá tu correo para confirmar la cuenta.')
        return
      }

      const credentials = getSessionCredentials(signUp.session)
      setCredentials(credentials.user, credentials.token, credentials.refreshToken)
      router.replace('/(tabs)')
    } catch (error) {
      setError(error instanceof Error && error.message
        ? error.message
        : 'No se pudo crear la cuenta. Probá nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen>
      <LiturgicalHeader
        title="Crear cuenta"
        subtitle="Tu espacio de oración queda reservado para vos."
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
        <Typography variant="meta" style={styles.hint}>
          Usá al menos 6 caracteres.
        </Typography>
        {error ? (
          <Typography variant="meta" style={styles.error}>
            {error}
          </Typography>
        ) : null}
        {success ? (
          <Typography variant="meta" color={liturgicalPalettes.ordinary.primary} style={styles.success}>
            {success}
          </Typography>
        ) : null}
        <View style={styles.actions}>
          <Button
            onPress={handleRegister}
            disabled={!email.trim() || password.length < 6 || isSubmitting}
          >
            {isSubmitting ? 'Creando...' : 'Crear cuenta'}
          </Button>
          <Button onPress={() => router.replace('/auth/login')} variant="quiet">
            Ya tengo cuenta
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
  hint: {
    marginTop: 12,
  },
  actions: {
    gap: 10,
    marginTop: 22,
  },
  error: {
    marginTop: 14,
  },
  success: {
    marginTop: 14,
  },
})
