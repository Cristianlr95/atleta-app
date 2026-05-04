import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const args = process.argv.slice(2);
const modeArg = args.find((value) => value.startsWith('--mode='));
const mode = normalizeMode(modeArg?.split('=')[1] ?? process.env.ATLETA_APP_ENV ?? process.env.NODE_ENV);

const envFiles = ['.env', `.env.${mode}`, '.env.local', `.env.${mode}.local`];
const loadedEnv = {};

for (const fileName of envFiles) {
  const filePath = path.join(rootDir, fileName);
  Object.assign(loadedEnv, await loadEnvFile(filePath));
}

const resolvedEnv = {
  ...process.env,
  ...loadedEnv,
};

validateNoSensitiveFrontendEnv(resolvedEnv);

const runtimeConfig = {
  apiBaseUrl: resolveApiBaseUrl(mode, resolvedEnv.ATLETA_API_BASE_URL),
  storagePrefix: resolveStoragePrefix(mode, resolvedEnv.ATLETA_STORAGE_PREFIX),
  environmentName: resolvedEnv.ATLETA_ENV_NAME?.trim() || mode,
  googleClientId: resolveOptionalPublicId(resolvedEnv.ATLETA_GOOGLE_CLIENT_ID),
};

const outputDir = path.join(rootDir, 'src', 'assets');
const outputPath = path.join(outputDir, 'app-config.json');

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(runtimeConfig, null, 2)}\n`, 'utf8');

console.log(`[runtime-config] Wrote ${path.relative(rootDir, outputPath)} for ${mode}.`);

function normalizeMode(value) {
  return value === 'production' ? 'production' : 'development';
}

async function loadEnvFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    return parseEnvFile(content);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

function parseEnvFile(content) {
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function validateNoSensitiveFrontendEnv(env) {
  const unsupportedKeys = Object.keys(env).filter((key) =>
    /^ATLETA_/i.test(key) &&
    ![
      'ATLETA_API_BASE_URL',
      'ATLETA_STORAGE_PREFIX',
      'ATLETA_ENV_NAME',
      'ATLETA_APP_ENV',
      'ATLETA_GOOGLE_CLIENT_ID',
    ].includes(key),
  );

  if (unsupportedKeys.length > 0) {
    throw new Error(
      `Unsupported frontend environment variables detected: ${unsupportedKeys.join(', ')}. ` +
        'Only public frontend variables are allowed.',
    );
  }
}

function resolveApiBaseUrl(mode, value) {
  const fallback =
    mode === 'production' ? 'https://api.atleta.app/api/v1' : 'http://localhost:8080/api/v1';
  const normalized = (value ?? fallback).trim().replace(/\/+$/, '');

  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error(`ATLETA_API_BASE_URL must be an absolute http(s) URL. Received: ${normalized}`);
  }

  if (normalized.includes('@')) {
    throw new Error('ATLETA_API_BASE_URL must not include embedded credentials.');
  }

  return normalized;
}

function resolveStoragePrefix(mode, value) {
  const fallback = mode === 'production' ? 'atleta' : 'atleta.dev';
  const normalized = (value ?? fallback).trim();

  if (!normalized) {
    throw new Error('ATLETA_STORAGE_PREFIX cannot be empty.');
  }

  return normalized;
}

function resolveOptionalPublicId(value) {
  const normalized = value?.trim();
  return normalized || undefined;
}
