import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { of } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { SessionDataCleanupService } from './session-data-cleanup.service';

describe('AuthService logout', () => {
  let service: AuthService;
  let authSessionService: jasmine.SpyObj<AuthSessionService>;
  let sessionDataCleanupService: jasmine.SpyObj<SessionDataCleanupService>;
  let authApiService: jasmine.SpyObj<AuthApiService>;

  beforeEach(() => {
    authSessionService = jasmine.createSpyObj<AuthSessionService>(
      'AuthSessionService',
      ['clearSession'],
      {
        currentSession: {
          user: {
            atletaUuid: 'ath-1',
            email: 'demo@atleta.cl',
            nombre: 'Demo',
          },
          tokens: { accessToken: 'token', refreshToken: 'refresh-token' },
        },
      },
    );
    sessionDataCleanupService = jasmine.createSpyObj<SessionDataCleanupService>(
      'SessionDataCleanupService',
      ['clear'],
    );
    authApiService = jasmine.createSpyObj<AuthApiService>('AuthApiService', [
      'logout', 'requestPasswordReset', 'confirmPasswordReset',
    ]);
    authApiService.logout.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthApiService, useValue: authApiService },
        { provide: AuthSessionService, useValue: authSessionService },
        { provide: SessionDataCleanupService, useValue: sessionDataCleanupService },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('revokes remotely, then cleans local user data and credentials', async () => {
    await service.logout();

    expect(authApiService.logout).toHaveBeenCalledOnceWith({ refreshToken: 'refresh-token' });
    expect(sessionDataCleanupService.clear).toHaveBeenCalledOnceWith('ath-1');
    expect(authSessionService.clearSession).toHaveBeenCalledTimes(1);
  });

  it('always clears credentials even when auxiliary cleanup fails', async () => {
    sessionDataCleanupService.clear.and.throwError('storage failure');

    await expectAsync(service.logout()).toBeRejectedWithError('storage failure');
    expect(authSessionService.clearSession).toHaveBeenCalledTimes(1);
  });
});
