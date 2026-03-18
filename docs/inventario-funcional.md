# Inventario funcional real - ATLETA

Fecha de auditoria: 2026-03-02
Repos auditados:
- Frontend: `c:\Users\Crist\Proyectos\Atleta\atleta-app`
- Backend: `c:\Users\Crist\OneDrive\Desktop\Atleta-Server`

## 1. Resumen ejecutivo (que funciona hoy)
- Backend Spring Boot con OpenAPI habilitado y controladores para auth/users, matches, teams, ratings, social y fields.
- Flujo core implementado: registro/login, onboarding de perfil, creacion de partido, invitaciones, confirmaciones, cierre/finalizacion y votacion MVP.
- P0 ejecutado en esta iteracion:
  - `GET /api/v1/ratings/leaderboard` implementado y consumido por frontend sin fallback mock.
  - `GET /api/v1/teams/by-creator/{creatorUuid}` implementado en backend (endpoint ahora existe para el contrato FE).
  - Normalizacion FE para resultados de partido (`GANADO/PERDIDO/EMPATE` y `VICTORIA/DERROTA/EMPATE`).
  - Flujo de creacion consolidado en un entrypoint activo (`/matches/create`) desde `sessions/create`.

## 2. Mapa por dominios (Backend)

### 2.1 Auth / Users
Que hace:
- Gestion de atletas y perfil futbolistico (alias, posiciones, trust score).

Endpoints (evidencia: `src/main/java/com/atleta/demo/controller/AthleteController.java`, `PlayerProfileController.java`, `PositionController.java`):
- `POST /api/v1/athletes/register`
- `POST /api/v1/athletes/login`
- `POST /api/v1/athletes/auth/google`
- `GET /api/v1/athletes/{atletaUuid}`
- `GET /api/v1/athletes/by-email/{email}`
- `PUT /api/v1/athletes/{atletaUuid}`
- `PUT /api/v1/athletes/{atletaUuid}/password`
- `GET /api/v1/athletes/search`
- `GET /api/v1/athletes/registered-after`
- `GET /api/v1/athletes/email-exists/{email}`
- `GET /api/v1/athletes/stats`
- `POST /api/v1/player-profiles`
- `GET /api/v1/player-profiles/{atletaUuid}`
- `GET /api/v1/player-profiles/by-alias/{alias}`
- `PUT /api/v1/player-profiles/{atletaUuid}`
- `POST /api/v1/player-profiles/positions`
- `GET /api/v1/player-profiles/{atletaUuid}/positions`
- `DELETE /api/v1/player-profiles/{atletaUuid}/positions/{positionId}`
- `PUT /api/v1/player-profiles/trust-score`
- `GET /api/v1/player-profiles/{atletaUuid}/trust-history`
- `GET /api/v1/player-profiles/by-trust-score`
- `GET /api/v1/player-profiles/search`
- `PUT /api/v1/player-profiles/{atletaUuid}/positions/{positionId}/experience`
- `GET /api/v1/positions`
- `GET /api/v1/positions/{id}`
- `GET /api/v1/positions/search`

Modelos/entidades:
- `Athlete`, `PlayerProfile`, `PlayerPosition`, `Position`, `TrustLog`.

Reglas:
- Email unico, password hash, alias unico, prioridad de posicion unica por jugador.

### 2.2 Matches / Partidos
Que hace:
- Creacion, gestion de estado, jugadores/equipos, eventos, cierre, live y MVP.

Endpoints (evidencia: `src/main/java/com/atleta/demo/controller/MatchController.java`):
- `POST /api/v1/matches`
- `GET /api/v1/matches/{matchId}`
- `GET /api/v1/matches`
- `GET /api/v1/matches/upcoming`
- `GET /api/v1/matches/by-player/{playerUuid}`
- `GET /api/v1/matches/by-team/{teamId}`
- `PUT /api/v1/matches/{matchId}/status`
- `POST /api/v1/matches/{matchId}/teams/{teamId}`
- `POST /api/v1/matches/join`
- `POST /api/v1/matches/{matchId}/teams/{teamId}/players/import`
- `PUT /api/v1/matches/{matchId}/teams/assignment`
- `DELETE /api/v1/matches/{matchId}/players/{playerUuid}`
- `PUT /api/v1/matches/{matchId}/players/{playerUuid}/confirm`
- `GET /api/v1/matches/{matchId}/live`
- `POST /api/v1/matches/events`
- `PUT /api/v1/matches/events/{eventId}/confirm`
- `GET /api/v1/matches/{matchId}/events`
- `POST /api/v1/matches/{matchId}/close/preview`
- `GET /api/v1/matches/{matchId}/mvp`
- `POST /api/v1/matches/{matchId}/mvp/vote`

Modelos/entidades:
- `Match`, `MatchTeam`, `MatchPlayer`, `MatchEvent`, `MatchInvite`, `PlayerHistory`.

