# Baseline (Paso 0)

Fecha: 2026-02-25  
Repo: `c:\Users\Crist\Proyectos\Atleta\atleta-app`

## Comandos ejecutados

```bash
npm run build
npm run lint
npm run test -- --watch=false --browsers=ChromeHeadless
node tools/audit/run-audit.js
```

## Resultado build

- `npm run build`: **OK**.
- Output principal: `www/`.
- Warning no bloqueante de Stencil (`empty-glob`).

## Resultado lint

- `npm run lint`: **FAIL** (`33` errores).
- Tipos de error:
  - `@angular-eslint/prefer-inject` (mayoria, multiples servicios/componentes).
  - `@angular-eslint/no-output-native` en:
    - `src/app/features/social/components/friends-panel/friends-panel.component.ts:20`.

## Resultado tests (unit)

- `npm run test -- --watch=false --browsers=ChromeHeadless`: **FAIL**.
- Resumen: `30 executed`, `25 success`, `5 failed`.
- Specs fallando:
  1. `src/app/features/sessions/pages/create-session/create-session.page.spec.ts`
  2. `src/app/app.component.spec.ts`
  3. `src/app/features/ratings/pages/leaderboard/leaderboard.page.spec.ts`
  4. `src/app/features/user/pages/player-profile/player-profile.page.spec.ts`
  5. `src/app/features/matches/pages/matches-history/matches-history.page.spec.ts`
- Causa principal:
  - Falta provider de `HttpClient`.
  - Falta provider de `APP_CONFIG`.

## Rutas/pantallas detectadas

Fuente: `src/app/app.routes.ts`

- `/login`
- `/register`
- `/player/profile`
- `/player/onboarding`
- `/demo/position-picker`
- `/sessions/create`
- `/matches/history`
- `/matches/create`
- `/matches/venues/new`
- `/matches/:id`
- `/invitations`
- `/leaderboard`
- `/ranking` (redirect)
- `/stats`
- `/social`

## Metricas de auditoria

Fuente: `tools/audit/audit-report.json`

- `pages`: `14`
- `pagesWithNgOnInit`: `10`
- `pagesWithIonViewWillEnter`: `1`
- `filesWithSubscribe`: `12`
- `filesWithSubscribeWithoutTeardown`: `10`
- `navigationSafeCalls`: `48`
- `directRouterNavigateOutsideNavigationService`: `0`
- `liveFilesWithPollingHints`: `1` (`match-live.service.ts`)

## Scripts de auditoria

- `tools/audit/run-audit.js`
  - Escanea:
    - `ngOnInit` en pages
    - `ionViewWillEnter` en pages
    - `.subscribe(` con/sin hints de teardown
    - timers/polling en servicios live
    - `router.navigate` vs `NavigationService.safeNavigate`
  - Genera `tools/audit/audit-report.json`.

## Hallazgos iniciales criticos

1. Infra de tests incompleta para specs standalone (providers faltantes).
2. Carga por lifecycle Ionic insuficiente (10 paginas dependen de `ngOnInit`).
3. Alto numero de suscripciones sin teardown explicito.
4. Lint con deuda activa (no bloquea build, si bloquea estandar de calidad).
