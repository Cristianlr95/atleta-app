# Estado del frontend de Atleta

## Completado

- [x] **H3 · Perfil por secciones y navegación**, opción 3 seleccionada: identidad/OVR compactos, rendimiento desplegable y trofeos/equipos planos. Perfil y Ranking desde barra inferior. 262 unitarias, 10 E2E a 390/1440 px, build/lint correctos. [Verificación](profile-sections-2026-11-16/verificacion.md) y [mapa de accesos](profile-sections-2026-11-16/navigation/mapa.md). Beta pendiente de cuenta.

- [x] **H0 · Línea base de Inicio, Partidos, Ranking y Perfil**, completada antes de editar H3: 32 estados a 390/1440 px con captura o reutilización identificada y metadatos de ruta, entorno, revisión y estado. [Inventario](h0-h3-2026-11-16/linea-base.md).
- [x] **H3 · Perfil normal**, implementado y verificado localmente: OVR único con explicación; «Sin valoración» distinto de cero; vacío y error 500 con reintento; gráfico ampliado, alternativa textual y accesos con teclado. 262 unitarias y 13 E2E pertinentes correctos, build/lint correctos. [Evidencia y límites](h0-h3-2026-11-16/verificacion.md).

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

La finalización de H5 corresponde a la interfaz local aprobada. Conectar goles, MVP y últimos cinco resultados a la API sigue pendiente en `BE-RANK-01` a `BE-RANK-05` (`atleta-server/docs/backlog-ranking-h5.md`, rama `codex/h5-ranking-backlog-20261116`). Incluye adaptación de modelos/servicio frontend, cuenta de prueba y validación móvil/escritorio en beta.

1. Validar flujos completos con datos reales de beta, incluidos cierre, voto MVP y notificaciones.
2. Revisar accesibilidad con lectores de pantalla y dispositivos físicos, además de contrastes sobre imágenes.
3. Ampliar la revisión visual y de errores a las combinaciones de perfil, equipos, agenda y ranking fuera de los escenarios documentados en H0/H3 y H5.
4. Ajustar el balance de progresión con datos reales de partidas y revisar el motor XPService independiente antes de conectarlo al cierre.
5. Revisar los avisos restantes de las dependencias de desarrollo y validar la aplicación Android en dispositivos reales. La versión de Piscina se fija temporalmente a 5.3.2 para corregir un aviso crítico; retirar esta excepción cuando Angular incorpore una versión corregida y verificar la compilación.

## Progresión de posición

La XP pertenece a cada posición; el nivel mostrado se deriva de la XP de la posición principal. Se parte de nivel 1. Para subir al nivel 2 se necesitan 100 XP; cada nivel posterior requiere 25 XP más que el anterior (125, 150, 175...). La barra muestra la XP obtenida dentro del nivel actual.

Para partidos nuevos, el servidor concede 5 XP por participar; 5 adicionales por victoria o 2 por derrota; y 4, 5 o 6 por gol según la posición, con un máximo de 25 XP base por partido. El bonus MVP opcional es de 5 XP adicionales. Estas cantidades no modifican XP ni registros históricos.
