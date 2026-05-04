import { Capacitor } from '@capacitor/core';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { SocialApiService } from 'src/app/features/social/services/social-api.service';

@Injectable({ providedIn: 'root' })
export class PushTokenSyncService {
  private readonly storageKey = 'atleta_push_token';
  private readonly syncedStorageKey = 'atleta_push_token_synced';
  private readonly deviceIdStorageKey = 'atleta_push_device_id';
  private readonly authSessionService = inject(AuthSessionService);
  private readonly socialApiService = inject(SocialApiService);
  private readonly lastSyncedTokenStore = signal<string | null>(null);
  private readonly syncErrorStore = signal(false);

  readonly lastSyncedToken = this.lastSyncedTokenStore.asReadonly();
  readonly syncError = this.syncErrorStore.asReadonly();

  constructor() {
    this.authSessionService.session$?.subscribe((session) => {
      if (!session) {
        this.lastSyncedTokenStore.set(null);
        this.syncErrorStore.set(false);
        return;
      }

      const storedToken =
        this.getStoredTokenForUser(session.user.atletaUuid) ??
        this.getStoredToken();

      if (storedToken) {
        void this.registerToken(storedToken).catch(() => void 0);
      }
    });
  }

  async registerToken(token: string): Promise<void> {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      return;
    }

    localStorage.setItem(this.storageKey, normalizedToken);

    const session = this.authSessionService.currentSession;
    if (!session) {
      return;
    }

    const playerUuid = session.user.atletaUuid;
    localStorage.setItem(this.userTokenKey(playerUuid), normalizedToken);

    if (localStorage.getItem(this.syncedKey(playerUuid)) === normalizedToken) {
      this.lastSyncedTokenStore.set(normalizedToken);
      return;
    }

    try {
      await firstValueFrom(
        this.socialApiService.registerPushToken({
          token: normalizedToken,
          platform: Capacitor.getPlatform(),
          deviceId: this.getOrCreateDeviceId(playerUuid),
        }),
      );

      localStorage.setItem(this.syncedKey(playerUuid), normalizedToken);
      this.lastSyncedTokenStore.set(normalizedToken);
      this.syncErrorStore.set(false);
    } catch (error) {
      this.syncErrorStore.set(true);
      throw error;
    }
  }

  getStoredToken(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  private getStoredTokenForUser(playerUuid: string): string | null {
    return localStorage.getItem(this.userTokenKey(playerUuid));
  }

  private userTokenKey(playerUuid: string): string {
    return `${this.storageKey}:${playerUuid}`;
  }

  private syncedKey(playerUuid: string): string {
    return `${this.syncedStorageKey}:${playerUuid}`;
  }

  private getOrCreateDeviceId(playerUuid: string): string {
    const key = `${this.deviceIdStorageKey}:${playerUuid}`;
    const existing = localStorage.getItem(key);
    if (existing) {
      return existing;
    }

    const generated = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, generated);
    return generated;
  }
}
