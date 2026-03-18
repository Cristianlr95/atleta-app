# Feature Finalize + XP - Paso 0 (Auditoria rapida)

Fecha: 2026-02-25

## Backend (Spring) - estado actual detectado

### Entidades y enums existentes
- `src/main/java/com/atleta/demo/entity/Match.java`
  - Tiene `estado` con enum `MatchStatus` y `startedAt`.
- `src/main/java/com/atleta/demo/enums/MatchStatus.java`
  - Estados: `CREADO`, `INICIADO`, `FINALIZADO`, `INVALIDO`.
- `src/main/java/com/atleta/demo/entity/MatchPlayer.java`
  - Incluye `position`, `rol` (`JUGADOR|CAPITAN|DT`) y `confirmado`.
- `src/main/java/com/atleta/demo/entity/MatchEvent.java`
  - Eventos `GOL/ASISTENCIA`, confirmacion cruzada home/away.
- `src/main/java/com/atleta/demo/entity/PlayerPosition.java`
  - XP por posicion ya existe (`xp`).
- `src/main/java/com/atleta/demo/entity/PlayerHistory.java`
  - Historial inmutable existe (match/user/team/position/goles/asistencias/resultado/xp).

### Servicios/controladores existentes
- `src/main/java/com/atleta/demo/controller/MatchController.java`
  - Endpoints para crear match, cambiar estado, registrar/confirmar eventos, SSE live.
- `src/main/java/com/atleta/demo/service/MatchService.java`
  - Ya cambia estado a `FINALIZADO` y ejecuta actualizacion de ratings legacy.
- `src/main/java/com/atleta/demo/service/MatchLiveEventService.java`
  - SSE existente, hoy publica cambios de invitaciones (no `MATCH_FINALIZED`).
- `src/main/java/com/atleta/demo/controller/PlayerProfileController.java`
  - Endpoints para XP por posicion manual (`/experience`) y posiciones del jugador.

### SQL/migraciones
- `src/main/resources/db/migration/V001__create_initial_schema.sql`
  - Tablas existentes: `matches`, `match_players`, `match_events`, `player_positions`, `player_history`.
  - `matches` ya tiene `estado` con `FINALIZADO/INVALIDO` y `started_at`.

### Gaps detectados para la feature
1. No existe endpoint dedicado `/matches/{id}/finalize` con reglas de validez del match.
2. `player_history` no tenia constraint unico `(match_id, user_id)` para idempotencia fuerte.
3. `matches` no tenia snapshot de cierre (finalized_at, score final, validation_status/reason).
4. No hay motor XP Pokemon por posicion desacoplado/testeable.
5. Live SSE no publica evento de cierre de partido.

## Frontend (Ionic/Angular) - estado actual detectado

### Stores/servicios/rutas relevantes
- `src/app/features/matches/stores/match.store.ts`
  - Fuente principal de estado de detalle de partido y participantes.
- `src/app/features/matches/services/match-live.service.ts`
  - Live por SSE/polling, hoy sincroniza invitaciones/estado.
- `src/app/features/matches/services/matches-api.service.ts`
  - API client de matches, sin endpoint `finalize` aun.
- `src/app/features/matches/pages/match-detail/match-detail.page.ts`
  - Ya tiene accion de finalizar local (legacy), no integrada a backend finalize con XP.
- `src/app/features/social/services/social-facade.service.ts`
  - Flujo social que se sincroniza con match/invitaciones.

### Gaps detectados frontend
1. Falta flujo de finalize con modal de previsualizacion XP y confirmacion final.
2. Falta render de resumen final + XP por jugador post-finalizacion.
3. Falta panel en profile para XP por posicion + ultimos 5 partidos de `player_history`.

## Puntos de integracion para siguientes pasos
- Backend:
  - `MatchController` (nuevo endpoint finalize + preview opcional)
  - `MatchService` (orquestacion finalize)
  - Nuevo `XPService` (motor puro)
  - `PlayerHistoryRepository` + `PlayerPositionRepository`
  - `MatchLiveEventService` (evento `MATCH_FINALIZED`)
- Frontend:
  - `MatchesApiService` (finalize/preview endpoints)
  - `MatchStore` (accion finalize idempotente + patch live)
  - `match-detail.page` (modal + resumen final)
  - `player-profile.page` (XP por posicion + historial reciente)
