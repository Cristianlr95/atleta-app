import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  private readonly tokenStorage = inject(TokenStorageService);


  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isPublicEndpoint(req.url)) {
      return next.handle(req);
    }

    const token = this.tokenStorage.getAccessToken();
    if (!token) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      }),
    );
  }

  private isPublicEndpoint(url: string): boolean {
    return (
      url.includes(API_ENDPOINTS.auth.login) ||
      url.includes(API_ENDPOINTS.auth.registerAthlete)
    );
  }
}
