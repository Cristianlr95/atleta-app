# Estado del frontend de Atleta

Integración con main validada el 16/11/2026 para el push solicitado: 271 unitarias, 73 E2E correctos y tres smoke omitidos por credenciales; build/lint/audit runtime correctos. [Registro de integración](main-integration-2026-11-16.md). La aprobación visual y los pendientes backend/beta se mantienen separados.

## Completado

- [x] **H3 · Perfil y Plantel, parte visual cerrada y aprobada por el usuario el 16/11/2026.** Revisión de fuente `9bb209f31a34f754615010ad9a8a2e2e12ed297a`, rama `codex/profile-sections-navigation-20261116`. Perfil con OVR único y explicación, hexágono siempre visible con datos y métricas debajo; sin listas visibles repetidas, con alternativa textual accesible. Plantel con OVR promedio y cobertura, hexágono agregado, lista de jugadores y ficha modal sin salir de la sección. Inicio no repite la ficha personal; accesos y permisos conservados. **Última verificación local:** 265 unitarias, 14 E2E a 390/1440 px, build/lint correctos. [Evidencia final](profile-visible-radar-2026-11-16/verificacion.md), [lista y modal](team-list-2026-11-16/verificacion.md), [mapa de navegación](home-profile-2026-11-16/verificacion.md). Este cierre visual no acredita datos reales, integración o despliegue.

- [x] **H0 · Línea base de Inicio, Partidos, Ranking y Perfil**, completada antes de editar H3: 32 estados a 390/1440 px con captura o reutilización identificada y metadatos de ruta, entorno, revisión y estado. [Inventario](h0-h3-2026-11-16/linea-base.md).
- [x] **H5 · Ranking visual**, finalizado y aprobado el 16/11/2026: ancho móvil, vacíos, búsqueda/reintento, goles/MVP/forma de ejemplo y tabla lateral con puesto/jugador fijos. Acabado de la barra aprobado. Evidencia y límites en [h5-ranking-2026-11-16.md](h5-ranking-2026-11-16.md).

- [x] Inicio adaptable, actividad, navegación, estados de error y XP por posición principal.
- [x] Progresión gradual y barra accesible calculadas a partir de la XP de la posición principal.
- [x] Historial móvil y reintento al fallar la carga.
- [x] Validaciones de acceso y onboarding; mensajes de ajustes anunciados.
- [x] Canchas: selección por coordenadas con teclado y reintento de carga.
- [x] Social: nombres accesibles, áreas táctiles y tratamiento de errores.
- [x] Correcciones de estados de perfil, ranking, cierre y votación MVP cubiertas por pruebas simuladas.
- [x] Estadísticas informa errores y permite reintentar sin mostrar datos vacíos como reales.
- [x] Angular 20.3.35 elimina los avisos de seguridad de las dependencias de producción en la auditoría actual.
- [x] Compilación correcta y Perfil dentro del presupuesto de estilos; equipos y logros tienen componentes y estilos propios. La revisión H0/H3 todavía observa el aviso preexistente `empty-glob` de Stencil.

## Pendiente

### Backend de Perfil y Plantel

- [ ] **BE-PLANTEL-01 (local):** goles y asistencias con el equipo y totales de trayectoria desde historial de partidos finalizados, mostrados en tabla y ficha. Se conserva cero y se distingue la ausencia de historial. Pendiente verificar en beta. [Goles: contrato y verificación](team-goals-2026-11-17/verificacion.md).
- [ ] **BE-PLANTEL-02 (local):** «PJ con el equipo» cuenta partidos finalizados distintos con historial de ese equipo; «PJ totales» conserva su fuente de trayectoria. Tabla y ficha muestran ambos. Pendiente validación con datos reales y beta.
- [x] **BE-PLANTEL-03 (verificado localmente):** el agregado usa historiales de partidos finalizados; el cierre genera registros para participantes confirmados y cuenta eventos confirmados. La lectura del plantel requiere JWT, conserva el contrato y diferencia cero, ausencia y fallo con reintento. Los historiales antiguos no se auditaron individualmente. [Evidencia](plantel-03-2026-11-17.md).
- [ ] **BE-PLANTEL-04 (parcial):** verificado con datos simulados que la media incluye cero válido, excluye ausencias/errores y muestra cobertura. La cuenta de prueba aún no tiene sesión abierta; falta contrastar integrantes y OVR con datos reales. El promedio es de presentación, sin persistencia oficial. Revisar el valor de respaldo 65 que devuelve el DTO de miembros cuando falta OVR: la vista actual no lo usa para la media. [Evidencia](plantel-04-2026-11-17.md).

