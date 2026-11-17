# Equipo: promedio, lista y ficha modal

16/11/2026. Sustituye la propuesta anterior de fichas permanentes por la organización solicitada: resumen del equipo arriba, lista completa debajo y detalle del jugador sin abandonar la sección.

- Rama: `codex/profile-sections-navigation-20261116`, worktree `C:/Users/Crist/Proyectos/Atleta/.worktrees/h0-h3-profile`.
- Base: `dee6916` (entrega anterior). Commit probado: `c00b1b3d677b3b394ee7679f24f2e0e02028ccc1`.
- Se modifican TeamDetailPage (TS, HTML, SCSS y spec), E2E del plantel y destino de capturas de regresión H3. No hay cambios backend, rutas nuevas, dependencias, push ni integración.
- [Referencia aportada](referencia.png), conservada para revisión local.

## Resultado

OVR del equipo y hexágono en la cabecera. La media escalar usa los OVR disponibles del plantel activo: suma / número de valorados. El cero cuenta; ausencia o error no se convierten en cero. Se indica cuántos jugadores contribuyen. Sin valorados se muestra «Sin valoración».

Los seis ejes conservan su significado: cada posición promedia sus valores disponibles, sin rellenar posiciones ausentes. El OVR escalar y los promedios por posición son métricas diferentes. Ejemplo de fixture: Ana 68.1, Leo 0 y Camila sin valoración → media 34.05, mostrada 34.1, con cobertura 2 de 3.

La lista muestra todos los integrantes con nombre/alias, posición, OVR, PJ totales, goles, asistencias y rol. En móvil el desplazamiento queda dentro de la tabla, con el jugador fijo y ayuda visible. PJ totales procede de `OverallRating.totalMatchesPlayed`: corresponde a la trayectoria completa, no a partidos exclusivos del equipo. Goles/asistencias aparecen «Sin datos» porque el contrato revisado no entrega esos valores. [Pendiente backend](backend-pendientes.md).

Seleccionar el nombre abre un modal Ionic con nombre, OVR y hexágono contiguos, posición, PJ y alternativa textual de las seis posiciones. El cierre con botón o Escape devuelve el foco al mismo jugador; no navega a `/players/:uuid`. Se conservan la ruta del equipo y su lista. El foco permanece dentro del modal al tabular. Valoración cero, ausencia y fallo HTTP permanecen diferenciados.

## Comprobaciones

| Comprobación | Resultado |
|---|---|
| Build y lint | Correctos; aviso Stencil `empty-glob` preexistente |
| Angular | 265 correctas, incluidas ocho de TeamDetailPage |
| Playwright | 16 correctas (`13-profile-h3`, `14-profile-navigation`, `16-team-squad`) a 390/1440 × 844 px; una regresión existente adicional del acceso desde Perfil correcta |
| Promedio | Probados cero, ausencia, distinto número de valores por eje y plantel sin valoraciones. Alterar temporalmente el denominador hace fallar la prueba; restaurada la fórmula, vuelve a pasar |
| Modal | Apertura con Enter, URL conservada, OVR y gráfico contiguos, etiqueta SVG efectiva ≥11 px, Tab confinado, Escape, foco devuelto y botón de cierre |
| Estados | Carga, plantel vacío, 500 del equipo y reintento; 500 parcial de valoración y recuperación; jugador sin posición/valoración |
| Tabla | Desplazamiento horizontal por teclado en móvil y sin desbordamiento de la página |

Datos simulados mediante el fixture existente, sin cuenta real ni `?demo=1`. Los JSON acompañantes registran ruta, commit, fuente limpia, viewport y estado. Se inspeccionaron las capturas completas, cabecera, lista y modal; no se sobrescriben capturas históricas de iteraciones anteriores.

[Equipo móvil](after/plantel-list-390.png) · [Equipo escritorio](after/plantel-list-1440.png) · [Modal móvil](after/player-modal-390.png) · [Modal escritorio](after/player-modal-1440.png) · [Sin valoración](after/unrated-modal-390.png). [QA visual](../../design-qa.md).

## Límites

Beta pendiente de cuenta de prueba. Dispositivo físico y lector de pantalla no verificados. Goles/asistencias individuales y PJ exclusivos del equipo pendientes de contrato de API. El promedio se calcula para la presentación local; no se persiste como valoración oficial del equipo.
