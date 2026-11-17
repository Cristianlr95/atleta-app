# Datos pendientes para completar la lista del equipo

La parte visual de Perfil y Plantel fue aprobada por el usuario el 16/11/2026, sobre la fuente `9bb209f`. Estos pendientes permanecen abiertos: no se han inventado cifras ni ampliado el backend. [Roadmap y checklist de beta](../roadmap-frontend.md).

1. **BE-PLANTEL-01 — local, 17/11.** Goles y asistencias con el equipo y totales se entregan en el DTO desde historial finalizado y se muestran en tabla/ficha; se conservan cero y ausencia. Validación beta pendiente. [Contrato de goles](../team-goals-2026-11-17/verificacion.md).
2. **BE-PLANTEL-02 — implementado localmente.** `teamMatches` cuenta el historial finalizado del jugador con el equipo; la restricción de unicidad por jugador y partido evita duplicados. «PJ totales» sigue procediendo de `OverallRating.totalMatchesPlayed`; ambas fuentes pueden tener coberturas diferentes. Validación con datos reales y beta pendiente.
3. **BE-PLANTEL-03 — pendiente.** Definir la fuente de resultados válidos y participación para estos acumulados, conservando autorización y jugadores confirmados. Diferenciar cero registrado, ausencia de historial y fallo de carga. Mantener compatibilidad con los consumidores existentes.
4. **BE-PLANTEL-04 — pendiente.** Para la beta, comprobar con datos reales el conjunto de integrantes activos y su OVR. Confirmar el criterio de promedio: se incluyen ceros válidos y se excluyen valores ausentes/errores con cobertura visible. Si se necesita un OVR oficial persistido o una instantánea histórica, calcularlo/versionarlo en backend; el actual es una media de presentación.

El hexágono usa las medias por posición de `roleBreakdown`, no seis copias del OVR escalar. El endpoint de valoración existente ya entrega ese desglose. La consulta por integrante es la preexistente; no se añadieron peticiones para intentar derivar goles de historiales privados.
