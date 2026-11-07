import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { ApiError } from '../models/api-error.model';
import { AuthSessionService } from '../services/auth-session.service';
import { PlayerAssignedPosition } from 'src/app/features/user/models/position.models';
import { PlayerProfile } from 'src/app/features/user/models/user.models';
import { onboardingCompletedGuard, onboardingPendingGuard } from './onboarding.guard';

describe('onboarding guards', () => {
  let router: Router;
  let injector: EnvironmentInjector;
  let authSessionService: jasmine.SpyObj<AuthSessionService>;
  let userApiService: jasmine.SpyObj<UserApiService>;

  beforeEach(() => {
    authSessionService = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', [
      'getValidSession',
      'clearSession',
    ]);
    authSessionService.getValidSession.and.returnValue({
      user: { atletaUuid: 'ath-1', email: 'demo@atleta.cl', nombre: 'Demo' },
      tokens: { accessToken: 'token' },
    });
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', [
      'getPlayerProfile',
      'getPlayerPositions',
    ]);
    userApiService.getPlayerProfile.and.returnValue(of({} as PlayerProfile));
    userApiService.getPlayerPositions.and.returnValue(
      of([{}, {}, {}] as PlayerAssignedPosition[]),
    );

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: authSessionService },
        { provide: UserApiService, useValue: userApiService },
      ],
    });
    router = TestBed.inject(Router);
    injector = TestBed.inject(EnvironmentInjector);
  });

  it('allows completed users through', async () => {
    expect(await runGuard(onboardingCompletedGuard, '/matches')).toBeTrue();
  });

  it('sends a user without a profile to onboarding', async () => {
    userApiService.getPlayerProfile.and.returnValue(apiFailure(404));

    expectUrl(await runGuard(onboardingCompletedGuard, '/matches'), '/player/onboarding');
  });

  it('clears an expired session and preserves the destination in login', async () => {
    userApiService.getPlayerProfile.and.returnValue(apiFailure(401));

    expectUrl(await runGuard(onboardingCompletedGuard, '/matches/42'), '/login?next=%2Fmatches%2F42');
    expect(authSessionService.clearSession).toHaveBeenCalledTimes(1);
  });

  it('blocks protected features on server errors and offers a retry target', async () => {
    userApiService.getPlayerProfile.and.returnValue(apiFailure(503));

    expectUrl(
      await runGuard(onboardingCompletedGuard, '/leaderboard'),
      '/player/onboarding-status?reason=server&next=%2Fleaderboard',
    );
  });

  it('distinguishes offline failures from server failures', async () => {
    userApiService.getPlayerProfile.and.returnValue(apiFailure(0));

    expectUrl(
      await runGuard(onboardingCompletedGuard, '/social'),
      '/player/onboarding-status?reason=offline&next=%2Fsocial',
    );
  });

  it('keeps completed users out of onboarding', async () => {
    expectUrl(await runGuard(onboardingPendingGuard, '/player/onboarding'), '/player/profile');
  });

  function runGuard(guard: typeof onboardingCompletedGuard, url: string): Promise<boolean | UrlTree> {
    const result = runInInjectionContext(injector, () =>
      guard({} as never, { url } as RouterStateSnapshot),
    );
    return firstValueFrom(result as Observable<boolean | UrlTree>);
  }

  function expectUrl(result: boolean | UrlTree, expected: string): void {
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe(expected);
  }
});

function apiFailure(status: number) {
  return throwError((): ApiError => ({ status, message: 'failure' }));
}
