# Integración de la revisión aprobada con main

16/11/2026. Solicitud del usuario: publicar en la rama principal.

Se integra `codex/profile-sections-navigation-20261116@f0d4209` (fuente visual aprobada `9bb209f`) con `origin/main@fb31693`. La integración usa el worktree aislado `codex/publish-main-app-20261116`; no altera los checkouts originales con cambios pendientes.

## Resolución de diferencias

- Se preservan configuración de beta, lógica de partidos/creación, accesibilidad compartida, estados 404/500 de Estadísticas, navegación y perfiles públicos presentes en main.
- Se conserva la presentación aprobada de Inicio, Perfil y Plantel, incluidos modal local, hexágono visible y ausencia de listados repetidos. El estado de plantel vacío conserva la corrección equivalente de ambas ramas.
- Se combinan memoria y pruebas de ambas líneas. Las pruebas heredadas de Inicio se adaptan al único acceso a Partidos en el footer; el rol del equipo usa la etiqueta «Capitán» del diseño final y se verifica con desplazamiento horizontal.

## Validación de la integración

- Build y lint correctos; únicamente aviso Stencil `empty-glob` preexistente.
- **271 unitarias correctas**.
- Selección de 76 E2E: **73 escenarios correctos** tras adaptar y volver a ejecutar los dos casos heredados. No se eliminaron comprobaciones: se validan foco/tamaño/visibilidad del acceso vigente y la celda del rol. Las otras 71 pasaron en la primera ejecución.
- **3 smoke E2E omitidos por el guard existente de credenciales E2E_USER_A/B**, en navegación de invitado y partido confirmado para ambos usuarios. No se simula acceso a beta ni se relaja ese requisito.
- `npm audit --omit=dev --audit-level=critical`: cero vulnerabilidades de runtime.
- Sin cambios respecto a main en configuración runtime, entornos, dependencias ni workflow de CI. Evidencias históricas de la rama aprobada conservadas.

Los pendientes de backend y beta del [roadmap](roadmap-frontend.md) permanecen abiertos. Este registro corresponde a integración y pruebas locales; el push no demuestra que una beta haya desplegado ni que sus flujos reales estén validados. No se publica backend en esta operación.
