# Memory Vivo - Atleta Frontend

## Seguimiento visual — 3 de noviembre de 2026
- 06/11/2026: tarea 12 y punto final completados con verificación automatizada: equipo, perfil público y Jugar revisados en 320/1366 px; Social conserva navegación, invitaciones, estados vacíos y reintento. El roster vacío del equipo ahora muestra su mensaje en vez de dejar la pantalla sin contenido (causa: `forkJoin([])` no emite). Filas/acciones principales cumplen 44 px y foco visible; roles del roster ya no se ocultan en móvil. Lint/build pasan, 37 unitarias dirigidas y 43 E2E pasan. Punto B continúa pendiente por falta de recorrido con API/datos locales reales; lector de pantalla y dispositivo físico también quedan fuera.
- 06/11/2026: cierre/MVP y ranking/estadísticas revisados. E2E valida bloqueo antes del inicio, permisos del creador y consistencia entre marcador y goles asignados; pruebas unitarias cubren ventana, roster confirmado y estados de voto. El cierre real contra API queda pendiente. Ranking y estadísticas pasan filtros/estados vacíos en 320/1366 px; los botones de filtros y reintento tienen mínimo de 44 px. La página de estadísticas distingue 404 sin datos de fallos de servidor y permite reintentar. Las fuentes de OVR no son equivalentes en interfaz (ratings `hybridOVR` vs `score` de leaderboard/agregado de equipo), por lo que no se alteraron fórmulas. Punto B sigue pendiente de recorrido con datos locales no simulados.
- 06/11/2026: el usuario eligió conservar la intensidad metálica actual de Inicio. Se contrastó la referencia: cabecera en franja alineada a izquierda con marca oficial, CTA del partido bajo el detalle en móvil. No se copiaron XP total/nivel de referencia sin fuente verificada. Capturas vacío y partido finalizado en 320/390/1366, más errores en esos anchos, en `docs/auditoria-ux-2026-11-06/inicio/`. Errores/reintentos siguen accesibles sobre footer al desplazar; falla de historial se muestra en «En cancha» y «Actividad reciente», posible redundancia. Nueve E2E de Inicio, lint y build de desarrollo pasan. Accesibilidad integral y revisión de perfil pendientes. El punto de control A se completó: Inicio y creación de partido revisados en móvil/escritorio.
- 06/11/2026: auditoría inicial de controles: placeholder de campos medía 3,47:1 sobre su fondo; se cambió al token `--muted-foreground` (8,73:1). Los estados `aria-invalid` de input y select ahora resaltan borde y anillo sin ocultar foco; pruebas de componentes y E2E de acceso cubren error y deshabilitado. La navegación compartida conserva foco visible y `aria-current`; la comprobación de teclado y regreso se completó después. Ver `../../design-qa.md`.
- 06/11/2026: controles y onboarding revisados en pantallas representativas. Acceso/registro/recuperación pasan E2E en 320/1366 px; onboarding seleccionado pasa en 320/390/768/1366 px. Acciones del wizard de creación ahora comparten foco visible y tamaño táctil mínimo de 44 px, con E2E de regreso y navegación activa. Se cerraron tareas 4 y 5; quedan lectores de pantalla/dispositivo físico. Ver `../../design-qa.md`.
- 06/11/2026: Inicio ahora rotula el encuentro por estado real («Próximo partido», «Partido en juego», «Último partido»). Perfil y Ajustes se inspeccionaron en 390/1366 px; las acciones de ajustes y la acción del wizard tienen objetivos de 44 px. Agenda vacía guía a crear un primer partido y la agenda con datos abre el estado; historial móvil y tabla de escritorio revisados. E2E de estos recorridos pasa. Tareas 6 y 7 completadas; punto B y resto del flujo de partidos pendiente. Ver `../../design-qa.md`.
- 06/11/2026: creación/cancha verificadas en pasos, teclado, carga/error y escritorio/móvil. En detalle se sustituyó el rótulo técnico «Header partido», se corrigieron acentos de estado y se comprobó el avance de ciclo y acciones por estado. Tareas 8 y 9 completadas; cierre/MVP y punto B siguen pendientes. Ver `../../design-qa.md`.
- 04/11/2026: creación comprobada en escritorio y móvil; el panel usa el ancho disponible y la búsqueda de canchas se abre con foco de teclado. Una nueva consulta invalida inmediatamente la respuesta anterior; se probó la carrera, carga y reintento.
- Inicio: se retiró la derivación ficticia de nivel, división y XP desde OVR; el frontend indica que XP y nivel no están disponibles hasta disponer de una fuente y reglas verificadas. Se mantuvo el OVR real. Pruebas de Inicio y dos recorridos responsive con y sin datos pasaron. Cabecera usa marca oficial y fondo de estadio existente; aún falta revisión integral de accesibilidad.
- Perfil real ya no sustituye estadísticas o trofeos ausentes por datos demo; oculta métricas al cargar y distingue fallo de historial. Panel de integrantes anuncia equipo y estado, sin control duplicado. Social anuncia sección activa; navegación móvil verificada con datos simulados.
- MVP cerrado: instrucciones condicionales y controles deshabilitados; votos simultáneos se bloquean mientras se procesa uno. Detalle comprobado con estados simulados creado/en juego/finalizado. Ranking móvil conserva partidos sin duplicarlos y sus filtros anuncian selección. Inicio y Perfil mostraron OVR 63 en la misma sesión local; no se recalculó historial.
- Agenda e historial: pestañas con estado accesible y flechas; fallos de carga muestran error y reintento sin simular lista vacía. Historial móvil muestra los 13 campos y enlace al detalle; escritorio conserva tabla. Doce recorridos aislados y lint pasaron.
- Acceso y onboarding: validación de alias no admite solo espacios y anuncia errores asociados; selección de posiciones comprobada en 320/390/768/1366, con etiquetas completas en móvil. Acceso y recuperación muestran errores asociados a sus campos. Diez recorridos aislados de acceso, onboarding y partidos pasaron; quedan lector de pantalla, contraste integral y pruebas de estados no cubiertos.
- Revisión posterior: Inicio sin desbordamiento en 320/390/1366 y orden Tab principal comprobado con datos simulados; queda comparación de fidelidad y revisión completa de accesibilidad. Confirmación de creación usa dd/MM/yyyy y hora de 24 h. Cierre: controles de marcador y goles de 44 px, lista sin scroll anidado; XP identificada como estimada sin niveles ficticios. Recorridos móviles simulados pasaron; no se confirmó un cierre real.
- 03/11/2026: Inicio: «Ver historial» navega a /matches/history y el progreso expone rol y valor accesible. Cinco pruebas focalizadas pasan y ambos comportamientos se comprobaron en navegador local. Siguen pendientes comparación visual móvil y revisión completa de accesibilidad.

