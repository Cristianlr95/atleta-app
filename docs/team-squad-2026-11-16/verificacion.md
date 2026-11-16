# Plantel en fichas de jugador

Referencia aportada por el usuario: `C:/Users/Crist/AppData/Local/Temp/codex-clipboard-ccac2eac-66a0-4d3d-aadc-ba7180a276b7.png`, panel Squad Data de PES. Se toma su organización por jugador, adaptada a fuentes, iconos y colores de ATLETA.

[Copia de la referencia para revisión local](referencia.png).

Commit final probado: `fd33395f94fa879b99854d3399cd2c164454205e`, rama `codex/profile-sections-navigation-20261116`; base de la iteración `a53ff9d`. [Contexto, mapa y validación conjunta](../home-profile-2026-11-16/verificacion.md).

## Implementación

- Vista existente `/teams/:id`, accesible desde «Ver integrantes» en Perfil; sin otra ruta ni otra vista de plantel para el jugador normal.
- Dos fichas por fila en escritorio y una por fila en teléfono. Cada ficha muestra foto o inicial, alias, OVR, posición principal, rol del equipo, radar y seis valores textuales por posición.
- Radar existente reutilizado en modo integrado, sin marcos anidados adicionales. Sus consumidores anteriores mantienen la presentación predeterminada. Etiquetas SVG efectivas ≥11 px comprobadas en ambos tamaños.
- El desglose procede de `OverallRating.roleBreakdown`, ya disponible en la petición existente de cada jugador: sin endpoints, dependencias ni llamadas adicionales. Cero permanece válido; ausencia se muestra «Sin valoración».
- Un fallo HTTP 500 de valoración se muestra «No disponible», conserva al jugador y permite reintentar. Un 404 de valoración representa al jugador todavía sin valoración, según el contrato ya utilizado en H3.
- Corregido el plantel vacío: `forkJoin([])` antes completaba sin emitir y no mostraba el equipo. Ahora conserva la identidad y muestra «No hay integrantes activos».
- Se conserva «Ver jugador», regreso y navegación inferior; Perfil permanece activo como sección de origen. No se muestran nacionalidades, contratos, niveles ni atributos inventados.

## Evidencia y pruebas

[Escritorio](after/plantel-data-1440.png) · [Teléfono](after/plantel-data-390.png) · [Valores móvil](after/plantel-values-390.png) · [Vacío](after/plantel-empty-390.png) · [Error y reintento](after/plantel-error-390.png) · [Error parcial de valoración](after/rating-error-390.png).

Fixture local representativa: Ana con OVR 68 y dos posiciones valoradas, Leo con cero válido, Camila sin valoración ni posición. No son datos de beta. Capturas y JSON incluyen revisión y viewport; no utilizan `?demo=1`.

Seis E2E de plantel, a 390/1440 px: datos/teclado/perfil público; carga/vacío/500 y recuperación; fallo parcial de valoración y recuperación. Se comprueba desbordamiento, legibilidad y ausencia de errores JavaScript no capturados en el recorrido con datos. Las seis unitarias de TeamDetailPage pasan. Al desactivar temporalmente la rama del plantel vacío, su prueba falla; restaurada la fuente, vuelve a pasar. La suite completa consta de 263 pruebas correctas y la selección E2E conjunta de 29 correctas; build/lint correctos.

## Límites

La referencia se adapta, no se reproduce literalmente: no hay mapa táctico o calor porque el contrato revisado no entrega coordenadas ni zonas de ocupación; no se dibujan posiciones ficticias. Las peticiones por jugador ya existían: un plantel grande conserva ese coste previo. Beta pendiente de cuenta y datos; sin revisión de dispositivo físico o lector de pantalla. No hay cambios backend ni publicación.
