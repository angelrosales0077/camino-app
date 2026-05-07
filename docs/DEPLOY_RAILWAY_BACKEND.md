# Deploy Backend en Railway

Problema tipico:

- Railway intenta arrancar con `node dist/index.js`
- pero `apps/backend/dist/index.js` no existe porque nunca corrio el build

Este repo es un monorepo pnpm. El backend (`@camino/backend`) es TypeScript y necesita `tsc` antes de `start`.

## Opcion A: nixpacks.toml (recomendado)

Este repo incluye `nixpacks.toml` en la raiz para que Railway:

1. Instale deps con pnpm
2. Buildee `@camino/backend` y sus dependencias de workspace
3. Arranque con `pnpm --filter @camino/backend start` (que ejecuta `node dist/index.js`)

Con esto, el error `Cannot find module .../dist/index.js` deja de ocurrir.

## Opcion B: configurar Build/Start command en Railway (UI)

En Railway -> Service -> Settings:

Build Command:

```bash
pnpm install --frozen-lockfile && pnpm -r --filter @camino/backend... build
```

Start Command:

```bash
pnpm --filter @camino/backend start
```

## Variables requeridas

Railway debe tener variables de entorno para el backend, como minimo:

- `DATABASE_URL=...` (PostgreSQL/Supabase)
- `SUPABASE_URL=...` (si aplica)
- `SUPABASE_ANON_KEY=...` (si aplica)
- `SUPABASE_SERVICE_KEY=...` (si el backend valida auth contra Supabase)
- `PORT` (Railway lo setea; el backend usa `process.env.PORT`)

No subir `.env` al repo. Configurar esto en Railway.

## Smoke check

Una vez deployado:

- `GET /health` debe responder 200

