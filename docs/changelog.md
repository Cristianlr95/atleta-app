# Changelog

## 2026-04-23

### Preparacion inicial de despliegue frontend
- Se preparo el frontend de Atleta para despliegue reproducible en desarrollo y produccion.
- Se reemplazo la configuracion fija del backend por runtime config publico.
- Se dejo el build de produccion como flujo principal de `npm run build`.

### Archivos creados o modificados
- `package.json`
- `angular.json`
- `.gitignore`
- `.env.example`
- `Dockerfile`
- `.dockerignore`
- `docker/nginx/default.conf`
- `docker/entrypoint/40-write-app-config.sh`
- `tools/config/sync-runtime-config.mjs`
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`
- `src/app/core/config/app-config.ts`
- `src/app/core/config/app-config.service.ts`
- `src/app/core/core.providers.ts`
- `src/test/testbed-providers.ts`
- `docs/deployment.md`
- `docs/changelog.md`

### Riesgos detectados
- La sesion y tokens siguen almacenados en `localStorage`.
- `capacitor.config.ts` conserva un `appId` de plantilla y no deberia salir asi a una release movil real.
- El frontend sigue dependiendo de terceros para fuentes y mapas.
- Si se requiere configuracion runtime fuera de Docker, el hosting debe permitir generar `assets/app-config.json` en build o despliegue.
