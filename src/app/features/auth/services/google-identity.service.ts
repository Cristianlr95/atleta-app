import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { APP_CONFIG } from 'src/app/core/config/app-config.token';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GooglePromptMomentNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
  isDismissedMoment(): boolean;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  prompt(callback?: (notification: GooglePromptMomentNotification) => void): void;
}

interface GoogleIdentityWindow extends Window {
  google?: {
    accounts?: {
      id?: GoogleAccountsId;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly document = inject(DOCUMENT);

  private scriptLoad?: Promise<void>;

  async requestIdToken(): Promise<string> {
    const clientId = this.appConfig.googleClientId;
    if (!clientId) {
      throw new Error('Google auth no esta configurado para este ambiente.');
    }

    await this.loadScript();
    const googleId = this.googleAccountsId();
    if (!googleId) {
      throw new Error('No se pudo cargar Google Identity Services.');
    }

    return new Promise<string>((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void): void => {
        if (settled) {
          return;
        }
        settled = true;
        callback();
      };

      googleId.initialize({
        client_id: clientId,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: (response) => {
          const credential = response.credential?.trim();
          if (!credential) {
            finish(() => reject(new Error('Google no entrego una credencial valida.')));
            return;
          }
          finish(() => resolve(credential));
        },
      });

      googleId.prompt((notification) => {
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.isDismissedMoment()
        ) {
          finish(() => reject(new Error('Inicio con Google cancelado o no disponible.')));
        }
      });
    });
  }

  private loadScript(): Promise<void> {
    if (this.googleAccountsId()) {
      return Promise.resolve();
    }

    if (this.scriptLoad) {
      return this.scriptLoad;
    }

    this.scriptLoad = new Promise<void>((resolve, reject) => {
      const existing = this.document.querySelector<HTMLScriptElement>('script[data-atleta-google-identity]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services.')), {
          once: true,
        });
        return;
      }

      const script = this.document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset['atletaGoogleIdentity'] = 'true';
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity Services.')), {
        once: true,
      });
      this.document.head.appendChild(script);
    });

    return this.scriptLoad;
  }

  private googleAccountsId(): GoogleAccountsId | undefined {
    return (this.document.defaultView as GoogleIdentityWindow | null)?.google?.accounts?.id;
  }
}
