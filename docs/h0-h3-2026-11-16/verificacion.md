# H3 · Perfil — verificación local

Fecha: 16/11/2026. Preparado y verificado en worktree local para revisión. Sin push, merge ni despliegue.

## Revisiones

- Rama frontend: codex/h0-h3-profile-20261116. Worktree: C:/Users/Crist/Proyectos/Atleta/.worktrees/h0-h3-profile.
- Base: 6fcd35b00356ed26bbb303f024ce6d82aa779176 (H5 aprobado), descendiente de origin/develop d85e0402a5484af98c77a5609acedeccf444fbaf, confirmado por fetch.
- H0 completado y guardado antes de cambiar src: 6f0d44b24478ba918c47d11041fc22faf3a74719. [Inventario y línea base](linea-base.md): 32 estados, 31 capturas nuevas y una reutilizada, más dos detalles del gráfico.
- Revisión probada final: 30302471c603fd819a0a9c1c0ab4f4bb9b21ac6f. Todos los metadatos posteriores acreditan esa revisión y src sin cambios locales. Los commits posteriores de entrega contienen documentación/evidencia.
- Roadmap raíz aislado: codex/h0-h3-roadmap-20261116, base 3e0ea5b049d1a6d74a62a1463fbb58a5f324acb6. Checkouts originales preservados: raíz main@b559c40 y atleta-app main@fdbf643, con sus cambios pendientes.

## Resultado

- OVR se presenta una sola vez. Se retiró el bloque «Nivel general» que repetía el valor. La explicación sigue accesible con Enter/Escape y tiene texto legible sobre fondo oscuro. No se modificaron fórmulas.
- Una posición ausente indica «Sin valoración» en la alternativa textual; el gráfico la marca S/V y omite sus puntos del polígono. Un cero numérico real se conserva como 0 tanto en gráfico como en texto.
- Perfil nuevo con onboarding completo, sin ratings/partidos: «Aún no hay estadísticas», sin error ni métricas provisionales. No se utilizan datos demo en /player/profile.
- HTTP 500 en cada fuente de ratings (overall, roles, history) muestra «No pudimos cargar las estadísticas.» y un botón «Reintentar estadísticas». El reintento desde pantalla, también con Enter, restaura los datos y retira el error.
- Perfil exige el historial de ratings para sus métricas; el modo opcional de MatchHistoryService conserva el fallback de Inicio, Partidos y la página de estadísticas. Esto evita convertir un fallo de historial en ceros de competición sin alterar esos consumidores.
- Gráfico ampliado y lista semántica de seis posiciones. A 390/1440 px el tamaño efectivo de los rótulos SVG supera o iguala 11 px y la lista tiene 14 px; se verificó el gráfico completo por encima del footer y la ausencia de desbordamiento horizontal.
- Ajustes abre /player/settings con teclado. Trofeos y Equipos se verificaron como secciones del Perfil: trofeo representativo visible y apertura de integrantes con Enter/aria-expanded, además de los vacíos sin trofeos ni equipo.

## Contrato: ausencia frente a cero

Se contrastó el backend de referencia origin/develop@0de73dca2d3c1667ca8c797d9f4c28b01fa77c9e, sin modificarlo:

1. RatingController.getOverallRating construye roleBreakdown como Map<RoleType, BigDecimal> recorriendo únicamente los ratings existentes. Un rol sin fila queda omitido. El tipo frontend se corrigió a Partial<Record<RoleType, number>>.
2. PlayerRating.currentRating es no nulo y admite 0.00 mediante @DecimalMin. Por tanto, una clave/registro presente con 0 es válida; no se puede utilizar una comprobación de veracidad para detectarla.
3. RatingService.calculateCompleteOverall lanza PlayerNotFoundException cuando no hay calificaciones; RatingController la traduce a 404. Ese 404 de overall es vacío esperado para el perfil nuevo. Los errores 500 y de conexión se mantienen como error, con reintento.
4. Las pruebas utilizan ATAQUE=79 y MEDIOCAMPO=0, omitiendo otras cuatro posiciones, tanto en roleBreakdown como en los registros por rol. No se fabrican ceros para completar los seis ejes.

## Pruebas

| Comprobación | Resultado |
|---|---|
| Unitarias focalizadas de Perfil, hexágono e historial | 16 correctas |
| Suite unitaria Angular completa | 262 correctas, sin omisiones |
| Nuevos E2E H3 a 390/1440 | 6 correctos; cada prueba de error recorre overall, roles e history y sus recuperaciones |
| E2E existentes seleccionados (Perfil, Inicio, historial, estadísticas) | 7 correctos |
| Ejecución final E2E combinada | 13 correctos, sin omisiones |
| npm run build | Correcto, sin error de presupuesto de estilos; aviso Stencil empty-glob preexistente |
| npm run lint | Correcto |
| Revisión del diff | Contratos, fallback por consumidor, manejo de errores, accesibilidad y alcance revisados; sin bloqueos encontrados |

Las nuevas regresiones se ejecutaron antes de la corrección: seis fallos funcionales en Perfil/hexágono; la prueba adicional del historial estricto falló antes de implementarse y después pasó. En E2E se corrigió un selector de prueba que conservaba el nombre «Ver integrantes» después de abrir el panel, cuyo nombre pasa correctamente a «Ocultar integrantes».

Reproducción desde el worktree (iniciar Angular en 8101 antes de los E2E):

~~~powershell
npm run start -- --host 127.0.0.1 --port 8101
# En otra terminal del mismo worktree:
$env:E2E_BASE_URL='http://127.0.0.1:8101'
npm run e2e -- e2e/13-profile-h3.spec.ts e2e/08-match-flow-captures.spec.ts --grep 'H3|perfil|historial móvil|Inicio permite recuperar la actividad|estadísticas anuncia' --workers=1
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
npm run lint
~~~

