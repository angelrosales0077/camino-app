# AESTHETIC.md — Camino App
**El lenguaje visual · v1.0**

---

## La sensación que buscamos

La app debe sentirse como **entrar a una iglesia antigua a las 7 de la mañana**: silencio, luz filtrada, presencia. No una iglesia moderna de concreto. No un retiro de lujo. Una iglesia de barrio con piedra vieja, velas encendidas y el olor a incienso de la misa anterior.

Técnicamente esto se traduce en: espacios en blanco generosos, tipografía serif con dignidad, colores apagados y profundos (nunca brillantes), ausencia de ruido visual, animaciones lentas y suaves.

**Lo que esta app NO debe parecer nunca:**
- Una app de meditación de Silicon Valley (nada de gradientes púrpura-azul, ilustraciones flat minimalistas, Calm/Headspace vibes)
- Una red social (sin likes, sin feeds algorítmicos agresivos, sin notificaciones rojas)
- Un sitio web parroquial de los 2000 (sin clipart, sin fotos de stock de manos juntas, sin bordes dorados digitales kitsch)
- Una app de gamificación (sin trofeos animados, sin confeti, sin barras de progreso llamativas)

---

## Tipografía

### Fuente principal: Lora
Serif humanista. Cálida, legible, con raíces editoriales. Transmite que el contenido merece ser leído despacio.

```
Font family: 'Lora', Georgia, serif
```

| Uso | Peso | Tamaño (móvil) | Tamaño (tablet) |
|---|---|---|---|
| Título de pantalla | 600 SemiBold | 26px | 30px |
| Evangelio / texto litúrgico | 400 Regular | 18px | 20px |
| Subtítulos de sección | 600 SemiBold | 14px | 15px |
| Cuerpo del diario | 400 Regular | 16px | 17px |
| Cita patrística | 400 Italic | 15px | 16px |

### Fuente secundaria: Inter
Sans-serif para UI (botones, labels, navegación, metadatos). No compite con Lora en jerarquía.

```
Font family: 'Inter', -apple-system, sans-serif
```

| Uso | Peso | Tamaño |
|---|---|---|
| Etiquetas de UI (tabs, botones) | 500 Medium | 13px |
| Metadata (fecha, autor) | 400 Regular | 12px |
| Notificaciones in-app | 400 Regular | 14px |

### Reglas tipográficas
- Line height del texto litúrgico: 1.8 (respiración, no densidad)
- Line height del diario: 1.7
- Máximo width de columna de texto: 65ch (no dejar el texto expandirse a todo el ancho)
- Tracking (letter-spacing) en títulos de sección: +0.05em
- **Nunca usar mayúsculas completas en textos litúrgicos**

---

## Paleta de colores

### Sistema base (siempre presente)

```
--color-background:     #FAFAF7   /* Blanco cálido, ligeramente marfil */
--color-surface:        #F3F2EC   /* Superficie de cards, ligeramente más oscuro */
--color-border:         #E0DDD4   /* Bordes sutiles */
--color-text-primary:   #1C1A15   /* Negro cálido, no puro */
--color-text-secondary: #6B6559   /* Gris cálido para metadata */
--color-text-muted:     #A09890   /* Para placeholders y hints */
```

> **Por qué blanco marfil y no blanco puro:** El blanco puro `#FFFFFF` tiene una frialdad digital que rompe la atmósfera de recogimiento. El marfil cálido recuerda al papel de los libros litúrgicos.

### Paleta litúrgica (cambia según el tiempo del año)

Estas son las únicas variables que cambian dinámicamente. El resto de la UI permanece igual.

#### Tiempo ordinario (el más frecuente)
```
--color-liturgical-primary:   #2D5A3D   /* Verde oscuro bosque */
--color-liturgical-accent:    #4A7C5C   /* Verde medio para acentos */
--color-liturgical-light:     #E8F0EB   /* Verde muy suave para fondos de header */
```

#### Adviento
```
--color-liturgical-primary:   #4A2C6B   /* Morado oscuro */
--color-liturgical-accent:    #6B4A8A   /* Morado medio */
--color-liturgical-light:     #EDE8F5   /* Lavanda muy suave */
```

#### Navidad
```
--color-liturgical-primary:   #8B6914   /* Dorado oscuro */
--color-liturgical-accent:    #B8860B   /* Dorado medio */
--color-liturgical-light:     #FAF5E4   /* Crema dorada */
```

#### Cuaresma
```
--color-liturgical-primary:   #5C2D6B   /* Morado cuaresmal (más vivo que Adviento) */
--color-liturgical-accent:    #7A4A8A   /* Morado medio */
--color-liturgical-light:     #F0EAF5   /* Lavanda cuaresmal */
```