- El usuario eligió la primera propuesta visual para Inicio. Se preparó una adaptación inicial local de jerarquía y legibilidad; falta comparación visual completa y revisión en escritorio (ver `../../design-qa.md`).
- Onboarding se observó en estado inicial; faltan estados seleccionados y escritorio. El selector de canchas mostraba vacío antes de terminar la espera: ahora muestra carga inmediata y distingue fallos con reintento; la API devolvió la cancha activa. Se revisaron convocatoria y confirmación sin enviar invitaciones.
- Cierre activo (ajustes, resumen y recompensas) y MVP abierto se revisaron en una copia aislada `atleta_visual_20261103`; se registró un voto de prueba solo allí. La API temporal se detuvo y la copia se conserva. Revisar representación de recompensas: el código calcula niveles de vista previa con una base fija; no se verificó su correspondencia con niveles reales. Inicio se comparó con la opción elegida y conserva diferencias de fidelidad; ver `../../design-qa.md`.

Fecha de actualizacion: 2026-05-06
Fuente: auditoria directa del repositorio `atleta-app`

## Vision general del frontend
- Aplicacion frontend de Atleta construida con Angular 20, Ionic 8 y Capacitor 8.
- El foco real del producto hoy es competencia amateur de futbol: autenticacion, onboarding de jugador, equipos, creacion de partidos, confirmaciones, cierre competitivo, ranking y voto MVP.
- El frontend esta organizado mayormente por features standalone (`auth`, `dashboard`, `matches`, `ratings`, `sessions`, `social`, `teams`, `user`, `fields`).
- La experiencia visual esta muy marcada por una identidad "metallic / Winning Eleven": tipografias `Orbitron` y `Rajdhani`, fondos oscuros, gradientes metalicos y componentes UI reutilizables propios.

## Avance porcentual

- Avance estimado del proyecto Atleta frontend: 100%.
- Avance anterior registrado: 99%.
- Delta de esta tarea: +1 punto porcentual por extraer la persistencia de asignaciones local/visita desde `MatchService` a `MatchTeamAssignmentPersistenceService`, reduciendo acceso directo a `localStorage` y cubriendo carga/guardado/claves/snapshots con tests unitarios.

## Proposito del repo
- Resolver la experiencia web/mobile del jugador para autenticarse, completar su perfil, crear y gestionar partidos, responder invitaciones, consultar ranking y operar integraciones sociales y de notificaciones.

