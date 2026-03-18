import { EnvironmentProviders, importProvidersFrom, makeEnvironmentProviders } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { APP_CONFIG } from './config/app-config.token';
import { appConfig } from './config/app-config';
import { AuthTokenInterceptor } from './interceptors/auth-token.interceptor';
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor';
import { CoreModule } from './core.module';

export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    importProvidersFrom(CoreModule.forRoot()),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: APP_CONFIG, useValue: appConfig },
    { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
  ]);
}
