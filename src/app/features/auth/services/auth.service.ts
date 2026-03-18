import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiError } from 'src/app/core/models/api-error.model';
import {
  AuthSession,
  AuthTokens,
  AuthenticatedUser,
} from 'src/app/core/models/auth-session.model';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { AuthApiResponse, LoginRequest, RegisterAthleteRequest } from '../models/auth.models';
import { AuthApiService } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApiService = inject(AuthApiService);
  private readonly authSessionService = inject(AuthSessionService);

  login(credentials: LoginRequest): Observable<AuthSession> {
    return this.authApiService.login(credentials).pipe(
      map((response) => this.toSession(response.body, this.resolveAuthHeader(response.headers))),
      tap((session) => this.authSessionService.startSession(session)),
    );
  }

  register(payload: RegisterAthleteRequest): Observable<AuthenticatedUser> {
    return this.authApiService.registerAthlete(payload).pipe(map((response) => this.toUser(response)));
  }

  logout(): void {
    this.authSessionService.clearSession();
  }

  get isAuthenticated(): boolean {
    return this.authSessionService.isAuthenticated;
  }

  private toSession(payload: AuthApiResponse | null, authHeader: string | null): AuthSession {
    if (!payload) {
      throw this.authError('Empty login payload from server.');
    }

    const accessToken = this.resolveAccessToken(payload, authHeader);
    if (!accessToken) {
      throw this.authError('Access token was not provided by the API.');
    }

    const user = this.toUser(payload);
    const tokens: AuthTokens = {
      accessToken,
      refreshToken: this.resolveRefreshToken(payload),
    };

    return { user, tokens };
  }

  private toUser(payload: AuthApiResponse): AuthenticatedUser {
    const user = this.resolveUserPayload(payload);

    return {
      atletaUuid: user.atletaUuid,
      email: user.email,
      nombre: user.nombre,
      genero: user.genero,
      createdAt: user.createdAt,
    };
  }

  private resolveAccessToken(payload: AuthApiResponse, authHeader: string | null): string | null {
    const payloadToken = this.resolvePayloadToken(payload);
    if (payloadToken) {
      return payloadToken;
    }

    if (!authHeader) {
      return null;
    }

    return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  }

  private resolveRefreshToken(payload: AuthApiResponse): string | undefined {
    if (payload.refreshToken) {
      return payload.refreshToken;
    }

    const record = payload as unknown as Record<string, unknown>;
    const nestedTokens = this.recordValue(record['tokens']);
    if (!nestedTokens) {
      return undefined;
    }

    return this.stringValue(nestedTokens['refreshToken']) ?? this.stringValue(nestedTokens['refresh_token']) ?? undefined;
  }

  private resolveAuthHeader(headers: { get(name: string): string | null }): string | null {
    return (
      headers.get('Authorization') ??
      headers.get('authorization') ??
      headers.get('X-Access-Token') ??
      headers.get('x-access-token') ??
      headers.get('X-Auth-Token') ??
      headers.get('x-auth-token')
    );
  }

  private resolvePayloadToken(payload: AuthApiResponse): string | null {
    const record = payload as unknown as Record<string, unknown>;
    const directToken = this.tokenFromRecord(record);
    if (directToken) {
      return directToken;
    }

    const wrappers = ['tokens', 'data', 'result', 'payload', 'response', 'auth'];
    for (const wrapper of wrappers) {
      const wrapped = this.recordValue(record[wrapper]);
      if (!wrapped) {
        continue;
      }

      const wrappedToken = this.tokenFromRecord(wrapped);
      if (wrappedToken) {
        return wrappedToken;
      }
    }

    return this.deepSearchToken(record);
  }

  private tokenFromRecord(record: Record<string, unknown>): string | null {
    return (
      this.stringValue(record['accessToken']) ??
      this.stringValue(record['access_token']) ??
      this.stringValue(record['token']) ??
      this.stringValue(record['jwt']) ??
      this.stringValue(record['idToken']) ??
      this.stringValue(record['id_token']) ??
      null
    );
  }

  private deepSearchToken(value: unknown, depth = 0): string | null {
    if (depth > 3) {
      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = this.deepSearchToken(item, depth + 1);
        if (found) {
          return found;
        }
      }
      return null;
    }

    const record = this.recordValue(value);
    if (!record) {
      return null;
    }

    const token = this.tokenFromRecord(record);
    if (token) {
      return token;
    }

    for (const nested of Object.values(record)) {
      const found = this.deepSearchToken(nested, depth + 1);
      if (found) {
        return found;
      }
    }

    return null;
  }

  private resolveUserPayload(payload: AuthApiResponse): AuthApiResponse {
    if (payload.atletaUuid && payload.email && payload.nombre) {
      return payload;
    }

    const record = payload as unknown as Record<string, unknown>;
    const wrappers = ['user', 'athlete', 'atleta', 'data', 'result', 'payload', 'response'];

    for (const wrapper of wrappers) {
      const candidate = this.recordValue(record[wrapper]);
      if (!candidate) {
        continue;
      }

      const nestedAthlete = this.recordValue(candidate['athlete']) ?? this.recordValue(candidate['atleta']);
      const source = nestedAthlete ?? candidate;

      const atletaUuid =
        this.stringValue(source['atletaUuid']) ??
        this.stringValue(source['athleteUuid']) ??
        this.stringValue(source['uuid']);
      const email = this.stringValue(source['email']);
      const nombre = this.stringValue(source['nombre']) ?? this.stringValue(source['name']);
      const genero =
        this.stringValue(source['genero']) ??
        this.stringValue(source['gender']);

      if (atletaUuid && email && nombre) {
        return {
          atletaUuid,
          email,
          nombre,
          genero: (genero as AuthApiResponse['genero']) ?? undefined,
          createdAt:
            this.stringValue(source['createdAt']) ??
            this.stringValue(source['created_at']) ??
            undefined,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          token: payload.token,
        };
      }
    }

    return payload;
  }

  private recordValue(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  }

  private stringValue(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private authError(message: string): ApiError {
    return {
      status: 401,
      message,
      code: 'AUTH_TOKEN_MISSING',
    };
  }
}
