/**
 * @camino/mobile - Global stylesheet
 * Sistema de colores litúrgicos, tipografía y estilos base
 */

import { useMemo } from 'react'

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

/**
 * Colores neutrales base (siempre presentes)
 */
export const neutralColors = {
  background: '#FAFAF7',
  surface: '#F3F2EC',
  border: '#E0DDD4',
  textPrimary: '#1C1A15',
  textSecondary: '#6B6559',
  textMuted: '#A09890',
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
  return useMemo(() => {
    return {
      ...neutralColors,
      liturgy: liturgicalPalettes[season],
    }
  }, [season])
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
