# Arquitectura Detectada - Atleta Frontend

Fecha de actualizacion: 2026-04-23

## Stack detectado
- Angular `^20`
- Ionic Angular `^8`
- Capacitor `8`
- RxJS `7.8`
- TypeScript `5.9`
- Leaflet `1.9`
- Playwright para E2E
- Karma/Jasmine para unit tests
- ESLint Angular

## Estructura del proyecto
- `src/app/core`
  - config, constants, guards, interceptors, services, store base
- `src/app/shared`
  - `navigation`
  - `ui/metallic-*`
  - utilidades compartidas
- `src/app/features`
  - `auth`
  - `dashboard`
  - `fields`
  - `matches`
  - `ratings`
  - `sessions`
  - `social`
  - `teams`
  - `user`
- `src/environments`
  - `environment.ts`
  - `environment.prod.ts`
- `e2e`
  - smoke tests Playwright del flujo core

## Organizacion por modulos, paginas y componentes
- `auth`: login y registro standalone.
- `user`: onboarding y perfil.
- `matches`: dominio mas robusto, con paginas, componentes, modelos, stores, servicios y utilidades.
- `ratings`: leaderboard y consumo de ratings.
- `sessions`: pantalla puente para crear partido o equipo.
- `social`: pagina, facade, activity service y componentes listos, conectado nuevamente como ruta protegida secundaria.
- `shared/ui`: biblioteca interna "metallic".

## Patron detectado
- Feature-first con `core` + `shared`.
- Angular standalone components.
- Separacion parcial entre pagina orquestadora, servicio API, servicio de dominio y store reactivo.
- En `matches`, el patron real es `page -> store/service -> api service`, mas fallback local y sincronizacion optimista.

## Manejo de estado
- No hay NgRx/Nx/Redux.
- Se usa una combinacion de:
  - Angular signals para estado local/derivado.
  - RxJS para orquestacion async.
  - stores custom con cache TTL.
- Stores detectadas:
  - `MatchStore`
  - `InvitationsStore`
  - `MvpVoteStore`
  - `ResourceStore` como base generica
- Servicios auxiliares de estado:
  - `MatchLiveEventRegistryService` para deduplicacion/poda de eventos live procesados.
  - `MatchVenueResolverService` para resolver cancha por id/coordenadas/fallback textual.
  - `MatchTeamPositionService` para resolver posiciones principales de miembros del equipo durante la hidratacion del partido.
  - `MatchTeamAssignmentPersistenceService` para persistir asignaciones home/away por partido local o backend.
- Utilidades presentacionales:
  - `match-state-presenter.util` para progreso de partido y jugadores confirmados de UI.
  - `match-participant-mapper.util` para merge de participantes API/social/local y colores local/visita.
  - `match-invite-fallback.util` para convertir invitaciones locales a contrato social cuando el backend no devuelve invitaciones del partido.
  - `match-backend-state.util` para traducir estado backend y calcular fallback de cierre pendiente.
  - `activity-feed-mapper.util` para transformar solicitudes/notificaciones/estados de partido en feed social, deduplicar y agrupar invitaciones relacionadas.

Observacion:
- `MatchService` tambien funciona como mini store local de partidos, por lo que hay dos capas de estado en ese dominio.

## Estrategia de consumo API
- `ApiService` base encapsula `get/post/put/patch/delete`.
- Los endpoints viven en `core/constants/api-endpoints.ts`.
- `APP_CONFIG` inyecta `apiBaseUrl`.
- `AuthTokenInterceptor` agrega `Bearer token` a endpoints privados.
- `HttpErrorInterceptor` limpia sesion en `401`.
- `HttpErrorService` y `ErrorMapperService` normalizan errores tecnicos y mensajes de usuario.

## Convenciones detectadas
- Nomenclatura por feature y tipo: `*.page.ts`, `*.component.ts`, `*.service.ts`, `*.models.ts`.
- Paginas y componentes standalone.
- Templates HTML y estilos SCSS co-localizados.
- Icon assets reutilizados desde `assets/icons/atleta`.
- Bottom nav armada por helper `buildMainBottomNav`.
- Muchos imports absolutos desde `src/app/...`.

## Integracion visual detectada
- Sistema UI propio sobre Ionic.
- Uso de componentes Ionic base envueltos con componentes propios.
- Variables SCSS y custom properties globales.
- Carga de Google Fonts en `variables.scss`.
- Dark mode system de Ionic habilitado.

## Testing detectado
- Unit tests parciales en servicios y componentes clave.
- Smoke E2E para login, crear partido, invitaciones, live updates y MVP.
- Smoke unitario de contratos HTTP FE para auth, matches/MVP, teams y ratings con `HttpTestingController`.

## Problemas estructurales detectados
- `social` existe como modulo y vuelve a estar conectado a routing real mediante `/social` y `/invitations`.
- El historial de partidos quedo consolidado en `matches-hub`; `/matches/history` funciona como entrada compatible hacia la pestana `history`.
- `MatchService` conserva logica de dominio y coordinacion de partidos, con persistencia de asignaciones home/away delegada.
- `MatchStore` empezo a delegar infraestructura de eventos live, presentacion derivada, mapping de participantes, fallback local, resolucion de cancha, posiciones de equipo y mapeo de estado backend; aun concentra hidratacion y orquestacion async.
- `ActivityService` ya delega transformacion/deduplicacion/agrupacion del feed social; aun concentra fetch, signals y acciones sociales.
- Repeticion de handlers de bottom nav en muchas paginas.
- Strings con problemas de encoding en varios archivos.
- Mezcla de `Promise`, `Observable`, `signal` y efectos dentro del mismo flujo.

## Oportunidades de mejora arquitectonica
1. Validar el estado objetivo del dominio social con pruebas mobile/web y contratos FE-BE.
2. Completar smoke de contratos contra backend real levantado.
3. Separar `MatchService` en capas mas chicas.
4. Validar contratos y estados vacios del historial consolidado en `matches-hub`.
5. Extraer un shell/layout compartido para bottom nav y page container.
6. Centralizar reglas de negocio repetidas de `matches` y seguir extrayendo hidratacion desde `MatchStore`.
7. Implementar runtime config para `apiBaseUrl`.
8. Revisar estrategia de almacenamiento de tokens.
