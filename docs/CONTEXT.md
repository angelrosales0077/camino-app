# CONTEXT.md — Camino App
**Stack · Reglas · Estilo de código · v1.0**

---

## Stack tecnológico

### Mobile — React Native (Expo)
```
Runtime:        Expo SDK 51+ (managed workflow)
Language:       TypeScript 5.x (strict mode, sin excepción)
Navigation:     Expo Router v3 (file-based routing)
State:          Zustand 4.x (global) + React Query v5 (server state)
Styling:        NativeWind 4.x (Tailwind para React Native)
Animations:     React Native Reanimated 3.x
Storage local:  Expo SecureStore (datos sensibles) + MMKV (preferencias)
Notificaciones: Expo Notifications
```

**Por qué Expo managed workflow:** Permite iterar rápido en MVP sin lidiar con módulos nativos. Cuando se necesite (v2), se puede eject a bare workflow. El diario cifrado y las notificaciones están cubiertos por las APIs de Expo.

### Backend
```
Runtime:        Node.js 20 LTS
Framework:      Hono (lightweight, edge-ready, TypeScript-first)
Base de datos:  PostgreSQL 16 (Supabase como hosted provider)
ORM:            Drizzle ORM (type-safe, sin magia implícita)
Auth:           Supabase Auth (email magic link + Apple/Google OAuth)
Storage:        Supabase Storage (para assets estáticos de santos, imágenes)
Cache:          Redis via Upstash (rate limiting + cache de contenido litúrgico)
Jobs / Cron:    Trigger.dev (actualización del contenido litúrgico diario)
Deploy:         Railway (backend) + Supabase (DB)
```

**Por qué Hono sobre Express:** Más liviano, mejor soporte de TypeScript, edge-compatible para el futuro. La diferencia en DX es mínima y la performance es mejor.

**Por qué Supabase sobre Firebase:** Row Level Security nativa en PostgreSQL es ideal para el modelo de privacidad del diario. Firebase Firestore tiene limitaciones de query que Postgres no tiene.

### Infraestructura
```
CDN / Assets:   Cloudflare R2 + Cloudflare CDN
CI/CD:          GitHub Actions
Monitoreo:      Sentry (errores) + PostHog (analytics, self-hosted o cloud EU)
Secretos:       Doppler
```

**Analytics:** PostHog sobre Mixpanel/Amplitude porque es open-source, tiene opción self-hosted (cumplimiento GDPR más simple) y su precio es más accesible para early-stage.

### Repo estructura (monorepo)
```
camino/
├── apps/
│   └── mobile/          # Expo app
├── packages/
│   ├── api/             # Hono backend (deployado en Railway)
│   ├── db/              # Drizzle schema + migrations
│   ├── shared/          # Types compartidos entre mobile y api
│   └── content/         # Scripts de scraping y curación de contenido litúrgico
├── tooling/
│   ├── tsconfig/        # Base tsconfig compartida
│   └── eslint/          # Config ESLint compartida
├── .github/
│   └── workflows/
└── package.json         # Turborepo config
```

**Package manager:** pnpm con workspaces. Turbo para task running en monorepo.

---

## Principios de arquitectura

### 1. Offline-first para el contenido litúrgico
El Evangelio del día, las Laudes y el Santo deben estar disponibles sin conexión. Se descargan en background al abrir la app y se almacenan en MMKV. El indicador de "sin conexión" es un aviso discreto, no una pantalla de bloqueo.

```typescript
// Patrón: siempre mostrar desde caché, actualizar en background (stale-while-revalidate)
const { data: gospel } = useQuery({
  queryKey: ['gospel', today],
  queryFn: fetchGospelFromAPI,
  staleTime: 1000 * 60 * 60 * 6,  // 6 horas
  gcTime: 1000 * 60 * 60 * 48,     // 48 horas en caché
  networkMode: 'offlineFirst',
})
```

### 2. Privacidad del diario por diseño
Las entradas del diario espiritual son cifradas en el dispositivo antes de enviarse al servidor. El backend nunca ve el contenido en texto plano.

```typescript
// Cifrado del lado del cliente con la clave derivada del usuario
// La clave NO se almacena en el servidor
import { encrypt, decrypt } from '@/lib/crypto'

async function saveJournalEntry(text: string, userId: string) {
  const userKey = await getUserEncryptionKey(userId)  // derivada de Supabase Auth token
  const encrypted = await encrypt(text, userKey)
  await api.journal.create({ content: encrypted, userId })
}
```

