# Goles del plantel: equipo y trayectoria

Decisión del usuario del 17/11/2026: mostrar ambos valores. Frontend derivado de `1e1ddd8`, diseño aprobado del 16/11; backend derivado de `7cf72ef`. Rama en ambos: `feature/team-goal-totals-20261117`.

## Contrato

`GET /api/v1/teams/{teamId}/members/active` conserva su contrato y añade `teamGoals` y `totalGoals`, enteros no negativos o null. Sigue protegido por la política JWT existente para lecturas deportivas; no entrega historiales individuales ni datos de partidos privados. No cambia rutas, escritura o permisos de administración.

- `totalGoals`: suma de goles en `PlayerHistory` de partidos actualmente FINALIZADO, para ese integrante activo, en cualquier equipo.
- `teamGoals`: suma de ese mismo historial con el equipo solicitado. No depende de la fecha de la membresía actual; conserva aportes anteriores al salir y volver al equipo. Incluye partidos internos y externos que hayan generado historial válido.
- Un historial con cero goles devuelve 0; sin historial válido para el alcance, null. No se sustituyen ausencias o errores por cero. Un backend anterior sin los campos conserva «Sin datos» en la UI.
- Una consulta agrupada para todos los integrantes; sin consultas de goles por jugador, migraciones ni modificación de historial. El proceso existente de cierre crea historial solo para participantes confirmados y contabiliza goles confirmados.
- Tabla y modal presentan «Goles con el equipo» y «Goles totales». PJ y asistencias conservan su comportamiento anterior; asistencias permanece pendiente.

## Verificación

- Prueba nueva del repositorio: dos equipos, diferencia entre trayectoria/equipo, cero, ausencia, jugador ajeno al conjunto solicitado y exclusión de partido invalidado. Consulta ejecutada en H2.
- Suite backend completa: 731 pruebas, cero fallos, errores u omisiones (JDK 21, H2); evidencia de ejecución en los informes Surefire locales. No acredita PostgreSQL.
- Servicio: preserva cero, ausencia, agrupación y evita consultar goles de un plantel vacío. Smoke MVC comprueba ambos campos sin romper campos anteriores; su configuración de prueba no acredita seguridad de producción.
- Frontend: 272 unitarias aprobadas, lint y build de producción correctos; aviso preexistente Stencil `empty-glob`.
- Revisión de regresión: cambiar temporalmente `??` por `||` para goles hizo fallar la prueba de cero; plantilla restaurada y 10 pruebas del plantel aprobadas de nuevo.
- Chromium: dos recorridos aprobados a 390/1440 px con API simulada. Verifican equipo/total, cero/ausencia, ficha modal, Escape, retorno de foco y ausencia de desbordamiento de página. Capturas `goles-plantel-*.png` y `goles-modal-*.png`; inspeccionados modal móvil y tabla escritorio.

Sin publicación, beta, PostgreSQL, teléfono físico o lector de pantalla. Los datos de navegador son sintéticos; no acreditan información real. BE-PLANTEL-01 queda parcial por asistencias y beta; BE-PLANTEL-02/03/04 no se declaran cerrados.
