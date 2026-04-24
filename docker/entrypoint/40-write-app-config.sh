#!/bin/sh
set -eu

cat > /usr/share/nginx/html/assets/app-config.json <<EOF
{
  "apiBaseUrl": "${ATLETA_API_BASE_URL}",
  "storagePrefix": "${ATLETA_STORAGE_PREFIX}",
  "environmentName": "${ATLETA_ENV_NAME}"
}
EOF
