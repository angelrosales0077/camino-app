# PRD — Camino App
**Product Requirements Document · v1.0**
_Última actualización: mayo 2025_

---

## 1. Visión del producto

**Camino** es una app móvil para católicos practicantes hispanohablantes que centraliza los momentos de oración diaria en una experiencia simple, bella y respetuosa del tiempo del usuario. No es una app de contenido religioso genérico: es un compañero espiritual para quien ya reza y quiere hacerlo con más constancia y profundidad.

### Problema que resuelve
Los católicos practicantes tienen la voluntad de orar diariamente pero carecen de una herramienta en español que combine la liturgia oficial (Evangelio, Laudes), reflexión personal y comunidad sin la frivolidad de redes sociales ni la barrera técnica de apps pensadas para sacerdotes.

### Propuesta de valor central
> "Todo lo que necesitás para tu oración diaria, en un solo lugar, en español, sin distracciones."

---

## 2. Usuario objetivo

### Perfil primario
- Católico practicante, 20–45 años, hispanohablante (foco inicial: Argentina, México, Colombia, España)
- Va a misa regularmente o quiere volver a hacerlo
- Tiene hábitos digitales modernos (usa Instagram, WhatsApp, Spotify)
- Reza o quiere rezar pero no sabe estructurarlo solo
- Tiene entre 5 y 20 minutos disponibles por la mañana para oración

### Perfil secundario
- Grupos de jóvenes católicos, movimientos (Schoenstatt, Neocatecumenal, Comunión y Liberación)
- Madres de familia que quieren una app para la oración familiar
- Seminaristas y religiosos jóvenes

### Lo que NO es nuestro usuario (por ahora)
- Sacerdotes que necesitan breviario oficial completo → iBreviary
- Angloparlantes → Hallow
- Niños → Catholic Sprouts

---

## 3. Objetivos del MVP

| Objetivo | Métrica de éxito | Plazo |
|---|---|---|
| Retención diaria | DAU/MAU ≥ 40% a los 30 días | 3 meses post-lanzamiento |
| Streak promedio | ≥ 7 días en usuarios activos | 2 meses post-lanzamiento |
| Comunidad | ≥ 30% de usuarios publica o interactúa con intenciones | 2 meses |
| Monetización | ≥ 5% de usuarios con +30 entradas realiza donación | 4 meses |
| NPS espiritual | Score ≥ 60 en encuesta post-uso | 1 mes |

---

## 4. Funcionalidades del MVP

### Sprint 1 — Núcleo litúrgico diario
Estas features son el corazón de la app. Sin ellas no hay producto.

#### F-01: Evangelio del día con contexto patrístico
**Descripción:** Muestra la lectura del Evangelio del día según el calendario litúrgico romano. Incluye 2–3 líneas de comentario de un Padre de la Iglesia o santo reconocido (extraído de fuente canónica).
**Comportamiento:**
- Se actualiza automáticamente a medianoche (hora local del usuario)
- Versión en español (Biblia de Jerusalén como fuente primaria)
- Texto del Evangelio completo, sin truncar
- Comentario patrístico etiquetado con nombre del autor y siglo
- Botón "Compartir como tarjeta" (ver F-08)
**Edge cases:**
- Sin conexión → muestra el último evangelio descargado con aviso claro
- Domingos → prioriza el Evangelio de la misa (no el ferial).


#### F-02: Laudes simplificadas (Liturgia de las Horas)
**Descripción:** La Liturgia de las Horas de la mañana en formato guiado y accesible, no litúrgico estricto sino adaptado para laicos.
**Comportamiento:**
- Modo guiado: cada elemento aparece secuencialmente (Invitatorio → Himno → Salmos → Lectura breve → Benedictus → Preces → Padre Nuestro → Oración conclusiva)
- Versión completa (~12 min) y versión corta (~4 min, solo salmo + Benedictus + oración)
- Los textos cambian según el día litúrgico (tiempo ordinario, Adviento, Cuaresma, Pascua)
- Tiempo litúrgico visible en el color de fondo del header (ver F-07)
**Edge cases:**
- El usuario puede pausar y retomar sin perder el punto donde estaba
- En Semana Santa muestra textos propios del Triduo

