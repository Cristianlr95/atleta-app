# Deployment y Operacion del Frontend

Fecha de actualizacion: 2026-04-23

## Como correr el frontend en desarrollo
1. Instalar dependencias:
   - `npm install`
2. Levantar el frontend:
   - `npm start`
3. URL esperada por defecto:
   - `http://localhost:4200`
4. Para E2E Playwright, el propio config levanta servidor en:
   - `http://localhost:8100`

## Scripts detectados
- `npm start`
- `npm run build`
- `npm run watch`
- `npm test`
- `npm run lint`
- `npm run e2e`
- `npm run e2e:headed`

## Variables de entorno detectadas
No hay `.env` frontend nativo detectado. La configuracion esta compilada en:
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Valores actuales:
- Desarrollo:
  - `apiBaseUrl: http://localhost:8080/api/v1`
  - `storagePrefix: atleta`
- Produccion:
  - `apiBaseUrl: https://api.atleta.app/api/v1`
  - `storagePrefix: atleta`

## Build local
- Build standard:
  - `npm run build`
- Angular genera salida en:
  - `www/`

Observaciones:
- `angular.json` usa configuracion `production` con file replacement.
- No se detecto Dockerfile frontend ni pipeline de deploy frontend en este repo.

## Capacitor / app movil
- `capacitor.config.ts` existe.
- `webDir` apunta a `www`.
- Hallazgo: `appId` sigue siendo `io.ionic.starter`, lo que conviene corregir antes de un release movil real.

## Recomendaciones de Docker
Estado actual:
- No aplica directamente porque no existe Dockerfile frontend en el repo.

Si se necesitara Dockerizar:
- Recomendado usar multi-stage:
  - stage 1: `node` para `npm ci` + `npm run build`
  - stage 2: `nginx:alpine` para servir `www`
- Importante: no hardcodear `apiBaseUrl` si se piensa desplegar la misma imagen en varios entornos.

## Estrategia segura de despliegue a produccion
- Tratar el frontend como app estatica.
- Servir por HTTPS.
- Mantener backend API en dominio separado, idealmente `api.atleta.app`.
- Definir CORS estricto desde backend hacia dominios frontend permitidos.
- Agregar versionado/cache control para assets.
- Considerar runtime config si se requiere cambiar endpoint sin recompilar.

## Hosting recomendado
- Recomendado para este estado del repo:
  - Vercel
  - Netlify
  - Cloudflare Pages
  - S3 + CloudFront

## Manejo de secretos
- El frontend no debe contener secretos reales.
- Hoy no se detectan secretos inyectados desde `.env`, pero si hay URLs fijas compiladas.
- Access token y refresh token se guardan en `localStorage`.

Riesgo:
- `localStorage` expone la sesion a XSS.

## Configuracion de entornos dev/prod
- Dev/prod se separan solo por `environment.ts` y `environment.prod.ts`.
- No hay entorno `staging` frontend detectado.
- No hay runtime config ni feature flags detectados.

## Buenas practicas de seguridad para frontend
- Mantener CSP estricta si se despliega con dominio propio.
- Revisar la carga de Google Fonts desde CDN si se requiere politica CSP cerrada.
- Evitar guardar refresh token en `localStorage` si el modelo backend permite alternativa mas segura.
- No exponer claves de terceros en el bundle.

## Riesgos operativos detectados
- `apiBaseUrl` esta hardcodeado por build, lo que dificulta despliegues multi-entorno.
- `NotificationBadgeService.refresh()` no consulta backend.
- Push token sync aun no esta integrado con backend.
- Configuracion Capacitor aun luce base/template.
