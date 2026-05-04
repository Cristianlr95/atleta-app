# Refactor TODOs

- TODO [lint-prefer-inject]: migrate constructor DI to `inject()` in files flagged by lint (`@angular-eslint/prefer-inject`). Start with:
  - `src/app/core/services/navigation.service.ts:11`
  - `src/app/features/matches/services/match.service.ts:31`
  - `src/app/features/matches/stores/match.store.ts:35`
- TODO [lint-output-native]: rename native output alias in:
  - `src/app/features/social/components/friends-panel/friends-panel.component.ts:20`
- TODO [ionic-lifecycle]: move primary data load from `ngOnInit` to `ionViewWillEnter` for critical pages:
  - `src/app/features/matches/pages/matches-create/matches-create.page.ts`
- DONE [social-page-load]: `src/app/features/social/pages/social.page.ts` usa `ionViewWillEnter` con `PageLoadGuard` y cobertura de tabs/rutas.
- TODO [ionic-lifecycle-remaining]: migrate remaining page load paths still using `ngOnInit`:
  - `src/app/features/matches/pages/match-detail/match-detail.page.ts:153`
  - `src/app/features/matches/pages/venue-create/venue-create.page.ts:58`
- TODO [live-event-pruning]: add pruning strategy for processed live event ids to avoid unbounded map growth:
  - `src/app/features/matches/stores/match.store.ts:107`
