/**
 * @camino/mobile - More Tab
 */

import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Button,
  Card,
  LiturgicalHeader,
  Screen,
  Typography,
} from '../../src/components/ui'
import { clearSession } from '../../src/lib/auth'
import env from '../../src/config/env'
import { useUserStore } from '../../src/stores'

export default function MoreScreen() {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const logout = useUserStore((state) => state.logout)

  const handleLogout = async () => {
    await clearSession()
    logout()
  }

  return (
    <Screen>
      <LiturgicalHeader title="Más" subtitle="Camino" />
      <Card>
        <Typography variant="sectionTitle">Cuenta</Typography>
        <Typography variant="meta" style={styles.text}>
          {isAuthenticated
            ? user?.email || 'Sesión iniciada'
            : 'Entrá para guardar tu diario y tus días de camino.'}
        </Typography>
        <View style={styles.actions}>
          {isAuthenticated ? (
            <Button onPress={handleLogout} variant="secondary">
              Cerrar sesión
            </Button>
          ) : (
            <Button onPress={() => router.push('/auth/login')}>
              Entrar a Camino
            </Button>
          )}
        </View>
      </Card>

      {env.enableApiDiagnostics ? (
        <Card>
          <Typography variant="sectionTitle">Diagnóstico</Typography>
          <Typography variant="meta" style={styles.text}>
            API URL: {env.apiUrl}
          </Typography>
          <View style={styles.actions}>
            <Button onPress={() => router.push('/diagnostics')} variant="secondary">
              Test backend connection
            </Button>
          </View>
        </Card>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  text: {
    marginTop: 10,
  },
  actions: {
    marginTop: 18,
  },
})