Reglas:
- Transiciones CREADO -> INICIADO -> FINALIZADO/INVALIDO.
- Ventana de 3 horas para captura/cierre.
- Ventana de 3 horas para voto MVP.

### 2.3 Teams / Equipos
Que hace:
- Crear, listar, archivar equipos, subir logo y consultar miembros activos.

Endpoints (evidencia: `src/main/java/com/atleta/demo/controller/TeamController.java`):
- `POST /api/v1/teams/logo`
- `GET /api/v1/teams/by-player/{playerUuid}`
- `GET /api/v1/teams/by-creator/{creatorUuid}`
- `GET /api/v1/teams/{teamId}/members/active`
- `POST /api/v1/teams`
- `DELETE /api/v1/teams/{teamId}`

Modelos/entidades:
- `Team`, `TeamMember`, `TeamStats`, `TeamInvite`.

Reglas:
- Nombre unico.
- Solo creador archiva.
- Logo max 3MB y tipos permitidos.

### 2.4 Ranking / Stats
Que hace:
- Calculo de ratings, historial, overall y leaderboard.

Endpoints (evidencia: `src/main/java/com/atleta/demo/controller/RatingController.java`):
- `POST /api/v1/ratings/update`
- `POST /api/v1/ratings/update-rotative-goalkeeper`
- `GET /api/v1/ratings/player/{playerProfileId}`
- `POST /api/v1/ratings/player/{playerProfileId}/initialize-base`
- `GET /api/v1/ratings/player/{playerProfileId}/role/{roleType}`
- `GET /api/v1/ratings/player/{playerProfileId}/priority/{priorityLevel}`
- `GET /api/v1/ratings/player/{playerProfileId}/history`
- `GET /api/v1/ratings/player/{playerProfileId}/history/role/{roleType}`
- `GET /api/v1/ratings/player/{playerProfileId}/history/period`
- `GET /api/v1/ratings/player/{playerProfileId}/statistics`
- `GET /api/v1/ratings/player/{playerProfileId}/statistics/role/{roleType}`
- `GET /api/v1/ratings/player/{playerProfileId}/overall`
- `GET /api/v1/ratings/leaderboard`

Modelos/entidades:
- `PlayerRating`, `RatingHistory`.

Reglas:
- Leaderboard ordenado por rating descendente desde `PlayerRatingRepository`.
- Se incluye resumen de resultados por jugador (`wins/losses/draws`) via `RatingHistoryRepository`.

## 3. Mapa por flujos (Frontend)

### 3.1 Paginas/rutas
Evidencia: `src/app/app.routes.ts`
- `/login`, `/register`
- `/player/profile`, `/player/onboarding`
- `/sessions/create`
- `/matches/history`, `/matches/create`, `/matches/venues/new`, `/matches/:id`, `/matches/:id/close`, `/matches/:id/mvp-vote`
- `/invitations`, `/leaderboard`, `/stats`, `/social`

### 3.2 Stores/state
Evidencia:
- `src/app/features/matches/stores/match.store.ts`
- `src/app/features/matches/stores/invitations.store.ts`
- `src/app/features/matches/stores/mvp-vote.store.ts`

### 3.3 Servicios API
Evidencia:
- `src/app/features/auth/services/auth-api.service.ts`
- `src/app/features/matches/services/matches-api.service.ts`
- `src/app/features/teams/services/team-api.service.ts`
- `src/app/features/ratings/services/ratings-api.service.ts`
- `src/app/features/ratings/services/leaderboard.service.ts`

### 3.4 Flujos clave y estado
- Login/registro: existente.
- Listado de partidos del jugador: existente.
- Crear partido: existente (`/matches/create` como flujo oficial).
- Confirmar asistencia: existente.
- Asignacion de equipos/colores: existente.
- Registrar eventos: existente.
- Finalizar partido: existente.
- Votar MVP: existente.
- Ranking leaderboard: existente, ahora con backend real (sin fallback demo).

Evidencia de consolidacion de creacion:
- `src/app/features/sessions/pages/create-session/create-session.page.ts`
- `src/app/features/sessions/pages/create-session/create-session.page.html`
- `src/app/features/matches/pages/matches-create/matches-create.page.ts`

## 4. Matriz FE?BE (tabla)

Leyenda:
- `OK`: FE llama y BE existe.
- `Falta`: FE llama pero BE no existe.
- `Huerfano`: BE existe pero FE no lo usa.

