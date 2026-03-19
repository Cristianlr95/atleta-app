import { TestBed } from '@angular/core/testing';
import { provideAppConfigMock } from '../../../test/testbed-providers';
import { AuthSession } from '../models/auth-session.model';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('rehydrates a stored session when the token is still valid', () => {
    TestBed.configureTestingModule({
      providers: [AuthSessionService, provideAppConfigMock()],
    });

    const service = TestBed.inject(AuthSessionService);
    service.startSession(buildSession(buildJwt({ sub: 'ath-1', email: 'demo@atleta.cl', nombre: 'Demo', exp: futureExp() })));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthSessionService, provideAppConfigMock()],
    });

    const restored = TestBed.inject(AuthSessionService);

    expect(restored.currentSession?.user.atletaUuid).toBe('ath-1');
    expect(restored.currentSession?.user.nombre).toBe('Demo');
    expect(restored.isAuthenticated).toBeTrue();
  });

  it('clears the session when the stored token is expired', () => {
    TestBed.configureTestingModule({
      providers: [AuthSessionService, provideAppConfigMock()],
    });

    const service = TestBed.inject(AuthSessionService);
    service.startSession(buildSession(buildJwt({ sub: 'ath-2', exp: pastExp() })));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthSessionService, provideAppConfigMock()],
    });

    const restored = TestBed.inject(AuthSessionService);

    expect(restored.currentSession).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});

function buildSession(accessToken: string): AuthSession {
  return {
    user: {
      atletaUuid: 'ath-1',
      email: 'demo@atleta.cl',
      nombre: 'Demo',
    },
    tokens: {
      accessToken,
    },
  };
}

function buildJwt(payload: Record<string, unknown>): string {
  return `${toBase64Url({ alg: 'HS256', typ: 'JWT' })}.${toBase64Url(payload)}.signature`;
}

function toBase64Url(value: Record<string, unknown>): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function futureExp(): number {
  return Math.floor(Date.now() / 1000) + 60 * 60;
}

function pastExp(): number {
  return Math.floor(Date.now() / 1000) - 60;
}
