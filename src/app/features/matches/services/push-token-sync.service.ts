import { Injectable, signal } from '@angular/core';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';

@Injectable({ providedIn: 'root' })
export class PushTokenSyncService {
  private readonly storageKey = 'atleta_push_token';
  private readonly lastSyncedTokenStore = signal<string | null>(null);

  readonly lastSyncedToken = this.lastSyncedTokenStore.asReadonly();

  constructor(private readonly authSessionService: AuthSessionService) {}

  async registerToken(token: string): Promise<void> {
    this.lastSyncedTokenStore.set(token);
    localStorage.setItem(this.storageKey, token);

    const session = this.authSessionService.currentSession;
    if (!session) {
      return;
    }

    // TODO backend: enviar token al endpoint definitivo de push-token registry.
    // Por ahora se conserva localmente para no perder el token en desarrollo.
    localStorage.setItem(`${this.storageKey}:${session.user.atletaUuid}`, token);
  }

  getStoredToken(): string | null {
    return localStorage.getItem(this.storageKey);
  }
}
