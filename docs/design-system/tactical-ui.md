# Sistema visual táctico de Atleta

Este documento fija la imagen de referencia aprobada como fuente visual única para toda la aplicación.

## Identidad

- Fondo de aplicación: `#02090d`.
- Superficie principal: `#06141b`.
- Superficie elevada: `#091a22`.
- Líneas y divisores: `#17313b`, siempre finos y sin brillo.
- Local / selección principal: `#d7ff00`.
- Visita / información interactiva: `#00d7f5`.
- Intercambio: `#ff8a00`.
- Error: `#ff677d`.
- Tipografía única: Rajdhani. Títulos en 700, mayúsculas y espaciado moderado.
- Números de marcador y OVR: peso 700 y cifras tabulares.
- Radios: 4–6 px en controles y paneles. Los únicos elementos circulares son avatares, insignias de posición y huecos de cancha.
- Sin gradientes metálicos, reflejos, biseles, brillos pulsantes ni sombras ornamentales.

## Cancha

- Superficie: `#032116` con franjas verticales apenas visibles.
- Trazado: blanco verdoso al 42 % de opacidad.
- Proporción de escritorio cercana a 4:3; orientación vertical en móvil.
- Local usa lima y Visita usa cian.
- Hueco disponible: círculo con línea cian discontinua.
- Intercambio: naranja.

## Ficha de jugador

- Tarjeta rectangular oscura con borde fino.
- Insignia circular de posición solapada sobre el borde superior.
- Orden de lectura: posición, nombre, `OVR NN`.
- El OVR nunca sustituye a la posición.
- Nombres con elipsis cuando no caben.
- Área táctil mínima de 44 px para mouse y dedo.

## Responsividad

- Escritorio: Local y Visita visibles simultáneamente, separados por el panel de equilibrio.
- Móvil: selector Local/Visita, una cancha visible y banca debajo.
- Arrastrar es opcional: tocar jugador y luego posición debe resolver la misma acción.
- La acción Guardar equipos permanece visible al finalizar la composición.

## Compatibilidad

Los componentes que conservan el prefijo técnico `metallic-` lo hacen para evitar cambios de API. Visualmente pertenecen al sistema táctico y no deben recuperar el estilo metálico anterior.
