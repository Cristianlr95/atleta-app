import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthSession } from '../models/auth-session.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(null);
  readonly session$ = this.sessionSubject.asObservable();

  get currentSession(): AuthSession | null {
    return this.sessionSubject.value;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.tokenStorage.getAccessToken());
  }

  startSession(session: AuthSession): void {
    this.tokenStorage.setTokens(session.tokens.accessToken, session.tokens.refreshToken);
    this.sessionSubject.next(session);
  }

  clearSession(): void {
    this.tokenStorage.clear();
    this.sessionSubject.next(null);
  }
}
