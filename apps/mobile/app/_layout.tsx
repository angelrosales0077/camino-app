/**
 * @camino/mobile - Root Layout
 * Expo Router entry point
 */

import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Lora_400Regular, Lora_600SemiBold, Lora_400Regular_Italic } from '@expo-google-fonts/lora'
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter'
import { AppProvider } from '../src/providers/AppProvider'
import { useCaminoTheme } from '../src/theme'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { colors } = useCaminoTheme()
  const [fontsLoaded, fontError] = useFonts({
    'Lora-Regular': Lora_400Regular,
    'Lora-SemiBold': Lora_600SemiBold,
    'Lora-Italic': Lora_400Regular_Italic,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  })

  useEffect(() => {
    if (fontError) throw fontError
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <AppProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="gospel/[date]" />
          <Stack.Screen name="journal/[id]" />
          <Stack.Screen name="diagnostics" />
          <Stack.Screen name="breviary/index" />
          <Stack.Screen name="breviary/office-of-readings" />
          <Stack.Screen name="breviary/lauds" />
          <Stack.Screen name="breviary/terce" />
          <Stack.Screen name="breviary/sext" />
          <Stack.Screen name="breviary/none" />
          <Stack.Screen name="breviary/vespers" />
          <Stack.Screen name="breviary/compline" />
        </Stack>
      </GestureHandlerRootView>
    </AppProvider>
  )
}
