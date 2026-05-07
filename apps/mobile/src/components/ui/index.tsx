/**
 * @camino/mobile - UI Component Library
 * Shared Camino visual primitives.
 */

import React from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { liturgicalPalettes, neutralColors } from '../../theme'
import type { LiturgicalSeason } from '@camino/shared'

const fonts = {
  loraRegular: 'Lora-Regular',
  loraSemiBold: 'Lora-SemiBold',
  loraItalic: 'Lora-Italic',
  interRegular: 'Inter-Regular',
  interMedium: 'Inter-Medium',
  interSemiBold: 'Inter-SemiBold',
}

export function getLiturgicalPalette(season?: LiturgicalSeason | null) {
  const key = season && season in liturgicalPalettes ? season : 'ordinary'
  return liturgicalPalettes[key]
}

export function formatCaminoDate(isoDate?: string | null) {
  const date = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date()
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

interface ScreenProps {
  children: React.ReactNode
  padded?: boolean
  backgroundColor?: string
}

export function Screen({
  children,
  padded = true,
  backgroundColor = neutralColors.background,
}: ScreenProps) {
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor }]}
      contentContainerStyle={[
        styles.screenContent,
        padded ? styles.screenPadded : null,
      ]}
    >
      {children}
    </ScrollView>
  )
}

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>
}

type TextVariant =
  | 'eyebrow'
  | 'screenTitle'
  | 'sectionTitle'
  | 'body'
  | 'spiritualBody'
  | 'meta'
  | 'label'

interface TypographyProps {
  children: React.ReactNode
  variant?: TextVariant
  color?: string
  style?: StyleProp<TextStyle>
}

export function Typography({
  children,
  variant = 'body',
  color,
  style,
}: TypographyProps) {
  return (
    <Text style={[textStyles[variant], color ? { color } : null, style]}>
      {children}
    </Text>
  )
}

interface ButtonProps {
  children: React.ReactNode
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'quiet'
  disabled?: boolean
  accentColor?: string
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  accentColor = liturgicalPalettes.ordinary.primary,
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        getButtonStyle(variant, accentColor),
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.buttonText, getButtonTextStyle(variant, accentColor)]}>
        {children}
      </Text>
    </Pressable>
  )
}

interface LiturgicalHeaderProps {
  title: string
  date?: string | null
  season?: LiturgicalSeason | null
  subtitle?: string
}

export function LiturgicalHeader({
  title,
  date,
  season,
  subtitle,
}: LiturgicalHeaderProps) {
  const palette = getLiturgicalPalette(season)

  return (
    <Card style={[styles.headerCard, { backgroundColor: palette.light }]}>
      <View style={[styles.rule, { backgroundColor: palette.primary }]} />
      <Typography variant="meta">
        {date ? formatCaminoDate(date) : formatCaminoDate()}
      </Typography>
      <Typography variant="screenTitle" style={styles.headerTitle}>
        {title}
      </Typography>
      <Typography variant="label" color={neutralColors.textSecondary}>
        {subtitle || palette.name}
      </Typography>
    </Card>
  )
}

interface SectionTitleProps {
  eyebrow?: string
  title: string
}

export function SectionTitle({ eyebrow, title }: SectionTitleProps) {
  return (
    <View style={styles.sectionTitle}>
      {eyebrow ? <Typography variant="eyebrow">{eyebrow}</Typography> : null}
      <Typography variant="sectionTitle">{title}</Typography>
    </View>
  )
}

interface EmptyStateProps {
  title: string
  body?: string
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <Card>
      <Typography variant="spiritualBody">{title}</Typography>
      {body ? (
        <Typography variant="meta" style={styles.emptyBody}>
          {body}
        </Typography>
      ) : null}
    </Card>
  )
}

interface JournalInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder: string
}

export function JournalInput({
  value,
  onChangeText,
  placeholder,
}: JournalInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={neutralColors.textMuted}
      multiline
      textAlignVertical="top"
      style={styles.journalInput}
    />
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: neutralColors.background,
  },
  screenContent: {
    paddingBottom: 44,
  },
  screenPadded: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: neutralColors.surface,
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 0,
    padding: 20,
  },
  headerCard: {
    marginBottom: 28,
  },
  rule: {
    height: 2,
    marginBottom: 18,
    width: 56,
  },
  headerTitle: {
    marginBottom: 8,
    marginTop: 10,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  emptyBody: {
    marginTop: 8,
  },
  button: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.82,
  },
  buttonText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  journalInput: {
    backgroundColor: neutralColors.surface,
    borderColor: neutralColors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: neutralColors.textPrimary,
    fontFamily: fonts.loraItalic,
    fontSize: 16,
    lineHeight: 27,
    minHeight: 190,
    padding: 0,
  },
})

const textStyles = StyleSheet.create({
  eyebrow: {
    color: neutralColors.textMuted,
    fontFamily: fonts.interMedium,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  screenTitle: {
    color: neutralColors.textPrimary,
    fontFamily: fonts.loraSemiBold,
    fontSize: 26,
    lineHeight: 32,
  },
  sectionTitle: {
    color: neutralColors.textPrimary,
    fontFamily: fonts.loraSemiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    color: neutralColors.textPrimary,
    fontFamily: fonts.interRegular,
    fontSize: 16,
    lineHeight: 25,
  },
  spiritualBody: {
    color: neutralColors.textPrimary,
    fontFamily: fonts.loraRegular,
    fontSize: 18,
    lineHeight: 32,
  },
  meta: {
    color: neutralColors.textMuted,
    fontFamily: fonts.interRegular,
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    color: neutralColors.textPrimary,
    fontFamily: fonts.interMedium,
    fontSize: 13,
    lineHeight: 18,
  },
})

function getButtonStyle(
  variant: 'primary' | 'secondary' | 'quiet',
  accentColor: string
): ViewStyle {
  if (variant === 'primary') {
    return {
      backgroundColor: accentColor,
      borderColor: accentColor,
    }
  }

  if (variant === 'secondary') {
    return {
      backgroundColor: 'transparent',
      borderColor: accentColor,
    }
  }

  return {
    backgroundColor: neutralColors.surface,
    borderColor: neutralColors.border,
  }
}

function getButtonTextStyle(
  variant: 'primary' | 'secondary' | 'quiet',
  accentColor: string
): TextStyle {
  if (variant === 'primary') {
    return { color: '#FFFDF7' }
  }

  if (variant === 'secondary') {
    return { color: accentColor }
  }

  return { color: neutralColors.textPrimary }
}
