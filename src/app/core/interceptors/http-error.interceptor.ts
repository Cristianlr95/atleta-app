import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpContextToken,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { createLoginRedirect } from '../guards/auth.guard';
import { AuthSessionService } from '../services/auth-session.service';
import { HttpErrorService } from '../services/http-error.service';
import { NavigationService } from '../services/navigation.service';
import { SessionRefreshService } from '../services/session-refresh.service';

const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly httpErrorService = inject(HttpErrorService);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly sessionRefreshService = inject(SessionRefreshService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && this.canRefresh(req)) {
          return this.sessionRefreshService.refreshAccessToken().pipe(
            switchMap((accessToken) => next.handle(req.clone({
              context: req.context.set(AUTH_RETRY, true),
              setHeaders: { Authorization: `Bearer ${accessToken}` },
            }))),
            catchError((refreshError: HttpErrorResponse) => this.expireSession(refreshError)),
          );
        }

        if (error.status === 401) {
          return this.expireSession(error);
        }

        return throwError(() => this.httpErrorService.map(error));
      }),
    );
  }

  private canRefresh(req: HttpRequest<unknown>): boolean {
    const publicPaths = [
      API_ENDPOINTS.auth.login,
      API_ENDPOINTS.auth.registerAthlete,
      API_ENDPOINTS.auth.googleLogin,
      API_ENDPOINTS.auth.refresh,
      API_ENDPOINTS.auth.logout,
      API_ENDPOINTS.auth.passwordResetRequest,
      API_ENDPOINTS.auth.passwordResetConfirm,
    ];
    return !req.context.get(AUTH_RETRY) && !publicPaths.some((path) => req.url.includes(path));
  }

  private expireSession(error: unknown): Observable<never> {
    this.authSessionService.clearSession();
    const loginUrl = this.router.serializeUrl(createLoginRedirect(this.router, { url: this.router.url }));
    void this.navigationService.safeNavigateByUrl(loginUrl);
    return throwError(() => error instanceof HttpErrorResponse ? this.httpErrorService.map(error) : error);
  }
}