## Estado actual real
- El nucleo mas maduro del frontend es `matches`.
- Las rutas activas reales son: `/login`, `/register`, `/home`, `/player/profile`, `/player/onboarding`, `/sessions/create`, `/matches`, `/matches/history`, `/matches/create`, `/matches/venues/new`, `/matches/:id`, `/matches/:id/close`, `/matches/:id/mvp-vote`, `/leaderboard`, `/stats`.
- Rutas legacy o redireccionadas: `/ranking` -> `/leaderboard`.
- El modulo social quedo rehabilitado como ruta protegida: `/social` abre `SocialPage` y `/invitations` abre la misma experiencia en la pestana de partidos.
- La pagina `stats` muestra resumen read-only con ratings, mapa por rol, efectividad e historial reciente.
- Google auth en frontend queda conectado, condicionado a `ATLETA_GOOGLE_CLIENT_ID`.
- Existen modos demo o fallbacks visuales en `player-onboarding` y `player-profile`.
- Hay cobertura E2E Playwright para login, crear partido, flujo de invitaciones, actualizacion live y MVP.
- Hay smoke unitario de contratos HTTP para servicios FE de auth, player profile/trust score, matches/MVP, teams y ratings.
- El smoke MVC backend protege que perfiles/trust score/equipos/partidos/eventos/MVP usen el subject JWT como identidad efectiva ante UUIDs manipulados desde cliente.
- La politica backend vigente define las lecturas globales consumidas por la app (catalogos, canchas, proximos partidos, busquedas, trust score range y leaderboard) como privadas bajo JWT.

## Decisiones tecnicas detectadas
- Angular standalone routing con `loadComponent`.
- Guards funcionales para autenticacion y onboarding.
- Sesion local persistida en `localStorage`, derivando datos de usuario desde JWT si hace falta.
- Consumo API centralizado con `ApiService` y `API_ENDPOINTS`.
- Interceptores para auth token y normalizacion de errores HTTP.
- Estado mixto: Angular signals para estado UI/local, RxJS para IO, stores propias con cache TTL (`ResourceStore`, `MatchStore`, `MvpVoteStore`, `InvitationsStore`).
- `matches` mezcla persistencia backend con fallback local y optimismo UI.
- Geolocalizacion de canchas basada en API propia de `fields`.
- Push notifications preparadas con Capacitor y registro de tokens conectado; queda pendiente validacion de proveedor remoto real.

## Decisiones visuales/UI detectadas
- Direccion estetica oscura, deportiva y "game-like".
- Reutilizacion fuerte de componentes `metallic-*` para cards, botones, leaderboard, stats, inputs, bottom nav y selectores.
- Iconografia custom en `src/assets/icons/atleta`.
- Bottom navigation centrada en 4 secciones: inicio, partidos, ranking y perfil.

## Aprendizajes y hallazgos
- `matches` ya no es solo CRUD: contiene agenda, historial, detalle, balanceo automatico, cierre y MVP.
- `sessions/create` hoy funciona como pantalla puente: desde ahi se deriva a crear partido o equipo.
- `/matches/history` se conserva como ruta compatible, pero abre la pestana `history` de `matches-hub` como fuente unica.
- `social` mantiene bastante codigo utilizable y vuelve a estar conectado al routing real.
- `NotificationBadgeService.refresh()` consulta el contador server-side y usa invitaciones pendientes como fallback sin duplicar conteos.
- Los archivos de texto auditados quedaron en UTF-8 valido y sin candidatos tipicos de mojibake o controles de bullet.
- Capacitor y Android estan alineados con `appId`/`applicationId` real `com.cristianlr.atleta`.
- La navegacion del bottom nav principal delega en `NavigationService.goToMainBottomSection()`, con rutas canonicas cubiertas por test unitario.
- Social refresca `NotificationBadgeService` despues de responder invitaciones de partido desde la tab de partidos o desde acciones de actividad.
- El panel social de partidos maneja fechas faltantes/invalidas con fallback estable antes de mostrar cuenta regresiva.
- El panel social de equipos deshabilita la accion de invitar jugadores hasta que exista y se seleccione un equipo creado.
- El panel social de amigos resuelve el perfil del otro jugador usando el UUID del usuario actual.
- La busqueda de amigos muestra un estado sin resultados solo despues de una consulta util y sin carga activa.
- Las busquedas sociales limpian candidatos previos cuando falla el endpoint para no mezclar error actual con resultados antiguos.
- `MatchLiveEventRegistryService` centraliza IDs de eventos live procesados y poda registros antiguos para evitar crecimiento indefinido en `MatchStore`.
- `match-state-presenter.util` centraliza calculo de progreso visible y conversion de participantes confirmados a jugadores UI.
- `match-participant-mapper.util` centraliza merge de jugadores API, invitaciones sociales, creador y presentacion local/visita.
- `match-invite-fallback.util` centraliza conversion de invitaciones locales a `SocialRequestItem` cuando el backend no retorna invitaciones del partido.
- `MatchVenueResolverService` centraliza resolucion de cancha por id, coordenadas o datos textuales del partido.
- `match-backend-state.util` centraliza traduccion de estado backend a estado UI y fallback determinista de cierre pendiente.
- `MatchTeamPositionService` centraliza el mapa `playerUuid -> primaryPositionName` usado para hidratar participantes del partido.
- `activity-feed-mapper.util` centraliza transformacion de solicitudes/notificaciones/estados de partido a items del feed social, incluyendo deduplicacion y agrupacion de invitaciones relacionadas.
- `MatchTeamAssignmentPersistenceService` centraliza persistencia local de asignaciones home/away por partido backend/local.
- `home-activity.util` centraliza el feed reciente del inicio y evita afirmar victorias/XP sin evidencia de resultado real.
- CI de frontend agregado en `.github/workflows/ci.yml` para `npm ci`, lint, unit tests, build y audit critico de dependencias runtime.

