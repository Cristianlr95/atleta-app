import { environment } from 'src/environments/environment';

export interface AppConfig {
  apiBaseUrl: string;
  storagePrefix: string;
  environmentName: string;
}

export const defaultAppConfig: AppConfig = normalizeAppConfig(environment.defaultAppConfig, {
  apiBaseUrl: 'http://localhost:8080/api/v1',
  storagePrefix: 'atleta.dev',
  environmentName: 'development',
});

export function normalizeAppConfig(
  config: Partial<AppConfig> | null | undefined,
  fallback: AppConfig = defaultAppConfig,
): AppConfig {
  const apiBaseUrl = normalizeApiBaseUrl(config?.apiBaseUrl ?? fallback.apiBaseUrl);
  const storagePrefix = normalizeStoragePrefix(config?.storagePrefix ?? fallback.storagePrefix);
  const environmentName = normalizeEnvironmentName(config?.environmentName ?? fallback.environmentName);

  return {
    apiBaseUrl,
    storagePrefix,
    environmentName,
  };
}

function normalizeApiBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '');

  if (!normalized) {
    throw new Error('AppConfig.apiBaseUrl is required.');
  }

  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error(`AppConfig.apiBaseUrl must be an absolute URL. Received: ${value}`);
  }

  return normalized;
}

function normalizeStoragePrefix(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error('AppConfig.storagePrefix is required.');
  }

  return normalized;
}

function normalizeEnvironmentName(value: string): string {
  const normalized = value.trim();

  return normalized || 'development';
}
