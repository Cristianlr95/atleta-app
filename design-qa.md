# Design QA

## Perfil por secciones — 2026-11-16

Referencia elegida (opción 3): `C:/Users/Crist/.codex/generated_images/01a1e4a2-b285-7451-bc23-142c1c6ba68c/exec-dedc9677-094d-4927-94b9-90d145b46b92.png`.

Implementación: [móvil](docs/profile-sections-2026-11-16/after/perfil-data-390.png), [escritorio](docs/profile-sections-2026-11-16/after/perfil-data-1440.png), [gráfico](docs/profile-sections-2026-11-16/after/perfil-chart-390.png), [valores](docs/profile-sections-2026-11-16/after/perfil-text-values-390.png).

Fuente 852×1846 px normalizada a 390 px CSS de ancho (factor 390/852, alto aproximado 845). Capturas 390×844 y 1440×844, densidad 1. Comparación móvil en estado con datos y rendimiento cerrado; gráfico y valores inspeccionados aparte abiertos. La referencia define móvil; dos columnas es la adaptación de escritorio.

Comparadas referencia y capturas completas: identidad/OVR, resumen, rendimiento, trofeos, equipo y menú. Fuentes, avatar e iconos existentes conservados. Se quitaron atajos a Partidos por petición posterior del usuario. Trofeos y equipo quedan como secciones visibles; rendimiento usa details/summary con teclado. No se añadieron controles de colapso sin necesidad.

Historial de ajustes:

- P2: logro a media columna en escritorio partía el título; corregido a una columna, comprobado en captura de 1440.
- P2: botón de integrantes parcialmente fuera de vista inicial móvil; reducidos espacios y alineada fila. Captura final de 390 y aserción geométrica E2E confirman control completo sobre footer.
- Gráfico móvil ampliado inspeccionado: texto SVG efectivo ≥11 px en ambos anchos, alternativa textual conserva cero y ausencia.

Interacciones: OVR Enter/Escape, rendimiento Enter, integrantes Enter, Ajustes, barra inferior y reintento. Consola de Perfil con datos sin errores. Carga/vacío/500 y recuperación con API simulada. Sin hallazgos P0/P1/P2 pendientes. Beta, dispositivo físico y lector de pantalla pendientes.

final result: passed

## Configuración de jugador — 2026-07-23

- Referencia visual: `docs/audits/onboarding-redesign-2026-07-23/02-design-language-target.png`.
- Comparación: `docs/audits/onboarding-redesign-2026-07-23/06-before-after.png`.
- Superficies verificadas: escritorio y breakpoint móvil de 390 × 844 px.
- Resultado visual: jerarquía táctica, campo como objeto principal, prioridades visibles, DT compacto fuera del campo y CTA persistente.
- Resultado funcional: alias, selección y deselección de tres posiciones, orden de prioridad, activación del CTA y acceso autenticado a `?demo=1`.
- Accesibilidad: botones de posición de al menos 52 px, foco visible, `aria-pressed`, nombre y prioridad anunciables, estados de carga/error y validación posterior al intento de envío.
- Pruebas: 130/130 aprobadas; lint y compilación de producción aprobados.
- Observación: la captura móvil del navegador integrado aplica escalado del sistema; la medición DOM confirmó 390 px de viewport y 390 px de ancho total, sin desbordamiento horizontal.

final result: passed

## Migración táctica global — 2026-07-23

- Referencia única: composición “Armar equipos” aprobada por el usuario.
- Tema global: negro azulado, superficies planas, líneas finas, Rajdhani, Local lima y Visita cian.
- Componentes compartidos migrados: tarjetas, secciones, botones, inputs, selects, navegación, progreso, posiciones, estadísticas, ranking, historial y radar de rol.
- Flujos principales migrados: autenticación, inicio, onboarding, partidos, perfil, estadísticas, sesiones y creación/cierre de partido.
- Cancha y composición: dos tableros en escritorio con equilibrio central; selector Local/Visita en móvil; fichas con posición, nombre y OVR; huecos cian discontinuos; interacción táctil y mouse.
- Verificación visual: `/home`, `/matches`, `/login` y `/player/onboarding?demo=1`.
- Verificación responsive: escritorio amplio y vista móvil.
- Contraste, foco y objetivos táctiles revisados.

final result: passed

## Editor de alineación — 2026-07-21

- Referencia: `C:/Users/Crist/.codex/generated_images/019f82fe-30a9-7a83-ba47-41250fa2059c/exec-d17a6f48-d9e8-428d-aef7-abf2f62ad17f.png`.
- Superficie verificada: `TeamsBoardComponent` en escritorio y móvil.
- Resultado funcional: formaciones 5v5, 6v6 y 7v7; intercambio por toque/clic y teclado; arrastre de escritorio; guardado de orden y formación.
- Resultado visual: dos canchas en escritorio; selector Local/Visita y una cancha en móvil; tokens con posición, nombre y OVR; balance central; acción de guardado fija.

final result: passed
