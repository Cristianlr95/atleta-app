# Atleta App

## Descripcion
Frontend de Atleta, una aplicacion para futbol amateur centrada en identidad competitiva, organizacion de partidos, equipos, posiciones, ranking y seguimiento del rendimiento del jugador.

## Repositorios relacionados
- Backend/API: [Cristianlr95/atleta-server](https://github.com/Cristianlr95/atleta-server)

## Problema que resuelve
En ligas y grupos de futbol amateur, la coordinacion de partidos, convocatorias, equipos y rendimiento suele resolverse por chats y registros informales. Atleta App propone una experiencia centralizada donde los jugadores pueden gestionar su perfil, participar en partidos, revisar invitaciones y consultar rankings conectados al backend.

## Funcionalidades principales
- Registro y login por email/password.
- Onboarding de jugador con alias y seleccion obligatoria de tres posiciones.
- Perfil competitivo con OVR, rol destacado, versatilidad, posiciones y equipos.
- Creacion y gestion de equipos.
- Creacion de partidos con wizard, modalidad, categoria, cancha, invitados y colores.
- Hub de partidos con agenda, pendientes e historial.
- Detalle de partido con confirmaciones, equipos, balanceo, cierre y MVP.
- Ranking global, por rol e interno por equipo.
- Notificaciones locales/in-app y servicios preparados para integracion push.

## Stack tecnico
- Angular 20
- Ionic 8
- Capacitor 8
- TypeScript 5.9
- RxJS 7
- Angular standalone components
- Angular signals y stores custom
- Leaflet para funcionalidades geograficas
- Playwright para E2E
- Karma/Jasmine para unit tests
- Docker + Nginx para despliegue SPA

## Arquitectura / Estructura
La aplicacion usa arquitectura feature-first con `core`, `shared` y dominios funcionales. El dominio `matches` concentra la mayor complejidad y combina paginas, componentes, modelos, stores, servicios de API y utilidades de balanceo.

```text
atleta-app/
  src/app/
    core/
      config/
      constants/
      guards/
      interceptors/
      services/
      store/
    shared/
      navigation/
      ui/metallic-*
      utils/
    features/
      auth/
      dashboard/
      fields/
      matches/
      ratings/
      sessions/
      social/
      teams/
      user/
  src/assets/icons/atleta/
  docs/
  e2e/
  tools/config/
```

## Instalacion y ejecucion local
Requisitos:

- Node.js 20 o superior
- npm
- Backend Atleta disponible, por defecto en `http://localhost:8080/api/v1`

```bash
npm ci
```

Opcionalmente crea un archivo de entorno:

```bash
cp .env.example .env.development
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env.development
```

Ejecutar en desarrollo:

```bash
npm start
```

Comandos utiles:

```bash
npm run build
npm run build:dev
npm run lint
npm run test
npm run e2e
```

## Estado del proyecto
Proyecto en estado funcional avanzado. Los flujos principales de autenticacion, onboarding, partidos, equipos, perfil competitivo y ranking estan implementados de extremo a extremo sobre una API propia. El repositorio tambien incluye configuracion de despliegue, pruebas automatizadas y estructura preparada para evolucionar modulos complementarios.

## Funcionalidades implementadas
- Login, registro y restauracion de sesion.
- Guards para rutas protegidas y onboarding.
- Perfil competitivo con datos del jugador.
- Equipos, partidos, canchas, invitaciones, cierre de partido y MVP.
- Rankings y leaderboard.
- Componentes visuales propios con estilo `metallic`.
- Runtime config para backend por ambiente.

## Funcionalidades en desarrollo o parciales
- Social hub: existe codigo y facade, pero la ruta activa redirige a partidos.
- Stats: pantalla existente con contenido de futura integracion.
- Push remoto: registro de token y badge conectados; falta validar proveedor/dispositivo real.
- Google auth: login frontend conectado a Google Identity Services y `/athletes/auth/google`; requiere `ATLETA_GOOGLE_CLIENT_ID`.
- Recuperacion de password: handler existente sin comportamiento final.

## Proximas mejoras
- Rehabilitar o retirar el modulo social.
- Consolidar historial de partidos duplicado.
- Separar responsabilidades del dominio `matches`.
- Fortalecer estrategia de token y sesion.
- Validar envio push remoto con proveedor real y dispositivo fisico.
- Ampliar E2E para flujos criticos.

## Valor profesional del proyecto
Este frontend demuestra dominio de Angular moderno, Ionic, arquitectura por features, componentes reutilizables, manejo de estado con signals/RxJS, consumo de APIs REST, experiencia mobile-first, pruebas automatizadas y preparacion de despliegue con configuracion runtime.

## Que conviene revisar primero
- Flujo de autenticacion y onboarding del jugador.
- Modulo de partidos: creacion, detalle, cierre y votacion MVP.
- Perfil competitivo con OVR, rol destacado y posiciones.
- Integracion con el backend propio de Atleta para datos, ranking y estado de sesion.
