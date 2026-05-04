# Feedback System para Futuras Tareas de Codex

## Objetivo
Mantener continuidad real del proyecto, evitar duplicacion y obligar a que cada cambio parta del estado existente del codigo.

## Protocolo obligatorio antes de implementar
1. Leer `docs/memory.md`.
2. Leer `docs/funcionalidades.md`.
3. Leer `docs/architecture.md`.
4. Revisar `src/app/app.routes.ts` para confirmar que la pantalla o flujo realmente exista.
5. Revisar si el feature ya tiene pagina, componente, servicio, store, modelo y test.
6. Revisar `src/app/shared/ui` antes de crear componentes visuales nuevos.
7. Revisar `core/constants/api-endpoints.ts` y los servicios API antes de inventar contratos.

## Reglas de implementacion
- No duplicar componentes ni logica visual si ya existe una variante reusable.
- No declarar como "implementado" algo que no exista en el codigo.
- Si una pantalla existe pero no esta conectada por routing, documentarla como parcial u huerfana.
- Si una funcionalidad usa modo demo, dejarlo explicito en la documentacion.
- Si una accion depende de backend inexistente o incompleto, marcarla como parcial o pendiente.

## Reglas de reutilizacion
- Priorizar reutilizacion de `shared/ui/metallic-*`, stores existentes, `ApiService`, `NavigationService`, `ErrorMapperService` y `NotificationService`.
- Antes de crear un flujo nuevo en `matches`, revisar `MatchService`, `MatchStore`, `InvitationsStore` y `MvpVoteStore`.
- Antes de crear UI social, revisar si ya esta en `features/social`.

## Reglas de documentacion despues de cada cambio
1. Actualizar `docs/memory.md` si cambia el estado general, riesgos o deuda tecnica.
2. Actualizar `docs/funcionalidades.md` si cambia el estado de una funcionalidad.
3. Actualizar `docs/architecture.md` si cambia estructura, stack o patron.
4. Actualizar `docs/deployment.md` si cambia entorno, build o release.
5. Registrar cambios relevantes directamente en el documento vivo afectado.

## Checklist minimo de cierre por tarea
- [ ] Se leyeron `memory.md`, `funcionalidades.md` y `architecture.md`
- [ ] Se verifico si lo pedido ya existia total o parcialmente
- [ ] Se reutilizaron componentes y servicios existentes cuando correspondia
- [ ] No se duplico UI ni logica ya presente
- [ ] Se actualizaron documentos impactados
- [ ] Se registro hallazgo o cambio en el documento vivo correspondiente

## Hallazgos que siempre deben recordarse
- `matches` es el dominio mas sensible y mas acoplado.
- `social` tiene codigo existente, pero hoy su ruta esta redirigida.
- `stats` no esta desarrollada mas alla de una vista placeholder.
- La duplicacion funcional entre `matches-history` y el tab de historial fue resuelta manteniendo `matches-hub` como fuente unica.
- El sistema de notificaciones/push esta incompleto.
