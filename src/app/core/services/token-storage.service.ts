import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '../config/app-config.token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly config = inject(APP_CONFIG);

  private get accessTokenKey(): string {
    return `${this.config.storagePrefix}.access-token`;
  }

  private get refreshTokenKey(): string {
    return `${this.config.storagePrefix}.refresh-token`;
  }

  private get sessionKey(): string {
    return `${this.config.storagePrefix}.auth-session`;
  }

  getAccessToken(): string | null {
    return this.safeRead(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return this.safeRead(this.refreshTokenKey);
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    this.safeWrite(this.accessTokenKey, accessToken);
    if (refreshToken) {
      this.safeWrite(this.refreshTokenKey, refreshToken);
    }
  }

  getSession(): string | null {
    return this.safeRead(this.sessionKey);
  }

  setSession(session: string): void {
    this.safeWrite(this.sessionKey, session);
  }

  clear(): void {
    this.safeRemove(this.accessTokenKey);
    this.safeRemove(this.refreshTokenKey);
    this.safeRemove(this.sessionKey);
  }

  private safeRead(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeWrite(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage can fail on private mode/quota restrictions.
    }
  }

  private safeRemove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage can fail on private mode/quota restrictions.
    }
  }
}
