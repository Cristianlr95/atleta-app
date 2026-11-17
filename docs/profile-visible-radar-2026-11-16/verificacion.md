# Hexágono visible y eliminación de desgloses repetidos

16/11/2026. Rama `codex/profile-sections-navigation-20261116`, worktree aislado existente. Base `b2502a1`; implementación inicial `5335226`, revisión final probada `9bb209f31a34f754615010ad9a8a2e2e12ed297a`.

- Perfil con datos: hexágono visible por defecto, sin desplegable. Partidos, goles, asistencias y balance se sitúan debajo del gráfico, tanto en el orden del documento como en la disposición visual.
- Plantel: retirado «Ver promedios por posición» y su desglose visible.
- Perfil y modal: retiradas las listas visibles repetidas de las seis posiciones. Se conserva la alternativa textual para lectores de pantalla mediante contenido visualmente oculto; no se elimina información accesible ni se usa `aria-hidden`.
- El modal conserva posición y PJ debajo del gráfico y muestra también goles/asistencias como «Sin datos», porque la API actual no los entrega. No se han inventado valores ni cambiado el backend.
- La leyenda del gráfico se simplifica a «S/V: Sin valoración», sin invitar a buscar una lista que ya no es visible. En escritorio, Trofeos y Equipo se alinean al inicio para evitar el hueco generado por el perfil más alto.
- Carga, perfil nuevo, fallo de API y reintento mantienen sus estados. «Siempre visible» no implica mostrar valoraciones ficticias cuando no hay datos o falló su carga.

## Validación

Build y lint correctos; solo aviso Stencil `empty-glob` preexistente. **265 unitarias y 14 E2E seleccionadas correctas** (`13-profile-h3` y `16-team-squad`) a 390 y 1440 × 844 px.

Las pruebas exigen ausencia del desplegable de Perfil, gráfico visible sin interacción y métricas geométricamente debajo; verifican cero frente a ausencia, accesibilidad textual sin ocupar espacio visual, carga/vacío/500 y reintento, OVR, accesos al equipo y Ajustes, modal con teclado/Escape y retorno del foco. La prueba del gráfico visible falló antes de retirar el acordeón.

[Perfil móvil](profile-states/perfil-data-390.png) · [Perfil escritorio](profile-states/perfil-data-1440.png) · [Equipo](team-states/plantel-list-390.png) · [Modal sin desglose](team-states/player-modal-390.png). PNG y JSON conservan ruta, viewport, commit probado y estado de fuente limpia; las evidencias anteriores quedan intactas. [QA visual](../../design-qa.md).

Sin push, merge ni despliegue. La validación utiliza datos simulados locales; API de beta pendiente de cuenta, dispositivo físico y lector de pantalla sin verificar. [Pendientes de datos del plantel](../team-list-2026-11-16/backend-pendientes.md).
