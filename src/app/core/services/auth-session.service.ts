import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthSession } from '../models/auth-session.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(null);
  readonly session$ = this.sessionSubject.asObservable();

  constructor() {
    this.restoreSession();
  }

  get currentSession(): AuthSession | null {
    return this.getValidSession();
  }

  get isAuthenticated(): boolean {
    return Boolean(this.getValidSession());
  }

  getValidSession(): AuthSession | null {
    const activeSession = this.sessionSubject.value;
    if (activeSession) {
      return this.validateSession(activeSession);
    }

    return this.restoreSession();
  }

  startSession(session: AuthSession): void {
    this.tokenStorage.setTokens(session.tokens.accessToken, session.tokens.refreshToken);
    this.persistSession(session);
    this.sessionSubject.next(session);
  }

  clearSession(): void {
    this.tokenStorage.clear();
    this.sessionSubject.next(null);
  }

  private restoreSession(): AuthSession | null {
    const accessToken = this.tokenStorage.getAccessToken();
    if (!accessToken) {
      this.sessionSubject.next(null);
      return null;
    }

    const refreshToken = this.tokenStorage.getRefreshToken() ?? undefined;
    const persistedSession = this.readPersistedSession();
    const restoredSession = persistedSession ?? this.buildSessionFromToken(accessToken, refreshToken);

    if (!restoredSession) {
      this.clearSession();
      return null;
    }

    return this.validateSession({
      ...restoredSession,
      tokens: {
        ...restoredSession.tokens,
        accessToken,
        refreshToken,
      },
    });
  }

  private validateSession(session: AuthSession): AuthSession | null {
    if (!session.tokens.accessToken || this.isTokenExpired(session.tokens.accessToken)) {
      this.clearSession();
      return null;
    }

    if (!session.user.atletaUuid) {
      this.clearSession();
      return null;
    }

    const current = this.sessionSubject.value;
    if (!current || JSON.stringify(current) !== JSON.stringify(session)) {
      this.persistSession(session);
      this.sessionSubject.next(session);
    }

    return session;
  }

  private readPersistedSession(): AuthSession | null {
    const rawSession = this.tokenStorage.getSession();
    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as AuthSession;
    } catch {
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    this.tokenStorage.setSession(JSON.stringify(session));
  }

  private buildSessionFromToken(accessToken: string, refreshToken?: string): AuthSession | null {
    const claims = this.decodeJwtPayload(accessToken);
    const atletaUuid = this.stringClaim(claims, [
      'atletaUuid',
      'athleteUuid',
      'uuid',
      'userUuid',
      'sub',
    ]);

    if (!atletaUuid) {
      return null;
    }

    const email = this.stringClaim(claims, ['email']) ?? 'unknown@atleta.local';
    const nombre =
      this.stringClaim(claims, ['nombre', 'name', 'alias', 'preferred_username']) ??
      email.split('@')[0] ??
      'Jugador';
    const genero = this.stringClaim(claims, ['genero', 'gender']);

    return {
      user: {
        atletaUuid,
        email,
        nombre,
        genero: genero === 'MASCULINO' || genero === 'FEMENINO' ? genero : undefined,
        createdAt: this.stringClaim(claims, ['createdAt', 'created_at']) ?? undefined,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  private isTokenExpired(token: string): boolean {
    const claims = this.decodeJwtPayload(token);
    if (!claims) {
      return false;
    }

    const exp = claims['exp'];
    return typeof exp === 'number' ? exp * 1000 <= Date.now() : false;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const segments = token.split('.');
    if (segments.length !== 3) {
      return null;
    }

    try {
      const payload = segments[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(segments[1].length / 4) * 4, '=');

      return JSON.parse(atob(payload)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private stringClaim(claims: Record<string, unknown> | null, keys: string[]): string | null {
    if (!claims) {
      return null;
    }

    for (const key of keys) {
      const value = claims[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return null;
  }
}
