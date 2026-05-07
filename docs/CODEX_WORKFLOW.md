# CODEX_WORKFLOW.md

Guia practica para trabajar con Codex en Camino sin perder foco ni mezclar conceptos del producto.

## Como pedir cambios a Codex

Pedir tareas acotadas, con archivos o areas claras cuando sea posible.

Buen formato:

```text
Quiero cambiar [area].
Objetivo: [resultado esperado].
No hacer: [fuera de scope].
Validar con: pnpm.cmd -r typecheck y pnpm.cmd -r lint.
No usar Git.
```

Cuando el cambio toque contratos entre backend y mobile, pedir explicitamente:

```text
Actualizar tipos compartidos, backend y mobile para que el contrato quede consistente.
```

Cuando el cambio sea visual, incluir la intencion estetica:

```text
Mantener el estilo de docs/AESTHETIC.md: sobrio, liturgico, sin gamificacion ni decoracion innecesaria.
```

## Como validar

Validacion base:

```powershell
.\scripts\dev\check.ps1
```

Equivalente manual:

```powershell
pnpm.cmd -r typecheck
pnpm.cmd -r lint
```

Backend en puerto de prueba:

```powershell
.\scripts\dev\dev-backend-3101.ps1
```

Prueba rapida de API:

```powershell
.\scripts\dev\test-api.ps1
```

Seed de santos:

```powershell
.\scripts\dev\seed.ps1
```

Notas:

- `test-api.ps1` usa `http://localhost:3101` por defecto.
- Para probar otra URL, setear `CAMINO_API_URL`.
- `seed.ps1` requiere `DATABASE_URL` en `.env`.

## Que no pedir todavia

No pedir por ahora:

- Calendario liturgico mensual completo.
- Features nuevas de comunidad, donaciones, share cards, Rosario o notificaciones si no son el foco del sprint.
- Redisenos visuales globales.
- Cambios de stack o dependencias grandes.
- Automatizaciones de Git.
- Contenido liturgico definitivo con licencia no verificada.

## Prompts utiles

### UI

```text
Mejorar esta pantalla manteniendo docs/AESTHETIC.md.
No agregar features nuevas.
Conservar la jerarquia actual.
Validar con pnpm.cmd -r typecheck y pnpm.cmd -r lint.
No usar Git.
```

### Backend

```text
Actualizar el endpoint [endpoint] para devolver [contrato].
Mantener tipos compartidos en packages/shared.
Actualizar consumidores mobile si corresponde.
No cambiar otros endpoints.
Validar con pnpm.cmd -r typecheck y pnpm.cmd -r lint.
No usar Git.
```

### Breviario

```text
Revisar el flujo del Breviario.
Separar hora, fecha, fuente y secciones.
No hardcodear oraciones si el backend puede obtenerlas.
Probar /api/breviary/today y /api/breviary/2026-05-06/compline.
No tocar Santo del dia ni calendario mensual.
No usar Git.
```

### Santo del dia

```text
Revisar Santo del dia sin mezclarlo con Liturgia del dia.
Si hay santo real: hasSaintOfDay true y saintOfDay completo.
Si no hay santo real: hasSaintOfDay false y usar liturgicalDayName o celebrationName.
No mostrar Feria como santo.
No implementar calendario mensual.
Validar typecheck y lint.
No usar Git.
```

### Diagnostico

```text
Diagnosticar este problema sin implementar features nuevas.
Primero explicar donde esta el fallo.
Si hay una correccion pequena y clara, aplicarla.
Validar con los comandos del repo.
No usar Git.
```

## Reglas permanentes

- Codex no debe usar Git en este proyecto.
- Codex no debe ampliar scope sin pedido explicito.
- Los cambios deben respetar `AGENTS.md`.
- Las validaciones finales son obligatorias para cambios de codigo.
- Si una prueba necesita red o base de datos y falla por entorno, Codex debe decirlo concretamente.
