# Deployment del Frontend Atleta

Fecha de actualizacion: 2026-04-23

## 1. Resumen tecnico del proyecto
- Framework principal: Ionic Angular standalone sobre Angular `20.x`.
- Build tool: Angular CLI `20` con builder `@angular-devkit/build-angular:application`.
- Salida de build: `www/`.
- Routing: Angular Router con rutas standalone definidas en `src/app/app.routes.ts`.
- Integracion movil: Capacitor `8` con `webDir: "www"`.
- Servidor de desarrollo: `ng serve`.
- Test E2E: Playwright.

## 2. Hallazgos del estado actual
### Build y configuracion
- El proyecto ya separaba `development` y `production` con `fileReplacements`, pero el `apiBaseUrl` estaba compilado fijo en `environment.ts` y `environment.prod.ts`.
- `ng build` sin flags generaba build de desarrollo porque el target `build` tenia `defaultConfiguration: "development"`.
- No existia `.env.example`.
- No habia artefactos Docker para despliegue como SPA estatica.

### Integraciones y dependencias criticas
- Backend consumido via `ApiService` base y `API_ENDPOINTS`.
- Endpoints backend dependian de `APP_CONFIG.apiBaseUrl`.
- Integraciones externas detectadas:
  - Google Fonts en `src/theme/variables.scss`
  - OpenStreetMap tiles en `venue-map.component.ts`
  - Google Maps search links en `venue-selected-card.component.ts`

### Riesgos detectados
- URL backend hardcodeada por build.
- Tokens de sesion almacenados en `localStorage`.
- `capacitor.config.ts` aun usa `appId: "io.ionic.starter"`.
- No habia estrategia formal para exponer solo variables publicas de frontend.

## 3. Cambios implementados en esta preparacion
- Se movio la configuracion publica del frontend a un runtime config generado en `src/assets/app-config.json`.
- Se agrego el script `tools/config/sync-runtime-config.mjs` para:
  - leer `.env`, `.env.development`, `.env.production` y variantes `.local`
  - generar solo variables publicas permitidas
  - validar que `ATLETA_API_BASE_URL` sea una URL absoluta segura
  - rechazar variables frontend `ATLETA_*` no soportadas
- Se agrego `AppConfigService` para cargar configuracion runtime antes de inicializar sesion.
- `npm run build` ahora genera build de produccion reproducible.
- `npm run build:dev` queda disponible para build de desarrollo.
- Se agregaron `Dockerfile`, `.dockerignore` y configuracion Nginx para SPA.
- El contenedor Docker escribe `assets/app-config.json` al arrancar, permitiendo cambiar backend sin recompilar la imagen.

## 4. Variables de entorno soportadas
Solo estas variables son validas para el frontend:

```env
ATLETA_APP_ENV=development
ATLETA_ENV_NAME=development
ATLETA_API_BASE_URL=http://localhost:8080/api/v1
ATLETA_STORAGE_PREFIX=atleta.dev
```

### Reglas
- No poner secretos en variables frontend.
- No definir passwords, JWT secretos, client secrets o credenciales de base de datos en el frontend.
- `ATLETA_API_BASE_URL` debe apuntar al backend publico que el navegador puede alcanzar.
- `ATLETA_STORAGE_PREFIX` define el namespace de `localStorage`.

## 5. Como correr en local
### Opcion A: defaults locales
1. Instalar dependencias:
   - `npm ci`
2. Levantar frontend:
   - `npm start`
3. Backend esperado por defecto:
   - `http://localhost:8080/api/v1`
4. Frontend esperado:
   - `http://localhost:4200`

### Opcion B: con `.env.development`
1. Crear `.env.development` a partir de `.env.example`.
2. Ajustar:

```env
ATLETA_APP_ENV=development
ATLETA_ENV_NAME=development
ATLETA_API_BASE_URL=http://localhost:8080/api/v1
ATLETA_STORAGE_PREFIX=atleta.dev
```

3. Ejecutar:
   - `npm start`

## 6. Como construir el build
### Produccion
```bash
npm ci
npm run build
```

Resultado:
- bundle optimizado en `www/`
- `outputHashing: all`
- reemplazo de `environment.ts` por `environment.prod.ts`
- runtime config publico generado antes del build

### Desarrollo
```bash
npm ci
npm run build:dev
```

## 7. Como se define el endpoint backend por ambiente
### Desarrollo local
```env
ATLETA_API_BASE_URL=http://localhost:8080/api/v1
ATLETA_STORAGE_PREFIX=atleta.dev
ATLETA_ENV_NAME=development
```

### Produccion
```env
ATLETA_API_BASE_URL=https://api.atleta.app/api/v1
ATLETA_STORAGE_PREFIX=atleta
ATLETA_ENV_NAME=production
```

