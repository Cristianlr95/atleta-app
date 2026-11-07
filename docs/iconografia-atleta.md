# Guia de Iconografia - ATLETA

## Sistema vigente: Acero en Movimiento

La iconografia propia de Atleta traduce el futbol a una interfaz competitiva, metalica y oscura. La referencia visual no es la ilustracion multicolor: la personalidad vive en la geometria, el movimiento diagonal y las metaforas futboleras especificas.

- Reticula: `24x24`, zona segura de `2px`.
- Trazo principal: `1.8px`; secundario: `1.4px`.
- Terminaciones y uniones redondeadas.
- Dos niveles maximos: trazo principal y masa `currentColor` al `16-22%`.
- Firma visual: impulso hacia arriba-derecha y una muesca diagonal corta en elementos moviles.
- Sin texto, emoji, colores fijos ni gradientes dentro del SVG.
- El escudo se reserva para seguridad, defensa e identidad competitiva.
- Todo icono interactivo debe tener nombre accesible; los decorativos usan `aria-hidden="true"`.

### Principio semantico

Un concepto tiene un icono canonico. Trofeo significa logro o podio; estadisticas significa analisis agregado; racha significa tendencia; lupa significa buscar; calendario significa fecha; reloj significa hora o cuenta regresiva.

### Familias futboleras incorporadas

- Roles: ataque, mediocampo, carrilero, defensa, arquero y DT.
- Rendimiento: OVR, mejor rol, versatilidad, efectividad, contribucion G+A, medalla y subida de nivel.
- Resultados: victoria, empate y derrota, siempre acompanados por texto.
- Partido: participantes, jugar, gol, asistencia y tiempo.
- Social y acciones: amistad, abrir partido, seguridad, sumar, restar, aceptar y rechazar.
- Valoracion: estrella llena y estrella vacia propias.

### Activos reservados

Los siguientes recursos siguen disponibles, pero no deben usarse como sustitutos genericos:

- `ic_action_search_24.svg`: solo busqueda.
- `ic_action_save_24.svg`: solo guardar.
- `ic_comp_level_24.svg`: solo nivel simple cuando no exista una metafora mas precisa.
- `ic_match_rules_24.svg`: solo reglas o reglamento.

## 1) Direccion visual
- Estilo: `Futurista deportivo metalico` (sci-fi stadium UI).
- Contexto: interfaz oscura, alto contraste, sensacion competitiva/premium.
- Objetivo de iconos: lectura rapida, elegantes, no caricaturescos.

## 2) Sistema base de iconos
- Tipo: lineal con apoyo duotono suave (no relleno pesado).
- Grosor de trazo: `2px` en iconos de 24.
- Terminaciones: redondeadas.
- Uniones: redondeadas.
- Nivel de detalle: medio (evitar micro-detalles).
- Proporcion: centrados opticamente, margen interno uniforme.

## 3) Grid y tamanos
- Grid maestro: `24x24`.
- Area segura: `20x20` centrada.
- Pixel fitting: alinear trazos a medias unidades cuando aplique (`0.5`) para nitidez.
- Escalas recomendadas:
  - UI densa: `20px`
  - Base app: `24px`
  - Destacados: `28px` o `32px`

## 4) Paleta sugerida para iconos
- Primario claro (icono normal sobre fondo oscuro): `#C6E7FF`
- Acento cian (interaccion/info): `#63C6FF`
- Exito (confirmado): `#7CE9A8`
- Error (bloqueo): `#FF8A8A`
- Deshabilitado: `rgba(198,231,255,0.45)`

Nota: Mantener fondo oscuro; evitar iconos oscuros sobre oscuro.

## 5) Estados de iconos
- Default: trazo `#C6E7FF`.
- Hover/activo: trazo o glow sutil `#63C6FF`.
- Success: acento `#7CE9A8`.
- Error: acento `#FF8A8A`.
- Disabled: misma forma, menor opacidad.

## 6) Efectos (usar con moderacion)
- Glow suave opcional:
  - `drop-shadow(0 0 6px rgba(99,198,255,0.35))`
- No usar bevel exagerado en SVG.
- Evitar gradientes complejos dentro del icono.

## 7) Familia semantica (set inicial recomendado)
- Navegacion: inicio, atras, perfil, ajustes.
- Partido: crear partido, estado, confirmaciones, equipos, cancha.
- Competitivo: ranking, trofeo, MVP, estadisticas.
- Social: amigos, invitaciones, notificaciones, chat.
- Acciones: editar, guardar, cerrar, eliminar, filtrar, buscar.

## 8) Reglas de consistencia
- Misma logica de esquinas en todo el set.
- Misma tension visual (ni muy redondo ni muy angular mezclado).
- Evitar mezclar iconos filled con lineales sin criterio.
- Cada icono debe entenderse en `1 segundo`.

## 9) Exportacion (Figma/SVG)
- Formato principal: `SVG`.
- Nombre: `ic_{categoria}_{nombre}_{24}.svg`
  - Ej: `ic_match_create_24.svg`
- Limpiar SVG:
  - sin transforms anidados innecesarios
  - sin metadata extra
  - viewport correcto (`0 0 24 24`)
- Mantener stroke editable (no outline salvo necesidad tecnica).

## 10) Checklist rapido antes de integrar
- Se ve bien en `24px` y `20px`.
- Se entiende sobre fondo oscuro del app.
- Tiene coherencia con botones/cards metalicos actuales.
- Respeta colores de estado (info/success/error).
- No rompe legibilidad en listas densas.

## 11) CSS token sugerido para iconos
```css
:root {
  --icon-default: #c6e7ff;
  --icon-accent: #63c6ff;
  --icon-success: #7ce9a8;
  --icon-danger: #ff8a8a;
  --icon-disabled: rgba(198, 231, 255, 0.45);
}
```
