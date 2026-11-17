# Datos pendientes para completar la lista del equipo

La parte visual de Perfil y Plantel fue aprobada por el usuario el 16/11/2026, sobre la fuente `9bb209f`. Estos pendientes permanecen abiertos: no se han inventado cifras ni ampliado el backend. [Roadmap y checklist de beta](../roadmap-frontend.md).

1. **BE-PLANTEL-01 — local, 17/11.** Goles y asistencias con el equipo y totales se entregan en el DTO desde historial finalizado y se muestran en tabla/ficha; se conservan cero y ausencia. Validación beta pendiente. [Contrato de goles](../team-goals-2026-11-17/verificacion.md).
2. **BE-PLANTEL-02 — implementado localmente.** `teamMatches` cuenta el historial finalizado del jugador con el equipo; la restricción de unicidad por jugador y partido evita duplicados. «PJ totales» sigue procediendo de `OverallRating.totalMatchesPlayed`; ambas fuentes pueden tener coberturas diferentes. Validación con datos reales y beta pendiente.
3. **BE-PLANTEL-03 — verificado localmente.** Fuente y contrato definidos; comprobados participantes/eventos confirmados en el cierre, filtro de finalizados, JWT requerido y error/reintento. Los historiales antiguos no fueron auditados individualmente. [Evidencia](../plantel-03-2026-11-17.md).
4. **BE-PLANTEL-04 — parcial.** Prueba local confirma promedio con cero, exclusión de errores y cobertura. Pendiente contraste con datos reales: la cuenta de prueba no tiene sesión abierta. El promedio es de presentación, sin persistencia oficial. El DTO de integrantes asigna 65 de respaldo sin rating; la vista no lo usa para su promedio. [Evidencia](../plantel-04-2026-11-17.md).

El hexágono usa las medias por posición de `roleBreakdown`, no seis copias del OVR escalar. El endpoint de valoración existente ya entrega ese desglose. La consulta por integrante es la preexistente; no se añadieron peticiones para intentar derivar goles de historiales privados.
