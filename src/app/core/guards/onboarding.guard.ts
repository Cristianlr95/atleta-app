import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { ApiError } from '../models/api-error.model';
import { AuthSessionService } from '../services/auth-session.service';

export const onboardingCompletedGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const authSessionService = inject(AuthSessionService);
  const userApiService = inject(UserApiService);

  const session = authSessionService.currentSession;
  if (!session) {
    return of(router.createUrlTree(['/login']));
  }

  return userApiService.getPlayerProfile(session.user.atletaUuid).pipe(
    switchMap(() =>
      userApiService.getPlayerPositions(session.user.atletaUuid).pipe(
        map((positions) =>
          positions.length >= 3 ? true : router.createUrlTree(['/player/onboarding']),
        ),
      ),
    ),
    catchError((error: ApiError) => {
      if (error.status === 404) {
        return of(router.createUrlTree(['/player/onboarding']));
      }

      if (error.status === 401 || error.status === 403) {
        return of(router.createUrlTree(['/login']));
      }

      return of(true);
    }),
  );
};

export const onboardingPendingGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const authSessionService = inject(AuthSessionService);
  const userApiService = inject(UserApiService);

  const session = authSessionService.currentSession;
  if (!session) {
    return of(router.createUrlTree(['/login']));
  }

  return userApiService.getPlayerProfile(session.user.atletaUuid).pipe(
    switchMap(() =>
      userApiService.getPlayerPositions(session.user.atletaUuid).pipe(
        map((positions) => (positions.length >= 3 ? router.createUrlTree(['/player/profile']) : true)),
      ),
    ),
    catchError((error: ApiError) => {
      if (error.status === 404) {
        return of(true);
      }

      if (error.status === 401 || error.status === 403) {
        return of(router.createUrlTree(['/login']));
      }

      return of(true);
    }),
  );
};
