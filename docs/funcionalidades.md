# Funcionalidades Reales del Frontend

Fecha de actualizacion: 2026-04-23

## Resumen del producto frontend
Atleta Frontend es una aplicacion para jugadores de futbol amateur centrada en identidad competitiva, creacion y gestion de partidos, equipos, ranking y seguimiento del perfil de jugador.

## Mapa funcional
- Autenticacion
- Onboarding de jugador
- Perfil competitivo
- Home / dashboard
- Equipos
- Partidos
- Canchas / venues
- Ranking
- Social
- Estadisticas adicionales
- Notificaciones

## Funcionalidades implementadas

### Autenticacion - `Implementada`
- Login por email/password.
- Registro de atleta con nombre, email, genero y password.
- Persistencia de sesion y restauracion desde token.

### Guard de acceso y sesion - `Implementada`
- Rutas protegidas por `authGuard`.
- Limpieza de sesion en errores `401`.

### Onboarding de jugador - `Implementada`
- Carga de posiciones desde backend.
- Registro de alias.
- Seleccion obligatoria de 3 posiciones unicas.
- Guard para forzar onboarding si faltan perfil/posiciones.

### Perfil competitivo - `Implementada`
- Datos de usuario, alias, email.
- OVR general, rol destacado, versatilidad y resultados.
- Posiciones seleccionadas.
- Equipos del jugador, invitacion de jugadores y eliminacion por creador.

### Home / dashboard - `Implementada`
- Progreso derivado de OVR, nivel y division.
- Invitaciones pendientes.
- Siguiente partido o ultimo partido relevante.
- Feed corto de actividad reciente.

### Crear equipo - `Implementada`
- Crear equipo desde `sessions/create`.
- Nombre obligatorio, anio opcional y upload opcional de logo.

### Listado de equipos asociados - `Implementada`
- Vista resumen de equipos del jugador y miembros activos.

### Crear partido - `Implementada`
- Wizard de 4 pasos.
- Seleccion de tipo de partido.
- Seleccion de equipo, modalidad, categoria de genero, fecha/hora y cancha.
- Seleccion de jugadores a invitar.
- Seleccion de colores de camiseta local/visita.
- Creacion del partido en backend y envio de invitaciones.

### Gestion de canchas / venues - `Implementada`
- Buscar canchas activas.
- Seleccionar cancha para el flujo de partido.
- Crear una nueva cancha.
- Resolver cancha por ID o cercania geografica.

### Hub de partidos - `Implementada`
- Agenda de partidos proximos.
- Vista de pendientes por responder.
- Historial con filtros.
- Entrada al flujo de creacion.

### Detalle de partido / estado del partido - `Implementada`
- Progreso de confirmaciones.
- Segmentacion por confirmados, pendientes y rechazados.
- Reparto de equipos local/visita.
- Balanceo automatico de equipos.
- Reasignacion manual por el creador.
- Vista de cancha seleccionada.
- Aceptar o rechazar invitacion desde la propia pantalla.
- Recordatorio a pendientes.
- Acceso a cierre del partido y voto MVP.

### Cierre de partido - `Implementada`
- Ajuste de marcador final.
- Asignacion de goles a jugadores.
- Preview de XP estimado.
- Finalizacion del partido.

### Votacion MVP - `Implementada`
- Consulta estado.
- Lista candidatos.
- Permite votar mientras la ventana esta abierta.
- Countdown visible.

### Historial de partidos - `Implementada`
- Pantalla dedicada con filtros y resumen de victorias/empates/derrotas.

### Ranking / leaderboard - `Implementada`
- Ranking global OVR.
- Ranking por rol.
- Ranking interno por equipo.
- Posicion actual del usuario.

### Notificaciones in-app y locales - `Implementada`
- Cola in-app.
- Soporte web notification.
- Soporte local notification con Capacitor.

## Funcionalidades parciales

### Social hub - `Parcial`
- Existe una pantalla `SocialPage` con tabs de actividad, amigos, equipos y partidos.
- Tiene facade, activity feed, paneles de solicitudes y acciones.
- Hoy no esta accesible desde routing porque `/social` redirige a `/matches`.

