import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserApiService } from '../../features/user/services/user-api.service';
import { ApiError } from '../models/api-error.model';
import { AuthSession } from '../models/auth-session.model';
import { AuthSessionInitializerService } from './auth-session-initializer.service';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionInitializerService', () => {
  let authSessionService: jasmine.SpyObj<AuthSessionService>;
  let userApiService: jasmine.SpyObj<UserApiService>;
  let service: AuthSessionInitializerService;

  beforeEach(() => {
    authSessionService = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'getValidSession',
      'startSession',
      'clearSession',
    ]);
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', ['getAthlete']);

    TestBed.configureTestingModule({
      providers: [
        AuthSessionInitializerService,
        { provide: AuthSessionService, useValue: authSessionService },
        { provide: UserApiService, useValue: userApiService },
      ],
    });

    service = TestBed.inject(AuthSessionInitializerService);
  });

  it('does nothing when there is no stored valid session', async () => {
    authSessionService.getValidSession.and.returnValue(null);

    await service.initSession();

    expect(userApiService.getAthlete).not.toHaveBeenCalled();
    expect(authSessionService.startSession).not.toHaveBeenCalled();
    expect(authSessionService.clearSession).not.toHaveBeenCalled();
  });

  it('loads the current user from backend and refreshes the session', async () => {
    const seededSession = buildSession();
    authSessionService.getValidSession.and.returnValue(seededSession);
    userApiService.getAthlete.and.returnValue(
      of({
        atletaUuid: 'ath-1',
        email: 'updated@atleta.cl',
        nombre: 'Jugador actualizado',
        genero: 'MASCULINO',
        createdAt: '2026-03-19T10:00:00Z',
      }),
    );

    await service.initSession();

    expect(userApiService.getAthlete).toHaveBeenCalledWith('ath-1');
    expect(authSessionService.startSession).toHaveBeenCalledWith({
      user: {
        atletaUuid: 'ath-1',
        email: 'updated@atleta.cl',
        nombre: 'Jugador actualizado',
        genero: 'MASCULINO',
        createdAt: '2026-03-19T10:00:00Z',
      },
      tokens: seededSession.tokens,
    });
  });

  it('clears the session when backend rejects the token', async () => {
    authSessionService.getValidSession.and.returnValue(buildSession());
    userApiService.getAthlete.and.returnValue(
      throwError(() => ({
        status: 401,
        message: 'expired',
      } satisfies ApiError)),
    );

    await service.initSession();

    expect(authSessionService.clearSession).toHaveBeenCalled();
    expect(authSessionService.startSession).not.toHaveBeenCalled();
  });

  it('keeps the seeded session when backend validation fails for network reasons', async () => {
    const seededSession = buildSession();
    authSessionService.getValidSession.and.returnValue(seededSession);
    userApiService.getAthlete.and.returnValue(
      throwError(() => ({
        status: 500,
        message: 'temporary failure',
      } satisfies ApiError)),
    );

    await service.initSession();

    expect(authSessionService.clearSession).not.toHaveBeenCalled();
    expect(authSessionService.startSession).toHaveBeenCalledWith(seededSession);
  });
});

function buildSession(): AuthSession {
  return {
    user: {
      atletaUuid: 'ath-1',
      email: 'demo@atleta.cl',
      nombre: 'Demo',
    },
    tokens: {
      accessToken: 'token',
      refreshToken: 'refresh-token',
    },
  };
}
