import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap, throwError } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { AuthApiResponse } from 'src/app/features/auth/models/auth.models';
import { AuthSessionService } from './auth-session.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class SessionRefreshService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly config = inject(APP_CONFIG);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly authSession = inject(AuthSessionService);
  private refreshInFlight$: Observable<string> | null = null;

  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    this.refreshInFlight$ = this.http
      .post<AuthApiResponse>(`${this.config.apiBaseUrl}${API_ENDPOINTS.auth.refresh}`, { refreshToken })
      .pipe(
        map((response) => {
          if (!response.accessToken || !response.refreshToken) {
            throw new Error('Invalid refresh response');
          }
          return response;
        }),
        tap((response) => {
          const replaced = this.authSession.replaceTokens(response.accessToken!, response.refreshToken!);
          if (!replaced) {
            this.authSession.startSession({
              user: {
                atletaUuid: response.atletaUuid,
                email: response.email,
                nombre: response.nombre,
                genero: response.genero,
                createdAt: response.createdAt,
              },
              tokens: { accessToken: response.accessToken!, refreshToken: response.refreshToken },
            });
          }
        }),
        map((response) => response.accessToken!),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.refreshInFlight$;
  }
}
