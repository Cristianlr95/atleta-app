# Memory Vivo - Atleta Frontend

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
