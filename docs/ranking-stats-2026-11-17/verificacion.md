# Estadísticas del Ranking: verificación local

Fecha: 17/11/2026. Rama `feature/ranking-stats-20261117` en frontend y backend; desarrollo local, no desplegado.

La API de ranking global/por rol y la de equipo añaden goles, MVP y resultados sin retirar campos anteriores ni cambiar el orden, rangos o autorización existentes. Global muestra trayectoria; el filtro por posición muestra trayectoria y posición; equipo usa únicamente historiales asociados al equipo. El histórico se identifica por la posición y el equipo guardados para cada participación, no por la posición actual del perfil.

Los goles proceden de `PlayerHistory` para partidos FINALIZADO, evitando duplicar datos de los distintos ratings. MVP cuenta únicamente ganadores oficiales actualmente resueltos en `Match.mvpUser`; una votación pendiente puede actualizar la cifra más tarde. Los últimos cinco resultados usan el resultado histórico del jugador; se ordenan por fecha programada y luego ID, del más antiguo al más reciente, con el último a la derecha. El cierre actual registra historiales solo para participantes confirmados, pero no se auditaron individualmente los datos históricos. La columna de resultados no recalcula marcadores antiguos.

Sin historial para un alcance se informa null, distinto de cero con historial. Si hay una posición histórica no clasificable, los datos por posición quedan desconocidos; el total de trayectoria se conserva. La UI acepta también respuestas antiguas sin los campos. Dos consultas adicionales en lote por ranking, no una solicitud por jugador; el listado de resultados usa una ventana de hasta cinco registros por jugador y posición, antes de seleccionar los cinco finales.

Verificación: 738 pruebas backend completas en H2 sin fallos; prueba adicional del orden con fecha igual e ID; dos pruebas de repositorio en PostgreSQL 18 temporal con datos sintéticos, sin fallos. Flyway advierte que su soporte probado llega a PostgreSQL 16. Frontend: 279 unitarias, lint y build correctos, aviso preexistente Stencil `empty-glob`; dos recorridos Chromium simulados a 390/1440 prueban global, posición y equipo, más MVP y resultados. Capturas `ranking-posicion-*.png`. PostgreSQL y frontend temporales se detuvieron.

Pendientes: integrar ambas ramas en `main`, verificar con datos reales y beta, lector de pantalla y teléfono físico. El cluster temporal PostgreSQL con datos sintéticos quedó detenido en `.tmp/ranking-pg-20261117`; no contiene datos reales. No se modificaron históricos ni se desplegó.
