# Perfil por secciones y navegación

16/11/2026. Opción visual 3 seleccionada, adaptada a la petición posterior de quitar accesos repetidos.

- Worktree: `C:/Users/Crist/Proyectos/Atleta/.worktrees/h0-h3-profile`.
- Rama: `codex/profile-sections-navigation-20261116`.
- Base: `6f9e0053345445b0add2d259528edd7dd97f663b` (H0/H3 y H5 previos).
- Commit de implementación probado: `0b47f3ac0aac6a583317cd19e2cbf51b89237d08`.
- Raíz y checkout original de atleta-app mantienen sus cambios previos. Sin push, merge o despliegue.

Identidad y OVR juntos, posiciones/estadísticas compactas, rendimiento desplegable nativo y trofeos/equipos planos. Dos columnas en escritorio. Se conservan fuentes e iconos instalados, explicación del OVR, cero válido frente a ausencia, carga/vacío/error y reintento, permisos y validación de foto/equipo. Sin nuevas dependencias ni endpoints.

[Mapa de navegación](navigation/mapa.md). Ajustes, Trofeos e integrantes permanecen accesibles; Perfil, Ranking y Partidos se concentran en la barra inferior.

## Resultados

| Comprobación | Resultado |
|---|---|
| `npm run build` | Correcto; aviso preexistente Stencil `empty-glob`. Un intento del sandbox falló copiando assets con EPERM; repetición fuera del sandbox con código 0. |
| `npm run lint` | Correcto |
| `npm test -- --watch=false --browsers=ChromeHeadless` | 262 correctas |
| Playwright `13-profile-h3` y `14-profile-navigation`, un worker | 10 correctas, 390/1440 × 844 px |
| Regresión de navegación | Reactivar temporalmente Perfil en PageNav de Estadísticas hizo fallar la prueba de unicidad. Restaurado y suite completa correcta. |
| Diff | Sin cambios de API, guards, autorización o persistencia; `git diff --check` correcto. |

Fixture existente `installH0H3Fixture`: sesión local Ana Torres, API interceptada, `environmentName=test`, ruta normal `/player/profile` sin demo. No son credenciales reales. Se verifican datos, carga bloqueada/liberada, perfil nuevo, HTTP 500 de overall/roles/historial y reintento correcto, OVR Enter/Escape, despliegue Enter, radar legible y seis valores textuales (Mediocampo 0 y cuatro «Sin valoración»), integrantes y Ajustes. Sin errores de consola en el recorrido con datos ni desbordamiento horizontal. Botón de integrantes completo sobre el footer inicial representativo.

## Evidencia

[Móvil](after/perfil-data-390.png) · [Escritorio](after/perfil-data-1440.png) · [Gráfico móvil](after/perfil-chart-390.png).

`after/`: 28 PNG y sus JSON con ruta, entorno, commit, cambios de fuente, viewport y respuestas. H0/H3 histórico en `docs/h0-h3-2026-11-16/` intacto. [QA visual](../../design-qa.md).

## Límites

API de beta pendiente: no hay cuenta de prueba confirmada. Faltan datos reales de perfiles nuevos/con historial y 500/recuperación en beta. Sin dispositivo físico ni lector de pantalla: móvil corresponde a Chromium emulado. Backend y estadísticas nuevas fuera de este cambio.