[Detalle y criterios](team-list-2026-11-16/backend-pendientes.md). Los cambios descritos como locales requieren validación en beta.

### Validación en beta de Perfil y Plantel

**Estado: pendiente; sin cuenta de prueba confirmada.** Antes de comenzar, registrar URL/entorno y SHA frontend/backend, y comprobar que la versión desplegada corresponde al cambio aprobado. Usar credenciales por un canal privado.

- [ ] Cuenta activa y datos representativos: perfil con historial y perfil nuevo; equipo con varios integrantes, sin integrantes y con valoraciones ausentes y cero válido.
- [ ] Contrastar OVR, cobertura y medias por posición con la API real; verificar origen/alcance de PJ, goles y asistencias cuando se entreguen.
- [ ] Carga, vacío, error HTTP 500 y reintento exitoso en un entorno de prueba controlado; conservar evidencia de los estados no reproducibles y su motivo.
- [ ] A 390 y 1440 px: gráfico de Perfil sin desplegar, métricas debajo, tabla lateral, selección de jugador en modal, cierre/Escape y retorno del foco; rutas sin accesos duplicados y controles de equipo según permisos.
- [ ] Guardar capturas y metadatos de ruta, viewport, estado, entorno y revisión exacta probada. Pruebas de teléfono físico y lector de pantalla siguen pendientes y se registran por separado.

### Otros pendientes del roadmap

La finalización de H5 corresponde a la interfaz local aprobada. Las estadísticas BE-RANK-01 a BE-RANK-05 están implementadas localmente; falta integrarlas y validarlas en beta con datos reales. El backlog original está en `atleta-server` rama `codex/h5-ranking-backlog-20261116`.

Decisión del usuario del 17/11: al filtrar por posición se muestran ambos alcances para goles, MVP y resultados: partidos jugados en la posición filtrada y trayectoria completa, claramente identificados. El ranking de equipo usa partidos de ese equipo. Se usa la posición registrada en cada participación y se distinguen datos ausentes de cero.

Avance local BE-RANK-01 a 05: goles, MVP oficiales resueltos y hasta cinco resultados de historial finalizado, agregados en lote para ranking global, posición y equipo. Posiciones históricas no clasificables dejan el alcance por posición como desconocido. 738 pruebas backend H2, 2 pruebas sintéticas PostgreSQL 18, 279 frontend, lint/build y 2 recorridos Chromium simulados aprobados. Pendientes integración, revisión de datos reales y beta; no desplegado. [Detalle y límites](ranking-stats-2026-11-17/verificacion.md).

1. Validar flujos completos con datos reales de beta, incluidos cierre, voto MVP y notificaciones.
2. Revisar accesibilidad con lectores de pantalla y dispositivos físicos, además de contrastes sobre imágenes.
3. Ampliar la revisión visual y de errores a las combinaciones de perfil, equipos, agenda y ranking fuera de los escenarios documentados en H0/H3 y H5.
4. Ajustar el balance de progresión con datos reales de partidas y revisar el motor XPService independiente antes de conectarlo al cierre.
5. Revisar los avisos restantes de las dependencias de desarrollo y validar la aplicación Android en dispositivos reales. La versión de Piscina se fija temporalmente a 5.3.2 para corregir un aviso crítico; retirar esta excepción cuando Angular incorpore una versión corregida y verificar la compilación.

## Progresión de posición

La XP pertenece a cada posición; el nivel mostrado se deriva de la XP de la posición principal. Se parte de nivel 1. Para subir al nivel 2 se necesitan 100 XP; cada nivel posterior requiere 25 XP más que el anterior (125, 150, 175...). La barra muestra la XP obtenida dentro del nivel actual.

Para partidos nuevos, el servidor concede 5 XP por participar; 5 adicionales por victoria o 2 por derrota; y 4, 5 o 6 por gol según la posición, con un máximo de 25 XP base por partido. El bonus MVP opcional es de 5 XP adicionales. Estas cantidades no modifican XP ni registros históricos.