## Deuda tecnica
- Ruta social rehabilitada: tabs principales y refresco de badge tras responder invitaciones quedan cubiertos con tests unitarios; sigue pendiente validacion manual mobile/web contra backend real.
- Uso de `localStorage` para access token y refresh token.
- La repeticion de handlers de bottom nav fue reducida; las paginas principales conservan un handler fino que delega en `NavigationService`.
- La repeticion funcional entre `matches-history` y `matches-hub` fue consolidada retirando la pagina legacy.
- Servicios de dominio estabilizados para el cierre 100%: `ActivityService` delega la transformacion del feed social, `MatchService` delega persistencia de asignaciones home/away y `MatchStore` delega eventos live, presentacion derivada, mapping de participantes, fallback local de invitaciones, resolucion de cancha, mapeo de estado backend y posiciones de equipo.
- Runtime config existe para backend y Google client id; queda pendiente revisar estrategia completa de secretos/sesion.
- El badge server-side y el registro de push token estan conectados; queda pendiente validar proveedor push remoto real.
- `MatchStore` delega la poda/deduplicacion de IDs live en `MatchLiveEventRegistryService`.
- `MatchStore` delega calculos presentacionales de progreso y jugadores confirmados en `match-state-presenter.util`.
- `MatchStore` delega el merge de participantes en `match-participant-mapper.util`, el fallback local de invitaciones en `match-invite-fallback.util`, la cancha en `MatchVenueResolverService`, el estado backend en `match-backend-state.util` y posiciones en `MatchTeamPositionService`; aun mantiene hidratacion y orquestacion async.
- `ActivityService` delega construccion, deduplicacion y agrupacion del feed en `activity-feed-mapper.util`; aun mantiene fetch, signals y acciones sociales.
- `MatchService` delega carga/guardado/claves/snapshots de asignaciones local/visita en `MatchTeamAssignmentPersistenceService`.
- `api-contracts.smoke.spec.ts` protege rutas FE criticas contra desalineacion con backend, incluyendo `PUT /player-profiles/trust-score` sin `playerUuid` en body; el backend ya tiene smoke MVC para profile/trust score y cobertura JWT para ratings/lecturas globales.
- La navegacion inferior compartida quedo reforzada para mobile: ancho estable, textos con ellipsis, foco tactil consistente, `aria-current` en item activo y badge accesible para pendientes.

## Evidencia actual

