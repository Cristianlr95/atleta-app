FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint/40-write-app-config.sh /docker-entrypoint.d/40-write-app-config.sh
COPY --from=build /app/www ./

ENV ATLETA_ENV_NAME=production
ENV ATLETA_API_BASE_URL=https://api.atleta.app/api/v1
ENV ATLETA_STORAGE_PREFIX=atleta

EXPOSE 80
