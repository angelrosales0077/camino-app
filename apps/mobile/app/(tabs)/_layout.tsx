/**
 * @camino/mobile - Tabs Layout
 */

import { Tabs } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { liturgicalPalettes, neutralColors } from '../../src/theme'

function TabMark({ focused }: { focused: boolean }) {
  return (
    <View
      style={[
        styles.tabMark,
        {
          borderColor: focused
            ? liturgicalPalettes.ordinary.primary
            : neutralColors.textMuted,
        },
      ]}
    >
      <View
        style={[
          styles.tabMarkInner,
          {
            backgroundColor: focused
              ? liturgicalPalettes.ordinary.primary
              : 'transparent',
          },
        ]}
      />
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: liturgicalPalettes.ordinary.primary,
        tabBarInactiveTintColor: neutralColors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabMark focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Diario',
          tabBarIcon: ({ focused }) => <TabMark focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Intenciones',
          tabBarIcon: ({ focused }) => <TabMark focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          tabBarIcon: ({ focused }) => <TabMark focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: neutralColors.background,
    borderTopColor: neutralColors.border,
    height: 68,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  tabMark: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  tabMarkInner: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
})