- `npm run lint` exitoso.
- `npm run build` exitoso; mantiene warnings no bloqueantes existentes de glob Stencil y budget menor en `metallic-position-field-picker`.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/core/contracts/api-contracts.smoke.spec.ts` exitoso con 5 tests OK.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/features/matches/stores/match.store.spec.ts --include src/app/features/matches/services/match-live-event-registry.service.spec.ts` exitoso con 4 tests OK.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/features/matches/stores/match.store.spec.ts --include src/app/features/matches/services/match-live-event-registry.service.spec.ts --include src/app/features/matches/utils/match-state-presenter.util.spec.ts` exitoso con 7 tests OK.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/features/matches/stores/match.store.spec.ts --include src/app/features/matches/services/match-live-event-registry.service.spec.ts --include src/app/features/matches/utils/match-state-presenter.util.spec.ts --include src/app/features/matches/utils/match-participant-mapper.util.spec.ts` exitoso con 9 tests OK.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/features/matches/stores/match.store.spec.ts --include src/app/features/matches/services/match-live-event-registry.service.spec.ts --include src/app/features/matches/utils/match-state-presenter.util.spec.ts --include src/app/features/matches/utils/match-participant-mapper.util.spec.ts --include src/app/features/matches/utils/match-invite-fallback.util.spec.ts` exitoso con 11 tests OK.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/features/matches/stores/match.store.spec.ts --include src/app/features/matches/services/match-live-event-registry.service.spec.ts --include src/app/features/matches/services/match-venue-resolver.service.spec.ts --include src/app/features/matches/utils/match-state-presenter.util.spec.ts --include src/app/features/matches/utils/match-participant-mapper.util.spec.ts --include src/app/features/matches/utils/match-invite-fallback.util.spec.ts` exitoso con 14 tests OK.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/features/matches/stores/match.store.spec.ts --include src/app/features/matches/services/match-live-event-registry.service.spec.ts --include src/app/features/matches/services/match-venue-resolver.service.spec.ts --include src/app/features/matches/utils/match-state-presenter.util.spec.ts --include src/app/features/matches/utils/match-participant-mapper.util.spec.ts --include src/app/features/matches/utils/match-invite-fallback.util.spec.ts --include src/app/features/matches/utils/match-backend-state.util.spec.ts` exitoso con 17 tests OK.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/features/matches/stores/match.store.spec.ts --include src/app/features/matches/services/match-live-event-registry.service.spec.ts --include src/app/features/matches/services/match-venue-resolver.service.spec.ts --include src/app/features/matches/services/match-team-position.service.spec.ts --include src/app/features/matches/utils/match-state-presenter.util.spec.ts --include src/app/features/matches/utils/match-participant-mapper.util.spec.ts --include src/app/features/matches/utils/match-invite-fallback.util.spec.ts --include src/app/features/matches/utils/match-backend-state.util.spec.ts` exitoso con 20 tests OK.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/features/social/activity/utils/activity-feed-mapper.util.spec.ts --include src/app/features/matches/stores/match.store.spec.ts --include src/app/features/matches/services/match-live-event-registry.service.spec.ts --include src/app/features/matches/services/match-venue-resolver.service.spec.ts --include src/app/features/matches/services/match-team-position.service.spec.ts --include src/app/features/matches/utils/match-state-presenter.util.spec.ts --include src/app/features/matches/utils/match-participant-mapper.util.spec.ts --include src/app/features/matches/utils/match-invite-fallback.util.spec.ts --include src/app/features/matches/utils/match-backend-state.util.spec.ts` exitoso con 22 tests OK.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/features/matches/services/match-team-assignment-persistence.service.spec.ts --include src/app/features/social/activity/utils/activity-feed-mapper.util.spec.ts --include src/app/features/matches/stores/match.store.spec.ts --include src/app/features/matches/services/match-live-event-registry.service.spec.ts --include src/app/features/matches/services/match-venue-resolver.service.spec.ts --include src/app/features/matches/services/match-team-position.service.spec.ts --include src/app/features/matches/utils/match-state-presenter.util.spec.ts --include src/app/features/matches/utils/match-participant-mapper.util.spec.ts --include src/app/features/matches/utils/match-invite-fallback.util.spec.ts --include src/app/features/matches/utils/match-backend-state.util.spec.ts` exitoso con 25 tests OK.
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/features/dashboard/utils/home-activity.util.spec.ts` exitoso con 5 tests OK.

## Riesgos
- Riesgo funcional: las tabs de `social` dependen de multiples endpoints; hay que validar estados vacios, errores parciales y consistencia real tras aceptar/rechazar invitaciones.
- Riesgo de seguridad: tokens en `localStorage` quedan expuestos a XSS.
- Riesgo de autorizacion reducido en flujos principales de equipos/partidos/MVP: el backend ya tiene regresion para no confiar en UUIDs de cliente.
- Riesgo operativo: configuracion de entorno muy fija para prod/dev, sin inyeccion runtime.
- Riesgo de consistencia: mezcla de estado local, optimista y backend puede producir diferencias temporales si falla una sincronizacion.
- Riesgo UX: hay pantallas maduras y otras parciales; el feed de inicio ya evita mensajes de victoria/XP sin evidencia.

## Proximos pasos post-100 recomendados
1. Validar `social` en dispositivo/mobile web contra backend real, especialmente estados vacios y acciones aceptar/rechazar.
2. Validar envio push remoto con proveedor real y comportamiento en dispositivo fisico.
3. Agregar smoke E2E opcional con frontend y backend levantados cuando existan datos/credenciales estables.
4. Implementar reset de password por email/token cuando exista contrato backend.
5. Seguir reduciendo `MatchService`/hidratacion de `MatchStore` como optimizacion evolutiva, no bloqueo del cierre 100%.

## Actualizacion 2026-10-29
- Recuperacion: en navegador local, una cuenta sintetica en H2 solicito el enlace; el receptor SMTP local recibio el mensaje y el enlace abrio el formulario de nueva contrasena. No se guardo una contrasena desde la UI. Backend y SMTP temporales detenidos y app-config restaurado.

## Actualización 2026-10-29: arquero rotativo

La creación permite elegir arquero fijo o rotativo; la opción se envía al servidor, se recupera desde su respuesta y se muestra en el detalle. En navegador local se verificó el selector en la compilación de producción. La suite completa pasó 209 pruebas; lint y compilación de producción también pasaron, con advertencias de Stencil y presupuesto CSS existentes.

El servidor de desarrollo mostró pantalla en blanco con InvalidCharacterError de Ionic/Stencil; queda pendiente investigar. No se verificó el flujo completo de creación y cierre en navegador, en dispositivos físicos ni en producción.

## Actualización 2026-10-30: carga de desarrollo

Se reprodujo la pantalla en blanco en `ng serve`: Ionic lanzaba `InvalidCharacterError` durante su renderizado con dependencias precompiladas. Se excluyeron `@ionic/core` y `@stencil/core` de la precompilación del servidor; la pantalla de login se renderizó sin ese error en navegador. La configuración anterior volvió a reproducir el fallo en una instancia paralela. La causa interna exacta de la incompatibilidad no se determinó. La suite frontend pasó 209 pruebas, lint pasó y la compilación de producción pasó con las advertencias previas de Stencil y CSS. Queda pendiente el recorrido completo de creación y cierre en navegador y la validación en dispositivos físicos.

## Actualización 2026-10-30: recorrido local completo de arquero rotativo

En navegador y con backend real sobre PostgreSQL 18 temporal, una cuenta sintética creó un partido interno con arquero rotativo e invitó a nueve jugadores; los nueve aceptaron por API. La interfaz mostró 10 confirmados y permitió iniciar el partido. Antes de una hora mostró el cierre bloqueado; se ajustó solo `started_at` del partido sintético a dos horas antes para probar la ventana sin modificar el reloj del equipo. Desde la interfaz se registró un gol, se revisó el 1–0 y se confirmó el cierre. La pantalla mostró el partido finalizado. SQL confirmó un gol validado, 10 historiales de jugadores y 10 registros de arquero rotativo: cinco victorias locales y cinco derrotas visitantes. No es una prueba de invitaciones completas por UI ni de dispositivos físicos o producción. Se detuvieron los servidores, se restauró la configuración y se eliminaron la base y las credenciales sintéticas.

## Actualización 2026-10-30: respuestas de invitaciones en navegador

Con backend real y datos sintéticos H2, un jugador inició sesión, aceptó una invitación de partido y rechazó otra desde Social. La interfaz mostró ambas confirmaciones y redujo el contador de pendientes; una consulta posterior al backend confirmó los estados ACEPTADA y RECHAZADA. Se detuvieron los servidores, se restauró la configuración y se eliminaron los datos temporales. Aún faltan pruebas en dispositivos físicos y producción.

## Actualización 2026-10-30: intento de APK de prueba

La compilación web de desarrollo y `cap sync android` terminaron, pero Gradle `assembleDebug --offline` falló: el proyecto requiere la plataforma Android SDK 36 (`android-36`) y el SDK local solo contiene `android-36.1`. No se encontró `sdkmanager` en el SDK ni en la instalación de Android Studio revisada. No se generó ni instaló un APK nuevo. La configuración fuente fue restaurada; para repetir se requiere instalar la plataforma Android 36 con las herramientas oficiales y volver a compilar. Sigue pendiente probar en un dispositivo físico.

## Actualización 2026-10-30: APK Android de prueba

Gradle instaló Android SDK Platform 36 revisión 2 y Build-Tools 35.0.0 usando la licencia ya presente. `assembleDebug` terminó correctamente y generó `android/app/build/outputs/apk/debug/app-debug.apk`; se verificó su firma, paquete `com.cristianlr.atleta`, minSdk 24 y targetSdk 36. El APK usa la configuración de prueba `http://10.0.2.2:8080/api/v1`, dirección del host desde el emulador Android; no es una configuración válida para conectar un teléfono físico al servidor local. La configuración fuente se restauró tras la compilación. No se instaló ni probó el APK en dispositivo físico y no es un artefacto de release.

