import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { AuthApiService } from './auth-api.service';
import { AuthService } from './auth.service';
import { SessionDataCleanupService } from './session-data-cleanup.service';

describe('AuthService logout', () => {
  let service: AuthService;
  let authSessionService: jasmine.SpyObj<AuthSessionService>;
  let sessionDataCleanupService: jasmine.SpyObj<SessionDataCleanupService>;

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
          tokens: { accessToken: 'token' },
        },
      },
    );
    sessionDataCleanupService = jasmine.createSpyObj<SessionDataCleanupService>(
      'SessionDataCleanupService',
      ['clear'],
    );

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthApiService, useValue: {} },
        { provide: AuthSessionService, useValue: authSessionService },
        { provide: SessionDataCleanupService, useValue: sessionDataCleanupService },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('cleans the current user data before clearing the auth session', () => {
    service.logout();

    expect(sessionDataCleanupService.clear).toHaveBeenCalledOnceWith('ath-1');
    expect(authSessionService.clearSession).toHaveBeenCalledTimes(1);
  });

  it('always clears credentials even when auxiliary cleanup fails', () => {
    sessionDataCleanupService.clear.and.throwError('storage failure');

    expect(() => service.logout()).toThrowError('storage failure');
    expect(authSessionService.clearSession).toHaveBeenCalledTimes(1);
  });
});
