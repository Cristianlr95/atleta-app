import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {
  APP_INITIALIZER,
  EnvironmentProviders,
  importProvidersFrom,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { appConfig } from './config/app-config';
import { APP_CONFIG } from './config/app-config.token';
import { CoreModule } from './core.module';
import { AuthTokenInterceptor } from './interceptors/auth-token.interceptor';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { AuthSessionInitializerService } from './services/auth-session-initializer.service';

function initializeAuthSession(): () => Promise<void> {
  const authSessionInitializer = inject(AuthSessionInitializerService);

  return () => authSessionInitializer.initSession();
}

export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    importProvidersFrom(CoreModule.forRoot()),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: APP_CONFIG, useValue: appConfig },
    { provide: APP_INITIALIZER, useFactory: initializeAuthSession, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
  ]);
}
