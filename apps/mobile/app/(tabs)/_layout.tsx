/**
 * @camino/mobile - Tabs Layout
 */

import { Tabs } from 'expo-router'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useCaminoTheme } from '../../src/theme'

function CaminoIcon({ focused }: { focused: boolean }) {
  const { colors, liturgicalPalettes } = useCaminoTheme()

  return (
    <View
      style={[
        styles.iconFrame,
        {
          borderColor: focused ? liturgicalPalettes.ordinary.primary : colors.border,
        },
      ]}
    >
      <Image
        source={require('../../assets/icon.png')}
        style={[
          styles.caminoImage,
          focused
            ? null
            : {
                opacity: 0.62,
              },
        ]}
      />
    </View>
  )
}

function JournalIcon({ focused }: { focused: boolean }) {
  const { colors, liturgicalPalettes } = useCaminoTheme()
  const color = focused ? liturgicalPalettes.ordinary.primary : colors.textMuted

  return (
    <View style={[styles.book, { borderColor: color }]}>
      <View style={[styles.bookSpine, { backgroundColor: color }]} />
      <View style={[styles.bookLine, { backgroundColor: color }]} />
      <View style={[styles.bookLineSmall, { backgroundColor: color }]} />
    </View>
  )
}

function PrayerIcon({ focused }: { focused: boolean }) {
  const { colors } = useCaminoTheme()
  const stroke = focused ? colors.text : colors.textMuted

  return (
    <View style={styles.prayerHands}>
      <View style={[styles.prayerHandLeft, { borderColor: stroke }]} />
      <View style={[styles.prayerHandRight, { borderColor: stroke }]} />
      <View style={[styles.prayerHandBase, { borderColor: stroke }]} />
    </View>
  )
}

function MoreIcon({ focused }: { focused: boolean }) {
  const { colors, liturgicalPalettes } = useCaminoTheme()
  const color = focused ? liturgicalPalettes.ordinary.primary : colors.textMuted

  return <Text style={[styles.moreIcon, { color }]}>☰</Text>
}

export default function TabsLayout() {
  const { colors, liturgicalPalettes } = useCaminoTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: liturgicalPalettes.ordinary.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <CaminoIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Diario',
          tabBarIcon: ({ focused }) => <JournalIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Intenciones',
          tabBarIcon: ({ focused }) => <PrayerIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Mas',
          tabBarIcon: ({ focused }) => <MoreIcon focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: 68,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  iconFrame: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 26,
  },
  caminoImage: {
    height: 24,
    width: 24,
  },
  book: {
    borderRadius: 3,
    borderWidth: 1.4,
    height: 23,
    position: 'relative',
    width: 20,
  },
  bookSpine: {
    height: 20,
    left: 5,
    opacity: 0.7,
    position: 'absolute',
    top: 1,
    width: 1.2,
  },
  bookLine: {
    height: 1.2,
    left: 9,
    opacity: 0.8,
    position: 'absolute',
    top: 8,
    width: 7,
  },
  bookLineSmall: {
    height: 1.2,
    left: 9,
    opacity: 0.55,
    position: 'absolute',
    top: 13,
    width: 5,
  },
  prayerHands: {
    height: 24,
    position: 'relative',
    transform: [{ rotate: '180deg' }],
    width: 24,
  },
  prayerHandLeft: {
    borderRadius: 6,
    borderWidth: 1.4,
    height: 19,
    left: 7,
    position: 'absolute',
    top: 2,
    transform: [{ rotate: '-18deg' }],
    width: 6,
  },
  prayerHandRight: {
    borderRadius: 6,
    borderWidth: 1.4,
    height: 19,
    position: 'absolute',
    right: 7,
    top: 2,
    transform: [{ rotate: '18deg' }],
    width: 6,
  },
  prayerHandBase: {
    borderRadius: 5,
    borderWidth: 1.4,
    bottom: 1,
    height: 6,
    left: 8,
    opacity: 0.75,
    position: 'absolute',
    width: 8,
  },
  moreIcon: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 23,
    lineHeight: 24,
  },
})
