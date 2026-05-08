/**
 * @camino/mobile - Global stylesheet
 * Sistema de colores litúrgicos, tipografía y estilos base
 */

import { useMemo } from 'react'
import { useColorScheme } from 'react-native'

/**
 * Paletas litúrgicas por tiempo del año
 * Se actualiza dinámicamente según el servidor
 */
export const liturgicalPalettes = {
  ordinary: {
    name: 'Tiempo Ordinario',
    primary: '#2D5A3D',
    accent: '#4A7C5C',
    light: '#E8F0EB',
  },
  advent: {
    name: 'Adviento',
    primary: '#4A2C6B',
    accent: '#6B4A8A',
    light: '#EDE8F5',
  },
  christmas: {
    name: 'Navidad',
    primary: '#8B6914',
    accent: '#B8860B',
    light: '#FAF5E4',
  },
  lent: {
    name: 'Cuaresma',
    primary: '#5C2D6B',
    accent: '#7A4A8A',
    light: '#F0EAF5',
  },
  'holy-week': {
    name: 'Semana Santa',
    primary: '#7B1A2A',
    accent: '#A02535',
    light: '#F5E8EA',
  },
  easter: {
    name: 'Pascua',
    primary: '#8B6914',
    accent: '#C9A84C',
    light: '#FDFAF0',
  },
  martyrs: {
    name: 'Mártires',
    primary: '#8B2020',
    accent: '#B03030',
    light: '#F5EAEA',
  },
} as const

export const darkLiturgicalPalettes = {
  ordinary: {
    name: 'Tiempo Ordinario',
    primary: '#7EA88B',
    accent: '#A8C2AF',
    light: '#1F2A21',
  },
  advent: {
    name: 'Adviento',
    primary: '#A98BC8',
    accent: '#C6B3D8',
    light: '#282033',
  },
  christmas: {
    name: 'Navidad',
    primary: '#D0B264',
    accent: '#E0C987',
    light: '#2D281B',
  },
  lent: {
    name: 'Cuaresma',
    primary: '#B38AC7',
    accent: '#C9AAD8',
    light: '#2A2130',
  },
  'holy-week': {
    name: 'Semana Santa',
    primary: '#C77B82',
    accent: '#D6A0A5',
    light: '#302022',
  },
  easter: {
    name: 'Pascua',
    primary: '#D0B264',
    accent: '#E0C987',
    light: '#2D281B',
  },
  martyrs: {
    name: 'Mártires',
    primary: '#C98282',
    accent: '#D7A3A3',
    light: '#302120',
  },
} as const

/**
 * Colores neutrales base (siempre presentes)
 */
export interface NeutralColors {
  background: string
  surface: string
  border: string
  textPrimary: string
  textSecondary: string
  textMuted: string
}

export const neutralColors: NeutralColors = {
  background: '#FAFAF7',
  surface: '#F3F2EC',
  border: '#E0DDD4',
  textPrimary: '#1C1A15',
  textSecondary: '#6B6559',
  textMuted: '#A09890',
}

export const darkNeutralColors: NeutralColors = {
  background: '#1A1916',
  surface: '#222119',
  border: '#333128',
  textPrimary: '#F0EDE5',
  textSecondary: '#8A8070',
  textMuted: '#5A5548',
}

export type CaminoColorScheme = 'light' | 'dark'

export function getNeutralColors(scheme: CaminoColorScheme) {
  return scheme === 'dark' ? darkNeutralColors : neutralColors
}

export function getLiturgicalPalette(
  season: keyof typeof liturgicalPalettes = 'ordinary',
  scheme: CaminoColorScheme = 'light'
) {
  const palettes = scheme === 'dark' ? darkLiturgicalPalettes : liturgicalPalettes
  return palettes[season]
}

export function useCaminoTheme() {
  const scheme: CaminoColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light'
  return useMemo(() => ({
    scheme,
    colors: getNeutralColors(scheme),
    liturgicalPalettes: scheme === 'dark' ? darkLiturgicalPalettes : liturgicalPalettes,
  }), [scheme])
}

/**
 * Tipografía del sistema
 */
export const typography = {
  title: {
    xl: { fontSize: 26, lineHeight: 32, fontWeight: '600' as const }, // Lora
    lg: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  },
  subtitle: {
    lg: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  },
  body: {
    regular: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    sm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    xs: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  },
  label: {
    medium: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
    small: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  },
}

/**
 * Hook para acceder a colores litúrgicos actuales
 * @param season - Tiempo litúrgico actual (ej: 'ordinary', 'advent')
 */
export function useLiturgicalColors(season: keyof typeof liturgicalPalettes = 'ordinary') {
  const theme = useCaminoTheme()
  return useMemo(() => {
    return {
      ...theme.colors,
      liturgy: getLiturgicalPalette(season, theme.scheme),
    }
  }, [season, theme.colors, theme.scheme])
}

/**
 * Espaciado del sistema (múltiplos de 4px)
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
}

/**
 * Esquinas redondeadas
 */
export const borderRadius = {
  card: 12,
  button: 8,
  input: 8,
}
