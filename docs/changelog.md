# Changelog Inicial de Auditoria

## 2026-04-23

### Estado general
- Se genero base documental viva del frontend a partir del codigo real del repositorio.
- El estado actual muestra un frontend funcionalmente centrado en autenticacion, perfil competitivo, equipos, partidos, ranking y MVP.
- El dominio mas avanzado es `matches`.

### Modulos detectados
- `auth`
- `dashboard`
- `fields`
- `matches`
- `ratings`
- `sessions`
- `social`
- `teams`
- `user`
- `shared/ui`
- `core`

### Hallazgos importantes
- La ruta `/social` redirige a `/matches`, aunque existe un modulo social completo en codigo.
- La pagina `/stats` existe, pero hoy solo es placeholder.
- `matches-history` y el historial dentro de `matches-hub` duplican bastante comportamiento.
- El sistema de notificaciones push esta preparado en cliente, pero sin sincronizacion backend real del token.
- `NotificationBadgeService.refresh()` no resuelve conteo remoto.
- La sesion y tokens se persisten en `localStorage`.
- `capacitor.config.ts` conserva `appId` de plantilla (`io.ionic.starter`).
- Existen strings con problemas de encoding en varios archivos.

### Oportunidades de mejora
- Reintegrar o retirar el modulo social huerfano.
- Consolidar historial de partidos en una sola experiencia.
- Separar responsabilidades del dominio `matches`.
- Endurecer configuracion y seguridad de sesion.
- Completar estrategia real de notificaciones y badges.
