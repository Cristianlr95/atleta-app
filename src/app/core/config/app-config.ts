import { environment } from 'src/environments/environment';

export interface AppConfig {
  apiBaseUrl: string;
  storagePrefix: string;
}

export const appConfig: AppConfig = {
  apiBaseUrl: environment.apiBaseUrl,
  storagePrefix: environment.storagePrefix,
};