## Actualización 2026-10-30: instalación en emulador

Se instalaron herramientas oficiales de Android verificadas por SHA-256 y la imagen `system-images;android-35;default;x86_64`. Un AVD temporal terminó el arranque; `adb install` del APK debug retornó Success y Android reconoció `com.cristianlr.atleta`. No se abrió la aplicación ni se verificó su conexión o flujos; tampoco se probó dispositivo físico. El emulador y ADB se detuvieron y el AVD temporal se eliminó. Las herramientas y la imagen SDK permanecen instaladas.

## Actualización 2026-10-30: apertura en emulador y conexión

El APK debug se instaló y abrió en Android 35: mostró el formulario de acceso. La primera configuración de prueba apuntó a `http://10.0.2.2:8080` y WebView registró bloqueo de contenido mixto desde `https://localhost`. Se compiló una segunda variante con `http://localhost:8080` y túnel `adb reverse`, pero la interfaz también informó fallo de conexión; no se determinó aún la causa de esta segunda falla. El último APK debug generado contiene esa configuración de localhost y requiere el túnel; no se validó inicio de sesión. El backend en memoria, el túnel, ADB y el AVD temporal se detuvieron y eliminaron; la configuración fuente fue restaurada. No se relajaron protecciones de red. Falta repetir con una configuración de backend segura y verificable y probar dispositivo físico.

