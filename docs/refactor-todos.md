# Refactor TODOs

- DONE [lint-prefer-inject]: migrados los puntos iniciales a `inject()`:
  - `src/app/core/services/navigation.service.ts`
  - `src/app/features/matches/services/match.service.ts`
  - `src/app/features/matches/stores/match.store.ts`
- DONE [lint-output-native]: `FriendsPanelComponent` reemplazo `search` por `searchChange`.
- DONE [ionic-lifecycle]: paginas criticas de partidos cargan por `ionViewWillEnter` y deduplican entradas cuando aplica.
  - `src/app/features/matches/pages/matches-create/matches-create.page.ts`
  - `src/app/features/matches/pages/match-detail/match-detail.page.ts`
  - `src/app/features/matches/pages/venue-create/venue-create.page.ts`
- DONE [social-page-load]: `src/app/features/social/pages/social.page.ts` usa `ionViewWillEnter` con `PageLoadGuard` y cobertura de tabs/rutas.
- DONE [live-event-pruning]: `MatchStore` limita IDs de eventos live procesados y tiene cobertura unitaria.
