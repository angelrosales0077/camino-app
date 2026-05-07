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