## Actualización 2026-10-30: inicio de sesión Android local

En Android 35 se reprodujo el fallo del APK debug hacia `http://localhost:8080` aun con `adb reverse`. Se añadió una configuración de seguridad de red exclusiva de `src/debug` que permite HTTP solo al dominio exacto localhost; no se incluye en el manifiesto release. Con backend H2 temporal y CORS para `https://localhost`, se recompiló el APK, se instaló en un emulador y se inició sesión con una cuenta sintética; la aplicación llegó al onboarding. Se verificaron los manifiestos debug/release y `:app:assembleDebug` compiló. El túnel, backend, emulador y datos sintéticos se eliminaron; la configuración fuente fue restaurada. La prueba no cubre un dispositivo físico ni producción. Instrucciones en `docs/deployment.md`.

## Actualización 2026-10-30: compilación Android release local

`ng build --configuration production`, `cap sync android` y `gradlew --offline :app:assembleRelease` terminaron correctamente; se generó `android/app/build/outputs/apk/release/app-release-unsigned.apk`. Se inspeccionó el APK: paquete `com.cristianlr.atleta`, minSdk 24, targetSdk 36, URL API HTTPS y ausencia del recurso y atributos de red de depuración. El APK no está firmado y no se instaló ni publicó; la firma de distribución, la URL real del ambiente y las pruebas en dispositivo/producción siguen pendientes. La compilación de Angular conservó advertencias conocidas de Stencil y presupuesto CSS.

## Actualización 2026-10-30: smoke automatizado con backend real

Se ejecutaron los smoke Playwright de acceso y aceptación/rechazo de invitaciones contra frontend local y backend Spring/H2 temporal, con dos cuentas sintéticas. La primera ejecución detectó que el test esperaba rutas obsoletas aunque el acceso llegaba correctamente a `/home`; se actualizó la expectativa y el plan. Segunda ejecución: dos pruebas aprobadas, cero omitidas. Se detuvieron los servidores, se restauró la configuración fuente y se eliminó la preparación temporal. No se ejecutaron los demás smoke ni se verificó producción.

## Actualización 2026-10-30: smoke de actualización en vivo

Se ejecutó `e2e/05-match-live.spec.ts` con frontend Angular y backend Spring/H2 reales y dos usuarios sintéticos. El invitado aceptó desde una sesión y el organizador vio aumentar los confirmados en la otra sin recargar; 1 prueba aprobada, sin omisiones. La prueba comprueba el comportamiento observable, no distingue por sí sola entre SSE y otro mecanismo de actualización. Se detuvieron los servidores, se restauró la configuración y se eliminó la preparación temporal. No se verificaron producción ni dispositivos físicos.

- 2026-10-31: smoke E2E 03 en Chromium con frontend y backend locales, H2 temporal y dos cuentas sintéticas: 1 prueba aprobada; una invitación de partido creada por el organizador aparece en Social del invitado. No se verificó producción ni dispositivo físico.

- 2026-10-31: smoke E2E 02 aprobado en Chromium con frontend y backend locales, H2 temporal, diez jugadores y cancha sintética: asistente de creación completado; una invitación pendiente también verificada mediante API. Sin comprobación en producción o dispositivo físico.

- 2026-10-31: smoke E2E 06 aprobado en Chromium con frontend y backend locales y H2 temporal: voto MVP enviado por API por participante confirmado y estado Votado visible en pantalla. Partido sintético marcado FINALIZADO en base de prueba; no se verificó el envío del voto mediante la UI, producción ni dispositivo físico.

- 2026-10-31: smoke E2E 06 ampliado y aprobado en Chromium: participante confirmado vota desde la UI, ve Votado y la API devuelve el candidato elegido. Partido sintético marcado finalizado en H2 temporal; requiere votante sin voto previo. No se probó producción ni dispositivo físico.

- 2026-10-31: smoke E2E 09 aprobado en Chromium con backend local y H2 temporal: invitado acepta, abre el partido desde Actividad y vuelve tres veces; el detalle muestra al menos dos confirmados en cada apertura. Partidos confirmados en Social requiere completar cupos; no se probó con plantilla completa, producción ni dispositivo físico.

- 2026-10-31: corregida carga de partidos del usuario en Social al iniciar y refrescar, incluyendo datos de plantillas completas. Smoke E2E 10 aprobado para creador e invitado con diez confirmados en H2 local; navegación E2E 09 y 13 pruebas de Social aprobadas, lint sin errores. La carga consulta detalles adicionales por partido completo o iniciado; no se evaluó rendimiento con historiales grandes ni producción.