#### Semana Santa
```
--color-liturgical-primary:   #7B1A2A   /* Burdeos / rojo pasión */
--color-liturgical-accent:    #A02535   /* Rojo medio */
--color-liturgical-light:     #F5E8EA   /* Rosa muy oscuro */
```

#### Tiempo pascual
```
--color-liturgical-primary:   #8B6914   /* Dorado (comparte con Navidad) */
--color-liturgical-accent:    #C9A84C   /* Dorado claro */
--color-liturgical-light:     #FDFAF0   /* Blanco-dorado */
```

#### Fiestas de mártires (rojo)
```
--color-liturgical-primary:   #8B2020   /* Rojo carmesí */
--color-liturgical-accent:    #B03030   /* Rojo medio */
--color-liturgical-light:     #F5EAEA   /* Rosa muy suave */
```

### Uso de la paleta litúrgica en la UI
- Header / status bar background: `--color-liturgical-light`
- Línea de acento en el header (1–2px): `--color-liturgical-primary`
- Botón primario (CTA principal de pantalla): `--color-liturgical-primary` con texto blanco
- Icono de racha (llama): `--color-liturgical-accent`
- Tags y chips: `--color-liturgical-light` background + `--color-liturgical-primary` texto
- El resto de la UI (cards, body, inputs): siempre la paleta base neutral

---

## Iconografía

### Estilo
Íconos de línea delgada (1.5px stroke), redondeados en los extremos, geométricamente simples. **No usar emojis en la UI.** No usar íconos rellenos sólidos (demasiado pesados).

Librería base recomendada: **Lucide Icons** (open source, coherente con el estilo).

### Íconos propios (deben diseñarse custom)
Estos no existen bien en ninguna librería y representan el alma de la app:

| Elemento | Descripción del ícono |
|---|---|
| Llama de racha | Llama simple, 2 curvas, sin relleno sólido |
| Manos de oración | Dos manos juntas, línea fina, abstracto (no fotorrealista) |
| Cruz | Cruz latina simple, proporciones clásicas, no ornamentada |
| Libro abierto (Evangelio) | Libro abierto con spine visible, sin texto dentro |
| Rosario | Círculo de cuentas simplificado, 5 puntos en el círculo |

### Lo que nunca usamos
- Palomas con rayos de luz
- Jesús ilustrado o pintado
- Ángeles con alas
- Corazón de Jesús fotorrealista
- Cualquier imagen kitsch de catolicismo pop

La iconografía debe ser tan limpia que funcione en una app de meditación secular. La identidad católica viene del contenido y del color litúrgico, no de los íconos.

---

## Espaciado y layout

### Sistema de espaciado (múltiplos de 4px)
```
--space-xs:   4px
--space-sm:   8px
--space-md:  16px
--space-lg:  24px
--space-xl:  32px
--space-2xl: 48px
--space-3xl: 64px
```

### Márgenes de pantalla
- Padding horizontal de pantalla: 20px (no 16px — los textos litúrgicos necesitan más espacio)
- Padding top del contenido (bajo el header): 24px
- Padding bottom (sobre la nav bar): 32px

### Cards
```
border-radius: 12px
padding: 20px
background: --color-surface
border: 1px solid --color-border
```
Nunca `box-shadow`. Las sombras recuerdan a apps de productividad.

### Separadores
No usar líneas `<hr>` decorativas. Usar espacio en blanco (`--space-xl` o `--space-2xl`) como único separador entre secciones.

---

## Animaciones y micro-interacciones

### Principio: lentitud deliberada
Las animaciones deben sentirse como el ritmo de la oración, no como el ritmo de una red social. Esto no significa lentas al punto de ser molestas — significa suaves y sin rebotes.

### Duraciones
```
--duration-fast:   150ms   /* Feedback de tap */
--duration-normal: 300ms   /* Transiciones de pantalla */
--duration-slow:   500ms   /* Entrada de contenido litúrgico */
--duration-breath: 4000ms  /* Animaciones de "respiración" (modo silencio) */
```

### Easing
```
--ease-default: cubic-bezier(0.4, 0, 0.2, 1)   /* Suave, sin rebote */
--ease-in:      cubic-bezier(0.4, 0, 1, 1)
--ease-out:     cubic-bezier(0, 0, 0.2, 1)
```

**Prohibido:**
- `spring()` animations con rebote (`bounce`)
- Animaciones de confeti o celebración llamativa
- Parallax
- Transiciones de "flip" o "zoom out"

### Animaciones específicas

