import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthSessionService } from '../services/auth-session.service';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: jasmine.createSpyObj<AuthSessionService>('AuthSessionService', ['getValidSession']),
        },
      ],
    });
  });

  it('allows navigation when a valid session exists', () => {
    const authSessionService = TestBed.inject(AuthSessionService) as jasmine.SpyObj<AuthSessionService>;
    authSessionService.getValidSession.and.returnValue({
      user: {
        atletaUuid: 'ath-1',
        email: 'demo@atleta.cl',
        nombre: 'Demo',
      },
      tokens: {
        accessToken: 'token',
      },
    });

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/matches/create' } as never),
    );

    expect(result).toBeTrue();
  });

  it('redirects to login and preserves next url when no valid session exists', () => {
    const authSessionService = TestBed.inject(AuthSessionService) as jasmine.SpyObj<AuthSessionService>;
    const router = TestBed.inject(Router);
    authSessionService.getValidSession.and.returnValue(null);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/matches/create' } as never),
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/login?next=%2Fmatches%2Fcreate');
  });
});