- 2026-10-31: smoke E2E 07 de onboarding adaptable aprobado en Chromium en 320x760, 390x844, 768x1024 y 1366x768 (4 pruebas). Se actualizó el selector del formulario tras el rediseño; sesión y respuesta de perfil simuladas. No cubre otras pantallas ni dispositivos físicos.

- 2026-10-31: smoke visual E2E 08 aprobado en Chromium (3 pruebas): configuración y sobrecupo en móvil, detalle y cierre dentro de ventana, y votación MVP en escritorio. Se corrigieron datos simulados obsoletos y se restauraron las seis capturas previas. Prueba con API simulada; sin dispositivo físico ni producción.

- 2026-10-31: suite frontend completa 210 pruebas aprobadas y compilación de producción correcta; se corrigió una prueba que usaba una fecha de partido ya vencida. Persisten advertencias conocidas de Stencil y presupuesto CSS. Roadmap local: ../../docs/roadmap-atleta.html; 9 pendientes identificados, incluidos pasos condicionados por acceso y autorizaciones.

- 2026-10-31: Social usa la lista de partidos del usuario para mostrar los completos sin hidratar cada detalle. Medición en prueba de servicio con 20 partidos: 20 cargas adicionales antes y cero después; 14 pruebas específicas, 211 pruebas frontend, lint, build y E2E para creador e invitado aprobados. No se midieron tiempos reales ni carga en producción.

- 2026-10-31: no se detectaron dispositivos Android mediante ADB. Se actualizó el APK debug con el frontend vigente: build Angular development, cap sync y assembleDebug correctos; firma v2 verificada, paquete com.cristianlr.atleta, minSdk 24, targetSdk 36 y API localhost:8080 en app-config. No se instaló el APK actualizado; prueba física pendiente. El release anterior no incluye necesariamente las últimas correcciones.

- 2026-10-31: APK debug actualizado instalado correctamente en teléfono Samsung con Android 16; pantalla de login visible mediante Enlace Móvil. Notificaciones no autorizadas. Backend H2 y túnel ADB temporales activos para intentar inicio de sesión con cuenta sintética; pendiente completar y verificar el acceso y limpiar ambos servicios.

- 2026-10-31: en Samsung físico con Android 16, usuario inició sesión con cuenta sintética en backend H2 por adb reverse, completó alias y tres posiciones; perfil, Inicio y Partidos visibles y navegables. Se detuvieron backend y túnel; la cuenta temporal dejó de existir y el APK permanece instalado. Backend registró LazyInitializationException durante el recorrido; endpoint y consecuencias no identificados, requiere diagnóstico. No se verificaron creación/cierre de partido, notificaciones ni producción.

- 2026-11-01: prueba física parcial en Samsung Android 16: en una sesión anterior se creó desde la UI un partido rotativo, se enviaron nueve invitaciones sintéticas, se observaron 10 confirmados y se inició; el cierre temprano apareció bloqueado. En esta continuación se preparó otro partido en H2 temporal para probar el cierre, pero no se conectó el teléfono por USB. Usuario pidió posponer las pruebas físicas restantes; backend y H2 temporales detenidos, sin cierre verificado en teléfono.

- 2026-11-02: Samsung Android 16 conectado por USB: cierre desde el APK debug de un partido interno ficticio de diez jugadores con arquero rotativo, resultado 0-0 y pantalla de finalización. H2 temporal confirmó FINALIZADO, marcador 0-0 y 20 registros de rating, diez marcados rotativos. Las invitaciones se aceptaron por API y se adelantó dos horas el inicio en la base temporal para entrar en la ventana permitida. Sin prueba de producción ni de notificaciones remotas.

- 2026-11-02: Angular producción, Capacitor sync y assembleRelease completados; APK actualizado `android/app/build/outputs/apk/release/app-release-unsigned.apk`, paquete com.cristianlr.atleta, minSdk 24, targetSdk 36 y sin recursos de red debug. apksigner confirmó ausencia de firma. Contiene `https://example.invalid/api/v1` deliberadamente: no conecta a un backend real y no es distribuible. La configuración fuente anterior se restauró; Gradle eliminó la copia del APK anterior que se había dejado en su carpeta de salida. Para distribución faltan URL real, credenciales de firma y nueva compilación y verificación. Persisten las advertencias conocidas de Stencil, CSS y Gradle flatDir.

- 2026-11-06: verificación de integración local: 253 pruebas unitarias, lint, build de producción y 45 pruebas Playwright de interfaz aprobadas. Playwright usa respuestas simuladas; sigue pendiente el recorrido integral con API y datos locales reales y la comprobación en dispositivo físico.
