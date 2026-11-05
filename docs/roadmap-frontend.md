# Estado del frontend de Atleta

## Completado

- [x] Inicio adaptable, actividad, navegación, estados de error y XP por posición principal.
- [x] Progresión gradual y barra accesible calculadas a partir de la XP de la posición principal.
- [x] Historial móvil y reintento al fallar la carga.
- [x] Validaciones de acceso y onboarding; mensajes de ajustes anunciados.
- [x] Canchas: selección por coordenadas con teclado y reintento de carga.
- [x] Social: nombres accesibles, áreas táctiles y tratamiento de errores.
- [x] Correcciones de estados de perfil, ranking, cierre y votación MVP cubiertas por pruebas simuladas.

## Pendiente

1. Validar flujos completos con datos reales de beta, incluidos cierre, voto MVP y notificaciones.
2. Revisar accesibilidad con lectores de pantalla y dispositivos físicos, además de contrastes sobre imágenes.
3. Completar la revisión visual y de errores para todas las combinaciones de perfil, equipos, agenda y ranking.
4. Ajustar el balance de progresión con datos reales de partidas y revisar el motor XPService independiente antes de conectarlo al cierre.
5. Reducir las advertencias conocidas de compilación de Stencil y del presupuesto CSS de Perfil.
6. Resolver los avisos de seguridad altos de Angular mediante una actualización compatible y validar la aplicación Android en dispositivos reales.

## Progresión de posición

La XP pertenece a cada posición; el nivel mostrado se deriva de la XP de la posición principal. Se parte de nivel 1. Para subir al nivel 2 se necesitan 100 XP; cada nivel posterior requiere 25 XP más que el anterior (125, 150, 175...). La barra muestra la XP obtenida dentro del nivel actual.

Para partidos nuevos, el servidor concede 5 XP por participar; 5 adicionales por victoria o 2 por derrota; y 4, 5 o 6 por gol según la posición, con un máximo de 25 XP base por partido. El bonus MVP opcional es de 5 XP adicionales. Estas cantidades no modifican XP ni registros históricos.