#### F-03: Santo del día
**Descripción:** Breve tarjeta del santo o beato del calendario litúrgico del día.
**Comportamiento:**
- Nombre, fechas de vida y muerte, una línea de contexto histórico
- Una cita o frase atribuida al santo (cuando existe)
- La cita del santo funciona como "intención del día" sugerida

#### F-07: Tiempo litúrgico visible
**Descripción:** La interfaz adapta su color principal al tiempo litúrgico actual.
**Paleta por tiempo:**
- Adviento → morado oscuro `#4A2C6B`
- Navidad → dorado cálido `#B8860B` con blancos
- Cuaresma → morado más vivo `#6B2D8B`
- Semana Santa → burdeos `#7B1A2A`
- Pascua → blanco y dorado `#F5F0E8` / `#C9A84C`
- Tiempo ordinario → verde profundo `#2D5A3D`
- Solemnidades → dorado / blanco
**Comportamiento:** El color se aplica al header, a los acentos de botones y al fondo suave del home. No es un tema oscuro/claro: es una capa de color litúrgico sobre el tema base.

---

### Sprint 2 — Retención y engagement personal

#### F-04: Diario espiritual personal
**Descripción:** Campo de texto libre para anotaciones post-lectura. Privado, cifrado en tránsito, vinculado a la cuenta del usuario.
**Comportamiento:**
- Se abre desde el Evangelio con un prompt sugerido del día ("¿Qué te llamó la atención hoy?")
- También accesible desde home como "Mi diario"
- Las entradas se guardan con fecha y evangelio del día asociado
- Vista de historial en scroll vertical, ordenada cronológicamente
- **Límite gratuito: 30 entradas.** Al llegar a la entrada 31, se muestra el flujo de donación (ver sección Monetización)
- No hay fotos, no hay formato rico: solo texto plano con fecha
**Edge cases:**
- El usuario puede editar una entrada hasta 24h después de crearla
- Borrar una entrada no recupera el cupo (evita abuso del límite)

#### F-05: Racha de camino con gracia
**Descripción:** Contador de días consecutivos de oración completada, con mecánica de gracia semanal.
**Comportamiento:**
- Un día se considera "completado" si el usuario abrió el Evangelio del día Y pasó al menos 60 segundos en la app en ese día
- La racha se llama "días de camino", no "racha" ni "streak"
- Una vez por semana calendario (no por semana de uso) el usuario puede no ingresar sin romper su contador. Este día se llama "día de misericordia"
- Cuando se usa el día de misericordia, la app muestra una pantalla breve: "Hoy descansaste. El descanso también es oración." con referencia bíblica (Sal 23)
- Hitos celebrados silenciosamente: 7 días (primera semana), 40 días (referencia al desierto bíblico), 100 días, 365 días. Cada hito tiene un mensaje corto y distinto.
- El contador es visible en el home como número + icono de llama (apagada si no hizo nada hoy)

#### F-06: Notificaciones litúrgicas inteligentes
**Descripción:** Sistema de notificaciones push con horarios configurables y lenguaje pastoral.
**Notificaciones predefinidas:**
- Mañana (configurable, default 7:00 am): "El Evangelio de hoy te espera. Buenos días." + nombre del santo
- Ángelus (12:00 pm, opcional): "Ángelus. Un momento de silencio."
- Cierre (configurable, default 9:00 pm): "¿Terminaste tu día con oración?"
**Comportamiento:**
- El usuario puede activar/desactivar cada notificación independientemente
- Opción de silenciar domingos (para quienes van a misa y no quieren recordatorio)
- Si el usuario ya abrió la app ese día, la notificación de mañana no se envía
- Los textos de las notificaciones rotan (banco de 20 variantes por tipo) para no volverse mecánicos

