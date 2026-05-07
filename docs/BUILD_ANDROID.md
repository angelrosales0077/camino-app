# Build Android (EAS)

Objetivo: generar un APK instalable (beta familiar) con EAS Build, sin depender de `localhost` ni `adb reverse`.

Repositorio: `E:\CAMINO APP\camino`

## Requisitos

- Node.js y pnpm instalados.
- Cuenta de Expo/EAS.
- Backend publico disponible (ver "Backend Publico").

## Instalacion de EAS CLI

```powershell
npm install -g eas-cli
```

Login:

```powershell
eas login
```

## Variables de entorno (critico para APK)

En builds Android (APK/AAB) el runtime NO puede depender de:

- `localhost`
- `127.0.0.1`
- `adb reverse`
- tu PC prendida

Para que el APK funcione fuera de tu computadora, seteá:

- `EXPO_PUBLIC_API_URL=https://URL_PUBLICA_DEL_BACKEND/api`
- `EXPO_PUBLIC_SUPABASE_URL=https://mqcfpvrnltncqyymbqho.supabase.co`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY=...`

Nota: `EXPO_PUBLIC_*` queda embebido en el bundle del cliente, asi que no pongas secretos privados ahi.

El dev local sigue usando `apps/mobile/.env` (por ejemplo `http://127.0.0.1:3100`).

### Como setear variables para EAS Build

Opcion A (recomendada): EAS Secrets

```powershell
cd "E:\CAMINO APP\camino\apps\mobile"
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://URL_PUBLICA_DEL_BACKEND/api"
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://mqcfpvrnltncqyymbqho.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "REEMPLAZAR"
```

Opcion B: variables en el panel de Expo (proyecto) para el perfil correspondiente.

## Configuracion EAS

Entrar al mobile:

```powershell
cd "E:\CAMINO APP\camino\apps\mobile"
```

Si es la primera vez en este repo/proyecto:

```powershell
eas build:configure
```

Esto crea/asocia el proyecto EAS y completa metadata (por ejemplo `extra.eas.projectId`).

## Generar APK (preview)

```powershell
cd "E:\CAMINO APP\camino\apps\mobile"
eas build -p android --profile preview
```

Al terminar, EAS te da un link para descargar el APK.

## Instalar el APK en Android

1. Descargar el APK en el telefono (o pasarlo por Drive/WhatsApp/USB).
2. Habilitar "Instalar apps desconocidas" para el gestor de archivos/navegador.
3. Abrir el APK e instalar.

## Build para Play Store (AAB production)

```powershell
cd "E:\CAMINO APP\camino\apps\mobile"
eas build -p android --profile production
```

## Backend Publico

Antes de compartir el APK, el backend tiene que estar deployado y accesible via HTTPS publico.

El APK debe apuntar a:

`EXPO_PUBLIC_API_URL=https://URL_PUBLICA_DEL_BACKEND/api`

Si el backend no esta deployado, la app va a fallar fuera de la red local.

## Deuda tecnica (assets)

Si faltan icon/splash definitivos, mantener configuracion minima y despues agregar assets consistentes (icon, adaptive icon, splash) para una beta mas prolija.

