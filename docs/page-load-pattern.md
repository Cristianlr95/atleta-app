# Page Load Pattern (Ionic Re-entry)

Patron aplicado para evitar cargas infinitas y datos stale al navegar/volver:

1. `ionViewWillEnter`: iniciar carga principal (no depender solo de `ngOnInit`).
2. `ionViewWillLeave`: cancelar streams activos (`takeUntil(leave$)`) y pausar timers.
3. `ngOnDestroy`: cleanup final (`leave$.complete()` + cancelar interval/subscriptions).
4. `loading/error/retry`: toda vista debe exponer estado claro y boton de reintento.
5. `PageLoadGuard`: dedupe de cargas concurrentes por entrada de vista.

Referencia:
- `src/app/core/utils/page-load-guard.ts`
- `src/app/features/social/pages/social.page.ts`
- `src/app/features/matches/pages/invitations/invitations.page.ts`
