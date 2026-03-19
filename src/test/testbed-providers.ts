import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { AppConfig } from '../app/core/config/app-config';
import { APP_CONFIG } from '../app/core/config/app-config.token';
import { AuthSession } from '../app/core/models/auth-session.model';
import { AuthSessionService } from '../app/core/services/auth-session.service';
import { of } from 'rxjs';

const defaultAppConfig: AppConfig = {
  apiBaseUrl: 'http://localhost:8080/api/v1',
  storagePrefix: 'atleta.test',
};

export function provideAppConfigMock(overrides?: Partial<AppConfig>): Provider {
  return {
    provide: APP_CONFIG,
    useValue: { ...defaultAppConfig, ...overrides },
  };
}

export function provideHttpTesting(): Array<Provider | EnvironmentProviders> {
  return [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()];
}

export function provideAuthMocks(session: AuthSession | null = null): Provider {
  return {
    provide: AuthSessionService,
    useValue: {
      currentSession: session,
      session$: of(session),
      isAuthenticated: Boolean(session),
      getValidSession: () => session,
      startSession: () => void 0,
      clearSession: () => void 0,
    } satisfies Partial<AuthSessionService>,
  };
}
