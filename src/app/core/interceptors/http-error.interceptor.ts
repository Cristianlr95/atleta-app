import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthSessionService } from '../services/auth-session.service';
import { HttpErrorService } from '../services/http-error.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly httpErrorService = inject(HttpErrorService);


  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authSessionService.clearSession();
        }

        return throwError(() => this.httpErrorService.map(error));
      }),
    );
  }
}
