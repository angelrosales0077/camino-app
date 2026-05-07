# AGENTS.md - Camino

Reglas estables para trabajar con Codex en este repositorio. Este archivo tiene prioridad como memoria de proyecto para cambios futuros.

## Contexto del producto

Camino es una app movil para catolicos hispanohablantes que centraliza la oracion diaria: Evangelio, Liturgia de las Horas, Santo del dia, diario espiritual, racha sobria e intenciones comunitarias.

El producto debe sentirse como una herramienta de recogimiento, no como una red social, una app de meditacion generica, una app de gamificacion ni una pagina parroquial antigua.

## Stack

- Monorepo con pnpm workspaces y Turbo.
- Mobile: Expo, React Native, Expo Router, TypeScript, React Query, Zustand.
- Backend: Node.js, Hono, TypeScript.
- DB: PostgreSQL/Supabase, Drizzle ORM.
- Paquetes compartidos: `packages/shared`, `packages/db`, `packages/content`.
- Backend principal actual: `apps/backend`.
- App movil actual: `apps/mobile`.

## Estetica

La estetica estable esta en `docs/AESTHETIC.md`.

Reglas resumidas:

- Usar Lora para lectura y textos espirituales; Inter para UI y metadata.
- Mantener una atmosfera silenciosa, sobria y liturgica.
- Usar paleta base marfil/calida y acentos por tiempo liturgico.
- Evitar gradientes llamativos, ilustraciones flat genericas, sombras pesadas, confeti, premios, lenguaje ansioso y gamificacion visible.
- La identidad catolica viene del contenido, del tono y del color liturgico, no de iconografia kitsch.
- No agregar UI decorativa sin funcion clara.

## Reglas de trabajo

- No usar Git: no `git add`, no `git commit`, no branches, no reset, no checkout.
- No agregar features nuevas sin pedido explicito.
- No ampliar scope por iniciativa propia.
- No implementar calendario liturgico mensual hasta que se pida expresamente.
- Preferir cambios pequenos, revisables y alineados con patrones existentes.
- No introducir dependencias nuevas sin necesidad clara.
- No tocar secrets ni imprimir credenciales.
- Si hay cambios no relacionados en el worktree, dejarlos intactos.

## Validaciones obligatorias

Al final de cambios de codigo o contratos, correr:

```powershell
pnpm.cmd -r typecheck
pnpm.cmd -r lint
```

Tambien se puede usar:

```powershell
.\scripts\dev\check.ps1
```

Si una validacion no se puede correr, explicar la razon concreta.

## Breviario

- El Breviario se sirve desde `/api/breviary`.
- Las horas validas son: `office-of-readings`, `lauds`, `terce`, `sext`, `none`, `vespers`, `compline`.
- La app no debe depender de texto hardcodeado para oraciones si el backend puede obtenerlas.
- Mantener fuente, fecha, hora y secciones separadas.
- No mezclar el Breviario con Evangelio, Liturgia del dia o Santo del dia.
- Si se prueba manualmente, usar:

```powershell
.\scripts\dev\dev-backend-3101.ps1
.\scripts\dev\test-api.ps1
```

## Liturgia del dia y Santo del dia

Hay tres conceptos separados:

- Liturgia del dia: fecha, nombre liturgico, tiempo, semana, salterio, color.
- Santo del dia: santo/beato/memoria/solemnidad concreta, nombre en espanol, bio, cita, tipo de celebracion, fuente y `needsReview`.
- Calendario liturgico mensual: vista futura, no implementar sin pedido explicito.

Reglas:

- No usar `Feria` como si fuera santo.
- No mostrar nombres en ingles si hay traduccion curada o mapeada.
- Si hay santo real, `hasSaintOfDay` debe ser `true` y `saintOfDay` debe estar lleno.
- Si no hay santo real, `hasSaintOfDay` debe ser `false` y se debe usar `liturgicalDayName` o `celebrationName`.
- Si el dato no esta curado, mantener `needsReview: true`.

## Prompts y documentos

Antes de cambios grandes, revisar:

- `docs/PRD.md`
- `docs/CONTEXT.md`
- `docs/AESTHETIC.md`
- `docs/CODEX_WORKFLOW.md`

Cuando el usuario pida una tarea, responder con implementacion y validacion. No convertir pedidos acotados en redisenos completos.
