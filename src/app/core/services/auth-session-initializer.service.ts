import { Injectable, Injector, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserApiService } from '../../features/user/services/user-api.service';
import { ApiError } from '../models/api-error.model';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthSessionInitializerService {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly injector = inject(Injector);

  private initPromise: Promise<void> | null = null;
  private initialized = false;

  initSession(): Promise<void> {
    if (this.initialized) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.runInit().finally(() => {
      this.initialized = true;
      this.initPromise = null;
    });

    return this.initPromise;
  }

  private async runInit(): Promise<void> {
    const seededSession = this.authSessionService.getValidSession();
    if (!seededSession) {
      return;
    }

    const userApiService = this.injector.get(UserApiService);

    try {
      const athlete = await firstValueFrom(userApiService.getAthlete(seededSession.user.atletaUuid));

      this.authSessionService.startSession({
        user: {
          atletaUuid: athlete.atletaUuid,
          email: athlete.email,
          nombre: athlete.nombre,
          genero: athlete.genero,
          createdAt: athlete.createdAt,
        },
        tokens: seededSession.tokens,
      });
    } catch (error) {
      const apiError = error as Partial<ApiError> | undefined;

      if (apiError?.status === 401 || apiError?.status === 403 || apiError?.status === 404) {
        this.authSessionService.clearSession();
        return;
      }

      // Preserve the locally restored session if backend validation is temporarily unavailable.
      this.authSessionService.startSession(seededSession);
    }
  }
}