### 3. Separación estricta de responsabilidades
- **Componentes UI:** Solo presentación. Cero lógica de negocio. Reciben props, llaman callbacks.
- **Hooks custom:** Encapsulan lógica de estado y efectos secundarios.
- **Stores (Zustand):** Solo estado global genuinamente global (usuario, tiempo litúrgico, preferencias).
- **API (React Query):** Toda comunicación con el servidor.
- **Lib:** Funciones puras sin side effects (formateo, cálculos, crypto).

### 4. Tipado estricto de extremo a extremo
Los tipos de la base de datos (Drizzle) se exportan a `packages/shared` y se usan en el frontend. Cero `any`. Cero `as unknown as X`.

---

## Estructura del proyecto mobile (Expo Router)

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Home (Evangelio + Laudes + Santo)
│   │   ├── journal.tsx      # Diario espiritual
│   │   ├── community.tsx    # Intenciones de oración
│   │   └── more.tsx         # Rosario, Calendario, Configuración
│   ├── gospel/[date].tsx    # Evangelio completo
│   ├── lauds/[date].tsx     # Laudes del día
│   ├── rosary/index.tsx     # Rosario interactivo
│   ├── calendar/index.tsx   # Calendario litúrgico
│   ├── onboarding/          # Flujo de primer uso
│   └── _layout.tsx
├── components/
│   ├── liturgy/             # Componentes específicos del dominio litúrgico
│   │   ├── GospelCard.tsx
│   │   ├── LiturgicalHeader.tsx
│   │   ├── SaintOfDay.tsx
│   │   └── StreakFlame.tsx
│   ├── community/
│   │   ├── IntentionFeed.tsx
│   │   └── IntentionCard.tsx
│   ├── journal/
│   │   ├── JournalEntry.tsx
│   │   └── DonationPrompt.tsx
│   └── ui/                  # Componentes genéricos reutilizables
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Typography.tsx
│       └── Screen.tsx
├── hooks/
│   ├── useGospel.ts
│   ├── useLiturgy.ts        # Tiempo litúrgico, colores, textos
│   ├── useStreak.ts
│   ├── useJournal.ts
│   └── useNotifications.ts
├── stores/
│   ├── userStore.ts
│   ├── liturgyStore.ts      # Tiempo litúrgico actual (persiste en MMKV)
│   └── settingsStore.ts
├── lib/
│   ├── crypto.ts            # Cifrado del diario
│   ├── liturgicalCalendar.ts  # Cálculo del tiempo litúrgico
│   ├── shareCard.ts         # Generación de tarjeta visual para compartir
│   └── notifications.ts
├── constants/
│   ├── liturgicalColors.ts  # Paleta por tiempo litúrgico
│   └── typography.ts
└── assets/
    └── fonts/               # Lora (Regular, Italic, SemiBold)
```

---

## Convenciones de código

### TypeScript

```typescript
// ✅ Interfaces para formas de objetos
interface GospelEntry {
  date: string          // ISO 8601: '2025-05-15'
  reference: string     // 'Juan 15, 1-8'
  text: string
  patristicComment: PatristicComment | null
}

interface PatristicComment {
  author: string        // 'San Agustín de Hipona'
  century: string       // 'Siglo IV'
  text: string
}

// ✅ Types para uniones y utilidades
type LiturgicalSeason =
  | 'ordinary'
  | 'advent'
  | 'christmas'
  | 'lent'
  | 'holy-week'
  | 'easter'
  | 'martyrs'

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ❌ Nunca
const doSomething = (data: any) => { ... }
const user = response as User
```

### Naming

```typescript
// Componentes: PascalCase
export function GospelCard({ gospel }: GospelCardProps) { ... }

// Hooks: camelCase con prefijo 'use'
export function useGospel(date: string) { ... }

// Stores: camelCase con sufijo 'Store'
export const liturgyStore = create<LiturgyStore>(...)

// Constantes: SCREAMING_SNAKE_CASE
export const MAX_JOURNAL_FREE_ENTRIES = 30
export const STREAK_GRACE_DAYS_PER_WEEK = 1

