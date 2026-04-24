import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AppConfig, defaultAppConfig, normalizeAppConfig } from './app-config';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: AppConfig = defaultAppConfig;

  async load(): Promise<void> {
    const runtimeConfigUrl = new URL(environment.runtimeConfigPath, document.baseURI).toString();

    try {
      const response = await fetch(runtimeConfigUrl, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Runtime config request failed with status ${response.status}.`);
      }

      const runtimeConfig = (await response.json()) as Partial<AppConfig>;
      this.config = normalizeAppConfig(runtimeConfig);
    } catch (error) {
      console.warn('[app-config] Falling back to bundled defaults.', error);
      this.config = defaultAppConfig;
    }
  }

  getConfig(): AppConfig {
    return this.config;
  }
}