### Staging sugerido
```env
ATLETA_API_BASE_URL=https://staging-api.atleta.app/api/v1
ATLETA_STORAGE_PREFIX=atleta.staging
ATLETA_ENV_NAME=staging
```

## 8. Despliegue en Vercel
Configuracion recomendada:
- Framework preset: `Other`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `www`

Variables recomendadas en Vercel:
- `ATLETA_APP_ENV=production`
- `ATLETA_ENV_NAME=production`
- `ATLETA_API_BASE_URL=https://api.atleta.app/api/v1`
- `ATLETA_STORAGE_PREFIX=atleta`

Notas:
- Si usas preview deployments, define una variante preview o staging del backend.
- Mantener el dominio frontend agregado al CORS del backend.

## 9. Despliegue en Netlify
Configuracion recomendada:
- Build command: `npm run build`
- Publish directory: `www`

Variables recomendadas:
- `ATLETA_APP_ENV=production`
- `ATLETA_ENV_NAME=production`
- `ATLETA_API_BASE_URL=https://api.atleta.app/api/v1`
- `ATLETA_STORAGE_PREFIX=atleta`

Redirect SPA recomendado en `netlify.toml` si luego se agrega:
- redirigir `/*` hacia `/index.html` con status `200`

## 10. Despliegue con Docker
### Build
```bash
docker build -t atleta-app .
```

### Run
```bash
docker run --rm -p 8081:80 \
  -e ATLETA_ENV_NAME=production \
  -e ATLETA_API_BASE_URL=https://api.atleta.app/api/v1 \
  -e ATLETA_STORAGE_PREFIX=atleta \
  atleta-app
```

Ventajas:
- La imagen no necesita recompilarse para cambiar el endpoint.
- Nginx resuelve rutas SPA con fallback a `index.html`.
- `assets/app-config.json` se marca como `no-store`.

## 11. Manejo de ambiente de desarrollo
- Usar backend local en `http://localhost:8080`.
- Mantener `ATLETA_STORAGE_PREFIX=atleta.dev` para no mezclar sesion con otros ambientes.
- Si se conecta a staging desde local, usar prefix distinto:
  - `ATLETA_STORAGE_PREFIX=atleta.staging.local`

## 12. Manejo de ambiente de produccion
- Publicar siempre bajo HTTPS.
- Apuntar a un backend HTTPS con CORS estricto.
- Usar `ATLETA_STORAGE_PREFIX=atleta`.
- Evitar mezclar preview/prod con el mismo `storagePrefix`.
- Preferir despliegue inmutable del bundle y cambiar solo `assets/app-config.json` cuando el hosting lo permita.

## 13. Seguridad frontend recomendada
- No exponer secretos ni credenciales en archivos `.env` del frontend.
- Mantener allowlist estricta de variables publicas.
- No usar `ATLETA_API_BASE_URL` con credenciales embebidas.
- Revisar politica CSP si el despliegue final exige endurecimiento.
- Evaluar self-hosting de fuentes para evitar dependencia externa de Google Fonts.
- Evaluar migrar tokens fuera de `localStorage` si el backend soporta cookies `HttpOnly`.
- Validar CORS, `X-Frame-Options`, `Referrer-Policy` y `Content-Security-Policy` desde el hosting/CDN.

## 14. Problemas detectados y oportunidades de mejora
### Hardcoded URLs detectadas
- Antes de esta tarea:
  - `src/environments/environment.ts`
  - `src/environments/environment.prod.ts`
- Se corrigio la URL backend hardcodeada para que pase por runtime config.

### URLs externas aun presentes
- Google Fonts
- OpenStreetMap tiles
- Google Maps search

### Secretos expuestos
- No se detectaron secretos reales en el bundle fuente revisado.
- El mayor riesgo actual no es un secreto hardcodeado, sino almacenamiento de tokens en `localStorage`.

### Configuraciones duplicadas o mejorables
- La distincion dev/prod existia por Angular file replacement y ahora tambien por runtime config; esto es intencional y permite fallback seguro.
- `capacitor.config.ts` sigue con identificador de plantilla.

### Dependencias no criticas para produccion
- Playwright, Karma y ESLint solo aplican a desarrollo/CI y ya viven en `devDependencies`.

## 15. Checklist previo a despliegue
- `npm ci` ejecuta sin errores
- `npm run build` genera `www/`
- `ATLETA_API_BASE_URL` apunta al backend correcto
- Backend tiene CORS habilitado para el dominio frontend
- `ATLETA_STORAGE_PREFIX` no colisiona con otros ambientes
- No se agregaron secretos al frontend
- Se validaron login, carga inicial y llamadas API principales
- Se reviso si el hosting resuelve SPA fallback a `index.html`
- Se confirmo disponibilidad HTTPS
- Se evaluo el riesgo de tokens en `localStorage`