#### F-08: Compartir reflexión como tarjeta visual
**Descripción:** Genera una imagen lista para compartir en WhatsApp o Instagram Stories.
**Comportamiento:**
- El botón "Compartir" aparece en la pantalla del Evangelio y en la del Santo del día
- La imagen generada contiene: cita central del Evangelio (la más breve e impactante, pre-seleccionada del backend), color de fondo litúrgico del día, nombre del santo, nombre de la app en esquina inferior derecha en tipografía pequeña
- La imagen NUNCA incluye el contenido del diario personal
- Formatos: cuadrado 1080×1080 (feed) y vertical 1080×1920 (stories), el usuario elige
- Generada en el cliente (canvas API) sin round-trip al servidor
**Edge cases:**
- Si el Evangelio del día no tiene cita corta disponible, usa la primera oración del texto

---

### Sprint 3 — Comunidad

#### F-09: Intenciones de oración comunitaria
**Descripción:** Feed donde los usuarios publican intenciones de oración y otros responden "Estoy rezando por esto".
**Comportamiento:**
- Cualquier usuario puede publicar una intención (texto libre, máximo 200 caracteres)
- Opción de publicar con nombre o de forma anónima
- Respuesta única: botón "Rezar por esta intención" (icono de manos juntas). Sin comentarios, sin likes, sin corazones.
- **Algoritmo del feed: se muestran primero las intenciones con MENOS respuestas, luego por antigüedad (más recientes primero dentro del mismo nivel de respuestas).** Esto diferencia la app de toda la competencia que prioriza lo popular.
- Las intenciones se archivan automáticamente a los 7 días o cuando superan 50 respuestas
- Moderación: reporte con un toque → revisión manual en 24h
- No hay perfiles públicos ni forma de seguir a alguien
**Edge cases:**
- Intenciones reportadas se ocultan hasta revisión (no se eliminan de inmediato)
- El usuario no puede ver quiénes rezaron por su intención (solo el número)
- Límite: 3 intenciones activas por usuario al mismo tiempo

---

### Sprint 4 — Contenido complementario

#### F-10: Rosario interactivo
**Descripción:** Guía paso a paso para rezar el Rosario completo con los misterios del día automáticos.
**Comportamiento:**
- Los misterios se asignan por día de la semana según la tradición católica (Gozosos lunes y sábado, Luminosos jueves, Dolorosos martes y viernes, Gloriosos miércoles y domingo)
- Interfaz de decenas: el usuario avanza manualmente toque a toque
- Oración de cada decena mostrada en pantalla mientras avanza
- Sin audio en MVP (audio en v2)
- Opción de rezar un solo misterio (misterio del día solamente)

#### F-11: Calendario litúrgico
**Descripción:** Vista mensual del año litúrgico con fiestas, solemnidades y períodos.
**Comportamiento:**
- Muestra fiestas de obligación, solemnidades, memorias obligatorias y libres
- Color codificado por categoría (blanco, rojo, morado, verde, rosa)
- Al tocar un día, muestra el santo y la categoría litúrgica
- No muestra misas ni horarios parroquiales (eso es de otras apps)

---

### Post-MVP (no en scope inicial)

- **F-12: Mapa de peregrinación espiritual** — Cada semana de uso visita virtualmente un santuario del mundo
- **F-13: Racha grupal ("Llamas de familia")** — Grupos de hasta 8 personas con visibilidad de oración completada
- **F-14: Lectio Divina guiada** — Formato de 4 pasos con temporizadores
- **F-15: Modo offline completo** — Descarga semanal de contenido
- **F-16: Completas** — Liturgia nocturna (se integra a Laudes como segunda opción)

---

## 5. Monetización

### Principio rector
El acceso espiritual núcleo es y será siempre gratuito. Ninguna oración, ningún evangelio, ninguna función litúrgica estará detrás de un pago.

### Modelo MVP: donación voluntaria por almacenamiento del diario

**Gatillo:** Cuando el usuario crea su entrada número 31 en el diario espiritual, se interrumpe el flujo con una pantalla de donación.

**Pantalla de donación:**
```
Tu diario espiritual ya tiene 30 reflexiones.

Para seguir guardándolas, necesitamos cubrir
el costo del almacenamiento en servidor.

Aportá lo que puedas, cuando puedas.
No hay monto mínimo ni fecha límite.

[ $1 USD ]  [ $3 USD ]  [ $5 USD ]  [ Otro monto ]

                [Donar ahora]
         [Quizás más adelante — seguir sin guardar]
```

