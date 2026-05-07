# Deploy Backend en Railway

Problema corregido:

- Railway intenta arrancar con `node dist/index.js`
- `apps/backend/dist/index.js` debe existir antes de ejecutar `start`
- el backend importa paquetes internos del monorepo, por lo que esos paquetes deben compilarse tambien

Este repo es un monorepo pnpm. El backend (`@camino/backend`) es TypeScript y se despliega desde la raiz del repo para que Railway tenga acceso al lockfile, `pnpm-workspace.yaml` y los paquetes internos.

## Railway settings

Usar solo el servicio `@camino/backend`.

- Root Directory: repo root (`/` o vacio, no `apps/backend`)
- Build Command: dejar vacio para usar `nixpacks.toml`, o usar `pnpm --filter @camino/backend build`
- Start Command: dejar vacio para usar `nixpacks.toml`, o usar `pnpm --filter @camino/backend start`
- Port: Railway debe usar la variable `PORT`; el backend hace fallback local a `3100`

## nixpacks.toml

Este repo incluye `nixpacks.toml` en la raiz para que Railway:

1. Instale dependencias con pnpm, incluyendo devDependencies necesarias para `tsc`.
2. Compile `@camino/backend` y sus dependencias de workspace.
3. Arranque con `pnpm --filter @camino/backend start`, que ejecuta `node dist/index.js`.

## Variables requeridas

Railway debe tener variables de entorno para el backend:

- `DATABASE_URL=...` (PostgreSQL/Supabase)
- `SUPABASE_URL=...` (si aplica)
- `SUPABASE_ANON_KEY=...` (si aplica)
- `SUPABASE_SERVICE_KEY=...` (si el backend valida auth contra Supabase)

No configurar `PORT` manualmente salvo que Railway lo pida: Railway lo inyecta automaticamente.

## Smoke check

Una vez deployado:

- `GET /health` debe responder 200
- `GET /api/liturgy/today` debe responder 200 con `success: true`
