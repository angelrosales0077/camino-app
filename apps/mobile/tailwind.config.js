/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base neutral palette (always present)
        background: '#FAFAF7', // marfil cálido
        surface: '#F3F2EC', // superficie cards
        border: '#E0DDD4', // bordes sutiles
        'text-primary': '#1C1A15', // negro cálido
        'text-secondary': '#6B6559', // gris cálido
        'text-muted': '#A09890', // gris para metadata

        // Liturgical seasons (dynamic by time of year)
        liturgy: {
          // Tiempo ordinario (verde bosque)
          ordinary: {
            primary: '#2D5A3D',
            accent: '#4A7C5C',
            light: '#E8F0EB',
          },
          // Adviento (morado oscuro)
          advent: {
            primary: '#4A2C6B',
            accent: '#6B4A8A',
            light: '#EDE8F5',
          },
          // Navidad (dorado cálido)
          christmas: {
            primary: '#8B6914',
            accent: '#B8860B',
            light: '#FAF5E4',
          },
          // Cuaresma (morado cuaresmal)
          lent: {
            primary: '#5C2D6B',
            accent: '#7A4A8A',
            light: '#F0EAF5',
          },
          // Semana Santa (burdeos pasión)
          'holy-week': {
            primary: '#7B1A2A',
            accent: '#A02535',
            light: '#F5E8EA',
          },
          // Pascua (dorado)
          easter: {
            primary: '#8B6914',
            accent: '#C9A84C',
            light: '#FDFAF0',
          },
          // Mártires (rojo carmesí)
          martyrs: {
            primary: '#8B2020',
            accent: '#B03030',
            light: '#F5EAEA',
          },
        },
      },
      fontFamily: {
        // Lora: serif para textos litúrgicos (dignidad, legibilidad)
        lora: ['Lora', 'Georgia', 'serif'],
        // Inter: sans-serif para UI (botones, labels, navegación)
        inter: ['Inter', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Tipografía del sistema
        'title-xl': ['26px', { lineHeight: '32px', fontWeight: '600' }], // Títulos de pantalla
        'title-lg': ['22px', { lineHeight: '28px', fontWeight: '600' }], // Títulos de sección
        'title': ['18px', { lineHeight: '24px', fontWeight: '600' }], // Subtítulos
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }], // Cuerpo principal
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }], // Cuerpo pequeño
        'label': ['13px', { lineHeight: '18px', fontWeight: '500' }], // Labels UI
        'meta': ['12px', { lineHeight: '16px', fontWeight: '400' }], // Metadata, fechas
      },
      lineHeight: {
        liturgy: '1.8', // Respiración para textos litúrgicos
        journal: '1.7', // Entradas de diario
      },
      spacing: {
        'liturgy-xs': '4px',
        'liturgy-sm': '8px',
        'liturgy-md': '16px',
        'liturgy-lg': '24px',
        'liturgy-xl': '32px',
        'liturgy-2xl': '48px',
        'liturgy-3xl': '64px',
      },
      borderRadius: {
        liturgy: '12px', // Cards redondeadas suave
      },
      opacity: {
        flame: {
          active: '1',
          idle: '0.5',
        },
      },
    },
  },
  plugins: [],
}