**Entrada de pantalla principal (Home):** Fade in suave del contenido (opacity 0→1, translateY 8px→0), 400ms ease-out.

**Lectura del Evangelio:** Cada párrafo hace fade in con un delay escalonado de 100ms entre párrafos. Da la sensación de que el texto "aparece" para ser leído, no que ya estaba ahí esperando.

**Llama de racha apagada/encendida:** La llama tiene una micro-animación de flickering cuando está activa (opacity oscila entre 0.85–1.0, 3s loop, ease in-out). Cuando se enciende por primera vez en el día, hace una transición desde gris a `--color-liturgical-accent` en 600ms.

**Completar el día (checkmark):** Al marcar el día como completo, un círculo se dibuja alrededor del ícono (stroke-dasharray animation), sin confeti, sin sonido. Silencioso y satisfactorio.

**Botón "Rezar por esta intención":** Al tocar, el ícono de manos juntas hace un pequeño pulse (scale 1.0→1.15→1.0) en 300ms. No hay contador animado que cambie: el número se actualiza en la próxima recarga del feed.

---

## Pantallas clave — guía visual

### Home
Layout: vertical, scroll único. De arriba a abajo:
1. Header: fecha litúrgica larga ("Jueves 15 de mayo · Tiempo Pascual") en Inter 12px muted, color litúrgico como franja de 2px arriba del header
2. Saludo: "Buenos días, nombre." en Lora 22px — solo el primer nombre, sin apellido
3. Card del Evangelio del día: la primera oración del evangelio en cursiva Lora 17px, botón secundario "Leer completo"
4. Card de Laudes: "Rezar Laudes de hoy · ~8 min" con el nombre del himno del día
5. Santo del día: nombre + frase en formato cita
6. Llama de racha: número grande + "días de camino" en Inter small

No hay tabs en el home. Todo en scroll vertical.

### Pantalla del Evangelio
- Fondo: `--color-background`
- Texto del evangelio en Lora 18px, line-height 1.8, columna centrada (max 65ch)
- Antes del texto: referencia bíblica en Inter 12px muted (ej: "Juan 15, 1-8")
- Después del texto: separador visual (solo espacio), luego la cita patrística en Lora 15px italic con guión em y nombre del Padre
- Sticky bottom bar: ícono de diario + botón "Compartir tarjeta"

### Diario espiritual
- Fondo ligeramente más cálido (`--color-surface`)
- Input de texto: sin borde visible, solo un cursor parpadeante sobre fondo de surface
- Placeholder en Lora italic: "¿Qué te llevás de la lectura de hoy?"
- Fecha en la parte superior derecha en Inter 12px muted
- Historial: lista de entradas con fecha y primeras 80 caracteres, en Lora 15px

### Intenciones comunitarias
- Feed vertical de cards pequeñas
- Cada card: texto de la intención en Lora 15px, "Anónimo" o nombre en Inter 12px, número de personas rezando en Inter 12px muted
- Botón de respuesta: ícono de manos + "Rezar por esto" en Inter 13px
- Sin avatar, sin foto, sin color de fondo variable por usuario
- Botón flotante "+" para publicar intención propia

---

## Modo oscuro

El modo oscuro sigue el sistema operativo del dispositivo. Los colores en modo oscuro:

```
--color-background (dark):     #1A1916
--color-surface (dark):        #222119
--color-border (dark):         #333128
--color-text-primary (dark):   #F0EDE5
--color-text-secondary (dark): #8A8070
--color-text-muted (dark):     #5A5548
```

La paleta litúrgica en modo oscuro usa variantes más saturadas (no más claras) de los colores de tiempo:
- Verde ordinario: `#3A7050` (más saturado, no más claro)
- Morado Adviento: `#6040A0`
- Etc.

---

## Tono de escritura en la UI

La app habla como un amigo espiritual culto, no como un algoritmo ni como un sacerdote formal.

**Sí:**
- "Tu diario espiritual ya tiene 30 reflexiones."
- "Hoy descansaste. El descanso también es oración."
- "El Señor te espera en la oración de hoy."
- "¿Terminaste tu día con oración?"

**No:**
- "¡Completaste tu racha!" (exclamación ansiosa)
- "Desbloquea el contenido premium" (lenguaje de producto frío)
- "Haga clic para continuar" (tono formal/sistema)
- "¡No olvides rezar!" (tono de recordatorio culposo)
- "Actualiza tu app para acceder a más contenido" (push de monetización)

### Fórmula para el tono
Escribir como lo haría un amigo que estudió teología pero no es sacerdote, que te aprecia, que sabe que estás ocupado y que no te juzga si un día no rezaste.
