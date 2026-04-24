import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  APP_INITIALIZER,
  EnvironmentProviders,
  importProvidersFrom,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { APP_CONFIG } from './config/app-config.token';
import { AppConfigService } from './config/app-config.service';
import { CoreModule } from './core.module';
import { AuthTokenInterceptor } from './interceptors/auth-token.interceptor';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { AuthSessionInitializerService } from './services/auth-session-initializer.service';

function initializeApplication(): () => Promise<void> {
  const appConfigService = inject(AppConfigService);
  const authSessionInitializer = inject(AuthSessionInitializerService);

  return async () => {
    await appConfigService.load();
    await authSessionInitializer.initSession();
  };
}

export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    importProvidersFrom(CoreModule.forRoot()),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: APP_CONFIG, useFactory: () => inject(AppConfigService).getConfig() },
    { provide: APP_INITIALIZER, useFactory: initializeApplication, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
  ]);
}
