# H0 · Línea base antes de H3

Capturada el 16/11/2026, antes de editar código de aplicación. Estado: completa para las cuatro pantallas solicitadas, con límites de entorno explícitos.

## Revisiones y entorno

- Raíz original: main @ b559c40c1749b8ce6e006369960093ac8e6cf468, con documentación pendiente; se preservó. Worktree documental aislado: codex/h0-h3-roadmap-20261116, base 3e0ea5b049d1a6d74a62a1463fbb58a5f324acb6 (cierre H5).
- Frontend original: main @ fdbf643a2f7cc5d04445f94755a22e2fe2710edb, con cambios de Inicio y capturas pendientes; se preservó.
- Worktree frontend: C:/Users/Crist/Proyectos/Atleta/.worktrees/h0-h3-profile, rama codex/h0-h3-profile-20261116, base 6fcd35b00356ed26bbb303f024ce6d82aa779176 (H5 aprobado). Es descendiente de origin/develop d85e0402a5484af98c77a5609acedeccf444fbaf, confirmado mediante fetch.
- Angular local en http://127.0.0.1:8101; Chromium, API interceptada y cuenta sintética ath-h3. environmentName=test, uploads desactivados y sin parámetro demo. La captura reutilizada de Ranking está identificada por separado.
- Fixtures: e2e/helpers/h0-h3-fixture.ts. Reproducción desde la raíz del worktree: node tools/qa/capture-h0.cjs, con Angular ya iniciado en 8101. El script comprueba que src coincide con la base antes de permitir sobrescribir esta evidencia.
- Matriz: 4 rutas × 4 estados × 2 tamaños = 32 registros, 31 capturas nuevas y una captura reutilizada. Además, dos detalles del gráfico de Perfil. Cada registro incluye ruta, entorno, commit, viewport, estado, respuestas HTTP y texto observado en baseline/manifest.json.

## Inventario de rutas y estados

| Pantalla | Ruta | Viewport | Estado provocado | Commit de aplicación | Evidencia |
|---|---|---|---|---|---|
| inicio | /home | 390 × 844 | data | 6fcd35b | [Captura](baseline/inicio-data-390.png) |
| inicio | /home | 390 × 844 | empty | 6fcd35b | [Captura](baseline/inicio-empty-390.png) |
| inicio | /home | 390 × 844 | error | 6fcd35b | [Captura](baseline/inicio-error-390.png) |
| inicio | /home | 390 × 844 | loading | 6fcd35b | [Captura](baseline/inicio-loading-390.png) |
| partidos | /matches | 390 × 844 | data | 6fcd35b | [Captura](baseline/partidos-data-390.png) |
| partidos | /matches | 390 × 844 | empty | 6fcd35b | [Captura](baseline/partidos-empty-390.png) |
| partidos | /matches | 390 × 844 | error | 6fcd35b | [Captura](baseline/partidos-error-390.png) |
| partidos | /matches | 390 × 844 | loading | 6fcd35b | [Captura](baseline/partidos-loading-390.png) |
| ranking | /leaderboard | 390 × 844 | data | f6e2a64 | [Reutilizada](baseline/../../../output/playwright/h5-stats/demo-390.png) |
| ranking | /leaderboard | 390 × 844 | empty | 6fcd35b | [Captura](baseline/ranking-empty-390.png) |
| ranking | /leaderboard | 390 × 844 | error | 6fcd35b | [Captura](baseline/ranking-error-390.png) |
| ranking | /leaderboard | 390 × 844 | loading | 6fcd35b | [Captura](baseline/ranking-loading-390.png) |
| perfil | /player/profile | 390 × 844 | data | 6fcd35b | [Captura](baseline/perfil-data-390.png) |
| perfil | /player/profile | 390 × 844 | empty | 6fcd35b | [Captura](baseline/perfil-empty-390.png) |
| perfil | /player/profile | 390 × 844 | error | 6fcd35b | [Captura](baseline/perfil-error-390.png) |
| perfil | /player/profile | 390 × 844 | loading | 6fcd35b | [Captura](baseline/perfil-loading-390.png) |
| inicio | /home | 1440 × 844 | data | 6fcd35b | [Captura](baseline/inicio-data-1440.png) |
| inicio | /home | 1440 × 844 | empty | 6fcd35b | [Captura](baseline/inicio-empty-1440.png) |
| inicio | /home | 1440 × 844 | error | 6fcd35b | [Captura](baseline/inicio-error-1440.png) |
| inicio | /home | 1440 × 844 | loading | 6fcd35b | [Captura](baseline/inicio-loading-1440.png) |
| partidos | /matches | 1440 × 844 | data | 6fcd35b | [Captura](baseline/partidos-data-1440.png) |
| partidos | /matches | 1440 × 844 | empty | 6fcd35b | [Captura](baseline/partidos-empty-1440.png) |
| partidos | /matches | 1440 × 844 | error | 6fcd35b | [Captura](baseline/partidos-error-1440.png) |
| partidos | /matches | 1440 × 844 | loading | 6fcd35b | [Captura](baseline/partidos-loading-1440.png) |
| ranking | /leaderboard | 1440 × 844 | data | 6fcd35b | [Captura](baseline/ranking-data-1440.png) |
| ranking | /leaderboard | 1440 × 844 | empty | 6fcd35b | [Captura](baseline/ranking-empty-1440.png) |
| ranking | /leaderboard | 1440 × 844 | error | 6fcd35b | [Captura](baseline/ranking-error-1440.png) |
| ranking | /leaderboard | 1440 × 844 | loading | 6fcd35b | [Captura](baseline/ranking-loading-1440.png) |
| perfil | /player/profile | 1440 × 844 | data | 6fcd35b | [Captura](baseline/perfil-data-1440.png) |
| perfil | /player/profile | 1440 × 844 | empty | 6fcd35b | [Captura](baseline/perfil-empty-1440.png) |
| perfil | /player/profile | 1440 × 844 | error | 6fcd35b | [Captura](baseline/perfil-error-1440.png) |
| perfil | /player/profile | 1440 × 844 | loading | 6fcd35b | [Captura](baseline/perfil-loading-1440.png) |

