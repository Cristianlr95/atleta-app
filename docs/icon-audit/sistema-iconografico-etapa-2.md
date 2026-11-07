# Sistema iconografico Atleta — Etapa 2

Fecha: 21 de julio de 2026

## Resultado

Se implemento la direccion `Acero en Movimiento`, una familia SVG propia para futbol competitivo y UI metalica oscura. La biblioteca paso de 36 a 64 SVG: 28 iconos nuevos, sin texto, emoji, colores fijos ni gradientes internos.

## Problemas corregidos

| Problema anterior | Solucion implementada |
|---|---|
| Lupa usada para abrir un partido | `ic_action_open_match_24.svg` |
| Disquete usado como seguridad | `ic_auth_security_24.svg` |
| Roles representados por llama, estadisticas, reglas, listo o trofeo | Seis iconos propios `ic_role_*` |
| Trofeo usado para OVR y DT | `ic_comp_overall_24.svg` y `ic_role_coach_24.svg` |
| Estadisticas usado para empate, mediocampo y versatilidad | `ic_result_draw_24.svg`, `ic_role_midfield_24.svg`, `ic_comp_versatility_24.svg` |
| Nivel usado para medalla y posicion no seleccionada | `ic_comp_medal_24.svg` y `ic_position_unselected_24.svg` |
| Invitacion usada para amigos y participantes | `ic_social_friends_24.svg` y `ic_match_participants_24.svg` |
| Emojis de gol, asistencia y resultado | SVG `ic_event_*` e `ic_result_*` |
| Caracteres de nivel, estrellas y sumar/restar | SVG de nivel, rating y acciones con etiquetas accesibles |
| MVP, tiempo y rechazo disponibles pero sin integrar | Integrados en votacion, countdown e invitaciones |
| Confirmado mostraba icono de finalizado en el hub | Mapeo corregido a `ic_status_confirmed_24.svg` |

## Mapa canonico principal

- Trofeo: logro, campeon o podio.
- Medalla: segundo/tercer lugar o reconocimiento.
- OVR: nivel general competitivo.
- Estadisticas: lectura analitica agregada.
- Racha: tendencia temporal.
- Invitacion: invitar a un partido.
- Participantes: jugadores ya vinculados al partido.
- Amistad: relacion social entre jugadores.
- Calendario: fecha; reloj: hora, duracion o countdown.
- Buscar: lupa; abrir partido: tarjeta con avance.

## Accesibilidad

- Resultados mantienen texto junto al icono y no dependen solo de verde, amarillo o rojo.
- Controles de marcador tienen nombres como `Sumar gol a Local` y `Restar gol a Visita`.
- Rating expone una etiqueta numerica y oculta las estrellas decorativas.
- Iconos dentro de botones con texto se marcan como decorativos.

## Recursos reservados

`action_search`, `action_save`, `comp_level` y `match_rules` permanecen en la biblioteca con significado restringido, aunque la aplicacion no los necesita actualmente.