| Metodo | Endpoint | Estado | Evidencia FE | Evidencia BE |
|---|---|---|---|---|
| GET | `/api/v1/ratings/leaderboard` | OK | `src/app/features/ratings/services/ratings-api.service.ts`, `src/app/features/ratings/services/leaderboard.service.ts` | `src/main/java/com/atleta/demo/controller/RatingController.java` |
| GET | `/api/v1/teams/by-creator/{creatorUuid}` | OK | `src/app/features/teams/services/team-api.service.ts` | `src/main/java/com/atleta/demo/controller/TeamController.java` |
| GET | `/api/v1/matches/by-player/{playerUuid}` | OK | `src/app/features/matches/services/matches-api.service.ts` | `src/main/java/com/atleta/demo/controller/MatchController.java` |
| POST | `/api/v1/matches` | OK | `src/app/features/matches/services/matches-api.service.ts` | `src/main/java/com/atleta/demo/controller/MatchController.java` |
| POST | `/api/v1/matches/events` | OK | `src/app/features/matches/services/matches-api.service.ts` | `src/main/java/com/atleta/demo/controller/MatchController.java` |
| PUT | `/api/v1/matches/{matchId}/status` | OK | `src/app/features/matches/services/matches-api.service.ts` | `src/main/java/com/atleta/demo/controller/MatchController.java` |
| GET | `/api/v1/matches/{matchId}/mvp` | OK | `src/app/features/matches/services/matches-api.service.ts` | `src/main/java/com/atleta/demo/controller/MatchController.java` |
| POST | `/api/v1/matches/{matchId}/mvp/vote` | OK | `src/app/features/matches/services/matches-api.service.ts` | `src/main/java/com/atleta/demo/controller/MatchController.java` |

Problemas de consistencia detectados:
- DTO/enum de resultado sigue heterogeneo en backend (`MatchResultType` vs `MatchResult`), mitigado en FE con normalizacion.
- Seguridad dev/prod distinta en `SecurityConfig` (dev permite `/api/v1/**`).

## 5. Funcionalidades incompletas / bugs detectados (con evidencia)

1. Contrato de `MatchResult` backend sigue heterogeneo (`MatchResultType` y `MatchResult`)
- Estado: mitigado en FE con mapper canonico central y test unitario.
- Evidencia backend:
  - `c:\Users\Crist\OneDrive\Desktop\Atleta-Server\src\main\java\com\atleta\demo\enums\MatchResult.java`
  - `c:\Users\Crist\OneDrive\Desktop\Atleta-Server\src\main\java\com\atleta\demo\enums\MatchResultType.java`
- Evidencia frontend:
  - `src/app/features/matches/models/match-outcome.mapper.ts`
  - `src/app/features/matches/models/match-outcome.mapper.spec.ts`
  - `src/app/features/matches/services/match-history.service.ts`

2. Push token sync incompleto
- Evidencia: `src/app/features/matches/services/push-token-sync.service.ts`.

## 6. Faltantes propuestos (sin evidencia de implementacion)
- Unificar enum canonico de resultados en backend y exponerlo consistente en todos los endpoints.
- Implementar backend para registro de push tokens y conectar FE.

## Evidencia de cambios P0 aplicados en esta iteracion
- Backend leaderboard:
  - `c:\Users\Crist\OneDrive\Desktop\Atleta-Server\src\main\java\com\atleta\demo\controller\RatingController.java`
  - `c:\Users\Crist\OneDrive\Desktop\Atleta-Server\src\main\java\com\atleta\demo\service\RatingService.java`
  - `c:\Users\Crist\OneDrive\Desktop\Atleta-Server\src\main\java\com\atleta\demo\dto\response\LeaderboardEntryResponse.java`
  - `c:\Users\Crist\OneDrive\Desktop\Atleta-Server\src\main\java\com\atleta\demo\repository\RatingHistoryRepository.java`
- Backend teams/by-creator:
  - `c:\Users\Crist\OneDrive\Desktop\Atleta-Server\src\main\java\com\atleta\demo\controller\TeamController.java`
  - `c:\Users\Crist\OneDrive\Desktop\Atleta-Server\src\main\java\com\atleta\demo\service\TeamService.java`
- Frontend leaderboard real + sin mocks:
  - `src/app/features/ratings/services/leaderboard.service.ts`
  - `src/app/features/ratings/services/ratings-api.service.ts`
- Frontend normalizacion MatchResult:
  - `src/app/features/matches/services/match-history.service.ts`
  - `src/app/features/matches/models/match-outcome.mapper.ts`
  - `src/app/features/matches/models/match-outcome.mapper.spec.ts`
- `src/app/features/ratings/models/rating.models.ts`
- Frontend consolidacion de flujo de creacion:
  - `src/app/features/sessions/pages/create-session/create-session.page.ts`
  - `src/app/features/sessions/pages/create-session/create-session.page.html`
  - Removidos componentes/servicios/modelos wizard:
    - `src/app/features/sessions/components/match-creation-flow/*`
    - `src/app/features/sessions/services/create-match-wizard-state.service.ts`
    - `src/app/features/sessions/models/create-match-wizard.models.ts`
    - `src/app/features/sessions/components/player-card/*`
    - `src/app/features/sessions/components/team-column/*`