Estados: data = actuaciones, equipo y trofeo representativos; empty = cuenta con onboarding completo y sin ratings/partidos/trofeos/equipos; error = HTTP 500 en ratings y consultas de partidos; loading = respuestas pendientes hasta después de capturar. No se alteraron auth ni los guards: una cuenta sin posiciones todavía completadas se redirige al onboarding y no representa un Perfil nuevo ya habilitado.

## Hallazgos antes de corregir

- Perfil con datos: OVR 68 repetido como NIVEL GENERAL 68. Ataque 79 y Mediocampo 0 reales; las otras cuatro posiciones ausentes se dibujan y listan como 0. Rótulos del gráfico compacto pequeños. [Detalle móvil](baseline/perfil-stats-390.png) y [escritorio](baseline/perfil-stats-1440.png).
- Perfil vacío: mensaje específico antiguo de posiciones, con métricas de competición en cero; no hay un estado general «Aún no hay estadísticas».
- Perfil HTTP 500: ratings se absorbe como lista vacía y se confunde con ausencia de datos. El fallo de historial sí tiene aviso de competición, pero falta reintento en pantalla para restaurar estadísticas.
- Inicio cargando: «Actualizando actividad...» coexiste con «Sin partido agendado» y el CTA, observación preexistente fuera del alcance de H3. La rama no incorpora los cambios de Inicio pendientes en el checkout original.
- Partidos: carga, vacío, error con reintento y próxima convocatoria reproducidos. Ranking: carga, vacío, error y resultados reproducidos; conserva H5.

## Reutilización y evidencia histórica

- Se reutiliza Ranking con datos a 390 px de output/playwright/h5-stats/demo-390.png, del commit visual f6e2a64028aa22753acf200f1f853c15a872afba. El código de Ranking no cambió entre ese commit y la base de H0; corresponde a environmentName=development con demo identificado.
- Se consultaron las capturas históricas existentes en el checkout original: docs/auditoria-ux-2026-11-07/capturas/h3-validacion-2026-11-08/perfil-roles-{390,1440}.png, etapa-1/inicio/home-empty-{390,1440}.png, etapa-1/recorridos/matches-empty-{390,1440}.png, ranking-filtered-{390,1440}.png y ranking-error.png. Se mantienen como referencia histórica; su SHA exacto no está acreditado y parte de las imágenes tiene cambios locales. No se presentan como capturas de esta base ni se sobrescriben.
- H3_IMPLEMENTATION_COMPLETE.md declaraba cierre sin pruebas ejecutadas; no se usa para acreditar H3 en el flujo normal.

## Bloqueos y límites

Los 32 estados solicitados pudieron reproducirse localmente con respuestas controladas. No hay acceso ni cuenta de beta confirmados: no se acredita API real ni revisión desplegada. La falta de cuenta de beta no impide esta línea base simulada. Dispositivo físico y lector de pantalla real no disponibles; quedan pendientes. El inventario de rutas ajenas a las cuatro solicitadas sigue fuera de esta entrega.

H0 queda documentado antes del cambio de aplicación; H3 se implementará después de guardar este punto de control.