## Evidencia posterior

Todas las capturas siguientes usan la ruta normal y cuenta sintética con API interceptada, environmentName=test y uploads desactivados. Los JSON registran ruta, entorno, revisión, viewport, estado y la secuencia acumulada de respuestas de la sesión.

| Viewport | Estado / sección | Captura | Metadatos |
|---|---|---|---|
| 390 × 844 | chart | [Imagen](after/perfil-chart-390.png) | [JSON](after/perfil-chart-390.json) |
| 390 × 844 | data | [Imagen](after/perfil-data-390.png) | [JSON](after/perfil-data-390.json) |
| 390 × 844 | empty | [Imagen](after/perfil-empty-390.png) | [JSON](after/perfil-empty-390.json) |
| 390 × 844 | empty-teams-trophies | [Imagen](after/perfil-empty-teams-trophies-390.png) | [JSON](after/perfil-empty-teams-trophies-390.json) |
| 390 × 844 | error-history | [Imagen](after/perfil-error-history-390.png) | [JSON](after/perfil-error-history-390.json) |
| 390 × 844 | error-overall | [Imagen](after/perfil-error-overall-390.png) | [JSON](after/perfil-error-overall-390.json) |
| 390 × 844 | error-roles | [Imagen](after/perfil-error-roles-390.png) | [JSON](after/perfil-error-roles-390.json) |
| 390 × 844 | ovr-explanation | [Imagen](after/perfil-ovr-explanation-390.png) | [JSON](after/perfil-ovr-explanation-390.json) |
| 390 × 844 | recovered-history | [Imagen](after/perfil-recovered-history-390.png) | [JSON](after/perfil-recovered-history-390.json) |
| 390 × 844 | recovered-overall | [Imagen](after/perfil-recovered-overall-390.png) | [JSON](after/perfil-recovered-overall-390.json) |
| 390 × 844 | recovered-roles | [Imagen](after/perfil-recovered-roles-390.png) | [JSON](after/perfil-recovered-roles-390.json) |
| 390 × 844 | teams-trophies | [Imagen](after/perfil-teams-trophies-390.png) | [JSON](after/perfil-teams-trophies-390.json) |
| 390 × 844 | text-values | [Imagen](after/perfil-text-values-390.png) | [JSON](after/perfil-text-values-390.json) |
| 1440 × 844 | chart | [Imagen](after/perfil-chart-1440.png) | [JSON](after/perfil-chart-1440.json) |
| 1440 × 844 | data | [Imagen](after/perfil-data-1440.png) | [JSON](after/perfil-data-1440.json) |
| 1440 × 844 | empty | [Imagen](after/perfil-empty-1440.png) | [JSON](after/perfil-empty-1440.json) |
| 1440 × 844 | empty-teams-trophies | [Imagen](after/perfil-empty-teams-trophies-1440.png) | [JSON](after/perfil-empty-teams-trophies-1440.json) |
| 1440 × 844 | error-history | [Imagen](after/perfil-error-history-1440.png) | [JSON](after/perfil-error-history-1440.json) |
| 1440 × 844 | error-overall | [Imagen](after/perfil-error-overall-1440.png) | [JSON](after/perfil-error-overall-1440.json) |
| 1440 × 844 | error-roles | [Imagen](after/perfil-error-roles-1440.png) | [JSON](after/perfil-error-roles-1440.json) |
| 1440 × 844 | ovr-explanation | [Imagen](after/perfil-ovr-explanation-1440.png) | [JSON](after/perfil-ovr-explanation-1440.json) |
| 1440 × 844 | recovered-history | [Imagen](after/perfil-recovered-history-1440.png) | [JSON](after/perfil-recovered-history-1440.json) |
| 1440 × 844 | recovered-overall | [Imagen](after/perfil-recovered-overall-1440.png) | [JSON](after/perfil-recovered-overall-1440.json) |
| 1440 × 844 | recovered-roles | [Imagen](after/perfil-recovered-roles-1440.png) | [JSON](after/perfil-recovered-roles-1440.json) |
| 1440 × 844 | teams-trophies | [Imagen](after/perfil-teams-trophies-1440.png) | [JSON](after/perfil-teams-trophies-1440.json) |
| 1440 × 844 | text-values | [Imagen](after/perfil-text-values-1440.png) | [JSON](after/perfil-text-values-1440.json) |

## Límites y pendientes

- API/beta y revisión desplegada sin validar: no hay cuenta de prueba confirmada. Los datos representativos se simulan en el límite HTTP, manteniendo guards y navegación reales de Angular.
- Dispositivo físico, lector de pantalla real y auditoría WCAG completa pendientes. La prueba de teclado y la lista semántica no los sustituyen.
- No se probó el envío de invitaciones, eliminación de equipos, cambios de contraseña ni cargas de imágenes; se conservaron sus validaciones y permisos. Los accesos solicitados se comprobaron sin mutaciones de datos reales.
- Las respuestas fallidas de trofeos/equipos fuera de los escenarios solicitados conservan el tratamiento anterior. Los flujos de acceso/onboarding y otras rutas de la auditoría general siguen en sus etapas correspondientes.
- La observación de Inicio durante carga en H0 corresponde a la base aislada y debe cotejarse con los cambios de Inicio pendientes del checkout original antes de abrir otra corrección.

H0 queda completo para las cuatro pantallas solicitadas y H3 implementado y verificado localmente. Se entrega el diff para revisión sin integrar ni publicar.
