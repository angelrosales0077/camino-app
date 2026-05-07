# Camino App — Architected Monorepo

**Monorepo para Camino: Oración diaria para católicos hispanohablantes**

## Estructura

```
camino/
├── apps/
│   └── mobile/               Expo app (React Native + TypeScript)
├── packages/
│   ├── api/                  Hono backend (Node.js edge-ready)
│   ├── db/                   Drizzle ORM schema & types
│   ├── shared/               Shared types & utilities
│   └── content/              Liturgy scrapers & content pipeline
├── tooling/
│   ├── tsconfig/             Shared TypeScript configurations
│   └── eslint/               Shared ESLint configurations
├── pnpm-workspace.yaml       pnpm monorepo config
├── turbo.json                Turborepo task orchestration
└── package.json              Root workspace config
```

## Setup

### Prerequisites
- Node.js 20+
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# Verify TypeScript strict mode
pnpm typecheck

# Build all packages
pnpm build
```

## Database Schema

Defined in `packages/db/src/schema.ts` using Drizzle ORM:

### Core Tables

- **users**: User accounts + authentication metadata
- **journal_entries**: Encrypted spiritual diary entries (AES-256 client-side)
- **streaks**: Prayer streak tracking with weekly grace days
- **prayer_intentions**: Community prayer requests (7-day ephemeral)
- **prayer_responses**: Many-to-many link (user → intention)

### Type Safety

All database types are inferred from schema using Drizzle's `InferSelectModel`:

```typescript
import { User, JournalEntry, Streak, PrayerIntention } from '@camino/db'

// These are fully typed, no `any` used
const user: User = { id: '...', email: '...', ... }
```

## Workspaces

### @camino/db
**Drizzle ORM schema, migrations, types**

```bash
# Generate migration files
pnpm -F @camino/db run generate

# Push to database
pnpm -F @camino/db run push

# Inspect database with Drizzle Studio
pnpm -F @camino/db run studio
```

### @camino/api
**Hono backend API**

- All endpoints require TypeScript strict mode
- Uses database types from `@camino/db`
- Encryption/decryption logic in `lib/crypto.ts`

### @camino/mobile
**Expo React Native app**

- File-based routing via Expo Router
- Styling with NativeWind
- State management: Zustand (global) + React Query (server)

### @camino/shared
**Shared types and utilities**

- API response/request types
- Domain models (Liturgy, Gospel, etc.)
- DB types imported from `@camino/db` (not re-exported to avoid circular deps)

### @camino/content
**Liturgy content scraping & curation**

- Web scrapers for `liturgiadelashoras.com.ar`
- Content normalization pipelines
- Triggered by Trigger.dev

## Type Safety Policy

**Zero use of `any`**

- All database types are inferred from Drizzle schema
- API responses are typed with `ApiResponse<T>`
- No `as unknown as X` type casting
- Use `satisfies` when needed for inference

## Scripts

```bash
# Development
pnpm dev                 # Run all apps in parallel (hot reload)
pnpm typecheck          # TypeScript strict mode check
pnpm lint               # ESLint all packages
pnpm test               # Run unit tests (Vitest)

# Building
pnpm build              # Production build all packages

# Specific workspace
pnpm -F @camino/db run push    # Run task in specific workspace
```

## Environment Variables

See `.env.example`. Key variables:

- `DATABASE_URL`: PostgreSQL connection string (Supabase)
- `REDIS_URL`: Redis cache URL (Upstash)
- `SENTRY_DSN`: Error tracking
- `NODE_ENV`: development | production

## Architecture Decisions

See `C/adr.md` for detailed Architecture Decision Records:

- **Offline-first**: Content downloaded and cached locally
- **Client-side encryption**: Diary entries encrypted before sending to server
- **No NorthStar ranking**: Prayer intention feed prioritizes least-prayed-for
- **Grace days**: Weekly tolerance for missed prayer days
- **Litteral liturgical time**: Colors and seasons adapt to Catholic calendar

## Contributing

1. Create feature branch: `git checkout -b feat/feature-name`
2. TypeScript strict mode is enforced
3. Run `pnpm typecheck` before committing
4. Follow Conventional Commits: `feat:`, `fix:`, `refactor:`

## License

Proprietary (Camino App)
