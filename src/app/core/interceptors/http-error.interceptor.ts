import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { createLoginRedirect } from '../guards/auth.guard';
import { AuthSessionService } from '../services/auth-session.service';
import { HttpErrorService } from '../services/http-error.service';
import { NavigationService } from '../services/navigation.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly httpErrorService = inject(HttpErrorService);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authSessionService.clearSession();
          const loginUrl = this.router.serializeUrl(
            createLoginRedirect(this.router, { url: this.router.url }),
          );
          void this.navigationService.safeNavigateByUrl(loginUrl);
        }

        return throwError(() => this.httpErrorService.map(error));
      }),
    );
  }
}
