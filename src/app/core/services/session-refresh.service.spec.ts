import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config.token';
import { AuthSessionService } from './auth-session.service';
import { SessionRefreshService } from './session-refresh.service';
import { TokenStorageService } from './token-storage.service';

describe('SessionRefreshService', () => {
  let service: SessionRefreshService;
  let http: HttpTestingController;
  let authSession: jasmine.SpyObj<AuthSessionService>;

  beforeEach(() => {
    authSession = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', ['replaceTokens', 'startSession']);
    authSession.replaceTokens.and.returnValue({
      user: { atletaUuid: 'ath-1', email: 'demo@atleta.cl', nombre: 'Demo' },
      tokens: { accessToken: 'access-2', refreshToken: 'refresh-2' },
    });
    TestBed.configureTestingModule({ providers: [
      SessionRefreshService,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: APP_CONFIG, useValue: { apiBaseUrl: 'http://localhost:8080/api/v1', storagePrefix: 'test' } },
      { provide: TokenStorageService, useValue: { getRefreshToken: () => 'refresh-1' } },
      { provide: AuthSessionService, useValue: authSession },
    ] });
    service = TestBed.inject(SessionRefreshService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shares one rotation request and persists the new token pair', () => {
    const values: string[] = [];
    service.refreshAccessToken().subscribe((value) => values.push(value));
    service.refreshAccessToken().subscribe((value) => values.push(value));

    const request = http.expectOne('http://localhost:8080/api/v1/athletes/auth/refresh');
    expect(request.request.body).toEqual({ refreshToken: 'refresh-1' });
    request.flush({
      atletaUuid: 'ath-1', email: 'demo@atleta.cl', nombre: 'Demo',
      accessToken: 'access-2', refreshToken: 'refresh-2',
    });

    expect(values).toEqual(['access-2', 'access-2']);
    expect(authSession.replaceTokens).toHaveBeenCalledOnceWith('access-2', 'refresh-2');
  });
});