// Archivos: kebab-case para utilidades, PascalCase para componentes
// gospel-card.tsx ❌ — GospelCard.tsx ✅
// LiturgicalCalendar.ts ❌ — liturgicalCalendar.ts ✅ (utilidad, no componente)
```

### Componentes React Native

```typescript
// ✅ Siempre tipar las props con interface
interface StreakFlameProps {
  count: number
  isActiveToday: boolean
  onPress?: () => void
}

// ✅ Exportación nombrada (no default) para facilitar refactoring
export function StreakFlame({ count, isActiveToday, onPress }: StreakFlameProps) {
  return (
    <Pressable onPress={onPress} className="items-center gap-1">
      <FlameIcon
        size={28}
        color={isActiveToday ? liturgicalColor.accent : colors.muted}
      />
      <Text className="font-inter-medium text-xs text-muted">
        {count} días de camino
      </Text>
    </Pressable>
  )
}

// ❌ No usar StyleSheet.create — NativeWind cubre todos los casos
// ❌ No usar inline styles salvo para valores dinámicos que Tailwind no puede expresar
// ❌ No usar default exports en componentes
```

### Manejo de errores

```typescript
// ✅ Errores explícitos, nunca silenciosos
async function fetchGospel(date: string): Promise<ApiResponse<GospelEntry>> {
  try {
    const response = await api.get(`/gospel/${date}`)
    return { success: true, data: response.data }
  } catch (error) {
    // Log a Sentry en producción
    if (__DEV__) console.error('[fetchGospel]', error)
    return { success: false, error: 'No se pudo cargar el Evangelio.' }
  }
}

// ✅ En componentes, manejar el estado de error explícitamente
const { data, isLoading, isError } = useGospel(today)

if (isError) return <GospelErrorState />    // Componente dedicado, no inline
if (isLoading) return <GospelSkeleton />    // Skeleton, nunca spinner genérico
```

### Fechas litúrgicas

```typescript
// ✅ Siempre usar formato ISO 8601 para fechas
// ✅ Siempre calcular el tiempo litúrgico en el servidor (fuente de verdad)
// El cliente recibe el tiempo litúrgico del servidor; no lo calcula solo

// types/liturgy.ts
interface DailyLiturgy {
  date: string                      // '2025-05-15'
  season: LiturgicalSeason
  gospelRef: string                 // 'Juan 15, 1-8'
  saintName: string
  saintFeastType: 'solemnity' | 'feast' | 'memorial' | 'optional-memorial'
  roseDay: boolean                  // Domingo de Gaudete o Laetare
}
```

---

## Base de datos — esquema principal (Drizzle)

```typescript
// packages/db/schema.ts

import { pgTable, text, timestamp, integer, boolean, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  donatedAt: timestamp('donated_at'),  // null = no donó todavía
})

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  gospelDate: text('gospel_date').notNull(),   // '2025-05-15'
  // IMPORTANTE: content es el texto CIFRADO en cliente. El servidor no lo lee.
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const streaks = pgTable('streaks', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  currentCount: integer('current_count').default(0).notNull(),
  lastActiveDate: text('last_active_date'),    // '2025-05-15'
  graceDaysUsedThisWeek: integer('grace_days_used').default(0).notNull(),
  longestCount: integer('longest_count').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const prayerIntentions = pgTable('prayer_intentions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  text: text('text').notNull(),               // max 200 chars (validado en API)
  prayerCount: integer('prayer_count').default(0).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),  // createdAt + 7 días
})

