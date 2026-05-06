# Memory Vivo - Atleta Frontend

Fecha de actualizacion: 2026-05-06
Fuente: auditoria directa del repositorio `atleta-app`

## Vision general del frontend
- Aplicacion frontend de Atleta construida con Angular 20, Ionic 8 y Capacitor 8.
- El foco real del producto hoy es competencia amateur de futbol: autenticacion, onboarding de jugador, equipos, creacion de partidos, confirmaciones, cierre competitivo, ranking y voto MVP.
- El frontend esta organizado mayormente por features standalone (`auth`, `dashboard`, `matches`, `ratings`, `sessions`, `social`, `teams`, `user`, `fields`).
- La experiencia visual esta muy marcada por una identidad "metallic / Winning Eleven": tipografias `Orbitron` y `Rajdhani`, fondos oscuros, gradientes metalicos y componentes UI reutilizables propios.

## Avance porcentual

- Avance estimado del proyecto Atleta frontend: 87%.
- Avance anterior registrado: 86%.
- Delta de esta tarea: +1 punto porcentual por endurecer invitaciones de equipo en Social: no se puede emitir invitacion sin equipo creado/seleccionado, el UI lo comunica y queda cubierto por spec del panel.

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
- Hay smoke unitario de contratos HTTP para servicios FE de auth, matches/MVP, teams y ratings.
- El smoke MVC backend protege que equipos/partidos/eventos/MVP usen el subject JWT como identidad efectiva ante UUIDs manipulados desde cliente.

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

## Deuda tecnica
- Ruta social rehabilitada: tabs principales y refresco de badge tras responder invitaciones quedan cubiertos con tests unitarios; sigue pendiente validacion manual mobile/web contra backend real.
- Uso de `localStorage` para access token y refresh token.
- La repeticion de handlers de bottom nav fue reducida; las paginas principales conservan un handler fino que delega en `NavigationService`.
- La repeticion funcional entre `matches-history` y `matches-hub` fue consolidada retirando la pagina legacy.
- Servicios de dominio con mucha responsabilidad, especialmente `MatchService`, `MatchStore` y `ActivityService`.
- Runtime config existe para backend y Google client id; queda pendiente revisar estrategia completa de secretos/sesion.
- El badge server-side y el registro de push token estan conectados; queda pendiente validar proveedor push remoto real.
- `MatchStore` ya poda IDs de eventos live procesados para evitar crecimiento indefinido.
- `api-contracts.smoke.spec.ts` protege rutas FE criticas contra desalineacion con backend; el backend ya tiene smoke MVC y cobertura JWT para ratings.
- La navegacion inferior compartida quedo reforzada para mobile: ancho estable, textos con ellipsis, foco tactil consistente, `aria-current` en item activo y badge accesible para pendientes.

## Evidencia actual

- `npm run build` exitoso; mantiene warnings no bloqueantes existentes de glob Stencil y budget menor en `metallic-position-field-picker`.
- `npm test -- --watch=false --browsers=ChromeHeadless` exitoso con 80 tests OK.

## Riesgos
- Riesgo funcional: las tabs de `social` dependen de multiples endpoints; hay que validar estados vacios, errores parciales y consistencia real tras aceptar/rechazar invitaciones.
- Riesgo de seguridad: tokens en `localStorage` quedan expuestos a XSS.
- Riesgo de autorizacion reducido en flujos principales de equipos/partidos/MVP: el backend ya tiene regresion para no confiar en UUIDs de cliente.
- Riesgo operativo: configuracion de entorno muy fija para prod/dev, sin inyeccion runtime.
- Riesgo de consistencia: mezcla de estado local, optimista y backend puede producir diferencias temporales si falla una sincronizacion.
- Riesgo UX: hay pantallas maduras y otras claramente parciales.

## Proximos pasos recomendados
1. Validar `social` en dispositivo/mobile web contra backend real, especialmente estados vacios y acciones aceptar/rechazar.
2. Validar envio push remoto con proveedor real y comportamiento en dispositivo fisico.
3. Agregar smoke E2E opcional con frontend y backend levantados cuando existan datos/credenciales estables.
4. Implementar reset de password por email/token cuando exista contrato backend.
5. Separar mejor responsabilidades de `MatchService` y `MatchStore`.