### Stats - `Parcial`
- Existe la pagina `/stats`.
- Actualmente solo muestra un mensaje de futura integracion.

### Badge de notificaciones - `Parcial`
- Hay agregacion local de pendientes.
- `NotificationBadgeService.refresh()` no consulta backend ni actualiza conteos remotos.

### Push notifications remotas - `Parcial`
- La infraestructura cliente existe.
- El token se guarda localmente, pero no se sincroniza con endpoint backend definitivo.

### Modos demo - `Parcial`
- Algunas pantallas caen a modo demo si falta sesion o falla carga.

## Funcionalidades pendientes

### Google auth - `Pendiente`
- El login tiene CTA "Continuar con Google", pero el metodo no implementa flujo real.

### Recuperacion de password - `Pendiente`
- Existe el handler `onForgotPassword()`, pero no hace nada.

### Registro real de push token en backend - `Pendiente`
- Solo hay persistencia local.

### Badge server-side real - `Pendiente`
- El conteo remoto no esta implementado.

### Rehabilitar o retirar modulo social - `Pendiente`
- El codigo existe, pero el routing lo dejo fuera del producto navegable.

## Funcionalidades recomendadas

### Consolidar historial de partidos - `Recomendada`
- Unificar `matches-history` y la vista history dentro de `matches-hub`.

### Unificar entrada de "social" - `Recomendada`
- Reintegrar `SocialPage` o absorber sus paneles dentro de una ruta activa.

### Configuracion runtime de backend - `Recomendada`
- Evitar `apiBaseUrl` compilado fijo para despliegues.

### Hardening de sesion - `Recomendada`
- Migrar away de `localStorage` si el modelo de seguridad lo permite.

## Reglas de negocio visibles desde frontend
- Onboarding completo requiere perfil + 3 posiciones.
- Solo usuarios autenticados acceden a rutas protegidas.
- Un partido debe programarse a futuro.
- Los colores de uniforme local y visita no pueden ser iguales.
- En mixto, el armado manual exige balance por genero.
- Convocatorias `solo mujeres` o `solo hombres` restringen asignacion de equipos.
- El cierre del partido se habilita una hora despues del inicio.
- La votacion MVP se abre tras finalizacion y dura hasta 3 horas.
- Solo el creador puede reorganizar equipos o eliminar equipos creados.

## Integraciones con backend
- Auth: `/athletes/login`, `/athletes/register`
- User/Profile: `/player-profiles`, `/player-profiles/{uuid}`, `/player-profiles/{uuid}/positions`, `/positions`
- Teams: `/teams`, `/teams/by-player/{uuid}`, `/teams/by-creator/{uuid}`, `/teams/{id}/members/active`, `/teams/logo`
- Matches: `/matches`, `/matches/by-player/{uuid}`, `/matches/by-player-or-creator/{uuid}`, `/matches/{id}`, `/matches/{id}/status`, `/matches/{id}/teams/{teamId}`, `/matches/{id}/teams/assignment`, `/matches/events`, `/matches/{id}/close/preview`, `/matches/{id}/mvp`, `/matches/{id}/mvp/vote`
- Social: `/social/friendships`, `/social/team-invites`, `/social/match-invites`, `/social/notifications`, `/social/players/search`
- Fields: `/fields`
- Ratings: `/ratings/player/{id}/overall`, `/ratings/player/{id}`, `/ratings/player/{id}/history`, `/ratings/leaderboard`

## Checklist para futuras tareas
- [ ] Leer `docs/memory.md`
- [ ] Leer `docs/architecture.md`
- [ ] Verificar si la funcionalidad ya existe en `matches`, `social`, `user` o `shared/ui`
- [ ] Confirmar si la ruta existe realmente en `app.routes.ts`
- [ ] Revisar si hay componente reusable `metallic-*` antes de crear UI nueva
- [ ] Verificar contratos reales en `API_ENDPOINTS` y servicios API
- [ ] Si se toca `matches`, validar impacto en stores y E2E
- [ ] Actualizar esta documentacion despues del cambio
