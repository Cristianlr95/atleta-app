# Backlog ATLETA (priorizado)

Fecha: 2026-03-02

| ID | Feature/Tarea | Dominio | Prioridad | Estado | Evidencia | DoD |
|---|---|---|---|---|---|---|
| BLK-01 | Leaderboard real `GET /api/v1/ratings/leaderboard` | Ranking/Stats | P0 | existente | BE: `RatingController`, `RatingService`; FE: `ratings-api.service.ts`, `leaderboard.service.ts` | Endpoint 200 con lista ordenada; ranking FE renderiza sin mocks/fallback demo |
| BLK-02 | Resolver `teams/by-creator` FE?BE | Teams | P0 | existente | BE: `TeamController.getTeamsByCreator`; FE: `team-api.service.ts` | Llamada FE a `/teams/by-creator/{creatorUuid}` responde sin 404 |
| BLK-03 | Mismatch `MatchResult` (`GANADO/PERDIDO` vs `VICTORIA/DERROTA`) | Matches/Stats | P0 | existente | Mapper central: `match-outcome.mapper.ts`; test: `match-outcome.mapper.spec.ts`; uso: `match-history.service.ts` | No hay conversiones implícitas; todo valor API se normaliza de forma explícita antes de usarse en UI |
| BLK-04 | Consolidar flujo de creacion (dejar un solo entrypoint) | Matches/UX | P0 | existente | Flujo oficial `/matches/create` + limpieza de wizard: eliminados `sessions/components/match-creation-flow/*`, `sessions/services/create-match-wizard-state.service.ts`, `sessions/models/create-match-wizard.models.ts`, `sessions/components/player-card/*`, `sessions/components/team-column/*` | Un único flujo mantenido y sin código muerto del wizard |
| CORE-01 | Endurecer cierre de partido y checklist de consistencia | Matches/Events | P1 | existente | `match-close.page.ts`, `MatchService.changeMatchStatus` | Cierre consistente con score/eventos/actor validados y mensajes claros |
| CORE-02 | Confirmaciones e invitaciones live robustas | Social/Matches | P1 | existente | `InvitationsStore`, `MatchStore`, `SocialService`, SSE `/matches/{id}/live` | Estado sincronizado en cliente tras aceptar/rechazar y refresco live |
| CORE-03 | MVP competitivo y ventana operativa | MVP | P1 | existente | `MatchMvpService`, `match-mvp-vote.page.ts`, `mvp-vote.store.ts` | Votacion disponible solo en ventana valida y cierre al expirar |
| CORE-04 | Registro real de push tokens | Notifications | P1 | implementado | `push-token-sync.service.ts`, `/social/notifications/push-tokens` | Endpoint BE + persistencia + sync FE implementados y cubiertos por tests |
| IMP-01 | Normalizar seguridad dev/prod | Auth/Seguridad | P2 | parcial | `SecurityConfig.java`; `JwtAuthenticationIntegrationTest` cubre ratings sin JWT y leaderboard con JWT; `ApiContractSmokeTest` cubre JWT subject en equipos/partidos/eventos/MVP | Reglas de auth equivalentes para pruebas funcionales en dev/staging |
| IMP-02 | Reducir endpoints huerfanos o asignar owner | Arquitectura | P2 | parcial | Controllers BE vs uso FE en `src/app/features/**/services` | Lista de endpoints sin consumo reducida o documentada con plan |
| IMP-03 | Contratos FE?BE smoke automatizados | Calidad | P2 | parcial | FE: `src/app/core/contracts/api-contracts.smoke.spec.ts`; BE: `ApiContractSmokeTest` valida controllers de auth, matches/MVP, teams y ratings; falta smoke E2E opcional con servicios levantados | Suite valida auth, matches, teams, ratings y mvp contra backend |

## Prioridad operativa P1
1. Validar envio push remoto con proveedor/dispositivo real.
2. Avanzar con smoke contracts (`IMP-03`) para prevenir regresiones FE?BE.
3. Completar autorizacion de dominio restante en social/perfil (`IMP-01`).