**Comportamiento post-pantalla:**
- Si dona → acceso ilimitado al diario por 12 meses desde la fecha de donación
- Si elige "más adelante" → puede seguir usando la app pero las nuevas entradas del diario no se guardan en servidor (solo localmente en el dispositivo, con aviso claro)
- Si pasan 30 días desde la pantalla sin donación → recordatorio único, no invasivo
- Las entradas anteriores (1–30) nunca se eliminan ni se bloquean

**Procesador de pago:** Stripe o MercadoPago (para Latinoamérica)

**No hay:**
- Suscripción recurrente automática
- Publicidad
- Venta de datos
- Funciones espirituales bloqueadas

---

## 6. Contenido y fuentes

| Contenido | Fuente | Licencia |
|---|---|---|
| Evangelio del día | API de AELF (francés) traducida / Evangelio del día API | Dominio público litúrgico |
| Textos litúrgicos | ICEL / Conferencia Episcopal Argentina-México | Requiere verificación de licencia por país |
| Biblia | Biblia de Jerusalén (texto en dominio público por edición) | Verificar edición específica |
| Comentarios patrísticos | Office of Readings (dominio público) + curación propia | Dominio público |
| Santos | Base de datos propia construida con Wikipedia + fuentes hagiográficas | Propia |
| Calendario litúrgico | Algoritmo propio basado en reglas del Ordo Romano | Propia |

---

## 7. Requisitos no funcionales

**Performance:**
- Tiempo de carga inicial < 2 segundos en 4G
- El Evangelio del día debe mostrarse en < 500ms (caché local)
- Generación de tarjeta visual < 1 segundo

**Privacidad:**
- El diario espiritual viaja cifrado en tránsito (HTTPS/TLS 1.3)
- En reposo, cifrado AES-256
- No se comparte con terceros bajo ninguna circunstancia
- Cumplimiento GDPR (usuarios en España) y Ley 25.326 (Argentina)

**Disponibilidad:**
- Uptime ≥ 99.5%
- Modo offline para contenido litúrgico del día actual

**Accesibilidad:**
- Tamaño de fuente ajustable (al menos 3 niveles)
- Compatible con VoiceOver (iOS) y TalkBack (Android)
- Contraste mínimo WCAG AA en todos los tiempos litúrgicos

---

## 8. Fuera de scope (MVP)

- Versión web
- Idiomas distintos al español (portugués en v2)
- Confesión guiada o examen de consciencia estructurado
- Conexión con parroquias o curas
- Misas en streaming
- Venta de libros o artículos religiosos
- Sistema de gamificación visible (puntos, rankings)
- Notificaciones de otras personas del grupo

---

## 9. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Fuentes litúrgicas con restricciones de licencia | Media | Alto | Verificar licencias antes del Sprint 1. Construir scraper propio si necesario. |
| Contenido de intenciones comunitarias ofensivo | Alta | Medio | Moderación reactiva + límite de caracteres + reporte rápido |
| Baja conversión en donaciones | Media | Medio | La app es viable con 0 donaciones en fase inicial (sin costos de servidor altos con <10k usuarios) |
| Abandono por racha rota | Alta | Alto | El "día de misericordia" ya lo mitiga. A/B test del mensaje de racha rota. |
| Competencia de Hallow expandiéndose al español | Media | Alto | Velocidad de lanzamiento + enfoque litúrgico que Hallow no tiene |

---

## 10. Métricas de seguimiento

**Diarias:**
- DAU, sesiones por usuario, duración promedio de sesión
- % de usuarios que completaron Evangelio del día
- % de usuarios que completaron Laudes

**Semanales:**
- Distribución de rachas (histograma)
- Intenciones publicadas vs respondidas
- Tarjetas compartidas generadas

**Mensuales:**
- Retención D1, D7, D30
- Usuarios con +30 entradas en diario
- Tasa de conversión a donación
- Churn y razones de desinstalación (encuesta)