export const prayerResponses = pgTable('prayer_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  intentionId: uuid('intention_id').references(() => prayerIntentions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
// Constraint único: un usuario solo puede rezar una vez por intención
// Manejado con unique index en (intentionId, userId)
```

---

## API — endpoints principales (Hono)

```typescript
// packages/api/src/routes/gospel.ts

// GET /gospel/today
// GET /gospel/:date  (formato YYYY-MM-DD)
// Respuesta: GospelEntry completo con comentario patrístico

// packages/api/src/routes/liturgy.ts
// GET /liturgy/today  — DailyLiturgy completa (season, saint, colors, etc.)
// GET /liturgy/month/:year/:month  — Calendario mensual

// packages/api/src/routes/journal.ts  (requieren auth)
// GET    /journal             — Lista de entradas del usuario (sin contenido, solo metadata)
// POST   /journal             — Crear entrada (body: { gospelDate, content: encrypted })
// PATCH  /journal/:id         — Editar entrada (solo si < 24h)
// DELETE /journal/:id
// GET    /journal/count       — Cantidad de entradas (para gatillar donación en cliente)

// packages/api/src/routes/intentions.ts
// GET  /intentions            — Feed paginado, ordenado por prayerCount ASC, createdAt DESC
// POST /intentions            — Crear intención (auth requerido)
// POST /intentions/:id/pray   — Rezar por intención (auth requerido, idempotente)
// POST /intentions/:id/report — Reportar intención

// packages/api/src/routes/streak.ts  (requieren auth)
// POST /streak/check-in       — Registrar que el usuario oró hoy
// GET  /streak                — Estado actual del streak
```

---

## Reglas de desarrollo

### Git
```
Branches:
  main          → producción (protegida, requiere PR)
  dev           → integración
  feat/nombre   → features nuevas
  fix/nombre    → bugfixes
  content/nombre → actualizaciones de contenido litúrgico

Commits (Conventional Commits):
  feat: agrega pantalla de Laudes guiadas
  fix: corrige cálculo de racha en cambio de año litúrgico
  content: actualiza comentarios patrísticos de Cuaresma 2026
  refactor: extrae lógica de cifrado a lib/crypto
  chore: actualiza dependencias de Expo SDK 51

Nunca:
  - Commitear secrets o keys (usar Doppler)
  - Commitear directamente a main
  - PRs sin descripción de qué cambia y por qué
```

### Testing
```
Unit tests:     Vitest (para lógica pura: liturgicalCalendar, crypto, formatters)
Component tests: No en MVP. Testing manual en dispositivos.
E2E:            No en MVP.

Qué SIEMPRE tiene tests unitarios:
  - lib/liturgicalCalendar.ts (cálculos de fechas litúrgicas son complejos)
  - lib/crypto.ts (cifrado/descifrado del diario)
  - Cálculo de racha y día de gracia (lógica delicada)
```

### Variables de entorno
```bash
# apps/mobile/.env.local
EXPO_PUBLIC_API_URL=https://api.camino.app
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_POSTHOG_KEY=

# packages/api/.env
DATABASE_URL=
SUPABASE_SERVICE_KEY=
REDIS_URL=
SENTRY_DSN=
STRIPE_SECRET_KEY=       # Para donaciones
MERCADOPAGO_ACCESS_TOKEN= # Para Latinoamérica
```

### Checklist antes de cada PR
- [ ] TypeScript compila sin errores (`pnpm typecheck`)
- [ ] ESLint sin warnings (`pnpm lint`)
- [ ] Tests unitarios pasan (`pnpm test`)
- [ ] Probado en simulador iOS Y Android
- [ ] Probado en modo offline (Airplane mode)
- [ ] No hay `console.log` sin condición `__DEV__`
- [ ] No hay `any` nuevo introducido
- [ ] El contenido del diario nunca aparece en logs

---

## Decisiones técnicas relevantes (ADR breve)

### ADR-01: Por qué cifrado en cliente para el diario
El diario espiritual contiene reflexiones íntimas de fe. Si el servidor fuera comprometido, o si hubiera un requerimiento legal de acceso, el contenido no debe ser legible. El cifrado en cliente (con clave derivada del token de autenticación del usuario) garantiza que solo el usuario puede leer sus propias reflexiones. El trade-off es que si el usuario pierde el acceso a su cuenta, las entradas no son recuperables — esto se comunica claramente en el onboarding.

### ADR-02: Por qué no usar Firebase
La privacidad del diario requiere Row Level Security a nivel de base de datos. Firestore no la tiene de forma nativa y su modelo de seguridad basado en reglas es más difícil de auditar. PostgreSQL con Supabase RLS es transparente y verificable.

### ADR-03: Por qué Hono y no Next.js API Routes
El backend de Camino es un servicio independiente que puede escalar separado del frontend. En el futuro puede correr en el edge. Next.js API Routes acoplan el frontend al backend y agregan overhead innecesario para una API pura.

### ADR-04: Cálculo del tiempo litúrgico
El tiempo litúrgico se calcula en el servidor con un algoritmo propio basado en las reglas del Ordo Romano Universal. El cliente recibe la información del servidor y nunca la calcula solo. Esto garantiza consistencia entre todos los usuarios y facilita actualizaciones del calendario (ej: nuevas fiestas proclamadas por el Papa).
